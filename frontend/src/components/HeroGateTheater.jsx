import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import BlurText from './ui/BlurText';
import VaultLockHalf from './VaultLockHalf';

const SCALE_TICKS = [12, 16.5, 21, 25.5, 30, 70, 74.5, 79, 83.5, 88];

export default function HeroGateTheater({ children, onNavThemeChange, onOpenSetup }) {
  const theaterRef = useRef(null);
  const doorLeftRef = useRef(null);
  const doorRightRef = useRef(null);
  const seamRef = useRef(null);
  const fgRef = useRef(null);
  const underworldRef = useRef(null);

  // Precision Vault Lock Half References
  const dialLeftRef = useRef(null);
  const dialRightRef = useRef(null);
  const rotorLeftRef = useRef(null);
  const rotorRightRef = useRef(null);
  const glowLeftRef = useRef(null);
  const glowRightRef = useRef(null);
  const ingotsLeftRef = useRef([]);
  const ingotsRightRef = useRef([]);
  const hubLeftRef = useRef(null);
  const hubRightRef = useRef(null);

  const [fgInteractive, setFgInteractive] = useState(true);
  const fgInteractiveRef = useRef(true);

  useEffect(() => {
    // Notify navbar that Hero is in Warm Light Stone mode
    if (onNavThemeChange) onNavThemeChange(false);

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let targetP = 0;
    let currentP = 0;
    let pointerOffset = 0;
    let currentPointer = 0;
    let rafId = null;

    const handlePointerMove = (e) => {
      if (prefersReduced) return;
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      pointerOffset = nx * 5;
    };

    const handlePointerLeave = () => {
      pointerOffset = 0;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    const computeTarget = () => {
      const el = theaterRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      return Math.max(0, Math.min(1, -rect.top / scrollable));
    };

    const syncLockHalf = (
      dialEl,
      rotorEl,
      glowEl,
      ingotsArr,
      hubEl,
      dir,
      unlatch,
      unlatchRaw,
      dialDeg,
      rotorDeg,
      doorEase
    ) => {
      if (dialEl) {
        dialEl.setAttribute('transform', `rotate(${dialDeg.toFixed(2)} 300 220)`);
      }
      if (rotorEl) {
        rotorEl.setAttribute('transform', `rotate(${rotorDeg.toFixed(2)} 300 220)`);
      }
      if (glowEl) {
        const glowOpacity = Math.max(0.08, Math.min(0.95, unlatch * 0.95 * (1 - doorEase * 0.5)));
        glowEl.setAttribute('opacity', glowOpacity.toFixed(3));
      }
      ingotsArr.forEach((ingot, idx) => {
        if (ingot) {
          const stagger = Math.max(0, Math.min(1, (unlatchRaw - idx * 0.08) / 0.84));
          const eased = 1 - Math.pow(1 - stagger, 2.2);
          ingot.setAttribute('transform', `translate(${(dir * eased * 48).toFixed(2)}, 0)`);
        }
      });
      if (hubEl) {
        const hubScale = 1 - unlatch * 0.06;
        const t = `translate(300 220) scale(${hubScale.toFixed(4)}) translate(-300 -220)`;
        hubEl.setAttribute('transform', t);
      }
    };

    const applyProgress = (p) => {
      // Phase 1 (0 -> 0.24): Ingots slide into pockets, dial clocks 54deg, token rotor counter-rotates
      const unlatchRaw = Math.min(1, p / 0.24);
      const unlatch =
        unlatchRaw < 0.5
          ? 2 * unlatchRaw * unlatchRaw
          : 1 - Math.pow(-2 * unlatchRaw + 2, 2) / 2;

      // Phase 2 (0.16 -> 0.92): Heavy warm travertine doors part smoothly in 3D perspective
      const doorRaw = Math.max(0, Math.min(1, (p - 0.16) / 0.76));
      const ease =
        doorRaw < 0.5
          ? 4 * doorRaw * doorRaw * doorRaw
          : 1 - Math.pow(-2 * doorRaw + 2, 3) / 2;

      const slidePct = ease * 107;
      const swingDeg = ease * 18;

      if (doorLeftRef.current) {
        doorLeftRef.current.style.transform = `translate3d(-${slidePct}%, 0, 0) rotateY(${swingDeg}deg)`;
      }
      if (doorRightRef.current) {
        doorRightRef.current.style.transform = `translate3d(${slidePct}%, 0, 0) rotateY(-${swingDeg}deg)`;
      }

      const subtlePointer = currentPointer * (1 - Math.min(1, p * 4));
      const dialDeg = unlatch * 54 + subtlePointer;
      const rotorDeg = -unlatch * 42 - subtlePointer * 0.8;

      syncLockHalf(
        dialLeftRef.current,
        rotorLeftRef.current,
        glowLeftRef.current,
        ingotsLeftRef.current,
        hubLeftRef.current,
        -1,
        unlatch,
        unlatchRaw,
        dialDeg,
        rotorDeg,
        ease
      );
      syncLockHalf(
        dialRightRef.current,
        rotorRightRef.current,
        glowRightRef.current,
        ingotsRightRef.current,
        hubRightRef.current,
        1,
        unlatch,
        unlatchRaw,
        dialDeg,
        rotorDeg,
        ease
      );

      // Warm Amber Seam Light blooms right as ingots retract
      if (seamRef.current) {
        const seamGlow =
          p < 0.02
            ? 0.18
            : Math.max(0, 0.95 * Math.sin(Math.min(1, Math.max(0, p - 0.03) * 2.2) * Math.PI));
        seamRef.current.style.opacity = seamGlow.toFixed(3);
        seamRef.current.style.width = `${(2 + unlatch * 12).toFixed(1)}px`;
      }

      // Editorial foreground copy rises and clears
      const fgOpacity = Math.max(0, 1 - p * 3.1);
      if (fgRef.current) {
        fgRef.current.style.opacity = fgOpacity.toFixed(3);
        fgRef.current.style.transform = `translate3d(0, ${(-p * 64).toFixed(1)}px, 0) scale(${(1 + p * 0.04).toFixed(4)})`;
      }

      // Underworld stage scales into clean focus
      if (underworldRef.current) {
        const uwScale = 0.90 + ease * 0.10;
        const uwOpacity = Math.min(1, 0.12 + ease * 1.08);
        underworldRef.current.style.transform = `scale(${uwScale.toFixed(4)})`;
        underworldRef.current.style.opacity = uwOpacity.toFixed(3);
      }

      const nextInteractive = p < 0.24;
      if (nextInteractive !== fgInteractiveRef.current) {
        fgInteractiveRef.current = nextInteractive;
        setFgInteractive(nextInteractive);
      }
    };

    const tick = () => {
      targetP = computeTarget();
      if (prefersReduced) {
        currentP = targetP;
        currentPointer = 0;
      } else {
        currentP += (targetP - currentP) * 0.14;
        currentPointer += (pointerOffset - currentPointer) * 0.1;
        if (Math.abs(targetP - currentP) < 0.0005) currentP = targetP;
      }
      applyProgress(currentP);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [onNavThemeChange]);

  return (
    <section id="overview" ref={theaterRef} className="lx-gate-theater">
      <div className="lx-gate-sticky">
        {/* Protected Origin Chamber Revealed Inside the Vault */}
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

        {/* Sculpted Warm Alabaster / Travertine Vault Doors */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            pointerEvents: 'none',
            perspective: '1600px',
            overflow: 'hidden',
          }}
          aria-hidden="true"
        >
          {/* LEFT TRAVERTINE DOOR */}
          <div ref={doorLeftRef} className="lx-gate-door lx-gate-door-left">
            <div className="lx-gate-coffer" style={{ left: '4.5%', right: '52px' }}>
              <div style={{ position: 'absolute', top: '-1px', left: '-1px', width: '18px', height: '18px', borderTop: '1.5px solid rgba(28,27,24,0.18)', borderLeft: '1.5px solid rgba(28,27,24,0.18)' }} />
              <div style={{ position: 'absolute', bottom: '-1px', left: '-1px', width: '18px', height: '18px', borderBottom: '1.5px solid rgba(28,27,24,0.18)', borderLeft: '1.5px solid rgba(28,27,24,0.18)' }} />
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '34px',
                left: '5.5%',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.14em',
                color: 'rgba(28, 27, 24, 0.38)',
              }}
            >
              LIMITX VAULT · EDGE REGULATOR
            </div>

            {SCALE_TICKS.map((topPct, i) => (
              <div
                key={topPct}
                style={{
                  position: 'absolute',
                  top: `${topPct}%`,
                  right: '10px',
                  width: i % 5 === 0 ? '18px' : '8px',
                  height: '1px',
                  background: i % 5 === 0 ? 'rgba(28, 27, 24, 0.28)' : 'rgba(28, 27, 24, 0.12)',
                }}
              />
            ))}

            <VaultLockHalf
              side="left"
              dialRef={dialLeftRef}
              rotorRef={rotorLeftRef}
              glowRef={glowLeftRef}
              ingotsRef={ingotsLeftRef}
              hubRef={hubLeftRef}
            />
          </div>

          {/* RIGHT TRAVERTINE DOOR */}
          <div ref={doorRightRef} className="lx-gate-door lx-gate-door-right">
            <div className="lx-gate-coffer" style={{ left: '52px', right: '6%' }}>
              <div style={{ position: 'absolute', top: '-1px', right: '-1px', width: '18px', height: '18px', borderTop: '1.5px solid rgba(28,27,24,0.18)', borderRight: '1.5px solid rgba(28,27,24,0.18)' }} />
              <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '18px', height: '18px', borderBottom: '1.5px solid rgba(28,27,24,0.18)', borderRight: '1.5px solid rgba(28,27,24,0.18)' }} />
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '34px',
                right: '7%',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.14em',
                color: 'rgba(28, 27, 24, 0.38)',
              }}
            >
              ORIGIN SHIELD · 60S WINDOW
            </div>

            {SCALE_TICKS.map((topPct, i) => (
              <div
                key={topPct}
                style={{
                  position: 'absolute',
                  top: `${topPct}%`,
                  left: '10px',
                  width: i % 5 === 0 ? '18px' : '8px',
                  height: '1px',
                  background: i % 5 === 0 ? 'rgba(28, 27, 24, 0.28)' : 'rgba(28, 27, 24, 0.12)',
                }}
              />
            ))}

            <VaultLockHalf
              side="right"
              dialRef={dialRightRef}
              rotorRef={rotorRightRef}
              glowRef={glowRightRef}
              ingotsRef={ingotsRightRef}
              hubRef={hubRightRef}
            />
          </div>

          {/* Warm Luminous Amber Seam Slit */}
          <div ref={seamRef} className="lx-gate-seam-light" />
        </div>

        {/* Unobstructed Left-Bay Editorial Typography */}
        <div className="lx-hero-fg-anchor">
          <div
            ref={fgRef}
            style={{
              color: '#1C1B18',
              pointerEvents: fgInteractive ? 'auto' : 'none',
              willChange: 'transform, opacity',
            }}
          >
            <div className="lx-hero-eyebrow">
              <span>LIMITX ENGINE 2.0</span>
              <span style={{ opacity: 0.4 }}>/</span>
              <span>ZERO-LATENCY GATEWAY</span>
            </div>

            <h1 className="lx-hero-title">
              <BlurText text="Rate limiting for developers" delayStep={40} startDelay={30} />
            </h1>

            <p className="lx-hero-sub">
              Put a precision traffic vault in front of your backend. Stop spikes and abuse before they wake your origin server.
            </p>

            <div className="lx-hero-actions">
              <Link
                to="/auth?mode=signup"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '12px 24px',
                  borderRadius: '2px',
                  background: '#1C1B18',
                  color: '#F5F2EB',
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
                  border: '1px solid rgba(28, 27, 24, 0.22)',
                  background: 'rgba(255, 255, 255, 0.72)',
                  color: '#1C1B18',
                  fontSize: '14.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                1-step setup
              </button>
            </div>

            <div className="lx-hero-scroll-cue">
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  letterSpacing: '0.12em',
                  color: '#7C766C',
                  textTransform: 'uppercase',
                }}
              >
                Scroll to unlock
              </span>
              <div
                style={{
                  width: '1px',
                  height: '32px',
                  background: 'rgba(28, 27, 24, 0.18)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  className="lx-scroll-stem"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent, #1C1B18, transparent)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
