import bcrypt from "bcrypt";

import prisma from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { buildOtpEmail } from "../utils/auth-email.js";
import { generateToken } from "../utils/jwt.js";
import { sendAuthEmail } from "../utils/mail.js";
import { OTP_COOLDOWN_MS, OTP_TTL_MS, generateOtp, hashOtp, otpMatches } from "../utils/otp.js";
import {
  validateForgotPasswordInput,
  validateLoginInput,
  validateOtpInput,
  validateRegisterInput,
  validateResetPasswordInput,
} from "../utils/validation.js";

const PASSWORD_SALT_ROUNDS = 12;

// Shared selection guarantees password hashes never leave the server.
const publicUserFields = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

const issueOtp = async (user, purpose) => {
  const otp = generateOtp();
  const now = new Date();
  const data = purpose === "verification"
    ? { verificationOtpHash: hashOtp(otp), verificationOtpExpiresAt: new Date(now.getTime() + OTP_TTL_MS), verificationOtpSentAt: now }
    : { resetOtpHash: hashOtp(otp), resetOtpExpiresAt: new Date(now.getTime() + OTP_TTL_MS), resetOtpSentAt: now };

  await prisma.user.update({ where: { id: user.id }, data });
  await sendAuthEmail({ to: user.email, ...buildOtpEmail(otp, purpose) });
};

const ensureCooldown = (sentAt) => {
  if (sentAt && Date.now() - sentAt.getTime() < OTP_COOLDOWN_MS) {
    throw new AppError("Please wait before requesting another OTP.", 429);
  }
};

export const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = validateRegisterInput(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError("An account with this email already exists.", 409);
    }

    const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { fullName, email, password: hashedPassword },
      select: publicUserFields,
    });

    try {
      await issueOtp(user, "verification");
    } catch (error) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
      throw error;
    }
    return res.status(201).json({
      success: true,
      message: "Registration successful. OTP sent successfully.",
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = validateLoginInput(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && !user.emailVerified) {
      throw new AppError("Email is not verified.", 403);
    }

    // Use the same response for an unknown email and incorrect password.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError("Invalid email or password.", 401);
    }

    const token = generateToken(user);
    const safeUser = { ...user };
    delete safeUser.password;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: { user: safeUser, token },
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = validateOtpInput(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified || !user.verificationOtpHash) throw new AppError("Invalid OTP.", 400);
    if (!user.verificationOtpExpiresAt || user.verificationOtpExpiresAt <= new Date()) throw new AppError("OTP expired.", 400);
    if (!otpMatches(otp, user.verificationOtpHash)) throw new AppError("Invalid OTP.", 400);

    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationOtpHash: null, verificationOtpExpiresAt: null, verificationOtpSentAt: null },
      select: publicUserFields,
    });
    return res.status(200).json({ success: true, message: "Email verified successfully.", data: { user: verifiedUser } });
  } catch (error) { return next(error); }
};

export const resendOtp = async (req, res, next) => {
  try {
    const { email } = validateForgotPasswordInput(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) return res.status(202).json({ success: true, message: "If an account exists and needs verification, an OTP has been sent." });
    ensureCooldown(user.verificationOtpSentAt);
    await issueOtp(user, "verification");
    return res.status(200).json({ success: true, message: "OTP sent successfully." });
  } catch (error) { return next(error); }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = validateForgotPasswordInput(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      ensureCooldown(user.resetOtpSentAt);
      await issueOtp(user, "reset");
    }
    return res.status(202).json({ success: true, message: "If an account exists, a password reset OTP has been sent." });
  } catch (error) { return next(error); }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = validateResetPasswordInput(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.resetOtpHash) throw new AppError("Invalid OTP.", 400);
    if (!user.resetOtpExpiresAt || user.resetOtpExpiresAt <= new Date()) throw new AppError("OTP expired.", 400);
    if (!otpMatches(otp, user.resetOtpHash)) throw new AppError("Invalid OTP.", 400);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(password, PASSWORD_SALT_ROUNDS), resetOtpHash: null, resetOtpExpiresAt: null, resetOtpSentAt: null },
    });
    return res.status(200).json({ success: true, message: "Password reset successful." });
  } catch (error) { return next(error); }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: publicUserFields,
    });

    if (!user) {
      throw new AppError("User no longer exists.", 404);
    }

    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Logout successful. Remove the token from the client.",
    });
  } catch (error) {
    return next(error);
  }
};
