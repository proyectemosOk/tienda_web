# api_empresa.py
from flask import Blueprint, request, jsonify
from conexion_base import ConexionBase
from werkzeug.utils import secure_filename
import os

# Instancia de la base de datos
conn_db = ConexionBase("tienda_jfleong6_1.db")

# Crear un blueprint para modularizar las rutas de empresa
empresa_bp = Blueprint('api_empresa', __name__)

@empresa_bp.route("/api/empresa", methods=["GET"])
def obtener_datos_empresa():
    """
    Devuelve todos los datos clave-valor de la tabla 'datos' en JSON.
    """
    try:
        resultados = conn_db.seleccionar("datos", columnas="dato, descripcion")
        datos_dict = {dato: descripcion for dato, descripcion in resultados}
        return jsonify({"exito": True, "datos": datos_dict})
    except Exception as e:
        return jsonify({"exito": False, "error": str(e)}), 500


@empresa_bp.route("/api/empresa", methods=["POST"])
def guardar_datos_empresa():
    """
    Recibe datos desde un formulario (FormData) y actualiza la tabla 'datos'.
    Guarda el logo en static/Iconos/logo.png si se envía.
    """
    try:
        # Extraer los datos del formulario
        form_data = request.form

        # Guardar cada dato en la tabla
        for key, value in form_data.items():
            conn_db.actualizar(
                tabla="datos",
                datos={"descripcion": value},
                condicion="dato = ?",
                parametros_condicion=(key,)
            )

        # Procesar imagen si fue enviada
        logo = request.files.get('logoInput')
        if logo and logo.filename:
            filename = secure_filename("logo.png")  # Usamos nombre fijo
            ruta_logo = os.path.join("static", "Iconos", filename)
            os.makedirs(os.path.dirname(ruta_logo), exist_ok=True)  # Asegura que la carpeta exista
            logo.save(ruta_logo)
            print("hola")

        return jsonify({"exito": True, "mensaje": "Datos guardados exitosamente."})

    except Exception as e:
        return jsonify({"exito": False, "error": str(e)}), 500