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
        const raw = (vh - rect.top) / (vh * 0.62);
        const p = Math.max(0, Math.min(1, raw));
        const ease = 1 - Math.pow(1 - p, 3);

        if (mode === 'rise') {
          const y = (1 - ease) * 42;
          const sc = 0.955 + ease * 0.045;
          innerRef.current.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
          innerRef.current.style.opacity = Math.min(1, 0.25 + ease * 0.75).toFixed(3);
        } else if (mode === 'finale') {
          const sc = 0.92 + ease * 0.08;
          innerRef.current.style.transform = `scale(${sc.toFixed(4)})`;
          innerRef.current.style.opacity = Math.min(1, 0.35 + ease * 0.65).toFixed(3);

          // Sculpted reverse-vault bronze shutters glide inward around finale CTA
          const wingShift = (1 - ease) * 90;
          if (leftWingRef.current) {
            leftWingRef.current.style.transform = `translate3d(${(-wingShift).toFixed(1)}px, 0, 0)`;
            leftWingRef.current.style.opacity = (0.15 + ease * 0.85).toFixed(3);
          }
          if (rightWingRef.current) {
            rightWingRef.current.style.transform = `translate3d(${wingShift.toFixed(1)}px, 0, 0)`;
            rightWingRef.current.style.opacity = (0.15 + ease * 0.85).toFixed(3);
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
        {/* Left Reverse-Vault Architectural Shutter */}
        <div
          ref={leftWingRef}
          className="lx-finale-shutter"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '54px',
            background: 'linear-gradient(90deg, #D5CEBE 0%, #E8E2D4 100%)',
            borderRight: '1px solid #C8BEAC',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: '24px',
          }}
        >
          {[0, 1, 2].map((b) => (
            <span
              key={b}
              style={{
                width: '18px',
                height: '8px',
                background: '#FAF8F5',
                border: '1px solid #B8AE9C',
                borderRadius: '1px 0 0 1px',
                opacity: 0.85,
              }}
            />
          ))}
        </div>

        {/* Right Reverse-Vault Architectural Shutter */}
        <div
          ref={rightWingRef}
          className="lx-finale-shutter"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: '54px',
            background: 'linear-gradient(270deg, #D5CEBE 0%, #E8E2D4 100%)',
            borderLeft: '1px solid #C8BEAC',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: '24px',
          }}
        >
          {[0, 1, 2].map((b) => (
            <span
              key={b}
              style={{
                width: b === 1 ? '11px' : '18px',
                height: '8px',
                background: b === 1 ? '#D8D1C2' : '#FAF8F5',
                border: '1px solid #B8AE9C',
                borderRadius: '0 1px 1px 0',
                opacity: 0.85,
              }}
            />
          ))}
        </div>

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
