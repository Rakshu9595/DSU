import mongoose from 'mongoose';

const DigitalTwinSceneSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    roomDimensions: {
      length: { type: Number, default: 5.0, min: 1, max: 50 },
      width: { type: Number, default: 4.0, min: 1, max: 50 },
      height: { type: Number, default: 2.8, min: 1, max: 15 },
      unit: { type: String, default: 'meters' }
    },
    roomTheme: {
      wallColor: { type: String, default: '#f0ede6' },
      floorTexture: { type: String, default: 'wood' },
      ambientIntensity: { type: Number, default: 0.8 }
    },
    objects: [
      {
        deviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Device',
          default: null
        },
        name: { type: String, default: 'Appliance' },
        canonicalName: { type: String, default: 'generic' },
        category: { type: String, default: 'cooling' },
        isFitting: { type: Boolean, default: false },
        position: {
          x: { type: Number, default: 0 },
          y: { type: Number, default: 0 },
          z: { type: Number, default: 0 }
        },
        rotation: {
          x: { type: Number, default: 0 },
          y: { type: Number, default: 0 },
          z: { type: Number, default: 0 }
        },
        scale: {
          x: { type: Number, default: 1 },
          y: { type: Number, default: 1 },
          z: { type: Number, default: 1 }
        },
        powerRatingWatts: { type: Number, default: 75 },
        energyTier: {
          type: String,
          enum: ['low', 'medium', 'high', 'fitting'],
          default: 'low'
        }
      }
    ],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const DigitalTwinScene = mongoose.model('DigitalTwinScene', DigitalTwinSceneSchema);
