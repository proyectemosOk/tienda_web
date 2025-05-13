import requests
import json

# Configuración básica
URL_API = "http://26.62.51.232:5000/api/ventas"
TOKEN_JWT = "TU_TOKEN_DE_AUTENTICACION"  # Reemplazar con token real

# Datos de ejemplo de venta
datos_venta = {
    "vendedor_id": 102,
    "cliente_id": 305,
    "total_venta": 189500,
    "metodos_pago": [
        {
            "metodo": "TARJETA_CREDITO",
            "valor": 120000,
            "acumular": True
        },
        {
            "metodo": "EFECTIVO",
            "valor": 69500,
            "acumular": False
        }
    ],
    "productos": [
        {
            "codigo": "SKU-1450",
            "cantidad": 2,
            "precio_unitario": 45000
        },
        {
            "codigo": "SKU-9987",
            "cantidad": 1,
            "precio_unitario": 99500
        }
    ],
    "lotes_productos": True
}

# Encabezados de la solicitud
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN_JWT}"
}

try:
    # Enviar solicitud POST
    respuesta = requests.post(URL_API, headers=headers, json=datos_venta)
    
    # Mostrar respuesta completa
    print("═"*50)
    print(f"Estado HTTP: {respuesta.status_code}")
    print("═"*50)
    
    if respuesta.headers.get('Content-Type') == 'application/json':
        print("Respuesta JSON:\n" + json.dumps(respuesta.json(), indent=2))
    else:
        print("Respuesta RAW:\n" + respuesta.text)
    
    # Verificar código de estado
    if respuesta.status_code == 201:
        print("\n✅ Venta creada exitosamente!")
        datos = respuesta.json()
        print(f"ID Venta: {datos.get('venta_id')}")
        print(f"Ref Firebase: {datos.get('detalles_firebase',{}).get('venta_ref')}")
    else:
        print(f"\n⚠️ Respuesta inesperada: {respuesta.reason}")

except requests.exceptions.RequestException as e:
    print(f"\n🔥 Error de conexión: {str(e)}")
except json.JSONDecodeError:
    print("\n⚠️ La respuesta no es JSON válido:")
    print(respuesta.text)
