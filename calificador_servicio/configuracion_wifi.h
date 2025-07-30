#ifndef CONFIGURACION_WIFI_H
#define CONFIGURACION_WIFI_H

#include <Preferences.h>

struct ConfigWiFi {
    String ssid;
    String password;
    String servidor;
};

Preferences preferences;

void guardarConfiguracion(const String& ssid, const String& password, const String& servidor) {
    preferences.begin("wifi_config", false);
    preferences.putString("ssid", ssid);
    preferences.putString("password", password);
    preferences.putString("servidor", servidor);
    preferences.end();
    Serial.println("💾 Configuración guardada.");
}

ConfigWiFi cargarConfiguracion() {
    ConfigWiFi config;
    preferences.begin("wifi_config", true);
    config.ssid = preferences.getString("ssid", "");
    config.password = preferences.getString("password", "");
    config.servidor = preferences.getString("servidor", "");
    preferences.end();
    return config;
}

bool hayConfiguracionGuardada() {
    preferences.begin("wifi_config", true);
    bool hay = preferences.isKey("ssid") && preferences.getString("ssid") != "";
    preferences.end();
    return hay;
}

void borrarConfiguracion() {
    preferences.begin("wifi_config", false);
    preferences.clear();
    preferences.end();
    Serial.println("🧹 Configuración borrada.");
}

#endif
