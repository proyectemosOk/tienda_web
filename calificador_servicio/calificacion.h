#ifndef CALIFICACION_H
#define CALIFICACION_H

#include <WiFi.h>
#include <HTTPClient.h>
#include "configuracion_wifi.h"

void enviarCalificacion(int calificacion) {
    if (WiFi.status() == WL_CONNECTED) {
        ConfigWiFi config = cargarConfiguracion();
        if (config.servidor.length() == 0) {
            Serial.println("❌ Servidor no configurado. No se enviará calificación.");
            return;
        }

        HTTPClient http;
        String url = "http://" + config.servidor + "/api/guardar_datos";
        http.begin(url);
        http.addHeader("Content-Type", "application/json");
        String json = "{\"calificacion\": " + String(calificacion) + "}";

        int httpResponseCode = http.POST(json);

        if (httpResponseCode > 0) {
            Serial.println("📤 Calificación enviada: " + String(calificacion));
            String payload = http.getString();
            Serial.println("📩 Respuesta: " + payload);
        } else {
            Serial.println("❌ Error enviando calificación. Código HTTP: " + String(httpResponseCode));
        }

        http.end(); // Siempre liberar recursos
    } else {
        Serial.println("🚫 No conectado a WiFi. No se puede enviar calificación.");
    }
}

#endif
