import bcrypt from "bcrypt";

import prisma from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { generateToken } from "../utils/jwt.js";
import { validateLoginInput, validateRegisterInput } from "../utils/validation.js";

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

    const token = generateToken(user);
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: { user, token },
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = validateLoginInput(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    // Use the same response for an unknown email and incorrect password.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError("Invalid email or password.", 401);
    }

    const token = generateToken(user);
    const { password: _password, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: { user: safeUser, token },
    });
  } catch (error) {
    return next(error);
  }
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
