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
    
    return results[0] # Returns current total RPS count

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
        
    # Sort IPs by count (descending) to easily find the top attackers
    sorted_ips = sorted(ip_counts.items(), key=lambda item: item[1], reverse=True)
    
    return {
        "total_rps": total_rps,
        "ip_distribution": sorted_ips # Example: [("192.168.1.1", 95), ("10.0.0.2", 1)]
    }
