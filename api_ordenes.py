from flask import request, jsonify, Blueprint, render_template
from werkzeug.exceptions import BadRequest
from datetime import date  # ✅ NECESARIO
from PIL import Image
from io import BytesIO

from conexion_base import ConexionBase

ordenes = Blueprint('ordenes', __name__)
conn_db = ConexionBase("tienda_jfleong6_1.db")
def obtener_id_por_nombre(tabla, buscar, columna):
    resultado = conn_db.seleccionar(tabla, "id", f"{columna} = ?", (buscar,))

    return resultado[0][0] if resultado else None

def redimensionar_imagen(archivo, max_ancho=800, max_alto=800):
    try:
        img = Image.open(archivo)
        img.thumbnail((max_ancho, max_alto))  # Redimensionar manteniendo proporción

        buffer = BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        return buffer.getvalue()
    except Exception as e:
        print("⚠️ Error redimensionando imagen:", e)
        return None

@ordenes.route('/submit', methods=['POST'])
def submit():
    form = request.form

    try:
        campos_obligatorios = ['cliente', 'tipo', 'marca', 'modelo', 'estado_entrada',
                               'perifericos', 'observaciones', 'total_servicio', 'tipo_pago', 'usuario']  # agregué usuario

        for campo in campos_obligatorios:
            if campo not in form or not form[campo].strip():
                raise BadRequest(f"El campo '{campo}' es obligatorio.")

        for key in form:
            print(f"{key}:\t{form[key]}")

        tipo = form['tipo'].strip()
        tipo_id = obtener_id_por_nombre("tipos", tipo, "id")
        if not tipo_id:
            raise BadRequest("Tipo no válido o no encontrado.")

        tipo_pago = form['tipo_pago'].strip()
        tipo_pago_id = obtener_id_por_nombre("tipos_pago", tipo_pago, "id")
        if not tipo_pago_id:
            raise BadRequest("Tipo de pago no válido o no encontrado.")

        servicios = form.getlist('servicios[]')
        servicios_finales = []
        for servicio in servicios:
            servicio_id = obtener_id_por_nombre("servicios", servicio.strip(), "id")
            if servicio_id:
                servicios_finales.append(servicio_id)

        if not servicios_finales:
            raise BadRequest("Debe seleccionar al menos un servicio válido.")

        print("Servicios seleccionados IDs:", servicios_finales)

        cliente_id = obtener_id_por_nombre("clientes", form['cliente'].strip(), "numero")
        if not cliente_id:
            raise BadRequest("Cliente no válido o no encontrado.")

        try:
            total_servicio = float(form.get('total_servicio', "0").strip())
        except ValueError:
            raise BadRequest("El monto del servicio no es un número válido.")

        usuario_id = form["usuario"].strip()
        if not usuario_id:
            raise BadRequest("Usuario es obligatorio.")

        # Aquí tienes dos opciones para crear el dict directamente si no tienes clase Orden
        orden_dict = {
            "cliente": cliente_id,
            "usuario_id": usuario_id,
            "tipo": tipo_id,
            "marca": form['marca'].strip(),
            "modelo": form['modelo'].strip(),
            "estado_entrada": form['estado_entrada'].strip(),
            "perifericos": form['perifericos'].strip(),
            "observaciones": form['observaciones'].strip(),
            "total_servicio": total_servicio,
            "estado": 1  # opcional si tu tabla lo asigna por defecto
        }

        orden_id = conn_db.insertar("ordenes", orden_dict)
        if not orden_id:
            raise Exception("No se pudo guardar la orden.")

        for servicio_id in servicios_finales:
            conn_db.insertar("orden_servicios", {
                "id_orden": int(orden_id),
                "servicio": int(servicio_id)
            })

        try:
            monto_pago = float(form.get("pago", "0").strip())
            if monto_pago < 0:
                raise BadRequest("El monto del pago no puede ser negativo.")
        except ValueError:
            raise BadRequest("El monto del pago no es válido.")

        conn_db.insertar("pagos_servicios", {
            "id_orden": int(orden_id),
            "tipo_pago": tipo_pago_id,
            "monto": monto_pago,
            "usuario_id": usuario_id  # Si esta columna es NOT NULL, mejor incluirla
        })

        imagenes = request.files.getlist("imagenes")
        for archivo in imagenes:
            if archivo and archivo.filename != "":
                imagen_redimensionada = redimensionar_imagen(archivo)
                if imagen_redimensionada:
                    conn_db.insertar("img_ordenes", {
                        "id_orden": int(orden_id),
                        "imagen": imagen_redimensionada
                    })

        return jsonify({
            "mensaje": "✅ Orden registrada correctamente.",
            "orden_id": orden_id,
            "orden": orden_dict
        })

    except BadRequest as e:
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        print("❌ Error interno:", e)
        return jsonify({"error": "Error interno del servidor"}), 500
