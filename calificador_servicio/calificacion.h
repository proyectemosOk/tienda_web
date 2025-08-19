#ifndef CALIFICACION_H
#define CALIFICACION_H

#include <WiFi.h>
#include <HTTPClient.h>
#include "configuracion_wifi.h"
#include <vector>

struct CalificacionPendiente {
  int calificacion;
};

static std::vector<CalificacionPendiente> bufferPendientes;

void guardarPendiente(int calificacion) {
  bufferPendientes.push_back({calificacion});
  Serial.println("🗃️ Calificación guardada en buffer local.");
}

void enviarPendientes() {
  if (bufferPendientes.empty()) return;
  Serial.println("🔄 Intentando enviar calificaciones pendientes...");
  for (auto it = bufferPendientes.begin(); it != bufferPendientes.end();) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("🚫 No conectado a WiFi, se deja buffer intacto.");
      return;
    }
    ConfigWiFi config = cargarConfiguracion();
    if (config.servidor.length() == 0) {
      Serial.println("❌ Servidor no configurado, no se puede enviar.");
      return;
    }
    HTTPClient http;
    String url = "http://" + config.servidor + "/api/guardar_datos";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    String json = "{\"calificacion\": " + String(it->calificacion) + "}";
    int code = http.POST(json);

    if (code > 0 && (code >= 200 && code < 300)) {
      Serial.println("✅ Calificación pendiente enviada: " + String(it->calificacion));
      it = bufferPendientes.erase(it);
    } else {
      Serial.println("❌ Error enviando pendiente, código: " + String(code));
      http.end();
      return;
    }
    http.end();
  }
}

bool servidorDisponible() {
  if (WiFi.status() != WL_CONNECTED) return false;
  ConfigWiFi config = cargarConfiguracion();
  if (config.servidor.length() == 0) return false;
  HTTPClient http;
  String url = "http://" + config.servidor;
  http.begin(url);
  int code = http.sendRequest("HEAD");
  http.end();
  return (code > 0 && (code >= 200 && code < 400));
}

void enviarCalificacion(int calificacion) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("🚫 No conectado a WiFi. Guardando en buffer local.");
    guardarPendiente(calificacion);
    return;
  }
  if (!servidorDisponible()) {
    Serial.println("🚫 Servidor no accesible. Guardando en buffer local.");
    guardarPendiente(calificacion);
    return;
  }
  ConfigWiFi config = cargarConfiguracion();
  if (config.servidor.length() == 0) {
    Serial.println("❌ Servidor no configurado. No se envía calificación.");
    return;
  }

  HTTPClient http;
  String url = "http://" + config.servidor + "/api/guardar_datos";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  String json = "{\"calificacion\": " + String(calificacion) + "}";
  int httpResponseCode = http.POST(json);

  if (httpResponseCode > 0 && (httpResponseCode >= 200 && httpResponseCode < 300)) {
    Serial.println("📤 Calificación enviada: " + String(calificacion));
    enviarPendientes();
  } else {
    Serial.println("❌ Error enviando calificación. Código: " + String(httpResponseCode));
    guardarPendiente(calificacion);
  }
  http.end();
}

// Heartbeat cada 30 minutos
unsigned long ultimoHeartbeat = 0;
const unsigned long INTERVALO_HEARTBEAT = 30UL * 60UL * 1000UL;

void enviarHeartbeat() {
  if (millis() - ultimoHeartbeat < INTERVALO_HEARTBEAT) return;
  ultimoHeartbeat = millis();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("🚫 No conectado a WiFi. No se envía heartbeat.");
    return;
  }
  if (!servidorDisponible()) {
    Serial.println("🚫 Servidor no disponible. No se envía heartbeat.");
    return;
  }

  ConfigWiFi config = cargarConfiguracion();
  if (config.servidor.length() == 0) {
    Serial.println("❌ Servidor no configurado. No se envía heartbeat.");
    return;
  }

  HTTPClient http;
  String url = "http://" + config.servidor + "/api/heartbeat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  String json = "{\"status\":\"alive\"}";
  int code = http.POST(json);
  if (code > 0 && code < 300) {
    Serial.println("❤️ Heartbeat enviado correctamente.");
  } else {
    Serial.println("❌ Error enviando heartbeat. Código: " + String(code));
  }
  http.end();
}

#endif
