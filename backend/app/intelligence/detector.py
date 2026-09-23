import time
import sys
import os

# Ensure the parent directory is in the python path to run this as a standalone script
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.ingestion.redis_client import get_current_metrics
from app.intelligence.database import SessionLocal, engine
from app.intelligence.models import Base, Incident
from app.intelligence.ai_explainer import generate_incident_explanation
from app.intelligence.traffic_classifier import classify_traffic

# Create tables in Postgres automatically
Base.metadata.create_all(bind=engine)

COOLDOWN_SECONDS = 30
last_incident_time = 0

def run_anomaly_detector():
    global last_incident_time
    print("🧠 HYBRID ANOMALY DETECTOR STARTED: Monitoring Redis counters...")
    
    while True:
        metrics = get_current_metrics()
        total = metrics["total_rps"]
        ip_dist = metrics["ip_distribution"]
        current_time = time.time()
        
        # Only log incidents if out of cooldown
        if current_time - last_incident_time > COOLDOWN_SECONDS:
            classification = classify_traffic(total, ip_dist)
            status = classification["status"]
            attacker_ips = classification["attacker_ips"]
                    
            if status != "NORMAL":
                print(f"\n🚨 ANOMALY DETECTED! Status: {status} | Peak RPS: {total}. Triggering AI Explainer & Postgres Log...")
                
                ai_summary = generate_incident_explanation(status, total, attacker_ips)
                
                db = SessionLocal()
                new_incident = Incident(
                    total_rps=total,
                    status=status,
                    attacker_ips=",".join(attacker_ips),
                    ai_explanation=ai_summary
                )
                db.add(new_incident)
                db.commit()
                db.close()
                
                last_incident_time = current_time
                print("✅ INCIDENT LOGGED TO POSTGRESQL & EXPLAINED BY AI.")
                
        time.sleep(1)

if __name__ == "__main__":
    run_anomaly_detector()
