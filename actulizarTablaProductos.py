import sqlite3
def crear_categorias(db_path='tienda_jfleong6_1.db'):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("1. creando 'categorias'")
    
    cursor.execute("select categoria, sum(categoria) as total from productos group by categoria")
    for categoria, cant in cursor.fetchall():
        cursor.execute("insert into categorias (categoria) values(?)",(categoria,))
    conn.commit()
    conn.close()
    
def migrar_productos_a_formato_relacional(db_path='tienda_jfleong6_1.db'):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("1. Actualizando 'categoria' y 'unidad' en tabla productos con sus IDs...")
    


    # Actualizar categoría (nombre → id)
    cursor.execute("SELECT categoria, id FROM categorias")
    for nombre, id_ in cursor.fetchall():
        cursor.execute("UPDATE productos SET categoria = ? WHERE categoria = ?", (id_, nombre))

    # Actualizar unidad (nombre → id)
    cursor.execute("SELECT unidad, id FROM unidades")
    for nombre, id_ in cursor.fetchall():
        cursor.execute("UPDATE productos SET unidad = ? WHERE unidad = ?", (id_, nombre))

    conn.commit()

    print("2. Creando nueva tabla 'productos_nueva' con estructura mejorada...")

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS productos_nueva (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT NOT NULL UNIQUE,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            precio_compra REAL,
            precio_venta REAL,
            stock INTEGER,
            categoria INTEGER NOT NULL,
            unidad INTEGER NOT NULL,
            activo INTEGER NOT NULL,
            FOREIGN KEY (categoria) REFERENCES categorias(id),
            FOREIGN KEY (unidad) REFERENCES unidades(id)
        )
    ''')

    print("3. Copiando datos desde productos hacia productos_nueva...")

    cursor.execute('''
        INSERT INTO productos_nueva (
            id, codigo, nombre, descripcion, precio_compra, precio_venta, stock, categoria, unidad, activo
        )
        SELECT id, codigo, nombre, descripcion, precio_compra, precio_venta, stock, categoria, unidad, activo
        FROM productos
    ''')

    conn.commit()

    print("4. Renombrando tablas...")

    cursor.execute('ALTER TABLE productos RENAME TO productos_vieja')
    cursor.execute('ALTER TABLE productos_nueva RENAME TO productos')

    conn.commit()

    # 5. Eliminar tabla vieja si se desea
    eliminar = input("¿Deseas eliminar la tabla productos_vieja? (s/n): ").strip().lower()
    if eliminar == 's':
        cursor.execute('DROP TABLE productos_vieja')
        conn.commit()
        print("Tabla productos_vieja eliminada.")
    else:
        print("La tabla productos_vieja fue conservada por precaución.")
        
    # Agregar columna 'estado' si no existe
    try:
        cursor.execute("ALTER TABLE gastos ADD COLUMN estado INTEGER DEFAULT 1")
    except sqlite3.OperationalError:
        print("La columna 'estado' ya existe en la tabla 'gastos'")

    try:
        cursor.execute("ALTER TABLE facturas_proveedor ADD COLUMN estado INTEGER DEFAULT 1")
    except sqlite3.OperationalError:
        print("La columna 'estado' ya existe en la tabla 'facturas_proveedor'")
        
    # Agregar columna 'estado' si no existe
    try:
        cursor.execute("ALTER TABLE pagos_servicios ADD COLUMN estado INTEGER DEFAULT 1")
    except sqlite3.OperationalError:
        print("La columna 'estado' ya existe en la tabla 'pagos_servicios'")

    try:
        cursor.execute("ALTER TABLE pagos_factura ADD COLUMN estado INTEGER DEFAULT 1")
    except sqlite3.OperationalError:
        print("La columna 'estado' ya existe en la tabla 'pagos_factura'")
    try:
        cursor.execute("ALTER TABLE pagos_venta ADD COLUMN estado INTEGER DEFAULT 1")
    except sqlite3.OperationalError:
        print("La columna 'estado' ya existe en la tabla 'pagos_venta'")
    
    
        
    cursor.execute("UPDATE gastos SET estado = 1 WHERE estado IS NULL")
    cursor.execute("UPDATE facturas_proveedor SET estado = 1 WHERE estado IS NULL")
    cursor.execute("UPDATE pagos_factura SET estado = 1 WHERE estado IS NULL")
    cursor.execute("UPDATE pagos_factura SET estado = 1 WHERE estado IS NULL")
    cursor.execute("UPDATE pagos_venta SET estado = 1 WHERE estado IS NULL")


    conn.close()
    print("✅ Migración completada exitosamente.")

def actualizar_estructura_cierre(db_path='tienda_jfleong6_1.db'):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Crear tabla modulos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS modulos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE
        )
    ''')
    # Insertar módulos base si no existen
    modulos_base = ['Ventas', 'Servicios', 'Gastos', 'Facturas']
    for nombre in modulos_base:
        cursor.execute("INSERT OR IGNORE INTO modulos (nombre) VALUES (?)", (nombre,))

    # 2. Recrear tabla cierres_dia (corregir creado_por a INTEGER NOT NULL)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cierres_dia_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha DATE NOT NULL UNIQUE,
            total_ingresos REAL DEFAULT 0,
            total_egresos REAL DEFAULT 0,
            total_neto REAL DEFAULT 0,
            observaciones TEXT,
            creado_por INTEGER NOT NULL,
            creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    ''')
    try:
        cursor.execute('''
            INSERT INTO cierres_dia_temp (id, fecha, total_ingresos, total_egresos, total_neto, observaciones, creado_por, creado_en)
            SELECT id, fecha, total_ingresos, total_egresos, total_neto, observaciones, creado_por, creado_en FROM cierres_dia
        ''')
        cursor.execute('DROP TABLE cierres_dia')
        cursor.execute('ALTER TABLE cierres_dia_temp RENAME TO cierres_dia')
    except Exception as e:
        print(f"❌ Error migrando cierres_dia: {e}")

    # 3. Reemplazar tabla cierres_dia_detalle_categorias
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cierres_dia_detalle_categorias_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cierre_id INTEGER NOT NULL,
            id_modulo INTEGER NOT NULL,
            monto REAL NOT NULL,
            FOREIGN KEY (cierre_id) REFERENCES cierres_dia(id) ON DELETE CASCADE,
            FOREIGN KEY (id_modulo) REFERENCES modulos(id) ON DELETE CASCADE
        )
    ''')
    try:
        cursor.execute('DROP TABLE cierres_dia_detalle_categorias')
        cursor.execute('ALTER TABLE cierres_dia_detalle_categorias_temp RENAME TO cierres_dia_detalle_categorias')
    except Exception as e:
        print(f"❌ Error actualizando cierres_dia_detalle_categorias: {e}")

    # 4. Reemplazar tabla cierres_dia_movimientos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cierres_dia_movimientos_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cierre_id INTEGER NOT NULL,
            tipo_pago INTEGER,
            id_modulo INTEGER,
            referencia_id TEXT,
            monto REAL,
            FOREIGN KEY (cierre_id) REFERENCES cierres_dia(id) ON DELETE CASCADE,
            FOREIGN KEY (tipo_pago) REFERENCES tipos_pago(id) ON DELETE CASCADE,
            FOREIGN KEY (id_modulo) REFERENCES modulos(id) ON DELETE CASCADE
        )
    ''')
    try:
        cursor.execute('DROP TABLE cierres_dia_movimientos')
        cursor.execute('ALTER TABLE cierres_dia_movimientos_temp RENAME TO cierres_dia_movimientos')
    except Exception as e:
        print(f"❌ Error actualizando cierres_dia_movimientos: {e}")

    conn.commit()
    conn.close()
    print("✅ Estructura actualizada correctamente.")


def actualizar_modulos_agregar_comportamiento(db_path='tienda_jfleong6_1.db'):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Verificar si la columna ya existe
    cursor.execute("PRAGMA table_info(modulos)")
    columnas = [col[1] for col in cursor.fetchall()]
    
    if "comportamiento" not in columnas:
        print("➕ Agregando columna 'comportamiento' a 'modulos'")
        cursor.execute("ALTER TABLE modulos ADD COLUMN comportamiento INTEGER DEFAULT 1")

    # Establecer valores según nombre del módulo
    cursor.execute("UPDATE modulos SET comportamiento = 1 WHERE nombre IN ('Ventas', 'Servicios')")
    cursor.execute("UPDATE modulos SET comportamiento = 0 WHERE nombre IN ('Gastos', 'Facturas')")

    conn.commit()
    conn.close()
    print("✅ Tabla 'modulos' actualizada con columna 'comportamiento' y valores asignados.")

# Ejecutar
# crear_categorias()
migrar_productos_a_formato_relacional('tienda_jfleong6_1.db')  # ← Cambia esto por la ruta real
actualizar_estructura_cierre()
actualizar_modulos_agregar_comportamiento()
