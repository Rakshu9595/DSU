import { Recommendation } from '../models/Recommendation.js';

export const recommendationRepository = {
  findByProject: (projectId) => Recommendation.find({ projectId, isDismissed: false }),
  create: (data) => Recommendation.create(data),
  updateById: (id, update) => Recommendation.findByIdAndUpdate(id, update, { returnDocument: 'after' })
};
