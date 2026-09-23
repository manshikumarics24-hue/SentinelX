from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.intelligence.database import get_db
from app.intelligence.models import Incident
from app.ingestion.redis_client import get_current_metrics
from app.intelligence.traffic_classifier import classify_traffic
import time

router = APIRouter()


# ─── /api/incidents ──────────────────────────────────────────────────────────
# Returns the 20 most recent logged incidents (real data from PostgreSQL).
# Used by: IncidentDrawer, AlertsView, DashboardView -> "Recent Activity"
@router.get("/api/incidents")
def get_incidents(db: Session = Depends(get_db)):
    incidents = (
        db.query(Incident)
        .order_by(Incident.timestamp.desc())
        .limit(20)
        .all()
    )

    results = []
    for inc in incidents:
        severity = (
            "CRITICAL"
            if "DDOS" in inc.status.upper() or "ATTACK" in inc.status.upper()
            else "WARNING"
        )
        results.append({
            "id": str(inc.id),
            "timestamp": inc.timestamp.isoformat() + "Z",
            "peak_rps": inc.total_rps,
            "duration_seconds": 0,          # future improvement: track end time
            "severity": severity,
            "status": inc.status,
            "attacker_ips": inc.attacker_ips.split(",") if inc.attacker_ips else [],
            "source_count": inc.source_count or 0,
            "top_source_rps": inc.top_source_rps or 0,
            "top_source_concentration": inc.top_source_concentration or 0,
            "legitimate_rps": inc.legitimate_rps or 0,
            "faulty_rps": inc.faulty_rps or 0,
            "detection_reason": inc.detection_reason or "No detection reason recorded.",
            "ai_explanation": inc.ai_explanation or "No explanation generated.",
            "resolved": inc.resolved,
        })

    return results


# ─── /api/stats ──────────────────────────────────────────────────────────────
# Returns aggregate statistics about the entire incident history.
# Used by: DashboardView summary cards (Blocked Threats, Total Requests, etc.)
@router.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total_incidents = db.query(func.count(Incident.id)).scalar() or 0
    critical_count = (
        db.query(func.count(Incident.id))
        .filter(Incident.status.in_(["VOLUMETRIC_DDOS", "BOT_ATTACK"]))
        .scalar()
        or 0
    )
    max_rps = db.query(func.max(Incident.total_rps)).scalar() or 0
    avg_rps = db.query(func.avg(Incident.total_rps)).scalar() or 0

    # Current live RPS from Redis (real-time)
    metrics = get_current_metrics()

    return {
        "total_incidents": total_incidents,
        "critical_incidents": critical_count,
        "peak_rps_ever": max_rps,
        "avg_incident_rps": round(float(avg_rps), 1),
        "current_rps": metrics["total_rps"],
        "active_nodes": 8,          # static for now — integrate with infra later
        "uptime_pct": "99.97%",     # static for now
    }


# ─── /api/metrics/live ───────────────────────────────────────────────────────
# Returns the CURRENT second's Redis counters directly.
# Used as an HTTP fallback when WebSocket is not available.
@router.get("/api/metrics/live")
def get_live_metrics():
    metrics = get_current_metrics()
    total = metrics["total_rps"]
    ip_dist = metrics["ip_distribution"]
    classification = classify_traffic(total, ip_dist)

    return {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "current_rps": total,
        **classification,
        "ip_distribution": ip_dist[:10],
    }


# ─── /api/incidents/{id}/resolve ─────────────────────────────────────────────
# Marks an incident as resolved (used by Alerts acknowledge button).
@router.post("/api/incidents/{incident_id}/resolve")
def resolve_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        return {"error": "Incident not found"}
    incident.resolved = True
    db.commit()
    return {"success": True, "id": incident_id}
