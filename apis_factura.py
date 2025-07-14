from flask import Blueprint, jsonify, current_app, request
from conexion_base import *
from datetime import datetime

facturas_bp = Blueprint('facturas', __name__)
conn_db = ConexionBase("tienda_jfleong6_1.db")

@facturas_bp.route('/api/facturas/por_cobrar', methods=['GET'])
def obtener_facturas_por_cobrar():
    try:
        consulta = """
            SELECT 
                f.id,
                f.numero_factura,
                f.proveedor_id,
                p.nombre AS proveedor_nombre,
                f.fecha,
                f.fecha_vencimiento,
                f.monto_total,
                f.estado_pago_id,
                e.estado AS estado_pago,
                f.usuario_id,
                u.nombre AS usuario_nombre,
                COALESCE(SUM(pf.monto), 0) AS total_pagado,
                (f.monto_total - COALESCE(SUM(pf.monto), 0)) AS saldo_pendiente
            FROM facturas_proveedor f
            JOIN proveedores p ON f.proveedor_id = p.id
            JOIN estado_pago e ON f.estado_pago_id = e.id
            JOIN usuarios u ON f.usuario_id = u.id
            LEFT JOIN pagos_factura pf ON f.id = pf.factura_id
            WHERE f.estado_pago_id IN (1, 2)
            GROUP BY 
                f.id,
                f.numero_factura,
                f.proveedor_id,
                p.nombre,
                f.fecha_emision,
                f.fecha_vencimiento,
                f.monto_total,
                f.estado_pago_id,
                e.estado,
                f.usuario_id,
                u.nombre
            ORDER BY f.fecha_emision DESC

        """
        resultados = conn_db.ejecutar_personalizado_1(consulta)
        # print(resultados)

        return jsonify({
            "success": True,
            "data": resultados
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@facturas_bp.route('/api/entradas_facturas', methods=['POST'])
def registrar_entrada():
    data = request.get_json()
    try:
        # ✅ 1️⃣ Validar campos principales
        proveedor_id = data.get('proveedor')
        numero_factura = data.get('numero_factura')
        fecha_emision = data.get('fecha_emision')
        fecha_vencimiento = data.get('fecha_vencimiento')
        usuario_id = data.get('usuario_id')
        monto_total = data.get('monto_total', 0)
        monto_pagado = data.get('monto_pagado', 0)

        productos = data.get('productos', [])
        pagos = data.get('pagos', [])
        for key, valor in data.items():
            print(f"{key}: {valor}")

        if not proveedor_id or not numero_factura or not fecha_emision or not productos:            
            return jsonify({'ok': False, 'error': 'Datos incompletos'}), 400

        # ✅ 2️⃣ Determinar estado de pago
        if monto_pagado <= 0:
            estado_pago_id = 1  # Pendiente
        elif monto_pagado >= monto_total:
            estado_pago_id = 3  # Pagado
        else:
            estado_pago_id = 2  # Parcial

            
        # ✅ 3️⃣ Insertar en facturas_proveedor
        factura_data = {
            "numero_factura": numero_factura,
            "proveedor_id": proveedor_id,
            "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "fecha_emision": fecha_emision,
            "fecha_vencimiento": fecha_vencimiento,
            "monto_total": monto_total,
            "estado_pago_id": estado_pago_id,
            "usuario_id": usuario_id
        }
        
        factura_id, error = conn_db.insertar("facturas_proveedor", factura_data)
        
        if error:
            return jsonify({'ok': False, 'error': f'Error insertando factura: {error}'}), 500

        # ✅ 4️⃣ Insertar cada producto en detalle_factura y actualizar stock
        for item in productos:
            # Obtener producto_id real
            producto_result = conn_db.seleccionar(
                "productos", 
                columnas="id", 
                condicion="codigo = ?", 
                parametros=(item["codigo_producto"],)
            )
            if not producto_result:
                return jsonify({'ok': False, 'error': f"Producto no encontrado: {item['codigo_producto']}"}), 400
            producto_id = producto_result[0][0]

            detalle_data = {
                "factura_id": factura_id,
                "producto_id": producto_id,
                "cantidad": item["cantidad"],
                "precio_compra": item["precio_compra"],
                "precio_venta": item["precio_venta"],
                "fecha_entrada": item["fecha_vencimiento"]
            }
            conn_db.insertar("detalle_factura", detalle_data)

            conn_db.actualizar(
                "productos",
                {
                    "stock": f"stock + {item['cantidad']}",
                    "precio_compra": item["precio_compra"],
                    "precio_venta": item["precio_venta"]
                },
                "id = ?",
                (producto_id,),
                expresion_sql=True
            )


            # Registrar lote
            conn_db.insertar("lotes_productos", {
                "id_producto": producto_id,
                "cantidad": item["cantidad"],
                "precio_compra": item["precio_compra"],
                "fecha_ingreso": fecha_emision
            })

        # ✅ 5️⃣ Insertar pagos
        for pago in pagos:
            pago_data = {
                "factura_id": factura_id,
                "tipo_pago_id": pago["tipo_pago_id"],
                "fecha_pago": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "monto": pago["monto"],
                "observaciones": pago.get("observaciones", ""),
                "usuario_id":usuario_id
            }
            conn_db.insertar("pagos_factura", pago_data)
            monto_actual = conn_db.seleccionar("tipos_pago", "actual", "id = ?", (pago["tipo_pago_id"],))[0][0]
            saldo_actual = int(monto_actual) - int(pago["monto"])
            actulizar_paga = {
                "actual": saldo_actual
            }
            conn_db.actualizar("tipos_pago", actulizar_paga, "id = ?",(pago["tipo_pago_id"],))

        return jsonify({'ok': True, 'factura_id': factura_id}), 201

    except Exception as e:
        print(f"❌ Error al registrar entrada: {e}")
        return jsonify({'ok': False, 'error': str(e)}), 500

@facturas_bp.route('/api/agregar_pagos_factura', methods=['POST'])
def api_agregar_pagos_factura():
    try:
        data = request.get_json()

        factura_id = data.get('factura_id')
        pagos = data.get('pagos')
        usuario_id = data.get('usuario_id') or 1  # 👈 Ajusta esto: tu sistema debe saber el usuario actual

        if not factura_id or not pagos:
            return jsonify(success=False, error="Datos incompletos.")

        # 1️⃣ Validar factura existente
        factura = conn_db.ejecutar_personalizado(
            "SELECT monto_total, estado_pago_id FROM facturas_proveedor WHERE id = ?", (factura_id,)
        )[0][0]
        if not factura:
            return jsonify(success=False, error="Factura no encontrada.")

        monto_total = int(factura)

        # 2️⃣ Calcular pagos ya registrados
        pagos_registrados = conn_db.ejecutar_personalizado(
            "SELECT SUM(monto) as total FROM pagos_factura WHERE factura_id = ?", (factura_id,)
        )
        total_pagado_previo = int(pagos_registrados[0][0]) or 0

        # 3️⃣ Insertar nuevos pagos
        total_nuevo = 0
        for pago in pagos:
            datos_pago = {
                "factura_id": factura_id,
                "tipo_pago_id": pago["tipo_pago_id"],
                "fecha_pago": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "monto": pago["monto"],
                "observaciones": pago.get("observaciones", ""),
                "usuario_id": usuario_id
            }
            conn_db.insertar("pagos_factura", datos_pago)
            total_nuevo += pago["monto"]

        # 4️⃣ Calcular suma total pagada
        suma_total = total_pagado_previo + total_nuevo

        # 5️⃣ Determinar estado de pago
        if suma_total >= monto_total:
            nuevo_estado = 3  # Pagado
        elif suma_total > 0:
            nuevo_estado = 2  # Parcial
        else:
            nuevo_estado = 1  # Pendiente

        # 6️⃣ Actualizar estado de la factura
        conn_db.actualizar(
            "facturas_proveedor",
            {"estado_pago_id": nuevo_estado},
            "id = ?",
            (factura_id,)
        )

        return jsonify(success=True, mensaje="Pagos registrados correctamente.")

    except Exception as e:
        print(f"❌ Error en /api/agregar_pagos_factura: {e}")
        return jsonify(success=False, error=str(e))
