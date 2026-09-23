import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ShieldX, Wifi, AlertTriangle } from 'lucide-react';

/**
 * AttackAlertPopup - appears at bottom-right when an attack is detected.
 * Auto-dismisses after 8 seconds. New attacks re-trigger it.
 */
const AttackAlertPopup = ({ trafficData }) => {
  const [visible, setVisible] = useState(false);
  const [alertData, setAlertData] = useState(null);
  const [lastAttackStatus, setLastAttackStatus] = useState(null);

  useEffect(() => {
    if (!trafficData) return;

    const { is_attack, status, attack_type, current_rps, faulty_rps, attacker_ips } = trafficData;

    // Only trigger when a NEW attack type is detected (avoids spamming every second)
    if (is_attack && status !== lastAttackStatus) {
      setAlertData({ status, attack_type, current_rps, faulty_rps, attacker_ips });
      setVisible(true);
      setLastAttackStatus(status);

      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    }

    // Reset when traffic goes back to normal
    if (!is_attack && lastAttackStatus) {
      setLastAttackStatus(null);
    }
  }, [trafficData, lastAttackStatus]);

  if (!visible || !alertData) return null;

  const isVolumetric = alertData.status === 'VOLUMETRIC_DDOS';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in max-w-sm w-full">
      <div
        className={`rounded-xl border shadow-2xl p-4 backdrop-blur-md ${
          isVolumetric
            ? 'bg-red-950/90 border-red-500 shadow-red-500/30'
            : 'bg-orange-950/90 border-orange-500 shadow-orange-500/30'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-full animate-pulse ${isVolumetric ? 'bg-red-500/20' : 'bg-orange-500/20'}`}>
            {isVolumetric ? (
              <ShieldX className={`w-5 h-5 ${isVolumetric ? 'text-red-400' : 'text-orange-400'}`} />
            ) : (
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            )}
          </div>
          <div className="flex-1">
            <p className={`text-xs font-bold uppercase tracking-widest ${isVolumetric ? 'text-red-400' : 'text-orange-400'}`}>
              ⚠ Attack Detected
            </p>
            <p className="text-white font-bold text-sm">{alertData.attack_type}</p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-slate-400 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <p className="text-slate-400 text-xs">Total RPS</p>
            <p className={`font-mono font-bold text-lg ${isVolumetric ? 'text-red-400' : 'text-orange-400'}`}>
              {alertData.current_rps}
            </p>
          </div>
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <p className="text-slate-400 text-xs">Malicious RPS</p>
            <p className="font-mono font-bold text-lg text-red-400">{alertData.faulty_rps}</p>
          </div>
        </div>

        {/* Attacker IPs */}
        {alertData.attacker_ips && alertData.attacker_ips.length > 0 && (
          <div className="bg-black/30 rounded-lg p-2">
            <p className="text-slate-400 text-xs mb-1 flex items-center gap-1">
              <Wifi className="w-3 h-3" /> Top Attacker IPs
            </p>
            <div className="flex flex-wrap gap-1">
              {alertData.attacker_ips.slice(0, 3).map((ip, i) => (
                <span
                  key={i}
                  className="font-mono text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded"
                >
                  {ip}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Why flagged */}
        <p className="text-slate-400 text-xs mt-2 leading-relaxed">
          {isVolumetric
            ? `Flagged: RPS exceeded 500 threshold instantly. Volume-based detection triggered.`
            : `Flagged: Moderate spike but single IP contributes >40% of traffic.`}
        </p>
      </div>
    </div>
  );
};

AttackAlertPopup.propTypes = {
  trafficData: PropTypes.object,
};

export default AttackAlertPopup;
