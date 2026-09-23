import useWebSocket, { ReadyState } from 'react-use-websocket';
import { INITIAL_TRAFFIC_HISTORY } from '../mock/mockData.js';
import { useState, useEffect, useRef } from 'react';

// WebSocket hook with mock fallback
const WS_URL = 'ws://localhost:8001/ws/traffic';

const THREAT_TYPES = ['OAS', 'ODS', 'MAV', 'WAV', 'IDS', 'VUL', 'KAS', 'BAD', 'SPAM'];

const makeTrafficEvents = (count, isAttack = false) =>
  Array.from({ length: Math.min(count, 40) }, (_, i) => ({
    startLat: (i * 37 + 11) % 120 - 60,
    startLng: (i * 71 + 29) % 360 - 180,
    endLat: 12.9716,
    endLng: 77.5946,
    isMalicious: isAttack && i % 3 === 0,
    type: THREAT_TYPES[i % THREAT_TYPES.length],
  }));


export default function useTrafficWebSocket() {
  const [mockData, setMockData] = useState(INITIAL_TRAFFIC_HISTORY[INITIAL_TRAFFIC_HISTORY.length - 1]);
  const timerRef = useRef(null);

  const { lastJsonMessage, readyState } = useWebSocket(WS_URL, {
    onOpen: () => console.info('[WS] Connected to traffic stream'),
    onError: () => {/* silently fall back to mock */},
    shouldReconnect: () => true,
    reconnectAttempts: 3,
    reconnectInterval: 5000,
  });

  // If WebSocket disconnected / not available, drive UI with mock data
  useEffect(() => {
    if (readyState !== ReadyState.OPEN) {
      timerRef.current = setInterval(() => {
        setMockData(prev => {
          const rps = Math.max(5, Math.min(200, (prev?.current_rps ?? 18) + (Math.random() - 0.48) * 6));
          const isAnomaly = rps > 80;
          return {
            current_rps: Math.round(rps),
            baseline_rps: 20,
            status: isAnomaly ? 'ANOMALY' : 'NORMAL',
            timestamp: new Date().toISOString(),
            active_incident: isAnomaly,
            legitimate_rps: Math.round(rps),
            faulty_rps: 0,
            source_count: Math.max(1, Math.round(rps / 4)),
            top_source_concentration: 4,
            detection_reason: 'Traffic is within the expected baseline.',
            global_traffic_events: makeTrafficEvents(rps),
          };
        });
      }, 1800);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [readyState]);

  return {
    lastJsonMessage: readyState === ReadyState.OPEN ? lastJsonMessage : mockData,
    isConnected: readyState === ReadyState.OPEN,
  };
}
