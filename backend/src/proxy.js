// The heart of LimitX: /proxy/:apiId/* -> check limit -> forward to the developer's origin API.
const crypto = require('crypto');
const path = require('path');
const config = require('./config');
const rules = require('./rules');
const limiter = require('./limiter');
const blocklist = require('./blocklist');
const requestLog = require('./requestLog');
const ssrf = require('./ssrf');
const { normalizeIp } = require('./ip');

// We never store or log raw API keys / tokens. Only a short hash is used as the bucket id.
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
const EXPOSE_LIST = ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'];
const EXPOSE_RATE_HEADERS = EXPOSE_LIST.join(', ');

function setEdgeCors(reply) {
  if (!reply.hasHeader('access-control-allow-origin')) {
    reply.header('Access-Control-Allow-Origin', '*');
  }
  reply.header('Access-Control-Expose-Headers', EXPOSE_RATE_HEADERS);
}

// Validate percent-encoding, reject backslashes/control chars, and resolve dot-segments relative to "/"
// so targetUrl base paths cannot be escaped while keeping original case and query strings intact.
function sanitizeForwardPath(rawForwardPath) {
  if (/[\x00-\x1f\x7f]/.test(rawForwardPath)) return null;

  const qIdx = rawForwardPath.indexOf('?');
  const rawPath = qIdx === -1 ? rawForwardPath : rawForwardPath.slice(0, qIdx);
  const query = qIdx === -1 ? '' : rawForwardPath.slice(qIdx);

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
    if (query) decodeURIComponent(query);
  } catch {
    return null;
  }

  if (/[\x00-\x1f\x7f\\]/.test(decodedPath) || rawPath.endsWith(' ') || decodedPath.endsWith(' ')) {
    return null;
  }

  const rawSegs = rawPath.split('/');
  const decSegs = decodedPath.split('/');
  if (rawSegs.includes('.') || rawSegs.includes('..') || decSegs.includes('.') || decSegs.includes('..')) {
    let clean = path.posix.normalize('/' + decodedPath);
    if (decodedPath.endsWith('/') && clean !== '/' && !clean.endsWith('/')) clean += '/';
    return encodeURI(clean) + query;
  }

  return rawForwardPath;
}

module.exports = async function proxyRoutes(app) {
  // Handle OPTIONS preflight immediately without burning rate limit tokens or setting credentials blindly.
  app.addHook('onRequest', async (request, reply) => {
    if (request.method !== 'OPTIONS') return;
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', request.headers['access-control-request-headers'] || 'Content-Type, Authorization, X-API-Key');
    reply.header('Access-Control-Expose-Headers', EXPOSE_RATE_HEADERS);
    reply.header('Access-Control-Max-Age', '86400');
    return reply.code(204).send();
  });

  // Forward request bodies untouched (as a stream) instead of parsing and re-serializing them.
  app.removeAllContentTypeParsers();
  app.addContentTypeParser('*', (req, payload, done) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      payload.resume();
      return done(null, undefined);
    }
    return done(null, payload);
  });

  await app.register(require('@fastify/reply-from'), {
    undici: {
      connections: 128, // reuse connections to origins (no new TCP/TLS handshake per request)
      headersTimeout: config.originHeadersTimeoutMs, // origin must start answering within this time
      bodyTimeout: config.originBodyTimeoutMs,
      // Re-checks the resolved IP at connect time (blocks DNS rebinding to internal addresses).
      connect: config.allowPrivateOrigins ? {} : { lookup: ssrf.safeLookup },
    },
  });

  function forward(request, reply, api, forwardPath) {
    const base = api.targetUrl.replace(/\/+$/, '');
    try {
      return reply.from(base + forwardPath, {
        // Never silently retry failing 503 GET requests 10x onto an overloaded origin.
        retryDelay: () => null,
        // Do NOT pass the client's own X-Forwarded-For to the origin (it can be forged). Send the IP we trust.
        rewriteRequestHeaders: (req, headers) => {
          const next = {
            ...headers,
            'x-forwarded-for': normalizeIp(request.ip),
            'x-forwarded-proto': request.protocol,
          };
          if (req.headers.host) next['x-forwarded-host'] = req.headers.host;
          return next;
        },
        // Preserve upstream CORS policy (credentials / explicit origins) when provided; only supply "*" if missing.
        rewriteHeaders: (headers) => {
          const next = { ...headers };
          if (!next['access-control-allow-origin']) {
            next['access-control-allow-origin'] = '*';
          } else if (next['access-control-allow-origin'] !== '*') {
            const vary = next['vary'] ? String(next['vary']) : '';
            if (!vary) next['vary'] = 'Origin';
            else if (!vary.toLowerCase().includes('origin')) next['vary'] = `${vary}, Origin`;
          }
          const existing = String(next['access-control-expose-headers'] || '')
            .split(',')
            .map((h) => h.trim())
            .filter(Boolean);
          const seen = new Set(existing.map((h) => h.toLowerCase()));
          for (const h of EXPOSE_LIST) {
            if (!seen.has(h.toLowerCase())) existing.push(h);
          }
          next['access-control-expose-headers'] = existing.join(', ');
          return next;
        },
        onError: (rep, { error }) => {
          setEdgeCors(rep);
          if (error?.code === 'ORIGIN_BLOCKED' || error?.cause?.code === 'ORIGIN_BLOCKED') {
            return rep.code(403).send({ error: 'Origin address blocked' });
          }
          const timedOut = /TIMEOUT/i.test(String((error && error.code) || ''));
          return rep.code(timedOut ? 504 : 502).send({ error: timedOut ? 'Origin timed out' : 'Origin unreachable' });
        },
      });
    } catch (err) {
      setEdgeCors(reply);
      const status = err?.statusCode === 400 || err instanceof URIError ? 400 : 502;
      return reply.code(status).send({ error: status === 400 ? 'Malformed request path' : 'Origin request failed' });
    }
  }

  async function handleProxy(request, reply) {
    const { apiId } = request.params;
    const ip = normalizeIp(request.ip); // normalized client IP (X-Forwarded-For honored only from TRUSTED_PROXIES)

    // "/proxy/api_x/api/login?page=2" -> "/api/login?page=2"; "/proxy/api_x" -> "/"
    const proxyPrefix = `/proxy/${apiId}`;
    const rawRest = request.url.startsWith(proxyPrefix)
      ? request.url.slice(proxyPrefix.length)
      : request.url.slice(`/${apiId}`.length);
    const rawForwardPath = rawRest === '' || rawRest.startsWith('?') ? '/' + rawRest : rawRest;
    const forwardPath = sanitizeForwardPath(rawForwardPath);
    if (!forwardPath) {
      setEdgeCors(reply);
      return reply.code(400).send({ error: 'Malformed request path' });
    }
    const pathOnly = forwardPath.split('?')[0];

    const log = (identifier, allowed, reason) =>
      requestLog.push({ apiId, path: rules.normalizePath(pathOnly), identifier, ip, allowed, reason });

    // 1. API + rules (from memory cache, not from the database)
    let api;
    try {
      api = await rules.getApi(apiId);
    } catch {
      setEdgeCors(reply);
      return reply.code(503).send({ error: 'Configuration temporarily unavailable' });
    }
    if (!api) {
      setEdgeCors(reply);
      return reply.code(404).send({ error: 'API not found' });
    }

    // Check if API is paused
    if (api.status === 'paused') {
      log('-', false, 'api_paused');
      setEdgeCors(reply);
      return reply.code(503).send({ error: 'API is temporarily paused' });
    }

    // 2. This API's blocklist (L1 per-API Set -> L2 Redis set)
    if (await blocklist.isBlockedApi(apiId, ip)) {
      log('-', false, 'blocklisted');
      setEdgeCors(reply);
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const rule = rules.matchRule(api.rules, pathOnly);
    if (!rule) {
      log('-', true, 'no_rule');
      return forward(request, reply, api, forwardPath); // no rule for this path = not limited
    }

    // 3. Who is this client?
    //    "ip" rules use the IP. "header" rules use a hash of the header (API key, user id...).
    //    If the header is missing we fall back to the IP.
    let identifier = `ip:${ip}`;
    if (rule.identifier === 'header') {
      const raw = request.headers[rule.headerName.toLowerCase()];
      const headerValue = Array.isArray(raw) ? raw[0] : raw;
      if (headerValue !== undefined && String(headerValue).length > 0) {
        identifier = `h:${hash(String(headerValue))}`;
      }
    }

    // 4. Safety net for header rules: an attacker can send a new random header value on every request
    //    to get a fresh bucket each time. So we also cap how much one IP can do across ALL header values.
    if (identifier.startsWith('h:')) {
      const outer = await limiter.consume({
        key: `limit:global:${ip}`,
        limit: config.globalIpLimitPerMin,
        windowSec: 60,
      });
      if (!outer.allowed) {
        log(identifier, false, 'ip_safety_limit');
        setEdgeCors(reply);
        reply.header('X-RateLimit-Limit', config.globalIpLimitPerMin);
        reply.header('X-RateLimit-Remaining', 0);
        reply.header('Retry-After', outer.retryAfter);
        return reply.code(429).send({ error: 'Too Many Requests' });
      }
    }

    // 5. The actual rate limit check (one atomic Redis call)
    const result = await limiter.consume({
      // The algorithm is part of the key: each algorithm stores a different data type in Redis, so if a
      // developer switches algorithm, old keys must not collide (that would cause WRONGTYPE errors).
      key: `limit:${apiId}:${rule.path}:${rule.algorithm}:${identifier}`,
      limit: rule.limit,
      windowSec: rule.windowSec,
      algorithm: rule.algorithm,
      failClosed: rule.failClosed,
    });

    reply.header('X-RateLimit-Limit', rule.limit);
    reply.header('X-RateLimit-Remaining', result.remaining);

    if (result.unavailable) {
      log(identifier, false, 'redis_unavailable');
      setEdgeCors(reply);
      reply.header('Retry-After', 1);
      return reply.code(503).send({ error: 'Rate limiter unavailable' });
    }
    if (!result.allowed) {
      log(identifier, false, 'rate_limited');
      setEdgeCors(reply);
      reply.header('Retry-After', result.retryAfter);
      return reply.code(429).send({ error: 'Too Many Requests' });
    }

    log(identifier, true, result.degraded ? 'allowed_fallback' : 'allowed');
    return forward(request, reply, api, forwardPath);
  }

  app.all('/:apiId', handleProxy);
  app.all('/:apiId/*', handleProxy);
};
