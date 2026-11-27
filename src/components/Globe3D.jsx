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
  const [countries, setCountries] = useState({ features: [] });

  // ── Persistent arc pool for smooth animations ──────────────────────────────
  const arcPoolRef = useRef([]);
  const arcSeqRef  = useRef(0);
  const [stableArcs, setStableArcs] = useState([]);

  // Fetch local country polygon outlines for high-tech cyber border rendering
  useEffect(() => {
    fetch('/countries.geojson')
      .then(res => res.json())
      .then(data => {
        // Exclude Antarctica for a cleaner, modern command center appearance
        const filtered = {
          ...data,
          features: (data.features || []).filter(
            f => f.properties?.NAME !== 'Antarctica' && f.properties?.ADMIN !== 'Antarctica'
          ),
        };
        setCountries(filtered);
      })
      .catch(err => {
        console.warn('countries.geojson not loaded, fallback to bare sphere:', err);
      });
  }, []);

  // Merge incoming trafficEvents into the persistent pool every second
  useEffect(() => {
    if (!trafficEvents || trafficEvents.length === 0) return;

    const MAX_POOL = 60;
    const seq = ++arcSeqRef.current;

    const fresh = trafficEvents.map((ev, i) => ({
      ...ev,
      id:     `ev_${seq}_${i}`,
      bornAt: Date.now(),
      ttl:    isAnomaly ? 4500 : 7000,
    }));

    arcPoolRef.current = [
      ...arcPoolRef.current.filter(a => Date.now() - a.bornAt < a.ttl),
      ...fresh,
    ].slice(-MAX_POOL);

    setStableArcs([...arcPoolRef.current]);
  }, [trafficEvents, isAnomaly]);

  // Responsive globe resizing
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Initial camera setup
  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView({ lat: 18, lng: 70, altitude: 2.1 }, 0);
    const ctrl = globeRef.current.controls();
    ctrl.autoRotate      = true;
    ctrl.autoRotateSpeed = 0.25;
    ctrl.enableZoom      = true;
    ctrl.enablePan       = true;
    ctrl.enableRotate    = true;
  }, [globeRef]);

  // Dynamic rotation speed during attacks
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotateSpeed = isAnomaly ? 0.60 : 0.25;
    }
  }, [isAnomaly, globeRef]);

  // Camera fly-to when searching for a city
  useEffect(() => {
    if (searchedCity && globeRef.current) {
      const q = searchedCity.toLowerCase();
      const match = activeThreatNodes.find(n =>
        n.name?.toLowerCase().includes(q) || n.city?.toLowerCase().includes(q)
      );
      globeRef.current.pointOfView(
        match
          ? { lat: match.lat, lng: match.lng, altitude: 1.5 }
          : { lat: 20, lng: 77, altitude: 1.9 },
        1200
      );
    }
  }, [searchedCity, activeThreatNodes, globeRef]);

  // ── 1. Arcs Data ───────────────────────────────────────────────────────────
  const arcsData = useMemo(() => {
    const arcs = [];

    // Ambient background routes — subtle cyber connections
    AMBIENT_ROUTES.forEach((r, i) => {
      arcs.push({
        id:       `ambient_${i}`,
        startLat: r.s[0], startLng: r.s[1],
        endLat:   r.e[0], endLng:   r.e[1],
        label:    r.label,
        color:    ['rgba(37,99,235,0.20)', 'rgba(56,189,248,0.45)', 'rgba(37,99,235,0.20)'],
        stroke:   0.45,
        altitude: 0.05 + (i % 5) * 0.03,
        dash:     0.25,
        gap:      0.75,
      });
    });

    // Live WebSocket traffic events
    stableArcs.forEach(ev => {
      const mal = ev.isMalicious;
      const label = ev.sourceCity
        ? `${ev.sourceCity}${ev.sourceCountry ? ', ' + ev.sourceCountry : ''} → SOC Core`
        : null;
      arcs.push({
        id:       ev.id,
        startLat: ev.startLat, startLng: ev.startLng,
        endLat:   ev.endLat,   endLng:   ev.endLng,
        label,
        color: mal
          ? ['rgba(239,68,68,0.85)', 'rgba(255,200,200,0.98)', 'rgba(239,68,68,0.85)']
          : ['rgba(52,211,153,0.45)', 'rgba(167,243,208,0.85)', 'rgba(52,211,153,0.45)'],
        stroke:   mal ? 1.8 : 0.75,
        altitude: mal ? 0.16 : 0.08,
        dash:     mal ? 0.45 : 0.25,
        gap:      mal ? 0.35 : 0.65,
      });
    });

    // Active threat node attack vectors
    activeThreatNodes.forEach(node => {
      const label = node.city
        ? `⚠ ATTACK VECTOR: ${node.city}, ${node.country || ''} → SOC Bengaluru`
        : `⚠ ATTACK VECTOR: ${node.ip} → SOC`;
      arcs.push({
        id:       `threat_${node.id}`,
        startLat: node.lat, startLng: node.lng,
        endLat:   TARGET_SERVER.lat, endLng: TARGET_SERVER.lng,
        label,
        color:    [node.color || '#ef4444', '#ffffff', node.color || '#ef4444'],
        stroke:   isAnomaly ? 2.5 : 1.5,
        altitude: 0.22 + Math.random() * 0.12,
        dash:     0.5,
        gap:      0.4,
      });
    });

    // Botnet mesh connections between active attack nodes
    if (isAnomaly && activeThreatNodes.length >= 2) {
      [[0, 1], [1, 2], [0, 2]].forEach(([a, b], i) => {
        const n1 = activeThreatNodes[a];
        const n2 = activeThreatNodes[b];
        if (n1 && n2) {
          arcs.push({
            id:       `cross_${i}`,
            startLat: n1.lat, startLng: n1.lng,
            endLat:   n2.lat, endLng:   n2.lng,
            label:    `Botnet Mesh: ${n1.city || n1.ip} ↔ ${n2.city || n2.ip}`,
            color:    ['rgba(168,85,247,0.65)', 'rgba(216,180,254,0.9)', 'rgba(168,85,247,0.65)'],
            stroke:   1.0,
            altitude: 0.12 + i * 0.03,
            dash:     0.35,
            gap:      0.55,
          });
        }
      });
    }

    return arcs;
  }, [stableArcs, activeThreatNodes, isAnomaly]);

  // ── 2. Radar Pulse Rings ───────────────────────────────────────────────────
  const ringsData = useMemo(() => {
    const rings = [{
      lat: TARGET_SERVER.lat,
      lng: TARGET_SERVER.lng,
      maxRadius:        isAnomaly ? 18 : 6,
      propagationSpeed: isAnomaly ? 4.5 : 1.8,
      repeatPeriod:     isAnomaly ? 600 : 2200,
      color: t => isAnomaly
        ? `rgba(239, 68, 68, ${(1 - t) * 0.95})`
        : `rgba(56, 189, 248, ${(1 - t) * 0.65})`,
    }];

    if (isAnomaly) {
      activeThreatNodes.forEach(n => rings.push({
        lat: n.lat,
        lng: n.lng,
        maxRadius:        13,
        propagationSpeed: 3.2,
        repeatPeriod:     900,
        color: t => `rgba(239, 68, 68, ${(1 - t) * 0.75})`,
      }));
    }
    return rings;
  }, [isAnomaly, activeThreatNodes]);

  // ── 3. High-visibility Points ──────────────────────────────────────────────
  const pointsData = useMemo(() => {
    const pts = [{
      lat: TARGET_SERVER.lat,
      lng: TARGET_SERVER.lng,
      size: isAnomaly ? 1.4 : 0.95,
      color: isAnomaly ? '#ef4444' : '#38bdf8',
      label: `SOC CORE — ${TARGET_SERVER.name} (${TARGET_SERVER.ip})`,
      altitude: 0.05,
    }];

    activeThreatNodes.forEach(n => pts.push({
      lat: n.lat,
      lng: n.lng,
      size: isAnomaly ? 1.1 : 0.6,
      color: isAnomaly ? (n.color || '#ef4444') : `${n.color || '#ef4444'}88`,
      label: n.city ? `⚠ ${n.city}, ${n.country || ''} — ${n.ip}` : `⚠ ${n.ip}`,
      altitude: isAnomaly ? 0.08 : 0.03,
    }));

    return pts;
  }, [isAnomaly, activeThreatNodes]);

  // ── 4. Floating 3D Labels directly on Globe ───────────────────────────────
  const labelsData = useMemo(() => {
    const labels = [
      {
        lat: TARGET_SERVER.lat,
        lng: TARGET_SERVER.lng,
        text: '● SOC CORE (BENGALURU)',
        color: isAnomaly ? '#ef4444' : '#38bdf8',
        size: 0.9,
        altitude: 0.08,
      },
    ];

    activeThreatNodes.slice(0, 5).forEach(node => {
      labels.push({
        lat: node.lat,
        lng: node.lng,
        text: node.city ? `⚠ ${node.city} [${node.ip}]` : `⚠ ${node.ip}`,
        color: '#f87171',
        size: 0.75,
        altitude: 0.09,
      });
    });

    return labels;
  }, [isAnomaly, activeThreatNodes]);

  const handlePointHover = useCallback(pt => {
    setHovered(pt?.label ?? null);
    if (globeRef.current) globeRef.current.controls().autoRotate = !pt;
  }, [globeRef]);

  return (
    <div
      ref={containerRef}
      id="globe-canvas-wrapper"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        background: 'radial-gradient(circle at 50% 50%, #030713 0%, #010307 65%, #000000 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Subtle futuristic deep-space radial vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.75) 100%)',
          zIndex: 1,
        }}
      />

      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        /* ── Local Assets for 100% offline reliability & instant rendering ── */
        globeImageUrl="/earth-dark.jpg"
        bumpImageUrl="/earth-topology.png"
        backgroundImageUrl="/night-sky.png"
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor={isAnomaly ? '#ef4444' : '#38bdf8'}
        atmosphereAltitude={isAnomaly ? 0.25 : 0.16}

        /* ── Country Polygon Outlines (High-Tech Vector SOC Grid) ── */
        polygonsData={countries.features}
        polygonGeoJsonGeometry={d => d.geometry}
        polygonCapColor={() => isAnomaly ? 'rgba(38, 14, 20, 0.45)' : 'rgba(10, 24, 42, 0.42)'}
        polygonSideColor={() => 'rgba(0, 0, 0, 0.25)'}
        polygonStrokeColor={() => isAnomaly ? 'rgba(239, 68, 68, 0.38)' : 'rgba(56, 189, 248, 0.30)'}
        polygonAltitude={0.006}

        /* ── Arcs (Attack & Normal Traffic Streams) ── */
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
        arcDashAnimateTime={isAnomaly ? 1100 : 3200}
        arcLabel={d => d.label ?? ''}

        /* ── Radar Pulse Rings ── */
        ringsData={ringsData}
        ringColor={d => d.color}
        ringMaxRadius={d => d.maxRadius}
        ringPropagationSpeed={d => d.propagationSpeed}
        ringRepeatPeriod={d => d.repeatPeriod}

        /* ── Points (SOC & Attacker Nodes) ── */
        pointsData={pointsData}
        pointLat={d => d.lat}
        pointLng={d => d.lng}
        pointColor={d => d.color}
        pointRadius={d => d.size}
        pointAltitude={d => d.altitude}
        pointLabel={d => d.label}
        onPointHover={handlePointHover}

        /* ── 3D In-Scene World Labels ── */
        labelsData={labelsData}
        labelLat={d => d.lat}
        labelLng={d => d.lng}
        labelText={d => d.text}
        labelSize={d => d.size}
        labelColor={d => d.color}
        labelAltitude={d => d.altitude}
        labelResolution={2}

        rendererConfig={{ antialias: true, alpha: true }}
        animateIn
      />

      {/* Bottom gradient — smoothly blends globe into the threat bar */}
      <div className="globe-fade-bottom" />

      {/* Hovered arc / point tooltip */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 72,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(5, 8, 16, 0.94)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: 11,
            fontWeight: 600,
            color: '#f1f5f9',
            letterSpacing: '0.04em',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 10,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), 0 0 12px rgba(56, 189, 248, 0.2)',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: isAnomaly ? '#ef4444' : '#38bdf8', flexShrink: 0, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
          {hovered}
        </div>
      )}
    </div>
  );
};

export default Globe3D;
