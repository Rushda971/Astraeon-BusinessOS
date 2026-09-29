import { apiRequest } from '../api/client';
const query = (params = {}) => { const values = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value !== '' && value !== undefined && value !== null) values.append(key, value); }); return values.toString() ? '?' + values : ''; };
export const salesApi = {
  getSales: (params) => apiRequest('/api/sales' + query(params), { authenticated: true }),
  getSale: (id) => apiRequest('/api/sales/' + id, { authenticated: true }),
  createSale: (data) => apiRequest('/api/sales', { method: 'POST', authenticated: true, body: JSON.stringify(data) }),
  updateStatus: (id, data) => apiRequest('/api/sales/' + id + '/status', { method: 'PATCH', authenticated: true, body: JSON.stringify(data) }),
  getSummary: () => apiRequest('/api/sales/summary', { authenticated: true }),
};
