import mongoose from 'mongoose';

const PredictionSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnalysisJob',
      required: true,
      index: true
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VideoAsset',
      required: true
    },
    frameIndex: {
      type: Number,
      required: true
    },
    timestampSeconds: {
      type: Number,
      required: true
    },
    appliancesAndDevices: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    switchesAndSockets: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const Prediction = mongoose.model('Prediction', PredictionSchema);
