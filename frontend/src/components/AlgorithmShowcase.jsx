import { useState, useEffect } from 'react';
import { Clock, Zap, ShieldCheck, Check } from 'lucide-react';

export default function AlgorithmShowcase() {
  // --- Token Bucket Interactive Simulator State ---
  const [bucketTokens, setBucketTokens] = useState(7);
  const [bucketNotice, setBucketNotice] = useState(null);
  const MAX_TOKENS = 10;

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
      setBucketNotice({ text: '429 THROTTLED · Bucket Starved', type: 'blocked' });
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
        text: `429 PARTIAL · ${allowed} allowed, ${blocked} dropped at edge!`,
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
          setWindowReqs(0);
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
        text: `429 HARD CAP · ${blocked} blocked. Retry-After: ${secondsRemaining}s`,
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
      text: 'ATTACK THWARTED: 20 reqs at :59 + 20 at :01 caught by rolling 60s frame. 20 dropped with 429!',
      type: 'blocked',
    });
    setTimeout(() => setSlidingAttackSimulated(false), 2400);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '20px',
      }}
    >
      {/* =========================================================================
          ALGORITHM 01: TOKEN BUCKET
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 600,
                color: '#2D6A4F',
                background: '#EBF3EE',
                border: '1px solid #C5DDD0',
                padding: '2px 7px',
                borderRadius: '1px',
                letterSpacing: '0.04em',
              }}
            >
              DEFAULT FOR REST APIS
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8C887F' }}>
              O(1) MEMORY
            </span>
          </div>

          <h3
            style={{
              margin: '0 0 6px',
              fontSize: '22px',
              fontWeight: 400,
              letterSpacing: '-0.025em',
              color: '#1C1B18',
            }}
          >
            Token Bucket
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#4A4843', lineHeight: 1.55 }}>
            Absorbs natural request bursts from mobile apps and page refreshes, then smoothly paces sustained floods down to refill rate.
          </p>

          {/* Interactive Reservoir Sandbox */}
          <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '2px', padding: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', fontWeight: 600, color: '#1C1B18' }}>
                BUCKET RESERVOIR
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#5F5C55' }}>
                Refill: +1 token / 1.5s
              </span>
            </div>

            {/* Token Slots */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '3px', height: '34px', marginBottom: '8px' }}>
              {Array.from({ length: MAX_TOKENS }, (_, i) => {
                const filled = i < bucketTokens;
                return (
                  <div
                    key={i}
                    style={{
                      background: filled ? '#1C1B18' : '#DCD7CD',
                      borderRadius: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FAF8F5',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      transition: 'all 200ms ease',
                    }}
                  >
                    {filled ? '●' : '○'}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#1C1B18', marginBottom: '10px' }}>
              <span><strong>{bucketTokens}</strong> / {MAX_TOKENS} tokens</span>
              <span style={{ color: bucketTokens === 0 ? '#A83B2B' : '#2D6A4F', fontWeight: 600 }}>
                {bucketTokens === 0 ? 'BUCKET DEPLETED' : 'READY FOR TRAFFIC'}
              </span>
            </div>

            {/* Interactive Triggers */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={fireSingleTokenReq}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: '#FAF8F5',
                  border: '1px solid #DCD7CD',
                  borderRadius: '2px',
                  color: '#1C1B18',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Req (-1)
              </button>
              <button
                type="button"
                onClick={() => fireBurstTokenReq(4)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: '#1C1B18',
                  border: '1px solid #1C1B18',
                  borderRadius: '2px',
                  color: '#FAF8F5',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Burst (4)
              </button>
            </div>

            {bucketNotice && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '5px 8px',
                  borderRadius: '1px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  background: bucketNotice.type === 'ok' ? '#EBF3EE' : '#F9ECEA',
                  color: bucketNotice.type === 'ok' ? '#2D6A4F' : '#A83B2B',
                  border: bucketNotice.type === 'ok' ? '1px solid #C5DDD0' : '1px solid #E8C4BE',
                }}
              >
                {bucketNotice.text}
              </div>
            )}
          </div>
        </div>

        {/* Footer Guarantee */}
        <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', padding: '10px 12px', borderRadius: '2px', marginTop: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', color: '#8C887F', textTransform: 'uppercase', marginBottom: '2px' }}>
            CLIENT GUARANTEE
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1C1B18' }}>
            200 OK during bursts · 429 only when starved
          </div>
        </div>
      </div>

      {/* =========================================================================
          ALGORITHM 02: FIXED WINDOW
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 600,
                color: '#5F5C55',
                background: '#EAE6DD',
                padding: '2px 7px',
                borderRadius: '1px',
                letterSpacing: '0.04em',
              }}
            >
              BILLING & QUOTAS
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8C887F' }}>
              O(1) CPU
            </span>
          </div>

          <h3
            style={{
              margin: '0 0 6px',
              fontSize: '22px',
              fontWeight: 400,
              letterSpacing: '-0.025em',
              color: '#1C1B18',
            }}
          >
            Fixed Window
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#4A4843', lineHeight: 1.55 }}>
            Predictable hard quota reset per minute, hour, or calendar day. Directly matches developer subscription tiers and API key limits.
          </p>

          {/* Interactive Window Progress Sandbox */}
          <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '2px', padding: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={12} color="#1C1B18" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', fontWeight: 600, color: '#1C1B18' }}>
                  60-SEC WINDOW
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#A83B2B', fontWeight: 600 }}>
                RESET IN {secondsRemaining}s
              </span>
            </div>

            {/* Linear Progress */}
            <div style={{ height: '5px', background: '#DCD7CD', borderRadius: '1px', marginBottom: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${((60 - secondsRemaining) / 60) * 100}%`,
                  background: '#1C1B18',
                  transition: 'width 1s linear',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 600, color: windowReqs >= FIXED_LIMIT ? '#A83B2B' : '#1C1B18' }}>
                {windowReqs} <span style={{ fontSize: '12px', fontWeight: 400, color: '#5F5C55' }}>/ {FIXED_LIMIT} reqs</span>
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '1px',
                  background: windowReqs >= FIXED_LIMIT ? '#F9ECEA' : '#EBF3EE',
                  color: windowReqs >= FIXED_LIMIT ? '#A83B2B' : '#2D6A4F',
                }}
              >
                {windowReqs >= FIXED_LIMIT ? 'CAP REACHED (429)' : 'WITHIN QUOTA'}
              </span>
            </div>

            {/* Triggers */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => sendFixedReq(1)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: '#FAF8F5',
                  border: '1px solid #DCD7CD',
                  borderRadius: '2px',
                  color: '#1C1B18',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                +1 Request
              </button>
              <button
                type="button"
                onClick={() => sendFixedReq(4)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: '#1C1B18',
                  border: '1px solid #1C1B18',
                  borderRadius: '2px',
                  color: '#FAF8F5',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                +4 Requests
              </button>
            </div>

            {fixedNotice && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '5px 8px',
                  borderRadius: '1px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  background: fixedNotice.type === 'ok' ? '#EBF3EE' : '#F9ECEA',
                  color: fixedNotice.type === 'ok' ? '#2D6A4F' : '#A83B2B',
                  border: fixedNotice.type === 'ok' ? '1px solid #C5DDD0' : '1px solid #E8C4BE',
                }}
              >
                {fixedNotice.text}
              </div>
            )}
          </div>
        </div>

        {/* Footer Guarantee */}
        <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', padding: '10px 12px', borderRadius: '2px', marginTop: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', color: '#8C887F', textTransform: 'uppercase', marginBottom: '2px' }}>
            EMITTED HEADERS
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1C1B18' }}>
            Retry-After: {secondsRemaining}s · X-RateLimit-Reset: :00
          </div>
        </div>
      </div>

      {/* =========================================================================
          ALGORITHM 03: SLIDING WINDOW
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 600,
                color: '#1C1B18',
                background: '#EAE6DD',
                padding: '2px 7px',
                borderRadius: '1px',
                letterSpacing: '0.04em',
              }}
            >
              AUTH & CHECKOUT DEFENSE
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8C887F' }}>
              O(log N)
            </span>
          </div>

          <h3
            style={{
              margin: '0 0 6px',
              fontSize: '22px',
              fontWeight: 400,
              letterSpacing: '-0.025em',
              color: '#1C1B18',
            }}
          >
            Sliding Window
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#4A4843', lineHeight: 1.55 }}>
            Zero double-burst loopholes across boundary reset edges. Essential for authentication, OTP delivery, and checkout routes.
          </p>

          {/* Interactive Continuous Rolling Window Sandbox */}
          <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', borderRadius: '2px', padding: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', fontWeight: 600, color: '#1C1B18' }}>
                ROLLING FRAME [t-60s ... t]
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#2D6A4F', fontWeight: 600 }}>
                LOOPHOLE: 0%
              </span>
            </div>

            {/* Rolling Frame Visual */}
            <div style={{ padding: '8px 10px', background: '#FBF9F5', border: '1px solid #DCD7CD', borderRadius: '1px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontFamily: 'var(--font-mono)', color: '#8C887F', marginBottom: '4px' }}>
                <span>:59s (Burst 1)</span>
                <span style={{ color: '#1C1B18', fontWeight: 600 }}>:00s RESET</span>
                <span>:01s (Burst 2)</span>
              </div>
              <div style={{ position: 'relative', height: '18px', background: '#E6E2D9', borderRadius: '1px', display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '20%',
                    width: '60%',
                    height: '100%',
                    background: slidingAttackSimulated ? 'rgba(194, 59, 59, 0.25)' : 'rgba(45, 106, 79, 0.25)',
                    border: slidingAttackSimulated ? '1px dashed #A83B2B' : '1px dashed #2D6A4F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: slidingAttackSimulated ? '#A83B2B' : '#2D6A4F',
                  }}
                >
                  {slidingAttackSimulated ? '2x SPIKE DETECTED' : 'WEIGHTED WINDOW'}
                </div>
              </div>
            </div>

            {/* Trigger */}
            <button
              type="button"
              onClick={simulateBoundaryAttack}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: '#1C1B18',
                border: '1px solid #1C1B18',
                borderRadius: '2px',
                color: '#FAF8F5',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
            >
              <ShieldCheck size={12} color="#FAF8F5" />
              <span>Test Boundary Exploit (20 reqs across :00)</span>
            </button>

            {slidingNotice && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '5px 8px',
                  borderRadius: '1px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9.5px',
                  background: '#F9ECEA',
                  color: '#A83B2B',
                  border: '1px solid #E8C4BE',
                  lineHeight: 1.35,
                }}
              >
                {slidingNotice.text}
              </div>
            )}
          </div>
        </div>

        {/* Footer Guarantee */}
        <div style={{ background: '#F5F2EB', border: '1px solid #DCD7CD', padding: '10px 12px', borderRadius: '2px', marginTop: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', color: '#8C887F', textTransform: 'uppercase', marginBottom: '2px' }}>
            CRITICAL PROTECTION
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1C1B18' }}>
            /auth/login · /auth/otp · /checkout
          </div>
        </div>
      </div>
    </div>
  );
}
