-- Fixed window counter, atomic.
-- KEYS[1] = counter key
-- ARGV[1] = limit (max requests per window), ARGV[2] = window in seconds
-- The window starts at the client's first request and the key expires when the window ends.
-- Returns { allowed (1/0), remaining, retry_after_seconds }
-- Weakness: a burst at the end of one window + the start of the next can let ~2x the limit through.

local limit     = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2]) * 1000

local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], window_ms) -- first request of the window starts the clock
end

if count <= limit then
  return { 1, limit - count, 0 }
end

local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  -- safety net: key somehow has no expiry, restart the window instead of blocking forever
  redis.call('PEXPIRE', KEYS[1], window_ms)
  ttl = window_ms
end
return { 0, 0, math.ceil(ttl / 1000) }
