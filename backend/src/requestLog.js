// Analytics logging that never slows a request down:
// requests only push into memory; a timer writes everything to Postgres in a few batched queries every 5 seconds.
const prisma = require('./db');
const config = require('./config');

const buffer = [];
const MAX_BUFFER = 10000; // if Postgres is down for long, drop the oldest instead of using all memory
const CHUNK = 2000; // keeps each INSERT well below Postgres' limit on query parameters
let inFlight = null;

function push(entry) {
  if (buffer.length >= MAX_BUFFER) buffer.shift();
  buffer.push({ ...entry, createdAt: new Date() });
}

async function flush() {
  if (inFlight) return inFlight;
  if (buffer.length === 0) return;

  inFlight = (async () => {
    try {
      while (buffer.length > 0) {
        const batch = buffer.splice(0, buffer.length);
        for (let i = 0; i < batch.length; i += CHUNK) {
          const chunk = batch.slice(i, i + CHUNK);
          try {
            await prisma.requestLog.createMany({ data: chunk });
          } catch (err) {
            // If one API was deleted right before flush, keep all other logs instead of dropping the whole batch.
            if (err?.code !== 'P2003') throw err;
            for (const row of chunk) {
              await prisma.requestLog.create({ data: row }).catch((rowErr) => {
                if (rowErr?.code !== 'P2003') throw rowErr;
              });
            }
          }
        }
      }
    } catch (err) {
      // Analytics are allowed to be lossy. Rate limiting must keep working.
      console.warn(`[logs] dropped log rows:`, err.message);
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

async function dropApis(apiIds) {
  if (!apiIds || apiIds.length === 0) return;
  const idSet = new Set(apiIds);
  for (let i = buffer.length - 1; i >= 0; i--) {
    if (idSet.has(buffer[i].apiId)) buffer.splice(i, 1);
  }
  if (inFlight) await inFlight.catch(() => {});
  for (let i = buffer.length - 1; i >= 0; i--) {
    if (idSet.has(buffer[i].apiId)) buffer.splice(i, 1);
  }
}

async function pruneOldLogs() {
  if (!Number.isFinite(config.logRetentionDays) || config.logRetentionDays <= 0) return;
  try {
    const cutoff = new Date(Date.now() - config.logRetentionDays * 24 * 3600 * 1000);
    await prisma.requestLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  } catch (err) {
    console.warn('[logs] retention cleanup skipped:', err.message);
  }
}

const timer = setInterval(flush, 5000);
timer.unref();

const pruneTimer = setInterval(pruneOldLogs, 60 * 60 * 1000);
pruneTimer.unref();

// Run an initial retention pass shortly after startup so periodic restarts still prune old logs.
setTimeout(pruneOldLogs, 60 * 1000).unref();

module.exports = { push, flush, dropApis, pruneOldLogs };
