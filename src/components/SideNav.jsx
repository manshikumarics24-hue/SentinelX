import React from 'react';
import {
  Globe,
  LayoutDashboard,
  Shield,
  Activity,
  Bell,
  Map,
  Settings,
  User,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Globe, label: 'Global View' },
  { icon: Activity, label: 'Traffic' },
  { icon: Shield, label: 'Security' },
  { icon: Bell, label: 'Alerts', badge: 3 },
  { icon: Map, label: 'Map' },
];

const SideNav = ({ activeView, setActiveView }) => {
  return (
    <nav
      className="flex flex-col items-center py-4 gap-4"
      style={{
        width: 64,
        borderRight: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(2,6,23,0.8)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-center mb-4"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          border: '1px solid rgba(37,99,235,0.2)',
          flexShrink: 0,
          boxShadow: '0 4px 6px -1px rgba(37,99,235, 0.2)',
        }}
      >
        <Shield size={16} color="#ffffff" />
      </div>

      <div className="divider w-8 mb-2" />

      {/* Nav icons */}
      {navItems.map(({ icon: Icon, label, active, badge }) => (
        <div key={label} className="relative group" title={label}>
          <button
            className={`nav-icon-btn ${activeView === label ? 'active' : ''}`}
            onClick={() => setActiveView(label)}
            aria-label={label}
          >
            <Icon size={16} />
            {badge && (
              <span
                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full text-[8px] font-bold"
                style={{ background: '#ff4d6d', color: '#fff' }}
              >
                {badge}
              </span>
            )}
          </button>

          {/* Tooltip */}
          <div
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 flex items-center gap-1"
            style={{
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '4px 10px',
              whiteSpace: 'nowrap',
              fontSize: 11,
              fontWeight: 600,
              color: '#f8fafc',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            }}
          >
            <ChevronRight size={10} color="#3b82f6" />
            {label}
          </div>
        </div>
      ))}

      {/* Bottom spacer */}
      <div style={{ flex: 1 }} />

      <div className="divider w-8 mb-2" />

      <button 
        className={`nav-icon-btn ${activeView === 'Settings' ? 'active' : ''}`} 
        title="Settings" 
        aria-label="Settings"
        onClick={() => setActiveView('Settings')}
      >
        <Settings size={16} />
      </button>

      {/* User avatar */}
      <div
        className="w-7 h-7 rounded-full mt-1 flex items-center justify-center text-[10px] font-bold hover:opacity-90 transition-opacity"
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          border: '1.5px solid rgba(255,255,255,0.2)',
          color: '#ffffff',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}
        title="Profile"
      >
        M
      </div>
    </nav>
  );
};

export default SideNav;
