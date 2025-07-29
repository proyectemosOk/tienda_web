#ifndef WIFI_CONFIG_H
#define WIFI_CONFIG_H

#include <WiFi.h>
#include "configuracion_wifi.h"
#include "modo_configuracion.h"

#define LED_CONFIG_PIN 21 // D21

// Estados WiFi
enum EstadoWiFi {WIFI_SIN_CONFIG, WIFI_CONECTANDO, WIFI_CONECTADO, WIFI_CONFIGURANDO};

EstadoWiFi estadoWiFi = WIFI_CONECTANDO;

const unsigned long INTERVALO_INTENTO_CONEXION = 10000; // 10 segundos
unsigned long ultimoIntentoConexion = 0;
int intentosConexion = 0;
const int MAX_INTENTOS_CONEXION = 3;

// Control del LED según estado WiFi
void actualizarLedEstado() {
    switch(estadoWiFi) {
        case WIFI_CONECTADO:
            digitalWrite(LED_CONFIG_PIN, LOW); // LED OFF: conectado
            break;
        case WIFI_CONECTANDO:
            digitalWrite(LED_CONFIG_PIN, HIGH); // LED ON: conectando/mal config
            break;
        case WIFI_SIN_CONFIG:
        case WIFI_CONFIGURANDO:
            digitalWrite(LED_CONFIG_PIN, HIGH); // LED ON: modo configuración
            break;
    }
}

// Llama una vez en setup()
void iniciarWiFi() {
    pinMode(LED_CONFIG_PIN, OUTPUT);
    if (!hayConfiguracionGuardada()) {
        estadoWiFi = WIFI_SIN_CONFIG;
        actualizarLedEstado();
        iniciarModoConfiguracion();
    } else {
        estadoWiFi = WIFI_CONECTANDO;
        intentosConexion = 0;
        ultimoIntentoConexion = 0;
        actualizarLedEstado();
    }
}

// Llama frecuentemente en loop()
void manejarWiFi() {
    switch(estadoWiFi) {
        case WIFI_SIN_CONFIG:
        case WIFI_CONFIGURANDO:
            actualizarLedEstado();
            manejarServidor(); // Gestiona portal cautivo
            break;

        case WIFI_CONECTANDO:
            if (WiFi.status() == WL_CONNECTED) {
                estadoWiFi = WIFI_CONECTADO;
                Serial.println("\n✅ Conectado a WiFi. IP: " + WiFi.localIP().toString());
                actualizarLedEstado();
                break;
            }
            // Manejar reintento no bloqueante
            if (millis() - ultimoIntentoConexion > INTERVALO_INTENTO_CONEXION && intentosConexion < MAX_INTENTOS_CONEXION) {
                ConfigWiFi config = cargarConfiguracion();
                Serial.println("🔌 Intentando conectar a: " + config.ssid);
                WiFi.begin(config.ssid.c_str(), config.password.c_str());
                ultimoIntentoConexion = millis();
                intentosConexion++;
                actualizarLedEstado();
            }
            // Si agotó intentos, activa modo configuración
            if (intentosConexion >= MAX_INTENTOS_CONEXION && WiFi.status() != WL_CONNECTED) {
                Serial.println("⚠️ No se pudo conectar. Activando modo configuración");
                estadoWiFi = WIFI_CONFIGURANDO;
                actualizarLedEstado();
                iniciarModoConfiguracion();
            }
            break;

        case WIFI_CONECTADO:
            // Conexión se perdió
            if (WiFi.status() != WL_CONNECTED) {
                Serial.println("❌ Se perdió la conexión WiFi");
                estadoWiFi = WIFI_CONECTANDO;
                intentosConexion = 0;
                ultimoIntentoConexion = 0;
                actualizarLedEstado();
            }
            break;
    }
}

// Función auxiliar para saber si estamos conectados
bool wifiEstaConectado() {
    return (estadoWiFi == WIFI_CONECTADO && WiFi.status() == WL_CONNECTED);
}

#endif
