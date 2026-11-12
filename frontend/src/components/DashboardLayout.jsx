import { Link, useNavigate, useLocation } from 'react-router-dom';
import { clearToken } from '../api';
import { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, ChevronDown, LogOut } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function DashboardLayout({ user, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isOverview = location.pathname === '/overview';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  function handleLogout() {
    if (window.__limitxLogout) {
      window.__limitxLogout();
    }
    clearToken();
    navigate('/');
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const initials = user?.email
    ? user.email.split('@')[0].slice(0, 2).toUpperCase()
    : 'DEV';

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        background: '#F5F2EB',
        color: '#1C1B18',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Warm Swiss Editorial Top Bar */}
      <header
        style={{
          background: 'rgba(245, 242, 235, 0.92)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '1px solid #DCD7CD',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 24px',
            height: '66px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '36px', minWidth: 0 }}>
            <Link
              to="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <BrandLogo size={24} fontSize="18px" />
            </Link>

            <nav style={{ display: 'flex', gap: '28px', fontSize: '14.5px', height: '66px' }}>
              <Link
                to="/dashboard"
                style={{
                  height: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: !isOverview ? '#1C1B18' : '#5F5C55',
                  fontWeight: !isOverview ? 500 : 400,
                  borderBottom: !isOverview ? '2px solid #1C1B18' : '2px solid transparent',
                  textDecoration: 'none',
                }}
              >
                Projects
              </Link>
              <Link
                to="/overview"
                style={{
                  height: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: isOverview ? '#1C1B18' : '#5F5C55',
                  fontWeight: isOverview ? 500 : 400,
                  borderBottom: isOverview ? '2px solid #1C1B18' : '2px solid transparent',
                  textDecoration: 'none',
                }}
              >
                Overview
              </Link>
            </nav>
          </div>

          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                color: '#4A4843',
                cursor: 'pointer',
                background: showUserMenu ? '#FBF9F5' : 'transparent',
                border: showUserMenu ? '1px solid #DCD7CD' : '1px solid transparent',
                borderRadius: '2px',
                padding: '4px 8px',
              }}
            >
              <span
                style={{
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {user?.email || 'developer'}
              </span>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '0px',
                  background: '#22211E',
                  color: '#FBF9F5',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: '500 11.5px var(--font-sans)',
                }}
              >
                {initials}
              </span>
              <ChevronDown size={13} color="#5F5C55" />
            </button>

            {showUserMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  width: '228px',
                  backgroundColor: '#FBF9F5',
                  border: '1px solid #DCD7CD',
                  borderRadius: '2px',
                  boxShadow: '0 14px 32px rgba(28, 27, 24, 0.1)',
                  zIndex: 200,
                  padding: '6px',
                }}
              >
                <div style={{ padding: '10px 10px 9px', borderBottom: '1px solid #EAE6DD', fontSize: '12px', color: '#5F5C55' }}>
                  <div style={{ fontWeight: 500, color: '#1C1B18', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                    {user?.email}
                  </div>
                  <div style={{ marginTop: '2px', fontSize: '11.5px', color: '#8C887F' }}>
                    Signed in
                  </div>
                </div>
                <Link
                  to="/"
                  onClick={() => setShowUserMenu(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    fontSize: '13px',
                    color: '#4A4843',
                    textDecoration: 'none',
                    borderRadius: '2px',
                    marginTop: '4px',
                  }}
                >
                  <span>Home</span>
                  <ArrowUpRight size={13} color="#8C887F" />
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'flex-start',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '13px',
                    color: '#A83B2B',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    marginTop: '2px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9ECEA')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
