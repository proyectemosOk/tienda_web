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
        proveedor_id = data.get('proveedor')
        numero_factura = data.get('numero_factura')
        fecha_emision = data.get('fecha_emision')
        fecha_vencimiento = data.get('fecha_vencimiento')
        usuario_id = data.get('usuario_id')
        monto_total = data.get('monto_total', 0)
        monto_pagado = data.get('monto_pagado', 0)
        productos = data.get('productos', [])
        pagos = data.get('pagos', [])

        if not proveedor_id or not numero_factura or not fecha_emision or not productos:
            return jsonify({'ok': False, 'error': 'Datos incompletos'}), 400

        # Estado pago
        if monto_pagado <= 0:
            estado_pago_id = 1
        elif monto_pagado >= monto_total:
            estado_pago_id = 3
        else:
            estado_pago_id = 2

        # ----------------- INSERTA FACTURA -----------------
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

        # ----------------- AGREGA/ACTUALIZA PRODUCTOS Y LOTES -----------------
        for item in productos:
            prod_row = conn_db.seleccionar("productos", columnas="id,stock", condicion="codigo = ?", parametros=(item["codigo_producto"],))
            if not prod_row:
                return jsonify({'ok': False, 'error': f"Producto no encontrado: {item['codigo_producto']}"}), 400
            producto_id, stock_actual = prod_row[0]
            stock_actual = int(stock_actual)

            # Detalle de la factura
            detalle_data = {
                "factura_id": factura_id,
                "producto_id": producto_id,
                "cantidad": int(item["cantidad"]),
                "precio_compra": item["precio_compra"],
                "precio_venta": item["precio_venta"],
                "fecha_entrada": item["fecha_vencimiento"]
            }
            conn_db.insertar("detalle_factura", detalle_data)

            # --- ALGORITMO “CUADRE DE STOCK ROJO” ---
            cantidad_ingresada = int(item["cantidad"])
            cantidad_para_saldar_rojo = 0
            nueva_cant_lote = 0

            if stock_actual < 0:
                # Parte del lote no pone unidades físicas: se usa para dejar stock en cero
                rojo_abs = abs(stock_actual)
                if cantidad_ingresada > rojo_abs:
                    cantidad_para_saldar_rojo = rojo_abs
                    nueva_cant_lote = cantidad_ingresada - rojo_abs
                else:
                    cantidad_para_saldar_rojo = cantidad_ingresada
                    nueva_cant_lote = 0  # Todo es para cubrir lo rojo; el lote físico queda en cero
            else:
                nueva_cant_lote = cantidad_ingresada

            # Actualizar el stock del producto
            nuevo_stock = stock_actual + cantidad_ingresada
            conn_db.actualizar(
                "productos",
                {
                    "stock": nuevo_stock,
                    "precio_compra": item["precio_compra"],
                    "precio_venta": item["precio_venta"]
                },
                "id = ?",
                (producto_id,),
                expresion_sql=False
            )

            # Insertar el lote solo si hay unidades físicas
            if nueva_cant_lote > 0:
                conn_db.insertar("lotes_productos", {
                    "id_producto": producto_id,
                    "cantidad": nueva_cant_lote,
                    "precio_compra": item["precio_compra"],
                    "fecha_ingreso": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
            # Si toda la cantidad fue para "cuadrar rojo", no crea lote físico (o podrías registrar lote con cant 0 y observación)

            # Validar la suma de lotes = stock global
            cantidad_lotes = sum(
                row[0]
                for row in conn_db.seleccionar("lotes_productos", "cantidad", "id_producto = ?", (producto_id,))
            )
            stock_db = conn_db.seleccionar("productos", "stock", "id = ?", (producto_id,))[0][0]
            # Si hay desfase, ajusta último lote agregado (caso borde: ventas entre la entrada y el cierre de la transacción)
            if cantidad_lotes != stock_db:
                # Ajusta lote más reciente (el que acabas de agregar)
                ultimos_lote = conn_db.seleccionar(
                    "lotes_productos", "id,cantidad", "id_producto = ? ORDER BY id DESC LIMIT 1", (producto_id,)
                )
                if ultimos_lote:
                    id_lote, cant_lote = ultimos_lote[0]
                    corregir = stock_db - cantidad_lotes
                    if cant_lote + corregir >= 0:
                        conn_db.actualizar(
                            "lotes_productos",
                            {"cantidad": cant_lote + corregir},
                            "id = ?",
                            (id_lote,),
                            expresion_sql=False
                        )

        # --------------- REGISTRA LOS PAGOS DE LA FACTURA Y ACTUALIZA CAJA/CUENTAS ---------------
        for pago in pagos:
            pago_data = {
                "factura_id": factura_id,
                "tipo_pago_id": pago["tipo_pago_id"],
                "fecha_pago": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "monto": pago["monto"],
                "observaciones": pago.get("observaciones", ""),
                "usuario_id": usuario_id
            }
            conn_db.insertar("pagos_factura", pago_data)
            monto_actual = conn_db.seleccionar("tipos_pago", "actual", "id = ?", (pago["tipo_pago_id"],))[0][0]
            saldo_actual = float(monto_actual) - float(pago["monto"])
            conn_db.actualizar("tipos_pago", {"actual": saldo_actual}, "id = ?", (pago["tipo_pago_id"],))

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
