import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Loader, X, Search, ArrowRight, Plus, List, LayoutGrid } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('limitx_projects_view');
      return saved === 'grid' ? 'grid' : 'list';
    } catch {
      return 'list';
    }
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const searchInputRef = useRef(null);

  function updateViewMode(nextMode) {
    setViewMode(nextMode);
    try {
      localStorage.setItem('limitx_projects_view', nextMode);
    } catch {
      // ignore storage errors
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !showCreateModal) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && showCreateModal) {
        setShowCreateModal(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal]);

  async function loadProjects() {
    try {
      const data = await api('/projects');
      const list = Array.isArray(data) ? data : [];

      const enriched = await Promise.all(
        list.map(async (p) => {
          if (Array.isArray(p.services)) return p;
          if (!p.apiCount) return { ...p, services: [], activeCount: 0, ruleCount: 0 };
          try {
            const detail = await api(`/projects/${p.id}`);
            const services = detail?.apis || [];
            return {
              ...p,
              services,
              activeCount: services.filter((s) => s.status === 'active').length,
              ruleCount: services.reduce((sum, s) => sum + (s.ruleCount || 0), 0),
            };
          } catch {
            return { ...p, services: [], activeCount: 0, ruleCount: 0 };
          }
        }),
      );

      setProjects(enriched);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const newProj = await api('/projects', { method: 'POST', body: form });
      setShowCreateModal(false);
      setForm({ name: '', description: '' });
      await loadProjects();
      if (newProj && newProj.id) {
        navigate(`/projects/${newProj.id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  }

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.services && p.services.some((s) => s.name.toLowerCase().includes(q)))
    );
  });

  const totalApis = projects.reduce((acc, p) => acc + (p.apiCount || 0), 0);

  if (loading) {
    return (
      <div className="loading-container">
        <Loader size={22} className="spin" style={{ color: '#1C1B18' }} />
        <span className="lab">Loading projects...</span>
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
          paddingBottom: '22px',
          borderBottom: '1px solid #DCD7CD',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: '34px', letterSpacing: '-0.03em', fontWeight: 400, color: '#1C1B18', lineHeight: 1.08 }}>
            Projects
          </h1>
          <div style={{ fontSize: '13.5px', color: '#5F5C55' }}>
            {projects.length === 0
              ? 'Group your backend services and rate-limit routes by project'
              : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'} · ${totalApis} ${totalApis === 1 ? 'service' : 'services'}`}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {projects.length > 0 && (
            <>
              <div style={{ position: 'relative', width: '240px' }}>
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
                  placeholder="Filter projects... (/)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 32px',
                    fontSize: '13px',
                    background: '#FBF9F5',
                  }}
                />
              </div>

              <div
                role="group"
                aria-label="Projects layout view"
                style={{
                  display: 'inline-flex',
                  background: '#FBF9F5',
                  border: '1px solid #DCD7CD',
                  borderRadius: '2px',
                  padding: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => updateViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  title="Directory list view"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    fontSize: '12.5px',
                    fontWeight: viewMode === 'list' ? 500 : 400,
                    background: viewMode === 'list' ? '#EFECE4' : 'transparent',
                    color: viewMode === 'list' ? '#1C1B18' : '#5F5C55',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  <List size={13} />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateViewMode('grid')}
                  aria-pressed={viewMode === 'grid'}
                  title="Card grid view"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    fontSize: '12.5px',
                    fontWeight: viewMode === 'grid' ? 500 : 400,
                    background: viewMode === 'grid' ? '#EFECE4' : 'transparent',
                    color: viewMode === 'grid' ? '#1C1B18' : '#5F5C55',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  <LayoutGrid size={13} />
                  <span>Grid</span>
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => { setError(''); setShowCreateModal(true); }}
            className="btn btn-primary btn-sm"
            style={{ padding: '9px 15px', fontSize: '13.5px' }}
          >
            <Plus size={14} />
            <span>New project</span>
          </button>
        </div>
      </div>

      {/* Projects List or Grid */}
      {filteredProjects.length > 0 ? (
        viewMode === 'list' ? (
          <div
            style={{
              background: '#FBF9F5',
              border: '1px solid #DCD7CD',
              borderRadius: '2px',
            }}
          >
            {filteredProjects.map((project, index) => {
              const services = project.services || [];
              const visibleServices = services.slice(0, 3);
              const remainingCount = Math.max(0, services.length - visibleServices.length);
              const routeCount = project.ruleCount ?? services.reduce((sum, s) => sum + (s.ruleCount || 0), 0);

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/projects/${project.id}`);
                    }
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px 24px',
                    padding: '18px 22px',
                    borderBottom: index < filteredProjects.length - 1 ? '1px solid #EAE6DD' : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 140ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FDFCF9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Left: Project Name + Description */}
                  <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 500,
                        letterSpacing: '-0.015em',
                        color: '#1C1B18',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {project.name}
                    </div>
                    {project.description && (
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#5F5C55',
                          marginTop: '3px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {project.description}
                      </div>
                    )}
                  </div>

                  {/* Middle: Inline Connected Services */}
                  <div
                    style={{
                      flex: '2 1 320px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: 0,
                    }}
                  >
                    {services.length > 0 ? (
                      <>
                        {visibleServices.map((svc) => {
                          const isPaused = svc.status === 'paused';
                          return (
                            <Link
                              key={svc.id}
                              to={`/apis/${svc.id}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '7px',
                                padding: '4px 10px',
                                background: '#F5F2EB',
                                border: '1px solid #DCD7CD',
                                borderRadius: '2px',
                                fontSize: '12.5px',
                                textDecoration: 'none',
                                color: '#1C1B18',
                                maxWidth: '210px',
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: isPaused ? '#9A6324' : '#2F6B48',
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {svc.name}
                              </span>
                              <span style={{ color: '#8C887F', fontSize: '11.5px', flexShrink: 0 }}>
                                {svc.ruleCount || 0} {svc.ruleCount === 1 ? 'route' : 'routes'}
                              </span>
                            </Link>
                          );
                        })}
                        {remainingCount > 0 && (
                          <span style={{ fontSize: '12px', color: '#8C887F' }}>
                            +{remainingCount} more
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#8C887F' }}>No services connected yet</span>
                    )}
                  </div>

                  {/* Right: Counts & Action */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '18px',
                      flexShrink: 0,
                      marginLeft: 'auto',
                    }}
                  >
                    <span style={{ fontSize: '12.5px', color: '#8C887F' }}>
                      {project.apiCount || 0} {project.apiCount === 1 ? 'service' : 'services'}
                      {' · '}
                      {routeCount} {routeCount === 1 ? 'route' : 'routes'}
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#1C1B18',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>Open</span>
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredProjects.map((project) => {
            const services = project.services || [];
            const visibleServices = services.slice(0, 3);
            const remainingCount = Math.max(0, services.length - visibleServices.length);
            const routeCount = project.ruleCount ?? services.reduce((sum, s) => sum + (s.ruleCount || 0), 0);

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/projects/${project.id}`);
                  }
                }}
                style={{
                  background: '#FBF9F5',
                  border: '1px solid #DCD7CD',
                  borderRadius: '2px',
                  padding: '20px 22px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '196px',
                  cursor: 'pointer',
                  transition: 'border-color 140ms ease, background-color 140ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1C1B18';
                  e.currentTarget.style.backgroundColor = '#FDFCF9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#DCD7CD';
                  e.currentTarget.style.backgroundColor = '#FBF9F5';
                }}
              >
                <div>
                  {/* Card Title + Description */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: project.description ? '4px' : '14px' }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '17px',
                        fontWeight: 500,
                        letterSpacing: '-0.015em',
                        color: '#1C1B18',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {project.name}
                    </h2>
                    <span
                      style={{
                        fontSize: '12.5px',
                        color: project.apiCount > 0 ? '#5F5C55' : '#8C887F',
                        flexShrink: 0,
                      }}
                    >
                      {project.apiCount || 0} {project.apiCount === 1 ? 'service' : 'services'}
                    </span>
                  </div>

                  {project.description && (
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#5F5C55',
                        marginBottom: '14px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {project.description}
                    </div>
                  )}

                  {/* Services Preview inside Card */}
                  {services.length > 0 ? (
                    <div style={{ borderTop: '1px solid #EAE6DD' }}>
                      {visibleServices.map((svc) => {
                        const isPaused = svc.status === 'paused';
                        return (
                          <Link
                            key={svc.id}
                            to={`/apis/${svc.id}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '9px 0',
                              borderBottom: '1px solid #EFECE4',
                              textDecoration: 'none',
                              color: '#1C1B18',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '13.5px',
                                fontWeight: 500,
                                color: '#1C1B18',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {svc.name}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', flexShrink: 0, fontSize: '12px' }}>
                              <span style={{ color: '#8C887F' }}>
                                {svc.ruleCount || 0} {svc.ruleCount === 1 ? 'route' : 'routes'}
                              </span>
                              <span style={{ fontWeight: 500, color: isPaused ? '#9A6324' : '#2F6B48' }}>
                                {isPaused ? 'Paused' : 'Active'}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                      {remainingCount > 0 && (
                        <div style={{ paddingTop: '8px', fontSize: '12px', color: '#8C887F' }}>
                          +{remainingCount} more {remainingCount === 1 ? 'service' : 'services'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        borderTop: '1px solid #EAE6DD',
                        paddingTop: '14px',
                        fontSize: '13px',
                        color: '#8C887F',
                      }}
                    >
                      No services connected yet
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #EAE6DD',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '12.5px',
                  }}
                >
                  <span style={{ color: '#8C887F' }}>
                    {project.apiCount > 0
                      ? `${routeCount} ${routeCount === 1 ? 'route' : 'routes'} configured`
                      : 'Open to add a service'}
                  </span>
                  <span style={{ fontWeight: 500, color: '#1C1B18', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>Open</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        )
      ) : projects.length > 0 ? (
        <div
          style={{
            background: '#FBF9F5',
            border: '1px solid #DCD7CD',
            borderRadius: '2px',
            padding: '44px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '14px', color: '#5F5C55' }}>
            No projects matching &ldquo;{searchQuery}&rdquo;
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#FBF9F5',
            border: '1px solid #DCD7CD',
            borderRadius: '2px',
            padding: '56px 24px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '22px', fontWeight: 400, margin: '0 0 8px', color: '#1C1B18' }}>
            Create your first project
          </h2>
          <p style={{ color: '#5F5C55', fontSize: '14px', maxWidth: '460px', margin: '0 auto 22px', lineHeight: 1.6 }}>
            Group your backend APIs into projects, then manage rate limits, IP blocklists, and request logs for each service.
          </p>
          <button
            onClick={() => { setError(''); setShowCreateModal(true); }}
            className="btn btn-primary"
          >
            <Plus size={14} />
            <span>New project</span>
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div
              className="modal-header"
              style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #EAE6DD', alignItems: 'center' }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 500, margin: 0, letterSpacing: '-0.02em' }}>Create a project</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5F5C55', padding: '4px' }}
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
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
                <label htmlFor="proj-name">Project Name</label>
                <input
                  id="proj-name"
                  type="text"
                  placeholder="e.g. E-commerce API"
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                  disabled={creating}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="proj-desc">Description or Domain (Optional)</label>
                <input
                  id="proj-desc"
                  type="text"
                  placeholder="e.g. shop.example.com"
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
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary btn-sm"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
