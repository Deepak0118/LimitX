import { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Hand,
  Trash2,
  Paperclip,
} from 'lucide-react';
import PaperCrumple from './ui/PaperCrumple';

/**
 * 3D Physical Pushpin / Thumb Tack component with realistic specular lighting,
 * metallic collar, needle, and angled drop-shadow.
 */
function PushPin({ color = 'brass', style = {}, popped = false }) {
  const isRed = color === 'red';
  const headGradient = isRed
    ? 'radial-gradient(circle at 35% 28%, #FFFFFF 0%, #FF9282 20%, #D43828 55%, #8B180A 85%, #420803 100%)'
    : 'radial-gradient(circle at 35% 28%, #FFFFFF 0%, #FDE49E 20%, #D49830 55%, #8B5903 85%, #4C2E00 100%)';

  const rimGradient = isRed
    ? 'linear-gradient(180deg, #FFA89B 0%, #8B180A 100%)'
    : 'linear-gradient(180deg, #F3C978 0%, #6E3F00 100%)';

  return (
    <div
      style={{
        position: 'absolute',
        width: '20px',
        height: '24px',
        zIndex: 35,
        pointerEvents: 'none',
        transition: 'transform 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.22s ease',
        transform: popped ? 'translateY(-26px) rotate(-22deg) scale(0.65)' : 'translateY(0) rotate(0deg) scale(1)',
        opacity: popped ? 0 : 1,
        filter: 'drop-shadow(3px 6px 5px rgba(20, 14, 8, 0.38))',
        ...style,
      }}
    >
      {/* Spherical Head */}
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: headGradient,
          boxShadow: 'inset -1px -2px 3px rgba(0, 0, 0, 0.35)',
        }}
      />
      {/* Metallic Collar Ring */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '3px',
          width: '12px',
          height: '4px',
          borderRadius: '2px',
          background: rimGradient,
          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      />
      {/* Needle Point Tip */}
      <div
        style={{
          position: 'absolute',
          top: '17px',
          left: '8px',
          width: '2px',
          height: '5px',
          background: 'linear-gradient(180deg, #B0B0B0 0%, #505050 100%)',
          borderRadius: '1px',
        }}
      />
    </div>
  );
}

/**
 * Generates an authentic, crisp 2x resolution canvas image of the
 * "Without LimitX" (Legacy Unprotected Architecture) document.
 */
function createWithoutLimitXDocumentTexture() {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 680;
  canvas.height = 880;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background: Warm Ivory paper
  ctx.fillStyle = '#FAF7F0';
  ctx.fillRect(0, 0, 680, 880);

  // Subtle border
  ctx.strokeStyle = '#DCD7CD';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 648, 848);

  // Inner margin line
  ctx.strokeStyle = 'rgba(198, 72, 53, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(32, 32, 616, 816);

  // Puncture pin holes in top corners with paper dimple shadow
  // Top-left pin hole
  ctx.fillStyle = 'rgba(60, 40, 20, 0.55)';
  ctx.beginPath();
  ctx.arc(48, 48, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Top-right pin hole
  ctx.beginPath();
  ctx.arc(632, 48, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Header tag pill
  ctx.fillStyle = '#F9ECEA';
  ctx.fillRect(48, 62, 260, 32);
  ctx.strokeStyle = '#E8C4BE';
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 62, 260, 32);

  ctx.fillStyle = '#C64835';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('WITHOUT LIMITX · UNGUARDED', 62, 84);

  // Big Title
  ctx.fillStyle = '#1C1B18';
  ctx.font = '600 30px sans-serif';
  ctx.fillText('Direct Origin Exposure', 48, 142);

  ctx.fillStyle = '#5F5C55';
  ctx.font = '15px sans-serif';
  ctx.fillText('Every incoming request hits your backend directly.', 48, 175);
  ctx.fillText('Unbuffered spikes reach database threads without filtering.', 48, 200);

  // Divider line
  ctx.strokeStyle = '#EAE6DD';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(48, 230);
  ctx.lineTo(632, 230);
  ctx.stroke();

  // 4 Fact Rows
  const items = [
    { title: 'DIRECT ROUTING', desc: 'No edge gateway. Origin IP & ports remain directly reachable.' },
    { title: 'UNBUFFERED COMPUTE', desc: 'Concurrent traffic surges hit application process threads unconstrained.' },
    { title: 'NO RATE TELEMETRY', desc: 'Clients receive no standard X-RateLimit headers or reset windows.' },
    { title: 'MANUAL ENDPOINT CODE', desc: 'Rate-limiting must be hand-coded into every route and service.' },
  ];

  let y = 270;
  items.forEach((item) => {
    // Red X icon circle
    ctx.fillStyle = '#F9ECEA';
    ctx.beginPath();
    ctx.arc(64, y + 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#E8C4BE';
    ctx.stroke();

    ctx.fillStyle = '#C64835';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('✕', 59, y + 15);

    ctx.fillStyle = '#1C1B18';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(item.title, 90, y + 14);

    ctx.fillStyle = '#6E6B64';
    ctx.font = '13.5px sans-serif';
    ctx.fillText(item.desc, 90, y + 36);

    y += 76;
  });

  // Wire trace box at bottom
  ctx.fillStyle = '#F5F2EB';
  ctx.fillRect(48, 600, 584, 120);
  ctx.strokeStyle = '#DCD7CD';
  ctx.strokeRect(48, 600, 584, 120);

  ctx.fillStyle = '#7A756D';
  ctx.font = '12px monospace';
  ctx.fillText('RAW DIRECT WIRE (NO RATE HEADERS RETURNED)', 64, 626);

  ctx.fillStyle = '#1C1B18';
  ctx.font = '13.5px monospace';
  ctx.fillText('HTTP/1.1 200 OK', 64, 654);
  ctx.fillText('Content-Type: application/json', 64, 678);
  ctx.fillStyle = '#C64835';
  ctx.fillText('// Origin processed request directly with zero rate protection', 64, 702);

  // Red Rubber Stamp in corner
  ctx.save();
  ctx.translate(470, 770);
  ctx.rotate((-12 * Math.PI) / 180);
  ctx.strokeStyle = '#C64835';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-135, -24, 270, 48);

  ctx.fillStyle = '#C64835';
  ctx.font = 'bold 17px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DEPRECATED ARCHITECTURE', 0, 7);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

export default function BeforeAfterStage() {
  const paperRef = useRef(null);
  const [textureUrl, setTextureUrl] = useState('');
  const [isCrumpled, setIsCrumpled] = useState(false);
  const [isDiscarded, setIsDiscarded] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const url = createWithoutLimitXDocumentTexture();
    setTextureUrl(url);
  }, []);

  // Action: Crumple and Toss off the meeting board
  const handleCrumpleAndThrow = () => {
    if (!paperRef.current) return;
    setIsCrumpled(true);
    paperRef.current.toss(380, -260);
  };

  // Called when the paper ball finishes crumpling & leaves the board
  const handleDiscard = () => {
    setIsDiscarded(true);
  };

  // Action: Re-attach the legacy paper back to the board
  const handleReset = () => {
    setIsDiscarded(false);
    setIsCrumpled(false);
    setResetKey((k) => k + 1);
    if (paperRef.current) {
      paperRef.current.reset();
    }
  };

  // State change from direct user drag
  const handleStateChange = (state) => {
    if (state === 'crumpled' || state === 'holding') {
      setIsCrumpled(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* StudioBoard Custom Physical Whiteboard & Notice Styles */}
      <style>{`
        /* Realistic Brushed Champagne Metallic Aluminum Frame */
        .studioboard-frame {
          background: linear-gradient(135deg, #FAF8F5 0%, #EAE6DD 25%, #C8C2B5 50%, #FAF8F5 75%, #D4CEBF 100%);
          padding: 10px;
          border-radius: 16px;
          box-shadow: 
            0 25px 50px -12px rgba(28, 27, 24, 0.24),
            0 4px 12px rgba(28, 27, 24, 0.1),
            inset 0 1px 1px rgba(255, 255, 255, 0.95),
            inset 0 -2px 4px rgba(28, 27, 24, 0.18);
          position: relative;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 768px) {
          .studioboard-frame {
            padding: 12px;
            border-radius: 20px;
          }
        }

        /* Metallic Corner Bumpers */
        .corner-cap {
          position: absolute;
          width: 22px;
          height: 22px;
          background: linear-gradient(135deg, #3D352B, #1C1B18);
          z-index: 25;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.35);
        }
        .corner-tl { top: 0; left: 0; border-top-left-radius: 16px; border-bottom-right-radius: 8px; }
        .corner-tr { top: 0; right: 0; border-top-right-radius: 16px; border-bottom-left-radius: 8px; }
        .corner-bl { bottom: 0; left: 0; border-bottom-left-radius: 16px; border-top-right-radius: 8px; }
        .corner-br { bottom: 0; right: 0; border-bottom-right-radius: 16px; border-top-left-radius: 8px; }

        /* Ceramic Limestone Whiteboard Surface */
        .studioboard-surface {
          background-color: #FAF8F5;
          background-image: 
            radial-gradient(at 20% 20%, rgba(255, 255, 255, 0.95) 0px, transparent 60%),
            radial-gradient(at 80% 80%, rgba(240, 235, 225, 0.65) 0px, transparent 60%),
            linear-gradient(to right, rgba(140, 130, 115, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(140, 130, 115, 0.12) 1px, transparent 1px);
          background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
          box-shadow: 
            inset 0 2px 8px rgba(28, 27, 24, 0.12),
            inset 0 0 1px rgba(28, 27, 24, 0.25);
          border-radius: 8px;
          position: relative;
          overflow: hidden;
          min-height: 580px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          padding: 24px 16px;
        }

        /* Bottom Metallic Marker Tray */
        .studioboard-tray {
          background: linear-gradient(180deg, #FAF8F5 0%, #EAE6DD 40%, #C8C2B5 85%, #9E9685 100%);
          box-shadow: 
            0 10px 18px -4px rgba(28, 27, 24, 0.25),
            inset 0 2px 2px rgba(255, 255, 255, 0.85),
            inset 0 -2px 4px rgba(28, 27, 24, 0.2);
          border-bottom-left-radius: 14px;
          border-bottom-right-radius: 14px;
        }

        /* Tray Marker Hover */
        .tray-marker {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .tray-marker:hover {
          transform: translateY(-3px);
        }

        /* Classic Sticky Note Curl Style */
        .sticky-style {
          border-radius: 2px 2px 14px 2px;
          box-shadow: 
            0 6px 14px -2px rgba(28, 27, 24, 0.14),
            0 2px 4px -1px rgba(28, 27, 24, 0.08),
            inset 0 -18px 24px -16px rgba(0, 0, 0, 0.06);
          position: relative;
        }
        .sticky-style::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          width: 22px;
          height: 22px;
          background: linear-gradient(135deg, transparent 48%, rgba(0,0,0,0.06) 50%, rgba(255,255,255,0.45) 100%);
          border-bottom-right-radius: 12px;
          pointer-events: none;
        }

        /* Formal Pinned Notice Paper Style */
        .formal-style {
          border-radius: 6px;
          border: 1px solid rgba(140, 130, 115, 0.35);
          box-shadow: 
            0 10px 22px -5px rgba(28, 27, 24, 0.14),
            0 4px 8px -2px rgba(28, 27, 24, 0.08);
          position: relative;
        }

        @keyframes blueprintAppearOnBoard {
          0% {
            opacity: 0;
            transform: scale(0.96) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @media (min-width: 980px) {
          .pinboard-sticky-note-left,
          .pinboard-sticky-note-right {
            display: flex !important;
          }
        }
      `}</style>

      {/* =====================================================================
          STUDIOBOARD WHITEBOARD ASSEMBLY (METALLIC BEZEL + CORNER BUMPERS)
          ===================================================================== */}
      <div className="studioboard-frame w-full">
        {/* Metallic Corner Protective Caps */}
        <div className="corner-cap corner-tl" />
        <div className="corner-cap corner-tr" />
        <div className="corner-cap corner-bl" />
        <div className="corner-cap corner-br" />

        {/* Ceramic Limestone Whiteboard Surface with 32px Alignment Grid */}
        <div className="studioboard-surface w-full">
          {/* Top Board Navigation Bar */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '16px',
              right: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 20,
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            {/* Board Title Tag */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #DCD7CD',
                boxShadow: '0 2px 6px rgba(28, 27, 24, 0.06)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isDiscarded ? '#2D8A4E' : '#C64835',
                  letterSpacing: '0.04em',
                }}
              >
                {isDiscarded ? '● SPECIFICATION APPROVED' : '● STUDIOBOARD REVIEW: UNGUARDED'}
              </span>
              <span style={{ fontSize: '11px', color: '#7A756D', fontFamily: 'var(--font-mono)' }}>
                | ARCH-01
              </span>
            </div>

            {/* Top Magnet / Clamp Holder at Center */}
            <div
              style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '108px',
                height: '24px',
                background: 'linear-gradient(180deg, #F3C978 0%, #C68A2C 50%, #995B00 100%)',
                borderRadius: '3px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 25,
                border: '1px solid #7F4900',
              }}
            >
              <div style={{ width: '84px', height: '2px', background: 'rgba(255, 255, 255, 0.6)' }} />
              <div style={{ position: 'absolute', bottom: '3px', width: '70px', height: '1.5px', background: 'rgba(0, 0, 0, 0.3)' }} />
            </div>

            {/* Action Button */}
            <div>
              {!isDiscarded ? (
                <button
                  type="button"
                  onClick={handleCrumpleAndThrow}
                  style={{
                    padding: '8px 16px',
                    background: '#1C1B18',
                    color: '#FAF8F5',
                    border: '1px solid #C68A2C',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    boxShadow: '0 4px 12px rgba(28, 27, 24, 0.2)',
                    transition: 'all 160ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#C68A2C';
                    e.currentTarget.style.color = '#1C1B18';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1C1B18';
                    e.currentTarget.style.color = '#FAF8F5';
                  }}
                >
                  <Trash2 size={13} />
                  <span>Unpin &amp; Crumple Sheet ↗</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    padding: '8px 16px',
                    background: '#FAF8F5',
                    color: '#1C1B18',
                    border: '1px solid #C68A2C',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    transition: 'all 160ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#EAE6DD')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#FAF8F5')}
                >
                  <RotateCcw size={13} color="#C68A2C" />
                  <span>Re-Pin Legacy Architecture</span>
                </button>
              )}
            </div>
          </div>

          {/* Left Sticky Note: Audit Finding (Classic Sticky Style with Curl & Red Pushpin) */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '20px',
              maxWidth: '220px',
              background: 'linear-gradient(165deg, #FEF9C3 0%, #FEF08A 100%)',
              color: '#422006',
              padding: '12px 14px',
              transform: 'rotate(-2.5deg)',
              zIndex: 15,
              pointerEvents: 'none',
              display: 'none',
              flexDirection: 'column',
            }}
            className="sticky-style pinboard-sticky-note-left"
          >
            {/* Red Physical 3D PushPin */}
            <PushPin
              color="red"
              style={{
                top: '-10px',
                left: 'calc(50% - 10px)',
              }}
            />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: '#C64835', marginBottom: '4px' }}>
              📌 AUDIT FINDING #04
            </div>
            <div style={{ fontSize: '11px', lineHeight: 1.45 }}>
              Direct origin exposure causes process thread exhaustion under traffic surges. Discard &amp; route via LimitX proxy perimeter.
            </div>
          </div>

          {/* Right Formal Notice: Topology Decision (Formal Notice Paper Style with Brass Pushpin) */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              right: '20px',
              maxWidth: '220px',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF8F5 100%)',
              color: '#1C1B18',
              padding: '12px 14px',
              transform: 'rotate(2.5deg)',
              zIndex: 15,
              pointerEvents: 'none',
              display: 'none',
              flexDirection: 'column',
            }}
            className="formal-style pinboard-sticky-note-right"
          >
            {/* Brass Physical 3D PushPin */}
            <PushPin
              color="brass"
              style={{
                top: '-10px',
                left: 'calc(50% - 10px)',
              }}
            />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: '#C68A2C', marginBottom: '4px' }}>
              📋 TOPOLOGY DECISION
            </div>
            <div style={{ fontSize: '11px', color: '#5F5C55', lineHeight: 1.45 }}>
              Standardize on Token Bucket &amp; Sliding Log policies. Inject standard RFC X-RateLimit headers at perimeter gateway.
            </div>
          </div>

          {/* ===================================================================
              STAGE 1: THE LEGACY "WITHOUT LIMITX" PAPER ON THE BOARD
              =================================================================== */}
          {!isDiscarded ? (
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                marginTop: '28px',
              }}
            >
              {/* Floating instruction hint under header */}
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#4A4843',
                  marginBottom: '10px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '5px 14px',
                  borderRadius: '16px',
                  border: '1px solid #C68A2C',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                }}
              >
                {!isCrumpled ? (
                  <span>
                    🤏 <strong>Grab or pull</strong> this sheet to crumple it off the board!
                  </span>
                ) : (
                  <span style={{ color: '#C64835', fontWeight: 600 }}>
                    Crumpled! Discarding legacy topology off the board...
                  </span>
                )}
              </div>

              {/* 3D Paper Crumple Canvas Area with Physical PushPins */}
              {textureUrl && (
                <div style={{ position: 'relative', width: '100%', maxWidth: '640px', display: 'flex', justifyContent: 'center' }}>
                  {/* Left Physical PushPin pinning the top-left of the paper */}
                  <PushPin
                    color="brass"
                    popped={isCrumpled}
                    style={{
                      top: '38px',
                      left: 'calc(50% - 168px)',
                    }}
                  />

                  {/* Right Physical PushPin pinning the top-right of the paper */}
                  <PushPin
                    color="brass"
                    popped={isCrumpled}
                    style={{
                      top: '38px',
                      left: 'calc(50% + 150px)',
                    }}
                  />

                  <PaperCrumple
                    ref={paperRef}
                    src={textureUrl}
                    alt="Without LimitX Architecture Sheet"
                    width={380}
                    height={480}
                    sceneHeight={530}
                    paperColor="#FAF7F0"
                    releaseBehavior="stay"
                    crumpleAmount={0.88}
                    crumpleDuration={0.5}
                    releaseDuration={0.35}
                    draggable={true}
                    dragRadius={800}
                    returnToOrigin={false}
                    dragRotation={25}
                    resetKey={resetKey}
                    onStateChange={handleStateChange}
                    onDiscard={handleDiscard}
                  />
                </div>
              )}
            </div>
          ) : (
            /* ===================================================================
                STAGE 2: "WITH LIMITX" ARCHITECTURAL BLUEPRINT PINNED TO BOARD!
                =================================================================== */
            <div
              style={{
                width: '100%',
                maxWidth: '760px',
                marginTop: '32px',
                background: '#FAF8F5',
                border: '1px solid #DCD7CD',
                borderRadius: '6px',
                padding: '28px 28px',
                boxShadow: '0 10px 32px rgba(28, 27, 24, 0.12), 0 0 0 1px rgba(198, 138, 44, 0.45)',
                animation: 'blueprintAppearOnBoard 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                position: 'relative',
              }}
            >
              {/* Top-Left PushPin on With LimitX paper */}
              <PushPin
                color="brass"
                popped={false}
                style={{
                  top: '12px',
                  left: '12px',
                }}
              />

              {/* Top-Right PushPin on With LimitX paper */}
              <PushPin
                color="brass"
                popped={false}
                style={{
                  top: '12px',
                  right: '12px',
                }}
              />

              {/* Paper Top Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '24px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#2D8A4E',
                      background: '#E8F5E9',
                      border: '1px solid #CBE8D5',
                      padding: '3px 8px',
                      borderRadius: '2px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ShieldCheck size={12} />
                    <span>PRODUCTION SPEC · APPROVED &amp; CERTIFIED</span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#C68A2C', fontWeight: 600 }}>
                    REVERSE PROXY PERIMETER
                  </span>
                </div>

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#2D8A4E', fontWeight: 600, paddingRight: '24px' }}>
                  ● 100% SHIELDED
                </span>
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 600, color: '#1C1B18', letterSpacing: '-0.02em' }}>
                  Shielded Reverse Proxy Architecture
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#5F5C55', lineHeight: 1.55 }}>
                  The legacy unbuffered route has been replaced. Your origin now sits safely behind LimitX: incoming traffic is evaluated against your rate rules (Token Bucket, Fixed Window, Sliding Log) at the edge before ever reaching backend threads.
                </p>
              </div>

              {/* 4 Pillars of LimitX */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    background: '#F5F2EB',
                    border: '1px solid #DCD7CD',
                    borderRadius: '4px',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Check size={13} color="#2D8A4E" strokeWidth={2.5} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#7A756D', fontWeight: 600 }}>
                      EDGE PERIMETER
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1C1B18' }}>
                    Protected Origin Host
                  </div>
                  <div style={{ fontSize: '12px', color: '#6E6B64', marginTop: '2px', lineHeight: 1.45 }}>
                    Traffic routes through the reverse proxy. Origin IP and ports remain completely hidden.
                  </div>
                </div>

                <div
                  style={{
                    background: '#F5F2EB',
                    border: '1px solid #DCD7CD',
                    borderRadius: '4px',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Check size={13} color="#2D8A4E" strokeWidth={2.5} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#7A756D', fontWeight: 600 }}>
                      BURST BUFFERING
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1C1B18' }}>
                    Algorithmic Throttling
                  </div>
                  <div style={{ fontSize: '12px', color: '#6E6B64', marginTop: '2px', lineHeight: 1.45 }}>
                    Token Bucket, Fixed Window, and Sliding Log smoothly absorb spikes at the edge.
                  </div>
                </div>

                <div
                  style={{
                    background: '#F5F2EB',
                    border: '1px solid #DCD7CD',
                    borderRadius: '4px',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Check size={13} color="#2D8A4E" strokeWidth={2.5} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#7A756D', fontWeight: 600 }}>
                      CLIENT TELEMETRY
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1C1B18' }}>
                    Standard Rate Headers
                  </div>
                  <div style={{ fontSize: '12px', color: '#6E6B64', marginTop: '2px', lineHeight: 1.45 }}>
                    Injects standard <code style={{ fontFamily: 'var(--font-mono)', color: '#C68A2C' }}>X-RateLimit-Limit</code>, <code style={{ fontFamily: 'var(--font-mono)', color: '#C68A2C' }}>Remaining</code>, and <code style={{ fontFamily: 'var(--font-mono)', color: '#C68A2C' }}>Reset</code>.
                  </div>
                </div>

                <div
                  style={{
                    background: '#F5F2EB',
                    border: '1px solid #DCD7CD',
                    borderRadius: '4px',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Check size={13} color="#2D8A4E" strokeWidth={2.5} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#7A756D', fontWeight: 600 }}>
                      DEPLOYMENT
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1C1B18' }}>
                    Zero Code Changes
                  </div>
                  <div style={{ fontSize: '12px', color: '#6E6B64', marginTop: '2px', lineHeight: 1.45 }}>
                    Deploy in 60s by replacing your client base URL. Zero code refactoring required.
                  </div>
                </div>
              </div>

              {/* Wire Response Snippet */}
              <div
                style={{
                  background: '#F5F2EB',
                  border: '1px solid #DCD7CD',
                  borderRadius: '4px',
                  padding: '12px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7A756D', fontSize: '10.5px', marginBottom: '6px' }}>
                  <span>LIMITX PROXIED RESPONSE WIRE</span>
                  <span style={{ color: '#2D8A4E', fontWeight: 600 }}>RATE TELEMETRY ACTIVE</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', color: '#1C1B18' }}>
                  <div><span style={{ color: '#7A756D' }}>HTTP/1.1</span> 200 OK (or 429 Too Many Requests)</div>
                  <div><span style={{ color: '#C68A2C' }}>X-RateLimit-Limit:</span> 60</div>
                  <div><span style={{ color: '#C68A2C' }}>X-RateLimit-Remaining:</span> 48</div>
                  <div><span style={{ color: '#C68A2C' }}>X-RateLimit-Reset:</span> 1718902800</div>
                  <div style={{ color: '#2D8A4E', marginTop: '2px' }}>// Evaluated at proxy gateway before passing to origin</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          PHYSICAL ALUMINUM MARKER TRAY AT BOTTOM (MATCHING REFERENCE EXACTLY)
          ===================================================================== */}
      <div
        className="studioboard-tray"
        style={{
          margin: '-4px auto 0',
          width: '85%',
          maxWidth: '720px',
          height: '46px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        {/* Dry-Erase Markers Resting in Tray */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Black Marker */}
          <div
            className="tray-marker"
            title="Black Dry-Erase Marker"
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '24px',
              width: '64px',
              borderRadius: '9999px',
              background: '#FAF8F5',
              boxShadow: '0 2px 4px rgba(28, 27, 24, 0.15)',
              border: '1px solid #DCD7CD',
              overflow: 'hidden',
              cursor: 'default',
            }}
          >
            <span style={{ width: '16px', height: '100%', background: '#1C1B18', display: 'block' }} />
            <span style={{ flex: 1, fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', color: '#1C1B18', textAlign: 'center', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>DRY</span>
            <span style={{ width: '6px', height: '100%', background: '#1C1B18', display: 'block' }} />
          </div>

          {/* Amber Gold Marker */}
          <div
            className="tray-marker"
            title="Amber Gold Dry-Erase Marker"
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '24px',
              width: '64px',
              borderRadius: '9999px',
              background: '#FAF8F5',
              boxShadow: '0 2px 4px rgba(28, 27, 24, 0.15)',
              border: '1px solid #DCD7CD',
              overflow: 'hidden',
              cursor: 'default',
            }}
          >
            <span style={{ width: '16px', height: '100%', background: '#C68A2C', display: 'block' }} />
            <span style={{ flex: 1, fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', color: '#C68A2C', textAlign: 'center', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>DRY</span>
            <span style={{ width: '6px', height: '100%', background: '#C68A2C', display: 'block' }} />
          </div>

          {/* Crimson Red Marker */}
          <div
            className="tray-marker"
            title="Crimson Dry-Erase Marker"
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '24px',
              width: '64px',
              borderRadius: '9999px',
              background: '#FAF8F5',
              boxShadow: '0 2px 4px rgba(28, 27, 24, 0.15)',
              border: '1px solid #DCD7CD',
              overflow: 'hidden',
              cursor: 'default',
            }}
          >
            <span style={{ width: '16px', height: '100%', background: '#C64835', display: 'block' }} />
            <span style={{ flex: 1, fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', color: '#C64835', textAlign: 'center', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>DRY</span>
            <span style={{ width: '6px', height: '100%', background: '#C64835', display: 'block' }} />
          </div>

          {/* Emerald Green Marker */}
          <div
            className="tray-marker"
            title="Emerald Dry-Erase Marker"
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '24px',
              width: '64px',
              borderRadius: '9999px',
              background: '#FAF8F5',
              boxShadow: '0 2px 4px rgba(28, 27, 24, 0.15)',
              border: '1px solid #DCD7CD',
              overflow: 'hidden',
              cursor: 'default',
            }}
          >
            <span style={{ width: '16px', height: '100%', background: '#2D8A4E', display: 'block' }} />
            <span style={{ flex: 1, fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', color: '#2D8A4E', textAlign: 'center', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>DRY</span>
            <span style={{ width: '6px', height: '100%', background: '#2D8A4E', display: 'block' }} />
          </div>
        </div>

        {/* Physical Felt Whiteboard Eraser in Tray */}
        <div
          className="tray-marker"
          title="Felt Whiteboard Eraser"
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '68px',
            height: '26px',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(28, 27, 24, 0.2)',
            border: '1px solid #5F5C55',
            cursor: 'default',
          }}
        >
          <div
            style={{
              height: '14px',
              background: 'linear-gradient(90deg, #2C261F 0%, #3D352B 50%, #2C261F 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '7.5px', letterSpacing: '0.12em', color: '#FAF8F5', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              ERASER
            </span>
          </div>
          <div style={{ flex: 1, background: '#DCD7CD', borderTop: '1px solid #B8B0A0' }} />
        </div>
      </div>

      {/* 3 Outcome Verification Pills */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px',
          marginTop: '8px',
        }}
      >
        <div
          style={{
            background: '#FAF8F5',
            border: '1px solid #DCD7CD',
            borderRadius: '2px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C68A2C', flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: '#4A4843', lineHeight: 1.45 }}>
            <strong style={{ color: '#1C1B18' }}>1-URL Configuration:</strong> Proxies requests to your origin without importing SDKs or rewriting endpoints.
          </div>
        </div>

        <div
          style={{
            background: '#FAF8F5',
            border: '1px solid #DCD7CD',
            borderRadius: '2px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C68A2C', flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: '#4A4843', lineHeight: 1.45 }}>
            <strong style={{ color: '#1C1B18' }}>Standard IETF Headers:</strong> Returns <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>X-RateLimit-*</code> and <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>Retry-After</code> on every request.
          </div>
        </div>

        <div
          style={{
            background: '#FAF8F5',
            border: '1px solid #DCD7CD',
            borderRadius: '2px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C68A2C', flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: '#4A4843', lineHeight: 1.45 }}>
            <strong style={{ color: '#1C1B18' }}>Autonomous Throttling:</strong> Blocks traffic floods at proxy layer before touching origin threads or databases.
          </div>
        </div>
      </div>
    </div>
  );
}
