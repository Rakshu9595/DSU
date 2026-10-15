import fs from 'fs';
import { reportService } from '../services/report.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

export const generateReport = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { reportType } = req.body; // 'pdf' or 'csv'
  const report = await reportService.generateProjectReport(projectId, req.user._id, reportType || 'pdf');
  return ApiResponse.created(res, report, 'Report generated successfully');
});

export const getProjectReports = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const reports = await reportService.getReports(projectId);
  return ApiResponse.success(res, reports, 'Reports fetched');
});

export const downloadReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const report = await reportService.getReportById(reportId);

  if (!fs.existsSync(report.filePath)) {
    throw new AppError('Report file not found on disk', 404);
  }

  res.download(report.filePath, report.filename);
});
