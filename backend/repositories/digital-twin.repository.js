import { DigitalTwinScene } from '../models/DigitalTwinScene.js';

export const digitalTwinRepository = {
  findByProject: (projectId) => DigitalTwinScene.findOne({ projectId }),
  upsertByProject: (projectId, data) =>
    DigitalTwinScene.findOneAndUpdate({ projectId }, data, { upsert: true, returnDocument: 'after' })
};
