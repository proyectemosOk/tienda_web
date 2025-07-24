import os
import json
import requests
from fpdf import FPDF

# Paleta y constantes
ENCABEZADO = (0, 43, 107)         # Azul oscuro para fondos encabezados
SUB_ENCABEZADO = (29, 84, 164)    # Azul medio para subencabezados
COLUMNAS = (255, 255, 255)        # Fondo blanco para encabezados tabla
ITEMS = (231, 241, 255)           # Fondo azul claro para filas alternadas
COLOR1 = (255, 255, 255)          # Texto claro en fondos oscuros
COLOR2 = (0, 0, 0)                # Texto oscuro en fondos claros
H_CELDAS = 7                      # Altura fila celda

def formato_col(valor):
    if valor < 0:
        return "-$ {:,}".format(abs(int(valor))).replace(",", ".")
    return "$ {:,}".format(int(valor)).replace(",", ".")

def guardar_cierre_json(datos, id_cierre):
    base_path = os.getenv('LOCALAPPDATA')
    folder_path = os.path.join(base_path, 'proyectemos', 'json')
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
    file_path = os.path.join(folder_path, f'cierre_caja_{id_cierre}.json')
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
    return file_path

def descargar_logo_desde_api():
    url = 'http://localhost:5000/img_productos/logo.png'  # Ajusta dominio/puerto
    destino = os.path.join('/tmp', 'logo_tmp.png')
    try:
        resp = requests.get(url)
        if resp.status_code == 200:
            with open(destino, 'wb') as f:
                f.write(resp.content)
            return destino
    except Exception:
        pass
    return None

class ModernPDF(FPDF):
    def header(self):
        if hasattr(self, 'logo_path') and self.logo_path and os.path.exists(self.logo_path):
            self.image(self.logo_path, 10, 9, 20, 20)
        self.set_xy(35, 12)
        self.set_font('Arial', 'B', 16)
        self.set_text_color(33, 33, 33)
        self.cell(0, 10, "CIERRE DE DÍA", border=0, ln=1, align='L')
        self.ln(2)
    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, f"Página {self.page_no()}", 0, 0, 'C')

def generar_pdf_cierre_dia(datos, id_cierre):
    base_path = os.getenv('LOCALAPPDATA')
    folder_path = os.path.join(base_path, 'proyectemos', 'cierre_pdf')
    if not os.path.exists(folder_path):
        print("Bien")
        os.makedirs(folder_path)
    file_path = os.path.join(folder_path, f'cierre_caja_{id_cierre}.pdf')
    logo_path = descargar_logo_desde_api()
    pdf = ModernPDF()
    pdf.logo_path = logo_path
    pdf.add_page()

    # Fecha creación y usuario junto a logo
    pdf.set_xy(35, 22)
    pdf.set_font('Arial', '', 10)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, H_CELDAS, f"Fecha de creación: {datos['fecha']}", ln=1)
    pdf.set_x(35)
    pdf.cell(0, H_CELDAS, f"Usuario: {datos['usuario']}", ln=1)
    pdf.ln(3)

    # Dashboard: Ingresos, Egresos, Neto
    colores = [(0, 200, 145), (255, 107, 107), (80, 133, 226)]
    titulos = ["Ingresos", "Egresos", "Total Neto"]
    valores = [
        formato_col(datos["total_ingresos"]),
        formato_col(datos["total_egresos"]),
        formato_col(datos["total_neto"])
    ]
    x0 = 10
    y0 = pdf.get_y()
    for i, (titulo, valor) in enumerate(zip(titulos, valores)):
        pdf.set_xy(x0 + i * 65, y0)
        r, g, b = colores[i]
        pdf.set_fill_color(r, g, b)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font('Arial', 'B', 11)
        pdf.cell(60, 10, titulo, 0, 2, 'C', fill=True)
        pdf.set_font('Arial', 'B', 13)
        pdf.cell(60, 8, valor, 0, 2, 'C', fill=True)
        pdf.set_font('Arial', '', 11)
        pdf.set_y(y0)
    pdf.ln(18)

    # Bolsillos actuales - Traspaso a Caja Mayor
    pdf.set_x(10)
    pdf.set_font("Arial", "B", 11)
    pdf.set_text_color(25, 111, 61)
    pdf.cell(0, 9, "Traspaso a Caja Mayor", ln=1)
    pdf.set_font("Arial", "", 10)
    pdf.set_text_color(60, 60, 60)
    msg_caja = (
        "Los saldos finales por método de pago se consignan a Caja Mayor "
        "para control y arqueo inmediato al cierre."
    )
    pdf.multi_cell(0, 6, msg_caja, align='L')
    pdf.set_text_color(33, 33, 33)
    pdf.set_x(10)
    pdf.cell(58, H_CELDAS, f"Efectivo: {formato_col(datos['bolsillos_actuales'].get('Efectivo', 0))}", 0, 0, 'C')
    pdf.cell(58, H_CELDAS, f"Nequi: {formato_col(datos['bolsillos_actuales'].get('Nequi', 0))}", 0, 0, 'C')
    pdf.cell(58, H_CELDAS, f"Transferencia: {formato_col(datos['bolsillos_actuales'].get('Transferencia', 0))}", 0, 1, 'C')
    pdf.ln(7)

    # Observaciones solo si hay
    observaciones = datos.get("observaciones", "").strip()
    if observaciones:
        pdf.ln(3)
        pdf.set_x(10)
        pdf.set_font("Arial", "B", 10)
        pdf.set_text_color(85, 85, 85)
        pdf.cell(0, H_CELDAS, "Observaciones:", ln=1)
        pdf.set_fill_color(245, 245, 245)
        pdf.set_font("Arial", "I", 9)
        pdf.set_text_color(55, 55, 55)
        pdf.multi_cell(0, 11, observaciones, border=1, fill=True)
        pdf.ln(3)

    pdf.ln(4)

    # Tablas Paralelas: Ingresos (izquierda), Gastos + Facturas (derecha)
    margen = 10
    ancho_tabla = 90
    altura_inicio = pdf.get_y()
    x_izq, x_der = margen, margen + ancho_tabla + 7

    # --- Ingresos (izquierda) ---
    pdf.set_xy(x_izq, altura_inicio)
    pdf.set_font("Arial", "B", 11)
    pdf.set_fill_color(*ENCABEZADO)
    pdf.set_text_color(*COLOR1)
    pdf.cell(ancho_tabla, 8, "Ingresos", 0, 1, "C", True)
    pdf.set_font('Arial', '', 10)

    for tipo, info in datos["tipos_pago"].items():
        for modulo, refs in info.items():
            if "Ventas" in modulo or "Servicios" in modulo:
                pdf.set_text_color(*COLOR1)
                pdf.set_x(x_izq)
                pdf.set_fill_color(*SUB_ENCABEZADO)
                pdf.cell(ancho_tabla, H_CELDAS, tipo, 0, 1, "C", True)
                pdf.set_text_color(*COLOR2)
                pdf.set_fill_color(*COLUMNAS)
                pdf.cell(20, H_CELDAS, "Ref", 0, align="L", fill=True)
                pdf.cell(50, H_CELDAS, "Módulo", 0, align="L", fill=True)
                pdf.cell(20, H_CELDAS, "Valor", 0, ln=1, align="R", fill=True)
                pdf.set_fill_color(*ITEMS)

                for i, (ref, item) in enumerate(refs.items()):
                    fondo = True if i % 2 == 0 else False
                    pdf.set_x(x_izq)
                    pdf.cell(20, H_CELDAS, f"{ref}", 0, align="L", fill=fondo)
                    pdf.cell(50, H_CELDAS, f"{modulo}", 0, align="L", fill=fondo)
                    pdf.cell(20, H_CELDAS, formato_col(item["monto"]), 0, ln=1, align="R", fill=fondo)

    # --- Gastos (derecha) ---
    pdf.set_xy(x_der, altura_inicio)
    pdf.set_font('Arial', 'B', 11)
    pdf.set_fill_color(*ENCABEZADO)
    pdf.set_text_color(*COLOR1)
    pdf.cell(ancho_tabla, 8, "Gastos", ln=1, align="C", fill=True)
    pdf.set_font('Arial', '', 10)

    for metodo, datos_metodo in datos["tipos_pago"].items():
        if "Gastos" in datos_metodo:
            pdf.set_x(x_der)
            pdf.set_fill_color(*SUB_ENCABEZADO)
            pdf.set_text_color(*COLOR1)
            pdf.cell(ancho_tabla, H_CELDAS, metodo.capitalize(), 0, 1, "C", True)
            pdf.set_x(x_der)
            pdf.set_fill_color(*COLUMNAS)
            pdf.set_text_color(*COLOR2)
            pdf.cell(20, H_CELDAS, "Ref", 0, align="L", fill=True)
            pdf.cell(ancho_tabla - 45, H_CELDAS, "Descripción", 0, ln=0, align="L", fill=True)
            pdf.cell(25, H_CELDAS, "Valor", 0, 1, align="R", fill=True)
            pdf.set_fill_color(*ITEMS)
            for i, (ref, gasto) in enumerate(datos_metodo["Gastos"].items()):
                fondo = True if i % 2 == 0 else False
                pdf.set_x(x_der)
                pdf.cell(20, H_CELDAS, f"{ref}", 0, align="L", fill=fondo)
                pdf.cell(ancho_tabla - 45, H_CELDAS, gasto["descripcion"], 0, ln=0, align="L", fill=fondo)
                pdf.cell(25, H_CELDAS, formato_col(gasto["monto"]), 0, 1, align="R", fill=fondo)

    # --- Facturas debajo Gastos ---
    y_factura = pdf.get_y() + 3
    pdf.set_xy(x_der, y_factura)
    pdf.set_font('Arial', 'B', 11)
    pdf.set_fill_color(*ENCABEZADO)
    pdf.set_text_color(*COLOR1)
    pdf.cell(ancho_tabla, 8, 'Facturas', ln=1, align="C", fill=True)
    pdf.set_font('Arial', '', 10)

    for metodo, datos_metodo in datos["tipos_pago"].items():
        if "Facturas" in datos_metodo:
            pdf.set_x(x_der)
            pdf.set_fill_color(*SUB_ENCABEZADO)
            pdf.cell(ancho_tabla, H_CELDAS, metodo, 0, 1, "C", True)
            pdf.set_x(x_der)
            pdf.set_fill_color(*COLUMNAS)
            pdf.set_text_color(*COLOR2)
            pdf.cell(20, H_CELDAS, "Ref", 0, align="L", fill=True)
            pdf.cell(ancho_tabla - 45, H_CELDAS, "Proveedor", 0, align="L", fill=True)
            pdf.cell(25, H_CELDAS, "Valor", 0, 1, align="R", fill=True)
            pdf.set_fill_color(*ITEMS)

            for i, (ref, fac) in enumerate(datos_metodo["Facturas"].items()):
                fondo = True if i % 2 == 0 else False
                pdf.set_x(x_der)
                pdf.cell(20, H_CELDAS, f"{ref}", 0, align="L", fill=fondo)
                pdf.cell(ancho_tabla - 45, H_CELDAS, fac.get("proveedor", ""), 0, align="L", fill=fondo)
                pdf.cell(25, H_CELDAS, formato_col(fac["monto"]), 0, 1, align="R", fill=fondo)

    pdf.output(file_path)
    guardar_cierre_json(datos, id_cierre)
    return file_path

# USO BÁSICO:
# datos = {...}  # tu diccionario de datos
# id_cierre = 20250723
# ruta = generar_pdf_cierre_dia(datos, id_cierre)
# print("PDF generado:", ruta)

# datos = {
#   "bolsillos_actuales": {
#     "Efectivo": 1910000.0,
#     "Nequi": 605000.0,
#     "Transferencia": -20000.0
#   },
#   "fecha": "2025-07-23 14:38:17",
#   "tipos_pago": {
#     "Efectivo": {
#       "Gastos": {
#         "3": {
#           "descripcion": "Onces",
#           "monto": 50000.0,
#           "usuario": "Administrador"
#         }
#       },
#       "Ventas": {
#         "1": {
#           "monto": 100000.0,
#           "usuario": "Administrador"
#         },
#         "10": {
#           "monto": 150000.0,
#           "usuario": "Administrador"
#         },
#         "12": {
#           "monto": 0.0,
#           "usuario": "Administrador"
#         },
#         "13": {
#           "monto": 0.0,
#           "usuario": "Administrador"
#         },
#         "14": {
#           "monto": 0.0,
#           "usuario": "Administrador"
#         },
#         "15": {
#           "monto": 0.0,
#           "usuario": "Administrador"
#         },
#         "16": {
#           "monto": 0.0,
#           "usuario": "Administrador"
#         },
#         "17": {
#           "monto": 0.0,
#           "usuario": "Administrador"
#         },
#         "18": {
#           "monto": 0.0,
#           "usuario": "Administrador"
#         },
#         "19": {
#           "monto": 0.0,
#           "usuario": "Administrador"
#         },
#         "2": {
#           "monto": 100000.0,
#           "usuario": "Administrador"
#         },
#         "20": {
#           "monto": 0.0,
#           "usuario": "Administrador"
#         },
#         "21": {
#           "monto": 0.0,
#           "usuario": "Administrador"
#         },
#         "22": {
#           "monto": 480000.0,
#           "usuario": "Administrador"
#         },
#         "23": {
#           "monto": 520000.0,
#           "usuario": "Administrador"
#         },
#         "24": {
#           "monto": 260000.0,
#           "usuario": "Administrador"
#         },
#         "3": {
#           "monto": 350000.0,
#           "usuario": "Administrador"
#         }
#       }
#     },
#     "Nequi": {
#       "Ventas": {
#         "11": {
#           "monto": 150000.0,
#           "usuario": "Administrador"
#         },
#         "25": {
#           "monto": 255000.0,
#           "usuario": "Administrador"
#         },
#         "4": {
#           "monto": 200000.0,
#           "usuario": "Administrador"
#         }
#       }
#     },
#     "Transferencia": {
#       "Facturas": {
#         "1": {
#           "monto": 5000,
#           "proveedor": "Varios",
#           "usuario": "Administrador"
#         }
#       },
#       "Gastos": {
#         "4": {
#           "descripcion": "luz",
#           "monto": 15000.0,
#           "usuario": "Administrador"
#         }
#       }
#     }
#   },
#   "total_egresos": 70000.0,
#   "total_ingresos": 2565000.0,
#   "total_neto": 2495000.0,
#   "usuario": "Administrador"
# }

# # id_cierre = '20250723'
# ruta_pdf = generar_pdf_cierre_dia(datos, 500)
# print("PDF guardado en:", ruta_pdf)
