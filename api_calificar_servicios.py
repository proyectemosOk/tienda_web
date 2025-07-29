from flask import request, jsonify, Blueprint, render_template
from socketio_app import socketio

from datetime import datetime  # ✅ NECESARIO


from conexion_base import ConexionBase
lista_paginas = []
calificar_servicio = Blueprint('calificar_servicio', __name__)
conn_db = ConexionBase("tienda_jfleong6_1.db")

@calificar_servicio.route('/api/cargarDatosVotacion', methods=['GET'])
def cargarDatosVotacion():
    try:
        # Obtener conteos totales de cada calificación
        conteos = conn_db.seleccionar("conteo_calificaciones", "*")

        # Obtener últimos 30 registros de votaciones ordenados por fecha DESC
        registros = conn_db.ejecutar_personalizado_1(
            """select * from registro_calificaciones
            order by fecha DESC
            limit 30"""
        )
        print(registros)
        # Formatear votaciones como lista de tuplas [(1, cantidad), ...]


        return jsonify({
            "votaciones": conteos,
            "registros": registros
        }), 200

    except Exception as e:
        return jsonify({"estado": "error", "mensaje": f"Error cargando datos: {str(e)}"}), 500

@calificar_servicio.route('/calificaciones')
def index():
    ip = request.remote_addr
    lista_paginas.append(ip)
    return render_template('calificaciones.html')

@calificar_servicio.route('/api/guardar_datos', methods=['POST'])
def guardar_datos():
    data = request.get_json()
    calificacion = data.get("calificacion")
    fecha_hora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        # Iniciar transacción
        conn_db.iniciar_transaccion()

        # 1. Guardar en tabla de registros
        conn_db.insertar("registro_calificaciones", {
            "calificacion": calificacion,
            "fecha": fecha_hora
        })

        # 2. Actualizar conteo
        existentes = conn_db.seleccionar("conteo_calificaciones", "*", "calificacion = ?", (calificacion,))
        if existentes:
            conn_db.actualizar("conteo_calificaciones",
                {"cantidad": "cantidad + 1"},
                "calificacion = ?",
                (calificacion,),
                expresion_sql=True)
        else:
            conn_db.insertar("conteo_calificaciones", {
                "calificacion": calificacion,
                "cantidad": 1
            })

        # Confirmar si todo salió bien
        conn_db.confirmar_transaccion()
        
        # Emitir el evento a todos los clientes (namespace por defecto)
        socketio.emit('nuevo_voto', {
            "calificacion": calificacion,
            "fecha": fecha_hora
        })

        return jsonify({"estado": "ok", "mensaje": "Datos guardados", "fecha": fecha_hora}), 200

    except Exception as e:
        conn_db.revertir_transaccion()
        return jsonify({"estado": "error", "mensaje": f"Error al guardar: {str(e)}"}), 500