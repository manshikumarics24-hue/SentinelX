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
/**
 * Returns the 20 most recent logged incidents from the database.
 * Shape: { id, timestamp, peak_rps, duration_seconds, severity, status,
 *          attacker_ips[], ai_explanation, resolved }
 */
export const getIncidents = () =>
  safe(async () => {
    const { data } = await api.get('/api/incidents');
    return data;
  }, []);

// ─── Stats (aggregate counters) ───────────────────────────────────────────────
/**
 * Returns aggregate statistics about the whole incident history.
 * Shape: { total_incidents, critical_incidents, peak_rps_ever,
 *          avg_incident_rps, current_rps, active_nodes, uptime_pct }
 */
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
  });

// ─── Live metrics (HTTP fallback when WS unavailable) ────────────────────────
/**
 * Returns the current-second Redis counters as an HTTP snapshot.
 * Shape: { current_rps, status, is_attack, attacker_ips[], ... }
 */
export const getLiveMetrics = () =>
  safe(async () => {
    const { data } = await api.get('/api/metrics/live');
    return data;
  }, null);

// ─── Resolve / acknowledge an incident ────────────────────────────────────────
/**
 * Marks an incident as resolved in PostgreSQL.
 */
export const resolveIncident = (id) =>
  safe(async () => {
    const { data } = await api.post(`/api/incidents/${id}/resolve`);
    return data;
  }, { success: false });

export default { getIncidents, getStats, getLiveMetrics, resolveIncident };
