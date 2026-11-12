import { useState, useEffect } from 'react';
import { SlidersHorizontal, ShieldBan, Layers, Activity, Zap, Ban, ArrowUpRight } from 'lucide-react';

export default function WhyLimitXStage() {
  // --- Card 1: Route Caps Interactive Simulator ---
  const [routeState, setRouteState] = useState({
    otp: { count: 5, limit: 5, blocked: 38 },
    products: { count: 42, limit: 120 },
  });
  const [isSpiking, setIsSpiking] = useState(false);

  const simulateOtpSpike = () => {
    setIsSpiking(true);
    setRouteState((prev) => ({
      ...prev,
      otp: { ...prev.otp, blocked: prev.otp.blocked + 12 },
    }));
    setTimeout(() => setIsSpiking(false), 900);
  };

  // --- Card 2: IP Ban Interactive Simulator ---
  const [isBanned, setIsBanned] = useState(true);
  const [droppedPackets, setDroppedPackets] = useState(5840);

  useEffect(() => {
    if (!isBanned) return undefined;
    const interval = setInterval(() => {
      setDroppedPackets((prev) => prev + Math.floor(Math.random() * 4) + 1);
    }, 1800);
    return () => clearInterval(interval);
  }, [isBanned]);

  // --- Card 4: Live Telemetry Audit Feed ---
  const [logs, setLogs] = useState([
    { id: 1, time: '14:32:01.412', method: 'POST', path: '/auth/otp', status: 429, ip: '198.51.100.8', lat: '0.3ms' },
    { id: 2, time: '14:32:01.415', method: 'GET', path: '/v1/pricing', status: 200, ip: '45.33.32.156', lat: '0.8ms' },
    { id: 3, time: '14:32:01.418', method: 'POST', path: '/auth/login', status: 429, ip: '198.51.100.8', lat: '0.4ms' },
    { id: 4, time: '14:32:01.421', method: 'GET', path: '/api/health', status: 200, ip: '104.28.19.4', lat: '0.5ms' },
  ]);

  useEffect(() => {
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
      setLogs((prev) => [{ id: Date.now(), time: timeStr, ...pick }, ...prev.slice(0, 3)]);
    }, 2400);
    return () => clearInterval(logInterval);
  }, []);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
      }}
    >
      {/* =========================================================================
          CARD 01: ROUTE CAPS
          ========================================================================= */}
      <div
        style={{
          background: '#FBF9F5',
          border: '1px solid #DCD7CD',
          borderRadius: '2px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(28, 27, 24, 0.03)',
        }}
      >
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '2px',
                  background: '#22211E',
                  color: '#FAF8F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SlidersHorizontal size={15} strokeWidth={1.8} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8C887F', fontWeight: 600 }}>
                01
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 600,
                color: '#5F5C55',
                background: '#EAE6DD',
                padding: '3px 8px',
                borderRadius: '1px',
                letterSpacing: '0.04em',
              }}
            >
              ROUTE CAPS
            </span>
          </div>

          <h3
            style={{
              margin: '0 0 8px',
              fontSize: '20px',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: '#1C1B18',
            }}
          >
            Lock down costly routes
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#4A4843', lineHeight: 1.55 }}>
            Put tight caps on expensive endpoints so bots never drain your database, AI tokens, or Twilio credits, while public reads stay fast.
          </p>

          {/* Interactive Route Matrix */}
          <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '2px', padding: '12px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 700, padding: '1px 5px', background: '#1C1B18', color: '#FAF8F5' }}>POST</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', fontWeight: 500, color: '#1C1B18' }}>/auth/otp</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#A83B2B', fontWeight: 700, background: '#F9ECEA', padding: '1px 6px', borderRadius: '1px', border: '1px solid #E8C4BE' }}>
                429 LIMITED ({routeState.otp.blocked} DROPPED)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '3px', height: '6px', marginBottom: '6px' }}>
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
              <span>5 / 5 cap reached</span>
              <span style={{ color: '#A83B2B' }}>SMS drain prevented</span>
            </div>
          </div>

          <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '2px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 700, padding: '1px 5px', background: '#E6E2D9', color: '#1C1B18' }}>GET</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', fontWeight: 500, color: '#1C1B18' }}>/v1/products</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#2D6A4F', fontWeight: 700, background: '#EBF3EE', padding: '1px 6px', borderRadius: '1px', border: '1px solid #C5DDD0' }}>
                200 OK · PASSTHROUGH (0.4ms)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '2px', height: '6px', marginBottom: '6px' }}>
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
              <span>Reads stay lightning fast</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
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
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: 'auto',
          }}
        >
          <Zap size={12} color="#C23B3B" />
          <span>Simulate Bot Flood on /auth/otp ({isSpiking ? 'Throttling...' : '+12 Hits'})</span>
        </button>
      </div>

      {/* =========================================================================
          CARD 02: 1-CLICK IP BAN
          ========================================================================= */}
      <div
        style={{
          background: '#FBF9F5',
          border: '1px solid #DCD7CD',
          borderRadius: '2px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(28, 27, 24, 0.03)',
        }}
      >
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '2px',
                  background: '#22211E',
                  color: '#FAF8F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldBan size={15} strokeWidth={1.8} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8C887F', fontWeight: 600 }}>
                02
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 600,
                color: '#5F5C55',
                background: '#EAE6DD',
                padding: '3px 8px',
                borderRadius: '1px',
                letterSpacing: '0.04em',
              }}
            >
              EDGE FIREWALL
            </span>
          </div>

          <h3
            style={{
              margin: '0 0 8px',
              fontSize: '20px',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: '#1C1B18',
            }}
          >
            Ban bad IPs in one click
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#4A4843', lineHeight: 1.55 }}>
            Spot an IP hammering your API and cut it off straight from the dashboard — no SSH, firewall scripts, or server restarts.
          </p>

          {/* Offender Profile */}
          <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '2px', padding: '14px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', color: '#8C887F', textTransform: 'uppercase' }}>OFFENDER IP</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13.5px', fontWeight: 600, color: '#1C1B18' }}>
                  203.0.113.42 <span style={{ fontSize: '10.5px', color: '#8C887F', fontWeight: 400 }}>(Frankfurt TOR node)</span>
                </div>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '1px',
                  background: isBanned ? '#F9ECEA' : '#FAF3E8',
                  color: isBanned ? '#A83B2B' : '#9A6324',
                  border: isBanned ? '1px solid #E8C4BE' : '1px solid #E8D5B5',
                }}
              >
                {isBanned ? 'EDGE BLOCKED' : 'UNRESTRICTED'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', background: '#FBF9F5', border: '1px solid #DCD7CD', borderRadius: '1px' }}>
                <div style={{ fontSize: '9.5px', color: '#8C887F', fontFamily: 'var(--font-mono)' }}>ORIGIN LOAD</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: isBanned ? '#2D6A4F' : '#A83B2B', fontFamily: 'var(--font-mono)' }}>
                  {isBanned ? '0 Bytes' : '180 req/s'}
                </div>
              </div>
              <div style={{ padding: '8px', background: '#FBF9F5', border: '1px solid #DCD7CD', borderRadius: '1px' }}>
                <div style={{ fontSize: '9.5px', color: '#8C887F', fontFamily: 'var(--font-mono)' }}>DROPPED PACKETS</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1C1B18', fontFamily: 'var(--font-mono)' }}>
                  {droppedPackets.toLocaleString()}
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '11.5px', color: '#5F5C55', lineHeight: 1.4 }}>
              Dropped at edge before SSL handshake. Zero CPU spent by your server.
            </p>
          </div>
        </div>

        {/* Action Toggle */}
        <button
          type="button"
          onClick={() => setIsBanned(!isBanned)}
          style={{
            padding: '8px 12px',
            borderRadius: '2px',
            border: isBanned ? '1px solid #1C1B18' : '1px solid #C23B3B',
            background: isBanned ? '#1C1B18' : '#F9ECEA',
            color: isBanned ? '#FAF8F5' : '#A83B2B',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: 'auto',
          }}
        >
          <Ban size={12} />
          <span>{isBanned ? 'Click to Unban IP (Test Impact)' : 'Click to Ban IP Instantly'}</span>
        </button>
      </div>

      {/* =========================================================================
          CARD 03: ZERO CODE / REVERSE PROXY
          ========================================================================= */}
      <div
        style={{
          background: '#FBF9F5',
          border: '1px solid #DCD7CD',
          borderRadius: '2px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(28, 27, 24, 0.03)',
        }}
      >
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '2px',
                  background: '#22211E',
                  color: '#FAF8F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={15} strokeWidth={1.8} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8C887F', fontWeight: 600 }}>
                03
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 600,
                color: '#5F5C55',
                background: '#EAE6DD',
                padding: '3px 8px',
                borderRadius: '1px',
                letterSpacing: '0.04em',
              }}
            >
              REVERSE PROXY
            </span>
          </div>

          <h3
            style={{
              margin: '0 0 8px',
              fontSize: '20px',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: '#1C1B18',
            }}
          >
            Skip rate-limit plumbing
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#4A4843', lineHeight: 1.55 }}>
            No middleware packages to keep in sync across microservices, and no backend redeployment required when adjusting limit thresholds.
          </p>

          {/* Visual Architecture Comparison */}
          <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '2px', padding: '14px', marginBottom: '12px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 700, color: '#2D6A4F', textTransform: 'uppercase', marginBottom: '6px' }}>
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
                marginBottom: '10px',
              }}
            >
              Client ──▶ <strong>limitx.dev/proxy/:apiId</strong> ──▶ Origin
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: 700, color: '#8C887F', textTransform: 'uppercase', marginBottom: '6px' }}>
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
              }}
            >
              Client ──▶ Express Middleware ──▶ Redis Lua Scripts ──▶ App
            </div>
          </div>
        </div>

        {/* Architecture Specs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto' }}>
          <div style={{ padding: '8px 10px', background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '1px' }}>
            <div style={{ fontSize: '9.5px', color: '#8C887F', fontFamily: 'var(--font-mono)' }}>SETUP TIME</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#1C1B18' }}>60 Seconds</div>
          </div>
          <div style={{ padding: '8px 10px', background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '1px' }}>
            <div style={{ fontSize: '9.5px', color: '#8C887F', fontFamily: 'var(--font-mono)' }}>REDIS COSTS</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#2D6A4F' }}>$0 / month</div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CARD 04: REAL-TIME AUDIT STREAM
          ========================================================================= */}
      <div
        style={{
          background: '#FBF9F5',
          border: '1px solid #DCD7CD',
          borderRadius: '2px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(28, 27, 24, 0.03)',
        }}
      >
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '2px',
                  background: '#22211E',
                  color: '#FAF8F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Activity size={15} strokeWidth={1.8} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8C887F', fontWeight: 600 }}>
                04
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 600,
                color: '#5F5C55',
                background: '#EAE6DD',
                padding: '3px 8px',
                borderRadius: '1px',
                letterSpacing: '0.04em',
              }}
            >
              LIVE TELEMETRY
            </span>
          </div>

          <h3
            style={{
              margin: '0 0 8px',
              fontSize: '20px',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: '#1C1B18',
            }}
          >
            Catch spikes as they happen
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#4A4843', lineHeight: 1.55 }}>
            Inspect which endpoints are getting flooded, which IPs got throttled, and how fast your origin responds in real time.
          </p>

          {/* Real-time Terminal Log Console */}
          <div
            style={{
              background: '#1C1B18',
              color: '#FAF8F5',
              borderRadius: '2px',
              padding: '12px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              border: '1px solid #332F2A',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #332F2A', paddingBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2D6A4F' }} />
                <span style={{ fontSize: '9.5px', color: '#C9C3B7', fontWeight: 600 }}>LIVE EDGE FEED</span>
              </div>
              <span style={{ fontSize: '9px', color: '#8C887F' }}>310 POPs ACTIVE</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {logs.map((item) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '50px 36px 1fr auto', gap: '6px', alignItems: 'center', fontSize: '10px' }}>
                  <span style={{ color: '#8C887F' }}>{item.time.split('.')[0]}</span>
                  <span style={{ color: item.method === 'POST' ? '#E59866' : '#A9DFBF', fontWeight: 600 }}>{item.method}</span>
                  <span style={{ color: '#FAF8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.path}</span>
                  <span
                    style={{
                      padding: '1px 4px',
                      borderRadius: '1px',
                      fontSize: '9px',
                      fontWeight: 700,
                      background: item.status === 429 ? '#5C241E' : '#1C3B2B',
                      color: item.status === 429 ? '#F5B7B1' : '#A9DFBF',
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 2px 0', fontSize: '11px', color: '#5F5C55', fontFamily: 'var(--font-mono)' }}>
          <span>Edge overhead &lt; 0.6ms</span>
          <span style={{ color: '#1C1B18', fontWeight: 500 }}>Zero database roundtrips</span>
        </div>
      </div>
    </div>
  );
}
