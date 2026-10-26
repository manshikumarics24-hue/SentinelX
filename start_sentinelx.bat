@echo off
title SentinelX Launcher
echo ===================================================
echo           Starting SentinelX SOC System
echo ===================================================

echo [1/5] Ensuring Redis container is running...
docker start sentinelx-redis >nul 2>&1 || docker run -d --name sentinelx-redis -p 6379:6379 redis

echo [2/5] Launching FastAPI Backend (Port 8001)...
start "SentinelX - FastAPI Backend (Port 8001)" cmd /k "cd /d %~dp0backend && set PYTHONIOENCODING=utf-8 && env\Scripts\activate && uvicorn app.ingestion.main:app --reload --port 8001"

timeout /t 3 /nobreak >nul

echo [3/5] Launching Anomaly Detector...
start "SentinelX - Anomaly Detector" cmd /k "cd /d %~dp0backend && set PYTHONIOENCODING=utf-8 && env\Scripts\activate && python -m app.intelligence.detector"

timeout /t 2 /nobreak >nul

echo [4/5] Launching Traffic Simulator...
start "SentinelX - Traffic Simulator" cmd /k "cd /d %~dp0backend && set PYTHONIOENCODING=utf-8 && env\Scripts\activate && python simulator\traffic_simulator.py"

timeout /t 2 /nobreak >nul

echo [5/5] Launching Frontend Dashboard (Vite)...
start "SentinelX - Frontend Dashboard" cmd /k "cd /d %~dp0 && npm run dev"

echo ===================================================
echo All SentinelX services launched!
echo Open your browser at: http://localhost:5173
echo ===================================================
pause
