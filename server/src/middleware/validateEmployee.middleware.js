import { AppError } from '../utils/app-error.js';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;
const STATUSES = new Set(['ACTIVE', 'INACTIVE', 'ON_LEAVE']);
const EMPLOYMENT_TYPES = new Set(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']);
const asText = (value) => (typeof value === 'string' ? value.trim() : '');
const fail = (message) => { throw new AppError(message, 400); };
const has = (body, key) => Object.hasOwn(body, key);

const textField = (body, data, key, label, { min = 1, max = 150, required = true } = {}) => {
  const value = asText(body[key]);
  if (required && value.length < min) fail(`${label} is required.`);
  if (value && (value.length < min || value.length > max)) fail(`${label} must be between ${min} and ${max} characters.`);
  data[key] = value || null;
};
const dateField = (body, data, key, label, required = false) => {
  const value = asText(body[key]);
  if (!value && required) fail(`${label} is required.`);
  if (!value) { data[key] = null; return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))) fail(`Provide a valid ${label.toLowerCase()}.`);
  data[key] = new Date(`${value}T00:00:00.000Z`);
};

const parseEmployee = (body, partial) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Request body must be a JSON object.');
  const data = {};
  const fields = ['employeeCode', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'address', 'department', 'designation', 'employmentType', 'joiningDate', 'salary', 'status', 'profileImage', 'emergencyContactName', 'emergencyContactRelation', 'emergencyContactPhone'];
  if (partial && !fields.some((field) => has(body, field))) fail('Provide at least one employee field to update.');
  if (!partial || has(body, 'employeeCode')) { const code = asText(body.employeeCode).toUpperCase(); if (!/^[A-Z0-9-]{3,30}$/.test(code)) fail('Employee ID must use 3 to 30 letters, numbers, or hyphens.'); data.employeeCode = code; }
  if (!partial || has(body, 'firstName')) textField(body, data, 'firstName', 'First name', { min: 2, max: 60 });
  if (!partial || has(body, 'lastName')) textField(body, data, 'lastName', 'Last name', { min: 1, max: 60 });
  if (!partial || has(body, 'email')) { const email = asText(body.email).toLowerCase(); if (!EMAIL_PATTERN.test(email)) fail('Provide a valid email address.'); data.email = email; }
  if (!partial || has(body, 'phone')) { const phone = asText(body.phone); if (!PHONE_PATTERN.test(phone)) fail('Provide a valid phone number.'); data.phone = phone; }
  if (!partial || has(body, 'dateOfBirth')) dateField(body, data, 'dateOfBirth', 'Date of birth');
  if (!partial || has(body, 'address')) textField(body, data, 'address', 'Address', { min: 2, max: 300, required: false });
  if (!partial || has(body, 'department')) textField(body, data, 'department', 'Department', { min: 2, max: 80 });
  if (!partial || has(body, 'designation')) textField(body, data, 'designation', 'Designation', { min: 2, max: 100 });
  if (!partial || has(body, 'employmentType')) { const type = asText(body.employmentType).toUpperCase(); if (!EMPLOYMENT_TYPES.has(type)) fail('Employment type must be FULL_TIME, PART_TIME, CONTRACT, or INTERN.'); data.employmentType = type; }
  if (!partial || has(body, 'joiningDate')) dateField(body, data, 'joiningDate', 'Joining date', true);
  if (!partial || has(body, 'salary')) { const salary = Number(body.salary); if (!Number.isFinite(salary) || salary < 0) fail('Salary must be a valid non-negative number.'); data.salary = salary; }
  if (!partial || has(body, 'status')) { const status = asText(body.status).toUpperCase(); if (!STATUSES.has(status)) fail('Status must be ACTIVE, INACTIVE, or ON_LEAVE.'); data.status = status; }
  if (!partial || has(body, 'profileImage')) { const image = asText(body.profileImage); if (image && image.length > 500) fail('Profile image URL must not exceed 500 characters.'); data.profileImage = image || null; }
  if (!partial || has(body, 'emergencyContactName')) textField(body, data, 'emergencyContactName', 'Emergency contact name', { min: 2, max: 100, required: false });
  if (!partial || has(body, 'emergencyContactRelation')) textField(body, data, 'emergencyContactRelation', 'Emergency contact relationship', { min: 2, max: 60, required: false });
  if (!partial || has(body, 'emergencyContactPhone')) { const phone = asText(body.emergencyContactPhone); if (phone && !PHONE_PATTERN.test(phone)) fail('Provide a valid emergency contact phone number.'); data.emergencyContactPhone = phone || null; }
  return data;
};

export const validateCreateEmployee = (req, _res, next) => { try { req.employeeData = parseEmployee(req.body, false); next(); } catch (error) { next(error); } };
export const validateUpdateEmployee = (req, _res, next) => { try { req.employeeData = parseEmployee(req.body, true); next(); } catch (error) { next(error); } };
export const validateEmployeeStatus = (req, _res, next) => { try { req.employeeData = parseEmployee({ status: req.body?.status }, true); next(); } catch (error) { next(error); } };
