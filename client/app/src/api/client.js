const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function apiRequest(path, options = {}) {
  const { authenticated = false, ...fetchOptions } = options;
  const headers = { Accept: 'application/json', ...fetchOptions.headers };
  const token = (() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  })();

  if (fetchOptions.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (authenticated && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, { ...fetchOptions, headers });
  const data = await response.json().catch(() => ({ success: false }));

  if (!response.ok || !data.success) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}
