import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, ShieldBan, Layers, Activity, ArrowUpRight, CheckCircle2 } from 'lucide-react';

const PANELS = [
  {
    id: 'routes',
    title: 'Lock down costly routes',
    shortTitle: 'Costly routes',
    category: 'ROUTE DEFENSE',
    metric: '5 req / min',
    metricLabel: 'on OTP, login & AI routes',
    meterFill: 4,
    meterTotal: 12,
    meterTag: 'Strict cap',
    body: 'Put tight caps on expensive endpoints so bots never drain your database, AI tokens, or SMS budget, while public reads stay blazing fast.',
    tags: [
      { method: 'POST', path: '/auth/otp', spec: '5/m' },
      { method: 'POST', path: '/ai/chat', spec: '15/m' },
      { method: 'GET', path: '/products', spec: '120/m' },
    ],
    footerSpec: 'Zero cold starts · Real-time rule propagation',
    icon: SlidersHorizontal,
  },
  {
    id: 'block',
    title: 'Ban bad IPs in one click',
    shortTitle: 'One-click IP ban',
    category: 'EDGE FIREWALL',
    metric: '403 Instant',
    metricLabel: 'dropped before reaching your server',
    meterFill: 0,
    meterTotal: 12,
    meterTag: 'Zero origin load',
    body: 'Spot an IP hammering your API and cut it off instantly straight from the dashboard — zero SSH, firewall scripts, or server restarts.',
    tags: [
      { method: 'IP', path: '203.0.113.42', spec: 'Banned' },
      { method: 'EDGE', path: '0 Byte Origin Load', spec: 'Instant' },
    ],
    footerSpec: 'Edge drop latency < 0.4ms · Zero backend impact',
    icon: ShieldBan,
  },
  {
    id: 'plumbing',
    title: 'Skip rate-limit plumbing',
    shortTitle: 'Zero middleware',
    category: 'REVERSE PROXY',
    metric: '0 lines',
    metricLabel: 'of backend code to maintain',
    meterFill: 12,
    meterTotal: 12,
    meterTag: 'Live updates',
    body: 'No middleware packages to keep in sync across microservices, and no redeployment required when adjusting limit thresholds.',
    tags: [
      { method: 'URL', path: '1 Reverse Proxy URL', spec: 'Live' },
      { method: 'SDK', path: 'Zero Code Imports', spec: 'Clean' },
    ],
    footerSpec: 'Works with Node, Python, Go, Ruby, Java & PHP',
    icon: Layers,
  },
  {
    id: 'spikes',
    title: 'Catch spikes as they happen',
    shortTitle: 'Live traffic feed',
    category: 'AUDIT FEED',
    metric: 'Live 429',
    metricLabel: 'throttles & latency in one audit feed',
    meterFill: 8,
    meterTotal: 12,
    meterTag: 'Real-time audit',
    body: 'Inspect which endpoints are getting flooded, which IPs got throttled, and how fast your origin responds with full telemetry.',
    tags: [
      { method: 'POST', path: '/auth/login', spec: '429 Drop' },
      { method: 'GET', path: '/feed', spec: '200 · 0.8ms' },
    ],
    footerSpec: 'Sub-millisecond packet telemetry · Exportable audit logs',
    icon: Activity,
  },
];

export default function WhyLimitXStage() {
  const [activeId, setActiveId] = useState('routes');
  const deckRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return undefined;

    let rafId = null;
    const tick = () => {
      const deck = deckRef.current;
      if (deck) {
        const rect = deck.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        const raw = (vh - rect.top) / (vh * 0.65);
        const baseP = Math.max(0, Math.min(1, raw));

        cardRefs.current.forEach((el, idx) => {
          if (!el) return;
          const localP = Math.max(0, Math.min(1, (baseP - idx * 0.08) / 0.72));
          const ease = 1 - Math.pow(1 - localP, 3);
          const y = (1 - ease) * (26 + idx * 7);
          const tiltX = (1 - ease) * 4;
          el.style.transform = `perspective(1000px) translate3d(0, ${y.toFixed(1)}px, 0) rotateX(${tiltX.toFixed(2)}deg)`;
          el.style.opacity = Math.min(1, 0.35 + ease * 0.65).toFixed(3);
        });
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={deckRef} className="lx-expand-deck">
      {PANELS.map((panel, idx) => {
        const isActive = panel.id === activeId;
        const Icon = panel.icon;

        return (
          <button
            key={panel.id}
            ref={(el) => {
              cardRefs.current[idx] = el;
            }}
            type="button"
            onClick={() => setActiveId(panel.id)}
            onMouseEnter={() => setActiveId(panel.id)}
            className={`lx-expand-panel ${isActive ? 'active' : ''}`}
            style={{
              background: isActive ? '#FBF9F5' : '#EAE6DD',
              borderColor: isActive ? '#1C1B18' : '#D5CFC3',
              borderRadius: '3px',
              padding: '24px 22px',
              boxShadow: isActive ? '0 24px 50px -20px rgba(28, 27, 24, 0.18)' : 'none',
              transition: 'flex 380ms cubic-bezier(0.22, 1, 0.36, 1), background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            aria-expanded={isActive}
          >
            {/* Top Row: Icon + Subtle Status Cue */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '2px',
                  background: isActive ? '#1C1B18' : '#DDD7CB',
                  color: isActive ? '#FAF8F5' : '#1C1B18',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background-color 200ms ease, color 200ms ease',
                  border: isActive ? '1px solid #1C1B18' : '1px solid #CFC7BA',
                }}
              >
                <Icon size={18} strokeWidth={1.8} />
              </div>

              {!isActive ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#8C887F',
                    }}
                  >
                    0{idx + 1}
                  </span>
                  <ArrowUpRight size={13} color="#8C887F" />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#2D6A4F',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#2D6A4F',
                    }}
                  >
                    0{idx + 1} · ACTIVE
                  </span>
                </div>
              )}
            </div>

            {/* Panel Body */}
            {isActive ? (
              <div className="lx-stage-enter" style={{ marginTop: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Metric Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <span
                    style={{
                      fontFamily: '"Plus Jakarta Sans", var(--font-sans), sans-serif',
                      fontSize: 'clamp(28px, 3.2vw, 36px)',
                      fontWeight: 750,
                      letterSpacing: '-0.035em',
                      color: '#1C1B18',
                      lineHeight: 1,
                    }}
                  >
                    {panel.metric}
                  </span>
                  <span style={{ fontSize: '13px', color: '#5F5C55', fontWeight: 500 }}>
                    {panel.metricLabel}
                  </span>
                </div>

                {/* Segmented Precision Gauge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '18px',
                  }}
                >
                  {Array.from({ length: panel.meterTotal }, (_, slot) => (
                    <span
                      key={slot}
                      style={{
                        flex: 1,
                        height: '5px',
                        borderRadius: '1px',
                        background: slot < panel.meterFill ? '#1C1B18' : '#DCD7CD',
                        transition: 'background-color 220ms ease',
                      }}
                    />
                  ))}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: '#5F5C55',
                      marginLeft: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {panel.meterTag}
                  </span>
                </div>

                {/* Title & Body */}
                <h3
                  style={{
                    fontFamily: '"Plus Jakarta Sans", var(--font-sans), sans-serif',
                    fontSize: '19px',
                    fontWeight: 650,
                    color: '#1C1B18',
                    marginBottom: '10px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {panel.title}
                </h3>

                <p style={{ margin: '0 0 20px', fontSize: '14px', lineHeight: 1.6, color: '#4A4843', maxWidth: '440px' }}>
                  {panel.body}
                </p>

                {/* Endpoint Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
                  {panel.tags.map((t) => (
                    <span
                      key={t.path}
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '11px',
                        padding: '6px 10px',
                        background: '#FAF8F5',
                        border: '1px solid #DCD7CD',
                        borderRadius: '2px',
                        color: '#1C1B18',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <strong style={{ color: '#1C1B18', fontWeight: 700 }}>{t.method}</strong>
                      <span style={{ color: '#4A4843' }}>{t.path}</span>
                      <span style={{ color: '#8C887F' }}>·</span>
                      <span style={{ color: '#1C1B18', fontWeight: 600 }}>{t.spec}</span>
                    </span>
                  ))}
                </div>

                {/* Subtle Architecture Footer spec */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '14px',
                    borderTop: '1px solid #EFE8DD',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11.5px',
                    color: '#5F5C55',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  <CheckCircle2 size={13} color="#2D6A4F" />
                  <span>{panel.footerSpec}</span>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 'auto', paddingTop: '28px' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#8C887F',
                    marginBottom: '6px',
                  }}
                >
                  {panel.category}
                </div>
                <div
                  style={{
                    fontFamily: '"Plus Jakarta Sans", var(--font-sans), sans-serif',
                    fontSize: '16.5px',
                    fontWeight: 650,
                    color: '#1C1B18',
                    lineHeight: 1.3,
                    marginBottom: '8px',
                    letterSpacing: '-0.015em',
                  }}
                >
                  {panel.shortTitle}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '13px',
                    color: '#1C1B18',
                    fontWeight: 600,
                  }}
                >
                  {panel.metric}
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
