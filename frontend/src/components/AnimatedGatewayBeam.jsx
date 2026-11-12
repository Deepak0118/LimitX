import { useState } from 'react';

const NODES = [
  {
    id: 'clients',
    y: 36,
    cy: 64,
    title: 'Web & Mobile',
    sub: 'Standard client requests',
    status: 'Routed',
  },
  {
    id: 'keys',
    y: 152,
    cy: 180,
    title: 'API Consumers',
    sub: 'Per-route & key quotas',
    status: 'Metered',
  },
  {
    id: 'abuse',
    y: 268,
    cy: 296,
    title: 'Spikes & Abuse',
    sub: 'Stopped before origin',
    status: 'Blocked',
  },
];

export default function AnimatedGatewayBeam() {
  const [hovered, setHovered] = useState(null);

  return (
    <div
      style={{
        background: '#EFECE4',
        border: '1px solid #DCD7CD',
        borderRadius: '4px',
        padding: '12px',
        boxShadow: '0 22px 46px -28px rgba(28, 27, 24, 0.14)',
      }}
    >
      <div
        style={{
          background: '#F8F6F1',
          backgroundImage: 'radial-gradient(#DCD7CD 1px, transparent 1px)',
          backgroundSize: '18px 18px',
          border: '1px solid #E5E1D8',
          borderRadius: '2px',
          padding: '10px',
        }}
      >
        <svg
          viewBox="0 0 560 360"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label="Monochrome diagram showing client and consumer streams metered through LimitX to keep backend traffic steady"
        >
          <defs>
            <filter id="lx-card-shadow" x="-15%" y="-15%" width="130%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1C1B18" floodOpacity="0.06" />
            </filter>

            <linearGradient id="lx-ink-beam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1C1B18" stopOpacity="0" />
              <stop offset="55%" stopColor="#1C1B18" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#5F5C55" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="lx-stone-beam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C776E" stopOpacity="0" />
              <stop offset="55%" stopColor="#4A4843" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#8C887F" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="lx-spark-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1C1B18" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#1C1B18" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Base Hairline Tracks */}
          <path
            d="M 168 64 C 222 64, 218 180, 254 180"
            fill="none"
            stroke={hovered === 'clients' ? '#1C1B18' : '#DCD7CD'}
            strokeWidth={hovered === 'clients' ? '1.75' : '1.4'}
          />
          <path
            d="M 168 180 L 254 180"
            fill="none"
            stroke={hovered === 'keys' ? '#1C1B18' : '#DCD7CD'}
            strokeWidth={hovered === 'keys' ? '1.75' : '1.4'}
          />
          <path
            d="M 168 296 C 216 296, 216 218, 238 202"
            fill="none"
            stroke={hovered === 'abuse' ? '#4A4843' : '#C9C3B7'}
            strokeWidth="1.4"
            strokeDasharray="4 4"
          />
          <path d="M 326 180 L 392 180" fill="none" stroke="#C9C3B7" strokeWidth="1.75" />

          {/* Animated Monochrome Beams */}
          <path
            d="M 168 64 C 222 64, 218 180, 254 180"
            fill="none"
            stroke="url(#lx-ink-beam)"
            strokeWidth="2.4"
            strokeLinecap="round"
            className="lx-beam-flow"
          />
          <path
            d="M 168 180 L 254 180"
            fill="none"
            stroke="url(#lx-ink-beam)"
            strokeWidth="2.4"
            strokeLinecap="round"
            className="lx-beam-flow lx-beam-delay-1"
          />
          <path
            d="M 168 296 C 216 296, 216 218, 238 202"
            fill="none"
            stroke="url(#lx-stone-beam)"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="lx-beam-flow lx-beam-delay-2"
          />
          <path
            d="M 326 180 L 392 180"
            fill="none"
            stroke="url(#lx-ink-beam)"
            strokeWidth="2.8"
            strokeLinecap="round"
            className="lx-beam-flow lx-beam-fast"
          />

          {/* Edge Cutoff Gate Marker (Abuse Stopped Before Hub) */}
          <rect
            x="233"
            y="197"
            width="10"
            height="10"
            rx="1"
            fill="#EBE7DE"
            stroke="#1C1B18"
            strokeWidth="1.4"
          />

          {/* Left Traffic Source Cards */}
          {NODES.map((node) => {
            const isHovered = hovered === node.id;
            const isBlocked = node.id === 'abuse';
            return (
              <g
                key={node.id}
                filter="url(#lx-card-shadow)"
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'default' }}
              >
                <rect
                  x="16"
                  y={node.y}
                  width="152"
                  height="56"
                  rx="3"
                  fill={isBlocked ? '#F4F1EA' : '#FBF9F5'}
                  stroke={isHovered ? '#1C1B18' : isBlocked ? '#C9C3B7' : '#DCD7CD'}
                  strokeDasharray={isBlocked ? '3 3' : undefined}
                />
                <circle
                  cx="32"
                  cy={node.y + 21}
                  r="3.2"
                  fill={isBlocked ? 'none' : '#1C1B18'}
                  stroke="#1C1B18"
                  strokeWidth={isBlocked ? '1.3' : '0'}
                />
                <text
                  x="43"
                  y={node.y + 25}
                  fontSize="12.5"
                  fontFamily="Archivo, sans-serif"
                  fontWeight="500"
                  fill="#1C1B18"
                >
                  {node.title}
                </text>
                <text
                  x="29"
                  y={node.y + 43}
                  fontSize="10.8"
                  fontFamily="Archivo, sans-serif"
                  fill="#5F5C55"
                >
                  {node.sub}
                </text>
              </g>
            );
          })}

          {/* Center LimitX Hub + Architectural Compass Ring */}
          <circle cx="290" cy="180" r="54" fill="none" stroke="#DCD7CD" strokeDasharray="3 5" />
          <g filter="url(#lx-card-shadow)">
            <rect
              x="254"
              y="144"
              width="72"
              height="72"
              rx="8"
              fill="#FBF9F5"
              stroke="#1C1B18"
              strokeWidth="1.4"
            />
            <rect x="272" y="160" width="36" height="6.2" rx="1" fill="#1C1B18" />
            <rect x="272" y="171.6" width="21" height="6.2" rx="1" fill="#1C1B18" />
            <rect x="297.6" y="171.6" width="10.4" height="6.2" rx="1" fill="#8C887F" />
            <rect x="272" y="183.2" width="28" height="6.2" rx="1" fill="#1C1B18" />
            <text
              x="290"
              y="206"
              textAnchor="middle"
              fontSize="9.5"
              fontFamily="IBM Plex Mono, monospace"
              fontWeight="500"
              letterSpacing="0.06em"
              fill="#1C1B18"
            >
              LIMITX
            </text>
          </g>

          {/* Right Protected Origin Card */}
          <g filter="url(#lx-card-shadow)">
            <rect x="392" y="106" width="152" height="148" rx="4" fill="#FBF9F5" stroke="#DCD7CD" />
            <text
              x="410"
              y="132"
              fontSize="13.5"
              fontFamily="Archivo, sans-serif"
              fontWeight="500"
              fill="#1C1B18"
            >
              Your Backend
            </text>

            <rect x="410" y="143" width="76" height="20" rx="2" fill="#EBE7DE" stroke="#DCD7CD" />
            <circle cx="421" cy="153" r="2.8" fill="#1C1B18" />
            <text
              x="429"
              y="156.5"
              fontSize="10.5"
              fontFamily="IBM Plex Mono, monospace"
              fontWeight="500"
              fill="#1C1B18"
            >
              200 OK
            </text>

            {/* Monochrome Origin Stability Area Chart */}
            <path
              d="M 410 226 L 410 202 C 424 198, 434 206, 448 197 C 462 188, 474 195, 488 189 C 502 184, 514 190, 526 184 L 526 226 Z"
              fill="url(#lx-spark-fill)"
            />
            <path
              d="M 410 202 C 424 198, 434 206, 448 197 C 462 188, 474 195, 488 189 C 502 184, 514 190, 526 184"
              fill="none"
              stroke="#1C1B18"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <line x1="410" y1="226" x2="526" y2="226" stroke="#E5E1D8" strokeWidth="1" />

            <text
              x="410"
              y="241"
              fontSize="10.5"
              fontFamily="Archivo, sans-serif"
              fill="#5F5C55"
            >
              Origin load · Steady
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
