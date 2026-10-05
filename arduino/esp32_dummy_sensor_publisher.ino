/*
 * ESP32 Sensor Publisher + Leak Alert LED
 * ----------------------------------------------------------------------------
 * Matches the system diagram:
 *   [Air Pressure] \
 *   [Airflow]       >--> ESP32 --(MQTT/TLS)--> EMQX Broker --> Node.js Subscriber
 *   [Temperature]  /                                           --> WebSocket --> React Dashboard
 *                                                              --> HTTP API  --> Database
 *
 * Bidirectional MQTT:
 *   ESP32 publishes sensor data  --> sensor/data
 *   ESP32 subscribes to commands <-- sensor/command  (leak alert LED control)
 *
 * Instead of reading real sensors, this sketch simulates all three values
 * with a smooth "random walk" so the data looks realistic on the dashboard.
 * Later, replace the simulate*() functions with real sensor reads.
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// ---------------------------------------------------------------------------
// WiFi credentials
// ---------------------------------------------------------------------------
const char* WIFI_SSID     = "Fiber-Zone";
const char* WIFI_PASSWORD = "sudam1999";

// ---------------------------------------------------------------------------
// EMQX Cloud broker settings
// ---------------------------------------------------------------------------
const char* MQTT_SERVER = "ha372312.ala.us-east-1.emqxsl.com";
const int   MQTT_PORT   = 8883;                  // 8883 = MQTT over TLS
const char* MQTT_USER   = "sliit";  // created in EMQX Authentication
const char* MQTT_PASS   = "sliit";

// Topic the Node.js backend subscribes to (the "Sensor Data" arrow in the diagram)
const char* MQTT_TOPIC_PUBLISH = "sensor/data";

// Topic the ESP32 subscribes to for commands from the backend (leak alerts)
const char* MQTT_TOPIC_COMMAND = "sensor/command";

// Identifies this device in the JSON payload (useful if you add more ESP32s later)
const char* DEVICE_ID = "esp32-01";

// How often to publish a new reading (milliseconds)
const unsigned long PUBLISH_INTERVAL_MS = 5000;

// ---------------------------------------------------------------------------
// LED Pin for leak alert
// ---------------------------------------------------------------------------
// GPIO 2 is the built-in LED on most ESP32 dev boards.
// Change this pin if you are using an external LED on a different GPIO.
const int LED_PIN = 2;

// ---------------------------------------------------------------------------
// Network objects
// ---------------------------------------------------------------------------
WiFiClientSecure espClient;       // TLS-capable TCP client
PubSubClient     client(espClient); // MQTT client running on top of it

// ---------------------------------------------------------------------------
// Simulated sensor state (current values, updated every cycle)
// ---------------------------------------------------------------------------
float airPressure = 1013.25f;  // hPa  (standard sea-level pressure)
float airflow     = 120.0f;    // L/min
float temperature = 25.0f;     // degrees Celsius

// ---------------------------------------------------------------------------
// Leak detection state (received from backend via MQTT)
// ---------------------------------------------------------------------------
bool leakDetected = false;

// ---------------------------------------------------------------------------
// Leak SIMULATION state (controlled via Serial Monitor)
// ---------------------------------------------------------------------------
// Type "Leak" in the Serial Monitor to start simulating a leak.
// Type "Normal" to go back to healthy operation.
bool simulatingLeak = false;

// Serial input buffer for reading commands
String serialBuffer = "";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Returns a random float between minVal and maxVal
float randomFloat(float minVal, float maxVal) {
  return minVal + (maxVal - minVal) * (random(0, 10001) / 10000.0f);
}

// Moves a value by a small random step and keeps it inside [lo, hi].
// This produces smooth, believable curves instead of jumpy random numbers.
float randomWalk(float current, float step, float lo, float hi) {
  current += randomFloat(-step, step);
  return constrain(current, lo, hi);
}

// ---------------------------------------------------------------------------
// Read Serial Monitor for "Leak" / "Normal" commands
// ---------------------------------------------------------------------------
void readSerialCommand() {
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      serialBuffer.trim();
      if (serialBuffer.length() > 0) {
        if (serialBuffer.equalsIgnoreCase("Leak")) {
          simulatingLeak = true;
          // Reset pressure to a high starting point so the drop is visible
          airPressure = 1030.0f;
          Serial.println("========================================");
          Serial.println("  LEAK SIMULATION STARTED");
          Serial.println("  Pressure will drop steadily.");
          Serial.println("  Type 'Normal' to stop.");
          Serial.println("========================================");
        } else if (serialBuffer.equalsIgnoreCase("Normal")) {
          simulatingLeak = false;
          // Reset pressure back to a normal value
          airPressure = 1013.25f;
          Serial.println("========================================");
          Serial.println("  NORMAL MODE RESTORED");
          Serial.println("  Pressure back to random walk.");
          Serial.println("========================================");
        } else {
          Serial.print("Unknown command: '");
          Serial.print(serialBuffer);
          Serial.println("'. Use 'Leak' or 'Normal'.");
        }
      }
      serialBuffer = "";
    } else {
      serialBuffer += c;
    }
  }
}

// ---------------------------------------------------------------------------
// Generate the next dummy reading for each "sensor"
// ---------------------------------------------------------------------------
// In NORMAL mode: all three values do a smooth random walk.
// In LEAK mode:   pressure drops steadily (~1.5 hPa per 5-second cycle)
//                 with very little noise so the backend sees a clean slope
//                 (high R²) and triggers leak detection.
//
// Backend detection needs:
//   - slope  < -0.5 kPa/min   (we produce ~1.8 kPa/min = 18 hPa/min)
//   - R²     >= 0.85           (tiny noise keeps it near 0.99)
//   - >= 10 samples in 120 s   (we send every 5 s → 24 samples)
//   - 3 consecutive confirms   (~15 cycles ≈ 75 seconds to trigger)
// ---------------------------------------------------------------------------
void simulateSensors() {
  if (simulatingLeak) {
    // Steady pressure drop: ~1.5 hPa per cycle + tiny noise for realism
    // 1.5 hPa / 5 sec = 18 hPa/min = 1.8 kPa/min  (well above 0.5 threshold)
    airPressure -= 1.5f;
    airPressure += randomFloat(-0.1f, 0.1f);  // tiny noise, keeps R² > 0.95

    // If pressure drops too low, wrap back to a higher value so we keep leaking
    if (airPressure < 980.0f) {
      airPressure = 1030.0f;
    }

    // Airflow and temperature still random-walk normally
    airflow     = randomWalk(airflow,     5.0f,  20.0f,  200.0f);
    temperature = randomWalk(temperature, 0.3f,  18.0f,   35.0f);
  } else {
    // Normal healthy operation — all values random walk
    airPressure = randomWalk(airPressure, 0.8f, 990.0f, 1040.0f);  // hPa
    airflow     = randomWalk(airflow,     5.0f,  20.0f,  200.0f);  // L/min
    temperature = randomWalk(temperature, 0.3f,  18.0f,   35.0f);  // deg C
  }
}

// ---------------------------------------------------------------------------
// MQTT callback – handles incoming messages on subscribed topics
// ---------------------------------------------------------------------------
// Called whenever a message arrives on "sensor/command".
// Expected JSON: {"device_id":"esp32-01","leakDetected":true}
// We parse the leakDetected boolean and set the LED accordingly.
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Build a string from the payload bytes
  char json[256];
  unsigned int copyLen = (length < sizeof(json) - 1) ? length : sizeof(json) - 1;
  memcpy(json, payload, copyLen);
  json[copyLen] = '\0';

  Serial.print("Received on [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(json);

  // Simple JSON parsing – look for "leakDetected":true or "leakDetected":false
  // Using a lightweight approach to avoid pulling in ArduinoJson for this one field.
  char* leakKey = strstr(json, "\"leakDetected\"");
  if (leakKey != NULL) {
    // Check if the value after the key contains "true" or "false"
    char* colonPos = strchr(leakKey, ':');
    if (colonPos != NULL) {
      if (strstr(colonPos, "true") != NULL) {
        leakDetected = true;
        digitalWrite(LED_PIN, HIGH);
        Serial.println(">>> LEAK ALERT: LED ON");
      } else if (strstr(colonPos, "false") != NULL) {
        leakDetected = false;
        digitalWrite(LED_PIN, LOW);
        Serial.println(">>> LEAK CLEAR: LED OFF");
      }
    }
  }
}

// ---------------------------------------------------------------------------
// WiFi
// ---------------------------------------------------------------------------
void setupWifi() {
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Block until the router gives us an IP address
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// ---------------------------------------------------------------------------
// MQTT
// ---------------------------------------------------------------------------
void reconnectMqtt() {
  // Keep trying until the broker accepts the connection
  while (!client.connected()) {
    // Make sure WiFi is still up before touching MQTT
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi lost, reconnecting...");
      setupWifi();
    }

    Serial.print("Connecting to EMQX broker... ");

    // Each client needs a unique ID, otherwise the broker kicks the older one.
    // The ESP32's eFuse MAC address is unique per chip.
    String clientId = "ESP32Client-";
    clientId += String((uint32_t)ESP.getEfuseMac(), HEX);

    if (client.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println("connected!");

      // Subscribe to the command topic so we can receive leak alerts
      client.subscribe(MQTT_TOPIC_COMMAND);
      Serial.print("Subscribed to: ");
      Serial.println(MQTT_TOPIC_COMMAND);
    } else {
      // rc codes: -2 = network/TLS failure, 4 = bad credentials, 5 = not authorized
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" - retrying in 5 seconds");
      delay(5000);
    }
  }
}

// Build the JSON payload and publish it to the broker
void publishSensorData() {
  char payload[256];

  // Single JSON message containing all three readings + leak status.
  // The Node.js subscriber can parse this and forward it over WebSocket / HTTP.
  snprintf(payload, sizeof(payload),
           "{\"device_id\":\"%s\",\"pressure\":%.2f,\"airflow\":%.2f,"
           "\"temperature\":%.2f,\"leakDetected\":%s,\"uptime_ms\":%lu}",
           DEVICE_ID, airPressure, airflow, temperature,
           leakDetected ? "true" : "false", millis());

  Serial.print("Publishing to [");
  Serial.print(MQTT_TOPIC_PUBLISH);
  Serial.print("]: ");
  Serial.println(payload);

  // publish() returns false if the message could not be sent
  if (!client.publish(MQTT_TOPIC_PUBLISH, payload)) {
    Serial.println("Publish failed!");
  }
}

// ---------------------------------------------------------------------------
// Arduino entry points
// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);

  // Configure LED pin as output and start with it OFF
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Seed the random generator with hardware noise so each boot differs
  randomSeed(esp_random());

  setupWifi();

  // NOTE: setInsecure() skips TLS certificate validation. The connection is
  // still encrypted, but the server's identity is not verified. This is fine
  // for testing. For production, load the EMQX CA certificate instead:
  //   espClient.setCACert(emqx_ca_cert);
  espClient.setInsecure();

  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(mqttCallback);  // Register the callback for incoming messages

  // Print instructions to Serial Monitor
  Serial.println();
  Serial.println("========================================");
  Serial.println("  AirTrace ESP32 Sensor Publisher");
  Serial.println("  Serial Commands:");
  Serial.println("    Leak   - Simulate a pressure leak");
  Serial.println("    Normal - Return to healthy data");
  Serial.println("========================================");
  Serial.println();
}

void loop() {
  // Check for Serial Monitor commands ("Leak" / "Normal")
  readSerialCommand();

  // Make sure we are connected to the broker
  if (!client.connected()) {
    reconnectMqtt();
  }

  // Let the MQTT library handle keep-alive pings and incoming packets
  // This also dispatches the callback for any received messages
  client.loop();

  // Publish a new reading every PUBLISH_INTERVAL_MS without blocking the loop
  static unsigned long lastPublish = 0;
  if (millis() - lastPublish >= PUBLISH_INTERVAL_MS) {
    lastPublish = millis();

    simulateSensors();    // 1. Generate new dummy values
    publishSensorData();  // 2. Send them to EMQX
  }
}
