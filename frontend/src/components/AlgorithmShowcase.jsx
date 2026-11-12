import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const MODES = [
  {
    id: 'token_bucket',
    name: 'Token Bucket',
    tagline: 'Lets normal bursts through, smooths heavy floods',
    bestFor: 'Mobile & public REST APIs',
    onSpike: 'Absorbs short burst, then paces',
    experience: 'Smooth for real users',
    steadyBars: [3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4],
    burstBars: [5, 5, 4, 2, 3, 4, 3, 3, 4, 3, 3, 4],
    cappedIdxBurst: [2, 3],
  },
  {
    id: 'fixed_window',
    name: 'Fixed Window',
    tagline: 'Simple hard cap per minute or hour',
    bestFor: 'Free tiers & API key plans',
    onSpike: 'Blocks extra calls until clock resets',
    experience: 'Predictable Retry-After',
    steadyBars: [3, 4, 2, 4, 3, 4, 2, 3, 4, 3, 2, 4],
    burstBars: [2, 5, 5, 2, 1, 5, 4, 2, 3, 5, 4, 2],
    cappedIdxBurst: [1, 2, 5, 9],
  },
  {
    id: 'sliding_window',
    name: 'Sliding Window',
    tagline: 'No loopholes across window reset boundaries',
    bestFor: 'Login, OTP & checkout routes',
    onSpike: 'Stops boundary double-spikes immediately',
    experience: 'Strictest brute-force guard',
    steadyBars: [3, 3, 4, 3, 3, 4, 3, 3, 4, 3, 3, 3],
    burstBars: [4, 4, 2, 2, 4, 3, 3, 3, 4, 2, 3, 3],
    cappedIdxBurst: [2, 3, 9],
  },
];

export default function AlgorithmShowcase() {
  const [openId, setOpenId] = useState('token_bucket');
  const [pattern, setPattern] = useState('burst'); // 'steady' | 'burst'

  return (
    <div>
      {/* Inline Profile Switcher */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div className="lx-seg" role="group" aria-label="Traffic profile">
          <button
            type="button"
            onClick={() => setPattern('steady')}
            className={`lx-seg-btn ${pattern === 'steady' ? 'active' : ''}`}
          >
            Steady traffic
          </button>
          <button
            type="button"
            onClick={() => setPattern('burst')}
            className={`lx-seg-btn ${pattern === 'burst' ? 'active' : ''}`}
          >
            Sudden spike
          </button>
        </div>
      </div>

      {/* Linear / Swiss Hairline Expandable Index */}
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
                aria-expanded={isOpen}
              >
                <span style={{ fontSize: '18px', fontWeight: 500, color: '#1C1B18', letterSpacing: '-0.015em' }}>
                  {mode.name}
                </span>

                <span className="lx-hairline-hide-sm" style={{ fontSize: '14.5px', color: '#4A4843' }}>
                  {mode.tagline}
                </span>

                <span
                  className="lx-hairline-hide-sm"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                    padding: '4px 10px',
                    background: '#EBE7DE',
                    border: '1px solid #DCD7CD',
                    borderRadius: '2px',
                    color: '#4A4843',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {mode.bestFor}
                </span>

                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '2px',
                    border: '1px solid #C9C3B7',
                    background: isOpen ? '#1C1B18' : '#FBF9F5',
                    color: isOpen ? '#FBF9F5' : '#1C1B18',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                </span>
              </button>

              {isOpen && (
                <div className="lx-stage-enter" style={{ padding: '4px 6px 26px' }}>
                  <div
                    style={{
                      background: '#FBF9F5',
                      border: '1px solid #DCD7CD',
                      borderRadius: '2px',
                      padding: '20px',
                    }}
                  >
                    {/* Live Monochrome Pulse Gate Lane tying directly into the Vault concept */}
                    <div
                      style={{
                        position: 'relative',
                        height: '44px',
                        background: '#F5F2EB',
                        border: '1px solid #E5E1D8',
                        borderRadius: '2px',
                        marginBottom: '18px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: '12px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: '#8C887F',
                          zIndex: 2,
                        }}
                      >
                        INCOMING
                      </span>
                      <span
                        style={{
                          position: 'absolute',
                          right: '12px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: '#1C1B18',
                          zIndex: 2,
                        }}
                      >
                        ORIGIN SAFE
                      </span>

                      {/* Center LimitX Gate Barrier */}
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
                          top: '2px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          background: '#1C1B18',
                          color: '#FBF9F5',
                          padding: '1px 6px',
                          borderRadius: '1px',
                          zIndex: 4,
                        }}
                      >
                        GATE
                      </span>

                      {/* Animated Allowed Pulses */}
                      {[0, -1.1, -2.2].map((delay, idx) => (
                        <span
                          key={`pass-${idx}`}
                          className="lx-pulse-pass"
                          style={{
                            position: 'absolute',
                            left: '70px',
                            width: '18px',
                            height: '4px',
                            borderRadius: '1px',
                            background: '#1C1B18',
                            animationDelay: `${delay}s`,
                          }}
                        />
                      ))}

                      {/* Under Spike: Excess Pulses Halt & Deflect at Gate Line */}
                      {pattern === 'burst' &&
                        [-0.3, -1.0, -1.7].map((delay, idx) => (
                          <span
                            key={`halt-${idx}`}
                            className="lx-pulse-halt"
                            style={{
                              position: 'absolute',
                              left: '70px',
                              top: idx % 2 === 0 ? '13px' : '28px',
                              width: '14px',
                              height: '3px',
                              borderRadius: '1px',
                              background: '#8C887F',
                              animationDelay: `${delay}s`,
                            }}
                          />
                        ))}
                    </div>

                    {/* Slim Full-Width Horizontal Traffic Strip */}
                    <svg
                      viewBox="0 0 740 84"
                      style={{ width: '100%', height: 'auto', display: 'block', marginBottom: '18px' }}
                      role="img"
                      aria-label={`${mode.name} behavior under ${pattern} traffic`}
                    >
                      <line x1="0" y1="22" x2="740" y2="22" stroke="#C9C3B7" strokeWidth="1" strokeDasharray="4 4" />
                      <text x="740" y="15" textAnchor="end" fontSize="10" fontFamily="IBM Plex Mono, monospace" fill="#8C887F">
                        ROUTE CAP
                      </text>

                      {bars.map((val, i) => {
                        const x = 14 + i * 60;
                        const h = (val / 5) * 52;
                        const y = 76 - h;
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
                              style={{ animationDelay: `${i * 22}ms` }}
                            />
                            {isCapped && (
                              <g>
                                <rect
                                  x={x}
                                  y={Math.max(4, y - 18)}
                                  width="38"
                                  height="14"
                                  rx="1.5"
                                  fill="#F5F2EB"
                                  stroke="#1C1B18"
                                  strokeWidth="1"
                                  strokeDasharray="3 2"
                                />
                                <text
                                  x={x + 19}
                                  y={Math.max(4, y - 18) + 10}
                                  textAnchor="middle"
                                  fontSize="8.5"
                                  fontFamily="IBM Plex Mono, monospace"
                                  fill="#4A4843"
                                >
                                  429
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      <line x1="0" y1="76" x2="740" y2="76" stroke="#DCD7CD" strokeWidth="1" />
                    </svg>

                    {/* 3 Clean User Takeaways Inline */}
                    <div
                      className="lx-three-col"
                      style={{
                        gap: '16px',
                        paddingTop: '14px',
                        borderTop: '1px solid #EFECE4',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: '#8C887F', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                          Ideal for
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#1C1B18' }}>
                          {mode.bestFor}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#8C887F', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                          When spikes hit
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#1C1B18' }}>
                          {mode.onSpike}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#8C887F', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                          Result
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#1C1B18' }}>
                          {mode.experience}
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
