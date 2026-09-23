import React, { useState } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Shield, Globe,
  Activity, AlertTriangle, CheckCircle, Clock,
} from 'lucide-react';

/**
 * DashboardView
 * Receives `backendStats` (from /api/stats) and `incidents` (from /api/incidents).
 * Falls back to placeholder values when backend is offline / empty.
 */

// ─── Traffic‑by‑hour chart is still synthetic (we don't store per-hour counts) ─
const trafficByHour = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h.toString().padStart(2, '0')}:00`,
  requests: Math.round(800 + Math.sin(h / 3) * 400 + Math.random() * 200),
  blocked:  Math.round(20 + Math.random() * 30),
}));

const statusBreakdown = [
  { name: 'Normal',   value: 78, fill: '#2563eb' },
  { name: 'Warning',  value: 15, fill: '#f59e0b' },
  { name: 'Critical', value: 7,  fill: '#ef4444' },
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.6)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <p style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// ─── Recent activity derived from real incidents ──────────────────────────────
const typeForSeverity = (sev) =>
  sev === 'CRITICAL' ? 'critical' : sev === 'WARNING' ? 'warning' : 'info';

const DashboardView = ({ backendStats, incidents = [] }) => {
  // Build summary cards from real stats (fallback to zeros when offline)
  const stats = backendStats ?? {};

  const summaryCards = [
    {
      label: 'Total Incidents',
      value: (stats.total_incidents ?? 0).toLocaleString(),
      trend: stats.total_incidents > 0 ? 'live' : '—',
      up: false,
      icon: Activity,
      color: '#2563eb',
    },
    {
      label: 'Critical Alerts',
      value: (stats.critical_incidents ?? 0).toLocaleString(),
      trend: stats.critical_incidents > 0 ? 'attack' : '—',
      up: false,
      icon: Shield,
      color: '#ef4444',
    },
    {
      label: 'Active Nodes',
      value: String(stats.active_nodes ?? 8),
      trend: 'stable',
      up: true,
      icon: Globe,
      color: '#16a34a',
    },
    {
      label: 'Peak RPS (ever)',
      value: String(stats.peak_rps_ever ?? 0),
      trend: `avg ${stats.avg_incident_rps ?? 0} RPS`,
      up: null,
      icon: Clock,
      color: '#f59e0b',
    },
  ];

  // Build recent activity from real incident list
  const recentActivity = incidents.slice(0, 6).map(inc => ({
    time: new Date(inc.timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    }),
    event:
      inc.ai_explanation
        ? inc.ai_explanation.substring(0, 80) + '…'
        : `${inc.severity} incident — ${inc.peak_rps} RPS peak`,
    type: typeForSeverity(inc.severity),
  }));

  // Top sources from incidents' attacker IPs
  const ipFreq = {};
  incidents.forEach(inc => {
    (inc.attacker_ips ?? []).forEach(ip => {
      ipFreq[ip] = (ipFreq[ip] ?? 0) + 1;
    });
  });
  const topSources = Object.entries(ipFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([ip, count]) => ({
      ip,
      incidents: count,
    }));

  return (
    <div
      className="flex-1 overflow-y-auto p-6 animate-fade-up"
      style={{ background: 'transparent' }}
    >
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {summaryCards.map(c => (
          <div
            key={c.label}
            className="rounded-xl p-4"
            style={{
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {c.label}
              </span>
              <c.icon size={16} color={c.color} />
            </div>
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#f8fafc',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {c.value}
              </span>
              {c.up !== null && (
                <span
                  style={{
                    fontSize: 11,
                    color: c.up ? '#16a34a' : '#ef4444',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  {c.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {c.trend}
                </span>
              )}
              {c.up === null && (
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{c.trend}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Traffic overview chart (synthetic — we don't store per-hour counts yet) */}
        <div
          className="col-span-2 rounded-xl p-4"
          style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <h3
            style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}
          >
            Traffic Overview (24 h — indicative)
          </h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficByHour}>
                <defs>
                  <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="requests"
                  name="Requests"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#dashGrad)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  name="Blocked"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  fill="transparent"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Node Status pie */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <h3
            style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}
          >
            Incident Status Breakdown
          </h3>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  paddingAngle={3}
                >
                  {statusBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            {statusBreakdown.map(s => (
              <div key={s.name} className="flex items-center gap-2">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: s.fill,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 11, color: '#cbd5e1' }}>{s.name}</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#f8fafc',
                  }}
                >
                  {s.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top Attacker IPs (from real incidents) */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <h3
            style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}
          >
            Top Attacker IPs (from incidents)
          </h3>
          {topSources.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
              No attacker IPs logged yet.
            </p>
          ) : (
            <table style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '6px 0',
                      color: '#94a3b8',
                      fontWeight: 600,
                      fontSize: 10,
                      textTransform: 'uppercase',
                    }}
                  >
                    IP Address
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '6px 0',
                      color: '#94a3b8',
                      fontWeight: 600,
                      fontSize: 10,
                      textTransform: 'uppercase',
                    }}
                  >
                    Incidents
                  </th>
                </tr>
              </thead>
              <tbody>
                {topSources.map(s => (
                  <tr key={s.ip} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td
                      style={{
                        padding: '6px 0',
                        color: '#ef4444',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 500,
                      }}
                    >
                      {s.ip}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '6px 0',
                        color: '#f8fafc',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 600,
                      }}
                    >
                      {s.incidents}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Activity (from real incidents) */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <h3
            style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}
          >
            Recent Activity (Live DB)
          </h3>
          {recentActivity.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
              No incidents yet — run the traffic simulator.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentActivity.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-1.5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      marginTop: 5,
                      flexShrink: 0,
                      background:
                        a.type === 'critical'
                          ? '#ef4444'
                          : a.type === 'warning'
                          ? '#f59e0b'
                          : '#2563eb',
                    }}
                  />
                  <div>
                    <p style={{ fontSize: 12, color: '#e2e8f0' }}>{a.event}</p>
                    <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                      {a.time} IST
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
