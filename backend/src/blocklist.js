// Blocked IPs, PER API (one API's blocklist doesn't affect other APIs).
// L1 = memory cache of blocked IP Sets keyed by apiId (O(APIs), never unbounded O(attacking IPs)).
// L2 = Redis set (shared by all instances).
const NodeCache = require('node-cache');
const redis = require('./redis');
const { normalizeIp } = require('./ip');

const setKey = (apiId) => `limitx:blocklist:api:${apiId}`;
const l1 = new NodeCache({ stdTTL: 30, checkperiod: 60, maxKeys: 10000, useClones: false }); // max 10k APIs in L1
const MAX_PER_API = 1000;

async function getBlockedSet(apiId) {
  let set = l1.get(apiId);
  if (set !== undefined) return set;

  const members = await redis.smembers(setKey(apiId));
  set = new Set(members.map(normalizeIp));
  try {
    l1.set(apiId, set);
  } catch {
    // Cache full (> maxKeys): continue serving accurately from Redis without crashing
  }
  return set;
}

async function isBlockedApi(apiId, ip) {
  try {
    const blockedSet = await getBlockedSet(apiId);
    return blockedSet.has(normalizeIp(ip));
  } catch {
    return false; // Redis down: do not block anyone by mistake
  }
}

async function addApi(apiId, ip) {
  const cleanIp = normalizeIp(ip);
  if ((await redis.scard(setKey(apiId))) >= MAX_PER_API) {
    const e = new Error(`Blocklist is full (${MAX_PER_API} IPs)`);
    e.statusCode = 400;
    throw e;
  }
  await redis.sadd(setKey(apiId), cleanIp);
  l1.del(apiId);
}

async function removeApi(apiId, ip) {
  await redis.srem(setKey(apiId), normalizeIp(ip));
  l1.del(apiId);
}

async function listApi(apiId) {
  return redis.smembers(setKey(apiId));
}

// When an API is deleted, drop its blocklist too.
async function clearApi(apiId) {
  l1.del(apiId);
  await redis.del(setKey(apiId)).catch(() => {});
}

module.exports = { isBlockedApi, addApi, removeApi, listApi, clearApi };
