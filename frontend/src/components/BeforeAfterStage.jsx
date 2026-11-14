import { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Hand,
  Trash2,
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
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const url = createWithoutLimitXDocumentTexture();
    setTextureUrl(url);
  }, []);

  // Action: Programmatic Crumple & Toss to the side
  const handleCrumpleAndToss = () => {
    if (!paperRef.current) return;
    setIsCrumpled(true);
    paperRef.current.toss(250, -140);
  };

  // Action: Reset paper back to flat over the card
  const handleReset = () => {
    setIsCrumpled(false);
    setResetKey((k) => k + 1);
    if (paperRef.current) {
      paperRef.current.reset();
    }
  };

  // Callback from direct user drag & crumple
  const handleStateChange = (state) => {
    if (state === 'crumpled' || state === 'holding') {
      setIsCrumpled(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Controller Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#FAF8F5',
          border: '1px solid #DCD7CD',
          borderRadius: '3px',
          padding: '12px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Hand size={15} color="#C68A2C" />
          <div style={{ fontSize: '13px', color: '#1C1B18' }}>
            <strong>Interactive 3D Stage:</strong> Click and drag the legacy paper to crumple it, then throw it anywhere to reveal LimitX.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isCrumpled ? (
            <button
              type="button"
              onClick={handleCrumpleAndToss}
              style={{
                padding: '7px 14px',
                background: '#1C1B18',
                color: '#FAF8F5',
                border: 'none',
                borderRadius: '2px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#C68A2C')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#1C1B18')}
            >
              <Trash2 size={13} />
              <span>Crumple &amp; Fling to Side ↗</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '7px 14px',
                background: '#FAF8F5',
                color: '#1C1B18',
                border: '1px solid #DCD7CD',
                borderRadius: '2px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              }}
            >
              <RotateCcw size={13} color="#C68A2C" />
              <span>Reset / Unfold Paper</span>
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          MAIN DUAL-LAYER STAGE
          Base: "With LimitX" Card (Always present underneath!)
          Top: 3D PaperCrumple (Crumples into ball, freely draggable anywhere!)
          ===================================================================== */}
      <div
        style={{
          position: 'relative',
          minHeight: '560px',
          borderRadius: '4px',
          border: isCrumpled ? '1px solid #C68A2C' : '1px solid #DCD7CD',
          boxShadow: isCrumpled
            ? '0 6px 28px rgba(198, 138, 44, 0.12)'
            : '0 4px 20px rgba(28, 27, 24, 0.05)',
          background: '#FAF8F5',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border 300ms ease, box-shadow 300ms ease',
        }}
      >
        {/* ===================================================================
            LAYER 1 (BASE): "WITH LIMITX" SHIELDED ARCHITECTURE CARD
            =================================================================== */}
        <div
          style={{
            width: '100%',
            maxWidth: '860px',
            padding: '36px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            zIndex: 1,
            opacity: isCrumpled ? 1 : 0.85,
            transition: 'opacity 300ms ease',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#2D8A4E',
                  background: '#E8F5E9',
                  border: '1px solid #CBE8D5',
                  padding: '3px 8px',
                  borderRadius: '2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <ShieldCheck size={12} />
                <span>WITH LIMITX ACTIVE</span>
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#C68A2C', fontWeight: 600 }}>
                REVERSE PROXY PERIMETER
              </span>
            </div>

            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#2D8A4E', fontWeight: 600 }}>
              ● ORIGIN SHIELDED
            </span>
          </div>

          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 600, color: '#1C1B18', letterSpacing: '-0.02em' }}>
              Shielded Reverse Proxy Architecture
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#5F5C55', lineHeight: 1.55 }}>
              Your application backend sits protected behind the LimitX reverse proxy. Every incoming request is evaluated against configured rate limits (Token Bucket, Fixed Window, Sliding Log) at the edge before ever reaching backend threads.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
                Traffic routes through the proxy. Origin IP and ports remain completely hidden.
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
                Standard IETF Headers
              </div>
              <div style={{ fontSize: '12px', color: '#6E6B64', marginTop: '2px', lineHeight: 1.45 }}>
                Injects <code style={{ fontFamily: 'var(--font-mono)', color: '#C68A2C' }}>X-RateLimit-Limit</code>, <code style={{ fontFamily: 'var(--font-mono)', color: '#C68A2C' }}>Remaining</code>, and <code style={{ fontFamily: 'var(--font-mono)', color: '#C68A2C' }}>Reset</code>.
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
                Connects via 1-URL proxy swap (<code style={{ fontFamily: 'var(--font-mono)' }}>API_BASE_URL</code>). Zero SDK refactoring.
              </div>
            </div>
          </div>

          {/* Wire Response Snippet */}
          <div
            style={{
              background: '#F5F2EB',
              border: '1px solid #DCD7CD',
              borderRadius: '2px',
              padding: '12px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
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
              <div style={{ color: '#2D8A4E', marginTop: '3px' }}>// Evaluated at proxy gateway before passing to origin</div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            LAYER 2 (TOP): 3D "WITHOUT LIMITX" PAPER CRUMPLE
            Allows free dragging anywhere, stays crumpled, does NOT vanish!
            =================================================================== */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          {textureUrl && (
            <PaperCrumple
              ref={paperRef}
              src={textureUrl}
              alt="Without LimitX Architecture Sheet"
              width={380}
              height={470}
              sceneHeight={560}
              paperColor="#FAF7F0"
              releaseBehavior="stay"
              crumpleAmount={0.88}
              crumpleDuration={0.55}
              releaseDuration={0.4}
              draggable={true}
              dragRadius={800} // Large radius allows throwing to any corner of the screen!
              returnToOrigin={false} // Stays wherever the user throws/drops it!
              dragRotation={25}
              resetKey={resetKey}
              onStateChange={handleStateChange}
            />
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