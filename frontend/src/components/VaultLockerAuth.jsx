import { useEffect, useRef } from 'react';

const DIAL_NUMS = [
  { val: '0', deg: 0 },
  { val: '10', deg: 36 },
  { val: '25', deg: 72 },
  { val: '50', deg: 108 },
  { val: '100', deg: 144 },
  { val: '150', deg: 180 },
  { val: '250', deg: 216 },
  { val: '500', deg: 252 },
  { val: 'MAX', deg: 288 },
  { val: 'GATE', deg: 324 },
];

const RIVETS = Array.from({ length: 12 }, (_, i) => i * 30);
const TICKS_60 = Array.from({ length: 60 }, (_, i) => i);

/**
 * VaultLockerAuth
 * A tactile bank safe combination locker specifically tied to Rate-Limiting protection
 * (brute-force defense, sliding window attempt throttler, and cryptographic keyway).
 * Dynamically clocks its tumblers and retracts bolts as the user types and signs in.
 */
export default function VaultLockerAuth({ mode = 'login', email = '', password = '', loading = false, error = '' }) {
  const dialRef = useRef(null);
  const boltTopRef = useRef(null);
  const boltBottomRef = useRef(null);
  const boltRightRef = useRef(null);

  // Compute physical combination rotation based on typing cadence
  const inputLength = (email?.length || 0) + (password?.length || 0);
  const targetDeg = loading ? 720 : inputLength * 28 + (mode === 'signup' ? 90 : 0);

  useEffect(() => {
    if (dialRef.current) {
      dialRef.current.style.transform = `rotate(${targetDeg}deg)`;
    }

    // Bolts retract when loading / authenticating
    const retractDist = loading ? 22 : Math.min(10, inputLength * 0.8);
    if (boltTopRef.current) {
      boltTopRef.current.style.transform = `translateY(${-retractDist}px)`;
    }
    if (boltBottomRef.current) {
      boltBottomRef.current.style.transform = `translateY(${retractDist}px)`;
    }
    if (boltRightRef.current) {
      boltRightRef.current.style.transform = `translateX(${retractDist}px)`;
    }
  }, [targetDeg, loading, inputLength]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '0 auto 28px',
        maxWidth: '320px',
        width: '100%',
        userSelect: 'none',
      }}
      aria-hidden="true"
    >
      {/* Heavy Machined Bank Locker Safe Housing */}
      <div
        style={{
          position: 'relative',
          width: '240px',
          height: '240px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="240"
          height="240"
          viewBox="0 0 240 240"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Satin Champagne Bezel Gradient */}
            <linearGradient id="vx-bezel" x1="10%" y1="10%" x2="90%" y2="90%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#EDE7DB" />
              <stop offset="50%" stopColor="#D2C9B7" />
              <stop offset="78%" stopColor="#EFECE5" />
              <stop offset="100%" stopColor="#A89E8C" />
            </linearGradient>

            {/* Recessed Machined Steel Well */}
            <radialGradient id="vx-well" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ECE5D7" />
              <stop offset="68%" stopColor="#DDD4C3" />
              <stop offset="100%" stopColor="#BDB19C" />
            </radialGradient>

            {/* Chrome Locking Bolt Gradient */}
            <linearGradient id="vx-bolt" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="30%" stopColor="#ECE6DA" />
              <stop offset="70%" stopColor="#C4BCAE" />
              <stop offset="100%" stopColor="#8C8372" />
            </linearGradient>

            {/* Center Dial Face */}
            <radialGradient id="vx-dial-face" cx="45%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FAF8F5" />
              <stop offset="60%" stopColor="#EAE3D5" />
              <stop offset="100%" stopColor="#D5CBB9" />
            </radialGradient>

            {/* Center Core Cap */}
            <linearGradient id="vx-core-cap" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2A2824" />
              <stop offset="100%" stopColor="#141310" />
            </linearGradient>
          </defs>

          {/* ========================================================
              3 HEAVY LOCKING DEADBOLTS ANCHORED INTO DOOR FRAME
             ======================================================== */}
          {/* Top Locking Bolt */}
          <g
            ref={boltTopRef}
            style={{
              transition: 'transform 320ms cubic-bezier(0.2, 0.8, 0.25, 1)',
              transformOrigin: '120px 20px',
            }}
          >
            <rect
              x="108"
              y="2"
              width="24"
              height="36"
              rx="2"
              fill="url(#vx-bolt)"
              stroke="#8C8372"
              strokeWidth="0.8"
            />
            <line x1="110" y1="12" x2="130" y2="12" stroke="#FFFFFF" strokeWidth="1" />
          </g>

          {/* Bottom Locking Bolt */}
          <g
            ref={boltBottomRef}
            style={{
              transition: 'transform 320ms cubic-bezier(0.2, 0.8, 0.25, 1)',
              transformOrigin: '120px 220px',
            }}
          >
            <rect
              x="108"
              y="202"
              width="24"
              height="36"
              rx="2"
              fill="url(#vx-bolt)"
              stroke="#8C8372"
              strokeWidth="0.8"
            />
            <line x1="110" y1="228" x2="130" y2="228" stroke="#FFFFFF" strokeWidth="1" />
          </g>

          {/* Right Heavy Locking Bolt (Latches to Door Edge) */}
          <g
            ref={boltRightRef}
            style={{
              transition: 'transform 320ms cubic-bezier(0.2, 0.8, 0.25, 1)',
              transformOrigin: '220px 120px',
            }}
          >
            <rect
              x="202"
              y="108"
              width="36"
              height="24"
              rx="2"
              fill="url(#vx-bolt)"
              stroke="#8C8372"
              strokeWidth="0.8"
            />
            <line x1="228" y1="110" x2="228" y2="130" stroke="#FFFFFF" strokeWidth="1" />
          </g>

          {/* ========================================================
              OUTER BANK VAULT ESCUTCHEON & PERIMETER FLANGE
             ======================================================== */}
          {/* Heavy Armored Bezel Ring */}
          <circle
            cx="120"
            cy="120"
            r="104"
            fill="url(#vx-well)"
            stroke="#9E9482"
            strokeWidth="1.5"
          />
          <circle
            cx="120"
            cy="120"
            r="97"
            fill="none"
            stroke="url(#vx-bezel)"
            strokeWidth="10"
          />
          <circle
            cx="120"
            cy="120"
            r="91"
            fill="none"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="1"
          />
          <circle
            cx="120"
            cy="120"
            r="103"
            fill="none"
            stroke="#8E8573"
            strokeWidth="0.8"
          />

          {/* 12 Heavy Perimeter Rivet Bolts */}
          {RIVETS.map((deg) => (
            <g key={deg} transform={`rotate(${deg} 120 120)`}>
              <circle cx="120" cy="23" r="3.2" fill="#FAF8F5" stroke="#7A7263" strokeWidth="0.8" />
              <circle cx="120" cy="23" r="1.2" fill="#524C41" />
            </g>
          ))}

          {/* ========================================================
              ROTATING RATE-LIMIT COMBINATION DIAL (0 -> 500 REQ/S)
             ======================================================== */}
          <g
            ref={dialRef}
            style={{
              transformOrigin: '120px 120px',
              transition: loading
                ? 'transform 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite'
                : 'transform 380ms cubic-bezier(0.2, 0.9, 0.3, 1)',
            }}
          >
            {/* Dial Face Plate */}
            <circle
              cx="120"
              cy="120"
              r="76"
              fill="url(#vx-dial-face)"
              stroke="#A89E8C"
              strokeWidth="1.5"
            />
            <circle
              cx="120"
              cy="120"
              r="73"
              fill="none"
              stroke="rgba(255, 255, 255, 0.85)"
              strokeWidth="0.8"
            />

            {/* 60 Radial Minute / Throttle Window Marks */}
            {TICKS_60.map((t) => {
              const cardinal = t % 15 === 0;
              const major = t % 5 === 0;
              return (
                <line
                  key={t}
                  x1="120"
                  y1={cardinal ? 48 : major ? 51 : 53}
                  x2="120"
                  y2="57"
                  stroke={cardinal ? '#1C1B18' : major ? '#524C41' : '#9E9482'}
                  strokeWidth={cardinal ? '1.5' : major ? '1.0' : '0.6'}
                  transform={`rotate(${t * 6} 120 120)`}
                />
              );
            })}

            {/* Engraved Rate Limit Combination Numbers */}
            {DIAL_NUMS.map((item) => (
              <g key={item.val} transform={`rotate(${item.deg} 120 120)`}>
                <text
                  x="120"
                  y="66"
                  fill="#3A362E"
                  fontSize="7.5"
                  fontFamily="var(--font-mono)"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {item.val}
                </text>
              </g>
            ))}

            {/* 3 Heavy Vault Wheel Spokes */}
            {[0, 120, 240].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 120 120)`}>
                <rect
                  x="116"
                  y="82"
                  width="8"
                  height="26"
                  rx="1.5"
                  fill="url(#vx-bolt)"
                  stroke="#7A7263"
                  strokeWidth="0.6"
                />
              </g>
            ))}
          </g>

          {/* ========================================================
              CENTER LIMITX KEYSTONE HUB & FIXED TUMBLER POINTER
             ======================================================== */}
          {/* Top Fixed Gold Index Marker */}
          <polygon points="120,40 116,45 124,45" fill="#9E7A38" stroke="#524C41" strokeWidth="0.5" />

          {/* Heavy Center Vault Cap */}
          <circle
            cx="120"
            cy="120"
            r="26"
            fill="url(#vx-core-cap)"
            stroke="#DDD6C7"
            strokeWidth="1.5"
          />
          <circle
            cx="120"
            cy="120"
            r="23"
            fill="none"
            stroke="#524C41"
            strokeWidth="0.8"
          />

          {/* LimitX Signature Split-Cap Core Emblem */}
          <path d="M 118 106 A 14 14 0 0 0 118 134 Z" fill="#F5F2EB" />
          <path d="M 122 106 L 122 115 L 134 115 A 14 14 0 0 0 122 106 Z" fill="#C4BDAE" />
          <rect x="122" y="117.5" width="13" height="5" rx="0.5" fill="#FAF8F5" />
          <path d="M 122 125 L 122 134 A 14 14 0 0 0 134 125 Z" fill="#8A7F6E" />
        </svg>
      </div>

      {/* Dynamic Rate-Limiter Vault Telemetry Tag */}
      <div
        style={{
          marginTop: '10px',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.75)',
          border: '1px solid rgba(28, 27, 24, 0.14)',
          borderRadius: '2px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: error ? '#A83B2B' : loading ? '#9E7A38' : '#4A453A',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: error ? '#A83B2B' : loading ? '#9E7A38' : '#2D8A4E',
            display: 'inline-block',
          }}
        />
        <span>
          {error
            ? 'CIPHER REJECTED · COOLDOWN ACTIVE'
            : loading
              ? 'TUMBLER UNLATCHING...'
              : inputLength > 0
                ? `KEYWAY: ${Math.min(100, inputLength * 8)}% ALIGNED`
                : 'RATE VAULT: 5 ATTEMPTS / MIN'}
        </span>
      </div>
    </div>
  );
}
