import { useEffect, useRef } from 'react';

export default function ScrollRevealStage({ children, mode = 'rise' }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);

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
        }
      }
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [mode]);

  return (
    <div ref={outerRef} style={{ position: 'relative', overflow: 'hidden' }}>
      <div ref={innerRef} style={{ willChange: 'transform, opacity' }}>
        {children}
      </div>
    </div>
  );
}
