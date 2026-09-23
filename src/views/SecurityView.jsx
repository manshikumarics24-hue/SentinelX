import React, { useState, useMemo } from 'react';
import { Shield, AlertTriangle, CheckCircle, Lock, Unlock, Eye, Filter, ChevronDown } from 'lucide-react';

const firewallRules = [
  { id: 'FW-001', name: 'Rate Limit - API Gateway', type: 'Rate Limit' },
  { id: 'FW-002', name: 'Bot Detection - Source Concentration', type: 'Bot Filter' },
  { id: 'FW-003', name: 'DDoS Shield - HTTP Flood', type: 'DDoS' },
  { id: 'FW-004', name: 'IP Blacklist - Detected Sources', type: 'Blacklist' },
];

const vulnerabilities = [
  { id: 'CVE-2026-4821', severity: 'CRITICAL', component: 'OpenSSL 3.1.x', description: 'Remote code execution via malformed certificate chain', status: 'Patched' },
  { id: 'CVE-2026-3190', severity: 'HIGH', component: 'Node.js Runtime', description: 'HTTP request smuggling in HTTP/2 implementation', status: 'Mitigated' },
  { id: 'CVE-2026-2847', severity: 'MEDIUM', component: 'Redis 7.2', description: 'Heap buffer overflow in CLUSTER SHARDS command', status: 'Monitoring' },
  { id: 'CVE-2026-1533', severity: 'LOW', component: 'Nginx 1.25', description: 'Information disclosure in error pages', status: 'Patched' },
];

// blockedIPs is derived from real incidents in the component below

const SecurityView = ({ incidents = [] }) => {
  const threatScore = Math.min(100, incidents.length ? 40 + (incidents.filter(i => i.severity === 'CRITICAL').length * 15) : 0);
  const threatLevel = threatScore >= 70 ? 'HIGH' : threatScore >= 40 ? 'ELEVATED' : 'GUARDED';
  const liveFirewallRules = firewallRules.map(rule => {
    const related = incidents.filter(incident => incident.status && rule.type === 'DDoS' ? incident.status.includes('DDOS') : rule.type === 'Bot Filter' ? incident.status === 'BOT_ATTACK' : rule.type === 'Blacklist' ? incident.attacker_ips?.length : true);
    const sources = related.flatMap(incident => incident.attacker_ips || []);
    return {
      ...rule,
      status: related.length ? 'active' : 'monitoring',
      hits: related.reduce((sum, incident) => sum + (incident.peak_rps || 0), 0),
      lastTriggered: related[0] ? new Date(related[0].timestamp).toLocaleTimeString() : 'No event',
      topSource: sources[0] || 'No source observed',
    };
  });
  // Build blocked IPs from real incident attacker_ips
  const blockedIPs = useMemo(() => {
    const ipMap = {};
    incidents.forEach(inc => {
      (inc.attacker_ips ?? []).forEach(ip => {
        if (!ipMap[ip]) {
          ipMap[ip] = { ip, reason: inc.status?.replace('_', ' ') ?? 'Unknown', attempts: 0, blockedAt: new Date(inc.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) + ' IST' };
        }
        ipMap[ip].attempts += inc.peak_rps ?? 0;
      });
    });
    return Object.values(ipMap).sort((a, b) => b.attempts - a.attempts).slice(0, 10);
  }, [incidents]);
  const [activeTab, setActiveTab] = useState('rules');

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-up" style={{ background: 'transparent' }}>
      {/* Threat Level Banner */}
      <div className="rounded-xl p-4 mb-6 flex items-center gap-4" style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.08))',
        border: '1px solid rgba(245,158,11,0.2)',
      }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={28} color="#f59e0b" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{threatLevel}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Threat Score: {threatScore}/100</span>
          </div>
          <p style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>{incidents.length ? 'Derived from persisted incident telemetry and source concentration.' : 'No persisted incidents currently require escalation.'}</p>
        </div>
        <div style={{ width: 80, height: 80, position: 'relative' }}>
          <svg viewBox="0 0 36 36" style={{ width: 80, height: 80, transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f59e0b" strokeWidth="3"
              strokeDasharray={`${threatScore} ${100 - threatScore}`} strokeLinecap="round" />
          </svg>
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>{threatScore}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 rounded-lg p-0.5" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
        {[
          { id: 'rules', label: 'Firewall Rules' },
          { id: 'vulns', label: 'Vulnerabilities' },
          { id: 'blocked', label: 'Blocked IPs' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
            background: activeTab === tab.id ? '#2563eb' : 'transparent',
            color: activeTab === tab.id ? '#fff' : '#64748b',
            transition: 'all 0.15s',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Firewall rules */}
      {activeTab === 'rules' && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Rule ID</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Type</th>
                <th style={{ textAlign: 'center', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Top Source</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Hits</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Last Triggered</th>
              </tr>
            </thead>
            <tbody>
              {liveFirewallRules.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'JetBrains Mono', color: '#2563eb', fontWeight: 600 }}>{r.id}</td>
                  <td style={{ padding: '10px 16px', color: '#e2e8f0', fontWeight: 500 }}>{r.name}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(37,99,235,0.08)', color: '#2563eb', fontWeight: 600 }}>{r.type}</span>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                      background: r.status === 'active' ? 'rgba(22,163,74,0.1)' : 'rgba(148,163,184,0.15)',
                      color: r.status === 'active' ? '#16a34a' : '#94a3b8',
                    }}>{r.status.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#94a3b8', fontWeight: 500 }}>{r.topSource}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'JetBrains Mono', color: '#f8fafc' }}>{r.hits.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#94a3b8' }}>{r.lastTriggered}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vulnerabilities */}
      {activeTab === 'vulns' && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>CVE</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Severity</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Component</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Description</th>
                <th style={{ textAlign: 'center', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {vulnerabilities.map(v => (
                <tr key={v.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'JetBrains Mono', color: '#2563eb', fontWeight: 600 }}>{v.id}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700,
                      background: v.severity === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : v.severity === 'HIGH' ? 'rgba(245,158,11,0.1)' : v.severity === 'MEDIUM' ? 'rgba(37,99,235,0.1)' : 'rgba(148,163,184,0.1)',
                      color: v.severity === 'CRITICAL' ? '#ef4444' : v.severity === 'HIGH' ? '#f59e0b' : v.severity === 'MEDIUM' ? '#2563eb' : '#94a3b8',
                    }}>{v.severity}</span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#e2e8f0', fontWeight: 500 }}>{v.component}</td>
                  <td style={{ padding: '10px 16px', color: '#94a3b8', maxWidth: 300 }}>{v.description}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                      background: v.status === 'Patched' ? 'rgba(22,163,74,0.1)' : v.status === 'Mitigated' ? 'rgba(37,99,235,0.1)' : 'rgba(245,158,11,0.1)',
                      color: v.status === 'Patched' ? '#16a34a' : v.status === 'Mitigated' ? '#2563eb' : '#f59e0b',
                    }}>{v.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Blocked IPs */}
      {activeTab === 'blocked' && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>IP Address</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Origin</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Reason</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Attempts</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', color: '#94a3b8', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Blocked At</th>
              </tr>
            </thead>
            <tbody>
              {blockedIPs.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                    No attacker IPs logged yet — run the traffic simulator to generate incidents.
                  </td>
                </tr>
              )}
              {blockedIPs.map(ip => (
                <tr key={ip.ip} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'JetBrains Mono', color: '#ef4444', fontWeight: 600 }}>{ip.ip}</td>
                  <td style={{ padding: '10px 16px', color: '#94a3b8' }}>{ip.reason}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'JetBrains Mono', color: '#f8fafc', fontWeight: 600 }}>{ip.attempts.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#94a3b8' }}>{ip.blockedAt}</td>
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
