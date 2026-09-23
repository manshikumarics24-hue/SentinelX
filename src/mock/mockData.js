// Central Target Location: Bengaluru, India (SOC Core)
export const TARGET_SERVER = {
  lat: 12.9716,
  lng: 77.5946,
  name: 'SOC Core — Bengaluru',
  ip: '10.0.4.1',
  region: 'ap-south-1',
};

// Global Threat Origin Nodes
export const ATTACK_ORIGIN_NODES = [
  { id: 'node_us_w',  name: 'San Francisco',  city: 'SFO', lat: 37.7749,   lng: -122.4194,  color: '#ff4d6d', severity: 'CRITICAL' },
  { id: 'node_us_e',  name: 'New York',        city: 'NYC', lat: 40.7128,   lng: -74.0060,   color: '#ffc947', severity: 'WARNING'  },
  { id: 'node_uk',    name: 'London',           city: 'LDN', lat: 51.5074,   lng: -0.1278,    color: '#ff4d6d', severity: 'CRITICAL' },
  { id: 'node_de',    name: 'Frankfurt',        city: 'FRA', lat: 50.1109,   lng: 8.6821,     color: '#c084fc', severity: 'WARNING'  },
  { id: 'node_jp',    name: 'Tokyo',            city: 'TYO', lat: 35.6762,   lng: 139.6503,   color: '#ff4d6d', severity: 'CRITICAL' },
  { id: 'node_sg',    name: 'Singapore',        city: 'SGP', lat: 1.3521,    lng: 103.8198,   color: '#ffc947', severity: 'WARNING'  },
  { id: 'node_br',    name: 'São Paulo',        city: 'GRU', lat: -23.5505,  lng: -46.6333,   color: '#a78bfa', severity: 'WARNING'  },
  { id: 'node_au',    name: 'Sydney',           city: 'SYD', lat: -33.8688,  lng: 151.2093,   color: '#ff4d6d', severity: 'CRITICAL' },
];

export const INITIAL_INCIDENTS = [
  {
    id: 'INC-948201',
    timestamp: '2026-09-14T06:38:10Z',
    source: 'SFO / NYC',
    peak_rps: 128,
    duration_s: 45,
    severity: 'CRITICAL',
    blocked: true,
    summary: 'Volumetric HTTP flood targeting /api/traffic — 128 RPS peak, botnet signature across NA & APAC ASNs. Rate limiting suppressed resource exhaustion.',
  },
  {
    id: 'INC-948194',
    timestamp: '2026-09-14T06:14:22Z',
    source: 'FRA / LDN',
    peak_rps: 94,
    duration_s: 32,
    severity: 'WARNING',
    blocked: false,
    summary: 'European proxy relay burst — 370% over baseline. HTTP GET pipelining without payload variance. Connection queue recovered in 32s as source IPs rotated.',
  },
  {
    id: 'INC-948180',
    timestamp: '2026-09-14T05:42:05Z',
    source: 'TYO / SGP',
    peak_rps: 142,
    duration_s: 58,
    severity: 'CRITICAL',
    blocked: true,
    summary: 'Multi-vector SYN-like flood + L7 amplification across 8 subnet clusters. Redis key rolling and alert triage prevented thread exhaustion.',
  },
  {
    id: 'INC-948156',
    timestamp: '2026-09-14T04:19:33Z',
    source: 'GRU',
    peak_rps: 67,
    duration_s: 21,
    severity: 'WARNING',
    blocked: true,
    summary: 'South American proxy cluster surge, 67 RPS. Geo-block triggered after 21s, traffic normalized within 3 minutes.',
  },
];

// Seed historical RPS data (last 30 data points)
export const INITIAL_TRAFFIC_HISTORY = Array.from({ length: 30 }).map((_, i) => ({
  t: Date.now() - (29 - i) * 2000,
  rps: Math.round(12 + Math.sin(i * 0.4) * 3 + Math.random() * 4),
  baseline: 20,
  status: 'NORMAL',
}));

export const STATS = {
  totalRequests: 1_021_483,
  blockedRequests: 4_603,
  activeNodes: 8,
  uptime: '99.97%',
  latency: '15.3ms',
  monthlyDelivered: 1021,
  yearlyDelivered: 4603,
};
