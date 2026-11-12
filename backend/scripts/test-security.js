// Security checks for the multi-user setup. Run with the server + Redis + Postgres up:
//   node scripts/test-security.js
// Signup is limited to 5 per minute per IP, so wait a minute between runs (or flush Redis).
const BASE = process.env.BASE || 'http://localhost:3000';
let failed = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json };
}
function check(name, ok, extra = '') {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  ' + extra}`);
}
const expect = (name, res, status) => check(name, res.status === status, `(got ${res.status}, wanted ${status})`);

(async () => {
  const run = Date.now();
  const pw = 'correct-horse-battery';

  console.log('\n-- accounts');
  const a = await call('POST', '/api/auth/signup', { body: { email: `a${run}@test.com`, password: pw } });
  const b = await call('POST', '/api/auth/signup', { body: { email: `b${run}@test.com`, password: pw } });
  expect('user A signs up', a, 201);
  expect('user B signs up', b, 201);
  const A = a.json.token, B = b.json.token;
  expect('duplicate email is refused', await call('POST', '/api/auth/signup', { body: { email: `a${run}@test.com`, password: pw } }), 409);
  expect('short password is refused', await call('POST', '/api/auth/signup', { body: { email: `c${run}@test.com`, password: 'short' } }), 400);
  expect('wrong password gives 401', await call('POST', '/api/auth/login', { body: { email: `a${run}@test.com`, password: 'wrong-password-1' } }), 401);
  expect('unknown email gives the same 401', await call('POST', '/api/auth/login', { body: { email: `nobody${run}@test.com`, password: 'wrong-password-1' } }), 401);
  expect('correct login works', await call('POST', '/api/auth/login', { body: { email: `a${run}@test.com`, password: pw } }), 200);

  console.log('\n-- no / bad token');
  expect('no token -> 401', await call('GET', '/api/projects'), 401);
  expect('garbage token -> 401', await call('GET', '/api/projects', { token: 'abc.def.ghi' }), 401);

  console.log('\n-- user A creates a project and API');
  const p = await call('POST', '/api/projects', { token: A, body: { name: 'A project' } });
  expect('A creates project', p, 201);
  const projId = p.json.id;

  const apiRes = await call('POST', `/api/projects/${projId}/apis`, {
    token: A,
    body: { name: 'A API', targetUrl: 'http://localhost:4000' },
  });
  expect('A creates API', apiRes, 201);
  const apiId = apiRes.json.id;

  const r = await call('POST', `/api/apis/${apiId}/rules`, {
    token: A,
    body: { path: '/x', limit: 5, windowSec: 60, identifier: 'ip' },
  });
  expect('A creates rule on API', r, 201);

  console.log('\n-- user B must NOT be able to touch A\'s project or API (all expect 404)');
  const listB = await call('GET', '/api/projects', { token: B });
  check('B does not see A\'s project in the list', listB.status === 200 && listB.json.length === 0);
  expect('B reads A\'s project', await call('GET', `/api/projects/${projId}`, { token: B }), 404);
  expect('B reads A\'s API', await call('GET', `/api/apis/${apiId}`, { token: B }), 404);
  expect('B adds a rule to A\'s API', await call('POST', `/api/apis/${apiId}/rules`, { token: B, body: { path: '/evil', limit: 1, windowSec: 60, identifier: 'ip' } }), 404);
  expect('B deletes A\'s rule', await call('DELETE', `/api/apis/${apiId}/rules/${r.json.id}`, { token: B }), 404);
  expect('B reads A\'s API stats', await call('GET', `/api/apis/${apiId}/stats`, { token: B }), 404);
  expect('B reads A\'s API blocklist', await call('GET', `/api/apis/${apiId}/blocklist`, { token: B }), 404);
  expect('B blocks an IP on A\'s API', await call('POST', `/api/apis/${apiId}/blocklist`, { token: B, body: { ip: '1.2.3.4' } }), 404);
  expect('B deletes A\'s API', await call('DELETE', `/api/apis/${apiId}`, { token: B }), 404);
  expect('B deletes A\'s project', await call('DELETE', `/api/projects/${projId}`, { token: B }), 404);
  const still = await call('GET', `/api/apis/${apiId}`, { token: A });
  check('A\'s API and rule are still intact', still.status === 200 && still.json.rules.length === 1);

  console.log('\n-- blocklist is per API');
  const pb = await call('POST', '/api/projects', { token: B, body: { name: 'B project' } });
  const apiB = await call('POST', `/api/projects/${pb.json.id}/apis`, {
    token: B,
    body: { name: 'B API', targetUrl: 'http://localhost:4000' },
  });
  await call('POST', `/api/apis/${apiB.json.id}/rules`, { token: B, body: { path: '*', limit: 100, windowSec: 60, identifier: 'ip' } });
  await call('POST', `/api/apis/${apiId}/blocklist`, { token: A, body: { ip: '127.0.0.1' } });
  expect('A blocks 127.0.0.1 -> A\'s proxy answers 403', await call('GET', `/proxy/${apiId}/x`), 403);
  expect('same IP on B\'s API is NOT blocked', await call('GET', `/proxy/${apiB.json.id}/x`), 200);
  await call('DELETE', `/api/apis/${apiId}/blocklist/127.0.0.1`, { token: A });
  expect('after unblock A\'s proxy works again', await call('GET', `/proxy/${apiId}/x`), 200);

  console.log('\n-- brute force protection on login (limit 10/min per IP)');
  let got429 = false;
  for (let i = 0; i < 12; i++) {
    const res = await call('POST', '/api/auth/login', { body: { email: `a${run}@test.com`, password: 'wrong-password-1' } });
    if (res.status === 429) { got429 = true; break; }
  }
  check('repeated wrong logins get 429', got429);

  console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
  process.exit(failed ? 1 : 0);
})();
