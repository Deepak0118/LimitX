// Redis connection + the token bucket Lua script registered as a command.
const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');
const config = require('./config');

const redis = new Redis(config.redisUrl, {
  // If Redis is slow, give up quickly and use the fallback limiter instead of hanging the request.
  commandTimeout: config.redisTimeoutMs,
  maxRetriesPerRequest: 1,
  // Do not queue commands while disconnected. Fail immediately so the fallback kicks in.
  enableOfflineQueue: false,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

redis.on('error', (e) => console.warn('[redis]', e.message));

// One Redis command per algorithm. ioredis sends them with EVALSHA (script cached inside Redis,
// only a hash travels each time). Names here must match ALGORITHMS in limiter.js.
for (const [command, file] of [
  ['tokenBucket', 'tokenBucket.lua'],
  ['fixedWindow', 'fixedWindow.lua'],
  ['slidingWindow', 'slidingWindow.lua'],
]) {
  redis.defineCommand(command, {
    numberOfKeys: 1,
    lua: fs.readFileSync(path.join(__dirname, 'lua', file), 'utf8'),
  });
}

module.exports = redis;
