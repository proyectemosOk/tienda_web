#ifndef WIFI_CONFIG_H
#define WIFI_CONFIG_H

#include <WiFi.h>
#include "configuracion_wifi.h"
#include "modo_configuracion.h"

#define LED_CONFIG_PIN 21  // D21

bool conectarWiFi() {
  pinMode(LED_CONFIG_PIN, OUTPUT);
  Serial.println("🔌 Iniciando conexión");
  if (!hayConfiguracionGuardada()) {
    // No imprimir otro mensaje: lo hará iniciarModoConfiguracion()
    digitalWrite(LED_CONFIG_PIN, HIGH);     // LED ON: modo configuración
    iniciarModoConfiguracion();             // ← protegido para correr solo una vez
    return false;
  }

  ConfigWiFi config = cargarConfiguracion();
  WiFi.begin(config.ssid.c_str(), config.password.c_str());
  Serial.println("🔌 Intentando conectar a: " + config.ssid);

  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Conectado a WiFi. IP: " + WiFi.localIP().toString());
    digitalWrite(LED_CONFIG_PIN, LOW);      // LED OFF: conectado
    return true;
  }

  // Falló la conexión: activar modo configuración (un solo inicio y un solo mensaje)
  digitalWrite(LED_CONFIG_PIN, HIGH);
  iniciarModoConfiguracion();
  return false;
}

#endif
