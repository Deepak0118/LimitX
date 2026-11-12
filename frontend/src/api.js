// Small fetch wrapper. Sends the login token (JWT) on every request.
export const getToken = () => localStorage.getItem('limitx_token') || '';
export const setToken = (t) => localStorage.setItem('limitx_token', t);
export const clearToken = () => localStorage.removeItem('limitx_token');

// Where the proxy itself runs (shown to the user so they can copy their proxy URL).
const defaultProxyBase =
  typeof window !== 'undefined' && import.meta.env.PROD
    ? window.location.origin
    : 'http://localhost:3000';

export const PROXY_BASE = (import.meta.env.VITE_PROXY_BASE || defaultProxyBase).replace(/\/+$/, '');

// App.jsx registers a function here that logs the user out when the token has expired.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // 401 on a normal call = expired/invalid token. (Login/signup also use this wrapper, so skip those.)
    if (res.status === 401 && !path.startsWith('/auth/')) onUnauthorized();
    const err = new Error(data.message || data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}
