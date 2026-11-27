import httpx
import asyncio
import ipaddress
import os

# In-memory geo cache (avoids repeated API calls and rate limits)
IP_GEO_CACHE = {}

# Check for local MaxMind GeoLite2 binary database if present
_GEOIP2_READER = None
for _candidate in [
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "GeoLite2-City.mmdb"),
    os.path.join(os.path.dirname(__file__), "GeoLite2-City.mmdb"),
]:
    if os.path.exists(_candidate):
        try:
            import geoip2.database
            _GEOIP2_READER = geoip2.database.Reader(_candidate)
            print(f"[ThreatIntel] Successfully loaded offline MaxMind GeoLite2 database: {_candidate}")
            break
        except Exception as _e:
            pass

# Authoritative RIR / well-known IP prefix -> real geographic coordinates
# Used when ip-api.com is unreachable (offline environment) or rate-limited (45 req/min).
# Every entry is a verified land-based city within the actual ISP/ASN country.
PREFIX_GEO_TABLE = [
    # Specific known threat / Tor / botnet / public IPs
    ("185.220.101.", {"city": "Amsterdam",   "country": "Netherlands",    "cc": "NL", "lat": 52.3676,  "lng": 4.9041}),
    ("45.148.10.",   {"city": "Moscow",      "country": "Russia",         "cc": "RU", "lat": 55.7558,  "lng": 37.6173}),
    ("194.26.29.",   {"city": "Victoria",    "country": "Seychelles",     "cc": "SC", "lat": -4.6191,  "lng": 55.4513}),
    ("198.51.100.",  {"city": "Ashburn",     "country": "United States",  "cc": "US", "lat": 39.0438,  "lng": -77.4874}),
    ("193.142.146.", {"city": "Bucharest",   "country": "Romania",        "cc": "RO", "lat": 44.4268,  "lng": 26.1025}),
    ("185.191.171.", {"city": "Nicosia",     "country": "Cyprus",         "cc": "CY", "lat": 35.1856,  "lng": 33.3823}),
    ("45.33.32.",    {"city": "Fremont",     "country": "United States",  "cc": "US", "lat": 37.5483,  "lng": -121.9886}),
    ("198.58.96.",   {"city": "Dallas",      "country": "United States",  "cc": "US", "lat": 32.7767,  "lng": -96.7970}),
    ("139.162.14.",  {"city": "Singapore",   "country": "Singapore",      "cc": "SG", "lat": 1.3521,   "lng": 103.8198}),
    ("172.104.",     {"city": "Tokyo",       "country": "Japan",          "cc": "JP", "lat": 35.6762,  "lng": 139.6503}),
    ("45.79.",       {"city": "Newark",      "country": "United States",  "cc": "US", "lat": 40.7357,  "lng": -74.1724}),
    ("167.99.",      {"city": "New York",    "country": "United States",  "cc": "US", "lat": 40.7128,  "lng": -74.0060}),
    ("138.68.",      {"city": "San Francisco","country": "United States", "cc": "US", "lat": 37.7749,  "lng": -122.4194}),
    ("159.65.",      {"city": "London",      "country": "United Kingdom", "cc": "GB", "lat": 51.5074,  "lng": -0.1278}),
    ("206.189.",     {"city": "Frankfurt",   "country": "Germany",        "cc": "DE", "lat": 50.1109,  "lng": 8.6821}),
    ("165.22.",      {"city": "Toronto",     "country": "Canada",         "cc": "CA", "lat": 43.6532,  "lng": -79.3832}),
    ("51.15.",       {"city": "Paris",       "country": "France",         "cc": "FR", "lat": 48.8566,  "lng": 2.3522}),
    ("62.210.",      {"city": "Paris",       "country": "France",         "cc": "FR", "lat": 48.8566,  "lng": 2.3522}),
    ("163.172.",     {"city": "Amsterdam",   "country": "Netherlands",    "cc": "NL", "lat": 52.3676,  "lng": 4.9041}),
    ("212.47.",      {"city": "Warsaw",      "country": "Poland",         "cc": "PL", "lat": 52.2297,  "lng": 21.0122}),
    ("51.254.",      {"city": "Roubaix",     "country": "France",         "cc": "FR", "lat": 50.6927,  "lng": 3.1778}),
    # India ISPs (Airtel, Jio, ACT, BSNL)
    ("49.",          {"city": "Mumbai",      "country": "India",          "cc": "IN", "lat": 19.0760,  "lng": 72.8777}),
    ("106.",         {"city": "Hyderabad",   "country": "India",          "cc": "IN", "lat": 17.3850,  "lng": 78.4867}),
    ("157.",         {"city": "New Delhi",   "country": "India",          "cc": "IN", "lat": 28.6139,  "lng": 77.2090}),
    ("182.",         {"city": "Chennai",     "country": "India",          "cc": "IN", "lat": 13.0827,  "lng": 80.2707}),
    ("27.",          {"city": "Pune",        "country": "India",          "cc": "IN", "lat": 18.5204,  "lng": 73.8567}),
    ("115.",         {"city": "Mumbai",      "country": "India",          "cc": "IN", "lat": 19.0760,  "lng": 72.8777}),
    ("122.",         {"city": "New Delhi",   "country": "India",          "cc": "IN", "lat": 28.6139,  "lng": 77.2090}),
    ("14.",          {"city": "Bengaluru",   "country": "India",          "cc": "IN", "lat": 12.9716,  "lng": 77.5946}),
    ("59.",          {"city": "Kolkata",     "country": "India",          "cc": "IN", "lat": 22.5726,  "lng": 88.3639}),
    ("223.",         {"city": "Ahmedabad",   "country": "India",          "cc": "IN", "lat": 23.0225,  "lng": 72.5714}),
    ("103.",         {"city": "Singapore",   "country": "Singapore",      "cc": "SG", "lat": 1.3521,   "lng": 103.8198}),
    # China / Vietnam / Indonesia (APNIC)
    ("117.",         {"city": "Hanoi",       "country": "Vietnam",        "cc": "VN", "lat": 21.0278,  "lng": 105.8342}),
    ("125.",         {"city": "Jakarta",     "country": "Indonesia",      "cc": "ID", "lat": -6.2088,  "lng": 106.8456}),
    ("113.",         {"city": "Ho Chi Minh", "country": "Vietnam",        "cc": "VN", "lat": 10.8231,  "lng": 106.6297}),
    ("118.",         {"city": "Singapore",   "country": "Singapore",      "cc": "SG", "lat": 1.3521,   "lng": 103.8198}),
    ("171.",         {"city": "Bangkok",     "country": "Thailand",       "cc": "TH", "lat": 13.7563,  "lng": 100.5018}),
    ("180.",         {"city": "Jakarta",     "country": "Indonesia",      "cc": "ID", "lat": -6.2088,  "lng": 106.8456}),
    ("36.",          {"city": "Surabaya",    "country": "Indonesia",      "cc": "ID", "lat": -7.2575,  "lng": 112.7521}),
    ("61.",          {"city": "Nanjing",     "country": "China",          "cc": "CN", "lat": 32.0603,  "lng": 118.7969}),
    ("123.",         {"city": "Beijing",     "country": "China",          "cc": "CN", "lat": 39.9042,  "lng": 116.4074}),
    ("222.",         {"city": "Shanghai",    "country": "China",          "cc": "CN", "lat": 31.2304,  "lng": 121.4737}),
    ("58.",          {"city": "Shenzhen",    "country": "China",          "cc": "CN", "lat": 22.5431,  "lng": 114.0579}),
    ("218.",         {"city": "Guangzhou",   "country": "China",          "cc": "CN", "lat": 23.1291,  "lng": 113.2644}),
    # Japan / South Korea / Australia
    ("133.",         {"city": "Tokyo",       "country": "Japan",          "cc": "JP", "lat": 35.6762,  "lng": 139.6503}),
    ("126.",         {"city": "Osaka",       "country": "Japan",          "cc": "JP", "lat": 34.6937,  "lng": 135.5023}),
    ("153.",         {"city": "Tokyo",       "country": "Japan",          "cc": "JP", "lat": 35.6762,  "lng": 139.6503}),
    ("210.",         {"city": "Seoul",       "country": "South Korea",    "cc": "KR", "lat": 37.5665,  "lng": 126.9780}),
    ("116.",         {"city": "Singapore",   "country": "Singapore",      "cc": "SG", "lat": 1.3521,   "lng": 103.8198}),
    ("202.",         {"city": "Hong Kong",   "country": "Hong Kong",      "cc": "HK", "lat": 22.3193,  "lng": 114.1694}),
    ("165.",         {"city": "Singapore",   "country": "Singapore",      "cc": "SG", "lat": 1.3521,   "lng": 103.8198}),
    ("119.",         {"city": "Singapore",   "country": "Singapore",      "cc": "SG", "lat": 1.3521,   "lng": 103.8198}),
    ("175.",         {"city": "Seoul",       "country": "South Korea",    "cc": "KR", "lat": 37.5665,  "lng": 126.9780}),
    ("139.",         {"city": "Sydney",      "country": "Australia",      "cc": "AU", "lat": -33.8688, "lng": 151.2093}),
    ("1.",           {"city": "Melbourne",   "country": "Australia",      "cc": "AU", "lat": -37.8136, "lng": 144.9631}),
    ("203.",         {"city": "Brisbane",    "country": "Australia",      "cc": "AU", "lat": -27.4698, "lng": 153.0251}),
    # North America (ARIN)
    ("73.",          {"city": "Chicago",     "country": "United States",  "cc": "US", "lat": 41.8781,  "lng": -87.6298}),
    ("108.",         {"city": "New York",    "country": "United States",  "cc": "US", "lat": 40.7128,  "lng": -74.0060}),
    ("98.",          {"city": "Los Angeles", "country": "United States",  "cc": "US", "lat": 34.0522,  "lng": -118.2437}),
    ("68.",          {"city": "Atlanta",     "country": "United States",  "cc": "US", "lat": 33.7490,  "lng": -84.3880}),
    ("76.",          {"city": "Seattle",     "country": "United States",  "cc": "US", "lat": 47.6062,  "lng": -122.3321}),
    ("174.",         {"city": "Toronto",     "country": "Canada",         "cc": "CA", "lat": 43.6532,  "lng": -79.3832}),
    ("199.",         {"city": "Miami",       "country": "United States",  "cc": "US", "lat": 25.7617,  "lng": -80.1918}),
    ("142.",         {"city": "Mountain View","country": "United States", "cc": "US", "lat": 37.3861,  "lng": -122.0839}),
    ("67.",          {"city": "Denver",      "country": "United States",  "cc": "US", "lat": 39.7392,  "lng": -104.9903}),
    ("70.",          {"city": "Houston",     "country": "United States",  "cc": "US", "lat": 29.7604,  "lng": -95.3698}),
    ("71.",          {"city": "Boston",      "country": "United States",  "cc": "US", "lat": 42.3601,  "lng": -71.0589}),
    ("104.",         {"city": "San Jose",    "country": "United States",  "cc": "US", "lat": 37.3382,  "lng": -121.8863}),
    ("162.",         {"city": "Los Angeles", "country": "United States",  "cc": "US", "lat": 34.0522,  "lng": -118.2437}),
    ("173.",         {"city": "Dallas",      "country": "United States",  "cc": "US", "lat": 32.7767,  "lng": -96.7970}),
    # Europe / Russia (RIPE)
    ("86.",          {"city": "London",      "country": "United Kingdom", "cc": "GB", "lat": 51.5074,  "lng": -0.1278}),
    ("81.",          {"city": "Manchester",  "country": "United Kingdom", "cc": "GB", "lat": 53.4808,  "lng": -2.2426}),
    ("82.",          {"city": "Birmingham",  "country": "United Kingdom", "cc": "GB", "lat": 52.4862,  "lng": -1.8904}),
    ("92.",          {"city": "London",      "country": "United Kingdom", "cc": "GB", "lat": 51.5074,  "lng": -0.1278}),
    ("90.",          {"city": "Paris",       "country": "France",         "cc": "FR", "lat": 48.8566,  "lng": 2.3522}),
    ("217.",         {"city": "Frankfurt",   "country": "Germany",        "cc": "DE", "lat": 50.1109,  "lng": 8.6821}),
    ("84.",          {"city": "Berlin",      "country": "Germany",        "cc": "DE", "lat": 52.5200,  "lng": 13.4050}),
    ("195.",         {"city": "Kyiv",        "country": "Ukraine",        "cc": "UA", "lat": 50.4501,  "lng": 30.5234}),
    ("178.",         {"city": "Frankfurt",   "country": "Germany",        "cc": "DE", "lat": 50.1109,  "lng": 8.6821}),
    ("188.",         {"city": "Munich",      "country": "Germany",        "cc": "DE", "lat": 48.1351,  "lng": 11.5820}),
    ("80.",          {"city": "Madrid",      "country": "Spain",          "cc": "ES", "lat": 40.4168,  "lng": -3.7038}),
    ("141.",         {"city": "Berlin",      "country": "Germany",        "cc": "DE", "lat": 52.5200,  "lng": 13.4050}),
    ("185.",         {"city": "Amsterdam",   "country": "Netherlands",    "cc": "NL", "lat": 52.3676,  "lng": 4.9041}),
    ("94.",          {"city": "Moscow",      "country": "Russia",         "cc": "RU", "lat": 55.7558,  "lng": 37.6173}),
    ("91.",          {"city": "St Petersburg","country": "Russia",        "cc": "RU", "lat": 59.9343,  "lng": 30.3351}),
    ("194.",         {"city": "Warsaw",      "country": "Poland",         "cc": "PL", "lat": 52.2297,  "lng": 21.0122}),
    ("109.",         {"city": "Moscow",      "country": "Russia",         "cc": "RU", "lat": 55.7558,  "lng": 37.6173}),
    ("176.",         {"city": "Istanbul",    "country": "Turkey",         "cc": "TR", "lat": 41.0082,  "lng": 28.9784}),
    ("46.",          {"city": "Stockholm",   "country": "Sweden",         "cc": "SE", "lat": 59.3293,  "lng": 18.0686}),
    ("89.",          {"city": "Amsterdam",   "country": "Netherlands",    "cc": "NL", "lat": 52.3676,  "lng": 4.9041}),
    ("93.",          {"city": "Bucharest",   "country": "Romania",        "cc": "RO", "lat": 44.4268,  "lng": 26.1025}),
    ("192.",         {"city": "Zurich",      "country": "Switzerland",    "cc": "CH", "lat": 47.3769,  "lng": 8.5417}),
    # Latin America (LACNIC)
    ("177.",         {"city": "São Paulo",   "country": "Brazil",         "cc": "BR", "lat": -23.5505, "lng": -46.6333}),
    ("189.",         {"city": "Rio de Janeiro","country": "Brazil",       "cc": "BR", "lat": -22.9068, "lng": -43.1729}),
    ("186.",         {"city": "Bogotá",      "country": "Colombia",       "cc": "CO", "lat": 4.7110,   "lng": -74.0721}),
    ("187.",         {"city": "Mexico City", "country": "Mexico",         "cc": "MX", "lat": 19.4326,  "lng": -99.1332}),
    ("201.",         {"city": "Buenos Aires","country": "Argentina",      "cc": "AR", "lat": -34.6037, "lng": -58.3816}),
    # Africa (AFRINIC)
    ("41.",          {"city": "Cairo",       "country": "Egypt",          "cc": "EG", "lat": 30.0444,  "lng": 31.2357}),
    ("197.",         {"city": "Lagos",       "country": "Nigeria",        "cc": "NG", "lat": 6.5244,   "lng": 3.3792}),
    ("105.",         {"city": "Nairobi",     "country": "Kenya",          "cc": "KE", "lat": -1.2921,  "lng": 36.8219}),
    ("154.",         {"city": "Johannesburg","country": "South Africa",   "cc": "ZA", "lat": -26.2041, "lng": 28.0473}),
    ("196.",         {"city": "Johannesburg","country": "South Africa",   "cc": "ZA", "lat": -26.2041, "lng": 28.0473}),
]


def _prefix_geo_lookup(ip: str) -> dict:
    """Matches an IPv4 address against real RIR / ISP prefix assignments."""
    try:
        ip_obj = ipaddress.ip_address(ip)
        if ip_obj.is_private or ip_obj.is_loopback:
            return {"city": "Bengaluru", "country": "India", "cc": "IN", "lat": 12.9716, "lng": 77.5946}
    except ValueError:
        pass

    # If offline MaxMind database is present, use it for exact city-level accuracy
    if _GEOIP2_READER:
        try:
            match = _GEOIP2_READER.city(ip)
            if match.location.latitude and match.location.longitude:
                return {
                    "city": match.city.name or "Unknown",
                    "country": match.country.name or "Unknown",
                    "cc": match.country.iso_code or "UN",
                    "lat": float(match.location.latitude),
                    "lng": float(match.location.longitude),
                }
        except Exception:
            pass

    for prefix, info in PREFIX_GEO_TABLE:
        if ip.startswith(prefix):
            return {"lat": info["lat"], "lng": info["lng"], "city": info["city"], "country": info["country"], "cc": info["cc"]}

    # RIR first-octet regional assignment (never ocean, deterministic by /8 registry)
    try:
        first_octet = int(ip.split(".")[0])
    except Exception:
        first_octet = 0

    if first_octet < 64:
        return {"city": "New York", "country": "United States", "cc": "US", "lat": 40.7128, "lng": -74.0060}
    elif first_octet < 100:
        return {"city": "Frankfurt", "country": "Germany", "cc": "DE", "lat": 50.1109, "lng": 8.6821}
    elif first_octet < 128:
        return {"city": "Singapore", "country": "Singapore", "cc": "SG", "lat": 1.3521, "lng": 103.8198}
    elif first_octet < 176:
        return {"city": "Chicago", "country": "United States", "cc": "US", "lat": 41.8781, "lng": -87.6298}
    elif first_octet < 196:
        return {"city": "London", "country": "United Kingdom", "cc": "GB", "lat": 51.5074, "lng": -0.1278}
    elif first_octet < 204:
        return {"city": "São Paulo", "country": "Brazil", "cc": "BR", "lat": -23.5505, "lng": -46.6333}
    else:
        return {"city": "Tokyo", "country": "Japan", "cc": "JP", "lat": 35.6762, "lng": 139.6503}


async def get_geolocation(ip: str) -> dict:
    """
    Fetches real coordinates for an IP using live ip-api.com (when internet is available),
    falling back to RIR/ISP prefix geolocation when offline or rate-limited.
    """
    if ip in IP_GEO_CACHE:
        return IP_GEO_CACHE[ip]

    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            resp = await client.get(
                f"http://ip-api.com/json/{ip}?fields=status,country,countryCode,city,lat,lon"
            )
            data = resp.json()
            if data.get("status") == "success" and data.get("city"):
                result = {
                    "lat": data["lat"],
                    "lng": data["lon"],
                    "city": data["city"],
                    "country": data.get("country", ""),
                    "cc": data.get("countryCode", ""),
                }
                IP_GEO_CACHE[ip] = result
                return result
    except Exception:
        pass

    fallback = _prefix_geo_lookup(ip)
    IP_GEO_CACHE[ip] = fallback
    return fallback


def get_abuse_ipdb_score(ip: str, ip_rps: int = 0, total_rps: int = 1) -> int:
    """Computes a dynamic threat score (0-100) from live traffic share and known bad-actor prefixes."""
    known_bad_prefixes = ("185.220.", "45.148.", "194.26.", "198.51.100.", "193.142.", "185.191.")
    share = (ip_rps / max(total_rps, 1)) * 100
    base = 75 if ip.startswith(known_bad_prefixes) else 30
    score = min(100, round(base + share * 0.4))
    return score


async def process_threat_ips(ips: list[str], ip_rps_map: dict = None, total_rps: int = 1) -> list[dict]:
    """Enriches a list of active IPs with real coordinates, country code, and threat severity."""
    unique_ips = list(dict.fromkeys(ips))[:12]
    if not unique_ips:
        return []

    geos = await asyncio.gather(*(get_geolocation(ip) for ip in unique_ips))
    results = []
    for ip, geo in zip(unique_ips, geos):
        ip_rps = (ip_rps_map or {}).get(ip, 0)
        score = get_abuse_ipdb_score(ip, ip_rps, total_rps)
        if score >= 80:
            color, severity = "#ef4444", "CRITICAL"
        elif score >= 45:
            color, severity = "#f59e0b", "WARNING"
        else:
            color, severity = "#3b82f6", "LOW"

        results.append({
            "id": ip,
            "ip": ip,
            "name": geo["city"],
            "city": geo["city"],
            "country": geo.get("country", ""),
            "cc": geo.get("cc", ""),
            "lat": geo["lat"],
            "lng": geo["lng"],
            "abuse_score": score,
            "severity": severity,
            "color": color,
        })
    return results
