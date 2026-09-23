import React from 'react';

// Top-left floating status cluster (like the total + parcels counters in reference)
const StatusCluster = ({ isAnomaly, currentRps, activeNodes }) => {
  return (
    <div
      className="absolute top-4 left-4 flex flex-col gap-2 z-10 animate-fade-up"
      style={{ pointerEvents: 'none' }}
    >
      {/* Total parcels-like block */}
      <div
        className="glass-panel px-3 py-2"
        style={{ minWidth: 100, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.6)' }}
      >
        <span className="stat-label block">Total</span>
        <span
          className="font-mono font-bold block"
          style={{ fontSize: 22, color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: 1.1 }}
        >
          2.4k+
        </span>
        <span
          className="font-mono text-[9px] block mt-0.5"
          style={{ color: '#16a34a' }}
        >
          +5.7% this week
        </span>
      </div>

      {/* Status rows */}
      {[
        { color: '#2563eb', label: 'On-way',  value: '15.7k' },
        { color: '#16a34a', label: 'Blocked', value: '16.4k' },
        { color: '#f59e0b', label: 'Waiting', value: '6.2k'  },
      ].map(({ color, label, value }) => (
        <div
          key={label}
          className="glass-panel flex items-center gap-2 px-2.5 py-1.5"
          style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.6)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-sm flex-shrink-0"
            style={{ background: color }}
          />
          <div className="flex-1">
            <span className="stat-label block">{label}</span>
            <span
              className="font-mono font-semibold block"
              style={{ fontSize: 13, color: '#f8fafc', lineHeight: 1 }}
            >
              {value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Bottom-left coordinates overlay
const CoordOverlay = ({ lat, lng }) => (
  <div
    className="absolute bottom-14 left-3 z-10 font-mono animate-fade-up delay-300"
    style={{ pointerEvents: 'none' }}
  >
    <span style={{ fontSize: 9, color: 'rgba(147,182,220,0.3)', letterSpacing: '0.05em' }}>
      ↑ {lat.toFixed(6)}
    </span>
    <br />
    <span style={{ fontSize: 9, color: 'rgba(147,182,220,0.3)', letterSpacing: '0.05em' }}>
      ↗ {lng.toFixed(5)}
    </span>
  </div>
);

// PARCELS-style monthly/yearly counter bottom-left (like the reference)
const ParcelsCounter = ({ monthly, yearly, isAnomaly }) => (
  <div
    className="absolute bottom-14 left-3 flex flex-col z-10 animate-fade-up delay-200"
    style={{ pointerEvents: 'none' }}
  >
    <div>
      <span className="stat-label">PARCELS Monthly</span>
      <div className="flex items-end gap-1.5">
        <span
          className="font-mono font-bold"
          style={{ fontSize: 22, color: '#f8fafc', letterSpacing: '-0.03em', lineHeight: 1 }}
        >
          {monthly.toLocaleString()}
        </span>
        <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>+45%</span>
      </div>
    </div>
    <div className="mt-1">
      <div className="flex items-end gap-1.5">
        <span className="stat-label">Yearly</span>
      </div>
      <div className="flex items-end gap-1.5">
        <span
          className="font-mono font-bold"
          style={{ fontSize: 18, color: '#94a3b8', letterSpacing: '-0.02em', lineHeight: 1 }}
        >
          {yearly.toLocaleString()}
        </span>
        <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>+12%</span>
      </div>
    </div>
  </div>
);

export { StatusCluster, CoordOverlay, ParcelsCounter };
