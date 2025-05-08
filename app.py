from flask import Flask, render_template, request, redirect, url_for, jsonify
import os
from werkzeug.utils import secure_filename
from conexion_base import *
from orden import Orden
from firebase_config import ServicioFirebase
from datetime import datetime
import json

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

conn_db = ConexionBase("tienda_jfleong6_1.db")

@app.route('/orden')
def index():
    return render_template('orden.html')

@app.route('/orden')
def orden():
    return render_template('orden.html')

@app.route('/inventarios')
def inventarios():
    return render_template('gestor_inventario.html')

@app.route('/submit', methods=['POST'])
def submit():
    form = request.form

    # Procesar TIPO
    tipo = form['tipo']
    if tipo == "__nuevo__":
        tipo = form['nuevo_tipo'].strip()
        if tipo and not conn_db.existe_registro("tipos", "nombre", tipo):
            conn_db.insertar("tipos", {"nombre": tipo})

    # Procesar TIPO DE PAGO
    tipo_pago = form['tipo_pago']
    if tipo_pago == "__nuevo__":
        tipo_pago = form['nuevo_tipo_pago'].strip()
        if tipo_pago and not conn_db.existe_registro("tipos_pago", "nombre", tipo_pago):
            conn_db.insertar("tipos_pago", {"nombre": tipo_pago, "descripcion": "Agregado desde formulario"})

    # Procesar SERVICIOS
    servicios = form.getlist('servicios')
    print("Servicios seleccionados:", servicios)

    if "__nuevo__" in servicios:
        nuevo_servicio = form.get("nuevo_servicio", "").strip()
        print("Nuevo servicio ingresado:", nuevo_servicio)
        if nuevo_servicio:
            servicios.remove("__nuevo__")
            servicios.append(nuevo_servicio)

            if not conn_db.existe_registro("servicios", "nombre", nuevo_servicio):
                conn_db.insertar("servicios", {"nombre": nuevo_servicio})

    # Crear objeto Orden
    orden = Orden(
        nombre=form['nombre'],
        telefono=form['telefono'],
        correo=form['correo'],
        tipo=tipo,
        marca=form['marca'],
        modelo=form['modelo'],
        estado_entrada=form['estado_entrada'],
        servicios=servicios,
        perifericos=form['perifericos'],
        observaciones=form['observaciones'],
        fecha=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        tipo_pago=tipo_pago,
        pago=float(form.get('pago', 0)),
        estado=0  # Estado inicial: recibido
    )

    orden_dict = orden.a_dict()

    # Convertir servicios (lista) a texto para guardarlo en SQLite
    orden_dict['servicios'] = json.dumps(servicios)  # o ", ".join(servicios)

    # Guardar localmente
    conn_db.insertar("ordenes", orden_dict)

    print("✅ Orden registrada correctamente.")
    return redirect(url_for('index'))

@app.route('/api/tipos')
def api_tipos():
    tipos = conn_db.seleccionar("tipos", "nombre")
    return jsonify([{"nombre": t[0]} for t in tipos])


@app.route('/api/servicios')
def api_servicios():
    servicios = conn_db.seleccionar("servicios", "nombre")
    return jsonify([{"nombre": s[0]} for s in servicios])

@app.route('/api/tipos_pago')
def api_tipos_pago():
    tipos_pago = conn_db.seleccionar("tipos_pago", "nombre")
    return jsonify([{"nombre": t[0]} for t in tipos_pago])

@app.route('/api/productos')
def productos():
    productos = conn_db.seleccionar("productos", "codigo, nombre, categoria, stock, precio_compra, precio_venta")
    return jsonify([
        {
            "codigo": items[0],
            "nombre": items[1],
            "categoria": items[2],
            "stock": items[3],
            "precio_compra": float(items[4]),
            "precio_venta": float(items[5])
        } for items in productos
    ])

@app.route('/api/productos/<codigo>', methods=['GET'])
def obtener_producto(codigo):
    try:
        
        # Consulta para obtener todos los detalles del producto
        producto = conn_db.seleccionar("productos", "codigo, nombre, categoria, stock, precio_compra, precio_venta", "codigo = ?",(codigo,))
        
        # Formatear el resultado
        detalle_producto = {
            "categoria": producto[0][0],
            "codigo": producto[0][1],
            "nombre": producto[0][2],
            "precio_compra": float(producto[0][3]),
            "precio_venta": float(producto[0][4]),
            "stock": producto[0][5]
        }
        
        return jsonify(detalle_producto)
    
    except Exception as e:
        # Manejo de errores
        print(f"Error al obtener detalles del producto: {e}")
        return jsonify({
            "error": "Error interno del servidor",
            "mensaje": str(e)
        }), 500
    
@app.route('/cierre_dia')
def cierre_dia():
    return render_template('cierre_dia.html')
# API para obtener las ventas del día
@app.route('/api/ventas/dia', methods=['GET'])
def obtener_ventas_dia():
    try:
        # Obtener la fecha actual
        fecha_hoy = datetime.now().strftime('%Y-%m-%d')

        # Total de ventas del día
        total_ventas = conn_db.seleccionar(
            tabla="ventas",
            columnas="SUM(total_venta)",
            condicion="DATE(fecha) = ?",
            parametros=(fecha_hoy,)
        )[0][0] or 0

        # Desglose por método de pago
        desglose_pagos = conn_db.ejecutar_personalizado('''
            SELECT tp.nombre AS metodo_pago, SUM(pv.valor) AS total
            FROM pagos_venta pv
            JOIN ventas v ON pv.venta_id = v.id
            JOIN tipos_pago tp ON pv.metodo_pago = tp.nombre
            WHERE DATE(v.fecha) = ?
            GROUP BY tp.nombre
        ''', (fecha_hoy,))

        # Formatear el desglose en un diccionario
        desglose = {metodo_pago: total for metodo_pago, total in desglose_pagos}

        # Respuesta JSON
        return jsonify({
            "fecha": fecha_hoy,
            "total_ventas": total_ventas,
            "desglose_pagos": desglose
        })

    except Exception as e:
        print(f"Error al obtener las ventas del día: {e}")
        return jsonify({"error": "Ocurrió un error al obtener las ventas del día."}), 500

@app.route('/api/ventas/cargar', methods=['GET'])
def cargar_ventas_dia():
    try:
        # Obtener la fecha actual
        fecha_hoy = datetime.now().strftime('%Y-%m-%d')

        # Consulta para obtener las ventas del día y sus métodos de pago
        consulta = '''
            SELECT 
                v.id AS id_venta,
                v.fecha,
                v.total_venta,
                GROUP_CONCAT(tp.nombre, ', ') AS metodos_pago
            FROM ventas v
            LEFT JOIN pagos_venta pv ON v.id = pv.venta_id
            LEFT JOIN tipos_pago tp ON pv.metodo_pago = tp.nombre
            WHERE DATE(v.fecha) = ?
            GROUP BY v.id
        '''

        # Ejecutar la consulta
        ventas = conn_db.ejecutar_personalizado(consulta, (fecha_hoy,))

        # Formatear los datos en una lista de diccionarios
        resultado = [
            {
                "id_venta": venta[0],
                "fecha": venta[1],
                "total_venta": venta[2],
                "metodos_pago": venta[3] if venta[3] else "Sin método de pago"
            }
            for venta in ventas
        ]

        # Respuesta JSON
        return jsonify({
            "fecha": fecha_hoy,
            "ventas": resultado
        })

    except Exception as e:
        print(f"Error al cargar las ventas del día: {e}")
        return jsonify({"error": "Ocurrió un error al cargar las ventas del día."}), 500
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
