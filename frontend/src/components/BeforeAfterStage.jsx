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

  // Header tag pill
  ctx.fillStyle = '#F9ECEA';
  ctx.fillRect(48, 56, 260, 32);
  ctx.strokeStyle = '#E8C4BE';
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 56, 260, 32);

  ctx.fillStyle = '#C64835';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('WITHOUT LIMITX · UNGUARDED', 62, 78);

  // Big Title
  ctx.fillStyle = '#1C1B18';
  ctx.font = '600 30px sans-serif';
  ctx.fillText('Direct Origin Exposure', 48, 140);

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
    paperRef.current.toss(360, -250);
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
      {/* Keyframe animation for With LimitX rising onto the board */}
      <style>{`
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
        @media (min-width: 960px) {
          .pinboard-sticky-note {
            display: block !important;
          }
        }
      `}</style>

      {/* =====================================================================
          ARCHITECTURAL WAR-ROOM MEETING BOARD (PHYSICAL PINBOARD CONTAINER)
          ===================================================================== */}
      <div
        style={{
          position: 'relative',
          minHeight: '640px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #2E2822 0%, #1F1B16 50%, #2A241E 100%)',
          border: '1px solid #C68A2C',
          boxShadow: '0 24px 64px -12px rgba(28, 27, 24, 0.32), 0 8px 24px -4px rgba(28, 27, 24, 0.2)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Solid Brass L-Corner Brackets in all 4 Corners */}
        {/* Top-Left Bracket */}
        <div
          style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            width: '24px',
            height: '24px',
            borderTop: '3px solid #C68A2C',
            borderLeft: '3px solid #C68A2C',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#F3C978', boxShadow: '0 0 2px rgba(0,0,0,0.5)' }} />
        </div>
        {/* Top-Right Bracket */}
        <div
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '24px',
            height: '24px',
            borderTop: '3px solid #C68A2C',
            borderRight: '3px solid #C68A2C',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#F3C978', boxShadow: '0 0 2px rgba(0,0,0,0.5)' }} />
        </div>
        {/* Bottom-Left Bracket */}
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            left: '6px',
            width: '24px',
            height: '24px',
            borderBottom: '3px solid #C68A2C',
            borderLeft: '3px solid #C68A2C',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#F3C978', boxShadow: '0 0 2px rgba(0,0,0,0.5)' }} />
        </div>
        {/* Bottom-Right Bracket */}
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            right: '6px',
            width: '24px',
            height: '24px',
            borderBottom: '3px solid #C68A2C',
            borderRight: '3px solid #C68A2C',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#F3C978', boxShadow: '0 0 2px rgba(0,0,0,0.5)' }} />
        </div>

        {/* Board Surface (Tactile Warm Limestone Cork / Felt Pinboard) */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            borderRadius: '4px',
            background: '#DDD5C5',
            backgroundImage: `
              radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.25) 0%, transparent 75%),
              radial-gradient(rgba(198, 138, 44, 0.2) 1.2px, transparent 1.2px),
              linear-gradient(90deg, rgba(28, 27, 24, 0.03) 1px, transparent 1px),
              linear-gradient(rgba(28, 27, 24, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 20px 20px, 20px 20px, 20px 20px',
            border: '2px solid #BCB3A2',
            boxShadow: 'inset 0 4px 18px rgba(28, 27, 24, 0.16), inset 0 1px 3px rgba(0, 0, 0, 0.3)',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '600px',
            overflow: 'hidden',
          }}
        >
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
              zIndex: 15,
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            {/* Board Brass Plaque Title Tag */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(180deg, #FAF8F5 0%, #EAE6DD 100%)',
                padding: '4px 10px',
                borderRadius: '3px',
                border: '1px solid #C68A2C',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
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
                {isDiscarded ? '● SPECIFICATION APPROVED' : '● WAR ROOM REVIEW: UNGUARDED'}
              </span>
              <span style={{ fontSize: '11px', color: '#7A756D', fontFamily: 'var(--font-mono)' }}>
                | PINBOARD #01
              </span>
            </div>

            {/* Brushed Brass Drafting Clamp at Top Center of the Document */}
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
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 25,
                border: '1px solid #7F4900',
              }}
            >
              {/* Clamp Grip Texture Bar */}
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
                    borderRadius: '3px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    boxShadow: '0 4px 12px rgba(28, 27, 24, 0.25)',
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
                    borderRadius: '3px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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

          {/* Authentic Sticky Memo Pinned to Board (Visible on larger screens) */}
          <div
            style={{
              position: 'absolute',
              bottom: '18px',
              left: '20px',
              maxWidth: '220px',
              background: '#FFF9E6',
              border: '1px solid #E6D8A8',
              borderRadius: '2px',
              padding: '10px 12px',
              boxShadow: '0 4px 12px rgba(28, 27, 24, 0.12)',
              transform: 'rotate(-2.5deg)',
              zIndex: 10,
              pointerEvents: 'none',
              display: 'none',
            }}
            className="pinboard-sticky-note"
          >
            {/* Brass Thumb Tack */}
            <div
              style={{
                position: 'absolute',
                top: '-6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #F3C978, #C68A2C 60%, #7F4900)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: '#C68A2C', marginBottom: '4px' }}>
              📌 AUDIT FINDING #04
            </div>
            <div style={{ fontSize: '11px', color: '#4A4843', lineHeight: 1.4 }}>
              Direct origin exposure causes process thread exhaustion under traffic surges. Discard &amp; route via LimitX proxy perimeter.
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
                  background: 'rgba(250, 248, 245, 0.95)',
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

              {/* 3D Paper Crumple Canvas */}
              {textureUrl && (
                <div style={{ position: 'relative', width: '100%', maxWidth: '640px' }}>
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
                borderRadius: '3px',
                padding: '28px 28px',
                boxShadow: '0 10px 32px rgba(28, 27, 24, 0.1), 0 0 0 1px rgba(198, 138, 44, 0.45)',
                animation: 'blueprintAppearOnBoard 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                position: 'relative',
              }}
            >
              {/* Paper Top Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#2D8A4E', fontWeight: 600 }}>
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
                    borderRadius: '2px',
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
                    borderRadius: '2px',
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
                    borderRadius: '2px',
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
                    borderRadius: '2px',
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
                  borderRadius: '3px',
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

      {/* 3 Outcome Verification Pills */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px',
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