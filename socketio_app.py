# socketio_app.py
from flask_socketio import SocketIO

socketio = SocketIO(async_mode='threading')

def init_socketio(app):
    socketio.init_app(app)
    return socketio
