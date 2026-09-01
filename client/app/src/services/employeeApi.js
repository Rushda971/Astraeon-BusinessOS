import { apiRequest } from '../api/client';

const withQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') query.append(key, value); });
  const value = query.toString();
  return value ? `?${value}` : '';
};

export const employeeApi = {
  getEmployees: (params = {}) => apiRequest(`/api/employees${withQuery(params)}`, { authenticated: true }),
  getSummary: () => apiRequest('/api/employees/summary', { authenticated: true }),
  getEmployee: (id) => apiRequest(`/api/employees/${id}`, { authenticated: true }),
  createEmployee: (data) => apiRequest('/api/employees', { method: 'POST', authenticated: true, body: JSON.stringify(data) }),
  updateEmployee: (id, data) => apiRequest(`/api/employees/${id}`, { method: 'PUT', authenticated: true, body: JSON.stringify(data) }),
  updateStatus: (id, status) => apiRequest(`/api/employees/${id}/status`, { method: 'PATCH', authenticated: true, body: JSON.stringify({ status }) }),
};
