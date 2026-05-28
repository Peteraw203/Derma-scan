"use client";

import { useState, useEffect, useRef } from "react";
import {
  Cpu, Activity, CheckCircle2, ShieldCheck, AlertTriangle,
  Wifi, HelpCircle, RefreshCw, Play, Image as ImageIcon,
  Lock, Unlock, ArrowRight, Sparkles, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import mqtt from "mqtt";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// --- ASCON-128 Cryptography Core (ES5/Target-agnostic BigInt Implementation) ---
const ROTR64 = (x: bigint, n: bigint): bigint => {
  const nBig = BigInt(n);
  const mask = BigInt("0xffffffffffffffff");
  return (((x >> nBig) & mask) | ((x << (BigInt(64) - nBig)) & mask)) & mask;
};

const ascon_permutation = (state: bigint[], rounds: number) => {
  const constants = [
    BigInt("0xf0"), BigInt("0xe1"), BigInt("0xd2"), BigInt("0xc3"),
    BigInt("0xb4"), BigInt("0xa5"), BigInt("0x96"), BigInt("0x87"),
    BigInt("0x78"), BigInt("0x69"), BigInt("0x5a"), BigInt("0x4b")
  ];
  const start_round = 12 - rounds;
  const mask = BigInt("0xffffffffffffffff");

  for (let r = start_round; r < 12; r++) {
    state[2] ^= constants[r];

    state[0] ^= state[4]; state[4] ^= state[3]; state[2] ^= state[1];
    const t0 = (~state[0]) & state[1];
    const t1 = (~state[1]) & state[2];
    const t2 = (~state[2]) & state[3];
    const t3 = (~state[3]) & state[4];
    const t4 = (~state[4]) & state[0];
    state[0] ^= t1; state[1] ^= t2; state[2] ^= t3; state[3] ^= t4; state[4] ^= t0;
    state[1] ^= state[0]; state[0] ^= state[4]; state[3] ^= state[2]; state[2] = (~state[2]) & mask;

    state[0] = (state[0] ^ ROTR64(state[0], BigInt(19)) ^ ROTR64(state[0], BigInt(28))) & mask;
    state[1] = (state[1] ^ ROTR64(state[1], BigInt(61)) ^ ROTR64(state[1], BigInt(39))) & mask;
    state[2] = (state[2] ^ ROTR64(state[2], BigInt(1)) ^ ROTR64(state[2], BigInt(6))) & mask;
    state[3] = (state[3] ^ ROTR64(state[3], BigInt(10)) ^ ROTR64(state[3], BigInt(17))) & mask;
    state[4] = (state[4] ^ ROTR64(state[4], BigInt(7)) ^ ROTR64(state[4], BigInt(41))) & mask;
  }
};

const bytes_to_u64 = (bytes: Uint8Array, offset: number): bigint => {
  let val = BigInt(0);
  for (let i = 0; i < 8; i++) {
    val |= (BigInt(bytes[offset + i]) << BigInt(56 - 8 * i));
  }
  return val;
};

const u64_to_bytes = (val: bigint, bytes: Uint8Array, offset: number) => {
  for (let i = 0; i < 8; i++) {
    bytes[offset + i] = Number((val >> BigInt(56 - 8 * i)) & BigInt(0xff));
  }
};

const ascon128_decrypt = (
  key: Uint8Array,
  nonce: Uint8Array,
  ciphertext: Uint8Array
): string | null => {
  const ciphertext_len = ciphertext.length;
  if (ciphertext_len < 16) return null; // Tag is 16 bytes
  const plaintext_len = ciphertext_len - 16;
  const plaintext = new Uint8Array(plaintext_len);

  const mask = BigInt("0xffffffffffffffff");
  const state = [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)];

  // 1. Initialization
  state[0] = BigInt("0x80400c0600000000");
  state[1] = bytes_to_u64(key, 0);
  state[2] = bytes_to_u64(key, 8);
  state[3] = bytes_to_u64(nonce, 0);
  state[4] = bytes_to_u64(nonce, 8);

  ascon_permutation(state, 12);

  state[3] = (state[3] ^ bytes_to_u64(key, 0)) & mask;
  state[4] = (state[4] ^ bytes_to_u64(key, 8)) & mask;

  // 2. Processing Associated Data (Empty AD)
  state[4] = (state[4] ^ BigInt(1)) & mask;
  ascon_permutation(state, 6);

  // 3. Processing Ciphertext
  let bytes_remaining = plaintext_len;
  let ct_offset = 0;
  let pt_offset = 0;

  while (bytes_remaining >= 8) {
    const ct_block = bytes_to_u64(ciphertext, ct_offset);
    const pt_block = state[0] ^ ct_block;
    u64_to_bytes(pt_block, plaintext, pt_offset);
    state[0] = ct_block;

    ascon_permutation(state, 6);

    ct_offset += 8;
    pt_offset += 8;
    bytes_remaining -= 8;
  }

  // Final incomplete block
  if (bytes_remaining > 0) {
    let last_ct_block = BigInt(0);
    for (let i = 0; i < bytes_remaining; i++) {
      last_ct_block |= (BigInt(ciphertext[ct_offset + i]) << BigInt(56 - 8 * i));
    }

    const bitShift = BigInt(56 - 8 * bytes_remaining);
    const maskBits = BigInt(64 - 8 * bytes_remaining);
    const maskBlock = (BigInt(1) << maskBits) - BigInt(1);
    const padding = BigInt(1) << bitShift;

    // Decrypt final block
    const pt_last = (state[0] ^ last_ct_block) & ~maskBlock;
    const temp_pt = new Uint8Array(8);
    u64_to_bytes(pt_last, temp_pt, 0);
    for (let i = 0; i < bytes_remaining; i++) {
      plaintext[pt_offset + i] = temp_pt[i];
    }

    state[0] = last_ct_block | ((state[0] ^ padding) & maskBlock);
  } else {
    state[0] = state[0] ^ (BigInt(1) << BigInt(56));
  }

  // 4. Finalization (tag verification)
  state[1] = (state[1] ^ bytes_to_u64(key, 0)) & mask;
  state[2] = (state[2] ^ bytes_to_u64(key, 8)) & mask;
  ascon_permutation(state, 12);

  const tag0 = (state[3] ^ bytes_to_u64(key, 0)) & mask;
  const tag1 = (state[4] ^ bytes_to_u64(key, 8)) & mask;

  const expected_tag0 = bytes_to_u64(ciphertext, plaintext_len);
  const expected_tag1 = bytes_to_u64(ciphertext, plaintext_len + 8);

  if (tag0 !== expected_tag0 || tag1 !== expected_tag1) {
    console.error("ASCON tag verification failed!");
    return null;
  }

  return new TextDecoder().decode(plaintext);
};

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

// Crypto constants (Must match ESP32 key/nonce exactly)
const crypto_key = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10]);
const crypto_nonce = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F]);

// --- Color Helpers ---
interface SkinColor {
  r: number;
  g: number;
  b: number;
  c: number;
  lux: number;
  temp: number;
  hex: string;
}

const rgbToHex = (r: number, g: number, b: number): string => {
  const scale = (val: number) => {
    const maxVal = Math.max(r, g, b, 255);
    const scaled = Math.min(255, Math.floor((val / maxVal) * 255));
    return scaled.toString(16).padStart(2, "0");
  };
  return `#${scale(r)}${scale(g)}${scale(b)}`;
};

export default function IotScreen() {
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [scanStep, setScanStep] = useState<"none" | "baseline" | "target">("none");
  const scanStepRef = useRef<"none" | "baseline" | "target">("none");
  const [showSchematicModal, setShowSchematicModal] = useState<boolean>(false);

  useEffect(() => {
    scanStepRef.current = scanStep;
  }, [scanStep]);

  // Readings
  const [baselineColor, setBaselineColor] = useState<SkinColor | null>(null);
  const [targetColor, setTargetColor] = useState<SkinColor | null>(null);

  // Encryption logs
  const [encryptedHex, setEncryptedHex] = useState<string>("");
  const [decryptedText, setDecryptedText] = useState<string>("");
  const [cryptoStatus, setCryptoStatus] = useState<"idle" | "decrypting" | "success" | "failed">("idle");
  const [lastMqttTimestamp, setLastMqttTimestamp] = useState<string>("");

  const mqttClientRef = useRef<any>(null);

  const [scanData, setScanData] = useState<{ label: string; confidence: number } | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("derma_scan_result");
    if (cached) {
      try {
        setScanData(JSON.parse(cached));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (baselineColor && targetColor) {
      const deltaR = targetColor.r - baselineColor.r;
      const deltaG = targetColor.g - baselineColor.g;
      const deltaB = targetColor.b - baselineColor.b;
      const distance = Math.round(Math.sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB));

      let status: "normal" | "warning" | "danger" = "normal";
      if (distance > 60) {
        status = "danger";
      } else if (distance > 30) {
        status = "warning";
      }

      const iotResult = {
        distance,
        status,
        baseline: baselineColor.hex,
        target: targetColor.hex
      };
      localStorage.setItem("derma_iot_result", JSON.stringify(iotResult));

      if (auth.currentUser) {
        addDoc(collection(db, "users", auth.currentUser.uid, "history"), {
          type: "iot",
          distance,
          status,
          baseline: baselineColor.hex,
          target: targetColor.hex,
          timestamp: serverTimestamp()
        }).catch((dbErr) => {
          console.error("Gagal menyimpan riwayat IoT ke Firestore:", dbErr);
        });
      }
    }
  }, [baselineColor, targetColor]);

  // Connect to HiveMQ Public Broker over WebSockets
  useEffect(() => {
    if (isDemoMode) {
      if (mqttClientRef.current) {
        mqttClientRef.current.end();
        mqttClientRef.current = null;
      }
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");

    const client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt", {
      clientId: `derma_scan_web_${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      connectTimeout: 5000,
    });

    mqttClientRef.current = client;

    client.on("connect", () => {
      setConnectionStatus("connected");
      client.subscribe("dermascan/iot/sensor_data", (err: any) => {
        if (err) console.error("MQTT subscription error:", err);
      });
    });

    client.on("message", (topic, message) => {
      try {
        const rawString = message.toString();
        const json = JSON.parse(rawString);
        setLastMqttTimestamp(new Date().toLocaleTimeString());

        if (json.encrypted_hex) {
          setEncryptedHex(json.encrypted_hex);
          setCryptoStatus("decrypting");

          // Simulate slight decryption delay for visual feedback
          setTimeout(() => {
            try {
              const cipherBytes = hexToBytes(json.encrypted_hex);
              const plain = ascon128_decrypt(crypto_key, crypto_nonce, cipherBytes);

              if (plain) {
                setDecryptedText(plain);
                setCryptoStatus("success");

                // Parse decrypted data
                const sensorData = JSON.parse(plain);
                handleNewSensorReading(sensorData);
              } else {
                setCryptoStatus("failed");
              }
            } catch (err) {
              console.error("ASCON Decryption Error:", err);
              setCryptoStatus("failed");
            }
          }, 1000);
        }
      } catch (err) {
        console.error("MQTT message parsing error:", err);
      }
    });

    client.on("error", (err) => {
      console.error("MQTT Connection error:", err);
      setConnectionStatus("error");
    });

    client.on("close", () => {
      setConnectionStatus("disconnected");
    });

    return () => {
      if (client) client.end();
    };
  }, [isDemoMode]);

  // Handle incoming sensor data (either from MQTT or Demo simulator)
  const handleNewSensorReading = (
    data: { r: number; g: number; b: number; c: number; lux: number; temp: number; device?: string },
    stepOverride?: "baseline" | "target"
  ) => {
    const hex = rgbToHex(data.r, data.g, data.b);
    const skinColor: SkinColor = { ...data, hex };

    const activeStep = stepOverride || scanStepRef.current;

    if (activeStep === "baseline") {
      setBaselineColor(skinColor);
      setScanStep("none");
    } else if (activeStep === "target") {
      setTargetColor(skinColor);
      setScanStep("none");
    }
  };

  // Simulated colors matching realistic skin profiles
  const triggerDemoReading = (type: "normal" | "abnormal", step: "baseline" | "target") => {
    setCryptoStatus("idle");
    setEncryptedHex("");
    setDecryptedText("");

    // 1. Generate realistic RGB data
    let data;
    if (type === "normal") {
      const baseR = 210 + Math.floor(Math.random() * 25);
      const baseG = 160 + Math.floor(Math.random() * 25);
      const baseB = 120 + Math.floor(Math.random() * 25);
      data = {
        device: "ESP32C3-SkinSensor",
        r: baseR,
        g: baseG,
        b: baseB,
        c: Math.floor((baseR + baseG + baseB) * 1.2),
        lux: 150 + Math.floor(Math.random() * 50),
        temp: 3400 + Math.floor(Math.random() * 200)
      };
    } else {
      // Step 2 (Target): Generate relative to baseline to showcase different conditions (Aman, Peringatan, Mencurigakan)
      const baseColor = baselineColor || { r: 220, g: 170, b: 130 }; // Fallback if baseline is somehow null

      const rand = Math.random();
      let baseR, baseG, baseB;

      if (rand < 0.4) {
        // 40% Chance: Aman (Benign color variation, Delta-E < 30)
        // Shift colors very slightly
        baseR = Math.max(0, baseColor.r - 8 + Math.floor(Math.random() * 16));
        baseG = Math.max(0, baseColor.g - 8 + Math.floor(Math.random() * 16));
        baseB = Math.max(0, baseColor.b - 8 + Math.floor(Math.random() * 16));
      } else if (rand < 0.7) {
        // 30% Chance: Peringatan (Mild inflammation/redness, Delta-E between 30 and 60)
        // Slightly redder and moderately darker
        baseR = Math.max(0, baseColor.r - 15 + Math.floor(Math.random() * 10));
        baseG = Math.max(0, baseColor.g - 25 + Math.floor(Math.random() * 10));
        baseB = Math.max(0, baseColor.b - 25 + Math.floor(Math.random() * 10));
      } else {
        // 30% Chance: Mencurigakan (Melanoma / Dark Lesion, Delta-E > 60)
        // Much darker and brown/blackish
        baseR = Math.max(0, baseColor.r - 80 + Math.floor(Math.random() * 20));
        baseG = Math.max(0, baseColor.g - 95 + Math.floor(Math.random() * 20));
        baseB = Math.max(0, baseColor.b - 80 + Math.floor(Math.random() * 20));
      }

      data = {
        device: "ESP32C3-SkinSensor",
        r: baseR,
        g: baseG,
        b: baseB,
        c: Math.floor((baseR + baseG + baseB) * 1.1),
        lux: 100 + Math.floor(Math.random() * 30),
        temp: 2800 + Math.floor(Math.random() * 200)
      };
    }

    // 2. Perform ASCON-128 Encryption Simulation (just like ESP32 does)
    const jsonStr = JSON.stringify(data);
    const plainBytes = new TextEncoder().encode(jsonStr);
    const mask = BigInt("0xffffffffffffffff");

    const state = [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)];
    state[0] = BigInt("0x80400c0600000000");
    state[1] = bytes_to_u64(crypto_key, 0);
    state[2] = bytes_to_u64(crypto_key, 8);
    state[3] = bytes_to_u64(crypto_nonce, 0);
    state[4] = bytes_to_u64(crypto_nonce, 8);
    ascon_permutation(state, 12);
    state[3] = (state[3] ^ bytes_to_u64(crypto_key, 0)) & mask;
    state[4] = (state[4] ^ bytes_to_u64(crypto_key, 8)) & mask;
    state[4] = (state[4] ^ BigInt(1)) & mask;
    ascon_permutation(state, 6);

    let bytes_remaining = plainBytes.length;
    let pt_offset = 0;
    const cipherBytes = new Uint8Array(plainBytes.length + 16);

    while (bytes_remaining >= 8) {
      const pt_block = bytes_to_u64(plainBytes, pt_offset);
      state[0] ^= pt_block;
      u64_to_bytes(state[0], cipherBytes, pt_offset);
      ascon_permutation(state, 6);
      pt_offset += 8;
      bytes_remaining -= 8;
    }

    if (bytes_remaining > 0) {
      let last_block = BigInt(0);
      for (let i = 0; i < bytes_remaining; i++) {
        last_block |= (BigInt(plainBytes[pt_offset + i]) << BigInt(56 - 8 * i));
      }
      last_block |= (BigInt(1) << BigInt(56 - 8 * bytes_remaining));
      state[0] ^= last_block;
      const temp_ct = new Uint8Array(8);
      u64_to_bytes(state[0], temp_ct, 0);
      for (let i = 0; i < bytes_remaining; i++) {
        cipherBytes[pt_offset + i] = temp_ct[i];
      }
    } else {
      state[0] ^= (BigInt(1) << BigInt(56));
    }

    state[1] = (state[1] ^ bytes_to_u64(crypto_key, 0)) & mask;
    state[2] = (state[2] ^ bytes_to_u64(crypto_key, 8)) & mask;
    ascon_permutation(state, 12);
    state[3] = (state[3] ^ bytes_to_u64(crypto_key, 0)) & mask;
    state[4] = (state[4] ^ bytes_to_u64(crypto_key, 8)) & mask;
    u64_to_bytes(state[3], cipherBytes, plainBytes.length);
    u64_to_bytes(state[4], cipherBytes, plainBytes.length + 8);

    // Convert ciphertext to Hex
    const hex = Array.from(cipherBytes).map(b => b.toString(16).padStart(2, "0")).join("");

    // Update states
    setEncryptedHex(hex);
    setLastMqttTimestamp(new Date().toLocaleTimeString());
    setCryptoStatus("decrypting");

    setTimeout(() => {
      setDecryptedText(jsonStr);
      setCryptoStatus("success");
      handleNewSensorReading(data, step);
    }, 1000);
  };

  // Compare normal skin (baseline) and lesion (target)
  const calculateDelta = () => {
    if (!baselineColor || !targetColor) return null;

    // Calculate Euclidean color distance in RGB space
    const deltaR = targetColor.r - baselineColor.r;
    const deltaG = targetColor.g - baselineColor.g;
    const deltaB = targetColor.b - baselineColor.b;

    const distance = Math.round(Math.sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB));

    // Ratios
    const redDeviation = Math.round(((targetColor.r / (targetColor.r + targetColor.g + targetColor.b)) -
      (baselineColor.r / (baselineColor.r + baselineColor.g + baselineColor.b))) * 100);

    let status: "normal" | "warning" | "danger" = "normal";
    let message = "";

    if (distance > 60) {
      status = "danger";
      message = "Terdeteksi perbedaan pigmen warna yang SANGAT SIGNIFIKAN! Indikasi lesi kulit abnormal. Segera lakukan scan YOLO atau konsultasikan dengan Dermatolog.";
    } else if (distance > 30) {
      status = "warning";
      message = "Perbedaan warna sedang. Lesi kulit menunjukkan kemerahan atau kecoklatan ringan dibanding kulit normal Anda. Pantau terus perkembangannya.";
    } else {
      status = "normal";
      message = "Perbedaan warna minimal. Warna lesi hampir sama dengan pigmen kulit sehat Anda. Kemungkinan besar lesi jinak (benign).";
    }

    return { distance, redDeviation, status, message };
  };

  const deltaResult = calculateDelta();

  const resetReadings = () => {
    setBaselineColor(null);
    setTargetColor(null);
    setScanStep("none");
    setEncryptedHex("");
    setDecryptedText("");
    setCryptoStatus("idle");
    localStorage.removeItem("derma_iot_result");
  };

  return (
    <div className="flex flex-col w-full min-h-screen p-6 md:p-10 relative overflow-hidden pb-20 transition-colors duration-300">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[100px]" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              DermaScan <span className="text-emerald-500 dark:text-emerald-400">IoT Sensor</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Skin Color Comparative Analysis (TCS34725 & ASCON-128)</p>
          </div>
        </div>

        {/* mode toggle & connection status */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl flex items-center border border-slate-200/50 dark:border-slate-800/80 relative select-none">
            {/* Sliding background */}
            <div
              className="absolute top-1.5 bottom-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-slate-200/30 dark:border-slate-700/50 transition-all duration-300 ease-out"
              style={{
                left: isDemoMode ? '6px' : 'calc(50% + 2px)',
                width: 'calc(50% - 8px)'
              }}
            />

            <button
              onClick={() => setIsDemoMode(true)}
              className={`relative z-10 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-colors duration-300 flex items-center gap-2 cursor-pointer ${isDemoMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              🎮 Demo Mode
            </button>

            <button
              onClick={() => setIsDemoMode(false)}
              className={`relative z-10 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-colors duration-300 flex items-center gap-2 cursor-pointer ${!isDemoMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              🌐 Hardware Mode
            </button>
          </div>

          {!isDemoMode && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border ${connectionStatus === "connected"
              ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200"
              : connectionStatus === "connecting"
                ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200"
                : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200"
              }`}>
              <Wifi className={`w-3.5 h-3.5 ${connectionStatus === "connecting" ? "animate-pulse" : ""}`} />
              <span className="uppercase tracking-wider">
                {connectionStatus === "connected" ? "Broker Connected" : connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 max-w-7xl mx-auto w-full">

        {/* Left 2 Columns: Sensor Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Main Dual Calibration Screen */}
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[32px] p-6 md:p-8 shadow-xl">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white mb-6">
              Analisis Komparatif Warna Kulit
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

              {/* Calibration 1: Baseline (Kulit Sehat) */}
              <div className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between min-h-[220px] ${scanStep === "baseline"
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/5 shadow-md"
                : baselineColor
                  ? "border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-white/5"
                  : "border-dashed border-slate-300 dark:border-slate-700 bg-transparent"
                }`}>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Langkah 1: Baseline</span>
                    {baselineColor && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Warna Kulit Normal</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    Tempelkan sensor warna pada area kulit sehat di sekitar luka untuk mendeteksi warna kulit alami Anda.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {baselineColor ? (
                    <>
                      <div className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-white/20 shadow-sm" style={{ backgroundColor: baselineColor.hex }} />
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{baselineColor.hex.toUpperCase()}</div>
                        <div className="text-[11px] text-slate-400">R:{baselineColor.r} G:{baselineColor.g} B:{baselineColor.b}</div>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-400 italic">Belum ada data</div>
                  )}
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => {
                      setScanStep("baseline");
                      if (isDemoMode) triggerDemoReading("normal", "baseline");
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${scanStep === "baseline"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                  >
                    {scanStep === "baseline" ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        {isDemoMode ? "Menghasilkan..." : "Menunggu Sensor..."}
                      </>
                    ) : baselineColor ? "Kalibrasi Ulang" : "Ambil Sampel Kulit"}
                  </button>
                </div>
              </div>

              {/* Calibration 2: Target (Lesi Kulit) */}
              <div className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between min-h-[220px] ${scanStep === "target"
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/5 shadow-md"
                : targetColor
                  ? "border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-white/5"
                  : "border-dashed border-slate-300 dark:border-slate-700 bg-transparent"
                }`}>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Langkah 2: Target</span>
                    {targetColor && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Warna Lesi / Luka</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    Tempelkan sensor warna tepat di atas area luka, tahi lalat, atau kemerahan yang mencurigakan.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {targetColor ? (
                    <>
                      <div className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-white/20 shadow-sm" style={{ backgroundColor: targetColor.hex }} />
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{targetColor.hex.toUpperCase()}</div>
                        <div className="text-[11px] text-slate-400">R:{targetColor.r} G:{targetColor.g} B:{targetColor.b}</div>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-400 italic">Belum ada data</div>
                  )}
                </div>

                <div className="mt-6 flex gap-2">
                  <button
                    disabled={!baselineColor && scanStep !== "target"}
                    onClick={() => {
                      setScanStep("target");
                      if (isDemoMode) triggerDemoReading("abnormal", "target");
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${scanStep === "target"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      }`}
                  >
                    {scanStep === "target" ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        {isDemoMode ? "Menghasilkan..." : "Menunggu Sensor..."}
                      </>
                    ) : targetColor ? "Ukur Ulang Lesi" : "Ukur Warna Lesi"}
                  </button>
                </div>
              </div>

            </div>

            {/* Comparison results */}
            <AnimatePresence>
              {deltaResult && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="border-t border-slate-100 dark:border-slate-800 pt-6"
                >
                  <div className="flex flex-col md:flex-row gap-6 items-center bg-slate-50 dark:bg-white/5 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                    <div className="flex-shrink-0">
                      {deltaResult.status === "danger" ? (
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-8 h-8 animate-bounce" />
                        </div>
                      ) : deltaResult.status === "warning" ? (
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-8 h-8" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                        <h4 className="font-extrabold text-lg text-slate-800 dark:text-white">
                          Perbedaan Warna: {deltaResult.distance} Delta-E
                        </h4>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${deltaResult.status === "danger"
                          ? "bg-red-500/20 text-red-500"
                          : deltaResult.status === "warning"
                            ? "bg-amber-500/20 text-amber-500"
                            : "bg-emerald-500/20 text-emerald-500"
                          }`}>
                          {deltaResult.status === "danger" ? "Mencurigakan" : deltaResult.status === "warning" ? "Peringatan" : "Aman"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {deltaResult.message}
                      </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-2 shrink-0 justify-center md:justify-end">
                      {baselineColor && targetColor && (
                        scanData ? (
                          <>
                            <Link
                              href={`/chat-ai?source=combined&label=${encodeURIComponent(scanData.label)}&confidence=${scanData.confidence}&distance=${deltaResult.distance}&status=${deltaResult.status}&baseline=${encodeURIComponent(baselineColor.hex)}&target=${encodeURIComponent(targetColor.hex)}`}
                              className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500 text-white hover:from-indigo-700 hover:to-violet-700 rounded-xl font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center shadow-md flex items-center justify-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> Tanya AI Gabungan
                            </Link>
                            <Link
                              href={`/chat-ai?source=iot&distance=${deltaResult.distance}&status=${deltaResult.status}&baseline=${encodeURIComponent(baselineColor.hex)}&target=${encodeURIComponent(targetColor.hex)}`}
                              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center border border-slate-200 dark:border-slate-700"
                            >
                              Tanya AI Warna Saja
                            </Link>
                          </>
                        ) : (
                          <Link
                            href={`/chat-ai?source=iot&distance=${deltaResult.distance}&status=${deltaResult.status}&baseline=${encodeURIComponent(baselineColor.hex)}&target=${encodeURIComponent(targetColor.hex)}`}
                            className="px-5 py-3 bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 rounded-xl font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center shadow-md shadow-indigo-500/10 dark:shadow-none"
                          >
                            Tanya AI
                          </Link>
                        )
                      )}
                      <button
                        onClick={resetReadings}
                        className="px-5 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      >
                        Reset Data
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cryptography logs and debugger */}
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[32px] p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-500" />
                ASCON-128 AEAD Crypto Log
              </h2>
              {lastMqttTimestamp && (
                <span className="text-[10px] font-mono text-slate-400">Received at {lastMqttTimestamp}</span>
              )}
            </div>

            <div className="space-y-4">
              {/* Encrypted payload hex box */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                  Payload Terenkripsi (Hex dari ESP32-C3 via MQTT)
                </label>
                <div className="bg-slate-900 text-slate-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto break-all border border-slate-800 min-h-[60px] flex items-center">
                  {encryptedHex ? encryptedHex : "// Belum menerima transmisi data"}
                </div>
              </div>

              {/* Decryption status animation */}
              <div className="flex items-center gap-3">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Status Dekripsi:</div>
                <div className="flex items-center gap-2">
                  {cryptoStatus === "decrypting" ? (
                    <span className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memproses Permutasi ASCON...
                    </span>
                  ) : cryptoStatus === "success" ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Authenticated & Decrypted (Tag Valid)
                    </span>
                  ) : cryptoStatus === "failed" ? (
                    <span className="flex items-center gap-1.5 text-xs text-red-500 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Gagal Dekripsi (Tag Mismatch/Manipulasi!)
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic font-medium">Idle</span>
                  )}
                </div>
              </div>

              {/* Decrypted payload json box */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                  Payload Terdekripsi (JSON Data Pasien)
                </label>
                <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-emerald-950/20 min-h-[60px] flex items-center">
                  {decryptedText ? decryptedText : "// Menunggu dekripsi"}
                </pre>
              </div>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Hardware Specs, Links & Demos */}
        <div className="flex flex-col gap-6">

          {/* Documentation Video & Tutorial Links */}
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[32px] p-6 shadow-xl flex flex-col gap-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Dokumentasi & Cara Rakit
            </h3>

            {/* Video Player Box Placeholder */}
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 relative group shadow-inner">
              {/* Mock Video Cover */}
              <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-500"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=400')" }}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10 text-center">
                <a
                  href="https://youtu.be/OvtaEn1TgdI?si=NCpWuBPodhU6hqAm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 hover:scale-110 active:scale-95 transition-all rounded-full flex items-center justify-center text-white shadow-xl mb-3 cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-current ml-1" />
                </a>
                <span className="text-white font-extrabold text-sm tracking-tight drop-shadow-md">Tonton Demo Hardware</span>
              </div>
            </div>

            {/* Schematic image Placeholder */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 flex-shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-bold text-xs text-slate-800 dark:text-white truncate">Skema Rangkaian ESP32-C3</div>
                <p className="text-[10px] text-slate-400">Diagram pinout TCS34725 ke mikrokontroler.</p>
              </div>
              <button
                onClick={() => setShowSchematicModal(true)}
                className="text-[10px] font-bold text-emerald-500 hover:underline cursor-pointer bg-transparent border-none outline-none"
              >
                Lihat
              </button>
            </div>

            {/* GitHub Repo link */}
            <a
              href="https://github.com/Peteraw203/Derma-scan"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-slate-900 text-white p-5 rounded-2xl hover:bg-black transition-colors shadow-lg"
            >
              <div className="flex items-center gap-4">
                {/* Custom Inline GitHub Icon */}
                <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <div>
                  <h4 className="font-bold text-xs">Firmware Repository</h4>
                  <p className="text-[10px] text-slate-400">Download .ino & Library info</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-500" />
            </a>
          </div>

          {/* Device Hardware Spec Card */}
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[32px] p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Spesifikasi Hardware
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="text-slate-400 font-semibold">Microcontroller</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">ESP32-C3 Super Mini</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="text-slate-400 font-semibold">Color Sensor</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Adafruit TCS34725 RGB + Clear</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="text-slate-400 font-semibold">Comm Protocol</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">MQTT over WebSockets</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="text-slate-400 font-semibold">Security Encryption</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">ASCON-128-AEAD (Standard NIST)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">WiFi Setup</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">WiFiManager AP Portal</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Schematic Image Lightbox Modal */}
      <AnimatePresence>
        {showSchematicModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowSchematicModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-extrabold text-sm md:text-base text-slate-800 dark:text-white">Skema Rangkaian ESP32-C3 & TCS34725</h3>
                  <p className="text-[10px] text-slate-400">Hubungkan pin sensor ke pin microcontroller seperti di bawah ini.</p>
                </div>
                <button
                  onClick={() => setShowSchematicModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Image content */}
              <div className="p-6 flex items-center justify-center bg-slate-50 dark:bg-slate-950/40">
                <div className="relative rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-800/80 max-h-[60vh] flex items-center justify-center bg-white dark:bg-slate-900 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/image/schematic.png"
                    alt="Skema Rangkaian ESP32-C3 TCS34725"
                    className="object-contain max-h-[55vh] max-w-full rounded-lg"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 text-center sm:text-left">
                  * Gunakan kabel jumper pendek untuk menghindari noise data I2C.
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <a
                    href="/image/schematic.png"
                    download="schematic_esp32c3_tcs34725.png"
                    className="flex-1 sm:flex-none text-center px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Unduh Gambar
                  </a>
                  <a
                    href="/image/schematic.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none text-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    Buka Tab Baru
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
