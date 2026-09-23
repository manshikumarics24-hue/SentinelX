import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Globe, User, Monitor, Moon, Sun, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';

const SettingsView = () => {
  const [settings, setSettings] = useState({
    darkMode: false,
    autoRotateGlobe: true,
    showArcLabels: true,
    notifyCritical: true,
    notifyWarning: true,
    notifyInfo: false,
    twoFactor: true,
    sessionTimeout: '30',
    language: 'English',
    timezone: 'Asia/Kolkata (IST)',
    refreshRate: '2',
    maxArcs: '50',
  });

  const toggle = (key) => setSettings(p => ({ ...p, [key]: !p[key] }));

  const Toggle = ({ enabled, onToggle }) => (
    <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
      {enabled
        ? <ToggleRight size={28} color="#2563eb" />
        : <ToggleLeft size={28} color="#cbd5e1" />
      }
    </button>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-up" style={{ background: 'transparent' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>Settings</h2>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 24 }}>Configure your SentinelX dashboard preferences</p>

      <div className="grid grid-cols-2 gap-6">
        {/* Profile */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <User size={16} color="#2563eb" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>Profile</h3>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>Full Name</label>
              <input defaultValue="Timur K." style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', fontSize: 13, color: '#f8fafc', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>Email</label>
              <input defaultValue="timur.k@sentinelx.io" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', fontSize: 13, color: '#f8fafc', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>Role</label>
              <input defaultValue="SOC Analyst L2" disabled style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', fontSize: 13, color: '#94a3b8', background: 'rgba(255,255,255,0.02)', outline: 'none' }} />
            </div>
            <button style={{ marginTop: 4, padding: '8px 20px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>Save Changes</button>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} color="#2563eb" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>Notifications</h3>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { key: 'notifyCritical', label: 'Critical Alerts', desc: 'DDoS attacks, system failures' },
              { key: 'notifyWarning', label: 'Warning Alerts', desc: 'Rate limits, traffic spikes' },
              { key: 'notifyInfo', label: 'Info Alerts', desc: 'Health checks, renewals' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between">
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{n.label}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8' }}>{n.desc}</p>
                </div>
                <Toggle enabled={settings[n.key]} onToggle={() => toggle(n.key)} />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} color="#2563eb" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>Security</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Two-Factor Authentication</p>
                <p style={{ fontSize: 11, color: '#94a3b8' }}>Require 2FA for login</p>
              </div>
              <Toggle enabled={settings.twoFactor} onToggle={() => toggle('twoFactor')} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>Session Timeout (minutes)</label>
              <select value={settings.sessionTimeout} onChange={e => setSettings(p => ({ ...p, sessionTimeout: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', fontSize: 13, color: '#f8fafc', outline: 'none', background: 'rgba(15,23,42,0.6)' }}>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Display */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={16} color="#2563eb" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>Display & Globe</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Auto-Rotate Globe</p>
                <p style={{ fontSize: 11, color: '#94a3b8' }}>Slowly spin the 3D globe</p>
              </div>
              <Toggle enabled={settings.autoRotateGlobe} onToggle={() => toggle('autoRotateGlobe')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Show Arc Labels</p>
                <p style={{ fontSize: 11, color: '#94a3b8' }}>Display city names on connections</p>
              </div>
              <Toggle enabled={settings.showArcLabels} onToggle={() => toggle('showArcLabels')} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>Data Refresh Rate (seconds)</label>
              <select value={settings.refreshRate} onChange={e => setSettings(p => ({ ...p, refreshRate: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', fontSize: 13, color: '#f8fafc', outline: 'none', background: 'rgba(15,23,42,0.6)' }}>
                <option value="1">1 second</option>
                <option value="2">2 seconds</option>
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
