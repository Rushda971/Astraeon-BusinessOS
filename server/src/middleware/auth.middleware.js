import { AppError } from "../utils/app-error.js";
import { verifyToken } from "../utils/jwt.js";

export const authenticate = (req, _res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new AppError("Authentication token is required.", 401);
    }

    const token = authorization.slice(7).trim();
    if (!token) {
      throw new AppError("Authentication token is required.", 401);
    }

    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid or expired authentication token.", 401));
    }

    return next(error);
  }
};
