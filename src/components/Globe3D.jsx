import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Globe from 'react-globe.gl';
import PropTypes from 'prop-types';

// ─────────────────────────────────────────────────────────────────────────────
// WORLD CITIES — pre-loaded locations shown as spikes on the globe
// These will be the trackable source locations for incoming traffic.
// ─────────────────────────────────────────────────────────────────────────────

const WORLD_CITIES = [
  // ── Asia ──
  { id: 'in-blr',  name: 'Bengaluru',    lat: 12.9716, lng: 77.5946,  region: 'ASIA',    activity: 1.0, isTarget: true },
  { id: 'in-mum',  name: 'Mumbai',       lat: 19.0760, lng: 72.8777,  region: 'ASIA',    activity: 0.6 },
  { id: 'in-del',  name: 'Delhi',        lat: 28.6139, lng: 77.2090,  region: 'ASIA',    activity: 0.5 },
  { id: 'jp-tyo',  name: 'Tokyo',        lat: 35.6762, lng: 139.6503, region: 'ASIA',    activity: 0.9 },
  { id: 'jp-osk',  name: 'Osaka',        lat: 34.6937, lng: 135.5023, region: 'ASIA',    activity: 0.5 },
  { id: 'cn-bej',  name: 'Beijing',      lat: 39.9042, lng: 116.4074, region: 'ASIA',    activity: 0.8 },
  { id: 'cn-sha',  name: 'Shanghai',     lat: 31.2304, lng: 121.4737, region: 'ASIA',    activity: 0.75 },
  { id: 'cn-shz',  name: 'Shenzhen',     lat: 22.5431, lng: 114.0579, region: 'ASIA',    activity: 0.6 },
  { id: 'kr-sel',  name: 'Seoul',        lat: 37.5665, lng: 126.9780, region: 'ASIA',    activity: 0.7 },
  { id: 'sg-sin',  name: 'Singapore',    lat: 1.3521,  lng: 103.8198, region: 'ASIA',    activity: 0.8 },
  { id: 'hk-hkg',  name: 'Hong Kong',   lat: 22.3193, lng: 114.1694, region: 'ASIA',    activity: 0.65 },
  { id: 'tw-tpe',  name: 'Taipei',       lat: 25.0330, lng: 121.5654, region: 'ASIA',    activity: 0.55 },
  { id: 'th-bkk',  name: 'Bangkok',      lat: 13.7563, lng: 100.5018, region: 'ASIA',    activity: 0.5 },
  { id: 'id-jkt',  name: 'Jakarta',      lat: -6.2088, lng: 106.8456, region: 'ASIA',    activity: 0.6 },
  { id: 'pk-khi',  name: 'Karachi',      lat: 24.8607, lng: 67.0011,  region: 'ASIA',    activity: 0.45 },
  { id: 'bd-dac',  name: 'Dhaka',        lat: 23.8103, lng: 90.4125,  region: 'ASIA',    activity: 0.4 },
  // ── Europe ──
  { id: 'gb-lon',  name: 'London',       lat: 51.5074, lng: -0.1278,  region: 'EUROPE',  activity: 0.9 },
  { id: 'de-ber',  name: 'Berlin',       lat: 52.5200, lng: 13.4050,  region: 'EUROPE',  activity: 0.7 },
  { id: 'de-fra',  name: 'Frankfurt',    lat: 50.1109, lng: 8.6821,   region: 'EUROPE',  activity: 0.85 },
  { id: 'fr-par',  name: 'Paris',        lat: 48.8566, lng: 2.3522,   region: 'EUROPE',  activity: 0.75 },
  { id: 'nl-ams',  name: 'Amsterdam',    lat: 52.3676, lng: 4.9041,   region: 'EUROPE',  activity: 0.8 },
  { id: 'se-sto',  name: 'Stockholm',    lat: 59.3293, lng: 18.0686,  region: 'EUROPE',  activity: 0.5 },
  { id: 'ru-mow',  name: 'Moscow',       lat: 55.7558, lng: 37.6176,  region: 'EUROPE',  activity: 0.95 },
  { id: 'ua-kyv',  name: 'Kyiv',         lat: 50.4501, lng: 30.5234,  region: 'EUROPE',  activity: 0.55 },
  { id: 'es-mad',  name: 'Madrid',       lat: 40.4168, lng: -3.7038,  region: 'EUROPE',  activity: 0.5 },
  { id: 'it-rom',  name: 'Rome',         lat: 41.9028, lng: 12.4964,  region: 'EUROPE',  activity: 0.45 },
  { id: 'ch-zur',  name: 'Zurich',       lat: 47.3769, lng: 8.5417,   region: 'EUROPE',  activity: 0.6 },
  { id: 'pl-war',  name: 'Warsaw',       lat: 52.2297, lng: 21.0122,  region: 'EUROPE',  activity: 0.4 },
  // ── Americas ──
  { id: 'us-nyc',  name: 'New York',     lat: 40.7128, lng: -74.0060, region: 'AMERICAS',activity: 0.95 },
  { id: 'us-lax',  name: 'Los Angeles',  lat: 34.0522, lng: -118.2437,region: 'AMERICAS',activity: 0.8 },
  { id: 'us-chi',  name: 'Chicago',      lat: 41.8781, lng: -87.6298, region: 'AMERICAS',activity: 0.65 },
  { id: 'us-sfo',  name: 'San Francisco',lat: 37.7749, lng: -122.4194,region: 'AMERICAS',activity: 0.7 },
  { id: 'us-sea',  name: 'Seattle',      lat: 47.6062, lng: -122.3321,region: 'AMERICAS',activity: 0.55 },
  { id: 'us-ash',  name: 'Ashburn',      lat: 39.0438, lng: -77.4874, region: 'AMERICAS',activity: 0.75 },
  { id: 'us-mia',  name: 'Miami',        lat: 25.7617, lng: -80.1918, region: 'AMERICAS',activity: 0.5 },
  { id: 'ca-tor',  name: 'Toronto',      lat: 43.6532, lng: -79.3832, region: 'AMERICAS',activity: 0.6 },
  { id: 'ca-van',  name: 'Vancouver',    lat: 49.2827, lng: -123.1207,region: 'AMERICAS',activity: 0.45 },
  { id: 'br-sao',  name: 'São Paulo',    lat: -23.5505,lng: -46.6333, region: 'AMERICAS',activity: 0.65 },
  { id: 'br-rio',  name: 'Rio',          lat: -22.9068,lng: -43.1729, region: 'AMERICAS',activity: 0.4 },
  { id: 'mx-mex',  name: 'Mexico City',  lat: 19.4326, lng: -99.1332, region: 'AMERICAS',activity: 0.5 },
  { id: 'ar-bue',  name: 'Buenos Aires', lat: -34.6037,lng: -58.3816, region: 'AMERICAS',activity: 0.4 },
  // ── Middle East & Africa ──
  { id: 'ae-dxb',  name: 'Dubai',        lat: 25.2048, lng: 55.2708,  region: 'MIDEAST', activity: 0.75 },
  { id: 'sa-riy',  name: 'Riyadh',       lat: 24.7136, lng: 46.6753,  region: 'MIDEAST', activity: 0.55 },
  { id: 'il-tlv',  name: 'Tel Aviv',     lat: 32.0853, lng: 34.7818,  region: 'MIDEAST', activity: 0.6 },
  { id: 'tr-ist',  name: 'Istanbul',     lat: 41.0082, lng: 28.9784,  region: 'MIDEAST', activity: 0.7 },
  { id: 'eg-cai',  name: 'Cairo',        lat: 30.0444, lng: 31.2357,  region: 'AFRICA',  activity: 0.45 },
  { id: 'ng-lag',  name: 'Lagos',        lat: 6.5244,  lng: 3.3792,   region: 'AFRICA',  activity: 0.5 },
  { id: 'za-jnb',  name: 'Johannesburg', lat: -26.2041,lng: 28.0473,  region: 'AFRICA',  activity: 0.45 },
  { id: 'ke-nai',  name: 'Nairobi',      lat: -1.2921, lng: 36.8219,  region: 'AFRICA',  activity: 0.4 },
  // ── Oceania ──
  { id: 'au-syd',  name: 'Sydney',       lat: -33.8688,lng: 151.2093, region: 'OCEANIA', activity: 0.7 },
  { id: 'au-mel',  name: 'Melbourne',    lat: -37.8136,lng: 144.9631, region: 'OCEANIA', activity: 0.55 },
  { id: 'nz-akl',  name: 'Auckland',     lat: -36.8485,lng: 174.7633, region: 'OCEANIA', activity: 0.4 },
];

// ─────────────────────────────────────────────────────────────────────────────
// REGION COLOR MAP — each continent/region gets its own vivid hue
// ─────────────────────────────────────────────────────────────────────────────

const REGION_COLOR = {
  ASIA:     '#06b6d4',  // Cyan
  EUROPE:   '#a855f7',  // Violet
  AMERICAS: '#f43f5e',  // Rose/crimson
  MIDEAST:  '#f59e0b',  // Amber
  AFRICA:   '#10b981',  // Emerald
  OCEANIA:  '#3b82f6',  // Blue
  TARGET:   '#00ffff',  // Electric cyan (Bengaluru SOC)
};

// ─────────────────────────────────────────────────────────────────────────────
// ATTACK MOCK DATA
// [INTEGRATION NOTE] Replace with live WebSocket events via `attackEvents` prop
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_ATTACKS = [
  { id: 'us-nyc', originLat: 40.7128,  originLng: -74.006,  type: 'CRITICAL', name: 'New York'    },
  { id: 'uk-lon', originLat: 51.5074,  originLng: -0.1278,  type: 'SPIKE',    name: 'London'       },
  { id: 'jp-tyo', originLat: 35.6762,  originLng: 139.6503, type: 'WARNING',  name: 'Tokyo'        },
  { id: 'de-fra', originLat: 50.1109,  originLng: 8.6821,   type: 'BLOCKED',  name: 'Frankfurt'    },
  { id: 'ru-mow', originLat: 55.7558,  originLng: 37.6176,  type: 'CRITICAL', name: 'Moscow'       },
  { id: 'cn-bej', originLat: 39.9042,  originLng: 116.4074, type: 'CRITICAL', name: 'Beijing'      },
  { id: 'br-sao', originLat: -23.5505, originLng: -46.6333, type: 'SPIKE',    name: 'São Paulo'    },
  { id: 'ae-dxb', originLat: 25.2048,  originLng: 55.2708,  type: 'WARNING',  name: 'Dubai'        },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEVERITY COLORS
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_COLOR = {
  NORMAL:   '#10b981',
  WARNING:  '#f59e0b',
  SPIKE:    '#a855f7',
  CRITICAL: '#ef4444',
  BLOCKED:  '#64748b',
};

const LEGEND_ITEMS = [
  { label: 'NORMAL',   color: TYPE_COLOR.NORMAL   },
  { label: 'WARNING',  color: TYPE_COLOR.WARNING   },
  { label: 'SPIKE',    color: TYPE_COLOR.SPIKE     },
  { label: 'CRITICAL', color: TYPE_COLOR.CRITICAL  },
  { label: 'BLOCKED',  color: TYPE_COLOR.BLOCKED   },
];

const TARGET = { lat: 12.9716, lng: 77.5946 };

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const colorForType = (type) => TYPE_COLOR[type] ?? TYPE_COLOR.WARNING;

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

// Arc gradient: faint at origin → vivid at destination
const arcColorFn = (arc) => {
  const rgb = hexToRgb(arc.color);
  return [`rgba(${rgb},0.1)`, `rgba(${rgb},1.0)`];
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const Globe3D = ({ isAnomaly = false, attackEvents = null }) => {
  const globeRef     = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 490 });
  const [hoveredCity, setHoveredCity] = useState(null);

  // ── Responsive sizing ────────────────────────────────────────────────────
  const updateSize = useCallback(() => {
    if (containerRef.current) {
      setDimensions({
        width:  containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    }
  }, []);

  useEffect(() => {
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateSize]);

  // ── Camera setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView({ lat: 10, lng: 65, altitude: 2.0 }, 1500);
    const ctrl = globeRef.current.controls();
    if (ctrl) {
      ctrl.autoRotate      = true;
      ctrl.autoRotateSpeed = 0.35;
      ctrl.enableDamping   = true;
      ctrl.dampingFactor   = 0.05;
      ctrl.enableZoom      = false;
    }
  }, []);

  useEffect(() => {
    const ctrl = globeRef.current?.controls();
    if (ctrl) ctrl.autoRotateSpeed = isAnomaly ? 0.8 : 0.35;
  }, [isAnomaly]);

  // ── Data derivation ──────────────────────────────────────────────────────

  /**
   * [INTEGRATION NOTE] Replace MOCK_ATTACKS with live attackEvents from WebSocket.
   * Format: [{ originLat, originLng, type, name?, id? }, ...]
   */
  const activeEvents = useMemo(() => {
    if (!isAnomaly) return [];
    return attackEvents?.length ? attackEvents : MOCK_ATTACKS;
  }, [isAnomaly, attackEvents]);

  // ── SPIKES (bars rising from globe surface) ─────────────────────────────
  // All world cities are always shown as vertical bars — height = activity score
  const spikesData = useMemo(() => {
    return WORLD_CITIES.map((city) => {
      const isAttackSource = isAnomaly && activeEvents.some(
        (ev) => Math.abs(ev.originLat - city.lat) < 0.5 && Math.abs(ev.originLng - city.lng) < 0.5
      );
      const baseColor = city.isTarget
        ? REGION_COLOR.TARGET
        : REGION_COLOR[city.region] ?? '#ffffff';

      return {
        lat:      city.lat,
        lng:      city.lng,
        name:     city.name,
        region:   city.region,
        // Spike height: boosted during anomaly if it's an attack source
        altitude: isAttackSource ? city.activity * 0.18 : city.activity * 0.06,
        // Spike color: vivid if attack source, region color otherwise
        color:    isAttackSource
          ? colorForType(activeEvents.find(e =>
              Math.abs(e.originLat - city.lat) < 0.5)?.type || 'WARNING')
          : city.isTarget
            ? REGION_COLOR.TARGET
            : baseColor,
        // Point radius: wider spike for attack sources
        radius:   isAttackSource ? 0.45 : city.isTarget ? 0.5 : 0.25,
        opacity:  isAttackSource ? 1.0 : city.isTarget ? 1.0 : 0.55,
      };
    });
  }, [isAnomaly, activeEvents]);

  // ── CITY LABELS ──────────────────────────────────────────────────────────
  // Only show labels for major hubs + active attack sources + target
  const labelsData = useMemo(() => {
    const majorHubs = new Set([
      'in-blr','us-nyc','gb-lon','de-fra','jp-tyo','cn-bej',
      'sg-sin','ru-mow','au-syd','br-sao','ae-dxb','kr-sel','nl-ams',
    ]);
    const attackIds = new Set(activeEvents.map(e => e.name));

    return WORLD_CITIES.filter(c =>
      majorHubs.has(c.id) || attackIds.has(c.name) || c.isTarget
    ).map(city => {
      const isAttack = attackIds.has(city.name);
      return {
        lat:       city.lat,
        lng:       city.lng,
        text:      city.isTarget ? `⊕ ${city.name}` : city.name,
        size:      city.isTarget ? 1.4 : isAttack ? 1.2 : 0.9,
        color:     city.isTarget
          ? '#00ffff'
          : isAttack
            ? colorForType(activeEvents.find(e => e.name === city.name)?.type)
            : REGION_COLOR[city.region] ?? '#ffffff',
        altitude:  city.isTarget ? 0.07 : isAttack ? 0.2 : 0.03,
        dotRadius: 0,
      };
    });
  }, [activeEvents]);

  // ── ARCS ────────────────────────────────────────────────────────────────
  const arcsData = useMemo(() =>
    activeEvents.map((ev) => ({
      startLat: ev.originLat,
      startLng: ev.originLng,
      endLat:   TARGET.lat,
      endLng:   TARGET.lng,
      color:    colorForType(ev.type),
      type:     ev.type,
    })),
    [activeEvents]
  );

  // ── RINGS (Bengaluru ripple) ─────────────────────────────────────────────
  const ringsData = useMemo(() => [{
    lat:              TARGET.lat,
    lng:              TARGET.lng,
    maxR:             isAnomaly ? 10 : 5,
    propagationSpeed: isAnomaly ? 3 : 1,
    repeatPeriod:     isAnomaly ? 700 : 2200,
    color:            (t) => `rgba(0,255,255,${(1 - t * t).toFixed(3)})`,
  }], [isAnomaly]);

  // ── Region legend counts ─────────────────────────────────────────────────
  const regionCounts = useMemo(() => {
    const counts = {};
    WORLD_CITIES.forEach(c => {
      counts[c.region] = (counts[c.region] || 0) + 1;
    });
    return counts;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full gap-3">

      {/* ── Globe Panel ─────────────────────────────────────────────────── */}
      <div
        className={[
          'relative w-full h-[500px] rounded-xl overflow-hidden',
          'bg-[#030712] border transition-all duration-700',
          isAnomaly
            ? 'border-red-500/50 shadow-[0_0_50px_-4px_rgba(239,68,68,0.4)]'
            : 'border-slate-800/60 shadow-[0_4px_30px_-4px_rgba(0,0,0,0.8)]',
        ].join(' ')}
      >
        {/* Scanline texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 opacity-[0.025]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 4px)',
          }}
        />

        {/* Status badge */}
        <div className="absolute top-3 left-3 z-20">
          <span className={[
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full',
            'text-[10px] font-mono font-bold uppercase tracking-widest backdrop-blur-sm',
            isAnomaly
              ? 'bg-red-950/70 text-red-300 border border-red-500/50'
              : 'bg-black/50 text-cyan-300 border border-cyan-500/30',
          ].join(' ')}>
            <span className={[
              'inline-block w-1.5 h-1.5 rounded-full',
              isAnomaly ? 'bg-red-500 animate-ping' : 'bg-cyan-400 animate-pulse',
            ].join(' ')} />
            {isAnomaly ? `THREAT · ${activeEvents.length} SOURCES` : `MONITORING · ${WORLD_CITIES.length} NODES`}
          </span>
        </div>

        {/* City count badge — top right */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {Object.entries(REGION_COLOR).filter(([k]) => k !== 'TARGET').map(([region, color]) => (
            <span
              key={region}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono backdrop-blur-sm"
              style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}40` }}
            >
              <span className="w-1 h-1 rounded-full inline-block" style={{ backgroundColor: color }} />
              {region.slice(0, 3)}
            </span>
          ))}
        </div>

        {/* Hovered city tooltip */}
        {hoveredCity && (
          <div className="absolute bottom-12 left-3 z-20 backdrop-blur-sm">
            <div className="bg-black/70 border border-cyan-500/30 rounded-lg px-3 py-2">
              <p className="text-cyan-300 text-xs font-mono font-bold">{hoveredCity.name}</p>
              <p className="text-slate-400 text-[10px] font-mono">{hoveredCity.region} · Activity {Math.round(hoveredCity.opacity * 100)}%</p>
            </div>
          </div>
        )}

        {/* Target label */}
        <div className="absolute bottom-3 right-3 z-20">
          <span className="text-[10px] font-mono text-cyan-400/50 tracking-widest uppercase">
            ⊕ SOC · Bengaluru
          </span>
        </div>

        {/* Globe canvas */}
        <div ref={containerRef} className="absolute inset-0">
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}

            // Dark night earth
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            backgroundColor="rgba(0,0,0,0)"
            showGraticules={false}
            enablePointerInteraction={true}

            // Atmosphere
            showAtmosphere={true}
            atmosphereColor="#0c1a3a"
            atmosphereAltitude={0.14}

            // ── SPIKES (bars rising from city locations) ──
            pointsData={spikesData}
            pointColor="color"
            pointRadius="radius"
            pointAltitude="altitude"
            pointResolution={8}
            onPointHover={(point) => setHoveredCity(point || null)}

            // ── CITY LABELS ──
            labelsData={labelsData}
            labelText="text"
            labelSize="size"
            labelColor="color"
            labelAltitude="altitude"
            labelDotRadius="dotRadius"
            labelResolution={3}
            labelIncludeDot={false}

            // ── ATTACK ARCS ──
            arcsData={arcsData}
            arcColor={arcColorFn}
            arcDashLength={0.35}
            arcDashGap={0.45}
            arcDashInitialGap={() => Math.random() * 0.9}
            arcDashAnimateTime={1800}
            arcStroke={0.6}
            arcAltitudeAutoScale={0.5}

            // ── RINGS on SOC target ──
            ringsData={ringsData}
            ringColor="color"
            ringMaxRadius="maxR"
            ringPropagationSpeed="propagationSpeed"
            ringRepeatPeriod="repeatPeriod"
          />
        </div>
      </div>

      {/* ── Info strip: city count per region ───────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 px-1">
        {Object.entries(REGION_COLOR).filter(([k]) => k !== 'TARGET').map(([region, color]) => (
          <div
            key={region}
            className="flex flex-col items-center py-1.5 rounded-lg border"
            style={{
              backgroundColor: `${color}0d`,
              borderColor: `${color}30`,
            }}
          >
            <span className="text-[11px] font-mono font-bold" style={{ color }}>
              {WORLD_CITIES.filter(c => c.region === region).length}
            </span>
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider mt-0.5">
              {region === 'MIDEAST' ? 'MID-EAST' : region}
            </span>
          </div>
        ))}
      </div>

      {/* ── Legend Bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-2 py-1">
        {LEGEND_ITEMS.map(({ label, color }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-slate-800"
            style={{ boxShadow: `0 0 10px -2px ${color}33` }}
          >
            <span
              aria-hidden="true"
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color, boxShadow: `0 0 6px 1px ${color}88` }}
            />
            <span
              className="text-[10px] font-mono font-semibold tracking-widest uppercase"
              style={{ color }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROP TYPES
// ─────────────────────────────────────────────────────────────────────────────

Globe3D.propTypes = {
  isAnomaly: PropTypes.bool,
  attackEvents: PropTypes.arrayOf(
    PropTypes.shape({
      originLat: PropTypes.number.isRequired,
      originLng: PropTypes.number.isRequired,
      type:      PropTypes.string.isRequired,
    })
  ),
};

export default Globe3D;
