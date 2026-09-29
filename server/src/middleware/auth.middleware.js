import { AppError } from "../utils/app-error.js";
import { verifyToken } from "../utils/jwt.js";

const readCookie = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const prefix = `${name}=`;
  const value = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : null;
};

export const authenticate = (req, _res, next) => {
  try {
    const authorization = req.headers.authorization;
    const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
    // Prefer the explicit API credential. This keeps legacy/stale cookies from
    // overriding a valid Authorization: Bearer token.
    const token = bearerToken || readCookie(req.headers.cookie, "astraeon_session");

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
