import { AppError } from '../utils/app-error.js';

export function notFound(req, res, next) {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl} - Not Found`, 404));
}
