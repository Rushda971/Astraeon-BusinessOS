import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeInventoryRead, authorizeInventoryWrite } from '../middleware/authorizeInventory.middleware.js';
import { createCategory, createProduct, deleteCategory, deleteProduct, getCategories, getMenuSummary, getProduct, getProducts, updateAvailability, updateCategory, updateProduct } from '../controllers/menu.controller.js';
const router = Router(); router.use(authenticate, authorizeInventoryRead);
router.get('/summary', getMenuSummary); router.get('/categories', getCategories); router.post('/categories', authorizeInventoryWrite, createCategory); router.patch('/categories/:id', authorizeInventoryWrite, updateCategory); router.delete('/categories/:id', authorizeInventoryWrite, deleteCategory);
router.get('/products', getProducts); router.post('/products', authorizeInventoryWrite, createProduct); router.get('/products/:id', getProduct); router.patch('/products/:id', authorizeInventoryWrite, updateProduct); router.patch('/products/:id/availability', authorizeInventoryWrite, updateAvailability); router.delete('/products/:id', authorizeInventoryWrite, deleteProduct);
export default router;
