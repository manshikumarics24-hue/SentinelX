import redis
import time
from app.config import config

# Connect to local Redis instance
redis_db = redis.Redis(host=config.REDIS_HOST, port=config.REDIS_PORT, db=0, decode_responses=True)

def record_request(ip_address: str) -> int:
    """
    Records a request and increments both global and IP-specific counters for the current second.
    """
    current_second = int(time.time())
    global_key = f"rps:global:{current_second}"
    ip_key = f"rps:ip:{current_second}:{ip_address}"
    recent_ips_key = f"recent_ips:{current_second}"
    
    pipeline = redis_db.pipeline()
    
    # 1. Increment total requests
    pipeline.incr(global_key)
    pipeline.expire(global_key, 60)
    
    # 2. Increment IP-specific requests
    pipeline.incr(ip_key)
    pipeline.expire(ip_key, 60)
    
    # 3. Keep track of which IPs were active in this exact second (Set)
    pipeline.sadd(recent_ips_key, ip_address)
    pipeline.expire(recent_ips_key, 60)
    
    results = pipeline.execute()
    
    return results[0]  # Returns current total RPS count

def get_current_metrics() -> dict:
    """
    Returns the total RPS and the specific IP distribution for the current second.
    """
    current_second = int(time.time())
    global_key = f"rps:global:{current_second}"
    recent_ips_key = f"recent_ips:{current_second}"
    
    total_rps = redis_db.get(global_key)
    total_rps = int(total_rps) if total_rps else 0
    
    # Get all active IPs for this second
    active_ips = redis_db.smembers(recent_ips_key)
    
    ip_counts = {}
    for ip in active_ips:
        count = redis_db.get(f"rps:ip:{current_second}:{ip}")
        if count:
            ip_counts[ip] = int(count)
        
    # Sort IPs by count (descending) to easily find top sources
    sorted_ips = sorted(ip_counts.items(), key=lambda item: item[1], reverse=True)
    
    return {
        "total_rps": total_rps,
        "ip_distribution": sorted_ips,  # Example: [("185.220.101.5", 95), ("14.139.1.2", 1)]
    }

# ── Active Mitigation & Firewall Quarantine ───────────────────────────────────

def block_ip(ip_address: str, duration_seconds: int = 300, reason: str = "Automated DDoS Mitigation") -> bool:
    """
    Quarantines an IP address in the Redis firewall blacklist.
    """
    if not ip_address:
        return False
    pipeline = redis_db.pipeline()
    pipeline.sadd("sentinelx:blocked_ips", ip_address)
    pipeline.setex(f"sentinelx:blocked_ip:{ip_address}:reason", duration_seconds, reason)
    pipeline.setex(f"sentinelx:blocked_ip:{ip_address}:active", duration_seconds, "1")
    pipeline.execute()
    return True

def unblock_ip(ip_address: str) -> bool:
    """
    Removes an IP address from the Redis firewall blacklist.
    """
    if not ip_address:
        return False
    pipeline = redis_db.pipeline()
    pipeline.srem("sentinelx:blocked_ips", ip_address)
    pipeline.delete(f"sentinelx:blocked_ip:{ip_address}:reason")
    pipeline.delete(f"sentinelx:blocked_ip:{ip_address}:active")
    pipeline.execute()
    return True

def is_ip_blocked(ip_address: str) -> bool:
    """
    Fast O(1) check if an incoming IP address is currently quarantined.
    """
    if not ip_address:
        return False
    return bool(redis_db.exists(f"sentinelx:blocked_ip:{ip_address}:active"))

def get_blocked_ips() -> list[dict]:
    """
    Returns all actively quarantined IP addresses with TTL and reasons.
    """
    ips = redis_db.smembers("sentinelx:blocked_ips")
    results = []
    for ip in ips:
        if redis_db.exists(f"sentinelx:blocked_ip:{ip}:active"):
            ttl = redis_db.ttl(f"sentinelx:blocked_ip:{ip}:active")
            reason = redis_db.get(f"sentinelx:blocked_ip:{ip}:reason") or "Automated mitigation"
            results.append({
                "ip": ip,
                "reason": reason,
                "ttl_seconds": max(0, ttl),
                "status": "ENFORCED",
            })
        else:
            redis_db.srem("sentinelx:blocked_ips", ip)
    return results
