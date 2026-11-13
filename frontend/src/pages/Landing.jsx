import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import HeroPrecisionStage from '../components/HeroPrecisionStage';
import UrlSwapStage from '../components/UrlSwapStage';
import WhyLimitXStage from '../components/WhyLimitXStage';
import AlgorithmShowcase from '../components/AlgorithmShowcase';
import ScrollRevealStage from '../components/ui/ScrollRevealStage';
import ScrollKiteTrail from '../components/ui/ScrollKiteTrail';

export default function Landing() {
  const scrollToSetup = (e) => {
    if (e) e.preventDefault();
    const target = document.getElementById('integration');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EB', color: '#1C1B18', position: 'relative', overflowX: 'hidden' }}>
      {/* GSAP-Style Scroll Scrubbed Kite & Motion Ribbon Guide */}
      <ScrollKiteTrail />

      {/* Permanent Fixed / Sticky Frosted Glass Top Navbar */}
      <header
        className="lx-nav"
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(245, 242, 235, 0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #DCD7CD',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div className="lx-nav-inner" style={{ maxWidth: '1360px', width: '100%', margin: '0 auto', padding: '0 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            <BrandLogo size={26} fontSize="19px" dark={false} />
          </Link>

          <nav className="lx-nav-links" aria-label="Landing navigation" style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <a
              href="#overview"
              style={{
                fontSize: '14.5px',
                fontWeight: 500,
                color: '#1C1B18',
                textDecoration: 'none',
                transition: 'opacity 160ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.65')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Product
            </a>
            <a
              href="#integration"
              onClick={scrollToSetup}
              style={{
                fontSize: '14.5px',
                fontWeight: 500,
                color: '#1C1B18',
                textDecoration: 'none',
                transition: 'opacity 160ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.65')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              How it Works
            </a>
            <a
              href="#why-limitx"
              style={{
                fontSize: '14.5px',
                fontWeight: 500,
                color: '#1C1B18',
                textDecoration: 'none',
                transition: 'opacity 160ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.65')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Features
            </a>
            <a
              href="#integration"
              onClick={scrollToSetup}
              style={{
                fontSize: '14.5px',
                fontWeight: 500,
                color: '#1C1B18',
                textDecoration: 'none',
                transition: 'opacity 160ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.65')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Docs
            </a>
            <a
              href="#algorithms"
              style={{
                fontSize: '14.5px',
                fontWeight: 500,
                color: '#1C1B18',
                textDecoration: 'none',
                transition: 'opacity 160ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.65')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Algorithms
            </a>
            <Link
              to="/auth?mode=login"
              style={{
                fontSize: '14.5px',
                fontWeight: 500,
                color: '#1C1B18',
                textDecoration: 'none',
              }}
            >
              Log in
            </Link>
            <Link
              to="/auth?mode=signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '2px',
                background: '#1C1B18',
                color: '#FAF8F5',
                fontSize: '13.5px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 160ms ease',
                boxShadow: '0 2px 8px rgba(28, 27, 24, 0.12)',
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
              Get Started <ArrowRight size={13} />
            </Link>
          </nav>
        </div>
      </header>

      {/* Band 1: Precision Edge Gateway Hero Stage (Original Hero Restored) */}
      <HeroPrecisionStage onOpenSetup={scrollToSetup} />

      {/* Band 2: 1-Step URL Swap Integration Section */}
      <section
        id="integration"
        style={{
          background: '#F5F2EB',
          backgroundImage: 'radial-gradient(#DCD7CD 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          borderTop: '1px solid #DCD7CD',
          padding: '104px 24px 96px',
          scrollMarginTop: '68px',
        }}
      >
        <ScrollRevealStage mode="rise">
          <div style={{ maxWidth: '1120px', width: '100%', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <h2 style={{ margin: '0 0 10px', fontSize: 'clamp(28px, 3.4vw, 40px)', fontWeight: 400, letterSpacing: '-0.025em', color: '#1C1B18' }}>
                Live in one URL swap.
              </h2>
              <p style={{ margin: '0 auto', fontSize: '15.5px', color: '#4A4843', lineHeight: 1.6, maxWidth: '540px' }}>
                No SDKs to install, no middleware to wire up, and no backend redeploy when limits change.
              </p>
            </div>

            <UrlSwapStage />
          </div>
        </ScrollRevealStage>
      </section>

      {/* Band 3: Apple-Style Expanding Horizontal Panels (Warm Limestone + Scroll Depth Rise) */}
      <section
        id="why-limitx"
        style={{
          background: '#E6E2D9',
          borderTop: '1px solid #DCD7CD',
          borderBottom: '1px solid #DCD7CD',
        }}
      >
        <ScrollRevealStage mode="rise">
          <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '92px 24px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h2
                style={{
                  margin: '0 0 10px',
                  fontSize: 'clamp(28px, 3.4vw, 40px)',
                  fontWeight: 400,
                  letterSpacing: '-0.025em',
                  color: '#1C1B18',
                }}
              >
                Protect your server, your users, and your bill.
              </h2>
              <p style={{ margin: 0, fontSize: '15.5px', color: '#4A4843', maxWidth: '540px', lineHeight: 1.6 }}>
                Four layers of edge defense to keep your origin fast, your database shielded, and your billing predictable.
              </p>
            </div>

            <WhyLimitXStage />
          </div>
        </ScrollRevealStage>
      </section>

      {/* Band 4: Linear-Style Hairline Expandable Index (Warm Stone + Scroll Depth Rise) */}
      <section id="algorithms" style={{ maxWidth: '1080px', margin: '0 auto', padding: '92px 24px', scrollMarginTop: '68px' }}>
        <ScrollRevealStage mode="rise">
          <div style={{ marginBottom: '24px' }}>
            <h2
              style={{
                margin: '0 0 10px',
                fontSize: 'clamp(28px, 3.4vw, 40px)',
                fontWeight: 400,
                letterSpacing: '-0.025em',
                color: '#1C1B18',
              }}
            >
              Three ways to control traffic.
            </h2>
            <p style={{ margin: 0, fontSize: '15.5px', color: '#4A4843', lineHeight: 1.6 }}>
              Compare how Token Bucket, Fixed Window, and Sliding Window mitigate sudden floods in real time.
            </p>
          </div>

          <AlgorithmShowcase />
        </ScrollRevealStage>
      </section>

      {/* Band 5: Mirrored Architectural Closing Framing CTA (Warm Limestone) */}
      <section
        style={{
          background: '#E6E2D9',
          borderTop: '1px solid #DCD7CD',
          borderBottom: '1px solid #DCD7CD',
        }}
      >
        <ScrollRevealStage mode="finale">
          <div style={{ maxWidth: '920px', margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
            <h2
              style={{
                margin: '0 0 14px',
                fontSize: 'clamp(30px, 4vw, 44px)',
                fontWeight: 400,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                color: '#1C1B18',
              }}
            >
              Stop fighting traffic spikes in backend code.
            </h2>
            <p style={{ margin: '0 auto 28px', fontSize: '16px', color: '#4A4843', maxWidth: '460px', lineHeight: 1.6 }}>
              Put your first API behind LimitX in under a minute.
            </p>

            <div style={{ display: 'inline-flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link
                to="/auth?mode=signup"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '12px 22px',
                  borderRadius: '2px',
                  background: '#1C1B18',
                  color: '#FBF9F5',
                  fontSize: '14.5px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Start protecting APIs <ArrowRight size={14} />
              </Link>
              <Link
                to="/auth?mode=login"
                style={{
                  display: 'inline-block',
                  padding: '11px 18px',
                  borderRadius: '2px',
                  border: '1px solid #C9C3B7',
                  background: '#FBF9F5',
                  fontSize: '14.5px',
                  fontWeight: 500,
                  color: '#1C1B18',
                  textDecoration: 'none',
                }}
              >
                Sign in
              </Link>
            </div>
          </div>
        </ScrollRevealStage>
      </section>

      {/* Footer */}
      <footer style={{ background: '#F5F2EB' }}>
        <div
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
            padding: '26px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            fontSize: '13px',
            color: '#5F5C55',
          }}
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <BrandLogo size={18} fontSize="14px" />
          </Link>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <a href="#integration" onClick={scrollToSetup} style={{ color: 'inherit', textDecoration: 'none' }}>Setup</a>
            <a href="#why-limitx" style={{ color: 'inherit', textDecoration: 'none' }}>Why LimitX</a>
            <a href="#algorithms" style={{ color: 'inherit', textDecoration: 'none' }}>Modes</a>
            <Link to="/auth?mode=login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign in</Link>
            <Link to="/auth?mode=signup" style={{ color: '#1C1B18', fontWeight: 500, textDecoration: 'none' }}>Get started &rarr;</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
