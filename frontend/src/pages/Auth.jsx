import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, setToken } from '../api';
import { ArrowRight, Eye, EyeOff, Loader } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import VaultLockerAuth from '../components/VaultLockerAuth';

const OAUTH_ERRORS = {
  access_denied: 'Google sign-in was cancelled.',
  email_unverified: 'Your Google account email must be verified to sign in.',
  google_not_configured: 'Google sign-in is not configured on this server yet.',
  account_conflict: 'This email is already linked to a different Google account.',
  invalid_state: 'Google sign-in session expired. Please try again.',
  token_exchange_failed: 'Could not complete Google sign-in. Please try again.',
  userinfo_failed: 'Could not read your Google profile. Please try again.',
  oauth_failed: 'Google sign-in failed. Please try again.',
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(null);
  const [oauthBusy, setOauthBusy] = useState(Boolean(searchParams.get('oauth_code')));
  const handledCodeRef = useRef('');

  useEffect(() => {
    let cancelled = false;
    api('/auth/providers')
      .then((res) => {
        if (!cancelled) setGoogleEnabled(Boolean(res?.google));
      })
      .catch(() => {
        if (!cancelled) setGoogleEnabled(false);
      });
    const handlePageShow = (e) => {
      if (e.persisted) setOauthBusy(false);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      cancelled = true;
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  useEffect(() => {
    const oauthError = searchParams.get('oauth_error');
    const oauthCode = searchParams.get('oauth_code');

    if (oauthError) {
      setError(OAUTH_ERRORS[oauthError] || OAUTH_ERRORS.oauth_failed);
      setOauthBusy(false);
      navigate(`/auth?mode=${mode}`, { replace: true });
      return;
    }

    if (oauthCode && handledCodeRef.current !== oauthCode) {
      handledCodeRef.current = oauthCode;
      setError('');
      setOauthBusy(true);

      api('/auth/google/exchange', { method: 'POST', body: { code: oauthCode } })
        .then((data) => {
          setToken(data.token);
          if (window.__limitxLogin) {
            window.__limitxLogin(data.user);
          }
          navigate('/dashboard', { replace: true });
        })
        .catch((err) => {
          setError(err.message || OAUTH_ERRORS.oauth_failed);
          setOauthBusy(false);
          navigate(`/auth?mode=${mode}`, { replace: true });
        });
    }
  }, [searchParams, mode, navigate]);

  function handleGoogleAuth() {
    setError('');
    if (googleEnabled === false) {
      setError(
        import.meta.env.DEV
          ? 'Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env.'
          : 'Google sign-in is currently unavailable. Please sign in with email and password.',
      );
      return;
    }
    setOauthBusy(true);
    window.location.assign(`/api/auth/google?mode=${mode}`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: form });
      setToken(data.token);

      if (window.__limitxLogin) {
        window.__limitxLogin(data.user);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || (mode === 'login' ? 'Wrong email or password. Try again.' : 'Could not create account. Try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        background: '#F5F2EB',
        color: '#1C1B18',
        fontSize: '15px',
        minHeight: '100vh',
        display: 'flex',
        flexWrap: 'wrap',
      }}
    >
      {/* Left Column: Warm Limestone Editorial Architecture */}
      <div
        style={{
          flex: '1 1 440px',
          background: '#E6E2D9',
          borderRight: '1px solid #DCD7CD',
          padding: '32px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '48px',
          minHeight: '460px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            <BrandLogo size={20} fontSize="15px" />
          </Link>

          <Link
            to="/"
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#5F5C55',
            }}
          >
            Back to home &rarr;
          </Link>
        </div>

        <div style={{ maxWidth: '460px' }}>
          <h1
            style={{
              margin: '0 0 16px',
              fontSize: 'clamp(34px, 4vw, 44px)',
              lineHeight: 1.06,
              letterSpacing: '-0.03em',
              fontWeight: 400,
              color: '#1C1B18',
            }}
          >
            {mode === 'login' ? (
              <>
                Manage your proxy routes.
                <br />
                Inspect live traffic.
              </>
            ) : (
              <>
                Protect your API routes
                <br />
                in under a minute.
              </>
            )}
          </h1>
          <p style={{ margin: '0 0 24px', color: '#4A4843', fontSize: '15px', lineHeight: 1.6 }}>
            Set up proxy URLs, per-route rate limits, IP blocklists, and live request logs from one dashboard.
          </p>

          {/* Interactive Bank Safe Rate-Vault Locker */}
          <VaultLockerAuth
            mode={mode}
            email={form.email}
            password={form.password}
            loading={loading || oauthBusy}
            error={error}
          />

          <div style={{ borderTop: '1px solid #CFC9BC' }}>
            {[
              { k: 'Proxy endpoint', v: '/proxy/:apiId/*', mono: true },
              { k: 'Algorithms', v: 'Token Bucket · Fixed · Sliding' },
              { k: 'IP blocklist', v: 'Per-service instant 403 blocklist' },
              { k: 'Traffic control', v: '1-click Pause / Resume & Logs' },
            ].map((spec) => (
              <div
                key={spec.k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px 0',
                  borderBottom: '1px solid #CFC9BC',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: '#5F5C55' }}>{spec.k}</span>
                <span
                  style={{
                    color: '#1C1B18',
                    fontWeight: 500,
                    textAlign: 'right',
                    fontFamily: spec.mono ? 'var(--font-mono)' : undefined,
                    fontSize: spec.mono ? '12.5px' : undefined,
                  }}
                >
                  {spec.v}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            fontSize: '12.5px',
            color: '#5F5C55',
          }}
        >
          <span>LimitX Gateway</span>
          <span>No backend code changes needed</span>
        </div>
      </div>

      {/* Right Column: Clean Editorial Ivory Form */}
      <div
        style={{
          flex: '1 1 440px',
          background: '#F5F2EB',
          padding: '32px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            background: '#FBF9F5',
            border: '1px solid #DCD7CD',
            borderRadius: '2px',
            padding: '32px',
          }}
        >
          {/* Mode Switcher */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1px',
              background: '#DCD7CD',
              border: '1px solid #DCD7CD',
              marginBottom: '28px',
            }}
          >
            <Link
              to="/auth?mode=login"
              style={{
                textAlign: 'center',
                padding: '9px 12px',
                fontSize: '13px',
                textDecoration: 'none',
                background: mode === 'login' ? '#22211E' : '#FBF9F5',
                color: mode === 'login' ? '#FBF9F5' : '#4A4843',
                fontWeight: 500,
              }}
            >
              Sign in
            </Link>
            <Link
              to="/auth?mode=signup"
              style={{
                textAlign: 'center',
                padding: '9px 12px',
                fontSize: '13px',
                textDecoration: 'none',
                background: mode === 'signup' ? '#22211E' : '#FBF9F5',
                color: mode === 'signup' ? '#FBF9F5' : '#4A4843',
                fontWeight: 500,
              }}
            >
              Create account
            </Link>
          </div>

          <h2 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 400, letterSpacing: '-0.025em', color: '#1C1B18' }}>
            {mode === 'login' ? 'Sign in to LimitX' : 'Create your account'}
          </h2>
          <p style={{ margin: '0 0 22px', color: '#5F5C55', fontSize: '14px', lineHeight: 1.55 }}>
            {mode === 'login'
              ? 'Use Google or enter your email and password to manage your projects and rate limits.'
              : 'Continue with Google or create an account to manage proxy URLs and per-route limits.'}
          </p>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading || oauthBusy}
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: '#FBF9F5',
              color: '#1C1B18',
              border: '1px solid #DCD7CD',
              borderRadius: '2px',
              fontSize: '13.5px',
              fontWeight: 500,
              cursor: loading || oauthBusy ? 'not-allowed' : 'pointer',
              opacity: loading || oauthBusy ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading && !oauthBusy) e.currentTarget.style.background = '#F2EFE8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FBF9F5';
            }}
          >
            {oauthBusy ? (
              <>
                <Loader size={15} className="spin" />
                <span>Completing Google sign-in...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>{mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}</span>
              </>
            )}
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '18px 0',
              color: '#8C887F',
              fontSize: '12px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: '#EAE6DD' }} />
            <span>or</span>
            <div style={{ flex: 1, height: '1px', background: '#EAE6DD' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="em">
                Email address
              </label>
              <input
                id="em"
                type="email"
                placeholder="name@example.com"
                maxLength={254}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
                disabled={loading || oauthBusy}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="pw" style={{ margin: 0 }}>
                  Password
                </label>
                <span style={{ fontSize: '12px', color: '#8C887F' }}>
                  8–128 characters
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="pw"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                  maxLength={128}
                  disabled={loading || oauthBusy}
                  style={{
                    paddingRight: '40px',
                    borderColor: error ? '#A83B2B' : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    color: '#5F5C55',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: '9px 12px',
                  background: '#F9ECEA',
                  border: '1px solid #E8C4BE',
                  borderRadius: '2px',
                  fontSize: '13px',
                  color: '#A83B2B',
                  marginTop: '14px',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || oauthBusy}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '11px 16px',
                fontSize: '14px',
              }}
            >
              {loading ? (
                <>
                  <Loader size={15} className="spin" />
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign in' : 'Create account'}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: '22px',
              paddingTop: '18px',
              borderTop: '1px solid #EAE6DD',
              fontSize: '13px',
              color: '#5F5C55',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span>{mode === 'login' ? 'New to LimitX?' : 'Already have an account?'}</span>
            <Link
              to={mode === 'login' ? '/auth?mode=signup' : '/auth?mode=login'}
              style={{
                color: '#1C1B18',
                fontWeight: 500,
                fontSize: '13px',
                borderBottom: '1px solid #1C1B18',
                textDecoration: 'none',
                paddingBottom: '1px',
              }}
            >
              {mode === 'login' ? 'Create an account' : 'Sign in instead'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
