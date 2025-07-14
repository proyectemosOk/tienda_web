import sqlite3
import bcrypt

def resetear_tabla_usuarios():
    conn = sqlite3.connect("tienda_jfleong6_1.db")
    cursor = conn.cursor()

    # 🔐 Desactivar claves foráneas temporalmente
    cursor.execute("PRAGMA foreign_keys = OFF")

    # 🧹 Eliminar la tabla si existe
    cursor.execute("DROP TABLE IF EXISTS usuarios")

    # 🛠️ Crear nueva tabla usuarios
    cursor.execute('''
    CREATE TABLE usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        contrasena TEXT NOT NULL,
        email TEXT NOT NULL,
        telefono TEXT NOT NULL,
        rol TEXT NOT NULL,
        estado INTEGER NOT NULL DEFAULT 1
    )
    ''')

    # 🔐 Función para hashear contraseñas
    def hashear(password):
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # 📥 Usuarios por defecto
    usuarios = [
        ("Administrador", hashear("4dm1n321"), "admin@correo.com", "1111111111", "admin"),
        ("superAdministrador", hashear("@4dm1n321"), "superadmin@correo.com", "9999999999", "superAdmin"),
        ("Ventas", hashear("v3nt4s"), "ventas@correo.com", "2222222222", "ventas"),
        ("Ventas1", hashear("v3nt4s1"), "ventas1@correo.com", "3333333333", "ventas")
    ]

    cursor.executemany('''
        INSERT INTO usuarios (nombre, contrasena, email, telefono, rol)
        VALUES (?, ?, ?, ?, ?)
    ''', usuarios)

    print("✅ Tabla 'usuarios' recreada e inicializada con usuarios por defecto.")

    # ✅ Reactivar claves foráneas
    cursor.execute("PRAGMA foreign_keys = ON")

    conn.commit()
    conn.close()

# 👉 Ejecutar
resetear_tabla_usuarios()
