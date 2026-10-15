import { userService } from '../services/user.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getUserProfile(req.user._id);
  return ApiResponse.success(res, profile, 'User profile fetched');
});
