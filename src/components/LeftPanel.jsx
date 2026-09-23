import React from 'react';
import { TrendingUp, TrendingDown, Zap, Shield, Activity } from 'lucide-react';
import { ATTACK_ORIGIN_NODES, STATS } from '../mock/mockData.js';

const LeftPanel = ({ currentRps, peakRps, status, isAnomaly }) => {
  const activeThreats = isAnomaly ? ATTACK_ORIGIN_NODES.filter(n => n.severity === 'CRITICAL').length : 0;

  return (
    <div
      className="flex flex-col gap-4 py-4 px-3 animate-fade-up"
      style={{ width: 200, flexShrink: 0 }}
    >
      {/* AI Tag */}
      <div>
        <span
          className="text-[9px] font-semibold tracking-widest uppercase"
          style={{ color: 'rgba(77,166,255,0.5)' }}
        >
          AI-Powered
        </span>
        <h2
          className="mt-1 font-bold leading-tight"
          style={{ fontSize: 19, color: '#e2eaf4', lineHeight: '1.2' }}
        >
          {isAnomaly
            ? <>Attack<br/>Detected</>
            : <>Plan Your<br/>Route with AI</>
          }
        </h2>
        {!isAnomaly && (
          <span style={{ fontSize: 14, color: '#ffc947', marginLeft: 2 }}>✦✦</span>
        )}
      </div>

      {!isAnomaly && (
        <button
          className="text-left text-xs font-semibold tracking-widest uppercase"
          style={{
            color: 'rgba(96,165,250,0.6)',
            borderBottom: '1px solid rgba(96,165,250,0.25)',
            paddingBottom: 2,
            width: 'fit-content',
            letterSpacing: '0.1em',
          }}
        >
          How it works
        </button>
      )}

      <div className="divider" />

      {/* Stats blocks */}
      <div className="flex flex-col gap-3">
        <StatBlock
          label="Monthly Delivered"
          value={isAnomaly ? `${activeThreats} Active` : STATS.monthlyDelivered.toLocaleString()}
          trend="+32%"
          up={!isAnomaly}
          accent={isAnomaly ? '#ff4d6d' : undefined}
        />
        <StatBlock
          label="Yearly Delivered"
          value={STATS.yearlyDelivered.toLocaleString()}
          trend="+12%"
          up
        />
      </div>

      <div className="divider" />

      {/* Live current RPS */}
      <div className="flex flex-col gap-1">
        <span className="stat-label">Current RPS</span>
        <div className="flex items-end gap-1.5">
          <span
            className="font-mono font-bold"
            style={{
              fontSize: 28,
              lineHeight: 1,
              color: isAnomaly ? '#ff4d6d' : '#4da6ff',
              letterSpacing: '-0.03em',
              transition: 'color 0.5s',
            }}
          >
            {currentRps}
          </span>
          <span
            className="font-mono text-xs mb-1"
            style={{ color: isAnomaly ? '#ef4444' : '#10b981' }}
          >
            {isAnomaly ? '↑ spike' : '→ stable'}
          </span>
        </div>
        <span className="stat-label">baseline 20 rps</span>
      </div>

      {/* Attack nodes */}
      {isAnomaly && (
        <div className="flex flex-col gap-2 animate-fade-up">
          <span className="stat-label">Active Sources</span>
          {ATTACK_ORIGIN_NODES.slice(0, 4).map(node => (
            <div key={node.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="status-dot"
                  style={{ background: node.color, flexShrink: 0 }}
                />
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                  {node.city}
                </span>
              </div>
              <span
                className="badge"
                style={{
                  background: node.severity === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  color: node.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                  border: `1px solid ${node.severity === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  fontSize: 9,
                }}
              >
                {node.severity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatBlock = ({ label, value, trend, up, accent }) => (
  <div>
    <span className="stat-label">{label}</span>
    <div className="flex items-end gap-2 mt-0.5">
      <span
        className="font-bold font-mono"
        style={{
          fontSize: 22,
          lineHeight: 1,
          color: accent ?? '#f8fafc',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </span>
      {trend && (
        <span
          className="text-xs font-mono mb-0.5 flex items-center gap-0.5"
          style={{ color: up ? '#10b981' : '#ef4444' }}
        >
          {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {trend}
        </span>
      )}
    </div>
  </div>
);

export default LeftPanel;
