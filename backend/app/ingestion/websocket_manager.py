from fastapi import WebSocket
from typing import List
import asyncio
import json
import time
import random
from app.ingestion.redis_client import get_current_metrics
from app.intelligence.database import SessionLocal
from app.intelligence.models import Incident
from app.intelligence.ai_explainer import generate_incident_explanation, generate_ip_confidence_score
from app.intelligence.threat_intel import process_threat_ips
from app.intelligence.traffic_classifier import classify_traffic

# ─── Named source cities (real lat/lng + label) ───────────────────────────────
# Used instead of random coords so the globe shows REAL named source locations.
WORLD_CITIES = [
    {"city": "New York",      "country": "US", "lat": 40.7128,  "lng": -74.0060},
    {"city": "Los Angeles",   "country": "US", "lat": 34.0522,  "lng": -118.2437},
    {"city": "Chicago",       "country": "US", "lat": 41.8781,  "lng": -87.6298},
    {"city": "London",        "country": "GB", "lat": 51.5074,  "lng": -0.1278},
    {"city": "Frankfurt",     "country": "DE", "lat": 50.1109,  "lng": 8.6821},
    {"city": "Paris",         "country": "FR", "lat": 48.8566,  "lng": 2.3522},
    {"city": "Moscow",        "country": "RU", "lat": 55.7558,  "lng": 37.6173},
    {"city": "Amsterdam",     "country": "NL", "lat": 52.3676,  "lng": 4.9041},
    {"city": "Tokyo",         "country": "JP", "lat": 35.6762,  "lng": 139.6503},
    {"city": "Seoul",         "country": "KR", "lat": 37.5665,  "lng": 126.9780},
    {"city": "Shanghai",      "country": "CN", "lat": 31.2304,  "lng": 121.4737},
    {"city": "Beijing",       "country": "CN", "lat": 39.9042,  "lng": 116.4074},
    {"city": "Singapore",     "country": "SG", "lat": 1.3521,   "lng": 103.8198},
    {"city": "Sydney",        "country": "AU", "lat": -33.8688, "lng": 151.2093},
    {"city": "Melbourne",     "country": "AU", "lat": -37.8136, "lng": 144.9631},
    {"city": "São Paulo",     "country": "BR", "lat": -23.5505, "lng": -46.6333},
    {"city": "Mexico City",   "country": "MX", "lat": 19.4326,  "lng": -99.1332},
    {"city": "Toronto",       "country": "CA", "lat": 43.6532,  "lng": -79.3832},
    {"city": "Dubai",         "country": "AE", "lat": 25.2048,  "lng": 55.2708},
    {"city": "Istanbul",      "country": "TR", "lat": 41.0082,  "lng": 28.9784},
    {"city": "Cairo",         "country": "EG", "lat": 30.0444,  "lng": 31.2357},
    {"city": "Johannesburg",  "country": "ZA", "lat": -26.2041, "lng": 28.0473},
    {"city": "Lagos",         "country": "NG", "lat": 6.5244,   "lng": 3.3792},
    {"city": "Jakarta",       "country": "ID", "lat": -6.2088,  "lng": 106.8456},
    {"city": "Mumbai",        "country": "IN", "lat": 19.0760,  "lng": 72.8777},
    {"city": "Dhaka",         "country": "BD", "lat": 23.8103,  "lng": 90.4125},
    {"city": "Karachi",       "country": "PK", "lat": 24.8607,  "lng": 67.0011},
    {"city": "Tehran",        "country": "IR", "lat": 35.6892,  "lng": 51.3890},
    {"city": "Kyiv",          "country": "UA", "lat": 50.4501,  "lng": 30.5234},
    {"city": "Warsaw",        "country": "PL", "lat": 52.2297,  "lng": 21.0122},
]

THREAT_TYPES = ['OAS', 'ODS', 'MAV', 'WAV', 'IDS', 'VUL', 'KAS', 'BAD', 'SPAM']

# SOC Core target (Bengaluru)
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

# ─── Incident cooldown ────────────────────────────────────────────────────────
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
        print(f" [DB] Logged → {analysis['status']} | {analysis['current_rps']} RPS | IPs: {analysis['attacker_ips'][:3]}")
    except Exception as e:
        db.rollback()
        print(f" [DB] Error: {e}")
    finally:
        db.close()


async def rps_broadcaster_loop():
    global _last_incident_time

    while True:
        metrics  = get_current_metrics()
        total    = metrics["total_rps"]
        ip_dist  = metrics["ip_distribution"]
        now      = time.time()

        classification = classify_traffic(total, ip_dist)
        status       = classification["status"]
        is_attack    = classification["is_attack"]
        attacker_ips = classification["attacker_ips"]

        # AI explanation — generated every time during an attack so the panel updates live
        ai_summary = generate_incident_explanation(
            status, total, attacker_ips, classification["legitimate_rps"]
        ) if is_attack else None

        # Geo-enrich attacker IPs → real lat/lng for globe nodes
        active_threat_nodes = []
        ai_insights = []
        if is_attack and attacker_ips:
            active_threat_nodes = await process_threat_ips(attacker_ips)
            try:
                top_ip  = attacker_ips[0]
                insight = generate_ip_confidence_score(top_ip)
                insight["ip"] = top_ip
                ai_insights.append(insight)
            except Exception:
                pass

        # Save to DB (with 30s cooldown to avoid spam)
        if is_attack and (now - _last_incident_time) > COOLDOWN_SECONDS:
            _last_incident_time = now
            incident_analysis = {**classification, "current_rps": total, "ai_explanation": ai_summary}
            loop = asyncio.get_event_loop()
            loop.run_in_executor(None, _log_incident_to_db, incident_analysis, ai_summary)

        # ── Build global traffic events with named source cities ──────────
        # Cap visual arcs: more during attack so the globe looks busy
        num_events = min(max(total, 15), 35)
        global_traffic_events = []

        for i in range(num_events):
            is_malicious = is_attack and random.random() < 0.55

            # Pick source: prefer threat node location for malicious; named city for legit
            if is_malicious and active_threat_nodes:
                node = random.choice(active_threat_nodes)
                source_city    = node.get("city", "Unknown")
                source_country = node.get("country", "")
                src_lat, src_lng = node["lat"], node["lng"]
            else:
                city = random.choice(WORLD_CITIES)
                source_city    = city["city"]
                source_country = city["country"]
                src_lat, src_lng = city["lat"], city["lng"]

            global_traffic_events.append({
                "startLat":     src_lat,
                "startLng":     src_lng,
                "endLat":       SOC_TARGET["lat"],
                "endLng":       SOC_TARGET["lng"],
                "isMalicious":  is_malicious,
                "type":         random.choice(THREAT_TYPES),
                "sourceCity":   source_city,
                "sourceCountry": source_country,
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
            "global_traffic_events":    global_traffic_events,
            "ai_insights":              ai_insights,
        }

        await manager.broadcast(payload)
        await asyncio.sleep(1)
