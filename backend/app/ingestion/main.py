from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from app.ingestion.redis_client import record_request, is_ip_blocked, check_token_bucket
from app.ingestion.websocket_manager import manager, rps_broadcaster_loop
from app.intelligence.routes import router as intelligence_router

app = FastAPI(title="SentinelX DDoS SOC Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intelligence_router)

@app.on_event("startup")
async def startup_event():
    # Start the background websocket broadcaster
    asyncio.create_task(rps_broadcaster_loop())

@app.post("/api/traffic")
async def ingest_traffic(request: Request):
    """
    High-speed ingestion endpoint with inline active mitigation and token-bucket rate limiting.
    1. If quarantined in Redis blacklist -> HTTP 403 Forbidden.
    2. If token bucket budget exhausted -> HTTP 429 Too Many Requests.
    3. Otherwise -> increments Redis telemetry and returns OK.
    """
    client_ip = request.headers.get("X-Forwarded-For", request.client.host)
    if "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()

    # 1. Active Quarantine Firewall Check (O(1) in Redis)
    if is_ip_blocked(client_ip):
        return JSONResponse(
            status_code=403,
            content={
                "status": "blocked",
                "ip": client_ip,
                "message": "Access denied: IP quarantined by SentinelX SOC shield."
            }
        )

    # 2. Token-Bucket Rate Limiter (Allows normal bursts up to 40, refills at 5 tokens/sec)
    # Simulator traffic can set X-Bypass-Rate-Limit: 1 to stress test volumetric pipelines
    bypass_rate_limit = request.headers.get("X-Bypass-Rate-Limit") == "1"
    if not bypass_rate_limit and not check_token_bucket(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "status": "rate_limited",
                "ip": client_ip,
                "message": "HTTP 429: Rate limit exceeded. Token bucket exhausted."
            }
        )

    rps = record_request(client_ip)
    return {"status": "ok", "current_rps": rps}

@app.websocket("/ws/traffic")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)
