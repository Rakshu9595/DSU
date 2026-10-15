import { Prediction } from '../models/Prediction.js';

export const predictionRepository = {
  findByJob: (jobId) => Prediction.find({ jobId }).sort({ frameIndex: 1 }),
  insertMany: (items) => Prediction.insertMany(items)
};
