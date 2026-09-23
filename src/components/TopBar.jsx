import React, { useState, useEffect } from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';

const TopBar = ({ status, isConnected, activeView, onSearch }) => {
  const [time, setTime] = useState(new Date());
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isAnomaly = status === 'ANOMALY';

  return (
    <header
      className="flex items-center justify-between px-5 relative z-50"
      style={{
        height: 52,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(2,6,23,0.8)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}
    >
      {/* Left — breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: '#64748b' }}>Map</span>
        <span style={{ color: '#cbd5e1', fontSize: 12 }}>/</span>
        <span className="text-xs font-medium" style={{ color: '#64748b' }}>Departments</span>
        <span style={{ color: '#cbd5e1', fontSize: 12 }}>/</span>
        <span className="text-xs font-semibold" style={{ color: '#f8fafc' }}>{activeView || 'Status'}</span>
      </div>

      {/* Center — search bar placeholder matching dribbble */}
      <div className="flex items-center" style={{ flex: 1, maxWidth: 320, margin: '0 24px' }}>
        <div className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
          <Search size={14} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search location (e.g. London)" 
            className="bg-transparent border-none outline-none text-xs w-full text-slate-300 placeholder-slate-500" 
            onKeyDown={(e) => { 
              if(e.key === 'Enter') {
                if (onSearch) onSearch(e.target.value);
                e.target.value = '';
              }
            }} 
          />
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-3">
        {/* Actions matching dribbble (Premium button + User) */}
        <button
          onClick={() => alert("Premium upgraded!")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
          style={{
            background: 'rgba(34,197,94,0.1)',
            color: '#16a34a',
            border: '1px solid rgba(34,197,94,0.2)',
          }}
        >
          <span className="status-dot" style={{ background: '#16a34a', width: 6, height: 6 }} />
          PREMIUM
        </button>

        {/* User badge with dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            style={{
              background: profileOpen ? 'rgba(255,255,255,0.05)' : 'transparent',
              border: 'none',
              color: '#f8fafc',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                color: '#ffffff',
              }}
            >
              M
            </div>
            <span className="hidden sm:block">Timur K.</span>
            <ChevronDown size={12} style={{ color: '#64748b' }} />
          </button>

          {profileOpen && (
            <div 
              className="absolute right-0 mt-2 w-48 rounded-lg shadow-2xl py-1 z-[9999] animate-fade-up"
              style={{ background: '#0f172a', border: '1px solid #1e293b' }}
            >
              <div className="px-4 py-2 border-b border-slate-800">
                <p className="text-sm font-semibold text-white">Timur K.</p>
                <p className="text-xs text-slate-400">SOC Analyst L2</p>
              </div>
              <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">Profile Settings</button>
              <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">Preferences</button>
              <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 border-t border-slate-800 transition-colors">Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
