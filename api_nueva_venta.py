from flask import Blueprint, jsonify, current_app, request
from conexion_base import *
from datetime import datetime, date, timedelta
from crea_pdf.pdf_cotizacion import *


nueva_venta = Blueprint('nueva_venta', __name__)
conn_db = ConexionBase("tienda_jfleong6_1.db")

def obtener_id_por_nombre(tabla, buscar, columna):
    resultado = conn_db.seleccionar(tabla, "id", f"{columna} = ?", (buscar,))

    return resultado[0][0] if resultado else None

def validar_campos(data, requiere_metodos_pago=False):
    """
    Valida los campos requeridos para registrar una venta.
    Si 'requiere_metodos_pago' es True, también valida ese campo.
    """

    # Definir campos base
    campos_requeridos = ['vendedor_id', 'cliente_id', 'total_venta', 'productos']

    # Agregar metodos_pago si es obligatorio
    if requiere_metodos_pago:
        campos_requeridos.append('metodos_pago')

    # Validar que todos los campos existan
    if not all(c in data for c in campos_requeridos):
        raise ValueError(f"Campos requeridos faltantes: {', '.join(campos_requeridos)}")

    # Validar cliente
    cliente_id = obtener_id_por_nombre("clientes", data["cliente_id"], "numero")
    if not cliente_id:
        raise LookupError("Cliente no encontrado")
    data["cliente_id"] = cliente_id

    return data

def calcular_totales_y_guardar_detalles(id_registro, tabla_detalles, productos):
    total_compra = 0
    total_venta = 0

    for prod in productos:
        producto_id = prod["codigo"]
        cantidad_pedir = int(prod["cantidad"])

        # Obtener lotes FIFO sin modificar, solo para calcular costo
        lotes = conn_db.seleccionar(
            "lotes_productos",
            "id, cantidad, precio_compra",
            "id_producto = ? AND cantidad > 0 ORDER BY fecha_ingreso ASC, id ASC",
            (producto_id,)
        )

        cantidad_restante = cantidad_pedir
        total_compra_prod = 0

        for lote_id, lote_cant, precio_lote in lotes:
            if cantidad_restante <= 0:
                break
            descontar = min(lote_cant, cantidad_restante)
            total_compra_prod += descontar * precio_lote
            cantidad_restante -= descontar

        if cantidad_restante > 0:
            # print(conn_db.seleccionar("productos", "precio_compra", "id=?", (producto_id,)))
            precio_prod = float(conn_db.seleccionar("productos", "precio_compra", "id=?", (producto_id,))[0][0])
            total_compra_prod += cantidad_restante * precio_prod
        # print(tabla_detalles[:-1])
        # Guardar detalle (venta, cotización o apartado)
        detalle = {
            f"{tabla_detalles.replace("detalles_", "")}_id": id_registro,
            "producto_id": producto_id,
            "cantidad": cantidad_pedir,
            "precio_unitario": prod["precio_unitario"],
            "estado": 1
        }
        # print(detalle)
        conn_db.insertar(tabla_detalles, detalle)

        total_compra += total_compra_prod
        total_venta += prod["precio_unitario"] * cantidad_pedir

    utilidad = total_venta - total_compra
    return total_compra, utilidad

@nueva_venta.route('/api/crear_venta', methods=['POST'])
def crear_venta():
    data = request.get_json()
    validar_campos(data, requiere_metodos_pago=True)
    
    try:
        conn_db.iniciar_transaccion()  # BEGIN

        # 1. Crea la venta base (total_compra y utilidad se actualizan luego)
        new_venta = {
            'vendedor_id': data['vendedor_id'],
            "cliente_id": data["cliente_id"],
            "total_venta": data["total_venta"],
            "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_compra": 0,
            "total_utilidad": 0
        }
        id_venta, error = conn_db.insertar("ventas", new_venta)
        if not id_venta:
            raise Exception("Venta no registrada")

        total_precio_compra = 0

        # 2. Procesa cada producto: descuenta FIFO de lotes (deja productos aunque stock quede negativo)
        for prod in data["productos"]:
            producto_id = prod["codigo"]
            cantidad_pedir = int(prod["cantidad"])

            # Busca lotes por antigüedad
            lotes = conn_db.seleccionar(
                "lotes_productos",
                "id, cantidad, precio_compra",
                "id_producto = ? AND cantidad > 0 ORDER BY fecha_ingreso ASC, id ASC",
                (producto_id,)
            )
            cantidad_restante = cantidad_pedir
            total_compra_prod = 0

            # Distribuye el pedido entre lotes, FIFO
            for lote_id, lote_cant, precio_lote in lotes:
                if cantidad_restante <= 0:
                    break
                descontar = min(lote_cant, cantidad_restante)
                # Actualiza lote
                conn_db.actualizar(
                    "lotes_productos",
                    {"cantidad": f"cantidad - {descontar}"},
                    "id = ?",
                    (lote_id,),
                    expresion_sql=True
                )
                total_compra_prod += descontar * precio_lote
                cantidad_restante -= descontar

                # Registro en tabla compra_venta (traza de lote usado para la venta)
                conn_db.insertar("compra_venta", {
                    "id_venta": id_venta,
                    "id_lote": lote_id,
                    "precio_compra": precio_lote
                })

            # Si faltó producto en los lotes, el faltante se costea al precio actual del producto
            if cantidad_restante > 0:
                precio_prod = float(conn_db.seleccionar("productos", "precio_compra", "id=?", (producto_id,))[0][0])
                total_compra_prod += cantidad_restante * precio_prod

            # Actualiza el stock en productos (puede quedar negativo)
            stock_actual = conn_db.seleccionar("productos", "stock", "id=?", (producto_id,))[0][0]
            nuevo_stock = float(stock_actual) - float(cantidad_pedir)
            conn_db.actualizar("productos", {"stock": nuevo_stock}, "id = ?", (producto_id,))

            # Guarda detalle de la venta
            conn_db.insertar("detalles_ventas", {
                "venta_id": id_venta,
                "producto_id": producto_id,
                "cantidad": cantidad_pedir,
                "precio_unitario": prod["precio_unitario"]
            })

            total_precio_compra += total_compra_prod

        # 3. Calcula total utilidad y actualiza la venta
        total_precio_venta = sum(p["precio_unitario"] * p["cantidad"] for p in data["productos"])
        total_utilidad = total_precio_venta - total_precio_compra

        # 4. Procesa los pagos (solo registra si suman igual a la venta, o rechaza)
        suma_pagos = sum(p['valor'] for p in data["metodos_pago"])
        if abs(suma_pagos - data["total_venta"]) > 1e-2:
            raise Exception("La suma de los pagos no coincide con el total de la venta. No se registra.")

        for pago in data["metodos_pago"]:
            row = conn_db.seleccionar("tipos_pago", "id", "nombre = ?", (pago["metodo"],))
            if not row:
                raise Exception(f"No existe el tipo de pago '{pago['metodo']}'")
            pago_id = row[0][0]
            conn_db.insertar("pagos_venta", {
                "venta_id": id_venta,
                "metodo_pago": pago_id,
                "valor": pago["valor"],
                "usuario_id": data['vendedor_id']
            })
            conn_db.actualizar(
                "tipos_pago",
                {"actual": f"actual + {pago['valor']}"},
                "id = ?",
                (pago_id,),
                expresion_sql=True
            )

        conn_db.actualizar("ventas", {
            "total_compra": total_precio_compra,
            "total_utilidad": total_utilidad
        }, "id = ?", (id_venta,))

        conn_db.confirmar_transaccion()

        return jsonify({
            "valido": True,
            "mensaje": f"Venta exitosa {id_venta}",
            "id": id_venta
        }), 200

    except Exception as e:
        conn_db.revertir_transaccion()
        return jsonify({
            "valido": False,
            "mensaje": f"Error: {str(e)}"
        }), 400

@nueva_venta.route('/api/crear_cotizacion', methods=['POST'])
def crear_cotizacion():
    data = request.get_json()
    validar_campos(data, requiere_metodos_pago=False)
    
    try:
        conn_db.iniciar_transaccion()

        new_cotizacion = {
            'vendedor_id': data['vendedor_id'],
            'cliente_id': data['cliente_id'],
            'fecha': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'total_venta': data['total_venta'],
            'total_compra': 0,
            'total_utilidad': 0,
            'estado': 1
        }
        id_cotizacion, error = conn_db.insertar("cotizaciones", new_cotizacion)
        if not id_cotizacion:
            raise Exception("Cotización no registrada")
        
        
        total_compra, utilidad = calcular_totales_y_guardar_detalles(id_cotizacion, "detalles_cotizaciones", data["productos"])
        
        conn_db.actualizar("cotizaciones", {
            "total_compra": total_compra,
            "total_utilidad": utilidad
        }, "id = ?", (id_cotizacion,))

        conn_db.confirmar_transaccion()
        datos = conn_db.seleccionar("datos")
        print(datos)
        cliente = conn_db.ejecutar_personalizado_1("SELECT * FROM clientes WHERE id = ?", (data['cliente_id'],))
        print(cliente)
        
        datos_cotizacion = obtener_cotizacion(id_cotizacion)
        pdf = generar_cotizacion_pdf(datos_cotizacion,datos,cliente)
        
        return jsonify({
            "valido": True,
            "mensaje": f"Cotización creada {id_cotizacion}",
            "id": id_cotizacion,
            "pdf": pdf
        }), 200

    except Exception as e:
        conn_db.revertir_transaccion()
        return jsonify({
            "valido": False,
            "mensaje": f"Error: {str(e)}"
        }), 400

@nueva_venta.route('/api/crear_apartado', methods=['POST'])
def crear_apartado():
    data = request.get_json()
    validar_campos(data, requiere_metodos_pago=True)
    
    try:
        conn_db.iniciar_transaccion()

        new_apartado = {
            'vendedor_id': data['vendedor_id'],
            'cliente_id': data['cliente_id'],
            'fecha': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'total_venta': data['total_venta'],
            'total_compra': 0,
            'total_utilidad': 0,
            'estado': 1
        }
        id_apartado, error = conn_db.insertar("apartados", new_apartado)
        if not id_apartado:
            raise Exception("Apartado no registrado")

        total_compra, utilidad = calcular_totales_y_guardar_detalles(id_apartado, "detalles_apartados", data["productos"])

        conn_db.actualizar("apartados", {
            "total_compra": total_compra,
            "total_utilidad": utilidad
        }, "id = ?", (id_apartado,))

        # Procesar pagos parciales
        for pago in data["metodos_pago"]:
            row = conn_db.seleccionar("tipos_pago", "id", "nombre = ?", (pago["metodo"],))
            if not row:
                raise Exception(f"No existe el tipo de pago '{pago['metodo']}'")
            metodo_pago_id = row[0][0]

            if pago["valor"] <= 0:
                raise Exception(f"Pago con valor inválido: {pago['valor']}")

            conn_db.insertar("pagos_apartados", {
                "apartados_id": id_apartado,
                "metodo_pago": metodo_pago_id,
                "valor": pago["valor"],
                "usuario_id": data['vendedor_id'],
                "estado": 1
            })

            conn_db.actualizar("tipos_pago", {
                "actual": f"actual + {pago['valor']}"
            }, "id = ?", (metodo_pago_id,), expresion_sql=True)

        conn_db.confirmar_transaccion()

        return jsonify({
            "valido": True,
            "mensaje": f"Apartado creado {id_apartado}",
            "id": id_apartado
        }), 200

    except Exception as e:
        conn_db.revertir_transaccion()
        return jsonify({
            "valido": False,
            "mensaje": f"Error: {str(e)}"
        }), 400

@nueva_venta.route('/api/listar_documentos', methods=['GET'])
def listar_documentos():
    tipo = request.args.get('tipo')  # 'cotizaciones' o 'apartados'
    if tipo not in ['cotizaciones', 'apartados']:
        return jsonify({"error": "Parámetro tipo inválido, debe ser 'cotizaciones' o 'apartados'"}), 400

    # Fechas recibidas por parámetro
    fecha_inicio = request.args.get("fecha_inicio")
    fecha_fin = request.args.get("fecha_fin")

    try:
        if not fecha_inicio or not fecha_fin:
            # Si no vienen fechas -> mes actual
            hoy = date.today()
            fecha_inicio = hoy.replace(day=1).strftime("%Y-%m-%d")
            # último día del mes
            if hoy.month == 12:
                siguiente_mes = hoy.replace(year=hoy.year+1, month=1, day=1)
            else:
                siguiente_mes = hoy.replace(month=hoy.month+1, day=1)
            fecha_fin = (siguiente_mes - timedelta(days=1)).strftime("%Y-%m-%d")

        query = f"""
            SELECT d.id, d.vendedor_id, u.nombre AS vendedor_nombre,
                   d.cliente_id, c.nombre AS cliente_nombre,
                   d.fecha, d.total_venta, d.estado
            FROM {tipo} d
            LEFT JOIN usuarios u ON d.vendedor_id = u.id
            LEFT JOIN clientes c ON d.cliente_id = c.id
            WHERE DATE(d.fecha) BETWEEN '{fecha_inicio}' AND '{fecha_fin}'
            ORDER BY d.fecha DESC
        """

        filas = conn_db.ejecutar_personalizado_1(query)

        query = f"""SELECT DISTINCT u.nombre AS Vendedor
        FROM {tipo} c
        JOIN usuarios u ON u.id = c.vendedor_id;
        """
        vendedores = conn_db.ejecutar_personalizado(query)

        query = f"""SELECT DISTINCT cl.nombre AS Cliente
        FROM {tipo} c
        JOIN clientes cl ON cl.id = c.cliente_id;
        """
        clientes = conn_db.ejecutar_personalizado(query)
        
        query = f"""SELECT estado, COUNT(estado) Cantidad 
                    FROM {tipo} 
                    WHERE DATE(fecha) BETWEEN '{fecha_inicio}' AND '{fecha_fin}'
                    GROUP BY estado"""
        estados = conn_db.ejecutar_personalizado_1(query)
        
        return jsonify({
            "valido": True,
            tipo: filas,
            "filtros": {"vendedores": vendedores, "clientes": clientes},
            "Estados": estados,
            "rango_fechas": {"inicio": fecha_inicio, "fin": fecha_fin}
        }), 200

    except Exception as e:
        return jsonify({"valido": False, "mensaje": f"Error: {str(e)}"}), 500


@nueva_venta.route('/api/detalles_documento', methods=['GET'])
def detalles_documento():
    tipo = request.args.get('tipo')  # 'cotizacion' o 'apartado'
    id_doc = request.args.get('id')

    if tipo not in ['cotizacion', 'apartado'] or not id_doc:
        return jsonify({"error": "Parámetros inválidos"}), 400

    try:
        id_doc = int(id_doc)
        detalles_list = []
        pagos_list = []

        # Obtener detalles con nombre de producto (suponiendo tabla productos con campo nombre)
        if tipo == 'cotizacion':
            query_det = """
                SELECT dc.producto_id, p.nombre, dc.cantidad, dc.precio_unitario
                FROM detalles_cotizaciones dc
                LEFT JOIN productos p ON dc.producto_id = p.id
                WHERE dc.cotizaciones_id = ? AND dc.estado = 1
            """
            detalles = conn_db.ejecutar_personalizado_1(query_det, (id_doc,))
            detalles_list = [{
                "producto_id": d[0], "producto_nombre": d, "cantidad": d, "precio_unitario": d
            } for d in detalles]

            return jsonify({
                "valido": True,
                "tipo": tipo,
                "id": id_doc,
                "detalles": detalles_list
            }), 200

        else:  # apartado
            query_det = """
                SELECT da.producto_id, p.nombre, da.cantidad, da.precio_unitario
                FROM detalles_apartados da
                LEFT JOIN productos p ON da.producto_id = p.id
                WHERE da.apartados_id = ? AND da.estado = 1
            """
            detalles = conn_db.ejecutar_personalizado_1(query_det, (id_doc,))
            detalles_list = [{
                "producto_id": d[0], "producto_nombre": d, "cantidad": d, "precio_unitario": d
            } for d in detalles]

            # Pagos con nombre del método y nombre del usuario (vendedor)
            query_pagos = """
                SELECT pa.valor, tp.nombre AS metodo_pago, u.nombre AS usuario_nombre
                FROM pagos_apartados pa
                LEFT JOIN tipos_pago tp ON pa.metodo_pago = tp.id
                LEFT JOIN usuarios u ON pa.usuario_id = u.id
                WHERE pa.apartados_id = ? AND pa.estado = 1
            """
            pagos = conn_db.ejecutar_personalizado_1(query_pagos, (id_doc,))
            pagos_list = [{
                "valor": p[0],
                "metodo_pago": p,
                "usuario_nombre": p
            } for p in pagos]

            return jsonify({
                "valido": True,
                "tipo": tipo,
                "id": id_doc,
                "detalles": detalles_list,
                "pagos": pagos_list
            }), 200

    except Exception as e:
        return jsonify({"valido": False, "mensaje": f"Error: {str(e)}"}), 500


@nueva_venta.route('/api/actualizar_estado_cotizacion', methods=['POST'])
def actualizar_estado_cotizacion():
    data = request.get_json()
    id = data.get('id')
    estado = data.get('estado')

    if not id or estado not in [1, 2, 3, 4]:
        return jsonify({"valido": False, "mensaje": "Parámetros inválidos"}), 400

    try:
        conn_db.actualizar("cotizaciones", {"estado": estado}, "id = ?", (id,))
        return jsonify({"valido": True, "mensaje": "Estado actualizado"}), 200
    except Exception as e:
        return jsonify({"valido": False, "mensaje": str(e)}), 500

@nueva_venta.route('/api/ver_cotizacion', methods=['GET'])
def ver_cotizacion():
    try:
        id_cotizacion = request.args.get('id')
        if not id_cotizacion:
            return jsonify({"valido": False, "mensaje": "ID cotización requerido"}), 400
        return jsonify(obtener_cotizacion(id_cotizacion)), 200
    except Exception as e:
            return jsonify({"valido": False, "mensaje": f"Error: {str(e)}"}), 500
    
def obtener_cotizacion(id_cotizacion):
    id_cotizacion = int(id_cotizacion)

    # Consulta principal de cotización con vendedor y cliente
    query_main = """
        SELECT c.id, c.fecha, c.total_venta, c.total_compra, c.total_utilidad, c.estado,
                u.nombre as vendedor_nombre, cl.nombre as cliente_nombre
        FROM cotizaciones c
        LEFT JOIN usuarios u ON c.vendedor_id = u.id
        LEFT JOIN clientes cl ON c.cliente_id = cl.id
        WHERE c.id = ?
    """
    cotizacion = conn_db.ejecutar_personalizado_1(query_main, (id_cotizacion,))[0]
    # print(cotizacion)
    if not cotizacion:
        return jsonify({"valido": False, "mensaje": "Cotización no encontrada"}), 404

    # Consulta detalles productos con nombre producto
    query_detalles = """
        SELECT dc.producto_id, p.codigo, p.nombre as producto_nombre, dc.cantidad, dc.precio_unitario
        FROM detalles_cotizaciones dc
        LEFT JOIN productos p ON dc.producto_id = p.id
        WHERE dc.cotizaciones_id = ? AND dc.estado = 1
    """
    detalles = conn_db.ejecutar_personalizado_1(query_detalles, (id_cotizacion,))

    # Formatear resultados detalles
    # detalles_list = [{
    #     "producto_id": d[0],
    #     "producto_nombre": d,
    #     "cantidad": d,
    #     "precio_unitario": d
    # } for d in detalles]

    # Preparar respuesta JSON
    respuesta = {
        "valido": True,
        "cotizacion": {
            "cotizacion":cotizacion,
            "detalles": detalles
        }
    }
    return respuesta