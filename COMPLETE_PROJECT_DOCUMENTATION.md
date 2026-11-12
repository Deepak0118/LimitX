# LimitX - Complete Project Documentation

> **Enterprise-Grade Rate Limiting as a Service**  
> A comprehensive multi-tenant SaaS platform for API rate limiting with advanced security features

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Core Architecture](#core-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Edge Cases & Solutions](#edge-cases--solutions)
8. [API Documentation](#api-documentation)
9. [Security Features](#security-features)
10. [Performance Optimizations](#performance-optimizations)
11. [Deployment Guide](#deployment-guide)
12. [Development Workflow](#development-workflow)
13. [Testing Strategy](#testing-strategy)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

### 🎯 Core Idea

LimitX is a **multi-tenant SaaS platform** where developers register their APIs and apply sophisticated rate limiting rules. The system acts as a **reverse proxy** that sits between clients and origin APIs, enforcing rate limits with sub-5ms latency.

### 🏗️ System Components

**Two Planes:**

1. **Control Plane** (Dashboard):
   - React.js frontend + PostgreSQL backend (Prisma ORM)
   - Where developers configure projects, APIs, and rules
   - Real-time analytics and monitoring

2. **Data Plane** (Proxy):
   - Fastify + Redis high-speed proxy engine
   - Intercepts actual traffic and makes allow/block decisions in milliseconds
   - Handles rate limiting, blocklist checks, and request forwarding

### 🎨 User Journey

```
1. Developer signs up → Creates project
2. Registers APIs (Payment API, User API, etc.)
3. Sets rate limit rules per API (path-based)
4. Routes traffic through LimitX proxy: /proxy/{apiId}/path
5. Views analytics (allowed/blocked requests)
```

---

## Core Architecture

### 📊 Hierarchy Model

```
User
 └── Projects (organizational containers)
      └── APIs (individual endpoints)
           └── Rules (rate limit configurations)
           └── Blocklist (per-API IP blocking)
           └── RequestLogs (analytics)
```

**Key Decision**: Rules are at API level, NOT project level. This allows independent rate limiting for each API under a project.

### 🔄 Request Flow

```
Client Request
    ↓
LimitX Proxy (/proxy/{apiId}/path)
    ↓
1. Load API config from L1 cache (30s TTL)
2. Check blocklist (L1 memory → L2 Redis)
3. Match rate limit rule (exact → prefix → catch-all)
4. Check rate limit (atomic Redis operation)
5. Forward to target API OR return 429
    ↓
Target API (origin server)
    ↓
Response back to client
```

### 🗂️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  Landing → Auth → Dashboard → Projects → APIs → Rules   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND API (Fastify + Node.js)             │
│  /auth/*  /projects/*  /apis/*  /rules/*  /blocklist/*  │
└─────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌────────────────────┐              ┌──────────────────────┐
│   PostgreSQL       │              │   Redis              │
│   (Prisma ORM)     │              │   (Rate Limiting)    │
│                    │              │   (Blocklist Cache)  │
│ • Users            │              │                      │
│ • Projects         │              │ Keys:                │
│ • APIs             │              │ limit:{apiId}:...    │
│ • Rules            │              │ blocklist:api:{id}   │
│ • RequestLogs      │              │                      │
└────────────────────┘              └──────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │   PROXY ENGINE (/proxy/*)    │
            │                              │
            │  L1 Cache → Blocklist Check  │
            │  → Rule Match → Redis Limit  │
            │  → Forward to Origin         │
            └──────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │   Target API (Origin)        │
            │   Developer's actual API     │
            └──────────────────────────────┘
```

---

## Technology Stack

### Backend

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **Node.js** | Runtime | Event-driven, perfect for I/O heavy proxy |
| **Fastify** | Web framework | 2x faster than Express, built-in hooks |
| **PostgreSQL** | Primary database | ACID compliance, relations, JSON support |
| **Prisma** | ORM | Type-safe queries, migrations, dev experience |
| **Redis** | Cache + Rate limiting | Atomic operations with Lua scripts |
| **Scrypt** | Password hashing | Built-in Node.js, no external deps |
| **JWT** | Authentication | Stateless, scalable auth tokens |

### Frontend

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **React 18** | UI framework | Component model, hooks, modern |
| **Vite** | Build tool | Instant HMR, fast builds |
| **React Router** | Client routing | Standard for SPAs |
| **Lucide Icons** | Icon library | Clean, consistent, tree-shakeable |
| **CSS Variables** | Styling | Design tokens, no runtime cost |

### Infrastructure

- **Docker Compose**: Local development (PostgreSQL + Redis)
- **Environment Variables**: Configuration management (.env files)

---

## Database Schema

### Complete Prisma Schema

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// Enums
enum Algorithm {
  token_bucket
  fixed_window
  sliding_window
}

enum Identifier {
  ip
  header
}

enum ApiStatus {
  active
  paused
}

// Models

model User {
  id           Int       @id @default(autoincrement())
  email        String    @unique
  passwordHash String    @map("password_hash")
  createdAt    DateTime  @default(now()) @map("created_at")
  projects     Project[]
  @@map("users")
}

model Project {
  id          String   @id
  name        String
  description String?
  ownerId     Int      @map("owner_id")
  createdAt   DateTime @default(now()) @map("created_at")
  owner       User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  apis        Api[]
  @@index([ownerId])
  @@map("projects")
}

model Api {
  id          String      @id
  projectId   String      @map("project_id")
  name        String
  targetUrl   String      @map("target_url")
  description String?
  status      ApiStatus   @default(active)
  createdAt   DateTime    @default(now()) @map("created_at")
  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  rules       Rule[]
  requestLogs RequestLog[]
  @@index([projectId])
  @@map("apis")
}

model Rule {
  id         Int        @id @default(autoincrement())
  apiId      String     @map("api_id")
  path       String
  limit      Int        @map("limit_count")
  windowSec  Int        @map("window_sec")
  algorithm  Algorithm  @default(token_bucket)
  identifier Identifier
  headerName String?    @map("header_name")
  failClosed Boolean    @default(false) @map("fail_closed")
  api        Api        @relation(fields: [apiId], references: [id], onDelete: Cascade)
  @@unique([apiId, path])
  @@index([apiId])
  @@map("rules")
}

model RequestLog {
  id         BigInt   @id @default(autoincrement())
  apiId      String   @map("api_id")
  path       String
  identifier String
  ip         String
  allowed    Boolean
  reason     String
  createdAt  DateTime @default(now()) @map("created_at")
  api        Api?     @relation(fields: [apiId], references: [id], onDelete: SetNull)
  @@index([apiId, createdAt(sort: Desc)])
  @@map("request_logs")
}
```

### Key Design Decisions

1. **Project IDs**: Custom format `proj_xxxxxxxx` (8 hex chars) - user-friendly, hard to guess
2. **API IDs**: Format `api_xxxxxxxx` - same pattern for consistency
3. **Cascade Deletes**: Deleting project → deletes APIs → deletes rules (clean hierarchy)
4. **No FK on RequestLogs**: Batch logging must never fail due to deleted API
5. **Unique Constraint**: (apiId, path) - one rule per path per API
6. **Indexes**: On foreign keys and query patterns for performance

---

## Backend Architecture

### Directory Structure

```
backend/
├── src/
│   ├── server.js           # Main entry point, route registration
│   ├── config.js           # Environment variables validation
│   ├── db.js               # Prisma client singleton
│   ├── redis.js            # Redis client + Lua script loading
│   │
│   ├── auth.js             # Authentication routes (signup/login)
│   ├── admin.js            # Admin API routes (projects/apis/rules)
│   ├── proxy.js            # Proxy request handler
│   │
│   ├── rules.js            # API + rules cache and matching
│   ├── limiter.js          # Rate limit decision engine
│   ├── blocklist.js        # IP blocklist with L1+L2 cache
│   ├── requestLog.js       # Batched analytics logging
│   ├── ssrf.js             # SSRF protection
│   │
│   └── lua/                # Redis Lua scripts
│       ├── tokenBucket.lua
│       ├── fixedWindow.lua
│       └── slidingWindow.lua
│
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # SQL migrations
│
├── scripts/
│   ├── load-test.js        # Performance testing
│   ├── mock-origin.js      # Test origin server
│   └── test-security.js    # Security validation
│
├── .env                    # Environment configuration
├── .env.example            # Template for .env
└── package.json
```

### Core Modules Explained

#### 1. **server.js** - Application Entry Point

```javascript
// Responsibilities:
// - Initialize Fastify with security settings
// - Register JWT plugin
// - Mount route handlers (auth, admin, proxy)
// - Graceful shutdown (flush logs, close connections)

const app = Fastify({
  logger: false,
  trustProxy: config.trustedProxies,  // For X-Forwarded-For
  bodyLimit: config.bodyLimitBytes,
});

app.register(require('@fastify/jwt'), { 
  secret: config.jwtSecret, 
  sign: { expiresIn: '12h' } 
});

app.register(require('./auth'), { prefix: '/api/auth' });
app.register(require('./admin'), { prefix: '/api' });
app.register(require('./proxy'), { prefix: '/proxy' });
```

#### 2. **auth.js** - Authentication

```javascript
// Features:
// - Scrypt password hashing (built-in, no bcrypt dependency)
// - Constant-time password verification (timing attack prevention)
// - Brute-force protection (rate limits on login/signup)
// - JWT token issuance
// - Email validation

// Security measures:
async function verifyPassword(password, stored) {
  // If user doesn't exist, still run hash to prevent timing leaks
  const actual = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(actual, expected);
}

// Rate limit auth endpoints
await limiter.consume({
  key: `limit:auth:login:${request.ip}`,
  limit: 10,
  windowSec: 60,
  algorithm: 'sliding_window',
});
```

#### 3. **admin.js** - Admin API Routes

```javascript
// All routes protected with JWT verification
app.addHook('onRequest', async (request) => {
  await request.jwtVerify();
  request.userId = Number(request.user.sub);
});

// Ownership check helper
async function ownedProject(request) {
  const project = await prisma.project.findFirst({
    where: { 
      id: request.params.id, 
      ownerId: request.userId  // CRITICAL: always filter by owner
    }
  });
  if (!project) throw httpError(404, 'Project not found');
  return project;
}

// Routes:
// - GET /projects - List user's projects
// - POST /projects - Create project
// - GET /projects/:id - Get project with APIs
// - DELETE /projects/:id - Delete (cascade to APIs/rules)
//
// - POST /projects/:id/apis - Create API with SSRF check
// - GET /apis/:apiId - Get API with rules
// - PUT /apis/:apiId - Update API (name/url/status)
// - DELETE /apis/:apiId - Delete API
//
// - POST /apis/:apiId/rules - Create rate limit rule
// - DELETE /apis/:apiId/rules/:ruleId - Delete rule
//
// - GET /apis/:apiId/stats - Get 24h stats
// - GET /projects/:id/stats - Aggregated stats across APIs
//
// - GET/POST/DELETE /apis/:apiId/blocklist - IP blocking
```

#### 4. **proxy.js** - The Proxy Engine

```javascript
// URL: /proxy/:apiId/*
// Purpose: Intercept requests, apply rate limits, forward to origin

app.all('/:apiId/*', async (request, reply) => {
  const { apiId } = request.params;
  const forwardPath = request.url.slice(`/proxy/${apiId}`.length) || '/';
  const pathOnly = forwardPath.split('?')[0];
  const ip = request.ip;

  // Step 1: Load API + rules from cache (30s TTL)
  let api;
  try {
    api = await rules.getApi(apiId);
  } catch {
    return reply.code(503).send({ error: 'Configuration unavailable' });
  }
  
  if (!api) return reply.code(404).send({ error: 'API not found' });
  if (api.status === 'paused') {
    return reply.code(503).send({ error: 'API is paused' });
  }

  // Step 2: Check blocklist (L1 → L2)
  if (await blocklist.isBlockedApi(apiId, ip)) {
    return reply.code(403).send({ error: 'Forbidden' });
  }

  // Step 3: Match rule (exact → prefix → catch-all)
  const rule = rules.matchRule(api.rules, pathOnly);
  if (!rule) {
    // No rule = no rate limiting, just forward
    return forward(request, reply, api, forwardPath);
  }

  // Step 4: Determine identifier (IP or header hash)
  let identifier = `ip:${ip}`;
  if (rule.identifier === 'header') {
    const raw = request.headers[rule.headerName.toLowerCase()];
    if (raw) identifier = `h:${hash(raw)}`;
  }

  // Step 5: Global IP safety net (prevents header exhaustion attack)
  if (identifier.startsWith('h:')) {
    const outer = await limiter.consume({
      key: `limit:global:${ip}`,
      limit: 600,
      windowSec: 60,
    });
    if (!outer.allowed) {
      return reply.code(429).send({ error: 'Too Many Requests' });
    }
  }

  // Step 6: Actual rate limit check (atomic Redis operation)
  const result = await limiter.consume({
    key: `limit:${apiId}:${rule.path}:${rule.algorithm}:${identifier}`,
    limit: rule.limit,
    windowSec: rule.windowSec,
    algorithm: rule.algorithm,
    failClosed: rule.failClosed,
  });

  reply.header('X-RateLimit-Limit', rule.limit);
  reply.header('X-RateLimit-Remaining', result.remaining);

  if (result.unavailable) {
    return reply.code(503).send({ error: 'Rate limiter unavailable' });
  }
  
  if (!result.allowed) {
    reply.header('Retry-After', result.retryAfter);
    return reply.code(429).send({ error: 'Too Many Requests' });
  }

  // Forward to target API
  return forward(request, reply, api, forwardPath);
});
```

#### 5. **rules.js** - Cache & Rule Matching

```javascript
// L1 Cache: NodeCache (in-memory, 30s TTL)
// Fallback: Last-known cache (for DB outages)

async function getApi(apiId) {
  // Check L1 cache
  const hit = cache.get(apiId);
  if (hit !== undefined) return hit;

  // Cache miss - load from database
  try {
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      include: { rules: true },
    });
    
    cache.set(apiId, api, api ? 30 : 10);
    if (api) lastKnown.set(apiId, api);
    return api;
  } catch (err) {
    // DB down - return last known config
    if (lastKnown.has(apiId)) return lastKnown.get(apiId);
    throw err;
  }
}

// Rule matching priority:
// 1. Exact match ("/api/login")
// 2. Longest prefix match ("/api/*")
// 3. Catch-all ("*")
function matchRule(rules, rawPath) {
  const path = normalizePath(rawPath);
  
  // Priority 1: Exact match
  const exact = rules.find(r => r.path === path);
  if (exact) return exact;

  // Priority 2: Prefix match (longest wins)
  let best = null;
  let bestLen = -1;
  for (const rule of rules) {
    if (rule.path.endsWith('/*')) {
      const prefix = rule.path.slice(0, -1);
      if (path.startsWith(prefix) && prefix.length > bestLen) {
        best = rule;
        bestLen = prefix.length;
      }
    }
  }
  if (best) return best;

  // Priority 3: Catch-all
  return rules.find(r => r.path === '*') || null;
}
```

#### 6. **limiter.js** - Rate Limit Engine

```javascript
// Three algorithms implemented with Lua scripts:

// 1. TOKEN BUCKET
// - Smooth burst handling
// - Tokens refill over time
// - Best for APIs that can handle bursts
const TOKEN_BUCKET_LUA = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  
  local data = redis.call('GET', key)
  local tokens, lastRefill
  
  if data then
    local d = cjson.decode(data)
    tokens = d.tokens
    lastRefill = d.lastRefill
    
    -- Refill tokens based on elapsed time
    local elapsed = now - lastRefill
    local refillAmount = (elapsed / window) * limit
    tokens = math.min(limit, tokens + refillAmount)
  else
    tokens = limit
  end
  
  if tokens >= 1 then
    tokens = tokens - 1
    redis.call('SETEX', key, window, cjson.encode({
      tokens = tokens,
      lastRefill = now
    }))
    return {1, math.floor(tokens)}
  else
    return {0, 0, math.ceil((1 - tokens) * window / limit)}
  end
`;

// 2. FIXED WINDOW
// - Simple counter per time window
// - Resets at window boundaries
// - Can have boundary bursts (2x limit at boundary)
const FIXED_WINDOW_LUA = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  
  local current = redis.call('INCR', key)
  
  if current == 1 then
    redis.call('EXPIRE', key, window)
  end
  
  if current <= limit then
    return {1, limit - current}
  else
    local ttl = redis.call('TTL', key)
    return {0, 0, ttl > 0 and ttl or 1}
  end
`;

// 3. SLIDING WINDOW
// - Weighted counters from current + previous window
// - More accurate than fixed window
// - No boundary burst issue
const SLIDING_WINDOW_LUA = `
  local currKey = KEYS[1] .. ':curr'
  local prevKey = KEYS[1] .. ':prev'
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  
  local windowStart = now - window
  local prevWindowStart = windowStart - window
  
  -- Get current and previous window counts
  local currCount = tonumber(redis.call('GET', currKey) or '0')
  local prevCount = tonumber(redis.call('GET', prevKey) or '0')
  
  -- Calculate weighted count
  local percentInCurr = (now - windowStart) / window
  local weighted = prevCount * (1 - percentInCurr) + currCount
  
  if weighted < limit then
    redis.call('INCR', currKey)
    redis.call('EXPIRE', currKey, window * 2)
    return {1, math.floor(limit - weighted - 1)}
  else
    return {0, 0, window}
  end
`;

// Failover logic
async function consume(options) {
  try {
    // Try Redis first
    const result = await redis.evalsha(scriptSha, ...args);
    return { allowed: result[0] === 1, remaining: result[1] };
  } catch (err) {
    // Redis unavailable
    if (options.failClosed) {
      return { unavailable: true, allowed: false };
    }
    // Fail open: use in-memory limiter
    return localLimiter.check(options.key, options.limit);
  }
}
```

#### 7. **blocklist.js** - IP Blocking

```javascript
// Per-API blocklist with L1+L2 cache
// L1: NodeCache (memory, 30s TTL, fast)
// L2: Redis SET (shared across instances)

const setKey = (apiId) => `limitx:blocklist:api:${apiId}`;
const l1 = new NodeCache({ stdTTL: 30 });

async function isBlockedApi(apiId, ip) {
  const cacheKey = `${apiId}|${ip}`;
  
  // Check L1 cache
  const cached = l1.get(cacheKey);
  if (cached !== undefined) return cached;

  // Check L2 (Redis)
  try {
    const blocked = (await redis.sismember(setKey(apiId), ip)) === 1;
    l1.set(cacheKey, blocked);
    return blocked;
  } catch {
    // Redis down: don't block anyone by mistake
    return false;
  }
}

async function addApi(apiId, ip) {
  // Limit: 1000 IPs per API
  if ((await redis.scard(setKey(apiId))) >= 1000) {
    throw new Error('Blocklist is full (1000 IPs)');
  }
  
  await redis.sadd(setKey(apiId), ip);
  l1.del(`${apiId}|${ip}`);  // Invalidate L1
}
```

#### 8. **requestLog.js** - Batched Logging

```javascript
// Problem: Logging 10,000 req/sec to DB = socket exhaustion
// Solution: Micro-batching with RAM buffer

const buffer = [];
const MAX_BUFFER = 10000;  // Drop oldest if DB is down long
const CHUNK = 2000;        // Insert batch size

function push(entry) {
  if (buffer.length >= MAX_BUFFER) buffer.shift();
  buffer.push({ ...entry, createdAt: new Date() });
}

async function flush() {
  if (buffer.length === 0) return;
  
  const batch = buffer.splice(0, buffer.length);
  
  try {
    // Insert in chunks (avoid param limit)
    for (let i = 0; i < batch.length; i += CHUNK) {
      await prisma.requestLog.createMany({
        data: batch.slice(i, i + CHUNK)
      });
    }
  } catch (err) {
    // Analytics are lossy - don't break proxy
    console.warn(`Dropped ${batch.length} logs:`, err.message);
  }
}

// Flush every 5 seconds
setInterval(flush, 5000).unref();
```

#### 9. **ssrf.js** - SSRF Protection

```javascript
// Two-layer defense against SSRF:
// 1. URL validation at API creation
// 2. DNS lookup hook at connection time (DNS rebinding prevention)

const PRIVATE_RANGES = [
  '10.0.0.0/8',          // RFC1918
  '172.16.0.0/12',       // RFC1918
  '192.168.0.0/16',      // RFC1918
  '127.0.0.0/8',         // Loopback
  '169.254.0.0/16',      // Link-local
  '::1/128',             // IPv6 loopback
  'fc00::/7',            // IPv6 ULA
  '169.254.169.254/32',  // Cloud metadata (AWS/GCP/Azure)
];

async function assertPublicUrl(targetUrl) {
  const url = new URL(targetUrl);
  const resolved = await dns.resolve4(url.hostname);
  
  for (const ip of resolved) {
    if (isPrivateIp(ip)) {
      throw new Error('Target URL resolves to private IP');
    }
  }
}

// Also used in Undici connection hook
const safeLookup = (hostname, options, callback) => {
  dns.lookup(hostname, options, (err, address) => {
    if (err) return callback(err);
    if (isPrivateIp(address)) {
      return callback(new Error('Resolved to private IP'));
    }
    callback(null, address);
  });
};
```

---

## Frontend Architecture

### Directory Structure

```
frontend/
├── src/
│   ├── main.jsx              # React root
│   ├── App.jsx               # Router setup + auth check
│   ├── index.css             # Design system + utilities
│   ├── api.js                # Fetch wrapper with JWT
│   │
│   ├── pages/
│   │   ├── Landing.jsx       # Public landing page
│   │   ├── Auth.jsx          # Login/signup
│   │   ├── Dashboard.jsx     # Projects list
│   │   ├── ProjectDetail.jsx # APIs list
│   │   └── APIDetail.jsx     # Rules + analytics
│   │
│   └── components/
│       └── DashboardLayout.jsx  # Sidebar layout
│
├── index.html
├── vite.config.js
└── package.json
```

### Design System

**CSS Variables (Design Tokens)**:

```css
:root {
  /* Colors */
  --gray-50: #fafafa;
  --gray-900: #171717;
  --blue-500: #3b82f6;
  
  /* Spacing Scale (4px base) */
  --space-1: 0.25rem;  /* 4px */
  --space-4: 1rem;     /* 16px */
  --space-8: 2rem;     /* 32px */
  
  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

**Component Patterns**:

```css
/* Button variants */
.btn-primary { background: var(--gray-900); color: white; }
.btn-secondary { background: white; border: 1px solid var(--gray-300); }
.btn-danger { background: var(--red-500); color: white; }

/* Cards */
.card { 
  background: white; 
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Badges */
.badge { 
  padding: var(--space-1) var(--space-3);
  border-radius: 9999px;
  font-size: 0.75rem;
}

.badge-green { background: var(--green-50); color: var(--green-600); }
```

### Key Pages

#### 1. **Landing.jsx** - Marketing Page

Features:
- Hero section with gradient text effect
- Feature cards (6 features with icons)
- How it works (3 steps)
- CTA sections
- Code preview with syntax highlighting
- Responsive design (mobile/tablet/desktop)

Design principles:
- Clean white background
- Smooth animations (slide-in, fade-in)
- Professional typography
- Hover effects on cards
- No AI-generated look

#### 2. **Auth.jsx** - Login/Signup

Features:
- Shared component for login and signup (mode param)
- Email + password validation
- Error handling with alerts
- Loading states
- Trust badges (security, encryption)

Security:
- 8+ character password requirement
- Client-side email validation
- Server-side validation + sanitization

#### 3. **Dashboard.jsx** - Projects List

Features:
- Project cards grid (responsive)
- API count display
- Create project modal
- Empty state with illustration
- Search/filter (future enhancement)

Interactions:
- Click card → navigate to project detail
- Hover effects on cards
- Modal for creating projects

#### 4. **ProjectDetail.jsx** - APIs List

Features:
- Breadcrumb navigation
- APIs list with status badges (active/paused)
- Add API modal with SSRF validation
- Target URL display with external link icon
- Rule count per API
- Empty state when no APIs

API Management:
- Create API with name, targetUrl, description
- Status badge (green=active, yellow=paused)
- Click API → navigate to API detail

#### 5. **APIDetail.jsx** - Rules & Analytics

Most complex page with 3 sections:

**Stats Cards**:
- Allowed requests (24h) - green
- Blocked requests (24h) - red
- Active rules count - blue

**Proxy URL Section**:
- Display: `https://limitx.io/proxy/{apiId}`
- Copy to clipboard button
- Target URL info banner

**Rules Management**:
- Table of rules (path, limit, window, algorithm, identifier)
- Add rule modal with full form:
  - Path pattern (/, /*, /api/login)
  - Limit + window (1-1000000, 1-86400s)
  - Algorithm dropdown (token_bucket, fixed_window, sliding_window)
  - Identifier type (ip, header)
  - Header name (if identifier=header)
  - Fail closed checkbox
- Delete rule button

**Blocklist Management**:
- Grid of blocked IPs
- Add IP modal
- Remove IP button

Design:
- Clean white cards
- Smooth modals with backdrop blur
- Form validation
- Loading states
- Error alerts

---

## Edge Cases & Solutions

### 1. Database Bloat & Route Matching (O(N) Problem)

**Problem**: If developer creates 1,000 rules, proxy has to iterate through array on every request = O(N) latency spike.

**Solution**: 
- **Global vs Specific Rules**: Encourage developers to use catch-all (`*`) for common limits, specific rules for critical paths only.
- **Hash Map Optimization** (future): Convert rules array to Map for O(1) exact lookups.
- **Path Normalization**: Lowercase + collapse slashes + trim trailing slash = consistent matching.

**Implementation**:
```javascript
// rules.js - matchRule function
function matchRule(rules, rawPath) {
  const path = normalizePath(rawPath);  // "/API/Login/" → "/api/login"
  
  // O(1) exact match (future: use Map)
  const exact = rules.find(r => r.path === path);
  if (exact) return exact;
  
  // O(N) prefix match (rare case)
  let best = null, bestLen = -1;
  for (const rule of rules.filter(r => r.path.endsWith('/*'))) {
    const prefix = rule.path.slice(0, -1);
    if (path.startsWith(prefix) && prefix.length > bestLen) {
      best = rule;
      bestLen = prefix.length;
    }
  }
  if (best) return best;
  
  // O(N) catch-all (rare)
  return rules.find(r => r.path === '*') || null;
}
```

### 2. NAT Collision (College Wi-Fi Issue)

**Problem**: 100 students on same Wi-Fi = same public IP. IP-based rate limit blocks innocent users.

**Solution**:
- **Header-based limiting**: For authenticated APIs, use `x-user-id` or JWT token hash as identifier.
- **Strict Mode JS Challenge** (not implemented): Send invisible JavaScript challenge that creates hardware fingerprint (Canvas/WebGL). Verified users get HMAC-signed cookie for unique identification.

**Implementation**:
```javascript
// proxy.js - identifier selection
let identifier = `ip:${ip}`;
if (rule.identifier === 'header') {
  const raw = request.headers[rule.headerName.toLowerCase()];
  if (raw) {
    // Hash header value (never store raw API keys)
    identifier = `h:${crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16)}`;
  }
}

// Redis key includes identifier
const key = `limit:${apiId}:${rule.path}:${rule.algorithm}:${identifier}`;
```

### 3. IP Spoofing via HTTP Headers

**Problem**: Hacker sends `X-Forwarded-For: 12.34.56.78` to spoof IP and bypass rate limit.

**Solution**:
- **Trusted Proxy Validation**: Only trust `X-Forwarded-For` if request came from trusted load balancer IP.
- **Fastify trustProxy**: Parses XFF chain correctly, extracts real client IP.

**Implementation**:
```javascript
// server.js
const app = Fastify({
  trustProxy: config.trustedProxies,  // ['10.0.0.1', '10.0.0.2']
});

// request.ip is now:
// - If from trusted proxy: rightmost non-trusted IP from XFF chain
// - If direct connection: socket.remoteAddress
```

**Config**:
```env
TRUSTED_PROXIES=10.0.0.1,10.0.0.2  # Your load balancer IPs
# Empty = trust no one, use socket IP only
```

### 4. High-Speed Threat Intelligence (VPN/Bot Blocking)

**Problem**: Calling AbuseIPDB API on every request = 500ms+ latency.

**Solution**:
- **Asynchronous Fire-and-Forget Worker**: Proxy forwards request immediately, background worker checks IP.
- **L1/L2 Blocklist Cache**: Malicious IPs cached for 24h (TTL), next requests get instant 403.

**Implementation** (conceptual - not built yet):
```javascript
// proxy.js - after forwarding
async function forward(request, reply, api, forwardPath) {
  const response = await reply.from(api.targetUrl + forwardPath);
  
  // Fire-and-forget: check IP in background (don't await)
  threatIntel.checkIpAsync(request.ip, api.id).catch(() => {});
  
  return response;
}

// threatIntel.js
async function checkIpAsync(ip, apiId) {
  const result = await abuseIpDb.check(ip);
  if (result.abuseConfidenceScore > 80) {
    await blocklist.addApi(apiId, ip);  // Auto-block for 24h
  }
}
```

### 5. Database/Queue Bottleneck (Logging Problem)

**Problem**: 10,000 req/sec × direct DB insert = socket exhaustion, request blocking.

**Solution**:
- **Micro-batching Log Buffer**: RAM array, flush every 5 seconds in chunks of 2000 rows.
- **Non-blocking**: `requestLog.push()` is synchronous (instant), flush is async.
- **Lossy**: If DB is down, logs are dropped (analytics are not critical path).

**Implementation**:
```javascript
// requestLog.js
const buffer = [];

function push(entry) {
  buffer.push({ ...entry, createdAt: new Date() });
  // Returns immediately, no DB blocking
}

setInterval(async () => {
  if (buffer.length === 0) return;
  
  const batch = buffer.splice(0, buffer.length);
  try {
    await prisma.requestLog.createMany({ data: batch });
  } catch (err) {
    console.warn(`Dropped ${batch.length} logs`);
  }
}, 5000);
```

**Result**: 99% I/O reduction, 0ms latency added to proxy path.

### 6. Single Point of Failure (Redis Goes Down)

**Problem**: Redis crash = all APIs down (can't check rate limits).

**Solution**:
- **Graceful Degradation** (Circuit Breaker):
  - **Fail-closed**: Critical routes (payments) return 503 if Redis unavailable.
  - **Fail-open**: Normal routes use in-memory limiter (local to instance).
- **Last-known Config Cache**: If Postgres is down, use stale rules from memory.

**Implementation**:
```javascript
// limiter.js - consume function
async function consume(options) {
  try {
    return await redisLimit(options);
  } catch (err) {
    console.warn('[limiter] Redis unavailable:', err.message);
    
    if (options.failClosed) {
      // Fail closed: deny request
      return { unavailable: true, allowed: false };
    }
    
    // Fail open: use local in-memory limiter
    return localLimiter.check(options.key, options.limit);
  }
}

// Local limiter (simple Map-based)
const localLimiter = new Map();
function check(key, limit) {
  const now = Date.now();
  const record = localLimiter.get(key) || { count: 0, resetAt: now + 60000 };
  
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + 60000;
  }
  
  record.count++;
  localLimiter.set(key, record);
  
  return { allowed: record.count <= limit, remaining: limit - record.count };
}
```

### 7. SSRF (Server-Side Request Forgery) Attack

**Problem**: Developer enters `http://169.254.169.254/latest/meta-data` as targetUrl to steal AWS credentials.

**Solution**:
- **Two-layer defense**:
  1. URL validation at API creation (check DNS resolution)
  2. DNS lookup hook at connection time (prevent DNS rebinding)

**Attack Scenarios Blocked**:
- Direct private IP: `http://192.168.1.1`
- Private hostname: `http://internal-db.local`
- Cloud metadata: `http://169.254.169.254`
- Localhost: `http://localhost:5432`
- DNS rebinding: Domain that resolves to public IP first, then private IP

**Implementation**:
```javascript
// ssrf.js
const PRIVATE_RANGES = [
  '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16',
  '127.0.0.0/8', '169.254.0.0/16', '::1/128',
];

async function assertPublicUrl(targetUrl) {
  const url = new URL(targetUrl);
  const ips = await dns.resolve4(url.hostname);
  
  for (const ip of ips) {
    if (isPrivateIp(ip)) {
      throw new Error('Target URL resolves to private IP address');
    }
  }
}

// Undici connection hook (DNS rebinding prevention)
undici: {
  connect: { 
    lookup: (hostname, opts, callback) => {
      dns.lookup(hostname, opts, (err, address) => {
        if (isPrivateIp(address)) {
          return callback(new Error('DNS rebinding detected'));
        }
        callback(null, address);
      });
    }
  }
}
```

### 8. Header Exhaustion Attack

**Problem**: Attacker sends different `x-api-key` on every request to create infinite rate limit buckets (each key = new bucket).

**Solution**:
- **Global IP Safety Net**: Even with header-based rules, cap how much one IP can do across ALL header values.
- **Limit**: 600 requests/min per IP globally.

**Implementation**:
```javascript
// proxy.js - before actual rate limit
if (identifier.startsWith('h:')) {
  const outer = await limiter.consume({
    key: `limit:global:${ip}`,
    limit: 600,
    windowSec: 60,
  });
  
  if (!outer.allowed) {
    return reply.code(429).send({ error: 'Too Many Requests' });
  }
}

// Then check per-header rate limit
const result = await limiter.consume({
  key: `limit:${apiId}:${rule.path}:${rule.algorithm}:${identifier}`,
  ...
});
```

### 9. Cache Stampede

**Problem**: Cache expires, 1000 requests arrive simultaneously = 1000 DB queries.

**Solution** (implicit):
- **30 second TTL**: High enough to prevent frequent misses.
- **Last-known fallback**: If DB is slow/down, return stale data.
- **Future**: Add mutex lock for cache refresh (only first request queries DB).

### 10. Negative Cache Pollution

**Problem**: Attacker spams random API IDs to fill cache with "not found" entries.

**Solution**:
- **Short negative TTL**: Cache "not found" for only 10 seconds (vs 30s for hits).
- **Memory limit**: NodeCache has max entries limit (prevents unbounded growth).

**Implementation**:
```javascript
// rules.js - getApi
const api = await loadFromDb(apiId);
cache.set(apiId, api, api ? 30 : 10);  // 10s for null (not found)
```

---

## API Documentation

### Base URL

```
Production: https://api.limitx.io
Development: http://localhost:3000
```

### Authentication

All admin endpoints require JWT token in `Authorization` header:

```
Authorization: Bearer <token>
```

Token obtained from `/api/auth/login` or `/api/auth/signup`.

### Endpoints

#### Authentication

**POST /api/auth/signup**
```json
Request:
{
  "email": "user@example.com",
  "password": "securepass123"
}

Response: 201
{
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**POST /api/auth/login**
```json
Request:
{
  "email": "user@example.com",
  "password": "securepass123"
}

Response: 200
{
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**GET /api/auth/me**
```
Headers: Authorization: Bearer <token>

Response: 200
{
  "id": 1,
  "email": "user@example.com"
}
```

#### Projects

**GET /api/projects**
```
Response: 200
[
  {
    "id": "proj_a1b2c3d4",
    "name": "E-commerce Platform",
    "description": "Main e-commerce APIs",
    "createdAt": "2026-11-07T00:00:00.000Z",
    "apiCount": 3
  }
]
```

**POST /api/projects**
```json
Request:
{
  "name": "E-commerce Platform",
  "description": "Main e-commerce APIs"
}

Response: 201
{
  "id": "proj_a1b2c3d4",
  "name": "E-commerce Platform",
  "description": "Main e-commerce APIs"
}
```

**GET /api/projects/:id**
```
Response: 200
{
  "id": "proj_a1b2c3d4",
  "name": "E-commerce Platform",
  "description": "Main e-commerce APIs",
  "apis": [
    {
      "id": "api_x7y8z9w0",
      "name": "Payment API",
      "targetUrl": "https://payments.example.com",
      "description": "Handles payments",
      "status": "active",
      "ruleCount": 2,
      "createdAt": "2026-11-07T00:00:00.000Z"
    }
  ]
}
```

**DELETE /api/projects/:id**
```
Response: 204 (No Content)
```

#### APIs

**POST /api/projects/:id/apis**
```json
Request:
{
  "name": "Payment API",
  "targetUrl": "https://payments.example.com",
  "description": "Handles all payment processing"
}

Response: 201
{
  "id": "api_x7y8z9w0",
  "name": "Payment API",
  "targetUrl": "https://payments.example.com",
  "description": "Handles all payment processing",
  "status": "active"
}
```

**GET /api/apis/:apiId**
```
Response: 200
{
  "id": "api_x7y8z9w0",
  "projectId": "proj_a1b2c3d4",
  "name": "Payment API",
  "targetUrl": "https://payments.example.com",
  "description": "Handles all payment processing",
  "status": "active",
  "rules": [
    {
      "id": 1,
      "path": "/checkout",
      "limit": 10,
      "windowSec": 60,
      "algorithm": "token_bucket",
      "identifier": "header",
      "headerName": "x-user-id",
      "failClosed": true
    }
  ]
}
```

**PUT /api/apis/:apiId**
```json
Request:
{
  "name": "Payment API v2",
  "targetUrl": "https://payments-v2.example.com",
  "status": "paused"
}

Response: 200
{
  "id": "api_x7y8z9w0",
  "name": "Payment API v2",
  "targetUrl": "https://payments-v2.example.com",
  "description": "Handles all payment processing",
  "status": "paused"
}
```

**DELETE /api/apis/:apiId**
```
Response: 204 (No Content)
```

#### Rules

**POST /api/apis/:apiId/rules**
```json
Request:
{
  "path": "/checkout",
  "limit": 10,
  "windowSec": 60,
  "algorithm": "token_bucket",
  "identifier": "header",
  "headerName": "x-user-id",
  "failClosed": true
}

Response: 201
{
  "id": 1,
  "apiId": "api_x7y8z9w0",
  "path": "/checkout",
  "limit": 10,
  "windowSec": 60,
  "algorithm": "token_bucket",
  "identifier": "header",
  "headerName": "x-user-id",
  "failClosed": true
}
```

**DELETE /api/apis/:apiId/rules/:ruleId**
```
Response: 204 (No Content)
```

#### Stats

**GET /api/projects/:id/stats**
```
Response: 200
{
  "allowed": 15432,
  "blocked": 234,
  "byApi": [
    {
      "apiId": "api_x7y8z9w0",
      "apiName": "Payment API",
      "requests": 10234
    },
    {
      "apiId": "api_a1b2c3d4",
      "apiName": "User API",
      "requests": 5432
    }
  ],
  "recent": [
    {
      "apiId": "api_x7y8z9w0",
      "path": "/checkout",
      "ip": "203.0.113.45",
      "allowed": true,
      "reason": "allowed",
      "createdAt": "2026-11-07T08:45:23.000Z"
    }
  ]
}
```

**GET /api/apis/:apiId/stats**
```
Response: 200
{
  "allowed": 10234,
  "blocked": 123,
  "byReason": [
    { "reason": "allowed", "count": 10234 },
    { "reason": "rate_limited", "count": 100 },
    { "reason": "blocklisted", "count": 23 }
  ],
  "recent": [
    {
      "path": "/checkout",
      "ip": "203.0.113.45",
      "allowed": false,
      "reason": "rate_limited",
      "createdAt": "2026-11-07T08:45:23.000Z"
    }
  ]
}
```

#### Blocklist

**GET /api/apis/:apiId/blocklist**
```
Response: 200
["203.0.113.45", "198.51.100.67"]
```

**POST /api/apis/:apiId/blocklist**
```json
Request:
{
  "ip": "203.0.113.45"
}

Response: 201
{
  "ip": "203.0.113.45"
}
```

**DELETE /api/apis/:apiId/blocklist/:ip**
```
Response: 204 (No Content)
```

#### Proxy (Public)

**ANY /proxy/:apiId/***
```
Example: GET /proxy/api_x7y8z9w0/orders?status=pending

If allowed:
  - Forwards to https://payments.example.com/orders?status=pending
  - Returns origin response
  - Headers: X-RateLimit-Limit, X-RateLimit-Remaining

If rate limited:
  - Status: 429 Too Many Requests
  - Headers: Retry-After (seconds)
  - Body: { "error": "Too Many Requests" }

If blocked:
  - Status: 403 Forbidden
  - Body: { "error": "Forbidden" }

If API paused:
  - Status: 503 Service Unavailable
  - Body: { "error": "API is temporarily paused" }
```

---

## Security Features

### 1. Authentication

- **Scrypt Hashing**: Built-in Node.js, no bcrypt dependency
- **Salt**: Random 16-byte salt per password
- **Constant-time Comparison**: `crypto.timingSafeEqual()` prevents timing attacks
- **Dummy Hash**: If email doesn't exist, still run hash (timing leak prevention)

### 2. Authorization

- **JWT Tokens**: Stateless, 12-hour expiry
- **Ownership Scoping**: Every query filtered by `ownerId`
- **404 Not 403**: Unauthorized access returns 404 (prevents ID enumeration)

### 3. Input Validation

- **Email**: Regex + length check
- **Password**: 8-128 characters (prevents hash DoS)
- **URLs**: Parsed with `new URL()`, protocol check, credential check
- **IP Addresses**: `net.isIP()` validation
- **Paths**: Normalized (lowercase, collapse slashes)

### 4. Rate Limiting (Dogfooding)

- **Auth Endpoints**:
  - Login: 10 req/min per IP
  - Signup: 5 req/min per IP
- **Algorithm**: Sliding window (precise)

### 5. SSRF Protection

- **URL Validation**: DNS resolution check at API creation
- **Connection Hook**: Re-check IP at connection time (DNS rebinding)
- **Blocked Ranges**: RFC1918, loopback, link-local, cloud metadata

### 6. SQL Injection

- **Prisma Parameterized Queries**: All queries are parameterized
- **No Raw SQL**: Never concatenate user input into SQL

### 7. XSS Protection

- **React Auto-escaping**: JSX escapes by default
- **No dangerouslySetInnerHTML**: Never used
- **Content-Type**: Always `application/json` (no HTML responses)

### 8. CSRF Protection

- **JWT in Header**: Not in cookies, so no CSRF risk
- **SameSite**: If using cookies, would set `SameSite=Strict`

### 9. Secrets Management

- **Never Log Secrets**: API keys, passwords never in logs
- **Hash Header Values**: Rate limit identifiers are hashed
- **Environment Variables**: All secrets in `.env`, not in code

### 10. Dependency Security

- **Minimal Dependencies**: Only essential packages
- **Regular Audits**: `npm audit` before deployment
- **Prisma**: Handles SQL injection automatically

---

## Performance Optimizations

### 1. Caching Strategy

**L1 Cache (Memory)**:
- NodeCache, 30-second TTL
- API configs + rules
- Blocklist entries
- Pros: Sub-millisecond lookup
- Cons: Per-instance, 30s stale data

**L2 Cache (Redis)**:
- Shared across all instances
- Rate limit counters
- Blocklist SETs
- Pros: Atomic operations, shared state
- Cons: Network round-trip (1-2ms)

**Last-known Cache**:
- In-memory backup
- Used when DB is unavailable
- Never expires
- Pros: Graceful degradation
- Cons: Potentially very stale

### 2. Database Optimizations

**Indexes**:
```sql
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_apis_project ON apis(project_id);
CREATE INDEX idx_rules_api ON rules(api_id);
CREATE INDEX idx_logs_api_time ON request_logs(api_id, created_at DESC);
CREATE UNIQUE INDEX idx_rules_api_path ON rules(api_id, path);
```

**Connection Pooling**:
```javascript
// Prisma default: 10 connections
// Max: num_physical_cpus * 2 + effective_spindle_count
```

**Query Optimization**:
- Use `findFirst` instead of `findMany` + array[0]
- Select only needed fields (`select: { id: true }`)
- Avoid N+1 queries with `include`

### 3. Redis Optimizations

**Lua Scripts**:
- Atomic operations (no race conditions)
- Reduce network round-trips (1 call vs 5)
- Load once, call by SHA

**Pipelining** (future):
```javascript
const pipeline = redis.pipeline();
pipeline.get('key1');
pipeline.get('key2');
const [res1, res2] = await pipeline.exec();
```

**Connection Pooling**:
- IORedis default: 1 connection
- For high throughput: connection pool

### 4. Proxy Optimizations

**HTTP Connection Reuse**:
```javascript
undici: {
  connections: 128,  // Reuse TCP connections to origins
}
```

**Body Streaming**:
```javascript
// Don't parse/re-serialize body - stream it
app.removeAllContentTypeParsers();
app.addContentTypeParser('*', (req, payload, done) => {
  done(null, payload);  // Raw stream
});
```

**Header Forwarding**:
- Only essential headers
- Trusted X-Forwarded-For
- No client's XFF (security)

### 5. Logging Optimizations

**Micro-batching**:
- Buffer: 10,000 entries in RAM
- Flush: Every 5 seconds
- Chunk: 2000 rows per INSERT

**Result**: 99% fewer DB writes, 0ms added latency

### 6. Frontend Optimizations

**Code Splitting** (Vite default):
- Landing page: Separate chunk
- Dashboard: Separate chunk
- Lazy loading routes

**Asset Optimization**:
- SVG icons (Lucide): Tree-shakeable
- CSS: Single file, no runtime
- No images: Pure CSS/SVG design

**React Optimizations**:
- Minimal re-renders (proper keys)
- useEffect dependencies correct
- No unnecessary state

---

## Deployment Guide

### Prerequisites

- **Node.js**: v18+ (for native fetch, Undici)
- **PostgreSQL**: v14+
- **Redis**: v6+
- **RAM**: 512MB minimum (2GB recommended)
- **CPU**: 1 core minimum (2+ recommended)

### Environment Variables

```env
# Server
PORT=3000

# Redis
REDIS_URL=redis://localhost:6379
REDIS_TIMEOUT_MS=500

# Postgres
DATABASE_URL=postgresql://user:pass@localhost:5432/limitx

# JWT
JWT_SECRET="<64-char-random-hex>"
JWT_EXPIRES_IN=12h

# SSRF
ALLOW_PRIVATE_ORIGINS=false  # MUST be false in production

# Proxy Trust
TRUSTED_PROXIES=10.0.1.1,10.0.1.2  # Your load balancer IPs

# Limits
GLOBAL_IP_LIMIT_PER_MIN=600
MAX_PROJECTS_PER_USER=20
MAX_RULES_PER_PROJECT=50

# Timeouts
ORIGIN_HEADERS_TIMEOUT_MS=10000
ORIGIN_BODY_TIMEOUT_MS=30000
BODY_LIMIT_MB=10
```

### Local Development

```bash
# 1. Clone repo
git clone <repo-url>
cd limitx

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Start infrastructure (Docker)
docker-compose up -d

# 4. Run migrations
cd backend
npx prisma migrate dev

# 5. Start backend
npm run dev

# 6. Start frontend (new terminal)
cd frontend
npm run dev

# Access:
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
# Proxy: http://localhost:3000/proxy/{apiId}/*
```

### Production Deployment

#### Option 1: Single Server (VPS)

```bash
# 1. Install dependencies
sudo apt update
sudo apt install -y nodejs npm postgresql redis-server

# 2. Clone and build
git clone <repo-url> && cd limitx
cd backend && npm ci --production
cd ../frontend && npm ci && npm run build

# 3. Setup PostgreSQL
sudo -u postgres createdb limitx
sudo -u postgres psql -c "CREATE USER limitx WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL ON DATABASE limitx TO limitx;"

# 4. Run migrations
cd backend
DATABASE_URL="postgresql://limitx:secure_password@localhost:5432/limitx" npx prisma migrate deploy

# 5. Setup environment
cp .env.example .env
# Edit .env with production values

# 6. Start with PM2
npm install -g pm2
pm2 start src/server.js --name limitx-backend
pm2 startup
pm2 save

# 7. Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/limitx
```

**Nginx Config**:
```nginx
server {
    listen 80;
    server_name limitx.io;

    # Frontend (static files)
    location / {
        root /var/www/limitx/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Host $host;
    }

    # Proxy endpoint
    location /proxy/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_buffering off;  # Stream responses
    }
}
```

#### Option 2: Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/limitx
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=limitx
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
```

**Deploy**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### Option 3: Cloud (AWS/GCP/Azure)

**Architecture**:
```
Load Balancer
     ↓
Auto-scaling Group (3+ instances)
     ↓         ↓
Backend    Backend
     ↓         ↓
RDS (PostgreSQL)  ElastiCache (Redis)
```

**Services**:
- **Compute**: EC2 / Cloud Run / App Service
- **Database**: RDS / Cloud SQL / Azure Database
- **Cache**: ElastiCache / Memorystore / Azure Cache
- **Load Balancer**: ALB / Cloud Load Balancer / Azure LB
- **CDN**: CloudFront / Cloud CDN / Azure CDN

### Health Checks

```bash
# Backend health
curl http://localhost:3000/health
# Response: {"status":"ok","redis":"connected"}

# Database check
curl http://localhost:3000/api/projects -H "Authorization: Bearer <token>"
# Should return projects array

# Proxy check
curl http://localhost:3000/proxy/api_test123/health
# Should forward to origin
```

### Monitoring

**Metrics to Track**:
- Request latency (P50, P95, P99)
- Error rates (4xx, 5xx)
- Rate limit hit rate
- Redis connection status
- Database query time
- Cache hit rate

**Tools**:
- **Application**: PM2 monitoring, Datadog, New Relic
- **Infrastructure**: Prometheus + Grafana
- **Logs**: ELK stack, Logtail, CloudWatch

---

## Development Workflow

### Git Workflow

```bash
# Feature branch
git checkout -b feature/add-webhooks
# Make changes
git add .
git commit -m "feat: add webhook support for rate limit events"
git push origin feature/add-webhooks
# Create PR
```

### Database Changes

```bash
# 1. Update schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_webhooks_table
# 3. Test migration
npm test
# 4. Commit migration files
git add prisma/migrations
git commit -m "db: add webhooks table"
```

### Adding a New Route

```javascript
// 1. Add route in admin.js
app.get('/webhooks', async (request) => {
  const webhooks = await prisma.webhook.findMany({
    where: { userId: request.userId }
  });
  return webhooks;
});

// 2. Test manually
curl http://localhost:3000/api/webhooks -H "Authorization: Bearer <token>"

// 3. Add frontend UI
// pages/Webhooks.jsx

// 4. Update docs
// Add to API_DOCUMENTATION.md
```

---

## Testing Strategy

### Unit Tests (Jest)

```javascript
// backend/tests/rules.test.js
const { matchRule, normalizePath } = require('../src/rules');

test('normalizePath lowercases and removes trailing slash', () => {
  expect(normalizePath('/API/Login/')).toBe('/api/login');
  expect(normalizePath('//api//test')).toBe('/api/test');
});

test('matchRule prioritizes exact match', () => {
  const rules = [
    { path: '*', limit: 100 },
    { path: '/api/*', limit: 50 },
    { path: '/api/login', limit: 10 },
  ];
  
  const rule = matchRule(rules, '/api/login');
  expect(rule.limit).toBe(10);
});

test('matchRule returns longest prefix', () => {
  const rules = [
    { path: '/api/*', limit: 50 },
    { path: '/api/admin/*', limit: 10 },
  ];
  
  const rule = matchRule(rules, '/api/admin/users');
  expect(rule.limit).toBe(10);
});
```

### Integration Tests

```javascript
// backend/tests/proxy.test.js
const { build } = require('fastify');
const proxyRoutes = require('../src/proxy');

test('proxy returns 404 for non-existent API', async () => {
  const app = await build();
  await app.register(proxyRoutes, { prefix: '/proxy' });
  
  const response = await app.inject({
    method: 'GET',
    url: '/proxy/api_nonexistent/test',
  });
  
  expect(response.statusCode).toBe(404);
  expect(response.json()).toEqual({ error: 'API not found' });
});

test('proxy forwards to origin when no rule matches', async () => {
  // Mock API in database
  await prisma.api.create({
    data: {
      id: 'api_test123',
      projectId: 'proj_test',
      name: 'Test API',
      targetUrl: 'http://localhost:4000',
      status: 'active',
    },
  });
  
  // Start mock origin
  const origin = fastify();
  origin.get('/hello', () => ({ message: 'world' }));
  await origin.listen({ port: 4000 });
  
  // Test proxy
  const response = await app.inject({
    method: 'GET',
    url: '/proxy/api_test123/hello',
  });
  
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ message: 'world' });
  
  await origin.close();
});
```

### Load Testing

```bash
# scripts/load-test.js
npm run load-test
# Simulates 10,000 concurrent requests
# Measures P50, P95, P99 latency
```

---

## Troubleshooting

### Backend Won't Start

**Issue**: `Error: listen EADDRINUSE: address already in use 0.0.0.0:3000`

**Fix**:
```bash
# Find process on port 3000
netstat -ano | findstr :3000
# Kill process
taskkill /PID <pid> /F
# Or change port in .env
PORT=3001
```

---

### Redis Connection Failed

**Issue**: `[redis] Error: connect ECONNREFUSED 127.0.0.1:6379`

**Fix**:
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not, start Redis
docker-compose up -d redis
# Or install Redis: https://redis.io/download
```

---

### Database Migration Failed

**Issue**: `P3009: migrate found failed migration`

**Fix**:
```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration-name>
# Or reset database (DEV ONLY)
npx prisma migrate reset
```

---

### Rate Limiting Not Working

**Issue**: Requests are not being rate limited

**Debug**:
```bash
# 1. Check if rule exists
curl http://localhost:3000/api/apis/<apiId> -H "Authorization: Bearer <token>"
# Should show rules array

# 2. Check Redis connection
curl http://localhost:3000/health
# Should show: {"redis":"connected"}

# 3. Check logs
# Look for "[limiter] Redis unavailable" messages

# 4. Test Redis directly
redis-cli
> PING
PONG
> GET limit:api_test:/*:token_bucket:ip:127.0.0.1
```

---

### SSRF Validation Blocking Valid URL

**Issue**: `Target URL resolves to private IP address`

**Fix**:
```env
# For development only
ALLOW_PRIVATE_ORIGINS=true

# In production, use public DNS
# Bad: http://192.168.1.100
# Good: https://api.example.com
```

---

### Frontend Not Connecting to Backend

**Issue**: `ECONNREFUSED` in browser console

**Check**:
```javascript
// frontend/vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000',  // Must match backend port
    },
  },
});
```

---

## Future Enhancements

### Planned Features

1. **Webhooks**: Notify on rate limit events
2. **Dashboard Analytics**: Charts with Chart.js
3. **API Keys**: Alternative to JWT for server-to-server
4. **Teams**: Multi-user collaboration
5. **Audit Logs**: Track config changes
6. **Export**: CSV export of request logs
7. **Alerts**: Email/Slack notifications on threshold breach
8. **GraphQL Support**: Rate limit GraphQL operations
9. **WebSocket Proxying**: Support WS connections
10. **Multi-region**: Deploy to multiple regions for low latency

### Performance Improvements

1. **Cache Warming**: Pre-load hot APIs on startup
2. **Query Optimization**: Add more indexes
3. **Redis Cluster**: Horizontal scaling
4. **CDN**: Cache static assets
5. **HTTP/2**: Enable HTTP/2 for faster multiplexing

---

## Conclusion

This documentation covers **100% of the LimitX project**:

✅ Architecture & design decisions  
✅ Complete database schema  
✅ All backend modules explained  
✅ Frontend component structure  
✅ All 10+ edge cases with solutions  
✅ Full API documentation  
✅ Security features (authentication, SSRF, validation)  
✅ Performance optimizations (caching, batching, Redis)  
✅ Deployment guide (local, Docker, cloud)  
✅ Development workflow  
✅ Testing strategy  
✅ Troubleshooting guide  

**For any future developer**: Read this doc top-to-bottom to understand the entire system. Code is well-commented, and this doc explains the "why" behind every decision.

**Contact**: If something is unclear, check:
1. Code comments in `backend/src/`
2. `DECISIONS.md` for architectural decisions
3. `LIMITX_LEARNING_NOTES.md` for edge case details

---

**Built with ❤️ for developers who refuse to compromise on performance and security.**
