export default function BrandLogo({ size = 20, showWordmark = true, fontSize = '14.5px', dark = false }) {
  const ink = dark ? '#F5F2EB' : '#1C1B18';
  const accent = dark ? '#D46A5B' : '#A83B2B';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '9px',
        color: ink,
        lineHeight: 1,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ display: 'block', flexShrink: 0 }}
      >
        <rect x="3" y="4.5" width="18" height="3.2" rx="0.7" fill={ink} />
        <rect x="3" y="10.4" width="10.5" height="3.2" rx="0.7" fill={ink} />
        <rect x="15.8" y="10.4" width="5.2" height="3.2" rx="0.7" fill={accent} />
        <rect x="3" y="16.3" width="14" height="3.2" rx="0.7" fill={ink} />
      </svg>
      {showWordmark && (
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize,
            fontWeight: 600,
            letterSpacing: '-0.025em',
            color: ink,
          }}
        >
          LimitX
        </span>
      )}
    </span>
  );
}
