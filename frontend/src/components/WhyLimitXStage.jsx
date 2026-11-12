import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, ShieldBan, Layers, Activity, ArrowUpRight, CheckCircle2, AlertTriangle, ShieldCheck, Zap, RefreshCw, Terminal, Ban } from 'lucide-react';

export default function WhyLimitXStage() {
  const [activeId, setActiveId] = useState('routes');
  const deckRef = useRef(null);
  const cardRefs = useRef([]);

  // --- Panel 1: Route Caps Interactive Simulator ---
  const [routeState, setRouteState] = useState({
    otp: { count: 5, limit: 5, blocked: 38 },
    ai: { count: 8, limit: 15, blocked: 0 },
    products: { count: 42, limit: 120, blocked: 0 },
  });
  const [isSpiking, setIsSpiking] = useState(false);

  const simulateOtpSpike = (e) => {
    e.stopPropagation();
    setIsSpiking(true);
    setRouteState((prev) => ({
      ...prev,
      otp: { ...prev.otp, blocked: prev.otp.blocked + 12 },
    }));
    setTimeout(() => setIsSpiking(false), 900);
  };

  // --- Panel 2: IP Ban Interactive Simulator ---
  const [isBanned, setIsBanned] = useState(true);
  const [droppedPackets, setDroppedPackets] = useState(5840);

  useEffect(() => {
    if (!isBanned) return undefined;
    const interval = setInterval(() => {
      setDroppedPackets((prev) => prev + Math.floor(Math.random() * 4) + 1);
    }, 1800);
    return () => clearInterval(interval);
  }, [isBanned]);

  // --- Panel 4: Live Telemetry Audit Feed ---
  const [logs, setLogs] = useState([
    { id: 1, time: '14:32:01.412', method: 'POST', path: '/auth/otp', status: 429, ip: '198.51.100.8', lat: '0.3ms' },
    { id: 2, time: '14:32:01.415', method: 'GET', path: '/v1/pricing', status: 200, ip: '45.33.32.156', lat: '0.8ms' },
    { id: 3, time: '14:32:01.418', method: 'POST', path: '/auth/login', status: 429, ip: '198.51.100.8', lat: '0.4ms' },
    { id: 4, time: '14:32:01.421', method: 'GET', path: '/api/health', status: 200, ip: '104.28.19.4', lat: '0.5ms' },
  ]);

  useEffect(() => {
    if (activeId !== 'spikes') return undefined;
    const samplePool = [
      { method: 'POST', path: '/auth/otp', status: 429, ip: '198.51.100.8', lat: '0.3ms' },
      { method: 'GET', path: '/v1/users/me', status: 200, ip: '172.56.21.90', lat: '0.7ms' },
      { method: 'POST', path: '/ai/generate', status: 200, ip: '98.114.2.8', lat: '1.2ms' },
      { method: 'POST', path: '/auth/login', status: 429, ip: '185.220.101.5', lat: '0.4ms' },
      { method: 'GET', path: '/products', status: 200, ip: '66.249.66.1', lat: '0.6ms' },
    ];
    const logInterval = setInterval(() => {
      const pick = samplePool[Math.floor(Math.random() * samplePool.length)];
      const now = new Date();
      const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
      setLogs((prev) => [{ id: Date.now(), time: timeStr, ...pick }, ...prev.slice(0, 4)]);
    }, 2200);
    return () => clearInterval(logInterval);
  }, [activeId]);

  // Gentle scroll tilt effect
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
          const y = (1 - ease) * (24 + idx * 6);
          el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
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

  const PANELS = [
    {
      id: 'routes',
      title: 'Lock down costly routes',
      shortTitle: 'Costly routes',
      category: 'ROUTE CAPS',
      metric: '5 req / min',
      metricLabel: 'on OTP, login & AI routes',
      icon: SlidersHorizontal,
      renderUnique: () => (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Interactive Route Matrix */}
          <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '2px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, padding: '2px 5px', background: '#1C1B18', color: '#FAF8F5', borderRadius: '1px' }}>POST</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#1C1B18' }}>/auth/otp</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#A83B2B', fontWeight: 700, background: '#F9ECEA', padding: '2px 6px', borderRadius: '1px', border: '1px solid #E8C4BE' }}>
                429 RATE_LIMITED ({routeState.otp.blocked} BLOCKED)
              </span>
            </div>

            {/* Segmented Fill Meter */}
            <div style={{ display: 'flex', gap: '3px', height: '8px', marginBottom: '6px' }}>
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: isSpiking ? '#A83B2B' : '#C23B3B',
                    borderRadius: '1px',
                    transition: 'all 200ms ease',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#5F5C55', fontFamily: 'var(--font-mono)' }}>
              <span>5 / 5 max threshold hit</span>
              <span style={{ color: '#A83B2B' }}>Spared SMS/Twilio API cost</span>
            </div>
          </div>

          {/* Healthy Route Comparison */}
          <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '2px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, padding: '2px 5px', background: '#E6E2D9', color: '#1C1B18', borderRadius: '1px' }}>GET</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#1C1B18' }}>/v1/products</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#2D6A4F', fontWeight: 700, background: '#EBF3EE', padding: '2px 6px', borderRadius: '1px', border: '1px solid #C5DDD0' }}>
                200 OK · PASSTHROUGH (0.4ms)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '3px', height: '8px', marginBottom: '6px' }}>
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: i < 4 ? '#1C1B18' : '#DCD7CD',
                    borderRadius: '1px',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#5F5C55', fontFamily: 'var(--font-mono)' }}>
              <span>42 / 120 reqs</span>
              <span>Reads stay blazing fast</span>
            </div>
          </div>

          {/* Interactive Trigger Button */}
          <button
            type="button"
            onClick={simulateOtpSpike}
            style={{
              padding: '8px 12px',
              borderRadius: '2px',
              border: '1px solid #DCD7CD',
              background: '#FAF8F5',
              color: '#1C1B18',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '4px',
            }}
          >
            <Zap size={13} color="#C23B3B" />
            <span>Simulate Bot Flood on /auth/otp ({isSpiking ? 'Throttling...' : '+12 Hits'})</span>
          </button>
        </div>
      ),
    },
    {
      id: 'block',
      title: 'Ban bad IPs in one click',
      shortTitle: 'One-click IP ban',
      category: 'EDGE FIREWALL',
      metric: '403 Instant',
      metricLabel: 'dropped before reaching your server',
      icon: ShieldBan,
      renderUnique: () => (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Active Offender Card */}
          <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '2px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 700, color: '#8C887F', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  DETECTED OFFENDER IP
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#1C1B18', marginTop: '2px' }}>
                  203.0.113.42 <span style={{ fontSize: '11px', color: '#8C887F', fontWeight: 400 }}>(Frankfurt TOR node)</span>
                </div>
              </div>

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '1px',
                  background: isBanned ? '#F9ECEA' : '#FAF3E8',
                  color: isBanned ? '#A83B2B' : '#9A6324',
                  border: isBanned ? '1px solid #E8C4BE' : '1px solid #E8D5B5',
                }}
              >
                {isBanned ? 'EDGE BAN ACTIVE' : 'UNRESTRICTED'}
              </span>
            </div>

            {/* Impact Metric Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div style={{ padding: '8px 10px', background: '#FBF9F5', border: '1px solid #DCD7CD', borderRadius: '1px' }}>
                <div style={{ fontSize: '10px', color: '#8C887F', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Origin Load</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: isBanned ? '#2D6A4F' : '#A83B2B', fontFamily: 'var(--font-mono)' }}>
                  {isBanned ? '0 Bytes' : '180 req/s'}
                </div>
              </div>
              <div style={{ padding: '8px 10px', background: '#FBF9F5', border: '1px solid #DCD7CD', borderRadius: '1px' }}>
                <div style={{ fontSize: '10px', color: '#8C887F', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Dropped Packets</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1C1B18', fontFamily: 'var(--font-mono)' }}>
                  {droppedPackets.toLocaleString()}
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: '#5F5C55', lineHeight: 1.45 }}>
              {isBanned
                ? 'Packets are dropped instantly at edge edge before SSL handshake. Zero CPU spent by your server.'
                : 'Warning: Attacker traffic is currently reaching your backend directly.'}
            </p>
          </div>

          {/* 1-Click Action Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsBanned(!isBanned);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '2px',
              border: isBanned ? '1px solid #1C1B18' : '1px solid #C23B3B',
              background: isBanned ? '#1C1B18' : '#F9ECEA',
              color: isBanned ? '#FAF8F5' : '#A83B2B',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Ban size={13} />
            <span>{isBanned ? 'Click to Unban IP (Test Impact)' : 'Click to Ban IP Instantly'}</span>
          </button>
        </div>
      ),
    },
    {
      id: 'plumbing',
      title: 'Skip rate-limit plumbing',
      shortTitle: 'Zero middleware',
      category: 'REVERSE PROXY',
      metric: '0 lines',
      metricLabel: 'of backend code to maintain',
      icon: Layers,
      renderUnique: () => (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Architecture Visual Comparison */}
          <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '2px', padding: '14px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: '#2D6A4F', textTransform: 'uppercase', marginBottom: '8px' }}>
              ✓ WITH LIMITX (ZERO CODE PROXY)
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '8px 10px',
                background: '#FAF8F5',
                border: '1px solid #DCD7CD',
                borderRadius: '2px',
                color: '#1C1B18',
                lineHeight: 1.5,
                marginBottom: '10px',
              }}
            >
              Client ──▶ <strong>limitx.dev/proxy/:apiId</strong> ──▶ Clean Origin
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: '#8C887F', textTransform: 'uppercase', marginBottom: '8px' }}>
              ✕ TRADITIONAL DIY SETUP
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '8px 10px',
                background: '#EBE7DE',
                border: '1px solid #DCD7CD',
                borderRadius: '2px',
                color: '#5F5C55',
                lineHeight: 1.5,
              }}
            >
              Client ──▶ Express Middleware ──▶ Redis Cluster (Lua scripts) ──▶ App
            </div>
          </div>

          {/* Quick Specs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ padding: '8px 10px', background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '1px' }}>
              <div style={{ fontSize: '10px', color: '#8C887F', fontFamily: 'var(--font-mono)' }}>SETUP TIME</div>
              <div style={{ fontSize: '13px', fontWeight: 650, color: '#1C1B18' }}>60 Seconds</div>
            </div>
            <div style={{ padding: '8px 10px', background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '1px' }}>
              <div style={{ fontSize: '10px', color: '#8C887F', fontFamily: 'var(--font-mono)' }}>REDIS COSTS</div>
              <div style={{ fontSize: '13px', fontWeight: 650, color: '#2D6A4F' }}>$0 / month</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'spikes',
      title: 'Catch spikes as they happen',
      shortTitle: 'Live traffic feed',
      category: 'AUDIT FEED',
      metric: 'Live 429',
      metricLabel: 'throttles & latency in one audit feed',
      icon: Activity,
      renderUnique: () => (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Live Edge Telemetry Log Console */}
          <div
            style={{
              background: '#1C1B18',
              color: '#FAF8F5',
              borderRadius: '2px',
              padding: '12px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              border: '1px solid #332F2A',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #332F2A', paddingBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2D6A4F', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: '10px', color: '#C9C3B7', fontWeight: 600 }}>LIVE EDGE TELEMETRY</span>
              </div>
              <span style={{ fontSize: '9.5px', color: '#8C887F' }}>310 POPs ACTIVE</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {logs.map((item) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '60px 40px 1fr auto auto', gap: '8px', alignItems: 'center', fontSize: '10.5px' }}>
                  <span style={{ color: '#8C887F' }}>{item.time.split('.')[0]}</span>
                  <span style={{ color: item.method === 'POST' ? '#E59866' : '#A9DFBF', fontWeight: 700 }}>{item.method}</span>
                  <span style={{ color: '#FAF8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.path}</span>
                  <span
                    style={{
                      padding: '1px 5px',
                      borderRadius: '1px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      background: item.status === 429 ? '#5C241E' : '#1C3B2B',
                      color: item.status === 429 ? '#F5B7B1' : '#A9DFBF',
                    }}
                  >
                    {item.status}
                  </span>
                  <span style={{ color: '#8C887F', fontSize: '10px' }}>{item.lat}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px', fontSize: '11px', color: '#5F5C55', fontFamily: 'var(--font-mono)' }}>
            <span>Streaming updates in &lt;1ms</span>
            <span style={{ color: '#1C1B18', fontWeight: 600 }}>Zero database roundtrips</span>
          </div>
        </div>
      ),
    },
  ];

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
              <div className="lx-stage-enter" style={{ marginTop: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Metric Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans), sans-serif',
                      fontSize: 'clamp(28px, 3.2vw, 36px)',
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
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

                {/* Title */}
                <h3
                  style={{
                    fontFamily: 'var(--font-sans), sans-serif',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#1C1B18',
                    marginBottom: '4px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {panel.title}
                </h3>

                {/* Unique Living Functional Widget for each panel */}
                {panel.renderUnique()}
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
                    fontFamily: 'var(--font-sans), sans-serif',
                    fontSize: '16.5px',
                    fontWeight: 600,
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
