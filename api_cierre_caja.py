from flask import Blueprint, jsonify, request, send_file,url_for
from datetime import date, datetime 
from conexion_base import ConexionBase
from crea_pdf.pdf_cierre_caja import *

cierre_caja = Blueprint('cierre_caja', __name__)
conn_db = ConexionBase("tienda_jfleong6_1.db")

# 🔍 Utilidad: obtener id_modulo por nombre
def get_id(tabla, nombre):
    resultado = conn_db.seleccionar(tabla, "id", "nombre = ?", (nombre,))
    return resultado[0][0] if resultado else None

def actualizar_o_crear_bolsillo(idpago, nombre, nuevo_monto):
    # 1. Buscar si el bolsillo ya existe por nombre
    resultados = conn_db.seleccionar("caja_mayor", "*", "id = ?", (idpago,))
    
    if resultados:
        # 2. Si existe, actualiza el monto (suma al actual)
        bolsillo = resultados[0]
        monto_actual = bolsillo[3]  # columna 'monto' en la tabla

        conn_db.actualizar(
            "caja_mayor",
            {"monto": monto_actual + nuevo_monto},
            "id = ?",
            (idpago,)  # ID del bolsillo
        )
        print(f"✅ Bolsillo '{nombre}' actualizado: {monto_actual} ➕ {nuevo_monto}")
    else:
        # 3. Si no existe, crea el bolsillo con el monto inicial
        conn_db.insertar("caja_mayor", {
            "id":idpago,
            "nombre": nombre,
            "descripcion": "Nuevo",
            "monto": nuevo_monto
        })
        print(f"🆕 Bolsillo '{nombre}' creado con {nuevo_monto}")

@cierre_caja.route("/api/cierre_dia/pending", methods=["GET"])
def obtener_cierre_pendiente():
    tipos_pago = {}
    total_ingresos = 0
    total_egresos = 0

    # =========================
    # 1. PAGOS VENTA
    # =========================
    rows = conn_db.ejecutar_personalizado_1('''
        SELECT pv.id, pv.valor, u.nombre AS usuario, tp.nombre AS tipo_pago
        FROM pagos_venta pv
        JOIN usuarios u ON u.id = pv.usuario_id
        JOIN tipos_pago tp ON tp.id = pv.metodo_pago
        WHERE pv.estado = 1
    ''')
    for r in rows:
        tipos_pago.setdefault(r["tipo_pago"], {}).setdefault("Ventas", {})[f"{r['id']}"] = {
            "monto": r["valor"],
            "usuario": r["usuario"]
        }
        total_ingresos += r["valor"]

    # =========================
    # 2. PAGOS SERVICIOS
    # =========================
    rows = conn_db.ejecutar_personalizado_1('''
        SELECT ps.id, ps.monto, u.nombre AS usuario, tp.nombre AS tipo_pago
        FROM pagos_servicios ps
        JOIN usuarios u ON u.id = ps.usuario_id
        JOIN tipos_pago tp ON tp.id = ps.tipo_pago
        WHERE ps.estado = 1
    ''')
    for r in rows:
        tipos_pago.setdefault(r["tipo_pago"], {}).setdefault("Servicios", {})[f"{r['id']}"] = {
            "monto": r["monto"],
            "usuario": r["usuario"]
        }
        total_ingresos += r["monto"]

    # =========================
    # 3. GASTOS
    # =========================
    rows = conn_db.ejecutar_personalizado_1('''
        SELECT g.id, g.monto, g.descripcion, u.nombre AS usuario, tp.nombre AS tipo_pago
        FROM gastos g
        JOIN usuarios u ON u.id = g.id_usuario
        JOIN tipos_pago tp ON tp.id = g.metodo_pago
        WHERE g.estado = 1
    ''')
    for r in rows:
        tipos_pago.setdefault(r["tipo_pago"], {}).setdefault("Gastos", {})[f"{r['id']}"] = {
            "monto": r["monto"],
            "usuario": r["usuario"],
            "descripcion": r["descripcion"]
        }
        total_egresos += r["monto"]

    # =========================
    # 4. PAGOS FACTURAS
    # =========================
    rows = conn_db.ejecutar_personalizado_1('''
        SELECT pf.id, pf.monto, u.nombre AS usuario, tp.nombre AS tipo_pago, pr.nombre AS proveedor
        FROM pagos_factura pf
        JOIN usuarios u ON u.id = pf.usuario_id
        JOIN tipos_pago tp ON tp.id = pf.tipo_pago_id
        JOIN facturas_proveedor fp ON fp.id = pf.factura_id
        JOIN proveedores pr ON pr.id = fp.proveedor_id
        WHERE pf.estado = 1
    ''')
    for r in rows:
        tipos_pago.setdefault(r["tipo_pago"], {}).setdefault("Facturas", {})[f"{r['id']}"] = {
            "monto": r["monto"],
            "usuario": r["usuario"],
            "proveedor": r["proveedor"]
        }
        total_egresos += r["monto"]
        # =========================
    # 5. CALCULAR BOLSILLOS RESTANTES
    # =========================
    bolsillos_actuales = {}

    # Recorremos lo que ya tenemos en tipos_pago para calcular por tipo
    for tipo, modulos in tipos_pago.items():
        saldo = 0
        for modulo, items in modulos.items():
            for _, info in items.items():
                monto = info["monto"]
                # Detectar si es ingreso o egreso
                if modulo in ["Ventas", "Servicios"]:
                    saldo += monto
                elif modulo in ["Gastos", "Facturas"]:
                    saldo -= monto
        bolsillos_actuales[tipo] = saldo


    # =========================
    # RESPUESTA FINAL
    # =========================
    return jsonify({
        "fecha": str(date.today()),
        "total_ingresos": total_ingresos,
        "total_egresos": total_egresos,
        "total_neto": total_ingresos - total_egresos,
        "tipos_pago": tipos_pago,
        "bolsillos_actuales": bolsillos_actuales
    })

@cierre_caja.route("/api/turno/cerrar_dia", methods=["POST"])
def cerrar_dia():
    datos = request.get_json()
    usuario_id = datos.get("creado_por")

    try:
        conn_db.iniciar_transaccion()

        # 1. Insertar resumen general
        id_cierre, error = conn_db.insertar("cierres_dia", {
            "fecha": str(date.today()),
            "total_ingresos": datos["total_ingresos"],
            "total_egresos": datos["total_egresos"],
            "total_neto": datos["total_neto"],
            "observaciones": datos.get("observaciones", ""),
            "creado_por": usuario_id
        })

        if error:
            conn_db.revertir_transaccion()
            return jsonify({"error": "No se pudo registrar el cierre."}), 500

        tipos_pago = datos["tipos_pago"]

        # 2. Insertar detalle por tipo de pago
        for id_tipo_pago, modulos in tipos_pago.items():
            total_pago = 0
            id_pago = get_id("tipos_pago",id_tipo_pago)
            for nombre_modulo, movimientos in modulos.items():
                for info in movimientos.values():
                    total_pago += info["monto"]
            actualizar_o_crear_bolsillo(id_pago, id_tipo_pago, total_pago)
            conn_db.insertar("cierres_dia_detalle_pagos", {
                "cierre_id": id_cierre,
                "tipo_pago": id_pago,
                "monto": total_pago
            })

        # 3. Insertar movimientos individuales + desglose por categoria
        for id_tipo_pago, modulos in tipos_pago.items():
            id_pago = get_id("tipos_pago",id_tipo_pago)
            for nombre_modulo, movimientos in modulos.items():
                # Obtener id_modulo real
                id_modulo = get_id("modulos",nombre_modulo)

                total_modulo = 0
                ids_a_actualizar = []
                for ref_id, info in movimientos.items():
                    total_modulo += info["monto"]
                    movimiento = {
                        "cierre_id": id_cierre,
                        "tipo_pago": id_pago,
                        "id_modulo": id_modulo,
                        "referencia_id": ref_id,
                        "monto": info["monto"]
                    }
                    conn_db.insertar("cierres_dia_movimientos", movimiento)
                    ids_a_actualizar.append(ref_id)

                # Insertar resumen por categoría
                conn_db.insertar("cierres_dia_detalle_categorias", {
                    "cierre_id": id_cierre,
                    "id_modulo": id_modulo,
                    "monto": total_modulo
                })

                # 4. Actualizar estado = 0 en tabla correspondiente
                tabla_actualizar = {
                    "Ventas": ("pagos_venta", "id"),
                    "Servicios": ("pagos_servicios", "id"),
                    "Gastos": ("gastos", "id"),
                    "Facturas": ("pagos_factura", "id")
                }
                if nombre_modulo in tabla_actualizar and ids_a_actualizar:
                    tabla, campo_id = tabla_actualizar[nombre_modulo]
                    placeholders = ",".join(["?"] * len(ids_a_actualizar))
                    conn_db.actualizar(
                        tabla,
                        {"estado": 0},
                        f"{campo_id} IN ({placeholders})",
                        ids_a_actualizar
                    )

        # Generar PDF
        ruta_pdf = generar_pdf_cierre_dia(datos)
        nombre_archivo = os.path.basename(ruta_pdf)
        conn_db.confirmar_transaccion()
        
        return jsonify({
            "mensaje": "Cierre del día realizado exitosamente.",
            "pdf_url": url_for("cierre_caja.descargar_pdf_cierre", nombre=nombre_archivo)
        })

    except Exception as e:
        conn_db.revertir_transaccion()
        return jsonify({"error": str(e)}), 500   
    
@cierre_caja.route("/pdf/cierre/<nombre>")
def descargar_pdf_cierre(nombre):
    ruta = os.path.join(tempfile.gettempdir(), nombre)
    return send_file(ruta, mimetype='application/pdf')