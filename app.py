from flask import Flask, render_template, request, redirect, url_for, jsonify, send_from_directory

from socketio_app import socketio, init_socketio

from conexion_base import *
from orden import Orden
from firebase_config import ServicioFirebase
from datetime import datetime, timedelta, date
from werkzeug.utils import secure_filename
from werkzeug.exceptions import BadRequest
from tarjetas import *
import bcrypt
from PIL import Image
from io import BytesIO
import json
import socket
import math

# Blueprints o rutas divididas por módulo
from apis_factura import *
from api_cierre_caja import *
from api_empresa import *
from api_clientes import *
from api_informes import *
from api_nueva_venta import *
from api_ordenes import *
from api_calificar_servicios import *

# Licenciamiento
from licencia import validar_licencia, crear_licencia

# ⚙️ Inicialización de la app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'

# ⚙️ Inicialización de SocketIO con threading
init_socketio(app)

# Registro de Blueprints
app.register_blueprint(extras)  
app.register_blueprint(facturas_bp)
app.register_blueprint(cierre_caja)
app.register_blueprint(empresa_bp)
app.register_blueprint(clientes)
app.register_blueprint(informes)
app.register_blueprint(nueva_venta)
app.register_blueprint(ordenes)
app.register_blueprint(calificar_servicio)

UPLOAD_FOLDER = 'uploads'


DEFAULT_IMAGE = 'img.png'  # La imagen por defecto en la raíz del proyecto
conn_db = ConexionBase("tienda_jfleong6_1.db")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Detecta si estamos en una app congelada (.exe con PyInstaller)
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)  # Ruta donde está el .exe
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Desarrollo normal
# Ruta absoluta a la carpeta de imágenes
IMAGES_FOLDER = os.path.join(BASE_DIR, 'static', 'img_productos')
# print(IMAGES_FOLDER,"\n",BASE_DIR)
os.makedirs(IMAGES_FOLDER, exist_ok=True)
# Ruta personalizada para servir imágenes desde static/img_productos

@app.route("/verificar")
def prueba_licencia():
    valido, msg = validar_licencia()
    return f"¿Licencia válida? {valido} - {msg}"

  # Asegura que la carpeta exista
@app.before_request
def verificar_licencia_global():
    rutas_exentas = ["/activar_licencia", "/login-sesion", "/", "/static", "/api"]

    ruta = request.path

    # Permitir acceso a rutas exentas y archivos estáticos
    if (
        any(ruta == r for r in rutas_exentas) or
        ruta.startswith("/static") or
        ruta.startswith("/api") or
        ruta.startswith("/uploads")
    ):
        return

    valido, msg = validar_licencia()
    if not valido:
        print("❌ Licencia inválida:", msg)
        return render_template("licencia_fallida.html")

    
@app.route("/activar_licencia", methods=["POST"])
def activar_licencia():
    crear_licencia()
    return redirect("/")

    
    
@app.route('/img_productos/<path:filename>')
def serve_img_productos(filename):
    ruta_imagen = os.path.join(IMAGES_FOLDER, filename)
    
    if not os.path.isfile(ruta_imagen):
        # Si no existe la imagen solicitada, usar img.png por defecto
        filename = "logo.png"

    return send_from_directory(IMAGES_FOLDER, filename)

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

@app.route('/')
def index():
    return render_template('login-sesion.html')

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/personal')
def personal():
    return render_template('personal.html')

@app.route('/login-sesion')
def login_sesion():
    return render_template('login-sesion.html')

@app.route('/pruebas')
def pruebas():
    return render_template('pruebas.html')

@app.route('/ordenes')
def orden():
    return render_template('/ordenes/gestor.html')

@app.route('/orden/nueva')
def new_orden():
    return render_template('/ordenes/orden.html')

@app.route('/empresa')
def empresa():
    return render_template('datos_empresa.html')

@app.route('/ventas')
def ventas():
    return render_template('vista_de_producto.html')

@app.route('/configuraciones')
def configuraciones():
    return render_template('configuraciones.html')

@app.route('/inventarios')
def inventarios():
    return render_template('gestor_inventario.html')

@app.route('/principal')
def menu_global():
    return render_template('menu-global.html')

@app.route("/monederos")
def monedero():
    return render_template('monedero.html')
    
@app.route('/cerrarCaja')
def cierre_dia():
    return render_template('informe-cierre-dia.html')


@app.route('/api/tipos')
def api_tipos():
    tipos = conn_db.seleccionar("tipos","*")
    return jsonify({t[0]: t[1] for t in tipos})

@app.route('/api/servicios')
def api_servicios():
    servicios = conn_db.seleccionar("servicios", "id, nombre")
    return jsonify({s[0]: s[1] for s in servicios})

@app.route('/api/tipos_pago')
def api_tipos_pago():
    tipos_pago = conn_db.seleccionar("tipos_pago", "id, nombre")
    return jsonify({t[0]: t[1] for t in tipos_pago})

@app.route('/api/productos', methods=['GET'])
def api_productos():
    try:
        # 1️⃣ Obtener parámetros con valores por defecto
        pagina = request.args.get('pagina', default=1, type=int)
        limite = request.args.get('limite', default=10, type=int)
        search = request.args.get('search', default='', type=str).strip()
        offset = (pagina - 1) * limite

        # 2️⃣ Construir filtro de búsqueda dinámico
        filtro_where = "WHERE p.activo = 1"
        parametros = []

        if search:
            # Agregar búsqueda en id, codigo, nombre, descripcion, categoria
            search_like = f"%{search}%"
            filtro_where += """
                AND (
                    p.id LIKE ?
                    OR p.codigo LIKE ?
                    OR p.nombre LIKE ?
                    OR p.descripcion LIKE ?
                    OR p.categoria LIKE ?
                )
            """
            parametros.extend([search_like]*5)

        # 3️⃣ Consulta principal paginada con JOIN, GROUP BY, ORDER BY
        consulta_datos = f"""
            SELECT
                p.id,
                p.codigo,
                p.nombre,
                p.descripcion,
                p.categoria,
                p.stock,
                p.precio_compra,
                p.precio_venta,
                COALESCE(SUM(dv.cantidad), 0) AS cantidad_vendida
            FROM productos p
            LEFT JOIN detalles_ventas dv ON p.id = dv.producto_id
            {filtro_where}
            GROUP BY p.id
            ORDER BY cantidad_vendida DESC
            LIMIT ? OFFSET ?
        """

        parametros_datos = parametros + [limite, offset]

        resultados = conn_db.ejecutar_personalizado(consulta_datos, parametros_datos)

        # 4️⃣ Consulta para contar el total (sin LIMIT/OFFSET)
        consulta_total = f"""
            SELECT COUNT(*) FROM (
                SELECT p.id
                FROM productos p
                LEFT JOIN detalles_ventas dv ON p.id = dv.producto_id
                {filtro_where}
                GROUP BY p.id
            ) AS subquery
        """

        total_resultados = conn_db.ejecutar_personalizado(consulta_total, parametros)
        total_resultados = total_resultados[0][0] if total_resultados else 0
        total_paginas = math.ceil(total_resultados / limite) if limite else 1

        # 5️⃣ Formatear resultados
        productos_formateados = [
            {
                "id": item[0],
                "codigo": item[1],
                "nombre": item[2],
                "descripcion": item[3],
                "categoria": item[4],
                "stock": item[5],
                "precio_compra": float(item[6]),
                "precio_venta": float(item[7]),
                "cantidad_vendida": item[8]
            }
            for item in resultados
        ]

        # 6️⃣ Respuesta JSON
        return jsonify({
            "productos": productos_formateados,
            "total": total_resultados,
            "pagina_actual": pagina,
            "total_paginas": total_paginas
        }), 200

    except Exception as e:
        print(f"❌ Error en /api/productos: {str(e)}")
        return jsonify({
            "mensaje": "Error interno al recuperar productos",
            "error": str(e)
        }), 500

@app.route('/api/productos/<codigo>', methods=['GET'])
def obtener_producto(codigo):
    try:
        print(codigo)
        # Consulta para obtener todos los detalles del producto
        producto = conn_db.seleccionar("productos", "codigo, nombre, categoria, stock, precio_compra, precio_venta", "codigo = ?",(codigo,))
        if producto ==[]:
            return jsonify({
                "error": "Producto no encontrado",
                "mensaje": "No se encenctra ningun producto"
            }), 500
        # Formatear el resultado
        detalle_producto = {
            "categoria": producto[0][2],
            "codigo": producto[0][0],
            "nombre": producto[0][1],
            "precio_compra": float(producto[0][4]),
            "precio_venta": float(producto[0][5]),
            "stock": producto[0][3]
        }

        return jsonify({"ok":True,"detalles":detalle_producto}), 200
    
    except Exception as e:
        # Manejo de errores
        print(f"Error al obtener detalles del producto: {e}")
        return jsonify({
            "error": "Error interno del servidor",
            "mensaje": str(e)
        }), 500
    
# API para obtener las ventas del día
@app.route('/api/ventas/dia', methods=['GET'])
def obtener_resumen_ventas():
    try:
        fecha_inicio = request.args.get('inicio')
        fecha_fin = request.args.get('fin')
        fecha_unica = request.args.get('fecha')

        # Determinar el rango de fechas para el filtro
        if fecha_inicio and fecha_fin:
            where_clause = "DATE(v.fecha) BETWEEN ? AND ?"
            params = (fecha_inicio, fecha_fin)
        elif fecha_unica:
            where_clause = "DATE(v.fecha) = ?"
            params = (fecha_unica,)
        else:
            hoy = date.today().isoformat()
            where_clause = "DATE(v.fecha) = ?"
            params = (hoy,)

        # Desglose de pagos por método de pago
        desglose_pagos = conn_db.ejecutar_personalizado(f'''
            SELECT tp.nombre AS metodo_pago, SUM(pv.valor) AS total
            FROM pagos_venta pv
            JOIN ventas v ON pv.venta_id = v.id
            JOIN tipos_pago tp ON pv.metodo_pago = tp.id
            WHERE {where_clause}
            GROUP BY tp.nombre
        ''', params)

        desglose = {metodo_pago: total for metodo_pago, total in desglose_pagos}

        # Lista de ventas en el rango
        ventas = conn_db.ejecutar_personalizado(f'''
            SELECT v.id, v.fecha, v.total_venta, c.nombre
            FROM ventas v
            JOIN clientes c ON v.cliente_id = c.id
            WHERE {where_clause}
        ''', params)

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
# API para obtener detalles de venta por ID

@app.route('/api/ventas/<int:id_venta>/detalle', methods=['GET'])
def obtener_detalle_venta(id_venta):
    try:
        print(id_venta, type(id_venta))
        # Datos generales de la venta con cliente y vendedor
        venta_info = conn_db.ejecutar_personalizado('''
            SELECT v.id, v.fecha, v.total_venta, c.nombre AS cliente, u.nombre AS vendedor
            FROM ventas v
            JOIN clientes c ON v.cliente_id = c.id
            JOIN usuarios u ON v.vendedor_id = u.id
            WHERE v.id = ?
        ''', (id_venta,))
        
        if not venta_info:
            return jsonify({"error": "Venta no encontrada"}), 404

        id_venta, fecha, total, cliente, vendedor = venta_info[0]

        # Productos de la venta
        detalles = conn_db.ejecutar_personalizado('''
            SELECT dv.cantidad, p.id, p.nombre, dv.precio_unitario
            FROM detalles_ventas dv
            JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = ?
        ''', (id_venta,))
        
        print("hola  ",detalles)
        productos = [
            {
                "cantidad": cant,
                "id_producto": id_prod,
                "nombre": nombre,
                "precio_unitario": float(precio_u),
                "total": round(cant * precio_u, 2)
            }
            for cant, id_prod, nombre, precio_u in detalles
        ]

        # Desglose de pagos de la venta
        desglose = conn_db.ejecutar_personalizado('''
            SELECT tp.nombre AS metodo_pago, SUM(pv.valor) AS total
            FROM pagos_venta pv
            JOIN tipos_pago tp ON pv.metodo_pago = tp.id
            WHERE pv.venta_id = ?
            GROUP BY tp.nombre
        ''', (id_venta,))

        desglose_pagos = {m: float(v) for m, v in desglose}

        return jsonify({
            "id": id_venta,
            "fecha": fecha,
            "cliente": cliente,
            "vendedor": vendedor,
            "total": float(total),
            "productos": productos,
            "desglose_pagos": desglose_pagos
        })

    except Exception as e:
        print(f"Error al obtener detalle de venta {id_venta}: {e}")
        return jsonify({"error": "Error al obtener detalle de venta."}), 500


@app.route('/api/ventas/cargar', methods=['GET'])
def cargar_ventas():
    try:
        # Obtener la fecha actual
        fecha_hoy = date.today().isoformat()

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

@app.route('/api/productos/<codigo>', methods=['PUT'])
def actualizar_producto(codigo):
    try:
        # Obtener datos del producto desde la solicitud
        datos = request.get_json()
        
        # Validar que se reciban datos
        if not datos:
            return jsonify({
                'mensaje': 'No se recibieron datos para actualizar',
                'error': True
            }), 400
        
        
        # Validaciones de datos
        campos_validos = ['nombre', 'categoria', 'stock', 'precio_compra', 'precio_venta']
        
        # Filtrar solo campos válidos
        datos_actualizacion = {
            campo: valor for campo, valor in datos.items() 
            if campo in campos_validos
        }
        
        # Validaciones adicionales
        if 'stock' in datos_actualizacion and datos_actualizacion['stock'] < 0:
            return jsonify({
                'mensaje': 'El stock no puede ser negativo',
                'error': True
            }), 400
        
        if 'precio_compra' in datos_actualizacion and datos_actualizacion['precio_compra'] < 0:
            return jsonify({
                'mensaje': 'El precio de compra no puede ser negativo',
                'error': True
            }), 400
        
        if 'precio_venta' in datos_actualizacion and datos_actualizacion['precio_venta'] < 0:
            return jsonify({
                'mensaje': 'El precio de venta no puede ser negativo',
                'error': True
            }), 400
        
        # Verificar si hay datos válidos para actualizar
        if not datos_actualizacion:
            return jsonify({
                'mensaje': 'No se proporcionaron campos válidos para actualizar',
                'error': True
            }), 400
        
        # Llamar al método actualizar
        conn_db.actualizar(
            tabla='productos', 
            datos=datos_actualizacion, 
            condicion='codigo = ?', 
            parametros_condicion=(codigo,)
        )
        
        return jsonify({
            'mensaje': 'Producto actualizado correctamente',
            }
        ), 200
    
    except Exception as e:
        # Manejo de errores
        print(f"Error al actualizar producto: {str(e)}")
        return jsonify({
            'mensaje': 'Error interno del servidor',
            'error': str(e)
        }), 500
    finally:
        # Asegurarse de cerrar la conexión
        if 'conn_db' in locals():
            conn_db.cerrar_conexion()

@app.route('/api/productos/<codigo>', methods=['DELETE'])
def eliminar_producto(codigo):
    try:        
        # Desactivar el producto usando el método actualizar()
        conn_db.actualizar(
            tabla='productos', 
            datos={'activo': 0}, 
            condicion='codigo = ?', 
            parametros_condicion=(codigo,)
        )
        
        return jsonify({
            'mensaje': 'Producto eliminado correctamente',
            'producto_desactivado': codigo
        }), 200
    
    except Exception as e:
        # Manejo de errores
        print(f"Error al desactivar producto: {str(e)}")
        return jsonify({
            'mensaje': 'Error interno del servidor',
            'error': str(e)
        }), 500

@app.route('/api/productos', methods=['POST'])
def crear_producto():
    try:
        data = request.get_json()

        # ✅ Validar campos obligatorios
        campos_obligatorios = ['codigo', 'nombre', 'categoria', 'unidad', 'stock', 'precio_compra', 'precio_venta']
        for campo in campos_obligatorios:
            if campo not in data or not str(data[campo]).strip():
                return jsonify({"ok": False, "error": f"El campo '{campo}' es obligatorio."}), 400

        # 🧼 Limpiar y convertir datos
        codigo = data['codigo'].strip()
        nombre = data['nombre'].strip()
        descripcion = data.get('descripcion', '').strip()
        categoria_nombre = data['categoria'].strip()
        unidad_nombre = data['unidad'].strip()
        unidad_simbolo = data.get('unidad_simbolo', '').strip() or None
        stock = int(data['stock'])
        precio_compra = float(data['precio_compra'])
        precio_venta = float(data['precio_venta'])

        # 🚫 Validar valores numéricos
        if stock < 0 or precio_compra < 0 or precio_venta < 0:
            return jsonify({"ok": False, "error": "Valores numéricos no pueden ser negativos."}), 400

        # 🔄 Iniciar transacción
        conn_db.iniciar_transaccion()

        # 1️⃣ Verificar/crear categoría
        cat_resultado = conn_db.seleccionar(
            "categorias", columnas="id", condicion="categoria = ?", parametros=(categoria_nombre,)
        )
        if not cat_resultado:
            conn_db.insertar("categorias", {"categoria": categoria_nombre})

        # 2️⃣ Verificar/crear unidad
        unidad_resultado = conn_db.seleccionar(
            "unidades", columnas="id", condicion="unidad = ?", parametros=(unidad_nombre,)
        )
        if not unidad_resultado:
            conn_db.insertar("unidades", {
                "unidad": unidad_nombre,
                "simbolo": unidad_simbolo
            })

        # 🔁 Obtener IDs actualizados
        categoria_id = obtener_id_por_nombre("categorias", categoria_nombre, "categoria")
        unidad_id = obtener_id_por_nombre("unidades", unidad_nombre, "unidad")

        # 3️⃣ Insertar producto
        id_producto, error = conn_db.insertar("productos", {
            "codigo": codigo,
            "nombre": nombre,
            "descripcion": descripcion,
            "categoria": categoria_id,
            "unidad": unidad_id,
            "stock": stock,
            "precio_compra": precio_compra,
            "precio_venta": precio_venta,
            "activo": 1
        })
        # Registrar lote
        conn_db.insertar("lotes_productos", {
            "id_producto": id_producto,
            "cantidad": stock,
            "precio_compra": precio_compra,
            "fecha_ingreso": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        if error:
            conn_db.revertir_transaccion()
            return jsonify({"ok": False, "error": error["error"]}), 400

        # ✅ Confirmar todo
        conn_db.confirmar_transaccion()
        return jsonify({"ok": True, "mensaje": "Producto creado exitosamente.", "id": id_producto})

    except Exception as e:
        print("Error en /api/productos:", e)
        conn_db.revertir_transaccion()
        return jsonify({"ok": False, "error": "Ocurrió un error al crear el producto."}), 500

@app.route('/api/productos/<int:id_producto>/imagen', methods=['POST'])
def subir_imagen_producto(id_producto):
    if 'imagen' not in request.files:
        return jsonify({"ok": False, "error": "No se envió ningún archivo"}), 400

    file = request.files['imagen']

    if file.filename == '':
        return jsonify({"ok": False, "error": "Nombre de archivo vacío"}), 400

    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
        return jsonify({"ok": False, "error": "Formato no permitido"}), 400

    filename = f"{id_producto}.png"
    filepath = os.path.join(IMAGES_FOLDER, filename)

    try:
        # Convertir a PNG si no es .png
        image = Image.open(file.stream).convert("RGBA")
        image.save(filepath, format="PNG")
        print("vamos bien")

        return jsonify({"ok": True, "mensaje": "Imagen guardada correctamente"})
    except Exception as e:
        return jsonify({"ok": False, "error": f"No se pudo guardar la imagen: {str(e)}"}), 500


@app.route('/api/opciones_producto', methods=['GET'])
def obtener_opciones_producto():
    categorias = conn_db.seleccionar("categorias", columnas="id, categoria")
    unidades = conn_db.seleccionar("unidades", columnas="id, unidad")

    return jsonify({
        "ok": True,
        "categorias": {c[0]:c[1] for c in categorias},
        "unidades": {u[0]:u[1] for u in unidades}
    })

@app.route('/api/crear_proveedor', methods=['POST'])
def crear_proveedor():
    try:
        datos = request.get_json()

        # Validar otros campos obligatorios (sin incluir "codigo")
        if not all(key in datos for key in ("nombre", "rut", "telefono")):
            return jsonify({"error": "Faltan datos obligatorios"}), 400

        ultimo_codigo = conn_db.seleccionar(
            tabla="proveedores",
            columnas="MAX(CAST(codigo AS INTEGER)) AS ultimo_codigo"
        )[0][0] or 0
        nuevo_codigo = int(ultimo_codigo) + 1
        # Insertar el proveedor en la base de datos
        resultado, error_info = conn_db.insertar(
            "proveedores",
            {
                "codigo": nuevo_codigo,
                "nombre": datos["nombre"],
                "rut": datos["rut"],
                "direccion": datos.get("direccion"),
                "telefono": datos["telefono"],
                "email": datos.get("email"),
                "fecha_registro": "date('now', 'localtime')",
                "estado": 1
            },
            expresion_sql=True
        )


        print(resultado, error_info)

        if error_info:
            # Aquí verificamos si el error es de restricción UNIQUE y si hay columna
            if "columna" in error_info:
                return jsonify({
                    "error": error_info["error"],
                    "columna": error_info["columna"]
                }), 400
            else:
                return jsonify({"error": error_info["error"]}), 500
        else:
            return jsonify({"mensaje": "Proveedor creado exitosamente", "codigo": resultado}), 201

    except Exception as e:
        print(f"Error al crear proveedor: {e}")
        return jsonify({"error": "Error al crear proveedor"}), 500
    
@app.route('/api/proveedores/buscar')
def buscar_proveedor():
    termino = request.args.get('termino', '').strip()

    if not termino:
        return jsonify({'ok': False, 'error': 'Debe proporcionar un término de búsqueda'}), 400

    # Buscar por documento EXACTO primero
    resultado = conn_db.seleccionar(
        "proveedores",
        columnas="id, nombre, rut",
        condicion="rut = ?",
        parametros=(termino,)
    )
    print(resultado)
    if resultado:
        proveedor = resultado[0]
        return jsonify({
            'id': proveedor[0],
            'nombre': proveedor[1],
            'documento': proveedor[2]
        }), 200
    print(resultado)
    # Si no encontró por documento, buscar por nombre (LIKE)
    like_term = f"%{termino}%"
    resultado_nombre = conn_db.seleccionar(
        "proveedores",
        columnas="id, nombre, rut",
        condicion="nombre LIKE ?",
        parametros=(like_term,)
    )

    if resultado_nombre:
        proveedor = resultado_nombre[0]
        return jsonify({
            'id': proveedor[0],
            'nombre': proveedor[1],
            'documento': proveedor[2]
        }), 200

    return jsonify({'ok': False, 'error': 'Proveedor no encontrado'}), 404

@app.route('/api/proveedores', methods=['GET'])
def cargar_proveedores():
    try:
        # Obtener todos los proveedores activos
        proveedores = conn_db.seleccionar(
            tabla="proveedores",
            columnas="id, codigo, nombre, rut, telefono",
            condicion="estado = 1"
        )

        # Construir una lista de diccionarios con los datos de los proveedores
        lista_proveedores = [
            {
                "id": proveedor[0],
                "codigo": proveedor[1],
                "nombre": proveedor[2],
                "rut": proveedor[3],
                "telefono": proveedor[4]
            }
            for proveedor in proveedores
        ]

        # Retornar la lista de proveedores en formato JSON
        return jsonify(lista_proveedores), 200
    except Exception as e:
        print(f"Error al cargar proveedores: {e}")
        return jsonify({"error": "Error al cargar proveedores"}), 500

@app.route('/api/proveedores/<int:id>', methods=['GET'])
def ver_proveedor(id):
    try:
        proveedor = conn_db.seleccionar(
            tabla="proveedores",
            columnas="id, codigo, nombre, rut, direccion, telefono, email, fecha_registro",
            condicion="id = ?",
            parametros=(id,)
        )
        if proveedor:
            # proveedor[0] es la fila, convertirla a diccionario con claves
            fila = proveedor[0]
            proveedor_dict = {
                "id": fila[0],
                "codigo": fila[1],
                "nombre": fila[2],
                "rut": fila[3],
                "direccion": fila[4],
                "telefono": fila[5],
                "email": fila[6],
                "fecha_registro": fila[7]
            }
            return jsonify(proveedor_dict), 200
        else:
            return jsonify({"error": "Proveedor no encontrado"}), 404
    except Exception as e:
        print(f"Error al obtener detalles del proveedor: {e}")
        return jsonify({"error": "Error al obtener detalles del proveedor"}), 500

@app.route('/api/proveedores/<int:id>', methods=['PUT'])
def editar_proveedor(id):
    try:
        datos = request.get_json()
        # Validar datos requeridos
        if not all(key in datos for key in ("nombre", "rut", "direccion", "telefono", "email")):
            return jsonify({"error": "Faltan datos obligatorios"}), 400

        # Actualizar datos del proveedor
        conn_db.actualizar(
            tabla="proveedores",
            datos={
                "nombre": datos["nombre"],
                "rut": datos["rut"],
                "direccion": datos["direccion"],
                "telefono": datos["telefono"],
                "email": datos["email"]
            },
            condicion="id = ?",
            parametros_condicion=(id,)
        )
        return jsonify({"mensaje": "Proveedor actualizado exitosamente"}), 200
    except Exception as e:
        print(f"Error al editar proveedor: {e}")
        return jsonify({"error": "Error al editar proveedor"}), 500

@app.route('/api/proveedores/<int:id>', methods=['DELETE'])
def eliminar_proveedor(id):
    try:
        # Cambiar estado del proveedor a 0
        conn_db.actualizar(
            tabla="proveedores",
            datos={"estado": 0},
            condicion="id = ?",
            parametros_condicion=(id,)
        )
        return jsonify({"mensaje": "Proveedor eliminado correctamente"}), 200
    except Exception as e:
        print(f"Error al eliminar proveedor: {e}")
        return jsonify({"error": "Error al eliminar proveedor"}), 500

@app.route('/api/productos/ventas', methods=['GET'])
def obtener_productos():
    consulta = """
    SELECT 
    productos.id, 
    productos.nombre, 
    productos.precio_venta, 
    categorias.categoria AS categoria, 
    productos.descripcion, 
    productos.codigo, 
    productos.stock
    FROM productos
    LEFT JOIN categorias ON productos.categoria = categorias.id
    """
    productos = conn_db.ejecutar_personalizado(consulta)
    productos_list = []
    
    for prod in productos:
        url_imagen = f"img_productos/{prod[0]}.png"
        productos_list.append({
            "id": prod[0],
            "nombre": prod[1],
            "precio": prod[2],
            "categoria": prod[3],
            "descripcion": prod[4],
            "codigo": prod[5],
            "stock":prod[6],
            "imagen": url_imagen
        })

    return jsonify(productos_list)

@app.route('/api/metodos_pago', methods=['GET'])
def obtener_metodos_pago():
    try:
        # Obtener métodos de pago de la base de datos
        metodos = conn_db.seleccionar("tipos_pago", "id, nombre")
        
        if not metodos:
            return jsonify({
                'mensaje': 'No se encontraron métodos de pago',
                'metodos': [],
                'total': 0
            }), 404
        
        # Formatear la respuesta
        metodos_formateados = [{
            "id": metodo[0],
            "nombre": metodo[1]
        } for metodo in metodos]
        
        return jsonify({
            'metodos': metodos_formateados,
            'total': len(metodos_formateados)
        }), 200
    
    except Exception as e:
        print(f"Error al obtener métodos de pago: {str(e)}")
        return jsonify({
            'mensaje': 'Error interno al recuperar métodos de pago',
            'error': str(e)
        }), 500

# Rutas para la API de entregas diarias

@app.route('/informes')
def entregas_diarias():
    return render_template('informes.html')

@app.route('/datos_empresa')
def datos_empresa():
    return render_template('datos_empresa.html')

@app.route('/api/entregas', methods=['GET'])
def obtener_entregas():
    try:
        # Parámetro opcional para limitar la cantidad de entregas
        limit = request.args.get('limit', 10, type=int)
        
        # Consulta para obtener las entregas más recientes
        entregas = conn_db.ejecutar_personalizado('''
            SELECT e.id, e.fecha, e.responsable, e.observaciones
            FROM entregas e
            ORDER BY e.fecha DESC
            LIMIT ?
        ''', (limit,))
        
        resultado = []
        for entrega in entregas:
            id_entrega = entrega[0]
            
            # Obtener los valores por tipo de pago para esta entrega
            valores = conn_db.ejecutar_personalizado('''
                SELECT tp.nombre, ev.valor
                FROM entrega_valores ev
                JOIN tipos_pago tp ON ev.id_tipo_pago = tp.id
                WHERE ev.id_entrega = ?
            ''', (id_entrega,))
            
            # Convertir valores a un diccionario
            valores_dict = {tipo: float(valor) for tipo, valor in valores}
            
            # Agregar entrega al resultado
            resultado.append({
                "id": id_entrega,
                "fecha": entrega[1],
                "responsable": entrega[2],
                "observaciones": entrega[3],
                "valores": valores_dict
            })
        
        return jsonify({"entregas": resultado})
    
    except Exception as e:
        print(f"Error al obtener entregas: {e}")
        return jsonify({"error": "Error al obtener entregas", "mensaje": str(e)}), 500

@app.route('/api/entregas/<int:id>', methods=['GET'])
def obtener_entrega(id):
    try:
        # Obtener datos de la entrega
        entrega = conn_db.ejecutar_personalizado('''
            SELECT id, fecha, responsable, observaciones
            FROM entregas
            WHERE id = ?
        ''', (id,))
        
        if not entrega:
            return jsonify({"error": "Entrega no encontrada"}), 404
        
        # Obtener valores por tipo de pago
        valores = conn_db.ejecutar_personalizado('''
            SELECT tp.nombre, ev.valor
            FROM entrega_valores ev
            JOIN tipos_pago tp ON ev.id_tipo_pago = tp.id
            WHERE ev.id_entrega = ?
        ''', (id,))
        
        # Convertir a diccionario
        valores_dict = {tipo: float(valor) for tipo, valor in valores}
        
        # Construir respuesta
        resultado = {
            "id": entrega[0][0],
            "fecha": entrega[0][1],
            "responsable": entrega[0][2],
            "observaciones": entrega[0][3],
            "valores": valores_dict
        }
        
        return jsonify(resultado)
    
    except Exception as e:
        print(f"Error al obtener detalle de entrega: {e}")
        return jsonify({"error": "Error al obtener detalle de entrega", "mensaje": str(e)}), 500

@app.route('/api/entregas', methods=['POST'])
def crear_entrega():
    try:
        datos = request.get_json()
        
        # Validar datos requeridos
        if not datos or 'fecha' not in datos or 'responsable' not in datos or 'valores' not in datos:
            return jsonify({"error": "Faltan datos requeridos"}), 400
        
        # Validar que haya al menos un valor
        if not datos['valores']:
            return jsonify({"error": "Debe incluir al menos un valor"}), 400
        
        # Insertar en la tabla de entregas
        resultado = conn_db.ejecutar_consulta('''
            INSERT INTO entregas (fecha, responsable, observaciones, fecha_registro)
            VALUES (?, ?, ?, datetime('now'))
        ''', (datos['fecha'], datos['responsable'], datos.get('observaciones', '')))
        
        if isinstance(resultado, dict) and "error" in resultado:
            return jsonify({"error": "Error al crear entrega", "mensaje": resultado["error"]}), 500
        
        id_entrega = resultado
        
        # Insertar valores por tipo de pago
        for tipo_pago, valor in datos['valores'].items():
            # Obtener ID del tipo de pago
            tipo = conn_db.seleccionar("tipos_pago", "id", "nombre = ?", (tipo_pago,))
            
            if not tipo:
                # Si no existe el tipo de pago, crearlo
                conn_db.insertar("tipos_pago", {"nombre": tipo_pago, "descripcion": f"Creado automáticamente"})
                tipo = conn_db.seleccionar("tipos_pago", "id", "nombre = ?", (tipo_pago,))
            
            id_tipo_pago = tipo[0][0]
            
            # Insertar valor
            conn_db.ejecutar_consulta('''
                INSERT INTO entrega_valores (id_entrega, id_tipo_pago, valor)
                VALUES (?, ?, ?)
            ''', (id_entrega, id_tipo_pago, valor))
        
        return jsonify({"mensaje": "Entrega creada exitosamente", "id": id_entrega})
    
    except Exception as e:
        print(f"Error al crear entrega: {e}")
        return jsonify({"error": "Error al crear entrega", "mensaje": str(e)}), 500

@app.route('/api/clientes', methods=['GET'])
def obtener_clientes():
    try:
        # Obtener todos los proveedores activos
        clientes = conn_db.seleccionar(
            tabla="clientes",
            columnas="numero, nombre"
        )
        print(clientes)

        # Construir una lista de diccionarios con los datos de los proveedores
        lista_clientes = [
            {
                "documento": cliente[0],
                "nombre": cliente[1]
            }
            for cliente in clientes
        ]

        # Retornar la lista de proveedores en formato JSON
        return jsonify(lista_clientes), 200
    except Exception as e:
        print(f"Error al cargar proveedores: {e}")
        return jsonify({"error": "Error al cargar proveedores"}), 500

@app.route('/api/clientes', methods=['POST'])
def crear_o_actualizar_cliente():
    try:
        data = request.get_json()
        nombre = data.get("nombre")
        tipo_documento = data.get("tipo_document")
        numero = data.get("numero")
        telefono = data.get("telefono")
        email = data.get("email")

        if not nombre or not numero:
            return jsonify({"error": "Nombre y número de documento son obligatorios"}), 400

        # Verificar si el cliente ya existe
        cliente_existente = conn_db.seleccionar(
            tabla="clientes",
            columnas="numero",
            condicion="numero = ?",
            parametros=(numero,)
        )

        if cliente_existente:
            # Actualizar cliente existente
            conn_db.actualizar(
                tabla="clientes",
                datos={
                    "nombre": nombre,
                    "tipo_documento": tipo_documento,
                    "telefono": telefono,
                    "email": email
                },
                condicion="numero = ?",
                parametros_condicion=(numero,)
            )
        else:
            # Insertar nuevo cliente
            _, error = conn_db.insertar(
                tabla="clientes",
                datos={
                    "numero": numero,
                    "nombre": nombre,
                    "tipo_documento": tipo_documento,
                    "telefono": telefono,
                    "email": email
                }
            )
            if error:
                return jsonify(error), 400

        return jsonify({
            "numero": numero,
            "nombre": nombre
        }), 200

    except Exception as e:
        print(f"❌ Error en /api/clientes: {e}")
        return jsonify({"error": "Error interno al guardar cliente"}), 500

@app.route('/api/login-segunda', methods=['POST'])
def login():
    try:
        datos = request.get_json()
        
        # Validar campos requeridos
        if not datos or 'usuario' not in datos or 'contrasena' not in datos:
            return jsonify({
                "valido": False,
                "mensaje": "Se requieren usuario y contraseña"
            }), 400
        
        # Validar credenciales
        resultado = conn_db.validar_credenciales(
            tabla="usuarios",
            usuario=datos['usuario'],
            contrasena=datos['contrasena']
        )
        
        # Limpiar datos sensibles en la respuesta
        if resultado['valido']:
            respuesta = {
                "valido": True,
                "mensaje": "Autenticación exitosa",
                "id": resultado["id_usuario"],
                "rol": resultado["rol"],
                "usuario": datos['usuario']
            }
            return jsonify(respuesta), 200
        else:
            return jsonify({
                "valido": False,
                "mensaje": resultado["mensaje"]
            }), 401
            
    except Exception as e:
        print(f"Error en login: {str(e)}")
        return jsonify({
            "valido": False,
            "mensaje": "Error interno del servidor"
        }), 500
   
# API cargar usuarios
@app.route("/api/cargar/usuarios", methods=["GET"])
def cargar_usuarios():
    usuarios = conn_db.seleccionar(
        tabla="usuarios",
        columnas="id, nombre, rol, email, telefono",
        condicion = "estado = 1 AND rol != 'superAdmin'"


    )
    if usuarios:
        lista_usuarios = [
            {
                "id": id_,
                "nombre": nombre,
                "rol": rol,
                "email": email,
                "telefono": telefono
            }
            for id_, nombre, rol, email, telefono in usuarios
        ]
        return jsonify(lista_usuarios), 200
    else:
        return jsonify([]), 200

#API Editar usuario
@app.route("/api/usuarios/<int:id_usuario>", methods=["PUT"])
def editar_usuario(id_usuario):
    datos = request.get_json()
    if not datos:
        return jsonify({"error": "No se enviaron datos"}), 400

    campos_validos = ['nombre', 'email', 'telefono', 'rol', 'contrasena']
    datos_actualizar = {}

    for campo in campos_validos:
        valor = datos.get(campo)
        if campo == 'contrasena' and valor:
            import bcrypt
            hashed = bcrypt.hashpw(valor.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            datos_actualizar['contrasena'] = hashed
        elif campo != 'contrasena' and valor is not None:
            datos_actualizar[campo] = valor

    if not datos_actualizar:
        return jsonify({"error": "No se proporcionaron campos válidos"}), 400

    try:
        conn_db.actualizar(
            tabla="usuarios",
            datos=datos_actualizar,
            condicion="id = ?",
            parametros_condicion=(id_usuario,)
        )
        return jsonify({"mensaje": "Usuario actualizado correctamente"}), 200
    except Exception as e:
        print(f"Error al actualizar usuario: {e}")
        return jsonify({"error": "Error al actualizar usuario"}), 500

#API Eliminar usuario
@app.route("/api/usuarios/<int:id_usuario>", methods=["DELETE"])
def eliminar_usuario(id_usuario):
    try:
        conn_db.actualizar(
            tabla="usuarios",
            datos={"estado": 0},
            condicion="id = ?",
            parametros_condicion=(id_usuario,)
        )
        return jsonify({"mensaje": "Usuario desactivado correctamente"}), 200
    except Exception as e:
        print(f"Error al eliminar usuario: {e}")
        return jsonify({"error": "Error al eliminar usuario"}), 500

# API guardar usuario
@app.route("/api/new_usuario", methods = ["POST"])
def new_usuario():
    datos = request.get_json()

    datos["contrasena"] = bcrypt.hashpw(datos["contrasena"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    id_usuario, error = conn_db.insertar(tabla="usuarios", datos=datos)
    print(id_usuario, error)
    if id_usuario:        
        usuario = {"id":id_usuario, "nombre":datos["nombre"], "rol":datos["rol"]}
        return jsonify(usuario), 200
    else:
        return jsonify({
            "valido": False,
            "mensaje": "Usuario no registrado",
            "error": error
        }), 401      

#
@app.route("/api/monedero_dia_actual", methods = ["GET"])
def cargar_monedero():
    fecha =  datetime.now().strftime("%Y-%m-%d")
    
    
# Api guardar monederos
@app.route('/api/tipos_pago', methods=['POST'])
def insertar_tipo_pago():
    data = request.get_json()

    nombre = data.get('nombre')
    descripcion = data.get('descripcion', '')

    if not nombre:
        return jsonify({'ok': False, 'error': 'El nombre es obligatorio'}), 400

    try:
        id_pagos = conn_db.insertar("tipos_pago", {"nombre":nombre, "descripcion":descripcion});
        conn_db.insertar("caja_mayor", {"nombre":nombre, "descripcion":descripcion});
        return jsonify({'ok': True, 'id': id_pagos}), 201
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/api/turno/cerrar_dia', methods=['POST'])
def cerrar_turno():
    data = request.get_json()
    print(data)
    if not data:
        return jsonify({'ok': False, 'error': 'Datos vacios'}), 400
    try:
        return jsonify({'ok': True, 'mensaje': "Regisstro exitoso"}), 201
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500
    
@app.route('/api/lista/servicios', methods=['GET'])
def obtener_servicios():
    try:
        servicios = conn_db.ejecutar_personalizado('''
            SELECT o.id, o.estado_entrada, o.fecha, es.estado
            FROM ordenes o
            LEFT JOIN estados_servicios es ON o.estado = es.id
        ''')

        resultado = []
        conteo_estados = {}

        for id_orden, descripcion, fecha, estado in servicios:
            estado = estado or "Desconocido"
            conteo_estados[estado] = conteo_estados.get(estado, 0) + 1
            resultado.append({
                "id": id_orden,
                "descripcion": descripcion,
                "fecha": fecha,
                "estado": estado
            })

        return jsonify({
            "servicios": resultado,
            "conteo_estados": conteo_estados
        })

    except Exception as e:
        print(f"Error al obtener resumen de servicios: {e}")
        return jsonify({"error": "Error al obtener servicios"}), 500

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000, debug=True, allow_unsafe_werkzeug=True)
    