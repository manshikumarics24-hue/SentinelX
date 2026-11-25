from fastapi import WebSocket
from typing import List
import asyncio
import json
import time
from app.ingestion.redis_client import get_current_metrics
from app.intelligence.database import SessionLocal
from app.intelligence.models import Incident
from app.intelligence.ai_explainer import generate_incident_explanation, generate_ip_confidence_score
from app.intelligence.threat_intel import process_threat_ips, get_geolocation
from app.intelligence.traffic_classifier import classify_traffic

# SOC Core target (Bengaluru, India)
SOC_TARGET = {"lat": 12.9716, "lng": 77.5946}


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead.append(connection)
        for d in dead:
            if d in self.active_connections:
                self.active_connections.remove(d)


manager = ConnectionManager()

COOLDOWN_SECONDS = 30
_last_incident_time = 0


def _log_incident_to_db(analysis: dict, ai_summary: str):
    db = SessionLocal()
    try:
        incident = Incident(
            total_rps=analysis["current_rps"],
            status=analysis["status"],
            attacker_ips=",".join(analysis["attacker_ips"]),
            source_count=analysis["source_count"],
            top_source_rps=analysis["top_source_rps"],
            top_source_concentration=analysis["top_source_concentration"],
            legitimate_rps=analysis["legitimate_rps"],
            faulty_rps=analysis["faulty_rps"],
            detection_reason=analysis["detection_reason"],
            ai_explanation=ai_summary,
        )
        db.add(incident)
        db.commit()
        print(f" [DB] Logged -> {analysis['status']} | {analysis['current_rps']} RPS | IPs: {analysis['attacker_ips'][:3]}")
    except Exception as e:
        db.rollback()
        print(f" [DB] Error: {e}")
    finally:
        db.close()


def _map_threat_category(status: str, is_malicious: bool) -> str:
    if not is_malicious:
        return "OAS" if status == "NORMAL" else "WAV"
    if status == "VOLUMETRIC_DDOS":
        return "IDS"
    if status == "BOT_ATTACK":
        return "BAD"
    return "ODS"


async def rps_broadcaster_loop():
    global _last_incident_time

    while True:
        metrics = get_current_metrics()
        total   = metrics["total_rps"]
        ip_dist = metrics["ip_distribution"]  # [(ip, rps), ...] sorted descending
        ip_rps_map = dict(ip_dist)
        now     = time.time()

        classification = classify_traffic(total, ip_dist)
        status       = classification["status"]
        is_attack    = classification["is_attack"]
        attacker_ips = classification["attacker_ips"]
        attacker_set = set(attacker_ips)

        # Geo-enrich the REAL active source IPs from Redis (not hardcoded cities!)
        active_ips_to_resolve = attacker_ips if (is_attack and attacker_ips) else [ip for ip, _ in ip_dist[:12]]
        active_threat_nodes = []
        top_locations = []
        ai_insights = []

        if is_attack and attacker_ips:
            active_threat_nodes = await process_threat_ips(attacker_ips, ip_rps_map, total)
            top_locations = list(dict.fromkeys(
                f"{n['city']}, {n['country']}" if n.get('country') else n['city']
                for n in active_threat_nodes if n.get('city')
            ))
            try:
                top_ip = attacker_ips[0]
                insight = generate_ip_confidence_score(top_ip)
                insight["ip"] = top_ip
                ai_insights.append(insight)
            except Exception:
                pass

        ai_summary = generate_incident_explanation(
            status, total, attacker_ips, classification["legitimate_rps"], top_locations
=======
        # AI explanation — generated in simple language with origin sources
        ai_summary = generate_incident_explanation(
            status, total, attacker_ips, classification["legitimate_rps"], source_locations=source_locations_str
>>>>>>> 6300011 (Refactor theme to sleek charcoal space palette, simplify AI explanations, and clean up Windows venv binaries)
        ) if is_attack else None

        if is_attack and (now - _last_incident_time) > COOLDOWN_SECONDS:
            _last_incident_time = now
            incident_analysis = {**classification, "current_rps": total, "ai_explanation": ai_summary}
            loop = asyncio.get_event_loop()
            loop.run_in_executor(None, _log_incident_to_db, incident_analysis, ai_summary)

        # Build global_traffic_events directly from real active IPs in ip_dist
        global_traffic_events = []
        if ip_dist:
            resolved_geos = await asyncio.gather(*(get_geolocation(ip) for ip, _ in ip_dist[:20]))
            for (ip, ip_rps), geo in zip(ip_dist[:20], resolved_geos):
                is_malicious = is_attack and (ip in attacker_set or status == "VOLUMETRIC_DDOS")
                global_traffic_events.append({
                    "ip":            ip,
                    "rps":           ip_rps,
                    "startLat":      geo["lat"],
                    "startLng":      geo["lng"],
                    "endLat":        SOC_TARGET["lat"],
                    "endLng":        SOC_TARGET["lng"],
                    "isMalicious":   is_malicious,
                    "type":          _map_threat_category(status, is_malicious),
                    "sourceCity":    geo["city"],
                    "sourceCountry": geo.get("country", ""),
                    "sourceCC":      geo.get("cc", ""),
                })

        payload = {
            "timestamp":                time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "current_rps":              total,
            "legitimate_rps":           classification["legitimate_rps"],
            "faulty_rps":               classification["faulty_rps"],
            "status":                   status,
            "attack_type":              classification["attack_type"],
            "is_attack":                is_attack,
            "severity":                 classification["severity"],
            "attacker_ips":             attacker_ips,
            "source_count":             classification["source_count"],
            "top_source_rps":           classification["top_source_rps"],
            "top_source_concentration": classification["top_source_concentration"],
            "detection_reason":         classification["detection_reason"],
            "ai_explanation":           ai_summary,
            "ip_distribution":          ip_dist[:10],
            "total_rps":                total,
            "baseline_rps":             70,
            "active_incident":          is_attack,
            "active_threat_nodes":      active_threat_nodes,
            "top_locations":            top_locations,
            "attack_origin":            active_threat_nodes[0] if active_threat_nodes else None,
            "global_traffic_events":    global_traffic_events,
            "ai_insights":              ai_insights,
        }

        await manager.broadcast(payload)
        await asyncio.sleep(1)
