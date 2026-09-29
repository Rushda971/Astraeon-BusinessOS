import { Router } from 'express';

import {
  adjustInventoryItem,
  createInventoryItem,
  createInventoryCategory,
  createSupplier,
  deleteInventoryItem,
  getInventory,
  getInventoryCategories,
  getInventoryItem,
  getInventoryLowStock,
  getInventoryMovements,
  getInventoryReorderSuggestions,
  getInventorySummary,
  getSuppliers,
  stockInInventoryItem,
  stockOutInventoryItem,
  updateInventoryItem,
  wasteInventoryItem,
} from '../controllers/inventory.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeInventoryRead, authorizeInventoryWrite } from '../middleware/authorizeInventory.middleware.js';

const router = Router();

router.use(authenticate);
router.use(authorizeInventoryRead);

router.get('/categories', getInventoryCategories);
router.post('/categories', authorizeInventoryWrite, createInventoryCategory);
router.get('/suppliers', getSuppliers);
router.post('/suppliers', authorizeInventoryWrite, createSupplier);
router.get('/movements', getInventoryMovements);
router.get('/low-stock', getInventoryLowStock);
router.get('/summary', getInventorySummary);
router.get('/reorder-suggestions', getInventoryReorderSuggestions);
router.route('/').get(getInventory).post(authorizeInventoryWrite, createInventoryItem);
router.route('/:id').get(getInventoryItem).patch(authorizeInventoryWrite, updateInventoryItem).delete(authorizeInventoryWrite, deleteInventoryItem);
router.post('/:id/stock-in', authorizeInventoryWrite, stockInInventoryItem);
router.post('/:id/stock-out', authorizeInventoryWrite, stockOutInventoryItem);
router.post('/:id/adjust', authorizeInventoryWrite, adjustInventoryItem);
router.post('/:id/waste', authorizeInventoryWrite, wasteInventoryItem);

export default router;
