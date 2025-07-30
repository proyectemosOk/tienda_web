#ifndef MODO_CONFIGURACION_H
#define MODO_CONFIGURACION_H

#include <WiFi.h>
#include <WebServer.h>
#include "configuracion_wifi.h"

WebServer server(80);
const char* ap_ssid = "ESP32_Config";

String paginaFormulario() {
    return R"=====(<!DOCTYPE html>
<html>
<head><title>Configurar WiFi</title></head>
<body>
<h2>Configuración WiFi</h2>
<form method='POST' action='/guardar'>
  SSID:<br><input name='ssid' required><br><br>
  Contraseña:<br><input name='password' type='password' required><br><br>
  Servidor:<br><input name='servidor' required><br><br>
  <input type='submit' value='Guardar'>
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

    if (ssid.length() == 0 || password.length() == 0 || servidor.length() == 0) {
        server.send(200, "text/html", paginaFormulario());
        return;
    }

    guardarConfiguracion(ssid, password, servidor);
    Serial.println("💾 Configuración guardada.");

    String respuesta = R"=====(<!DOCTYPE html>
<html>
<head><meta http-equiv='refresh' content='3;url=/'></head>
<body>
<h2>✅ Configuración guardada. Reiniciando...</h2>
</body>
</html>
)=====";

    server.send(200, "text/html", respuesta);
    delay(200);
    ESP.restart();
}

void iniciarModoConfiguracion() {
    static bool iniciado = false;
    if (iniciado) return;
    iniciado = true;

    WiFi.mode(WIFI_AP);
    WiFi.softAP(ap_ssid);
    IPAddress ip = WiFi.softAPIP();

    Serial.println("🔧 Modo configuración iniciado");
    Serial.println("📶 Conéctate a la red: " + String(ap_ssid));
    Serial.println("🌐 Abre: http://" + ip.toString());

    server.on("/", manejarRaiz);
    server.on("/guardar", HTTP_POST, manejarGuardar);

    // Portal cautivo básico para redirigir cualquier URL
    server.onNotFound([]() {
        server.sendHeader("Location", String("http://") + WiFi.softAPIP().toString(), true);
        server.send(302, "text/plain", "");
    });

    server.begin();
}

void manejarServidor() {
    server.handleClient();
}

#endif
