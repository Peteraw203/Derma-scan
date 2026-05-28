/**
 * 🩺 DermaScan IoT Firmware - ESP32-C3 + TCS34725 Color Sensor
 * Features:
 *  1. Dynamic WiFi Portal configuration using WiFiManager
 *  2. Reading RGB + Clear values from Adafruit TCS34725 sensor
 *  3. In-code ASCON-128 Authenticated Encryption (AEAD) for Patient Privacy
 *  4. MQTT Publish using Public EMQX Broker (broker.emqx.io)
 * 
 * Pinout ESP32-C3 Super Mini (I2C default):
 *  - SDA: GPIO 8
 *  - SCL: GPIO 9
 *  - VCC: 3.3V
 *  - GND: GND
 * 
 * Required libraries to install in Arduino IDE:
 *  - Adafruit TCS34725 (by Adafruit)
 *  - Adafruit BusIO (by Adafruit)
 *  - WiFiManager (by tzapu)
 *  - PubSubClient (by Nick O'Leary)
 */

#include <Wire.h>
#include <WiFi.h>
#include <DNSServer.h>
#include <WebServer.h>
#include <WiFiManager.h>      // https://github.com/tzapu/WiFiManager
#include <PubSubClient.h>     // https://github.com/knolleary/pubsubclient
#include <Adafruit_TCS34725.h>

// --- Configuration ---
const char* mqtt_server = "broker.hivemq.com"; // Public MQTT Broker
const int mqtt_port = 1883;
const char* mqtt_topic_pub = "dermascan/iot/sensor_data";

// 128-bit key & nonce for ASCON-128 Encryption (Must match decryptor on backend/cloud)
const uint8_t crypto_key[16]   = {0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10};
const uint8_t crypto_nonce[16] = {0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F};

WiFiClient espClient;
PubSubClient mqttClient(espClient);
Adafruit_TCS34725 tcs = Adafruit_TCS34725(TCS34725_INTEGRATIONTIME_50MS, TCS34725_GAIN_1X);

unsigned long lastMsg = 0;
char msgBuffer[256];

// --- ASCON-128 Cryptography Core Implementation ---
typedef unsigned char u8;
typedef unsigned long long u64;

#define ROTR64(x, n) (((x) >> (n)) | ((x) << (64 - (n))))

void ascon_permutation(u64* state, int rounds) {
    const u8 constants[12] = {0xf0, 0xe1, 0xd2, 0xc3, 0xb4, 0xa5, 0x96, 0x87, 0x78, 0x69, 0x5a, 0x4b};
    int start_round = 12 - rounds;
    for (int r = start_round; r < 12; r++) {
        // Addition of round constant
        state[2] ^= constants[r];
        
        // Substitution layer (S-box)
        state[0] ^= state[4]; state[4] ^= state[3]; state[2] ^= state[1];
        u64 t0 = ~state[0] & state[1];
        u64 t1 = ~state[1] & state[2];
        u64 t2 = ~state[2] & state[3];
        u64 t3 = ~state[3] & state[4];
        u64 t4 = ~state[4] & state[0];
        state[0] ^= t1; state[1] ^= t2; state[2] ^= t3; state[3] ^= t4; state[4] ^= t0;
        state[1] ^= state[0]; state[0] ^= state[4]; state[3] ^= state[2]; state[2] = ~state[2];
        
        // Linear diffusion layer
        state[0] ^= ROTR64(state[0], 19) ^ ROTR64(state[0], 28);
        state[1] ^= ROTR64(state[1], 61) ^ ROTR64(state[1], 39);
        state[2] ^= ROTR64(state[2], 1)  ^ ROTR64(state[2], 6);
        state[3] ^= ROTR64(state[3], 10) ^ ROTR64(state[3], 17);
        state[4] ^= ROTR64(state[4], 7)  ^ ROTR64(state[4], 41);
    }
}

u64 bytes_to_u64(const u8* bytes) {
    u64 val = 0;
    for (int i = 0; i < 8; i++) {
        val |= ((u64)bytes[i] << (56 - 8 * i));
    }
    return val;
}

void u64_to_bytes(u64 val, u8* bytes) {
    for (int i = 0; i < 8; i++) {
        bytes[i] = (val >> (56 - 8 * i)) & 0xFF;
    }
}

// ASCON-128 AEAD Encrypt (Authenticated Encryption with Associated Data)
// Ciphertext length will be plaintext_len + 16 bytes (for the auth tag)
void ascon128_encrypt(const u8* key, const u8* nonce, const u8* plaintext, int plaintext_len, u8* ciphertext) {
    u64 state[5] = {0};
    
    // 1. Initialization
    state[0] = 0x80400c0600000000ULL; // IV for ASCON-128
    state[1] = bytes_to_u64(key);
    state[2] = bytes_to_u64(key + 8);
    state[3] = bytes_to_u64(nonce);
    state[4] = bytes_to_u64(nonce + 8);
    
    ascon_permutation(state, 12);
    
    state[3] ^= bytes_to_u64(key);
    state[4] ^= bytes_to_u64(key + 8);
    
    // 2. Processing Associated Data (Empty AD in this case)
    state[4] ^= 1ULL; // Domain separator
    ascon_permutation(state, 6);
    
    // 3. Processing Plaintext
    int bytes_remaining = plaintext_len;
    const u8* pt_ptr = plaintext;
    u8* ct_ptr = ciphertext;
    
    while (bytes_remaining >= 8) {
        u64 pt_block = bytes_to_u64(pt_ptr);
        state[0] ^= pt_block;
        u64_to_bytes(state[0], ct_ptr);
        
        ascon_permutation(state, 6);
        
        pt_ptr += 8;
        ct_ptr += 8;
        bytes_remaining -= 8;
    }
    
    // Final incomplete block + padding
    u64 last_block = 0;
    for (int i = 0; i < bytes_remaining; i++) {
        last_block |= ((u64)pt_ptr[i] << (56 - 8 * i));
    }
    last_block |= (1ULL << (56 - 8 * bytes_remaining));
    state[0] ^= last_block;
    
    u8 temp_ct[8];
    u64_to_bytes(state[0], temp_ct);
    for (int i = 0; i < bytes_remaining; i++) {
        ct_ptr[i] = temp_ct[i];
    }
    
    // 4. Finalization (tag generation)
    state[1] ^= bytes_to_u64(key);
    state[2] ^= bytes_to_u64(key + 8);
    ascon_permutation(state, 12);
    state[3] ^= bytes_to_u64(key);
    state[4] ^= bytes_to_u64(key + 8);
    
    // Append 16-byte auth tag at the end of ciphertext
    u64_to_bytes(state[3], ciphertext + plaintext_len);
    u64_to_bytes(state[4], ciphertext + plaintext_len + 8);
}

// Converts binary data to Hexadecimal String
String toHexString(const uint8_t* buf, size_t len) {
    String s = "";
    for (size_t i = 0; i < len; i++) {
        if (buf[i] < 0x10) s += "0";
        s += String(buf[i], HEX);
    }
    return s;
}

// --- MQTT Setup & Reconnection ---
void setup_mqtt() {
    mqttClient.setServer(mqtt_server, mqtt_port);
}

void reconnect_mqtt() {
    while (!mqttClient.connected()) {
        Serial.print("Attempting MQTT connection...");
        String clientId = "ESP32C3-DermaScan-" + String(random(0xffff), HEX);
        if (mqttClient.connect(clientId.c_str())) {
            Serial.println("connected");
        } else {
            Serial.print("failed, rc=");
            Serial.print(mqttClient.state());
            Serial.println(" try again in 5 seconds");
            delay(5000);
        }
    }
}

// --- Setup ---
void setup() {
    Serial.begin(115200);
    
    // Initialize I2C pins for ESP32-C3 Super Mini
    // Default SDA (GPIO 8), SCL (GPIO 9)
    Wire.begin(8, 9); 
    
    // Initialize TCS34725 Sensor
    if (tcs.begin()) {
        Serial.println("Found TCS34725 Color Sensor!");
    } else {
        Serial.println("No TCS34725 found ... check your connections!");
        while (1); // Halt
    }

    // WiFiManager: Auto Connect Portal
    WiFiManager wm;
    // wm.resetSettings(); // Uncomment this line to force wipe saved WiFi credentials
    
    Serial.println("Starting WiFi Portal...");
    if (!wm.autoConnect("DermaScan-AP-Config")) {
        Serial.println("Failed to connect WiFi. Restarting ESP...");
        delay(3000);
        ESP.restart();
    }
    
    Serial.println("WiFi Connected successfully!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    setup_mqtt();
}

// --- Loop ---
void loop() {
    if (!mqttClient.connected()) {
        reconnect_mqtt();
    }
    mqttClient.loop();

    unsigned long now = millis();
    // Publish sensor data every 5 seconds
    if (now - lastMsg > 5000) {
        lastMsg = now;

        uint16_t r, g, b, c;
        tcs.getRawData(&r, &g, &b, &c);

        // Calculate lux & color temperature (optional, nice for clinical feedback)
        uint16_t colorTemp = tcs.calculateColorTemperature(r, g, b);
        uint16_t lux = tcs.calculateLux(r, g, b);

        // 1. Prepare JSON Payload
        String payload = "{\"device\":\"ESP32C3-SkinSensor\",\"r\":" + String(r) + 
                         ",\"g\":" + String(g) + 
                         ",\"b\":" + String(b) + 
                         ",\"c\":" + String(c) + 
                         ",\"lux\":" + String(lux) + 
                         ",\"temp\":" + String(colorTemp) + "}";
        
        Serial.println("\n--- Raw Data ---");
        Serial.println(payload);

        // 2. Perform ASCON-128 Encryption
        int plain_len = payload.length();
        int cipher_len = plain_len + 16; // plaintext + 16 bytes tag
        uint8_t* ciphertext = (uint8_t*)malloc(cipher_len);

        if (ciphertext != NULL) {
            ascon128_encrypt(crypto_key, crypto_nonce, (const uint8_t*)payload.c_str(), plain_len, ciphertext);
            
            // Convert to HEX string to safely transmit over MQTT plain-text
            String hexCiphertext = toHexString(ciphertext, cipher_len);
            
            // Build Secure Wrapper JSON
            String securePayload = "{\"encrypted_hex\":\"" + hexCiphertext + "\",\"algorithm\":\"ASCON-128-AEAD\"}";
            
            Serial.println("--- Encrypted Data (ASCON-128) ---");
            Serial.println(securePayload);

            // 3. Publish to MQTT Broker
            if (mqttClient.publish(mqtt_topic_pub, securePayload.c_str())) {
                Serial.println("Published encrypted data successfully!");
            } else {
                Serial.println("Failed to publish message.");
            }

            free(ciphertext);
        } else {
            Serial.println("Memory allocation failed for encryption buffer!");
        }
    }
}
