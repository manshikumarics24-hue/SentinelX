# 🛡️ SentinelX — Setup & Deployment Guide

> **SentinelX** is a Real-Time Cybersecurity Operations Center (SOC) Control Room and DDoS Anomaly Detection System featuring high-velocity ingestion (Redis), autonomous anomaly detection, AI-powered threat analysis, serverless relational persistence (NeonTech PostgreSQL), and an interactive 3D Globe & 2D Tactical Map.

---

## 📋 Table of Contents
1. [Prerequisites](#-prerequisites)
2. [Step 1: Clone or Pull the Repository](#-step-1-clone-or-pull-the-repository)
3. [Step 2: Environment Configuration (.env.example)](#-step-2-environment-configuration-envexample)
4. [Step 3: Install Dependencies](#-step-3-install-dependencies)
5. [Step 4: Initialize / Migrate the Database](#-step-4-initialize--migrate-the-database)
6. [Step 5: Run SentinelX (Two Options)](#-step-5-run-sentinelx)
   - [Option A: One-Click Launch (Windows)](#option-a-one-click-launch-windows---recommended)
   - [Option B: Manual Step-by-Step Launch](#option-b-manual-step-by-step-launch-all-platforms)
7. [Step 6: Running the Attack Simulator & Verification](#-step-6-running-the-attack-simulator--verification)
8. [Architecture Overview: How Redis & NeonTech Work Together](#-architecture-overview)
9. [Troubleshooting & Common Issues](#-troubleshooting--common-issues)

---

## ⚙️ Prerequisites

Before getting started, make sure you have the following installed on your machine:

| Tool | Version | Purpose |
|---|---|---|
| **Git** | `2.x+` | Version control & pulling updates |
| **Node.js** | `v18.x` or higher | Frontend runtime (includes `npm`) |
| **Python** | `3.10` or `3.11` | Backend FastAPI, anomaly detector, simulator |
| **Docker Desktop** | Latest | Running the in-memory Redis container |
| **NeonTech PostgreSQL** | Free Cloud Tier | Cloud serverless database for incident audit storage |
| **OpenAI API Key** | Optional | Real-time AI SOC threat narrative (fallback rule engine active if omitted) |

---

## 🚀 Step 1: Clone or Pull the Repository

### If cloning for the first time:
```bash
git clone https://github.com/manshikumarics24-hue/SentinelX.git
cd SentinelX
```

### If updating an existing clone:
```bash
git checkout main
git pull origin main
```

---

## 🔐 Step 2: Environment Configuration (`.env.example`)

Confidential files like `.env` containing database passwords and API keys are strictly **ignored** by Git to protect your credentials. 

To configure your environment, create a `.env` file inside the `backend/` folder based on `backend/.env.example`:

### In Windows PowerShell:
```powershell
Copy-Item backend\.env.example backend\.env
```

### In Windows Command Prompt (cmd):
```cmd
copy backend\.env.example backend\.env
```

### In macOS / Linux:
```bash
cp backend/.env.example backend/.env
```

### Configure `backend/.env`:
Open `backend/.env` in any text editor and fill in your values:

```ini
# ============================================================
# 1. REDIS CONFIGURATION (Runs in Docker locally)
# ============================================================
REDIS_HOST=localhost
REDIS_PORT=6379

# ============================================================
# 2. NEONTECH POSTGRESQL DATABASE URL
# Get this from https://console.neon.tech -> Connection Details
# ============================================================
DATABASE_URL=postgresql://<username>:<password>@<ep-hostname>.neon.tech/neondb?sslmode=require

# ============================================================
# 3. OPENAI API KEY (Optional)
# If provided, GPT-4o-mini writes live SOC threat reports.
# If omitted or left empty, SentinelX automatically uses
# its built-in rule-based expert cybersecurity analysis engine!
# ============================================================
OPENAI_API_KEY=sk-proj-your-api-key-here
```

> [!TIP]
> **Getting a free NeonTech PostgreSQL database:**
> 1. Sign up at [neon.tech](https://neon.tech) (100% free, no credit card required).
> 2. Create a new project (e.g. `sentinelx-db`).
> 3. Under **Dashboard -> Connection Details**, copy the **Pooled connection string** (starts with `postgresql://...`).
> 4. Paste it into `DATABASE_URL` in `backend/.env`.

---

## 📦 Step 3: Install Dependencies

### 1. Frontend Dependencies
In the root directory of the project:
```bash
npm install
```

### 2. Backend Dependencies
Open a terminal in the `backend/` folder:
```bash
cd backend

# Create a clean Python virtual environment
python -m venv env

# Activate the virtual environment:
# On Windows PowerShell:
.\env\Scripts\Activate.ps1
# (If PowerShell blocks script execution, run: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)

# On Windows CMD:
.\env\Scripts\activate.bat

# On Linux / macOS:
source env/bin/activate

# Install Python packages
pip install -r requirements.txt
```

---

## 🗄️ Step 4: Initialize / Migrate the Database

To create or update the `incidents` table in your Neon PostgreSQL database with all required telemetry columns, run the migration script:

```bash
# Ensure virtual environment is active in the backend folder
python migrate_db.py
```

Expected output:
```text
Existing columns: ['id', 'timestamp', 'total_rps', 'status', 'attacker_ips', 'source_count', 'top_source_rps', 'top_source_concentration', 'legitimate_rps', 'faulty_rps', 'detection_reason', 'ai_explanation', 'resolved']
Database migration successfully completed!
```

---

## ⚡ Step 5: Run SentinelX

### Option A: One-Click Launch (Windows — Recommended)

We have provided ready-to-run startup scripts that launch all 5 microservices in separate colored windows automatically:

- **Via PowerShell:**
  ```powershell
  .\start_sentinelx.ps1
  ```
- **Or via Batch file:**
  Double-click `start_sentinelx.bat` or run:
  ```cmd
  .\start_sentinelx.bat
  ```

This script automatically:
1. Starts the Docker Redis container (`sentinelx-redis` on port `6379`).
2. Launches the FastAPI Ingestion server on `http://localhost:8001`.
3. Starts the autonomous Anomaly Detector loop.
4. Starts the fast 4-mode Traffic Simulator.
5. Launches the React Vite frontend at `http://localhost:5173`.

---

### Option B: Manual Step-by-Step Launch (All Platforms)

If you prefer to run services individually or are on Linux/macOS, open separate terminal windows:

#### Terminal 1: In-Memory Redis (Docker)
```bash
docker run -d --name sentinelx-redis -p 6379:6379 redis
```

#### Terminal 2: FastAPI Ingestion Server & WebSocket Broadcaster
```bash
cd backend
# Windows:
.\env\Scripts\activate
uvicorn app.ingestion.main:app --reload --port 8001

# macOS/Linux:
source env/bin/activate
uvicorn app.ingestion.main:app --reload --port 8001
```

#### Terminal 3: Autonomous Anomaly Detector
```bash
cd backend
# Windows:
.\env\Scripts\activate
python -m app.intelligence.detector

# macOS/Linux:
source env/bin/activate
python -m app.intelligence.detector
```

#### Terminal 4: React Dashboard Frontend
```bash
# In the project root directory
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🎯 Step 6: Running the Attack Simulator & Verification

To test real DDoS and botnet attacks and observe the SOC response:

```bash
cd backend
# Windows:
.\env\Scripts\activate
python simulator\traffic_simulator.py

# macOS/Linux:
source env/bin/activate
python simulator/traffic_simulator.py
```

### What You Will Observe in the Dashboard:

| Timeline | Phase | What Happens on Dashboard |
|---|---|---|
| **0s – 10s** | **Normal Warmup** (70 RPS) | Dashboard shows green steady-state traffic, green arcs flowing to Bengaluru SOC Core. |
| **10s – 20s** | **🚨 BOT ATTACK SPIKE** (180 RPS) | Single IP exceeds 40% traffic share. Red attack arcs fly to Bengaluru. Top banner flashes: `🚨 SUDDEN SPIKE: BOT ATTACK`. AI threat analysis typewriter popup generates threat summary with origin city. Incident logged to NeonTech PostgreSQL. |
| **20s – 55s** | **Cooldown** | Traffic stabilizes; system recovers. |
| **55s – 65s** | **🚨 VOLUMETRIC DDoS** (500 RPS) | Massive distributed flood exceeding 400 RPS ceiling. Globe & 2D map flood with high-density red attack arcs. AI explanation logs mitigation protocol. |

### Testing Alert Acknowledgment:
1. Click the **Alerts** drawer icon (top right) or the red banner link.
2. Under the **🚨 Active Alerts** tab, click **"Acknowledge"** on any incident.
3. The alert immediately disappears from the active view.
4. Switch to the **💾 Database History (NeonTech)** tab: notice the incident remains permanently preserved with a `✓ Preserved in DB` badge.

---

## 🏛️ Architecture Overview

```
[ Attack Simulator / Web Traffic ] 
                  │
                  ▼  (100 - 500 RPS)
     FastAPI Endpoint (POST /api/traffic)
                  │
                  ▼  (Atomic pipeline counters, sub-ms)
         ┌─────────────────┐
         │      REDIS      │  <-- In-Memory Buffer
         │ (Sliding Window)│      TTL: 60 seconds
         └────────┬────────┘
                  │  (Aggregated 1s metrics)
                  ▼
      Anomaly Classifier & Detector
     (NORMAL vs BOT_ATTACK vs VOLUMETRIC_DDOS)
                  │
                  ├─── Attacker IPs ──► Geolocation & Threat Intel (City, Lat, Lng)
                  │
                  ├─── Attack Detected ──► AI Explainer (OpenAI / Expert Rules)
                  │
                  ├─── Persist Incident ──► [ NEONTECH POSTGRESQL ]
                  │                          (Durable table: `incidents`)
                  ▼
         WebSocket Manager (ws://localhost:8001/ws/traffic)
                  │  (1 broadcast / sec)
                  ▼
         [ REACT FRONTEND (Vite) ]
         ├── 3D Cyber Globe (Three.js / WebGL)
         ├── 2D Tactical Flat Map (Calibrated Projection)
         ├── Real-time Anomaly Banner & AI Typewriter Popup
         └── Alerts Drawer (Active Alerts vs Neon DB History)
```

### Why Redis is the Intermediate Buffer:
- At 500 requests/second, writing every packet directly to a cloud SQL database like NeonTech would cause network latency bottlenecking (~80ms round-trip to cloud) and connection pool exhaustion.
- **Redis** handles sub-millisecond atomic memory increments (`INCR rps:global:<second>`, `SADD recent_ips:<second>`) with a 60-second sliding-window TTL.
- **NeonTech PostgreSQL** is only contacted when a verified anomaly incident occurs (once every 30 seconds), reducing database write load by **99.8%** while providing ACID-compliant permanent audit records.

---

## 🔍 Troubleshooting & Common Issues

### 1. `docker: error during connect: This error may indicate that the docker daemon is not running.`
- **Fix:** Open **Docker Desktop** and wait until the status at the bottom-left shows green (Running). Then retry the command.

### 2. `UnicodeEncodeError: 'charmap' codec can't encode character...`
- **Fix:** Set the Python UTF-8 encoding environment variable before running scripts on Windows:
  ```powershell
  $env:PYTHONIOENCODING="utf-8"
  ```
  *(Both `start_sentinelx.bat` and `start_sentinelx.ps1` already include this automatically).*

### 3. PostgreSQL SSL / Connection Error (`no pg_hba.conf entry...`)
- **Fix:** Ensure your `DATABASE_URL` in `backend/.env` has `?sslmode=require` at the end:
  ```ini
  DATABASE_URL=postgresql://neondb_owner:password@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
  ```

### 4. Port 8001 or 5173 Already in Use
- **Fix:** Terminate any leftover Python or Vite processes:
  ```powershell
  Get-Process -Name python, node -ErrorAction SilentlyContinue | Stop-Process -Force
  ```

---

## 👥 Contributors
- **Manshi**: Initial frontend scaffolding and React components.
- **Lalit**: Backend architecture, NeonTech PostgreSQL integration, 2D/3D calibrated projection, AI threat engine, and simulator.
- **Anshika**: Streaming infrastructure, Redis sliding-window counters, and WebSocket broadcast pipeline.
