import prisma from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { sendSuccess } from '../utils/response.js';
import { calculateInventoryStatus } from '../services/inventory.service.js';

const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'];
const transitions = { PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PROCESSING', 'CANCELLED'], PROCESSING: ['READY', 'CANCELLED'], READY: ['COMPLETED', 'CANCELLED'] };
const include = { items: { include: { inventoryItem: { select: { id: true, name: true, sku: true, unit: true } } } }, user: { select: { id: true, fullName: true } }, sale: { select: { id: true, saleNumber: true, paymentStatus: true } } };
const id = (value) => { const parsed = Number(value); if (!Number.isInteger(parsed) || parsed < 1) throw new AppError('Invalid order ID.', 400); return parsed; };
const number = (value, label, allowZero = true) => { const parsed = Number(value ?? 0); if (!Number.isFinite(parsed) || parsed < 0 || (!allowZero && parsed === 0)) throw new AppError(`${label} must be a ${allowZero ? 'non-negative' : 'positive'} number.`, 400); return parsed; };
const text = (value, max = 160) => typeof value === 'string' ? value.trim().slice(0, max) || null : null;
const orderNumber = () => `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;
const saleNumber = () => `SAL-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;

function requestedItems(body) {
  if (!Array.isArray(body?.items) || !body.items.length) throw new AppError('At least one order item is required.', 400);
  const items = body.items.map((item) => ({ inventoryItemId: id(item.inventoryItemId), quantity: number(item.quantity, 'Quantity', false) }));
  if (new Set(items.map((item) => item.inventoryItemId)).size !== items.length) throw new AppError('Each inventory item may only appear once.', 400);
  return items;
}

async function completeOrder(tx, order, userId) {
  if (order.saleId) return order;
  const inventory = await tx.inventoryItem.findMany({ where: { id: { in: order.items.map((item) => item.inventoryItemId) } } });
  const byId = new Map(inventory.map((item) => [item.id, item]));
  for (const line of order.items) {
    const item = byId.get(line.inventoryItemId);
    if (!item || Number(item.currentStock) < Number(line.quantity)) throw new AppError(`Insufficient stock for ${item?.name || 'an order item'}.`, 400);
  }
  const sale = await tx.sale.create({ data: { saleNumber: saleNumber(), customerName: order.customerName, customerEmail: order.customerEmail, status: 'COMPLETED', paymentStatus: 'PENDING', subtotal: order.subtotal, discount: order.discount, tax: order.tax, totalAmount: order.totalAmount, userId, items: { create: order.items.map((line) => ({ inventoryItemId: line.inventoryItemId, quantity: line.quantity, unitPrice: line.unitPrice, totalPrice: line.totalPrice })) } } });
  for (const line of order.items) {
    const item = byId.get(line.inventoryItemId); const previousStock = Number(item.currentStock); const newStock = previousStock - Number(line.quantity);
    await tx.inventoryItem.update({ where: { id: item.id }, data: { currentStock: newStock, status: calculateInventoryStatus(newStock, item.minimumStock) } });
    await tx.stockMovement.create({ data: { itemId: item.id, userId, supplierId: item.supplierId, type: 'OUT', quantity: line.quantity, previousStock, newStock, unitCost: line.unitPrice, reason: `Order ${order.orderNumber} completed`, notes: null } });
  }
  return tx.order.update({ where: { id: order.id }, data: { status: 'COMPLETED', saleId: sale.id }, include });
}

export const getOrders = async (req, res, next) => {
  try {
    const { search = '', status = '', from, to, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = req.query;
    const where = {}; const value = String(status).toUpperCase();
    if (value) { if (!statuses.includes(value)) throw new AppError('Invalid order status.', 400); where.status = value; }
    if (search) where.OR = [{ orderNumber: { contains: String(search) } }, { customerName: { contains: String(search) } }, { customerEmail: { contains: String(search) } }];
    if (from || to) { where.createdAt = {}; if (from) where.createdAt.gte = new Date(String(from)); if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`); }
    const take = Math.min(Math.max(Number(limit) || 20, 1), 100); const currentPage = Math.max(Number(page) || 1, 1); const orderBy = ['createdAt', 'totalAmount', 'orderNumber', 'status'].includes(sortBy) ? { [sortBy]: String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc' } : { createdAt: 'desc' };
    const [orders, total] = await Promise.all([prisma.order.findMany({ where, include, orderBy, skip: (currentPage - 1) * take, take }), prisma.order.count({ where })]);
    return sendSuccess(res, 200, 'Orders retrieved successfully.', { orders, pagination: { page: currentPage, limit: take, total, totalPages: Math.ceil(total / take) } });
  } catch (error) { return next(error); }
};

export const getOrder = async (req, res, next) => { try { const order = await prisma.order.findUnique({ where: { id: id(req.params.id) }, include }); if (!order) throw new AppError('Order not found.', 404); return sendSuccess(res, 200, 'Order retrieved successfully.', { order }); } catch (error) { return next(error); } };

export const createOrder = async (req, res, next) => {
  try {
    const requested = requestedItems(req.body); const discount = number(req.body?.discount, 'Discount'); const tax = number(req.body?.tax, 'Tax');
    const order = await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventoryItem.findMany({ where: { id: { in: requested.map((item) => item.inventoryItemId) } } });
      if (inventory.length !== requested.length) throw new AppError('One or more inventory items were not found.', 404);
      const byId = new Map(inventory.map((item) => [item.id, item])); let subtotal = 0;
      const lines = requested.map((line) => { const item = byId.get(line.inventoryItemId); if (Number(item.currentStock) < line.quantity) throw new AppError(`Insufficient stock for ${item.name}.`, 400); const unitPrice = Number(item.sellingPrice ?? item.costPerUnit ?? 0); const totalPrice = unitPrice * line.quantity; subtotal += totalPrice; return { ...line, unitPrice, totalPrice }; });
      return tx.order.create({ data: { orderNumber: orderNumber(), customerName: text(req.body?.customerName), customerEmail: text(req.body?.customerEmail), notes: text(req.body?.notes, 500), subtotal, discount, tax, totalAmount: Math.max(subtotal - discount + tax, 0), userId: req.user.id, items: { create: lines } }, include });
    });
    return sendSuccess(res, 201, 'Order created successfully.', { order });
  } catch (error) { return next(error); }
};

export const updateOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: id(req.params.id) } }); if (!order) throw new AppError('Order not found.', 404); if (order.status !== 'PENDING') throw new AppError('Only pending orders can be edited.', 400);
    const data = {}; if (Object.hasOwn(req.body, 'customerName')) data.customerName = text(req.body.customerName); if (Object.hasOwn(req.body, 'customerEmail')) data.customerEmail = text(req.body.customerEmail); if (Object.hasOwn(req.body, 'notes')) data.notes = text(req.body.notes, 500);
    const updated = await prisma.order.update({ where: { id: order.id }, data, include }); return sendSuccess(res, 200, 'Order updated successfully.', { order: updated });
  } catch (error) { return next(error); }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const target = String(req.body?.status || '').toUpperCase(); if (!statuses.includes(target)) throw new AppError('A valid order status is required.', 400);
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: id(req.params.id) }, include: { items: true } }); if (!order) throw new AppError('Order not found.', 404);
      if (!transitions[order.status]?.includes(target)) throw new AppError(`Cannot move an order from ${order.status} to ${target}.`, 400);
      if (target === 'COMPLETED') return completeOrder(tx, order, req.user.id);
      return tx.order.update({ where: { id: order.id }, data: { status: target }, include });
    });
    return sendSuccess(res, 200, 'Order status updated successfully.', { order: updated });
  } catch (error) { return next(error); }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: id(req.params.id) }, include }); if (!order) throw new AppError('Order not found.', 404);
    if (order.status === 'COMPLETED') throw new AppError('Completed orders cannot be cancelled because they have a linked sale.', 400);
    if (order.status === 'CANCELLED') throw new AppError('Order is already cancelled.', 400);
    const cancelled = await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' }, include }); return sendSuccess(res, 200, 'Order cancelled successfully.', { order: cancelled });
  } catch (error) { return next(error); }
};

export const getOrdersSummary = async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({ select: { id: true, orderNumber: true, status: true, totalAmount: true, customerName: true, createdAt: true, updatedAt: true } });
    const count = (status) => orders.filter((order) => order.status === status).length;
    return sendSuccess(res, 200, 'Orders summary retrieved successfully.', { summary: { totalOrders: orders.length, pendingOrders: count('PENDING'), processingOrders: count('PROCESSING'), completedOrders: count('COMPLETED'), cancelledOrders: count('CANCELLED'), statusDistribution: statuses.map((status) => ({ status, count: count(status) })), recentActivity: orders.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6) } });
  } catch (error) { return next(error); }
};
