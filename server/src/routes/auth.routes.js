import { Router } from "express";

import {
  forgotPassword,
  getProfile,
  login,
  logout,
  register,
  resendOtp,
  resetPassword,
  verifyOtp,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/profile", authenticate, getProfile);
router.post("/logout", authenticate, logout);

export default router;
