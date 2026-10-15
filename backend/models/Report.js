import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema(
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
    reportType: {
      type: String,
      enum: ['pdf', 'csv'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      default: 0
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ReportSchema.virtual('fileSizeBytes').get(function () {
  return this.fileSize;
});

export const Report = mongoose.model('Report', ReportSchema);
