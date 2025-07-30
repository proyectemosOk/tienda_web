#include <WiFi.h>
#include "wifi_config.h"
#include "modo_configuracion.h"
#include "calificacion.h"
#include <WebServer.h>

// Pines de botones
const int BOTON_MALO      = 15;
const int BOTON_REGULAR   = 2;
const int BOTON_BUENO     = 4;
const int BOTON_EXCELENTE = 5;

// Pines leds extra para estado
const int LED_ERROR       = 22;  // LED si error WiFi o desconectado
const int LED_CONFIG_MODE = 23;  // LED si modo configuración

// Variables debounce botones
bool estadoPrevMalo      = HIGH;
bool estadoPrevRegular   = HIGH;
bool estadoPrevBueno     = HIGH;
bool estadoPrevExcelente = HIGH;

unsigned long ultimoEnvio = 0;
const unsigned long debounceDelay = 1000;

// Temporizador combinación para modo configuración
unsigned long tiempoBotonInicio = 0;
const unsigned long ESPERA_MODO_CONFIG = 7000; // 7 segundos

// Declaración global del estado WiFi (como en wifi_config.h)
EstadoWiFi estadoWiFi = WIFI_SIN_CONFIG;

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Configurar pines botones
  pinMode(BOTON_MALO, INPUT_PULLUP);
  pinMode(BOTON_REGULAR, INPUT_PULLUP);
  pinMode(BOTON_BUENO, INPUT_PULLUP);
  pinMode(BOTON_EXCELENTE, INPUT_PULLUP);

  // Configurar LEDs
  pinMode(LED_ERROR, OUTPUT);
  pinMode(LED_CONFIG_PIN, OUTPUT);  // definido en wifi_config.h
  pinMode(LED_CONFIG_MODE, OUTPUT);

  digitalWrite(LED_ERROR, LOW);
  digitalWrite(LED_CONFIG_PIN, LOW);
  digitalWrite(LED_CONFIG_MODE, LOW);

  iniciarWiFi(); // Del wifi_config.h activa conexión o estado inicial
  Serial.println("Inicializado");
}

void checarBotonYEnviar(int pin, int calificacion, bool &estadoPrev) {
  bool estadoActual = digitalRead(pin);
  if (estadoPrev == HIGH && estadoActual == LOW && millis() - ultimoEnvio > debounceDelay) {
    if (wifiEstaConectado()) {
      enviarCalificacion(calificacion);
    } else {
      Serial.println("🚫 No conectado a WiFi. No se envía calificación.");
    }
    ultimoEnvio = millis();
  }
  estadoPrev = estadoActual;
}

void actualizarLedsExtra() {
  digitalWrite(LED_ERROR, (estadoWiFi == WIFI_SIN_CONFIG || estadoWiFi == WIFI_ERROR) ? HIGH : LOW);
  digitalWrite(LED_CONFIG_MODE, (estadoWiFi == WIFI_CONFIGURANDO) ? HIGH : LOW);
}

void loop() {
  
  manejarWiFi();   // Control general de estado WiFi y LED principal

  actualizarLedsExtra();

  if (estadoWiFi == WIFI_CONFIGURANDO) {
    server.handleClient();
    manejarServidor();  // Atiende portal cautivo de configuración WiFi
    return;
  }

  if (estadoWiFi == WIFI_SIN_CONFIG || estadoWiFi == WIFI_ERROR) {
    bool bueno = (digitalRead(BOTON_BUENO) == LOW);
    bool excelente = (digitalRead(BOTON_EXCELENTE) == LOW);

    if (bueno && excelente) {
      if (tiempoBotonInicio == 0) {
        tiempoBotonInicio = millis();
      } else if (millis() - tiempoBotonInicio >= ESPERA_MODO_CONFIG) {
        Serial.println("⚙️ Activando modo configuración por botones.");
        estadoWiFi = WIFI_CONFIGURANDO;
        actualizarLedEstado();
        actualizarLedsExtra();
        iniciarModoConfiguracion();
        tiempoBotonInicio = 0;
      }
    } else {
      tiempoBotonInicio = 0;
    }
    return;
  }

  if (estadoWiFi == WIFI_CONECTADO) {
    checarBotonYEnviar(BOTON_MALO,      1, estadoPrevMalo);
    checarBotonYEnviar(BOTON_REGULAR,   2, estadoPrevRegular);
    checarBotonYEnviar(BOTON_BUENO,     3, estadoPrevBueno);
    checarBotonYEnviar(BOTON_EXCELENTE, 4, estadoPrevExcelente);
  }
}
