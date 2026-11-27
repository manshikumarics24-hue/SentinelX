# GeoLite2 Offline Database Directory

Place your free MaxMind database file here:
  `GeoLite2-City.mmdb`

### How to get it (100% Free):
1. Sign up for a free MaxMind account at: https://www.maxmind.com/en/geolite2/signup
2. Go to "Download Files" -> "GeoLite2 City" -> Download the GZIP archive.
3. Extract `GeoLite2-City.mmdb` into this `backend/data/` folder.

SentinelX will automatically detect this file and switch to 100% offline, zero-latency IP geolocation!
If the file is not present, SentinelX seamlessly falls back to its built-in authoritative RIR prefix table.
