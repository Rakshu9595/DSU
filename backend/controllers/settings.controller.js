import { userService } from '../services/user.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

export const getSettings = asyncHandler(async (req, res) => {
  const { settings } = await userService.getUserProfile(req.user._id);
  return ApiResponse.success(res, settings, 'Settings fetched');
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await userService.updateUserSettings(req.user._id, req.body);
  return ApiResponse.success(res, settings, 'Settings updated successfully');
});
