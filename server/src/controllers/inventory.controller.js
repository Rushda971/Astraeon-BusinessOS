import prisma from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { sendSuccess } from '../utils/response.js';
import {
  calculateInventoryStatus,
  ensurePositiveQuantity,
  normalizeInventoryQuery,
  parseInventoryId,
  validateNewStockValue,
} from '../services/inventory.service.js';

const itemInclude = { category: true, supplier: true };

const normalizeString = (value, fieldName, { min = 1, max = 150, required = true } = {}) => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (required && text.length < min) throw new AppError(`${fieldName} is required.`, 400);
  if (text.length > max) throw new AppError(`${fieldName} must not exceed ${max} characters.`, 400);
  return text;
};

const parsePositiveNumber = (value, fieldName, { allowZero = false } = {}) => {
  const number = Number(value);
  if (!Number.isFinite(number) || (number <= 0 && !allowZero) || (number < 0 && allowZero)) {
    throw new AppError(`${fieldName} must be a valid number.`, 400);
  }
  return number;
};

const parseInventoryItemInput = (body, partial = false) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request body must be a JSON object.', 400);
  }

  const data = {};
  const hasValue = (key) => Object.hasOwn(body, key);

  if (!partial || hasValue('name')) data.name = normalizeString(body.name, 'Name', { min: 2, max: 150 });
  if (!partial || hasValue('sku')) data.sku = normalizeString(body.sku, 'SKU', { min: 2, max: 80 });
  if (!partial || hasValue('unit')) data.unit = normalizeString(body.unit, 'Unit', { min: 1, max: 30 });

  if (!partial || hasValue('categoryId')) {
    data.categoryId = Math.trunc(parsePositiveNumber(body.categoryId, 'Category', { allowZero: false }));
  }

  if (!partial || hasValue('supplierId')) {
    if (body.supplierId !== null && body.supplierId !== undefined && body.supplierId !== '') {
      data.supplierId = Math.trunc(parsePositiveNumber(body.supplierId, 'Supplier', { allowZero: false }));
    }
  }

  if (!partial || hasValue('currentStock')) {
    data.currentStock = parsePositiveNumber(body.currentStock, 'Initial stock', { allowZero: true });
  }
  if (!partial || hasValue('minimumStock')) {
    data.minimumStock = parsePositiveNumber(body.minimumStock, 'Minimum stock', { allowZero: true });
  }
  if (!partial || hasValue('maximumStock')) {
    if (body.maximumStock !== null && body.maximumStock !== undefined && body.maximumStock !== '') {
      data.maximumStock = parsePositiveNumber(body.maximumStock, 'Maximum stock', { allowZero: true });
    }
  }
  if (!partial || hasValue('reorderLevel')) {
    if (body.reorderLevel !== null && body.reorderLevel !== undefined && body.reorderLevel !== '') {
      data.reorderLevel = parsePositiveNumber(body.reorderLevel, 'Reorder level', { allowZero: true });
    }
  }
  if (!partial || hasValue('costPerUnit')) {
    data.costPerUnit = parsePositiveNumber(body.costPerUnit, 'Cost per unit', { allowZero: true });
  }
  if (hasValue('sellingPrice')) {
    data.sellingPrice = body.sellingPrice === null || body.sellingPrice === '' ? null : parsePositiveNumber(body.sellingPrice, 'Selling price', { allowZero: true });
  }

  if (!partial || hasValue('status')) {
    const status = typeof body.status === 'string' ? body.status.trim().toUpperCase() : '';
    if (status && !['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].includes(status)) {
      throw new AppError('Status must be IN_STOCK, LOW_STOCK, or OUT_OF_STOCK.', 400);
    }
    if (status) data.status = status;
  }

  if (!partial && (!data.categoryId || !data.unit || data.costPerUnit === undefined || data.currentStock === undefined || data.minimumStock === undefined)) {
    throw new AppError('Category, unit, initial stock, minimum stock, and cost per unit are required.', 400);
  }

  return data;
};

const ensureItemExists = async (id, tx = prisma) => {
  const item = await tx.inventoryItem.findUnique({ where: { id }, include: itemInclude });
  if (!item) throw new AppError('Inventory item not found.', 404);
  return item;
};

const serializeItem = (item) => ({
  ...item,
  status: item.status ?? calculateInventoryStatus(item.currentStock, item.minimumStock),
});

export const getInventory = async (req, res, next) => {
  try {
    const { search, category, status, supplier, page, limit } = normalizeInventoryQuery(req.query);
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = { name: { contains: category, mode: 'insensitive' } };
    if (status) where.status = status;
    if (supplier) where.supplier = { name: { contains: supplier, mode: 'insensitive' } };

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: itemInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return sendSuccess(res, 200, 'Inventory items retrieved successfully.', {
      items: items.map(serializeItem),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
};

export const getInventoryItem = async (req, res, next) => {
  try {
    const item = await ensureItemExists(parseInventoryId(req.params.id));
    return sendSuccess(res, 200, 'Inventory item retrieved successfully.', { item: serializeItem(item) });
  } catch (error) {
    return next(error);
  }
};

export const createInventoryItem = async (req, res, next) => {
  try {
    const payload = parseInventoryItemInput(req.body, false);
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.inventoryItem.create({
        data: { ...payload, status: payload.status || calculateInventoryStatus(payload.currentStock, payload.minimumStock) },
        include: itemInclude,
      });

      if (Number(created.currentStock) > 0) {
        await tx.stockMovement.create({
          data: {
            itemId: created.id,
            userId: req.user.id,
            supplierId: created.supplierId,
            type: 'IN',
            quantity: created.currentStock,
            previousStock: 0,
            newStock: created.currentStock,
            unitCost: created.costPerUnit,
            reason: 'Opening stock',
          },
        });
      }
      return created;
    });
    return sendSuccess(res, 201, 'Inventory item created successfully.', { item: serializeItem(item) });
  } catch (error) {
    return next(error);
  }
};

export const updateInventoryItem = async (req, res, next) => {
  try {
    const id = parseInventoryId(req.params.id);
    await ensureItemExists(id);
    if (Object.hasOwn(req.body, 'currentStock') || Object.hasOwn(req.body, 'status')) {
      throw new AppError('Stock values cannot be updated directly. Use stock-in, stock-out, adjustment, or waste actions.', 400);
    }

    const payload = parseInventoryItemInput(req.body, true);
    const item = await prisma.inventoryItem.update({ where: { id }, data: payload, include: itemInclude });
    return sendSuccess(res, 200, 'Inventory item updated successfully.', { item: serializeItem(item) });
  } catch (error) {
    return next(error);
  }
};

export const deleteInventoryItem = async (req, res, next) => {
  try {
    const id = parseInventoryId(req.params.id);
    await ensureItemExists(id);
    const movementCount = await prisma.stockMovement.count({ where: { itemId: id } });
    if (movementCount) throw new AppError('Inventory items with stock history cannot be deleted.', 400);
    await prisma.inventoryItem.delete({ where: { id } });
    return sendSuccess(res, 200, 'Inventory item deleted successfully.');
  } catch (error) { return next(error); }
};

export const stockInInventoryItem = async (req, res, next) => {
  try {
    const id = parseInventoryId(req.params.id);
    const quantity = ensurePositiveQuantity(req.body.quantity, 'Quantity');
    const unitCost = req.body.unitCost === undefined || req.body.unitCost === null || req.body.unitCost === '' ? undefined : Number(req.body.unitCost);
    const supplierId = req.body.supplierId ? parseInventoryId(req.body.supplierId) : null;
    const reason = normalizeString(req.body.reason || 'Purchase', 'Reason', { min: 2, max: 120 });
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim().slice(0, 400) : '';

    const result = await prisma.$transaction(async (tx) => {
      const item = await ensureItemExists(id, tx);
      const previousStock = Number(item.currentStock);
      const newStock = previousStock + quantity;
      const nextCost = Number.isFinite(unitCost) ? unitCost : Number(item.costPerUnit ?? 0);

      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: { currentStock: newStock, costPerUnit: nextCost, status: calculateInventoryStatus(newStock, item.minimumStock) },
        include: itemInclude,
      });

      const movement = await tx.stockMovement.create({
        data: {
          itemId: id,
          userId: req.user.id,
          supplierId: supplierId ?? item.supplierId ?? null,
          type: 'IN',
          quantity,
          previousStock,
          newStock,
          unitCost: nextCost,
          reason,
          notes: notes || null,
        },
      });

      return { item: updatedItem, movement };
    });

    return sendSuccess(res, 200, 'Stock added successfully.', { item: serializeItem(result.item), movement: result.movement });
  } catch (error) {
    return next(error);
  }
};

export const stockOutInventoryItem = async (req, res, next) => {
  try {
    const id = parseInventoryId(req.params.id);
    const quantity = ensurePositiveQuantity(req.body.quantity, 'Quantity');
    const reason = normalizeString(req.body.reason || 'Usage', 'Reason', { min: 2, max: 120 });
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim().slice(0, 400) : '';

    const result = await prisma.$transaction(async (tx) => {
      const item = await ensureItemExists(id, tx);
      const previousStock = Number(item.currentStock);
      const newStock = previousStock - quantity;
      if (newStock < 0) throw new AppError('Insufficient stock', 400);

      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: { currentStock: newStock, status: calculateInventoryStatus(newStock, item.minimumStock) },
        include: itemInclude,
      });

      const movement = await tx.stockMovement.create({
        data: {
          itemId: id,
          userId: req.user.id,
          supplierId: item.supplierId ?? null,
          type: 'OUT',
          quantity,
          previousStock,
          newStock,
          unitCost: item.costPerUnit,
          reason,
          notes: notes || null,
        },
      });

      return { item: updatedItem, movement };
    });

    return sendSuccess(res, 200, 'Stock removed successfully.', { item: serializeItem(result.item), movement: result.movement });
  } catch (error) { return next(error); }
};

export const adjustInventoryItem = async (req, res, next) => {
  try {
    const id = parseInventoryId(req.params.id);
    const reason = normalizeString(req.body.reason || '', 'Reason', { min: 2, max: 120 });
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim().slice(0, 400) : '';
    const newStock = validateNewStockValue(req.body.newStock, 'New stock');

    const result = await prisma.$transaction(async (tx) => {
      const item = await ensureItemExists(id, tx);
      const previousStock = Number(item.currentStock);
      const adjustmentAmount = newStock - previousStock;
      if (newStock < 0) throw new AppError('Invalid adjustment: negative stock is not allowed.', 400);

      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: { currentStock: newStock, status: calculateInventoryStatus(newStock, item.minimumStock) },
        include: itemInclude,
      });

      const adjustment = await tx.stockAdjustment.create({
        data: {
          itemId: id,
          userId: req.user.id,
          previousStock,
          newStock,
          adjustmentAmount,
          reason,
          notes: notes || null,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          itemId: id,
          userId: req.user.id,
          supplierId: item.supplierId ?? null,
          type: 'ADJUSTMENT',
          quantity: Math.abs(adjustmentAmount),
          previousStock,
          newStock,
          unitCost: item.costPerUnit,
          reason,
          notes: notes || null,
        },
      });

      return { item: updatedItem, adjustment, movement };
    });

    return sendSuccess(res, 200, 'Inventory adjusted successfully.', { item: serializeItem(result.item), adjustment: result.adjustment, movement: result.movement });
  } catch (error) { return next(error); }
};

export const wasteInventoryItem = async (req, res, next) => {
  try {
    const id = parseInventoryId(req.params.id);
    const quantity = ensurePositiveQuantity(req.body.quantity, 'Quantity');
    const reason = normalizeString(req.body.reason || 'Waste', 'Reason', { min: 2, max: 120 });
    const estimatedCost = req.body.estimatedCost === undefined || req.body.estimatedCost === null || req.body.estimatedCost === '' ? undefined : Number(req.body.estimatedCost);
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim().slice(0, 400) : '';

    const result = await prisma.$transaction(async (tx) => {
      const item = await ensureItemExists(id, tx);
      const previousStock = Number(item.currentStock);
      const newStock = previousStock - quantity;
      if (newStock < 0) throw new AppError('Insufficient stock', 400);

      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: { currentStock: newStock, status: calculateInventoryStatus(newStock, item.minimumStock) },
        include: itemInclude,
      });

      const waste = await tx.wasteRecord.create({
        data: {
          itemId: id,
          userId: req.user.id,
          quantity,
          reason,
          estimatedCost: Number.isFinite(estimatedCost) ? estimatedCost : quantity * Number(item.costPerUnit ?? 0),
          notes: notes || null,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          itemId: id,
          userId: req.user.id,
          supplierId: item.supplierId ?? null,
          type: 'WASTE',
          quantity,
          previousStock,
          newStock,
          unitCost: item.costPerUnit,
          reason,
          notes: notes || null,
        },
      });

      return { item: updatedItem, waste, movement };
    });

    return sendSuccess(res, 200, 'Waste recorded successfully.', { item: serializeItem(result.item), waste: result.waste, movement: result.movement });
  } catch (error) { return next(error); }
};

export const getInventoryMovements = async (req, res, next) => {
  try {
    const where = {};
    const { item, type, user, reason, from, to } = req.query;
    if (item) where.item = { name: { contains: String(item), mode: 'insensitive' } };
    if (type) where.type = String(type).toUpperCase();
    if (user) where.user = { fullName: { contains: String(user), mode: 'insensitive' } };
    if (reason) where.reason = { contains: String(reason), mode: 'insensitive' };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(String(from));
      if (to) where.createdAt.lte = new Date(String(to));
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: { item: true, user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 200, 'Inventory movements retrieved successfully.', { movements });
  } catch (error) { return next(error); }
};

export const getInventoryLowStock = async (_req, res, next) => {
  try {
    const items = await prisma.inventoryItem.findMany({ include: itemInclude, orderBy: { currentStock: 'asc' } });
    const response = items
      .filter((item) => Number(item.currentStock) <= Number(item.minimumStock))
      .map((item) => ({ ...item, status: calculateInventoryStatus(item.currentStock, item.minimumStock) }));

    return sendSuccess(res, 200, 'Low stock items retrieved successfully.', { items: response });
  } catch (error) { return next(error); }
};

export const getInventorySummary = async (_req, res, next) => {
  try {
    const items = await prisma.inventoryItem.findMany({ select: { currentStock: true, costPerUnit: true, minimumStock: true } });
    const totalItems = items.length;
    const totalInventoryValue = items.reduce((sum, item) => sum + Number(item.currentStock) * Number(item.costPerUnit || 0), 0);
    const lowStockCount = items.filter((item) => Number(item.currentStock) > 0 && Number(item.currentStock) <= Number(item.minimumStock)).length;
    const outOfStockCount = items.filter((item) => Number(item.currentStock) === 0).length;
    const healthyStockCount = items.filter((item) => Number(item.currentStock) > Number(item.minimumStock)).length;
    const totalStockMovements = await prisma.stockMovement.count();
    const totalWasteCost = await prisma.wasteRecord.aggregate({ _sum: { estimatedCost: true } });

    return sendSuccess(res, 200, 'Inventory summary retrieved successfully.', {
      summary: {
        totalItems,
        totalInventoryValue,
        lowStockCount,
        outOfStockCount,
        healthyStockCount,
        totalStockMovements,
        totalWasteCost: Number(totalWasteCost._sum.estimatedCost || 0),
      },
    });
  } catch (error) { return next(error); }
};

export const getInventoryReorderSuggestions = async (_req, res, next) => {
  try {
    const items = await prisma.inventoryItem.findMany({ include: itemInclude, orderBy: { currentStock: 'asc' } });
    const suggestions = items
      .filter((item) => Number(item.currentStock) <= Number(item.minimumStock))
      .map((item) => {
        const currentStock = Number(item.currentStock);
        const minimumStock = Number(item.minimumStock);
        const maximumStock = item.maximumStock !== null ? Number(item.maximumStock) : null;
        const reorderLevel = item.reorderLevel !== null ? Number(item.reorderLevel) : minimumStock * 2;
        const suggestedQuantity = maximumStock !== null ? Math.max(maximumStock - currentStock, 0) : Math.max(reorderLevel - currentStock, 0);

        return {
          item: item.name,
          currentStock,
          reorderLevel,
          suggestedQuantity,
          supplier: item.supplier?.name || 'Unassigned',
          status: calculateInventoryStatus(currentStock, minimumStock),
        };
      });

    return sendSuccess(res, 200, 'Reorder suggestions retrieved successfully.', { suggestions });
  } catch (error) { return next(error); }
};

const masterDataText = (value, fieldName, { required = false, max = 150 } = {}) => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (required && !text) throw new AppError(`${fieldName} is required.`, 400);
  if (text.length > max) throw new AppError(`${fieldName} must not exceed ${max} characters.`, 400);
  return text || null;
};

const categorySlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const getInventoryCategories = async (_req, res, next) => {
  try {
    const categories = await prisma.inventoryCategory.findMany({ orderBy: { name: 'asc' } });
    return sendSuccess(res, 200, 'Inventory categories retrieved successfully.', { categories });
  } catch (error) { return next(error); }
};

export const createInventoryCategory = async (req, res, next) => {
  try {
    const name = masterDataText(req.body?.name, 'Category name', { required: true, max: 100 });
    const slug = categorySlug(name);
    if (!slug) throw new AppError('Category name must contain letters or numbers.', 400);
    const category = await prisma.inventoryCategory.create({ data: { name, slug } });
    return sendSuccess(res, 201, 'Inventory category created successfully.', { category });
  } catch (error) { return next(error); }
};

export const getSuppliers = async (_req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    return sendSuccess(res, 200, 'Suppliers retrieved successfully.', { suppliers });
  } catch (error) { return next(error); }
};

export const createSupplier = async (req, res, next) => {
  try {
    const supplier = await prisma.supplier.create({
      data: {
        name: masterDataText(req.body?.name, 'Supplier name', { required: true, max: 150 }),
        contactPerson: masterDataText(req.body?.contactPerson, 'Contact person'),
        phone: masterDataText(req.body?.phone, 'Phone', { max: 30 }),
        email: masterDataText(req.body?.email, 'Email', { max: 254 }),
        address: masterDataText(req.body?.address, 'Address', { max: 500 }),
        notes: masterDataText(req.body?.notes, 'Notes', { max: 500 }),
      },
    });
    return sendSuccess(res, 201, 'Supplier created successfully.', { supplier });
  } catch (error) { return next(error); }
};
