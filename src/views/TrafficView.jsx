import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Protocol distribution estimated dynamically from live traffic status
const getProtocols = (history) => {
  const total = history.length || 1;
  const attackPoints = history.filter(d => d.status !== 'NORMAL' && d.status !== 'FLASH_SALE').length;
  const attackRatio = attackPoints / total;
  const https = Math.round(68 - attackRatio * 20);
  const http  = Math.round(12 + attackRatio * 15);
  const dns   = Math.round(8  + attackRatio * 10);
  const ssh   = 5;
  const other = Math.max(100 - https - http - dns - ssh, 2);
  return [
    { name: 'HTTPS', value: https, color: '#2563eb' },
    { name: 'HTTP',  value: http,  color: '#60a5fa' },
    { name: 'DNS',   value: dns,   color: '#16a34a' },
    { name: 'SSH',   value: ssh,   color: '#f59e0b' },
    { name: 'Other', value: other, color: '#94a3b8' },
  ];
};

// Real backend API routes powered by FastAPI
const topEndpoints = [
  { path: '/ws/traffic',       method: 'WS',   desc: 'Live WebSocket stream',  status: 'live' },
  { path: '/api/traffic',      method: 'POST', desc: 'Request ingestion',      status: 'live' },
  { path: '/api/incidents',    method: 'GET',  desc: 'Incident log (DB)',      status: 'live' },
  { path: '/api/stats',        method: 'GET',  desc: 'Aggregate statistics',   status: 'live' },
  { path: '/api/metrics/live', method: 'GET',  desc: 'Live Redis snapshot',    status: 'live' },
];

const statusColor = { live: '#16a34a', warning: '#f59e0b', degraded: '#ef4444' };

const WINDOW_LIMITS = { live: 30, '1m': 60, '5m': 300 };

const TrafficView = ({ trafficHistory = [], currentRps = 0 }) => {
  const [timeRange, setTimeRange] = useState('1m');

  const windowedHistory = useMemo(() => {
    const limit = WINDOW_LIMITS[timeRange] ?? 60;
    return trafficHistory.slice(-limit);
  }, [trafficHistory, timeRange]);

  const protocols = useMemo(() => getProtocols(windowedHistory), [windowedHistory]);

  const chartData = windowedHistory.map(d => ({
    time: new Date(d.t).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
    rps:      d.rps ?? 0,
    baseline: d.baseline ?? 70,
    isAttack: d.status !== 'NORMAL' && d.status !== 'FLASH_SALE',
  }));

  const maxRps = Math.max(...chartData.map(d => d.rps), 0);
  const avgRps = chartData.length
    ? Math.round(chartData.reduce((s, d) => s + d.rps, 0) / chartData.length)
    : 0;
  const currentBaseline = chartData[chartData.length - 1]?.baseline ?? 70;

  const bandwidthStats = [
    { label: 'Current RPS',        value: currentRps,      change: '+live',            up: true },
    { label: `Avg RPS (${timeRange})`, value: avgRps,      change: `${chartData.length}s window`, up: null },
    { label: 'Peak RPS (window)',  value: maxRps,          change: 'window high',      up: null },
    { label: 'Baseline',           value: currentBaseline, change: 'normal threshold', up: null },
  ];

  const cardStyle = {
    background: 'rgba(10, 12, 16, 0.88)',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-up" style={{ background: 'transparent' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>Network Traffic</h2>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            Live WebSocket stream — {chartData.length} data points ({timeRange} window)
          </p>
        </div>
        <div
          className="flex items-center gap-1 rounded-lg p-0.5"
          style={cardStyle}
        >
          {['live', '1m', '5m'].map(t => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: timeRange === t ? '#2563eb' : 'transparent',
                color: timeRange === t ? '#fff' : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {bandwidthStats.map(s => (
          <div key={s.label} className="rounded-xl p-4" style={cardStyle}>
            <span
              style={{
                fontSize: 10,
                color: '#94a3b8',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {s.label}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#f8fafc',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {s.value}
              </span>
              {s.up !== null ? (
                <span
                  style={{
                    fontSize: 10,
                    color: s.up ? '#16a34a' : '#ef4444',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {s.change}
                </span>
              ) : (
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{s.change}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Live RPS area chart */}
      <div className="rounded-xl p-4 mb-6" style={cardStyle}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>
          Live RPS Stream (WebSocket)
        </h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rpsGradTV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                domain={[0, Math.max(maxRps + 20, 80)]}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10,12,16,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(val, name) => [`${val} RPS`, name === 'rps' ? 'Traffic' : 'Baseline']}
              />
              <Area
                type="monotone"
                dataKey="baseline"
                name="Baseline"
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="transparent"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="rps"
                name="RPS"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#rpsGradTV)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Protocol breakdown */}
        <div className="rounded-xl p-4" style={cardStyle}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>
            Protocol Distribution (Estimated)
          </h3>
          <div className="flex flex-col gap-3">
            {protocols.map(p => (
              <div key={p.name}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: '#f8fafc', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                    {p.value}%
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${p.value}%`,
                      borderRadius: 3,
                      background: p.color,
                      transition: 'width 0.5s',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backend endpoints status */}
        <div className="rounded-xl p-4" style={cardStyle}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>
            Backend Endpoints
          </h3>
          <div className="flex flex-col gap-2">
            {topEndpoints.map((e, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background:
                      e.method === 'GET'  ? 'rgba(37,99,235,0.12)'  :
                      e.method === 'POST' ? 'rgba(245,158,11,0.12)' :
                                            'rgba(22,163,74,0.12)',
                    color:
                      e.method === 'GET'  ? '#60a5fa' :
                      e.method === 'POST' ? '#fbbf24' :
                                            '#34d399',
                  }}
                >
                  {e.method}
                </span>
                <span style={{ fontSize: 11, color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', flex: 1 }}>
                  {e.path}
                </span>
                <span style={{ fontSize: 10, color: statusColor[e.status] ?? '#94a3b8', fontWeight: 600 }}>
                  ● {e.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficView;
