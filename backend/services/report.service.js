import { Report } from '../models/Report.js';
import { Project } from '../models/Project.js';
import { Device } from '../models/Device.js';
import { EnergyScenario } from '../models/EnergyScenario.js';
import { energyEstimationService } from './energy-estimation.service.js';
import { recommendationService } from './recommendation.service.js';
import { pdfGeneratorService } from './pdf-generator.service.js';
import { csvGeneratorService } from './csv-generator.service.js';
import { generateId } from '../utils/id-generator.js';
import { AppError } from '../utils/app-error.js';

export class ReportService {
  /**
   * Generates a new PDF or CSV report for a project
   */
  async generateProjectReport(projectId, userId, reportType = 'pdf') {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);

    const devices = await Device.find({ projectId, isActive: true });
    const energyEstimate = await energyEstimationService.getProjectEnergyEstimate(projectId);
    const recommendations = await recommendationService.getProjectRecommendations(projectId);
    const scenarios = await EnergyScenario.find({ projectId });

    const reportData = {
      project,
      devices,
      energyEstimate,
      recommendations,
      scenarios
    };

    const sanitizedProjectName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const filename = `VisionTwin_${sanitizedProjectName}_${timestamp}.${reportType}`;

    let result;
    if (reportType === 'pdf') {
      result = await pdfGeneratorService.generateReport(reportData, filename);
    } else if (reportType === 'csv') {
      result = await csvGeneratorService.generateReport(reportData, filename);
    } else {
      throw new AppError(`Unsupported report type: ${reportType}`, 400);
    }

    const reportDoc = await Report.create({
      projectId,
      userId,
      reportType,
      title: `${project.name} - Energy Optimization Audit (${reportType.toUpperCase()})`,
      filename,
      filePath: result.filePath,
      snapshot: {
        totalMonthlyKwh: energyEstimate.totalMonthlyEnergyKwh,
        totalMonthlyCost: energyEstimate.totalMonthlyCost,
        totalCarbonKg: energyEstimate.totalCarbonEmissionsKg,
        appliancesCount: devices.filter((d) => !d.isFitting).length
      }
    });

    return reportDoc;
  }

  /**
   * Lists generated reports for a project
   */
  async getReports(projectId) {
    return Report.find({ projectId }).sort({ createdAt: -1 });
  }

  /**
   * Gets a specific report
   */
  async getReportById(reportId) {
    const report = await Report.findById(reportId);
    if (!report) throw new AppError('Report not found', 404);
    return report;
  }
}

export const reportService = new ReportService();
