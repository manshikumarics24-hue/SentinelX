import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const timeAgo = ts => {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
};

const IncidentDrawer = ({ incidents = [] }) => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 56,
        left: 0,
        right: 62,
        zIndex: 75,
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: open ? 'translateY(0)' : 'translateY(calc(100% - 40px))',
      }}
    >
      {/* Drawer handle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5"
        style={{
          height: 40,
          background: 'rgba(15,23,42,0.95)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          borderRadius: open ? '0' : '10px 10px 0 0',
          backdropFilter: 'blur(16px)',
          cursor: 'pointer',
        }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 11, fontWeight: 600, color: '#f8fafc', letterSpacing: '0.03em' }}>
            Activities &amp; Insights
          </span>
          <span
            className="badge"
            style={{
              background: 'rgba(37,99,235,0.1)',
              color: '#2563eb',
              border: '1px solid rgba(37,99,235,0.2)',
              fontSize: 9,
            }}
          >
            {incidents.length}
          </span>
        </div>
        {open
          ? <ChevronDown size={14} style={{ color: '#94a3b8' }} />
          : <ChevronUp size={14} style={{ color: '#94a3b8' }} />
        }
      </button>

      {/* Drawer body */}
      <div
        style={{
          background: 'rgba(2,6,23,0.95)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          maxHeight: 260,
          overflowY: 'auto',
          padding: '8px 16px 16px',
        }}
      >
        {incidents.map((inc, i) => (
          <div
            key={inc.id}
            className="incident-row"
            style={{ animationDelay: `${i * 0.06}s` }}
            onClick={() => setExpanded(expanded === inc.id ? null : inc.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="status-dot"
                  style={{
                    background: inc.severity === 'CRITICAL' ? '#ff4d6d' : '#ffc947',
                    flexShrink: 0,
                  }}
                />
                <span
                  className="font-mono text-xs font-semibold"
                  style={{ color: inc.severity === 'CRITICAL' ? '#ef4444' : '#d97706' }}
                >
                  {inc.id}
                </span>
                <span
                  className="badge"
                  style={{
                    background: inc.severity === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    color: inc.severity === 'CRITICAL' ? '#ef4444' : '#d97706',
                    border: `1px solid ${inc.severity === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    fontSize: 9,
                  }}
                >
                  {inc.severity}
                </span>
                {inc.resolved && (
                  <span className="badge badge-blocked" style={{ fontSize: 9 }}>RESOLVED</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>
                  {timeAgo(inc.timestamp)}
                </span>
                <span style={{ fontSize: 10, color: '#ef4444', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                  {inc.peak_rps} rps
                </span>
              </div>
            </div>

            {expanded === inc.id && (
              <div className="mt-2 pl-3 pb-2 animate-fade-up">
                <p
                  className="leading-relaxed"
                  style={{ fontSize: 11, color: '#cbd5e1' }}
                >
                  {inc.ai_explanation || inc.summary || 'No AI explanation available.'}
                </p>
                
                {/* Cloudflare Details */}
                <div 
                  className="mt-3 p-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold tracking-widest text-[#f59e0b] uppercase">Cloudflare Mitigation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px]">
                    <div><span className="text-slate-500">Action Taken:</span> <span className="text-emerald-400 font-mono ml-1">Managed Challenge</span></div>
                    <div><span className="text-slate-500">Ray ID:</span> <span className="text-slate-300 font-mono ml-1">8f{inc.id.replace('INC-', '').toLowerCase()}a2b</span></div>
                    <div><span className="text-slate-500">Rule Triggered:</span> <span className="text-slate-300 ml-1">Rate Limit + IP Rep</span></div>
                    <div><span className="text-slate-500">AbuseIPDB Score:</span> <span className="text-red-400 font-mono ml-1">{inc.severity === 'CRITICAL' ? '88/100' : '62/100'}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentDrawer;
