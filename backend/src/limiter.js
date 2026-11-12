// Rate limit decision. Redis first (accurate, shared by all instances).
// If Redis fails: either fail-open to a local in-memory limiter, or fail-closed (503) for critical rules.
const redis = require('./redis');

// algorithm name (stored in the rule) -> Redis command (registered in redis.js)
const ALGORITHMS = {
  token_bucket: 'tokenBucket',
  fixed_window: 'fixedWindow',
  sliding_window: 'slidingWindow',
};

const local = new Map(); // key -> { count, resetAt }
const MAX_LOCAL_KEYS = 100000;

function localCheck(key, limit, windowSec) {
  const now = Date.now();
  let e = local.get(key);
  if (!e || e.resetAt <= now) {
    if (local.size >= MAX_LOCAL_KEYS) local.delete(local.keys().next().value); // never grow forever
    e = { count: 0, resetAt: now + windowSec * 1000 };
    local.set(key, e);
  }
  e.count++;
  const allowed = e.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - e.count),
    retryAfter: allowed ? 0 : Math.max(1, Math.ceil((e.resetAt - now) / 1000)),
  };
}

// Remove expired entries now and then (no timer per key).
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of local) if (v.resetAt <= now) local.delete(k);
}, 30000).unref();

/**
 * @returns {{allowed:boolean, remaining:number, retryAfter:number, degraded?:boolean, unavailable?:boolean}}
 */
async function consume({ key, limit, windowSec, algorithm = 'token_bucket', failClosed = false }) {
  try {
    const command = ALGORITHMS[algorithm] || ALGORITHMS.token_bucket;
    const [allowed, remaining, retryAfter] = await redis[command](key, limit, windowSec);
    return { allowed: allowed === 1, remaining, retryAfter };
  } catch (err) {
    if (failClosed) return { allowed: false, remaining: 0, retryAfter: 1, unavailable: true };
    // Fail-open: still limited, but only per instance and always as a simple fixed window, whatever the
    // rule's algorithm is. Less accurate during an outage, but it keeps the API protected and available.
    return { ...localCheck(key, limit, windowSec), degraded: true };
  }
}

module.exports = { consume, ALGORITHMS };
