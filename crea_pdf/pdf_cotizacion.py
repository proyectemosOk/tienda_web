from fpdf import FPDF
from datetime import datetime
import json
import os
import io
import base64
from PIL import Image
logo_original = './static/img_productos/logo.png'
logo_jpg = './static/img_productos/logo.jpg'
base_path = os.getenv('LOCALAPPDATA')
folder_path = os.path.join(base_path, 'proyectemos', 'cotizaciones')
if not os.path.exists(folder_path):
    os.makedirs(folder_path)
class CotizacionPDF(FPDF):
    def __init__(self, datos_cotizacion, emisor_data, cliente_data):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=15)
        self.datos_cotizacion = datos_cotizacion
        self.emisor_data = emisor_data
        self.cliente_data = cliente_data
        
    def header(self):
        # Convertir a JPG que es más compatible con FPDF       
        if os.path.exists(logo_original):
            try:
                # Convertir a JPG
                img = Image.open(logo_original)
                # Convertir a RGB (JPG no soporta transparencia)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                img.save(logo_jpg, 'JPEG', quality=95)
                
                # Usar JPG con FPDF
                self.image(logo_jpg, 10, 8, 50)
                print("✅ Logo convertido a JPG y agregado")
                
            except Exception as e:
                print(f"❌ Error: {e}")
                # Texto alternativo
                self.set_font('Arial', 'B', 14)
                self.set_xy(10, 10)
                self.cell(50, 8, 'PROYECTEMOS', 0, 1, 'L')
                self.set_xy(10, 18)
                self.set_font('Arial', '', 10)
                self.cell(50, 5, 'Soluciones Tecnológicas', 0, 0, 'L')
        
        # Resto del header
        if self.datos_cotizacion:
            self.agregar_info_cotizacion_header()
    
    def footer(self):
        # Piede pagina  Centro
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 5, f'Software Proyectemos fabricado por GRUPO JJ', 0, 0, 'C')
        # Pie de página Paginado
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 5, f'Página {self.page_no()}', 0, 0, 'R')

    def agregar_terminos_condiciones(self):
        """Agrega los términos y condiciones al PDF"""
        self.ln(10)
        self.set_font('Arial', 'B', 8)
        self.cell(0, 8, 'TÉRMINOS Y CONDICIONES', 0, 1, 'L')
        self.ln(1)
        
        terminos = [
            "Para dar inicio a la instalación se debe generar el pago total de lo pactado en la cotización",
            "Forma de pago 100% antes del inicio de trabajo",
            "Todos los equipos suministrados tienen un (1) año de garantía por daños de fábrica.",
            "La cotización no aplica descuentos realizados por la entidad.",
            "Por la instalación su entidad cuenta con tres (3) meses de soporte sin cobros adicionales",
            "Los equipos que sean manipulado externamente como reparaciones ajenas a nuestra entidad quedan fuera de la garantía.",
            "La garantía no se hace efectiva por mala manipulación ni daños por golpes o fluido eléctrico"
        ]
        
        self.set_font('Arial', '', 7)
        for termino in terminos:
            self.cell(1, 6, '-', 0, 0, 'L')
            # Usar multi_cell para texto largo que puede hacer wrap
            x_pos = self.get_x()
            y_pos = self.get_y()
            self.set_x(x_pos + 5)
            self.multi_cell(0, 3, termino, 0, 'L')
            self.ln(1)

    def agregar_datos_emisor_cliente(self, cotizacion_data):
        """Agrega los datos del emisor y muestra TODOS los datos del cliente recibidos dinámicamente"""
        cotizacion = cotizacion_data['cotizacion']['cotizacion']
        cliente = self.cliente_data[0]  # asume un solo cliente (de tipo dict)

        self.ln(4)

        # Títulos columnas
        self.set_font('Arial', 'B', 12)
        self.cell(100, 8, 'DATOS DEL EMISOR', "B", 0, 'C')
        self.cell(90, 8, 'DATOS DEL CLIENTE', "LB", 1, 'C')
        self.set_font('Arial', '', 9)

        # Cliente: convierte dict en lista de tuplas, con labels bonitos
        cliente_labels = {
            "id": "ID",
            "nombre": "Nombre",
            "tipo_document": "Tipo Doc.",
            "numero": "N° Doc.",
            "telefono": "Teléfono",
            "email": "Email",
            # Puedes agregar más etiquetas personalizadas aquí si conoces el campo
        }
        cliente_tupla_data = []
        for k, v in cliente.items():
            label = cliente_labels.get(k, k.replace("_", " ").title())  # Si no hay label usa el nombre del campo en formato bonito
            cliente_tupla_data.append((label, str(v)))

        # Filas máximas
        max_rows = max(len(self.emisor_data), len(cliente_tupla_data))

        for i in range(max_rows):
            y_start = self.get_y()

            # Datos del emisor
            if i < len(self.emisor_data):
                label, value = self.emisor_data[i]
                self.set_font('Arial', 'B', 9)
                self.cell(30, 4.5, label, 0, 0, 'L')
                self.set_font('Arial', '', 9)
                self.multi_cell(70, 4.5, str(value), "R", 'L')
                current_y = self.get_y()
            else:
                self.cell(95, 4.5, '', 0, 0, 'L')
                current_y = self.get_y() + 6

            # Volver posición para cliente
            self.set_y(y_start)
            self.set_x(110)

            if i < len(cliente_tupla_data):
                label, value = cliente_tupla_data[i]
                self.set_font('Arial', 'B', 9)
                self.cell(33, 4.5, "  "+str(label), 0, 0, 'L')
                self.set_font('Arial', '', 9)
                self.multi_cell(70, 4.5, str(value), 0, 'L')

            # Ajustar posición Y para la siguiente fila
            self.set_y(max(current_y, self.get_y()))

        self.ln(5)

    def agregar_tabla_productos(self, cotizacion_data):
        """Agrega la tabla de productos"""
        detalles = cotizacion_data['cotizacion']['detalles']
        cotizacion = cotizacion_data['cotizacion']['cotizacion']
        
        # Encabezados de la tabla
        self.set_font('Arial', 'B', 10)
        self.cell(15, 8, 'No', "TB", 0, 'C')
        self.cell(25, 8, 'REF', "TB", 0, 'C')
        self.cell(80, 8, 'DESCRIPCIÓN', "TB", 0, 'C')
        self.cell(20, 8, 'CANT', "TB", 0, 'C')
        self.cell(25, 8, 'PRECIO', "TB", 0, 'C')
        self.cell(25, 8, 'SUBTOTAL', "TB", 1, 'C')
        
        # Filas de productos
        self.set_font('Arial', '', 9)
        for i, detalle in enumerate(detalles, 1):
            subtotal = detalle['cantidad'] * detalle['precio_unitario']
            
            # Calcular altura necesaria para el producto
            producto_lines = len(detalle['producto_nombre']) // 35 + 1
            row_height = max(8, producto_lines * 4)
            
            y_start = self.get_y()
            
            # Número
            self.cell(15, row_height, str(i), 0, 0, 'C')
            
            # REF (usando ID del producto)
            self.cell(25, row_height, str(detalle['codigo']), 0, 0, 'C')
            
            # Descripción (con multi_cell para texto largo)
            x_pos = self.get_x()
            self.multi_cell(80, row_height, detalle['producto_nombre'], 0, 'L')
            
            # Volver a la posición correcta
            self.set_xy(x_pos + 80, y_start)
            
            # Cantidad
            self.cell(20, row_height, str(int(detalle['cantidad'])), 0, 0, 'C')
            
            # Precio
            self.cell(25, row_height, f"${detalle['precio_unitario']:,.0f}", 0, 0, 'R')
            
            # Subtotal
            self.cell(25, row_height, f"${subtotal:,.0f}", 0, 1, 'R')
        
        # Totales
        self.ln(5)
        self.set_font('Arial', '', 2)
        self.cell(130, 1, '', "T" , 0)
        
        self.set_font('Arial', '', 11)        
        self.cell(30, 8, 'Subtotal', "T", 0, 'L')
        self.cell(30, 8, f"${cotizacion['total_venta']:,.0f}", "T", 1, 'R')
        
        self.set_font('Arial', 'B', 15)
        self.cell(130, 8, '', 0, 0)
        self.cell(30, 8, 'TOTAL', "T", 0, 'L')
        self.cell(30, 8, f"${cotizacion['total_venta']:,.0f}", "T", 1, 'R')

    def agregar_info_cotizacion_header(self):
        """Agrega información de la cotización en el encabezado como tabla de dos columnas"""
        cotizacion = self.datos_cotizacion['cotizacion']['cotizacion']
        
        # Posición inicial
        self.set_y(10)
        self.set_x(140)
        
        # Dimensiones de la tabla
        tabla_width = 60
        col1_width = 30  # Columna etiquetas
        col2_width = 30  # Columna valores
        
        # Fecha formateada
        fecha_obj = datetime.strptime(cotizacion['fecha'], '%Y-%m-%d %H:%M:%S')
        fecha_formateada = fecha_obj.strftime('%d/%m/%Y %H:%M')
        
        info_items = [
            ("Cotización", f"Q {cotizacion['id']}", 'grande'),           # letra mas grande
            ("Representación Gráfica", "", 'pequeña'),                  # letra mas pequeña  
            ('Fecha de Generación', fecha_formateada, 'pequeña')        # letra mas pequeña
        ]
        
        # Crear tabla con bordes
        for i, (etiqueta, valor, tamaño) in enumerate(info_items):
            # Guardar posición X inicial
            x_inicial = 140
            y_actual = self.get_y()
            
            # Configurar altura de fila según el tamaño de letra
            if tamaño == 'grande':
                altura_fila = 10
                font_size_label = 16
                font_size_value = 16
            else:
                altura_fila = 3
                font_size_label = 8
                font_size_value = 8
            
            # COLUMNA 1: Etiqueta
            self.set_xy(x_inicial, y_actual)
            self.set_font('Arial', '', font_size_label)
            self.cell(col1_width, altura_fila, etiqueta, 0, 0, 'L')
            
            # COLUMNA 2: Valor  
            self.set_x(x_inicial + col1_width)
            self.set_font('Arial', 'B', font_size_value)
            self.cell(col2_width, altura_fila, valor, 0, 1, 'C')
        
        # Ajustar margen superior para el contenido
        self.set_y(max(30, self.get_y() + 0))
        
    def agregar_firmas(self):
        """Agrega sección de firmas"""
        self.ln(20)
        
        # Líneas para firmas
        self.set_font('Arial', 'B', 10)
        
        # Firma emisor
        self.cell(95, 5, '', 0, 0)
        self.cell(95, 5, '', 0, 1)
        
        self.cell(95, 5, '_' * 40, 0, 0, 'C')
        self.cell(95, 5, '_' * 40, 0, 1, 'C')
        
        self.cell(95, 8, 'FIRMA EMISOR', 0, 0, 'C')
        self.cell(95, 8, 'FIRMA CLIENTE', 0, 1, 'C')

def generar_cotizacion_pdf(cotizacion_data,emisor_data, cliente_data):
    nombre_archivo = os.path.join(folder_path, f'cotizacion_{cotizacion_data['cotizacion']['cotizacion']["id"]}.pdf')
    # Crear instancia del PDF
    pdf = CotizacionPDF(cotizacion_data,emisor_data, cliente_data)
    
    pdf.add_page()
      
    # Agregar información de la cotización
    pdf.header()
    # Agregar datos del emisor y cliente
    pdf.agregar_datos_emisor_cliente(cotizacion_data)

    # Agregar tabla de productos
    pdf.agregar_tabla_productos(cotizacion_data)

    # Agregar términos y condiciones
    pdf.agregar_terminos_condiciones()

    # Agregar firmas
    pdf.agregar_firmas()

    # Guardar el archivo
    pdf.output(nombre_archivo)
    print(f"PDF generado exitosamente: {nombre_archivo}")
    
    pdf_bytes = pdf.output(dest='S').encode('latin-1')

    # Convertir a base64 para enviar en JSON
    pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
    return pdf_base64

# Ejemplo de uso
if __name__ == "__main__":
    # Datos de ejemplo (el formato que mencionaste)
    datos_cotizacion = {
        "cotizacion": {
            "cotizacion": {
                "cliente_nombre": "Varios",
                "estado": 1,
                "fecha": "2025-08-22 17:02:47",
                "id": 4,
                "total_compra": 320000.0,
                "total_utilidad": -246000.0,
                "total_venta": 74000.0,
                "vendedor_nombre": "Administrador"
            },
            "detalles": [
                {
                    "cantidad": 1,
                    "codigo": "30082",
                    "precio_unitario": 50000.0,
                    "producto_id": 2,
                    "producto_nombre": "Porta Disco Duro 3.0"
                },
                {
                    "cantidad": 1,
                    "codigo": "3058409",
                    "precio_unitario": 12000.0,
                    "producto_id": 4,
                    "producto_nombre": "USB A TIPO C 1M VQ D06"
                },
                {
                    "cantidad": 1,
                    "codigo": "3058400",
                    "precio_unitario": 12000.0,
                    "producto_id": 5,
                    "producto_nombre": "CABLE USB A TIPO C 1M VQ D06"
                }
            ]
        },
        "valido": True
    }
    # Datos del emisor (lado izquierdo)
    emisor_data = [
        ('Razón Social', 'MARIA JOSE RODRIGUEZ MARTINEZ'),
        ('Nombre Comercial', 'Proyectemos Soluciones en Seguridad y Tecnologia Informatica'),
        ('CC', '1003924587'),
        ('Email', 'majo.m.1099@gmail.com'),
        ('Teléfono', '3113349065'),
        ('Dirección', 'CALLE 6 N 7 - 04 BRR CENTRO'),
        ('Ciudad', 'VILLA DE SAN DIEGO DE UBATE'),
        ("Departamento", "CUNDINAMARCA (CO)")
    ]
    
    # Datos del cliente (lado derecho)
    cliente_data = [{'id': 1, 'nombre': 'Varios', 'tipo_document': 'Cedula', 'numero': '1', 'telefono': '1', 'email': '1'}]
    # Generar el PDF
    generar_cotizacion_pdf(datos_cotizacion,emisor_data, cliente_data)