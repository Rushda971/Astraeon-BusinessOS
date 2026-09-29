import { apiRequest } from '../api/client';
const query = (params = {}) => { const values = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value !== '' && value !== undefined && value !== null) values.append(key, value); }); return values.toString() ? `?${values}` : ''; };
export const ordersApi = {
  getOrders: (params) => apiRequest(`/api/orders${query(params)}`, { authenticated: true }), getOrder: (id) => apiRequest(`/api/orders/${id}`, { authenticated: true }), getSummary: () => apiRequest('/api/orders/summary', { authenticated: true }), createOrder: (data) => apiRequest('/api/orders', { method: 'POST', authenticated: true, body: JSON.stringify(data) }), updateStatus: (id, status) => apiRequest(`/api/orders/${id}/status`, { method: 'PATCH', authenticated: true, body: JSON.stringify({ status }) }), cancel: (id) => apiRequest(`/api/orders/${id}/cancel`, { method: 'POST', authenticated: true }),
};
