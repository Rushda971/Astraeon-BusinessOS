import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeInventoryRead, authorizeInventoryWrite } from '../middleware/authorizeInventory.middleware.js';
import { cancelOrder, createOrder, getOrder, getOrders, getOrdersSummary, updateOrder, updateOrderStatus } from '../controllers/orders.controller.js';

const router = Router();
router.use(authenticate, authorizeInventoryRead);
router.get('/summary', getOrdersSummary);
router.get('/', getOrders);
router.post('/', authorizeInventoryWrite, createOrder);
router.get('/:id', getOrder);
router.patch('/:id', authorizeInventoryWrite, updateOrder);
router.patch('/:id/status', authorizeInventoryWrite, updateOrderStatus);
router.post('/:id/cancel', authorizeInventoryWrite, cancelOrder);
export default router;
