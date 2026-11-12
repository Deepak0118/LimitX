-- Token bucket, atomic. One Redis round trip, no race conditions between requests/instances.
-- KEYS[1] = bucket key
-- ARGV[1] = capacity (max tokens = the "limit")
-- ARGV[2] = window in seconds (bucket refills completely in this time)
-- Returns { allowed (1/0), remaining tokens, retry_after_seconds }

-- Redis's own clock, so multiple LimitX instances can never disagree about time.
local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000) -- ms

local capacity  = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2]) * 1000
local rate      = capacity / window_ms                 -- tokens per millisecond

local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(b[1])
local ts     = tonumber(b[2])

if tokens == nil or ts == nil then
  tokens = capacity                                    -- new client starts with a full bucket
else
  tokens = math.min(capacity, tokens + math.max(0, now - ts) * rate)  -- refill
end

local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end

-- Always save the refilled tokens AND the new timestamp (even when blocked),
-- otherwise the same elapsed time would be counted again on the next request.
redis.call('HSET', KEYS[1], 'tokens', tostring(tokens), 'ts', now)
-- A bucket is full again after one window, so the key can safely expire then (no memory leak).
redis.call('PEXPIRE', KEYS[1], window_ms)

local retry = 0
if allowed == 0 then
  retry = math.ceil((1 - tokens) / rate / 1000)
end

return { allowed, math.floor(tokens), retry }
