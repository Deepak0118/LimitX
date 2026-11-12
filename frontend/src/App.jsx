import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api, getToken, setUnauthorizedHandler, clearToken } from './api.js';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Overview from './pages/Overview';
import ProjectDetail from './pages/ProjectDetail';
import APIDetail from './pages/APIDetail';

// Layout
import DashboardLayout from './components/DashboardLayout';

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  // Expose login/logout functions globally for Auth page
  useEffect(() => {
    window.__limitxLogin = (userData) => {
      setUser(userData);
    };
    
    window.__limitxLogout = () => {
      setUser(null);
      clearToken();
    };

    // Set up unauthorized handler to clear user state
    setUnauthorizedHandler(() => {
      setUser(null);
      clearToken();
    });

    // Check if user is already logged in
    if (getToken()) {
      api('/auth/me')
        .then(setUser)
        .catch(() => {
          setUser(null);
        })
        .finally(() => setChecking(false));
    }
  }, []);

  if (checking) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          backgroundColor: 'var(--bg-page)',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '2px solid var(--border-subtle)',
            borderTopColor: 'var(--text-primary)',
            borderRadius: '50%',
            animation: 'spin 700ms linear infinite',
          }}
        />
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Connecting to LimitX...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
        <Route path="/login" element={<Navigate to="/auth?mode=login" />} />
        <Route path="/signup" element={<Navigate to="/auth?mode=signup" />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <DashboardLayout user={user}>
                <Dashboard />
              </DashboardLayout>
            ) : (
              <Navigate to="/auth?mode=login" />
            )
          }
        />
        <Route
          path="/overview"
          element={
            user ? (
              <DashboardLayout user={user}>
                <Overview />
              </DashboardLayout>
            ) : (
              <Navigate to="/auth?mode=login" />
            )
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            user ? (
              <DashboardLayout user={user}>
                <ProjectDetail />
              </DashboardLayout>
            ) : (
              <Navigate to="/auth?mode=login" />
            )
          }
        />
        <Route
          path="/apis/:apiId"
          element={
            user ? (
              <DashboardLayout user={user}>
                <APIDetail />
              </DashboardLayout>
            ) : (
              <Navigate to="/auth?mode=login" />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
