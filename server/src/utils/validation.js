import { AppError } from "./app-error.js";

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");

const ensureEmail = (email) => {
  // Deliberately simple validation; the database remains the final uniqueness authority.
  const [localPart, domain = ""] = email.split("@");
  if (!localPart || !domain || domain.split(".").some((part) => part.length === 0) || !domain.includes(".")) {
    throw new AppError("Provide a valid email address.", 400);
  }
};

const ensurePassword = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    throw new AppError("Password must be at least 8 characters long.", 400);
  }

  if (password.length > 128) {
    throw new AppError("Password must not exceed 128 characters.", 400);
  }
};

export const validateRegisterInput = (body) => {
  if (!isPlainObject(body)) {
    throw new AppError("Request body must be a JSON object.", 400);
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = normalizeEmail(body.email);

  if (fullName.length < 2 || fullName.length > 100) {
    throw new AppError("Full name must be between 2 and 100 characters.", 400);
  }

  ensureEmail(email);
  ensurePassword(body.password);
  return { fullName, email, password: body.password };
};

export const validateLoginInput = (body) => {
  if (!isPlainObject(body)) {
    throw new AppError("Request body must be a JSON object.", 400);
  }

  const email = normalizeEmail(body.email);
  ensureEmail(email);

  if (typeof body.password !== "string" || body.password.length === 0) {
    throw new AppError("Password is required.", 400);
  }

  return { email, password: body.password };
};

export const validateOtpInput = (body) => {
  if (!isPlainObject(body)) throw new AppError("Request body must be a JSON object.", 400);
  const email = normalizeEmail(body.email);
  ensureEmail(email);
  if (!/^\d{6}$/.test(body.otp)) throw new AppError("OTP must be a 6-digit code.", 400);
  return { email, otp: body.otp };
};

export const validateForgotPasswordInput = (body) => {
  if (!isPlainObject(body)) throw new AppError("Request body must be a JSON object.", 400);
  const email = normalizeEmail(body.email);
  ensureEmail(email);
  return { email };
};

export const validateResetPasswordInput = (body) => {
  const { email, otp } = validateOtpInput(body);
  ensurePassword(body.password);
  return { email, otp, password: body.password };
};
