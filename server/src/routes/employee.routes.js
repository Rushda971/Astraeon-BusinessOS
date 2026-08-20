import { Router } from "express";

import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  getEmployees,
  updateEmployee,
} from "../controllers/employee.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateCreateEmployee, validateUpdateEmployee } from "../middleware/validateEmployee.middleware.js";

const router = Router();

router.use(authenticate);
router.route("/").get(getEmployees).post(validateCreateEmployee, createEmployee);
router.route("/:id").get(getEmployee).put(validateUpdateEmployee, updateEmployee).delete(deleteEmployee);

export default router;
