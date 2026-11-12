// API + rules lookup for the PROXY. L1 cache (memory) in front of Postgres,
// so the request path never waits for the database.
const path = require('path');
const NodeCache = require('node-cache');
const prisma = require('./db');

const MAX_CACHE_KEYS = 10000;
const cache = new NodeCache({ stdTTL: 30, checkperiod: 60, maxKeys: MAX_CACHE_KEYS, useClones: false }); // rules can be 30s stale
const lastKnown = new Map(); // used only if Postgres is down and the cache has expired

function setLastKnown(apiId, api) {
  if (lastKnown.size >= MAX_CACHE_KEYS && !lastKnown.has(apiId)) {
    lastKnown.delete(lastKnown.keys().next().value);
  }
  lastKnown.set(apiId, api);
}

// "/API/%6cogin/../orders/" -> "/api/orders" (stops case, percent-encoding, and dot-segment bypasses)
function normalizePath(p) {
  const raw = String(p || '').trim();
  if (raw === '*') return '*';

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Malformed percent sequences fall back to raw normalization (proxy rejects bad encoding first)
  }

  let out = path.posix.normalize('/' + decoded).replace(/\/{2,}/g, '/').toLowerCase();
  if (out.length > 1 && out.endsWith('/')) out = out.slice(0, -1);
  return out;
}

async function loadFromDb(apiId) {
  const api = await prisma.api.findUnique({
    where: { id: apiId },
    include: { rules: true },
  });
  if (!api) return null;
  return { id: api.id, name: api.name, targetUrl: api.targetUrl, status: api.status, rules: api.rules };
}

async function getApi(apiId) {
  const hit = cache.get(apiId);
  if (hit !== undefined) return hit; // may be null = "known to not exist"
  try {
    const api = await loadFromDb(apiId);
    try {
      cache.set(apiId, api, api ? 30 : 10); // cache "not found" briefly so random ids can't hammer the DB
    } catch {
      // Cache full (> maxKeys): continue serving accurately without triggering Postgres fallback
    }
    if (api) setLastKnown(apiId, api);
    return api;
  } catch (err) {
    console.warn('[rules] Postgres unavailable:', err.message);
    if (lastKnown.has(apiId)) return lastKnown.get(apiId); // keep serving with old rules
    throw err;
  }
}

/**
 * Which rule applies to this path? Most specific wins:
 *   1. exact match      "/api/login"
 *   2. longest prefix   "/api/*"
 *   3. catch-all        "*"
 */
function matchRule(rules, rawPath) {
  const path = normalizePath(rawPath);
  let best = null;
  let bestLen = -1;
  for (const rule of rules) {
    if (rule.path === path) return rule;
    if (rule.path.endsWith('/*')) {
      const prefix = rule.path.slice(0, -1); // "/api/"
      const matches = path.startsWith(prefix) || path === prefix.slice(0, -1);
      if (matches && prefix.length > bestLen) {
        best = rule;
        bestLen = prefix.length;
      }
    }
  }
  return best || rules.find((r) => r.path === '*') || null;
}

function invalidateApi(apiId) {
  cache.del(apiId);
  lastKnown.delete(apiId);
}

module.exports = { getApi, matchRule, normalizePath, invalidateApi };
