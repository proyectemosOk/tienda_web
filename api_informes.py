from flask import request, jsonify, Blueprint, render_template
from datetime import date  # ✅ NECESARIO
from conexion_base import ConexionBase

informes = Blueprint('informes', __name__)
conn_db = ConexionBase("tienda_jfleong6_1.db")

@informes.route('/api/ventas/rango', methods=['GET'])
def obtener_resumen_ventas_rango():
    try:
        fecha_inicio = request.args.get("inicio", date.today().isoformat())
        fecha_fin = request.args.get("fin", date.today().isoformat())
        print(f"{fecha_inicio=}\n{fecha_fin=}")
        
        desglose_pagos = conn_db.ejecutar_personalizado('''
            SELECT tp.nombre AS metodo_pago, SUM(pv.valor) AS total
            FROM pagos_venta pv
            JOIN ventas v ON pv.venta_id = v.id
            JOIN tipos_pago tp ON pv.metodo_pago = tp.id
            WHERE DATE(v.fecha) BETWEEN ? AND ?
            GROUP BY tp.nombre
        ''', (fecha_inicio, fecha_fin))

        desglose = {metodo_pago: total for metodo_pago, total in desglose_pagos}

        ventas = conn_db.ejecutar_personalizado('''
            SELECT v.id, v.fecha, v.total_venta, c.nombre AS cliente
            FROM ventas v
            JOIN clientes c ON v.cliente_id = c.id
            WHERE DATE(v.fecha) BETWEEN ? AND ?
        ''', (fecha_inicio, fecha_fin))

        resumen = [
            {
                "id": id_venta,
                "fecha": fecha,
                "cliente": cliente_nombre,
                "total": float(total)
            }
            for id_venta, fecha, total, cliente_nombre in ventas
        ]

        return jsonify({
            "desglose_pagos": desglose,
            "ventas": resumen
        })

    except Exception as e:
        print(f"Error al obtener resumen de ventas: {e}")
        return jsonify({"error": "Error al obtener ventas."}), 500


@informes.route('/api/resumen_informe', methods=['GET'])
def obtener_resumen():
    try:
        fecha_inicio = request.args.get("inicio", date.today().isoformat())
        fecha_fin = request.args.get("fin", date.today().isoformat())
       
        # Total de ventas
        total_ventas = conn_db.seleccionar(
            "ventas", 
            "SUM(total_venta) AS 'Total Venta'", 
            "DATE(fecha) BETWEEN ? AND ?", 
            (fecha_inicio, fecha_fin)
        )[0][0]

        # Total de servicios (ordenes)
        total_servicios = conn_db.seleccionar(
            "ordenes", 
            "COUNT(id) AS 'Total de servicios'", 
            "DATE(fecha) BETWEEN ? AND ?", 
            (fecha_inicio, fecha_fin)
        )[0][0]

        # Total de productos vendidos
        total_productos = conn_db.ejecutar_personalizado("""
            SELECT SUM(DV.cantidad) as Cantidad
            FROM detalles_ventas DV
            JOIN ventas V ON V.id = DV.venta_id
            WHERE DATE(V.fecha) BETWEEN ? AND ?
        """, (fecha_inicio, fecha_fin))[0][0]
        
        categorias_productos = conn_db.ejecutar_personalizado_1("""
                SELECT 
                    C.categoria AS Categoria, 
                    SUM(DV.cantidad) AS Cantidad
                FROM 
                    categorias C
                JOIN 
                    productos P ON C.id = P.categoria
                JOIN 
                    detalles_ventas DV ON P.id = DV.producto_id
                JOIN 
                    ventas V ON V.id = DV.venta_id
                WHERE 
                    DATE(V.fecha) BETWEEN ? AND ?
                GROUP BY 
                    C.id
                ORDER BY 
                    Cantidad DESC
            """, (fecha_inicio, fecha_fin))
        
        lista_productos = conn_db.ejecutar_personalizado_1("""
        SELECT 
                P.nombre AS Producto, 
                SUM(DV.cantidad) AS Cantidad
            FROM 
                productos P
            JOIN 
                detalles_ventas DV ON P.id = DV.producto_id
            JOIN 
                ventas V ON V.id = DV.venta_id
            WHERE 
                DATE(V.fecha) BETWEEN ? AND ?
            GROUP BY 
                P.id
            ORDER BY 
                Cantidad DESC
        """, (fecha_inicio, fecha_fin))

        final = []
        cant = []

        if len(lista_productos) > 20:
            total_global = sum([item["Cantidad"] for item in lista_productos])
            limite = total_global * 0.9
            acumulado = 0
            otros_total = 0

            for item in lista_productos:
                nombre = item["Producto"]
                cantidad = item["Cantidad"]
                
                if acumulado + cantidad <= limite and len(final)<20:
                    final.append(nombre)
                    cant.append(cantidad)
                    acumulado += cantidad
                else:
                    otros_total += cantidad

            # Agregar el grupo "Otros"
            if otros_total > 0:
                final.append("Otros")
                cant.append(otros_total)

        else:
            for item in lista_productos:
                final.append(item["Producto"])
                cant.append(item["Cantidad"])        


        return jsonify({
            "ok":True,
            "datos":{ 
                "totales": {
                    "ventas":total_ventas, 
                    "servicios": total_servicios, 
                    "productos":total_productos
                },
                "ventas_categoria": {
                    "categorias": [item["Categoria"] for item in categorias_productos],
                    "datos": [item["Cantidad"] for item in categorias_productos]
                },
                "productos": {
                    "tipos": final,
                    "datos": cant
                }
            }
        })

    except Exception as e:
        print(f"Error al obtener resumen de ventas: {e}")
        return jsonify({"error": "Error al obtener ventas."}), 500
