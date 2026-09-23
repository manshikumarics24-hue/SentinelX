import React from 'react';
import { Globe, Map, Plus, Minus, Crosshair } from 'lucide-react';

const GlobeControlsOverlay = ({
  view3D,
  setView3D,
  globeRef,
  currentRps,
  isAnomaly,
  targetServer,
}) => {
  const handleZoomIn = () => {
    if (!globeRef?.current) return;
    const alt = globeRef.current.pointOfView().altitude;
    globeRef.current.pointOfView({ altitude: Math.max(0.15, alt - 0.4) }, 350);
  };

  const handleZoomOut = () => {
    if (!globeRef?.current) return;
    const alt = globeRef.current.pointOfView().altitude;
    globeRef.current.pointOfView({ altitude: Math.min(5, alt + 0.4) }, 350);
  };

  const handleRecenter = () => {
    if (!globeRef?.current || !targetServer) return;
    globeRef.current.pointOfView(
      { lat: targetServer.lat, lng: targetServer.lng, altitude: 1.9 },
      800,
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* 3D / 2D toggle */}
      <div
        style={{
          background: 'rgba(0, 3, 15, 0.82)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(96, 165, 250, 0.12)',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {[
          { v: true,  label: '3D', Icon: Globe },
          { v: false, label: '2D', Icon: Map   },
        ].map(({ v, label, Icon }) => (
          <button
            key={label}
            title={`Switch to ${label} view`}
            onClick={() => setView3D(v)}
            style={{
              width: 38,
              height: 38,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              cursor: 'pointer',
              border: 'none',
              borderBottom: v ? '1px solid rgba(255,255,255,0.05)' : 'none',
              background: view3D === v
                ? 'rgba(96,165,250,0.15)'
                : 'transparent',
              color: view3D === v ? '#60a5fa' : 'rgba(148,163,184,0.5)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (view3D !== v) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#e2eaf4';
              }
            }}
            onMouseLeave={e => {
              if (view3D !== v) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(148,163,184,0.5)';
              }
            }}
          >
            <Icon size={13} />
            <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.06em' }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Zoom controls */}
      <div
        style={{
          background: 'rgba(0, 3, 15, 0.82)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(96, 165, 250, 0.12)',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {[
          { label: 'Zoom in',  Icon: Plus,      action: handleZoomIn   },
          { label: 'Zoom out', Icon: Minus,     action: handleZoomOut  },
          { label: 'Recenter', Icon: Crosshair, action: handleRecenter },
        ].map(({ label, Icon, action }, i, arr) => (
          <button
            key={label}
            title={label}
            onClick={action}
            style={{
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              background: 'transparent',
              color: 'rgba(148,163,184,0.5)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#60a5fa';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(148,163,184,0.5)';
            }}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>

      {/* Live RPS readout */}
      <div
        style={{
          background: 'rgba(0, 3, 15, 0.82)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: `1px solid ${isAnomaly ? 'rgba(248,113,113,0.25)' : 'rgba(96,165,250,0.12)'}`,
          borderRadius: 8,
          padding: '6px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          minWidth: 38,
          transition: 'border-color 0.4s',
        }}
      >
        <span
          style={{
            fontSize: 7,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'rgba(148,163,184,0.5)',
            textTransform: 'uppercase',
          }}
        >
          RPS
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 13,
            fontWeight: 800,
            lineHeight: 1,
            color: isAnomaly ? '#f87171' : '#60a5fa',
            letterSpacing: '-0.02em',
            transition: 'color 0.4s',
          }}
        >
          {currentRps}
        </span>
        {isAnomaly && (
          <span
            className="status-dot status-dot-pulse"
            style={{ background: '#ef4444', width: 5, height: 5 }}
          />
        )}
      </div>
    </div>
  );
};

export default GlobeControlsOverlay;
