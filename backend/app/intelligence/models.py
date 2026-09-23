from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from datetime import datetime
from app.intelligence.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    total_rps = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False) # e.g., VOLUMETRIC_DDOS, BOT_ATTACK
    attacker_ips = Column(Text, nullable=True) # Comma-separated string of IPs
    source_count = Column(Integer, default=0)
    top_source_rps = Column(Integer, default=0)
    top_source_concentration = Column(Integer, default=0)
    legitimate_rps = Column(Integer, default=0)
    faulty_rps = Column(Integer, default=0)
    detection_reason = Column(Text, nullable=True)
    ai_explanation = Column(Text, nullable=True)
    resolved = Column(Boolean, default=False)
