import { Device } from '../models/Device.js';

export const deviceRepository = {
  findById: (id) => Device.findById(id),
  find: (filter) => Device.find(filter),
  create: (data) => Device.create(data),
  insertMany: (items) => Device.insertMany(items),
  updateById: (id, update) => Device.findByIdAndUpdate(id, update, { returnDocument: 'after' }),
  deleteById: (id) => Device.findByIdAndDelete(id)
};
