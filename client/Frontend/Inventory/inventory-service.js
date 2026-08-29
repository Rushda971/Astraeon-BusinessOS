(function attachInventoryService(window) {
  "use strict";

  // Switch this to false when the inventory REST API is available. The UI only
  // speaks to this module, so replacing the development fixture is isolated.
  const USE_DEVELOPMENT_FIXTURES = true;
  const fixtures = [
    { id: 1, name: "Basmati Rice", category: "Dry Goods", unit: "kg", currentStock: 48, minimumStock: 30, costPerUnit: 86, supplier: "Harvest Foods", status: "IN_STOCK" },
    { id: 2, name: "Chicken Breast", category: "Protein", unit: "kg", currentStock: 8, minimumStock: 12, costPerUnit: 295, supplier: "Prime Proteins", status: "LOW_STOCK" },
    { id: 3, name: "Olive Oil", category: "Oils & Condiments", unit: "L", currentStock: 3, minimumStock: 8, costPerUnit: 620, supplier: "Mediterranean Pantry", status: "LOW_STOCK" },
    { id: 4, name: "Mozzarella", category: "Dairy", unit: "kg", currentStock: 0, minimumStock: 6, costPerUnit: 480, supplier: "Fresh Dairy Co.", status: "OUT_OF_STOCK" },
    { id: 5, name: "Tomatoes", category: "Produce", unit: "kg", currentStock: 25, minimumStock: 15, costPerUnit: 72, supplier: "Green Basket", status: "IN_STOCK" },
    { id: 6, name: "Paper Napkins", category: "Supplies", unit: "packs", currentStock: 18, minimumStock: 10, costPerUnit: 55, supplier: "Hospitality Supply", status: "IN_STOCK" }
  ];
  const movements = [
    { id: 101, date: "2026-08-21T09:40:00Z", itemId: 2, item: "Chicken Breast", type: "STOCK_IN", quantity: 20, previousStock: 0, newStock: 20, reason: "Supplier delivery", user: "Kitchen Manager" },
    { id: 102, date: "2026-08-21T08:15:00Z", itemId: 3, item: "Olive Oil", type: "STOCK_OUT", quantity: 2, previousStock: 5, newStock: 3, reason: "Kitchen use", user: "Chef Arjun" },
    { id: 103, date: "2026-08-20T16:25:00Z", itemId: 4, item: "Mozzarella", type: "ADJUSTMENT", quantity: -2, previousStock: 2, newStock: 0, reason: "Expired", user: "Storekeeper" }
  ];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const statusFor = (item) => item.currentStock <= 0 ? "OUT_OF_STOCK" : item.currentStock <= item.minimumStock ? "LOW_STOCK" : "IN_STOCK";
  const normalize = (item) => ({ ...item, status: statusFor(item) });
  const http = async (path, options = {}) => window.AstraeonApi.request(path, { ...options, authenticated: true }).then((payload) => payload.data);

  const service = {
    async list() { return USE_DEVELOPMENT_FIXTURES ? clone(fixtures.map(normalize)) : http("/api/inventory"); },
    async get(id) { return USE_DEVELOPMENT_FIXTURES ? clone(normalize(fixtures.find((item) => item.id === Number(id)))) : http(`/api/inventory/${id}`); },
    async summary() { if (!USE_DEVELOPMENT_FIXTURES) return http("/api/inventory/summary"); const items = fixtures.map(normalize); return { totalItems: items.length, lowStockItems: items.filter((i) => i.status === "LOW_STOCK").length, outOfStockItems: items.filter((i) => i.status === "OUT_OF_STOCK").length, totalValue: items.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0) }; },
    async lowStock() { return USE_DEVELOPMENT_FIXTURES ? clone(fixtures.map(normalize).filter((item) => item.currentStock <= item.minimumStock)) : http("/api/inventory/low-stock"); },
    async movementHistory() { return USE_DEVELOPMENT_FIXTURES ? clone(movements) : http("/api/inventory/movements"); },
    async create(data) { return USE_DEVELOPMENT_FIXTURES ? { ...data, id: Date.now(), currentStock: Number(data.initialStock), minimumStock: Number(data.minimumStock), costPerUnit: Number(data.costPerUnit) } : http("/api/inventory", { method: "POST", body: JSON.stringify(data) }); },
    async update(id, data) { return USE_DEVELOPMENT_FIXTURES ? { ...data, id: Number(id) } : http(`/api/inventory/${id}`, { method: "PATCH", body: JSON.stringify(data) }); },
    async remove(id) { if (USE_DEVELOPMENT_FIXTURES) return { id }; return http(`/api/inventory/${id}`, { method: "DELETE" }); },
    async stockIn(id, data) { return USE_DEVELOPMENT_FIXTURES ? { id, ...data } : http(`/api/inventory/${id}/stock-in`, { method: "POST", body: JSON.stringify(data) }); },
    async stockOut(id, data) { return USE_DEVELOPMENT_FIXTURES ? { id, ...data } : http(`/api/inventory/${id}/stock-out`, { method: "POST", body: JSON.stringify(data) }); },
    async adjust(id, data) { return USE_DEVELOPMENT_FIXTURES ? { id, ...data } : http(`/api/inventory/${id}/adjust`, { method: "POST", body: JSON.stringify(data) }); }
  };
  window.InventoryService = service;
})(window);
