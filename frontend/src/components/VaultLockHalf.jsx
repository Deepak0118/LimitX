const OUTER_TICKS = Array.from({ length: 60 }, (_, i) => i);
const TOKEN_PODS = Array.from({ length: 8 }, (_, i) => ({
  angle: i * 45,
  id: i,
}));

/**
 * 3 Heavy Architectural Locking Ingots (Sliding Deadbolts)
 * Middle ingot spans visibly over the bezel lip right into the Center Medallion (r=64).
 * Top & bottom ingots clamp across the outer bezel rim (x=146 / x=454) into milled notches.
 */
const LOCK_INGOTS = [
  { y: 112, height: 18, innerDist: 140, barLen: 92, tag: null },
  { y: 220, height: 24, innerDist: 66, barLen: 156, tag: 'RATE: 100/S' },
  { y: 328, height: 18, innerDist: 140, barLen: 92, tag: null },
];

/**
 * VaultLockHalf
 * Renders one seam-clipped half ('left' | 'right') of the 600x440 Chrono-Governor Vault Lock.
 * Warm Alabaster / Champagne Titanium aesthetic meeting at exact x=300 seam.
 */
export default function VaultLockHalf({
  side,
  dialRef,
  rotorRef,
  glowRef,
  ingotsRef,
  hubRef,
}) {
  const isLeft = side === 'left';
  const uid = `lx-lock-light-${side}`;

  return (
    <div className={`lx-vault-half lx-vault-half-${side}`} aria-hidden="true">
      <svg
        width="600"
        height="440"
        viewBox="0 0 600 440"
        style={{
          position: 'absolute',
          top: 0,
          ...(isLeft ? { right: 0 } : { left: '-300px' }),
          overflow: 'visible',
        }}
      >
        <defs>
          {/* Champagne-Titanium Outer Caliper Bezel */}
          <linearGradient id={`${uid}-bezel`} x1="12%" y1="8%" x2="88%" y2="92%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
            <stop offset="22%" stopColor="#EDE8DE" />
            <stop offset="50%" stopColor="#D5CEBE" />
            <stop offset="76%" stopColor="#F5F2EB" />
            <stop offset="100%" stopColor="#B3AB9B" />
          </linearGradient>

          {/* Recessed Honed Stone Pocket Well */}
          <radialGradient id={`${uid}-well`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ECE6DA" />
            <stop offset="70%" stopColor="#DDD5C5" />
            <stop offset="100%" stopColor="#C8BEAC" />
          </radialGradient>

          {/* Warm Amber-Gold Aperture Glow */}
          <radialGradient id={`${uid}-core-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCEFD2" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#E8CA8C" stopOpacity="0.58" />
            <stop offset="85%" stopColor="#D4A855" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#D4A855" stopOpacity="0" />
          </radialGradient>

          {/* Heavy Milled Locking Ingot Gradient */}
          <linearGradient id={`${uid}-ingot`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="16%" stopColor="#F5F1E9" />
            <stop offset="58%" stopColor="#DED7C8" />
            <stop offset="88%" stopColor="#BEB5A2" />
            <stop offset="100%" stopColor="#8E8573" />
          </linearGradient>

          {/* Token Rotor Disk Surface */}
          <linearGradient id={`${uid}-rotor-plate`} x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="#FBF9F5" />
            <stop offset="52%" stopColor="#ECE6D9" />
            <stop offset="100%" stopColor="#D9D1C1" />
          </linearGradient>

          {/* Center Medallion Bevel */}
          <linearGradient id={`${uid}-hub-bevel`} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="46%" stopColor="#E3DDD0" />
            <stop offset="100%" stopColor="#A19987" />
          </linearGradient>

          {/* Curved Dial Telemetry Arc */}
          <path
            id={`${uid}-dial-arc`}
            d="M 300, 48 A 172,172 0 1,1 299.9,48"
          />
        </defs>

        {/* ========================================================
            LAYER 1: Recessed Stone Well & Warm Amber Aperture Glow
           ======================================================== */}
        <circle
          cx="300"
          cy="220"
          r="192"
          fill={`url(#${uid}-well)`}
          stroke="rgba(255, 255, 255, 0.85)"
          strokeWidth="1.5"
        />
        <circle
          cx="300"
          cy="220"
          r="188"
          fill="none"
          stroke="#9E9482"
          strokeWidth="2.5"
          opacity="0.32"
        />

        <circle
          ref={glowRef}
          cx="300"
          cy="220"
          r="152"
          fill={`url(#${uid}-core-glow)`}
          opacity="0.08"
        />

        {/* ========================================================
            LAYER 2: Rotating Outer Dial (Window 60s Vernier Scale)
           ======================================================== */}
        <g ref={dialRef}>
          <circle
            cx="300"
            cy="220"
            r="180"
            fill="none"
            stroke={`url(#${uid}-bezel)`}
            strokeWidth="14"
          />
          <circle
            cx="300"
            cy="220"
            r="173"
            fill="none"
            stroke="#8E8573"
            strokeWidth="0.75"
            opacity="0.48"
          />
          <circle
            cx="300"
            cy="220"
            r="187"
            fill="none"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="1"
          />

          {OUTER_TICKS.map((t) => {
            const cardinal = t % 15 === 0;
            const major = t % 5 === 0;
            return (
              <line
                key={t}
                x1="300"
                y1={cardinal ? 34 : major ? 38 : 41}
                x2="300"
                y2="47"
                stroke={cardinal ? '#1C1B18' : major ? '#524C41' : '#948B7A'}
                strokeWidth={cardinal ? '1.8' : major ? '1.2' : '0.75'}
                transform={`rotate(${t * 6} 300 220)`}
              />
            );
          })}

          <text
            fill="#524C41"
            fontSize="8"
            fontFamily="var(--font-mono)"
            fontWeight="500"
            letterSpacing="2.6"
          >
            <textPath href={`#${uid}-dial-arc`} startOffset="5%">
              LIMITX CHRONO-GOVERNOR · 60S SLIDING WINDOW · RATE VAULT ·
            </textPath>
          </text>
        </g>

        {/* ========================================================
            LAYER 3: Rotary Token Pod Disk (Token Bucket Metaphor)
           ======================================================== */}
        <g ref={rotorRef}>
          <circle
            cx="300"
            cy="220"
            r="140"
            fill={`url(#${uid}-rotor-plate)`}
            stroke="#A39986"
            strokeWidth="1"
          />
          <circle
            cx="300"
            cy="220"
            r="138"
            fill="none"
            stroke="rgba(255, 255, 255, 0.85)"
            strokeWidth="1"
          />
          <circle
            cx="300"
            cy="220"
            r="110"
            fill="none"
            stroke="#B0A693"
            strokeWidth="1.25"
            strokeDasharray="4 6"
            opacity="0.68"
          />

          {TOKEN_PODS.map((pod) => (
            <g
              key={pod.id}
              transform={`rotate(${pod.angle} 300 220) translate(300, 110)`}
            >
              <circle
                cx="0"
                cy="0"
                r="11"
                fill="#FAF8F5"
                stroke="#A89E8C"
                strokeWidth="1"
              />
              <circle
                cx="0"
                cy="0"
                r="7.5"
                fill="#E8E2D5"
                stroke="rgba(255, 255, 255, 0.75)"
                strokeWidth="0.75"
              />
              <circle cx="0" cy="0" r="2.8" fill="#9E7A38" opacity="0.85" />
            </g>
          ))}
        </g>

        {/* ========================================================
            LAYER 4: Center Medallion & LimitX Split-Cap Keystone
           ======================================================== */}
        <g ref={hubRef}>
          <circle
            cx="300"
            cy="220"
            r="66"
            fill="none"
            stroke="#8E8573"
            strokeWidth="1"
            opacity="0.42"
          />
          <circle
            cx="300"
            cy="220"
            r="62"
            fill={`url(#${uid}-hub-bevel)`}
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="1.5"
          />
          <circle
            cx="300"
            cy="220"
            r="54"
            fill="#FAF8F5"
            stroke="#C4BDAE"
            strokeWidth="1"
          />
          <circle
            cx="300"
            cy="220"
            r="44"
            fill="none"
            stroke="#DDD7C9"
            strokeWidth="1"
            strokeDasharray="3 4"
          />

          <path d="M 297 196 A 24 24 0 0 0 297 244 Z" fill="#1C1B18" />
          <path d="M 303 196 L 303 211 L 324 211 A 24 24 0 0 0 303 196 Z" fill="#524C41" />
          <rect x="303" y="216" width="24" height="8" rx="1" fill="#8A7D6B" />
          <path d="M 303 229 L 303 244 A 24 24 0 0 0 324 229 Z" fill="#2C2924" />
        </g>

        {/* ========================================================
            LAYER 5: Exposed Sliding Titanium Ingots Clamping Dial & Hub
           ======================================================== */}
        {LOCK_INGOTS.map((ingot, idx) => {
          const ingotX = isLeft
            ? 300 - ingot.innerDist - ingot.barLen
            : 300 + ingot.innerDist;
          const pocketX = isLeft ? ingotX - 58 : ingotX;
          const pocketW = ingot.barLen + 58;
          const guideX = isLeft ? pocketX : pocketX + pocketW - 66;

          return (
            <g key={ingot.y}>
              {/* Outer Door Pocket Housing */}
              <rect
                x={guideX}
                y={ingot.y - ingot.height / 2 - 4}
                width="66"
                height={ingot.height + 8}
                rx="3"
                fill="#D6CEBE"
                stroke="rgba(255, 255, 255, 0.78)"
                strokeWidth="1"
              />

              {/* Sliding Brushed-Titanium Locking Ingot */}
              <g ref={(el) => { if (ingotsRef.current) ingotsRef.current[idx] = el; }}>
                <rect
                  x={ingotX}
                  y={ingot.y - ingot.height / 2}
                  width={ingot.barLen}
                  height={ingot.height}
                  rx="2.5"
                  fill={`url(#${uid}-ingot)`}
                  stroke="#9C9381"
                  strokeWidth="0.9"
                />
                {/* Top Chamfer Highlight */}
                <line
                  x1={ingotX + 2}
                  y1={ingot.y - ingot.height / 2 + 1.2}
                  x2={ingotX + ingot.barLen - 2}
                  y2={ingot.y - ingot.height / 2 + 1.2}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  opacity="0.9"
                />
                {/* Machined Collar Pin */}
                <rect
                  x={isLeft ? ingotX + ingot.barLen - 16 : ingotX + 10}
                  y={ingot.y - ingot.height / 2 - 1.5}
                  width="6"
                  height={ingot.height + 3}
                  rx="1"
                  fill="#EDE8DE"
                  stroke="#8E8573"
                  strokeWidth="0.6"
                />

                {ingot.tag && (
                  <text
                    x={ingotX + ingot.barLen / 2 + (isLeft ? -6 : 6)}
                    y={ingot.y + 3}
                    fill="#3E3930"
                    fontSize="7.5"
                    fontFamily="var(--font-mono)"
                    fontWeight="600"
                    letterSpacing="1.1"
                    textAnchor="middle"
                  >
                    {isLeft ? 'LOCKED · VAULT' : ingot.tag}
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
