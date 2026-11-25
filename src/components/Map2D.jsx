import React, { useMemo } from 'react';
import { TARGET_SERVER } from '../mock/mockData.js';

// Exact equirectangular projection matched 1:1 with public/world_map.svg
// Generated directly from ne_110m_admin_0_countries.geojson:
//   longitude [-180, 180] -> X [0, 1000]
//   latitude  [85, -60]   -> Y [0, 500]
// Places Bengaluru (12.9716°N, 77.5946°E) at (715.5, 248.4) inside Southern India.
const LAT_MAX = 85;
const LAT_MIN = -60;

const project = (lat, lng) => {
  const clampedLat = Math.max(LAT_MIN, Math.min(LAT_MAX, lat));
  const x = ((lng + 180) * 1000) / 360;
  const y = ((LAT_MAX - clampedLat) * 500) / (LAT_MAX - LAT_MIN);
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
};

const Map2D = ({ isAnomaly, activeThreatNodes = [], trafficEvents = [] }) => {
  const targetPos = project(TARGET_SERVER.lat, TARGET_SERVER.lng);

  // Deduplicate active source cities for subtle land markers
  const activeSourceMarkers = useMemo(() => {
    const seen = new Set();
    const list = [];
    trafficEvents.forEach(ev => {
      if (!ev.sourceCity || seen.has(ev.sourceCity)) return;
      seen.add(ev.sourceCity);
      list.push(ev);
    });
    return list.slice(0, 14);
  }, [trafficEvents]);

  // Build all arc paths: traffic events + active threat node arcs
  const allArcs = useMemo(() => {
    const arcs = [];

    trafficEvents.forEach((ev, i) => {
      const start = project(ev.startLat, ev.startLng);
      const end   = project(ev.endLat,   ev.endLng);
      const midX  = (start.x + end.x) / 2;
      const midY  = Math.min(start.y, end.y) - Math.abs(end.x - start.x) * 0.14 - 14;
      arcs.push({
        id:          `evt_${i}`,
        d:           `M ${start.x} ${start.y} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${end.x} ${end.y}`,
        color:       ev.isMalicious ? '#f87171' : '#34d399',
        strokeWidth: ev.isMalicious ? 1.6 : 0.75,
        opacity:     ev.isMalicious ? 0.85 : 0.48,
        dash:        ev.isMalicious ? '6 4' : '4 6',
      });
    });

    activeThreatNodes.forEach((node, i) => {
      const start = project(node.lat, node.lng);
      const midX  = (start.x + targetPos.x) / 2;
      const midY  = Math.min(start.y, targetPos.y) - 32;
      arcs.push({
        id:          `node_${i}`,
        d:           `M ${start.x} ${start.y} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${targetPos.x} ${targetPos.y}`,
        color:       node.color ?? '#ef4444',
        strokeWidth: 2.2,
        opacity:     0.95,
        dash:        '8 4',
      });
    });

    return arcs;
  }, [trafficEvents, activeThreatNodes, targetPos.x, targetPos.y]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Unified SVG: world map, grid, arcs, markers, and SOC Core label all share the exact 1000x500 viewBox */}
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* GeoJSON-aligned world landmasses */}
        <image href="/world_map.svg" x="0" y="0" width="1000" height="500" preserveAspectRatio="none" />

        {/* Aligned Lat/Lng grid lines */}
        <g opacity="0.1">
          {[-45, -30, 0, 30, 60].map(lat => {
            const y = ((LAT_MAX - lat) * 500) / (LAT_MAX - LAT_MIN);
            return <line key={`lat_${lat}`} x1="0" y1={y} x2="1000" y2={y} stroke="#60a5fa" strokeWidth="0.5" strokeDasharray="3 3" />;
          })}
          {[-120, -60, 0, 60, 120].map(lng => {
            const x = ((lng + 180) * 1000) / 360;
            return <line key={`lng_${lng}`} x1={x} y1="0" x2={x} y2="500" stroke="#60a5fa" strokeWidth="0.5" strokeDasharray="3 3" />;
          })}
        </g>

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

        {/* Active normal/traffic origin dots on land */}
        {activeSourceMarkers.map((ev, i) => {
          const pos = project(ev.startLat, ev.startLng);
          return (
            <circle
              key={`src_${i}`}
              cx={pos.x}
              cy={pos.y}
              r={ev.isMalicious ? 3.2 : 2}
              fill={ev.isMalicious ? '#f87171' : '#34d399'}
              opacity={0.8}
            />
          );
        })}

        {/* Threat node markers */}
        {activeThreatNodes.map((node, i) => {
          const pos = project(node.lat, node.lng);
          return (
            <g key={`threat_node_${i}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={5}
                fill={node.color ?? '#ef4444'}
                opacity={0.95}
                filter="url(#glow-red)"
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={10}
                fill="none"
                stroke={node.color ?? '#ef4444'}
                strokeWidth={0.9}
                opacity={0.45}
              />
              <text
                x={pos.x}
                y={pos.y - 9}
                textAnchor="middle"
                fill="#fca5a5"
                fontSize="8.5"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                {node.city || node.ip}
              </text>
            </g>
          );
        })}

        {/* Target server (SOC Core — Bengaluru) */}
        <circle
          cx={targetPos.x}
          cy={targetPos.y}
          r={isAnomaly ? 7 : 4.5}
          fill={isAnomaly ? '#ef4444' : '#3b82f6'}
          opacity={0.95}
          filter={isAnomaly ? 'url(#glow-red)' : 'url(#glow-green)'}
        />
        <circle
          cx={targetPos.x}
          cy={targetPos.y}
          r={isAnomaly ? 14 : 9}
          fill="none"
          stroke={isAnomaly ? '#ef4444' : '#60a5fa'}
          strokeWidth={1.1}
          opacity={0.5}
        />

        {/* SOC Core label locked to SVG coordinates */}
        <g transform={`translate(${targetPos.x}, ${targetPos.y + 16})`}>
          <rect
            x="-58"
            y="-7"
            width="116"
            height="14"
            rx="3"
            fill="rgba(5,5,8,0.9)"
            stroke={isAnomaly ? 'rgba(239,68,68,0.55)' : 'rgba(96,165,250,0.45)'}
            strokeWidth="0.7"
          />
          <text
            x="0"
            y="2.5"
            textAnchor="middle"
            fill={isAnomaly ? '#fca5a5' : '#93c5fd'}
            fontSize="7.5"
            fontWeight="700"
            fontFamily="Inter, sans-serif"
            letterSpacing="0.4"
          >
            {TARGET_SERVER.name}
          </text>
        </g>
      </svg>

      {/* Bottom and top subtle vignettes */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, #000000 0%, transparent 16%, transparent 84%, #000000 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Live legend overlay */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          left: 16,
          background: 'rgba(8,10,14,0.88)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6,
          padding: '8px 12px',
          backdropFilter: 'blur(12px)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(148,163,184,0.75)', textTransform: 'uppercase', marginBottom: 4 }}>
          2D Tactical Map (WGS84 Exact)
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 1.5, background: '#34d399', borderRadius: 1 }} />
            <span style={{ fontSize: 8, color: 'rgba(203,213,225,0.85)' }}>Normal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 1.5, background: '#f87171', borderRadius: 1 }} />
            <span style={{ fontSize: 8, color: 'rgba(203,213,225,0.85)' }}>Malicious</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map2D;
