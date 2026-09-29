import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeInventoryRead, authorizeInventoryWrite } from '../middleware/authorizeInventory.middleware.js';
import { createSale, getSale, getSales, getSalesSummary, updateSaleStatus } from '../controllers/sales.controller.js';

const router = Router();
router.use(authenticate, authorizeInventoryRead);
router.get('/summary', getSalesSummary);
router.get('/', getSales);
router.post('/', authorizeInventoryWrite, createSale);
router.get('/:id', getSale);
router.patch('/:id/status', authorizeInventoryWrite, updateSaleStatus);
export default router;
