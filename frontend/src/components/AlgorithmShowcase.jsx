import { useState, useEffect } from 'react';
import { Clock, Zap, ShieldCheck, Check, Sparkles, AlertCircle, ArrowRight, Play } from 'lucide-react';
import SpotlightCard from './ui/SpotlightCard';

export default function AlgorithmShowcase() {
  const [activeTab, setActiveTab] = useState('token'); // 'token' | 'fixed' | 'sliding'

  // =========================================================================
  // TAB 1: TOKEN BUCKET INTERACTIVE STATE
  // =========================================================================
  const MAX_TOKENS = 8;
  const [tokens, setTokens] = useState(6);
  const [bucketLog, setBucketLog] = useState({ text: 'Bucket idling · 6 tokens ready for burst', type: 'idle' });
  const [isDraining, setIsDraining] = useState(false);

  useEffect(() => {
    const refillInterval = setInterval(() => {
      setTokens((prev) => (prev < MAX_TOKENS ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(refillInterval);
  }, []);

  const handleConsume = (amount) => {
    setIsDraining(true);
    setTimeout(() => setIsDraining(false), 300);

    if (tokens >= amount) {
      setTokens((t) => t - amount);
      setBucketLog({
        text: `200 OK · ${amount} token(s) consumed. Microsecond overhead: 0.3ms`,
        type: 'ok',
      });
    } else {
      const allowed = tokens;
      const rejected = amount - allowed;
      setTokens(0);
      setBucketLog({
        text: `429 THROTTLED · ${allowed} allowed, ${rejected} dropped at edge!`,
        type: 'blocked',
      });
    }
  };

  // =========================================================================
  // TAB 2: FIXED WINDOW INTERACTIVE STATE
  // =========================================================================
  const FIXED_CAP = 15;
  const [fixedCount, setFixedCount] = useState(9);
  const [secondsLeft, setSecondsLeft] = useState(24);
  const [fixedLog, setFixedLog] = useState({ text: 'Window active · 9 / 15 requests used', type: 'idle' });

  useEffect(() => {
    const clock = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setFixedCount(0);
          setFixedLog({ text: 'WINDOW RESET! Counter restored to 0 / 15 requests', type: 'reset' });
          return 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  const handleSendFixed = (qty = 1) => {
    if (fixedCount + qty <= FIXED_CAP) {
      setFixedCount((c) => c + qty);
      setFixedLog({ text: `200 OK · Request accepted (${fixedCount + qty}/${FIXED_CAP})`, type: 'ok' });
    } else {
      setFixedCount(FIXED_CAP);
      setFixedLog({
        text: `429 QUOTA HIT · Hard limit reached. Window resets in ${secondsLeft}s`,
        type: 'blocked',
      });
    }
  };

  // =========================================================================
  // TAB 3: SLIDING WINDOW INTERACTIVE STATE
  // =========================================================================
  const [slidingAttacking, setSlidingAttacking] = useState(false);
  const [slidingResult, setSlidingResult] = useState(null);

  const handleSimulateSlidingAttack = () => {
    setSlidingAttacking(true);
    setSlidingResult({
      attack: '20 requests fired at 00:59 + 20 requests at 01:01',
      outcome: 'Traditional Fixed Window would allow 40 reqs in 2 seconds (CRASH).',
      shield: 'LimitX Sliding Window dynamically weighed the rolling 60s frame: 20 blocked with 429!',
    });
    setTimeout(() => setSlidingAttacking(false), 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Algorithm Mode Switcher Pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          background: '#EAE6DD',
          padding: '4px',
          borderRadius: '3px',
          border: '1px solid #DCD7CD',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'token', num: '01', title: 'Token Bucket', subtitle: 'Smooth Burst Absorber' },
          { id: 'fixed', num: '02', title: 'Fixed Window', subtitle: 'Strict Calendar Quotas' },
          { id: 'sliding', num: '03', title: 'Sliding Log', subtitle: 'Boundary Spike Guard' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '12px 16px',
                borderRadius: '2px',
                background: isSelected ? '#1C1B18' : 'transparent',
                color: isSelected ? '#FAF8F5' : '#4A4843',
                border: isSelected ? '1px solid #1C1B18' : '1px solid transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 180ms ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isSelected ? '#C68A2C' : '#8C887F',
                }}
              >
                {tab.num}
              </span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.2 }}>{tab.title}</div>
                <div style={{ fontSize: '11px', color: isSelected ? '#CFC9BC' : '#7A756D', marginTop: '2px' }}>
                  {tab.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          INTERACTIVE LABORATORY STAGE
          ========================================================================= */}
      <SpotlightCard
        style={{ padding: '32px' }}
        spotlightColor="rgba(198, 138, 44, 0.14)"
        borderColor="rgba(198, 138, 44, 0.4)"
      >
        {activeTab === 'token' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'center' }}>
            {/* Left: Interactive Token Reservoir Physics */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#2D8A4E', fontWeight: 600, background: '#E8F5E9', padding: '2px 8px', borderRadius: '2px' }}>
                  AUTOMATIC REFILL: +1 TOKEN / 1.8s
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#5F5C55' }}>
                  CAPACITY: {MAX_TOKENS} TOKENS
                </span>
              </div>

              <h3 style={{ margin: '0 0 10px', fontSize: '22px', fontWeight: 500, color: '#1C1B18' }}>
                Token Bucket Reservoir
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '14.5px', color: '#4A4843', lineHeight: 1.6 }}>
                Ideal for API endpoints that experience natural traffic bursts (such as LLM generation, webhooks, or batch imports). Allows bursts as long as tokens remain, then smoothly throttles down to the replenishment rate.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => handleConsume(1)}
                  style={{
                    padding: '9px 16px',
                    background: '#1C1B18',
                    color: '#FAF8F5',
                    border: 'none',
                    borderRadius: '2px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>1 Request (-1 Token)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleConsume(4)}
                  style={{
                    padding: '9px 16px',
                    background: '#C68A2C',
                    color: '#FAF8F5',
                    border: 'none',
                    borderRadius: '2px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Zap size={14} />
                  <span>Burst 4 Requests</span>
                </button>
              </div>

              {/* Live Status Pill */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  background: bucketLog.type === 'blocked' ? '#F9ECEA' : '#F5F2EB',
                  border: `1px solid ${bucketLog.type === 'blocked' ? '#E8C4BE' : '#DCD7CD'}`,
                  color: bucketLog.type === 'blocked' ? '#C64835' : '#2D8A4E',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: bucketLog.type === 'blocked' ? '#C64835' : '#2D8A4E',
                  }}
                />
                <span>{bucketLog.text}</span>
              </div>
            </div>

            {/* Right: Visual Glass Beaker Reservoir */}
            <div
              style={{
                background: '#22211E',
                borderRadius: '4px',
                padding: '28px',
                color: '#FAF8F5',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#A5A096', marginBottom: '16px' }}>
                LIVE TOKEN CYLINDER
              </div>

              {/* Visual Beaker */}
              <div
                style={{
                  width: '140px',
                  height: '180px',
                  border: '2px solid #5F5C55',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column-reverse',
                  padding: '10px',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  boxShadow: 'inset 0 -10px 20px rgba(198, 138, 44, 0.1)',
                }}
              >
                {Array.from({ length: MAX_TOKENS }).map((_, i) => {
                  const isPresent = i < tokens;
                  return (
                    <div
                      key={`token-slot-${i}`}
                      style={{
                        height: '14px',
                        borderRadius: '3px',
                        background: isPresent
                          ? 'linear-gradient(90deg, #F5A623 0%, #D48806 100%)'
                          : 'rgba(255, 255, 255, 0.06)',
                        border: isPresent ? '1px solid #FFE58F' : '1px dashed #3D3B37',
                        transition: 'all 200ms ease',
                        boxShadow: isPresent ? '0 0 8px rgba(245, 166, 35, 0.5)' : 'none',
                      }}
                    />
                  );
                })}
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                <div style={{ fontSize: '20px', fontWeight: 600, color: tokens === 0 ? '#FF8A80' : '#FFD591' }}>
                  {tokens} / {MAX_TOKENS} TOKENS
                </div>
                <div style={{ fontSize: '11px', color: '#8C887F', marginTop: '4px' }}>
                  {tokens === 0 ? 'STATUS: REFILL REQUIRED' : 'STATUS: READY TO DISPATCH'}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fixed' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'center' }}>
            {/* Left: Fixed Window Explanation & Controls */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1C1B18', fontWeight: 600, background: '#EAE6DD', padding: '2px 8px', borderRadius: '2px' }}>
                  60-SECOND REVOLVING FRAME
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#5F5C55' }}>
                  HARD QUOTA: {FIXED_CAP} REQS
                </span>
              </div>

              <h3 style={{ margin: '0 0 10px', fontSize: '22px', fontWeight: 500, color: '#1C1B18' }}>
                Fixed Window Chronometer
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '14.5px', color: '#4A4843', lineHeight: 1.6 }}>
                Enforces an absolute ceiling per minute, hour, or day. Perfect for billing tier quotas (e.g. 10,000 reqs/day) and third-party SMS/email provider caps.
              </p>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => handleSendFixed(1)}
                  style={{
                    padding: '9px 16px',
                    background: '#1C1B18',
                    color: '#FAF8F5',
                    border: 'none',
                    borderRadius: '2px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                  }}
                >
                  Send +1 Request
                </button>
                <button
                  type="button"
                  onClick={() => handleSendFixed(5)}
                  style={{
                    padding: '9px 16px',
                    background: '#22211E',
                    color: '#FAF8F5',
                    border: '1px solid #4A4741',
                    borderRadius: '2px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                  }}
                >
                  Send +5 Batch
                </button>
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  background: fixedLog.type === 'blocked' ? '#F9ECEA' : '#F5F2EB',
                  border: `1px solid ${fixedLog.type === 'blocked' ? '#E8C4BE' : '#DCD7CD'}`,
                  color: fixedLog.type === 'blocked' ? '#C64835' : '#2D8A4E',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: fixedLog.type === 'blocked' ? '#C64835' : '#2D8A4E',
                  }}
                />
                <span>{fixedLog.text}</span>
              </div>
            </div>

            {/* Right: Circular Sweep Dial */}
            <div
              style={{
                background: '#22211E',
                borderRadius: '4px',
                padding: '28px',
                color: '#FAF8F5',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#A5A096', marginBottom: '16px' }}>
                CURRENT 60s WINDOW
              </div>

              <div
                style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  border: '3px solid #383631',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                }}
              >
                {/* Second Hand Needle */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '2px',
                    height: '60px',
                    background: '#C68A2C',
                    transformOrigin: 'top center',
                    transform: `rotate(${((60 - secondsLeft) / 60) * 360}deg)`,
                    transition: 'transform 1s linear',
                  }}
                />

                <div style={{ textAlign: 'center', zIndex: 2 }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: fixedCount >= FIXED_CAP ? '#FF8A80' : '#FAF8F5' }}>
                    {fixedCount}/{FIXED_CAP}
                  </div>
                  <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: '#8C887F' }}>
                    {secondsLeft}s TO RESET
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: '#8C887F' }}>
                RESETS TO 0 AT EXACT :00 MARK
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sliding' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'center' }}>
            {/* Left: Sliding Window Explainer */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1C1B18', fontWeight: 600, background: '#EAE6DD', padding: '2px 8px', borderRadius: '2px' }}>
                  ROLLING TIMESTAMP ALGORITHM
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#2D8A4E', fontWeight: 600 }}>
                  MAXIMUM ACCURACY
                </span>
              </div>

              <h3 style={{ margin: '0 0 10px', fontSize: '22px', fontWeight: 500, color: '#1C1B18' }}>
                Sliding Log / Window
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '14.5px', color: '#4A4843', lineHeight: 1.6 }}>
                Prevents the classic &quot;Boundary Exploit&quot; where an attacker fires at the very end of minute 1 and again at the start of minute 2, slipping twice the rate past fixed windows.
              </p>

              <button
                type="button"
                onClick={handleSimulateSlidingAttack}
                style={{
                  padding: '10px 18px',
                  background: '#1C1B18',
                  color: '#FAF8F5',
                  border: 'none',
                  borderRadius: '2px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <Play size={13} fill="#FAF8F5" />
                <span>Simulate Boundary Spike Attack</span>
              </button>

              {slidingResult && (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '2px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    background: '#F9ECEA',
                    border: '1px solid #E8C4BE',
                    color: '#1C1B18',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#C64835' }}>{slidingResult.attack}</div>
                  <div style={{ color: '#5F5C55', fontSize: '11.5px' }}>{slidingResult.outcome}</div>
                  <div style={{ color: '#2D8A4E', fontWeight: 600 }}>{slidingResult.shield}</div>
                </div>
              )}
            </div>

            {/* Right: Visual Rolling Log Waveform */}
            <div
              style={{
                background: '#22211E',
                borderRadius: '4px',
                padding: '24px',
                color: '#FAF8F5',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#A5A096' }}>
                <span>ROLLING 60-SEC WINDOW</span>
                <span style={{ color: '#2D8A4E' }}>REDIS ZSET LOG</span>
              </div>

              {/* Time grid bars */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', height: '90px', alignItems: 'flex-end', borderBottom: '1px solid #4A4741', paddingBottom: '6px' }}>
                {[30, 45, 60, slidingAttacking ? 95 : 40, slidingAttacking ? 100 : 35, 50].map((h, idx) => (
                  <div
                    key={`bar-${idx}`}
                    style={{
                      height: `${h}%`,
                      background: h > 80 ? '#C64835' : '#C68A2C',
                      borderRadius: '2px',
                      transition: 'height 300ms ease, background 300ms ease',
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#8C887F' }}>
                <span>-60s</span>
                <span>-40s</span>
                <span>-20s</span>
                <span>NOW (LIVE)</span>
              </div>

              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#A5A096', borderTop: '1px solid #35332F', paddingTop: '10px' }}>
                Weights historical timestamps against the current moment with zero interval leakage.
              </div>
            </div>
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
