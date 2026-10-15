import { User } from '../models/User.js';
import { UserSettings } from '../models/UserSettings.js';
import { AppError } from '../utils/app-error.js';

export class AuthService {
  async register({ name, email, password }, req) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const user = await User.create({ name, email, password });

    // Create default settings for user
    await UserSettings.create({ userId: user._id });

    // Establish session
    if (req.session) {
      req.session.userId = user._id;
    }

    const safeUser = user.toObject();
    delete safeUser.password;
    return safeUser;
  }

  async login({ email, password }, req) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Establish session
    if (req.session) {
      req.session.userId = user._id;
    }

    const safeUser = user.toObject();
    delete safeUser.password;
    return safeUser;
  }

  async logout(req) {
    return new Promise((resolve, reject) => {
      if (!req.session) return resolve();
      req.session.destroy((err) => {
        if (err) return reject(new AppError('Failed to logout cleanly', 500));
        resolve();
      });
    });
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const settings = await UserSettings.findOne({ userId });
    return {
      user,
      settings
    };
  }
}

export const authService = new AuthService();
