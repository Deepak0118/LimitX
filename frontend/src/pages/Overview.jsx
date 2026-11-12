import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, PROXY_BASE } from '../api';
import { getStatusMeta, formatIdentifierBadge } from '../utils/telemetry';
import { Loader, Copy, Check, RefreshCw, ArrowRight } from 'lucide-react';

export default function Overview() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [totals, setTotals] = useState({ allowed: 0, blocked: 0, routes: 0, activeServices: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadWorkspace();
  }, []);

  async function loadWorkspace(isManual = false) {
    if (isManual) setRefreshing(true);
    try {
      const projList = await api('/projects');
      const list = Array.isArray(projList) ? projList : [];
      setProjects(list);

      if (list.length === 0) {
        setServices([]);
        setRecentLogs([]);
        setTotals({ allowed: 0, blocked: 0, routes: 0, activeServices: 0 });
        return;
      }

      const [detailsList, statsList] = await Promise.all([
        Promise.all(list.map((p) => api(`/projects/${p.id}`).catch(() => ({ ...p, apis: [] })))),
        Promise.all(list.map((p) => api(`/projects/${p.id}/stats`).catch(() => ({ allowed: 0, blocked: 0, byApi: [], recent: [] })))),
      ]);

      const allServices = [];
      const serviceNameById = new Map();
      let routeCount = 0;
      let activeCount = 0;

      for (const proj of detailsList) {
        for (const svc of proj.apis || []) {
          allServices.push({
            ...svc,
            projectId: proj.id,
            projectName: proj.name,
          });
          serviceNameById.set(svc.id, svc.name);
          routeCount += svc.ruleCount || 0;
          if (svc.status === 'active') activeCount += 1;
        }
      }

      let allowed = 0;
      let blocked = 0;
      const mergedLogs = [];

      for (const st of statsList) {
        allowed += st.allowed || 0;
        blocked += st.blocked || 0;
        for (const entry of st.recent || []) {
          mergedLogs.push({
            ...entry,
            serviceName: serviceNameById.get(entry.apiId) || entry.apiId || '-',
          });
        }
      }

      mergedLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setServices(allServices);
      setRecentLogs(mergedLogs.slice(0, 20));
      setTotals({ allowed, blocked, routes: routeCount, activeServices: activeCount });
    } catch (err) {
      console.error('Failed to load workspace overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleCopy(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Loader size={22} className="spin" style={{ color: '#1C1B18' }} />
        <span className="lab">Loading workspace overview...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px 64px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '16px',
          flexWrap: 'wrap',
          paddingBottom: '24px',
          borderBottom: '1px solid #DCD7CD',
          marginBottom: '28px',
        }}
      >
        <div>
          <div style={{ fontSize: '13px', color: '#5F5C55', marginBottom: '6px' }}>
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} · {totals.activeServices}/{services.length} active services · {totals.routes} {totals.routes === 1 ? 'route' : 'routes'}
          </div>
          <h1 style={{ margin: 0, fontSize: '36px', letterSpacing: '-0.03em', fontWeight: 400, color: '#1C1B18', lineHeight: 1.08 }}>
            Overview
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => loadWorkspace(true)}
            disabled={refreshing}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <Link to="/dashboard" className="btn btn-primary btn-sm">
            <span>Manage Projects</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Connected Services Directory */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 400, letterSpacing: '-0.02em', color: '#1C1B18' }}>
              Connected Services
            </h2>
            <div className="lab" style={{ color: '#5F5C55', marginTop: '3px' }}>
              All backend services across your projects
            </div>
          </div>
        </div>

        {services.length > 0 ? (
          <div style={{ background: '#FBF9F5', border: '1px solid #DCD7CD', borderRadius: '2px', overflowX: 'auto' }}>
            <div
              className="hd"
              style={{
                gridTemplateColumns: '90px 150px 170px minmax(230px, 1fr) 85px 70px',
                background: '#F2EFE8',
                borderBottom: '1px solid #DCD7CD',
                color: '#5F5C55',
              }}
            >
              <span>STATUS</span>
              <span>PROJECT</span>
              <span>SERVICE</span>
              <span>PROXY URL</span>
              <span>ROUTES</span>
              <span style={{ textAlign: 'right' }}>OPEN</span>
            </div>

            {services.map((svc, idx) => {
              const proxyUrl = `${PROXY_BASE}/proxy/${svc.id}`;
              const isPaused = svc.status === 'paused';
              return (
                <div
                  key={svc.id}
                  onClick={(e) => {
                    if (!e.target.closest('button') && !e.target.closest('a')) {
                      navigate(`/apis/${svc.id}`);
                    }
                  }}
                  className="row"
                  style={{
                    gridTemplateColumns: '90px 150px 170px minmax(230px, 1fr) 85px 70px',
                    borderTop: idx === 0 ? 'none' : '1px solid #EAE6DD',
                    cursor: 'pointer',
                    backgroundColor: '#FBF9F5',
                    transition: 'background-color 120ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F2EB')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FBF9F5')}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: isPaused ? '#9A6324' : '#2F6B48',
                    }}
                  >
                    {isPaused ? 'Paused' : 'Active'}
                  </span>
                  <Link
                    to={`/projects/${svc.projectId}`}
                    style={{ fontSize: '13px', color: '#5F5C55', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {svc.projectName}
                  </Link>
                  <Link
                    to={`/apis/${svc.id}`}
                    style={{ fontSize: '14px', fontWeight: 500, color: '#1C1B18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {svc.name}
                  </Link>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ font: '12px var(--font-mono)', color: '#4A4843', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {proxyUrl}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(proxyUrl, svc.id);
                      }}
                      style={{
                        border: '1px solid #DCD7CD',
                        borderRadius: '2px',
                        padding: '3px 8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#1C1B18',
                        background: '#FBF9F5',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                      }}
                    >
                      {copiedId === svc.id ? <Check size={11} style={{ color: '#2F6B48' }} /> : <Copy size={11} />}
                      <span>{copiedId === svc.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#1C1B18' }}>
                    {svc.ruleCount || 0} {svc.ruleCount === 1 ? 'route' : 'routes'}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <Link to={`/apis/${svc.id}`} style={{ fontSize: '13px', fontWeight: 500, color: '#1C1B18' }}>
                      Open &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="cap">NO SERVICES YET</div>
            <p style={{ color: '#5F5C55', marginBottom: '18px', fontSize: '14px' }}>
              Create a project and connect a backend service to see request stats and logs here.
            </p>
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Go to Projects
            </Link>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <div style={{ marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 400, letterSpacing: '-0.02em', color: '#1C1B18' }}>
            Recent Activity
          </h2>
          <div className="lab" style={{ color: '#5F5C55', marginTop: '3px' }}>
            Latest requests across all your services · 24h: {totals.allowed + totals.blocked} total ({totals.allowed} allowed, {totals.blocked} held)
          </div>
        </div>

        <div style={{ background: '#FBF9F5', border: '1px solid #DCD7CD', borderRadius: '2px', overflowX: 'auto' }}>
          <div
            className="hd"
            style={{
              gridTemplateColumns: '90px 140px 120px 210px minmax(130px, 1fr) 210px',
              background: '#F2EFE8',
              borderBottom: '1px solid #DCD7CD',
              color: '#5F5C55',
            }}
          >
            <span>TIME</span>
            <span>SERVICE</span>
            <span>IP</span>
            <span>BUCKET / KEY</span>
            <span>ROUTE</span>
            <span>STATUS</span>
          </div>

          {recentLogs.length > 0 ? (
            recentLogs.map((log, idx) => {
              const statusMeta = getStatusMeta(log);
              const ident = formatIdentifierBadge(log.identifier);
              const timeStr = log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : 'now';

              return (
                <div
                  key={idx}
                  className="row"
                  style={{
                    gridTemplateColumns: '90px 140px 120px 210px minmax(130px, 1fr) 210px',
                    padding: '12px 20px',
                    font: '12px var(--font-mono)',
                    borderTop: idx === 0 ? 'none' : '1px solid #EAE6DD',
                    color: '#1C1B18',
                  }}
                >
                  <span style={{ color: '#5F5C55' }}>{timeStr}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500 }}>
                    {log.serviceName}
                  </span>
                  <span style={{ color: '#4A4843' }}>{log.ip}</span>
                  <span style={{ color: ident.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ident.text}
                  </span>
                  <span style={{ color: '#1C1B18' }}>{log.path || '/'}</span>
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
            <div style={{ padding: '36px 20px', textAlign: 'center', color: '#5F5C55', fontSize: '13.5px' }}>
              No requests recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
