// All settings come from environment variables (.env). Fails fast if something important is missing.
require('dotenv').config();

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');

module.exports = {
  port: Number(process.env.PORT || 3000),
  redisUrl: required('REDIS_URL'),
  redisTimeoutMs: Number(process.env.REDIS_TIMEOUT_MS || 500),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  allowPrivateOrigins: process.env.ALLOW_PRIVATE_ORIGINS === 'true',
  // false = ignore X-Forwarded-For completely and use the socket IP.
  trustedProxies: process.env.TRUSTED_PROXIES
    ? process.env.TRUSTED_PROXIES.split(',').map((s) => s.trim()).filter(Boolean)
    : false,
  globalIpLimitPerMin: Number(process.env.GLOBAL_IP_LIMIT_PER_MIN || 600),
  originHeadersTimeoutMs: Number(process.env.ORIGIN_HEADERS_TIMEOUT_MS || 10000),
  originBodyTimeoutMs: Number(process.env.ORIGIN_BODY_TIMEOUT_MS || 30000),
  bodyLimitBytes: Number(process.env.BODY_LIMIT_MB || 10) * 1024 * 1024,
  maxProjectsPerUser: Number(process.env.MAX_PROJECTS_PER_USER || 20),
  maxRulesPerProject: Number(process.env.MAX_RULES_PER_PROJECT || 50),
  maxApisPerProject: Number(process.env.MAX_APIS_PER_PROJECT || 50),
  logRetentionDays: Number(process.env.LOG_RETENTION_DAYS || 7),
  googleClientId: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  googleClientSecret: (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
  googleRedirectUri: (process.env.GOOGLE_REDIRECT_URI || '').trim(),
  frontendUrl: (process.env.FRONTEND_URL || '').trim().replace(/\/+$/, ''),
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean),
};
