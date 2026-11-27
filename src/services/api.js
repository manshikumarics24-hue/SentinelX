import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Helper: fall back to `fallback` value on any network error ──────────────
const safe = async (fn, fallback) => {
  try {
    return await fn();
  } catch (err) {
    console.warn('[API] Falling back to mock data —', err.message);
    return fallback;
  }
};

// ─── Incidents (from PostgreSQL via FastAPI) ──────────────────────────────────
export const getIncidents = () =>
  safe(async () => {
    const { data } = await api.get('/api/incidents');
    return data;
  }, []);

// ─── Stats (aggregate counters) ───────────────────────────────────────────────
export const getStats = () =>
  safe(async () => {
    const { data } = await api.get('/api/stats');
    return data;
  }, {
    total_incidents: 0,
    critical_incidents: 0,
    peak_rps_ever: 0,
    avg_incident_rps: 0,
    current_rps: 0,
    active_nodes: 8,
    uptime_pct: '99.97%',
    blocked_ips_count: 0,
  });

// ─── Live metrics (HTTP fallback when WS unavailable) ────────────────────────
export const getLiveMetrics = () =>
  safe(async () => {
    const { data } = await api.get('/api/metrics/live');
    return data;
  }, null);

// ─── Resolve / acknowledge an incident ────────────────────────────────────────
export const resolveIncident = (id) =>
  safe(async () => {
    const { data } = await api.post(`/api/incidents/${id}/resolve`);
    return data;
  }, { success: false });

// ─── Active Mitigation (Redis Quarantine) ─────────────────────────────────────
export const getBlockedIps = () =>
  safe(async () => {
    const { data } = await api.get('/api/mitigate/blocked');
    return data;
  }, []);

export const blockIp = (ip, duration = 300, reason = 'Manual SOC Quarantine') =>
  safe(async () => {
    const { data } = await api.post('/api/mitigate/block', { ip, duration, reason });
    return data;
  }, { success: false });

export const unblockIp = (ip) =>
  safe(async () => {
    const { data } = await api.post('/api/mitigate/unblock', { ip });
    return data;
  }, { success: false });

export default {
  getIncidents,
  getStats,
  getLiveMetrics,
  resolveIncident,
  getBlockedIps,
  blockIp,
  unblockIp,
};
