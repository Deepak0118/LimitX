import { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Hand,
  Trash2,
  Wind,
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

  // Background: Warm Limestone parchment
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
  ctx.fillText('// Origin processed request directly with zero rate enforcement', 64, 702);

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
  const [isExiting, setIsExiting] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const url = createWithoutLimitXDocumentTexture();
    setTextureUrl(url);
  }, []);

  // Action: Programmatic Crumple & Fling towards edge
  const handleCrumpleAndThrow = () => {
    if (!paperRef.current) return;
    setIsCrumpled(true);
    // Toss towards the top-right edge with high velocity
    paperRef.current.toss(360, -260);
  };

  // Called when the paper ball touches any edge or is flung off
  const handleDiscard = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsDiscarded(true);
      setIsExiting(false);
    }, 320);
  };

  // Action: Reset back to the Without LimitX paper sheet
  const handleReset = () => {
    setIsDiscarded(false);
    setIsCrumpled(false);
    setIsExiting(false);
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
      {/* CSS Keyframes for Smooth Reveal & Toss Out */}
      <style>{`
        @keyframes revealWithLimitX {
          0% {
            opacity: 0;
            transform: translateY(28px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes tossPaperOut {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.3) translate(280px, -200px);
          }
        }
      `}</style>

      {/* Main Interactive Stage Box */}
      <div
        style={{
          position: 'relative',
          minHeight: '580px',
          borderRadius: '4px',
          border: isDiscarded ? '1px solid #C68A2C' : '1px solid #DCD7CD',
          boxShadow: isDiscarded
            ? '0 8px 32px rgba(198, 138, 44, 0.12)'
            : '0 4px 20px rgba(28, 27, 24, 0.05)',
          background: '#FAF8F5',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border 350ms ease, box-shadow 350ms ease',
          padding: '24px',
        }}
      >
        {/* ===================================================================
            VIEW 1 (INITIAL): WITHOUT LIMITX 3D CRUMPLABLE PAPER
            "With LimitX" is NOT visible until the paper is crumpled and thrown away!
            =================================================================== */}
        {!isDiscarded ? (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: isExiting ? 'tossPaperOut 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' : 'none',
            }}
          >
            {/* Guide Bar Insisting User to Crumple and Throw */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '720px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#C64835',
                      background: '#F9ECEA',
                      border: '1px solid #E8C4BE',
                      padding: '2px 8px',
                      borderRadius: '2px',
                    }}
                  >
                    STEP 1: DISCARD OBSOLETE ARCHITECTURE
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#1C1B18' }}>
                    Without LimitX: Direct Origin Exposure
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#6E6B64', marginTop: '3px', lineHeight: 1.4 }}>
                  {!isCrumpled ? (
                    <span>
                      <strong style={{ color: '#C64835' }}>Click &amp; hold</strong> to crumple this paper into a ball, then <strong>throw it towards any edge</strong> to reveal LimitX!
                    </span>
                  ) : (
                    <span style={{ color: '#2D8A4E', fontWeight: 600 }}>
                      Now drag or fling the paper ball towards any edge to discard it!
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCrumpleAndThrow}
                style={{
                  padding: '9px 16px',
                  background: '#1C1B18',
                  color: '#FAF8F5',
                  border: 'none',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(28, 27, 24, 0.1)',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#C64835')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#1C1B18')}
              >
                <Trash2 size={13} />
                <span>Crumple &amp; Throw Off-Screen ↗</span>
              </button>
            </div>

            {/* 3D Paper Crumple Canvas */}
            {textureUrl && (
              <div style={{ position: 'relative', width: '100%', maxWidth: '640px' }}>
                <PaperCrumple
                  ref={paperRef}
                  src={textureUrl}
                  alt="Without LimitX Architecture Sheet"
                  width={380}
                  height={470}
                  sceneHeight={520}
                  paperColor="#FAF7F0"
                  releaseBehavior="stay"
                  crumpleAmount={0.88}
                  crumpleDuration={0.55}
                  releaseDuration={0.4}
                  draggable={true}
                  dragRadius={800} // Large radius lets user drag freely all over the screen
                  returnToOrigin={false} // Stays wherever the user drags/throws it
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
              VIEW 2: "WITH LIMITX" RISES UP INTO VIEW!
              Revealed ONLY after the legacy paper is crumpled and thrown away!
              =================================================================== */
          <div
            style={{
              width: '100%',
              maxWidth: '840px',
              animation: 'revealWithLimitX 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              padding: '12px 10px',
            }}
          >
            {/* Emerged Header with Replay Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                paddingBottom: '18px',
                borderBottom: '1px solid #DCD7CD',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
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
                    <span>AUTONOMOUS EDGE SHIELDED</span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#C68A2C', fontWeight: 600 }}>
                    WITH LIMITX ACTIVE
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#1C1B18', letterSpacing: '-0.02em' }}>
                  Shielded Reverse Proxy Architecture
                </h3>
              </div>

              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: '8px 14px',
                  background: '#F5F2EB',
                  border: '1px solid #DCD7CD',
                  borderRadius: '2px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#4A4843',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#EAE6DD')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#F5F2EB')}
              >
                <RotateCcw size={13} color="#C68A2C" />
                <span>Replay / Bring Back Paper</span>
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '14.5px', color: '#5F5C55', lineHeight: 1.6 }}>
              The legacy direct exposure was discarded. Your application backend now sits protected behind the LimitX reverse proxy gateway. Incoming requests are evaluated at the edge against configured rate rules (Token Bucket, Fixed Window, Sliding Log) before ever reaching origin threads.
            </p>

            {/* 4 Pillars of LimitX */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '14px',
              }}
            >
              <div
                style={{
                  background: '#F5F2EB',
                  border: '1px solid #DCD7CD',
                  borderRadius: '2px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Check size={14} color="#2D8A4E" strokeWidth={2.5} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#7A756D', fontWeight: 600 }}>
                    EDGE PERIMETER
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1C1B18' }}>
                  Protected Origin Host
                </div>
                <div style={{ fontSize: '12.5px', color: '#6E6B64', marginTop: '4px', lineHeight: 1.45 }}>
                  Traffic routes through the reverse proxy. Origin server IP and ports stay protected.
                </div>
              </div>

              <div
                style={{
                  background: '#F5F2EB',
                  border: '1px solid #DCD7CD',
                  borderRadius: '2px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Check size={14} color="#2D8A4E" strokeWidth={2.5} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#7A756D', fontWeight: 600 }}>
                    BURST BUFFERING
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1C1B18' }}>
                  Algorithmic Rate Limiting
                </div>
                <div style={{ fontSize: '12.5px', color: '#6E6B64', marginTop: '4px', lineHeight: 1.45 }}>
                  Token Bucket, Fixed Window, and Sliding Log smoothly absorb spikes at the edge.
                </div>
              </div>

              <div
                style={{
                  background: '#F5F2EB',
                  border: '1px solid #DCD7CD',
                  borderRadius: '2px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Check size={14} color="#2D8A4E" strokeWidth={2.5} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#7A756D', fontWeight: 600 }}>
                    IETF STANDARDS
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1C1B18' }}>
                  Standard Rate Headers
                </div>
                <div style={{ fontSize: '12.5px', color: '#6E6B64', marginTop: '4px', lineHeight: 1.45 }}>
                  Injects standard <code style={{ fontFamily: 'var(--font-mono)', color: '#C68A2C' }}>X-RateLimit-Limit</code>, <code style={{ fontFamily: 'var(--font-mono)', color: '#C68A2C' }}>Remaining</code>, and <code style={{ fontFamily: 'var(--font-mono)', color: '#C68A2C' }}>Reset</code>.
                </div>
              </div>

              <div
                style={{
                  background: '#F5F2EB',
                  border: '1px solid #DCD7CD',
                  borderRadius: '2px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Check size={14} color="#2D8A4E" strokeWidth={2.5} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#7A756D', fontWeight: 600 }}>
                    1-URL SWAP
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1C1B18' }}>
                  Zero Code Changes
                </div>
                <div style={{ fontSize: '12.5px', color: '#6E6B64', marginTop: '4px', lineHeight: 1.45 }}>
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
                padding: '14px 18px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7A756D', fontSize: '10.5px', marginBottom: '6px' }}>
                <span>LIMITX PROXIED RESPONSE WIRE</span>
                <span style={{ color: '#2D8A4E', fontWeight: 600 }}>TELEMETRY ACTIVE</span>
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