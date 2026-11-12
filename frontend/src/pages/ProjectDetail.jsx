import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, PROXY_BASE } from '../api';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { Loader, X, Check, Copy, Search, Plus } from 'lucide-react';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [form, setForm] = useState({ name: '', targetUrl: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    loadAll();
  }, [projectId]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !showCreateModal && !showDeleteModal) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && !creating && !deleting) {
        setShowCreateModal(false);
        setShowDeleteModal(false);
        setError('');
        setDeleteError('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal, showDeleteModal, creating, deleting]);

  async function loadAll() {
    try {
      setLoading(true);
      const projData = await api(`/projects/${projectId}`);
      setProject(projData);
      setApis(projData.apis || []);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAPI(e) {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      let target = form.targetUrl.trim();
      if (!/^https?:\/\//i.test(target)) {
        target = 'https://' + target;
      }

      await api(`/projects/${projectId}/apis`, {
        method: 'POST',
        body: {
          name: form.name.trim(),
          targetUrl: target,
          description: form.description.trim(),
        },
      });

      setShowCreateModal(false);
      setForm({ name: '', targetUrl: '', description: '' });
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to add service');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteProject() {
    setDeleteError('');
    try {
      setDeleting(true);
      await api(`/projects/${projectId}`, { method: 'DELETE' });
      setShowDeleteModal(false);
      navigate('/dashboard');
    } catch (err) {
      setDeleteError('Failed to delete project: ' + err.message);
      setDeleting(false);
    }
  }

  function handleCopy(url, id) {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredApis = apis.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.targetUrl.toLowerCase().includes(q) ||
      (a.description && a.description.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="loading-container">
        <Loader size={22} className="spin" style={{ color: '#1C1B18' }} />
        <span className="lab">Loading project...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '56px 24px', textAlign: 'center' }}>
        <p style={{ color: '#5F5C55', marginBottom: '12px' }}>Project not found.</p>
        <Link to="/dashboard" className="btn btn-secondary btn-sm">Back to projects</Link>
      </div>
    );
  }

  const activeCount = apis.filter((a) => a.status === 'active').length;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 64px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '14px', fontSize: '13px', color: '#8C887F', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <Link to="/dashboard" style={{ color: '#5F5C55' }}>Projects</Link>
        <span>/</span>
        <span style={{ color: '#1C1B18', fontWeight: 500 }}>{project.name}</span>
      </div>

      {/* Project Master Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          paddingBottom: '24px',
          borderBottom: '1px solid #DCD7CD',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: '34px', letterSpacing: '-0.03em', fontWeight: 400, color: '#1C1B18', lineHeight: 1.08 }}>
            {project.name}
          </h1>
          <div className="lab" style={{ color: '#5F5C55', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {project.description && (
              <>
                <span>{project.description}</span>
                <span style={{ color: '#CFC9BC' }}>&middot;</span>
              </>
            )}
            <span>
              {apis.length} {apis.length === 1 ? 'service' : 'services'}
            </span>
            <span style={{ color: '#CFC9BC' }}>&middot;</span>
            <span style={{ fontWeight: 500, color: activeCount > 0 ? '#2F6B48' : '#5F5C55' }}>
              {activeCount}/{apis.length} active
            </span>
          </div>
        </div>

        <button
          onClick={() => { setDeleteError(''); setShowDeleteModal(true); }}
          className="btn btn-secondary btn-sm"
          style={{
            borderColor: '#E8C4BE',
            color: '#A83B2B',
            background: '#FBF9F5',
          }}
        >
          Delete project
        </button>
      </div>

      {/* Subheading: Services in this project */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <h2 style={{ margin: 0, fontSize: '21px', letterSpacing: '-0.02em', fontWeight: 400, color: '#1C1B18' }}>
          Services in this project
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {apis.length > 0 && (
            <div style={{ position: 'relative', width: '215px' }}>
              <Search
                size={14}
                color="#8C887F"
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search services... (/)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  fontSize: '13px',
                  background: '#FBF9F5',
                }}
              />
            </div>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm"
            style={{ padding: '9px 14px', fontSize: '13.5px' }}
          >
            <Plus size={14} />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Services Table */}
      {filteredApis.length > 0 ? (
        <div style={{ background: '#FBF9F5', border: '1px solid #DCD7CD', borderRadius: '2px', overflowX: 'auto' }}>
          <div
            className="hd"
            style={{
              gridTemplateColumns: '90px minmax(130px, 1.1fr) minmax(260px, 2fr) minmax(180px, 1.4fr) 90px 70px',
              background: '#F2EFE8',
              borderBottom: '1px solid #DCD7CD',
              color: '#5F5C55',
            }}
          >
            <span>STATUS</span>
            <span>SERVICE</span>
            <span>PROXY URL</span>
            <span>BACKEND URL</span>
            <span>ROUTES</span>
            <span style={{ textAlign: 'right' }}>ACTION</span>
          </div>

          {filteredApis.map((apiItem, idx) => {
            const proxyUrl = `${PROXY_BASE}/proxy/${apiItem.id}`;
            const isPaused = apiItem.status === 'paused';

            return (
              <div
                key={apiItem.id}
                onClick={(e) => {
                  if (!e.target.closest('button') && !e.target.closest('a')) {
                    navigate(`/apis/${apiItem.id}`);
                  }
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px minmax(130px, 1.1fr) minmax(260px, 2fr) minmax(180px, 1.4fr) 90px 70px',
                  gap: '16px',
                  alignItems: 'center',
                  padding: '15px 20px',
                  borderTop: idx === 0 ? 'none' : '1px solid #EAE6DD',
                  minWidth: '820px',
                  cursor: 'pointer',
                  backgroundColor: '#FBF9F5',
                  transition: 'background-color 120ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F2EB')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FBF9F5')}
              >
                {/* Status Indicator */}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: isPaused ? '#9A6324' : '#2F6B48',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isPaused ? 'Paused' : 'Active'}
                </span>

                {/* API Name */}
                <Link
                  to={`/apis/${apiItem.id}`}
                  style={{ fontSize: '14.5px', fontWeight: 500, color: '#1C1B18', textDecoration: 'none' }}
                >
                  {apiItem.name}
                </Link>

                {/* Proxy URL & Copy */}
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span
                    style={{
                      font: '12px var(--font-mono)',
                      color: '#4A4843',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {proxyUrl}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(proxyUrl, apiItem.id);
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
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {copiedId === apiItem.id ? (
                      <>
                        <Check size={11} style={{ color: '#2F6B48' }} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </span>

                {/* Target Origin */}
                <span
                  style={{
                    font: '12px var(--font-mono)',
                    color: '#5F5C55',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <code>{apiItem.targetUrl}</code>
                </span>

                {/* Rule Count Telemetry */}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: apiItem.ruleCount > 0 ? '#1C1B18' : '#8C887F',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {apiItem.ruleCount || 0} {apiItem.ruleCount === 1 ? 'route' : 'routes'}
                </span>

                {/* Open Link */}
                <div style={{ textAlign: 'right' }}>
                  <Link
                    to={`/apis/${apiItem.id}`}
                    style={{ fontWeight: 500, fontSize: '13px', color: '#1C1B18', textDecoration: 'none' }}
                  >
                    Open &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : apis.length > 0 ? (
        <div
          style={{
            background: '#FBF9F5',
            border: '1px solid #DCD7CD',
            borderRadius: '2px',
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          <div className="lab" style={{ color: '#5F5C55' }}>
            No services matching &ldquo;{searchQuery}&rdquo;
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#FBF9F5',
            border: '1px solid #DCD7CD',
            borderRadius: '2px',
            padding: '52px 24px',
            textAlign: 'center',
          }}
        >
          <div className="cap" style={{ color: '#5F5C55' }}>NO SERVICES YET</div>
          <h2 style={{ fontSize: '21px', fontWeight: 400, margin: '0 0 8px', color: '#1C1B18' }}>
            Connect your first backend service to this project
          </h2>
          <p style={{ color: '#5F5C55', fontSize: '14px', maxWidth: '460px', margin: '0 auto 20px', lineHeight: 1.6 }}>
            Enter your backend URL to generate a rate-limited LimitX proxy URL.
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={14} />
            <span>Add Service</span>
          </button>
        </div>
      )}

      {/* Danger Zone: Delete Project Box */}
      <div
        style={{
          marginTop: '48px',
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
          <div style={{ fontWeight: 500, color: '#1C1B18', marginBottom: '3px' }}>Delete this project</div>
          <div style={{ fontSize: '13px', color: '#5F5C55' }}>
            Removes the project, its services and every configured route. This cannot be undone.
          </div>
        </div>
        <button
          onClick={() => { setDeleteError(''); setShowDeleteModal(true); }}
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
          Delete project
        </button>
      </div>

      {/* Add API Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div
              className="modal-header"
              style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #EAE6DD', alignItems: 'center' }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0, letterSpacing: '-0.02em' }}>Connect a Service</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5F5C55', padding: '4px' }}
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleCreateAPI}>
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
                <label htmlFor="api-name">Service Name</label>
                <input
                  id="api-name"
                  type="text"
                  placeholder="e.g. Main Backend, Auth Service"
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                  disabled={creating}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="api-target">Backend Base URL</label>
                <input
                  id="api-target"
                  type="text"
                  placeholder="https://api.example.com"
                  value={form.targetUrl}
                  onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                  required
                  disabled={creating}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="api-desc">Description (Optional)</label>
                <input
                  id="api-desc"
                  type="text"
                  placeholder="e.g. Production API server"
                  maxLength={500}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={creating}
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
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary btn-sm" disabled={creating}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
                  {creating ? 'Connecting...' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteError(''); }}
        onConfirm={handleDeleteProject}
        eyebrow="DANGER ZONE"
        title="Delete Project?"
        description={
          <>
            This action cannot be undone. Deleting <strong>{project.name}</strong> will permanently remove this project and all its data.
          </>
        }
        impactItems={[
          `${apis.length} connected service(s) and their /proxy/ URLs will stop immediately`,
          'All rate-limit routes and IP blocklists will be removed',
          'All traffic stats and request logs across these services will be permanently deleted',
        ]}
        confirmText={project.name}
        confirmLabel="Delete project permanently"
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}
