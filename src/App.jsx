import React, { useState, useEffect, useCallback } from 'react';

/* ── New Cyber UI Components ─────────────────────────────────────────── */
import CyberTopBar from './components/CyberTopBar.jsx';
import BottomThreatBar from './components/BottomThreatBar.jsx';
import AIPopupPanel from './components/AIPopupPanel.jsx';
import GlobeControlsOverlay from './components/GlobeControlsOverlay.jsx';

/* ── Map & existing components ───────────────────────────────────────── */
import Globe3D from './components/Globe3D.jsx';
import Map2D from './components/Map2D.jsx';
import IncidentDrawer from './components/IncidentDrawer.jsx';

/* ── Sub-views (slide-in drawer mode) ───────────────────────────────── */
import DashboardView from './views/DashboardView.jsx';
import TrafficView from './views/TrafficView.jsx';
import SecurityView from './views/SecurityView.jsx';
import AlertsView from './views/AlertsView.jsx';
import SettingsView from './views/SettingsView.jsx';

/* ── Data ────────────────────────────────────────────────────────────── */
import useTrafficWebSocket from './services/websocket.js';
import { getIncidents, getStats } from './services/api.js';
import { INITIAL_TRAFFIC_HISTORY, TARGET_SERVER, STATS } from './mock/mockData.js';

const App = () => {
  const [trafficHistory, setTrafficHistory] = useState(INITIAL_TRAFFIC_HISTORY);
  const [incidents, setIncidents]           = useState([]);
  const [backendStats, setBackendStats]     = useState(null);
  const [peakRps, setPeakRps]               = useState(0);
  const [view3D, setView3D]                 = useState(true);
  const [activeTab, setActiveTab]           = useState('map');
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [drawerView, setDrawerView]         = useState(null);
  const [liveThreat, setLiveThreat]         = useState(null);
  const [searchedCity, setSearchedCity]     = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const threatTimerRef = React.useRef(null);
  const globeRef       = React.useRef(null);

  const { lastJsonMessage, isConnected } = useTrafficWebSocket();

  // ── Fetch real data from backend ──────────────────────────────────────
  const fetchIncidents = useCallback(async () => {
    const data = await getIncidents();
    if (data && data.length > 0) setIncidents(data);
  }, []);

  const fetchStats = useCallback(async () => {
    const data = await getStats();
    setBackendStats(data);
  }, []);

  useEffect(() => {
    fetchIncidents();
    fetchStats();
    const incTimer  = setInterval(fetchIncidents, 15_000);
    const statTimer = setInterval(fetchStats, 30_000);
    return () => { clearInterval(incTimer); clearInterval(statTimer); };
  }, [fetchIncidents, fetchStats]);

  // ── WebSocket data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!lastJsonMessage) return;
    setTrafficHistory(prev =>
      [...prev, {
        t:        Date.now(),
        rps:      lastJsonMessage.current_rps ?? 0,
        baseline: lastJsonMessage.baseline_rps ?? 50,
        status:   lastJsonMessage.status ?? 'NORMAL',
      }].slice(-60),
    );
    if ((lastJsonMessage.current_rps ?? 0) > peakRps) {
      setPeakRps(lastJsonMessage.current_rps ?? 0);
    }
    if (lastJsonMessage.is_attack) {
      setLiveThreat(lastJsonMessage);
      clearTimeout(threatTimerRef.current);
      threatTimerRef.current = setTimeout(() => setLiveThreat(null), 20_000);
      setTimeout(fetchIncidents, 3000);
    }
  }, [lastJsonMessage, fetchIncidents]);

  // ── Derived state ──────────────────────────────────────────────────────
  const status             = lastJsonMessage?.status             ?? 'NORMAL';
  const currentRps         = lastJsonMessage?.current_rps        ?? 0;
  const isAnomaly          = ['ANOMALY', 'VOLUMETRIC_DDOS', 'BOT_ATTACK'].includes(status);
  const activeThreatNodes  = lastJsonMessage?.active_threat_nodes  ?? [];
  const globalTrafficEvents = lastJsonMessage?.global_traffic_events ?? [];
  const aiInsights         = lastJsonMessage?.ai_insights         ?? [];

  // ── Drawer tab handler ──────────────────────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'map') {
      setDrawerOpen(false);
      setDrawerView(null);
    } else {
      const viewMap = {
        statistics: 'Dashboard',
        sources:    'Traffic',
        ai:         'Security',
      };
      setDrawerView(viewMap[tab] ?? null);
      setDrawerOpen(true);
    }
  };

  // ── Render sub-view for drawer ─────────────────────────────────────────
  const renderDrawerContent = () => {
    switch (drawerView) {
      case 'Dashboard': return <DashboardView backendStats={backendStats} incidents={incidents} />;
      case 'Traffic':   return <TrafficView trafficHistory={trafficHistory} currentRps={currentRps} />;
      case 'Security':  return <SecurityView incidents={incidents} />;
      case 'Alerts':    return <AlertsView incidents={incidents} onResolve={fetchIncidents} />;
      case 'Settings':  return <SettingsView />;
      default:          return null;
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#000010',
        position: 'relative',
      }}
    >
      {/* ── Layer 0: Full-screen globe / map ────────────────────────────── */}
      {view3D ? (
        <Globe3D
          isAnomaly={isAnomaly}
          globeRef={globeRef}
          searchedCity={searchedCity}
          activeThreatNodes={activeThreatNodes}
          trafficEvents={globalTrafficEvents}
        />
      ) : (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          <Map2D
            isAnomaly={isAnomaly}
            searchedCity={searchedCity}
            activeThreatNodes={activeThreatNodes}
            trafficEvents={globalTrafficEvents}
          />
        </div>
      )}

      {/* ── Layer 1: Top navigation bar ─────────────────────────────────── */}
      <CyberTopBar
        status={status}
        isConnected={isConnected}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onToggleIncidents={() => setDrawerOpen(o => !o)}
      />

      {/* ── Layer 2: Attack status banner ───────────────────────────────── */}
      {isAnomaly && (
        <div
          className="animate-fade-up"
          style={{
            position: 'fixed',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 95,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 18px',
            borderRadius: 5,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.35)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <span
            className="status-dot status-dot-pulse"
            style={{ background: '#ef4444', width: 6, height: 6 }}
          />
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: '#f87171',
              textTransform: 'uppercase',
            }}
          >
            {status.replace(/_/g, ' ')} — {currentRps} RPS
          </span>
        </div>
      )}

      {/* ── Layer 3: AI Popup Panel (left side, attack details) ─────────── */}
      <AIPopupPanel
        trafficData={liveThreat ?? lastJsonMessage}
        aiInsights={aiInsights}
        incidents={incidents}
      />

      {/* ── Layer 4: Globe controls (right side) ────────────────────────── */}
      <GlobeControlsOverlay
        view3D={view3D}
        setView3D={setView3D}
        globeRef={globeRef}
        currentRps={currentRps}
        isAnomaly={isAnomaly}
        targetServer={TARGET_SERVER}
      />

      {/* ── Layer 5: Sub-view slide-in panel (full height, right side) ──── */}
      {drawerOpen && (
        <div
          className="animate-slide-right"
          style={{
            position: 'fixed',
            top: 52,
            right: 0,
            bottom: 56,
            width: 'min(580px, 92vw)',
            zIndex: 80,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(0, 2, 12, 0.94)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderLeft: '1px solid rgba(96,165,250,0.12)',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Drawer header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 20px',
              borderBottom: '1px solid rgba(96,165,250,0.1)',
              flexShrink: 0,
              background: 'rgba(0,2,12,0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 3,
                  height: 14,
                  borderRadius: 2,
                  background: '#60a5fa',
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#60a5fa',
                }}
              >
                {drawerView ?? 'Panel'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Nav within drawer */}
              {['Dashboard', 'Traffic', 'Security', 'Alerts'].map(v => (
                <button
                  key={v}
                  onClick={() => setDrawerView(v)}
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: 3,
                    border: 'none',
                    cursor: 'pointer',
                    background: drawerView === v ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                    color: drawerView === v ? '#60a5fa' : 'rgba(148,163,184,0.6)',
                    transition: 'all 0.15s',
                  }}
                >
                  {v}
                </button>
              ))}
              <button
                onClick={() => { setDrawerOpen(false); setActiveTab('map'); }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  lineHeight: 1,
                  marginLeft: 4,
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {renderDrawerContent()}
          </div>
        </div>
      )}


      {/* ── Layer 5b: Incident drawer (always accessible) ───────────────── */}
      <IncidentDrawer incidents={incidents} />

      {/* ── Layer 6: Bottom threat category bar ─────────────────────────── */}
      <BottomThreatBar
        trafficEvents={globalTrafficEvents}
        isAnomaly={isAnomaly}
        activeCategory={activeCategory}
        onCategoryClick={setActiveCategory}
      />
    </div>
  );
};

export default App;
