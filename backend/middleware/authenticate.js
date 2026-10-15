import { AppError } from '../utils/app-error.js';
import { User } from '../models/User.js';

export async function authenticate(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return next(new AppError('User session is invalid. Please log in again.', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function optionalAuthenticate(req, res, next) {
  if (req.session && req.session.userId) {
    User.findById(req.session.userId)
      .then((user) => {
        if (user) req.user = user;
        next();
      })
      .catch(() => next());
  } else {
    next();
  }
}
