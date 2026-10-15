import { AppError } from '../utils/app-error.js';

export function validateRequest({ body, query, params }) {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }
      if (query) {
        req.query = query.parse(req.query);
      }
      if (params) {
        req.params = params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err.errors) {
        const errorDetails = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return next(
          new AppError(
            `Validation error: ${errorDetails.map((d) => `${d.field}: ${d.message}`).join(', ')}`,
            400,
            errorDetails
          )
        );
      }
      next(new AppError(err.message, 400));
    }
  };
}
