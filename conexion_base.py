# conexion_base.py
import sqlite3
from firebase_config import ServicioFirebase
import bcrypt
from crear_bd import crear_tablas
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
        except sqlite3.Error as e:
            print(f"❌ Error al ejecutar consulta:\n{consulta}\n{e}")
            return None
        finally:
            conexion.close()

    def insertar(self, tabla, datos):
        columnas = ", ".join(datos.keys())
        valores = tuple(datos.values())
        placeholders = ", ".join("?" for _ in datos)
        consulta = f"INSERT INTO {tabla} ({columnas}) VALUES ({placeholders})"
        id_generado = self.ejecutar_consulta(consulta, valores)

        if self.firebase and id_generado:
            try:
                datos_con_id = datos.copy()
                datos_con_id["id"] = id_generado
                self.firebase.db.collection(tabla).document(str(id_generado)).set(datos_con_id)
                print(f"🔥 Documento '{id_generado}' insertado en Firebase colección '{tabla}'.")
            except Exception as e:
                print(f"⚠️ Error subiendo a Firebase: {e}")
        return id_generado

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

    def validar_credenciales(self,tabla: str, usuario: str, contrasena: str) -> dict:
        """
        Valida las credenciales del usuario contra la base de datos.

        :param usuario: Usuario ingresado.
        :param contrasena: Contraseña ingresada en texto claro.
        :return: Diccionario con resultado de validación.
        """
        # resultado = self.seleccionar(tabla=tabla, columnas="id, contrasena, base_datos", condicion="usuario = ?", parametros=(usuario,))
        resultado = self.seleccionar(tabla=tabla,columnas="id, contrasena, rol", condicion="usuario=?",parametros=(usuario,))
        print(resultado)
        if not resultado:
            return {"valido": False, "mensaje": "Usuario no encontrado."}
        
        id_usuario, info, rol = resultado[0]

        try:
            if bcrypt.checkpw(contrasena.encode('utf-8'), info.encode('utf-8')):
                return {
                    "valido": True,
                    "mensaje": "Login exitoso",
                    "id_usuario": id_usuario,
                    "rol": rol,
                    "info": info
                }
            else:
                return {"valido": False, "mensaje": "Contraseña incorrecta."}
        except Exception as e:
            return {"valido": False, "mensaje": f"Error validando contraseña: {str(e)}"}

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
