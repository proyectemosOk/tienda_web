#include <Arduino.h>
#include <WiFi.h>
#include "wifi_config.h"
#include "modo_configuracion.h"
#include "calificacion.h"
#include <esp_task_wdt.h>

// Pines de botones
const int BOTON_MALO = 5;
const int BOTON_REGULAR = 4;
const int BOTON_BUENO = 2;
const int BOTON_EXCELENTE = 15;

// Pines leds extra para estado
const int LED_ERROR = 21;
const int LED_CONFIG_MODE = 23;

bool estadoPrevMalo = HIGH;
bool estadoPrevRegular = HIGH;
bool estadoPrevBueno = HIGH;
bool estadoPrevExcelente = HIGH;

unsigned long ultimoEnvio = 0;
const unsigned long debounceDelay = 1000; // 1 seg

unsigned long tiempoAnteriorBlink = 0;
bool ledEncendido = false;

unsigned long tiempoBotonInicio = 0;
const unsigned long ESPERA_MODO_CONFIG = 7000; // 7 segundos para activar modo config

const int WDT_TIMEOUT = 10; // segundos watchdog

unsigned long tiempoInicioSalirModoConfig = 0;
const unsigned long TIEMPO_SALIDA_MODO_CONFIG = 5000; // 5 segundos para salir modo config

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(BOTON_MALO, INPUT_PULLUP);
  pinMode(BOTON_REGULAR, INPUT_PULLUP);
  pinMode(BOTON_BUENO, INPUT_PULLUP);
  pinMode(BOTON_EXCELENTE, INPUT_PULLUP);

  pinMode(LED_ERROR, OUTPUT);
  pinMode(LED_CONFIG_PIN, OUTPUT);
  pinMode(LED_CONFIG_MODE, OUTPUT);

  digitalWrite(LED_ERROR, LOW);
  digitalWrite(LED_CONFIG_PIN, LOW);
  digitalWrite(LED_CONFIG_MODE, LOW);

  iniciarWiFi();

  esp_task_wdt_config_t wdt_config = {
    .timeout_ms = WDT_TIMEOUT * 1000,
    .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
    .trigger_panic = true
  };
  esp_task_wdt_init(&wdt_config);
  esp_task_wdt_add(NULL);

  Serial.println("🟢 Sistema iniciado.");
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

unsigned long tiempoUltimaRevisionWiFi = 0;
const unsigned long INTERVALO_REVISION_WIFI = 60000;

void entrarModoConfiguracion() {
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
      tiempoBotonInicio = 0;
      iniciarModoConfiguracion();
    }
  } else {
    tiempoBotonInicio = 0;
  }
}

void checarSalirModoConfiguracion() {
  if (estadoWiFi != WIFI_CONFIGURANDO) return;

  bool excelente = (digitalRead(BOTON_EXCELENTE) == LOW);

  if (excelente) {
    if (tiempoInicioSalirModoConfig == 0) {
      tiempoInicioSalirModoConfig = millis();
    } else if (millis() - tiempoInicioSalirModoConfig > TIEMPO_SALIDA_MODO_CONFIG) {
      Serial.println("🛑 Saliendo de modo configuración, reiniciando...");
      server.close();
      WiFi.softAPdisconnect(true);
      estadoWiFi = WIFI_CONECTANDO;
      ESP.restart();
    }
  } else {
    tiempoInicioSalirModoConfig = 0;
  }
}

void monitorWiFi() {
  if (millis() - tiempoUltimaRevisionWiFi > INTERVALO_REVISION_WIFI) {
    tiempoUltimaRevisionWiFi = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("⚠️ WiFi desconectado, intentando reconectar...");
      iniciarWiFi();
    }
  }
}

void loop() {
  esp_task_wdt_reset();

  manejarWiFi();
  manejarModoConfiguracion();

  actualizarLedsExtra();

  if (estadoWiFi == WIFI_CONFIGURANDO) {
    manejarModoConfiguracion();
    checarSalirModoConfiguracion();
    return;
  }

  if (estadoWiFi == WIFI_SIN_CONFIG || estadoWiFi == WIFI_ERROR) {
    entrarModoConfiguracion();
  }

  if (estadoWiFi == WIFI_CONECTADO) {
    checarBotonYEnviar(BOTON_MALO, 1, estadoPrevMalo);
    checarBotonYEnviar(BOTON_REGULAR, 2, estadoPrevRegular);
    checarBotonYEnviar(BOTON_BUENO, 3, estadoPrevBueno);
    checarBotonYEnviar(BOTON_EXCELENTE, 4, estadoPrevExcelente);

    monitorWiFi();
    enviarHeartbeat();
    entrarModoConfiguracion();
  }

  if (estadoWiFi == WIFI_CONECTANDO) {
    unsigned long ahora = millis();
    if (ahora - tiempoAnteriorBlink >= 500) {
      ledEncendido = !ledEncendido;
      digitalWrite(LED_CONFIG_PIN, ledEncendido ? HIGH : LOW);
      tiempoAnteriorBlink = ahora;
    }
  }
}
