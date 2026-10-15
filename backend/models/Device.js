import mongoose from 'mongoose';
import {
  POWER_RATING_SOURCES,
  DEVICE_CATEGORIES,
  FITTING_TYPES,
  SWITCH_STATES,
  SAFETY_LIMITS
} from '../config/constants.js';

const DeviceSchema = new mongoose.Schema(
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
      required: true,
      index: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnalysisJob',
      default: null
    },
    canonicalName: {
      type: String,
      required: true,
      trim: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: Object.values(DEVICE_CATEGORIES),
      default: DEVICE_CATEGORIES.COOLING
    },
    detectionConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0
    },
    bbox: {
      type: [Number],
      default: []
    },
    firstSeenTimestamp: {
      type: Number,
      default: 0
    },
    isFitting: {
      type: Boolean,
      default: false,
      index: true
    },
    fittingType: {
      type: String,
      enum: Object.values(FITTING_TYPES),
      default: FITTING_TYPES.OTHER
    },
    fittingStatus: {
      type: String,
      enum: Object.values(SWITCH_STATES),
      default: SWITCH_STATES.UNKNOWN
    },
    // User-editable electrical power rating (fittings have 0W, active appliances >= 1W)
    powerRatingWatts: {
      type: Number,
      min: [0, 'Power rating cannot be negative'],
      max: [SAFETY_LIMITS.MAX_POWER_WATTS, `Power rating cannot exceed ${SAFETY_LIMITS.MAX_POWER_WATTS}W`],
      default: 75
    },
    powerRatingSource: {
      type: String,
      enum: Object.values(POWER_RATING_SOURCES),
      default: POWER_RATING_SOURCES.REFERENCE_ESTIMATE
    },
    powerRatingVerified: {
      type: Boolean,
      default: false
    },
    manufacturer: {
      type: String,
      trim: true,
      default: ''
    },
    modelNumber: {
      type: String,
      trim: true,
      default: ''
    },
    dailyUsageHours: {
      type: Number,
      min: 0,
      max: SAFETY_LIMITS.MAX_DAILY_HOURS,
      default: 4
    },
    daysUsedPerMonth: {
      type: Number,
      min: 0,
      max: SAFETY_LIMITS.MAX_DAYS_PER_MONTH,
      default: 30
    },
    electricityTariffPerKwh: {
      type: Number,
      min: SAFETY_LIMITS.MIN_TARIFF,
      max: SAFETY_LIMITS.MAX_TARIFF,
      default: null // null means inherit from project
    },
    ratingUpdatedAt: {
      type: Date,
      default: Date.now
    },
    ratingUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isVariablePower: {
      type: Boolean,
      default: false
    },
    position3D: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
      rotationY: { type: Number, default: 0 }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const Device = mongoose.model('Device', DeviceSchema);
