import { useState, useEffect, useRef, useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

export const DEFAULT_WS_URL = 'ws://localhost:8000/ws/traffic';

/**
 * Custom WebSocket hook to receive live DDoS telemetry.
 * Connects to ws://localhost:8000/ws/traffic with automatic reconnection.
 *
 * @param {Object} options
 * @param {string} [options.url] - WebSocket server URL
 * @param {boolean} [options.enableMockFallback=true] - When true and server is offline, generates realistic synthetic telemetry.
 * @param {function} [options.onMessage] - Callback triggered on each valid telemetry packet.
 * @returns {Object} { lastJsonMessage, readyState, isConnected, isMockMode, setMockMode }
 */
export const useTrafficStream = ({
  url = DEFAULT_WS_URL,
  enableMockFallback = true,
  onMessage = null
} = {}) => {
  const [mockActive, setMockActive] = useState(false);
  const [mockMessage, setMockMessage] = useState(null);
  const mockTimerRef = useRef(null);
  const mockTickCountRef = useRef(0);

  // Real WebSocket connection
  const { lastJsonMessage, readyState } = useWebSocket(url, {
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    retryOnError: true,
    onMessage: (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (onMessage) onMessage(parsed);
      } catch (err) {
        console.warn('Malformed WS message received:', event.data);
      }
    },
    onError: (event) => {
      // If server is not running, we handle fallback gracefully
      if (enableMockFallback && !mockActive) {
        setMockActive(true);
      }
    },
    onClose: () => {
      if (enableMockFallback && !mockActive) {
        setMockActive(true);
      }
    }
  });

  const isConnected = readyState === ReadyState.OPEN;

  // If live WebSocket connects successfully, disable mock fallback
  useEffect(() => {
    if (isConnected && mockActive) {
      setMockActive(false);
    }
  }, [isConnected, mockActive]);

  // Synthetic Telemetry Generator for Mock Testing
  // Simulates normal 12-24 RPS baseline, with periodic attack spikes to 95-135 RPS
  useEffect(() => {
    if (!mockActive && isConnected) {
      if (mockTimerRef.current) clearInterval(mockTimerRef.current);
      return;
    }

    mockTimerRef.current = setInterval(() => {
      mockTickCountRef.current += 1;
      const tick = mockTickCountRef.current;

      // Simulate an anomaly spike every 25 ticks for a duration of 8 ticks
      const isSpike = (tick % 30 >= 18 && tick % 30 <= 27);
      
      let rps;
      if (isSpike) {
        // Attack spike: 85 - 135 RPS
        rps = Math.floor(85 + Math.random() * 50);
      } else {
        // Normal baseline: 12 - 24 RPS
        rps = Math.floor(12 + Math.random() * 12);
      }

      const syntheticPacket = {
        timestamp: new Date().toISOString(),
        current_rps: rps,
        status: isSpike ? "ANOMALY" : "NORMAL",
        baseline_rps: 20,
        active_incident: isSpike
      };

      setMockMessage(syntheticPacket);
      if (onMessage) onMessage(syntheticPacket);
    }, 1000);

    return () => {
      if (mockTimerRef.current) clearInterval(mockTimerRef.current);
    };
  }, [mockActive, isConnected, onMessage]);

  const activeMessage = (isConnected && lastJsonMessage) ? lastJsonMessage : mockMessage;

  return {
    lastJsonMessage: activeMessage,
    readyState,
    isConnected,
    isMockMode: mockActive || !isConnected,
    setMockMode: setMockActive
  };
};

export default useTrafficStream;
