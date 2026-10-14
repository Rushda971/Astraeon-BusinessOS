import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production.');

const prisma = new PrismaClient();
const firstOrCreate = async (model, where, data) => (await model.findUnique({ where })) || model.create({ data });
const renamePrefix = async (model, field, oldPrefix, newPrefix) => {
  const rows = await model.findMany({ where: { [field]: { startsWith: oldPrefix } } });
  for (const row of rows) await model.update({ where: { id: row.id }, data: { [field]: row[field].replace(oldPrefix, newPrefix) } });
};
async function seed() {
  await renamePrefix(prisma.employee, 'employeeCode', 'DEMO-EMP-', 'AST-EMP-');
  await renamePrefix(prisma.inventoryItem, 'sku', 'DEMO-', 'AST-');
  await renamePrefix(prisma.order, 'orderNumber', 'DEMO-ORD-', 'ORD-2026-');
  await renamePrefix(prisma.sale, 'saleNumber', 'DEMO-SALE-', 'SAL-2026-');
  for (const [oldName, newName] of [['Demo ingredients','Pantry & produce'],['Demo produce','Fresh produce'],['Demo pantry','Dry pantry'],['Demo dairy & bar','Dairy & beverages']]) {
    const category = await prisma.inventoryCategory.findUnique({ where: { name: oldName } });
    if (category && !(await prisma.inventoryCategory.findUnique({ where: { name: newName } }))) await prisma.inventoryCategory.update({ where: { id: category.id }, data: { name: newName, slug: newName.toLowerCase().replaceAll(' & ', '-').replaceAll(' ', '-') } });
  }
  for (const [oldName, newName] of [['Demo favorites','House favorites'],['Demo mains','Main course'],['Demo desserts','Desserts'],['Demo drinks','Drinks']]) {
    const category = await prisma.menuCategory.findUnique({ where: { name: oldName } });
    if (category && !(await prisma.menuCategory.findUnique({ where: { name: newName } }))) await prisma.menuCategory.update({ where: { id: category.id }, data: { name: newName } });
  }
  for (const [oldName, newName] of [['Astraeon Demo Supply','Astraeon Supply'],['Demo Fresh Market','Green Valley Produce']]) {
    const supplierRecord = await prisma.supplier.findFirst({ where: { name: oldName } });
    if (supplierRecord && !(await prisma.supplier.findFirst({ where: { name: newName } }))) await prisma.supplier.update({ where: { id: supplierRecord.id }, data: { name: newName } });
  }
  let user = await prisma.user.findUnique({ where: { email: 'demo.manager@astraeon.local' } });
  if (!user) {
    const demoPassword = process.env.DEMO_SEED_PASSWORD;
    if (!demoPassword || demoPassword.length < 12) {
      throw new Error('Set DEMO_SEED_PASSWORD to a value of at least 12 characters before creating the demo account.');
    }
    user = await prisma.user.create({ data: { fullName: 'Astraeon Restaurant Manager', email: 'demo.manager@astraeon.local', password: await bcrypt.hash(demoPassword, 12), role: 'OWNER', emailVerified: true } });
  }
  if (user.fullName === 'Astraeon Demo Manager') user = await prisma.user.update({ where: { id: user.id }, data: { fullName: 'Astraeon Restaurant Manager' } });
  const category = await firstOrCreate(prisma.inventoryCategory, { name: 'Pantry & produce' }, { name: 'Pantry & produce', slug: 'pantry-produce' });
  const supplier = await prisma.supplier.findFirst({ where: { name: 'Astraeon Supply' } }) || await prisma.supplier.create({ data: { name: 'Astraeon Supply', contactPerson: 'Karan Shah', phone: '9000088000', email: 'supply@astraeon.local' } });
  const chickpea = await firstOrCreate(prisma.inventoryItem, { sku: 'AST-CHICKPEA' }, { name: 'Chickpea bowl', sku: 'AST-CHICKPEA', unit: 'portion', currentStock: 28, minimumStock: 5, maximumStock: 50, reorderLevel: 10, costPerUnit: 110, sellingPrice: 240, status: 'IN_STOCK', categoryId: category.id, supplierId: supplier.id });
  const tomato = await firstOrCreate(prisma.inventoryItem, { sku: 'AST-TOMATO' }, { name: 'Tomato soup', sku: 'AST-TOMATO', unit: 'portion', currentStock: 34, minimumStock: 6, maximumStock: 50, reorderLevel: 12, costPerUnit: 55, sellingPrice: 180, status: 'IN_STOCK', categoryId: category.id, supplierId: supplier.id });

  for (const employee of [
    { employeeCode: 'DEMO-EMP-01', firstName: 'Asha', lastName: 'Kapoor', email: 'asha.kapoor@astraeon.local', phone: '9000000001', department: 'Kitchen', designation: 'Head Chef', joiningDate: new Date('2024-01-15'), salary: 42000 },
    { employeeCode: 'DEMO-EMP-02', firstName: 'Kabir', lastName: 'Mehta', email: 'kabir.mehta@astraeon.local', phone: '9000000002', department: 'Service', designation: 'Floor Manager', joiningDate: new Date('2024-04-08'), salary: 36000 },
  ]) {
    employee.employeeCode = employee.employeeCode.replace('DEMO-', 'AST-');
    const existing = await prisma.employee.findUnique({ where: { employeeCode: employee.employeeCode } });
    if (existing) await prisma.employee.update({ where: { id: existing.id }, data: employee });
    else await prisma.employee.create({ data: employee });
  }

  const team = [
    ['Riya','Sharma','Kitchen','Sous Chef',39500],['Arjun','Verma','Kitchen','Line Cook',28500],['Meera','Iyer','Kitchen','Pastry Chef',32000],
    ['Dev','Malhotra','Service','Restaurant Captain',27500],['Anaya','Reddy','Service','Server',22000],['Vivaan','Singh','Service','Server',22000],
    ['Sana','Khan','Operations','Shift Supervisor',34000],['Ishaan','Gupta','Operations','Cashier',24500],['Tara','Nair','Kitchen','Prep Cook',23500],
    ['Reyansh','Das','Service','Host',21000],['Kiara','Joshi','Kitchen','Commis Chef',26000],['Neil','Bose','Operations','Storekeeper',25500],
    ['Aditi','Kulkarni','Service','Restaurant Captain',28000],['Kabir','Sethi','Kitchen','Line Cook',29000],['Zoya','Mirza','Operations','Cashier',24000],
  ];
  for (const [index, [firstName, lastName, department, designation, salary]] of team.entries()) {
    const employeeCode = `AST-EMP-${String(index + 3).padStart(2, '0')}`;
    if (!(await prisma.employee.findUnique({ where: { employeeCode } }))) await prisma.employee.create({ data: {
      employeeCode, firstName, lastName, email: `${firstName}.${lastName}@astraeon.local`.toLowerCase(), phone: `900000${String(index + 3).padStart(4, '0')}`,
      department, designation, joiningDate: new Date(Date.now() - (120 + index * 38) * 86400000), salary,
      status: index === 8 ? 'ON_LEAVE' : index === 14 ? 'INACTIVE' : 'ACTIVE',
    } });
  }

  const stockList = [
    ['Basmati rice','AST-RICE','kg',72,8,68,145],['Paneer','AST-PANEER','kg',18,5,290,440],['Fresh cream','AST-CREAM','litre',24,6,180,285],
    ['Onion','AST-ONION','kg',42,10,32,75],['Potato','AST-POTATO','kg',38,10,28,65],['Cooking oil','AST-OIL','litre',31,8,125,195],
    ['Chicken breast','AST-CHICKEN','kg',16,5,240,390],['Lentils','AST-LENTILS','kg',29,7,95,165],['All-purpose flour','AST-FLOUR','kg',44,12,38,82],
    ['Bell pepper','AST-PEPPER','kg',13,5,85,155],['Mozzarella','AST-MOZZARELLA','kg',11,4,360,520],['Cocoa powder','AST-COCOA','kg',7,3,420,690],
    ['Coffee beans','AST-COFFEE','kg',15,4,520,790],['Mint leaves','AST-MINT','bunch',9,4,18,45],['Lemon','AST-LEMON','kg',21,6,42,90],
  ];
  const inventoryItems = [chickpea, tomato];
  for (const [index, [name, sku, unit, currentStock, minimumStock, costPerUnit, sellingPrice]] of stockList.entries()) {
    const categoryName = index < 5 ? 'Fresh produce' : index < 10 ? 'Dry pantry' : 'Dairy & beverages';
    const slug = categoryName.toLowerCase().replaceAll(' ', '-');
    const itemCategory = await firstOrCreate(prisma.inventoryCategory, { name: categoryName }, { name: categoryName, slug });
    const itemSupplier = index % 2 ? supplier : (await prisma.supplier.findFirst({ where: { name: 'Green Valley Produce' } }) || await prisma.supplier.create({ data: { name: 'Green Valley Produce', contactPerson: 'Pooja Rao', phone: '9000099000', email: 'fresh@astraeon.local' } }));
    const existing = await prisma.inventoryItem.findUnique({ where: { sku } });
    inventoryItems.push(existing || await prisma.inventoryItem.create({ data: { name, sku, unit, currentStock, minimumStock, maximumStock: currentStock * 2, reorderLevel: minimumStock + 3, costPerUnit, sellingPrice, status: currentStock <= minimumStock ? 'LOW_STOCK' : 'IN_STOCK', categoryId: itemCategory.id, supplierId: itemSupplier.id } }));
  }

  const menuCategory = await firstOrCreate(prisma.menuCategory, { name: 'House favorites' }, { name: 'House favorites', description: 'A selection of guest favorites from the kitchen.' });
  const menuPhotos = [
    '/menu/butter-chicken.jpg', '/menu/palak-paneer.jpg', '/menu/masala-dosa.jpg', '/menu/hyderabadi-biryani.jpg',
    '/menu/chole-bhature.jpg', '/menu/hakka-noodles.jpg', '/menu/chicken-tikka.jpg', '/menu/mushroom-pepper-fry-photo.jpg',
    '/menu/gulab-jamun.jpg', '/menu/mango-lassi.jpg', '/menu/filter-coffee.jpg', '/menu/chocolate-brownie.jpg',
    '/menu/garden-salad.jpg', '/menu/tandoori-roti-photo.jpg',
  ];
  for (const product of [
    { name: 'Chickpea bowl', description: 'Slow-simmered chickpeas, fragrant rice and fresh herbs.', price: 240, imageUrl: '/menu/chickpea-bowl-photo.jpg', categoryId: menuCategory.id },
    { name: 'Tomato soup', description: 'Roasted tomato soup finished with garden basil.', price: 180, imageUrl: '/menu/tomato-soup-photo.jpg', categoryId: menuCategory.id },
  ]) {
    const legacyName = product.name === 'Chickpea bowl' ? 'Demo chickpea bowl' : 'Demo tomato soup';
    const existing = await prisma.menuProduct.findFirst({ where: { OR: [{ name: product.name }, { name: legacyName }], categoryId: menuCategory.id } });
    if (existing) await prisma.menuProduct.update({ where: { id: existing.id }, data: product });
    else await prisma.menuProduct.create({ data: product });
  }

  const moreProducts = [
    ['Butter chicken','Creamy tomato gravy with tandoor chicken.',420],['Palak paneer','Paneer and spinach with warming spices.',340],['Masala dosa','Crisp dosa with potato masala.',260],
    ['Hyderabadi biryani','Fragrant basmati layered with spices.',390],['Chole bhature','Punjabi chickpeas with fluffy bhature.',280],['Veg hakka noodles','Wok-tossed noodles and seasonal vegetables.',290],
    ['Chicken tikka','Chargrilled chicken with mint chutney.',360],['Mushroom pepper fry','Peppery mushrooms with curry leaves.',310],['Gulab jamun','Warm cardamom syrup dumplings.',150],
    ['Mango lassi','Chilled mango yogurt drink.',140],['Filter coffee','South Indian filter coffee.',95],['Chocolate brownie','Warm brownie with chocolate sauce.',210],
    ['Garden salad','Fresh greens, cucumber and citrus dressing.',220],['Tandoori roti','Whole wheat flatbread from the tandoor.',55],
  ];
  const menuCategories = {};
  for (const [index, [name, description, price]] of moreProducts.entries()) {
    const categoryName = ['Gulab jamun','Chocolate brownie'].includes(name) ? 'Desserts' : ['Mango lassi','Filter coffee'].includes(name) ? 'Drinks' : 'Main course';
    if (!menuCategories[categoryName]) menuCategories[categoryName] = await firstOrCreate(prisma.menuCategory, { name: categoryName }, { name: categoryName, description: 'Kitchen favorites across signature dishes, desserts, and drinks.' });
    if (menuCategories[categoryName].description?.includes('examiner walkthrough')) menuCategories[categoryName] = await prisma.menuCategory.update({ where: { id: menuCategories[categoryName].id }, data: { description: 'Kitchen favorites across signature dishes, desserts, and drinks.' } });
    const existing = await prisma.menuProduct.findFirst({ where: { name, categoryId: menuCategories[categoryName].id } });
    if (existing) await prisma.menuProduct.update({ where: { id: existing.id }, data: { description, imageUrl: menuPhotos[index % menuPhotos.length] } });
    else await prisma.menuProduct.create({ data: { name, description, price, imageUrl: menuPhotos[index % menuPhotos.length], categoryId: menuCategories[categoryName].id } });
  }

  let sale = await prisma.sale.findUnique({ where: { saleNumber: 'SAL-2026-1001' } });
  if (!sale) sale = await prisma.$transaction(async (tx) => {
    const rows = [{ item: chickpea, quantity: 2 }, { item: tomato, quantity: 1 }];
    const subtotal = rows.reduce((sum, row) => sum + row.quantity * Number(row.item.sellingPrice), 0);
    const tax = 33;
    const created = await tx.sale.create({ data: {
      saleNumber: 'SAL-2026-1001', customerName: 'Maya Chen', customerEmail: 'maya.chen@example.test', status: 'COMPLETED', paymentStatus: 'PAID', subtotal, discount: 0, tax, totalAmount: subtotal + tax, userId: user.id,
      items: { create: rows.map(({ item, quantity }) => ({ inventoryItemId: item.id, quantity, unitPrice: item.sellingPrice, totalPrice: quantity * Number(item.sellingPrice) })) },
    } });
    for (const { item, quantity } of rows) {
      const previousStock = Number(item.currentStock), newStock = previousStock - quantity;
      await tx.inventoryItem.update({ where: { id: item.id }, data: { currentStock: newStock } });
      await tx.stockMovement.create({ data: { itemId: item.id, userId: user.id, supplierId: item.supplierId, type: 'OUT', quantity, previousStock, newStock, unitCost: item.sellingPrice, reason: 'Sale SAL-2026-1001' } });
    }
    return created;
  });

  if (!(await prisma.order.findUnique({ where: { orderNumber: 'ORD-2026-1001' } }))) await prisma.order.create({ data: {
    orderNumber: 'ORD-2026-1001', customerName: 'Maya Chen', customerEmail: 'maya.chen@example.test', status: 'COMPLETED', subtotal: sale.subtotal, discount: sale.discount, tax: sale.tax, totalAmount: sale.totalAmount, userId: user.id, saleId: sale.id,
    items: { create: [{ inventoryItemId: chickpea.id, quantity: 2, unitPrice: chickpea.sellingPrice, totalPrice: 480 }, { inventoryItemId: tomato.id, quantity: 1, unitPrice: tomato.sellingPrice, totalPrice: 180 }] },
  } });
  if (!(await prisma.order.findUnique({ where: { orderNumber: 'ORD-2026-1002' } }))) await prisma.order.create({ data: {
    orderNumber: 'ORD-2026-1002', customerName: 'Ishan Rao', customerEmail: 'ishan.rao@example.test', status: 'CONFIRMED', subtotal: chickpea.sellingPrice, discount: 0, tax: 12, totalAmount: Number(chickpea.sellingPrice) + 12, userId: user.id,
    items: { create: [{ inventoryItemId: chickpea.id, quantity: 1, unitPrice: chickpea.sellingPrice, totalPrice: chickpea.sellingPrice }] },
  } });

  const guestNames = ['Aarav Mehta','Nisha Patel','Kabir Shah','Maya Chen','Ishan Rao','Anika Roy','Dev Malhotra','Sara Khan','Rohan Das','Tara Nair','Vikram Joshi','Leela Menon','Aditya Bose','Priya Kapoor','Neel Verma','Zoya Mirza','Ira Kulkarni','Samar Sethi','Farah Ali','Kunal Bhat','Rhea Anand','Manav Rao','Diya Sen','Omar Sheikh'];
  const orderStatuses = ['COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','READY','PROCESSING','CONFIRMED','PENDING','READY','PROCESSING','CONFIRMED','PENDING','CANCELLED','COMPLETED','READY','CONFIRMED'];
  for (let index = 0; index < orderStatuses.length; index += 1) {
    const orderNumber = `ORD-2026-${String(1100 + index)}`;
    const existingOrder = await prisma.order.findUnique({ where: { orderNumber } });
    const status = orderStatuses[index];
    const selected = [inventoryItems[index % inventoryItems.length], inventoryItems[(index * 3 + 2) % inventoryItems.length]];
    const quantities = [1 + (index % 3), 1 + (index % 2)];
    const lines = selected.map((item, lineIndex) => ({ inventoryItemId: item.id, quantity: quantities[lineIndex], unitPrice: Number(item.sellingPrice || item.costPerUnit || 100), totalPrice: quantities[lineIndex] * Number(item.sellingPrice || item.costPerUnit || 100) }));
    const subtotal = lines.reduce((sum, line) => sum + line.totalPrice, 0);
    const tax = Math.round(subtotal * .05);
    const customerName = guestNames[index];
    const customerEmail = `customer${String(index + 1).padStart(2, '0')}@example.test`;
    const createdAt = new Date(Date.now() - (index * 19 + 2) * 3600000);
    if (existingOrder) {
      await prisma.order.update({ where: { id: existingOrder.id }, data: { customerName, customerEmail, notes: ['Dine-in · table 4','Takeaway','Family table','Online order','Dine-in · table 2','Pickup at counter'][index % 6], createdAt } });
      if (existingOrder.saleId) await prisma.sale.update({ where: { id: existingOrder.saleId }, data: { customerName, customerEmail, createdAt } });
      continue;
    }
    await prisma.$transaction(async (tx) => {
      let saleId;
      if (status === 'COMPLETED') {
        const sale = await tx.sale.create({ data: {
          saleNumber: `SAL-2026-${String(1100 + index)}`, customerName, customerEmail, status: 'COMPLETED',
          paymentStatus: index % 5 === 0 ? 'PARTIAL' : 'PAID', subtotal, discount: 0, tax, totalAmount: subtotal + tax, userId: user.id, createdAt,
          items: { create: lines },
        } });
        saleId = sale.id;
      }
      await tx.order.create({ data: {
        orderNumber, customerName, customerEmail, status, subtotal, discount: 0, tax, totalAmount: subtotal + tax,
        notes: ['Dine-in · table 4','Takeaway','Family table','Online order','Dine-in · table 2','Pickup at counter'][index % 6], saleId, userId: user.id, createdAt,
        items: { create: lines },
      } });
    });
  }
  console.log('Restaurant walkthrough data is ready (or already present).');
}

seed().catch((error) => { console.error('Demo seed failed:', error.message); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
