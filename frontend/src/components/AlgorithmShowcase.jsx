import { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Clock,
  ShieldCheck,
  Check,
  AlertCircle,
  Activity,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  Radio,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import SpotlightCard from './ui/SpotlightCard';

export default function AlgorithmShowcase() {
  // Global spike trigger state
  const [globalSpikeActive, setGlobalSpikeActive] = useState(false);

  // =========================================================================
  // CHAMBER 1: TOKEN BUCKET (Magnetic Reservoir & Burst Absorber)
  // =========================================================================
  const MAX_TOKENS = 8;
  const [tokens, setTokens] = useState(6);
  const [chamber1Packets, setChamber1Packets] = useState([]);
  const [chamber1Shockwave, setChamber1Shockwave] = useState(false);
  const [chamber1Status, setChamber1Status] = useState('Idle · Ready for burst');

  // Passive Token Replenishment (+1 every 1.5s)
  useEffect(() => {
    const refillTimer = setInterval(() => {
      setTokens((prev) => {
        if (prev < MAX_TOKENS) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);
    return () => clearInterval(refillTimer);
  }, []);

  const triggerTokenBurst = (amount = 4) => {
    const now = Date.now();
    const newPackets = Array.from({ length: amount }).map((_, i) => ({
      id: `${now}-${i}`,
      delay: i * 80,
      isAllowed: i < tokens,
    }));

    setChamber1Packets(newPackets);

    if (tokens >= amount) {
      setTokens((t) => t - amount);
      setChamber1Status(`Absorbed ${amount} reqs seamlessly into smooth flow`);
    } else {
      const allowed = tokens;
      const dropped = amount - allowed;
      setTokens(0);
      setChamber1Shockwave(true);
      setTimeout(() => setChamber1Shockwave(false), 600);
      setChamber1Status(`Throttled! ${allowed} smoothed, ${dropped} held back`);
    }

    setTimeout(() => {
      setChamber1Packets([]);
    }, 1200);
  };

  const refillTokens = () => {
    setTokens(MAX_TOKENS);
    setChamber1Status('Reservoir fully replenished');
  };

  // =========================================================================
  // CHAMBER 2: FIXED WINDOW (Chrono Shutter & Calendar Quota)
  // =========================================================================
  const FIXED_LIMIT = 16;
  const [fixedCount, setFixedCount] = useState(10);
  const [chronoSeconds, setChronoSeconds] = useState(24);
  const [isShutterClosed, setIsShutterClosed] = useState(false);
  const [chamber2Packets, setChamber2Packets] = useState([]);
  const [chamber2Status, setChamber2Status] = useState('Aperture open · 10/16 used');

  // Chronometer 30-second window countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setChronoSeconds((sec) => {
        if (sec <= 1) {
          setFixedCount(0);
          setIsShutterClosed(false);
          setChamber2Status('Window reset at :00! Shutter reopened');
          return 30;
        }
        return sec - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerFixedTraffic = (amount = 4) => {
    const now = Date.now();
    const canAccept = Math.max(0, FIXED_LIMIT - fixedCount);
    const newPackets = Array.from({ length: amount }).map((_, i) => ({
      id: `${now}-${i}`,
      delay: i * 70,
      isAllowed: i < canAccept,
    }));

    setChamber2Packets(newPackets);

    if (fixedCount + amount <= FIXED_LIMIT) {
      const next = fixedCount + amount;
      setFixedCount(next);
      if (next === FIXED_LIMIT) {
        setIsShutterClosed(true);
        setChamber2Status('Hard ceiling reached! Shutter snapped closed');
      } else {
        setChamber2Status(`Accepted ${amount} reqs (${next}/${FIXED_LIMIT})`);
      }
    } else {
      setFixedCount(FIXED_LIMIT);
      setIsShutterClosed(true);
      setChamber2Status(`Limit exceeded! Hard gate closed until reset (${chronoSeconds}s)`);
    }

    setTimeout(() => {
      setChamber2Packets([]);
    }, 1100);
  };

  const resetFixedChamber = () => {
    setFixedCount(0);
    setIsShutterClosed(false);
    setChronoSeconds(30);
    setChamber2Status('Counter manually reset · Shutter open');
  };

  // =========================================================================
  // CHAMBER 3: SLIDING WINDOW (Rolling Radar & Boundary Shield)
  // =========================================================================
  const SLIDING_LIMIT = 12;
  const [slidingCount, setSlidingCount] = useState(6);
  const [slidingAttacking, setSlidingAttacking] = useState(false);
  const [chamber3Packets, setChamber3Packets] = useState([]);
  const [chamber3Status, setChamber3Status] = useState('Radar sweeping · Zero leakage');

  const triggerBoundaryAttack = () => {
    setSlidingAttacking(true);
    const now = Date.now();

    // 8 packets simulating a boundary cluster attempt
    const attackPackets = Array.from({ length: 8 }).map((_, i) => ({
      id: `${now}-${i}`,
      delay: i * 60,
      isAttack: true,
      deflected: i >= 3,
    }));

    setChamber3Packets(attackPackets);
    setSlidingCount(SLIDING_LIMIT);
    setChamber3Status('Boundary spike detected! 5 deflected with 0.0% leak');

    setTimeout(() => {
      setSlidingAttacking(false);
      setChamber3Packets([]);
    }, 1400);
  };

  const sendNormalSliding = () => {
    const now = Date.now();
    const isOk = slidingCount < SLIDING_LIMIT;
    const nextCount = isOk ? slidingCount + 1 : SLIDING_LIMIT;
    setSlidingCount(nextCount);

    setChamber3Packets([{ id: `${now}`, delay: 0, isAttack: false, deflected: !isOk }]);
    setChamber3Status(isOk ? 'Single packet verified in 60s frame' : 'Sliding ceiling reached · Packet throttled');

    setTimeout(() => {
      setChamber3Packets([]);
    }, 1000);
  };

  const resetSliding = () => {
    setSlidingCount(5);
    setSlidingAttacking(false);
    setChamber3Status('Sliding window calibrated to baseline');
  };

  // =========================================================================
  // GLOBAL STRESS TEST: Fire flood into all 3 engines simultaneously
  // =========================================================================
  const handleGlobalSurge = () => {
    setGlobalSpikeActive(true);
    triggerTokenBurst(6);
    triggerFixedTraffic(6);
    triggerBoundaryAttack();
    setTimeout(() => setGlobalSpikeActive(false), 1600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Dynamic Keyframe Animations for Physics & Kinetic Motion */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes tokenFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes particleFlyUp {
          0% { transform: translateY(110px) scale(0.6); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-30px) scale(1); opacity: 0; }
        }
        @keyframes particleBlocked {
          0% { transform: translateY(110px) scale(0.6); opacity: 0; }
          40% { opacity: 1; }
          60% { transform: translateY(35px) scale(1.2); opacity: 1; }
          100% { transform: translateY(60px) scale(0.2); opacity: 0; }
        }
        @keyframes radarSweepLoop {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes chronoNeedle {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shockwaveExpand {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes attackLaser {
          0% { opacity: 0; transform: scaleX(0); }
          50% { opacity: 1; transform: scaleX(1); }
          100% { opacity: 0; transform: scaleX(1.1); }
        }
      `}</style>

      {/* =====================================================================
          GLOBAL SURGE LAUNCHER BAR
          ===================================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          background: '#FAF8F5',
          border: '1px solid #DCD7CD',
          borderRadius: '3px',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#C68A2C',
              boxShadow: '0 0 8px #C68A2C',
              animation: 'pulseGlow 2s infinite',
            }}
          />
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1C1B18' }}>
              Kinetic Traffic Simulator
            </div>
            <div style={{ fontSize: '12px', color: '#6E6B64' }}>
              Compare how all three algorithms react when hit with instant traffic spikes.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGlobalSurge}
          disabled={globalSpikeActive}
          style={{
            padding: '10px 18px',
            background: globalSpikeActive ? '#C68A2C' : '#1C1B18',
            color: '#FAF8F5',
            border: 'none',
            borderRadius: '2px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: globalSpikeActive ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 200ms ease',
            boxShadow: globalSpikeActive ? '0 0 16px rgba(198, 138, 44, 0.4)' : 'none',
          }}
        >
          <Flame size={14} color="#FAF8F5" />
          <span>{globalSpikeActive ? 'FLOODING ALL ENGINES...' : 'SURGE SPIKE ACROSS ALL 3'}</span>
        </button>
      </div>

      {/* =====================================================================
          THREE KINETIC ALGORITHM CHAMBERS (SIDE BY SIDE)
          ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '20px',
        }}
      >
        {/* ===================================================================
            CHAMBER 1: TOKEN BUCKET (Magnetic Reservoir)
            =================================================================== */}
        <SpotlightCard
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: '3px',
            background: '#FAF8F5',
          }}
          spotlightColor="rgba(198, 138, 44, 0.14)"
          borderColor="rgba(198, 138, 44, 0.4)"
        >
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#C68A2C',
                  background: 'rgba(198, 138, 44, 0.1)',
                  padding: '3px 8px',
                  borderRadius: '2px',
                  letterSpacing: '0.04em',
                }}
              >
                01 · TOKEN BUCKET
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#2D8A4E', fontWeight: 600 }}>
                +1 / 1.5s REFILL
              </span>
            </div>

            <h3 style={{ margin: '0 0 4px', fontSize: '19px', fontWeight: 600, color: '#1C1B18' }}>
              The Shock Absorber
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#5F5C55', lineHeight: 1.5 }}>
              Buffers instant traffic spikes without dropping legitimate users. Smooths bursts into a calm, steady stream.
            </p>

            {/* Kinetic Visual Canvas: Magnetic Token Chamber */}
            <div
              style={{
                height: '210px',
                background: '#1A1916',
                borderRadius: '3px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #2B2925',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '16px',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {/* Upper Reservoir: Floating Golden Energy Tokens */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: '#8C887F', marginBottom: '8px' }}>
                  <span>AVAILABLE RESERVOIR</span>
                  <span style={{ color: tokens > 0 ? '#FFD591' : '#FF7875', fontWeight: 600 }}>
                    {tokens} / {MAX_TOKENS} TOKENS
                  </span>
                </div>

                {/* Floating Token Discs */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', minHeight: '34px' }}>
                  {Array.from({ length: MAX_TOKENS }).map((_, i) => {
                    const isPresent = i < tokens;
                    return (
                      <div
                        key={`tok-${i}`}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: isPresent
                            ? 'radial-gradient(circle at 35% 35%, #FFE58F 0%, #D48806 70%, #995B00 100%)'
                            : 'rgba(255, 255, 255, 0.04)',
                          border: isPresent ? '1px solid #FFE58F' : '1px dashed #3D3B37',
                          boxShadow: isPresent ? '0 0 10px rgba(245, 166, 35, 0.6)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 250ms ease',
                          animation: isPresent ? `tokenFloat ${2 + (i % 3) * 0.4}s ease-in-out infinite` : 'none',
                        }}
                      >
                        {isPresent && <Zap size={13} color="#1C1B18" strokeWidth={2.5} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shockwave effect when empty */}
              {chamber1Shockwave && (
                <div
                  style={{
                    position: 'absolute',
                    top: '45%',
                    left: '50%',
                    width: '80px',
                    height: '80px',
                    marginLeft: '-40px',
                    marginTop: '-40px',
                    borderRadius: '50%',
                    border: '2px solid #FF7875',
                    animation: 'shockwaveExpand 0.6s ease-out forwards',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Particle Stream Passage */}
              <div
                style={{
                  position: 'relative',
                  height: '75px',
                  borderTop: '1px dashed #35332F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Traffic stream track label */}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: '#6E6B64',
                    letterSpacing: '0.06em',
                  }}
                >
                  {tokens > 0 ? 'FLOW LANE: SMOOTH PULSE' : 'THROTTLED: ABSORPTION OVERLOAD'}
                </span>

                {/* Animated Flying Packets */}
                {chamber1Packets.map((pkt) => (
                  <div
                    key={pkt.id}
                    style={{
                      position: 'absolute',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: pkt.isAllowed ? '#73D13D' : '#FF7875',
                      boxShadow: pkt.isAllowed ? '0 0 8px #73D13D' : '0 0 8px #FF7875',
                      animation: `${pkt.isAllowed ? 'particleFlyUp' : 'particleBlocked'} 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                      animationDelay: `${pkt.delay}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Status footer inside chamber */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  color: tokens > 0 ? '#73D13D' : '#FF7875',
                }}
              >
                <span>{chamber1Status}</span>
                <span style={{ color: '#8C887F' }}>0.28ms</span>
              </div>
            </div>
          </div>

          {/* Action Button & Reset */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => triggerTokenBurst(4)}
              style={{
                flex: 1,
                padding: '10px',
                background: '#1C1B18',
                color: '#FAF8F5',
                border: 'none',
                borderRadius: '2px',
                fontSize: '12.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#C68A2C')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#1C1B18')}
            >
              <Zap size={13} />
              <span>Pump Burst (+4)</span>
            </button>

            <button
              type="button"
              onClick={refillTokens}
              style={{
                padding: '10px 14px',
                background: '#F5F2EB',
                border: '1px solid #DCD7CD',
                borderRadius: '2px',
                color: '#4A4843',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Instant Refill"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </SpotlightCard>

        {/* ===================================================================
            CHAMBER 2: FIXED WINDOW (Chrono Shutter)
            =================================================================== */}
        <SpotlightCard
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: '3px',
            background: '#FAF8F5',
          }}
          spotlightColor="rgba(198, 138, 44, 0.14)"
          borderColor="rgba(198, 138, 44, 0.4)"
        >
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#C68A2C',
                  background: 'rgba(198, 138, 44, 0.1)',
                  padding: '3px 8px',
                  borderRadius: '2px',
                  letterSpacing: '0.04em',
                }}
              >
                02 · FIXED WINDOW
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#1C1B18', fontWeight: 600 }}>
                {chronoSeconds}s TO RESET
              </span>
            </div>

            <h3 style={{ margin: '0 0 4px', fontSize: '19px', fontWeight: 600, color: '#1C1B18' }}>
              The Chrono Shutter
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#5F5C55', lineHeight: 1.5 }}>
              Strict calendar quotas that reset on the exact clock mark. Perfect for billing tiers and third-party SMS caps.
            </p>

            {/* Kinetic Visual Canvas: Chrono Bezel & Iris Aperture */}
            <div
              style={{
                height: '210px',
                background: '#1A1916',
                borderRadius: '3px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #2B2925',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {/* Chrono Bezel Dial */}
              <div
                style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  border: isShutterClosed ? '2px solid #FF7875' : '2px solid #C68A2C',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isShutterClosed ? 'rgba(198, 72, 53, 0.15)' : 'rgba(198, 138, 44, 0.08)',
                  boxShadow: isShutterClosed
                    ? '0 0 20px rgba(255, 120, 117, 0.3)'
                    : '0 0 20px rgba(198, 138, 44, 0.2)',
                  transition: 'all 300ms ease',
                }}
              >
                {/* Rotating Chrono Needle */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '2px',
                    height: '52px',
                    background: '#FFE58F',
                    transformOrigin: 'top center',
                    transform: `rotate(${((30 - chronoSeconds) / 30) * 360}deg)`,
                    transition: 'transform 1s linear',
                    boxShadow: '0 0 6px #FFE58F',
                  }}
                />

                {/* Aperture Center Core */}
                <div
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    background: '#12110F',
                    border: '1px solid #383631',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '17px',
                      fontWeight: 700,
                      color: isShutterClosed ? '#FF7875' : '#FAF8F5',
                    }}
                  >
                    {fixedCount}/{FIXED_LIMIT}
                  </div>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#8C887F' }}>
                    {isShutterClosed ? 'LOCKED' : `${chronoSeconds}s`}
                  </div>
                </div>

                {/* Animated Flying Packets around dial */}
                {chamber2Packets.map((pkt) => (
                  <div
                    key={pkt.id}
                    style={{
                      position: 'absolute',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: pkt.isAllowed ? '#73D13D' : '#FF7875',
                      boxShadow: pkt.isAllowed ? '0 0 8px #73D13D' : '0 0 8px #FF7875',
                      animation: `${pkt.isAllowed ? 'particleFlyUp' : 'particleBlocked'} 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                      animationDelay: `${pkt.delay}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Status footer inside chamber */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '16px',
                  right: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  color: isShutterClosed ? '#FF7875' : '#73D13D',
                }}
              >
                <span>{chamber2Status}</span>
                <span style={{ color: '#8C887F' }}>0.21ms</span>
              </div>
            </div>
          </div>

          {/* Action Button & Reset */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => triggerFixedTraffic(4)}
              style={{
                flex: 1,
                padding: '10px',
                background: '#1C1B18',
                color: '#FAF8F5',
                border: 'none',
                borderRadius: '2px',
                fontSize: '12.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#C68A2C')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#1C1B18')}
            >
              <Clock size={13} />
              <span>Fire Batch (+4)</span>
            </button>

            <button
              type="button"
              onClick={resetFixedChamber}
              style={{
                padding: '10px 14px',
                background: '#F5F2EB',
                border: '1px solid #DCD7CD',
                borderRadius: '2px',
                color: '#4A4843',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Reset Window Counter"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </SpotlightCard>

        {/* ===================================================================
            CHAMBER 3: SLIDING WINDOW (Rolling Radar & Boundary Shield)
            =================================================================== */}
        <SpotlightCard
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: '3px',
            background: '#FAF8F5',
          }}
          spotlightColor="rgba(198, 138, 44, 0.14)"
          borderColor="rgba(198, 138, 44, 0.4)"
        >
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#C68A2C',
                  background: 'rgba(198, 138, 44, 0.1)',
                  padding: '3px 8px',
                  borderRadius: '2px',
                  letterSpacing: '0.04em',
                }}
              >
                03 · SLIDING WINDOW LOG
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#2D8A4E', fontWeight: 600 }}>
                100% BOUNDARY ACCURACY
              </span>
            </div>

            <h3 style={{ margin: '0 0 4px', fontSize: '19px', fontWeight: 600, color: '#1C1B18' }}>
              The Rolling Radar
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#5F5C55', lineHeight: 1.5 }}>
              Continuously prunes historical timestamps in Redis. Completely eliminates double-traffic boundary exploits.
            </p>

            {/* Kinetic Visual Canvas: Rolling Timeline & Radar Beam */}
            <div
              style={{
                height: '210px',
                background: '#1A1916',
                borderRadius: '3px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #2B2925',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '16px',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {/* Rolling 60s Track Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: '#8C887F' }}>
                <span>CONTINUOUS ROLLING FRAME</span>
                <span style={{ color: slidingCount >= SLIDING_LIMIT ? '#FF7875' : '#73D13D' }}>
                  {slidingCount} / {SLIDING_LIMIT} IN 60s
                </span>
              </div>

              {/* Central Time Continuum Track */}
              <div
                style={{
                  position: 'relative',
                  height: '80px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '2px',
                  border: '1px solid #2E2C28',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {/* Continuous Radar Scanner Beam */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '40px',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(198, 138, 44, 0.3) 100%)',
                    borderRight: '2px solid #C68A2C',
                    animation: 'radarSweepLoop 3s linear infinite',
                    boxShadow: '0 0 12px rgba(198, 138, 44, 0.4)',
                  }}
                />

                {/* Minute Boundary Danger Line (where fixed windows leak) */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    background: '#C64835',
                    opacity: 0.6,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: '4px',
                      fontSize: '8px',
                      fontFamily: 'var(--font-mono)',
                      color: '#FF7875',
                    }}
                  >
                    BOUNDARY
                  </span>
                </div>

                {/* Timestamp nodes along timeline */}
                <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', zIndex: 2, padding: '0 12px' }}>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={`node-${idx}`}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: idx < slidingCount ? '#C68A2C' : '#33312C',
                        boxShadow: idx < slidingCount ? '0 0 6px #C68A2C' : 'none',
                        transition: 'all 200ms ease',
                      }}
                    />
                  ))}
                </div>

                {/* Animated Attack / Packet Intercept */}
                {chamber3Packets.map((pkt) => (
                  <div
                    key={pkt.id}
                    style={{
                      position: 'absolute',
                      left: pkt.deflected ? '60%' : '30%',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: pkt.deflected ? '#FF7875' : '#73D13D',
                      boxShadow: pkt.deflected ? '0 0 10px #FF7875' : '0 0 8px #73D13D',
                      animation: `${pkt.deflected ? 'particleBlocked' : 'particleFlyUp'} 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                      animationDelay: `${pkt.delay}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Time tick labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontFamily: 'var(--font-mono)', color: '#6E6B64' }}>
                <span>-60s</span>
                <span>-30s</span>
                <span>:00 BOUNDARY</span>
                <span>NOW (LIVE)</span>
              </div>

              {/* Status footer inside chamber */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-mono)',
                  color: slidingAttacking ? '#FF7875' : '#73D13D',
                }}
              >
                <span>{chamber3Status}</span>
                <span style={{ color: '#8C887F' }}>0.34ms</span>
              </div>
            </div>
          </div>

          {/* Action Button & Reset */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={triggerBoundaryAttack}
              disabled={slidingAttacking}
              style={{
                flex: 1,
                padding: '10px',
                background: '#1C1B18',
                color: '#FAF8F5',
                border: 'none',
                borderRadius: '2px',
                fontSize: '12.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: slidingAttacking ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#C64835')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#1C1B18')}
            >
              <ShieldAlert size={13} />
              <span>{slidingAttacking ? 'Intercepting...' : 'Test Boundary Attack'}</span>
            </button>

            <button
              type="button"
              onClick={sendNormalSliding}
              style={{
                padding: '10px 12px',
                background: '#F5F2EB',
                border: '1px solid #DCD7CD',
                borderRadius: '2px',
                color: '#4A4843',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Send 1 Verified Packet"
            >
              <ArrowRight size={13} />
            </button>

            <button
              type="button"
              onClick={resetSliding}
              style={{
                padding: '10px 12px',
                background: '#F5F2EB',
                border: '1px solid #DCD7CD',
                borderRadius: '2px',
                color: '#4A4843',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Reset Timeline"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </SpotlightCard>
      </div>

      {/* =====================================================================
          BOTTOM QUICK GUIDE (MINIMAL, ZERO OVER-TEXT)
          ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            background: '#FAF8F5',
            border: '1px solid #DCD7CD',
            borderRadius: '2px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C68A2C' }} />
          <div style={{ fontSize: '12.5px', color: '#4A4843' }}>
            <strong>Token Bucket:</strong> Natural traffic bursts, search autocompletes & AI generation.
          </div>
        </div>

        <div
          style={{
            background: '#FAF8F5',
            border: '1px solid #DCD7CD',
            borderRadius: '2px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C68A2C' }} />
          <div style={{ fontSize: '12.5px', color: '#4A4843' }}>
            <strong>Fixed Window:</strong> Hard billing ceilings, subscription quotas & daily SMS limits.
          </div>
        </div>

        <div
          style={{
            background: '#FAF8F5',
            border: '1px solid #DCD7CD',
            borderRadius: '2px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C68A2C' }} />
          <div style={{ fontSize: '12.5px', color: '#4A4843' }}>
            <strong>Sliding Window:</strong> Critical security endpoints, credential stuffing & fraud defense.
          </div>
        </div>
      </div>
    </div>
  );
}