import React, { useMemo } from 'react';
import { TARGET_SERVER } from '../mock/mockData.js';

// Calibrated projection: lat/lng → SVG viewBox coordinates (1000 x 500) matching world_map.svg
// Places Bengaluru (12.97°N, 77.59°E) precisely in Southern India (Karnataka)
const project = (lat, lng) => {
  // Longitude: prime meridian at 478 in 1000 viewBox
  const x = 478 + (lng / 180.0) * 475.0;

  // Latitude: Equator at 262 in 500 viewBox
  const y = lat >= 0
    ? 262.0 - (lat / 90.0) * 215.0
    : 262.0 + (Math.abs(lat) / 90.0) * 235.0;

  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
};

const Map2D = ({ isAnomaly, activeThreatNodes = [], trafficEvents = [] }) => {
  const targetPos = project(TARGET_SERVER.lat, TARGET_SERVER.lng);

  // Build all arc paths: traffic events + active threat node arcs
  const allArcs = useMemo(() => {
    const arcs = [];

    // 1. Continuous traffic event arcs from WebSocket
    trafficEvents.forEach((ev, i) => {
      const start = project(ev.startLat, ev.startLng);
      const end   = project(ev.endLat,   ev.endLng);
      const midX  = (start.x + end.x) / 2;
      const midY  = Math.min(start.y, end.y) - Math.abs(end.x - start.x) * 0.15 - 15;
      arcs.push({
        id:          `evt_${i}`,
        d:           `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`,
        color:       ev.isMalicious ? '#f87171' : '#34d399',
        strokeWidth: ev.isMalicious ? 1.8 : 0.8,
        opacity:     ev.isMalicious ? 0.85 : 0.5,
        glow:        ev.isMalicious ? '#f87171' : '#34d399',
        dash:        ev.isMalicious ? '6 4' : '4 6',
      });
    });

    // 2. Active threat node arcs (only during attack)
    activeThreatNodes.forEach((node, i) => {
      const start = project(node.lat, node.lng);
      const midX  = (start.x + targetPos.x) / 2;
      const midY  = Math.min(start.y, targetPos.y) - 35;
      arcs.push({
        id:          `node_${i}`,
        d:           `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${targetPos.x.toFixed(1)} ${targetPos.y.toFixed(1)}`,
        color:       node.color ?? '#ef4444',
        strokeWidth: 2.4,
        opacity:     0.95,
        glow:        node.color ?? '#ef4444',
        dash:        '8 4',
      });
    });

    return arcs;
  }, [trafficEvents, activeThreatNodes, isAnomaly, targetPos.x, targetPos.y]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, #020824 0%, #000010 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Dark world map SVG background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("/world_map.svg"), url("https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg")',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          filter: 'invert(1) opacity(0.09) hue-rotate(200deg)',
          pointerEvents: 'none',
        }}
      />

      {/* Grid lines */}
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.08 }}
      >
        {/* Latitude lines */}
        {[-60, -30, 0, 30, 60].map(lat => {
          const y = ((90 - lat) * 500) / 180;
          return <line key={`lat_${lat}`} x1="0" y1={y} x2="1000" y2={y} stroke="#60a5fa" strokeWidth="0.5" strokeDasharray="3 3" />;
        })}
        {/* Longitude lines */}
        {[-120, -60, 0, 60, 120].map(lng => {
          const x = ((lng + 180) * 1000) / 360;
          return <line key={`lng_${lng}`} x1={x} y1="0" x2={x} y2="500" stroke="#60a5fa" strokeWidth="0.5" strokeDasharray="3 3" />;
        })}
      </svg>

      {/* All arcs and markers SVG layer */}
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <defs>
          <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Traffic arcs */}
        {allArcs.map(arc => (
          <path
            key={arc.id}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={arc.strokeWidth}
            strokeDasharray={arc.dash}
            opacity={arc.opacity}
            filter={arc.color === '#f87171' || arc.color === '#ef4444' ? 'url(#glow-red)' : 'url(#glow-green)'}
          />
        ))}

        {/* Threat node markers */}
        {activeThreatNodes.map((node, i) => {
          const pos = project(node.lat, node.lng);
          return (
            <g key={`threat_node_${i}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={6}
                fill={node.color ?? '#ef4444'}
                opacity={0.9}
                filter="url(#glow-red)"
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={12}
                fill="none"
                stroke={node.color ?? '#ef4444'}
                strokeWidth={1}
                opacity={0.4}
              />
              <text
                x={pos.x}
                y={pos.y - 10}
                textAnchor="middle"
                fill="#fca5a5"
                fontSize="10"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                {node.city || node.ip}
              </text>
            </g>
          );
        })}

        {/* Target server (SOC Core) */}
        <circle
          cx={targetPos.x}
          cy={targetPos.y}
          r={isAnomaly ? 9 : 6}
          fill={isAnomaly ? '#ef4444' : '#3b82f6'}
          opacity={0.95}
          filter={isAnomaly ? 'url(#glow-red)' : 'url(#glow-green)'}
        />
        {isAnomaly && (
          <circle
            cx={targetPos.x}
            cy={targetPos.y}
            r={18}
            fill="none"
            stroke="#ef4444"
            strokeWidth={1.5}
            opacity={0.5}
          />
        )}
      </svg>

      {/* SOC Core label */}
      <div
        style={{
          position: 'absolute',
          left: `${(targetPos.x / 1000) * 100}%`,
          top: `${((targetPos.y / 500) * 100) + 2.5}%`,
          transform: 'translateX(-50%)',
          background: 'rgba(0,2,12,0.85)',
          border: `1px solid ${isAnomaly ? 'rgba(239,68,68,0.4)' : 'rgba(96,165,250,0.3)'}`,
          borderRadius: 3,
          padding: '2px 6px',
          fontSize: 9,
          fontWeight: 700,
          color: isAnomaly ? '#f87171' : '#60a5fa',
          whiteSpace: 'nowrap',
          letterSpacing: '0.06em',
          pointerEvents: 'none',
          backdropFilter: 'blur(6px)',
        }}
      >
        {TARGET_SERVER.name}
      </div>

      {/* Bottom and top gradients */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, #000010 0%, transparent 20%, transparent 80%, #000010 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Live stats overlay */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          left: 16,
          background: 'rgba(0,2,12,0.8)',
          border: '1px solid rgba(96,165,250,0.12)',
          borderRadius: 6,
          padding: '8px 12px',
          backdropFilter: 'blur(12px)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', marginBottom: 4 }}>
          2D Flat View
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 1.5, background: '#34d399', borderRadius: 1 }} />
            <span style={{ fontSize: 8, color: 'rgba(148,163,184,0.7)' }}>Normal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 1.5, background: '#f87171', borderRadius: 1 }} />
            <span style={{ fontSize: 8, color: 'rgba(148,163,184,0.7)' }}>Malicious</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map2D;
