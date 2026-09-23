from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from app.ingestion.redis_client import record_request
from app.ingestion.websocket_manager import manager, rps_broadcaster_loop
from app.intelligence.routes import router as intelligence_router

# Import intelligence routes later when we build them
# from app.intelligence.routes import router as intelligence_router

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
    High-speed ingestion endpoint. Simulates receiving traffic.
    """
    # In a real app, we get the real client IP. For our simulator, we might pass a spoofed IP in headers.
    client_ip = request.headers.get("X-Forwarded-For", request.client.host)
    
    rps = record_request(client_ip)
    return {"status": "ok"}

@app.websocket("/ws/traffic")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text() # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)
