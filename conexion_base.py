# conexion_base.py
import sqlite3
from firebase_config import ServicioFirebase
from crear_bd import crear_tablas
import bcrypt
from typing import Dict, Union

class ConexionBase:
    def __init__(self, nombre_bd: str, ruta_credenciales_firebase: str = None):
        """
        Inicializa la conexión a la base de datos SQLite y, opcionalmente, a Firebase.
        :param nombre_bd: Ruta a la base de datos SQLite.
        :param ruta_credenciales_firebase: Ruta al archivo JSON de credenciales de Firebase.
        """
        self.nombre_bd = nombre_bd
        self.firebase = None

        if ruta_credenciales_firebase:
            try:
                self.firebase = ServicioFirebase(ruta_credenciales_firebase)
                print(f"✅ Firebase conectado con: {ruta_credenciales_firebase}")
            except Exception as e:
                print(f"❌ Error al inicializar Firebase: {e}")

    def conectar(self):
        return sqlite3.connect(self.nombre_bd)

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


    def insertar(self, tabla, datos):

        columnas = ", ".join(datos.keys())
        valores = tuple(datos.values())
        placeholders = ", ".join("?" for _ in datos)
        consulta = f"INSERT INTO {tabla} ({columnas}) VALUES ({placeholders})"
        resultado = self.ejecutar_consulta(consulta, valores)

        # Verificar si hubo error por restricción UNIQUE
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
