import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  ArrowRight,
  Play,
  Zap,
  Database,
} from 'lucide-react';

const VALID_LABELS = [
  'GET /v1/users',
  'POST /v1/checkout',
  'GET /v2/analytics',
  'PUT /profile/settings',
  'POST /auth/token',
  'GET /api/products',
  'GET /v1/health',
  'POST /api/webhooks',
  'GET /v2/feed',
  'POST /v1/events',
];

const ATTACK_LABELS = [
  'POST /auth/login',
  '429 RATE LIMITED',
  'BURST 429 FLOOD',
  'SCRAPE /api/export',
  'POST /auth/reset',
  'QUERY /graphql',
  '429 TOO MANY REQS',
  'BOT FLOOD /scrape',
];

export default function HeroPrecisionStage({ onOpenSetup }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const serverRef = useRef(null);

  // Traffic simulation mode: 'normal' | 'burst' | 'attack'
  const [trafficMode, setTrafficMode] = useState('normal');
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

  // Mode configurations - tuned to clean, realistic production traffic rates
  const modeConfig = {
    normal: {
      spawnRate: 0.18,
      maliciousRatio: 0.2,
      speedMin: 1.8,
      speedMax: 2.8,
      inRateBase: 320,
      cpuBase: 14,
      latencyBase: 1.1,
    },
    burst: {
      spawnRate: 0.5,
      maliciousRatio: 0.65,
      speedMin: 2.6,
      speedMax: 4.2,
      inRateBase: 1400,
      cpuBase: 16,
      latencyBase: 1.3,
    },
    attack: {
      spawnRate: 0.9,
      maliciousRatio: 0.85,
      speedMin: 3.4,
      speedMax: 5.2,
      inRateBase: 4800,
      cpuBase: 18,
      latencyBase: 1.4,
    },
  };

  // Helper to spawn a falling request capsule
  const spawnPacket = useCallback((forceMalicious = null, customX = null, customWidth = 0) => {
    const w = customWidth || (wrapperRef.current ? wrapperRef.current.clientWidth : 1200);
    const cfg = modeConfig[modeRef.current] || modeConfig.normal;
    const isMalicious = forceMalicious !== null ? forceMalicious : Math.random() < cfg.maliciousRatio;
    
    // Bimodal distribution: 88% on flanks, sparse in the center corridor to keep title clean
    let x;
    if (customX !== null) {
      x = customX;
    } else {
      const zoneChoice = Math.random();
      if (zoneChoice < 0.44) {
        // Left Flank (44% frequency)
        x = 42 + Math.random() * (w * 0.28);
      } else if (zoneChoice < 0.88) {
        // Right Flank (44% frequency)
        x = w * 0.68 + Math.random() * (w * 0.28);
      } else {
        // Center Corridor (sparse 12% frequency so headline text remains unblocked)
        x = w * 0.34 + Math.random() * (w * 0.32);
      }
    }

    const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);

    // 100% of requests have clean endpoint labels per user request
    const chosenLabel = isMalicious
      ? ATTACK_LABELS[Math.floor(Math.random() * ATTACK_LABELS.length)]
      : VALID_LABELS[Math.floor(Math.random() * VALID_LABELS.length)];

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
      for (let i = 0; i < 11; i++) {
        spawnPacket(true, null, w);
        const p = packetsRef.current[packetsRef.current.length - 1];
        if (p) {
          p.y = -10 - Math.random() * 45;
          p.vy = 4.6 + Math.random() * 1.5;
        }
      }
      showToast('⚡ Burst wave simulated — excess requests rate-limited with 429 Too Many Requests');
    },
    [spawnPacket, showToast],
  );

  // Click anywhere on sky to drop requests
  const handleCanvasClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const w = rect.width;

    for (let i = 0; i < 7; i++) {
      const offsetX = (Math.random() - 0.5) * 100;
      const spawnX = Math.min(Math.max(clickX + offsetX, 36), w - 36);
      spawnPacket(true, spawnX, w);
      const p = packetsRef.current[packetsRef.current.length - 1];
      if (p) {
        p.y = -10 - Math.random() * 30;
        p.vy = 4.2 + Math.random() * 1.5;
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
        const spread = (Math.random() - 0.5) * 1.8;
        const speed = 1.0 + Math.random() * 1.8;
        sparksRef.current.push({
          x,
          y: y - 2,
          vx: (normal.nx + spread) * speed,
          vy: normal.ny * (0.55 + Math.random() * 0.55) * speed,
          life: 1.0,
          decay: 0.036 + Math.random() * 0.02,
          color: Math.random() > 0.35 ? '#A83B2B' : '#D96B27',
          size: 1.4 + Math.random() * 1.2,
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
    function drawPacketPill(p, serverTargetY) {
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
        strokeColor = '#CBE8D5';
        textColor = '#1C1B18';
        trailColor = 'rgba(45, 138, 78, 0.25)';
        dotColor = '#2D8A4E';
      }

      // Smooth fade into server intake port as packet enters the chassis
      if (p.passedShield && serverTargetY) {
        const remainingY = serverTargetY - p.y;
        if (remainingY < 24) {
          ctx.globalAlpha = Math.max(0.12, remainingY / 24);
        }
      }

      // Motion Trail
      const trailGrad = ctx.createLinearGradient(p.x - p.vx * 2, p.y - 22, p.x, p.y);
      trailGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      trailGrad.addColorStop(1, trailColor);
      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(p.x - p.vx * 2, p.y - 22);
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

      // Server Intake Target coordinates (dynamic measurement from serverRef)
      let serverTargetX = width / 2;
      let serverTargetY = height - 120;
      if (serverRef.current && wrapper) {
        const sRect = serverRef.current.getBoundingClientRect();
        const wRect = wrapper.getBoundingClientRect();
        serverTargetX = sRect.left - wRect.left + sRect.width / 2;
        serverTargetY = sRect.top - wRect.top; // exact top intake slot
      }

      // Draw faint routing conduits converging to server intake
      ctx.save();
      ctx.strokeStyle = 'rgba(155, 134, 114, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);

      const leftShieldX = width * 0.22;
      const leftShieldY = getShieldY(leftShieldX);
      ctx.beginPath();
      ctx.moveTo(leftShieldX, leftShieldY);
      ctx.bezierCurveTo(
        leftShieldX, (leftShieldY + serverTargetY) * 0.55,
        serverTargetX - 45, (leftShieldY + serverTargetY) * 0.65,
        serverTargetX - 16, serverTargetY
      );
      ctx.stroke();

      const rightShieldX = width * 0.78;
      const rightShieldY = getShieldY(rightShieldX);
      ctx.beginPath();
      ctx.moveTo(rightShieldX, rightShieldY);
      ctx.bezierCurveTo(
        rightShieldX, (rightShieldY + serverTargetY) * 0.55,
        serverTargetX + 45, (rightShieldY + serverTargetY) * 0.65,
        serverTargetX + 16, serverTargetY
      );
      ctx.stroke();

      const centerShieldY = getShieldY(serverTargetX);
      ctx.beginPath();
      ctx.moveTo(serverTargetX, centerShieldY);
      ctx.lineTo(serverTargetX, serverTargetY);
      ctx.stroke();

      ctx.restore();

      // Update & Draw Packets (All passed packets dynamically steer and merge into server intake)
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
            // Calmer, gentle speed reduction when crossing the shield layer (no sudden speed increase)
            p.vy = Math.max(0.85, Math.min(p.vy * 0.46, 1.25));
            triggerShieldPass(p.x, shieldY);
          }
        }

        // Steer all passed packets smoothly into the server intake port
        if (p.passedShield) {
          const remainingY = Math.max(1, serverTargetY - p.y);
          const distX = serverTargetX - p.x;

          // Required horizontal speed to reach serverTargetX exactly as p.y reaches serverTargetY
          const idealVx = (distX / remainingY) * p.vy;

          // Smooth curved steering towards the server
          p.vx += (idealVx - p.vx) * 0.14;
          p.vx = Math.max(-2.6, Math.min(2.6, p.vx));

          // Gentle vertical speed control (no acceleration, soft glide)
          p.vy = Math.max(0.85, Math.min(p.vy, 1.25));
          if (remainingY < 32) {
            p.vy = Math.max(0.65, p.vy * 0.94);
          }

          // Packet reaches server intake slot -> merge and absorb into server!
          if (p.y >= serverTargetY - 4) {
            if (ripplesRef.current.length < 24) {
              ripplesRef.current.push({
                x: serverTargetX,
                y: serverTargetY,
                radius: 3,
                maxRadius: 28,
                life: 0.85,
                color: '198, 138, 44',
              });
            }
            packetsRef.current.splice(i, 1);
            continue;
          }
        }

        drawPacketPill(p, serverTargetY);
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

      animationFrameId = requestAnimationFrame(render);
    }

    // Seed initial packet rain (gentle, non-crowded start)
    for (let i = 0; i < 8; i++) {
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
          {/* Professional Swiss-Geometric Architectural Display Title in Archivo */}
          <h1
            style={{
              fontFamily: '"Archivo", "Plus Jakarta Sans", var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontSize: 'clamp(56px, 7.8vw, 92px)',
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: '-0.045em',
              color: '#1C1B18',
              background: 'linear-gradient(180deg, #181512 20%, #2A251F 70%, #524A3E 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 auto 16px',
              textAlign: 'center',
              filter: 'drop-shadow(0 2px 24px rgba(28, 27, 24, 0.08))',
            }}
          >
            Rate Limiter
          </h1>

          {/* Clean Subtitle with Increased Font Weight */}
          <p
            style={{
              margin: '0 auto 28px',
              fontSize: 'clamp(16px, 1.8vw, 18.5px)',
              fontWeight: 600,
              color: '#34312A',
              maxWidth: '560px',
              lineHeight: 1.55,
              textAlign: 'center',
              letterSpacing: '-0.012em',
            }}
          >
            Stop traffic spikes and abusive bursts before they reach your backend.
          </p>

          {/* Attractive High-Contrast Action CTAs */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            {/* Primary Button */}
            <Link
              to="/auth?mode=signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#181715',
                color: '#FAF8F5',
                padding: '13px 26px',
                borderRadius: '6px',
                fontSize: '14.5px',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                textDecoration: 'none',
                boxShadow: '0 1px 0 rgba(255, 255, 255, 0.16) inset, 0 4px 16px rgba(24, 23, 21, 0.22), 0 1px 3px rgba(24, 23, 21, 0.12)',
                transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2B2823';
                e.currentTarget.style.transform = 'translateY(-1.5px)';
                e.currentTarget.style.boxShadow = '0 1px 0 rgba(255, 255, 255, 0.2) inset, 0 6px 22px rgba(24, 23, 21, 0.28)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#181715';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 0 rgba(255, 255, 255, 0.16) inset, 0 4px 16px rgba(24, 23, 21, 0.22), 0 1px 3px rgba(24, 23, 21, 0.12)';
              }}
            >
              <span>Get Started Free</span>
              <ArrowRight size={14} />
            </Link>

            {/* Attractive Burst Simulation Trigger */}
            <button
              type="button"
              onClick={triggerBurstWave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FAF8F5',
                color: '#1C1B18',
                border: '1px solid #D4CEBF',
                padding: '12.5px 22px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                cursor: 'pointer',
                transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 2px 8px rgba(28, 27, 24, 0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#C68A2C';
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.transform = 'translateY(-1.5px)';
                e.currentTarget.style.boxShadow = '0 4px 18px rgba(198, 138, 44, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#D4CEBF';
                e.currentTarget.style.background = '#FAF8F5';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(28, 27, 24, 0.05)';
              }}
            >
              <Zap size={14} style={{ color: '#C68A2C', fill: '#C68A2C' }} />
              <span>Test Traffic Burst</span>
            </button>
          </div>

          {/* Interactive Traffic Simulation Mode Switcher (Sleek Floating Pill Bar) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '20px',
              padding: '4px 6px',
              background: 'rgba(251, 249, 245, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid #DCD7CD',
              borderRadius: '9999px',
              boxShadow: '0 2px 10px rgba(28, 27, 24, 0.05)',
            }}
          >
            <span
              style={{
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#8C887F',
                padding: '0 8px 0 10px',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              SIMULATION:
            </span>
            {[
              { id: 'normal', label: 'Normal Flow', dot: '#2D8A4E' },
              { id: 'burst', label: 'Traffic Burst', dot: '#D96B27' },
              { id: 'attack', label: 'Bot Attack Spike', dot: '#A83B2B' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setTrafficMode(m.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 13px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: trafficMode === m.id ? '#1C1B18' : 'transparent',
                  color: trafficMode === m.id ? '#FAF8F5' : '#5F5C55',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: trafficMode === m.id ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: trafficMode === m.id ? '0 2px 8px rgba(28, 27, 24, 0.18)' : 'none',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background:
                      trafficMode === m.id
                        ? m.id === 'attack'
                          ? '#FF8A80'
                          : m.id === 'burst'
                          ? '#FFD591'
                          : '#72F1B8'
                        : m.dot,
                  }}
                />
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================================
            BOTTOM ZONE: EXACT 3-TIER SERVER STACK (WARM LIMESTONE GLASSMORPHISM)
            Frosted translucent glass, warm amber hairlines (no black borders),
            Amber gold glowing emitters (no green), clean authentic server LCD
            ========================================================================= */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: '88px', // Elevated position ("thoda upar bnaa hlka saa upr")
            marginTop: '10px',
          }}
        >
          {/* Dynamic keyframe animations for warm amber luminescence */}
          <style>{`
            @keyframes liveAmberLed {
              0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 14px rgba(198, 138, 44, 0.85), 0 0 4px #F5A623;
              }
              50% {
                transform: scale(1.1);
                box-shadow: 0 0 22px rgba(198, 138, 44, 1), 0 0 7px #F5A623;
              }
            }
            @keyframes liveChampagneLed {
              0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 10px rgba(229, 192, 123, 0.75);
              }
              50% {
                transform: scale(1.08);
                box-shadow: 0 0 16px rgba(229, 192, 123, 0.95);
              }
            }
            @keyframes glassServerGlow {
              0%, 100% {
                filter: drop-shadow(0 4px 18px rgba(198, 138, 44, 0.12));
              }
              50% {
                filter: drop-shadow(0 6px 28px rgba(198, 138, 44, 0.26));
              }
            }
          `}</style>

          <div
            ref={serverRef}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              animation: 'glassServerGlow 3.5s ease-in-out infinite',
            }}
          >
            {/* Luminous Warm Floor Aura (Amber Gold & Warm Limestone) */}
            <div
              style={{
                position: 'absolute',
                bottom: '-18px',
                width: '320px',
                height: '56px',
                background:
                  'radial-gradient(ellipse at 50% 50%, rgba(198, 138, 44, 0.28) 0%, rgba(245, 242, 235, 0.5) 45%, transparent 75%)',
                filter: 'blur(20px)',
                pointerEvents: 'none',
              }}
            />

            {/* 3 Stacked Server Units (1:1 visual match with user blueprint, styled with warm glassmorphism) */}
            {[
              {
                id: 'srv-1',
                label: 'SRV-01 · ACTIVE',
                dot1: '#C68A2C',
                dot2: '#E5C07B',
                anim1: 'liveAmberLed 2.2s infinite',
                anim2: 'liveChampagneLed 1.8s infinite',
                glow1: '0 0 14px rgba(198, 138, 44, 0.85), 0 0 4px #F5A623',
                glow2: '0 0 10px rgba(229, 192, 123, 0.75)',
              },
              {
                id: 'srv-2',
                label: 'SRV-02 · SYNC',
                dot1: '#C68A2C',
                dot2: '#E5C07B',
                anim1: 'liveAmberLed 2.5s infinite',
                anim2: 'liveChampagneLed 2.1s infinite',
                glow1: '0 0 14px rgba(198, 138, 44, 0.85), 0 0 4px #F5A623',
                glow2: '0 0 10px rgba(229, 192, 123, 0.75)',
              },
              {
                id: 'srv-3',
                label: 'SRV-03 · SHIELDED',
                dot1: '#C68A2C',
                dot2: '#8C887F',
                anim1: 'liveAmberLed 2.4s infinite',
                anim2: 'none',
                glow1: '0 0 14px rgba(198, 138, 44, 0.85), 0 0 4px #F5A623',
                glow2: 'inset 0 1px 2px rgba(255, 255, 255, 0.4)',
              },
            ].map((unit, idx) => (
              <div
                key={unit.id}
                style={{
                  width: 'clamp(230px, 26vw, 275px)',
                  height: '56px',
                  borderRadius: '14px',
                  background:
                    'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(251, 249, 245, 0.72) 48%, rgba(240, 236, 227, 0.6) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1.2px solid rgba(212, 206, 191, 0.9)',
                  borderTop: '1.5px solid rgba(255, 255, 255, 0.95)',
                  boxShadow:
                    'inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(198, 138, 44, 0.05), 0 8px 24px rgba(28, 27, 24, 0.04), 0 2px 6px rgba(28, 27, 24, 0.03)',
                  padding: '0 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transition: 'all 200ms ease',
                }}
              >
                {/* Top Unit Translucent Amber Waveguide Intake (Where incoming requests physically enter) */}
                {idx === 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '64px',
                      height: '6px',
                      background:
                        'linear-gradient(180deg, rgba(198, 138, 44, 0.95) 0%, rgba(251, 249, 245, 0.8) 100%)',
                      borderRadius: '4px 4px 0 0',
                      border: '1px solid rgba(198, 138, 44, 0.6)',
                      borderBottom: 'none',
                      boxShadow: '0 -4px 16px rgba(198, 138, 44, 0.5)',
                      backdropFilter: 'blur(8px)',
                    }}
                  />
                )}

                {/* Left Translucent Frosted Glass Display Slot */}
                <div
                  style={{
                    width: '56%',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.62)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1.2px solid rgba(212, 206, 191, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    boxShadow:
                      'inset 0 1px 3px rgba(28, 27, 24, 0.04), 0 0 10px rgba(198, 138, 44, 0.12)',
                    gap: '7px',
                  }}
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: '#C68A2C',
                      boxShadow: '0 0 8px rgba(198, 138, 44, 0.8)',
                      animation: 'liveAmberLed 1.8s infinite',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: '#2B2823',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {unit.label}
                  </span>
                </div>

                {/* Right Dual Luminous Glowing LEDs (UI Colors: Amber Gold & Warm Champagne) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Status LED 1 (Amber Gold) */}
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: unit.dot1,
                      boxShadow: unit.glow1,
                      animation: unit.anim1,
                      border: '1px solid rgba(255, 255, 255, 0.85)',
                      display: 'inline-block',
                    }}
                  />
                  {/* Status LED 2 (Champagne / Muted Stone) */}
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: unit.dot2,
                      boxShadow: unit.glow2,
                      animation: unit.anim2,
                      border: '1px solid rgba(255, 255, 255, 0.75)',
                      display: 'inline-block',
                    }}
                  />
                </div>
              </div>
            ))}
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
