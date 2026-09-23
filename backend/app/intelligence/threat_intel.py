import httpx
import asyncio
import hashlib
import json

# Simple in-memory cache to avoid hitting rate limits
# In a real system, this would be in Redis.
IP_GEO_CACHE = {}

async def get_geolocation(ip: str) -> dict:
    """
    Fetches coordinates for an IP using ip-api.com.
    Returns {lat, lng, city, country}.
    Caches results to avoid rate limit (45 req/min).
    """
    if ip in IP_GEO_CACHE:
        return IP_GEO_CACHE[ip]

    try:
        # We use a 1-second timeout because geocoding shouldn't block the WebSocket loop too long
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"http://ip-api.com/json/{ip}?fields=status,message,country,city,lat,lon")
            data = resp.json()
            if data.get("status") == "success":
                result = {
                    "lat": data["lat"],
                    "lng": data["lon"],
                    "city": data["city"],
                    "country": data["country"]
                }
                IP_GEO_CACHE[ip] = result
                return result
    except Exception as e:
        print(f"Geolocation error for {ip}: {e}")
    
    # Fallback if API fails or rate-limited
    # Deterministic fallback based on IP string
    hash_val = int(hashlib.md5(ip.encode()).hexdigest(), 16)
    fallback = {
        "lat": (hash_val % 180) - 90,
        "lng": (hash_val % 360) - 180,
        "city": "Unknown",
        "country": "Unknown"
    }
    IP_GEO_CACHE[ip] = fallback
    return fallback

def get_abuse_ipdb_score(ip: str) -> int:
    """
    Mocks an AbuseIPDB confidence score.
    In a real environment, this would call:
    https://api.abuseipdb.com/api/v2/check
    """
    # Deterministic score based on IP so the same IP always gets the same score
    hash_val = int(hashlib.md5((ip + "abuse").encode()).hexdigest(), 16)
    
    # Let's say 20% of IPs are known bad (score > 80)
    # 30% are suspicious (score 40-80)
    # 50% are clean (score < 40)
    bucket = hash_val % 100
    if bucket < 20:
        return 80 + (hash_val % 21) # 80-100
    elif bucket < 50:
        return 40 + (hash_val % 41) # 40-80
    else:
        return hash_val % 40 # 0-39

async def process_threat_ips(ips: list[str]) -> list[dict]:
    """
    Takes a list of IPs and returns enriched node data for the frontend globe.
    """
    results = []
    
    # We only process up to 10 unique IPs per incident to avoid hammering the API
    unique_ips = list(set(ips))[:10]
    
    tasks = [get_geolocation(ip) for ip in unique_ips]
    geos = await asyncio.gather(*tasks)
    
    for i, ip in enumerate(unique_ips):
        score = get_abuse_ipdb_score(ip)
        geo = geos[i]
        
        # Color scale based on AbuseIPDB score
        if score >= 80:
            color = "#ef4444" # red (Critical)
            severity = "CRITICAL"
        elif score >= 40:
            color = "#f59e0b" # orange (Warning)
            severity = "WARNING"
        else:
            color = "#3b82f6" # blue (Clean/Unknown)
            severity = "LOW"
            
        results.append({
            "id": ip,
            "ip": ip,
            "name": geo["city"] if geo["city"] != "Unknown" else ip,
            "city": geo["city"],
            "lat": geo["lat"],
            "lng": geo["lng"],
            "abuse_score": score,
            "severity": severity,
            "color": color
        })
        
    return results
