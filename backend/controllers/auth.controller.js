import { authService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body, req);
  return ApiResponse.created(res, { user }, 'Registration successful');
});

export const login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body, req);
  return ApiResponse.success(res, { user }, 'Login successful');
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req);
  return ApiResponse.success(res, null, 'Logged out successfully');
});

export const getMe = asyncHandler(async (req, res) => {
  const data = await authService.getCurrentUser(req.user._id);
  return ApiResponse.success(res, data, 'User profile fetched');
});
