import { AnalysisJob } from '../models/AnalysisJob.js';

export const analysisRepository = {
  findById: (id) => AnalysisJob.findById(id),
  findByExternalId: (extId) => AnalysisJob.findOne({ externalJobId: extId }),
  findByProject: (projectId) => AnalysisJob.find({ projectId }).sort({ createdAt: -1 }),
  create: (data) => AnalysisJob.create(data),
  updateById: (id, update) => AnalysisJob.findByIdAndUpdate(id, update, { returnDocument: 'after' })
};
