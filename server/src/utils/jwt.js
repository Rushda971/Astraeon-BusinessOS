import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return process.env.JWT_SECRET;
};

// Sign only the claims needed to identify and authorize the authenticated user.
export const generateToken = (user) => jwt.sign(
  { sub: user.id, email: user.email, role: user.role },
  getJwtSecret(),
  { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
);

export const verifyToken = (token) => jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] });
