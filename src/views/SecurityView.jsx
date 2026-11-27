import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield, AlertTriangle, CheckCircle, Lock, Unlock,
  Eye, Filter, Plus, Trash2, RefreshCw
} from 'lucide-react';
import { getBlockedIps, blockIp, unblockIp } from '../services/api.js';

const firewallRules = [
  { id: 'FW-001', name: 'Rate Limit - Global Ingestion', type: 'Rate Limit' },
  { id: 'FW-002', name: 'Entropy Defense - Bot Clustering', type: 'Bot Filter' },
  { id: 'FW-003', name: 'Volumetric Shield - L7 Flood', type: 'DDoS' },
  { id: 'FW-004', name: 'Active Redis Quarantine Blacklist', type: 'Blacklist' },
];

const vulnerabilities = [
  { id: 'CVE-2026-4821', severity: 'CRITICAL', component: 'OpenSSL 3.1.x', description: 'Remote code execution via malformed certificate chain', status: 'Patched' },
  { id: 'CVE-2026-3190', severity: 'HIGH', component: 'Node.js Runtime', description: 'HTTP request smuggling in HTTP/2 implementation', status: 'Mitigated' },
  { id: 'CVE-2026-2847', severity: 'MEDIUM', component: 'Redis 7.2', description: 'Heap buffer overflow in CLUSTER SHARDS command', status: 'Monitoring' },
  { id: 'CVE-2026-1533', severity: 'LOW', component: 'Nginx 1.25', description: 'Information disclosure in error pages', status: 'Patched' },
];

const SecurityView = ({ incidents = [] }) => {
  const [activeTab, setActiveTab] = useState('rules');
  const [redisBlocked, setRedisBlocked] = useState([]);
  const [manualIp, setManualIp] = useState('');
  const [actionMsg, setActionMsg] = useState(null);

  const fetchBlocked = useCallback(async () => {
    const list = await getBlockedIps();
    if (Array.isArray(list)) setRedisBlocked(list);
  }, []);

  useEffect(() => {
    fetchBlocked();
    const interval = setInterval(fetchBlocked, 5000);
    return () => clearInterval(interval);
  }, [fetchBlocked]);

  const handleManualBlock = async (e) => {
    e.preventDefault();
    if (!manualIp.trim()) return;
    const res = await blockIp(manualIp.trim(), 300, 'Manual SOC Intervention');
    if (res?.success) {
      setActionMsg(`IP ${manualIp.trim()} quarantined in Redis firewall.`);
      setManualIp('');
      fetchBlocked();
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const handleUnblock = async (ip) => {
    const res = await unblockIp(ip);
    if (res?.success) {
      setActionMsg(`Quarantine lifted for ${ip}.`);
      fetchBlocked();
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const threatScore = Math.min(100, incidents.length ? 40 + (incidents.filter(i => i.severity === 'CRITICAL').length * 15) : 0);
  const threatLevel = threatScore >= 70 ? 'CRITICAL DEFENSE' : threatScore >= 40 ? 'ELEVATED' : 'NOMINAL';

  const liveFirewallRules = firewallRules.map(rule => {
    const related = incidents.filter(incident => {
      if (!incident.status) return false;
      if (rule.type === 'DDoS') return incident.status.includes('DDOS');
      if (rule.type === 'Bot Filter') return incident.status === 'BOT_ATTACK';
      if (rule.type === 'Blacklist') return (incident.attacker_ips?.length ?? 0) > 0 || redisBlocked.length > 0;
      return true;
    });
    const sources = related.flatMap(incident => incident.attacker_ips || []);
    return {
      ...rule,
      status: related.length ? 'enforced' : 'monitoring',
      hits: related.reduce((sum, incident) => sum + (incident.peak_rps || 0), 0),
      lastTriggered: related[0] ? new Date(related[0].timestamp).toLocaleTimeString() : 'Standby',
      topSource: sources[0] || (redisBlocked[0]?.ip ?? 'None active'),
    };
  });

  const cardStyle = {
    background: 'rgba(8, 10, 14, 0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-up" style={{ background: 'transparent' }}>
      {/* Threat Level Banner */}
      <div
        className="rounded-xl p-4 mb-5 flex items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(245,158,11,0.06) 100%)',
          border: '1px solid rgba(239,68,68,0.22)',
        }}
      >
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={24} color="#ef4444" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', letterSpacing: '0.04em' }}>{threatLevel}</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Overall SOC Confidence: {threatScore}/100</span>
          </div>
          <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 3 }}>
            Active Inline Defense: Redis firewall drops quarantined IPs at ingestion with HTTP 403 Forbidden.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
            {redisBlocked.length}
          </span>
          <span style={{ display: 'block', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Active Bans
          </span>
        </div>
      </div>

      {actionMsg && (
        <div
          style={{
            marginBottom: 16,
            padding: '8px 14px',
            borderRadius: 6,
            background: 'rgba(34,197,94,0.12)',
            border: '1px solid rgba(34,197,94,0.3)',
            fontSize: 11,
            fontWeight: 600,
            color: '#4ade80',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle size={14} />
          {actionMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 rounded-lg p-0.5" style={{ background: 'rgba(8,10,14,0.9)', border: '1px solid rgba(255,255,255,0.08)', width: 'fit-content' }}>
        {[
          { id: 'rules', label: 'Firewall Rules' },
          { id: 'blocked', label: `Quarantined IPs (${redisBlocked.length})` },
          { id: 'vulns', label: 'Vulnerabilities' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === tab.id ? '#0284c7' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#64748b',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Firewall rules */}
      {activeTab === 'rules' && (
        <div className="rounded-xl overflow-hidden" style={cardStyle}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Rule ID</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Defense Engine</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Type</th>
                <th style={{ textAlign: 'center', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>State</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Active Target Source</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Total Hits</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Telemetry Sync</th>
              </tr>
            </thead>
            <tbody>
              {liveFirewallRules.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'JetBrains Mono', color: '#38bdf8', fontWeight: 600 }}>{r.id}</td>
                  <td style={{ padding: '10px 16px', color: '#f8fafc', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', color: '#94a3b8' }}>
                      {r.type}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700,
                      background: r.status === 'enforced' ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.12)',
                      color: r.status === 'enforced' ? '#4ade80' : '#94a3b8',
                    }}>
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>{r.topSource}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'JetBrains Mono', color: '#f8fafc' }}>{r.hits.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#94a3b8' }}>{r.lastTriggered}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quarantined IPs (Redis Active Firewall) */}
      {activeTab === 'blocked' && (
        <div className="flex flex-col gap-4">
          {/* Manual Quarantine Form */}
          <form onSubmit={handleManualBlock} className="p-4 flex items-center gap-3" style={cardStyle}>
            <Lock size={16} color="#ef4444" />
            <input
              type="text"
              placeholder="Enter IP address to quarantine (e.g. 185.191.171.12)..."
              value={manualIp}
              onChange={e => setManualIp(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 11,
                fontFamily: 'JetBrains Mono',
                background: 'rgba(255,255,255,0.02)',
                color: '#f8fafc',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Plus size={14} />
              Quarantine IP (5m)
            </button>
            <button
              type="button"
              onClick={fetchBlocked}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.05)',
                color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <RefreshCw size={13} />
              Sync
            </button>
          </form>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={cardStyle}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Target IP</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Mitigation Reason</th>
                  <th style={{ textAlign: 'center', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Firewall State</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>TTL Remaining</th>
                  <th style={{ textAlign: 'center', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {redisBlocked.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>
                      No IP addresses currently quarantined. Attackers exceeding concentration limits will appear here automatically.
                    </td>
                  </tr>
                ) : (
                  redisBlocked.map(b => (
                    <tr key={b.ip} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 16px', fontFamily: 'JetBrains Mono', color: '#ef4444', fontWeight: 600 }}>{b.ip}</td>
                      <td style={{ padding: '10px 16px', color: '#cbd5e1' }}>{b.reason}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                          QUARANTINED
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'JetBrains Mono', color: '#38bdf8' }}>
                        {b.ttl_seconds}s
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleUnblock(b.ip)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#e2eaf4',
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Unlock size={11} color="#4ade80" />
                          Release
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vulnerabilities */}
      {activeTab === 'vulns' && (
        <div className="rounded-xl overflow-hidden" style={cardStyle}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>CVE ID</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Severity</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Component</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Advisory Details</th>
                <th style={{ textAlign: 'center', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>SOC Remediation</th>
              </tr>
            </thead>
            <tbody>
              {vulnerabilities.map(v => (
                <tr key={v.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'JetBrains Mono', color: '#38bdf8', fontWeight: 600 }}>{v.id}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700,
                      background: v.severity === 'CRITICAL' ? 'rgba(239,68,68,0.12)' : v.severity === 'HIGH' ? 'rgba(245,158,11,0.12)' : 'rgba(37,99,235,0.12)',
                      color: v.severity === 'CRITICAL' ? '#ef4444' : v.severity === 'HIGH' ? '#f59e0b' : '#38bdf8',
                    }}>
                      {v.severity}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#e2e8f0', fontWeight: 500 }}>{v.component}</td>
                  <td style={{ padding: '10px 16px', color: '#94a3b8', maxWidth: 300 }}>{v.description}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                      background: v.status === 'Patched' ? 'rgba(34,197,94,0.12)' : 'rgba(37,99,235,0.12)',
                      color: v.status === 'Patched' ? '#4ade80' : '#38bdf8',
                    }}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SecurityView;
