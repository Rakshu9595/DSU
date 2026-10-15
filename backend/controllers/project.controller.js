import { projectService } from '../services/project.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body, req.user._id);
  return ApiResponse.created(res, project, 'Project created successfully');
});

export const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjectsByUser(req.user._id);
  return ApiResponse.success(res, projects, 'Projects fetched');
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.projectId, req.user._id);
  return ApiResponse.success(res, project, 'Project details fetched');
});

export const updateProject = asyncHandler(async (req, res) => {
  const updated = await projectService.updateProject(req.params.projectId, req.body, req.user._id);
  return ApiResponse.success(res, updated, 'Project updated successfully');
});

export const deleteProject = asyncHandler(async (req, res) => {
  const result = await projectService.deleteProject(req.params.projectId, req.user._id);
  return ApiResponse.success(res, result, 'Project deleted successfully');
});
