import { Router } from "express";

import {
  getProfile,
  login,
  logout,
  register,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticate, getProfile);
router.post("/logout", authenticate, logout);

export default router;
