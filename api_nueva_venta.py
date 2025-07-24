from flask import Blueprint, jsonify, current_app, request
from conexion_base import *
from datetime import datetime

nueva_venta = Blueprint('nueva_venta', __name__)
conn_db = ConexionBase("tienda_jfleong6_1.db")

@nueva_venta.route('/api/crear_venta', methods=['POST'])
def crear_venta():
    data = request.get_json()
    campos = ['vendedor_id', 'cliente_id', 'total_venta', 'metodos_pago', 'productos']
    if not all(c in data for c in campos):
        return jsonify({"error": "Campos requeridos faltantes"}), 400

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
