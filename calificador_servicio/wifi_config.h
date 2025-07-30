#ifndef WIFI_CONFIG_H
#define WIFI_CONFIG_H

#include <WiFi.h>
#include "configuracion_wifi.h"
#include "modo_configuracion.h"

#define LED_CONFIG_PIN 21 // LED principal WiFi

// Estados WiFi, incluye modo configuración explícito
enum EstadoWiFi { WIFI_SIN_CONFIG, WIFI_CONECTANDO, WIFI_CONECTADO, WIFI_ERROR, WIFI_CONFIGURANDO };

extern EstadoWiFi estadoWiFi;

const unsigned long INTERVALO_REINTENTO = 10000; // 10 seg
unsigned long ultimoIntentoConexion = 0;
int intentosConexion = 0;
const int MAX_INTENTOS_CONEXION = 3;

void actualizarLedEstado() {
    if (estadoWiFi == WIFI_CONECTADO) {
        digitalWrite(LED_CONFIG_PIN, HIGH); // LED encendido = conectado
    } else {
        digitalWrite(LED_CONFIG_PIN, LOW);  // LED apagado = no conectado o modo config
    }
}

void iniciarWiFi() {
    pinMode(LED_CONFIG_PIN, OUTPUT);
    if (!hayConfiguracionGuardada()) {
        estadoWiFi = WIFI_SIN_CONFIG;
        actualizarLedEstado();
        return;
    }
    estadoWiFi = WIFI_CONECTANDO;
    intentosConexion = 0;
    ultimoIntentoConexion = 0;
    actualizarLedEstado();
}

void manejarWiFi() {
    switch (estadoWiFi) {
        case WIFI_SIN_CONFIG:
        case WIFI_CONFIGURANDO:
            actualizarLedEstado();
            break;
        case WIFI_CONECTANDO:
            if (WiFi.status() == WL_CONNECTED) {
                estadoWiFi = WIFI_CONECTADO;
                Serial.println("✅ WiFi conectado: " + WiFi.localIP().toString());
                actualizarLedEstado();
                break;
            }
            if (millis() - ultimoIntentoConexion > INTERVALO_REINTENTO && intentosConexion < MAX_INTENTOS_CONEXION) {
                ConfigWiFi config = cargarConfiguracion();
                Serial.println("🔌 Intentando conectar a: " + config.ssid);
                WiFi.begin(config.ssid.c_str(), config.password.c_str());
                ultimoIntentoConexion = millis();
                intentosConexion++;
                actualizarLedEstado();
            }
            if (intentosConexion >= MAX_INTENTOS_CONEXION && WiFi.status() != WL_CONNECTED) {
                Serial.println("⚠️ No se pudo conectar. Cambiando a modo configuración");
                estadoWiFi = WIFI_CONFIGURANDO;
                actualizarLedEstado();
            }
            break;
        case WIFI_CONECTADO:
            if (WiFi.status() != WL_CONNECTED) {
                Serial.println("❌ Se perdió la conexión WiFi");
                estadoWiFi = WIFI_CONECTANDO;
                intentosConexion = 0;
                ultimoIntentoConexion = 0;
                actualizarLedEstado();
            }
            break;
        case WIFI_ERROR:
            // Puede usarse para estados de error si quieres
            break;
    }
}

bool wifiEstaConectado() {
    return (estadoWiFi == WIFI_CONECTADO && WiFi.status() == WL_CONNECTED);
}

#endif
