import sqlite3
import bcrypt

def crear_usuarios_admin_y_ventas(nombre_bd="tienda_jfleong6_1.db"):
    conexion = sqlite3.connect(nombre_bd)
    cursor = conexion.cursor()

    try:
        # Hashear contraseñas
        contrasena_admin = bcrypt.hashpw("4dm1n321".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        contrasena_ventas = bcrypt.hashpw("V3nt45321".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Insertar usuarios si no existen
        usuarios = [
            ("Administrador", contrasena_admin, "admin@correo.com", "1111111111", "admin"),
            ("Ventas", contrasena_ventas, "ventas@correo.com", "2222222222", "ventas")
        ]

        for usuario in usuarios:
            try:
                cursor.execute('''
                    INSERT INTO usuarios (nombre, contrasena, email, telefono, rol)
                    VALUES (?, ?, ?, ?, ?)
                ''', usuario)
            except sqlite3.IntegrityError:
                print(f"⚠️ Usuario '{usuario[0]}' ya existe. Omitido.")

        conexion.commit()
        print("✅ Usuarios creados (o ya existentes) con éxito.")

    except Exception as e:
        print("❌ Error al crear usuarios:", e)
        conexion.rollback()

    finally:
        conexion.close()

if __name__ == "__main__":
    crear_usuarios_admin_y_ventas()
