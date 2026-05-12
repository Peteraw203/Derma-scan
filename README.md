# 🌟 DermaScan - AI-Powered Skin Cancer Detection 🩺
**A submission for Google JuaraGCP / Juara Coding Vibes Competition**

DermaScan is an advanced, AI-driven healthcare web application designed to help users detect potential skin cancer risks early, consult with an intelligent medical AI assistant, and locate the nearest dermatology clinics with seamless IoT integration (upcoming). 

Built to demonstrate the power of the modern Google tech ecosystem!

---

## 🚀 Features

### 1. 🔍 YOLO Skin Cancer Scanner (Real-time Vision AI)
Upload an image or use your device's camera (via WebRTC) to instantly scan skin lesions. Powered by a custom **YOLOv12** computer vision model hosted on **Google Cloud Run**, it detects:
- 🔴 `Basal Cell Carcinoma`
- 🔴 `Melanoma`
- 🔴 `Squamous Cell Carcinoma`

It instantly provides *Bounding Box* visual feedback and confidence scores right on the browser!

### 2. 🤖 AI Consultant (Powered by Gemini)
Got questions about your skin health? Our interactive AI consultant uses **Google Gemini (AI Studio)** to analyze your symptoms, provide contextual medical advice, and guide you on what steps to take next. It acts as an intelligent, empathetic first point of contact.

### 3. 🗺️ Smart Clinic Locator (Google Maps)
If a risk is detected, DermaScan immediately helps you take action. Integrated directly with **Google Maps Platform (Places API & Routes API)**, the application automatically maps out the nearest specialized clinics, displaying accurate ratings, distance, and live driving routes.

### 4. ⌚ IoT Integration (Work In Progress 🚧)
We are actively developing a custom IoT hardware module powered by the **ESP32-C3 Super Mini** microcontroller and a **TCS Color Sensor**. 
- **Mechanism:** The sensor captures the baseline RGB color of healthy skin and compares it against the RGB values of the targeted skin lesion/wound. This comparative color analysis helps determine the severity and potential risk of the lesion.
- **Secure Communication:** Data is transmitted to our cloud backend via the **MQTT** protocol, securely encrypted end-to-end using the lightweight **ASCON** cryptographic algorithm to ensure patient data privacy.

---

## 💻 Technology Stack

This project was crafted to fully utilize the Google Cloud and AI ecosystem, seamlessly blended with modern web development frameworks.

**Frontend:**
- **Next.js 14** (App Router)
- **TypeScript** & **Tailwind CSS**
- **Lucide React** (Icons)

**Backend & AI:**
- **Google Cloud Run** (Serverless container deployment for ML models)
- **Google AI Studio / Gemini API** (LLM conversational agent)
- **FastAPI** & **Ultralytics YOLO** (Computer Vision Backend)
- **Google Maps Platform** (Maps JavaScript, Places (New), and Routes API)
- **Google Antigravity Agent** (Agentic AI pair-programming assistant used to build this project!)

---

## 🛠️ How to Run Locally

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- Docker (optional, for local backend testing)

### 1. Frontend Setup
```bash
# Install dependencies
npm install

# Setup environment variables
# Edit .env.local and add your Google APIs and YOLO backend URL
# Example:
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
# GEMINI_API_KEY=AIzaSy...
# NEXT_PUBLIC_YOLO_API_URL=https://your-cloud-run-url.app/predict

# Run the development server
npm run dev
```

### 2. YOLO Backend Setup (FastAPI)
```bash
cd yolo-backend

# Install python dependencies
pip install -r requirements.txt

# Run the API locally
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

---

*Built with ❤️ for Google Juara Vibes Coding Indonesia 2026*
