import mongoose from 'mongoose';
import { ANALYSIS_STATUS } from '../config/constants.js';

const AnalysisJobSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VideoAsset',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    externalJobId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(ANALYSIS_STATUS),
      default: ANALYSIS_STATUS.QUEUED
    },
    progressPercent: {
      type: Number,
      default: 0
    },
    errorMessage: {
      type: String,
      default: null
    },
    modelServerUrls: {
      statusUrl: String,
      summaryUrl: String,
      predictionsUrl: String
    },
    rawSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const AnalysisJob = mongoose.model('AnalysisJob', AnalysisJobSchema);
