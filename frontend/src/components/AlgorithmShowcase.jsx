import { useState } from 'react';
import { Plus, Minus, Cpu, ShieldCheck, Zap } from 'lucide-react';

const MODES = [
  {
    id: 'token_bucket',
    name: 'Token Bucket',
    badge: 'DEFAULT FOR REST APIS',
    complexity: 'O(1) memory · Burst tolerant',
    tagline: 'Absorbs natural user bursts, paces sustained traffic floods',
    bestFor: 'Mobile apps, SPAs & public REST endpoints',
    bestForDesc: 'Perfect for unpredictable client activity where users occasionally fire bursts of parallel calls.',
    onSpike: 'Absorbs spikes up to bucket capacity, smoothly meters remainder',
    onSpikeDesc: 'Tokens refill at a constant configured rate; excess requests are metered without jitter.',
    experience: 'Smooth & forgiving for real users, zero false-positive drops',
    experienceDesc: 'Returns standard 200 OK during bursts, only emits 429 when bucket is completely starved.',
    headerSpec: 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
    steadyBars: [3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4],
    burstBars: [5, 5, 4, 2, 3, 4, 3, 3, 4, 3, 3, 4],
    cappedIdxBurst: [2, 3],
  },
  {
    id: 'fixed_window',
    name: 'Fixed Window',
    badge: 'TIERED BILLING & QUOTAS',
    complexity: 'O(1) CPU · Hard epoch resets',
    tagline: 'Predictable hard quota reset per minute, hour, or day',
    bestFor: 'Subscription tiers, usage-based billing & API key plans',
    bestForDesc: 'Deterministic rate windows aligned directly with customer quotas and billing cycles.',
    onSpike: 'Strictly blocks excess calls until next time-window tick',
    onSpikeDesc: 'Instantly cuts traffic when request count exceeds cap; resets cleanly on the clock boundary.',
    experience: 'Deterministic 429 response with exact Retry-After header',
    experienceDesc: 'Clients receive precision epoch timestamps telling their HTTP client exactly when to resume.',
    headerSpec: 'Retry-After: <seconds>, X-RateLimit-Reset: <timestamp>',
    steadyBars: [3, 4, 2, 4, 3, 4, 2, 3, 4, 3, 2, 4],
    burstBars: [2, 5, 5, 2, 1, 5, 4, 2, 3, 5, 4, 2],
    cappedIdxBurst: [1, 2, 5, 9],
  },
  {
    id: 'sliding_window',
    name: 'Sliding Window',
    badge: 'STRICT AUTH & BRUTE-FORCE DEFENSE',
    complexity: 'O(log N) · Rolling precision',
    tagline: 'Zero double-burst loopholes across boundary reset edges',
    bestFor: 'Authentication, OTP delivery, AI chat & checkout routes',
    bestForDesc: 'Prevents edge attackers from sending 2x the limit across minute boundaries (:59 and :00).',
    onSpike: 'Calculates rolling request weight over rolling 60-second window',
    onSpikeDesc: 'Smoothly interpolates traffic density across previous and current time frames.',
    experience: 'Strictest defense against brute-force and credential stuffing',
    experienceDesc: 'Eliminates boundary exploitation completely while maintaining smooth legitimate throughput.',
    headerSpec: 'X-RateLimit-Policy: sliding-window-rolling-60s',
    steadyBars: [3, 3, 4, 3, 3, 4, 3, 3, 4, 3, 3, 3],
    burstBars: [4, 4, 2, 2, 4, 3, 3, 3, 4, 2, 3, 3],
    cappedIdxBurst: [2, 3, 9],
  },
];

const TIME_MARKS = ['00s', '05s', '10s', '15s', '20s', '25s', '30s', '35s', '40s', '45s', '50s', '55s'];

export default function AlgorithmShowcase() {
  const [openId, setOpenId] = useState('token_bucket');
  const [pattern, setPattern] = useState('burst'); // 'steady' | 'burst'

  return (
    <div>
      {/* Sleek Segmented Traffic Profile Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#8C887F',
            }}
          >
            SIMULATION STREAM
          </span>
          <span style={{ fontSize: '12px', color: '#B5AFA4' }}>•</span>
          <span style={{ fontSize: '12.5px', color: '#5F5C55' }}>
            Toggle traffic pattern to test gate throttling
          </span>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#E6E2D9',
            border: '1px solid #DCD7CD',
            borderRadius: '3px',
            padding: '2px',
            gap: '2px',
          }}
          role="group"
          aria-label="Traffic profile switcher"
        >
          <button
            type="button"
            onClick={() => setPattern('steady')}
            style={{
              padding: '6px 14px',
              borderRadius: '2px',
              border: pattern === 'steady' ? '1px solid #DCD7CD' : '1px solid transparent',
              background: pattern === 'steady' ? '#FBF9F5' : 'transparent',
              color: pattern === 'steady' ? '#1C1B18' : '#5F5C55',
              fontSize: '12px',
              fontWeight: pattern === 'steady' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 140ms ease',
            }}
          >
            Steady Traffic
          </button>
          <button
            type="button"
            onClick={() => setPattern('burst')}
            style={{
              padding: '6px 14px',
              borderRadius: '2px',
              border: pattern === 'burst' ? '1px solid #DCD7CD' : '1px solid transparent',
              background: pattern === 'burst' ? '#FBF9F5' : 'transparent',
              color: pattern === 'burst' ? '#1C1B18' : '#5F5C55',
              fontSize: '12px',
              fontWeight: pattern === 'burst' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 140ms ease',
            }}
          >
            Sudden Burst (Spike)
          </button>
        </div>
      </div>

      {/* Swiss Hairline Expandable Index */}
      <div>
        {MODES.map((mode) => {
          const isOpen = mode.id === openId;
          const bars = pattern === 'burst' ? mode.burstBars : mode.steadyBars;
          const capped = pattern === 'burst' ? mode.cappedIdxBurst : [];

          return (
            <div key={mode.id} className="lx-hairline-row">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : mode.id)}
                className="lx-hairline-trigger"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '22px 6px',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(200px, 1.2fr) minmax(0, 1.6fr) auto auto',
                  alignItems: 'center',
                  gap: '20px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                aria-expanded={isOpen}
              >
                {/* Algorithm Name + Category Badge */}
                <div>
                  <div
                    style={{
                      fontFamily: '"Plus Jakarta Sans", var(--font-sans), sans-serif',
                      fontSize: '18px',
                      fontWeight: 650,
                      color: '#1C1B18',
                      letterSpacing: '-0.02em',
                      marginBottom: '4px',
                    }}
                  >
                    {mode.name}
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: '#8C887F',
                      textTransform: 'uppercase',
                    }}
                  >
                    {mode.badge}
                  </span>
                </div>

                {/* Subtitle Tagline */}
                <span className="lx-hairline-hide-sm" style={{ fontSize: '14px', color: '#5F5C55', lineHeight: 1.45 }}>
                  {mode.tagline}
                </span>

                {/* Technical Complexity Pill */}
                <span
                  className="lx-hairline-hide-sm"
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '11px',
                    padding: '5px 10px',
                    background: '#FBF9F5',
                    border: '1px solid #DCD7CD',
                    borderRadius: '2px',
                    color: '#1C1B18',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {mode.complexity}
                </span>

                {/* Plus / Minus Expand Icon */}
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '2px',
                    border: '1px solid #DCD7CD',
                    background: isOpen ? '#1C1B18' : '#FBF9F5',
                    color: isOpen ? '#FAF8F5' : '#1C1B18',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 160ms ease',
                    flexShrink: 0,
                  }}
                >
                  {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                </span>
              </button>

              {/* Expanded Behaviour Visualizer */}
              {isOpen && (
                <div className="lx-stage-enter" style={{ padding: '4px 0 32px' }}>
                  <div
                    style={{
                      background: '#FBF9F5',
                      border: '1px solid #DCD7CD',
                      borderRadius: '3px',
                      padding: '24px',
                      boxShadow: '0 16px 36px -16px rgba(28, 27, 24, 0.09)',
                    }}
                  >
                    {/* Live Pulse Gate Lane */}
                    <div
                      style={{
                        position: 'relative',
                        height: '50px',
                        background: '#F5F2EB',
                        border: '1px solid #DCD7CD',
                        borderRadius: '2px',
                        marginBottom: '22px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: '16px',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#8C887F',
                          letterSpacing: '0.06em',
                          zIndex: 2,
                        }}
                      >
                        CLIENT INGRESS
                      </span>

                      <span
                        style={{
                          position: 'absolute',
                          right: '16px',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#1C1B18',
                          letterSpacing: '0.06em',
                          zIndex: 2,
                        }}
                      >
                        PROTECTED ORIGIN (200 OK)
                      </span>

                      {/* Center Gate Barrier Line */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '6px',
                          bottom: '6px',
                          width: '2px',
                          background: '#1C1B18',
                          zIndex: 3,
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          top: '4px',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          background: '#1C1B18',
                          color: '#FAF8F5',
                          padding: '2px 9px',
                          borderRadius: '1px',
                          letterSpacing: '0.06em',
                          zIndex: 4,
                          boxShadow: '0 2px 6px rgba(28, 27, 24, 0.2)',
                        }}
                      >
                        LIMITX GATEWAY · EVAL &lt; 0.6MS
                      </span>

                      {/* Animated Allowed Pulses */}
                      {[0, -1.1, -2.2].map((delay, idx) => (
                        <span
                          key={`pass-${idx}`}
                          className="lx-pulse-pass"
                          style={{
                            position: 'absolute',
                            left: '80px',
                            width: '22px',
                            height: '4px',
                            borderRadius: '1px',
                            background: '#1C1B18',
                            animationDelay: `${delay}s`,
                          }}
                        />
                      ))}

                      {/* Under Spike: Excess Pulses Halt at Gate */}
                      {pattern === 'burst' &&
                        [-0.3, -1.0, -1.7].map((delay, idx) => (
                          <span
                            key={`halt-${idx}`}
                            className="lx-pulse-halt"
                            style={{
                              position: 'absolute',
                              left: '80px',
                              top: idx % 2 === 0 ? '16px' : '30px',
                              width: '18px',
                              height: '3.5px',
                              borderRadius: '1px',
                              background: '#A83B2B',
                              animationDelay: `${delay}s`,
                            }}
                          />
                        ))}
                    </div>

                    {/* SVG Traffic Histogram Strip */}
                    <div style={{ marginBottom: '24px' }}>
                      <svg
                        viewBox="0 0 740 92"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                        role="img"
                        aria-label={`${mode.name} behavior under ${pattern} traffic`}
                      >
                        {/* Threshold Line */}
                        <line x1="0" y1="24" x2="740" y2="24" stroke="#DCD7CD" strokeWidth="1" strokeDasharray="4 4" />
                        <text x="740" y="16" textAnchor="end" fontSize="9.5" fontFamily="IBM Plex Mono, monospace" fontWeight="600" fill="#8C887F">
                          CAPACITY CEILING (100 REQ/S)
                        </text>

                        {bars.map((val, i) => {
                          const x = 14 + i * 60;
                          const h = (val / 5) * 48;
                          const y = 74 - h;
                          const isCapped = capped.includes(i);

                          return (
                            <g key={`${mode.id}-${pattern}-${i}`}>
                              <rect
                                x={x}
                                y={y}
                                width="38"
                                height={h}
                                rx="1.5"
                                fill="#1C1B18"
                                className="lx-bar-rise"
                                style={{ animationDelay: `${i * 20}ms` }}
                              />
                              {isCapped && (
                                <g>
                                  <rect
                                    x={x}
                                    y={Math.max(2, y - 20)}
                                    width="38"
                                    height="15"
                                    rx="1.5"
                                    fill="#F9ECEA"
                                    stroke="#E8C4BE"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={x + 19}
                                    y={Math.max(2, y - 20) + 11}
                                    textAnchor="middle"
                                    fontSize="9"
                                    fontFamily="IBM Plex Mono, monospace"
                                    fontWeight="750"
                                    fill="#A83B2B"
                                  >
                                    429
                                  </text>
                                </g>
                              )}
                              {/* X Axis Time Marks */}
                              <text
                                x={x + 19}
                                y={88}
                                textAnchor="middle"
                                fontSize="9"
                                fontFamily="IBM Plex Mono, monospace"
                                fontWeight="500"
                                fill="#8C887F"
                              >
                                {TIME_MARKS[i]}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* 3 Technical Architecture Spec Tiles */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          padding: '14px 16px',
                          background: '#F5F2EB',
                          border: '1px solid #DCD7CD',
                          borderRadius: '2px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Cpu size={13} color="#8C887F" />
                          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '10px', color: '#8C887F', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                            Workload Profile
                          </span>
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 650, color: '#1C1B18', marginBottom: '4px' }}>
                          {mode.bestFor}
                        </div>
                        <div style={{ fontSize: '12px', color: '#5F5C55', lineHeight: 1.45 }}>
                          {mode.bestForDesc}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '14px 16px',
                          background: '#F5F2EB',
                          border: '1px solid #DCD7CD',
                          borderRadius: '2px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Zap size={13} color="#8C887F" />
                          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '10px', color: '#8C887F', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                            Spike Handling
                          </span>
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 650, color: '#1C1B18', marginBottom: '4px' }}>
                          {mode.onSpike}
                        </div>
                        <div style={{ fontSize: '12px', color: '#5F5C55', lineHeight: 1.45 }}>
                          {mode.onSpikeDesc}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '14px 16px',
                          background: '#F5F2EB',
                          border: '1px solid #DCD7CD',
                          borderRadius: '2px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <ShieldCheck size={13} color="#8C887F" />
                          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '10px', color: '#8C887F', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                            Client Contract
                          </span>
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 650, color: '#1C1B18', marginBottom: '4px' }}>
                          {mode.experience}
                        </div>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: '#4A4843', marginTop: '4px', background: '#EAE6DD', padding: '3px 6px', borderRadius: '1px', display: 'inline-block' }}>
                          {mode.headerSpec}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
