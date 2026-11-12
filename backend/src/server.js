const fs = require('fs');
const path = require('path');
const Fastify = require('fastify');
const config = require('./config');
const redis = require('./redis');
const prisma = require('./db');
const requestLog = require('./requestLog');

const FRONTEND_DIST_DIR = path.resolve(__dirname, '../../frontend/dist');
const INDEX_HTML_PATH = path.join(FRONTEND_DIST_DIR, 'index.html');
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const app = Fastify({
  logger: false,
  // false = never trust X-Forwarded-For. Or a list of your load balancer IPs: then request.ip is the
  // rightmost IP that is NOT one of them (the real client).
  trustProxy: config.trustedProxies,
  bodyLimit: config.bodyLimitBytes,
});

app.register(require('@fastify/jwt'), { secret: config.jwtSecret, sign: { expiresIn: config.jwtExpiresIn } });

if (config.corsOrigins.length > 0) {
  const allowedOrigins = new Set(config.corsOrigins);
  app.addHook('onRequest', async (request, reply) => {
    const pathname = request.url.split('?')[0];
    if (pathname !== '/api' && !pathname.startsWith('/api/')) return;
    const origin = request.headers.origin;
    if (!origin || !allowedOrigins.has(origin)) return;
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Vary', 'Origin');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (request.method === 'OPTIONS') {
      return reply.code(204).send();
    }
  });
}

app.setErrorHandler((err, request, reply) => {
  if (err.retryAfter) reply.header('Retry-After', err.retryAfter);
  const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;
  if (statusCode >= 500) {
    console.error('[server] unhandled error:', err);
    return reply.code(statusCode).send({
      statusCode,
      error: 'Internal Server Error',
      message: 'Internal server error',
    });
  }
  return reply.code(statusCode).send({
    statusCode,
    error: err.name || 'Error',
    message: err.message,
  });
});

const healthHandler = async () => ({ status: 'ok', redis: redis.status });
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.register(require('./auth'), { prefix: '/api/auth' });
app.register(require('./admin'), { prefix: '/api' });
app.register(require('./proxy'), { prefix: '/proxy' });

async function sendStaticFile(reply, filePath, method, cacheControl) {
  const stat = await fs.promises.stat(filePath).catch(() => null);
  if (!stat || !stat.isFile()) return false;
  const ext = path.extname(filePath).toLowerCase();
  reply
    .code(200)
    .header('Content-Type', MIME_TYPES[ext] || 'application/octet-stream')
    .header('Content-Length', stat.size)
    .header('Cache-Control', cacheControl);
  if (method === 'HEAD') {
    reply.send();
    return true;
  }
  reply.send(fs.createReadStream(filePath));
  return true;
}

// Serve the built React SPA when frontend/dist exists, leaving /api/* and /proxy/* 404s as JSON.
app.setNotFoundHandler(async (request, reply) => {
  const pathname = request.url.split('?')[0];
  const isApiOrProxy =
    pathname === '/api' || pathname.startsWith('/api/') ||
    pathname === '/proxy' || pathname.startsWith('/proxy/');

  if (isApiOrProxy || (request.method !== 'GET' && request.method !== 'HEAD')) {
    return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'Route not found' });
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return reply.code(400).send({ statusCode: 400, error: 'Bad Request', message: 'Invalid URL path' });
  }

  const relPath = decodedPath.replace(/^\/+/, '');
  if (relPath) {
    const candidate = path.resolve(FRONTEND_DIST_DIR, relPath);
    if (candidate.startsWith(FRONTEND_DIST_DIR + path.sep)) {
      const cacheControl = relPath === 'index.html'
        ? 'no-cache'
        : relPath.startsWith('assets/')
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600';
      if (await sendStaticFile(reply, candidate, request.method, cacheControl)) {
        return reply;
      }
    }
    // Missing asset file (e.g. stale hashed chunk) should return 404 rather than HTML.
    if (path.extname(relPath)) {
      return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'Asset not found' });
    }
  }

  if (await sendStaticFile(reply, INDEX_HTML_PATH, request.method, 'no-cache')) {
    return reply;
  }

  return reply.code(404).send({
    statusCode: 404,
    error: 'Not Found',
    message: 'Frontend build not found. Run "npm --prefix frontend run build" or use the Vite dev server.',
  });
});

// Graceful shutdown: finish in-flight requests, flush the last logs, close connections.
async function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  try {
    await app.close();
    await requestLog.flush();
    await redis.quit().catch(() => {});
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

app.listen({ port: config.port, host: '0.0.0.0' }).then(() => {
  console.log(`LimitX running on http://localhost:${config.port}`);
});
