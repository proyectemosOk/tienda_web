from flask import Flask, render_template, request, redirect, url_for, jsonify, send_from_directory
import os
from conexion_base import *
from orden import Orden
from firebase_config import ServicioFirebase
from crear_bd import crear_tablas
import bcrypt
from typing import Dict, Union

import os
import sys



  # Asegura que la carpeta exista

app = Flask(__name__)
app.register_blueprint(extras)  
app.register_blueprint(facturas_bp)
app.register_blueprint(empresa_bp)
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
os.makedirs(IMAGES_FOLDER, exist_ok=True)
# Ruta personalizada para servir imágenes desde static/img_productos
@app.route('/img_productos/<path:filename>')
def serve_img_productos(filename):
    return send_from_directory(IMAGES_FOLDER, filename)

def obtener_id_por_nombre(tabla, buscar, columna):
    resultado = conn_db.seleccionar(tabla, "id", f"{columna} = ?", (buscar,))

    def ejecutar_consulta(self, consulta, parametros=()):
        conexion = self.conectar()
        cursor = conexion.cursor()
        try:
            cursor.execute(consulta, parametros)
            conexion.commit()
            if consulta.strip().upper().startswith("INSERT"):
                return cursor.lastrowid
            return None
        except sqlite3.IntegrityError as e:
            mensaje = str(e)
            if "UNIQUE constraint failed" in mensaje:
                # Extraer el nombre de la columna del mensaje
                # Ejemplo: 'UNIQUE constraint failed: tabla.columna'
                parts = mensaje.split(':')
                if len(parts) > 1:
                    columna_info = parts[1].strip()  # 'tabla.columna'
                    columna = columna_info.split('.')[-1]  # 'columna'
                    return {"error": "El valor ya existe en la columna.", "columna": columna}
                else:
                    return {"error": "El valor ya existe en una columna."}
            else:
                return {"error": mensaje}
        except sqlite3.Error as e:
            return {"error": str(e)}
        finally:
            
            conexion.close()


    def insertar(self, tabla, datos, expresion_sql=False):
        columnas = []
        placeholders = []
        valores = []

        if expresion_sql:
            for col, val in datos.items():
                columnas.append(col)
                if isinstance(val, str) and val.strip().lower().endswith(')'):
                    # Asumimos que es una función SQL
                    placeholders.append(val)
                else:
                    placeholders.append("?")
                    valores.append(val)
        else:
            columnas = list(datos.keys())
            placeholders = ["?"] * len(datos)
            valores = list(datos.values())

        columnas_sql = ", ".join(columnas)
        placeholders_sql = ", ".join(placeholders)

        consulta = f"INSERT INTO {tabla} ({columnas_sql}) VALUES ({placeholders_sql})"

        resultado = self.ejecutar_consulta(consulta, tuple(valores))
        print(consulta, valores)
        print(resultado)

        # Verificar errores UNIQUE
        if isinstance(resultado, dict) and "error" in resultado:
            if "columna" in resultado:
                return None, {"error": resultado["error"], "columna": resultado["columna"]}
            else:
                return None, {"error": resultado["error"]}

        id_generado = resultado

        if self.firebase and id_generado:
            try:
                datos_con_id = datos.copy()
                datos_con_id["id"] = id_generado
                self.firebase.db.collection(tabla).document(str(id_generado)).set(datos_con_id)
                print(f"🔥 Documento '{id_generado}' insertado en Firebase colección '{tabla}'.")
            except Exception as e:
                print(f"⚠️ Error subiendo a Firebase: {e}")

        return id_generado, None



    def seleccionar(self, tabla, columnas="*", condicion=None, parametros=()):
        consulta = f"SELECT {columnas} FROM {tabla}"
        if condicion:
            consulta += f" WHERE {condicion}"
        conexion = self.conectar()
        cursor = conexion.cursor()
        try:
            cursor.execute(consulta, parametros)
            return cursor.fetchall()
        except sqlite3.Error as e:
            print(f"❌ Error SELECT: {e}")
            return []
        finally:
            conexion.close()

    def existe_registro(self, tabla, columna, valor):
        return bool(self.seleccionar(tabla, columnas=columna, condicion=f"{columna} = ?", parametros=(valor,)))

    def actualizar(self, tabla, datos, condicion, parametros_condicion=(), expresion_sql=False):
        """
        Actualiza registros en la tabla.
        
        Si expresion_sql es True, los valores en 'datos' serán tratados como expresiones SQL sin comillas.
        """
        if expresion_sql:
            asignaciones = ", ".join(f"{col} = {val}" for col, val in datos.items())
            valores = parametros_condicion
        else:
            asignaciones = ", ".join(f"{col} = ?" for col in datos.keys())
            valores = tuple(datos.values()) + tuple(parametros_condicion)
        
        consulta = f"UPDATE {tabla} SET {asignaciones} WHERE {condicion}"
        conexion = self.conectar()
        cursor = conexion.cursor()
        try:
            cursor.execute(consulta, valores)
            conexion.commit()
        except sqlite3.Error as e:
            print(f"❌ Error actualizando {tabla}: {e}")
        finally:
            conexion.close()

    def eliminar(self, tabla, condicion, parametros=()):
        consulta = f"DELETE FROM {tabla} WHERE {condicion}"
        self.ejecutar_consulta(consulta, parametros)

    def contar(self, tabla, condicion=None, parametros=()):
        consulta = f"SELECT COUNT(*) FROM {tabla}"
        if condicion:
            consulta += f" WHERE {condicion}"
        conexion = self.conectar()
        cursor = conexion.cursor()
        try:
            cursor.execute(consulta, parametros)
            return cursor.fetchone()[0]
        except sqlite3.Error as e:
            print(f"❌ Error COUNT: {e}")
            return None
        finally:
            conexion.close()

    def ejecutar_personalizado(self, consulta, parametros=()):
        conexion = self.conectar()
        cursor = conexion.cursor()
        try:
            cursor.execute(consulta, parametros)
            return cursor.fetchall()
        except sqlite3.Error as e:
            print(f"❌ Error consulta personalizada: {e}")
            return None
        finally:
            conexion.commit()
            conexion.close()

    def ejecutar_personalizado_1(self, consulta, parametros=None):
        with self.conectar() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            if parametros:
                cursor.execute(consulta, parametros)
            else:
                cursor.execute(consulta)
            resultados = cursor.fetchall()
            return [dict(row) for row in resultados]

    def validar_credenciales(self, tabla: str, usuario: str, contrasena: str) -> Dict[str, Union[bool, str, int]]:
        """
        Valida credenciales de usuario con protección contra ataques comunes.
        
        Parámetros:
            tabla (str): Nombre de la tabla de usuarios
            usuario (str): Nombre de usuario ingresado
            contrasena (str): Contraseña en texto claro
            
        Retorna:
            dict: Resultado con estructura:
            {
                'valido': bool,
                'mensaje': str,
                'id_usuario': int (solo si válido),
                'rol': str (solo si válido)
            }
            
        Mejoras implementadas:
        - Validación de formato de hash
        - Protección contra timing attacks
        - Manejo seguro de errores
        - Eliminación de datos sensibles en respuesta
        """
        try:
            # 1. Validación básica de entrada
            if not all([usuario, contrasena]):
                return {"valido": False, "mensaje": "Credenciales incompletas"}
                
            # 2. Consulta segura con parámetros
            resultado = self.seleccionar(
                tabla=tabla,
                columnas="id, contrasena, rol",
                condicion="nombre = ?",
                parametros=(usuario,)
            )
            print(resultado)
            # 3. Validar existencia de usuario
            if not resultado or len(resultado[0]) != 3:
                return {"valido": False, "mensaje": "Credenciales inválidas"}
                
            id_usuario, hash_almacenado, rol = resultado[0]
            
            # 4. Verificar formato del hash
            if not hash_almacenado.startswith("$2b$"):
                
                return {"valido": False, "mensaje": "Error de configuración de seguridad"}
                
            # 5. Comparación segura contra timing attacks
            contraseña_valida = bcrypt.checkpw(
                contrasena.encode('utf-8'),
                hash_almacenado.encode('utf-8')
            )
            print(contraseña_valida)
            if contraseña_valida:
                return {
                    "valido": True,
                    "mensaje": "Autenticación exitosa",
                    "id_usuario": id_usuario,
                    "rol": rol
                }
            else:
                return {"valido": False, "mensaje": "Credenciales inválidas"}
                
        except bcrypt.CryptBackendError as e:
            # Loggear error sin exponer detalles
            print(f"Error de cifrado: {str(e)}")
            return {"valido": False, "mensaje": "Error del sistema"}
            
        except Exception as e:
            # Manejo genérico de errores
            print(f"Error inesperado: {str(e)}")
            return {"valido": False, "mensaje": "Error en el proceso de autenticación"}

        def registrar_cliente_seguro(self, cliente_data: dict) -> dict:
            """
            Registra un nuevo cliente en la base principal y genera su base de datos personalizada.
            
            :param cliente_data: Diccionario con los campos necesarios del cliente.
            :return: Diccionario con el resultado del registro.
            """
            try:
                # Separar datos
                email = cliente_data["email"]
                parte_email = email.split('@')[0]
                contrasena_hash = cliente_data["contrasena"]

                # Insertar cliente (base_datos es temporal aquí)
                cliente_data_temp = cliente_data.copy()
                cliente_data_temp["base_datos"] = ""
                cliente_data_temp["usuario"] = parte_email

                id_cliente = self.insertar("clientes", cliente_data_temp)

                # Crear nombre de base de datos personalizada
                base_datos = f"tienda_{parte_email}_{id_cliente}.db"

                # Actualizar cliente con base_datos real
                self.actualizar(
                    tabla="clientes",
                    datos={"base_datos": base_datos},
                    condicion="id = ?",
                    parametros_condicion=(id_cliente,)
                )

                # Crear la nueva base de datos del cliente
                crear_tablas(base_datos)

                # Insertar al usuario admin en su propia base de datos
                cliente_db = ConexionBase(base_datos)
                usuario_admin = {
                    "usuario": parte_email,
                    "contrasena": contrasena_hash,
                    "rol": "admin"
                }
                cliente_db.insertar("usuarios", usuario_admin)

                return {
                    "exito": True,
                    "usuario": parte_email,
                    "base_datos": base_datos,
                    "pass": contrasena_hash
                }

            except Exception as e:
                return {
                    "exito": False,
                    "error": f"Error al registrar cliente: {str(e)}"
                }

    def registrar_cierre_dia(self, data: dict):
        try:
            # Insertar en cierres_dia
            cierre_data = {
                "fecha": data["fecha"],
                "total_ingresos": data["total_ingresos"],
                "total_egresos": data["total_egresos"],
                "total_neto": data["total_neto"],
                "observaciones": data.get("observaciones", ""),
                "creado_por": data.get("creado_por", "")
            }
            cierre_id, error = self.insertar("cierres_dia", cierre_data)
            if error:
                return {"exito": False, "error": error}

            # Insertar en cierres_dia_detalle_pagos y movimientos
            for tipo_pago, contenido in data["tipos_pago"].items():
                monto_ingreso = contenido["monto"]
                self.insertar("cierres_dia_detalle_pagos", {
                    "cierre_id": cierre_id,
                    "tipo_pago": tipo_pago,
                    "monto": monto_ingreso
                })

                for tipo, ids in contenido["descripcion"].items():
                    for id_ref, monto in ids.items():
                        self.insertar("cierres_dia_movimientos", {
                            "cierre_id": cierre_id,
                            "tipo": tipo,
                            "id_referencia": id_ref,
                            "monto": monto,
                            "tipo_pago": tipo_pago
                        })

                # Actualizar monto en caja_mayor sumando ingresos
                self.actualizar("caja_mayor", {"monto": f"monto + {monto_ingreso}"}, {"nombre": tipo_pago}, expresion_sql=True)

            # Insertar en cierres_dia_detalle_categorias
            self.insertar("cierres_dia_detalle_categorias", {
                "cierre_id": cierre_id,
                "descripcion": "ventas_y_servicios",
                "monto": data["total_ingresos"]
            })
            self.insertar("cierres_dia_detalle_categorias", {
                "cierre_id": cierre_id,
                "descripcion": "gastos",
                "monto": data["total_egresos"]
            })

            # Restar gastos del monto en caja_mayor y registrar movimientos
            for tipo_pago, items in data.get("gastos", {}).items():
                if tipo_pago == "monto":
                    continue
                for id_ref, monto in items.items():
                    self.insertar("cierres_dia_movimientos", {
                        "cierre_id": cierre_id,
                        "tipo": "gasto",
                        "id_referencia": id_ref,
                        "monto": monto,
                        "tipo_pago": tipo_pago
                    })

                    # Actualizar monto en caja_mayor restando egresos
                    self.actualizar("caja_mayor", {"monto": f"monto - {monto}"}, {"nombre": tipo_pago}, expresion_sql=True)

            return {"exito": True, "cierre_id": cierre_id}

        except Exception as e:
            return {"exito": False, "error": str(e)}

    def obtener_resumen_ordenes(self):
        """
        Devuelve una lista de órdenes con ID, estado_entrada como Descripción,
        fecha como Fecha Ingreso y el estado (nombre) proveniente de la tabla estados_servicios.
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
        # Desglose global por método de pago
        fecha_hoy = date.today().isoformat()
        desglose_pagos = conn_db.ejecutar_personalizado('''
            SELECT tp.nombre AS metodo_pago, SUM(pv.valor) AS total
            FROM pagos_venta pv
            JOIN ventas v ON pv.venta_id = v.id
            JOIN tipos_pago tp ON pv.metodo_pago = tp.id
            WHERE DATE(v.fecha) = ?
            GROUP BY tp.nombre
        ''', ((fecha_hoy),))
        desglose = {metodo_pago: total for metodo_pago, total in desglose_pagos}
        ventas = conn_db.ejecutar_personalizado('''
            SELECT v.id, v.fecha, v.total_venta, c.nombre
            FROM ventas v
            JOIN clientes c ON v.cliente_id = c.id
            WHERE DATE(fecha) = ?
        ''',((fecha_hoy),))

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

        # Validar campos obligatorios
        campos_obligatorios = ['codigo', 'nombre', 'categoria', 'unidad', 'stock', 'precio_compra', 'precio_venta']
        for campo in campos_obligatorios:
            if campo not in data or not str(data[campo]).strip():
                return jsonify({"ok": False, "error": f"El campo '{campo}' es obligatorio."}), 400

        codigo = data['codigo'].strip()
        nombre = data['nombre'].strip()
        descripcion = data.get('descripcion', '').strip()
        categoria = data['categoria'].strip()
        unidad = data['unidad'].strip()
        unidad_simbolo = data.get('unidad_simbolo', '').strip() or None
        stock = int(data['stock'])
        precio_compra = float(data['precio_compra'])
        precio_venta = float(data['precio_venta'])

        # Validar valores numéricos
        if stock < 0 or precio_compra < 0 or precio_venta < 0:
            return jsonify({"ok": False, "error": "Valores numéricos no pueden ser negativos."}), 400

        # 1️⃣ Verificar/crear categoría
        cat_resultado = conn_db.seleccionar(
            "categorias", columnas="id, categoria", condicion="categoria = ?", parametros=(categoria,)
        )
        if not cat_resultado:
            conn_db.insertar("categorias", {"categoria": categoria})

        # 2️⃣ Verificar/crear unidad
        unidad_resultado = conn_db.seleccionar(
            "unidades", columnas="id, unidad", condicion="unidad = ?", parametros=(unidad,)
        )
        if not unidad_resultado:
            conn_db.insertar("unidades", {
                "unidad": unidad,
                "simbolo": unidad_simbolo
            })

        # 3️⃣ Insertar producto
        id_producto = conn_db.insertar("productos", {
            "codigo": codigo,
            "nombre": nombre,
            "descripcion": descripcion,
            "categoria": categoria,
            "unidad": unidad,
            "stock": stock,
            "precio_compra": precio_compra,
            "precio_venta": precio_venta,
            "activo": 1
        })

        return jsonify({"ok": True, "mensaje": "Producto creado exitosamente.", "id":id_producto})

    except Exception as e:
        print("Error en /api/productos:", e)
        return jsonify({"ok": False, "error": "Ocurrió un error al crear el producto."}), 500

@app.route('/api/productos/<int:id_producto>/imagen', methods=['POST'])
def subir_imagen_producto(id_producto):
    if 'imagen' not in request.files:
        return jsonify({"ok": False, "error": "No se envió ningún archivo"}), 400
    file = request.files['imagen']
    if file.filename == '':
        return jsonify({"ok": False, "error": "Nombre de archivo vacío"}), 400
    # Verificar extensión (opcional)
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
        return jsonify({"ok": False, "error": "Formato no permitido"}), 400
    # Guardar con nombre consistente
    filename = f"{id_producto}.png"
    filepath = os.path.join(IMAGES_FOLDER, filename)
    file.save(filepath)

    return jsonify({"ok": True, "mensaje": "Imagen guardada exitosamente"})

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
                "fechar_registro": "date('now', 'localtime')",
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
    productos = conn_db.seleccionar('productos', "id, nombre, precio_venta, categoria, descripcion, codigo, stock")
    productos_list = []

    for prod in productos:
        # Nueva URL: servida por la ruta personalizada, no por static
        url_imagen = f"/img_productos/{prod[0]}.png"
        productos_list.append({
            "id": prod[0],
            "nombre": prod[1],
            "precio": prod[2],
            "categoria": prod[3],
            "descripcion": prod[4],
            "codigo": prod[5],
            "stock": prod[6],
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
    if not all(campo in data for campo in ['vendedor_id', 'cliente_id', 'total_venta', 'metodos_pago', 'productos']):
        return jsonify({"error": "Campos requeridos faltantes"}), 400

    new_venta = {
        'vendedor_id': data['vendedor_id'],
        "cliente_id": data["cliente_id"],
        "total_venta": data["total_venta"],
        "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_compra": 0,
        "total_utilidad": 0
    }

    id, error = conn_db.insertar("ventas", new_venta)
    if not id:
        return jsonify({"valido": False, "mensaje": "Venta no registrada"}), 401

    total_precio_compra = 0

    for producto in data["productos"]:
        detalles_ventas = {
            "venta_id": id,
            "producto_id": producto["codigo"],
            "cantidad": producto["cantidad"],
            "precio_unitario": producto["precio_unitario"]
        }
        conn_db.insertar("detalles_ventas", detalles_ventas)

        # Actualizar stock
        can_sum = conn_db.seleccionar("productos", "stock", "id= ?", (producto["codigo"],))[0][0]
        nuevo_stock = (float(can_sum) if can_sum else 0) - float(producto["cantidad"])
        conn_db.actualizar("productos", {"stock": nuevo_stock}, "id = ?", (producto["codigo"],))

        # Obtener precio_compra directamente desde productos
        resultado = conn_db.seleccionar("productos", "precio_compra", "id= ?", (producto["codigo"],))
        if resultado:
            precio_compra = float(resultado[0][0])
        else:
            precio_compra = 0

        total_precio_compra += precio_compra * float(producto["cantidad"])

    total_precio_venta = sum(prod["precio_unitario"] * prod["cantidad"] for prod in data["productos"])
    total_utilidad = total_precio_venta - total_precio_compra

    for pago in data["metodos_pago"]:
        pago["metodo"] = conn_db.seleccionar("tipos_pago", "id", "nombre=?",(pago["metodo"],))[0][0]
        detalles_pagos = {
            "venta_id": id,
            "metodo_pago": pago["metodo"],
            "valor": pago["valor"],
            "usuario_id":data['vendedor_id']
        }
        conn_db.insertar("pagos_venta", detalles_pagos)
        conn_db.actualizar(
            "tipos_pago",
            {"actual": f"actual + {pago['valor']}"},
            "nombre = ?",
            (pago["metodo"],),
            expresion_sql=True
        )

    conn_db.actualizar("ventas", {
        "total_compra": total_precio_compra,
        "total_utilidad": total_utilidad
    }, "id = ?", (id,))


    return jsonify({
        "valido": True,
        "mensaje": f"Venta exitosa {id}",
        "id": id
    }), 200

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
            LEFT JOIN estados_servicios e ON o.estado = e.id
        """

        try:
            resultados = self.ejecutar_personalizado(consulta)
            if not resultados:
                return []

            resumen = []
            for fila in resultados:
                id_orden, descripcion, fecha_ingreso, estado_str = fila
                resumen.append({
                    "ID": id_orden,
                    "Descripción": descripcion,
                    "Fecha Ingreso": fecha_ingreso,
                    "Estado": estado_str or "Desconocido"
                })
            return resumen

        except Exception as e:
            print(f"❌ Error al obtener resumen de órdenes con JOIN: {e}")
            return []

