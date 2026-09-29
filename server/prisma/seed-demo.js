import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production.');

const prisma = new PrismaClient();
const firstOrCreate = async (model, where, data) => (await model.findUnique({ where })) || model.create({ data });

async function seed() {
  let user = await prisma.user.findUnique({ where: { email: 'demo.manager@astraeon.local' } });
  if (!user) {
    const demoPassword = process.env.DEMO_SEED_PASSWORD;
    if (!demoPassword || demoPassword.length < 12) {
      throw new Error('Set DEMO_SEED_PASSWORD to a value of at least 12 characters before creating the demo account.');
    }
    user = await prisma.user.create({ data: { fullName: 'Astraeon Demo Manager', email: 'demo.manager@astraeon.local', password: await bcrypt.hash(demoPassword, 12), role: 'OWNER', emailVerified: true } });
  }
  const category = await firstOrCreate(prisma.inventoryCategory, { name: 'Demo ingredients' }, { name: 'Demo ingredients', slug: 'demo-ingredients' });
  const supplier = await prisma.supplier.findFirst({ where: { name: 'Astraeon Demo Supply' } }) || await prisma.supplier.create({ data: { name: 'Astraeon Demo Supply', contactPerson: 'Demo Contact', phone: '0000000000', email: 'supplier@astraeon.local' } });
  const chickpea = await firstOrCreate(prisma.inventoryItem, { sku: 'DEMO-CHICKPEA' }, { name: 'Chickpea bowl', sku: 'DEMO-CHICKPEA', unit: 'portion', currentStock: 28, minimumStock: 5, maximumStock: 50, reorderLevel: 10, costPerUnit: 110, sellingPrice: 240, status: 'IN_STOCK', categoryId: category.id, supplierId: supplier.id });
  const tomato = await firstOrCreate(prisma.inventoryItem, { sku: 'DEMO-TOMATO' }, { name: 'Tomato soup', sku: 'DEMO-TOMATO', unit: 'portion', currentStock: 34, minimumStock: 6, maximumStock: 50, reorderLevel: 12, costPerUnit: 55, sellingPrice: 180, status: 'IN_STOCK', categoryId: category.id, supplierId: supplier.id });

  for (const employee of [
    { employeeCode: 'DEMO-EMP-01', firstName: 'Asha', lastName: 'Kapoor', email: 'asha.demo@astraeon.local', phone: '9000000001', department: 'Kitchen', designation: 'Head Chef', joiningDate: new Date('2024-01-15'), salary: 42000 },
    { employeeCode: 'DEMO-EMP-02', firstName: 'Kabir', lastName: 'Mehta', email: 'kabir.demo@astraeon.local', phone: '9000000002', department: 'Service', designation: 'Floor Manager', joiningDate: new Date('2024-04-08'), salary: 36000 },
  ]) if (!(await prisma.employee.findUnique({ where: { employeeCode: employee.employeeCode } }))) await prisma.employee.create({ data: employee });

  const menuCategory = await firstOrCreate(prisma.menuCategory, { name: 'Demo favorites' }, { name: 'Demo favorites', description: 'Sample dishes for the Astraeon walkthrough.' });
  for (const product of [
    { name: 'Demo chickpea bowl', description: 'House chickpeas with herbs and rice.', price: 240, imageUrl: '/menu/chickpea-bowl.svg', categoryId: menuCategory.id },
    { name: 'Demo tomato soup', description: 'Slow-cooked tomato and basil soup.', price: 180, imageUrl: '/menu/tomato-soup.svg', categoryId: menuCategory.id },
  ]) {
    const existing = await prisma.menuProduct.findFirst({ where: { name: product.name, categoryId: menuCategory.id } });
    if (existing) await prisma.menuProduct.update({ where: { id: existing.id }, data: { imageUrl: product.imageUrl } });
    else await prisma.menuProduct.create({ data: product });
  }

  let sale = await prisma.sale.findUnique({ where: { saleNumber: 'DEMO-SALE-1001' } });
  if (!sale) sale = await prisma.$transaction(async (tx) => {
    const rows = [{ item: chickpea, quantity: 2 }, { item: tomato, quantity: 1 }];
    const subtotal = rows.reduce((sum, row) => sum + row.quantity * Number(row.item.sellingPrice), 0);
    const tax = 33;
    const created = await tx.sale.create({ data: {
      saleNumber: 'DEMO-SALE-1001', customerName: 'Maya Chen', customerEmail: 'maya.chen@example.test', status: 'COMPLETED', paymentStatus: 'PAID', subtotal, discount: 0, tax, totalAmount: subtotal + tax, userId: user.id,
      items: { create: rows.map(({ item, quantity }) => ({ inventoryItemId: item.id, quantity, unitPrice: item.sellingPrice, totalPrice: quantity * Number(item.sellingPrice) })) },
    } });
    for (const { item, quantity } of rows) {
      const previousStock = Number(item.currentStock), newStock = previousStock - quantity;
      await tx.inventoryItem.update({ where: { id: item.id }, data: { currentStock: newStock } });
      await tx.stockMovement.create({ data: { itemId: item.id, userId: user.id, supplierId: item.supplierId, type: 'OUT', quantity, previousStock, newStock, unitCost: item.sellingPrice, reason: 'Demo sale DEMO-SALE-1001' } });
    }
    return created;
  });

  if (!(await prisma.order.findUnique({ where: { orderNumber: 'DEMO-ORD-1001' } }))) await prisma.order.create({ data: {
    orderNumber: 'DEMO-ORD-1001', customerName: 'Maya Chen', customerEmail: 'maya.chen@example.test', status: 'COMPLETED', subtotal: sale.subtotal, discount: sale.discount, tax: sale.tax, totalAmount: sale.totalAmount, userId: user.id, saleId: sale.id,
    items: { create: [{ inventoryItemId: chickpea.id, quantity: 2, unitPrice: chickpea.sellingPrice, totalPrice: 480 }, { inventoryItemId: tomato.id, quantity: 1, unitPrice: tomato.sellingPrice, totalPrice: 180 }] },
  } });
  if (!(await prisma.order.findUnique({ where: { orderNumber: 'DEMO-ORD-1002' } }))) await prisma.order.create({ data: {
    orderNumber: 'DEMO-ORD-1002', customerName: 'Ishan Rao', customerEmail: 'ishan.rao@example.test', status: 'CONFIRMED', subtotal: chickpea.sellingPrice, discount: 0, tax: 12, totalAmount: Number(chickpea.sellingPrice) + 12, userId: user.id,
    items: { create: [{ inventoryItemId: chickpea.id, quantity: 1, unitPrice: chickpea.sellingPrice, totalPrice: chickpea.sellingPrice }] },
  } });
  console.log('Demo data added (or already present).');
}

seed().catch((error) => { console.error('Demo seed failed:', error.message); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
