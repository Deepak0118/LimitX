# LimitX

A rate-limiting reverse proxy as a service. Developers sign up, create a project with the URL of their API,
and send their traffic through LimitX. LimitX checks the project's rules and either forwards the request or
returns `429 Too Many Requests`.

```
Client --> LimitX (Fastify) --> Developer's API
               |  \
               |   +--> Redis: rate limit counters (atomic Lua) + per-project blocklists
               +--> Memory (L1): rules + blocklist cache
               +--> Postgres (Prisma): users, projects, rules (source of truth) + analytics (written in batches)
```

## Folder structure

```
limitx/
  docker-compose.yml        Redis + Postgres for local development
  DECISIONS.md              every design decision: why, tradeoff, alternatives
  backend/
    prisma/schema.prisma    5 models: User, Project, Rule, RequestLog (+ 2 enums)
    prisma.config.ts        tells the Prisma CLI where the schema and DATABASE_URL are
    src/
      server.js             app setup, JWT, optional CORS, serves built frontend/dist in production
      config.js             environment variables
      proxy.js              THE CORE: api -> blocklist -> rule -> limit -> forward
      limiter.js            picks the algorithm, Redis + fail-open/fail-closed fallback
      lua/                  one atomic script per algorithm: tokenBucket, fixedWindow, slidingWindow
      rules.js              L1 cache for rules, path normalization, rule matching
      blocklist.js          per-service blocklist, L1 + Redis
      requestLog.js         batched analytics logging + hourly log retention pruning
      auth.js               signup / login (scrypt, JWT, Google OAuth 2.0 PKCE, brute-force limit)
      admin.js              dashboard API. Every query is scoped to the logged-in owner
      ssrf.js               blocks origins that point to private/internal addresses
      errors.js, ip.js      shared HTTP error & client IP helpers
      redis.js, db.js       connections
    scripts/                mock origin, load test, security tests
  frontend/                 React dashboard (Vite): landing, auth, projects, services, rules, logs, blocklist
```

## Run it locally

You need Node 20+ and Docker (or your own Redis and Postgres).

```bash
docker compose up -d                     # Redis + Postgres

cd backend
cp .env.example .env                     # fill in JWT_SECRET (optional: GOOGLE_CLIENT_ID / SECRET)
npm install                              # also runs "prisma generate"
npx prisma migrate deploy                # applies all database migrations
npm run mock-origin                      # terminal 1: fake developer API on :4000
npm run dev                              # terminal 2: LimitX on :3000

cd ../frontend                           # terminal 3
npm install
npm run dev                              # dashboard on http://localhost:5173
```

## Production single-server mode

When `frontend/dist` is built, Fastify serves the dashboard SPA directly alongside `/api/*` and `/proxy/*`:

```bash
npm --prefix frontend ci && npm --prefix frontend run build
cd backend && npm ci && npx prisma migrate deploy
ALLOW_PRIVATE_ORIGINS=false npm start
```

Set `CORS_ORIGINS` only if hosting the frontend on a separate origin, and set `TRUSTED_PROXIES` when running behind a load balancer or reverse proxy.

In the dashboard: sign up, create a project with origin `http://localhost:4000` (allowed because
`ALLOW_PRIVATE_ORIGINS=true` in `.env`), add a rule such as `/api/login`, 5 per 60 seconds, then send traffic:

```bash
curl -i http://localhost:3000/proxy/<PROJECT_ID>/api/login
```

## Tests to run yourself (this is what to show in an interview)

| Test | How | Expected |
|---|---|---|
| **Security suite** | `node scripts/test-security.js` | All checks pass: user B cannot read/change/delete user A's project, per-project blocklist, login brute-force limit |
| Atomic limit | `node scripts/load-test.js http://localhost:3000/proxy/<ID>/api/login 100` with a limit of 10 | exactly 10 x 200, 90 x 429 |
| Algorithm difference | 3 rules, limit 10 / 4 s (token bucket, fixed, sliding). Send 1 request, 9 more at 3.5 s, 10 more at 4.1 s | fixed window lets ~20 through, sliding exactly 10, token bucket ~12 |
| XFF spoofing | `curl -H "X-Forwarded-For: 1.2.3.4" ...` with a different value each time | limit still applies (header ignored) |
| Path tricks | `/api/login/`, `/API/Login`, `//api//login` | all use the same bucket as `/api/login` |
| Redis down | stop Redis, keep sending | normal rules keep working (local limiter), rules with "Block if Redis is down" return 503 |
| Origin down / slow | stop the origin, or call `/slow` on the mock origin | 502 / 504, never a hang |
| SSRF | set `ALLOW_PRIVATE_ORIGINS=false`, create a project for `http://localhost:4000` or `http://169.254.169.254` | 400 |
| Overhead | benchmark origin directly vs through LimitX (autocannon or k6) | record the p99 difference |

## Not built yet (intentionally)

- Threat intel (AbuseIPDB) and JS challenge / "strict mode" for shared IPs. See DECISIONS.md.
- Kafka/QStash. Logging uses an in-process batch buffer, which is enough until there is real scale.
- Email verification, password reset, account linking/password setup for Google-only users, refresh tokens, per-user plans/quotas.
- SDK mode, WebSocket/SSE proxying, multi-region.
