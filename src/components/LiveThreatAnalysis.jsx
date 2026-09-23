import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Brain, Shield, AlertOctagon, TrendingUp, Wifi } from 'lucide-react';

/**
 * LiveThreatAnalysis - shows real-time AI-style analysis based on live WebSocket data.
 * Replaces the IncidentFeed when an attack is active.
 * When no attack, shows system health summary.
 */
const LiveThreatAnalysis = ({ trafficData, incidents }) => {
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);
  const typingRef = useRef(null);

  // Generate analysis text based on current traffic state
  const getAnalysisText = (data) => {
    if (!data) return 'Waiting for telemetry data...';

    const { status, current_rps, faulty_rps, legitimate_rps, attacker_ips, ai_explanation, detection_reason, source_count, top_source_concentration } = data;

    if (ai_explanation) {
      return `${ai_explanation}\n\nEvidence: ${detection_reason} Source IPs observed: ${source_count ?? 'unknown'}. Top-source concentration: ${top_source_concentration ?? 0}%.`;
    }

    if (status === 'VOLUMETRIC_DDOS') {
      return `CRITICAL: Volumetric DDoS in progress.\n\nTraffic spiked to ${current_rps} RPS. All ${current_rps} RPS classified as malicious. Top attacker IPs: ${attacker_ips?.slice(0, 2).join(', ') || 'N/A'}.\n\nRecommended: Activate rate-limiting and upstream scrubbing immediately.`;
    } else if (status === 'BOT_ATTACK') {
      const pct = Math.round((faulty_rps / current_rps) * 100);
      return `WARNING: Targeted Bot Attack detected.\n\nTraffic reached ${current_rps} RPS. Single-IP analysis: ${attacker_ips?.[0] || 'unknown'} is responsible for ${faulty_rps} RPS (${pct}% of total).\n\nLegitimate traffic preserved: ${legitimate_rps} RPS.\n\nRecommended: Block attacker IP at firewall and monitor for rotation.`;
    } else if (status === 'FLASH_SALE') {
      return `🟡 NOTICE: High traffic volume detected — classified as LEGITIMATE.\n\nCurrent: ${current_rps} RPS. No single IP dominates (all IPs contribute <40% each). Detection Rule: Distributed spike → not a security incident.\n\nThis is consistent with a Flash Sale or viral event. No action required.`;
    } else {
      const lastIncident = incidents?.[0];
      if (lastIncident) {
        return `✅ System SECURE — ${current_rps} RPS (normal baseline).\n\nLast incident: ${lastIncident.severity} at ${lastIncident.peak_rps} RPS on ${new Date(lastIncident.timestamp).toLocaleTimeString()}.\n\nAll systems nominal. Continuous monitoring active across all ingress nodes.`;
      }
      return `✅ System SECURE — ${current_rps} RPS.\n\nAll traffic within normal parameters (baseline: 20 RPS). No anomalies detected. Hybrid detection engine monitoring for volume spikes and IP concentration patterns.`;
    }
  };

  // Typewriter effect
  useEffect(() => {
    if (!trafficData) return;
    const newStatus = trafficData.status;

    // Only re-type when status changes
    if (newStatus === lastStatus) return;
    setLastStatus(newStatus);

    const fullText = getAnalysisText(trafficData);
    setTypedText('');
    setIsTyping(true);

    let i = 0;
    if (typingRef.current) clearInterval(typingRef.current);

    typingRef.current = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(typingRef.current);
      }
    }, 18);

    return () => clearInterval(typingRef.current);
  }, [trafficData?.status]);

  const status = trafficData?.status || 'NORMAL';
  const isAttack = trafficData?.is_attack;

  const borderColor = status === 'VOLUMETRIC_DDOS'
    ? 'border-red-500/50'
    : status === 'BOT_ATTACK'
    ? 'border-orange-500/50'
    : status === 'FLASH_SALE'
    ? 'border-yellow-500/30'
    : 'border-slate-700';

  const headerColor = status === 'VOLUMETRIC_DDOS'
    ? 'text-red-400'
    : status === 'BOT_ATTACK'
    ? 'text-orange-400'
    : status === 'FLASH_SALE'
    ? 'text-yellow-400'
    : 'text-cyan-400';

  const HeaderIcon = isAttack ? AlertOctagon : Brain;

  return (
    <div className={`bg-slate-900 border rounded-xl p-4 flex flex-col gap-3 transition-colors duration-500 ${borderColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeaderIcon className={`w-4 h-4 ${headerColor} ${isAttack ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${headerColor}`}>
            Live Threat Analysis
          </span>
        </div>
        {isTyping && (
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping inline-block"></span>
            Generating...
          </span>
        )}
      </div>

      {/* Status Badge */}
      <div className={`text-xs font-mono px-2 py-1 rounded w-fit ${
        status === 'VOLUMETRIC_DDOS' ? 'bg-red-500/20 text-red-400' :
        status === 'BOT_ATTACK' ? 'bg-orange-500/20 text-orange-400' :
        status === 'FLASH_SALE' ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-green-500/10 text-green-400'
      }`}>
        {status.replace('_', ' ')}
      </div>

      {/* Typewriter AI Text */}
      <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-line font-mono min-h-[80px]">
        {typedText}
        {isTyping && <span className="animate-pulse text-cyan-400">|</span>}
      </div>

      {/* Traffic Breakdown bar (only when data is available) */}
      {trafficData && trafficData.current_rps > 0 && (
        <div className="mt-1">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Traffic Split</span>
            <span className="font-mono">{trafficData.current_rps} RPS total</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-green-500 transition-all duration-700"
              style={{ width: `${Math.round((trafficData.legitimate_rps / trafficData.current_rps) * 100)}%` }}
            />
            <div
              className="h-full bg-red-500 transition-all duration-700"
              style={{ width: `${Math.round((trafficData.faulty_rps / trafficData.current_rps) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-green-400">✓ Legit: {trafficData.legitimate_rps} RPS</span>
            <span className="text-red-400">✗ Malicious: {trafficData.faulty_rps} RPS</span>
          </div>
        </div>
      )}
    </div>
  );
};

LiveThreatAnalysis.propTypes = {
  trafficData: PropTypes.object,
  incidents: PropTypes.array,
};

export default LiveThreatAnalysis;
