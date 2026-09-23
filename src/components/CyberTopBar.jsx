import React, { useState, useEffect } from 'react';
import { Shield, Radio, Globe, BarChart2, Database, Brain, Zap } from 'lucide-react';

const NAV_TABS = [
  { id: 'map',        label: 'Map',          icon: Globe },
  { id: 'statistics', label: 'Statistics',   icon: BarChart2 },
  { id: 'sources',    label: 'Data Sources', icon: Database },
  { id: 'ai',         label: 'AI Insights',  icon: Brain },
];

const CyberTopBar = ({ status, isConnected, activeTab, onTabChange, onToggleIncidents }) => {
  const [time, setTime] = useState(new Date());
  const isAnomaly = status === 'ANOMALY' || status === 'VOLUMETRIC_DDOS' || status === 'BOT_ATTACK';

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(0, 2, 12, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(96, 165, 250, 0.1)',
        padding: '0 16px',
        gap: 0,
      }}
    >
      {/* ── Branding ────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
          marginRight: 24,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(59,130,246,0.4)',
            flexShrink: 0,
          }}
        >
          <Shield size={14} color="#fff" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span
            className="font-orbitron"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#e2eaf4',
              letterSpacing: '0.12em',
            }}
          >
            SENTINELX
          </span>
          <span
            style={{
              fontSize: 7,
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: 'rgba(96,165,250,0.7)',
              textTransform: 'uppercase',
              marginTop: 1,
            }}
          >
            CYBERTHREAT LIVE MAP
          </span>
        </div>
      </div>

      {/* ── Center nav tabs ─────────────────────────────── */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        {NAV_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`cyber-nav-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => onTabChange && onTabChange(id)}
          >
            {label}
          </button>
        ))}

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 18,
            background: 'rgba(255,255,255,0.08)',
            margin: '0 8px',
          }}
        />

        {/* Incidents toggle button */}
        <button
          className="cyber-nav-tab"
          onClick={onToggleIncidents}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <Zap size={10} />
          Incidents
        </button>
      </nav>

      {/* ── Right side ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>

        {/* Live clock */}
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            color: 'rgba(148,163,184,0.6)',
            letterSpacing: '0.05em',
          }}
        >
          {time.toUTCString().slice(17, 25)} UTC
        </span>

        {/* Connection status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 4,
            background: isConnected ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${isConnected ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          <Radio size={9} color={isConnected ? '#34d399' : '#f87171'} />
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: isConnected ? '#34d399' : '#f87171',
              textTransform: 'uppercase',
            }}
          >
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* Attack status indicator */}
        {isAnomaly && (
          <div
            className="animate-glow-red"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 4,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.35)',
            }}
          >
            <span
              className="status-dot status-dot-pulse"
              style={{ background: '#ef4444', width: 5, height: 5 }}
            />
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.1em',
                color: '#f87171',
                textTransform: 'uppercase',
              }}
            >
              ATTACK ACTIVE
            </span>
          </div>
        )}

        {/* Protect button */}
        <button
          style={{
            padding: '5px 14px',
            borderRadius: 4,
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            border: '1px solid rgba(96,165,250,0.3)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 0 12px rgba(37,99,235,0.3)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 0 20px rgba(37,99,235,0.6)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 0 12px rgba(37,99,235,0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Protect Yourself
        </button>
      </div>
    </header>
  );
};

export default CyberTopBar;
