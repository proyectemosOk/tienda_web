from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
import os
from datetime import datetime

def generar_pdf_cierre_dia(datos):
    """
    Genera un PDF con el resumen de cierre del día en la carpeta 'archivos/cierres'.
    """

    # Crear carpeta si no existe
    ruta_carpeta = "archivos/cierres"
    os.makedirs(ruta_carpeta, exist_ok=True)

    # Nombre del archivo basado en la fecha
    fecha = datos.get("fecha", str(datetime.today().date()))
    nombre_archivo = f"cierre_dia_{fecha}.pdf"
    ruta_archivo = os.path.join(ruta_carpeta, nombre_archivo)

    # Crear el PDF
    c = canvas.Canvas(ruta_archivo, pagesize=A4)
    ancho, alto = A4

    # === ENCABEZADO ===
    c.setFont("Helvetica-Bold", 14)
    c.drawString(2 * cm, alto - 2 * cm, "📋 CIERRE DE CAJA - RESUMEN GENERAL")

    c.setFont("Helvetica", 10)
    c.drawString(2 * cm, alto - 2.7 * cm, f"Fecha: {fecha}")
    c.drawString(2 * cm, alto - 3.3 * cm, f"Usuario: {datos.get('usuario', 'Desconocido')}")
    c.drawString(2 * cm, alto - 3.9 * cm, f"Observaciones: {datos.get('observaciones', '')}")

    y = alto - 5 * cm

    # === TOTALES ===
    c.setFont("Helvetica-Bold", 12)
    c.drawString(2 * cm, y, "💰 TOTALES:")
    y -= 1 * cm
    c.setFont("Helvetica", 10)
    c.drawString(2.5 * cm, y, f"Ingresos: ${datos['total_ingresos']:,.0f}")
    y -= 0.6 * cm
    c.drawString(2.5 * cm, y, f"Egresos: ${datos['total_egresos']:,.0f}")
    y -= 0.6 * cm
    c.drawString(2.5 * cm, y, f"Total Neto: ${datos['total_neto']:,.0f}")
    y -= 1.2 * cm

    # === DETALLES ===
    c.setFont("Helvetica-Bold", 11)
    c.drawString(2 * cm, y, "📌 Detalles por Tipo de Pago y Módulo:")
    y -= 0.8 * cm
    c.setFont("Helvetica", 9)

    for tipo_pago, modulos in datos.get("tipos_pago", {}).items():
        c.drawString(2.2 * cm, y, f"- {tipo_pago}:")
        y -= 0.6 * cm
        for modulo, registros in modulos.items():
            c.drawString(2.6 * cm, y, f"{modulo}")
            y -= 0.5 * cm
            for ref_id, info in registros.items():
                texto = f"  ID: {ref_id}, Monto: ${info['monto']:,.0f}, Usuario: {info.get('usuario', '')}"
                if modulo == "Gastos":
                    texto += f", Desc: {info.get('descripcion', '')}"
                elif modulo == "Facturas":
                    texto += f", Proveedor: {info.get('proveedor', '')}"
                c.drawString(3.2 * cm, y, texto)
                y -= 0.5 * cm
                if y < 4 * cm:
                    c.showPage()
                    y = alto - 2 * cm
                    c.setFont("Helvetica", 9)

    # Finalizar y guardar
    c.showPage()
    c.save()
    return ruta_archivo
