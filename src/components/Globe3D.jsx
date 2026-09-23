import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { TARGET_SERVER } from '../mock/mockData.js';

// ── Always-on ambient background routes ──────────────────────────────────────
const AMBIENT_ROUTES = [
  { s: [51.5074, -0.1278],   e: [37.7749, -122.4194], label: 'London → SF'        },
  { s: [35.6762, 139.6503],  e: [40.7128, -74.0060],  label: 'Tokyo → NYC'        },
  { s: [-33.8688, 151.2093], e: [48.8566, 2.3522],    label: 'Sydney → Paris'     },
  { s: [1.3521, 103.8198],   e: [55.7558, 37.6173],   label: 'Singapore → Moscow' },
  { s: [-23.5505, -46.6333], e: [52.5200, 13.4050],   label: 'São Paulo → Berlin' },
  { s: [19.0760, 72.8777],   e: [37.7749, -122.4194], label: 'Mumbai → SF'        },
  { s: [31.2304, 121.4737],  e: [51.5074, -0.1278],   label: 'Shanghai → London'  },
  { s: [30.0444, 31.2357],   e: [40.7128, -74.0060],  label: 'Cairo → NYC'        },
  { s: [6.5244, 3.3792],     e: [48.8566, 2.3522],    label: 'Lagos → Paris'      },
  { s: [25.2048, 55.2708],   e: [40.7128, -74.0060],  label: 'Dubai → NYC'        },
  { s: [55.7558, 37.6173],   e: [35.6762, 139.6503],  label: 'Moscow → Tokyo'     },
  { s: [52.5200, 13.4050],   e: [-23.5505, -46.6333], label: 'Berlin → São Paulo' },
  { s: [39.9042, 116.4074],  e: [12.9716, 77.5946],   label: 'Beijing → SOC'      },
  { s: [41.0082, 28.9784],   e: [40.7128, -74.0060],  label: 'Istanbul → NYC'     },
  { s: [43.6532, -79.3832],  e: [51.5074, -0.1278],   label: 'Toronto → London'   },
];

const Globe3D = ({ isAnomaly, globeRef, searchedCity, activeThreatNodes = [], trafficEvents = [] }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [hovered, setHovered] = useState(null);

  // ── Persistent arc pool — key insight for smooth animation ─────────────────
  // Instead of replacing all arcs every second (which resets animations),
  // we keep a rolling buffer that blends new arcs in and old ones out.
  const arcPoolRef = useRef([]);
  const arcSeqRef  = useRef(0);

  const [stableArcs, setStableArcs] = useState([]);

  // Merge incoming trafficEvents into the persistent pool every second
  useEffect(() => {
    if (!trafficEvents || trafficEvents.length === 0) return;

    const MAX_POOL = 60; // never show more than 60 arcs at once
    const seq = ++arcSeqRef.current;

    // Tag each new event with a unique id and timestamp
    const fresh = trafficEvents.map((ev, i) => ({
      ...ev,
      id:       `ev_${seq}_${i}`,
      bornAt:   Date.now(),
      ttl:      isAnomaly ? 4000 : 7000, // malicious arcs linger 4s, normal 7s
    }));

    arcPoolRef.current = [
      ...arcPoolRef.current.filter(a => Date.now() - a.bornAt < a.ttl),
      ...fresh,
    ].slice(-MAX_POOL);

    setStableArcs([...arcPoolRef.current]);
  }, [trafficEvents, isAnomaly]);

  // Responsive globe size
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({ width: Math.floor(entry.contentRect.width), height: Math.floor(entry.contentRect.height) });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Initial camera setup
  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView({ lat: 18, lng: 30, altitude: 1.9 }, 0);
    const ctrl = globeRef.current.controls();
    ctrl.autoRotate      = true;
    ctrl.autoRotateSpeed = 0.22;
    ctrl.enableZoom      = true;
    ctrl.enablePan       = true;
    ctrl.enableRotate    = true;
  }, []);

  // Rotation speed reacts to attack state
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotateSpeed = isAnomaly ? 0.65 : 0.22;
    }
  }, [isAnomaly]);

  // Camera fly-to when a city is searched
  useEffect(() => {
    if (searchedCity && globeRef.current) {
      const q = searchedCity.toLowerCase();
      const match = activeThreatNodes.find(n =>
        n.name?.toLowerCase().includes(q) || n.city?.toLowerCase().includes(q),
      );
      globeRef.current.pointOfView(
        match
          ? { lat: match.lat, lng: match.lng, altitude: 1.5 }
          : { lat: (Math.random() - 0.5) * 100, lng: (Math.random() - 0.5) * 180, altitude: 1.8 },
        1200,
      );
    }
  }, [searchedCity]);

  // ── Arc data ──────────────────────────────────────────────────────────────
  const arcsData = useMemo(() => {
    const arcs = [];

    // 1. Ambient background routes — always present, thin blue
    AMBIENT_ROUTES.forEach((r, i) => {
      arcs.push({
        id:       `ambient_${i}`,
        startLat: r.s[0], startLng: r.s[1],
        endLat:   r.e[0], endLng:   r.e[1],
        label:    r.label,
        color:    ['rgba(59,130,246,0.15)', 'rgba(99,179,237,0.35)', 'rgba(59,130,246,0.15)'],
        stroke:   0.4,
        altitude: 0.04 + (i % 5) * 0.04,
        dash:     0.25, gap: 0.75,
      });
    });

    // 2. Live WebSocket traffic events from stable pool
    stableArcs.forEach(ev => {
      const mal = ev.isMalicious;
      const label = ev.sourceCity
        ? `${ev.sourceCity}${ev.sourceCountry ? ', ' + ev.sourceCountry : ''} → SOC`
        : null;
      arcs.push({
        id:       ev.id,
        startLat: ev.startLat, startLng: ev.startLng,
        endLat:   ev.endLat,   endLng:   ev.endLng,
        label:    label,
        color:    mal
          ? ['rgba(239,68,68,0.7)',  'rgba(255,150,150,0.95)', 'rgba(239,68,68,0.7)']
          : ['rgba(52,211,153,0.4)', 'rgba(134,239,172,0.8)',  'rgba(52,211,153,0.4)'],
        stroke:   mal ? 1.6 : 0.7,
        altitude: mal ? 0.15 : 0.07,
        dash:     mal ? 0.4  : 0.25,
        gap:      mal ? 0.45 : 0.65,
      });
    });

    // 3. Active threat node → SOC arcs (bold attack vectors)
    activeThreatNodes.forEach(node => {
      const label = node.city
        ? `⚠ ${node.city}, ${node.country || ''} → SOC Bengaluru`
        : `⚠ ${node.ip} → SOC`;
      arcs.push({
        id:       `threat_${node.id}`,
        startLat: node.lat, startLng: node.lng,
        endLat:   TARGET_SERVER.lat, endLng: TARGET_SERVER.lng,
        label,
        color:    [node.color, 'rgba(255,255,255,0.95)', node.color],
        stroke:   isAnomaly ? 2.2 : 1.4,
        altitude: 0.22 + Math.random() * 0.15,
        dash:     0.4, gap: 0.45,
      });
    });

    // 4. Cross-connections between attack nodes (looks like a botnet mesh)
    if (isAnomaly && activeThreatNodes.length >= 2) {
      [[0, 1], [1, 2], [0, 2]].forEach(([a, b], i) => {
        const n1 = activeThreatNodes[a], n2 = activeThreatNodes[b];
        if (n1 && n2) {
          arcs.push({
            id:       `cross_${i}`,
            startLat: n1.lat, startLng: n1.lng,
            endLat:   n2.lat, endLng:   n2.lng,
            label:    `Botnet mesh: ${n1.city || n1.ip} ↔ ${n2.city || n2.ip}`,
            color:    ['rgba(167,139,250,0.55)', 'rgba(196,181,253,0.75)', 'rgba(167,139,250,0.55)'],
            stroke:   0.9, altitude: 0.10 + i * 0.04, dash: 0.3, gap: 0.6,
          });
        }
      });
    }

    return arcs;
  }, [stableArcs, activeThreatNodes, isAnomaly]);

  // ── Rings ─────────────────────────────────────────────────────────────────
  const ringsData = useMemo(() => {
    const rings = [{
      lat: TARGET_SERVER.lat, lng: TARGET_SERVER.lng,
      maxRadius:        isAnomaly ? 20 : 5,
      propagationSpeed: isAnomaly ? 5  : 1.5,
      repeatPeriod:     isAnomaly ? 500 : 2500,
      color: t => isAnomaly
        ? `rgba(239,68,68,${(1 - t) * 0.9})`
        : `rgba(59,130,246,${(1 - t) * 0.5})`,
    }];
    if (isAnomaly) {
      activeThreatNodes.forEach(n => rings.push({
        lat: n.lat, lng: n.lng,
        maxRadius: 14, propagationSpeed: 3.5, repeatPeriod: 900,
        color: t => `rgba(239,68,68,${(1 - t) * 0.6})`,
      }));
    }
    return rings;
  }, [isAnomaly, activeThreatNodes]);

  // ── Points ────────────────────────────────────────────────────────────────
  const pointsData = useMemo(() => {
    const pts = [{
      lat: TARGET_SERVER.lat, lng: TARGET_SERVER.lng,
      size: isAnomaly ? 1.2 : 0.8,
      color: isAnomaly ? '#ef4444' : '#3b82f6',
      label: `SOC — ${TARGET_SERVER.name}`,
      altitude: 0.06,
    }];
    activeThreatNodes.forEach(n => pts.push({
      lat: n.lat, lng: n.lng,
      size: isAnomaly ? 0.9 : 0.45,
      color: isAnomaly ? n.color : `${n.color}77`,
      label: n.city ? `${n.city}, ${n.country || ''} — ${n.ip}` : n.ip,
      altitude: isAnomaly ? 0.10 : 0.02,
    }));
    return pts;
  }, [isAnomaly, activeThreatNodes]);

  const handlePointHover = useCallback(pt => {
    setHovered(pt?.label ?? null);
    if (globeRef.current) globeRef.current.controls().autoRotate = !pt;
  }, []);

  return (
    <div
      ref={containerRef}
      id="globe-canvas-wrapper"
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0,
        background: 'radial-gradient(ellipse at center, #020824 0%, #000010 100%)',
      }}
    >
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl={null}
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor={isAnomaly ? '#8b0000' : '#1a4a8a'}
        atmosphereAltitude={isAnomaly ? 0.22 : 0.13}
        /* ── Arcs ── */
        arcsData={arcsData}
        arcStartLat={d => d.startLat}
        arcStartLng={d => d.startLng}
        arcEndLat={d => d.endLat}
        arcEndLng={d => d.endLng}
        arcColor={d => d.color}
        arcStroke={d => d.stroke}
        arcAltitude={d => d.altitude}
        arcDashLength={d => d.dash ?? 0.35}
        arcDashGap={d => d.gap ?? 0.55}
        arcDashAnimateTime={isAnomaly ? 900 : 3500}
        arcLabel={d => d.label ?? ''}
        /* ── Rings ── */
        ringsData={ringsData}
        ringColor={d => d.color}
        ringMaxRadius={d => d.maxRadius}
        ringPropagationSpeed={d => d.propagationSpeed}
        ringRepeatPeriod={d => d.repeatPeriod}
        /* ── Points ── */
        pointsData={pointsData}
        pointLat={d => d.lat}
        pointLng={d => d.lng}
        pointColor={d => d.color}
        pointRadius={d => d.size}
        pointAltitude={d => d.altitude}
        pointLabel={d => d.label}
        onPointHover={handlePointHover}
        rendererConfig={{ antialias: true, alpha: true }}
        animateIn
      />

      {/* Bottom gradient — blends globe into threat bar */}
      <div className="globe-fade-bottom" />

      {/* Hovered arc / point tooltip */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 64,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,2,12,0.9)',
            border: '1px solid rgba(96,165,250,0.25)',
            borderRadius: 5,
            padding: '4px 12px',
            fontSize: 10,
            fontWeight: 600,
            color: '#e2eaf4',
            letterSpacing: '0.04em',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            zIndex: 10,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', flexShrink: 0 }} />
          {hovered}
        </div>
      )}
    </div>
  );
};

export default Globe3D;
