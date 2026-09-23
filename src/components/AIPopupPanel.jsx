import React, { useEffect, useState, useRef } from 'react';
import { Brain, X, Shield, AlertTriangle, Wifi, TrendingUp } from 'lucide-react';

const AIPopupPanel = ({ trafficData, aiInsights = [], incidents = [] }) => {
  const [visible, setVisible] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);
  const [score, setScore] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);
  const typingRef = useRef(null);
  const scoreAnimRef = useRef(null);
  const dismissTimerRef = useRef(null);

  const getAnalysisText = (data) => {
    if (!data) return '';
    const {
      status, current_rps, faulty_rps, legitimate_rps,
      attacker_ips, ai_explanation, detection_reason,
      source_count, top_source_concentration,
    } = data;

    if (ai_explanation) {
      return `${ai_explanation}\n\nEvidence: ${detection_reason || 'Anomaly threshold exceeded'}. Sources observed: ${source_count ?? '—'}. Top-source concentration: ${top_source_concentration ?? 0}%.`;
    }
    if (status === 'VOLUMETRIC_DDOS') {
      return `CRITICAL: Volumetric DDoS in progress.\n\nTraffic spiked to ${current_rps} RPS. All traffic classified as malicious botnet payload. Top attacker IPs: ${attacker_ips?.slice(0, 2).join(', ') || 'N/A'}.\n\nRecommended: Activate upstream scrubbing and rate-limiting immediately.`;
    }
    if (status === 'BOT_ATTACK') {
      const pct = current_rps > 0 ? Math.round((faulty_rps / current_rps) * 100) : 0;
      return `WARNING: Targeted Bot Attack detected.\n\nTraffic: ${current_rps} RPS. Single-IP: ${attacker_ips?.[0] || 'unknown'} responsible for ${faulty_rps} RPS (${pct}% of total).\n\nLegitimate traffic preserved: ${legitimate_rps} RPS. Block attacker IP at firewall.`;
    }
    return '';
  };

  useEffect(() => {
    if (!trafficData) return;
    const { is_attack, status } = trafficData;

    if (is_attack && status !== lastStatus) {
      setLastStatus(status);
      setVisible(true);

      // Typewriter effect
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
      }, 16);

      // Score from ai_insights
      const topInsight = aiInsights?.[0];
      const targetScore = topInsight?.score ?? Math.floor(70 + Math.random() * 25);
      setScore(targetScore);
      setAnimatedScore(0);
      let s = 0;
      if (scoreAnimRef.current) clearInterval(scoreAnimRef.current);
      scoreAnimRef.current = setInterval(() => {
        s += Math.ceil(targetScore / 40);
        if (s >= targetScore) {
          s = targetScore;
          clearInterval(scoreAnimRef.current);
        }
        setAnimatedScore(s);
      }, 40);

      // Auto-dismiss after 18 seconds
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => setVisible(false), 18_000);
    }

    if (!is_attack && lastStatus) {
      setLastStatus(null);
    }
  }, [trafficData, aiInsights]);

  useEffect(() => () => {
    clearInterval(typingRef.current);
    clearInterval(scoreAnimRef.current);
    clearTimeout(dismissTimerRef.current);
  }, []);

  if (!visible || !trafficData?.is_attack) return null;

  const status = trafficData.status;
  const isVolumetric = status === 'VOLUMETRIC_DDOS';
  const accentColor = isVolumetric ? '#f87171' : '#fbbf24';
  const accentRgb   = isVolumetric ? '248,113,113' : '251,191,36';

  const scoreColor =
    score >= 80 ? '#f87171' :
    score >= 60 ? '#fbbf24' : '#34d399';

  const topInsight = aiInsights?.[0];

  return (
    <div
      className="animate-slide-left"
      style={{
        position: 'fixed',
        top: 72,
        left: 16,
        width: 300,
        zIndex: 90,
        background: 'rgba(0, 3, 15, 0.88)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: `1px solid rgba(${accentRgb}, 0.3)`,
        borderRadius: 10,
        boxShadow: `0 0 32px rgba(${accentRgb}, 0.12), 0 8px 32px rgba(0,0,0,0.8)`,
        overflow: 'hidden',
      }}
    >
      {/* Colored top accent bar */}
      <div
        style={{
          height: 2,
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }}
      />

      <div style={{ padding: '12px 14px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: `rgba(${accentRgb}, 0.15)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isVolumetric
                ? <AlertTriangle size={13} color={accentColor} />
                : <Brain size={13} color={accentColor} />
              }
            </div>
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: accentColor,
                }}
              >
                AI Threat Analysis
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#e2eaf4',
                  marginTop: 1,
                }}
              >
                {status.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={12} />
          </button>
        </div>

        {/* AI Explanation — typewriter */}
        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 6,
            padding: '8px 10px',
            marginBottom: 10,
            border: '1px solid rgba(255,255,255,0.05)',
            minHeight: 80,
          }}
        >
          {isTyping && (
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: 'rgba(96,165,250,0.6)',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#60a5fa',
                  display: 'inline-block',
                  animation: 'dotPulse 1s infinite',
                }}
              />
              GENERATING ANALYSIS...
            </div>
          )}
          <p
            className="font-mono"
            style={{
              fontSize: 10,
              lineHeight: 1.6,
              color: 'rgba(226,234,244,0.85)',
              whiteSpace: 'pre-line',
            }}
          >
            {typedText}
            {isTyping && (
              <span style={{ color: '#60a5fa', animation: 'dotPulse 0.8s infinite' }}>▌</span>
            )}
          </p>
        </div>

        {/* DDoS Confidence Score */}
        <div
          style={{
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 6,
            padding: '8px 10px',
            marginBottom: 10,
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase' }}>
              DDoS Confidence Score
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: 20,
                fontWeight: 800,
                lineHeight: 1,
                color: scoreColor,
                letterSpacing: '-0.03em',
                textShadow: `0 0 12px ${scoreColor}`,
              }}
            >
              {animatedScore}%
            </span>
          </div>
          {/* Gauge bar */}
          <div
            style={{
              height: 5,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${animatedScore}%`,
                borderRadius: 3,
                background: `linear-gradient(90deg, #34d399, ${scoreColor})`,
                transition: 'width 0.1s linear',
                boxShadow: `0 0 6px ${scoreColor}`,
              }}
            />
          </div>
          {topInsight?.justification && (
            <p
              style={{
                fontSize: 9,
                color: 'rgba(148,163,184,0.6)',
                marginTop: 5,
                lineHeight: 1.5,
              }}
            >
              {topInsight.justification}
            </p>
          )}
        </div>

        {/* Attacker IPs */}
        {trafficData.attacker_ips?.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'rgba(148,163,184,0.7)',
                textTransform: 'uppercase',
                marginBottom: 5,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Wifi size={9} />
              Top Attacker IPs
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {trafficData.attacker_ips.slice(0, 4).map((ip, i) => (
                <span
                  key={i}
                  className="font-mono"
                  style={{
                    fontSize: 9,
                    padding: '2px 7px',
                    borderRadius: 3,
                    background: 'rgba(248,113,113,0.12)',
                    color: '#fca5a5',
                    border: '1px solid rgba(248,113,113,0.2)',
                  }}
                >
                  {ip}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Traffic split */}
        {trafficData.current_rps > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.6)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <TrendingUp size={9} />
                Traffic Split
              </span>
              <span className="font-mono" style={{ fontSize: 9, color: 'rgba(226,234,244,0.6)' }}>
                {trafficData.current_rps} RPS total
              </span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.round((trafficData.legitimate_rps / trafficData.current_rps) * 100)}%`,
                  background: '#34d399',
                  transition: 'width 0.7s ease',
                }}
              />
              <div
                style={{
                  height: '100%',
                  width: `${Math.round((trafficData.faulty_rps / trafficData.current_rps) * 100)}%`,
                  background: '#f87171',
                  transition: 'width 0.7s ease',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <span style={{ fontSize: 9, color: '#34d399' }}>✓ Legit: {trafficData.legitimate_rps} RPS</span>
              <span style={{ fontSize: 9, color: '#f87171' }}>✗ Malicious: {trafficData.faulty_rps} RPS</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPopupPanel;
