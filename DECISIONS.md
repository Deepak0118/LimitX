# Design decisions

Format: what we chose, why, what it costs, what we did not choose.
Keep this file updated. In an interview, every "why did you...?" should be answerable from here.

## Architecture

| Decision | Why | Tradeoff / rejected alternative |
|---|---|---|
| **Reverse proxy**, not an SDK | Works with any language, enforcement is central (developer cannot forget to call it) | Extra network hop and single point of failure. Mitigated with L1 cache, connection reuse, fail-open. SDK mode is future work |
| **Fastify** | Low overhead, mature proxy plugin (`@fastify/reply-from` on undici with connection pooling) | Node is single threaded: run several instances behind a load balancer |
| **Redis** for counters | In-memory, shared by all instances, atomic scripts, key expiry | One network call per request. Keep Redis in the same region as LimitX |
| **Postgres** for rules and analytics | Durable, relational (project has many rules) | Never queried on the request path |
| **Prisma (with the `pg` adapter)** | Typed queries, relations in one call (a project with its rules), and real migration history (`prisma migrate`) instead of hand-written ALTER statements | Adds a generate step and a dependency. Parameterized queries were already safe, so injection protection is not a reason to pick it. Never used on the request path except through the rule cache |

## Rate limiting

| Decision | Why | Tradeoff / rejected alternative |
|---|---|---|
| **Token bucket as the default algorithm** | Allows short bursts, 2 fields per client, used by Stripe and Amazon | Needs tuning. Other algorithms are selectable per rule, see "Algorithm choice per rule" |
| **Lua script** | Read, refill, check, write happen as ONE atomic step. A plain GET then SET has a race condition: two concurrent requests both read "1 token left" and both pass | Logic lives in Redis, harder to debug |
| **Redis `TIME` inside the script** | Several LimitX instances have slightly different clocks. Using one clock (Redis) avoids wrong refills | Check that your Redis provider allows `TIME` in scripts |
| **Always write the new timestamp, even when blocked** | Otherwise the same elapsed time is refilled again on the next request and the limit leaks | none |
| **`PEXPIRE` = one window** | A bucket is full again after one window, so expiring it loses nothing and prevents unbounded memory | none |
| **Rule key = matched rule path, not the raw URL** | Raw URL would create one bucket per URL: attacker sends `/a1`, `/a2`... to dodge the limit and fill Redis | none |
| **Path normalization** (lowercase, collapse `//`, strip trailing `/`) | `/api/login/` must not escape the `/api/login` rule and fall into a looser `*` rule | Case-insensitive matching is stricter than some origins. That is the safe direction |
| **Most specific rule wins** (exact, longest prefix, `*`) | Predictable, matches how routers behave | none |
| **No matching rule = not limited** | The developer has not asked for limiting there | Alternative: default rule per project |

## Algorithm choice per rule

A rule has an `algorithm`: `token_bucket` (default), `fixed_window` or `sliding_window`. Each one is a separate Lua script, all atomic.

| Algorithm | Best for | Weakness | Measured (limit 10 / 4 s, 1 request + 9 at the window end + 10 at the next window start) |
|---|---|---|---|
| **token_bucket** | General APIs, burst-friendly | Two things to tune (size and refill) | 12 allowed (limit + a little refill) |
| **fixed_window** | Simple quotas, cheapest (one INCR) | Edge burst: up to 2x the limit around a window boundary | **20 allowed (2x the limit)** |
| **sliding_window** (counter) | Strict routes: login, OTP | Approximation (assumes even traffic in the previous window) | **10 allowed (exact limit)** |

| Decision | Why | Tradeoff / rejected alternative |
|---|---|---|
| **Only 3 algorithms** | Covers the real tradeoffs (burst-friendly, cheap, strict) without a menu nobody can choose from | More code and tests than a single algorithm |
| **Sliding window LOG not offered** | Stores a timestamp per request: memory grows with traffic, even for blocked requests | It is the most accurate one |
| **Leaky bucket not offered** | A real leaky bucket queues requests and releases them at a fixed rate. In a proxy that means holding connections open. As a pure accept/reject meter it behaves like a token bucket | Could be added later as "traffic shaping" |
| **Algorithm is part of the Redis key** | Each algorithm stores a different Redis type (hash vs string). Switching algorithm on the same key would raise WRONGTYPE | Old counters are simply abandoned and expire |
| **Outage fallback is always a local fixed window** | Simplest thing that still protects the API when Redis is gone | Less accurate than the configured algorithm |
| **Token bucket is the default** | Safe for most APIs | none |

## Identity and security

| Decision | Why | Tradeoff / rejected alternative |
|---|---|---|
| **`request.ip` with `trustProxy` list** | `X-Forwarded-For` is client-controlled. We only believe it when the request came from our own load balancers, and then take the rightmost untrusted IP | Needs `TRUSTED_PROXIES` configured correctly. Empty = ignore XFF entirely |
| **Origin gets OUR `X-Forwarded-For`**, not the client's | Client could forge it and fool the developer's server | none |
| **No User-Agent in the identifier** | Attacker changes it freely and gets a fresh bucket | Less granularity for shared IPs |
| **Header identifiers are hashed** | Raw API keys must not land in Redis keys or logs | Hash is only 64 bits of SHA-256 (enough to avoid collisions here) |
| **Header rule falls back to IP if header is missing** | LimitX does not authenticate users, the origin does. A missing header should not become a free pass or a 401 from us | none |
| **Outer per-IP cap for header rules** | Without it, an attacker sends a new random header value each request and gets a fresh bucket every time. The cap bounds what one IP can do across all header values | One extra Redis call for header rules. Does not help against a botnet with many IPs |
| **Accounts + JWT** (`@fastify/jwt`, 12 h expiry) | LimitX is multi-user: each developer logs in and manages only their own projects | No refresh tokens or token revocation: a stolen token works until it expires. Fix later with short tokens + refresh |
| **scrypt for passwords** (built into Node) | Slow on purpose, salted, memory-hard, no native module to compile (bcrypt needs one) | Parameters need revisiting as hardware gets faster |
| **Password length limited to 8-128** | Hashing a huge "password" is a cheap way to burn CPU | none |
| **Same 401 for wrong email and wrong password, plus a dummy hash for unknown emails** | Response text AND response time must not reveal which emails have accounts | Signup still says "email already exists" (409). Hiding that needs email verification |
| **Login and signup are rate limited by LimitX's own limiter** (sliding window, 10 and 5 per minute per IP) | Brute-force protection, and a nice use of our own product | Many users behind one NAT share the limit |
| **Ownership check in every admin query** (`ownerId` in the WHERE, all through one helper for project routes) | JWT only proves WHO you are. Without the check, any user who knows a project id could edit it (IDOR) | Easy to forget in a new route. The security test script exists to catch that |
| **Someone else's project returns 404, not 403** | 403 would confirm that the id exists | none |
| **Caps: 20 projects per user, 50 rules per project, 1000 blocked IPs per project** | One account must not be able to fill the database or Redis | Numbers are env settings |
| **Blocklist is per API** (`limitx:blocklist:api:<apiId>`) | One API blocking an IP must never affect other APIs or users | No global operator blocklist yet |
| **SSRF protection, two layers**: check when the project is created, and again at connect time | `targetUrl` is chosen by users. Without it a project could point LimitX at localhost, private networks or the cloud metadata address (169.254.169.254). The connect-time check (`lookup` hook) also stops DNS rebinding, where a hostname is public at creation and private later | `ALLOW_PRIVATE_ORIGINS=true` switches it off for local development. Redirects are not followed, so an origin cannot bounce us to an internal address |

## Reliability

| Decision | Why | Tradeoff / rejected alternative |
|---|---|---|
| **Redis timeout 500 ms, no offline queue** | A slow Redis must not make every request hang | A very slow network may trigger the fallback needlessly. Tune `REDIS_TIMEOUT_MS` |
| **Fail-open to a local in-memory limiter** (default) | A Redis outage should not take the customer's API down | Limit is per instance during the outage, so less accurate |
| **Fail-closed (503) per rule** (`failClosed`) | Login or payment routes must not be left unprotected | Those routes are unavailable during an outage |
| **Serve last known rules if Postgres is down** | Config store outage should not stop traffic | Rules may be stale |
| **Origin timeouts, 502 / 504** | A hanging origin must not hold connections forever | Long-running endpoints need larger timeouts |
| **Stream request bodies** (no parse and re-serialize) | Low memory, works for any content type, forwards bytes untouched | Body limit is only checked through Content-Length |
| **Graceful shutdown** | Finish in-flight requests, flush logs on deploy | none |

## Performance and data

| Decision | Why | Tradeoff / rejected alternative |
|---|---|---|
| **L1 cache for rules (30 s TTL)** and blocklist | No database call per request | A rule change can take up to 30 s on other instances (this instance is invalidated immediately). Future: Redis pub/sub invalidation |
| **L1 + L2 blocklist** | L1 is fastest. L2 (Redis set) is shared so all instances agree | Blocklist changes take up to 30 s to reach other instances |
| **Cache "project not found" for 10 s** | Random IDs cannot hammer Postgres | none |
| **Analytics: memory buffer, one batched INSERT every 5 s** | Logging adds zero latency and one DB query per batch instead of one per request | Logs can be lost on a crash. Buffer is capped at 10,000 rows (drop oldest) |
| **No log retention yet** | Not needed for a demo | Future: delete or partition `request_logs` by month |

## Intentionally not built

- **AbuseIPDB threat intel**: free tier is small and it is a side feature. Manual blocklist shows the same L1 + L2 design.
- **Email verification, password reset, OAuth, refresh tokens**: not needed to demonstrate the core product.
- **JS challenge / strict mode for shared (NAT) IPs**: only works for browsers, spoofable signals, large surface. Documented as future work.
- **Kafka / QStash**: the batch buffer already decouples logging. Add a queue only when one instance cannot handle the volume.
