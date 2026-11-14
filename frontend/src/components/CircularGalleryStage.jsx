import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  DollarSign,
  Lock,
  EyeOff,
  Users,
  Activity,
  PowerOff,
  Zap,
  Check,
} from 'lucide-react';
import SpotlightCard from './ui/SpotlightCard';

const CARDS_DATA = [
  {
    id: 'uptime',
    num: '01',
    category: 'RELIABILITY',
    title: 'Prevent Traffic Crashes',
    desc: 'When marketing campaigns or viral spikes hit your product, excess traffic is absorbed at the edge so your origin server never crashes.',
    icon: ShieldCheck,
    accent: '#C68A2C',
    outcomeLabel: 'Uptime Guarantee',
    outcomeValue: 'Zero Server Overload',
  },
  {
    id: 'billing',
    num: '02',
    category: 'COST PROTECTION',
    title: 'Eliminate Surprise Cloud Bills',
    desc: 'Put a hard ceiling on abusive loops and bot floods before they run up thousands of dollars in cloud infrastructure and third-party API bills.',
    icon: DollarSign,
    accent: '#C68A2C',
    outcomeLabel: 'Billing Safety',
    outcomeValue: 'Zero Bill Shock',
  },
  {
    id: 'auth',
    num: '03',
    category: 'SECURITY',
    title: 'Stop Account Takeovers',
    desc: 'Protect customer login and signup endpoints against automated credential stuffing, password spraying, and brute-force attacks.',
    icon: Lock,
    accent: '#C68A2C',
    outcomeLabel: 'Account Defense',
    outcomeValue: 'Bruteforce Blocked',
  },
  {
    id: 'scraping',
    num: '04',
    category: 'DATA PRIVACY',
    title: 'Block Unwanted Web Scrapers',
    desc: 'Keep competitors and AI scraping bots from stealing your content, proprietary pricing data, and database records without permission.',
    icon: EyeOff,
    accent: '#C68A2C',
    outcomeLabel: 'Content Protection',
    outcomeValue: 'Zero Data Theft',
  },
  {
    id: 'fairness',
    num: '05',
    category: 'FAIR ACCESS',
    title: 'Protect Customer Experience',
    desc: 'Ensure no single aggressive user or buggy script degrades the application speed for everyone else by enforcing fair per-user limits.',
    icon: Users,
    accent: '#C68A2C',
    outcomeLabel: 'Quality of Service',
    outcomeValue: 'Equal Performance',
  },
  {
    id: 'visibility',
    num: '06',
    category: 'OBSERVABILITY',
    title: 'Live Traffic Transparency',
    desc: 'See exactly who is calling your APIs in real time, which endpoints are hot, and understand immediately why any request was throttled.',
    icon: Activity,
    accent: '#C68A2C',
    outcomeLabel: 'Audit Visibility',
    outcomeValue: 'Real-Time Telemetry',
  },
  {
    id: 'killswitch',
    num: '07',
    category: 'INCIDENT CONTROL',
    title: 'Emergency 1-Click Pause',
    desc: 'When third-party APIs fail or your backend needs maintenance, instantly pause or throttle specific routes without deploying emergency code.',
    icon: PowerOff,
    accent: '#C68A2C',
    outcomeLabel: 'Incident Response',
    outcomeValue: 'Instant Route Freeze',
  },
  {
    id: 'maintenance',
    num: '08',
    category: 'ZERO OVERHEAD',
    title: 'No Infrastructure to Manage',
    desc: 'Forget configuring Redis clusters, maintaining microservice gateways, or writing custom middleware. Set your rules once and focus on your app.',
    icon: Zap,
    accent: '#C68A2C',
    outcomeLabel: 'Maintenance Cost',
    outcomeValue: '0 Redis Servers',
  },
];

export default function CircularGalleryStage() {
  const containerRef = useRef(null);
  const totalCards = CARDS_DATA.length;
  const angleStep = 360 / totalCards; // 45 deg per card for 8 cards

  // State: Stacked Deck -> Bloom Expansion -> Continuous 3D Orbit
  const [isExpanded, setIsExpanded] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [canOrbit, setCanOrbit] = useState(false);
  const [isAnimatingTarget, setIsAnimatingTarget] = useState(false);
  const [orbitSpeedFactor, setOrbitSpeedFactor] = useState(0); // 0 to 1 smooth ease-in
  const [activeIndex, setActiveIndex] = useState(0);

  // Physics refs
  const dragStartRef = useRef(0);
  const prevXRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef(null);
  const rotationRef = useRef(0);
  const resumeTimerRef = useRef(null);

  rotationRef.current = rotation;

  // Responsive target radius calculation
  const [targetRadius, setTargetRadius] = useState(340);
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setTargetRadius(200);
      else if (w < 1024) setTargetRadius(270);
      else setTargetRadius(340);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Radius is 0 when stacked behind front card, targetRadius when expanded
  const currentRadius = isExpanded ? targetRadius : 0;

  // =========================================================================
  // SCROLL-TRIGGERED EXPANSION & GRACEFUL EASE-IN TO CONTINUOUS ORBIT
  // (Pehle deck stacked hota hai, scroll karne par smooth bloom, then smooth orbit)
  // =========================================================================
  useEffect(() => {
    if (!containerRef.current) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // 1. Initial perceived stacked card pause (250ms)
          setTimeout(() => {
            setIsExpanded(true); // Cards bloom outward (1200ms transition)

            // 2. Buffer pause after bloom settles (1200ms bloom + 400ms settle = 1600ms)
            setTimeout(() => {
              setCanOrbit(true);

              // 3. Smooth ease-in speed ramp-up (0 -> 1 over 800ms) so there's zero jerk!
              const rampStart = performance.now();
              const rampDuration = 800;
              const ramp = (now) => {
                const progress = Math.min(1, (now - rampStart) / rampDuration);
                const ease =
                  progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                setOrbitSpeedFactor(ease);
                if (progress < 1) {
                  requestAnimationFrame(ramp);
                }
              };
              requestAnimationFrame(ramp);
            }, 1600);
          }, 250);
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update active card index based on current rotation
  useEffect(() => {
    const normalized = ((-rotation % 360) + 360) % 360;
    const idx = Math.round(normalized / angleStep) % totalCards;
    setActiveIndex(idx);
  }, [rotation, angleStep, totalCards]);

  // =========================================================================
  // CONTINUOUS 3D CIRCULAR ORBIT ANIMATION WITH DYNAMIC AXIS ROTATION
  // =========================================================================
  useEffect(() => {
    if (!canOrbit || isDragging || isHovered || isAnimatingTarget) return undefined;

    let orbitFrameId;
    const baseSpeed = 0.22; // Gentle, majestic rotation speed

    const orbit = () => {
      setRotation((prev) => prev - baseSpeed * orbitSpeedFactor);
      orbitFrameId = requestAnimationFrame(orbit);
    };
    orbitFrameId = requestAnimationFrame(orbit);
    return () => cancelAnimationFrame(orbitFrameId);
  }, [canOrbit, orbitSpeedFactor, isDragging, isHovered, isAnimatingTarget]);

  // Inertia momentum loop on pointer release
  const startInertia = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);

    const step = () => {
      if (Math.abs(velocityRef.current) > 0.04) {
        setRotation((prev) => prev + velocityRef.current);
        velocityRef.current *= 0.93; // friction damping
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        // Snap to nearest card
        setRotation((currentRot) => {
          const nearestCardIndex = Math.round(currentRot / angleStep);
          return nearestCardIndex * angleStep;
        });

        // Resume continuous orbit after user finishes interaction
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => {
          setCanOrbit(true);
          setOrbitSpeedFactor(1);
        }, 1200);
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, [angleStep]);

  // Pointer event handlers (Mouse + Touch)
  const handlePointerDown = (e) => {
    cancelAnimationFrame(animFrameRef.current);
    clearTimeout(resumeTimerRef.current);
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartRef.current = clientX;
    prevXRef.current = clientX;
    velocityRef.current = 0;
    lastTimeRef.current = performance.now();
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    const dx = clientX - prevXRef.current;

    const rotSensitivity = targetRadius > 300 ? 0.32 : 0.45;
    setRotation((prev) => prev + dx * rotSensitivity);

    velocityRef.current = (dx / dt) * 14;
    prevXRef.current = clientX;
    lastTimeRef.current = now;
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    startInertia();
  };

  // Rotate smoothly to specific card index
  const rotateToIndex = (targetIdx) => {
    cancelAnimationFrame(animFrameRef.current);
    clearTimeout(resumeTimerRef.current);
    setIsAnimatingTarget(true);

    const currentRot = rotationRef.current;
    const currentIdx = Math.round(((-currentRot % 360) + 360) % 360 / angleStep) % totalCards;
    let diff = targetIdx - currentIdx;
    if (diff > totalCards / 2) diff -= totalCards;
    if (diff < -totalCards / 2) diff += totalCards;

    const targetRot = currentRot - diff * angleStep;
    let startTime = null;
    const startRot = currentRot;
    const duration = 500;

    const anim = (t) => {
      if (!startTime) startTime = t;
      const progress = Math.min(1, (t - startTime) / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setRotation(startRot + (targetRot - startRot) * ease);
      if (progress < 1) {
        requestAnimationFrame(anim);
      } else {
        setIsAnimatingTarget(false);
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => {
          setCanOrbit(true);
          setOrbitSpeedFactor(1);
        }, 1400);
      }
    };
    requestAnimationFrame(anim);
  };

  // Determine when to disable CSS transition so frame-by-frame 3D axis rotation is buttery smooth
  const isDirectFrameDriven = (canOrbit && !isAnimatingTarget) || isDragging;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1180px',
        margin: '0 auto',
        padding: '16px 0 28px',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* ========================================================
          3D CIRCLE GALLERY CAROUSEL STAGE
         ======================================================== */}
      <div
        ref={containerRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => {
          handlePointerUp();
          setIsHovered(false);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        style={{
          position: 'relative',
          width: '100%',
          height: '380px',
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {CARDS_DATA.map((card, index) => {
          let x = 0;
          let z = 0;
          let relAngle = 0;
          let cardAxisAngle = 0;
          let bankAngle = 0;
          let scale = 1;
          let opacity = 1;
          let zIndex = totalCards - index;

          if (isExpanded) {
            // Once expanded, compute polar coordinates along 3D cylinder
            const baseAngle = index * angleStep;
            relAngle = (baseAngle + rotation) % 360;
            if (relAngle > 180) relAngle -= 360;
            if (relAngle < -180) relAngle += 360;

            const rad = (relAngle * Math.PI) / 180;
            x = Math.sin(rad) * currentRadius;
            z = Math.cos(rad) * currentRadius - currentRadius; // z is 0 at front, negative in back

            // Dynamic Axis Rotation:
            // As the card travels along the circle, it visibly rotates on its own vertical axis:
            // Center front (0 deg) -> faces viewer flat (0 deg).
            // Left (-60 deg) -> pivots +52 deg inward.
            // Right (+60 deg) -> pivots -52 deg inward.
            cardAxisAngle = -relAngle * 0.86;

            // Subtle 3D dynamic banking along the curve
            bankAngle = -Math.sin(rad) * 3.5;

            const normZ = (z + currentRadius) / currentRadius; // 0 to 1
            scale = Math.max(0.68, 0.72 + normZ * 0.28);
            opacity = Math.max(0.18, 0.22 + normZ * 0.78);
            zIndex = Math.round(normZ * 100);
          } else {
            // Initial stacked state: all cards directly behind front card
            z = -index * 12;
            scale = 1 - index * 0.025;
            opacity = index === 0 ? 1 : Math.max(0.3, 0.85 - index * 0.1);
            cardAxisAngle = 0;
            bankAngle = 0;
          }

          const isFront = isExpanded && Math.abs(relAngle) < angleStep * 0.52;
          const IconComponent = card.icon;

          return (
            <div
              key={card.id}
              onClick={() => {
                if (!isExpanded) {
                  setIsExpanded(true);
                } else if (!isFront) {
                  rotateToIndex(index);
                }
              }}
              style={{
                position: 'absolute',
                width: 'min(78vw, 230px)',
                height: '290px',
                // Proper 3D axis rotation (rotateY) + banking (rotateZ) applied on every frame!
                transform: `translateX(${x}px) translateZ(${z}px) rotateY(${cardAxisAngle}deg) rotateZ(${bankAngle}deg) scale(${scale})`,
                opacity,
                zIndex,
                // During continuous orbit or dragging, disable CSS transition lag so dynamic axis rotation is ultra-crisp!
                transition: isDirectFrameDriven
                  ? 'none'
                  : 'transform 1200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 950ms ease',
                cursor: isFront ? 'default' : 'pointer',
              }}
            >
              <SpotlightCard
                style={{
                  height: '100%',
                  padding: '16px',
                  background: isFront || (!isExpanded && index === 0) ? '#FBF9F5' : '#F5F2EB',
                  border: isFront || (!isExpanded && index === 0) ? '1px solid #CFC9BC' : '1px solid #EAE6DD',
                  boxShadow: isFront || (!isExpanded && index === 0)
                    ? '0 18px 40px -12px rgba(28, 27, 24, 0.16), 0 0 0 1px rgba(198, 138, 44, 0.25)'
                    : '0 6px 16px -6px rgba(28, 27, 24, 0.04)',
                }}
                spotlightColor={card.accent ? `${card.accent}1A` : 'rgba(198, 138, 44, 0.12)'}
                borderColor={card.accent ? `${card.accent}66` : 'rgba(198, 138, 44, 0.35)'}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '3px',
                        background: '#22211E',
                        color: '#FAF8F5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComponent size={14} strokeWidth={1.8} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#8C887F', fontWeight: 600, letterSpacing: '0.04em' }}>
                      {card.num} / {card.category}
                    </span>
                  </div>

                  {(isFront || (!isExpanded && index === 0)) && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#C68A2C',
                        background: 'rgba(198, 138, 44, 0.1)',
                        padding: '2px 7px',
                        borderRadius: '2px',
                        border: '1px solid rgba(198, 138, 44, 0.3)',
                      }}
                    >
                      {isExpanded ? 'ACTIVE' : 'DECK'}
                    </span>
                  )}
                </div>

                <h3 style={{ margin: '0 0 8px', fontSize: '15.5px', fontWeight: 600, color: '#1C1B18', lineHeight: 1.28, letterSpacing: '-0.015em' }}>
                  {card.title}
                </h3>

                <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#4A4843', lineHeight: 1.5 }}>
                  {card.desc}
                </p>

                {/* Clean Professional Outcome Footer (User Benefit) */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '11px',
                    borderTop: '1px solid #EAE6DD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span style={{ color: '#8C887F', fontWeight: 500 }}>
                    {card.outcomeLabel}
                  </span>
                  <span style={{ color: '#1C1B18', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Check size={11} color="#C68A2C" strokeWidth={2.5} />
                    {card.outcomeValue}
                  </span>
                </div>
              </SpotlightCard>
            </div>
          );
        })}
      </div>

      {/* Bottom Circular Dots & Drag Hint */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          marginTop: '10px',
        }}
      >
        {/* Pagination Dots (8 dots) */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {CARDS_DATA.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              type="button"
              onClick={() => rotateToIndex(idx)}
              style={{
                width: activeIndex === idx ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: activeIndex === idx ? '#1C1B18' : '#DCD7CD',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                padding: 0,
              }}
              title={`Jump to node ${idx + 1}`}
            />
          ))}
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#8C887F' }}>
          &larr; Drag horizontally or click side cards to focus &rarr;
        </div>
      </div>
    </div>
  );
}
