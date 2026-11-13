import { useState, useRef, useEffect, useCallback } from 'react';
import {
  SlidersHorizontal,
  ShieldAlert,
  DollarSign,
  Activity,
  Zap,
  Code2,
  Clock,
  PowerOff,
} from 'lucide-react';
import SpotlightCard from './ui/SpotlightCard';

const CARDS_DATA = [
  {
    id: 'routes',
    num: '01',
    category: 'ROUTE CAPS',
    title: 'Per-Route Enforcer',
    desc: 'Distinct rate limits for sensitive routes like auth, search, or LLM completions.',
    icon: SlidersHorizontal,
    accent: '#C68A2C',
    metric: '5 REQ/M',
    tag: 'CUSTOM LIMITS',
  },
  {
    id: 'ip-jail',
    num: '02',
    category: 'BOT DEFENSE',
    title: 'Autonomous IP Jail',
    desc: 'Drop scrapers and credential stuffing bots with immediate 403 responses.',
    icon: ShieldAlert,
    accent: '#E5484D',
    metric: '6,148+',
    tag: 'RADAR ARMED',
  },
  {
    id: 'billing',
    num: '03',
    category: 'COST SHIELD',
    title: 'Zero Surge Billing',
    desc: 'Eliminate runaway cloud hosting bills caused by looping scripts or scrapers.',
    icon: DollarSign,
    accent: '#2D8A4E',
    metric: '$1,371',
    tag: 'SAVED / MO',
  },
  {
    id: 'telemetry',
    num: '04',
    category: 'OBSERVABILITY',
    title: 'Realtime Edge Audit',
    desc: 'Inspect every proxied request live with method, IP, status, and edge latency.',
    icon: Activity,
    accent: '#3B82F6',
    metric: '0.34ms',
    tag: 'SUB-MS AUDIT',
  },
  {
    id: 'swap',
    num: '05',
    category: 'HOT-SWAP',
    title: '1-Minute URL Swap',
    desc: 'Point client API_BASE_URL to proxy URL. Zero code rewrites or SDK imports.',
    icon: Code2,
    accent: '#8B5CF6',
    metric: '60 SEC',
    tag: 'NO SDKS',
  },
  {
    id: 'token-bucket',
    num: '06',
    category: 'BURST SHIELD',
    title: 'Token Bucket Core',
    desc: 'Smoothly absorbs natural traffic bursts while refilling at a steady rate.',
    icon: Zap,
    accent: '#F5A623',
    metric: '10 TOKENS',
    tag: 'BURST SAFE',
  },
  {
    id: 'sliding-log',
    num: '07',
    category: 'ACCURACY',
    title: 'Sliding Log Window',
    desc: 'Thwarts boundary exploits by weighing a rolling 60-second frame.',
    icon: Clock,
    accent: '#10B981',
    metric: '100%',
    tag: 'SPIKE GUARD',
  },
  {
    id: 'killswitch',
    num: '08',
    category: 'CONTROL',
    title: '1-Click Kill Switch',
    desc: 'Instantly freeze and resume proxy routes during outages or migrations.',
    icon: PowerOff,
    accent: '#EF4444',
    metric: 'PAUSE',
    tag: 'HOT TOGGLE',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '2px',
                        background: '#22211E',
                        color: '#FAF8F5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComponent size={14} strokeWidth={1.8} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#8C887F', fontWeight: 600 }}>
                      {card.num} / {card.category}
                    </span>
                  </div>

                  {(isFront || (!isExpanded && index === 0)) && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#2D8A4E',
                        background: '#E8F5E9',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        border: '1px solid #C8E6C9',
                      }}
                    >
                      {isExpanded ? 'ACTIVE' : 'DECK'}
                    </span>
                  )}
                </div>

                <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600, color: '#1C1B18', lineHeight: 1.25 }}>
                  {card.title}
                </h3>

                <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#4A4843', lineHeight: 1.45 }}>
                  {card.desc}
                </p>

                {/* Bottom Metric Pill */}
                <div style={{ marginTop: 'auto' }}>
                  <div
                    style={{
                      background: isFront || (!isExpanded && index === 0) ? '#22211E' : '#EAE6DD',
                      color: isFront || (!isExpanded && index === 0) ? '#FAF8F5' : '#1C1B18',
                      padding: '8px 10px',
                      borderRadius: '2px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '8.5px', fontFamily: 'var(--font-mono)', color: isFront || (!isExpanded && index === 0) ? '#A5A096' : '#7A756D' }}>
                        {card.tag}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: isFront || (!isExpanded && index === 0) ? '#72F1B8' : '#1C1B18' }}>
                        {card.metric}
                      </div>
                    </div>

                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: isFront || (!isExpanded && index === 0) ? '#F5A623' : '#8C887F' }}>
                      LIMITX
                    </span>
                  </div>
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
