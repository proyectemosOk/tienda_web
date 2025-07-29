#include <WiFi.h>

#include "wifi_config.h"
#include "calificacion.h"

// Pines botones
const int BOTON_MALO     = 15;
const int BOTON_REGULAR  = 2;
const int BOTON_BUENO    = 4;
const int BOTON_EXCELENTE= 5;

// Anti-rebote
const unsigned long debounceDelay = 1000; // 1 segundo
unsigned long ultimoEnvio = 0;

// Variables para debounce: estado previo botones
bool estadoPrevBotonMalo = HIGH;
bool estadoPrevBotonRegular = HIGH;
bool estadoPrevBotonBueno = HIGH;
bool estadoPrevBotonExcelente = HIGH;

void setup() {
  Serial.begin(115200);
  delay(1000); // Breve espera para estabilizar puerto serie
  
  pinMode(BOTON_MALO, INPUT_PULLUP);
  pinMode(BOTON_REGULAR, INPUT_PULLUP);
  pinMode(BOTON_BUENO, INPUT_PULLUP);
  pinMode(BOTON_EXCELENTE, INPUT_PULLUP);

  iniciarWiFi();  // Inicializa WiFi y modo configuración si es necesario
}

void checarBotonYEnviar(int pin, int calificacion, bool &estadoPrev) {
  bool estadoActual = digitalRead(pin);
  
  // Detectar flanco de HIGH->LOW y tiempo anti-rebote
  if (estadoActual == LOW && estadoPrev == HIGH && (millis() - ultimoEnvio > debounceDelay)) {
    if (wifiEstaConectado()) {
      enviarCalificacion(calificacion);
    } else {
      Serial.println("🚫 No conectado, no se envía calificación.");
    }
    ultimoEnvio = millis();
  }
  estadoPrev = estadoActual;
}

void loop() {
  manejarWiFi(); // Manejo de conexión WiFi y modo configuración

  if (wifiEstaConectado()) {
    checarBotonYEnviar(BOTON_MALO, 1, estadoPrevBotonMalo);
    checarBotonYEnviar(BOTON_REGULAR, 2, estadoPrevBotonRegular);
    checarBotonYEnviar(BOTON_BUENO, 3, estadoPrevBotonBueno);
    checarBotonYEnviar(BOTON_EXCELENTE, 4, estadoPrevBotonExcelente);
  }
}
