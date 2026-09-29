const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'astraeon_auth_token';
const LEGACY_TOKEN_KEY = 'token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export function setToken(token) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('Login did not return an authentication token.');
  }
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

function redirectToLogin() {
  if (typeof window === 'undefined' || window.location.hash.startsWith('#/login')) return;
  window.location.hash = '/login';
}

export async function apiRequest(path, options = {}) {
  const { authenticated = false, ...fetchOptions } = options;
  const headers = { Accept: 'application/json', ...fetchOptions.headers };

  const token = authenticated ? getToken() : null;
  if (authenticated && !token) {
    redirectToLogin();
    const error = new Error('Authentication token is required.');
    error.status = 401;
    throw error;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (fetchOptions.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, { ...fetchOptions, headers, credentials: 'omit' });
  const data = await response.json().catch(() => ({ success: false }));

  if (!response.ok || !data.success) {
    if (authenticated && response.status === 401) {
      clearToken();
      redirectToLogin();
    }
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}
