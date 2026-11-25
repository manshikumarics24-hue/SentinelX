#!/bin/bash
# SentinelX Launcher for macOS / Linux

export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin:$HOME/.docker/bin:/Applications/Docker.app/Contents/Resources/bin"

echo "==================================================="
echo "          Starting SentinelX SOC System            "
echo "==================================================="

# 1. Start Redis container
echo "[1/5] Ensuring Redis container is running..."
if ! docker ps -a --format '{{.Names}}' | grep -q "^sentinelx-redis$"; then
    echo "Creating and starting new sentinelx-redis container..."
    docker run -d --name sentinelx-redis -p 6379:6379 redis
else
    echo "Starting existing sentinelx-redis container..."
    docker start sentinelx-redis
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

# Ensure venv exists
if [ ! -d "$BACKEND_DIR/env" ]; then
    echo "Python virtual environment not found. Setting up..."
    python3 -m venv "$BACKEND_DIR/env"
    source "$BACKEND_DIR/env/bin/activate"
    pip install -r "$BACKEND_DIR/requirements.txt"
fi

# Function to launch in a new Terminal tab/window on macOS
launch_macos_terminal() {
    local title="$1"
    local cmd="$2"
    osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT_DIR' && $cmd\""
}

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "[2/5] Launching FastAPI Backend on Port 8001..."
    launch_macos_terminal "SentinelX Backend" "cd backend && source env/bin/activate && export PYTHONIOENCODING=utf-8 && uvicorn app.ingestion.main:app --reload --port 8001"

    sleep 2

    echo "[3/5] Launching Anomaly Detector..."
    launch_macos_terminal "SentinelX Detector" "cd backend && source env/bin/activate && export PYTHONIOENCODING=utf-8 && python3 -m app.intelligence.detector"

    sleep 2

    echo "[4/5] Launching Traffic Simulator..."
    launch_macos_terminal "SentinelX Simulator" "cd backend && source env/bin/activate && export PYTHONIOENCODING=utf-8 && python3 simulator/traffic_simulator.py"

    sleep 2

    echo "[5/5] Launching Vite Frontend..."
    launch_macos_terminal "SentinelX Frontend" "npm run dev"

    echo "==================================================="
    echo "All SentinelX services launched in Terminal tabs!"
    echo "Dashboard URL: http://localhost:5173"
    echo "==================================================="
else
    echo "Please launch backend, detector, simulator, and frontend in separate terminals."
fi

