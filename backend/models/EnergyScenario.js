import mongoose from 'mongoose';

const EnergyScenarioSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Please provide a scenario name'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    baselineMetrics: {
      monthlyEnergyKwh: Number,
      monthlyCost: Number,
      carbonEmissionsKg: Number
    },
    scenarioMetrics: {
      monthlyEnergyKwh: Number,
      monthlyCost: Number,
      carbonEmissionsKg: Number
    },
    potentialSavings: {
      energySavingsKwh: Number,
      costSavings: Number,
      percentSavings: Number,
      carbonSavingsKg: Number
    },
    deviceAdjustments: [
      {
        deviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Device',
          required: true
        },
        deviceName: String,
        powerRatingWatts: Number,
        baselineDailyHours: Number,
        proposedDailyHours: Number,
        baselineDaysPerMonth: Number,
        proposedDaysPerMonth: Number,
        baselineMonthlyKwh: Number,
        proposedMonthlyKwh: Number,
        monthlySavingsKwh: Number,
        monthlySavingsCost: Number
      }
    ],
    notes: {
      type: String,
      default: 'Hypothetical simulation based on user-configured adjustments.'
    }
  },
  {
    timestamps: true
  }
);

export const EnergyScenario = mongoose.model('EnergyScenario', EnergyScenarioSchema);
