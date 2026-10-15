import { VideoAsset } from '../models/VideoAsset.js';

export const videoRepository = {
  findById: (id) => VideoAsset.findById(id),
  findByProject: (projectId) => VideoAsset.find({ projectId }).sort({ createdAt: -1 }),
  create: (data) => VideoAsset.create(data),
  updateById: (id, update) => VideoAsset.findByIdAndUpdate(id, update, { returnDocument: 'after' })
};
