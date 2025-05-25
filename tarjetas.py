from flask import Flask, jsonify, request, render_template_string
from flask_cors import CORS
from datetime import datetime, timedelta
from conexion_base import ConexionBase
import json
from flask import Blueprint

extras = Blueprint('extras', __name__)
# Instancia de conexión a la base de datos
conn_db = ConexionBase("tienda_jfleong6_1.db")

class TarjetasEmpresariales:
    def __init__(self, conexion):
        self.conn = conexion
    
    def obtener_fecha_hoy(self):
        """Obtiene la fecha de hoy en formato YYYY-MM-DD"""
        return datetime.now().strftime('%Y-%m-%d')
    
    def obtener_fecha_ayer(self):
        """Obtiene la fecha de ayer en formato YYYY-MM-DD"""
        return (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    def obtener_bolsillos_tipos_pago(self):
        """Obtiene todos los bolsillos (tipos de pago) con sus valores actuales"""
        try:
            consulta = """
                SELECT id, nombre, descripcion, actual 
                FROM tipos_pago 
                WHERE actual IS NOT NULL AND actual > 0
                ORDER BY nombre
            """
            
            resultado = self.conn.ejecutar_personalizado(consulta)
            
            bolsillos = []
            for row in resultado:
                bolsillos.append({
                    'id': row[0],
                    'nombre': row[1],
                    'descripcion': row[2],
                    'valor_actual': row[3] or 0
                })
            
            return bolsillos
        except Exception as e:
            print(f"Error obteniendo bolsillos: {e}")
            return []
    
    def obtener_ventas_por_tipo_pago_fecha(self, fecha, tipo_pago_id=None):
        """Obtiene el total de ventas por tipo de pago en una fecha específica"""
        try:
            if tipo_pago_id:
                consulta = """
                    SELECT COALESCE(SUM(pv.valor), 0) as total
                    FROM pagos_venta pv
                    INNER JOIN ventas v ON pv.venta_id = v.id
                    WHERE DATE(v.fecha) = ? AND pv.metodo_pago = (
                        SELECT nombre FROM tipos_pago WHERE id = ?
                    ) AND v.estado = 1
                """
                parametros = (fecha, tipo_pago_id)
            else:
                consulta = """
                    SELECT COALESCE(SUM(pv.valor), 0) as total
                    FROM pagos_venta pv
                    INNER JOIN ventas v ON pv.venta_id = v.id
                    WHERE DATE(v.fecha) = ? AND v.estado = 1
                """
                parametros = (fecha,)
            
            resultado = self.conn.ejecutar_personalizado(consulta, parametros)
            return resultado[0][0] if resultado else 0
        except Exception as e:
            print(f"Error obteniendo ventas por tipo de pago: {e}")
            return 0
    
    def obtener_servicios_por_fecha(self, fecha, nombre):
        """Obtiene el total de servicios en una fecha específica"""
        try:
            consulta = """
                SELECT COALESCE(SUM(pago), 0) as total
                FROM ordenes 
                WHERE DATE(fecha) = ? AND estado = 0 AND tipo_pago = ?
            """
            
            resultado = self.conn.ejecutar_personalizado(consulta, (fecha,nombre))
            return resultado[0][0] if resultado else 0
        except Exception as e:
            print(f"Error obteniendo servicios: {e}")
            return 0
    def obtener_gastos_por_fecha(self, fecha, nombre):
        """Obtiene el total de servicios en una fecha específica"""
        try:
            consulta = """
                SELECT COALESCE(SUM(monto), 0) as total
                FROM gastos 
                WHERE DATE(fecha_entrada) = ? AND metodo_pago = ?
            """
            
            resultado = self.conn.ejecutar_personalizado(consulta, (fecha,nombre))
            return resultado[0][0] if resultado else 0
        except Exception as e:
            print(f"Error obteniendo servicios: {e}")
            return 0
    
    def calcular_porcentaje_cambio(self, valor_actual, valor_anterior):
        """Calcula el porcentaje de cambio entre dos valores"""
        if valor_anterior == 0:
            return 100.0 if valor_actual > 0 else 0.0
        
        cambio = ((valor_actual - valor_anterior) / valor_anterior) * 100
        return round(cambio, 1)
    
    def generar_datos_tarjetas(self):
        """Genera los datos completos para las tarjetas empresariales"""
        try:
            fecha_hoy = self.obtener_fecha_hoy()
            fecha_ayer = self.obtener_fecha_ayer()
            
            # Obtener bolsillos (tipos de pago)
            bolsillos = self.obtener_bolsillos_tipos_pago()
            
            tarjetas_datos = []
            for bolsillo in bolsillos:
                # Valores para el bolsillo actual
                ventas_hoy = self.obtener_ventas_por_tipo_pago_fecha(fecha_hoy, bolsillo['id'])
                ventas_ayer = self.obtener_ventas_por_tipo_pago_fecha(fecha_ayer, bolsillo['id'])
                
                servicios_hoy = self.obtener_servicios_por_fecha(fecha_hoy, bolsillo['nombre'])
                servicios_ayer = self.obtener_servicios_por_fecha(fecha_ayer, bolsillo['nombre'])
                
                gastos_hoy = self.obtener_gastos_por_fecha(fecha_hoy, bolsillo['nombre'])
                gastos_ayer = self.obtener_gastos_por_fecha(fecha_ayer, bolsillo['nombre'])
                
                # Calcular total del bolsillo (valor actual configurado)
                total_bolsillo = bolsillo['valor_actual']

                # Calcular porcentajes de cambio
                porcentaje_ventas = self.calcular_porcentaje_cambio(ventas_hoy, ventas_ayer)
                porcentaje_servicios = self.calcular_porcentaje_cambio(servicios_hoy, servicios_ayer)
                porcentaje_gastos = self.calcular_porcentaje_cambio(gastos_hoy, gastos_ayer)
                
                # Determinar comportamiento (1 = subida, 0 = bajada)
                comportamiento_ventas = 1 if porcentaje_ventas >= 0 else 0
                comportamiento_servicios = 1 if porcentaje_servicios >= 0 else 0
                comportamiento_gastos = 1 if porcentaje_gastos >= 0 else 0
                
                comportamiento_general = 1 if (ventas_hoy + servicios_hoy + gastos_hoy) >= (ventas_ayer + servicios_ayer + gastos_ayer) else 0
                
                
                # Construir objeto de tarjeta
                tarjeta = {
                    "bolsillo": bolsillo['nombre'],
                    "total": total_bolsillo,
                    "porcentaje": self.calcular_porcentaje_cambio(
                        ventas_hoy + servicios_hoy - gastos_hoy, 
                        ventas_ayer + servicios_ayer - gastos_ayer
                    ),
                    "comportamiento": comportamiento_general,
                    "modulos": {
                        "ventas": {
                            "porcentaje": abs(porcentaje_ventas),
                            "sub_comportamiento": comportamiento_ventas,
                            "valor_hoy": ventas_hoy,
                            "valor_ayer": ventas_ayer
                        },
                        "servicios": {
                            "porcentaje": abs(porcentaje_servicios),
                            "sub_comportamiento": comportamiento_servicios,
                            "valor_hoy": servicios_hoy,
                            "valor_ayer": servicios_ayer
                        },
                        "gastos": {
                            "porcentaje": abs(porcentaje_gastos),
                            "sub_comportamiento": comportamiento_gastos,
                            "valor_hoy": gastos_hoy,
                            "valor_ayer": gastos_ayer
                        }
                    }
                }
                
                tarjetas_datos.append(tarjeta)
            
            return tarjetas_datos
            
        except Exception as e:
            print(f"Error generando datos de tarjetas: {e}")
            return []

# Instancia del generador de tarjetas
generador_tarjetas = TarjetasEmpresariales(conn_db)

@extras.route('/api/tarjetas-resumen', methods=['GET'])
def obtener_tarjetas_resumen():
    """Endpoint principal para obtener datos de tarjetas resumen"""
    try:
        datos = generador_tarjetas.generar_datos_tarjetas()
        
        return jsonify({
            "success": True,
            "data": datos,
            "total_tarjetas": len(datos),
            "fecha_generacion": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "data": []
        }), 500

@extras.route('/api/tarjetas-resumen/bolsillo/<int:tipo_pago_id>', methods=['GET'])
def obtener_tarjeta_individual(tipo_pago_id):
    """Endpoint para obtener datos de un bolsillo específico"""
    try:
        # Obtener información del tipo de pago específico
        consulta_tipo = "SELECT nombre, descripcion, actual FROM tipos_pago WHERE id = ?"
        
        resultado_tipo = conn_db.ejecutar_personalizado(consulta_tipo, (tipo_pago_id,))
        
        if not resultado_tipo:
            return jsonify({
                "success": False,
                "error": "Bolsillo no encontrado"
            }), 404
        
        fecha_hoy = generador_tarjetas.obtener_fecha_hoy()
        fecha_ayer = generador_tarjetas.obtener_fecha_ayer()
        
        nombre, descripcion, valor_actual = resultado_tipo[0]
        
        # Obtener datos específicos del bolsillo
        ventas_hoy = generador_tarjetas.obtener_ventas_por_tipo_pago_fecha(fecha_hoy, tipo_pago_id)
        ventas_ayer = generador_tarjetas.obtener_ventas_por_tipo_pago_fecha(fecha_ayer, tipo_pago_id)
        
        servicios_hoy = generador_tarjetas.obtener_servicios_por_fecha(fecha_hoy, nombre)
        servicios_ayer = generador_tarjetas.obtener_servicios_por_fecha(fecha_ayer, nombre)
        
        porcentaje_ventas = generador_tarjetas.calcular_porcentaje_cambio(ventas_hoy, ventas_ayer)
        porcentaje_servicios = generador_tarjetas.calcular_porcentaje_cambio(servicios_hoy, servicios_ayer)
        
        tarjeta = {
            "bolsillo": nombre,
            "total": valor_actual or 0,
            "porcentaje": generador_tarjetas.calcular_porcentaje_cambio(
                ventas_hoy + servicios_hoy, 
                ventas_ayer + servicios_ayer
            ),
            "comportamiento": 1 if (ventas_hoy + servicios_hoy) >= (ventas_ayer + servicios_ayer) else 0,
            "modulos": {
                "ventas": {
                    "porcentaje": abs(porcentaje_ventas),
                    "sub_comportamiento": 1 if porcentaje_ventas >= 0 else 0,
                    "valor_hoy": ventas_hoy,
                    "valor_ayer": ventas_ayer
                },
                "servicios": {
                    "porcentaje": abs(porcentaje_servicios),
                    "sub_comportamiento": 1 if porcentaje_servicios >= 0 else 0,
                    "valor_hoy": servicios_hoy,
                    "valor_ayer": servicios_ayer
                }
            }
        }
        
        return jsonify({
            "success": True,
            "data": tarjeta
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@extras.route('/api/estadisticas-generales', methods=['GET'])
def obtener_estadisticas_generales():
    """Endpoint para estadísticas generales del día"""
    try:
        fecha_hoy = generador_tarjetas.obtener_fecha_hoy()
        fecha_ayer = generador_tarjetas.obtener_fecha_ayer()
        
        # Totales generales
        total_ventas_hoy = generador_tarjetas.obtener_ventas_por_tipo_pago_fecha(fecha_hoy)
        total_ventas_ayer = generador_tarjetas.obtener_ventas_por_tipo_pago_fecha(fecha_ayer)
        
        total_servicios_hoy = generador_tarjetas.obtener_servicios_por_fecha(fecha_hoy)
        total_servicios_ayer = generador_tarjetas.obtener_servicios_por_fecha(fecha_ayer)
        
        estadisticas = {
            "fecha_actual": fecha_hoy,
            "fecha_anterior": fecha_ayer,
            "ventas": {
                "hoy": total_ventas_hoy,
                "ayer": total_ventas_ayer,
                "cambio_porcentual": generador_tarjetas.calcular_porcentaje_cambio(
                    total_ventas_hoy, total_ventas_ayer
                )
            },
            "servicios": {
                "hoy": total_servicios_hoy,
                "ayer": total_servicios_ayer,
                "cambio_porcentual": generador_tarjetas.calcular_porcentaje_cambio(
                    total_servicios_hoy, total_servicios_ayer
                )
            },
            "total_general": {
                "hoy": total_ventas_hoy + total_servicios_hoy,
                "ayer": total_ventas_ayer + total_servicios_ayer,
                "cambio_porcentual": generador_tarjetas.calcular_porcentaje_cambio(
                    total_ventas_hoy + total_servicios_hoy,
                    total_ventas_ayer + total_servicios_ayer
                )
            }
        }
        
        return jsonify({
            "success": True,
            "data": estadisticas
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@extras.route('/demo')
def demo_tarjetas():
    """Página de demostración con las tarjetas"""
    html_template = '''
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demo - Tarjetas Empresariales</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f7fa; }
            .container { max-width: 1200px; margin: 0 auto; }
            .titulo { text-align: center; color: #333; margin-bottom: 30px; }
            .loading { text-align: center; font-size: 18px; color: #666; }
            .error { color: red; text-align: center; padding: 20px; }
            .tarjetas-container { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
            
            .tarjeta-bolsillo {
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                border: 1px solid #e1e8ed;
                border-radius: 12px;
                padding: 24px 20px;
                width: 280px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .tarjeta-bolsillo:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
            }
            
            .tarjeta-bolsillo::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #4f46e5, #06b6d4);
            }
            
            .encabezado {
                font-weight: 600;
                font-size: 1.1em;
                color: #1f2937;
                margin-bottom: 16px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .total {
                font-size: 1.8em;
                font-weight: 700;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .modulos {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                padding-top: 16px;
                border-top: 1px solid #e5e7eb;
            }
            
            .modulo {
                text-align: center;
                padding: 12px 8px;
                background-color: rgba(249, 250, 251, 0.8);
                border-radius: 8px;
            }
            
            .color-verde { color: #059669; }
            .color-rojo { color: #dc2626; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="titulo">Tarjetas Empresariales - Demo</h1>
            <div id="contenido" class="loading">Cargando datos...</div>
        </div>

        <script>
            async function cargarTarjetas() {
                try {
                    const response = await fetch('/api/tarjetas-resumen');
                    const result = await response.json();
                    
                    if (result.success) {
                        mostrarTarjetas(result.data);
                    } else {
                        document.getElementById('contenido').innerHTML = 
                            `<div class="error">Error: ${result.error}</div>`;
                    }
                } catch (error) {
                    document.getElementById('contenido').innerHTML = 
                        `<div class="error">Error de conexión: ${error.message}</div>`;
                }
            }
            
            function mostrarTarjetas(datos) {
                const contenedor = document.getElementById('contenido');
                
                if (datos.length === 0) {
                    contenedor.innerHTML = '<div class="error">No hay datos disponibles</div>';
                    return;
                }
                
                let html = '<div class="tarjetas-container">';
                
                datos.forEach(bolsillo => {
                    const iconoTotal = bolsillo.comportamiento === 1 ? '↗' : '↘';
                    const colorTotal = bolsillo.comportamiento === 1 ? 'color-verde' : 'color-rojo';
                    
                    const iconoVentas = bolsillo.modulos.ventas.sub_comportamiento === 1 ? '↗' : '↘';
                    const colorVentas = bolsillo.modulos.ventas.sub_comportamiento === 1 ? 'color-verde' : 'color-rojo';
                    
                    const iconoServicios = bolsillo.modulos.servicios.sub_comportamiento === 1 ? '↗' : '↘';
                    const colorServicios = bolsillo.modulos.servicios.sub_comportamiento === 1 ? 'color-verde' : 'color-rojo';
                    
                    html += `
                        <div class="tarjeta-bolsillo">
                            <div class="encabezado">${bolsillo.bolsillo}</div>
                            <div class="total ${colorTotal}">
                                <strong>$${bolsillo.total.toLocaleString('es-ES')}</strong>
                                <span>${iconoTotal}</span>
                            </div>
                            <div class="modulos">
                                <div class="modulo">
                                    <div><strong>Ventas</strong></div>
                                    <div class="${colorVentas}">
                                        ${bolsillo.modulos.ventas.porcentaje}% ${iconoVentas}
                                    </div>
                                </div>
                                <div class="modulo">
                                    <div><strong>Servicios</strong></div>
                                    <div class="${colorServicios}">
                                        ${bolsillo.modulos.servicios.porcentaje}% ${iconoServicios}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
                contenedor.innerHTML = html;
            }
            
            // Cargar datos al iniciar
            cargarTarjetas();
            
            // Actualizar cada 30 segundos
            setInterval(cargarTarjetas, 30000);
        </script>
    </body>
    </html>
    '''
    return render_template_string(html_template)
