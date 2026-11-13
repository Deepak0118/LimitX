import { useEffect, useRef, useState } from 'react';

export default function ScrollKiteTrail() {
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const kiteRef = useRef(null);
  const tailPathRef = useRef(null);
  const bowRefs = useRef([]);

  const [pathData, setPathData] = useState('');
  const [totalLength, setTotalLength] = useState(0);

  // Generate organic Bézier path through key sections of the Landing page
  useEffect(() => {
    const updatePath = () => {
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        3600
      );
      const docWidth = window.innerWidth || 1200;

      // Carefully tuned anchor and control points matching section landmarks
      const p0 = { x: docWidth * 0.62, y: 560 }; // Under Hero Gateway
      const c01 = { x: docWidth * 0.76, y: 840 };
      const c02 = { x: docWidth * 0.16, y: 1080 };
      const p1 = { x: docWidth * 0.18, y: 1380 }; // Left of URL swap stage

      const c11 = { x: docWidth * 0.20, y: 1650 };
      const c12 = { x: docWidth * 0.82, y: 1740 };
      const p2 = { x: docWidth * 0.80, y: 2040 }; // Sweep right past URL swap

      const c21 = { x: docWidth * 0.78, y: 2340 };
      const c22 = { x: docWidth * 0.34, y: 2480 };
      const p3 = { x: docWidth * 0.38, y: 2740 }; // Weave towards 3D Circle Gallery

      const c31 = { x: docWidth * 0.42, y: 2980 };
      const c32 = { x: docWidth * 0.70, y: 3180 };
      const p4 = { x: docWidth * 0.66, y: 3440 }; // Algorithm section

      const c41 = { x: docWidth * 0.64, y: 3680 };
      const c42 = { x: docWidth * 0.50, y: docHeight - 480 };
      const p5 = { x: docWidth * 0.50, y: docHeight - 240 }; // Finale CTA

      const d = `M ${p0.x} ${p0.y} C ${c01.x} ${c01.y}, ${c02.x} ${c02.y}, ${p1.x} ${p1.y} C ${c11.x} ${c11.y}, ${c12.x} ${c12.y}, ${p2.x} ${p2.y} C ${c21.x} ${c21.y}, ${c22.x} ${c22.y}, ${p3.x} ${p3.y} C ${c31.x} ${c31.y}, ${c32.x} ${c32.y}, ${p4.x} ${p4.y} C ${c41.x} ${c41.y}, ${c42.x} ${c42.y}, ${p5.x} ${p5.y}`;

      setPathData(d);
    };

    updatePath();
    window.addEventListener('resize', updatePath);
    const timer = setTimeout(updatePath, 500);
    return () => {
      window.removeEventListener('resize', updatePath);
      clearTimeout(timer);
    };
  }, []);

  // Measure total length of flight curve
  useEffect(() => {
    if (pathRef.current) {
      try {
        const len = pathRef.current.getTotalLength();
        if (len > 0) setTotalLength(len);
      } catch (err) {
        // SVG layout pending
      }
    }
  }, [pathData]);

  // Physics animation loop: Scrub lag + Tangent auto-rotation + Aerodynamic Banking + Fluttering Tail
  useEffect(() => {
    if (!totalLength || !pathRef.current || !kiteRef.current) return;

    let rafId = null;
    let currentDist = 0;
    let targetDist = 0;
    let waveTime = 0;

    const onFrame = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );

      const progress = Math.max(0, Math.min(1, scrollY / maxScroll));
      targetDist = progress * totalLength;

      // GSAP-style scrub damping (smooth physics lag)
      const diff = targetDist - currentDist;
      currentDist += diff * 0.085;
      const velocity = diff;

      // Flutter frequency accelerates when scrolling fast
      waveTime += 0.1 + Math.abs(velocity) * 0.008;

      const pathEl = pathRef.current;
      const kiteEl = kiteRef.current;

      if (pathEl && kiteEl) {
        const clampedDist = Math.max(0, Math.min(totalLength, currentDist));
        pathEl.style.strokeDashoffset = `${totalLength - clampedDist}px`;

        const p1 = pathEl.getPointAtLength(clampedDist);
        const forwardDist = Math.min(totalLength, clampedDist + 3);
        const p2 = pathEl.getPointAtLength(forwardDist);

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

        // Aerodynamic banking roll based on velocity and turn curve
        const bank = Math.max(-26, Math.min(26, velocity * 1.6));

        // Position & rotate kite
        kiteEl.style.transform = `translate3d(${p1.x}px, ${p1.y}px, 0px) rotate(${angleDeg + 90}deg) rotateZ(${bank}deg)`;
        kiteEl.style.opacity = clampedDist > 14 ? '1' : '0';

        // Animate the fluttering ribbon tail dynamically
        if (tailPathRef.current) {
          const t1X = 28 + Math.sin(waveTime * 1.2) * 6;
          const t1Y = 78;
          const t2X = 28 + Math.sin(waveTime * 1.2 + 1.2) * 11;
          const t2Y = 96;
          const t3X = 28 + Math.sin(waveTime * 1.2 + 2.4) * 14;
          const t3Y = 116;
          const t4X = 28 + Math.sin(waveTime * 1.2 + 3.6) * 16;
          const t4Y = 138;

          tailPathRef.current.setAttribute(
            'd',
            `M 28 68 Q ${t1X} ${t1Y}, ${t2X} ${t2Y} T ${t3X} ${t3Y} T ${t4X} ${t4Y}`
          );

          // Update positions of the ribbon bows along the tail
          if (bowRefs.current[0]) {
            bowRefs.current[0].style.transform = `translate(${t1X}px, ${t1Y}px) rotate(${Math.sin(waveTime) * 15}deg)`;
          }
          if (bowRefs.current[1]) {
            bowRefs.current[1].style.transform = `translate(${t2X}px, ${t2Y}px) rotate(${Math.sin(waveTime + 1) * 20}deg)`;
          }
          if (bowRefs.current[2]) {
            bowRefs.current[2].style.transform = `translate(${t3X}px, ${t3Y}px) rotate(${Math.sin(waveTime + 2) * 25}deg)`;
          }
        }
      }

      rafId = requestAnimationFrame(onFrame);
    };

    rafId = requestAnimationFrame(onFrame);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [totalLength]);

  if (!pathData) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 15,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <svg
        ref={svgRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        <defs>
          {/* Golden Amber Light Glow Filter for Flight Ribbon */}
          <filter id="kiteGildedGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gilded Silk Ribbon Gradient */}
          <linearGradient id="goldRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C68A2C" />
            <stop offset="50%" stopColor="#E5C07B" />
            <stop offset="100%" stopColor="#C68A2C" />
          </linearGradient>

          {/* 3D Paper Facet Gradients for the Kite Body */}
          {/* Top-Left: Highlighted Warm Ivory Paper */}
          <linearGradient id="facetTopLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#FBF9F5" />
            <stop offset="100%" stopColor="#EDE8DF" />
          </linearGradient>

          {/* Top-Right: Warm Champagne Stone (Midtone) */}
          <linearGradient id="facetTopRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5F2EB" />
            <stop offset="70%" stopColor="#E5DFD3" />
            <stop offset="100%" stopColor="#D8D1C3" />
          </linearGradient>

          {/* Bottom-Left: Architectural Deep Obsidian Charcoal */}
          <linearGradient id="facetBottomLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2E2B26" />
            <stop offset="60%" stopColor="#22211E" />
            <stop offset="100%" stopColor="#171614" />
          </linearGradient>

          {/* Bottom-Right: Rich Brushed Dark Bronze Slate */}
          <linearGradient id="facetBottomRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3A3731" />
            <stop offset="60%" stopColor="#2A2824" />
            <stop offset="100%" stopColor="#1E1D1A" />
          </linearGradient>

          {/* Carbon/Bamboo Spar Specular Gradient */}
          <linearGradient id="sparGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1C1B18" />
            <stop offset="50%" stopColor="#E5C07B" />
            <stop offset="100%" stopColor="#1C1B18" />
          </linearGradient>
        </defs>

        {/* 1. Faint Background Hairline (shows future curve subtly) */}
        <path
          d={pathData}
          fill="none"
          stroke="rgba(28, 27, 24, 0.07)"
          strokeWidth="1.2"
          strokeDasharray="4 7"
        />

        {/* 2. Active Scrubbed Gilded Trail (draws live on scroll) */}
        <path
          ref={pathRef}
          d={pathData}
          fill="none"
          stroke="url(#goldRibbonGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray={totalLength || 10000}
          strokeDashoffset={totalLength || 10000}
          filter="url(#kiteGildedGlow)"
          style={{
            opacity: 0.9,
            transition: 'opacity 300ms ease',
          }}
        />
      </svg>

      {/* 3. The High-Fidelity 3D Crafted Kite */}
      <div
        ref={kiteRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '0px',
          height: '0px',
          transition: 'opacity 300ms ease',
          willChange: 'transform',
        }}
      >
        {/* Floating Ambient Drop-Shadow (gives 3D altitude above the page) */}
        <div
          style={{
            position: 'absolute',
            top: '-34px',
            left: '-24px',
            width: '56px',
            height: '80px',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(28, 27, 24, 0.35) 0%, transparent 72%)',
            transform: 'translate(4px, 18px) scale(0.95)',
            filter: 'blur(5px)',
            pointerEvents: 'none',
          }}
        />

        {/* Kite Body Wrapper (56px wide x 80px high) */}
        <div
          style={{
            position: 'absolute',
            top: '-38px',
            left: '-28px',
            width: '56px',
            height: '144px', // Extra height for the dynamic tail
            filter: 'drop-shadow(0 6px 14px rgba(28, 27, 24, 0.22))',
          }}
        >
          <svg width="56" height="144" viewBox="0 0 56 144" fill="none">
            {/* =========================================================================
                3D FACETED DIAMOND SAIL
                Corners: Top (28, 0), Left (0, 36), Right (56, 36), Bottom (28, 68)
                ========================================================================= */}

            {/* Facet 1: Top-Left (Warm Ivory Highlight) */}
            <path
              d="M 28 0 L 0 36 L 28 36 Z"
              fill="url(#facetTopLeft)"
            />

            {/* Facet 2: Top-Right (Champagne Stone Midtone) */}
            <path
              d="M 28 0 L 56 36 L 28 36 Z"
              fill="url(#facetTopRight)"
            />

            {/* Facet 3: Bottom-Left (Architectural Obsidian Charcoal) */}
            <path
              d="M 28 36 L 0 36 L 28 68 Z"
              fill="url(#facetBottomLeft)"
            />

            {/* Facet 4: Bottom-Right (Deep Bronze Slate) */}
            <path
              d="M 28 36 L 56 36 L 28 68 Z"
              fill="url(#facetBottomRight)"
            />

            {/* Outer Perimeter Folded Seam Hem */}
            <path
              d="M 28 0 L 56 36 L 28 68 L 0 36 Z"
              fill="none"
              stroke="#D4CEBF"
              strokeWidth="0.8"
              opacity="0.75"
            />

            {/* Elegant Inner Geometric Crest Line (Gold) */}
            <path
              d="M 28 10 L 46 36 L 28 56 L 10 36 Z"
              fill="none"
              stroke="#D4A359"
              strokeWidth="0.75"
              strokeDasharray="2 2"
              opacity="0.65"
            />

            {/* =========================================================================
                STRUCTURAL SPARS (3D BENT BAMBOO/CARBON SKELETON)
                ========================================================================= */}
            {/* Tensioned Curved Crossbar (Bow Spar) */}
            <path
              d="M 1 36 Q 28 42 55 36"
              fill="none"
              stroke="#2E2B26"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Specular highlight on crossbar */}
            <path
              d="M 2 35.5 Q 28 41.5 54 35.5"
              fill="none"
              stroke="#E5C07B"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* Central Vertical Spine Spar */}
            <line
              x1="28"
              y1="0"
              x2="28"
              y2="69"
              stroke="#2A2824"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Spine Highlight Line */}
            <line
              x1="28"
              y1="1"
              x2="28"
              y2="68"
              stroke="#FAF8F5"
              strokeWidth="0.9"
              strokeLinecap="round"
              opacity="0.85"
            />

            {/* Central Brass/Gold Tie Ferrule at the Spar Crossing (28, 36) */}
            <rect
              x="25.5"
              y="34"
              width="5"
              height="5"
              rx="1"
              fill="#D4A359"
              stroke="#FAF8F5"
              strokeWidth="0.8"
            />

            {/* Glowing Nose Cap Beacon */}
            <circle
              cx="28"
              cy="3"
              r="2.8"
              fill="#FAF8F5"
              stroke="#D4A359"
              strokeWidth="0.8"
              style={{
                filter: 'drop-shadow(0 0 5px #F5A623)',
              }}
            />

            {/* 3D Bridle Lines (Tension Strings to Center Ring) */}
            <line x1="28" y1="12" x2="28" y2="28" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="0.6" />
            <line x1="12" y1="36" x2="28" y2="28" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="0.6" />
            <line x1="44" y1="36" x2="28" y2="28" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="0.6" />
            <circle cx="28" cy="28" r="1.4" fill="#FAF8F5" />

            {/* =========================================================================
                DYNAMIC FLUTTERING SILK TAIL WITH BOW-TIE RIBBONS
                ========================================================================= */}
            {/* Wavy Tail String (Updated live via requestAnimationFrame) */}
            <path
              ref={tailPathRef}
              d="M 28 68 Q 28 82, 28 98 T 28 118 T 28 140"
              fill="none"
              stroke="#C68A2C"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.85"
            />

            {/* Ribbon Bow 1 (Top Bow) */}
            <g ref={(el) => (bowRefs.current[0] = el)} style={{ transformOrigin: '0 0' }}>
              <polygon points="-7,-4 0,0 -7,4" fill="#D4A359" opacity="0.95" />
              <polygon points="7,-4 0,0 7,4" fill="#D4A359" opacity="0.95" />
              <circle cx="0" cy="0" r="1.4" fill="#FAF8F5" />
            </g>

            {/* Ribbon Bow 2 (Middle Bow) */}
            <g ref={(el) => (bowRefs.current[1] = el)} style={{ transformOrigin: '0 0' }}>
              <polygon points="-8,-4 0,0 -8,4" fill="#2E2B26" opacity="0.9" />
              <polygon points="8,-4 0,0 8,4" fill="#2E2B26" opacity="0.9" />
              <circle cx="0" cy="0" r="1.4" fill="#D4A359" />
            </g>

            {/* Ribbon Bow 3 (Bottom Bow) */}
            <g ref={(el) => (bowRefs.current[2] = el)} style={{ transformOrigin: '0 0' }}>
              <polygon points="-9,-5 0,0 -9,5" fill="#C68A2C" opacity="0.9" />
              <polygon points="9,-5 0,0 9,5" fill="#C68A2C" opacity="0.9" />
              <circle cx="0" cy="0" r="1.4" fill="#FAF8F5" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
