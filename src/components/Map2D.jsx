import React, { useMemo } from 'react';
import { TARGET_SERVER } from '../mock/mockData.js';

// Equirectangular projection: lat/lng → percentage coordinates on the flat map
const project = (lat, lng) => ({
  x: (lng + 180) * (100 / 360),
  y: (90 - lat) * (100 / 180),
});

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
      const midY  = Math.min(start.y, end.y) - Math.abs(end.x - start.x) * 0.2 - 5;
      arcs.push({
        id:          `evt_${i}`,
        d:           `M ${start.x}% ${start.y}% Q ${midX}% ${midY}% ${end.x}% ${end.y}%`,
        color:       ev.isMalicious ? '#f87171' : '#34d399',
        strokeWidth: ev.isMalicious ? 1.2 : 0.6,
        opacity:     ev.isMalicious ? 0.8 : 0.45,
        glow:        ev.isMalicious ? '#f87171' : '#34d399',
        dash:        ev.isMalicious ? '4 3' : '3 5',
      });
    });

    // 2. Active threat node arcs (only during attack)
    activeThreatNodes.forEach((node, i) => {
      const start = project(node.lat, node.lng);
      const midX  = (start.x + targetPos.x) / 2;
      const midY  = Math.min(start.y, targetPos.y) - 12;
      arcs.push({
        id:          `node_${i}`,
        d:           `M ${start.x}% ${start.y}% Q ${midX}% ${midY}% ${targetPos.x}% ${targetPos.y}%`,
        color:       node.color ?? '#ef4444',
        strokeWidth: 1.8,
        opacity:     0.9,
        glow:        node.color ?? '#ef4444',
        dash:        '6 3',
      });
    });

    return arcs;
  }, [trafficEvents, activeThreatNodes, isAnomaly]);

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
          backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg")',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          filter: 'invert(1) opacity(0.08) hue-rotate(200deg)',
          pointerEvents: 'none',
        }}
      />

      {/* Grid lines */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.07 }}
      >
        {/* Latitude lines */}
        {[-60, -30, 0, 30, 60].map(lat => {
          const y = (90 - lat) * (100 / 180);
          return <line key={`lat_${lat}`} x1="0%" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#60a5fa" strokeWidth="0.5" />;
        })}
        {/* Longitude lines */}
        {[-120, -60, 0, 60, 120].map(lng => {
          const x = (lng + 180) * (100 / 360);
          return <line key={`lng_${lng}`} x1={`${x}%`} y1="0%" x2={`${x}%`} y2="100%" stroke="#60a5fa" strokeWidth="0.5" />;
        })}
      </svg>

      {/* All arcs SVG layer */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <defs>
          {allArcs.map(arc => (
            <filter key={`filter_${arc.id}`} id={`glow_${arc.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        {allArcs.map(arc => (
          <path
            key={arc.id}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={arc.strokeWidth}
            strokeDasharray={arc.dash}
            opacity={arc.opacity}
            style={{ filter: `drop-shadow(0 0 3px ${arc.glow})` }}
          />
        ))}
      </svg>

      {/* Point markers */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {/* Target server (SOC Core) */}
        <circle
          cx={`${targetPos.x}%`}
          cy={`${targetPos.y}%`}
          r={isAnomaly ? 6 : 4}
          fill={isAnomaly ? '#ef4444' : '#3b82f6'}
          opacity={0.9}
          style={{ filter: `drop-shadow(0 0 6px ${isAnomaly ? '#ef4444' : '#3b82f6'})` }}
        />
        {isAnomaly && (
          <circle
            cx={`${targetPos.x}%`}
            cy={`${targetPos.y}%`}
            r={12}
            fill="none"
            stroke="#ef4444"
            strokeWidth={1}
            opacity={0.4}
          />
        )}

        {/* Threat node dots */}
        {activeThreatNodes.map((node, i) => {
          const pos = project(node.lat, node.lng);
          return (
            <g key={i}>
              <circle
                cx={`${pos.x}%`}
                cy={`${pos.y}%`}
                r={4}
                fill={node.color ?? '#ef4444'}
                opacity={0.9}
                style={{ filter: `drop-shadow(0 0 5px ${node.color ?? '#ef4444'})` }}
              />
              <text
                x={`${pos.x}%`}
                y={`${pos.y - 1.5}%`}
                textAnchor="middle"
                fill="#e2eaf4"
                fontSize="7"
                fontFamily="JetBrains Mono, monospace"
                opacity={0.8}
              >
                {node.city || node.ip}
              </text>
            </g>
          );
        })}
      </svg>

      {/* SOC Core label */}
      <div
        style={{
          position: 'absolute',
          left: `${targetPos.x}%`,
          top: `${targetPos.y + 2.5}%`,
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
