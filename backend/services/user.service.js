import { User } from '../models/User.js';
import { UserSettings } from '../models/UserSettings.js';
import { AppError } from '../utils/app-error.js';

export class UserService {
  async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const settings = await UserSettings.findOne({ userId });
    return { user, settings };
  }

  async updateUserSettings(userId, updateData) {
    let settings = await UserSettings.findOne({ userId });
    if (!settings) {
      settings = await UserSettings.create({ userId, ...updateData });
    } else {
      Object.assign(settings, updateData);
      await settings.save();
    }
    return settings;
  }
}

export const userService = new UserService();
