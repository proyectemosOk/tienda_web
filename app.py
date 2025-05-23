from flask import Flask, render_template, request, redirect, url_for, jsonify
import os
from conexion_base import *
from orden import Orden
from firebase_config import ServicioFirebase
from datetime import datetime, timedelta
import json
import socket
from werkzeug.utils import secure_filename

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'

IMAGES_FOLDER = 'static/img_productos'  # La carpeta de imágenes
DEFAULT_IMAGE = 'img.png'  # La imagen por defecto en la raíz del proyecto
conn_db = ConexionBase("tienda_jfleong6_1.db")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/login-sesion')
def login_sesion():
    return render_template('login-sesion.html')

@app.route('/orden')
def orden():
    return render_template('orden.html')

@app.route('/ventas')
def ventas():
    return render_template('vista_de_producto.html')

@app.route('/inventarios')
def inventarios():
    return render_template('gestor_inventario.html')

@app.route('/cierre_dia')
def cierre_dia():
    return render_template('cierre_dia.html')

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
    try:        
        # Si la columna existe, obtener productos inactivos
        lista_productos = conn_db.seleccionar(
            "productos", 
            "codigo, nombre, categoria, stock, precio_compra, precio_venta", 
            "activo = ?", 
            ('1',)
        )
               
        # Manejar el caso de lista vacía
        if not lista_productos:
            return jsonify({
                'mensaje': 'No se encontraron productos',
                'productos': [],
                'total': 0
            }), 400
        
        # Transformar la lista de productos
        productos_formateados = [
            {
                "codigo": str(items[0]),
                "nombre": items[1],
                "categoria": items[2],
                "stock": items[3],
                "precio_compra": float(items[4]),
                "precio_venta": float(items[5])
            } for items in lista_productos
        ]
        
        return jsonify({
            'productos': productos_formateados,
            'total': len(productos_formateados)
        }), 200
    
    except Exception as e:
        # Manejo de errores más detallado
        print(f"Error al obtener productos: {str(e)}")
        return jsonify({
            'mensaje': 'Error interno al recuperar productos',
            'error': str(e)
        }), 500

@app.route('/api/productos/<codigo>', methods=['GET'])
def obtener_producto(codigo):
    try:
        
        # Consulta para obtener todos los detalles del producto
        producto = conn_db.seleccionar("productos", "codigo, nombre, categoria, stock, precio_compra, precio_venta", "codigo = ?",(codigo,))
        
        # Formatear el resultado
        detalle_producto = {
            "categoria": producto[0][2],
            "codigo": producto[0][0],
            "nombre": producto[0][1],
            "precio_compra": float(producto[0][4]),
            "precio_venta": float(producto[0][5]),
            "stock": producto[0][3]
        }
        
        return jsonify(detalle_producto)
    
    except Exception as e:
        # Manejo de errores
        print(f"Error al obtener detalles del producto: {e}")
        return jsonify({
            "error": "Error interno del servidor",
            "mensaje": str(e)
        }), 500
    
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
            condicion="estado = ?",
            parametros=('1',)
        )[0][0] or 0

        # Desglose por método de pago
        desglose_pagos = conn_db.ejecutar_personalizado('''
            SELECT tp.nombre AS metodo_pago, SUM(pv.valor) AS total
            FROM pagos_venta pv
            JOIN ventas v ON pv.venta_id = v.id
            JOIN tipos_pago tp ON pv.metodo_pago = tp.nombre
            WHERE v.estado = ? 
            GROUP BY tp.nombre
        ''', ('1',))
        print(desglose_pagos)
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
            WHERE v.estado = ?
            GROUP BY v.id
        '''

        # Ejecutar la consulta
        ventas = conn_db.ejecutar_personalizado(consulta, ("1",))
        

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
            tabla="proveedores",
            datos={
                "codigo": nuevo_codigo,
                "nombre": datos["nombre"],
                "rut": datos["rut"],
                "direccion": datos.get("direccion"),
                "telefono": datos["telefono"],
                "email": datos.get("email"),
                "estado": 1
            }
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
    productos = conn_db.seleccionar('productos', "id, nombre, precio_compra, categoria, descripcion, codigo, stock")
    productos_list = []

    for prod in productos:
        url_imagen = f"/static/img_productos/{prod[0]}.png"
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
        } for metodo in metodos[0:3]]
        
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

@app.route('/api/estadisticas', methods=['GET'])
def obtener_estadisticas():
    try:
        # Obtener el período solicitado (semana, mes, año)
        periodo = request.args.get('periodo', 'semana')
        
        # Definir la consulta SQL según el período
        if periodo == 'semana':
            # Agrupar por semana
            consulta = '''
                SELECT 
                    strftime('%Y-%W', e.fecha) as periodo,
                    tp.nombre,
                    SUM(ev.valor) as total
                FROM entregas e
                JOIN entrega_valores ev ON e.id = ev.id_entrega
                JOIN tipos_pago tp ON ev.id_tipo_pago = tp.id
                GROUP BY periodo, tp.nombre
                ORDER BY periodo DESC
                LIMIT 12
            '''
        elif periodo == 'mes':
            # Agrupar por mes
            consulta = '''
                SELECT 
                    strftime('%Y-%m', e.fecha) as periodo,
                    tp.nombre,
                    SUM(ev.valor) as total
                FROM entregas e
                JOIN entrega_valores ev ON e.id = ev.id_entrega
                JOIN tipos_pago tp ON ev.id_tipo_pago = tp.id
                GROUP BY periodo, tp.nombre
                ORDER BY periodo DESC
                LIMIT 12
            '''
        else:  # año
            # Agrupar por año
            consulta = '''
                SELECT 
                    strftime('%Y', e.fecha) as periodo,
                    tp.nombre,
                    SUM(ev.valor) as total
                FROM entregas e
                JOIN entrega_valores ev ON e.id = ev.id_entrega
                JOIN tipos_pago tp ON ev.id_tipo_pago = tp.id
                GROUP BY periodo, tp.nombre
                ORDER BY periodo DESC
                LIMIT 5
            '''
        
        # Ejecutar la consulta
        datos = conn_db.ejecutar_personalizado(consulta)
        
        # Procesar los resultados para agruparlos por período
        periodos = {}
        for fila in datos:
            periodo_str = fila[0]
            tipo_pago = fila[1]
            valor = float(fila[2])
            
            if periodo_str not in periodos:
                periodos[periodo_str] = {
                    "periodo": periodo_str,
                    "valores": {}
                }
            
            periodos[periodo_str]["valores"][tipo_pago] = valor
        
        # Convertir a lista y ordenar por período
        resultado = list(periodos.values())
        resultado.sort(key=lambda x: x["periodo"], reverse=False)
        
        return jsonify(resultado)
    
    except Exception as e:
        print(f"Error al obtener estadísticas: {e}")
        return jsonify({"error": "Error al obtener estadísticas", "mensaje": str(e)}), 500

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
                "id_usuario": resultado["id_usuario"],
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
   
@app.route('/api/crear_venta', methods=['POST'])
def crear_venta():
    data = request.get_json()
    # Validación inicial
    if not all(campo in data for campo in ['vendedor_id', 'cliente_id', 'total_venta', 'metodos_pago', 'productos']):
        return jsonify({"error": "Campos requeridos faltantes"}), 400
    
    new_venta = {'vendedor_id': data['vendedor_id'],
                "cliente_id": data["cliente_id"],
                "total_venta": data["total_venta"],
                "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
    print(data)
    id, error = conn_db.insertar("ventas", new_venta)
    
    # Limpiar datos sensibles en la respuesta
    if id:
        
        for producto in data["productos"]:
            detalles_ventas = {"venta_id": id,
                               "producto_id":producto["codigo"],
                               "cantidad":producto["cantidad"],
                               "precio_unitario":producto["precio_unitario"]}
            conn_db.insertar("detalles_ventas", detalles_ventas)
            can_sum = conn_db.seleccionar("productos","stock","id= ?",(producto["codigo"],))[0][0]
            print(can_sum)
            actulizar = {"stock":float(can_sum) - float(producto["cantidad"])}
            conn_db.actualizar("productos",actulizar, "id = ?", (producto["codigo"],))
            
            # can_sum = conn_db.seleccionar("lotes_productos","id, cantidad","id_producto= ? ORDER BY fecha_ingreso DESC",(producto["codigo"],))            
            # print(can_sum)
            
        for pago in data["metodos_pago"]:
            detalles_pagos ={"venta_id": id,
                               "metodo":pago["metodo"],
                               "valor":pago["valor"]}
            conn_db.insertar("pagos_venta", detalles_pagos)
            
            can_sum = conn_db.seleccionar("tipos_pago","actual","nombre= ?",(pago["metodo"],))[0][0]
            
            actulizar = {"actual":float(pago["valor"])+float(can_sum)}
            conn_db.actualizar("tipos_pago",actulizar, "nombre = ?", (pago["metodo"],))
            
        respuesta = {
            "valido": True,
            "mensaje": f"Venta exitosa {id}"
        }
        return jsonify(respuesta), 200
    else:
        return jsonify({
            "valido": False,
            "mensaje": "Venta no registrada"
        }), 401

@app.route('/api/empresa', methods=['GET'])
def obtener_datos_empresa():
    try:
        empresa = conn_db.seleccionar("empresa", "*", "id = 1")
        if empresa:
            columnas = [desc[0] for desc in conn_db.cursor.description]
            datos = dict(zip(columnas, empresa[0]))
            return jsonify(datos), 200
        else:
            return jsonify({"mensaje": "No se encontraron datos de la empresa"}), 404
    except Exception as e:
        print(f"Error al obtener empresa: {e}")
        return jsonify({"error": "Error al obtener los datos de la empresa"}), 500

@app.route('/api/empresa', methods=['POST'])
def guardar_datos_empresa():
    try:
        datos = request.get_json()

        # Siempre se guarda en ID=1 (solo 1 empresa)
        if conn_db.existe_registro("empresa", "id", 1):
            conn_db.actualizar("empresa", datos, "id = ?", (1,))
        else:
            datos["id"] = 1
            conn_db.insertar("empresa", datos)

        return jsonify({"mensaje": "Datos de la empresa guardados correctamente"}), 200
    except Exception as e:
        print(f"Error al guardar empresa: {e}")
        return jsonify({"error": "Error al guardar los datos de la empresa"}), 500

@app.route('/api/empresa/logo', methods=['POST'])
def subir_logo_empresa():
    try:
        if 'logo' not in request.files:
            return jsonify({'error': 'No se envió ningún archivo'}), 400

        archivo = request.files['logo']

        if archivo.filename == '':
            return jsonify({'error': 'Nombre de archivo vacío'}), 400

        # Validar que sea imagen
        if archivo and archivo.mimetype.startswith('image'):
            filename = secure_filename("logo_empresa.png")
            ruta_completa = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            archivo.save(ruta_completa)

            logo_url = f"/{app.config['UPLOAD_FOLDER']}/{filename}"

            # Actualizar en la base de datos
            if conn_db.existe_registro("empresa", "id", 1):
                conn_db.actualizar("empresa", {"logo_url": logo_url}, "id = ?", (1,))
            else:
                conn_db.insertar("empresa", {"id": 1, "logo_url": logo_url})

            return jsonify({"mensaje": "Logo subido exitosamente", "logo_url": logo_url}), 200

        return jsonify({'error': 'Archivo no válido'}), 400

    except Exception as e:
        print(f"Error al subir logo: {e}")
        return jsonify({"error": "Error interno al subir el logo"}), 500

@app.route('/datos_empresa')
def datos_empresa():
    return render_template('datos_empresa.html')

@app.route('/api/empresa', methods=['GET', 'POST'])
def api_empresa():
    if request.method == 'GET':
        # Obtener datos de la empresa desde la base
        datos = conn_db.seleccionar("datos", "dato, descripcion")
        resultado = {dato: descripcion for dato, descripcion in datos}
        return jsonify(resultado)

    elif request.method == 'POST':
        # Guardar datos recibidos en la base
        datos_recibidos = request.json  # Se espera JSON con claves y valores
        
        for clave, valor in datos_recibidos.items():
            # Actualizar o insertar dato en la tabla 'datos'
            # Intentamos actualizar primero
            conn = conn_db.conectar()
            cursor = conn.cursor()
            cursor.execute("UPDATE datos SET descripcion = ? WHERE dato = ?", (valor, clave))
            if cursor.rowcount == 0:
                # No existía, insertamos
                cursor.execute("INSERT INTO datos (dato, descripcion) VALUES (?, ?)", (clave, valor))
            conn.commit()
            cursor.close()
            conn.close()

        return jsonify({"mensaje": "Datos de empresa actualizados correctamente"})

# Ejemplo para obtener ventas del día (desglose por método de pago y listado)
@app.route('/api/informes/ventas', methods=['GET'])
def api_informes_ventas():
    try:
        # Obtener ventas activas del día
        fecha_hoy = datetime.now().strftime('%Y-%m-%d')
        
        # Total ventas por método de pago
        desglose_pagos = conn_db.ejecutar_personalizado('''
            SELECT tp.nombre, SUM(pv.valor)
            FROM pagos_venta pv
            JOIN ventas v ON pv.venta_id = v.id
            JOIN tipos_pago tp ON pv.metodo_pago = tp.nombre
            WHERE v.estado = 1 AND DATE(v.fecha) = ?
            GROUP BY tp.nombre
        ''', (fecha_hoy,))
        
        desglose = {item[0]: item[1] for item in desglose_pagos} if desglose_pagos else {}

        # Listado de ventas del día
        ventas = conn_db.ejecutar_personalizado('''
            SELECT v.id, v.fecha, v.total_venta,
            GROUP_CONCAT(tp.nombre, ', ') as metodos_pago
            FROM ventas v
            LEFT JOIN pagos_venta pv ON v.id = pv.venta_id
            LEFT JOIN tipos_pago tp ON pv.metodo_pago = tp.nombre
            WHERE v.estado = 1 AND DATE(v.fecha) = ?
            GROUP BY v.id
            ORDER BY v.fecha DESC
        ''', (fecha_hoy,))
        
        lista_ventas = []
        for v in ventas:
            lista_ventas.append({
                'id': v[0],
                'fecha': v[1],
                'total': v[2],
                'metodos_pago': v[3] if v[3] else ""
            })

        return jsonify({
            'desglose_pagos': desglose,
            'ventas': lista_ventas
        }), 200

    except Exception as e:
        print(f"Error API ventas: {e}")
        return jsonify({'error': 'Error al obtener ventas'}), 500

# API para servicios (conteo y listado)
@app.route('/api/informes/servicios', methods=['GET'])
def api_informes_servicios():
    try:
        # Contar servicios por estado
        estados = ['Pendiente', 'En Proceso', 'Listo', 'Entregado']
        conteos = {}
        for estado in estados:
            count = conn_db.contar('servicios', 'estado = ?', (estado,))
            conteos[estado] = count or 0

        # Listado servicios recientes (limit 10)
        servicios = conn_db.ejecutar_personalizado('''
            SELECT id, cliente, descripcion, fecha, estado
            FROM servicios
            ORDER BY fecha DESC
            LIMIT 10
        ''')

        lista_servicios = []
        if servicios:
            for s in servicios:
                lista_servicios.append({
                    'id': s[0],
                    'cliente': s[1],
                    'descripcion': s[2],
                    'fecha': s[3],
                    'estado': s[4]
                })

        return jsonify({
            'conteo_estados': conteos,
            'servicios': lista_servicios
        }), 200

    except Exception as e:
        print(f"Error API servicios: {e}")
        return jsonify({'error': 'Error al obtener servicios'}), 500

# API resumen general (totales y gráficos)
@app.route('/api/informes/resumen', methods=['GET'])
def api_informes_resumen():
    try:
        # Totales
        total_ventas = conn_db.ejecutar_personalizado('SELECT SUM(total_venta) FROM ventas WHERE estado = 1')[0][0] or 0
        total_servicios = conn_db.contar('servicios')
        total_productos = conn_db.contar('productos')
        total_clientes = conn_db.contar('clientes')

        # Ventas por categoría
        ventas_categoria = conn_db.ejecutar_personalizado('''
            SELECT categoria, SUM(total_venta)
            FROM ventas v
            JOIN detalles_ventas dv ON v.id = dv.venta_id
            JOIN productos p ON dv.producto_id = p.id
            WHERE v.estado = 1
            GROUP BY categoria
        ''')

        categorias = []
        datos_ventas = []
        if ventas_categoria:
            for cat, total in ventas_categoria:
                categorias.append(cat)
                datos_ventas.append(total)

        # Servicios por tipo
        servicios_tipo = conn_db.ejecutar_personalizado('''
            SELECT tipo, COUNT(*)
            FROM servicios
            GROUP BY tipo
        ''')
        tipos = []
        datos_servicios = []
        if servicios_tipo:
            for tipo, count in servicios_tipo:
                tipos.append(tipo)
                datos_servicios.append(count)

        return jsonify({
            'totales': {
                'ventas': total_ventas,
                'servicios': total_servicios,
                'productos': total_productos,
                'clientes': total_clientes
            },
            'ventas_categoria': {
                'categorias': categorias,
                'datos': datos_ventas
            },
            'servicios_tipo': {
                'tipos': tipos,
                'datos': datos_servicios
            }
        }), 200

    except Exception as e:
        print(f"Error API resumen: {e}")
        return jsonify({'error': 'Error al obtener resumen'}), 500

# API historial (filtrado)
@app.route('/api/informes/historial', methods=['GET'])
def api_informes_historial():
    try:
        tipo = request.args.get('tipo', 'todos')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')

        if not fecha_inicio or not fecha_fin:
            return jsonify({'error': 'Faltan fechas'}), 400

        fecha_inicio_dt = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        fecha_fin_dt = datetime.strptime(fecha_fin, '%Y-%m-%d')
        fecha_fin_dt = fecha_fin_dt.replace(hour=23, minute=59, second=59)

        registros = []

        # Consultas ejemplo para ventas y servicios
        if tipo in ['todos', 'ventas']:
            ventas = conn_db.ejecutar_personalizado('''
                SELECT id, fecha, 'Venta' as tipo, total_venta as total, 'Venta de productos' as descripcion
                FROM ventas
                WHERE estado = 1 AND fecha BETWEEN ? AND ?
            ''', (fecha_inicio, fecha_fin))
            for v in ventas:
                registros.append({
                    'id': v[0],
                    'tipo': v[2],
                    'fecha': v[1],
                    'descripcion': v[4],
                    'total': v[3]
                })

        if tipo in ['todos', 'servicios']:
            servicios = conn_db.ejecutar_personalizado('''
                SELECT id, fecha, 'Servicio' as tipo, costo as total, descripcion
                FROM servicios
                WHERE fecha BETWEEN ? AND ?
            ''', (fecha_inicio, fecha_fin))
            for s in servicios:
                registros.append({
                    'id': s[0],
                    'tipo': s[2],
                    'fecha': s[1],
                    'descripcion': s[4],
                    'total': s[3]
                })

        # Ordenar por fecha descendente
        registros.sort(key=lambda x: x['fecha'], reverse=True)

        return jsonify({'registros': registros}), 200

    except Exception as e:
        print(f"Error API historial: {e}")
        return jsonify({'error': 'Error al obtener historial'}), 500

# API estadísticas (ejemplo para ventas por período)
@app.route('/api/informes/estadisticas', methods=['GET'])
def api_informes_estadisticas():
    try:
        periodo = request.args.get('periodo', 'semana')  # semana, mes, año

        ahora = datetime.now()

        if periodo == 'semana':
            inicio = ahora - timedelta(days=7)
            formato_fecha = '%Y-%m-%d'
        elif periodo == 'mes':
            inicio = ahora - timedelta(days=30)
            formato_fecha = '%Y-%m-%d'
        elif periodo == 'año':
            inicio = ahora - timedelta(days=365)
            formato_fecha = '%Y-%m'
        else:
            inicio = ahora - timedelta(days=7)
            formato_fecha = '%Y-%m-%d'

        # Ejemplo: Ventas por día en el período
        ventas_periodo = conn_db.ejecutar_personalizado('''
            SELECT DATE(fecha) as dia, SUM(total_venta)
            FROM ventas
            WHERE estado = 1 AND fecha BETWEEN ? AND ?
            GROUP BY dia
            ORDER BY dia ASC
        ''', (inicio.strftime('%Y-%m-%d'), ahora.strftime('%Y-%m-%d')))

        etiquetas = []
        datos = []
        if ventas_periodo:
            for dia, total in ventas_periodo:
                etiquetas.append(dia)
                datos.append(total)

        return jsonify({
            'periodo': periodo,
            'etiquetas': etiquetas,
            'datos': datos
        }), 200

    except Exception as e:
        print(f"Error API estadisticas: {e}")
        return jsonify({'error': 'Error al obtener estadísticas'}), 500

if __name__ == '__main__':
    
    host_ip = socket.gethostbyname(socket.gethostname())  # Obtiene IP automáticamente
    print(f"Servidor corriendo en http://{host_ip}:5000")  # ✅ Se mostrará antes de iniciar
    app.run(debug=True, host=host_ip, port=5000)