import mongoose from 'mongoose';
import { DEFAULT_TARIFF_INR, DEFAULT_EMISSION_FACTOR } from '../config/constants.js';

const UserSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    defaultTariff: {
      type: Number,
      default: DEFAULT_TARIFF_INR,
      min: 0.01,
      max: 500
    },
    defaultEmissionFactor: {
      type: Number,
      default: DEFAULT_EMISSION_FACTOR,
      min: 0.01,
      max: 5
    },
    currencySymbol: {
      type: String,
      default: '₹'
    },
    preferredAiProvider: {
      type: String,
      default: 'builtin'
    }
  },
  {
    timestamps: true
  }
);

export const UserSettings = mongoose.model('UserSettings', UserSettingsSchema);
