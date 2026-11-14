import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, setToken } from '../api';
import { ArrowRight, Eye, EyeOff, Loader, CheckCircle2, X } from 'lucide-react';
import BrandLogo from './BrandLogo';

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

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(null);
  const [oauthBusy, setOauthBusy] = useState(Boolean(searchParams.get('oauth_code')));
  const [focusedField, setFocusedField] = useState(null);
  const handledCodeRef = useRef('');
  const cardRef = useRef(null);

  // Sync mode with initialMode prop when changed
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading && !oauthBusy) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, oauthBusy, onClose]);

  // Check Google OAuth provider availability
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

  // Handle Google OAuth callback code in URL if present
  useEffect(() => {
    const oauthError = searchParams.get('oauth_error');
    const oauthCode = searchParams.get('oauth_code');

    if (oauthError) {
      setError(OAUTH_ERRORS[oauthError] || OAUTH_ERRORS.oauth_failed);
      setOauthBusy(false);
      setSearchParams((params) => {
        params.delete('oauth_error');
        return params;
      });
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
          onClose();
          navigate('/dashboard', { replace: true });
        })
        .catch((err) => {
          setError(err.message || OAUTH_ERRORS.oauth_failed);
          setOauthBusy(false);
          setSearchParams((params) => {
            params.delete('oauth_code');
            return params;
          });
        });
    }
  }, [searchParams, setSearchParams, navigate, onClose]);

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
      const data = await api(`/auth/${mode}`, {
        method: 'POST',
        body: { email: form.email.trim(), password: form.password },
      });
      setToken(data.token);

      if (window.__limitxLogin) {
        window.__limitxLogin(data.user);
      }

      onClose();
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.message ||
          (mode === 'login'
            ? 'Invalid email or password. Please try again.'
            : 'Could not create account. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const isPasswordValid = form.password.length >= 8;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(28, 27, 24, 0.52)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'modalBackdropFade 200ms ease-out forwards',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading && !oauthBusy) {
          onClose();
        }
      }}
    >
      <style>{`
        @keyframes modalBackdropFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes modalSlideUp {
          0% { opacity: 0; transform: translateY(18px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Main Floating Auth Card */}
      <div
        ref={cardRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '430px',
          background: '#FAF8F5',
          border: '1px solid #DCD7CD',
          borderRadius: '14px',
          boxShadow: '0 28px 64px -14px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          animation: 'modalSlideUp 260ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Hairline Amber Highlight */}
        <div
          style={{
            height: '2.5px',
            width: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(198, 138, 44, 0.65), transparent)',
          }}
        />

        {/* Close Button (Top Right) */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading || oauthBusy}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            border: 'none',
            background: 'transparent',
            color: '#1C1B18',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: loading || oauthBusy ? 'not-allowed' : 'pointer',
            transition: 'opacity 150ms ease, transform 150ms ease',
            zIndex: 10,
            padding: 0,
          }}
          onMouseEnter={(e) => {
            if (!loading && !oauthBusy) {
              e.currentTarget.style.opacity = '0.6';
              e.currentTarget.style.transform = 'scale(1.08)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <X size={20} strokeWidth={2.4} color="#1C1B18" />
        </button>

        <div style={{ padding: '32px 32px 28px' }}>
          {/* Card Icon & Header */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              <BrandLogo size={32} showWordmark={false} dark={false} />
            </div>

            <h2
              style={{
                margin: '0 0 6px',
                fontSize: '23px',
                fontWeight: 650,
                letterSpacing: '-0.025em',
                color: '#1C1B18',
                lineHeight: 1.15,
              }}
            >
              {mode === 'login' ? 'Sign in to LimitX' : 'Create your account'}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '13.5px',
                color: '#5F5C55',
                lineHeight: 1.5,
              }}
            >
              {mode === 'login'
                ? 'Welcome back! Please sign in to continue'
                : 'Welcome! Please fill in the details to get started.'}
            </p>
          </div>

          {/* Smooth Linear-Style Segmented Pill Mode Switcher */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px',
              background: '#EAE6DD',
              padding: '4px',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              style={{
                textAlign: 'center',
                padding: '8px 12px',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '6px',
                background: mode === 'login' ? '#1C1B18' : 'transparent',
                color: mode === 'login' ? '#FAF8F5' : '#5F5C55',
                fontWeight: mode === 'login' ? 600 : 500,
                boxShadow: mode === 'login' ? '0 2px 6px rgba(0, 0, 0, 0.12)' : 'none',
                transition: 'all 160ms ease',
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              style={{
                textAlign: 'center',
                padding: '8px 12px',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '6px',
                background: mode === 'signup' ? '#1C1B18' : 'transparent',
                color: mode === 'signup' ? '#FAF8F5' : '#5F5C55',
                fontWeight: mode === 'signup' ? 600 : 500,
                boxShadow: mode === 'signup' ? '0 2px 6px rgba(0, 0, 0, 0.12)' : 'none',
                transition: 'all 160ms ease',
              }}
            >
              Create account
            </button>
          </div>

          {/* One-Click Google OAuth Button */}
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
              padding: '11px 16px',
              background: '#FFFFFF',
              color: '#1C1B18',
              border: '1px solid #D4CEBF',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 500,
              cursor: loading || oauthBusy ? 'not-allowed' : 'pointer',
              opacity: loading || oauthBusy ? 0.7 : 1,
              boxShadow: '0 1px 2px rgba(28, 27, 24, 0.04)',
              transition: 'all 160ms ease',
            }}
            onMouseEnter={(e) => {
              if (!loading && !oauthBusy) {
                e.currentTarget.style.background = '#FBF9F5';
                e.currentTarget.style.borderColor = '#C8C2B5';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(28, 27, 24, 0.08)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = '#D4CEBF';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(28, 27, 24, 0.04)';
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

          {/* Minimal Divider */}
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
            <div style={{ flex: 1, height: '1px', background: '#E5E1D8' }} />
            <span>or</span>
            <div style={{ flex: 1, height: '1px', background: '#E5E1D8' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Optional First & Last Name row in Sign Up mode */}
            {mode === 'signup' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    htmlFor="modal-first-name"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#1C1B18',
                      marginBottom: '5px',
                    }}
                  >
                    <span>First name</span>
                    <span style={{ fontSize: '11px', color: '#8C887F', fontWeight: 400, marginLeft: '5px' }}>
                      Optional
                    </span>
                  </label>
                  <input
                    id="modal-first-name"
                    type="text"
                    placeholder="Alex"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField(null)}
                    disabled={loading || oauthBusy}
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: `1.5px solid ${focusedField === 'firstName' ? '#1C1B18' : '#D4CEBF'}`,
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '13.5px',
                      color: '#1C1B18',
                      outline: 'none',
                      boxShadow:
                        focusedField === 'firstName' ? '0 0 0 3px rgba(28, 27, 24, 0.08)' : '0 1px 2px rgba(28, 27, 24, 0.03)',
                      transition: 'all 160ms ease',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="modal-last-name"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#1C1B18',
                      marginBottom: '5px',
                    }}
                  >
                    <span>Last name</span>
                    <span style={{ fontSize: '11px', color: '#8C887F', fontWeight: 400, marginLeft: '5px' }}>
                      Optional
                    </span>
                  </label>
                  <input
                    id="modal-last-name"
                    type="text"
                    placeholder="Rivera"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField(null)}
                    disabled={loading || oauthBusy}
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: `1.5px solid ${focusedField === 'lastName' ? '#1C1B18' : '#D4CEBF'}`,
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '13.5px',
                      color: '#1C1B18',
                      outline: 'none',
                      boxShadow:
                        focusedField === 'lastName' ? '0 0 0 3px rgba(28, 27, 24, 0.08)' : '0 1px 2px rgba(28, 27, 24, 0.03)',
                      transition: 'all 160ms ease',
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="modal-email"
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#1C1B18',
                  marginBottom: '5px',
                }}
              >
                Email address
              </label>
              <input
                id="modal-email"
                type="email"
                placeholder="developer@company.com"
                maxLength={254}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                disabled={loading || oauthBusy}
                style={{
                  width: '100%',
                  background: '#FFFFFF',
                  border: `1.5px solid ${focusedField === 'email' ? '#1C1B18' : '#D4CEBF'}`,
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13.5px',
                  color: '#1C1B18',
                  outline: 'none',
                  boxShadow:
                    focusedField === 'email' ? '0 0 0 3px rgba(28, 27, 24, 0.08)' : '0 1px 2px rgba(28, 27, 24, 0.03)',
                  transition: 'all 160ms ease',
                }}
              />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '5px',
                }}
              >
                <label
                  htmlFor="modal-password"
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#1C1B18',
                    margin: 0,
                  }}
                >
                  Password
                </label>
                {mode === 'signup' && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: isPasswordValid ? '#2D8A4E' : '#8C887F',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: isPasswordValid ? 600 : 400,
                    }}
                  >
                    {isPasswordValid && <CheckCircle2 size={11} color="#2D8A4E" />}
                    <span>{isPasswordValid ? '8+ chars' : '8+ chars required'}</span>
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="modal-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  minLength={8}
                  maxLength={128}
                  disabled={loading || oauthBusy}
                  style={{
                    width: '100%',
                    background: '#FFFFFF',
                    border: `1.5px solid ${
                      error ? '#C64835' : focusedField === 'password' ? '#1C1B18' : '#D4CEBF'
                    }`,
                    borderRadius: '8px',
                    padding: '10px 40px 10px 14px',
                    fontSize: '13.5px',
                    color: '#1C1B18',
                    outline: 'none',
                    boxShadow:
                      focusedField === 'password' ? '0 0 0 3px rgba(28, 27, 24, 0.08)' : '0 1px 2px rgba(28, 27, 24, 0.03)',
                    transition: 'all 160ms ease',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    padding: '6px',
                    color: '#8C887F',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#1C1B18')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#8C887F')}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div
                style={{
                  padding: '9px 12px',
                  background: '#F9ECEA',
                  border: '1px solid #E8C4BE',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  color: '#A83B2B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  lineHeight: 1.45,
                }}
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#A83B2B', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading || oauthBusy}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '11px 16px',
                borderRadius: '8px',
                background: '#1C1B18',
                color: '#FAF8F5',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                cursor: loading || oauthBusy ? 'not-allowed' : 'pointer',
                opacity: loading || oauthBusy ? 0.75 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(28, 27, 24, 0.16)',
                transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                if (!loading && !oauthBusy) {
                  e.currentTarget.style.background = '#2E2B26';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(28, 27, 24, 0.22)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1C1B18';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(28, 27, 24, 0.16)';
              }}
            >
              {loading ? (
                <>
                  <Loader size={15} className="spin" />
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Quick Footer Switch */}
          <div
            style={{
              marginTop: '18px',
              paddingTop: '16px',
              borderTop: '1px solid #EAE6DD',
              fontSize: '13px',
              color: '#5F5C55',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{mode === 'login' ? 'Don’t have an account?' : 'Already have an account?'}</span>
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: '#1C1B18',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px',
                borderBottom: '1.2px solid #1C1B18',
                lineHeight: 1.3,
                transition: 'opacity 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
