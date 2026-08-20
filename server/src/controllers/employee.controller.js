import prisma from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { sendSuccess } from "../utils/response.js";

const parseId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new AppError("Employee id must be a positive integer.", 400);
  return id;
};

const ensureEmployee = async (id) => {
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) throw new AppError("Employee not found.", 404);
  return employee;
};

export const createEmployee = async (req, res, next) => {
  try {
    const employee = await prisma.employee.create({ data: req.employeeData });
    return sendSuccess(res, 201, "Employee created successfully.", { employee });
  } catch (error) {
    return next(error);
  }
};

export const getEmployees = async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search.length > 100) throw new AppError("Search must not exceed 100 characters.", 400);
    const where = search ? {
      OR: ["name", "email", "role"].map((field) => ({ [field]: { contains: search } })),
    } : undefined;
    const employees = await prisma.employee.findMany({ where, orderBy: { createdAt: "desc" } });
    return sendSuccess(res, 200, "Employees retrieved successfully.", { employees });
  } catch (error) {
    return next(error);
  }
};

export const getEmployee = async (req, res, next) => {
  try {
    const employee = await ensureEmployee(parseId(req.params.id));
    return sendSuccess(res, 200, "Employee retrieved successfully.", { employee });
  } catch (error) {
    return next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    await ensureEmployee(id);
    const employee = await prisma.employee.update({ where: { id }, data: req.employeeData });
    return sendSuccess(res, 200, "Employee updated successfully.", { employee });
  } catch (error) {
    return next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    await ensureEmployee(id);
    await prisma.employee.delete({ where: { id } });
    return sendSuccess(res, 200, "Employee deleted successfully.");
  } catch (error) {
    return next(error);
  }
};
