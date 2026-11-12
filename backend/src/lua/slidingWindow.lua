-- Sliding window COUNTER (the hybrid from the book), atomic.
-- KEYS[1] = state key (hash with: win = current window id, cur = count in it, prev = count in the one before)
-- ARGV[1] = limit, ARGV[2] = window in seconds
-- Estimated requests in the last window = cur + prev * (share of the previous window still inside the rolling window)
-- Returns { allowed (1/0), remaining, retry_after_seconds }
-- Weakness: assumes requests in the previous window were spread evenly, so it is an approximation.

local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000) -- ms

local limit     = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2]) * 1000

local win     = math.floor(now / window_ms)          -- id of the current fixed window
local elapsed = now - win * window_ms                -- ms since this window started
local f       = elapsed / window_ms                  -- 0..1 position inside the window

local h = redis.call('HMGET', KEYS[1], 'win', 'cur', 'prev')
local stored_win = tonumber(h[1])
local cur  = tonumber(h[2]) or 0
local prev = tonumber(h[3]) or 0

if stored_win == nil then
  cur = 0; prev = 0
elseif win == stored_win + 1 then
  prev = cur; cur = 0                                -- moved to the next window
elseif win > stored_win + 1 then
  prev = 0; cur = 0                                  -- idle for 2+ windows, start clean
end

local estimated = cur + prev * (1 - f)
local allowed = 0
if estimated + 1 <= limit then
  cur = cur + 1
  allowed = 1
  estimated = estimated + 1
end

redis.call('HSET', KEYS[1], 'win', win, 'cur', cur, 'prev', prev)
redis.call('PEXPIRE', KEYS[1], window_ms * 2)        -- state is useless after 2 windows

if allowed == 1 then
  return { 1, math.max(0, math.floor(limit - estimated)), 0 }
end

-- Blocked: how long until the estimate drops enough to let one request in?
local headroom = limit - 1 - cur                     -- room left for the "previous window" part
local wait_ms
if headroom >= 0 and prev > 0 then
  local f_needed = math.max(f, 1 - headroom / prev)
  wait_ms = (f_needed - f) * window_ms
else
  -- current window is already full: wait for the next window, then for prev (= cur) to fade out
  local f_needed = 0
  if cur > 0 then f_needed = math.max(0, 1 - (limit - 1) / cur) end
  wait_ms = (window_ms - elapsed) + f_needed * window_ms
end
return { 0, 0, math.max(1, math.ceil(wait_ms / 1000)) }
