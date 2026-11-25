import React, { useEffect, useState, useRef } from 'react';
import { Brain, X, AlertTriangle, Wifi, TrendingUp, MapPin } from 'lucide-react';

const STAY_SECONDS_AFTER_TYPING = 15;

// Renders a crisp country flag icon (flagcdn) with MapPin fallback
const CountryFlag = ({ cc }) => {
  const [imgFailed, setImgFailed] = useState(false);
  if (!cc || cc.length !== 2 || imgFailed) {
    return <MapPin size={12} color="#fca5a5" />;
  }
  return (
    <img
      src={`https://flagcdn.com/24x18/${cc.toLowerCase()}.png`}
      alt={cc}
      width={18}
      height={13}
      onError={() => setImgFailed(true)}
      style={{ borderRadius: 2, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.18)', flexShrink: 0 }}
    />
  );
};

const AIPopupPanel = ({ trafficData, aiInsights = [] }) => {
  const [visible, setVisible] = useState(false);
  const [frozenAlert, setFrozenAlert] = useState(null);
  const [frozenScore, setFrozenScore] = useState(0);
  const [frozenJustification, setFrozenJustification] = useState('');
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [countdown, setCountdown] = useState(STAY_SECONDS_AFTER_TYPING);

  const visibleRef = useRef(false);
  const lastStatusRef = useRef(null);
  const typingRef = useRef(null);
  const scoreAnimRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  const buildAnalysisText = (data) => {
    if (!data) return '';
    const {
      status, current_rps, faulty_rps, legitimate_rps,
      attacker_ips, ai_explanation, detection_reason,
      source_count, top_source_concentration,
    } = data;

    const origin =
      data.top_locations?.[0] ||
      (data.attack_origin?.city ? `${data.attack_origin.city}, ${data.attack_origin.country || ''}`.replace(/,\s*$/, '') : null) ||
      (attacker_ips?.[0] ? `IP ${attacker_ips[0]}` : 'Unknown Source');

    if (ai_explanation) {
      return `Origin: ${origin}\n\n${ai_explanation}\n\nReason: ${detection_reason || 'Traffic exceeded safe limit'}. Active IPs: ${source_count ?? '—'} (Top IP share: ${top_source_concentration ?? 0}%).`;
    }
    if (status === 'VOLUMETRIC_DDOS') {
      return `DDoS flood from ${origin}.\n\nTraffic jumped to ${current_rps} requests/sec. Top IPs: ${attacker_ips?.slice(0, 3).join(', ') || 'N/A'}.\n\nAction: Bad traffic blocked and logged to database.`;
    }
    if (status === 'BOT_ATTACK') {
      const pct = current_rps > 0 ? Math.round((faulty_rps / current_rps) * 100) : 0;
      return `Bot attack from ${origin}.\n\nTraffic hit ${current_rps} RPS. IP ${attacker_ips?.[0] || 'unknown'} sent ${faulty_rps} RPS (${pct}%). Real traffic safe at ${legitimate_rps} RPS.`;
    }
    return '';
  };

  useEffect(() => {
    if (!trafficData) return;
    const { is_attack, status } = trafficData;

    // Trigger only when an attack begins and we aren't already showing this attack
    if (is_attack && (!visibleRef.current || status !== lastStatusRef.current)) {
      lastStatusRef.current = status;
      visibleRef.current = true;
      setFrozenAlert(trafficData);
      setVisible(true);
      setCountdown(STAY_SECONDS_AFTER_TYPING);

      // Clear any previous timers cleanly
      clearInterval(typingRef.current);
      clearInterval(scoreAnimRef.current);
      clearInterval(countdownIntervalRef.current);

      const topInsight = aiInsights?.[0];
      const targetScore = topInsight?.score ?? 85;
      setFrozenScore(targetScore);
      setFrozenJustification(topInsight?.justification ?? '');
      setAnimatedScore(0);

      let s = 0;
      scoreAnimRef.current = setInterval(() => {
        s += Math.ceil(targetScore / 25);
        if (s >= targetScore) {
          s = targetScore;
          clearInterval(scoreAnimRef.current);
        }
        setAnimatedScore(s);
      }, 30);

      // Fast typewriter (~10ms/char), then start the 15-second reading countdown AFTER typing finishes
      const fullText = buildAnalysisText(trafficData);
      setTypedText('');
      setIsTyping(true);
      let i = 0;

      typingRef.current = setInterval(() => {
        if (i < fullText.length) {
          i += 2; // 2 chars per tick so humans don't wait long to read
          setTypedText(fullText.slice(0, i));
        } else {
          clearInterval(typingRef.current);
          setIsTyping(false);

          // Stay for at least 15 full seconds AFTER the complete text is visible
          let remaining = STAY_SECONDS_AFTER_TYPING;
          setCountdown(remaining);
          countdownIntervalRef.current = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
              clearInterval(countdownIntervalRef.current);
              visibleRef.current = false;
              lastStatusRef.current = null;
              setVisible(false);
            } else {
              setCountdown(remaining);
            }
          }, 1000);
        }
      }, 14);
    } else if (!is_attack && !visibleRef.current) {
      lastStatusRef.current = null;
    }
  }, [trafficData, aiInsights]);

  useEffect(() => () => {
    clearInterval(typingRef.current);
    clearInterval(scoreAnimRef.current);
    clearInterval(countdownIntervalRef.current);
  }, []);

  if (!visible || !frozenAlert) return null;

  const status = frozenAlert.status || 'ANOMALY';
  const isVolumetric = status === 'VOLUMETRIC_DDOS';
  const accentColor = isVolumetric ? '#f87171' : '#fbbf24';
  const accentRgb   = isVolumetric ? '248,113,113' : '251,191,36';

  const scoreColor =
    frozenScore >= 80 ? '#f87171' :
    frozenScore >= 60 ? '#fbbf24' : '#34d399';

  const originLabel =
    frozenAlert.top_locations?.[0] ||
    (frozenAlert.attack_origin?.city ? `${frozenAlert.attack_origin.city}, ${frozenAlert.attack_origin.country || ''}`.replace(/,\s*$/, '') : null) ||
    'Global Botnet';
  const originCC = frozenAlert.attack_origin?.cc || '';

  return (
    <div
      className="animate-slide-left"
      style={{
        position: 'fixed',
        top: 72,
        left: 16,
        width: 318,
        zIndex: 90,
        background: 'rgba(6, 7, 10, 0.94)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: `1px solid rgba(${accentRgb}, 0.35)`,
        borderRadius: 10,
        boxShadow: `0 0 32px rgba(${accentRgb}, 0.14), 0 10px 36px rgba(0,0,0,0.9)`,
        overflow: 'hidden',
      }}
    >
      {/* Colored top accent bar */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

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
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accentColor }}>
                AI Threat Analysis
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc', marginTop: 1 }}>
                {status.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              clearInterval(typingRef.current);
              clearInterval(countdownIntervalRef.current);
              visibleRef.current = false;
              lastStatusRef.current = null;
              setVisible(false);
            }}
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
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

        {/* Source Origin with Flag Logo + Spike Banner */}
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.28)',
            borderRadius: 6,
            padding: '7px 9px',
            marginBottom: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <CountryFlag cc={originCC} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fecaca', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {originLabel}
              </span>
            </div>
            <span
              className="font-mono"
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#f87171',
                background: 'rgba(239,68,68,0.2)',
                padding: '1px 6px',
                borderRadius: 3,
                flexShrink: 0,
              }}
            >
              +{frozenAlert.current_rps} RPS
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 8.5, color: '#94a3b8' }}>
            <span>NeonTech DB: <span style={{ color: '#34d399', fontWeight: 600 }}>Synced</span></span>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>
              {isTyping ? 'Writing report...' : `Stays for ${countdown}s`}
            </span>
          </div>
        </div>

        {/* AI Explanation — typewriter */}
        <div
          style={{
            background: 'rgba(0,0,0,0.55)',
            borderRadius: 6,
            padding: '8px 10px',
            marginBottom: 10,
            border: '1px solid rgba(255,255,255,0.07)',
            minHeight: 84,
            maxHeight: 165,
            overflowY: 'auto',
          }}
        >
          {isTyping && (
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(96,165,250,0.75)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#60a5fa', display: 'inline-block', animation: 'dotPulse 1s infinite' }} />
              ANALYZING TRAFFIC...
            </div>
          )}
          <p
            style={{
              fontSize: 10.5,
              lineHeight: 1.55,
              color: 'rgba(241,245,249,0.92)',
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
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 6,
            padding: '8px 10px',
            marginBottom: 10,
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(148,163,184,0.75)', textTransform: 'uppercase' }}>
              DDoS Confidence Score
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: 18,
                fontWeight: 800,
                lineHeight: 1,
                color: scoreColor,
                textShadow: `0 0 10px ${scoreColor}`,
              }}
            >
              {animatedScore}%
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${animatedScore}%`,
                borderRadius: 3,
                background: `linear-gradient(90deg, #34d399, ${scoreColor})`,
                transition: 'width 0.1s linear',
              }}
            />
          </div>
          {frozenJustification && (
            <p style={{ fontSize: 9, color: 'rgba(148,163,184,0.75)', marginTop: 5, lineHeight: 1.45 }}>
              {frozenJustification}
            </p>
          )}
        </div>

        {/* Attacker IPs */}
        {frozenAlert.attacker_ips?.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(148,163,184,0.75)', textTransform: 'uppercase', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Wifi size={9} />
              Top Attacker IPs
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {frozenAlert.attacker_ips.slice(0, 4).map((ip, i) => (
                <span
                  key={i}
                  className="font-mono"
                  style={{
                    fontSize: 9,
                    padding: '2px 7px',
                    borderRadius: 3,
                    background: 'rgba(248,113,113,0.12)',
                    color: '#fca5a5',
                    border: '1px solid rgba(248,113,113,0.22)',
                  }}
                >
                  {ip}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Traffic split */}
        {frozenAlert.current_rps > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.7)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <TrendingUp size={9} />
                Traffic Split
              </span>
              <span className="font-mono" style={{ fontSize: 9, color: 'rgba(226,234,244,0.7)' }}>
                {frozenAlert.current_rps} RPS total
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex' }}>
              <div style={{ height: '100%', width: `${Math.round((frozenAlert.legitimate_rps / frozenAlert.current_rps) * 100)}%`, background: '#34d399', transition: 'width 0.7s ease' }} />
              <div style={{ height: '100%', width: `${Math.round((frozenAlert.faulty_rps / frozenAlert.current_rps) * 100)}%`, background: '#f87171', transition: 'width 0.7s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <span style={{ fontSize: 9, color: '#34d399' }}>Legit: {frozenAlert.legitimate_rps} RPS</span>
              <span style={{ fontSize: 9, color: '#f87171' }}>Malicious: {frozenAlert.faulty_rps} RPS</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPopupPanel;
