// Central Target Location: Bengaluru, India
export const TARGET_SERVER = {
  lat: 12.9716,
  lng: 77.5946,
  name: "SOC Core Node - Bengaluru",
  ip: "10.0.4.1"
};

// Global Threat Origin Nodes
export const ATTACK_ORIGIN_NODES = [
  { id: 'node_us_west', name: 'San Francisco, USA', lat: 37.7749, lng: -122.4194, ipPrefix: '198.51.100', color: '#ef4444' },
  { id: 'node_us_east', name: 'New York, USA', lat: 40.7128, lng: -74.0060, ipPrefix: '198.18.0', color: '#f97316' },
  { id: 'node_uk', name: 'London, UK', lat: 51.5074, lng: -0.1278, ipPrefix: '203.0.113', color: '#ef4444' },
  { id: 'node_de', name: 'Frankfurt, Germany', lat: 50.1109, lng: 8.6821, ipPrefix: '192.0.2', color: '#ec4899' },
  { id: 'node_jp', name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, ipPrefix: '198.51.101', color: '#f43f5e' },
  { id: 'node_sg', name: 'Singapore', lat: 1.3521, lng: 103.8198, ipPrefix: '192.88.99', color: '#f97316' },
  { id: 'node_br', name: 'São Paulo, Brazil', lat: -23.5505, lng: -46.6333, ipPrefix: '198.19.0', color: '#a855f7' },
  { id: 'node_au', name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093, ipPrefix: '203.0.114', color: '#e11d48' },
];

export const INITIAL_MOCK_INCIDENTS = [
  {
    id: "inc_948201",
    timestamp: "2026-09-14T06:38:10Z",
    peak_rps: 128,
    duration_seconds: 45,
    severity: "CRITICAL",
    ai_explanation: "A coordinated volumetric HTTP flood was detected targeting the /api/traffic ingress endpoint with anomalous burst rates reaching 128 RPS. Attack signatures matched distributed botnet nodes across North American and East Asian ASNs. Mitigating upstream rate limiting suppressed resource exhaustion before container eviction occurred."
  },
  {
    id: "inc_948194",
    timestamp: "2026-09-14T06:14:22Z",
    peak_rps: 94,
    duration_seconds: 32,
    severity: "WARNING",
    ai_explanation: "Sudden request velocity surge observed from multiple European proxy relays causing a 370% increase over the 20 RPS baseline. The behavioral analyzer identified rapid HTTP GET pipelining without payload variance. Telemetry indicates connection queue recovery within 32 seconds as source IPs rotated."
  },
  {
    id: "inc_948180",
    timestamp: "2026-09-14T05:42:05Z",
    peak_rps: 142,
    duration_seconds: 58,
    severity: "CRITICAL",
    ai_explanation: "Multi-vector SYN-like flood and layer-7 amplification spike peaked at 142 RPS across 8 distinct subnet clusters. High concurrent thread exhaustion was prevented by immediate Redis key rolling and alert triage. Automated incident report was logged and telemetry snapshots persisted to PostgreSQL."
  }
];

export const INITIAL_TRAFFIC_HISTORY = Array.from({ length: 30 }).map((_, index) => {
  const date = new Date(Date.now() - (29 - index) * 1000);
  return {
    timestamp: date.toISOString(),
    current_rps: Math.floor(12 + Math.random() * 8),
    status: "NORMAL",
    baseline_rps: 20,
    active_incident: false
  };
});
