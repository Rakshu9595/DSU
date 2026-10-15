import mongoose from 'mongoose';

const VideoAssetSchema = new mongoose.Schema(
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
    originalFilename: {
      type: String,
      required: true
    },
    storedFilename: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    fps: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['uploaded', 'analyzed', 'error'],
      default: 'uploaded'
    }
  },
  {
    timestamps: true
  }
);

export const VideoAsset = mongoose.model('VideoAsset', VideoAssetSchema);
