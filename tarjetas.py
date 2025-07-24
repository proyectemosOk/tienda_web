from flask import Flask, jsonify, request, render_template_string
# from flask_cors import CORS
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
    
    def obtener_ventas_por_tipo_pago_fecha(self, fecha, tipo_pago_id=None, usuario_id = 2):
        """Obtiene el total de ventas por tipo de pago en una fecha específica"""
        try:
            if tipo_pago_id:
                consulta = """
                    SELECT COALESCE(SUM(pv.valor), 0) AS total
                    FROM pagos_venta pv
                    WHERE pv.metodo_pago = ? AND pv.estado = 1 and pv.usuario_id = ?
                """
                parametros = (tipo_pago_id, usuario_id)
            else:
                consulta = """
                    SELECT COALESCE(SUM(pv.valor), 0) as total
                    FROM pagos_venta pv
                    WHERE pv.estado = ? and pv.usuario_id = ?
                """
                parametros = (1, usuario_id)
            
            resultado = self.conn.ejecutar_personalizado(consulta, parametros)
            return resultado[0][0] if resultado else 0
        except Exception as e:
            print(f"Error obteniendo ventas por tipo de pago: {e}")
            return 0
    
    def obtener_servicios_por_fecha(self, fecha, id_tipo_pago, usuario_id):
        """Obtiene el total de servicios en una fecha específica y por tipo de pago"""
        try:
            # Validar tipo de dato
            if not isinstance(id_tipo_pago, (int, str)):
                raise ValueError("id_tipo_pago debe ser int o str")

            consulta = """
                SELECT COALESCE(SUM(monto), 0) AS total
                FROM pagos_servicios
                WHERE estado = 1 AND tipo_pago = ? and usuario_id = ?
            """
            resultado = self.conn.ejecutar_personalizado(consulta, (id_tipo_pago,usuario_id))
            return resultado[0][0] if resultado else 0
        except Exception as e:
            print(f"Error obteniendo servicios: {e}")
            return 0


    def obtener_gastos_por_fecha_id_pago(self, fecha, id_pago, usuario_id):
        """Obtiene el total de gastos y pagos de factura en una fecha específica por método de pago"""
        id_usuario = usuario_id
        try:
            # Validar tipo de parámetro
            if not isinstance(id_pago, (int, str)):
                raise ValueError("id_pago debe ser un int o str válido")

            # Consultar gastos
            consulta_gastos = """
                SELECT SUM(g.monto)
                FROM gastos g
                WHERE g.estado = 1 AND g.metodo_pago = ? and g.id_usuario = ?
            """
            resultado_gastos = self.conn.ejecutar_personalizado(consulta_gastos, (id_pago,id_usuario))
            gastos = resultado_gastos[0][0] if resultado_gastos else 0
            gastos = gastos if gastos else 0

            # Consultar pagos de factura
            consulta_facturas = """
                SELECT SUM(monto)
                FROM pagos_factura
                WHERE tipo_pago_id = ? AND estado = 1 and usuario_id = ? 
            """
            resultado_facturas = self.conn.ejecutar_personalizado(consulta_facturas, (id_pago,usuario_id))
            facturas = resultado_facturas[0][0] if resultado_facturas else 0
            facturas = facturas if facturas else 0

            total = facturas + gastos
            detalles = {
                "facturas": {"total": facturas},
                "gastos": {"total": gastos}
            }

            return total, detalles

        except Exception as e:
            print(f"❌ Error obteniendo servicios: {e}")
            return 0, {"facturas": {"total": 0}, "gastos": {"total": 0}}

    def obtener_gastos_por_fecha(self, fecha, usuario_id):
        """Obtiene el listado de gastos en una fecha específica"""
        try:
            consulta = """
                SELECT 
                    g.id,
                    g.fecha_entrada,
                    g.monto,
                    g.descripcion,
                    c.descripcion AS categoria,
                    tp.nombre AS metodo_pago
                FROM gastos g
                JOIN categoria_gastos c ON g.categoria = c.id
                JOIN tipos_pago tp ON g.metodo_pago = tp.id
                WHERE g.estado = 1 and g.id_usuario = ?
                ORDER BY g.fecha_entrada ASC;
            """
            resultado = self.conn.ejecutar_personalizado(consulta, (usuario_id, ))
            gastos = [
                {
                    "id": fila[0],
                    "fecha": fila[1],
                    "monto": fila[2],
                    "descripcion": fila[3],
                    "categoria": fila[4],
                    "metodo_pago": fila[5],
                }
                for fila in resultado or []
            ]

            return gastos

        except Exception as e:
            print(f"❌ Error obteniendo gastos: {e}")
            return []
    
    def calcular_porcentaje_cambio(self, valor_actual, valor_anterior):
        """Calcula el porcentaje de cambio entre dos valores"""
        if valor_anterior == 0:
            return 100.0 if valor_actual > 0 else 0.0
        
        cambio = ((valor_actual - valor_anterior) / valor_anterior) * 100
        return round(cambio, 1)
    
    def generar_datos_tarjetas(self,usuario_id):
        
        """Genera los datos completos para las tarjetas empresariales"""
        try:
            fecha_hoy = self.obtener_fecha_hoy()
            fecha_ayer = self.obtener_fecha_ayer()
            
            # Obtener bolsillos (tipos de pago)
            bolsillos = self.obtener_bolsillos_tipos_pago()
            
            tarjetas_datos = []
            for bolsillo in bolsillos:
                
                # Valores para el bolsillo actual
                ventas_hoy = self.obtener_ventas_por_tipo_pago_fecha(fecha_hoy, bolsillo['id'], usuario_id)
                print(f"{ventas_hoy=}")
                # ventas_ayer = self.obtener_ventas_por_tipo_pago_fecha(fecha_ayer, bolsillo['id'], usuario_id)
                servicios_hoy = self.obtener_servicios_por_fecha(fecha_hoy, bolsillo['id'], usuario_id)
                print(f"{servicios_hoy=}")
                
                # servicios_ayer = self.obtener_servicios_por_fecha(fecha_ayer, bolsillo['id'], usuario_id)
                total, gastos = self.obtener_gastos_por_fecha_id_pago(fecha_hoy, bolsillo['id'], usuario_id)
                print(f"{bolsillo["nombre"]=}\t{gastos=} \t{total=}")

                # Calcular total del bolsillo (valor actual configurado)
                total_bolsillo = ventas_hoy + servicios_hoy -total
                # if total_bolsillo==0:
                #     continue

                # # Calcular porcentajes de cambio
                # porcentaje_ventas = self.calcular_porcentaje_cambio(ventas_hoy, ventas_ayer)
                # porcentaje_servicios = self.calcular_porcentaje_cambio(servicios_hoy, servicios_ayer)

                # # Determinar comportamiento (1 = subida, 0 = bajada)
                # comportamiento_ventas = 1 if porcentaje_ventas >= 0 else 0
                # comportamiento_servicios = 1 if porcentaje_servicios >= 0 else 0

                # comportamiento_general = 1 if (ventas_hoy + servicios_hoy) >= (ventas_ayer + servicios_ayer) else 0

                # Construir objeto de tarjeta
                tarjeta = {
                    "bolsillo": bolsillo['nombre'],
                    "total": total_bolsillo,
                    # "porcentaje": self.calcular_porcentaje_cambio(
                    #     ventas_hoy + servicios_hoy, 
                    #     ventas_ayer + servicios_ayer
                    # ),
                    # "comportamiento": comportamiento_general,
                    "modulos": {
                        "ventas": {
                            "total":ventas_hoy
                            # "porcentaje": abs(porcentaje_ventas)
                            # "sub_comportamiento": comportamiento_ventas
                        },
                        "servicios": {
                            "total":servicios_hoy
                            # "porcentaje": abs(porcentaje_servicios)
                            # "sub_comportamiento": comportamiento_servicios
                        },
                        **gastos
                    }
                }
                tarjetas_datos.append(tarjeta)
            
            return tarjetas_datos
            
        except Exception as e:
            print(f"Error generando datos de tarjetas: {e}")
            return []

    def cargar_tipos_pagos_tipos_gastos(self):
        tipos_pago = self.conn.seleccionar("tipos_pago", "id, nombre")
        tipos_gatos = self.conn.seleccionar("categoria_gastos", "id, descripcion")
        datos ={
            "tipos_pagos":{t[0]:t[1] for t in tipos_pago},
            "tipos_gastos":{j[0]:j[1] for j in tipos_gatos},
        }
        return datos
    
    def generar_datos_gastos(self, usuario_id):
        
        try:
            fecha_hoy = self.obtener_fecha_hoy()
            
            return self.obtener_gastos_por_fecha(fecha=fecha_hoy,usuario_id = usuario_id)
            
        except:
            pass


# Instancia del generador de tarjetas
generador_tarjetas = TarjetasEmpresariales(conn_db)

@extras.route('/api/tarjetas-resumen', methods=['GET'])
def obtener_tarjetas_resumen():
    usuario_id = request.args.get("id", type=int)
    """Endpoint principal para obtener datos de tarjetas resumen"""
    try:
        datos = generador_tarjetas.generar_datos_tarjetas(usuario_id)
        
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

@extras.route('/api/gastos', methods=['GET'])
def obtener_resumen_gastos():
    usuario_id = request.args.get("id", type=int)
    
    """Endpoint principal para obtener datos de tarjetas resumen"""
    try:
        datos = generador_tarjetas.generar_datos_gastos(usuario_id)
        
        return jsonify({
            "success": True,
            "data": datos,
            "fecha_generacion": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "data": []
        }), 500

@extras.route('/api/tipos_gastos_pagos', methods=['GET'])
def obtener_resumen_gastos_pagos():
    try:
        datos = generador_tarjetas.cargar_tipos_pagos_tipos_gastos()
        return jsonify({
            "success": True,
            "data": datos,
            "fecha_generacion": datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "data": []
        }), 500

@extras.route('/api/guardar_categoria_gastos', methods=['POST'])
def guardar_categoria_gastos():
    try:
        datos = request.get_json()
        if not datos or "descripcion" not in datos:
            return jsonify({
                "success": False,
                "error": "Falta el campo 'descripcion'"
            }), 400

        id_cat_gastos, error = generador_tarjetas.conn.insertar(
            "categoria_gastos",
            {"descripcion": datos["descripcion"]}
        )

        if not id_cat_gastos:
            return jsonify({
                "success": False,
                "error": error or "No se pudo insertar la categoría"
            }), 500

        return jsonify({
            "success": True,
            "id": id_cat_gastos
        }), 200

    except Exception as e:
        # Detecta si la excepción es por clave duplicada
        if "UNIQUE constraint failed" in str(e):
            return jsonify({
                "success": False,
                "error": "La categoría ya existe"
            }), 409  # 409 Conflict

        return jsonify({
            "success": False,
            "error": "Excepción en el servidor",
            "excepcion": str(e)
        }), 500
    
@extras.route('/api/guardar_tipo_pago', methods=['POST'])
def guardar_tipo_pago():
    try:
        datos = request.get_json()
        
        if not datos or "nombre" not in datos:
            return jsonify({
                "success": False,
                "error": "Falta el campo 'nombre'"
            }), 400
        
        nuevo_tipo = {
            "nombre": datos["nombre"].strip(),
            "descripcion": datos.get("descripcion", "").strip()
        }

        id_tipo_pago, error = generador_tarjetas.conn.insertar("tipos_pago", nuevo_tipo)

        if error:
            return jsonify({
                "success": False,
                "error": error
            }), 409 if "columna" in error else 500

        return jsonify({
            "success": True,
            "id": id_tipo_pago
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Excepción inesperada",
            "excepcion": str(e)
        }), 500

@extras.route('/api/guardar_gasto', methods=['POST'])
def guardar_gasto():
    try:
        datos = request.get_json()

        campos_requeridos = ['monto', 'descripcion', "id_usuario", 'categoria', 'metodo_pago']
        if not all(campo in datos and datos[campo] for campo in campos_requeridos):
            return jsonify({
                "success": False,
                "error": "Faltan campos obligatorios"
            }), 400

        nuevo_gasto = {
            "fecha_entrada":datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "monto": float(datos["monto"]),
            "descripcion": datos["descripcion"].strip(),
            "id_usuario": int(datos["id_usuario"]),
            "categoria": int(datos["categoria"]),
            "metodo_pago": int(datos["metodo_pago"]),
        }

        id_gasto, error = generador_tarjetas.conn.insertar("gastos", nuevo_gasto)

        if error:
            return jsonify({
                "success": False,
                "error": error
            }), 500

        return jsonify({
            "success": True,
            "id": id_gasto
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Excepción inesperada",
            "excepcion": str(e)
        }), 500

@extras.route('/api/obtener_gastos', methods=['GET'])
def obtener_gastos():
    usuario_id = request.args.get("id", type=int)
    print(usuario_id)
    try:

        consulta = '''
            SELECT 
                g.id, 
                g.descripcion, 
                g.monto, 
                g.id_usuario,         -- ID del usuario que hizo el gasto
                u.nombre AS usuario,  -- Nombre del usuario
                g.fecha_entrada AS fecha, 
                cg.descripcion AS categoria
            FROM gastos g
            JOIN categoria_gastos cg ON g.categoria = cg.id
            JOIN usuarios u ON g.id_usuario = u.id
            WHERE g.estado = ? and g.id_usuario = ?
            ORDER BY g.fecha_entrada DESC
        '''        
        filas = generador_tarjetas.conn.ejecutar_personalizado(consulta,(1,usuario_id))
        if filas is None:
            return jsonify({
                "success": False,
                "error": "Error al ejecutar la consulta."
            }), 500

        gastos = [
            {
                "id": fila[0],
                "descripcion": fila[1],
                "monto": fila[2],
                "id_usuario":fila[3],
                "nombre_usuario":fila[4],
                "fecha": fila[5],
                "categoria": fila[6]
            }
            for fila in filas
        ]
        
        consulta = '''
            SELECT 
                SUM(monto) AS TOTAL
            FROM pagos_factura
            WHERE estado = ?
        '''

        filas = conn_db.ejecutar_personalizado(consulta,(1,))[0][0]

        total_facruras = filas


        return jsonify({
            "success": True,
            "gastos": gastos,
            "facturas": total_facruras,
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
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


@extras.route('/api/eliminar_gasto/<int:gasto_id>', methods=['DELETE'])
def eliminar_gasto(gasto_id):
    try:
        # Verificar que exista antes de borrar (opcional pero recomendado)
        existe = conn_db.seleccionar(
            tabla='gastos',
            columnas='id',
            condicion='id = ?',
            parametros=(gasto_id,)
        )

        if not existe:
            return jsonify(success=False, error='Gasto no encontrado'), 404

        # Usar tu método eliminar
        conn_db.eliminar(
            tabla='gastos',
            condicion='id = ?',
            parametros=(gasto_id,)
        )

        return jsonify(success=True, message='Gasto eliminado correctamente')

    except Exception as e:
        print('❌ Error al eliminar gasto:', e)
        return jsonify(success=False, error=str(e)), 500

