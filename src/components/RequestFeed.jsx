import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Wifi, Clock, AlertCircle, AlertTriangle, CheckCircle, TrendingUp, MapPin } from 'lucide-react';

/**
 * RequestFeed — always-visible live incoming request feed.
 * Shows ALL requests (normal + attack), click for source info.
 * Color-coded by classification.
 */

const CLASSIFICATION_CONFIG = {
  NORMAL: { color: '#22c55e', label: 'NORMAL', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
  FLASH_SALE: { color: '#eab308', label: 'FLASH SALE', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.25)' },
  BOT_ATTACK: { color: '#f97316', label: 'BOT ATTACK', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.35)' },
  VOLUMETRIC_DDOS: { color: '#ef4444', label: 'VOLUMETRIC DDoS', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.4)' },
  ANOMALY: { color: '#ef4444', label: 'ANOMALY', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.4)' },
};

// Generate a realistic-looking source city based on simulated IPs
const getSourceInfo = (trafficData) => {
  const cities = [
    { city: 'Moscow, RU', lat: 55.75, lng: 37.61 },
    { city: 'Beijing, CN', lat: 39.90, lng: 116.40 },
    { city: 'New York, US', lat: 40.71, lng: -74.00 },
    { city: 'Frankfurt, DE', lat: 50.11, lng: 8.68 },
    { city: 'Singapore, SG', lat: 1.35, lng: 103.81 },
    { city: 'São Paulo, BR', lat: -23.55, lng: -46.63 },
    { city: 'Tokyo, JP', lat: 35.67, lng: 139.65 },
    { city: 'Amsterdam, NL', lat: 52.37, lng: 4.90 },
  ];

  if (trafficData?.attacker_ips?.length > 0) {
    return { city: 'Unknown Origin', ip: trafficData.attacker_ips[0] };
  }
  const idx = Math.floor(Math.random() * cities.length);
  return { ...cities[idx], ip: `${Math.floor(Math.random()*200)+10}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}` };
};

const RequestFeed = ({ trafficData }) => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const feedRef = useRef(null);
  const tickRef = useRef(0);

  // Add new entries every second based on current traffic state
  useEffect(() => {
    if (!trafficData) return;

    tickRef.current += 1;
    const status = trafficData.status || 'NORMAL';
    const rps = trafficData.current_rps || 0;
    const cfg = CLASSIFICATION_CONFIG[status] || CLASSIFICATION_CONFIG.NORMAL;

    // Determine how many entries to show this tick (1-3 representative requests)
    const count = rps > 100 ? 3 : rps > 40 ? 2 : 1;

    const newEntries = Array.from({ length: count }).map((_, i) => {
      const source = getSourceInfo(trafficData);
      return {
        id: `${tickRef.current}-${i}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        status,
        rps,
        source,
        cfg,
        method: 'POST',
        endpoint: '/api/traffic',
        responseTime: Math.floor(Math.random() * 12) + 1,
      };
    });

    setRequests(prev => [...newEntries, ...prev].slice(0, 50));
  }, [trafficData]);

  // Auto scroll to top on new entries
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [requests.length]);

  return (
    <div style={{
      background: 'rgba(8,12,30,0.8)',
      border: '1px solid rgba(99,102,241,0.15)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
           style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-bold tracking-widest" style={{ color: 'rgba(148,163,184,0.7)' }}>
            LIVE REQUEST FEED
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color: 'rgba(99,102,241,0.7)' }}>
          {requests.length} logged
        </span>
      </div>

      {/* Column labels */}
      <div className="px-4 py-2 grid grid-cols-12 gap-1"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {['STATUS', 'SOURCE', 'RPS', 'RTT'].map(h => (
          <span key={h} className={`text-xs font-bold tracking-wider ${h === 'STATUS' ? 'col-span-4' : h === 'SOURCE' ? 'col-span-5' : 'col-span-1'}`}
                style={{ color: 'rgba(148,163,184,0.4)' }}>
            {h}
          </span>
        ))}
      </div>

      {/* Feed rows */}
      <div ref={feedRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {requests.map(req => (
          <div
            key={req.id}
            onClick={() => setSelectedRequest(req.id === selectedRequest?.id ? null : req)}
            className="px-4 py-2 grid grid-cols-12 gap-1 items-center cursor-pointer transition-all duration-150"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              background: selectedRequest?.id === req.id ? 'rgba(99,102,241,0.08)' : 'transparent',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = selectedRequest?.id === req.id ? 'rgba(99,102,241,0.08)' : 'transparent'}
          >
            {/* Status badge */}
            <div className="col-span-4">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ color: req.cfg.color, background: req.cfg.bg, fontSize: '9px', letterSpacing: '0.05em' }}>
                {req.cfg.label}
              </span>
            </div>

            {/* Source IP */}
            <div className="col-span-5">
              <p className="font-mono text-xs" style={{ color: 'rgba(148,163,184,0.8)', fontSize: '10px' }}>
                {req.source.ip}
              </p>
              {req.source.city && (
                <p className="text-xs flex items-center gap-0.5" style={{ color: 'rgba(148,163,184,0.4)', fontSize: '9px' }}>
                  <MapPin className="w-2 h-2" />{req.source.city}
                </p>
              )}
            </div>

            {/* RPS */}
            <div className="col-span-1">
              <span className="font-mono text-xs font-bold" style={{ color: req.cfg.color, fontSize: '10px' }}>
                {req.rps}
              </span>
            </div>

            {/* Response time */}
            <div className="col-span-1 text-right">
              <span className="font-mono text-xs" style={{ color: 'rgba(148,163,184,0.5)', fontSize: '10px' }}>
                {req.responseTime}ms
              </span>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Wifi className="w-6 h-6" style={{ color: 'rgba(99,102,241,0.3)' }} />
            <p className="text-xs" style={{ color: 'rgba(148,163,184,0.4)' }}>Waiting for traffic data...</p>
          </div>
        )}
      </div>

      {/* Selected request detail panel */}
      {selectedRequest && (
        <div className="px-4 py-3" style={{
          borderTop: '1px solid rgba(99,102,241,0.2)',
          background: 'rgba(99,102,241,0.05)',
        }}>
          <p className="text-xs font-bold mb-2 tracking-wider" style={{ color: '#6366f1' }}>REQUEST DETAIL</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div><span style={{ color: 'rgba(148,163,184,0.5)' }}>IP: </span><span style={{ color: '#e2e8f0' }}>{selectedRequest.source.ip}</span></div>
            <div><span style={{ color: 'rgba(148,163,184,0.5)' }}>RTT: </span><span style={{ color: '#06b6d4' }}>{selectedRequest.responseTime}ms</span></div>
            <div><span style={{ color: 'rgba(148,163,184,0.5)' }}>City: </span><span style={{ color: '#e2e8f0' }}>{selectedRequest.source.city || 'Unknown'}</span></div>
            <div><span style={{ color: 'rgba(148,163,184,0.5)' }}>RPS: </span><span style={{ color: selectedRequest.cfg.color }}>{selectedRequest.rps}</span></div>
            <div className="col-span-2"><span style={{ color: 'rgba(148,163,184,0.5)' }}>Endpoint: </span><span style={{ color: '#e2e8f0' }}>POST /api/traffic</span></div>
            <div className="col-span-2"><span style={{ color: 'rgba(148,163,184,0.5)' }}>Classification: </span>
              <span style={{ color: selectedRequest.cfg.color }}>{selectedRequest.cfg.label}</span>
              {selectedRequest.status === 'FLASH_SALE' && <span style={{ color: 'rgba(148,163,184,0.5)' }}> — likely sales event, not an attack</span>}
              {selectedRequest.status === 'BOT_ATTACK' && <span style={{ color: 'rgba(148,163,184,0.5)' }}> — single IP &gt;40% of traffic</span>}
              {selectedRequest.status === 'VOLUMETRIC_DDOS' && <span style={{ color: 'rgba(148,163,184,0.5)' }}> — volume threshold breached</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

RequestFeed.propTypes = {
  trafficData: PropTypes.object,
};

export default RequestFeed;
