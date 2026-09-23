import React from 'react';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, YAxis,
  BarChart, Bar, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { STATS } from '../mock/mockData.js';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6,
        padding: '5px 10px',
        fontSize: 11,
        color: '#f8fafc',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
      }}
    >
      <span className="font-mono font-semibold" style={{ color: '#60a5fa' }}>
        {payload[0].value} rps
      </span>
    </div>
  );
};

const RightPanel = ({ currentRps, peakRps, trafficHistory, isAnomaly, backendStats }) => {
  const liveStats = backendStats ?? {};

  const chartData = trafficHistory.map((d, i) => ({
    i,
    rps: d.rps ?? d.current_rps ?? 0,
  }));

  const barData = [
    { label: 'On-way', value: 15700, color: '#2563eb' },
    { label: 'Blocked', value: 16400, color: '#16a34a' },
    { label: 'Waiting', value: 6200, color: '#f59e0b' },
  ];

  return (
    <div
      className="flex flex-col gap-4 py-4 px-3 animate-fade-up delay-200"
      style={{ width: 200, flexShrink: 0 }}
    >
      {/* Main Stats */}
      <div>
        <span
          className="text-xs font-semibold tracking-wide"
          style={{ color: '#f8fafc' }}
        >
          Main Statistics
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <StatRow
          label="Total Incidents"
          value={(liveStats.total_incidents ?? STATS.monthlyDelivered).toLocaleString()}
          trend="+live"
          up
        />
        <StatRow
          label="Critical Alerts"
          value={(liveStats.critical_incidents ?? STATS.yearlyDelivered).toLocaleString()}
          trend="real DB"
          up={false}
        />
        <StatRow
          label="Peak RPS"
          value={peakRps}
          trend={isAnomaly ? 'SPIKE' : 'normal'}
          up={!isAnomaly}
          accent={isAnomaly ? '#ff4d6d' : undefined}
        />
        <StatRow
          label="Uptime"
          value={liveStats.uptime_pct ?? STATS.uptime}
          accent="#00e5a0"
        />
      </div>

      <div className="divider" />

      {/* Mini sparkline chart */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="stat-label">RPS — Live</span>
          <span
            className="font-mono text-[10px]"
            style={{ color: isAnomaly ? '#ff4d6d' : '#00e5a0' }}
          >
            {currentRps} rps
          </span>
        </div>
        <div style={{ height: 52 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="rpsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isAnomaly ? '#ef4444' : '#3b82f6'} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={isAnomaly ? '#ef4444' : '#3b82f6'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="rps"
                stroke={isAnomaly ? '#ef4444' : '#3b82f6'}
                strokeWidth={1.5}
                fill="url(#rpsGrad)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="divider" />

      {/* Quantity bar chart */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="stat-label">Quantity</span>
        </div>
        <div style={{ height: 56 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barSize={12} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between mt-1">
          {barData.map(b => (
            <div key={b.label} className="flex items-center gap-1">
              <span className="status-dot" style={{ background: b.color, width: 5, height: 5 }} />
              <span style={{ fontSize: 9, color: '#94a3b8' }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <span className="stat-label">Total</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', fontFamily: 'JetBrains Mono' }}>
            {(15700 + 16400 + 6200).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="stat-label">Blocked</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', fontFamily: 'JetBrains Mono' }}>
            {(6200).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

const StatRow = ({ label, value, trend, up, accent }) => (
  <div>
    <span className="stat-label">{label}</span>
    <div className="flex items-center gap-2 mt-0.5">
      <span
        className="font-mono font-bold"
        style={{
          fontSize: 20,
          lineHeight: 1,
          color: accent ?? '#f8fafc',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </span>
      {trend && (
        <span
          style={{ fontSize: 10, color: up ? '#00e5a0' : '#ff4d6d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}
        >
          {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {trend}
        </span>
      )}
    </div>
  </div>
);

export default RightPanel;
