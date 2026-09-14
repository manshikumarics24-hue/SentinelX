import React, { useState, useEffect, useCallback } from 'react';
import DashboardHeader from './components/DashboardHeader';
import Globe3D from './components/Globe3D';
import LiveRpsChart from './components/LiveRpsChart';
import IncidentFeed from './components/IncidentFeed';
import MetricCards from './components/MetricCards';
import useTrafficWebSocket from './services/websocket';
import { getIncidents } from './services/api';

const App = () => {
  const [trafficHistory, setTrafficHistory] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [peakRps, setPeakRps] = useState(0);

  const { lastJsonMessage } = useTrafficWebSocket();

  const fetchIncidents = useCallback(async () => {
    try {
      const data = await getIncidents();
      setIncidents(data);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    if (lastJsonMessage) {
      setTrafficHistory((prev) => {
        const newHistory = [...prev, lastJsonMessage].slice(-30);
        return newHistory;
      });

      if (lastJsonMessage.current_rps > peakRps) {
        setPeakRps(lastJsonMessage.current_rps);
      }
    }
  }, [lastJsonMessage, peakRps]);

  const currentStatus = lastJsonMessage?.status || 'NORMAL';
  const currentRps = lastJsonMessage?.current_rps || 0;
  const isAnomaly = currentStatus === 'ANOMALY';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <DashboardHeader status={currentStatus} />

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-76px)]">
        {/* Center Panel - Globe */}
        <div className="lg:col-span-8 flex flex-col">
          <Globe3D isAnomaly={isAnomaly} />
        </div>

        {/* Right Sidebar - Metrics & Charts & Feed */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
          <MetricCards
            currentRps={currentRps}
            peakRps={peakRps}
            status={currentStatus}
          />

          <LiveRpsChart data={trafficHistory} />

          <div className="flex-1 min-h-0">
            <IncidentFeed incidents={incidents} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
