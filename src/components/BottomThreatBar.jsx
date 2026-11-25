import React, { useState, useEffect, useRef } from 'react';

const THREAT_CATEGORIES = [
  { id: 'OAS',  label: 'OAS', color: '#60a5fa', description: 'On-Access Scanner' },
  { id: 'ODS',  label: 'ODS', color: '#f87171', description: 'On-Demand Scanner' },
  { id: 'MAV',  label: 'MAV', color: '#a78bfa', description: 'Mail Anti-Virus' },
  { id: 'WAV',  label: 'WAV', color: '#34d399', description: 'Web Anti-Virus' },
  { id: 'IDS',  label: 'IDS', color: '#f97316', description: 'Intrusion Detection' },
  { id: 'VUL',  label: 'VUL', color: '#e2e8f0', description: 'Vulnerability Scan' },
  { id: 'KAS',  label: 'KAS', color: '#fbbf24', description: 'Kaspersky Security' },
  { id: 'BAD',  label: 'BAD', color: '#94a3b8', description: 'Blocked Hosts' },
  { id: 'SPAM', label: 'SPAM', color: '#fb923c', description: 'Anti-Spam' },
];

// Start from zero — counts will grow dynamically from real traffic events
const SEED_COUNTS = {
  OAS:  0,
  ODS:  0,
  MAV:  0,
  WAV:  0,
  IDS:  0,
  VUL:  0,
  KAS:  0,
  BAD:  0,
  SPAM: 0,
};

const BottomThreatBar = ({ trafficEvents = [], isAnomaly, activeCategory, onCategoryClick }) => {
  const [counts, setCounts] = useState(SEED_COUNTS);
  const [activeCat, setActiveCat] = useState(activeCategory ?? null);
  const [flashId, setFlashId] = useState(null);
  const prevEventsLenRef = useRef(0);

  // Increment counts whenever new traffic events arrive
  useEffect(() => {
    if (!trafficEvents || trafficEvents.length === 0) return;
    if (trafficEvents.length === prevEventsLenRef.current) return;
    prevEventsLenRef.current = trafficEvents.length;

    const delta = {};
    trafficEvents.forEach(ev => {
      const cat = ev.type;
      if (cat && SEED_COUNTS.hasOwnProperty(cat)) {
        delta[cat] = (delta[cat] ?? 0) + Math.floor(1 + Math.random() * 3);
        setFlashId(cat);
        setTimeout(() => setFlashId(null), 300);
      }
    });

    if (Object.keys(delta).length > 0) {
      setCounts(prev => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(delta)) {
          next[k] = (next[k] ?? 0) + v;
        }
        return next;
      });
    }
  }, [trafficEvents]);

  // No ambient tick — counts only grow from real traffic events

  const totalEvents = Object.values(counts).reduce((a, b) => a + b, 0);

  const handleCatClick = (id) => {
    const next = activeCat === id ? null : id;
    setActiveCat(next);
    if (onCategoryClick) onCategoryClick(next);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(5, 6, 8, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Total row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 32,
          padding: '4px 16px 2px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {THREAT_CATEGORIES.map(cat => (
          <span
            key={cat.id + '_total'}
            className="font-mono"
            style={{
              fontSize: 10,
              color: counts[cat.id] !== SEED_COUNTS[cat.id] && flashId === cat.id
                ? cat.color
                : 'rgba(148,163,184,0.55)',
              minWidth: 70,
              textAlign: 'center',
              transition: 'color 0.2s',
              letterSpacing: '0.02em',
            }}
          >
            {(counts[cat.id] ?? 0).toLocaleString()}
          </span>
        ))}
      </div>

      {/* Category bar */}
      <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
        {THREAT_CATEGORIES.map(cat => {
          const isActive = activeCat === cat.id;
          return (
            <button
              key={cat.id}
              title={cat.description}
              onClick={() => handleCatClick(cat.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '5px 0',
                minWidth: 80,
                flex: 1,
                maxWidth: 110,
                cursor: 'pointer',
                border: 'none',
                borderLeft: '1px solid rgba(255,255,255,0.04)',
                background: isActive
                  ? `rgba(${hexToRgb(cat.color)}, 0.12)`
                  : 'transparent',
                transition: 'background 0.2s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Active indicator line */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: cat.color,
                    boxShadow: `0 0 8px ${cat.color}`,
                  }}
                />
              )}

              {/* Colored label pill */}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '1px 7px',
                  borderRadius: 2,
                  background: `rgba(${hexToRgb(cat.color)}, 0.15)`,
                  color: cat.color,
                  border: `1px solid rgba(${hexToRgb(cat.color)}, 0.3)`,
                  transition: 'all 0.15s',
                  ...(isAnomaly && cat.id === 'IDS' ? {
                    animation: 'glowPulseRed 1.5s infinite',
                  } : {}),
                }}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Helper to convert hex to RGB for rgba()
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '96, 165, 250';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

export default BottomThreatBar;
