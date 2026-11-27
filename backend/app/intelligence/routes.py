from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.intelligence.database import get_db
from app.intelligence.models import Incident
from app.ingestion.redis_client import (
    get_current_metrics,
    block_ip,
    unblock_ip,
    get_blocked_ips,
    is_ip_blocked
)
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
        
        attacker_ips_list = [ip.strip() for ip in (inc.attacker_ips or "").split(",") if ip.strip()]
        source_count = inc.source_count if inc.source_count and inc.source_count > 0 else (len(attacker_ips_list) if attacker_ips_list else 1)
        
        # Format clean explanation if raw error exists
        ai_exp = inc.ai_explanation or "No explanation generated."
        if "429" in ai_exp or "credit_balance_exhausted" in ai_exp or "Automated AI analysis failed" in ai_exp:
            from app.intelligence.ai_explainer import _get_rule_based_explanation
            ai_exp = _get_rule_based_explanation(inc.status, inc.total_rps, attacker_ips_list, inc.legitimate_rps or 0)

        # Format detection reason if missing
        detection_reason = inc.detection_reason
        if not detection_reason or detection_reason == "No detection reason recorded.":
            if inc.status == "BOT_ATTACK":
                top_ip = attacker_ips_list[0] if attacker_ips_list else "unknown"
                detection_reason = f"CRITICAL: Single-source bot attack detected at {inc.total_rps} RPS from {top_ip} violating concentration threshold."
            elif inc.status == "VOLUMETRIC_DDOS":
                detection_reason = f"CRITICAL: Volumetric traffic flood reaching {inc.total_rps} RPS across {source_count} source IPs exceeding safety threshold."
            elif inc.status == "FLASH_SALE":
                detection_reason = f"Elevated distributed traffic surge to {inc.total_rps} RPS across {source_count} sources — verified benign."
            else:
                detection_reason = f"Traffic monitored at {inc.total_rps} RPS within nominal parameters."

        top_concentration = inc.top_source_concentration or (75 if inc.status == "BOT_ATTACK" else 15)

        results.append({
            "id": str(inc.id),
            "timestamp": inc.timestamp.isoformat() + "Z",
            "peak_rps": inc.total_rps,
            "duration_seconds": 0,
            "severity": severity,
            "status": inc.status,
            "attacker_ips": attacker_ips_list,
            "source_count": source_count,
            "top_source_rps": inc.top_source_rps or round(inc.total_rps * (top_concentration / 100)),
            "top_source_concentration": top_concentration,
            "legitimate_rps": inc.legitimate_rps or 0,
            "faulty_rps": inc.faulty_rps or inc.total_rps,
            "detection_reason": detection_reason,
            "ai_explanation": ai_exp,
            "resolved": inc.resolved,
        })

    return results


# ─── /api/stats ──────────────────────────────────────────────────────────────
# Returns aggregate statistics about the entire incident history + active mitigation.
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

    metrics = get_current_metrics()
    blocked = get_blocked_ips()

    return {
        "total_incidents": total_incidents,
        "critical_incidents": critical_count,
        "peak_rps_ever": max_rps,
        "avg_incident_rps": round(float(avg_rps), 1),
        "current_rps": metrics["total_rps"],
        "active_nodes": len(metrics["ip_distribution"]),
        "blocked_ips_count": len(blocked),
    }


# ─── /api/metrics/live ───────────────────────────────────────────────────────
# Returns the CURRENT second's Redis counters directly.
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


# ─── Active Mitigation Endpoints ──────────────────────────────────────────────

@router.get("/api/mitigate/blocked")
def get_all_blocked_ips():
    """
    Returns list of all IPs currently quarantined in the Redis firewall blacklist.
    """
    return get_blocked_ips()


@router.post("/api/mitigate/block")
def block_ip_endpoint(payload: dict = Body(...)):
    """
    Quarantines an IP in Redis firewall for a given duration (default: 300s).
    """
    ip = payload.get("ip")
    duration = int(payload.get("duration", 300))
    reason = payload.get("reason", "Manual SOC Quarantine")
    if not ip:
        return {"error": "IP is required"}
    success = block_ip(ip, duration, reason)
    return {"success": success, "ip": ip, "duration": duration, "reason": reason}


@router.post("/api/mitigate/unblock")
def unblock_ip_endpoint(payload: dict = Body(...)):
    """
    Removes an IP from the quarantine blacklist.
    """
    ip = payload.get("ip")
    if not ip:
        return {"error": "IP is required"}
    success = unblock_ip(ip)
    return {"success": success, "ip": ip}
