# SentinelX — Today's Changes (Simple English Summary)

Here is everything we updated and fixed today across the project:

## 1. Switched from Fake Random Traffic to Real Public IP Replay
- **Removed** the old synthetic simulator (`backend/simulator/traffic_simulator.py`).
- **Added** `backend/simulator/real_data_replay.py`, which streams real public IPv4 addresses (global ISPs, residential ASNs, Tor relays, and known attack IPs) across 5 realistic traffic stages:
  1. Normal baseline traffic (~70 RPS)
  2. Single-source Layer-7 bot attack (~180 RPS)
  3. Distributed volumetric DDoS flood (~480 RPS)
  4. Benign flash crowd surge (~240 RPS)
  5. Multi-vector pulsing bursts (~380 RPS)
- **Updated** `start_sentinelx.bat` and `start_sentinelx.ps1` to launch `real_data_replay.py`.

## 2. Fixed the 2D Map Alignment & Ocean Arcs
- **Problem:** The old 2D world map SVG used a different map projection than the JavaScript coordinates, which placed Bengaluru near Myanmar and made traffic arcs start in oceans/seas.
- **Fix:**
  - Regenerated `public/world_map.svg` directly from Natural Earth vector country data (`ne_110m_admin_0_countries.geojson`) using exact latitude/longitude math.
  - Updated `src/components/Map2D.jsx` to draw the world map, grid lines, arcs, source city dots, and `SOC Core — Bengaluru` marker inside **one unified SVG (`1000x500`)** so everything aligns accurately on land.

## 3. Made Live Traffic, Geo-Locations & Dashboard Data Dynamic
- **Live IP Geolocation (`backend/app/ingestion/websocket_manager.py`, `backend/app/intelligence/threat_intel.py`):** Replaced random city picking with live lookup of the actual active IPs in Redis (via `ip-api.com` with RIR/ISP prefix fallback).
- **Dynamic Stats (`backend/app/intelligence/routes.py`):** `/api/stats` now returns live `active_nodes` from Redis instead of a fixed number (`8`).
- **Dynamic Frontend Charts (`src/App.jsx`, `src/views/DashboardView.jsx`, `src/views/TrafficView.jsx`, `src/components/BottomThreatBar.jsx`):**
  - Removed fake sine-wave seed data and hardcoded percentages (`78% / 15% / 7%`).
  - Dashboard 24-hour overview and status pie chart now calculate from real PostgreSQL incidents and live WebSocket data.
  - Made the `live` (30s), `1m` (60s), and `5m` (300s) buttons in **Traffic** actively switch the chart time window.
  - Bottom threat category bar (`OAS`, `ODS`, `MAV`, etc.) now starts at `0` and counts real incoming traffic events.
  - Cleaned up static mitigation placeholders in `src/components/IncidentDrawer.jsx` and fixed the blocked-IPs column/rule filter in `src/views/SecurityView.jsx`.

## 4. Improved the AI Threat Analysis Popup
- **Longer reading time (`src/components/AIPopupPanel.jsx`):** Fixed the bug where the popup vanished when a short burst ended. It now freezes the alert details and stays on screen for **15 full seconds after typing finishes**.
- **Simple English & Source Flags (`backend/app/intelligence/ai_explainer.py`, `src/components/AIPopupPanel.jsx`, `src/App.jsx`):** Rewrote AI messages in clear, simple English and added source country flag icons and location pins (`📍`).

## 5. True Black Dark Theme
- Updated `src/App.jsx`, `src/index.css`, `src/components/Globe3D.jsx`, `src/components/Map2D.jsx`, `src/components/CyberTopBar.jsx`, `src/components/GlobeControlsOverlay.jsx`, `src/components/BottomThreatBar.jsx`, `src/components/IncidentDrawer.jsx`, and the dashboard views from dark navy blue (`#000010` / `#020824`) to crisp pure black (`#000000`) with dark charcoal panels.
