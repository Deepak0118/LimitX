import { useEffect, useRef } from 'react';

export default function ScrollRevealStage({ children, mode = 'rise' }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const leftWingRef = useRef(null);
  const rightWingRef = useRef(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) return;

    let rafId = null;

    const update = () => {
      const el = outerRef.current;
      if (el && innerRef.current) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        // 0 when section top reaches bottom of viewport, 1 when top reaches ~38% from top
        const raw = (vh - rect.top) / (vh * 0.62);
        const p = Math.max(0, Math.min(1, raw));
        const ease = 1 - Math.pow(1 - p, 3);

        if (mode === 'rise') {
          const y = (1 - ease) * 42;
          const sc = 0.955 + ease * 0.045;
          innerRef.current.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
          innerRef.current.style.opacity = Math.min(1, 0.25 + ease * 0.75).toFixed(3);
        } else if (mode === 'finale') {
          const sc = 0.93 + ease * 0.07;
          innerRef.current.style.transform = `scale(${sc.toFixed(4)})`;
          innerRef.current.style.opacity = Math.min(1, 0.35 + ease * 0.65).toFixed(3);

          // Mirrored side framing panels glide subtly inward as you arrive at finale
          const wingShift = (1 - ease) * 64;
          if (leftWingRef.current) {
            leftWingRef.current.style.transform = `translate3d(${(-wingShift).toFixed(1)}px, 0, 0)`;
            leftWingRef.current.style.opacity = (0.2 + ease * 0.8).toFixed(3);
          }
          if (rightWingRef.current) {
            rightWingRef.current.style.transform = `translate3d(${wingShift.toFixed(1)}px, 0, 0)`;
            rightWingRef.current.style.opacity = (0.2 + ease * 0.8).toFixed(3);
          }
        }
      }
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [mode]);

  if (mode === 'finale') {
    return (
      <div ref={outerRef} style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Left & Right Architectural Framing Wings */}
        <div
          ref={leftWingRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '28px',
            bottom: '28px',
            left: '24px',
            width: '18px',
            borderLeft: '1px solid #C9C3B7',
            borderTop: '1px solid #C9C3B7',
            borderBottom: '1px solid #C9C3B7',
            pointerEvents: 'none',
          }}
        />
        <div
          ref={rightWingRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '28px',
            bottom: '28px',
            right: '24px',
            width: '18px',
            borderRight: '1px solid #C9C3B7',
            borderTop: '1px solid #C9C3B7',
            borderBottom: '1px solid #C9C3B7',
            pointerEvents: 'none',
          }}
        />
        <div ref={innerRef} style={{ willChange: 'transform, opacity' }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={outerRef}>
      <div ref={innerRef} style={{ willChange: 'transform, opacity' }}>
        {children}
      </div>
    </div>
  );
}
