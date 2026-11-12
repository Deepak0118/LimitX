import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import BlurText from './ui/BlurText';

const SCALE_TICKS = [14, 18.5, 23, 27.5, 32, 68, 72.5, 77, 81.5, 86];

export default function HeroGateTheater({ children, onNavThemeChange, onOpenSetup }) {
  const theaterRef = useRef(null);
  const doorLeftRef = useRef(null);
  const doorRightRef = useRef(null);
  const lockLeftRef = useRef(null);
  const lockRightRef = useRef(null);
  const seamRef = useRef(null);
  const fgRef = useRef(null);
  const underworldRef = useRef(null);

  const [fgInteractive, setFgInteractive] = useState(true);
  const fgInteractiveRef = useRef(true);
  const navDarkRef = useRef(true);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let targetP = 0;
    let currentP = 0;
    let rafId = null;

    const computeTarget = () => {
      const el = theaterRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      return Math.max(0, Math.min(1, -rect.top / scrollable));
    };

    const applyProgress = (p) => {
      // Phase 1 (0 -> 0.14): center vault dial rotates/unlatches & seam glows
      const unlock = Math.min(1, p / 0.16);
      // Phase 2 (0.10 -> 0.90): doors slide + angle outward in 3D perspective
      const doorP = Math.max(0, Math.min(1, (p - 0.08) / 0.82));
      const ease = doorP < 0.5 ? 4 * doorP * doorP * doorP : 1 - Math.pow(-2 * doorP + 2, 3) / 2;

      const slidePct = ease * 106;
      const swingDeg = ease * 17;

      if (doorLeftRef.current) {
        doorLeftRef.current.style.transform = `translate3d(-${slidePct}%, 0, 0) rotateY(${swingDeg}deg)`;
      }
      if (doorRightRef.current) {
        doorRightRef.current.style.transform = `translate3d(${slidePct}%, 0, 0) rotateY(-${swingDeg}deg)`;
      }

      // Rotating interlocking center ring halves before door separation
      if (lockLeftRef.current) {
        lockLeftRef.current.style.transform = `translateY(-50%) rotate(${(-unlock * 28).toFixed(2)}deg)`;
      }
      if (lockRightRef.current) {
        lockRightRef.current.style.transform = `translateY(-50%) rotate(${(unlock * 28).toFixed(2)}deg)`;
      }

      // Warm stone light beam glowing through the widening center crack
      if (seamRef.current) {
        const seamGlow =
          p < 0.03 ? 0.16 : Math.max(0, 0.88 * Math.sin(Math.min(1, p * 2.1) * Math.PI));
        seamRef.current.style.opacity = seamGlow.toFixed(3);
        seamRef.current.style.width = `${(2 + unlock * 10).toFixed(1)}px`;
      }

      // Foreground headline rises & fades cleanly away
      const fgOpacity = Math.max(0, 1 - p * 2.6);
      if (fgRef.current) {
        fgRef.current.style.opacity = fgOpacity.toFixed(3);
        fgRef.current.style.transform = `translate3d(0, ${(-p * 68).toFixed(1)}px, 0) scale(${(1 + p * 0.09).toFixed(4)})`;
      }

      // Revealed Warm Stone world underneath scales up into sharp focus
      if (underworldRef.current) {
        const uwScale = 0.89 + ease * 0.11;
        const uwOpacity = Math.min(1, 0.12 + ease * 1.08);
        underworldRef.current.style.transform = `scale(${uwScale.toFixed(4)})`;
        underworldRef.current.style.opacity = uwOpacity.toFixed(3);
      }

      const nextInteractive = p < 0.25;
      if (nextInteractive !== fgInteractiveRef.current) {
        fgInteractiveRef.current = nextInteractive;
        setFgInteractive(nextInteractive);
      }

      const shouldBeDark = p < 0.54;
      if (shouldBeDark !== navDarkRef.current) {
        navDarkRef.current = shouldBeDark;
        if (onNavThemeChange) onNavThemeChange(shouldBeDark);
      }
    };

    const tick = () => {
      targetP = computeTarget();
      if (prefersReduced) {
        currentP = targetP;
      } else {
        currentP += (targetP - currentP) * 0.15;
        if (Math.abs(targetP - currentP) < 0.0005) currentP = targetP;
      }
      applyProgress(currentP);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [onNavThemeChange]);

  return (
    <section id="overview" ref={theaterRef} className="lx-gate-theater">
      <div className="lx-gate-sticky">
        {/* Revealed Warm Stone World Behind the Vault Doors */}
        <div
          id="integration"
          ref={underworldRef}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#F5F2EB',
            backgroundImage: 'radial-gradient(#DCD7CD 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '84px 24px 36px',
            transformOrigin: 'center center',
            willChange: 'transform, opacity',
          }}
        >
          {children}
        </div>

        {/* Sculpted Architectural Warm Bronze-Charcoal Doors */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            pointerEvents: 'none',
            perspective: '1500px',
            overflow: 'hidden',
          }}
          aria-hidden="true"
        >
          {/* LEFT DOOR */}
          <div ref={doorLeftRef} className="lx-gate-door lx-gate-door-left">
            {/* Recessed Architectural Coffer Panel */}
            <div className="lx-gate-coffer" style={{ left: '5%', right: '32px' }}>
              {/* Top-left & bottom-left machined travertine miter corners */}
              <div style={{ position: 'absolute', top: '-1px', left: '-1px', width: '16px', height: '16px', borderTop: '1.5px solid rgba(230,226,217,0.34)', borderLeft: '1.5px solid rgba(230,226,217,0.34)' }} />
              <div style={{ position: 'absolute', bottom: '-1px', left: '-1px', width: '16px', height: '16px', borderBottom: '1.5px solid rgba(230,226,217,0.34)', borderLeft: '1.5px solid rgba(230,226,217,0.34)' }} />
            </div>

            {/* Horizontal architectural datum lines */}
            {[24, 76].map((top) => (
              <div
                key={top}
                style={{
                  position: 'absolute',
                  top: `${top}%`,
                  left: '5%',
                  right: '0',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(230, 226, 217, 0.18))',
                }}
              />
            ))}

            {/* Millimeter seam scale ticks */}
            {SCALE_TICKS.map((topPct, i) => (
              <div
                key={topPct}
                style={{
                  position: 'absolute',
                  top: `${topPct}%`,
                  right: 0,
                  width: i % 5 === 0 ? '20px' : '9px',
                  height: '1px',
                  background: i % 5 === 0 ? 'rgba(230, 226, 217, 0.34)' : 'rgba(230, 226, 217, 0.14)',
                }}
              />
            ))}

            {/* Left Half of Rotating Machined Vault Ring + Split-Cap Latch */}
            <div
              ref={lockLeftRef}
              style={{
                position: 'absolute',
                top: '50%',
                right: 0,
                width: '210px',
                height: '420px',
                transformOrigin: '100% 50%',
                transform: 'translateY(-50%)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: '-210px',
                  width: '420px',
                  height: '420px',
                  borderRadius: '50%',
                  border: '1px solid rgba(230, 226, 217, 0.18)',
                  boxShadow: 'inset 0 0 0 18px rgba(20, 19, 16, 0.45), inset 0 0 0 19px rgba(230, 226, 217, 0.1)',
                }}
              />
              {/* Left Split-Cap latch tongue */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 0,
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '10px',
                  opacity: 0.25,
                }}
              >
                <div style={{ width: '54px', height: '6px', background: '#E6E2D9', borderRadius: '1px 0 0 1px' }} />
                <div style={{ width: '54px', height: '6px', background: '#E6E2D9', borderRadius: '1px 0 0 1px' }} />
                <div style={{ width: '38px', height: '6px', background: '#E6E2D9', borderRadius: '1px 0 0 1px' }} />
              </div>
            </div>
          </div>

          {/* RIGHT DOOR */}
          <div ref={doorRightRef} className="lx-gate-door lx-gate-door-right">
            {/* Recessed Architectural Coffer Panel */}
            <div className="lx-gate-coffer" style={{ left: '32px', right: '5%' }}>
              <div style={{ position: 'absolute', top: '-1px', right: '-1px', width: '16px', height: '16px', borderTop: '1.5px solid rgba(230,226,217,0.34)', borderRight: '1.5px solid rgba(230,226,217,0.34)' }} />
              <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '16px', height: '16px', borderBottom: '1.5px solid rgba(230,226,217,0.34)', borderRight: '1.5px solid rgba(230,226,217,0.34)' }} />
            </div>

            {[24, 76].map((top) => (
              <div
                key={top}
                style={{
                  position: 'absolute',
                  top: `${top}%`,
                  left: '0',
                  right: '5%',
                  height: '1px',
                  background: 'linear-gradient(270deg, transparent, rgba(230, 226, 217, 0.18))',
                }}
              />
            ))}

            {SCALE_TICKS.map((topPct, i) => (
              <div
                key={topPct}
                style={{
                  position: 'absolute',
                  top: `${topPct}%`,
                  left: 0,
                  width: i % 5 === 0 ? '20px' : '9px',
                  height: '1px',
                  background: i % 5 === 0 ? 'rgba(230, 226, 217, 0.34)' : 'rgba(230, 226, 217, 0.14)',
                }}
              />
            ))}

            {/* Right Half of Rotating Machined Vault Ring + Split-Cap Latch */}
            <div
              ref={lockRightRef}
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                width: '210px',
                height: '420px',
                transformOrigin: '0% 50%',
                transform: 'translateY(-50%)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-210px',
                  width: '420px',
                  height: '420px',
                  borderRadius: '50%',
                  border: '1px solid rgba(230, 226, 217, 0.18)',
                  boxShadow: 'inset 0 0 0 18px rgba(20, 19, 16, 0.45), inset 0 0 0 19px rgba(230, 226, 217, 0.1)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '10px',
                  opacity: 0.25,
                }}
              >
                <div style={{ width: '54px', height: '6px', background: '#E6E2D9', borderRadius: '0 1px 1px 0' }} />
                <div style={{ width: '30px', height: '6px', marginLeft: '14px', background: '#8C887F', borderRadius: '1px' }} />
                <div style={{ width: '42px', height: '6px', background: '#E6E2D9', borderRadius: '0 1px 1px 0' }} />
              </div>
            </div>
          </div>

          {/* Center Luminous Warm-Stone Seam Light */}
          <div
            ref={seamRef}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              width: '2px',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, transparent 6%, rgba(245, 242, 235, 0.92) 50%, transparent 94%)',
              boxShadow: '0 0 34px 4px rgba(230, 226, 217, 0.34)',
              opacity: 0.16,
            }}
          />

          {/* Bottom Travertine Threshold Rail */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: '22px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent 4%, rgba(230, 226, 217, 0.2) 50%, transparent 96%)',
            }}
          />
        </div>

        {/* Center Editorial Hero Typography */}
        <div
          ref={fgRef}
          style={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            maxWidth: '820px',
            padding: '54px 24px 0',
            color: '#FBF9F5',
            pointerEvents: fgInteractive ? 'auto' : 'none',
            willChange: 'transform, opacity',
          }}
        >
          <h1
            style={{
              margin: '0 0 22px',
              fontSize: 'clamp(46px, 6.2vw, 76px)',
              fontWeight: 400,
              lineHeight: 1.02,
              letterSpacing: '-0.038em',
              color: '#FBF9F5',
            }}
          >
            <BlurText text="Rate limiting for developers" delayStep={40} startDelay={30} />
          </h1>

          <p
            style={{
              margin: '0 auto 34px',
              fontSize: 'clamp(16px, 1.4vw, 18.5px)',
              lineHeight: 1.6,
              color: '#C6C0B4',
              maxWidth: '480px',
            }}
          >
            Stop traffic spikes and abuse before they wake your origin server.
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              to="/auth?mode=signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '12px 24px',
                borderRadius: '2px',
                background: '#F5F2EB',
                color: '#1C1B18',
                fontSize: '14.5px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Get started <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              onClick={onOpenSetup}
              style={{
                padding: '11px 18px',
                borderRadius: '2px',
                border: '1px solid rgba(230, 226, 217, 0.28)',
                background: 'rgba(29, 27, 23, 0.65)',
                color: '#E6E2D9',
                fontSize: '14.5px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              1-step setup
            </button>
          </div>

          <div
            style={{
              marginTop: '48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                letterSpacing: '0.12em',
                color: '#8C887F',
                textTransform: 'uppercase',
              }}
            >
              Scroll
            </span>
            <div
              style={{
                width: '1px',
                height: '38px',
                background: 'rgba(230, 226, 217, 0.16)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                className="lx-scroll-stem"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent, #F5F2EB, transparent)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
