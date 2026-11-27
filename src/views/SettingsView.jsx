import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Bell, Shield, Globe, User,
  Monitor, Lock, CheckCircle, ToggleLeft, ToggleRight
} from 'lucide-react';

const SettingsView = () => {
  const [settings, setSettings] = useState({
    autoRotateGlobe: true,
    showArcLabels: true,
    notifyCritical: true,
    notifyWarning: true,
    notifyInfo: false,
    twoFactor: true,
    autoMitigate: true,
    sessionTimeout: '30',
    timezone: 'Asia/Kolkata (IST)',
    refreshRate: '1',
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key) => setSettings(p => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        transition: 'transform 0.15s ease',
      }}
    >
      {enabled
        ? <ToggleRight size={28} color="#38bdf8" />
        : <ToggleLeft size={28} color="rgba(148,163,184,0.4)" />
      }
    </button>
  );

  const cardStyle = {
    background: 'rgba(8, 10, 14, 0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: 12,
    color: '#f8fafc',
    background: 'rgba(255, 255, 255, 0.03)',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-up" style={{ background: 'transparent' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', marginBottom: 2 }}>
            SOC Configuration & Settings
          </h2>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>
            Manage SOC operator profile, automated mitigation triggers, and display controls
          </p>
        </div>
        {saved && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 11,
              fontWeight: 600,
              color: '#4ade80',
            }}
          >
            <CheckCircle size={14} />
            Preferences Saved
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Profile */}
        <div className="p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <User size={15} color="#38bdf8" />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
              SOC Operator Profile
            </h3>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Operator Call-Sign / Name
              </label>
              <input defaultValue="SecOps Command Lead" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Incident Alert Email
              </label>
              <input defaultValue="soc-ops@sentinelx.security" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Defense Tier / Role
              </label>
              <input defaultValue="Level-3 Incident Commander (Full Quarantine Authority)" disabled style={{ ...inputStyle, color: '#94a3b8', background: 'rgba(255,255,255,0.01)' }} />
            </div>
            <button
              onClick={handleSave}
              style={{
                marginTop: 6,
                padding: '7px 18px',
                borderRadius: 6,
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                alignSelf: 'flex-start',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#0369a1'}
              onMouseLeave={e => e.currentTarget.style.background = '#0284c7'}
            >
              Update Credentials
            </button>
          </div>
        </div>

        {/* Automated Mitigation */}
        <div className="p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={15} color="#ef4444" />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
              Automated Mitigation Engine
            </h3>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#e2eaf4' }}>Auto-Quarantine Attackers</p>
                <p style={{ fontSize: 10, color: '#94a3b8' }}>Immediately block IPs exceeding concentration limits in Redis</p>
              </div>
              <Toggle enabled={settings.autoMitigate} onToggle={() => toggle('autoMitigate')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#e2eaf4' }}>Two-Factor Override for Unblocks</p>
                <p style={{ fontSize: 10, color: '#94a3b8' }}>Require authorization before lifting firewall bans</p>
              </div>
              <Toggle enabled={settings.twoFactor} onToggle={() => toggle('twoFactor')} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Quarantine Cooldown (seconds)
              </label>
              <select
                value={settings.sessionTimeout}
                onChange={e => setSettings(p => ({ ...p, sessionTimeout: e.target.value }))}
                style={inputStyle}
              >
                <option value="60">60 seconds (Aggressive Test)</option>
                <option value="300">300 seconds (5 minutes — Recommended)</option>
                <option value="900">900 seconds (15 minutes)</option>
                <option value="3600">3600 seconds (1 hour)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alert Notifications */}
        <div className="p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={15} color="#38bdf8" />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
              Alert Notification Channels
            </h3>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { key: 'notifyCritical', label: 'Critical Attacks', desc: 'Volumetric DDoS, high-rate botnets' },
              { key: 'notifyWarning', label: 'Warning Thresholds', desc: 'Single-source concentration spikes' },
              { key: 'notifyInfo', label: 'Nominal Health Checks', desc: 'Periodic baseline sync and keep-alive' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between">
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#e2eaf4' }}>{n.label}</p>
                  <p style={{ fontSize: 10, color: '#94a3b8' }}>{n.desc}</p>
                </div>
                <Toggle enabled={settings[n.key]} onToggle={() => toggle(n.key)} />
              </div>
            ))}
          </div>
        </div>

        {/* Display & 3D Globe */}
        <div className="p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={15} color="#38bdf8" />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
              3D Globe & Map Telemetry
            </h3>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#e2eaf4' }}>Auto-Rotate 3D Globe</p>
                <p style={{ fontSize: 10, color: '#94a3b8' }}>Continuous orbital spin during standby</p>
              </div>
              <Toggle enabled={settings.autoRotateGlobe} onToggle={() => toggle('autoRotateGlobe')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#e2eaf4' }}>Display 3D Cyber Labels</p>
                <p style={{ fontSize: 10, color: '#94a3b8' }}>Render floating country & SOC markers</p>
              </div>
              <Toggle enabled={settings.showArcLabels} onToggle={() => toggle('showArcLabels')} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Telemetry Sync Interval
              </label>
              <select
                value={settings.refreshRate}
                onChange={e => setSettings(p => ({ ...p, refreshRate: e.target.value }))}
                style={inputStyle}
              >
                <option value="1">1 second (Real-Time WebSocket)</option>
                <option value="2">2 seconds (Standard)</option>
                <option value="5">5 seconds (Conserve Bandwidth)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
