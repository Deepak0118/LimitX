import { useState } from 'react';
import { SlidersHorizontal, ShieldBan, Layers, Activity, ArrowUpRight } from 'lucide-react';

const PANELS = [
  {
    id: 'routes',
    title: 'Lock down costly routes',
    shortTitle: 'Costly routes',
    metric: '5 req / min',
    metricLabel: 'on OTP, login & AI routes',
    body: 'Put strict limits on expensive endpoints so bots never drain your database or LLM credits, while public reads stay fast.',
    tags: ['/auth/otp · 5/m', '/ai/chat · 15/m', '/products · 120/m'],
    icon: SlidersHorizontal,
  },
  {
    id: 'block',
    title: 'Ban bad IPs in one click',
    shortTitle: 'One-click IP ban',
    metric: '403 Instant',
    metricLabel: 'dropped before reaching your server',
    body: 'Spot an IP hammering your API and cut it off straight from the dashboard — no SSH, firewall edits, or server restart.',
    tags: ['203.0.113.42 · Blocked', 'Zero origin load'],
    icon: ShieldBan,
  },
  {
    id: 'plumbing',
    title: 'Skip rate-limit plumbing',
    shortTitle: 'Zero middleware',
    metric: '0 lines',
    metricLabel: 'of backend code to maintain',
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
    body: 'See which endpoints are getting flooded, who got throttled, and how fast your backend is responding in real time.',
    tags: ['POST /auth · 429', 'GET /feed · 200 · 11ms'],
    icon: Activity,
  },
];

export default function WhyLimitXStage() {
  const [activeId, setActiveId] = useState('routes');

  return (
    <div className="lx-expand-deck">
      {PANELS.map((panel) => {
        const isActive = panel.id === activeId;
        const Icon = panel.icon;

        return (
          <button
            key={panel.id}
            type="button"
            onClick={() => setActiveId(panel.id)}
            onMouseEnter={() => setActiveId(panel.id)}
            className={`lx-expand-panel ${isActive ? 'active' : ''}`}
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

            {/* Body: Expanded Content vs Collapsed Title */}
            {isActive ? (
              <div className="lx-stage-enter" style={{ marginTop: '28px' }}>
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

                <div style={{ fontSize: '18px', fontWeight: 500, color: '#1C1B18', marginBottom: '8px', letterSpacing: '-0.015em' }}>
                  {panel.title}
                </div>

                <p style={{ margin: '0 0 18px', fontSize: '14px', lineHeight: 1.55, color: '#4A4843', maxWidth: '380px' }}>
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
