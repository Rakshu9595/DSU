import { Report } from '../models/Report.js';

export const reportRepository = {
  findByProject: (projectId) => Report.find({ projectId }).sort({ createdAt: -1 }),
  findById: (id) => Report.findById(id),
  create: (data) => Report.create(data)
};
