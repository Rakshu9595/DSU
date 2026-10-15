import { User } from '../models/User.js';

export const userRepository = {
  findById: (id) => User.findById(id),
  findByEmail: (email) => User.findOne({ email }),
  create: (data) => User.create(data),
  updateById: (id, update) => User.findByIdAndUpdate(id, update, { returnDocument: 'after' })
};
