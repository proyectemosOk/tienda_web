import firebase_admin
from firebase_admin import credentials, firestore


class ServicioFirebase:
    def __init__(self, ruta_credenciales: str):
        if not firebase_admin._apps:
            cred = credentials.Certificate(ruta_credenciales)
            firebase_admin.initialize_app(cred)
        self.db = firestore.client()

    def crear_orden(self, orden_data: dict) -> str:
        doc_ref = self.db.collection('ordenes').document()
        doc_ref.set(orden_data)
        return doc_ref.id

    def obtener_orden(self, orden_id: str):
        doc = self.db.collection('ordenes').document(orden_id).get()
        return doc.to_dict() if doc.exists else None

    def obtener_todas_ordenes(self):
        return [
            {**doc.to_dict(), "id": doc.id}
            for doc in self.db.collection('ordenes').stream()
        ]

    def actualizar_orden(self, orden_id: str, nuevos_datos: dict):
        self.db.collection('ordenes').document(orden_id).update(nuevos_datos)

    def eliminar_orden(self, orden_id: str):
        self.db.collection('ordenes').document(orden_id).delete()
