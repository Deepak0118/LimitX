import { useState, useEffect, useRef } from 'react';
import { Check, Copy, ArrowRight, ShieldCheck } from 'lucide-react';

const SAMPLE_PROXY_URL = 'https://edge.limitx.io/proxy/api_7f3a9c12';

export default function UrlSwapStage() {
  const [activeTab, setActiveTab] = useState('env'); // 'env' | 'curl' | 'flow'
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const stageRef = useRef(null);

  // Smooth scroll-driven intersection reveal
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const envSnippet = `# Before: direct backend call (unprotected)
- API_BASE_URL="https://api.yourdomain.com"

# After: point client requests to LimitX
+ API_BASE_URL="${SAMPLE_PROXY_URL}"`;

  const curlSnippet = `curl -i -X POST "${SAMPLE_PROXY_URL}/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com"}'`;

  const handleCopy = () => {
    const text = activeTab === 'curl' ? curlSnippet : envSnippet;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      ref={stageRef}
      style={{
        maxWidth: '820px',
        margin: '0 auto',
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
        opacity: isVisible ? 1 : 0,
        transition: 'transform 800ms cubic-bezier(0.16, 1, 0.3, 1), opacity 700ms ease',
      }}
    >
      <style>{`
        @keyframes subtleShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>

      {/* Clean Step Pipeline Indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '28px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 600ms cubic-bezier(0.16, 1, 0.3, 1) 150ms',
        }}
      >
        {[
          { num: '01', text: 'Create API' },
          { num: '02', text: 'Swap API_BASE_URL' },
          { num: '03', text: 'Protected live' },
        ].map((step, idx) => (
          <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: idx === 1 ? '#22211E' : '#FBF9F5',
                color: idx === 1 ? '#FAF8F5' : '#1C1B18',
                border: `1px solid ${idx === 1 ? '#383631' : '#DCD7CD'}`,
                borderRadius: '2px',
                fontSize: '12.5px',
                fontWeight: 500,
                boxShadow: idx === 1 ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: idx === 1 ? '#72F1B8' : '#8C887F', fontWeight: 600 }}>
                {step.num}
              </span>
              <span>{step.text}</span>
            </div>
            {idx < 2 && <ArrowRight size={13} color="#8C887F" style={{ opacity: 0.6 }} />}
          </div>
        ))}
      </div>

      {/* Single Clean, Focused Terminal Card */}
      <div
        style={{
          background: '#22211E',
          color: '#FAF8F5',
          border: '1px solid #383631',
          borderRadius: '3px',
          textAlign: 'left',
          boxShadow: '0 20px 48px -20px rgba(28, 27, 24, 0.28)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Subtle animated top border highlight */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(114, 241, 184, 0.45), transparent)',
            backgroundSize: '200% 100%',
            animation: 'subtleShimmer 4s infinite linear',
          }}
        />

        {/* Terminal Header */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid #35332F',
            background: '#1D1C19',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Window Dots & Tabs */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#E06C75' }} />
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#E5C07B' }} />
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#98C379' }} />
            </div>

            <div style={{ display: 'inline-flex', gap: '4px', marginLeft: '6px' }}>
              {[
                { id: 'env', label: '.env swap' },
                { id: 'curl', label: 'Test cURL' },
                { id: 'flow', label: 'Traffic path' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '4px 10px',
                    background: activeTab === tab.id ? '#35332F' : 'transparent',
                    color: activeTab === tab.id ? '#FAF8F5' : '#8C887F',
                    border: activeTab === tab.id ? '1px solid #4A4741' : '1px solid transparent',
                    borderRadius: '2px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: 1-Click Copy */}
          {activeTab !== 'flow' && (
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '4px 10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid #4A4741',
                color: '#FAF8F5',
                borderRadius: '2px',
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'background 160ms ease',
              }}
            >
              {copied ? <Check size={12} color="#72F1B8" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>

        {/* Terminal Body */}
        <div style={{ padding: '24px 22px' }}>
          {activeTab === 'flow' ? (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                {[
                  { step: '01', title: 'Client App', sub: 'Calls /proxy/:apiId/*' },
                  { step: '02', title: 'LimitX Edge Gateway', sub: 'In-memory rate check (<0.4ms)' },
                  { step: '03', title: 'Your Origin Server', sub: 'Receives verified traffic only' },
                ].map((node, i) => (
                  <div
                    key={node.step}
                    style={{
                      padding: '14px 16px',
                      background: i === 1 ? '#2E2B26' : '#272622',
                      border: `1px solid ${i === 1 ? '#2D8A4E' : '#3D3B37'}`,
                      borderRadius: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: i === 1 ? '#72F1B8' : '#FAF8F5' }}>
                        {node.title}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#8C887F' }}>
                        {node.step}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#A5A096', lineHeight: 1.4 }}>{node.sub}</div>
                  </div>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#8C887F', textAlign: 'center' }}>
                Requests that exceed configured limits are dropped at the edge before ever reaching your server.
              </p>
            </div>
          ) : (
            <pre
              style={{
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                lineHeight: 1.75,
                color: '#FAF8F5',
                whiteSpace: 'pre-wrap',
                overflowX: 'auto',
              }}
            >
              {activeTab === 'env' && (
                <>
                  <span style={{ color: '#8C887F' }}># Before: direct backend call (unprotected)</span>{'\n'}
                  <span style={{ color: '#FF8A80' }}>- API_BASE_URL=&quot;https://api.yourdomain.com&quot;</span>{'\n\n'}
                  <span style={{ color: '#8C887F' }}># After: point client requests to LimitX proxy</span>{'\n'}
                  <span style={{ color: '#72F1B8', fontWeight: 600 }}>+ API_BASE_URL=&quot;{SAMPLE_PROXY_URL}&quot;</span>
                </>
              )}
              {activeTab === 'curl' && (
                <>
                  <span style={{ color: '#FFD591' }}>curl -i -X POST &quot;{SAMPLE_PROXY_URL}/auth/login&quot;</span>{' \\\n'}
                  <span style={{ color: '#A5A096' }}>  -H &quot;Content-Type: application/json&quot;</span>{' \\\n'}
                  <span style={{ color: '#72F1B8' }}>  -d &apos;{JSON.stringify({ email: 'user@example.com' })}&apos;</span>
                </>
              )}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
