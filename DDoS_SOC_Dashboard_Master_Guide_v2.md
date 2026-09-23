# DDoS Detection & SOC Dashboard — Master Technical Architecture & Team Guide

---

## 📌 Executive Summary & Project Vision

This project is a **Real-Time Security Operations Center (SOC) Control Room and DDoS Anomaly Detection System**. 

> **Crucial Conceptual Distinction:** This system is the **Security Camera and Incident Control Room**, NOT a firewall or attack vector. Its objective is to monitor high-velocity HTTP traffic telemetry, detect resource exhaustion patterns against baseline thresholds, alert operators via real-time WebSockets, store historical incident data, and leverage Artificial Intelligence (LLM) to generate executive incident analysis reports.

---

## 🏗️ System Architecture & Data Flow Diagram

```
[ Synthetic Traffic Simulator ]
      │
      │ (10-20 RPS Normal | 80-120 RPS DDoS Spike)
      ▼
[ FastAPI Ingestion Endpoint (/api/traffic) ] 
      │
      ├──> [ Redis Memory Store ] (Atomic INCR per second counters, rolling IP buffers)
      │          │
      │          ├──> [ Background Anomaly Detector ] (Evaluates RPS against threshold: >80 RPS)
      │          │          │
      │          │          ├──> Trigger Alert!
      │          │          ├──> Call [ OpenAI API ] (Generates 3-sentence SOC summary)
      │          │          └──> Persist to [ PostgreSQL ] (Incidents & Traffic History)
      │          │
      │          └──> [ WebSocket Broadcaster Loop ] (Pushes live RPS metrics every 1 sec)
      │                     │
      └─────────────────────┼────────────────────────────────────────┐
                            ▼                                        ▼
             [ React Frontend SOC Dashboard ] <─────── [ REST API: GET /api/incidents ]
             ├── 3D WebGL Globe (Interactive Threat Arcs)
             ├── Dynamic Live RPS Line Chart (Recharts)
             └── Real-Time Incident Feed (AI Security Summaries)
```

---

## 💡 Tech Stack & "Why We Use It" Matrix

To build a professional, low-level engineering project, every library and framework choice must be justified by performance, paradigm, or functionality requirements:

| Component / Library | Role | Why We Are Using It (Architectural Justification) | Assigned Owner |
| :--- | :--- | :--- | :--- |
| **FastAPI** | Backend Framework | High-performance Python ASGI framework built on Starlette and Pydantic. Handles asynchronous concurrency with ease and provides native WebSocket support out of the box. | **Anshika** |
| **Redis** | In-Memory Data Store | Relational databases are too slow for logging 100+ requests per second in real time. Redis stores counts in RAM with sub-millisecond atomic `INCR` operations and automatic key expiration (`EXPIRE`). | **Anshika** |
| **WebSockets** | Real-Time Protocol | Standard HTTP requests require client polling (asking the server every second for data), which creates massive overhead. WebSockets keep a single open, bi-directional TCP connection to stream metrics to the dashboard smoothly. | **Anshika** |
| **`httpx` & `asyncio`** | Traffic Simulator | Asynchronous HTTP client library capable of firing hundreds of non-blocking requests concurrently to simulate realistic network traffic spikes. | **Anshika** |
| **PostgreSQL** | Relational Database | Durable, ACID-compliant storage. While Redis handles fast transient data, Postgres stores permanent historical incident logs, threat analytics, and AI summaries for long-term reporting. | **Lalit** |
| **SQLAlchemy** | Python ORM | Translates Python classes into database tables, eliminating raw SQL vulnerability while enabling clean data access patterns for FastAPI. | **Lalit** |
| **OpenAI API** | AI Incident Analyst | Converts complex raw telemetry (IP logs, timestamp spikes, request rates) into plain-English, executive-ready security analysis reports for SOC operators. | **Lalit** |
| **React.js** | Frontend Framework | Component-driven frontend library perfect for building reactive, single-page dashboards with real-time state management. | **Manshi** |
| **`react-globe.gl` & `Three.js`** | 3D Map Visualization | WebGL-based rendering engine that renders an interactive 3D Earth globe with animated arcs representing simulated incoming attack vectors. | **Manshi** |
| **Recharts** | Streaming Charts | Lightweight, SVG-native React charting library designed to re-render dynamic time-series line charts smoothly upon receiving WebSocket events. | **Manshi** |
| **Tailwind CSS** | Styling Framework | Utility-first CSS framework allowing rapid assembly of dark-mode, futuristic SOC interface layouts. | **Manshi** |

---

## 📁 Repository Directory & File Structure

Here is the exact repository folder structure. Every file is mapped strictly to its assigned team member to avoid file collisions:

```
ddos-soc-dashboard/
│
├── README.md                           <-- Master Documentation & Setup Guide
├── .gitignore                          <-- Excludes node_modules, env, .env, __pycache__
│
├── frontend/                           <-- 🎨 MANSHI'S WORKSPACE
│   ├── package.json                    <-- React dependencies
│   ├── tailwind.config.js              <-- Tailwind color palette & dark mode setup
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js                    <-- React Root entry
│       ├── App.jsx                     <-- Main Application Layout Container
│       ├── components/
│       │   ├── DashboardHeader.jsx     <-- Header with live system health indicators
│       │   ├── Globe3D.jsx             <-- Interactive 3D Threat Map (react-globe.gl)
│       │   ├── LiveRpsChart.jsx        <-- Real-time streaming RPS chart (Recharts)
│       │   ├── IncidentFeed.jsx        <-- Sidebar displaying AI-generated incident reports
│       │   └── MetricCards.jsx         <-- Cards showing Current RPS, Peak RPS, Anomaly Status
│       └── services/
│           ├── websocket.js            <-- WebSocket connection listener hook
│           └── api.js                  <-- REST client (Axios/Fetch) to pull historical Postgres incidents
│
├── backend/                            <-- ⚙️ ANSHIKA & LALIT SHARED WORKSPACE
│   ├── requirements.txt                <-- All Python dependencies
│   ├── .env                            <-- Environment variables (POSTGRES_URL, REDIS_URL, OPENAI_API_KEY)
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                   <-- App Configuration & Environment loader
│   │   │
│   │   ├── ingestion/                  <-- ⚡ ANSHIKA'S WORKSPACE
│   │   │   ├── __init__.py
│   │   │   ├── main.py                 <-- FastAPI app instance & HTTP ingestion route (/api/traffic)
│   │   │   ├── redis_client.py         <-- Redis client connection & counter helper functions
│   │   │   └── websocket_manager.py    <-- ConnectionManager class & WebSocket broadcasting loop
│   │   │
│   │   └── intelligence/               <-- 🧠 LALIT'S WORKSPACE
│   │       ├── __init__.py
│   │       ├── database.py             <-- SQLAlchemy engine, SessionLocal, and DB base setup
│   │       ├── models.py               <-- SQLAlchemy ORM Models (TrafficLog, Incident)
│   │       ├── detector.py             <-- Background Anomaly Detection Loop (Threshold checker)
│   │       ├── ai_explainer.py         <-- OpenAI API integration function
│   │       └── routes.py               <-- REST API routes (GET /api/incidents)
│   │
│   └── simulator/                      <-- ⚡ ANSHIKA'S WORKSPACE
│       └── traffic_simulator.py        <-- Asynchronous Python script simulating normal & spike traffic
```

---

## 🤝 Parallel Workflow & Data Contract Specifications

To work simultaneously without waiting for backend routes or database setups, all members will adhere to the following **Data Contracts**:

### Contract 1: Real-Time WebSocket Message Schema (Anshika -> Manshi)
Published over `ws://localhost:8000/ws/traffic` every 1 second:
```json
{
  "timestamp": "2026-09-14T00:30:15Z",
  "current_rps": 115,
  "status": "ANOMALY",
  "baseline_rps": 20,
  "active_incident": true
}
```

### Contract 2: Incident History REST API Schema (Lalit -> Manshi)
Returned from `GET /api/incidents`:
```json
[
  {
    "id": "inc_948201",
    "timestamp": "2026-09-14T00:28:10Z",
    "peak_rps": 120,
    "duration_seconds": 45,
    "severity": "CRITICAL",
    "ai_explanation": "Anomalous traffic burst detected exceeding baseline by 500%. Over 85% of traffic originated from rapid sequential requests targeting the /api/traffic endpoint. Pattern indicates a HTTP Flood DDoS attempt."
  }
]
```

---

## 👩‍💻 MEMBER 1: MANSHI — Frontend, 3D Globe & WebSockets

### 🎯 Role & Objective
You are building the **Visual SOC Dashboard**. You will use AI visual generators to scaffold the shell, integrate an interactive 3D WebGL Globe showing incoming attack vectors, build real-time streaming line charts, and connect to Anshika's WebSocket feed.

---

### 🛠️ Step 1: Environment Setup & Library Installation
Open your terminal inside the `frontend/` directory and run:
```bash
npx create-react-app .
npm install react-globe.gl three recharts react-use-websocket tailwindcss postcss autoprefixer axios lucide-react
npx tailwindcss init -p
```

**Why these dependencies?**
- `react-globe.gl` + `three`: Renders an interactive 3D planet. Allows drawing arcs connecting IP coordinates to your central server.
- `recharts`: Draws real-time line charts that dynamically append incoming RPS numbers.
- `react-use-websocket`: Handles WebSocket auto-reconnects and event listeners gracefully inside React functional components.
- `lucide-react`: Cybersecurity icon set (Shield, AlertTriangle, Activity, Terminal).

---

### 🤖 Step 2: Generating the UI Shell using AI (v0.dev or Lovable.dev)
1. Open [v0.dev](https://v0.dev) or [Lovable.dev](https://lovable.dev).
2. Input the following **Exact Architect Prompt**:
   > *"Create a dark-mode Cybersecurity Control Room (SOC) Dashboard in React using Tailwind CSS. The theme must be deep slate black with electric cyan and crimson red accents. Include: 1) A top navbar with system status badge and clock, 2) A large main section with a placeholder box for a 3D Globe, 3) A right-hand sidebar for dynamic Recharts live RPS line charts, 4) A bottom panel with a scrolling feed of AI security incident logs with threat severity tags."*
3. Copy the generated code into `src/components/DashboardShell.jsx`.

---

### 📋 Step 3: Detailed Component Development

#### 1. `src/services/websocket.js` (WebSocket Hook)
```javascript
import useWebSocket from 'react-use-websocket';

export const useTrafficStream = (onMessageReceived) => {
  const WS_URL = 'ws://localhost:8000/ws/traffic';
  
  const { lastJsonMessage, readyState } = useWebSocket(WS_URL, {
    onMessage: (event) => {
      const data = JSON.parse(event.data);
      onMessageReceived(data);
    },
    shouldReconnect: () => true,
    reconnectInterval: 3000,
  });

  return { lastJsonMessage, readyState };
};
```

#### 2. `src/components/Globe3D.jsx` (Interactive 3D Threat Map)
```javascript
import React from 'react';
import Globe from 'react-globe.gl';

const Globe3D = ({ isAnomaly }) => {
  // Central Server Location: Bengaluru, India
  const SERVER_LOCATION = { lat: 12.9716, lng: 77.5946, name: 'Main SOC Server' };

  // Simulated Attack Origin Nodes
  const arcsData = isAnomaly ? [
    { startLat: 37.7749, startLng: -122.4194, endLat: 12.9716, endLng: 77.5946, color: '#ef4444' }, // USA
    { startLat: 51.5074, startLng: -0.1278, endLat: 12.9716, endLng: 77.5946, color: '#ef4444' },   // UK
    { startLat: 35.6762, startLng: 139.6503, endLat: 12.9716, endLng: 77.5946, color: '#ef4444' },  // Japan
  ] : [];

  return (
    <div className="h-[450px] w-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-900 border border-slate-800">
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcStroke={1.5}
      />
    </div>
  );
};

export default Globe3D;
```

#### 3. `src/components/LiveRpsChart.jsx` (Streaming Recharts)
```javascript
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const LiveRpsChart = ({ trafficHistory }) => {
  return (
    <div className="h-[250px] bg-slate-900 p-4 rounded-xl border border-slate-800">
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Live Throughput (RPS)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trafficHistory}>
          <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10 }} />
          <YAxis stroke="#64748b" domain={[0, 150]} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
          <Line type="monotone" dataKey="current_rps" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LiveRpsChart;
```

---

## 👩‍💻 MEMBER 2: ANSHIKA — Scaling, Streaming, Redis & Simulation

### 🎯 Role & Objective
You are building the **High-Speed Ingestion Core**. You will handle HTTP requests, store sub-second counter state in Redis, broadcast metrics via FastAPI WebSockets, and build an async traffic simulator script.

---

### 🛠️ Step 1: Environment Setup & Redis Initialization
Inside the `backend/` directory, set up your Python environment and run Redis via Docker:
```bash
python -m venv env
source env/bin/activate  # Windows: env\Scriptsctivate
pip install fastapi uvicorn redis websockets httpx pydantic
```

**Launch Redis Stack Container:**
```bash
docker run -d --name soc-redis -p 6379:6379 redis/redis-stack:latest
```

---

### 📋 Step 2: Detailed Backend Development

#### 1. `backend/app/ingestion/redis_client.py` (Redis Atomic Operations)
```python
import redis
import time

# Connect to local Redis instance
redis_db = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def record_request(ip_address: str) -> int:
    # Increments the current second's request counter atomically in Redis.
    # Sets key expiration to 60 seconds to prevent RAM bloat.
    current_second = int(time.time())
    key = f"rps:{current_second}"
    
    pipeline = redis_db.pipeline()
    pipeline.incr(key)
    pipeline.expire(key, 60)
    pipeline.lpush("recent_ips", ip_address)
    pipeline.ltrim("recent_ips", 0, 100)  # Keep rolling 100 IPs
    results = pipeline.execute()
    
    return results[0] # Returns current RPS count

def get_current_rps() -> int:
    current_second = int(time.time())
    count = redis_db.get(f"rps:{current_second}")
    return int(count) if count else 0
```

#### 2. `backend/app/ingestion/websocket_manager.py` (Real-Time Broadcaster)
```python
from fastapi import WebSocket
from typing import List
import asyncio
import json
import time
from app.ingestion.redis_client import get_current_rps

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

manager = ConnectionManager()

async def rps_broadcaster_loop():
    # Background task streaming Redis metrics to connected React clients every 1 sec.
    while True:
        rps = get_current_rps()
        status = "ANOMALY" if rps > 80 else "NORMAL"
        payload = {
            "timestamp": time.strftime("%H:%M:%S"),
            "current_rps": rps,
            "status": status,
            "active_incident": rps > 80
        }
        await manager.broadcast(payload)
        await asyncio.sleep(1)
```

#### 3. `backend/app/ingestion/main.py` (FastAPI Server Entry)
```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from app.ingestion.redis_client import record_request
from app.ingestion.websocket_manager import manager, rps_broadcaster_loop

app = FastAPI(title="DDoS SOC Ingestion Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(rps_broadcaster_loop())

@app.post("/api/traffic")
async def ingest_traffic(request: Request):
    client_ip = request.client.host
    rps = record_request(client_ip)
    return {"status": "ok", "rps": rps}

@app.websocket("/ws/traffic")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text() # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

#### 4. `backend/simulator/traffic_simulator.py` (Async Generator)
```python
import asyncio
import httpx
import time

TARGET_URL = "http://localhost:8000/api/traffic"

async def send_request(client):
    try:
        await client.post(TARGET_URL)
    except Exception:
        pass

async def run_simulation():
    async with httpx.AsyncClient() as client:
        print("🟢 STARTING SIMULATION: Normal Traffic (10-20 RPS). Press Ctrl+C to stop.")
        
        while True:
            # Stage 1: Normal Baseline Traffic (15 requests/sec)
            for _ in range(15):
                asyncio.create_task(send_request(client))
            await asyncio.sleep(1)
            
            # Interactive Spike Simulation Check (Every 15 seconds, inject a DDoS spike)
            if int(time.time()) % 20 == 0:
                print("🚨 SIMULATING DDOS SPIKE: Injecting 100 RPS for 5 seconds...")
                for _ in range(5):
                    tasks = [send_request(client) for _ in range(100)]
                    await asyncio.gather(*tasks)
                    await asyncio.sleep(1)
                print("🟢 RECOVERY: Returning to Normal Baseline Traffic.")

if __name__ == "__main__":
    asyncio.run(run_simulation())
```

---

## 👨‍💻 MEMBER 3: LALIT — Database, Detection Engine & AI Explainer

### 🎯 Role & Objective
You are building the **Intelligence & Storage Layer**. You will configure PostgreSQL, write the background anomaly detector that reads Redis, call the OpenAI API when threshold breaches occur, and save/serve incident reports.

---

### 🛠️ Step 1: Environment Setup & PostgreSQL Initialization
Inside `backend/`, install database and AI dependencies and launch PostgreSQL via Docker:
```bash
pip install psycopg2-binary sqlalchemy openai python-dotenv
```

**Launch PostgreSQL Container:**
```bash
docker run -d --name soc-postgres -e POSTGRES_DB=soc_db -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:15
```

---

### 📋 Step 2: Detailed Intelligence Backend Development

#### 1. `backend/app/intelligence/database.py` (Database Engine)
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "postgresql://admin:secret@localhost:5432/soc_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### 2. `backend/app/intelligence/models.py` (SQLAlchemy ORM Schemas)
```python
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from datetime import datetime
from app.intelligence.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    peak_rps = Column(Integer, nullable=False)
    severity = Column(String(20), default="CRITICAL")
    ai_explanation = Column(Text, nullable=True)
    resolved = Column(Boolean, default=False)
```

#### 3. `backend/app/intelligence/ai_explainer.py` (OpenAI Integration)
```python
import os
from openai import OpenAI

# Initialize client (Ensure OPENAI_API_KEY environment variable is set)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "your-api-key-here"))

def generate_incident_explanation(peak_rps: int, recent_ips: list) -> str:
    # Uses OpenAI GPT model to generate a crisp 3-sentence security report.
    prompt = f"""
    Act as a senior SOC Cybersecurity Analyst.
    An anomaly trigger just fired on our HTTP endpoint.
    Telemetry Metrics:
    - Peak Throughput: {peak_rps} Requests Per Second (Normal Baseline: 15-20 RPS)
    - Sample Request IP Pool: {recent_ips[:10]}
    
    Provide a concise, professional 3-sentence incident report explaining what happened, the probable attack type (e.g., HTTP Flood DDoS), and recommended SOC triage steps.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Incident detected with peak volume of {peak_rps} RPS. Automated AI analysis failed to generate summary: {str(e)}"
```

#### 4. `backend/app/intelligence/detector.py` (Background Anomaly Detection Loop)
```python
import time
import asyncio
from app.ingestion.redis_client import get_current_rps, redis_db
from app.intelligence.database import SessionLocal, engine
from app.intelligence.models import Base, Incident
from app.intelligence.ai_explainer import generate_incident_explanation

# Create tables in Postgres automatically
Base.metadata.create_all(bind=engine)

COOLDOWN_SECONDS = 30
last_incident_time = 0

def run_anomaly_detector():
    global last_incident_time
    print("🧠 ANOMALY DETECTOR STARTED: Monitoring Redis counters...")
    
    while True:
        current_rps = get_current_rps()
        current_time = time.time()
        
        # Threshold Logic: Trigger if RPS > 80 and not in cooldown
        if current_rps > 80 and (current_time - last_incident_time > COOLDOWN_SECONDS):
            print(f"🚨 ANOMALY DETECTED! Peak RPS: {current_rps}. Triggering AI Explainer & Postgres Log...")
            
            recent_ips = redis_db.lrange("recent_ips", 0, 50)
            ai_summary = generate_incident_explanation(current_rps, recent_ips)
            
            db = SessionLocal()
            new_incident = Incident(
                peak_rps=current_rps,
                severity="CRITICAL",
                ai_explanation=ai_summary
            )
            db.add(new_incident)
            db.commit()
            db.close()
            
            last_incident_time = current_time
            print("✅ INCIDENT LOGGED TO POSTGRESQL & EXPLAINED BY AI.")
            
        time.sleep(1)

if __name__ == "__main__":
    run_anomaly_detector()
```

#### 5. `backend/app/intelligence/routes.py` (REST API for Manshi)
Add this route to `backend/app/ingestion/main.py`:
```python
from fastapi import Depends
from sqlalchemy.orm import Session
from app.intelligence.database import get_db
from app.intelligence.models import Incident

@app.get("/api/incidents")
def get_historical_incidents(db: Session = Depends(get_db)):
    # Allows Manshi's React Frontend to pull historical incident logs stored in Postgres.
    return db.query(Incident).order_by(Incident.timestamp.desc()).limit(10).all()
```

---

## 🌿 Git Branching & Collaborative Workflow

To prevent code overwrites, follow this exact Git branching routine:

### 1. Initial Setup (One Person Executes Once)
```bash
git checkout main
git pull origin main
git branch frontend-manshi
git branch backend-anshika
git branch intelligence-lalit
git push -u origin --all
```

### 2. Member Daily Coding Routine
- **Manshi:**
  ```bash
  git checkout frontend-manshi
  # ... work on React components ...
  git add .
  git commit -m "Added 3D Globe and Recharts streaming components"
  git push origin frontend-manshi
  ```
- **Anshika:**
  ```bash
  git checkout backend-anshika
  # ... work on FastAPI & Redis ...
  git add .
  git commit -m "Added Redis atomic counter and WebSocket broadcaster"
  git push origin backend-anshika
  ```
- **Lalit:**
  ```bash
  git checkout intelligence-lalit
  # ... work on Postgres & OpenAI ...
  git add .
  git commit -m "Added SQLAlchemy schemas, anomaly detector loop, and OpenAI integration"
  git push origin intelligence-lalit
  ```

### 3. Merging to Main
When a feature is tested locally:
1. Go to your GitHub repository on web.
2. Open a **Pull Request (PR)** from your branch into `main`.
3. Have your teammates review and click **Merge Pull Request**.

---

## 🚀 Complete System Launch Sequence

When all three members integrate their code, run the system in this order across 5 terminal windows:

1. **Terminal 1 (Infrastructure Containers):**
   ```bash
   docker start soc-redis soc-postgres
   ```
2. **Terminal 2 (FastAPI Ingestion & WebSockets - Anshika):**
   ```bash
   cd backend
   uvicorn app.ingestion.main:app --reload --port 8000
   ```
3. **Terminal 3 (Background Anomaly Detector - Lalit):**
   ```bash
   cd backend
   python -m app.intelligence.detector
   ```
4. **Terminal 4 (React SOC Dashboard - Manshi):**
   ```bash
   cd frontend
   npm start
   ```
5. **Terminal 5 (Traffic Simulator):**
   ```bash
   cd backend
   python simulator/traffic_simulator.py
   ```

**What Happens When Running:**
- Manshi's browser opens `http://localhost:3000`. The chart updates every second with normal baseline traffic (10-20 RPS).
- Every 20 seconds, the Traffic Simulator fires a 100 RPS spike.
- Redis registers the spike instantly. Anshika's WebSocket streams `status: "ANOMALY"` to Manshi's screen.
- Manshi's 3D Globe lights up with red threat arcs pointing to Bengaluru.
- Lalit's `detector.py` senses the breach, calls OpenAI, gets a 3-sentence summary, and writes the incident into PostgreSQL.
- Manshi's incident sidebar updates automatically with the fresh AI analysis!
