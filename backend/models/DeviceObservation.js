import mongoose from 'mongoose';

const DeviceObservationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnalysisJob',
      required: true,
      index: true
    },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
      index: true
    },
    frameIndex: {
      type: Number,
      required: true
    },
    timestampSeconds: {
      type: Number,
      required: true
    },
    confidence: {
      type: Number,
      required: true
    },
    bbox: {
      type: [Number],
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const DeviceObservation = mongoose.model('DeviceObservation', DeviceObservationSchema);
