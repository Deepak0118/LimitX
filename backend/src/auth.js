// Signup / login + optional Google OAuth 2.0 (Authorization Code + PKCE).
// Passwords are hashed with scrypt (built into Node, no extra dependency).
// Login returns a JWT. The JWT only says WHO you are. Ownership checks in admin.js decide WHAT you may touch.
const crypto = require('crypto');
const { promisify } = require('util');
const config = require('./config');
const prisma = require('./db');
const redis = require('./redis');
const limiter = require('./limiter');
const { normalizeIp } = require('./ip');
const { httpError } = require('./errors');

const scrypt = promisify(crypto.scrypt);
const SCRYPT = { N: 16384, r: 8, p: 1 };

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const OAUTH_EXCHANGE_TTL_MS = 60 * 1000;
const MAX_LOCAL_OAUTH_KEYS = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_HOST_RE = /^[a-z0-9.-]+(?::\d{1,5})?$/i;

// Fallback store when Redis is temporarily disconnected during single-instance dev or outages.
const localOauthStore = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of localOauthStore) {
    if (v.expiresAt <= now) localOauthStore.delete(k);
  }
}, 60000).unref();

const isGoogleEnabled = () => Boolean(config.googleClientId && config.googleClientSecret);

async function setEphemeral(key, value, ttlMs) {
  const serialized = JSON.stringify(value);
  try {
    await redis.set(key, serialized, 'PX', ttlMs);
    return;
  } catch {
    if (localOauthStore.size >= MAX_LOCAL_OAUTH_KEYS) {
      localOauthStore.delete(localOauthStore.keys().next().value);
    }
    localOauthStore.set(key, { serialized, expiresAt: Date.now() + ttlMs });
  }
}

async function takeEphemeral(key) {
  try {
    const res = await redis.multi().get(key).del(key).exec();
    const raw = res?.[0]?.[1];
    if (typeof raw === 'string' && raw.length > 0) return JSON.parse(raw);
  } catch {
    // Fall through to in-memory fallback check below
  }
  const entry = localOauthStore.get(key);
  if (!entry) return null;
  localOauthStore.delete(key);
  if (entry.expiresAt <= Date.now()) return null;
  return JSON.parse(entry.serialized);
}

function resolveGoogleUrls(request) {
  const rawHost = String(request.host || request.headers.host || '').trim();
  const inferredOrigin = config.frontendUrl
    || (SAFE_HOST_RE.test(rawHost) ? `${request.protocol === 'https' ? 'https' : 'http'}://${rawHost}` : 'http://localhost:5173');
  const redirectUri = config.googleRedirectUri || `${inferredOrigin}/api/auth/google/callback`;
  const authPageUrl = `${config.frontendUrl || new URL(redirectUri).origin}/auth`;
  return { redirectUri, authPageUrl };
}

function redirectOAuthError(reply, authPageUrl, code, mode = 'login') {
  const params = new URLSearchParams({ mode, oauth_error: code });
  return reply.redirect(`${authPageUrl}?${params.toString()}`);
}

async function exchangeGoogleCode({ code, codeVerifier, redirectUri }) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }).toString(),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.access_token) {
    throw Object.assign(new Error('Google token exchange failed'), { oauthCode: 'token_exchange_failed' });
  }
  return data.access_token;
}

async function fetchGoogleProfile(accessToken) {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10000),
  });
  const profile = await res.json().catch(() => null);
  if (!res.ok || !profile?.sub || !profile?.email) {
    throw Object.assign(new Error('Failed to load Google profile'), { oauthCode: 'userinfo_failed' });
  }
  const email = String(profile.email).trim().toLowerCase();
  if (profile.email_verified !== true || email.length > 254 || !EMAIL_RE.test(email)) {
    throw Object.assign(new Error('Verified Google email required'), { oauthCode: 'email_unverified' });
  }
  return { sub: String(profile.sub).trim(), email };
}

async function upsertGoogleUser({ sub, email }) {
  const existingGoogle = await prisma.user.findUnique({ where: { googleId: sub } });
  if (existingGoogle) return existingGoogle;

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    if (existingEmail.googleId && existingEmail.googleId !== sub) {
      throw Object.assign(new Error('Account conflict'), { oauthCode: 'account_conflict' });
    }
    return prisma.user.update({
      where: { id: existingEmail.id },
      data: { googleId: sub },
    });
  }

  try {
    return await prisma.user.create({
      data: { email, googleId: sub, passwordHash: null },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      const raced = await prisma.user.findUnique({ where: { googleId: sub } });
      if (raced) return raced;
      throw Object.assign(new Error('Account conflict'), { oauthCode: 'account_conflict' });
    }
    throw err;
  }
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, 64, SCRYPT);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

async function verifyPassword(password, stored) {
  const [scheme, saltB64, keyB64] = String(stored || '').split('$');
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  if (expected.length === 0) return false;
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, SCRYPT);
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected); // constant-time compare
}

// Used when the email does not exist, so "wrong email" and "wrong password" take the same time
// (otherwise response time reveals which emails have accounts).
const dummySalt = crypto.randomBytes(16);
const dummyKey = crypto.scryptSync('not-a-real-password', dummySalt, 64, SCRYPT);
const dummyHash = `scrypt$${dummySalt.toString('base64')}$${dummyKey.toString('base64')}`;

function parseCredentials(body) {
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  if (email.length > 254 || !EMAIL_RE.test(email)) throw httpError(400, 'Enter a valid email');
  // Upper bound matters: hashing a 10 MB "password" would be a cheap way to burn CPU.
  if (password.length < 8 || password.length > 128) throw httpError(400, 'Password must be 8 to 128 characters');
  return { email, password };
}

// LimitX limits its own login endpoint with its own limiter (brute-force protection).
async function throttle(request, name, limit) {
  const r = await limiter.consume({
    key: `limit:auth:${name}:${normalizeIp(request.ip)}`,
    limit,
    windowSec: 60,
    algorithm: 'sliding_window',
  });
  if (!r.allowed) {
    const e = httpError(429, 'Too many attempts, try again later');
    e.retryAfter = r.retryAfter;
    throw e;
  }
}

module.exports = async function authRoutes(app) {
  app.setErrorHandler((err, request, reply) => {
    if (err.retryAfter) reply.header('Retry-After', err.retryAfter);
    reply.send(err);
  });

  const sign = (user) => app.jwt.sign({ sub: String(user.id) });

  app.post('/signup', async (request, reply) => {
    await throttle(request, 'signup', 5);
    const { email, password } = parseCredentials(request.body);
    try {
      const user = await prisma.user.create({ data: { email, passwordHash: await hashPassword(password) } });
      return reply.code(201).send({ token: sign(user), user: { id: user.id, email: user.email } });
    } catch (err) {
      if (err.code === 'P2002') throw httpError(409, 'An account with this email already exists');
      throw err;
    }
  });

  app.post('/login', async (request) => {
    await throttle(request, 'login', 10);
    const { email, password } = parseCredentials(request.body);
    const user = await prisma.user.findUnique({ where: { email } });
    // Always run scrypt even for Google-only accounts (passwordHash === null) to preserve constant timing.
    const hashToCheck = user && user.passwordHash ? user.passwordHash : dummyHash;
    const ok = await verifyPassword(password, hashToCheck);
    if (!user || !user.passwordHash || !ok) throw httpError(401, 'Wrong email or password');
    return { token: sign(user), user: { id: user.id, email: user.email } };
  });

  app.get('/providers', async () => ({
    google: isGoogleEnabled(),
  }));

  app.get('/google', async (request, reply) => {
    await throttle(request, 'google_start', 20);
    const mode = request.query?.mode === 'signup' ? 'signup' : 'login';
    const { redirectUri, authPageUrl } = resolveGoogleUrls(request);

    if (!isGoogleEnabled()) {
      return redirectOAuthError(reply, authPageUrl, 'google_not_configured', mode);
    }

    const state = crypto.randomBytes(24).toString('base64url');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    await setEphemeral(
      `oauth:state:${state}`,
      { codeVerifier, redirectUri, authPageUrl, mode },
      OAUTH_STATE_TTL_MS,
    );

    const params = new URLSearchParams({
      client_id: config.googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });

    return reply.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  });

  app.get('/google/callback', async (request, reply) => {
    await throttle(request, 'google_callback', 20);
    const { authPageUrl: fallbackAuthPageUrl } = resolveGoogleUrls(request);
    const { code, state, error: oauthErr } = request.query || {};

    if (!state || typeof state !== 'string') {
      return redirectOAuthError(reply, fallbackAuthPageUrl, oauthErr ? 'access_denied' : 'invalid_state');
    }

    const saved = await takeEphemeral(`oauth:state:${state}`);
    const authPageUrl = saved?.authPageUrl || fallbackAuthPageUrl;
    const mode = saved?.mode === 'signup' ? 'signup' : 'login';

    if (!saved) {
      return redirectOAuthError(reply, authPageUrl, 'invalid_state', mode);
    }
    if (oauthErr) {
      return redirectOAuthError(reply, authPageUrl, oauthErr === 'access_denied' ? 'access_denied' : 'oauth_failed', mode);
    }
    if (!code || typeof code !== 'string' || !isGoogleEnabled()) {
      return redirectOAuthError(reply, authPageUrl, 'token_exchange_failed', mode);
    }

    try {
      const accessToken = await exchangeGoogleCode({
        code,
        codeVerifier: saved.codeVerifier,
        redirectUri: saved.redirectUri,
      });
      const profile = await fetchGoogleProfile(accessToken);
      const user = await upsertGoogleUser(profile);

      const exchangeCode = crypto.randomBytes(24).toString('base64url');
      await setEphemeral(`oauth:exchange:${exchangeCode}`, { userId: user.id }, OAUTH_EXCHANGE_TTL_MS);

      const params = new URLSearchParams({ mode, oauth_code: exchangeCode });
      return reply.redirect(`${authPageUrl}?${params.toString()}`);
    } catch (err) {
      if (err?.oauthCode) {
        return redirectOAuthError(reply, authPageUrl, err.oauthCode, mode);
      }
      console.error('[auth/google/callback] unexpected error:', err.message);
      return redirectOAuthError(reply, authPageUrl, 'oauth_failed', mode);
    }
  });

  app.post('/google/exchange', async (request) => {
    await throttle(request, 'google_exchange', 20);
    const code = typeof request.body?.code === 'string' ? request.body.code.trim() : '';
    if (!code || code.length > 128) throw httpError(400, 'Invalid OAuth exchange code');

    const payload = await takeEphemeral(`oauth:exchange:${code}`);
    if (!payload || !Number.isInteger(payload.userId)) {
      throw httpError(400, 'Google sign-in session expired. Please try again.');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw httpError(401, 'Account no longer exists');

    return { token: sign(user), user: { id: user.id, email: user.email } };
  });

  app.get('/me', { onRequest: [(req) => req.jwtVerify()] }, async (request) => {
    const userId = Number(request.user?.sub);
    if (!Number.isInteger(userId) || userId <= 0) throw httpError(401, 'Invalid token');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw httpError(401, 'Account no longer exists');
    return { id: user.id, email: user.email };
  });
};
