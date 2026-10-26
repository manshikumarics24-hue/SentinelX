Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "          Starting SentinelX SOC System            " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# 1. Start Redis
Write-Host "[1/5] Starting Redis container..." -ForegroundColor Yellow
docker start sentinelx-redis 2>$null
if ($LASTEXITCODE -ne 0) {
    docker run -d --name sentinelx-redis -p 6379:6379 redis
}

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

# 2. FastAPI Backend
Write-Host "[2/5] Launching FastAPI Backend on Port 8001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; `$env:PYTHONIOENCODING='utf-8'; .\env\Scripts\Activate.ps1; uvicorn app.ingestion.main:app --reload --port 8001"

Start-Sleep -Seconds 2

# 3. Anomaly Detector
Write-Host "[3/5] Launching Anomaly Detector..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; `$env:PYTHONIOENCODING='utf-8'; .\env\Scripts\Activate.ps1; python -m app.intelligence.detector"

Start-Sleep -Seconds 2

# 4. Traffic Simulator
Write-Host "[4/5] Launching Traffic Simulator..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; `$env:PYTHONIOENCODING='utf-8'; .\env\Scripts\Activate.ps1; python simulator\traffic_simulator.py"

Start-Sleep -Seconds 2

# 5. Frontend
Write-Host "[5/5] Launching Vite Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; npm run dev"

Write-Host "===================================================" -ForegroundColor Green
Write-Host "All SentinelX services launched successfully!" -ForegroundColor Green
Write-Host "Open Dashboard: http://localhost:5173" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Green
