from flask import request, jsonify, Blueprint, render_template
from datetime import date  # ✅ NECESARIO
from actulizarTablaProductos import migrar_productos_a_formato_relacional
api_extras = Blueprint('api_extras', __name__)

@api_extras.route('/api/cambiar_estrucutura_tabla_productos', methods=['GET'])
def cambiar_estrucutura_tabla_productos():
    migrar_productos_a_formato_relacional()   
    