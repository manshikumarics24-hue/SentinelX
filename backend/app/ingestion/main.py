from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from app.ingestion.redis_client import record_request, is_ip_blocked
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
    High-speed ingestion endpoint with inline active mitigation.
    If the source IP is quarantined in the Redis blacklist, it is immediately dropped.
    """
    client_ip = request.headers.get("X-Forwarded-For", request.client.host)
    if "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()

    # Active mitigation firewall check
    if is_ip_blocked(client_ip):
        return JSONResponse(
            status_code=403,
            content={
                "status": "blocked",
                "ip": client_ip,
                "message": "Access denied: IP quarantined by SentinelX SOC shield."
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
