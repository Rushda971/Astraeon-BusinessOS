import { AppError } from '../utils/app-error.js';

const roleRanks = { OWNER: 4, MANAGER: 3, STAFF: 2 };

export const authorizeInventoryRead = (req, _res, next) => {
  const role = req.user?.role;
  if (!role || !roleRanks[role]) {
    return next(new AppError('Forbidden: inventory access is restricted.', 403));
  }
  return next();
};

export const authorizeInventoryWrite = (req, _res, next) => {
  const role = req.user?.role;
  if (!role || roleRanks[role] < roleRanks.MANAGER) {
    return next(new AppError('Forbidden: you do not have permission to modify inventory.', 403));
  }
  return next();
};
