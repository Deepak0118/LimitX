import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  ArrowRight,
  Play,
  Zap,
} from 'lucide-react';

const VALID_LABELS = [
  'GET /v1/users',
  'POST /v1/checkout',
  'GET /v2/analytics',
  'PUT /profile/settings',
  'POST /auth/token',
  'GET /api/products',
];

const ATTACK_LABELS = [
  'POST /auth/login',
  '429 RATE LIMITED',
  'BURST 429 FLOOD',
  'SCRAPE /api/export',
  'POST /auth/reset',
  'QUERY /graphql',
];

export default function HeroPrecisionStage({ onOpenSetup }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);

  // Traffic simulation mode: 'normal' | 'burst' | 'attack'
  const [trafficMode, setTrafficMode] = useState('normal');
  const [hudStats, setHudStats] = useState({
    incoming: '1,240 req/s',
    shieldedPct: '14.5%',
    originLoad: '14%',
    latency: '1.2 ms',
  });

  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
    }, 3000);
  }, []);

  const modeRef = useRef(trafficMode);
  modeRef.current = trafficMode;

  const packetsRef = useRef([]);
  const sparksRef = useRef([]);
  const ripplesRef = useRef([]);
  const floatingTagsRef = useRef([]);
  const cpuHistoryRef = useRef([14, 13, 14, 15, 14, 13, 14, 14, 15]);

  // Mode configurations
  const modeConfig = {
    normal: {
      spawnRate: 0.4,
      maliciousRatio: 0.2,
      speedMin: 2.0,
      speedMax: 3.2,
      inRateBase: 1240,
      cpuBase: 14,
      latencyBase: 1.1,
    },
    burst: {
      spawnRate: 1.2,
      maliciousRatio: 0.65,
      speedMin: 3.0,
      speedMax: 4.8,
      inRateBase: 8400,
      cpuBase: 16,
      latencyBase: 1.3,
    },
    attack: {
      spawnRate: 2.4,
      maliciousRatio: 0.88,
      speedMin: 4.0,
      speedMax: 6.2,
      inRateBase: 48600,
      cpuBase: 18,
      latencyBase: 1.4,
    },
  };

  // Helper to spawn a falling request capsule
  const spawnPacket = useCallback((forceMalicious = null, customX = null, customWidth = 0) => {
    const w = customWidth || (wrapperRef.current ? wrapperRef.current.clientWidth : 1200);
    const cfg = modeConfig[modeRef.current] || modeConfig.normal;
    const isMalicious = forceMalicious !== null ? forceMalicious : Math.random() < cfg.maliciousRatio;
    const margin = 48;
    const x = customX !== null ? customX : margin + Math.random() * (w - margin * 2);
    const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
    const showLabel = Math.random() < (modeRef.current === 'attack' ? 0.22 : 0.4);

    let chosenLabel = null;
    if (showLabel) {
      if (isMalicious) {
        chosenLabel = ATTACK_LABELS[Math.floor(Math.random() * ATTACK_LABELS.length)];
      } else {
        chosenLabel = VALID_LABELS[Math.floor(Math.random() * VALID_LABELS.length)];
      }
    }

    packetsRef.current.push({
      x,
      y: -20,
      vx: (Math.random() - 0.5) * 0.16,
      vy: speed,
      isMalicious,
      passedShield: false,
      label: chosenLabel,
    });
  }, []);

  // Trigger burst wave on button click
  const triggerBurstWave = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      const w = wrapperRef.current ? wrapperRef.current.clientWidth : 1200;
      for (let i = 0; i < 22; i++) {
        spawnPacket(true, null, w);
        const p = packetsRef.current[packetsRef.current.length - 1];
        if (p) {
          p.y = -10 - Math.random() * 55;
          p.vy = 5.2 + Math.random() * 1.8;
        }
      }
      showToast('⚡ Injected burst wave — 100% of excess requests filtered at Ozone Shield');
    },
    [spawnPacket, showToast],
  );

  // Click anywhere on sky to drop requests
  const handleCanvasClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const w = rect.width;

    for (let i = 0; i < 14; i++) {
      const offsetX = (Math.random() - 0.5) * 120;
      const spawnX = Math.min(Math.max(clickX + offsetX, 36), w - 36);
      spawnPacket(true, spawnX, w);
      const p = packetsRef.current[packetsRef.current.length - 1];
      if (p) {
        p.y = -10 - Math.random() * 40;
        p.vy = 4.8 + Math.random() * 1.8;
      }
    }
  };

  // 60fps Canvas Animation & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return undefined;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = 0;
    let height = 0;

    let blueprintNodes = [];

    function resize() {
      const rect = wrapper.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      blueprintNodes = [];
      for (let i = 0; i < 30; i++) {
        blueprintNodes.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.78),
          size: 2.5,
        });
      }
    }

    resize();
    window.addEventListener('resize', resize);

    // Parabolic Ozone Shield Arc across middle-lower hero region
    function getShieldY(x) {
      const normalizedX = (x - width / 2) / (width * 0.5);
      const centerPeakY = height * 0.52;
      const edgeDrop = height * 0.11;
      return centerPeakY + edgeDrop * (normalizedX * normalizedX);
    }

    function getShieldNormal(x) {
      const dx = 4;
      const dy = getShieldY(x + dx) - getShieldY(x - dx);
      const slope = dy / (2 * dx);
      const len = Math.hypot(slope, 1);
      return { nx: slope / len, ny: -1 / len };
    }

    // Ricochet sparks on impact
    function triggerShieldDeflection(x, y, isHeavy = false) {
      const sparkCount = isHeavy ? 10 : 6;
      const normal = getShieldNormal(x);

      for (let i = 0; i < sparkCount; i++) {
        const spread = (Math.random() - 0.5) * 2.2;
        const speed = 1.4 + Math.random() * 3.0;
        sparksRef.current.push({
          x,
          y: y - 2,
          vx: (normal.nx + spread) * speed,
          vy: normal.ny * (0.65 + Math.random() * 0.85) * speed,
          life: 1.0,
          decay: 0.032 + Math.random() * 0.02,
          color: Math.random() > 0.35 ? '#A83B2B' : '#D96B27',
          size: 1.5 + Math.random() * 1.5,
        });
      }

      if (ripplesRef.current.length < 24) {
        ripplesRef.current.push({
          x,
          y,
          radius: 4,
          maxRadius: isHeavy ? 54 : 32,
          life: 1.0,
          color: '168, 59, 43',
        });
      }

      if (floatingTagsRef.current.length < 8 && Math.random() < 0.35) {
        floatingTagsRef.current.push({
          x: Math.min(Math.max(x, 70), width - 70),
          y: y - 14,
          vy: -0.65,
          life: 1.0,
          text: '429 RATE LIMITED',
        });
      }
    }

    // Clean pass through shield
    function triggerShieldPass(x, y) {
      if (ripplesRef.current.length < 24 && Math.random() < 0.45) {
        ripplesRef.current.push({
          x,
          y,
          radius: 3,
          maxRadius: 24,
          life: 0.85,
          color: '28, 27, 24',
        });
      }
    }

    // DRAW THE OZONE LAYER CURVE WITH LUMINOUS GLOW
    function drawOzoneShield(time) {
      const pulse = Math.sin(time * 0.0028) * 0.15 + 0.85;

      // 1. Soft atmospheric aura beneath the curve
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, getShieldY(0));
      for (let x = 0; x <= width; x += 10) {
        ctx.lineTo(x, getShieldY(x));
      }
      ctx.lineTo(width, getShieldY(width) + 54);
      for (let x = width; x >= 0; x -= 10) {
        ctx.lineTo(x, getShieldY(x) + 54);
      }
      ctx.closePath();

      const auraGrad = ctx.createLinearGradient(0, height * 0.44, 0, height * 0.68);
      auraGrad.addColorStop(0, 'rgba(217, 107, 39, 0.18)');
      auraGrad.addColorStop(0.5, 'rgba(140, 136, 127, 0.08)');
      auraGrad.addColorStop(1, 'rgba(245, 242, 235, 0.0)');
      ctx.fillStyle = auraGrad;
      ctx.fill();
      ctx.restore();

      // 2. WIDE LUMINOUS BLOOM (Outer Glow)
      ctx.save();
      ctx.beginPath();
      for (let x = 0; x <= width; x += 6) {
        const y = getShieldY(x);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(217, 107, 39, ${0.45 * pulse})`;
      ctx.lineWidth = 10;
      ctx.shadowColor = 'rgba(217, 107, 39, 0.85)';
      ctx.shadowBlur = 36;
      ctx.stroke();
      ctx.restore();

      // 3. MID RADIANT GLOW LINE
      ctx.save();
      ctx.beginPath();
      for (let x = 0; x <= width; x += 6) {
        const y = getShieldY(x);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const midGrad = ctx.createLinearGradient(0, 0, width, 0);
      midGrad.addColorStop(0, 'rgba(217, 107, 39, 0.3)');
      midGrad.addColorStop(0.25, `rgba(217, 107, 39, ${0.95 * pulse})`);
      midGrad.addColorStop(0.5, `rgba(235, 145, 60, ${1.0 * pulse})`);
      midGrad.addColorStop(0.75, `rgba(217, 107, 39, ${0.95 * pulse})`);
      midGrad.addColorStop(1, 'rgba(217, 107, 39, 0.3)');

      ctx.strokeStyle = midGrad;
      ctx.lineWidth = 4.2;
      ctx.shadowColor = 'rgba(235, 145, 60, 0.9)';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.restore();

      // 4. CORE BRIGHT SPECULAR FILAMENT
      ctx.save();
      ctx.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const y = getShieldY(x);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255, 252, 245, 0.96)';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();

      // 5. TRAVELING LUMINOUS COMET GLINT
      const waveX = ((time * 0.2) % (width + 300)) - 150;
      ctx.save();
      ctx.beginPath();
      for (let x = Math.max(0, waveX - 85); x <= Math.min(width, waveX + 85); x += 4) {
        const y = getShieldY(x);
        if (x === Math.max(0, waveX - 85)) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3.6;
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 22;
      ctx.stroke();
      ctx.restore();
    }

    // Render request pills with motion speed trails
    function drawPacketPill(p) {
      ctx.save();

      let strokeColor = '#DCD7CD';
      let fillColor = '#FBF9F5';
      let textColor = '#1C1B18';
      let trailColor = 'rgba(140, 136, 127, 0.25)';
      let dotColor = '#8C887F';

      if (p.isMalicious) {
        strokeColor = '#E8C4BE';
        textColor = '#A83B2B';
        trailColor = 'rgba(168, 59, 43, 0.28)';
        dotColor = '#A83B2B';
      } else if (p.passedShield) {
        strokeColor = '#DCD7CD';
        textColor = '#1C1B18';
        trailColor = 'rgba(140, 136, 127, 0.25)';
        dotColor = '#1C1B18';
      }

      // Motion Trail
      const trailGrad = ctx.createLinearGradient(p.x, p.y - 24, p.x, p.y);
      trailGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      trailGrad.addColorStop(1, trailColor);
      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 24);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      if (p.label) {
        ctx.font = '600 8.5px "IBM Plex Mono", monospace';
        const textMetrics = ctx.measureText(p.label);
        const padX = 7;
        const pillW = textMetrics.width + padX * 2 + 8;
        const pillH = 17;
        const rx = p.x - pillW / 2;
        const ry = p.y - pillH / 2;

        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(rx, ry, pillW, pillH, 999);
        } else {
          ctx.rect(rx, ry, pillW, pillH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(rx + 6.5, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = textColor;
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label, rx + 12, p.y + 0.5);
      } else {
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(p.x - 2.2, p.y - 5.5, 4.4, 11, 999);
        } else {
          ctx.rect(p.x - 2.2, p.y - 5.5, 4.4, 11);
        }
        ctx.fill();
      }

      ctx.restore();
    }

    let spawnAccumulator = 0;
    let lastTelemetryUpdate = 0;

    function render(time) {
      ctx.clearRect(0, 0, width, height);

      // Subtle architectural blueprint nodes
      ctx.save();
      ctx.strokeStyle = 'rgba(155, 134, 114, 0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i < blueprintNodes.length; i++) {
        const n = blueprintNodes[i];
        ctx.beginPath();
        ctx.moveTo(n.x - n.size, n.y);
        ctx.lineTo(n.x + n.size, n.y);
        ctx.moveTo(n.x, n.y - n.size);
        ctx.lineTo(n.x, n.y + n.size);
        ctx.stroke();
      }
      ctx.restore();

      // Spawn request packets based on active mode
      const cfg = modeConfig[modeRef.current] || modeConfig.normal;
      spawnAccumulator += cfg.spawnRate;
      while (spawnAccumulator >= 1) {
        spawnPacket(null, null, width);
        spawnAccumulator -= 1;
      }

      // Draw Glowing Ozone Shield Arc
      drawOzoneShield(time);

      // Draw Impact Ripple Shockwaves
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.radius += (r.maxRadius - r.radius) * 0.12;
        r.life -= 0.035;
        if (r.life <= 0) {
          ripplesRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.36, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r.color}, ${r.life * 0.65})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }

      // Update & Draw Packets
      const serverFloorY = height - 120;
      for (let i = packetsRef.current.length - 1; i >= 0; i--) {
        const p = packetsRef.current[i];
        p.x += p.vx;
        p.y += p.vy;

        const shieldY = getShieldY(p.x);

        if (!p.passedShield && p.y >= shieldY) {
          if (p.isMalicious) {
            triggerShieldDeflection(p.x, shieldY, modeRef.current === 'attack');
            packetsRef.current.splice(i, 1);
            continue;
          } else {
            p.passedShield = true;
            p.vy = Math.min(p.vy * 0.78, 2.5);
            p.vx += (width / 2 - p.x) * 0.0075;
            triggerShieldPass(p.x, shieldY);
          }
        }

        if (p.passedShield && p.y >= serverFloorY) {
          packetsRef.current.splice(i, 1);
          continue;
        }

        drawPacketPill(p);
      }

      // Update & Draw Physical Ricochet Sparks
      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const sp = sparksRef.current[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.08;
        sp.life -= sp.decay;

        if (sp.life <= 0) {
          sparksRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = sp.life;
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Update & Draw Floating "429 RATE LIMITED" Badges
      for (let i = floatingTagsRef.current.length - 1; i >= 0; i--) {
        const tag = floatingTagsRef.current[i];
        tag.y += tag.vy;
        tag.life -= 0.022;
        if (tag.life <= 0) {
          floatingTagsRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = tag.life;
        ctx.font = '700 8.5px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#A83B2B';
        ctx.textAlign = 'center';
        ctx.fillText(tag.text, tag.x, tag.y);
        ctx.restore();
      }

      // Update HUD telemetry counters every 280ms
      if (time - lastTelemetryUpdate > 280) {
        lastTelemetryUpdate = time;
        const jitterIn = Math.floor((Math.random() - 0.5) * (cfg.inRateBase * 0.08));
        const inVal = Math.max(100, cfg.inRateBase + jitterIn);
        const passVal = 1060 + Math.floor((Math.random() - 0.5) * 45);
        const blockVal = Math.max(0, inVal - passVal);
        const shielded = ((blockVal / inVal) * 100).toFixed(1);

        const cpuJitter = cfg.cpuBase + Math.floor((Math.random() - 0.5) * 3);

        setHudStats({
          incoming: `${inVal.toLocaleString()} req/s`,
          shieldedPct: `${shielded}%`,
          originLoad: `${cpuJitter}%`,
          latency: `${(cfg.latencyBase + (Math.random() * 0.2 - 0.1)).toFixed(1)} ms`,
        });

        // Update sparkline history
        cpuHistoryRef.current.shift();
        cpuHistoryRef.current.push(cpuJitter);
      }

      animationFrameId = requestAnimationFrame(render);
    }

    // Seed initial packet rain
    for (let i = 0; i < 20; i++) {
      spawnPacket(null, null, width);
      const p = packetsRef.current[packetsRef.current.length - 1];
      if (p) p.y = Math.random() * (height * 0.4);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [spawnPacket]);

  // Compute live sparkline SVG path
  const cpuSparklinePath = cpuHistoryRef.current
    .map((val, idx) => {
      const px = idx * 12;
      const py = 18 - ((val - 10) / 15) * 8;
      return `${idx === 0 ? 'M' : 'L'}${px},${py.toFixed(1)}`;
    })
    .join(' ');

  return (
    <section
      id="overview"
      ref={wrapperRef}
      onClick={handleCanvasClick}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '840px',
        background: '#F5F2EB',
        backgroundImage: 'radial-gradient(#DCD7CD 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Light Stone & Warm Limestone Ambient Atmospheric Blur */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          left: '20%',
          width: '560px',
          height: '420px',
          borderRadius: '50%',
          background: 'rgba(230, 226, 217, 0.45)',
          filter: 'blur(120px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '15%',
          width: '520px',
          height: '380px',
          borderRadius: '50%',
          background: 'rgba(220, 215, 205, 0.35)',
          filter: 'blur(120px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Real-time 60fps HTML5 Canvas Engine (Rain + Glowing Ozone Arc + Physics Sparks) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          zIndex: 1,
        }}
      />

      {/* =========================================================================
          FOREGROUND OVERLAY LAYER (Ultra-Clean, High-Impact Editorial)
          Strictly using #F5F2EB, #E6E2D9, #FBF9F5, and #1C1B18 (No Green Text)
         ========================================================================= */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '1340px',
          margin: '0 auto',
          padding: 'clamp(150px, 20vh, 210px) 24px 24px',
          minHeight: '840px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        {/* Top Right Live Traffic Legend */}
        <div
          className="hidden md:flex"
          style={{
            position: 'absolute',
            top: '26px',
            right: '28px',
            background: 'rgba(251, 249, 245, 0.94)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #DCD7CD',
            borderRadius: '2px',
            padding: '8px 14px',
            flexDirection: 'column',
            gap: '5px',
            fontSize: '10.5px',
            fontFamily: 'var(--font-mono, monospace)',
            color: '#4A4843',
            boxShadow: '0 1px 4px rgba(28, 27, 24, 0.04)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1C1B18' }} />
            <span>Legitimate (200 OK)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#A83B2B' }} />
            <span>Throttled (429 Drop)</span>
          </div>
        </div>

        {/* EDITORIAL HEADLINE BAY — ANCHORED JUST ABOVE THE OZONE ARC */}
        <div
          style={{
            textAlign: 'center',
            maxWidth: '920px',
            margin: '0 auto 20px auto',
            pointerEvents: 'auto',
          }}
        >
          {/* Premium Architectural Display Title in Plus Jakarta Sans */}
          <h1
            style={{
              fontFamily: '"Plus Jakarta Sans", var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontSize: 'clamp(54px, 7.2vw, 86px)',
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              color: '#1C1B18',
              background: 'linear-gradient(180deg, #181512 15%, #2F2A24 60%, #584F44 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 auto 14px',
              textAlign: 'center',
              filter: 'drop-shadow(0 2px 18px rgba(30, 25, 20, 0.08))',
            }}
          >
            Rate Limiter
          </h1>

          {/* Clean User-POV Subtitle */}
          <p
            style={{
              margin: '0 auto 26px',
              fontSize: 'clamp(15.5px, 1.7vw, 17.5px)',
              color: '#5F5C55',
              maxWidth: '520px',
              lineHeight: 1.6,
              textAlign: 'center',
            }}
          >
            Stop traffic spikes and abusive bursts before they reach your origin.
          </p>

          {/* Action CTAs in Warm Limestone & Ivory Palette */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            {/* Primary Button matching Login Page & Git style */}
            <Link
              to="/auth?mode=signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#1C1B18',
                color: '#FAF8F5',
                padding: '12px 24px',
                borderRadius: '2px',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                boxShadow: '0 2px 10px rgba(28, 27, 24, 0.12)',
                transition: 'all 160ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2E2B26';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1C1B18';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Get Started Free <ArrowRight size={14} />
            </Link>

            {/* Secondary Button */}
            <button
              type="button"
              onClick={onOpenSetup}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FBF9F5',
                color: '#1C1B18',
                border: '1px solid #DCD7CD',
                padding: '12px 22px',
                borderRadius: '2px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 160ms ease',
                boxShadow: '0 1px 3px rgba(28, 27, 24, 0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1C1B18';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#DCD7CD';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Play size={13} style={{ fill: '#1C1B18' }} /> See How It Works
            </button>

            {/* Burst Demo Pill */}
            <button
              type="button"
              onClick={triggerBurstWave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FBF9F5',
                color: '#1C1B18',
                border: '1px solid #DCD7CD',
                padding: '12px 18px',
                borderRadius: '2px',
                fontSize: '13.5px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 160ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1C1B18';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#DCD7CD';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Zap size={14} style={{ color: '#D96B27' }} /> Test Traffic Burst
            </button>
          </div>
        </div>

        {/* BOTTOM ZONE: PROTECTED ORIGIN BACKEND & WARM LIMESTONE CONTROL DOCK */}
        <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Protected Origin Backend Card in Ivory Stone (#FBF9F5) */}
          <div
            style={{
              background: '#FBF9F5',
              border: '1px solid #DCD7CD',
              borderRadius: '8px',
              padding: '14px 20px',
              boxShadow: '0 4px 16px rgba(28, 27, 24, 0.06)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            {/* Left Server Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '6px',
                  background: '#E6E2D9',
                  border: '1px solid #DCD7CD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1C1B18',
                }}
              >
                <Server size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#1C1B18',
                    }}
                  >
                    Backend Databases &amp; Services
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 600,
                      background: '#E6E2D9',
                      color: '#1C1B18',
                      border: '1px solid #DCD7CD',
                    }}
                  >
                    PROTECTED • REAL TRAFFIC ONLY
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '11.5px',
                    color: '#5F5C55',
                    marginTop: '2px',
                  }}
                >
                  All excess and malicious requests are filtered at the edge before touching your servers.
                </div>
              </div>
            </div>

            {/* Right CPU Stability Sparkline in Deep Ink (#1C1B18) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                borderLeft: '1px solid #DCD7CD',
                paddingLeft: '16px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '10px',
                    color: '#8C887F',
                    marginBottom: '2px',
                  }}
                >
                  <span>CPU STABILITY</span>
                  <span style={{ color: '#1C1B18', fontWeight: 600 }}>{hudStats.originLoad}</span>
                </div>
                <svg width="96" height="20" style={{ overflow: 'visible' }}>
                  <path
                    d={cpuSparklinePath}
                    fill="none"
                    stroke="#1C1B18"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '9.5px',
                    color: '#8C887F',
                    textTransform: 'uppercase',
                  }}
                >
                  Origin P95
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1C1B18',
                  }}
                >
                  {hudStats.latency}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Control Dock in Warm Limestone (#E6E2D9) */}
          <div
            style={{
              background: '#E6E2D9',
              border: '1px solid #DCD7CD',
              borderRadius: '6px',
              padding: '8px 14px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            {/* Mode Switcher Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setTrafficMode('normal')}
                style={{
                  background: trafficMode === 'normal' ? '#FBF9F5' : 'transparent',
                  color: trafficMode === 'normal' ? '#1C1B18' : '#5F5C55',
                  border: trafficMode === 'normal' ? '1px solid #DCD7CD' : '1px solid transparent',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: trafficMode === 'normal' ? 600 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 120ms ease',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1C1B18' }} />
                Normal Flow
              </button>

              <button
                type="button"
                onClick={() => setTrafficMode('burst')}
                style={{
                  background: trafficMode === 'burst' ? '#FBF9F5' : 'transparent',
                  color: trafficMode === 'burst' ? '#1C1B18' : '#5F5C55',
                  border: trafficMode === 'burst' ? '1px solid #DCD7CD' : '1px solid transparent',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: trafficMode === 'burst' ? 600 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 120ms ease',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D96B27' }} />
                Traffic Burst
              </button>

              <button
                type="button"
                onClick={() => setTrafficMode('attack')}
                style={{
                  background: trafficMode === 'attack' ? '#FBF9F5' : 'transparent',
                  color: trafficMode === 'attack' ? '#A83B2B' : '#5F5C55',
                  border: trafficMode === 'attack' ? '1px solid #E8C4BE' : '1px solid transparent',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: trafficMode === 'attack' ? 600 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 120ms ease',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#A83B2B' }} />
                Bot Attack Spike
              </button>
            </div>

            {/* Live Telemetry Readouts */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '11px',
              }}
            >
              <div
                style={{
                  padding: '3px 8px',
                  borderRadius: '3px',
                  background: '#FBF9F5',
                  border: '1px solid #DCD7CD',
                  color: '#1C1B18',
                }}
              >
                <span style={{ color: '#8C887F' }}>IN:</span> <strong>{hudStats.incoming}</strong>
              </div>
              <div
                style={{
                  padding: '3px 8px',
                  borderRadius: '3px',
                  background: '#F9ECEA',
                  border: '1px solid #E8C4BE',
                  color: '#A83B2B',
                }}
              >
                <span>FILTERED:</span> <strong>{hudStats.shieldedPct}</strong>
              </div>
              <span style={{ color: '#8C887F', fontSize: '10.5px' }} className="hidden sm:inline">
                Click sky to drop test traffic
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Light Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 100,
            background: '#FBF9F5',
            border: '1px solid #DCD7CD',
            borderRadius: '6px',
            padding: '12px 18px',
            boxShadow: '0 4px 16px rgba(28, 27, 24, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            color: '#1C1B18',
            animation: 'fadeIn 200ms ease',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1C1B18' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
}
