import os
import sys
from datetime import datetime, timedelta

# Nombre del archivo de licencia
LICENCIA_NOMBRE = "cliente.licdat"

def ruta_licencia():
    """
    Retorna la ruta absoluta al archivo de licencia.
    """
    if getattr(sys, 'frozen', False):
        base = os.path.dirname(sys.executable)  # Ejecutable (.exe)
    else:
        base = os.path.dirname(os.path.abspath(__file__))  # Desarrollo
    return os.path.join(base, LICENCIA_NOMBRE)

def validar_licencia():
    """
    Valida si existe la licencia y si no ha expirado.
    """
    ruta = ruta_licencia()
    if not os.path.exists(ruta):
        print(f"❌ Licencia no encontrada en: {ruta}")
        return False, "Archivo de licencia no encontrado"

    datos = {}
    with open(ruta, "r", encoding="utf-8") as f:
        for linea in f:
            if "=" in linea:
                k, v = linea.strip().split("=", 1)
                datos[k] = v

    try:
        fecha_expira = datetime.strptime(datos.get("expira", ""), "%Y-%m-%d")
        if datetime.now() <= fecha_expira:
            return True, f"Licencia válida hasta {fecha_expira.date()}"
        else:
            return False, f"Licencia expirada el {fecha_expira.date()}"
    except Exception as e:
        return False, f"Error validando licencia: {e}"

def crear_licencia(cliente_id="ABC123", dias_validez=30):
    """
    Crea un archivo de licencia válido por N días desde hoy.
    """
    hoy = datetime.now()
    expira = hoy + timedelta(days=dias_validez)

    contenido = (
        f"cliente_id={cliente_id}\n"
        f"inicio={hoy.date()}\n"
        f"expira={expira.date()}\n"
    )

    ruta = ruta_licencia()
    try:
        with open(ruta, "w", encoding="utf-8") as f:
            f.write(contenido)
        print(f"✅ Licencia creada en: {ruta}")
        return True
    except Exception as e:
        print(f"❌ Error al crear licencia: {e}")
        return False
