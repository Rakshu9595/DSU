import mongoose from 'mongoose';

const RecommendationSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['operating_hours', 'high_consumption', 'maintenance', 'energy_efficiency', 'tariff_optimization', 'behavioral'],
      default: 'operating_hours'
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    targetDeviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      default: null
    },
    targetDeviceName: {
      type: String,
      default: null
    },
    estimatedPotentialSavingsKwh: {
      type: Number,
      default: 0
    },
    estimatedCostSavings: {
      type: Number,
      default: 0
    },
    actionableSteps: {
      type: [String],
      default: []
    },
    supportingEvidence: {
      type: String,
      required: true
    },
    provider: {
      type: String,
      default: 'builtin'
    },
    isApplied: {
      type: Boolean,
      default: false
    },
    isDismissed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const Recommendation = mongoose.model('Recommendation', RecommendationSchema);
