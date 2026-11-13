import { useRef, useState, useCallback } from 'react';

/**
 * SpotlightCard (React Bits Inspired)
 * High-end interactive card with cursor-following radial spotlight,
 * subtle border glow, and optional gentle 3D parallax tilt.
 */
export default function SpotlightCard({
  children,
  className = '',
  style = {},
  spotlightColor = 'rgba(198, 138, 44, 0.12)', // warm champagne/amber glow
  borderColor = 'rgba(198, 138, 44, 0.35)',
  baseBackground = '#FBF9F5',
  baseBorder = '1px solid #DCD7CD',
  tilt = false,
  onClick = null,
}) {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (tilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -3.5; // max -3.5 to 3.5 deg
      const rotateY = ((x - centerX) / centerX) * 3.5;
      setTiltStyle({ rotateX, rotateY });
    }
  }, [tilt]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (tilt) {
      setTiltStyle({ rotateX: 0, rotateY: 0 });
    }
  };

  return (
    <div
      ref={cardRef}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        background: baseBackground,
        border: baseBorder,
        borderRadius: '3px',
        overflow: 'hidden',
        transition: tilt
          ? 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 300ms ease, border-color 300ms ease'
          : 'box-shadow 300ms ease, border-color 300ms ease',
        transform: tilt && isHovered
          ? `perspective(1000px) rotateX(${tiltStyle.rotateX}deg) rotateY(${tiltStyle.rotateY}deg) translateY(-2px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        boxShadow: isHovered
          ? '0 16px 36px -12px rgba(28, 27, 24, 0.08), 0 0 0 1px rgba(198, 138, 44, 0.2)'
          : '0 4px 16px rgba(28, 27, 24, 0.03)',
        ...style,
      }}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 300ms ease',
          background: `radial-gradient(420px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor}, transparent 75%)`,
          zIndex: 1,
        }}
      />

      {/* Dynamic Border Shimmer Glow Layer */}
      <div
        style={{
          position: 'absolute',
          inset: '-1px',
          borderRadius: 'inherit',
          pointerEvents: 'none',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 300ms ease',
          background: `radial-gradient(240px circle at ${mousePos.x}px ${mousePos.y}px, ${borderColor}, transparent 65%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          padding: '1px',
          zIndex: 2,
        }}
      />

      {/* Card Inner Content */}
      <div style={{ position: 'relative', zIndex: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}
