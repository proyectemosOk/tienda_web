#include "wifi_config.h"
#include "calificacion.h"

// Pines para botones y touch
const int BOTON_MALO      = 15;
const int BOTON_REGULAR   = 2;
const int BOTON_BUENO     = 4;
const int BOTON_EXCELENTE = 5; 

// Antirrebote
unsigned long ultimoEnvio = 0;
const unsigned long debounceDelay = 1000;  // 1 seg

void setup() {
    Serial.begin(115200);
    delay(1000);
    pinMode(BOTON_MALO, INPUT_PULLUP);
    pinMode(BOTON_REGULAR, INPUT_PULLUP);
    pinMode(BOTON_BUENO, INPUT_PULLUP);
    pinMode(BOTON_EXCELENTE, INPUT_PULLUP);

    conectarWiFi();
}

void checarBotonYEnviar(int pin, int calificacion) {
    if (digitalRead(pin) == LOW && millis() - ultimoEnvio > debounceDelay) {
        enviarCalificacion(calificacion);
        Serial.print("📤 Calificación enviada: ");
        Serial.println(calificacion);
        ultimoEnvio = millis();
    }
}



void loop() {
    // Reintentar conexión WiFi si se pierde
    if (WiFi.status() != WL_CONNECTED) {
        conectarWiFi();
    }

    checarBotonYEnviar(BOTON_MALO,    1);
    checarBotonYEnviar(BOTON_REGULAR, 2);
    checarBotonYEnviar(BOTON_BUENO,   3);
    checarBotonYEnviar(BOTON_EXCELENTE,   4);
}
