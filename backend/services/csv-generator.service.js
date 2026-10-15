import { stringify } from 'csv-stringify';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';

export class CsvGeneratorService {
  /**
   * Generates a CSV data export of detected devices, power ratings, and energy calculations
   */
  async generateReport(reportData, filename) {
    const filePath = path.join(env.REPORT_DIR, filename);

    const rows = [
      [
        'Device Name',
        'Type',
        'Category',
        'Is Electrical Fitting',
        'Power Rating (Watts)',
        'Rating Source',
        'Verified Rating',
        'Daily Usage (Hours)',
        'Days Used Per Month',
        'Applied Tariff (INR/kWh)',
        'Daily Energy (kWh)',
        'Monthly Energy (kWh)',
        'Monthly Cost (INR)',
        'Carbon Emissions (kg CO2e)'
      ]
    ];

    const tariff = reportData.project.electricityTariff || 8.0;
    const emissionFactor = reportData.project.emissionFactor || 0.82;

    reportData.devices.forEach((dev) => {
      const breakdown = reportData.energyEstimate.deviceBreakdown?.find(
        (b) => b.deviceId?.toString() === dev._id.toString()
      );

      rows.push([
        dev.displayName,
        dev.canonicalName,
        dev.category,
        dev.isFitting ? 'YES' : 'NO',
        dev.powerRatingWatts,
        dev.powerRatingSource,
        dev.powerRatingVerified ? 'YES' : 'NO',
        dev.dailyUsageHours,
        dev.daysUsedPerMonth,
        dev.electricityTariffPerKwh || tariff,
        breakdown?.dailyEnergyKwh ?? (dev.isFitting ? 0 : ((dev.powerRatingWatts * dev.dailyUsageHours) / 1000).toFixed(4)),
        breakdown?.monthlyEnergyKwh ?? (dev.isFitting ? 0 : (((dev.powerRatingWatts * dev.dailyUsageHours * dev.daysUsedPerMonth) / 1000).toFixed(4))),
        breakdown?.monthlyCost ?? 0,
        breakdown?.carbonEmissionsKg ?? 0
      ]);
    });

    return new Promise((resolve, reject) => {
      stringify(rows, (err, output) => {
        if (err) return reject(err);
        fs.writeFile(filePath, output, 'utf-8', (writeErr) => {
          if (writeErr) return reject(writeErr);
          resolve({ filePath, filename });
        });
      });
    });
  }
}

export const csvGeneratorService = new CsvGeneratorService();
