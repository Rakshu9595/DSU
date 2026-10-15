import { deviceService } from '../services/device.service.js';
import { Project } from '../models/Project.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

/**
 * PATCH /api/devices/:deviceId/power-rating
 * Primary manual power rating update endpoint
 */
export const updatePowerRating = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const ratingData = req.body;

  // Verify device exists and check project ownership
  const device = await deviceService.getDeviceById(deviceId);
  const project = await Project.findById(device.projectId);
  if (!project) {
    throw new AppError('Associated project not found', 404);
  }

  // Verify user owns this project or is admin
  if (project.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have permission to modify devices in this project', 403);
  }

  const result = await deviceService.updatePowerRating(deviceId, ratingData, req.user._id);

  return ApiResponse.success(
    res,
    result,
    'Electrical power rating saved successfully and energy metrics recalculated.'
  );
});

/**
 * POST /api/devices/:deviceId/power-rating/reset
 * Resets an appliance's power rating back to baseline reference estimate
 */
export const resetPowerRating = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const device = await deviceService.getDeviceById(deviceId);
  const project = await Project.findById(device.projectId);
  if (!project) throw new AppError('Associated project not found', 404);

  if (project.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Unauthorized', 403);
  }

  const result = await deviceService.resetPowerRating(deviceId, req.user._id);
  return ApiResponse.success(res, result, 'Power rating reset to reference estimate.');
});

/**
 * GET /api/devices/project/:projectId
 */
export const getProjectDevices = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  if (project.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Unauthorized', 403);
  }

  const devices = await deviceService.getDevices(projectId, req.query);
  return ApiResponse.success(res, devices, 'Devices fetched successfully');
});

/**
 * GET /api/devices?projectId=...
 */
export const getDevices = asyncHandler(async (req, res) => {
  const projectId = req.query.projectId;
  if (!projectId) {
    throw new AppError('projectId query parameter is required', 400);
  }
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  if (project.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Unauthorized', 403);
  }

  const devices = await deviceService.getDevices(projectId, req.query);
  return ApiResponse.success(res, devices, 'Devices fetched successfully');
});

/**
 * GET /api/devices/:deviceId
 */
export const getDeviceById = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const device = await deviceService.getDeviceById(deviceId);
  return ApiResponse.success(res, device, 'Device details fetched');
});

/**
 * POST /api/devices
 * Manual device addition
 */
export const createDevice = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.body.projectId);
  if (!project) throw new AppError('Project not found', 404);

  if (project.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Unauthorized', 403);
  }

  const device = await deviceService.createManualDevice(req.body, req.user._id);
  return ApiResponse.created(res, device, 'Device added successfully');
});

/**
 * PUT /api/devices/:deviceId
 */
export const updateDevice = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const device = await deviceService.getDeviceById(deviceId);
  const project = await Project.findById(device.projectId);

  if (project.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Unauthorized', 403);
  }

  const updated = await deviceService.updateDevice(deviceId, req.body, req.user._id);
  return ApiResponse.success(res, updated, 'Device updated successfully');
});

/**
 * DELETE /api/devices/:deviceId
 */
export const deleteDevice = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const device = await deviceService.getDeviceById(deviceId);
  const project = await Project.findById(device.projectId);

  if (project.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Unauthorized', 403);
  }

  const result = await deviceService.deleteDevice(deviceId);
  return ApiResponse.success(res, result, 'Device deleted successfully');
});
