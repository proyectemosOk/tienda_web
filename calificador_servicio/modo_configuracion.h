#ifndef MODO_CONFIGURACION_H
#define MODO_CONFIGURACION_H

#include <WiFi.h>
#include <WebServer.h>
#include <Arduino.h>
#include "configuracion_wifi.h"
#include <vector>

struct RedWiFi {
  String ssid;
  int32_t rssi;
};

WebServer server(80);
const char* ap_ssid = "ESP32_Config";

enum EstadoConfiguracionWiFi {
  CONFIG_INACTIVO,
  ESCANEANDO,
  AP_LISTO
};

EstadoConfiguracionWiFi estadoConfigWiFi = CONFIG_INACTIVO;
std::vector<RedWiFi> redesEscaneadas;
unsigned long tiempoInicioEscaneo = 0;

String paginaFormulario() {
  String opcionesSSID;
  if (redesEscaneadas.empty()) {
    opcionesSSID = "<option disabled>No se detectaron redes WiFi</option>";
  } else {
    for (auto& red : redesEscaneadas) {
      String color;
      int rssi = red.rssi;

      if (rssi <= -80) color = "red";
      else if (rssi <= -60) color = "orange";
      else color = "green";

      opcionesSSID += "<option value=\"" + red.ssid + "\">" + red.ssid +
                      " <span style='color:" + color + "'>📶</span> (" +
                      String(rssi) + " dBm)</option>\n";
    }
  }

  return R"=====(<!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <title>Configuración WiFi</title>
        <style>
            body {
            font-family: Arial, sans-serif;
            background-color: #f0f4f8;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            }
            h2 {
            color: #333;
            margin-bottom: 20px;
            }
            form {
            background-color: #fff;
            padding: 25px 30px;
            border-radius: 12px;
            box-shadow: 0px 4px 10px rgba(0,0,0,0.1);
            width: 90%;
            max-width: 400px;
            }
            label {
            font-weight: bold;
            display: block;
            margin-top: 15px;
            }
            select, input[type="text"], input[type="password"] {
            width: 100%;
            padding: 10px;
            margin-top: 5px;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-sizing: border-box;
            }
            button[type="submit"] {
            margin-top: 20px;
            width: 100%;
            padding: 12px;
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            }
            button[type="submit"]:hover {
            background-color: #1976D2;
            }
        </style>
        </head>
        <body>
        <h2>🔧 Configuración de WiFi</h2>
        <form action="/guardar" method="POST">
            <label>Red WiFi:</label>
            <select name="ssid" required>
            <option value="" selected>Seleccione una red WiFi</option>
    )=====" + opcionesSSID + R"=====( 
            </select>

            <label>Contraseña:</label>
            <input type="password" name="password" required>

            <label>Servidor (IP o URL):</label>
            <input type="text" name="servidor" required>

            <button type="submit">Guardar</button>
        </form>
        </body>
        </html>)=====";
}


void manejarRaiz() {
  server.send(200, "text/html", paginaFormulario());
}

void manejarGuardar() {
  String ssid = server.arg("ssid");
  String password = server.arg("password");
  String servidor = server.arg("servidor");

  if (ssid.isEmpty() || password.isEmpty() || servidor.isEmpty()) {
    server.send(200, "text/html", paginaFormulario());
    return;
  }

  guardarConfiguracion(ssid, password, servidor);
  Serial.println("💾 Configuración guardada.");

  String respuesta = R"=====(<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="3;url=/" />
    <title>Configuración guardada</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #e8f5e9;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .mensaje {
            background: #ffffff;
            border: 2px solid #4CAF50;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 6px 12px rgba(0,0,0,0.1);
        }
        .mensaje h2 {
            color: #2e7d32;
            margin-bottom: 10px;
        }
        .icono {
            font-size: 50px;
            color: #4CAF50;
            margin-bottom: 15px;
        }
        .sub {
            color: #555;
        }
    </style>
</head>
<body>
    <div class="mensaje">
        <div class="icono">✅</div>
        <h2>Configuración guardada correctamente</h2>
        <div class="sub">Reiniciando dispositivo...</div>
    </div>
</body>
</html>)=====";

  server.send(200, "text/html", respuesta);
  delay(200);
  ESP.restart();
}

void iniciarModoConfiguracion() {
  if (estadoConfigWiFi != CONFIG_INACTIVO) return;

  Serial.println("🔍 Iniciando escaneo WiFi (modo configuración)");

  // Establecer solo modo estación para escanear
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true);
  delay(200);

  bool exito = WiFi.scanNetworks(true);
  if (!exito) {
    Serial.println("❌ No se pudo iniciar el escaneo WiFi.");
    return;
  }

  tiempoInicioEscaneo = millis();
  estadoConfigWiFi = ESCANEANDO;
}

void manejarModoConfiguracion() {
  if (estadoConfigWiFi == ESCANEANDO) {
    int resultado = WiFi.scanComplete();
    Serial.println("📡 Resultado escaneo: " + String(resultado));

    if (resultado == WIFI_SCAN_RUNNING) return;

    if (resultado == WIFI_SCAN_FAILED) {
      Serial.println("⚠️ Escaneo fallido. Reintentando...");
      WiFi.disconnect(true);
      delay(200);
      WiFi.scanNetworks(true);
      tiempoInicioEscaneo = millis();
      return;
    }

    redesEscaneadas.clear();
    for (int i = 0; i < resultado; i++) {
      RedWiFi red;
      red.ssid = WiFi.SSID(i);
      red.rssi = WiFi.RSSI(i);
      redesEscaneadas.push_back(red);
    }
    WiFi.scanDelete();

    // Cambiar a modo AP para lanzar servidor
    WiFi.mode(WIFI_AP);
    delay(100);
    WiFi.softAP(ap_ssid);
    delay(1000);

    IPAddress ip = WiFi.softAPIP();
    Serial.println("🔧 Modo configuración iniciado");
    Serial.println("📶 Red AP creada: " + String(ap_ssid));
    Serial.println("🌐 Abre en navegador: http://" + ip.toString());

    server.on("/", manejarRaiz);
    server.on("/guardar", HTTP_POST, manejarGuardar);
    server.onNotFound([]() {
      server.sendHeader("Location", String("http://") + WiFi.softAPIP().toString(), true);
      server.send(302, "text/plain", "");
    });
    server.begin();

    estadoConfigWiFi = AP_LISTO;
  }

  if (estadoConfigWiFi == AP_LISTO) {
    server.handleClient();
  }
}

#endif
