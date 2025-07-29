#ifndef MODO_CONFIGURACION_H
#define MODO_CONFIGURACION_H

#include <WebServer.h>
#include <WiFi.h>
#include "configuracion_wifi.h"

WebServer server(80);
const char* ap_ssid = "ESP32_Config"; // Nombre de red para configuración

// Puedes personalizar la página agregando mensajes de error si lo deseas.
String paginaFormulario(const String& mensaje = "") {
    return R"=====(<!DOCTYPE html>
<html>
<head>
    <title>Configurar WiFi</title>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
</head>
<body>
    <h2>Configuración WiFi</h2>
    <form method='POST' action='/guardar'>
        SSID:<br>
        <input type='text' name='ssid' required><br>
        Contraseña:<br>
        <input type='password' name='password' required><br>
        Dirección del servidor:<br>
        <input type='text' name='servidor' required><br><br>
        <input type='submit' value='Guardar'>
    </form>
    <p style='color:green;'>" + mensaje + R"(</p>
</body>
</html>)=====";
}

// Muestra el formulario principal
void manejarRaiz() {
    server.send(200, "text/html", paginaFormulario());
}

// Guarda la configuración y reinicia el dispositivo tras una redirección
void manejarGuardar() {
    String ssid = server.arg("ssid");
    String password = server.arg("password");
    String servidor = server.arg("servidor");

    // Validación básica de campos
    if (ssid.length() == 0 || password.length() == 0 || servidor.length() == 0) {
        String msg = "⚠️ Todos los campos son obligatorios.";
        server.send(200, "text/html", paginaFormulario(msg));
        return;
    }

    guardarConfiguracion(ssid, password, servidor);

    // Respuesta con redirección meta para reinicio después de mostrar mensaje
    String respuesta = R"=====(<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="2; url=/" />
</head>
<body>
    <h2>✅ Configuración guardada.</h2>
    <p>El dispositivo se reiniciará...<br>Si no lo hace, reinícialo manualmente.</p>
</body>
</html>)=====";
    server.send(200, "text/html", respuesta);

    // Reinicia en segundo plano tras breve espera
    delay(150); // Breve respiro para enviar la respuesta
    ESP.restart();
}

// Evita múltiples inicios del modo configuración
void iniciarModoConfiguracion() {
    static bool iniciado = false;
    if (iniciado) return;
    iniciado = true;

    WiFi.mode(WIFI_AP);
    WiFi.softAP(ap_ssid);
    IPAddress ip = WiFi.softAPIP();
    Serial.println("🔧 Modo configuración iniciado");
    Serial.println("📶 Conéctate a la red WiFi: " + String(ap_ssid));
    Serial.println("🌐 Abre http://" + ip.toString());

    server.on("/", manejarRaiz);
    server.on("/guardar", HTTP_POST, manejarGuardar);
    server.begin();

    // Aquí podrías agregar reglas de portal cautivo:
    // server.onNotFound([](){ server.sendHeader("Location", "/", true); server.send(302, "text/plain", ""); });
}

// Llama frecuentemente en loop() para manejar clientes web
void manejarServidor() {
    server.handleClient();
}

#endif
