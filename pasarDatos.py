import sqlite3
import os
import tkinter as tk
from tkinter import filedialog

def seleccionar_archivo(titulo):
    root = tk.Tk()
    root.withdraw()
    ruta = filedialog.askopenfilename(title=titulo, filetypes=[("SQLite DB", "*.db"), ("Todos los archivos", "*.*")])
    return ruta

def migrar_productos(ruta_nueva, ruta_vieja):
    if not os.path.exists(ruta_nueva) or not os.path.exists(ruta_vieja):
        print("❌ Las rutas de las bases de datos no son válidas.")
        return

    try:
        conn = sqlite3.connect(ruta_nueva)
        cursor = conn.cursor()

        # Adjuntar base vieja
        cursor.execute(f"ATTACH DATABASE '{ruta_vieja}' AS antigua")

        print("📤 Insertando productos de base antigua a nueva con 'activo = 1'...")

        cursor.execute("""
            INSERT INTO productos (
                codigo, nombre, descripcion, precio_compra, precio_venta,
                stock, categoria, unidad, activo
            )
            SELECT 
                codigo, nombre, descripcion, precio_compra, precio_venta,
                stock, categoria, unidad, 1
            FROM antigua.productos
        """)

        conn.commit()
        cursor.execute("DETACH DATABASE antigua")
        conn.close()

        print("✅ Migración completada correctamente.")

    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

# --------------------
# Script principal
# --------------------
print("🟢 Selecciona la base de datos NUEVA (con columna 'activo'):")
ruta_nueva = seleccionar_archivo("Selecciona la base de datos NUEVA")

print("🟡 Selecciona la base de datos ANTIGUA (sin columna 'activo'):")
ruta_vieja = seleccionar_archivo("Selecciona la base de datos ANTIGUA")

migrar_productos(ruta_nueva, ruta_vieja)
