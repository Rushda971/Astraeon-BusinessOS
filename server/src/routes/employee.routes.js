import { Router } from 'express';
import { createEmployee, deleteEmployee, getEmployee, getEmployees, getEmployeeSummary, updateEmployee, updateEmployeeStatus } from '../controllers/employee.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeInventoryRead, authorizeInventoryWrite } from '../middleware/authorizeInventory.middleware.js';
import { validateCreateEmployee, validateEmployeeStatus, validateUpdateEmployee } from '../middleware/validateEmployee.middleware.js';

const router = Router();
router.use(authenticate, authorizeInventoryRead);
router.get('/summary', getEmployeeSummary);
router.route('/').get(getEmployees).post(authorizeInventoryWrite, validateCreateEmployee, createEmployee);
router.route('/:id').get(getEmployee).put(authorizeInventoryWrite, validateUpdateEmployee, updateEmployee).delete(authorizeInventoryWrite, deleteEmployee);
router.patch('/:id/status', authorizeInventoryWrite, validateEmployeeStatus, updateEmployeeStatus);
export default router;
