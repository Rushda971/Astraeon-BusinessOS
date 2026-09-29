import prisma from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { sendSuccess } from '../utils/response.js';
import { calculateInventoryStatus } from '../services/inventory.service.js';

const include = { items: { include: { inventoryItem: { select: { id: true, name: true, sku: true, unit: true } } } }, user: { select: { id: true, fullName: true } } };
const positive = (value, label) => { const number = Number(value); if (!Number.isFinite(number) || number <= 0) throw new AppError(label + ' must be a positive number.', 400); return number; };
const nonNegative = (value, label) => { const number = Number(value || 0); if (!Number.isFinite(number) || number < 0) throw new AppError(label + ' must be a non-negative number.', 400); return number; };
const statuses = ['COMPLETED', 'PENDING', 'CANCELLED'];
const paymentStatuses = ['PAID', 'PENDING', 'PARTIAL'];
const getId = (value) => { const id = Number(value); if (!Number.isInteger(id) || id < 1) throw new AppError('Invalid sale ID.', 400); return id; };

export const getSales = async (req, res, next) => {
  try {
    const { search = '', status = '', paymentStatus = '', page = 1, limit = 20 } = req.query;
    const currentPage = Math.max(Number(page) || 1, 1); const take = Math.min(Math.max(Number(limit) || 20, 1), 100); const where = {};
    if (search) where.OR = [{ saleNumber: { contains: String(search) } }, { customerName: { contains: String(search) } }, { customerEmail: { contains: String(search) } }];
    if (status) { const value = String(status).toUpperCase(); if (!statuses.includes(value)) throw new AppError('Invalid sale status.', 400); where.status = value; }
    if (paymentStatus) { const value = String(paymentStatus).toUpperCase(); if (!paymentStatuses.includes(value)) throw new AppError('Invalid payment status.', 400); where.paymentStatus = value; }
    const [sales, total] = await Promise.all([prisma.sale.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip: (currentPage - 1) * take, take }), prisma.sale.count({ where })]);
    return sendSuccess(res, 200, 'Sales retrieved successfully.', { sales, pagination: { page: currentPage, limit: take, total, totalPages: Math.ceil(total / take) } });
  } catch (error) { return next(error); }
};
export const getSale = async (req, res, next) => { try { const sale = await prisma.sale.findUnique({ where: { id: getId(req.params.id) }, include }); if (!sale) throw new AppError('Sale not found.', 404); return sendSuccess(res, 200, 'Sale retrieved successfully.', { sale }); } catch (error) { return next(error); } };
export const createSale = async (req, res, next) => {
  try {
    const body = req.body || {}; if (!Array.isArray(body.items) || !body.items.length) throw new AppError('At least one sale item is required.', 400);
    const requested = body.items.map((item) => ({ inventoryItemId: getId(item.inventoryItemId), quantity: positive(item.quantity, 'Quantity') }));
    if (new Set(requested.map((item) => item.inventoryItemId)).size !== requested.length) throw new AppError('Each inventory item may only appear once.', 400);
    const discount = nonNegative(body.discount, 'Discount'); const tax = nonNegative(body.tax, 'Tax');
    const sale = await prisma.$transaction(async (tx) => {
      const stock = await tx.inventoryItem.findMany({ where: { id: { in: requested.map((item) => item.inventoryItemId) } } });
      if (stock.length !== requested.length) throw new AppError('One or more inventory items were not found.', 404);
      const byId = new Map(stock.map((item) => [item.id, item])); let subtotal = 0;
      const items = requested.map((requestedItem) => { const item = byId.get(requestedItem.inventoryItemId); if (Number(item.currentStock) < requestedItem.quantity) throw new AppError('Insufficient stock for ' + item.name + '.', 400); const unitPrice = Number(item.sellingPrice ?? item.costPerUnit ?? 0); const totalPrice = unitPrice * requestedItem.quantity; subtotal += totalPrice; return { ...requestedItem, unitPrice, totalPrice, item }; });
      const now = new Date(); const saleNumber = 'SAL-' + now.getTime().toString().slice(-8) + '-' + Math.floor(Math.random() * 900 + 100);
      const totalAmount = Math.max(subtotal - discount + tax, 0);
      const created = await tx.sale.create({ data: { saleNumber, customerName: typeof body.customerName === 'string' ? body.customerName.trim() || null : null, customerEmail: typeof body.customerEmail === 'string' ? body.customerEmail.trim() || null : null, status: 'COMPLETED', paymentStatus: paymentStatuses.includes(String(body.paymentStatus).toUpperCase()) ? String(body.paymentStatus).toUpperCase() : 'PAID', subtotal, discount, tax, totalAmount, userId: req.user.id, items: { create: items.map((item) => ({ inventoryItemId: item.inventoryItemId, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice })) } }, include });
      for (const item of items) { const newStock = Number(item.item.currentStock) - item.quantity; await tx.inventoryItem.update({ where: { id: item.inventoryItemId }, data: { currentStock: newStock, status: calculateInventoryStatus(newStock, item.item.minimumStock) } }); await tx.stockMovement.create({ data: { itemId: item.inventoryItemId, userId: req.user.id, supplierId: item.item.supplierId, type: 'OUT', quantity: item.quantity, previousStock: item.item.currentStock, newStock, unitCost: item.unitPrice, reason: 'Sale ' + saleNumber, notes: null } }); }
      return created;
    });
    return sendSuccess(res, 201, 'Sale created successfully.', { sale });
  } catch (error) { return next(error); }
};
export const updateSaleStatus = async (req, res, next) => { try { const status = String(req.body?.status || '').toUpperCase(); const paymentStatus = String(req.body?.paymentStatus || '').toUpperCase(); if (!statuses.includes(status) && !paymentStatuses.includes(paymentStatus)) throw new AppError('A valid status or payment status is required.', 400); const sale = await prisma.$transaction(async (tx) => { const current = await tx.sale.findUnique({ where: { id: getId(req.params.id) }, include: { items: true } }); if (!current) throw new AppError('Sale not found.', 404); if (current.status === 'CANCELLED' && status && status !== 'CANCELLED') throw new AppError('Cancelled sales cannot be reopened.', 400); if (status === 'CANCELLED' && current.status !== 'CANCELLED') { const inventory = await tx.inventoryItem.findMany({ where: { id: { in: current.items.map((item) => item.inventoryItemId) } } }); const byId = new Map(inventory.map((item) => [item.id, item])); for (const line of current.items) { const item = byId.get(line.inventoryItemId); if (!item) throw new AppError('Inventory history is incomplete for this sale.', 409); const previousStock = Number(item.currentStock); const newStock = previousStock + Number(line.quantity); await tx.inventoryItem.update({ where: { id: item.id }, data: { currentStock: newStock, status: calculateInventoryStatus(newStock, item.minimumStock) } }); await tx.stockMovement.create({ data: { itemId: item.id, userId: req.user.id, supplierId: item.supplierId, type: 'IN', quantity: line.quantity, previousStock, newStock, unitCost: line.unitPrice, reason: `Sale ${current.saleNumber} cancelled`, notes: null } }); } } return tx.sale.update({ where: { id: current.id }, data: { ...(statuses.includes(status) ? { status } : {}), ...(paymentStatuses.includes(paymentStatus) ? { paymentStatus } : {}) }, include }); }); return sendSuccess(res, 200, 'Sale status updated successfully.', { sale }); } catch (error) { return next(error); } };
export const getSalesSummary = async (_req, res, next) => { try { const sales = await prisma.sale.findMany({ select: { totalAmount: true, status: true, paymentStatus: true, createdAt: true } }); const completed = sales.filter((sale) => sale.status === 'COMPLETED'); const revenue = completed.reduce((sum, sale) => sum + Number(sale.totalAmount), 0); return sendSuccess(res, 200, 'Sales summary retrieved successfully.', { summary: { totalSales: sales.length, totalRevenue: revenue, completedSales: completed.length, pendingPayments: sales.filter((sale) => sale.paymentStatus !== 'PAID').length, averageSaleValue: completed.length ? revenue / completed.length : 0 } }); } catch (error) { return next(error); } };
