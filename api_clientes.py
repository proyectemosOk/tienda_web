from flask import request, jsonify,Blueprint, render_template
from conexion_base import ConexionBase

clientes = Blueprint('clientes', __name__)
conn_db = ConexionBase("tienda_jfleong6_1.db")

@clientes.route('/cliente')
def personal():
    return render_template('cliente.html')
# ============================
# 1. Cargar clientes (GET)
# ============================
@clientes.route("/api/cargar/clientes", methods=["GET"])
def cargar_clientes():
    clientes = conn_db.seleccionar(
        tabla="clientes",
        columnas="id, nombre, tipo_document, numero, telefono, email"
    )

    if clientes:
        lista_clientes = [
            {
                "id": id_,
                "nombre": nombre,
                "tipo_document": tipo_document,
                "numero": numero,
                "telefono": telefono,
                "email": email
            }
            for id_, nombre, tipo_document, numero, telefono, email in clientes
        ]
        return jsonify(lista_clientes), 200
    else:
        return jsonify([]), 200

# ============================
# 2. Crear cliente (POST)
# ============================
@clientes.route("/api/new_cliente", methods=["POST"])
def new_cliente():
    datos = request.get_json()
    if not datos:
        return jsonify({"error": "No se recibieron datos"}), 400

    campos_requeridos = ["nombre", "tipo_document", "numero"]
    for campo in campos_requeridos:
        if not datos.get(campo):
            return jsonify({"error": f"El campo '{campo}' es obligatorio"}), 400

    id_cliente, error = conn_db.insertar(tabla="clientes", datos=datos)

    if id_cliente:
        return jsonify({"id": id_cliente, "nombre": datos["nombre"]}), 200
    else:
        return jsonify({
            "mensaje": "Cliente no registrado",
            "error": error
        }), 400

# ============================
# 3. Editar cliente (PUT)
# ============================
@clientes.route("/api/clientes/<int:id_cliente>", methods=["PUT"])
def editar_cliente(id_cliente):
    datos = request.get_json()
    if not datos:
        return jsonify({"error": "No se enviaron datos"}), 400

    campos_validos = ['nombre', 'tipo_document', 'numero', 'telefono', 'email']
    datos_actualizar = {}

    for campo in campos_validos:
        valor = datos.get(campo)
        if valor is not None:
            datos_actualizar[campo] = valor

    if not datos_actualizar:
        return jsonify({"error": "No se proporcionaron campos válidos"}), 400

    try:
        conn_db.actualizar(
            tabla="clientes",
            datos=datos_actualizar,
            condicion="id = ?",
            parametros_condicion=(id_cliente,)
        )
        return jsonify({"mensaje": "Cliente actualizado correctamente"}), 200
    except Exception as e:
        print(f"Error al actualizar cliente: {e}")
        return jsonify({"error": "Error al actualizar cliente"}), 500

# ============================
# 4. Eliminar cliente (DELETE)
# ============================
