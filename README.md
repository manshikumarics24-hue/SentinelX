# 🛡️ SentinelX — Global Threat Intelligence & DDoS SOC Control Room

[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.2+-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=flat&logo=three.js&logoColor=white)](https://threejs.org/)
[![Redis](https://img.shields.io/badge/Redis-In--Memory%20Buffer-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![NeonTech](https://img.shields.io/badge/PostgreSQL-NeonTech%20Serverless-00E599?style=flat&logo=postgresql&logoColor=white)](https://neon.tech/)

**SentinelX** is a production-grade, real-time Security Operations Center (SOC) Control Room designed for autonomous DDoS detection, botnet classification, and live threat mitigation.

It monitors high-velocity incoming traffic (100–500+ requests/sec) using an in-memory Redis sliding-window buffer, analyzes traffic patterns with an anomaly detection engine, generates AI-powered threat intelligence narratives with origin geolocation, and renders telemetry across an interactive 3D WebGL Cyber Globe and calibrated 2D Tactical Map.

---

## ⚡ Quickstart in 3 Steps

### 1. Clone & Configure Environment
```bash
git clone https://github.com/manshikumarics24-hue/SentinelX.git
cd SentinelX

# Create your .env file from the template:
# On Windows PowerShell:
Copy-Item backend\.env.example backend\.env
# On Linux / macOS:
cp backend/.env.example backend/.env
```
Open `backend/.env` and set your Neon PostgreSQL `DATABASE_URL` (and optional `OPENAI_API_KEY`).

### 2. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd backend
python -m venv env
# Windows: .\env\Scripts\activate | macOS/Linux: source env/bin/activate
pip install -r requirements.txt
python migrate_db.py
cd ..
```

### 3. Launch SentinelX (One-Click)
- **Windows:** Double-click [`start_sentinelx.bat`](start_sentinelx.bat) or run `.\start_sentinelx.ps1`
- Open dashboard at: **`http://localhost:5173`**

👉 **For the comprehensive step-by-step setup guide with screenshots, architecture diagrams, and simulator instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md).**

---

## 🏗️ Architecture at a Glance

```
[ Traffic Simulator / Inbound Webhook ]
                  │
                  ▼  (100 - 500 req/sec)
     FastAPI Ingestion Endpoint (POST /api/traffic)
                  │
                  ▼  (Atomic pipeline counters, sub-ms)
         ┌─────────────────┐
         │      REDIS      │  <-- In-memory intermediate buffer
         │ (Sliding Window)│      TTL: 60 seconds
         └────────┬────────┘
                  │  (Aggregated 1s metrics)
                  ▼
      Anomaly Classifier & Detector
     (Traffic classification: NORMAL vs BOT_ATTACK vs VOLUMETRIC_DDOS)
                  │
                  ├─── Attacker IPs ──► Geolocation & Threat Intel (City, Lat, Lng)
                  │
                  ├─── Attack Detected ──► AI Explainer (OpenAI / Rule Engine)
                  │
                  ├─── Persist Incident (30s cooldown) ──► [ NEONTECH POSTGRESQL ]
                  │                                         (Table: `incidents`)
                  ▼
         WebSocket Manager (ws://localhost:8001/ws/traffic)
                  │  (1 broadcast / sec)
                  ▼
         [ REACT FRONTEND (Vite) ]
         ├── 3D Cyber Globe (Three.js / globe.gl)
         ├── 2D Tactical Flat Map (Calibrated SVG)
         ├── Real-time Anomaly Banner & AI Typewriter Popup
         └── Alerts Drawer (Active Alerts vs Neon DB History)
```

---

## 🎯 Key Features

- **High-Throughput In-Memory Buffer:** Redis pipelines handle 500+ requests/second without bottlenecking the database.
- **Autonomous Anomaly Detection:** Real-time classification detecting:
  - `BOT_ATTACK`: Single IP concentration exceeding 40% of total volume.
  - `VOLUMETRIC_DDOS`: Sudden traffic bursts exceeding 400 RPS ceiling.
  - `FLASH_SALE`: Benign distributed surges preserved without defensive blocking.
- **AI Threat Intelligence:** Instant SOC incident narrative reports specifying attack vectors, origin locations, and mitigation actions.
- **Dual Visual Modes:** Seamless toggle between a 3D Three.js rotating cyber globe and a calibrated 2D tactical flat projection (centered on Bengaluru SOC Core, India).
- **Incident Lifecycle Management:** Acknowledging an alert removes it from active notifications while preserving full audit history in NeonTech PostgreSQL.

---

## 👥 Project Team & Contributions
- **Manshi**: Initial frontend scaffolding and React components.
- **Lalit**: Backend architecture, NeonTech PostgreSQL integration, 2D/3D calibrated projection, AI threat engine, and simulator.
- **Anshika**: Streaming infrastructure, Redis sliding-window counters, and WebSocket broadcast pipeline.

---

📖 **Full Documentation:**
- [Setup & Deployment Guide](SETUP_GUIDE.md)
- [Architecture Master Guide v2](DDoS_SOC_Dashboard_Master_Guide_v2.md)