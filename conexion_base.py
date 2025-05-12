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

    def actualizar(self, tabla, datos, condicion, parametros_condicion):
        asignaciones = ", ".join(f"{col} = ?" for col in datos.keys())
        valores = tuple(datos.values())
        consulta = f"UPDATE {tabla} SET {asignaciones} WHERE {condicion}"
        self.ejecutar_consulta(consulta, valores + parametros_condicion)

        if self.firebase:
            doc_id = str(parametros_condicion[0])
            try:
                self.firebase.db.collection(tabla).document(doc_id).update(datos)
                print(f"🔁 Documento '{doc_id}' actualizado en Firebase colección '{tabla}'.")
            except Exception as e:
                print(f"⚠️ Error actualizando Firebase: {e}")

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
