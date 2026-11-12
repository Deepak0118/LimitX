export function getStatusMeta(log) {
  if (log.allowed) {
    if (log.reason === 'no_rule') return { text: 'Allowed · No rule', color: '#4A4843', tickColor: '#6E7F72' };
    if (log.reason === 'allowed_fallback') return { text: 'Allowed · Fallback', color: '#2F6B48', tickColor: '#2F6B48' };
    return { text: 'Allowed', color: '#2F6B48', tickColor: '#2F6B48' };
  }
  if (log.reason === 'blocklisted' || log.reason === 'ip_blocklist') {
    return { text: '403 Blocked', color: '#A83B2B', tickColor: '#A83B2B' };
  }
  if (log.reason === 'api_paused') {
    return { text: '503 Paused', color: '#A83B2B', tickColor: '#A83B2B' };
  }
  if (log.reason === 'redis_unavailable') {
    return { text: '503 Offline', color: '#A83B2B', tickColor: '#A83B2B' };
  }
  if (log.reason === 'ip_safety_limit') {
    return { text: '429 IP safety cap', color: '#9A6324', tickColor: '#B56E22' };
  }
  if (log.reason === 'rate_limited') {
    return { text: '429 Rate limited', color: '#9A6324', tickColor: '#B56E22' };
  }
  return {
    text: `429 Limited${log.reason ? ` · ${log.reason}` : ''}`,
    color: '#9A6324',
    tickColor: '#B56E22',
  };
}

const REASON_LABELS = {
  allowed: { label: 'Allowed (rule matched)', color: '#2F6B48' },
  allowed_fallback: { label: 'Allowed (fallback)', color: '#2F6B48' },
  no_rule: { label: 'Allowed (no matching rule)', color: '#5F5C55' },
  rate_limited: { label: '429 Rate limited', color: '#9A6324' },
  ip_safety_limit: { label: '429 Global IP safety cap', color: '#9A6324' },
  blocklisted: { label: '403 IP blocklist', color: '#A83B2B' },
  ip_blocklist: { label: '403 IP blocklist', color: '#A83B2B' },
  api_paused: { label: '503 Proxy paused', color: '#A83B2B' },
  redis_unavailable: { label: '503 Store unavailable', color: '#A83B2B' },
};

export function formatReasonMeta(reason) {
  return REASON_LABELS[reason] || { label: reason || 'Other', color: '#4A4843' };
}

export function formatIdentifierBadge(rawIdentifier) {
  const raw = rawIdentifier || '-';
  const isHeaderKey = raw.startsWith('h:');
  const text = isHeaderKey
    ? raw
    : raw.startsWith('ip:')
      ? raw.slice(3)
      : raw;

  return {
    text,
    isHeaderKey,
    color: isHeaderKey ? '#2B4C7E' : '#4A4843',
  };
}
