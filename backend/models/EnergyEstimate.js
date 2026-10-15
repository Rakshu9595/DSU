import mongoose from 'mongoose';

const EnergyEstimateSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    totalAppliancesCount: {
      type: Number,
      default: 0
    },
    totalFittingsCount: {
      type: Number,
      default: 0
    },
    totalDailyEnergyKwh: {
      type: Number,
      default: 0
    },
    totalMonthlyEnergyKwh: {
      type: Number,
      default: 0
    },
    totalMonthlyCost: {
      type: Number,
      default: 0
    },
    totalCarbonEmissionsKg: {
      type: Number,
      default: 0
    },
    tariffApplied: {
      type: Number,
      default: 8.0
    },
    emissionFactorApplied: {
      type: Number,
      default: 0.82
    },
    deviceBreakdown: [
      {
        deviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Device'
        },
        name: String,
        category: String,
        powerRatingWatts: Number,
        powerRatingSource: String,
        dailyUsageHours: Number,
        daysUsedPerMonth: Number,
        dailyEnergyKwh: Number,
        monthlyEnergyKwh: Number,
        monthlyCost: Number,
        carbonEmissionsKg: Number,
        percentOfTotalEnergy: Number
      }
    ],
    isEstimateNotice: {
      type: String,
      default: 'Energy figures are calculated estimates based on user-entered or reference ratings and operating hours, not direct hardware sub-metering.'
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const EnergyEstimate = mongoose.model('EnergyEstimate', EnergyEstimateSchema);
