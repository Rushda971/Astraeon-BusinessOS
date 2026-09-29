import { AppError } from '../utils/app-error.js';

export const calculateInventoryStatus = (currentStock, minimumStock) => {
  if (!Number.isFinite(Number(currentStock))) {
    throw new AppError('Current stock must be a valid number.', 400);
  }

  const current = Number(currentStock);
  const minimum = Number(minimumStock ?? 0);

  if (current === 0) return 'OUT_OF_STOCK';
  if (current <= minimum) return 'LOW_STOCK';
  return 'IN_STOCK';
};

export const ensurePositiveQuantity = (quantity, label = 'Quantity') => {
  const value = Number(quantity);
  if (!Number.isFinite(value) || value <= 0) {
    throw new AppError(`${label} must be a positive number.`, 400);
  }
  return value;
};

export const validateNewStockValue = (newStock, label = 'Stock') => {
  const value = Number(newStock);
  if (!Number.isFinite(value) || value < 0) {
    throw new AppError(`${label} must be a non-negative number.`, 400);
  }
  return value;
};

export const parseInventoryId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new AppError('Inventory item id must be a positive integer.', 400);
  return id;
};

export const normalizeInventoryQuery = (query) => {
  const search = typeof query?.search === 'string' ? query.search.trim() : '';
  const category = typeof query?.category === 'string' ? query.category.trim() : '';
  const status = typeof query?.status === 'string' ? query.status.trim().toUpperCase() : '';
  const supplier = typeof query?.supplier === 'string' ? query.supplier.trim() : '';
  const page = Number(query?.page || 1);
  const limit = Number(query?.limit || 20);

  return {
    search,
    category,
    status,
    supplier,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 20,
  };
};
