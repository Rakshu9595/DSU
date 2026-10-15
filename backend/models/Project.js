import mongoose from 'mongoose';
import { DEFAULT_TARIFF_INR, DEFAULT_EMISSION_FACTOR } from '../config/constants.js';

const ProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide a project name'],
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    roomType: {
      type: String,
      enum: ['living_room', 'bedroom', 'kitchen', 'office', 'server_room', 'commercial', 'other'],
      default: 'living_room'
    },
    roomDimensions: {
      length: { type: Number, default: 5.0, min: 1, max: 50 },
      width: { type: Number, default: 4.0, min: 1, max: 50 },
      height: { type: Number, default: 2.8, min: 1, max: 15 },
      unit: { type: String, default: 'meters' }
    },
    electricityTariff: {
      type: Number,
      default: DEFAULT_TARIFF_INR,
      min: 0.01,
      max: 500
    },
    emissionFactor: {
      type: Number,
      default: DEFAULT_EMISSION_FACTOR,
      min: 0.01,
      max: 5
    },
    status: {
      type: String,
      enum: ['draft', 'analyzed', 'optimized', 'archived'],
      default: 'draft'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ProjectSchema.virtual('electricityTariffPerKwh')
  .get(function () {
    return this.electricityTariff;
  })
  .set(function (val) {
    this.electricityTariff = val;
  });

export const Project = mongoose.model('Project', ProjectSchema);
