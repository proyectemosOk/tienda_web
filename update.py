import sqlite3

# Rutas de las bases de datos
DB_VIEJA = "tienda_jfleong6_1_edwin.db"
DB_NUEVA = "tienda_jfleong6_1.db"

def copiar_tabla(tabla, columnas, origen, destino):
    datos = origen.execute(f"SELECT {', '.join(columnas)} FROM {tabla}").fetchall()
    placeholders = ', '.join(['?'] * len(columnas))
    destino.executemany(
        f"INSERT INTO {tabla} ({', '.join(columnas)}) VALUES ({placeholders})",
        datos
    )

def main():
    con_vieja = sqlite3.connect(DB_VIEJA)
    con_nueva = sqlite3.connect(DB_NUEVA)
    cur_vieja = con_vieja.cursor()
    cur_nueva = con_nueva.cursor()

    # Copiar CATEGORÍAS
    copiar_tabla('categorias', ['id', 'categoria'], cur_vieja, cur_nueva)

    # Copiar UNIDADES
    # copiar_tabla('unidades', ['id', 'unidad', 'simbolo'], cur_vieja, cur_nueva)

    # Copiar PRODUCTOS y crear lotes
    productos = cur_vieja.execute(
        "SELECT id, codigo, nombre, descripcion, precio_compra, precio_venta, stock, categoria, unidad, activo FROM productos"
    ).fetchall()
    for prod in productos:
        # Ajustar stock si menor que 0
        prod = list(prod)
        print(prod[6])
        if prod[6]=="" or float(prod[6]) < 0:
            prod[6] = 0  # stock = 0

        # Insertar producto
        cur_nueva.execute(
            """INSERT INTO productos (id, codigo, nombre, descripcion, precio_compra, precio_venta, stock, categoria, unidad, activo)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", prod
        )

        # Crear lote SOLO si stock > 0
        if prod[6] > 0:
            # Aquí se supone que el lote almacena stock actual y la fecha actual.
            cur_nueva.execute(
                """INSERT INTO lotes_productos
                   (id_producto, cantidad, precio_compra, fecha_ingreso)
                   VALUES (?, ?, ?, DATE('now'))""",
                (prod[0], prod[6], prod[4])
            )

    # Confirmar cambios y cerrar
    con_nueva.commit()
    cur_vieja.close()
    cur_nueva.close()
    con_vieja.close()
    con_nueva.close()

if __name__ == "__main__":
    main()
