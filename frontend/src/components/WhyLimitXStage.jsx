import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, ShieldBan, Layers, Activity, ArrowUpRight } from 'lucide-react';

const PANELS = [
  {
    id: 'routes',
    title: 'Lock down costly routes',
    shortTitle: 'Costly routes',
    metric: '5 req / min',
    metricLabel: 'on OTP, login & AI routes',
    meterFill: 4,
    meterTotal: 12,
    meterTag: 'Strict cap',
    body: 'Put tight caps on expensive endpoints so bots never drain your database or LLM credits, while public reads stay fast.',
    tags: ['/auth/otp · 5/m', '/ai/chat · 15/m', '/products · 120/m'],
    icon: SlidersHorizontal,
  },
  {
    id: 'block',
    title: 'Ban bad IPs in one click',
    shortTitle: 'One-click IP ban',
    metric: '403 Instant',
    metricLabel: 'dropped before reaching your server',
    meterFill: 0,
    meterTotal: 12,
    meterTag: 'Zero origin load',
    body: 'Spot an IP hammering your API and cut it off straight from the dashboard — no SSH, firewall edits, or server restart.',
    tags: ['203.0.113.42 · Blocked', 'Edge drop'],
    icon: ShieldBan,
  },
  {
    id: 'plumbing',
    title: 'Skip rate-limit plumbing',
    shortTitle: 'Zero middleware',
    metric: '0 lines',
    metricLabel: 'of backend code to maintain',
    meterFill: 12,
    meterTotal: 12,
    meterTag: 'Live updates',
    body: 'No middleware packages to keep in sync across services and no redeploy every time you want to tweak a threshold.',
    tags: ['1 proxy URL', 'Edit limits live'],
    icon: Layers,
  },
  {
    id: 'spikes',
    title: 'Catch spikes as they happen',
    shortTitle: 'Live traffic feed',
    metric: 'Live 429',
    metricLabel: 'throttles & latency in one place',
    meterFill: 8,
    meterTotal: 12,
    meterTag: 'Real-time audit',
    body: 'See which endpoints are getting flooded, who got throttled, and how fast your backend is responding in real time.',
    tags: ['POST /auth · 429', 'GET /feed · 200 · 11ms'],
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
    if (prefersReduced) return;

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
          // Staggered fan entrance across the 4 vault panels
          const localP = Math.max(0, Math.min(1, (baseP - idx * 0.08) / 0.72));
          const ease = 1 - Math.pow(1 - localP, 3);
          const y = (1 - ease) * (34 + idx * 10);
          const tiltX = (1 - ease) * 7;
          el.style.transform = `perspective(1000px) translate3d(0, ${y.toFixed(1)}px, 0) rotateX(${tiltX.toFixed(2)}deg)`;
          el.style.opacity = Math.min(1, 0.25 + ease * 0.75).toFixed(3);
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
            ref={(el) => { cardRefs.current[idx] = el; }}
            type="button"
            onClick={() => setActiveId(panel.id)}
            onMouseEnter={() => setActiveId(panel.id)}
            className={`lx-expand-panel ${isActive ? 'active' : ''}`}
            style={{
              boxShadow: isActive ? '0 24px 48px -28px rgba(28, 27, 24, 0.22)' : 'none',
            }}
            aria-expanded={isActive}
          >
            {/* Top Row: Icon + Subtle Direction Cue */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '2px',
                  background: isActive ? '#1C1B18' : '#E5E1D8',
                  color: isActive ? '#FBF9F5' : '#4A4843',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background-color 200ms ease, color 200ms ease',
                }}
              >
                <Icon size={16} strokeWidth={1.75} />
              </div>

              {!isActive && <ArrowUpRight size={15} color="#8C887F" />}
            </div>

            {/* Body */}
            {isActive ? (
              <div className="lx-stage-enter" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'clamp(26px, 3vw, 34px)',
                      fontWeight: 500,
                      letterSpacing: '-0.03em',
                      color: '#1C1B18',
                      lineHeight: 1,
                    }}
                  >
                    {panel.metric}
                  </span>
                  <span style={{ fontSize: '12.5px', color: '#8C887F' }}>
                    {panel.metricLabel}
                  </span>
                </div>

                {/* Tactile Segmented Precision Gauge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '16px',
                  }}
                >
                  {Array.from({ length: panel.meterTotal }, (_, slot) => (
                    <span
                      key={slot}
                      style={{
                        flex: 1,
                        height: '5px',
                        borderRadius: '1px',
                        background: slot < panel.meterFill ? '#1C1B18' : '#E5E1D8',
                        transition: 'background-color 220ms ease',
                      }}
                    />
                  ))}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10.5px',
                      color: '#5F5C55',
                      marginLeft: '8px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {panel.meterTag}
                  </span>
                </div>

                <div style={{ fontSize: '18px', fontWeight: 500, color: '#1C1B18', marginBottom: '8px', letterSpacing: '-0.015em' }}>
                  {panel.title}
                </div>

                <p style={{ margin: '0 0 18px', fontSize: '14px', lineHeight: 1.55, color: '#4A4843', maxWidth: '390px' }}>
                  {panel.body}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {panel.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        padding: '4px 8px',
                        background: '#F2EFE8',
                        border: '1px solid #DCD7CD',
                        borderRadius: '2px',
                        color: '#1C1B18',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '15.5px', fontWeight: 500, color: '#1C1B18', lineHeight: 1.35, marginBottom: '6px' }}>
                  {panel.shortTitle}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#5F5C55' }}>
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
