// Zero-dependency Demo Target Backend (Port 4001)
// Serves a mini E-Commerce app (Landing, Login, Orders) to test LimitX Reverse Proxy end-to-end.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.DEMO_PORT || 4001);
const HTML_PATH = path.join(__dirname, 'public', 'index.html');

let originHits = 0;

const PRODUCTS = [
  { id: 'prod_1', name: 'Mechanical Keyboard', category: 'PERIPHERALS', price: 129, stock: 18 },
  { id: 'prod_2', name: 'Ultralight Gaming Mouse', category: 'PERIPHERALS', price: 79, stock: 34 },
  { id: 'prod_3', name: 'Arena Tournament Pass', category: 'ACCESS', price: 25, stock: 99 },
  { id: 'prod_4', name: 'Studio Monitor Headset', category: 'AUDIO', price: 149, stock: 12 },
];

// In-memory store per demo user token
const activeTokens = new Map(); // token -> { email, name }
const orders = [
  { id: 'ORD-9021', item: 'Mechanical Keyboard', amount: 129, status: 'DELIVERED', user: 'shiva@demo.com', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'ORD-9022', item: 'Arena Tournament Pass', amount: 25, status: 'CONFIRMED', user: 'shiva@demo.com', createdAt: new Date(Date.now() - 3600000).toISOString() },
];

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 1024 * 1024) {
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function getBearerUser(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  return activeTokens.get(token) || null;
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  // Serve UI
  if (req.method === 'GET' && urlPath === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(HTML_PATH, 'utf8'));
  }

  // Direct health check (used by UI counter without incrementing API traffic hits)
  if (req.method === 'GET' && urlPath === '/api/health') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'NovaStore Origin Backend',
      originHits,
    });
  }

  // Track real API traffic that actually reached this origin backend
  if (urlPath.startsWith('/api/')) {
    originHits++;
    const hitId = originHits;
    const xff = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[ORIGIN HIT #${hitId}] ${req.method} ${urlPath} | from: ${xff}`);
  }

  // 1. Public Products endpoint
  if (req.method === 'GET' && urlPath === '/api/products') {
    return sendJson(res, 200, {
      products: PRODUCTS,
      originHits,
    });
  }

  // 2. Unauthenticated Login endpoint (IP-based rate limit target)
  if (req.method === 'POST' && urlPath === '/api/auth/login') {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON payload' });
    }

    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    // Demo credentials: shiva@demo.com / limitx123
    if (email !== 'shiva@demo.com' || password !== 'limitx123') {
      return sendJson(res, 401, { error: 'Invalid email or password' });
    }

    const token = 'nova_' + crypto.randomBytes(12).toString('hex');
    const user = { email, name: 'Shiva' };
    activeTokens.set(token, user);

    return sendJson(res, 200, {
      token,
      user,
      message: 'Login successful',
    });
  }

  // 3. Authenticated Orders endpoints (Header-based Authorization rate limit target)
  if (urlPath === '/api/orders') {
    const user = getBearerUser(req);
    if (!user) {
      return sendJson(res, 401, { error: 'Unauthorized — Login required (Bearer token missing or expired)' });
    }

    if (req.method === 'GET') {
      return sendJson(res, 200, {
        orders: orders.slice().reverse(),
        user,
        originHits,
      });
    }

    if (req.method === 'POST') {
      let body;
      try {
        body = await readJsonBody(req);
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON payload' });
      }
      const item = String(body.item || 'Mechanical Keyboard').trim();
      const amount = Number(body.amount || 129);
      const newOrder = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        item,
        amount,
        status: 'CONFIRMED',
        user: user.email,
        createdAt: new Date().toISOString(),
      };
      orders.push(newOrder);
      return sendJson(res, 201, { order: newOrder, originHits });
    }
  }

  return sendJson(res, 404, { error: 'Not found on NovaStore Origin' });
});

server.listen(PORT, () => {
  console.log(`\nNovaStore Demo App running on http://localhost:${PORT}`);
  console.log(`Demo Login -> email: shiva@demo.com | pass: limitx123\n`);
});
