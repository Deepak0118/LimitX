import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

/**
 * ComparisonSlider (React Bits Pro Inspired)
 * Elegant Before & After slider tailored to LimitX's warm limestone & obsidian palette.
 */
export default function ComparisonSlider({
  before,
  after,
  defaultPosition = 50,
  beforeLabel = 'WITHOUT LIMITX',
  afterLabel = 'WITH LIMITX',
  className = '',
  style = {},
  handleColor = '#C68A2C',
}) {
  const [sliderPosition, setSliderPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const updatePosition = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handleTouchStart = useCallback((e) => {
    setIsDragging(true);
    if (e.touches && e.touches[0]) {
      updatePosition(e.touches[0].clientX);
    }
  }, [updatePosition]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      if (e.touches && e.touches[0]) {
        updatePosition(e.touches[0].clientX);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, updatePosition]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: isDragging ? 'ew-resize' : 'default',
        borderRadius: '3px',
        border: '1px solid #DCD7CD',
        boxShadow: '0 4px 20px rgba(28, 27, 24, 0.06)',
        background: '#FAF8F5',
        touchAction: 'none',
        ...style,
      }}
    >
      {/* ===================================================================
          LAYER 1: AFTER CONTENT ("WITH LIMITX" - BACKGROUND)
          =================================================================== */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      >
        {after}
      </div>

      {/* ===================================================================
          LAYER 2: BEFORE CONTENT ("WITHOUT LIMITX" - CLIPPED FOREGROUND)
          =================================================================== */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
          WebkitClipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
          pointerEvents: 'none',
        }}
      >
        {before}
      </div>

      {/* ===================================================================
          FLOATING WARM LABELS (WITHOUT vs WITH)
          =================================================================== */}
      {/* Before Label (Left) */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          padding: '5px 12px',
          borderRadius: '2px',
          background: '#FAF8F5',
          border: '1px solid #E8C4BE',
          color: '#C64835',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          pointerEvents: 'none',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          opacity: sliderPosition > 12 ? 1 : 0,
          transition: 'opacity 150ms ease',
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C64835' }} />
        <span>{beforeLabel}</span>
      </div>

      {/* After Label (Right) */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          padding: '5px 12px',
          borderRadius: '2px',
          background: '#FAF8F5',
          border: '1px solid #CBE8D5',
          color: '#2D8A4E',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          pointerEvents: 'none',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          opacity: sliderPosition < 88 ? 1 : 0,
          transition: 'opacity 150ms ease',
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2D8A4E' }} />
        <span>{afterLabel}</span>
      </div>

      {/* ===================================================================
          DRAGGABLE DIVIDER LINE & TACTILE HANDLE
          =================================================================== */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${sliderPosition}%`,
          width: '2px',
          transform: 'translateX(-50%)',
          background: handleColor,
          boxShadow: `0 0 10px rgba(198, 138, 44, 0.4)`,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        {/* Center Pill Grab Handle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#FAF8F5',
            border: `2px solid ${handleColor}`,
            boxShadow: '0 2px 12px rgba(28, 27, 24, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'ew-resize',
            pointerEvents: 'auto',
            transition: 'transform 150ms ease, box-shadow 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
          }}
        >
          <ChevronsLeftRight size={16} color="#1C1B18" strokeWidth={2.4} />
        </div>
      </div>

      {/* Subtle Hint Overlay at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '4px 14px',
          borderRadius: '12px',
          background: 'rgba(250, 248, 245, 0.95)',
          border: '1px solid #DCD7CD',
          color: '#6E6B64',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.04em',
          pointerEvents: 'none',
          zIndex: 6,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>&larr; Drag handle to compare &rarr;</span>
      </div>
    </div>
  );
}