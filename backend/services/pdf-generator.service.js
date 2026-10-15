import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';

export class PdfGeneratorService {
  /**
   * Generates a comprehensive VisionTwin Energy Audit and Optimization PDF report
   */
  async generateReport(reportData, filename) {
    const filePath = path.join(env.REPORT_DIR, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `VisionTwin Energy Audit - ${reportData.project.name}`,
          Author: 'VisionTwin AI Platform'
        }
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Colors
      const primaryColor = '#0f766e';
      const secondaryColor = '#0369a1';
      const darkColor = '#1e293b';
      const grayColor = '#64748b';
      const lightBg = '#f8fafc';

      // Header Banner
      doc
        .rect(50, 45, 495, 60)
        .fill(primaryColor);

      doc
        .fillColor('#ffffff')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('VisionTwin', 65, 55);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('AI-Powered Computer Vision Energy Optimization Report', 65, 82);

      doc
        .fontSize(8)
        .text(`Generated: ${new Date().toLocaleString()}`, 350, 82, { align: 'right', width: 180 });

      doc.moveDown(3);

      // Project Overview Section
      doc
        .fillColor(darkColor)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('1. Project Overview & Context');

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor(grayColor)
        .text(`Project Name: ${reportData.project.name}`)
        .text(`Room Type: ${reportData.project.roomType} | Dimensions: ${reportData.project.roomDimensions?.length}m x ${reportData.project.roomDimensions?.width}m x ${reportData.project.roomDimensions?.height}m`)
        .text(`Electricity Tariff: ₹${reportData.project.electricityTariff}/kWh | Grid Emission Factor: ${reportData.project.emissionFactor} kg CO2e/kWh`);

      doc.moveDown(1);

      // Energy Metrics Summary Card
      doc
        .rect(50, doc.y, 495, 65)
        .fill(lightBg);

      const cardY = doc.y + 10;
      doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold');
      doc.text('Key Energy Baseline Metrics', 65, cardY);

      doc.font('Helvetica').fontSize(9).fillColor(grayColor);
      doc.text(`Total Detected Appliances: ${reportData.devices.filter((d) => !d.isFitting).length}`, 65, cardY + 18);
      doc.text(`Monthly Energy: ${reportData.energyEstimate.totalMonthlyEnergyKwh} kWh`, 65, cardY + 32);

      doc.text(`Electrical Fittings: ${reportData.devices.filter((d) => d.isFitting).length}`, 240, cardY + 18);
      doc.text(`Monthly Cost: ₹${reportData.energyEstimate.totalMonthlyCost}`, 240, cardY + 32);

      doc.text(`Daily Energy: ${reportData.energyEstimate.totalDailyEnergyKwh} kWh`, 400, cardY + 18);
      doc.text(`Carbon: ${reportData.energyEstimate.totalCarbonEmissionsKg} kg CO2e`, 400, cardY + 32);

      doc.y = cardY + 65;
      doc.moveDown(1.5);

      // Detected Appliance Inventory Table
      doc
        .fillColor(darkColor)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('2. Appliance Inventory & Power Ratings');

      doc.fontSize(8).font('Helvetica').fillColor(grayColor).text('Power ratings marked as user_entered are explicitly verified by the user.');
      doc.moveDown(0.5);

      // Table Header
      let tableY = doc.y;
      doc.rect(50, tableY, 495, 20).fill('#e2e8f0');
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(8);
      doc.text('Device Name', 55, tableY + 5);
      doc.text('Category', 165, tableY + 5);
      doc.text('Rating (W)', 240, tableY + 5);
      doc.text('Source', 300, tableY + 5);
      doc.text('Hrs/Day', 370, tableY + 5);
      doc.text('Monthly kWh', 420, tableY + 5);
      doc.text('Est. Cost (₹)', 485, tableY + 5);

      tableY += 22;

      // Table Rows
      doc.font('Helvetica').fontSize(8);
      const appliances = reportData.devices.filter((d) => !d.isFitting);

      appliances.slice(0, 15).forEach((dev, idx) => {
        if (idx % 2 === 1) {
          doc.rect(50, tableY - 2, 495, 18).fill('#f8fafc');
        }
        doc.fillColor(darkColor);
        doc.text(dev.displayName.substring(0, 20), 55, tableY);
        doc.text(dev.category, 165, tableY);
        doc.text(`${dev.powerRatingWatts}W`, 240, tableY);
        doc.text(dev.powerRatingSource, 300, tableY);
        doc.text(`${dev.dailyUsageHours}h`, 370, tableY);

        const breakdown = reportData.energyEstimate.deviceBreakdown?.find(
          (b) => b.deviceId?.toString() === dev._id.toString()
        );
        doc.text(`${breakdown?.monthlyEnergyKwh || '-'}`, 420, tableY);
        doc.text(`₹${breakdown?.monthlyCost || '-'}`, 485, tableY);

        tableY += 18;
      });

      doc.y = tableY;
      doc.moveDown(1.5);

      // AI Recommendations Section
      if (doc.y > 650) doc.addPage();

      doc
        .fillColor(darkColor)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('3. Evidence-Based Optimization Recommendations');

      doc.moveDown(0.5);

      (reportData.recommendations || []).slice(0, 4).forEach((rec, idx) => {
        doc.fontSize(10).font('Helvetica-Bold').fillColor(secondaryColor).text(`${idx + 1}. ${rec.title} [Priority: ${rec.priority.toUpperCase()}]`);
        doc.fontSize(8).font('Helvetica').fillColor(darkColor).text(rec.description);
        doc.fontSize(8).font('Helvetica-Oblique').fillColor(grayColor).text(`Evidence: ${rec.supportingEvidence} | Potential Savings: ${rec.estimatedPotentialSavingsKwh} kWh (₹${rec.estimatedCostSavings}/mo)`);
        doc.moveDown(0.6);
      });

      // Limitations & Uncertainty Disclosure
      doc.moveDown(1);
      doc
        .fillColor(darkColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('4. Limitations & Disclaimers');

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(grayColor)
        .text('• Energy figures are mathematical simulations derived from user-entered or reference ratings and operating durations, not physical hardware sub-metering.')
        .text('• Switch/socket visual detections indicate presence only and do not establish circuit energization or appliance draw.')
        .text('• Variable-load appliances (such as inverter air conditioners and refrigerators) modulate input power dynamically.')
        .text('• Actual electricity billings depend on local utility slab structures, peak-demand charges, and seasonal temperature swings.');

      doc.end();

      writeStream.on('finish', () => resolve({ filePath, filename }));
      writeStream.on('error', (err) => reject(err));
    });
  }
}

export const pdfGeneratorService = new PdfGeneratorService();
