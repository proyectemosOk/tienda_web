# conexion_base.py
import sqlite3
from firebase_config import ServicioFirebase
from crear_bd import crear_tablas
import bcrypt
from typing import Dict, Union
from datetime import datetime

class ConexionBase:
    def __init__(self, nombre_bd: str, ruta_credenciales_firebase: str = None):
        self.nombre_bd = nombre_bd
        self.firebase = None
        self.conn_actual = None  # Para manejar transacciones
        crear_tablas(nombre_bd)

        if ruta_credenciales_firebase:
            try:
                self.firebase = ServicioFirebase(ruta_credenciales_firebase)
                print(f"✅ Firebase conectado con: {ruta_credenciales_firebase}")
            except Exception as e:
                print(f"❌ Error al inicializar Firebase: {e}")

    def conectar(self):
        return sqlite3.connect(self.nombre_bd)

    # 🔄 Transacciones
    def iniciar_transaccion(self):
        self.conn_actual = self.conectar()
        self.conn_actual.execute("BEGIN")

    def confirmar_transaccion(self):
        if self.conn_actual:
            self.conn_actual.commit()
            self.conn_actual.close()
            self.conn_actual = None

    def revertir_transaccion(self):
        if self.conn_actual:
            self.conn_actual.rollback()
            self.conn_actual.close()
            self.conn_actual = None

    # 🧠 Método interno para obtener conexión activa o nueva
    def _get_conexion_y_cursor(self):
        if self.conn_actual:
            return self.conn_actual, self.conn_actual.cursor()
        conn = self.conectar()
        return conn, conn.cursor()

    def ejecutar_consulta(self, consulta, parametros=()):
        conexion, cursor = self._get_conexion_y_cursor()
        try:
            cursor.execute(consulta, parametros)
            if not self.conn_actual:
                conexion.commit()
            if consulta.strip().upper().startswith("INSERT"):
                id_reg = cursor.lastrowid
            # Insertar en registro_modificaciones después de ejecutar la consulta original
            # Construir texto para campo detalle con consulta + parámetros
            detalle_texto = f"Consulta ejecutada: {consulta} | Parámetros: {parametros}"

            # Datos fijos que me pediste
            id_producto = 2
            id_usuario = 3

            # Insertar registro en registro_modificaciones
            insert_log = """
                INSERT INTO registro_modificaciones (id_producto, id_usuario, fecha_hora, detalle)
                VALUES (?, ?, datetime('now'), ?)
            """
            cursor.execute(insert_log, (id_producto, id_usuario, detalle_texto))
            if not self.conn_actual:
                conexion.commit()

            if consulta.strip().upper().startswith("INSERT"):
                return id_reg
            return None

        except sqlite3.IntegrityError as e:
            mensaje = str(e)
            if "UNIQUE constraint failed" in mensaje:
                partes = mensaje.split(':')
                if len(partes) > 1:
                    columna = partes[1].strip().split('.')[-1]
                    return {"error": "El valor ya existe en la columna.", "columna": columna}
                return {"error": "El valor ya existe en una columna."}
            return {"error": mensaje}
        except sqlite3.Error as e:
            return {"error": str(e)}
        finally:
            if not self.conn_actual:
                conexion.close()


    def insertar(self, tabla, datos, expresion_sql=False):
        columnas, placeholders, valores = [], [], []
        if expresion_sql:
            for col, val in datos.items():
                columnas.append(col)
                if isinstance(val, str) and val.strip().lower().endswith(')'):
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


        if isinstance(resultado, dict) and "error" in resultado:
            return None, resultado

        id_generado = resultado

        # Firebase
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

        conexion, cursor = self._get_conexion_y_cursor()
        try:
            cursor.execute(consulta, parametros)
            return cursor.fetchall()
        except sqlite3.Error as e:
            print(f"❌ Error SELECT: {e}")
            return []
        finally:
            if not self.conn_actual:
                conexion.close()

    def existe_registro(self, tabla, columna, valor):
        return bool(self.seleccionar(tabla, columnas=columna, condicion=f"{columna} = ?", parametros=(valor,)))

    def actualizar(self, tabla, datos, condicion, parametros_condicion=(), expresion_sql=False):
        if expresion_sql:
            asignaciones = ", ".join(f"{col} = {val}" for col, val in datos.items())
            valores = parametros_condicion
        else:
            asignaciones = ", ".join(f"{col} = ?" for col in datos.keys())
            valores = tuple(datos.values()) + tuple(parametros_condicion)

        consulta = f"UPDATE {tabla} SET {asignaciones} WHERE {condicion}"
        conexion, cursor = self._get_conexion_y_cursor()
        try:
            cursor.execute(consulta, valores)
            if not self.conn_actual:
                conexion.commit()
        except sqlite3.Error as e:
            print(f"❌ Error actualizando {tabla}: {e}")
        finally:
            if not self.conn_actual:
                conexion.close()

    def eliminar(self, tabla, condicion, parametros=()):
        consulta = f"DELETE FROM {tabla} WHERE {condicion}"
        self.ejecutar_consulta(consulta, parametros)

    def contar(self, tabla, condicion=None, parametros=()):
        consulta = f"SELECT COUNT(*) FROM {tabla}"
        if condicion:
            consulta += f" WHERE {condicion}"
        conexion, cursor = self._get_conexion_y_cursor()
        try:
            cursor.execute(consulta, parametros)
            return cursor.fetchone()[0]
        except sqlite3.Error as e:
            print(f"❌ Error COUNT: {e}")
            return None
        finally:
            if not self.conn_actual:
                conexion.close()

    def ejecutar_personalizado(self, consulta, parametros=()):
        conexion, cursor = self._get_conexion_y_cursor()
        try:
            cursor.execute(consulta, parametros)
            return cursor.fetchall()
        except sqlite3.Error as e:
            print(f"❌ Error consulta personalizada: {e}")
            return None
        finally:
            if not self.conn_actual:
                conexion.commit()
                conexion.close()

    def ejecutar_personalizado_1(self, consulta, parametros=None):
        with self.conectar() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(consulta, parametros or ())
            resultados = cursor.fetchall()
            return [dict(row) for row in resultados]
    
    def registrar_modificacion(self, producto_id, usuario_id, detalle):
        """Inserta un registro en la tabla registro_modificaciones."""
        datos_modificacion = {
            "id_producto": producto_id,
            "id_usuario": usuario_id,
            "fecha_hora": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "detalle": detalle
        }
        # Insertar directamente en la tabla sin trigger de nuevo log para evitar recursión
        # Se puede usar el método ejecutar_consulta para evitar log anidado
        consulta = "INSERT INTO registro_modificaciones (id_producto, id_usuario, fecha_hora, detalle) VALUES (?, ?, ?, ?)"
        parametros = (producto_id, usuario_id, datos_modificacion["fecha_hora"], detalle)
        conexion, cursor = self._get_conexion_y_cursor()
        try:
            cursor.execute(consulta, parametros)
            if not self.conn_actual:
                conexion.commit()
        except Exception as e:
            print(f"Error al registrar modificación: {e}")
        finally:
            if not self.conn_actual:
                conexion.close()

    
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
        consulta = """
            SELECT o.id, o.estado_entrada, o.fecha, e.estado
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

