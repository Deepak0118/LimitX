// Normalize IPv4-mapped IPv6 addresses (e.g. "::ffff:127.0.0.1" -> "127.0.0.1")
// so rate limits and blocklists match consistently across dual-stack sockets.
function normalizeIp(ip) {
  const raw = String(ip || '').trim();
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(raw);
  return mapped ? mapped[1] : raw;
}

module.exports = { normalizeIp };
