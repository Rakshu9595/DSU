import { Project } from '../models/Project.js';

export const projectRepository = {
  findById: (id) => Project.findById(id),
  findByUser: (userId) => Project.find({ userId }).sort({ updatedAt: -1 }),
  create: (data) => Project.create(data),
  updateById: (id, update) => Project.findByIdAndUpdate(id, update, { returnDocument: 'after' }),
  deleteById: (id) => Project.findByIdAndDelete(id)
};
