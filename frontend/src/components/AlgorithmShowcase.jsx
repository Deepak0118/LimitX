import { useState, useEffect } from 'react';
import { Plus, Minus, Zap, ShieldCheck, Clock, RefreshCw, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AlgorithmShowcase() {
  const [openId, setOpenId] = useState('token_bucket');

  // --- Token Bucket Interactive Simulator State ---
  const [bucketTokens, setBucketTokens] = useState(7);
  const [bucketNotice, setBucketNotice] = useState(null);
  const MAX_TOKENS = 10;

  // Auto-refill 1 token every 1.5 seconds up to MAX_TOKENS
  useEffect(() => {
    const refillTimer = setInterval(() => {
      setBucketTokens((prev) => {
        if (prev < MAX_TOKENS) return prev + 1;
        return prev;
      });
    }, 1500);
    return () => clearInterval(refillTimer);
  }, []);

  const fireSingleTokenReq = () => {
    if (bucketTokens > 0) {
      setBucketTokens((t) => t - 1);
      setBucketNotice({ text: '200 OK · 1 Token Consumed (0.3ms)', type: 'ok' });
    } else {
      setBucketNotice({ text: '429 TOO MANY REQUESTS · Bucket Starved', type: 'blocked' });
    }
  };

  const fireBurstTokenReq = (amount) => {
    if (bucketTokens >= amount) {
      setBucketTokens((t) => t - amount);
      setBucketNotice({ text: `200 OK · Burst of ${amount} absorbed smoothly!`, type: 'ok' });
    } else {
      const allowed = bucketTokens;
      const blocked = amount - allowed;
      setBucketTokens(0);
      setBucketNotice({
        text: `429 PARTIAL DROP · ${allowed} allowed, ${blocked} throttled at edge!`,
        type: 'blocked',
      });
    }
  };

  // --- Fixed Window Interactive Simulator State ---
  const [windowReqs, setWindowReqs] = useState(17);
  const [secondsRemaining, setSecondsRemaining] = useState(14);
  const [fixedNotice, setFixedNotice] = useState(null);
  const FIXED_LIMIT = 20;

  useEffect(() => {
    const clock = setInterval(() => {
      setSecondsRemaining((sec) => {
        if (sec <= 1) {
          setWindowReqs(0); // Window resets on clock tick!
          setFixedNotice({ text: 'Window Reset! Counter cleared to 0 / 20 reqs', type: 'reset' });
          return 60;
        }
        return sec - 1;
      });
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  const sendFixedReq = (qty = 1) => {
    if (windowReqs + qty <= FIXED_LIMIT) {
      setWindowReqs((prev) => prev + qty);
      setFixedNotice({ text: `200 OK · Quota used: ${windowReqs + qty}/${FIXED_LIMIT}`, type: 'ok' });
    } else {
      const blocked = windowReqs + qty - FIXED_LIMIT;
      setWindowReqs(FIXED_LIMIT);
      setFixedNotice({
        text: `429 HARD CAP · ${blocked} request(s) blocked. Retry-After: ${secondsRemaining}s`,
        type: 'blocked',
      });
    }
  };

  // --- Sliding Window Interactive Simulator State ---
  const [slidingAttackSimulated, setSlidingAttackSimulated] = useState(false);
  const [slidingNotice, setSlidingNotice] = useState(null);

  const simulateBoundaryAttack = () => {
    setSlidingAttackSimulated(true);
    setSlidingNotice({
      text: 'ATTACK THWARTED: 20 reqs at :59 + 20 reqs at :01 caught by rolling 60s frame. 20 dropped with 429!',
      type: 'blocked',
    });
    setTimeout(() => setSlidingAttackSimulated(false), 2400);
  };

  return (
    <div>
      {/* Swiss Hairline Expandable Index */}
      <div>
        {/* ROW 1: TOKEN BUCKET */}
        <div className="lx-hairline-row">
          <button
            type="button"
            onClick={() => setOpenId(openId === 'token_bucket' ? null : 'token_bucket')}
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
            aria-expanded={openId === 'token_bucket'}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-sans), sans-serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#1C1B18',
                  letterSpacing: '-0.02em',
                  marginBottom: '4px',
                }}
              >
                Token Bucket
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
                DEFAULT FOR REST APIS & MOBILE
              </span>
            </div>

            <span className="lx-hairline-hide-sm" style={{ fontSize: '14px', color: '#5F5C55', lineHeight: 1.45 }}>
              Absorbs natural request bursts, smoothly paces sustained floods
            </span>

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
              O(1) memory · Burst-friendly
            </span>

            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '2px',
                border: '1px solid #DCD7CD',
                background: openId === 'token_bucket' ? '#1C1B18' : '#FBF9F5',
                color: openId === 'token_bucket' ? '#FAF8F5' : '#1C1B18',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 160ms ease',
                flexShrink: 0,
              }}
            >
              {openId === 'token_bucket' ? <Minus size={14} /> : <Plus size={14} />}
            </span>
          </button>

          {openId === 'token_bucket' && (
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
                {/* Visual Reservoir Sandbox */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  {/* Left: Interactive Bucket Reservoir */}
                  <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '2px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2D6A4F' }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#1C1B18' }}>
                          BUCKET RESERVOIR
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#5F5C55' }}>
                        Refill: +1 token / 1.5s
                      </span>
                    </div>

                    {/* Bucket Visual Slots */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px', height: '42px', marginBottom: '10px' }}>
                      {Array.from({ length: MAX_TOKENS }, (_, i) => {
                        const filled = i < bucketTokens;
                        return (
                          <div
                            key={i}
                            style={{
                              background: filled ? '#1C1B18' : '#DCD7CD',
                              borderRadius: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FAF8F5',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '10px',
                              fontWeight: 700,
                              transition: 'all 200ms ease',
                            }}
                          >
                            {filled ? '●' : '○'}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1C1B18', marginBottom: '14px' }}>
                      <span><strong>{bucketTokens}</strong> / {MAX_TOKENS} tokens available</span>
                      <span style={{ color: bucketTokens === 0 ? '#A83B2B' : '#2D6A4F', fontWeight: 600 }}>
                        {bucketTokens === 0 ? 'BUCKET DEPLETED' : 'READY FOR TRAFFIC'}
                      </span>
                    </div>

                    {/* Interactive Action Triggers */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={fireSingleTokenReq}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          background: '#FAF8F5',
                          border: '1px solid #DCD7CD',
                          borderRadius: '2px',
                          color: '#1C1B18',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Single Req (-1)
                      </button>
                      <button
                        type="button"
                        onClick={() => fireBurstTokenReq(4)}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          background: '#1C1B18',
                          border: '1px solid #1C1B18',
                          borderRadius: '2px',
                          color: '#FAF8F5',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Fire Burst (4 Req)
                      </button>
                      <button
                        type="button"
                        onClick={() => fireBurstTokenReq(8)}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          background: '#F9ECEA',
                          border: '1px solid #E8C4BE',
                          borderRadius: '2px',
                          color: '#A83B2B',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Flood (8 Req)
                      </button>
                    </div>

                    {/* Notice Log */}
                    {bucketNotice && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '6px 10px',
                          borderRadius: '1px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          background: bucketNotice.type === 'ok' ? '#EBF3EE' : '#F9ECEA',
                          color: bucketNotice.type === 'ok' ? '#2D6A4F' : '#A83B2B',
                          border: bucketNotice.type === 'ok' ? '1px solid #C5DDD0' : '1px solid #E8C4BE',
                        }}
                      >
                        {bucketNotice.text}
                      </div>
                    )}
                  </div>

                  {/* Right: Architectural Explanation Card */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#8C887F', textTransform: 'uppercase', marginBottom: '6px' }}>
                        WHY DEVELOPERS CHOOSE IT
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 600, color: '#1C1B18', margin: '0 0 8px' }}>
                        Absorb bursts without dropping legitimate users
                      </h4>
                      <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#4A4843', margin: '0 0 12px' }}>
                        Real users don&apos;t click like a metronome. When a mobile app loads, it fires 6 parallel API calls. Token Bucket allows this natural burst up to bucket capacity, while strictly smoothing sustained traffic down to the refill rate.
                      </p>
                    </div>

                    <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', padding: '10px 12px', borderRadius: '2px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#8C887F', textTransform: 'uppercase', marginBottom: '2px' }}>
                        CLIENT GUARANTEE
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#1C1B18', fontWeight: 600 }}>
                        200 OK during bursts · 429 only upon total token starvation
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ROW 2: FIXED WINDOW */}
        <div className="lx-hairline-row">
          <button
            type="button"
            onClick={() => setOpenId(openId === 'fixed_window' ? null : 'fixed_window')}
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
            aria-expanded={openId === 'fixed_window'}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-sans), sans-serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#1C1B18',
                  letterSpacing: '-0.02em',
                  marginBottom: '4px',
                }}
              >
                Fixed Window
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
                TIERED BILLING & DEVELOPER QUOTAS
              </span>
            </div>

            <span className="lx-hairline-hide-sm" style={{ fontSize: '14px', color: '#5F5C55', lineHeight: 1.45 }}>
              Predictable hard quota reset per minute, hour, or calendar day
            </span>

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
              O(1) CPU · Epoch resets
            </span>

            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '2px',
                border: '1px solid #DCD7CD',
                background: openId === 'fixed_window' ? '#1C1B18' : '#FBF9F5',
                color: openId === 'fixed_window' ? '#FAF8F5' : '#1C1B18',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 160ms ease',
                flexShrink: 0,
              }}
            >
              {openId === 'fixed_window' ? <Minus size={14} /> : <Plus size={14} />}
            </span>
          </button>

          {openId === 'fixed_window' && (
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* Left: Window Progress & Quota Gauge */}
                  <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '2px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} color="#1C1B18" />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#1C1B18' }}>
                          60-SECOND TIME SLOT
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#A83B2B' }}>
                        RESET IN {secondsRemaining}s
                      </span>
                    </div>

                    {/* Linear Time Elapsed Bar */}
                    <div style={{ height: '6px', background: '#DCD7CD', borderRadius: '1px', marginBottom: '14px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${((60 - secondsRemaining) / 60) * 100}%`,
                          background: '#1C1B18',
                          transition: 'width 1s linear',
                        }}
                      />
                    </div>

                    {/* Quota Counter Display */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '26px', fontWeight: 700, color: windowReqs >= FIXED_LIMIT ? '#A83B2B' : '#1C1B18' }}>
                          {windowReqs}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#5F5C55' }}> / {FIXED_LIMIT} reqs</span>
                      </div>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '1px',
                          background: windowReqs >= FIXED_LIMIT ? '#F9ECEA' : '#EBF3EE',
                          color: windowReqs >= FIXED_LIMIT ? '#A83B2B' : '#2D6A4F',
                        }}
                      >
                        {windowReqs >= FIXED_LIMIT ? 'CAP REACHED (429)' : 'WITHIN QUOTA'}
                      </span>
                    </div>

                    {/* Action Triggers */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => sendFixedReq(1)}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          background: '#FAF8F5',
                          border: '1px solid #DCD7CD',
                          borderRadius: '2px',
                          color: '#1C1B18',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Send +1 Request
                      </button>
                      <button
                        type="button"
                        onClick={() => sendFixedReq(4)}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          background: '#1C1B18',
                          border: '1px solid #1C1B18',
                          borderRadius: '2px',
                          color: '#FAF8F5',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Send +4 Requests
                      </button>
                    </div>

                    {/* Notice */}
                    {fixedNotice && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '6px 10px',
                          borderRadius: '1px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          background: fixedNotice.type === 'ok' ? '#EBF3EE' : '#F9ECEA',
                          color: fixedNotice.type === 'ok' ? '#2D6A4F' : '#A83B2B',
                          border: fixedNotice.type === 'ok' ? '1px solid #C5DDD0' : '1px solid #E8C4BE',
                        }}
                      >
                        {fixedNotice.text}
                      </div>
                    )}
                  </div>

                  {/* Right: Technical Explanation */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#8C887F', textTransform: 'uppercase', marginBottom: '6px' }}>
                        EXACT QUOTA ALIGNMENT
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 600, color: '#1C1B18', margin: '0 0 8px' }}>
                        Ideal for SaaS subscription plans & API keys
                      </h4>
                      <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#4A4843', margin: '0 0 12px' }}>
                        Fixed Window locks your clients directly to clear subscription boundaries (e.g. 10,000 calls / hour). When the window expires, the counter resets back to 0 immediately.
                      </p>
                    </div>

                    <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', padding: '10px 12px', borderRadius: '2px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#8C887F', textTransform: 'uppercase', marginBottom: '2px' }}>
                        EMITTED HTTP HEADERS
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1C1B18' }}>
                        Retry-After: {secondsRemaining}s · X-RateLimit-Reset: :00
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ROW 3: SLIDING WINDOW */}
        <div className="lx-hairline-row">
          <button
            type="button"
            onClick={() => setOpenId(openId === 'sliding_window' ? null : 'sliding_window')}
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
            aria-expanded={openId === 'sliding_window'}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-sans), sans-serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#1C1B18',
                  letterSpacing: '-0.02em',
                  marginBottom: '4px',
                }}
              >
                Sliding Window
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
                AUTH ROUTES & ATTACK DEFENSE
              </span>
            </div>

            <span className="lx-hairline-hide-sm" style={{ fontSize: '14px', color: '#5F5C55', lineHeight: 1.45 }}>
              Zero double-burst loopholes across boundary reset edges
            </span>

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
              O(log N) · Rolling precision
            </span>

            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '2px',
                border: '1px solid #DCD7CD',
                background: openId === 'sliding_window' ? '#1C1B18' : '#FBF9F5',
                color: openId === 'sliding_window' ? '#FAF8F5' : '#1C1B18',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 160ms ease',
                flexShrink: 0,
              }}
            >
              {openId === 'sliding_window' ? <Minus size={14} /> : <Plus size={14} />}
            </span>
          </button>

          {openId === 'sliding_window' && (
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* Left: Continuous Rolling Ribbon Visualizer */}
                  <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '2px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#1C1B18' }}>
                        CONTINUOUS ROLLING WINDOW [t-60s ... t]
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#2D6A4F', fontWeight: 700 }}>
                        LOOPHOLE: 0% POSSIBLE
                      </span>
                    </div>

                    {/* Boundary Exploit Diagram */}
                    <div style={{ padding: '12px', background: '#FBF9F5', border: '1px solid #DCD7CD', borderRadius: '2px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: '#8C887F', marginBottom: '6px' }}>
                        <span>:50s</span>
                        <span style={{ color: '#A83B2B', fontWeight: 700 }}>:59s (Burst 1)</span>
                        <span style={{ color: '#1C1B18', fontWeight: 700 }}>:00s TICK</span>
                        <span style={{ color: '#A83B2B', fontWeight: 700 }}>:01s (Burst 2)</span>
                        <span>:10s</span>
                      </div>

                      {/* Continuous Rolling Strip */}
                      <div style={{ position: 'relative', height: '24px', background: '#E6E2D9', borderRadius: '1px', display: 'flex', alignItems: 'center' }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: '25%',
                            width: '50%',
                            height: '100%',
                            background: slidingAttackSimulated ? 'rgba(194, 59, 59, 0.25)' : 'rgba(45, 106, 79, 0.25)',
                            border: slidingAttackSimulated ? '1px dashed #A83B2B' : '1px dashed #2D6A4F',
                            borderRadius: '1px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9.5px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: slidingAttackSimulated ? '#A83B2B' : '#2D6A4F',
                          }}
                        >
                          {slidingAttackSimulated ? '2x SPIKE DETECTED' : 'SMOOTH WEIGHTED WINDOW'}
                        </div>
                      </div>
                    </div>

                    {/* Exploit Test Button */}
                    <button
                      type="button"
                      onClick={simulateBoundaryAttack}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#1C1B18',
                        border: '1px solid #1C1B18',
                        borderRadius: '2px',
                        color: '#FAF8F5',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <ShieldCheck size={13} color="#FAF8F5" />
                      <span>Test Edge Boundary Exploit (20 reqs across :00)</span>
                    </button>

                    {/* Notice */}
                    {slidingNotice && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '6px 10px',
                          borderRadius: '1px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          fontWeight: 600,
                          background: '#F9ECEA',
                          color: '#A83B2B',
                          border: '1px solid #E8C4BE',
                          lineHeight: 1.4,
                        }}
                      >
                        {slidingNotice.text}
                      </div>
                    )}
                  </div>

                  {/* Right: Technical Explanation */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#8C887F', textTransform: 'uppercase', marginBottom: '6px' }}>
                        BRUTE-FORCE RESISTANT
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 600, color: '#1C1B18', margin: '0 0 8px' }}>
                        Prevents attackers from cheating boundary resets
                      </h4>
                      <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#4A4843', margin: '0 0 12px' }}>
                        In Fixed Window, an attacker can fire 100% capacity at :59 and another 100% at :01, pushing 2x the allowed limit in 2 seconds. Sliding Window calculates a continuous rolling weighted average, mathematically closing this loophole forever.
                      </p>
                    </div>

                    <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', padding: '10px 12px', borderRadius: '2px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#8C887F', textTransform: 'uppercase', marginBottom: '2px' }}>
                        BEST FOR CRITICAL ROUTES
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1C1B18' }}>
                        /auth/login · /auth/otp · /checkout · /ai/generate
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
