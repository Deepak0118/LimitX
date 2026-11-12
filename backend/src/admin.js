// Dashboard API. Every route needs a valid JWT, and EVERY query is scoped to the logged-in user (owner).
// If a project belongs to someone else we answer 404, exactly like a project that does not exist,
// so nobody can even discover which project ids exist. (Without this scoping you get an IDOR bug.)
const crypto = require('crypto');
const net = require('net');
const config = require('./config');
const prisma = require('./db');
const rules = require('./rules');
const blocklist = require('./blocklist');
const ssrf = require('./ssrf');
const requestLog = require('./requestLog');
const { normalizeIp } = require('./ip');
const { ALGORITHMS } = require('./limiter');
const { httpError } = require('./errors');

function parseTargetUrl(value) {
  let url;
  try {
    url = new URL(String(value));
  } catch {
    throw httpError(400, 'targetUrl must be a valid URL');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw httpError(400, 'targetUrl must start with http:// or https://');
  if (url.username || url.password) throw httpError(400, 'targetUrl must not contain a username or password');
  if (url.search || url.hash) throw httpError(400, 'targetUrl must not contain a query string or hash');
  return url.toString().replace(/\/+$/, '');
}

function parseRule(body) {
  let path = String(body.path || '').trim();
  if (path !== '*') {
    if (!path.startsWith('/')) throw httpError(400, 'path must start with "/" (or be "*")');
    if (path.includes('?') || path.includes('#')) throw httpError(400, 'path must not include query string or hash');
    try {
      decodeURIComponent(path);
    } catch {
      throw httpError(400, 'path contains invalid percent-encoding');
    }
    path = rules.normalizePath(path);
    if (path.includes('*') && (!path.endsWith('/*') || path.slice(0, -1).includes('*'))) {
      throw httpError(400, 'Wildcard "*" is only supported as "*" or at the end like "/api/*"');
    }
  }
  const limit = Number(body.limit);
  const windowSec = Number(body.windowSec);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000000) throw httpError(400, 'limit must be an integer 1..1000000');
  if (!Number.isInteger(windowSec) || windowSec < 1 || windowSec > 86400) throw httpError(400, 'windowSec must be an integer 1..86400');
  const algorithm = body.algorithm === undefined ? 'token_bucket' : String(body.algorithm);
  if (!Object.keys(ALGORITHMS).includes(algorithm)) {
    throw httpError(400, `algorithm must be one of: ${Object.keys(ALGORITHMS).join(', ')}`);
  }
  const identifier = body.identifier === 'header' ? 'header' : 'ip';
  let headerName = null;
  if (identifier === 'header') {
    headerName = String(body.headerName || '').trim().toLowerCase();
    if (!/^[a-z0-9-]{1,64}$/.test(headerName)) throw httpError(400, 'headerName is required for header rules (letters, numbers, dashes)');
  }
  return { path, limit, windowSec, algorithm, identifier, headerName, failClosed: Boolean(body.failClosed) };
}

module.exports = async function adminRoutes(app) {
  app.addHook('onRequest', async (request) => {
    await request.jwtVerify(); // 401 if missing / invalid / expired
    const userId = Number(request.user?.sub);
    if (!Number.isInteger(userId) || userId <= 0) throw httpError(401, 'Invalid token');
    request.userId = userId;
  });

  // The ONE place that decides "is this project mine?". Every project route goes through it.
  async function ownedProject(request) {
    const project = await prisma.project.findFirst({ where: { id: request.params.id, ownerId: request.userId } });
    if (!project) throw httpError(404, 'Project not found');
    return project;
  }

  // Check if API belongs to user (through project ownership)
  async function ownedApi(request, includeRules = false) {
    const api = await prisma.api.findFirst({
      where: { id: request.params.apiId },
      include: {
        project: true,
        ...(includeRules && { rules: { orderBy: { path: 'asc' } } }),
      },
    });
    if (!api || api.project.ownerId !== request.userId) throw httpError(404, 'API not found');
    return api;
  }

  // ---- Projects ----
  app.get('/projects', async (request) => {
    const projects = await prisma.project.findMany({
      where: { ownerId: request.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        apis: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            status: true,
            targetUrl: true,
            _count: { select: { rules: true } },
          },
        },
      },
    });
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      apiCount: p.apis.length,
      activeCount: p.apis.filter((a) => a.status === 'active').length,
      ruleCount: p.apis.reduce((acc, a) => acc + a._count.rules, 0),
      services: p.apis.map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        targetUrl: a.targetUrl,
        ruleCount: a._count.rules,
      })),
    }));
  });

  app.post('/projects', async (request, reply) => {
    const name = String(request.body?.name || '').trim();
    if (!name || name.length > 100) throw httpError(400, 'name is required (max 100 chars)');
    
    const description = request.body?.description ? String(request.body.description).trim() : null;
    if (description && description.length > 500) throw httpError(400, 'description max 500 chars');

    const count = await prisma.project.count({ where: { ownerId: request.userId } });
    if (count >= config.maxProjectsPerUser) throw httpError(403, `Project limit reached (${config.maxProjectsPerUser})`);

    const id = 'proj_' + crypto.randomBytes(4).toString('hex');
    try {
      await prisma.project.create({ data: { id, name, description, ownerId: request.userId } });
    } catch (err) {
      if (err.code === 'P2003') throw httpError(401, 'Account no longer exists');
      throw err;
    }
    return reply.code(201).send({ id, name, description });
  });

  app.get('/projects/:id', async (request) => {
    const p = await prisma.project.findFirst({
      where: { id: request.params.id, ownerId: request.userId },
      include: { 
        apis: { 
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { rules: true } },
          },
        },
      },
    });
    if (!p) throw httpError(404, 'Project not found');
    return { 
      id: p.id, 
      name: p.name, 
      description: p.description,
      apis: p.apis.map(a => ({
        id: a.id,
        name: a.name,
        targetUrl: a.targetUrl,
        description: a.description,
        status: a.status,
        ruleCount: a._count.rules,
        createdAt: a.createdAt,
      })),
    };
  });

  app.delete('/projects/:id', async (request, reply) => {
    const project = await ownedProject(request);

    const apis = await prisma.api.findMany({ where: { projectId: project.id }, select: { id: true } });
    const apiIds = apis.map((a) => a.id);
    await requestLog.dropApis(apiIds);
    await Promise.all(apiIds.map((id) => blocklist.clearApi(id)));

    await prisma.$transaction([
      ...(apiIds.length > 0
        ? [
            prisma.requestLog.deleteMany({ where: { apiId: { in: apiIds } } }),
            prisma.rule.deleteMany({ where: { apiId: { in: apiIds } } }),
            prisma.api.deleteMany({ where: { id: { in: apiIds } } }),
          ]
        : []),
      prisma.project.delete({ where: { id: project.id } }),
    ]);
    for (const id of apiIds) rules.invalidateApi(id);
    return reply.code(204).send();
  });

  // ---- APIs ----
  app.get('/projects/:id/apis', async (request) => {
    const project = await ownedProject(request);
    const apis = await prisma.api.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { rules: true } },
      },
    });
    return apis.map((a) => ({
      id: a.id,
      name: a.name,
      targetUrl: a.targetUrl,
      description: a.description,
      status: a.status,
      ruleCount: a._count.rules,
      createdAt: a.createdAt,
    }));
  });

  app.get('/apis/:apiId', async (request) => {
    const api = await ownedApi(request, true);
    return {
      id: api.id,
      projectId: api.projectId,
      name: api.name,
      targetUrl: api.targetUrl,
      description: api.description,
      status: api.status,
      rules: api.rules,
    };
  });

  app.post('/projects/:id/apis', async (request, reply) => {
    const project = await ownedProject(request);
    
    const name = String(request.body?.name || '').trim();
    if (!name || name.length > 100) throw httpError(400, 'name is required (max 100 chars)');
    
    const targetUrl = parseTargetUrl(request.body?.targetUrl);
    await ssrf.assertPublicUrl(targetUrl);
    
    const description = request.body?.description ? String(request.body.description).trim() : null;
    if (description && description.length > 500) throw httpError(400, 'description max 500 chars');

    // Check API limit per project
    const count = await prisma.api.count({ where: { projectId: project.id } });
    if (count >= config.maxApisPerProject) throw httpError(403, `API limit reached (${config.maxApisPerProject} per project)`);

    const id = 'api_' + crypto.randomBytes(4).toString('hex');
    const api = await prisma.api.create({
      data: { 
        id, 
        projectId: project.id, 
        name, 
        targetUrl, 
        description,
        status: 'active',
      },
    });

    return reply.code(201).send({
      id: api.id,
      name: api.name,
      targetUrl: api.targetUrl,
      description: api.description,
      status: api.status,
    });
  });

  app.put('/apis/:apiId', async (request, reply) => {
    const api = await ownedApi(request);
    const body = request.body || {};

    const updates = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name || name.length > 100) throw httpError(400, 'name must be 1-100 chars');
      updates.name = name;
    }
    if (body.targetUrl !== undefined) {
      const targetUrl = parseTargetUrl(body.targetUrl);
      await ssrf.assertPublicUrl(targetUrl);
      updates.targetUrl = targetUrl;
    }
    if (body.description !== undefined) {
      const desc = String(body.description).trim();
      if (desc.length > 500) throw httpError(400, 'description max 500 chars');
      updates.description = desc || null;
    }
    if (body.status !== undefined) {
      if (!['active', 'paused'].includes(body.status)) {
        throw httpError(400, 'status must be active or paused');
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return {
        id: api.id,
        name: api.name,
        targetUrl: api.targetUrl,
        description: api.description,
        status: api.status,
      };
    }

    const updated = await prisma.api.update({
      where: { id: api.id },
      data: updates,
    });

    // Invalidate cache
    rules.invalidateApi(api.id);

    return {
      id: updated.id,
      name: updated.name,
      targetUrl: updated.targetUrl,
      description: updated.description,
      status: updated.status,
    };
  });

  app.delete('/apis/:apiId', async (request, reply) => {
    const api = await ownedApi(request);

    await requestLog.dropApis([api.id]);
    await prisma.$transaction([
      prisma.requestLog.deleteMany({ where: { apiId: api.id } }),
      prisma.rule.deleteMany({ where: { apiId: api.id } }),
      prisma.api.delete({ where: { id: api.id } }),
    ]);

    // Clear caches
    rules.invalidateApi(api.id);
    await blocklist.clearApi(api.id);

    return reply.code(204).send();
  });

  // ---- Rules (API-based) ----
  app.post('/apis/:apiId/rules', async (request, reply) => {
    const api = await ownedApi(request);
    const data = parseRule(request.body || {});
    
    const existing = await prisma.rule.count({ where: { apiId: api.id } });
    if (existing >= config.maxRulesPerProject) throw httpError(403, `Rule limit reached (${config.maxRulesPerProject})`);
    
    try {
      const rule = await prisma.rule.create({ data: { ...data, apiId: api.id } });
      rules.invalidateApi(api.id);
      return reply.code(201).send(rule);
    } catch (err) {
      if (err.code === 'P2002') throw httpError(409, 'A rule for this path already exists');
      throw err;
    }
  });

  app.delete('/apis/:apiId/rules/:ruleId', async (request, reply) => {
    const api = await ownedApi(request);
    const ruleId = Number(request.params.ruleId);
    if (!Number.isInteger(ruleId) || ruleId <= 0) throw httpError(400, 'Invalid ruleId');
    const { count } = await prisma.rule.deleteMany({ where: { id: ruleId, apiId: api.id } });
    if (count === 0) throw httpError(404, 'Rule not found');
    rules.invalidateApi(api.id);
    return reply.code(204).send();
  });

  // ---- Stats ----
  // Project stats (aggregated across all APIs)
  app.get('/projects/:id/stats', async (request) => {
    const project = await ownedProject(request);
    await requestLog.flush();
    
    // Get all APIs for this project
    const apis = await prisma.api.findMany({
      where: { projectId: project.id },
      select: { id: true, name: true },
    });

    if (apis.length === 0) {
      return { allowed: 0, blocked: 0, byApi: [], recent: [] };
    }

    const apiIds = apis.map(a => a.id);
    const where = { apiId: { in: apiIds }, createdAt: { gt: new Date(Date.now() - 24 * 3600 * 1000) } };
    
    const [allowed, blocked, byApiRaw, recent] = await Promise.all([
      prisma.requestLog.count({ where: { ...where, allowed: true } }),
      prisma.requestLog.count({ where: { ...where, allowed: false } }),
      prisma.requestLog.groupBy({
        by: ['apiId'],
        where,
        _count: { _all: true },
      }),
      prisma.requestLog.findMany({
        where: { apiId: { in: apiIds } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { path: true, ip: true, identifier: true, allowed: true, reason: true, createdAt: true, apiId: true },
      }),
    ]);

    const countByApi = new Map(byApiRaw.map((r) => [r.apiId, r._count._all]));
    const byApi = apis
      .map((api) => ({ apiId: api.id, apiName: api.name, requests: countByApi.get(api.id) || 0 }))
      .sort((a, b) => b.requests - a.requests);

    return { allowed, blocked, byApi, recent };
  });

  // API stats (specific API)
  app.get('/apis/:apiId/stats', async (request) => {
    const api = await ownedApi(request);
    await requestLog.flush();
    const where = { apiId: api.id, createdAt: { gt: new Date(Date.now() - 24 * 3600 * 1000) } };
    
    const [allowed, blocked, byReason, byPathRaw, recent] = await Promise.all([
      prisma.requestLog.count({ where: { ...where, allowed: true } }),
      prisma.requestLog.count({ where: { ...where, allowed: false } }),
      prisma.requestLog.groupBy({ 
        by: ['reason'], 
        where, 
        _count: { _all: true }, 
        orderBy: { _count: { reason: 'desc' } },
      }),
      prisma.requestLog.groupBy({
        by: ['path', 'allowed'],
        where,
        _count: { _all: true },
      }),
      prisma.requestLog.findMany({
        where: { apiId: api.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { path: true, ip: true, identifier: true, allowed: true, reason: true, createdAt: true },
      }),
    ]);

    const pathMap = new Map();
    for (const row of byPathRaw) {
      const entry = pathMap.get(row.path) || { path: row.path, allowed: 0, blocked: 0 };
      if (row.allowed) entry.allowed += row._count._all;
      else entry.blocked += row._count._all;
      pathMap.set(row.path, entry);
    }

    return { 
      allowed, 
      blocked, 
      byReason: byReason.map((r) => ({ reason: r.reason, count: r._count._all })),
      byPath: Array.from(pathMap.values()),
      recent,
    };
  });

  // ---- Blocklist (per API) ----
  app.get('/apis/:apiId/blocklist', async (request) => {
    const api = await ownedApi(request);
    return blocklist.listApi(api.id);
  });

  app.post('/apis/:apiId/blocklist', async (request, reply) => {
    const api = await ownedApi(request);
    const ip = normalizeIp(request.body?.ip);
    if (!net.isIP(ip)) throw httpError(400, 'ip must be a valid IPv4/IPv6 address');
    await blocklist.addApi(api.id, ip);
    return reply.code(201).send({ ip });
  });

  app.delete('/apis/:apiId/blocklist/:ip', async (request, reply) => {
    const api = await ownedApi(request);
    const ip = normalizeIp(request.params.ip);
    if (!net.isIP(ip)) throw httpError(400, 'ip must be a valid IPv4/IPv6 address');
    await blocklist.removeApi(api.id, ip);
    return reply.code(204).send();
  });
};
