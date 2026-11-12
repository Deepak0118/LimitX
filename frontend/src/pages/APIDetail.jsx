import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, PROXY_BASE } from '../api';
import { getStatusMeta, formatIdentifierBadge, formatReasonMeta } from '../utils/telemetry';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { Loader, X, Plus, Trash2, Check, Copy, RefreshCw } from 'lucide-react';

export default function APIDetail() {
  const { apiId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('rules'); // 'rules', 'logs', 'blocklist', 'overview'
  const initializedTabForApi = useRef(null);
  const [apiData, setApiData] = useState(null);
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState({ allowed: 0, blocked: 0, byReason: [], byPath: [], recent: [] });
  const [blocklist, setBlocklist] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizeRoutePath = (raw) => {
    let out = ('/' + (raw || '')).split('?')[0].trim().replace(/\/{2,}/g, '/').toLowerCase();
    if (out.length > 1 && out.endsWith('/')) out = out.slice(0, -1);
    return out;
  };

  // Mirror backend/src/rules.js precedence so 24h path stats attribute to each active rule cleanly
  const matchRuleId = (rules, rawPath) => {
    if (!rules || rules.length === 0) return null;
    const p = normalizeRoutePath(rawPath);

    const exact = rules.find((r) => r.path !== '*' && !r.path.endsWith('/*') && normalizeRoutePath(r.path) === p);
    if (exact) return exact.id;

    const prefixes = rules
      .filter((r) => r.path.endsWith('/*'))
      .map((r) => ({ rule: r, norm: normalizeRoutePath(r.path) }))
      .sort((a, b) => b.norm.length - a.norm.length);

    for (const { rule, norm } of prefixes) {
      const prefix = norm.slice(0, -1);
      if (p.startsWith(prefix) || p === prefix.slice(0, -1)) {
        return rule.id;
      }
    }

    const catchAll = rules.find((r) => r.path === '*');
    return catchAll ? catchAll.id : null;
  };

  const computeRuleHits = (rules, byPath) => {
    const map = new Map();
    for (const r of rules || []) {
      map.set(r.id, { allowed: 0, blocked: 0, total: 0 });
    }
    for (const entry of byPath || []) {
      const matchedId = matchRuleId(rules, entry.path);
      if (!matchedId || !map.has(matchedId)) continue;
      const cur = map.get(matchedId);
      const allowed = entry.allowed || 0;
      const blocked = entry.blocked || 0;
      cur.allowed += allowed;
      cur.blocked += blocked;
      cur.total += allowed + blocked;
    }
    return map;
  };

  // Filters for Request Logs
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'allowed' | 'throttled' | 'blocked'
  const [ipFilter, setIpFilter] = useState('');

  // Modals & form state
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [copiedProxy, setCopiedProxy] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [statusToggling, setStatusToggling] = useState(false);

  const [ruleForm, setRuleForm] = useState({
    path: '*',
    limit: 100,
    windowSec: 60,
    algorithm: 'token_bucket',
    identifier: 'ip',
    headerName: '',
    failClosed: false,
  });

  const [blockIp, setBlockIp] = useState('');
  const [error, setError] = useState('');
  const [bannerError, setBannerError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !actionLoading && !statusToggling) {
        setShowRuleModal(false);
        setShowBlockModal(false);
        setShowPauseModal(false);
        setShowDeleteModal(false);
        setRuleToDelete(null);
        setError('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actionLoading, statusToggling]);

  useEffect(() => {
    loadAll();
  }, [apiId]);

  async function loadAll() {
    try {
      setLoading(true);
      const [apiRes, statsRes, blockRes] = await Promise.all([
        api(`/apis/${apiId}`),
        api(`/apis/${apiId}/stats`).catch(() => ({ allowed: 0, blocked: 0, byReason: [], byPath: [], recent: [] })),
        api(`/apis/${apiId}/blocklist`).catch(() => []),
      ]);

      setApiData(apiRes);
      setStats(statsRes);
      setBlocklist(blockRes || []);

      if (initializedTabForApi.current !== apiId) {
        initializedTabForApi.current = apiId;
        setActiveTab((apiRes.rules?.length || 0) > 0 ? 'logs' : 'rules');
      }

      if (apiRes.projectId) {
        api(`/projects/${apiRes.projectId}`).then(setProject).catch(() => null);
      }
    } catch (err) {
      console.error('Failed to load API details:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(nextStatus) {
    if (!apiData) return;
    try {
      setBannerError('');
      setError('');
      setStatusToggling(true);
      await api(`/apis/${apiId}`, { method: 'PUT', body: { status: nextStatus } });
      setApiData((prev) => ({ ...prev, status: nextStatus }));
      if (nextStatus === 'paused') setShowPauseModal(false);
    } catch (err) {
      if (nextStatus === 'paused') {
        setError('Failed to pause proxy: ' + err.message);
      } else {
        setBannerError('Failed to resume proxy: ' + err.message);
      }
    } finally {
      setStatusToggling(false);
    }
  }

  async function handleCreateRule(e) {
    e.preventDefault();
    setError('');
    setActionLoading(true);
    try {
      await api(`/apis/${apiId}/rules`, {
        method: 'POST',
        body: {
          path: ruleForm.path.trim() || '*',
          limit: Number(ruleForm.limit),
          windowSec: Number(ruleForm.windowSec),
          algorithm: ruleForm.algorithm,
          identifier: ruleForm.identifier,
          headerName: ruleForm.identifier === 'header' ? ruleForm.headerName.trim().toLowerCase() : undefined,
          failClosed: Boolean(ruleForm.failClosed),
        },
      });
      setShowRuleModal(false);
      setRuleForm({ path: '*', limit: 100, windowSec: 60, algorithm: 'token_bucket', identifier: 'ip', headerName: '', failClosed: false });
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to save route');
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmDeleteRule() {
    if (!ruleToDelete) return;
    setError('');
    setActionLoading(true);
    try {
      await api(`/apis/${apiId}/rules/${ruleToDelete.id}`, { method: 'DELETE' });
      setRuleToDelete(null);
      await loadAll();
    } catch (err) {
      setError('Failed to delete route: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddBlock(e) {
    e.preventDefault();
    setError('');
    setActionLoading(true);
    try {
      await api(`/apis/${apiId}/blocklist`, { method: 'POST', body: { ip: blockIp.trim() } });
      setShowBlockModal(false);
      setBlockIp('');
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to block IP');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveBlock(ip) {
    try {
      setBannerError('');
      await api(`/apis/${apiId}/blocklist/${encodeURIComponent(ip)}`, { method: 'DELETE' });
      await loadAll();
    } catch (err) {
      setBannerError('Failed to remove IP: ' + err.message);
    }
  }

  async function handleDeleteAPI() {
    setError('');
    setActionLoading(true);
    try {
      await api(`/apis/${apiId}`, { method: 'DELETE' });
      setShowDeleteModal(false);
      navigate(apiData?.projectId ? `/projects/${apiData.projectId}` : '/dashboard');
    } catch (err) {
      setError('Failed to delete service: ' + err.message);
      setActionLoading(false);
    }
  }

  function copyProxyUrl() {
    const url = `${PROXY_BASE}/proxy/${apiId}`;
    navigator.clipboard.writeText(url);
    setCopiedProxy(true);
    setTimeout(() => setCopiedProxy(false), 2000);
  }

  function copyCurlSnippet() {
    const snippet = `curl -i ${PROXY_BASE}/proxy/${apiId}/v1/resource`;
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  }

  const matchesStatus = (log, filter) => {
    if (filter === 'allowed') return log.allowed === true;
    if (filter === 'throttled') return log.allowed === false && log.reason !== 'blocklisted' && log.reason !== 'ip_blocklist';
    if (filter === 'blocked') return log.allowed === false && (log.reason === 'blocklisted' || log.reason === 'ip_blocklist');
    return true;
  };

  const recentLogs = stats.recent || [];

  // Filter logs based on status and IP search
  const filteredLogs = recentLogs.filter((log) => {
    if (ipFilter && !log.ip?.toLowerCase().includes(ipFilter.toLowerCase().trim())) {
      return false;
    }
    return matchesStatus(log, statusFilter);
  });

  if (loading) {
    return (
      <div className="loading-container">
        <Loader size={22} className="spin" style={{ color: '#1C1B18' }} />
        <span className="lab">Loading service...</span>
      </div>
    );
  }

  if (!apiData) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '56px 24px', textAlign: 'center' }}>
        <p style={{ color: '#5F5C55', marginBottom: '12px' }}>Service not found.</p>
        <Link to="/dashboard" className="btn btn-secondary btn-sm">Back to dashboard</Link>
      </div>
    );
  }

  const proxyUrl = `${PROXY_BASE}/proxy/${apiId}`;
  const isActive = apiData.status === 'active';
  const total24h = (stats.allowed || 0) + (stats.blocked || 0);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 64px' }}>
      {bannerError && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            backgroundColor: '#F9ECEA',
            border: '1px solid #E8C4BE',
            borderRadius: '2px',
            fontSize: '13px',
            color: '#A83B2B',
            marginBottom: '18px',
          }}
        >
          <span>{bannerError}</span>
          <button
            onClick={() => setBannerError('')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#A83B2B', display: 'inline-flex', padding: 0 }}
            aria-label="Dismiss error"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ marginBottom: '14px', fontSize: '13px', color: '#8C887F', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <Link to="/dashboard" style={{ color: '#5F5C55' }}>Projects</Link>
        {project && (
          <>
            <span>/</span>
            <Link to={`/projects/${project.id}`} style={{ color: '#5F5C55' }}>{project.name}</Link>
          </>
        )}
        <span>/</span>
        <span style={{ color: '#1C1B18', fontWeight: 500 }}>{apiData.name}</span>
      </div>

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: '32px', letterSpacing: '-0.03em', fontWeight: 400, color: '#1C1B18', lineHeight: 1.08 }}>
            {apiData.name}
          </h1>
          <span
            style={{
              fontSize: '13.5px',
              fontWeight: 500,
              color: isActive ? '#2F6B48' : '#9A6324',
            }}
          >
            &middot; {isActive ? 'Active' : 'Paused'}
          </span>
        </div>

        <button
          onClick={() => {
            if (isActive) {
              setError('');
              setShowPauseModal(true);
            } else {
              handleToggleStatus('active');
            }
          }}
          disabled={statusToggling}
          className="btn btn-secondary btn-sm"
        >
          {isActive ? 'Pause proxy' : statusToggling ? 'Resuming...' : 'Resume proxy'}
        </button>
      </div>

      {/* Warm Charcoal Connection Strip */}
      <div
        style={{
          background: '#22211E',
          color: '#FBF9F5',
          border: '1px solid #1C1B18',
          borderRadius: '2px',
          padding: '14px 18px',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontSize: '11.5px', color: '#A5A096', flexShrink: 0 }}>Proxy URL</span>
          <code style={{ font: '13px var(--font-mono)', color: '#FBF9F5', wordBreak: 'break-all' }}>{proxyUrl}</code>
          <button
            onClick={copyProxyUrl}
            style={{
              background: '#35332F',
              color: '#FBF9F5',
              borderRadius: '2px',
              padding: '4px 10px',
              font: '500 12px var(--font-sans)',
              border: '1px solid #4A4741',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0,
            }}
          >
            {copiedProxy ? <Check size={11} style={{ color: '#84CCA0' }} /> : <Copy size={11} />}
            <span>{copiedProxy ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontSize: '11.5px', color: '#A5A096', flexShrink: 0 }}>Forwards to &rarr;</span>
          <code style={{ font: '13px var(--font-mono)', color: '#D8D3C8', wordBreak: 'break-all' }}>{apiData.targetUrl}</code>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '26px',
          borderBottom: '1px solid #DCD7CD',
          fontSize: '13.5px',
          overflowX: 'auto',
          marginBottom: '22px',
        }}
      >
        {[
          { id: 'rules', label: `Routes (${apiData.rules?.length || 0})` },
          { id: 'logs', label: `Request logs (${total24h})` },
          { id: 'blocklist', label: `Blocklist (${blocklist.length})` },
          { id: 'overview', label: 'Overview' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '11px 0',
              background: 'transparent',
              border: 'none',
              borderRadius: 0,
              borderBottom: activeTab === tab.id ? '2px solid #1C1B18' : '2px solid transparent',
              fontWeight: activeTab === tab.id ? 500 : 400,
              color: activeTab === tab.id ? '#1C1B18' : '#5F5C55',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Request Logs */}
      {activeTab === 'logs' && (
        <div>
          {(!apiData.rules || apiData.rules.length === 0) && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                padding: '10px 14px',
                marginBottom: '14px',
                background: '#F2EFE8',
                border: '1px solid #DCD7CD',
                borderRadius: '2px',
                fontSize: '13px',
                color: '#4A4843',
              }}
            >
              <span>No rate-limit routes configured yet — incoming requests pass through without limits.</span>
              <button
                onClick={() => { setError(''); setShowRuleModal(true); }}
                className="btn btn-primary btn-sm"
                style={{ padding: '5px 11px', fontSize: '12px' }}
              >
                <Plus size={13} />
                <span>Add Route</span>
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', margin: '14px 0 14px', fontSize: '13px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Sharp Segmented Control */}
              <div
                style={{
                  display: 'inline-grid',
                  gridAutoFlow: 'column',
                  gap: '1px',
                  border: '1px solid #DCD7CD',
                  background: '#DCD7CD',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                {[
                  { id: 'all', label: `All (${recentLogs.length})` },
                  { id: 'allowed', label: `Allowed (${recentLogs.filter((l) => matchesStatus(l, 'allowed')).length})` },
                  { id: 'throttled', label: `429 (${recentLogs.filter((l) => matchesStatus(l, 'throttled')).length})` },
                  { id: 'blocked', label: `403 (${recentLogs.filter((l) => matchesStatus(l, 'blocked')).length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    style={{
                      border: 'none',
                      borderRadius: 0,
                      background: statusFilter === f.id ? '#22211E' : '#FBF9F5',
                      color: statusFilter === f.id ? '#FBF9F5' : '#4A4843',
                      padding: '7px 12px',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* IP search */}
              <input
                type="text"
                placeholder="Filter by IP..."
                value={ipFilter}
                onChange={(e) => setIpFilter(e.target.value)}
                style={{
                  width: '150px',
                  padding: '7px 11px',
                  fontSize: '12.5px',
                  background: '#FBF9F5',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {total24h > recentLogs.length && (
                <span style={{ fontSize: '12px', color: '#8C887F' }}>
                  Showing latest {recentLogs.length} of {total24h} (24h)
                </span>
              )}
              <button
                onClick={loadAll}
                className="btn btn-secondary btn-sm"
                style={{ padding: '7px 12px', fontSize: '12.5px' }}
              >
                <RefreshCw size={12} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div style={{ background: '#FBF9F5', border: '1px solid #DCD7CD', borderRadius: '2px', overflowX: 'auto' }}>
            <div
              className="hd"
              style={{
                gridTemplateColumns: '95px 125px 220px minmax(140px, 1fr) 220px',
                background: '#F2EFE8',
                borderBottom: '1px solid #DCD7CD',
                color: '#5F5C55',
              }}
            >
              <span>TIME</span>
              <span>IP</span>
              <span>BUCKET / KEY</span>
              <span>PATH</span>
              <span>STATUS</span>
            </div>

            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, idx) => {
                const timeStr = log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : 'now';
                const statusMeta = getStatusMeta(log);
                const ident = formatIdentifierBadge(log.identifier);

                return (
                  <div
                    key={idx}
                    className="row"
                    style={{
                      gridTemplateColumns: '95px 125px 220px minmax(140px, 1fr) 220px',
                      padding: '12px 20px',
                      font: '12.5px var(--font-mono)',
                      alignItems: 'center',
                      borderTop: idx === 0 ? 'none' : '1px solid #EAE6DD',
                      color: '#1C1B18',
                    }}
                  >
                    <span style={{ color: '#5F5C55' }}>{timeStr}</span>
                    <span style={{ color: '#4A4843' }}>{log.ip}</span>
                    <span style={{ color: ident.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ident.text}
                    </span>
                    <span>{log.path || '/'}</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: statusMeta.color,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {statusMeta.text}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#5F5C55', fontSize: '13.5px' }}>
                {stats.recent?.length > 0
                  ? 'No logs matching current filter.'
                  : `No requests recorded yet. Send API traffic to ${proxyUrl} to see live request logs.`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Routes */}
      {activeTab === 'rules' && (
        <div>
          {apiData.rules && apiData.rules.length > 0 ? (() => {
            const ruleHitsMap = computeRuleHits(apiData.rules, stats.byPath);
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 400, margin: 0, color: '#1C1B18' }}>Configured Routes</h2>
                    <div className="lab" style={{ color: '#5F5C55', marginTop: '3px' }}>Exact route paths take priority over wildcards (*)</div>
                  </div>
                  <button
                    onClick={() => {
                      setRuleForm({ path: '*', limit: 100, windowSec: 60, algorithm: 'token_bucket', identifier: 'ip', headerName: '', failClosed: false });
                      setError('');
                      setShowRuleModal(true);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    <Plus size={14} />
                    <span>Add Route</span>
                  </button>
                </div>

                <div style={{ background: '#FBF9F5', border: '1px solid #DCD7CD', borderRadius: '2px', overflowX: 'auto' }}>
                <div
                  className="hd"
                  style={{
                    gridTemplateColumns: 'minmax(120px, 1.2fr) 125px 125px minmax(130px, 1fr) 135px 165px 44px',
                    background: '#F2EFE8',
                    borderBottom: '1px solid #DCD7CD',
                    color: '#5F5C55',
                  }}
                >
                  <span>ROUTE PATH</span>
                  <span>RATE LIMIT</span>
                  <span>ALGORITHM</span>
                  <span>IDENTIFIER</span>
                  <span>FALLBACK</span>
                  <span>TRAFFIC (24H)</span>
                  <span></span>
                </div>

                {apiData.rules.map((rule, idx) => {
                  const hits = ruleHitsMap.get(rule.id) || { allowed: 0, blocked: 0, total: 0 };
                  return (
                    <div
                      key={rule.id || idx}
                      className="row"
                      style={{
                        gridTemplateColumns: 'minmax(120px, 1.2fr) 125px 125px minmax(130px, 1fr) 135px 165px 44px',
                        padding: '13px 20px',
                        font: '12.5px var(--font-mono)',
                        alignItems: 'center',
                        borderTop: idx === 0 ? 'none' : '1px solid #EAE6DD',
                        color: '#1C1B18',
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{rule.path}</span>
                      <span>{rule.limit} req / {rule.windowSec}s</span>
                      <span style={{ textTransform: 'capitalize', color: '#4A4843' }}>{rule.algorithm?.replace('_', ' ')}</span>
                      <span style={{ color: '#4A4843' }}>{rule.identifier === 'header' ? `Header: ${rule.headerName}` : 'Client IP'}</span>
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: rule.failClosed ? '#A83B2B' : '#5F5C55',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rule.failClosed ? 'Fail-closed (503)' : 'Fail-open'}
                      </span>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: '3px', lineHeight: 1.25 }}>
                        <span style={{ fontWeight: 500, color: '#1C1B18' }}>{hits.total} hits</span>
                        <span style={{ fontSize: '11px', color: '#5F5C55' }}>
                          <span style={{ color: '#2F6B48' }}>{hits.allowed} ok</span>
                          {' / '}
                          <span style={{ color: hits.blocked > 0 ? '#A83B2B' : '#5F5C55', fontWeight: hits.blocked > 0 ? 500 : 400 }}>
                            {hits.blocked} held
                          </span>
                        </span>
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => { setError(''); setRuleToDelete(rule); }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#A83B2B', padding: '4px' }}
                          title="Delete route"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              </>
            );
          })() : (
            <div
              style={{
                background: '#FBF9F5',
                border: '1px solid #DCD7CD',
                borderRadius: '2px',
                padding: '48px 24px',
                textAlign: 'center',
              }}
            >
              <h3 style={{ fontSize: '21px', fontWeight: 400, margin: '0 0 8px', color: '#1C1B18', letterSpacing: '-0.02em' }}>
                Add your first rate-limit route
              </h3>
              <p style={{ color: '#5F5C55', fontSize: '14px', lineHeight: 1.6, maxWidth: '470px', margin: '0 auto 22px' }}>
                Traffic currently passes through without limits. Add a rule for <code style={{ color: '#1C1B18' }}>*</code> (all routes) or a specific path like <code style={{ color: '#1C1B18' }}>/api/login</code>.
              </p>
              <button
                onClick={() => {
                  setRuleForm({ path: '*', limit: 100, windowSec: 60, algorithm: 'token_bucket', identifier: 'ip', headerName: '', failClosed: false });
                  setError('');
                  setShowRuleModal(true);
                }}
                className="btn btn-primary btn-sm"
                style={{ padding: '9px 18px', fontSize: '13.5px' }}
              >
                <Plus size={14} />
                <span>Add Route</span>
              </button>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: '#8C887F' }}>
                <span>Quick fill:</span>
                <button
                  type="button"
                  onClick={() => {
                    setRuleForm({ path: '*', limit: 100, windowSec: 60, algorithm: 'token_bucket', identifier: 'ip', headerName: '', failClosed: false });
                    setError('');
                    setShowRuleModal(true);
                  }}
                  style={{
                    background: '#F5F2EB',
                    border: '1px solid #DCD7CD',
                    borderRadius: '2px',
                    padding: '4px 10px',
                    font: '500 11.5px var(--font-mono)',
                    color: '#1C1B18',
                    cursor: 'pointer',
                  }}
                >
                  * · 100 req / 60s
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRuleForm({ path: '/api/login', limit: 5, windowSec: 60, algorithm: 'sliding_window', identifier: 'ip', headerName: '', failClosed: true });
                    setError('');
                    setShowRuleModal(true);
                  }}
                  style={{
                    background: '#F5F2EB',
                    border: '1px solid #DCD7CD',
                    borderRadius: '2px',
                    padding: '4px 10px',
                    font: '500 11.5px var(--font-mono)',
                    color: '#1C1B18',
                    cursor: 'pointer',
                  }}
                >
                  /api/login · 5 req / 60s
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Blocklist */}
      {activeTab === 'blocklist' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 400, margin: 0, color: '#1C1B18' }}>IP Blocklist</h2>
              <div className="lab" style={{ color: '#5F5C55', marginTop: '3px' }}>Requests from these IPs are immediately rejected with 403 Forbidden</div>
            </div>
            <button
              onClick={() => { setError(''); setShowBlockModal(true); }}
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} />
              <span>Block IP</span>
            </button>
          </div>

          <div style={{ background: '#FBF9F5', border: '1px solid #DCD7CD', borderRadius: '2px', overflowX: 'auto' }}>
            <div
              className="hd"
              style={{
                gridTemplateColumns: 'minmax(200px, 1fr) 100px',
                background: '#F2EFE8',
                borderBottom: '1px solid #DCD7CD',
                color: '#5F5C55',
              }}
            >
              <span>IP ADDRESS</span>
              <span style={{ textAlign: 'right' }}>ACTION</span>
            </div>

            {blocklist && blocklist.length > 0 ? (
              blocklist.map((ip, idx) => (
                <div
                  key={idx}
                  className="row"
                  style={{
                    gridTemplateColumns: 'minmax(200px, 1fr) 100px',
                    padding: '12px 20px',
                    font: '13px var(--font-mono)',
                    borderTop: idx === 0 ? 'none' : '1px solid #EAE6DD',
                  }}
                >
                  <span style={{ color: '#A83B2B', fontWeight: 500 }}>{ip}</span>
                  <div style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleRemoveBlock(ip)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                    >
                      Unblock
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: '#5F5C55', fontSize: '13.5px' }}>
                No IPs currently blocked.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Overview */}
      {activeTab === 'overview' && (() => {
        const sortedReasons = [...(stats.byReason || [])].sort((a, b) => (b.count || 0) - (a.count || 0));
        const topPaths = [...(stats.byPath || [])]
          .sort((a, b) => (b.allowed + b.blocked) - (a.allowed + a.blocked))
          .slice(0, 6);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Outcome & Top Endpoints Breakdown */}
            <div
              className="lx-overview-split"
              style={{
                gap: '1px',
                background: '#DCD7CD',
                border: '1px solid #DCD7CD',
              }}
            >
              {/* Left: Outcome Breakdown */}
              <div style={{ background: '#FBF9F5', padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <div className="cap">OUTCOME BREAKDOWN · 24H</div>
                  <div className="lab" style={{ color: '#5F5C55' }}>
                    {total24h} total · {stats.allowed || 0} allowed · {stats.blocked || 0} held
                  </div>
                </div>
                {sortedReasons.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {sortedReasons.map((item) => {
                      const meta = formatReasonMeta(item.reason);
                      const pct = total24h > 0 ? Math.round((item.count / total24h) * 100) : 0;
                      return (
                        <div
                          key={item.reason || 'other'}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                            paddingBottom: '8px',
                            borderBottom: '1px solid #EAE6DD',
                            fontSize: '13px',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#1C1B18' }}>
                            <span style={{ width: '7px', height: '7px', background: meta.color, display: 'inline-block', flexShrink: 0 }} />
                            <span>{meta.label}</span>
                          </span>
                          <span style={{ color: '#4A4843', fontFamily: 'var(--font-mono)', fontSize: '12px', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                            <strong style={{ fontWeight: 500, color: '#1C1B18' }}>{item.count}</strong>{' '}
                            <span style={{ color: '#8C887F' }}>({pct}%)</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="lab" style={{ color: '#8C887F', padding: '12px 0' }}>
                    No requests handled in the last 24 hours.
                  </div>
                )}
              </div>

              {/* Right: Top Endpoints */}
              <div style={{ background: '#FBF9F5', padding: '20px 22px' }}>
                <div className="cap" style={{ marginBottom: '12px' }}>TOP ENDPOINTS · 24H</div>
                {topPaths.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {topPaths.map((entry) => (
                      <div
                        key={entry.path}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          paddingBottom: '8px',
                          borderBottom: '1px solid #EAE6DD',
                          font: '12.5px var(--font-mono)',
                        }}
                      >
                        <span style={{ color: '#1C1B18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.path || '/'}
                        </span>
                        <span style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0, fontSize: '11.5px' }}>
                          <span style={{ color: '#2F6B48' }}>{entry.allowed || 0} ok</span>
                          <span style={{ color: '#8C887F' }}> / </span>
                          <span style={{ color: (entry.blocked || 0) > 0 ? '#A83B2B' : '#8C887F' }}>
                            {entry.blocked || 0} held
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="lab" style={{ color: '#8C887F', padding: '12px 0' }}>
                    No endpoint activity recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Request Flow */}
            <div className="card">
              <h3 style={{ fontSize: '20px', fontWeight: 400, margin: '0 0 18px', letterSpacing: '-0.02em', color: '#1C1B18' }}>
                How Requests Flow
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1px',
                  background: '#DCD7CD',
                  border: '1px solid #DCD7CD',
                }}
              >
                <div style={{ background: '#F5F2EB', padding: '16px 18px' }}>
                  <div className="cap" style={{ marginBottom: '6px' }}>PROXY URL</div>
                  <div style={{ font: '500 13px var(--font-mono)', color: '#1C1B18', wordBreak: 'break-all' }}>
                    {proxyUrl}
                  </div>
                  <div className="lab" style={{ marginTop: '4px' }}>Send client API requests here</div>
                </div>

                <div style={{ background: '#F5F2EB', padding: '16px 18px' }}>
                  <div className="cap" style={{ marginBottom: '6px' }}>YOUR BACKEND</div>
                  <div style={{ font: '500 13px var(--font-mono)', color: '#1C1B18', wordBreak: 'break-all' }}>
                    <code>{apiData.targetUrl}</code>
                  </div>
                  <div className="lab" style={{ marginTop: '4px' }}>Where allowed requests are forwarded</div>
                </div>

                <div style={{ background: '#F5F2EB', padding: '16px 18px' }}>
                  <div className="cap" style={{ marginBottom: '6px' }}>GATEWAY HEADERS</div>
                  <div style={{ font: '500 13px var(--font-mono)', color: '#1C1B18' }}>
                    X-RateLimit-Limit · Remaining · Retry-After
                  </div>
                  <div className="lab" style={{ marginTop: '4px' }}>
                    Rate headers on matched routes (Retry-After on 429/503); verified X-Forwarded-For upstream
                  </div>
                </div>
              </div>
            </div>

            {/* Integration Snippet */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 400, margin: '0 0 2px', color: '#1C1B18' }}>
                    Connect Your Client
                  </h3>
                  <div className="lab">Use this proxy URL as your API base URL instead of calling your backend directly</div>
                </div>
                <button
                  onClick={copyCurlSnippet}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '12.5px' }}
                >
                  {copiedSnippet ? <Check size={12} style={{ color: '#2F6B48' }} /> : <Copy size={12} />}
                  <span>{copiedSnippet ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '14px 16px',
                  backgroundColor: '#22211E',
                  color: '#FBF9F5',
                  border: '1px solid #1C1B18',
                  borderRadius: '2px',
                  overflowX: 'auto',
                  font: '13px/1.6 var(--font-mono)',
                }}
              >
                <code>{`curl -i ${proxyUrl}/v1/resource`}</code>
              </pre>
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#5F5C55' }}>
                Tip: Matched routes return <code style={{ color: '#1C1B18', fontSize: '12px' }}>X-RateLimit-Limit</code> and <code style={{ color: '#1C1B18', fontSize: '12px' }}>X-RateLimit-Remaining</code> (plus <code style={{ color: '#1C1B18', fontSize: '12px' }}>Retry-After</code> on 429/503). Forwarded requests carry a verified <code style={{ color: '#1C1B18', fontSize: '12px' }}>X-Forwarded-For</code> header upstream.
              </div>
            </div>

            {/* Danger Zone: Delete Service */}
            <div
              style={{
                border: '1px solid #E8C4BE',
                borderRadius: '2px',
                background: '#FBF9F5',
                padding: '18px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontWeight: 500, color: '#1C1B18', marginBottom: '3px' }}>Delete this service</div>
                <div style={{ fontSize: '13px', color: '#5F5C55' }}>
                  Removes this proxy URL and all configured routes. This cannot be undone.
                </div>
              </div>
              <button
                onClick={() => { setError(''); setShowDeleteModal(true); }}
                style={{
                  border: '1px solid #A83B2B',
                  color: '#A83B2B',
                  background: '#F9ECEA',
                  borderRadius: '2px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Delete Service
              </button>
            </div>
          </div>
        );
      })()}

      {/* Route Creation Modal */}
      {showRuleModal && (
        <div className="modal-overlay" onClick={() => setShowRuleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div
              className="modal-header"
              style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #EAE6DD', alignItems: 'center' }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0, letterSpacing: '-0.02em' }}>Configure Route</h2>
              <button
                type="button"
                onClick={() => setShowRuleModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5F5C55', padding: '4px' }}
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleCreateRule}>
              {error && (
                <div
                  style={{
                    padding: '9px 12px',
                    backgroundColor: '#F9ECEA',
                    border: '1px solid #E8C4BE',
                    borderRadius: '2px',
                    fontSize: '13px',
                    color: '#A83B2B',
                    marginBottom: '16px',
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label>Route Path</label>
                <input
                  type="text"
                  placeholder="*, /api/*, or /api/orders"
                  value={ruleForm.path}
                  onChange={(e) => setRuleForm({ ...ruleForm, path: e.target.value })}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label>Max Requests</label>
                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    step="1"
                    value={ruleForm.limit}
                    onChange={(e) => setRuleForm({ ...ruleForm, limit: e.target.value })}
                    style={{ fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>
                <div>
                  <label>Window (Seconds)</label>
                  <input
                    type="number"
                    min="1"
                    max="86400"
                    step="1"
                    value={ruleForm.windowSec}
                    onChange={(e) => setRuleForm({ ...ruleForm, windowSec: e.target.value })}
                    style={{ fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label>Algorithm</label>
                <select
                  value={ruleForm.algorithm}
                  onChange={(e) => setRuleForm({ ...ruleForm, algorithm: e.target.value })}
                >
                  <option value="token_bucket">Token Bucket (General APIs)</option>
                  <option value="sliding_window">Sliding Window (Strict)</option>
                  <option value="fixed_window">Fixed Window (Simple Quotas)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>Identifier</label>
                <select
                  value={ruleForm.identifier}
                  onChange={(e) => setRuleForm({ ...ruleForm, identifier: e.target.value })}
                >
                  <option value="ip">Client IP Address</option>
                  <option value="header">Request Header (e.g. x-api-key)</option>
                </select>
                {ruleForm.identifier === 'header' && (
                  <input
                    type="text"
                    placeholder="e.g. x-api-key"
                    maxLength={64}
                    pattern="[A-Za-z0-9-]{1,64}"
                    title="Use letters, numbers, and hyphens only (1-64 chars)"
                    value={ruleForm.headerName}
                    onChange={(e) => setRuleForm({ ...ruleForm, headerName: e.target.value })}
                    style={{ marginTop: '8px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                    required
                  />
                )}
              </div>

              {/* Fail-Closed Outage Toggle */}
              <div style={{ marginBottom: '24px', padding: '12px 14px', background: '#F2EFE8', border: '1px solid #DCD7CD', borderRadius: '2px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', margin: 0, fontWeight: 500, fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={ruleForm.failClosed}
                    onChange={(e) => setRuleForm({ ...ruleForm, failClosed: e.target.checked })}
                    style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div>
                    <span style={{ fontWeight: 500, color: '#1C1B18' }}>Fail-closed mode (return 503 if Redis fails)</span>
                    <div style={{ fontSize: '12px', color: '#5F5C55', marginTop: '3px', lineHeight: 1.45, fontWeight: 400 }}>
                      If Redis is temporarily unreachable, return 503 instead of falling back to per-instance in-memory limiting. Recommended for auth, login, and billing routes.
                    </div>
                  </div>
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid #EAE6DD',
                }}
              >
                <button type="button" onClick={() => setShowRuleModal(false)} className="btn btn-secondary btn-sm" disabled={actionLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block IP Modal */}
      {showBlockModal && (
        <div className="modal-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div
              className="modal-header"
              style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #EAE6DD', alignItems: 'center' }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0, letterSpacing: '-0.02em' }}>Block an IP Address</h2>
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5F5C55', padding: '4px' }}
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleAddBlock}>
              {error && (
                <div
                  style={{
                    padding: '9px 12px',
                    backgroundColor: '#F9ECEA',
                    border: '1px solid #E8C4BE',
                    borderRadius: '2px',
                    fontSize: '13px',
                    color: '#A83B2B',
                    marginBottom: '16px',
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label>IPv4 or IPv6 Address</label>
                <input
                  type="text"
                  placeholder="e.g. 198.51.100.14"
                  value={blockIp}
                  onChange={(e) => setBlockIp(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                  required
                  autoFocus
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid #EAE6DD',
                }}
              >
                <button type="button" onClick={() => setShowBlockModal(false)} className="btn btn-secondary btn-sm" disabled={actionLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={actionLoading}>
                  {actionLoading ? 'Blocking...' : 'Block IP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(ruleToDelete)}
        onClose={() => { setRuleToDelete(null); setError(''); }}
        onConfirm={confirmDeleteRule}
        eyebrow="REMOVE RATE LIMIT"
        title="Delete Route?"
        description={
          ruleToDelete && (
            <>
              Are you sure you want to remove the rate limit for{' '}
              <code
                style={{
                  font: '500 12.5px var(--font-mono)',
                  background: '#F2EFE8',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  border: '1px solid #DCD7CD',
                  color: '#1C1B18',
                }}
              >
                {ruleToDelete.path}
              </code>{' '}
              ({ruleToDelete.limit} req / {ruleToDelete.windowSec}s)? Matching requests will fall back to wildcard rules or pass unthrottled.
            </>
          )
        }
        confirmLabel="Delete route"
        loading={actionLoading}
        error={error}
      />

      <ConfirmDeleteModal
        open={showPauseModal}
        onClose={() => { setShowPauseModal(false); setError(''); }}
        onConfirm={() => handleToggleStatus('paused')}
        variant="warning"
        eyebrow="PAUSE PROXY"
        title={`Pause ${apiData.name}?`}
        description={
          <>
            Pausing this proxy immediately stops forwarding requests to{' '}
            <code
              style={{
                font: '500 12.5px var(--font-mono)',
                background: '#F2EFE8',
                padding: '2px 6px',
                borderRadius: '2px',
                border: '1px solid #DCD7CD',
                color: '#1C1B18',
              }}
            >
              {apiData.targetUrl}
            </code>.
          </>
        }
        impactItems={[
          `All incoming calls to /proxy/${apiId} will return 503 Service Unavailable`,
          'Your configured route rules and IP blocklist remain saved',
          'You can resume traffic anytime with one click',
        ]}
        confirmLabel="Pause proxy"
        loadingLabel="Pausing..."
        loading={statusToggling}
        error={error}
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setError(''); }}
        onConfirm={handleDeleteAPI}
        eyebrow="DANGER ZONE"
        title="Delete Service?"
        description={
          <>
            This action cannot be undone. Deleting <strong>{apiData.name}</strong> will permanently disconnect it from LimitX.
          </>
        }
        impactItems={[
          `Proxy URL /proxy/${apiId} stops forwarding immediately`,
          `${apiData.rules?.length || 0} route rule(s) and ${blocklist.length} blocked IP(s) will be removed`,
          'All traffic stats and request logs will be permanently deleted',
        ]}
        confirmText={apiData.name}
        confirmLabel="Delete service permanently"
        loading={actionLoading}
        error={error}
      />
    </div>
  );
}
