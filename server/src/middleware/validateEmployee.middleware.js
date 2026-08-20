import { AppError } from "../utils/app-error.js";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;
const STATUSES = new Set(["ACTIVE", "INACTIVE"]);

const asText = (value) => (typeof value === "string" ? value.trim() : "");

const fail = (message) => {
  throw new AppError(message, 400);
};

const parseEmployee = (body, partial) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    fail("Request body must be a JSON object.");
  }

  const data = {};
  const fields = ["name", "email", "phone", "role", "salary", "joiningDate", "status"];
  if (partial && !fields.some((field) => Object.hasOwn(body, field))) {
    fail("Provide at least one employee field to update.");
  }

  if (!partial || Object.hasOwn(body, "name")) {
    const name = asText(body.name);
    if (name.length < 2 || name.length > 100) fail("Name must be between 2 and 100 characters.");
    data.name = name;
  }

  if (!partial || Object.hasOwn(body, "email")) {
    const email = asText(body.email).toLowerCase();
    if (!EMAIL_PATTERN.test(email)) fail("Provide a valid email address.");
    data.email = email;
  }

  if (!partial || Object.hasOwn(body, "phone")) {
    const phone = asText(body.phone);
    if (!PHONE_PATTERN.test(phone)) fail("Provide a valid phone number.");
    data.phone = phone;
  }

  if (!partial || Object.hasOwn(body, "role")) {
    const role = asText(body.role);
    if (role.length < 2 || role.length > 60) fail("Role must be between 2 and 60 characters.");
    data.role = role;
  }

  if (!partial || Object.hasOwn(body, "salary")) {
    const salary = Number(body.salary);
    if (!Number.isFinite(salary) || salary <= 0) fail("Salary must be a positive number.");
    data.salary = salary;
  }

  if (!partial || Object.hasOwn(body, "joiningDate")) {
    const date = asText(body.joiningDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00.000Z`))) {
      fail("Provide a valid joining date.");
    }
    data.joiningDate = new Date(`${date}T00:00:00.000Z`);
  }

  if (!partial || Object.hasOwn(body, "status")) {
    const status = asText(body.status).toUpperCase();
    if (!STATUSES.has(status)) fail("Status must be ACTIVE or INACTIVE.");
    data.status = status;
  }

  return data;
};

export const validateCreateEmployee = (req, _res, next) => {
  try {
    req.employeeData = parseEmployee(req.body, false);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateEmployee = (req, _res, next) => {
  try {
    req.employeeData = parseEmployee(req.body, true);
    next();
  } catch (error) {
    next(error);
  }
};
