// SSRF protection. Users choose the origin URL, so without this someone could create a project that points
// LimitX at internal services (localhost, private networks, cloud metadata at 169.254.169.254).
// Two layers:
//   1. assertPublicUrl(): friendly error when the project is created.
//   2. safeLookup(): checked again when LimitX connects. Without this, DNS rebinding works: a hostname that was
//      public at creation time could later resolve to an internal IP.
const net = require('net');
const dns = require('dns');
const config = require('./config');
const { normalizeIp } = require('./ip');

const blocked = new net.BlockList();
for (const [addr, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['224.0.0.0', 4], ['240.0.0.0', 4],
]) blocked.addSubnet(addr, prefix, 'ipv4');
for (const [addr, prefix] of [['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]]) {
  blocked.addSubnet(addr, prefix, 'ipv6');
}

function isPrivateAddress(address) {
  // "::ffff:127.0.0.1" is IPv4 in disguise -> normalized to IPv4 first
  const normalized = normalizeIp(address);
  const family = net.isIP(normalized);
  if (family === 0) return true; // not an IP at all, refuse
  return blocked.check(normalized, family === 4 ? 'ipv4' : 'ipv6');
}

// Used as undici's connect.lookup: the address we validate is exactly the address we connect to.
function safeLookup(hostname, options, callback) {
  dns.lookup(hostname, options, (err, address, family) => {
    if (err) return callback(err);
    const list = Array.isArray(address) ? address : [{ address, family }];
    if (list.some((a) => isPrivateAddress(a.address))) {
      const e = new Error('Origin resolves to a private or internal address');
      e.code = 'ORIGIN_BLOCKED';
      return callback(e);
    }
    return Array.isArray(address) ? callback(null, address) : callback(null, address, family);
  });
}

async function assertPublicUrl(urlString) {
  if (config.allowPrivateOrigins) return;
  const host = new URL(urlString).hostname.replace(/^\[|\]$/g, '');
  const reject = () => {
    const e = new Error('targetUrl must point to a public address (private and internal addresses are not allowed)');
    e.statusCode = 400;
    return e;
  };
  if (net.isIP(host)) {
    if (isPrivateAddress(host)) throw reject();
    return;
  }
  let addresses;
  try {
    addresses = await dns.promises.lookup(host, { all: true });
  } catch {
    const e = new Error('targetUrl host could not be resolved');
    e.statusCode = 400;
    throw e;
  }
  if (addresses.some((a) => isPrivateAddress(a.address))) throw reject();
}

module.exports = { assertPublicUrl, safeLookup, isPrivateAddress };
