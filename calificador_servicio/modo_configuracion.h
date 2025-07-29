#ifndef MODO_CONFIGURACION_H
#define MODO_CONFIGURACION_H

#include <WiFi.h>
#include <WebServer.h>
#include "configuracion_wifi.h"

WebServer server(80);
const char* ap_ssid = "ESP32_Config";

String paginaFormulario() {
  return R"=====(
    <!DOCTYPE html>
    <html>
    <head>
      <title>Configurar WiFi</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        input, button { font-size: 1.2em; margin: 10px; padding: 10px; width: 80%; max-width: 300px; }
      </style>
    </head>
    <body>
      <h2>Configuración WiFi</h2>
      <form action="/guardar" method="POST">
        <input type="text" name="ssid" placeholder="Nombre WiFi" required><br>
        <input type="password" name="password" placeholder="Contraseña" required><br>
        <input type="text" name="servidor" placeholder="IP o dominio del servidor" required><br>
        <button type="submit">Guardar</button>
      </form>
    </body>
    </html>
  )=====";
}

void manejarRaiz() {
  server.send(200, "text/html", paginaFormulario());
}

void manejarGuardar() {
  String ssid = server.arg("ssid");
  String password = server.arg("password");
  String servidor = server.arg("servidor");

  guardarConfiguracion(ssid, password, servidor);

  String respuesta = "<h3>✅ Configuración guardada. El dispositivo se reiniciará...</h3>";
  server.send(200, "text/html", respuesta);

  delay(2000);
  ESP.restart();
}

void iniciarModoConfiguracion() {
  static bool iniciado = false;       // ← evita múltiples inicios
  if (iniciado) return;
  iniciado = true;

  WiFi.softAP(ap_ssid);
  IPAddress ip = WiFi.softAPIP();

  Serial.println("🔧 Modo configuración iniciado");
  Serial.println("📶 Conéctate a la red WiFi: " + String(ap_ssid));
  Serial.println("🌐 Luego abre http://" + ip.toString());

  server.on("/", manejarRaiz);
  server.on("/guardar", HTTP_POST, manejarGuardar);
  server.begin();
}

void manejarServidor() {
  server.handleClient();
}

#endif
