#ifndef CONFIGURACION_WIFI_H
#define CONFIGURACION_WIFI_H

#include <Preferences.h>

// Estructura clara para la configuración WiFi y el servidor destino
struct ConfigWiFi {
    String ssid;
    String password;
    String servidor;
};

Preferences preferences;

// Guarda la configuración, validando los tamaños para evitar corrupción
void guardarConfiguracion(const String& ssid, const String& password, const String& servidor) {
    if (ssid.length() == 0 || password.length() == 0 || servidor.length() == 0) {
        Serial.println("⚠️ Los campos no pueden estar vacíos.");
        return;
    }
    // Limita longitudes por seguridad
    if (ssid.length() > 32 || password.length() > 64 || servidor.length() > 100) {
        Serial.println("⚠️ Algún campo excede la longitud permitida.");
        return;
    }

    preferences.begin("wifi_config", false);
    preferences.putString("ssid", ssid);
    preferences.putString("password", password);
    preferences.putString("servidor", servidor);
    preferences.end();
    Serial.println("💾 Configuración guardada correctamente.");
}

// Carga la configuración y devuelve un struct
ConfigWiFi cargarConfiguracion() {
    ConfigWiFi config;
    preferences.begin("wifi_config", true);
    config.ssid = preferences.getString("ssid", "");
    config.password = preferences.getString("password", "");
    config.servidor = preferences.getString("servidor", "");
    preferences.end();
    return config;
}

// Determina si hay configuración válida guardada
bool hayConfiguracionGuardada() {
    preferences.begin("wifi_config", true);
    bool hay = preferences.isKey("ssid") && preferences.getString("ssid") != "";
    preferences.end();
    return hay;
}

// Borra la configuración entera, útil para “reset”
void borrarConfiguracion() {
    preferences.begin("wifi_config", false);
    preferences.clear();
    preferences.end();
    Serial.println("🧹 Configuración borrada.");
}

// Opcional: borra solo el servidor, dejando WiFi
void borrarSoloServidor() {
    preferences.begin("wifi_config", false);
    preferences.remove("servidor");
    preferences.end();
    Serial.println("🧹 Servidor borrado.");
}

#endif
