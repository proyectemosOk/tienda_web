import sqlite3
import random
from datetime import datetime, timedelta
from firebase_config import ServicioFirebase
# Función para conectar a la base de datos
def modificar_tabla_usuarios_sin_check(nombre_bd="tienda_jfleong6_1.db"):
    conexion = sqlite3.connect(nombre_bd)
    cursor = conexion.cursor()

    try:
        print("🔧 Iniciando modificación de la tabla 'usuarios'...")

        # 1. Desactivar validación de claves foráneas temporalmente
        cursor.execute("PRAGMA foreign_keys = OFF;")
        # 6. Volver a activar claves foráneas
        cursor.execute("PRAGMA foreign_keys = ON;")

        # 7. Comprobar integridad referencial
        cursor.execute("PRAGMA foreign_key_check;")
        errores_fk = cursor.fetchall()
        if True:
            return
        # 1.1. Borrar la tabla original

        # 2. Renombrar la tabla original
        cursor.execute("ALTER TABLE usuarios RENAME TO usuarios_old;")
        

        # 3. Crear nueva tabla sin CHECK en 'rol'
        cursor.execute('''
            CREATE TABLE usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL UNIQUE,
                contrasena TEXT NOT NULL,
                rol TEXT NOT NULL,
                email TEXT,
                telefono TEXT
            );
        ''')

        # 4. Copiar los datos (asegurarse que columnas email/telefono existan en la original)
        cursor.execute('''
            INSERT INTO usuarios (id, nombre, contrasena, rol, email, telefono)
            SELECT id, nombre, contrasena, rol, email, telefono FROM usuarios_old;
        ''')

        # 5. Borrar la tabla original
        cursor.execute("DROP TABLE usuarios_old;")

        # 6. Volver a activar claves foráneas
        cursor.execute("PRAGMA foreign_keys = ON;")

        # 7. Comprobar integridad referencial
        cursor.execute("PRAGMA foreign_key_check;")
        errores_fk = cursor.fetchall()

        conexion.commit()

        if errores_fk:
            print("⚠️ ¡Alerta! Se encontraron errores de claves foráneas:")
            for err in errores_fk:
                print("➡️", err)
        else:
            print("✅ Tabla 'usuarios' modificada correctamente. Integridad referencial OK.")

    except Exception as e:
        conexion.rollback()
        print("❌ Error durante la modificación:", e)

    finally:
        conexion.close()

def conectar_bd(nombre_bd):
    return sqlite3.connect(nombre_bd)

# Función para crear las tablas
def crear_tablas(base):
    conexion = conectar_bd(base)
    cursor = conexion.cursor()

        # Crea la tabla de datos de la empresa
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS datos (
        dato TEXT UNIQUE,  -- UNIQUE para evitar duplicados
        descripcion TEXT
    )
    ''')

    # Inserta datos por defecto en la tabla 'datos' si no existen
    datos = [
        ("Empresa", "Grupo JJ"),
        ("Celular", "3175414049"),
        ("Dirección", "Calle 13 # 25 - 14"),
        ("Correo", "grupojj@gmail.com"),
        ("Pagina Web", "www.grupojj.com")
    ]

    for dato in datos:
        cursor.execute('''
        INSERT OR IGNORE INTO datos (dato, descripcion) VALUES (?, ?)
        ''', dato)

    # Crea la tabla de usuarios
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL UNIQUE,  -- UNIQUE para evitar duplicados
        contrasena TEXT NOT NULL,
        email TEXT NOT NULL,
        celular TEXT NO NULL,
        rol TEXT NOT NULL
    )
    ''')
    

    # Crear tabla de productos
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT NOT NULL unique,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio_compra REAL,
        precio_venta REAL,
        stock INTEGER,
        categoria TEXT NOT NULL,
        unidad TEXT NOT NULL
    )
    ''')
    productos = [
    (1,1,"Laptop", "Laptop básica para oficina",1200000, 1500000, 10, "Tecnología", "Unidad"),
    (2,2,"Mouse", "Mouse inalámbrico",20000, 25000, 50, "Tecnología", "Unidad"),
    (3,3,"Teclado", "Teclado mecánico retroiluminado",55000, 75000, 30, "Tecnología", "Unidad"),
    (4,4,"Silla Gamer", "Silla ergonómica para juegos",2000000, 2500000, 5, "Muebles", "Unidad"),
    (5,5,"Escritorio", "Escritorio de madera para oficina",6000000, 750000, 10, "Muebles", "Unidad"),
    (6,6,"Camiseta", "Camiseta de algodón, talla M",100000, 15000, 100, "Ropa", "Unidad"),
    (7,7,"Zapatos", "Zapatos deportivos, talla 42",35000, 50000, 20, "Calzado", "Unidad"),
    (8,8,"Smartphone", "Teléfono inteligente de última generación",60000, 80000, 15, "Tecnología", "Unidad"),
    (9,9,"Audífonos", "Audífonos con cancelación de ruido",80000, 120000, 25, "Tecnología", "Unidad"),
    (10,10,"Mochila", "Mochila resistente al agua",20000, 45000, 20, "Accesorios", "Unidad")
    ]

    #cursor.executemany('''INSERT OR IGNORE INTO productos (id, codigo, nombre, descripcion, precio_compra, precio_venta, stock, categoria, unidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''', productos)

    # Crear tabla de clientes
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            tipo_document TEXT NOT NULL, 
            numero TEXT NOT NULL,
            telefono TEXT,
            email TEXT
        )
    ''')

    # Inserta un cliente por defecto si no existe
    cursor.execute(
        "INSERT OR IGNORE INTO clientes (id, nombre, tipo_document, numero, telefono, email) VALUES(?, ?, ?, ?, ?, ?)", 
        (1, "Varios", "Cedula", "1", "1", "1")
    )


    # Crear tabla de ventas
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendedor_id TEXT NOT NULL,
        cliente_id INTEGER NOT NULL,
        fecha TEXT NOT NULL,
        total_venta REAL NOT NULL,
        total_compra REAL,
        total_utilidad REAL,
        estado INTEGER DEFAULT 1,
        FOREIGN KEY (cliente_id) REFERENCES clientes (id),
        FOREIGN KEY (vendedor_id) REFERENCES usuarios (id)
    )
    ''')

    # Crear tabla de detalles de ventas
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS detalles_ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        estado INTEGER DEFAULT 1,
        FOREIGN KEY (venta_id) REFERENCES ventas (id),
        FOREIGN KEY (producto_id) REFERENCES productos (id)
    )
    ''')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS unidades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unidad text NOT NULL UNIQUE,
        simbolo text
    )
    ''')
    productos = [
    (1,"Unidad","Und"),
    (2,"Gramos","g"),
    (3,"MiliLitros","mL"),
    ]
    for producto in productos:
        cursor.execute('''INSERT OR IGNORE INTO unidades (id, unidad, simbolo) VALUES (?, ?, ?)
        ''', producto)

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categoria text NOT NULL UNIQUE
    )
    ''')
    
    categorias = [
    (1,"Tecnología"),
    (2,"Muebles"),
    (3,"Ropa"),
    (4, "Calzado"),
    (5, "Accesorios")
    ]
    #cursor.executemany('''INSERT OR IGNORE INTO categorias (id, categoria) VALUES (?, ?)''', categorias)


    cursor.execute('''
    CREATE TABLE IF NOT EXISTS pagos_venta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL,
        metodo_pago TEXT NOT NULL,
        valor REAL NOT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas (id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS registro_entradas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                producto_id INTEGER,
                cantidad INTEGER,
                fecha DATETIME,
                precio_compra REAL NOT NULL,
                precio_venta REAL NOT NULL,
                usuario TEXT NOT NULL,
                observacion TEXT,
                FOREIGN KEY (producto_id) REFERENCES productos (id)
                FOREIGN KEY (usuario) REFERENCES usuarios (id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS registro_modificaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            id_producto INTEGER NOT NULL,         
            id_usuario INTEGER NOT NULL,          
            fecha_hora DATETIME NOT NULL,             
            detalle TEXT                         
        )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS lotes_productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_compra REAL NOT NULL,
    fecha_ingreso DATE NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES productos(id)
        )
    ''')

    productos = [
    (1,1, 10, 1200000, "2025-01-09"),
    (2,2, 50, 20000, "2025-01-09"),
    (3,3, 30, 55000, "2025-01-09"),
    (4,4, 5, 2000000, "2025-01-09"),
    (5,5, 10, 6000000, "2025-01-09"),
    (6,6, 100, 100000, "2025-01-09"),
    (7,7, 20, 35000, "2025-01-09"),
    (8,8, 15, 60000, "2025-01-09"),
    (9,9, 25, 80000, "2025-01-09"),
    (10,10, 20, 20000, "2025-01-09")]

    #cursor.executemany('''INSERT OR IGNORE INTO lotes_productos (id, id_producto, cantidad, precio_compra, fecha_ingreso) VALUES (?, ?, ?, ?, ?)''', productos)
        
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS compra_venta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_venta INTEGER NOT NULL,
    id_lote integer not null,
    precio_compra REAL NOT NULL,
    FOREIGN KEY (id_lote) REFERENCES lotes_productos(id),
    FOREIGN KEY (id_venta) REFERENCES ventas(id)
        )
    ''')
    # Proveedores
    # Tabla de Proveedores
    cursor.execute('''CREATE TABLE IF NOT EXISTS proveedores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        rut TEXT UNIQUE,
        direccion TEXT,
        telefono TEXT,
        email TEXT,
        fecha_registro DATE DEFAULT CURRENT_DATE,
        estado INTEGER DEFAULT 1  -- 1 activo, 0 inactivo
        )
    ''')

    # Corregir la sentencia INSERT
    cursor.execute(
    "INSERT OR IGNORE INTO proveedores (id, codigo, nombre, rut, direccion, telefono, email) VALUES (?, ?, ?, ?, ?, ?, ?)", 
    (1, "1", "Varios", "1", "1", "1", "1")
)


    # Tabla de Facturas de Proveedor
    cursor.execute('''CREATE TABLE IF NOT EXISTS facturas_proveedor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_factura TEXT NOT NULL,
        proveedor_id INTEGER,
        fecha_emision DATE NOT NULL,
        fecha_vencimiento DATE,
        "tipo_pago" TEXT,
        monto_total INTEGER NOT NULL,
        monto_pagado INTEGER DEFAULT 0,
        estado_pago TEXT DEFAULT 'PENDIENTE', -- PENDIENTE, PARCIAL, PAGADO
        usuario_id TEXT,
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
        )
    ''')
    # Tabla de Pagos de Factura
    cursor.execute('''CREATE TABLE IF NOT EXISTS pagos_factura (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        factura_id INTEGER,
        tipo_pago_id INTEGER,
        fecha_pago DATE NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        observaciones TEXT,
        FOREIGN KEY (factura_id) REFERENCES facturas_proveedor(id),
        FOREIGN KEY (tipo_pago_id) REFERENCES tipos_pago(id)
        )
    ''')
    # Tabla de Detalle de Entrada por Proveedor
    cursor.execute('''CREATE TABLE IF NOT EXISTS detalle_factura (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        factura_id INTEGER,
        producto_id INTEGER,
        cantidad INTEGER NOT NULL,
        precio_compra DECIMAL(10,2) NOT NULL,
        precio_venta DECIMAL(10,2) NOT NULL,
        fecha_entrada DATE DEFAULT CURRENT_DATE,
        FOREIGN KEY (factura_id) REFERENCES facturas_proveedor(id),
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        )
    ''') 
    
    # Tabla de Tipos de Pago
    cursor.execute('''CREATE TABLE IF NOT EXISTS tipos_pago (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            descripcion TEXT
        )
    ''')
    # Tabla de Tipos de Pago
    cursor.execute('''CREATE TABLE IF NOT EXISTS caja_mayor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            monto INTEGER
        )
    ''')
    cursor.executemany("INSERT OR IGNORE INTO tipos_pago (id, nombre, descripcion) VALUES (?, ?, ?)", 
((1,'EFECTIVO', 'Pago en efectivo'),
(2,'TRANSFERENCIA', 'Transferencia bancaria'),
(3,'TARGETA', 'Pago con tarjeta de débito')
))
    
    # Crear tabla si no existe
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gastos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha_entrada DATE DEFAULT CURRENT_DATE,
            monto REAL NOT NULL,
            descripcion TEXT NOT NULL,
            metodo_pago TEXT NOT NULL
        )
    ''')
    # Confirmar los cambios y cerrar la conexión
    # Crear tabla si no existe    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cierres_dia (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha DATE NOT NULL UNIQUE,
            total_ingresos REAL DEFAULT 0,
            total_egresos REAL DEFAULT 0,
            total_neto REAL DEFAULT 0,
            observaciones TEXT,
            creado_por TEXT,
            creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
            FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE CASCADE
        );
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cierres_dia_detalle_pagos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cierre_id INTEGER NOT NULL,
            tipo_pago TEXT NOT NULL,
            monto REAL NOT NULL,
            FOREIGN KEY (cierre_id) REFERENCES cierres_dia(id) ON DELETE CASCADE
            FOREIGN KEY (tipo_pago) REFERENCES tipos_pago(id) ON DELETE CASCADE
        );
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cierres_dia_detalle_categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cierre_id INTEGER NOT NULL,
            descripcion TEXT NOT NULL, 
            monto REAL NOT NULL,
            FOREIGN KEY (cierre_id) REFERENCES cierres_dia(id) ON DELETE CASCADE
        );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS cierres_dia_movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cierre_id INTEGER NOT NULL,
    tipo_pago TEXT,
    categoria TEXT,
    referencia_id TEXT,
    monto REAL,
    FOREIGN KEY (cierre_id) REFERENCES cierres_dia(id) ON DELETE CASCADE
    FOREIGN KEY (tipo_pago) REFERENCES tipos_pago(id) ON DELETE CASCADE
    FOREIGN KEY (referencias_id) REFERENCES ordenes(id) ON DELETE CASCADE
    FOREIGN KEY (referencias_id) REFERENCES ventas(id) ON DELETE CASCADE
);
''')

    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS entregas_diarias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha DATE NOT NULL,
            efectivo INTEGER DEFAULT 0,
            transferencias INTEGER DEFAULT 0,
            cxc INTEGER DEFAULT 0,
            total INTEGER DEFAULT 0,
            estado INTEGER DEFAULT 1
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cierre_inventario (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha DATE NOT NULL,
            total_venta INTEGER DEFAULT 0,
            total_entregado INTEGER DEFAULT 0,
            faltante INTEGER DEFAULT 0
        )""")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ordenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        telefono TEXT,
        correo TEXT,
        tipo TEXT,
        marca TEXT,
        modelo TEXT,
        estado_entrada TEXT,
        servicio INTEGER,
        perifericos TEXT,
        observaciones TEXT,
        fecha TEXT,
        tipo_pago TEXT,
        pago REAL,
        estado INTEGER,
        FOREIGN KEY (tipo_pago) REFERENCES tipos_pago(nombre)
        FOREIGN KEY (tipo) REFERENCES tipos(id)

    )""")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS servicios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE NOT NULL
        )
    """)
    
    # Servicios por defecto
    servicios = [
        (1, "Mantenimiento"),
        (2, "Reparación"),
        (3, "Actualización"),
        (4, "Actualizar Hardware")
    ]

    # Insertar los servicios si no existen
    cursor.executemany(
        "INSERT OR IGNORE INTO servicios (id, nombre) VALUES (?, ?)",
        servicios
    )
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tipos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE NOT NULL
        )
    """)
    tipos_default = [
    (1, 'PC'),
    (2, 'Portátil'),
    (3, 'Impresora'),
    (4, 'Cámara'),
    (5, 'DVR')
]

    cursor.executemany("INSERT OR IGNORE INTO tipos (id, nombre) VALUES (?, ?)", tipos_default)


    # Confirmar los cambios y cerrar la conexión
    conexion.commit()
    conexion.close()





# Ruta a tu archivo de credenciales Firebase
# firebase = ServicioFirebase("../proyectemosok-31150-firebase-adminsdk-fbsvc-fdae62578b.json")

# # Subir tipos a Firebase
# tipos = [
#     {"id": 1, "nombre": "PC"},
#     {"id": 2, "nombre": "Portátil"},
#     {"id": 3, "nombre": "Impresora"},
#     {"id": 4, "nombre": "Cámara"},
#     {"id": 5, "nombre": "DVR"}
# ]
# for tipo in tipos:
#     doc_ref = firebase.db.collection("tipos").document(str(tipo["id"]))
#     if not doc_ref.get().exists:
#         doc_ref.set(tipo)

# # Subir servicios a Firebase
# servicios = [
#     {"id": 1, "nombre": "Mantenimiento"},
#     {"id": 2, "nombre": "Reparación"},
#     {"id": 3, "nombre": "Actualización"},
#     {"id": 4, "nombre": "Actualizar Hardware"}
# ]
# for servicio in servicios:
#     doc_ref = firebase.db.collection("servicios").document(str(servicio["id"]))
#     if not doc_ref.get().exists:
#         doc_ref.set(servicio)

# # Subir tipos de pago
# tipos_pago = [
#     {"id": 1, "nombre": "EFECTIVO", "descripcion": "Pago en efectivo"},
#     {"id": 2, "nombre": "TRANSFERENCIA", "descripcion": "Transferencia bancaria"},
#     {"id": 3, "nombre": "TARGETA", "descripcion": "Pago con tarjeta de débito"}
# ]
# for pago in tipos_pago:
#     doc_ref = firebase.db.collection("tipos_pago").document(str(pago["id"]))
#     if not doc_ref.get().exists:
#         doc_ref.set(pago)

if __name__ == "__main__":
    crear_tablas("tienda_jfleong6_1.db")
    modificar_tabla_usuarios_sin_check()
    
    
    # Conexión a la base de datos (cambia el nombre si es diferente)
    conexion = sqlite3.connect("tienda_jfleong6_1.db")
    cursor = conexion.cursor()

    # Intentar agregar la columna 'activo'
    try:
        cursor.execute("ALTER TABLE productos ADD COLUMN activo INTEGER DEFAULT 1;")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            pass
        else:
            raise
    # Intentar agregar la columna 'actual'
    try:
        cursor.execute("ALTER TABLE tipos_pago ADD COLUMN actual INTEGER DEFAULT 0;")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            pass
        else:
            raise
    print("Tablas creadas exitosamente.")

    
