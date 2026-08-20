import { AppError } from "../utils/app-error.js";

// In-memory protection is sufficient for the single local Express process. Use a
// shared store (for example Redis) if this application is deployed on multiple instances.
export const createRateLimiter = ({ windowMs, maxRequests }) => {
  const requests = new Map();

  return (req, _res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.baseUrl}`;
    const entry = requests.get(key);

    if (!entry || entry.resetAt <= now) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > maxRequests) {
      return next(new AppError("Too many requests. Please try again later.", 429));
    }

    return next();
  };
};
