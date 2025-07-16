# api_empresa.py
from flask import Blueprint, request, jsonify
from conexion_base import ConexionBase
from werkzeug.utils import secure_filename
import os
import sys

# Instancia de la base de datos
conn_db = ConexionBase("tienda_jfleong6_1.db")

# Crear un blueprint para modularizar las rutas de empresa
empresa_bp = Blueprint('api_empresa', __name__)
# Detecta si estamos en una app congelada (.exe con PyInstaller)
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)  # Ruta donde está el .exe
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Desarrollo normal
# Ruta absoluta a la carpeta de imágenes
IMAGES_FOLDER = os.path.join(BASE_DIR, 'static', 'img_productos')

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
            ruta_logo = os.path.join(IMAGES_FOLDER, filename)
            logo.save(ruta_logo)

        return jsonify({"exito": True, "mensaje": "Datos guardados exitosamente."})

    except Exception as e:
        return jsonify({"exito": False, "error": str(e)}), 500