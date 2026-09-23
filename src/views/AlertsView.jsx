import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, Shield } from 'lucide-react';
import { resolveIncident } from '../services/api.js';

/**
 * AlertsView — shows real incidents logged in PostgreSQL by the anomaly detector.
 * Receives `incidents` (array) from App.jsx (fetched from /api/incidents).
 * The `onResolve` callback re-fetches incidents from the parent after resolving.
 */

const severityConfig = {
  CRITICAL: {
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    color: '#ef4444',
    icon: AlertTriangle,
  },
  WARNING: {
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    color: '#f59e0b',
    icon: AlertTriangle,
  },
  INFO: {
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.2)',
    color: '#2563eb',
    icon: Info,
  },
};

// Map backend `status` field → human-readable title and source hint
const statusLabel = {
  VOLUMETRIC_DDOS: 'Volumetric DDoS Attack',
  BOT_ATTACK:      'Targeted Bot Attack',
  FLASH_SALE:      'Flash Sale / Traffic Spike',
  NORMAL:          'System Normal',
};

const AlertsView = ({ incidents = [], onResolve }) => {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [resolving, setResolving] = useState(null);

  // Convert incident objects from backend shape to alert display shape
  const alerts = incidents.map(inc => ({
    id:         inc.id,
    time:       new Date(inc.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    severity:   inc.severity,          // CRITICAL | WARNING
    title:      statusLabel[inc.status] || inc.status,
    message:    inc.ai_explanation,
    source:     inc.attacker_ips?.slice(0, 2).join(' / ') || 'Unknown',
    source_count: inc.source_count,
    concentration: inc.top_source_concentration,
    detection_reason: inc.detection_reason,
    peak_rps:   inc.peak_rps,
    acknowledged: inc.resolved,
    dbId:       parseInt(inc.id, 10),
  }));

  const filtered =
    filterSeverity === 'ALL'
      ? alerts
      : alerts.filter(a => a.severity === filterSeverity);

  const unacked = alerts.filter(a => !a.acknowledged).length;

  const handleAcknowledge = async (alert) => {
    setResolving(alert.id);
    await resolveIncident(alert.dbId);
    if (onResolve) onResolve();        // re-fetch incidents in parent
    setResolving(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-up" style={{ background: 'transparent' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>
            Alerts &amp; Notifications
          </h2>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            {unacked} unacknowledged alert{unacked !== 1 ? 's' : ''} · {alerts.length} total (from PostgreSQL)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'CRITICAL', 'WARNING'].map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: filterSeverity === s ? '#2563eb' : '#fff',
                color: filterSeverity === s ? '#fff' : '#64748b',
                boxShadow: filterSeverity !== s ? '0 0 0 1px #e2e8f0' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* No data state */}
      {filtered.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 gap-4"
          style={{ color: '#94a3b8' }}
        >
          <Shield size={40} style={{ opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>
            {alerts.length === 0
              ? 'No incidents logged yet — run the traffic simulator to generate attacks.'
              : 'No alerts match the selected filter.'}
          </p>
        </div>
      )}

      {/* Alert list */}
      <div className="flex flex-col gap-3">
        {filtered.map(alert => {
          const config = severityConfig[alert.severity] || severityConfig.INFO;
          const Icon = config.icon;
          return (
            <div
              key={alert.id}
              className="rounded-xl p-4 flex gap-4"
              style={{
                background: alert.acknowledged ? '#fff' : config.bg,
                border: `1px solid ${alert.acknowledged ? '#e2e8f0' : config.border}`,
                opacity: alert.acknowledged ? 0.75 : 1,
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: `${config.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={18} color={config.color} />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                    {alert.title}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: `${config.color}15`,
                      color: config.color,
                      fontWeight: 700,
                    }}
                  >
                    {alert.severity}
                  </span>
                  {alert.peak_rps > 0 && (
                    <span
                      style={{
                        fontSize: 9,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(15,23,42,0.06)',
                        color: '#cbd5e1',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {alert.peak_rps} RPS peak
                    </span>
                  )}
                  {alert.acknowledged && <CheckCircle size={14} color="#16a34a" />}
                </div>
                <p style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 6 }}>
                  {alert.message}
                </p>
                <div className="flex items-center gap-4">
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{alert.time}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>
                    {alert.source_count || 0} source IPs · {alert.concentration || 0}% top-source share
                  </span>
                  {alert.source && (
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>
                      Attacker IPs: {alert.source}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 10,
                      color: '#94a3b8',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    #{alert.id}
                  </span>
                </div>
                <p style={{ fontSize: 10, color: '#64748b', marginTop: 5 }}>{alert.detection_reason}</p>
              </div>

              {!alert.acknowledged && (
                <button
                  onClick={() => handleAcknowledge(alert)}
                  disabled={resolving === alert.id}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    background: resolving === alert.id ? '#94a3b8' : '#2563eb',
                    color: '#fff',
                    border: 'none',
                    cursor: resolving === alert.id ? 'wait' : 'pointer',
                    alignSelf: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {resolving === alert.id ? 'Resolving…' : 'Acknowledge'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsView;
