import { apiRequest } from '../api/client';

const withQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const string = query.toString();
  return string ? `?${string}` : '';
};

export const inventoryApi = {
  getCategories() {
    return apiRequest('/api/inventory/categories', { authenticated: true });
  },
  createCategory(data) {
    return apiRequest('/api/inventory/categories', { method: 'POST', authenticated: true, body: JSON.stringify(data) });
  },
  getSuppliers() {
    return apiRequest('/api/inventory/suppliers', { authenticated: true });
  },
  createSupplier(data) {
    return apiRequest('/api/inventory/suppliers', { method: 'POST', authenticated: true, body: JSON.stringify(data) });
  },
  getInventory(params = {}) {
    return apiRequest(`/api/inventory${withQuery(params)}`, { authenticated: true });
  },
  getInventoryItem(id) {
    return apiRequest(`/api/inventory/${id}`, { authenticated: true });
  },
  createInventoryItem(data) {
    return apiRequest('/api/inventory', { method: 'POST', authenticated: true, body: JSON.stringify(data) });
  },
  updateInventoryItem(id, data) {
    return apiRequest(`/api/inventory/${id}`, { method: 'PATCH', authenticated: true, body: JSON.stringify(data) });
  },
  deleteInventoryItem(id) {
    return apiRequest(`/api/inventory/${id}`, { method: 'DELETE', authenticated: true });
  },
  stockIn(id, data) {
    return apiRequest(`/api/inventory/${id}/stock-in`, { method: 'POST', authenticated: true, body: JSON.stringify(data) });
  },
  stockOut(id, data) {
    return apiRequest(`/api/inventory/${id}/stock-out`, { method: 'POST', authenticated: true, body: JSON.stringify(data) });
  },
  adjustStock(id, data) {
    return apiRequest(`/api/inventory/${id}/adjust`, { method: 'POST', authenticated: true, body: JSON.stringify(data) });
  },
  recordWaste(id, data) {
    return apiRequest(`/api/inventory/${id}/waste`, { method: 'POST', authenticated: true, body: JSON.stringify(data) });
  },
  getMovements(params = {}) {
    return apiRequest(`/api/inventory/movements${withQuery(params)}`, { authenticated: true });
  },
  getLowStock() {
    return apiRequest('/api/inventory/low-stock', { authenticated: true });
  },
  getSummary() {
    return apiRequest('/api/inventory/summary', { authenticated: true });
  },
  getReorderSuggestions() {
    return apiRequest('/api/inventory/reorder-suggestions', { authenticated: true });
  },
};
