/*
 * ROOT SENSE — Physical ESP32 IoT Field Sensor Firmware
 * -----------------------------------------------------
 * Sends real-time Soil Moisture (%), Temperature (°C), Humidity (%),
 * and Wi-Fi Signal Strength (dBm) directly to your Root Sense app backend.
 *
 * REQUIRED ARDUINO IDE LIBRARIES (Install via Library Manager):
 *   1. "DHT sensor library" by Adafruit
 *   2. "Adafruit Unified Sensor" by Adafruit
 *   (WiFi.h and HTTPClient.h are built into the ESP32 board package)
 *
 * WIRING:
 *   Capacitive Soil Moisture Sensor:
 *     VCC  -> ESP32 3.3V
 *     GND  -> ESP32 GND
 *     AOUT -> ESP32 GPIO 34  (ADC1 pin — safe to use with Wi-Fi ON)
 *
 *   DHT22 / DHT11 Temperature & Humidity Sensor:
 *     VCC  -> ESP32 3.3V
 *     GND  -> ESP32 GND
 *     DATA -> ESP32 GPIO 4
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// ===================== 1. WI-FI CONFIGURATION =====================
// Connect your ESP32, Laptop, and Phone to the SAME Wi-Fi or Hotspot
const char* WIFI_SSID     = "JioFiber-UgHCg";
const char* WIFI_PASSWORD = "Ya@150506";

// ===================== 2. SERVER CONFIGURATION ====================
// Pre-filled with your PC's active Wi-Fi IP (192.168.29.186).
// If you switch Wi-Fi/hotspot in the future, run `ipconfig` on your PC and update this IP.
const char* DEVICE_ID     = "ROOTSENSE_001";
const char* PRIMARY_URL   = "http://192.168.29.186:8000/sensor-data";      // FastAPI Collector
const char* FALLBACK_URL  = "http://192.168.29.186:3001/api/sensor-data";  // Express App Backend

// ===================== 3. SENSOR PIN & TYPE =======================
#define SOIL_PIN 34        // ADC1_CH6 (DO NOT use ADC2 pins when Wi-Fi is active)
#define DHT_PIN  4         // Digital pin for DHT sensor
#define DHT_TYPE DHT11     // Change to DHT22 if you are using a white DHT22 module

// ===================== 4. TWO-POINT CALIBRATION ===================
// For 100% accurate soil moisture:
//   1. Hold sensor in DRY AIR -> read "Raw ADC" in Serial Monitor -> set DRY_ADC
//   2. Dip sensor in WATER up to the white line -> read "Raw ADC" -> set WET_ADC
const int DRY_ADC = 3100;  // Typical capacitive probe in dry air (0% moisture)
const int WET_ADC = 1350;  // Typical capacitive probe in water (100% moisture)

// Send interval in milliseconds (5000ms = every 5 seconds)
const unsigned long SEND_INTERVAL_MS = 5000;

DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastSendMs = 0;

// Reads 15 ADC samples, sorts them, and averages the middle 9 (eliminates noise spikes)
int readFilteredSoilAdc() {
  const int SAMPLES = 15;
  int buf[SAMPLES];

  for (int i = 0; i < SAMPLES; i++) {
    buf[i] = analogRead(SOIL_PIN);
    delay(15);
  }

  // Insertion sort
  for (int i = 1; i < SAMPLES; i++) {
    int key = buf[i];
    int j = i - 1;
    while (j >= 0 && buf[j] > key) {
      buf[j + 1] = buf[j];
      j--;
    }
    buf[j + 1] = key;
  }

  // Average middle 9 samples (indices 3..11)
  long sum = 0;
  for (int i = 3; i <= 11; i++) {
    sum += buf[i];
  }
  return (int)(sum / 9);
}

float adcToMoisturePercent(int rawAdc) {
  if (DRY_ADC == WET_ADC) return 0.0f;
  float pct = ((float)(DRY_ADC - rawAdc) * 100.0f) / (float)(DRY_ADC - WET_ADC);
  if (pct < 0.0f) pct = 0.0f;
  if (pct > 100.0f) pct = 100.0f;
  return pct;
}

void ensureWiFiConnected() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 15000) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi Connected! ESP32 IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("Wi-Fi connection failed. Will retry...");
  }
}

bool postTelemetry(const char* url, const String& jsonPayload) {
  HTTPClient http;
  http.setTimeout(5000);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(jsonPayload);
  if (httpCode >= 200 && httpCode < 300) {
    Serial.print("[OK] POST ");
    Serial.print(url);
    Serial.print(" -> HTTP ");
    Serial.println(httpCode);
    Serial.println(http.getString());
    http.end();
    return true;
  } else {
    Serial.print("[ERR] POST ");
    Serial.print(url);
    Serial.print(" -> HTTP ");
    Serial.print(httpCode);
    Serial.print(" (");
    Serial.print(http.errorToString(httpCode));
    Serial.println(")");
    http.end();
    return false;
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== ROOT SENSE ESP32 SENSOR NODE ===");

  // Configure 12-bit ADC attenuation for full 0-3.3V range
  analogReadResolution(12);
  analogSetPinAttenuation(SOIL_PIN, ADC_11db);

  dht.begin();
  ensureWiFiConnected();
}

void loop() {
  ensureWiFiConnected();

  if (millis() - lastSendMs < SEND_INTERVAL_MS) {
    delay(100);
    return;
  }
  lastSendMs = millis();

  // 1. Read calibrated soil moisture
  int rawAdc = readFilteredSoilAdc();
  float soilMoisture = adcToMoisturePercent(rawAdc);

  // 2. Read temperature & humidity from DHT sensor (with 1 retry on NaN)
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  if (isnan(humidity) || isnan(temperature)) {
    delay(300);
    humidity = dht.readHumidity();
    temperature = dht.readTemperature();
  }

  int rssi = (WiFi.status() == WL_CONNECTED) ? WiFi.RSSI() : -99;

  Serial.println("------------------------------------");
  Serial.printf("Raw Soil ADC : %d  (DRY=%d, WET=%d)\n", rawAdc, DRY_ADC, WET_ADC);
  Serial.printf("Soil Moisture: %.1f%%\n", soilMoisture);
  if (!isnan(temperature) && !isnan(humidity)) {
    Serial.printf("Temperature  : %.1f C\n", temperature);
    Serial.printf("Humidity     : %.1f%%\n", humidity);
  } else {
    Serial.println("DHT Warning  : Failed to read DHT sensor (check GPIO 4 wiring & DHT_TYPE)");
  }
  Serial.printf("Wi-Fi Signal : %d dBm\n", rssi);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Skipping HTTP POST — Wi-Fi offline.");
    return;
  }

  // 3. Build JSON payload (omits temp/humidity cleanly if DHT isn't connected)
  String payload = "{";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"soil_moisture\":" + String(soilMoisture, 1) + ",";
  if (!isnan(temperature)) {
    payload += "\"temperature\":" + String(temperature, 1) + ",";
  }
  if (!isnan(humidity)) {
    payload += "\"humidity\":" + String(humidity, 1) + ",";
  }
  payload += "\"signal_dbm\":" + String(rssi);
  payload += "}";

  // 4. Send to FastAPI collector; automatically fall back to Express if FastAPI is offline
  if (!postTelemetry(PRIMARY_URL, payload)) {
    Serial.println("Trying fallback Express backend...");
    postTelemetry(FALLBACK_URL, payload);
  }
}
