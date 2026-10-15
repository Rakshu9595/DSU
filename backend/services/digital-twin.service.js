import { DigitalTwinScene } from '../models/DigitalTwinScene.js';
import { Device } from '../models/Device.js';
import { Project } from '../models/Project.js';
import { AppError } from '../utils/app-error.js';

export class DigitalTwinService {
  /**
   * Initializes or fetches the 3D Digital Twin scene for a project
   */
  async getOrCreateScene(projectId, userId) {
    let scene = await DigitalTwinScene.findOne({ projectId });
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);

    if (!scene) {
      scene = await DigitalTwinScene.create({
        projectId,
        userId,
        roomDimensions: project.roomDimensions || { length: 5.0, width: 4.0, height: 2.8, unit: 'meters' },
        roomTheme: {
          wallColor: '#f0ede6',
          floorTexture: 'wood',
          ambientIntensity: 0.8
        },
        objects: []
      });
    }

    // Sync detected active devices into scene objects if any are missing
    await this.syncDevicesToScene(projectId, scene);

    return scene;
  }

  /**
   * Syncs active project devices into scene 3D representations
   */
  async syncDevicesToScene(projectId, scene) {
    const devices = await Device.find({ projectId, isActive: true });
    let modified = false;

    for (const dev of devices) {
      const exists = scene.objects.some((o) => o.deviceId?.toString() === dev._id.toString());
      if (!exists) {
        const watts = dev.powerRatingWatts || 0;
        const tier = dev.isFitting
          ? 'fitting'
          : watts > 1000
          ? 'high'
          : watts > 200
          ? 'medium'
          : 'low';

        scene.objects.push({
          deviceId: dev._id,
          name: dev.displayName,
          canonicalName: dev.canonicalName,
          category: dev.category,
          isFitting: dev.isFitting,
          position: dev.position3D || { x: 0, y: 0.8, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          powerRatingWatts: watts,
          energyTier: tier
        });
        modified = true;
      }
    }

    if (modified) {
      scene.lastUpdated = new Date();
      await scene.save();
    }
  }

  /**
   * Updates room dimensions, styling, or appliance 3D coordinates
   */
  async updateScene(projectId, updateData) {
    const scene = await DigitalTwinScene.findOne({ projectId });
    if (!scene) throw new AppError('Digital Twin scene not found for project', 404);

    if (updateData.roomDimensions) {
      scene.roomDimensions = updateData.roomDimensions;
      // Also update Project model room dimensions
      await Project.findByIdAndUpdate(projectId, { roomDimensions: updateData.roomDimensions });
    }
    if (updateData.roomTheme) {
      scene.roomTheme = { ...scene.roomTheme, ...updateData.roomTheme };
    }
    if (updateData.objects) {
      scene.objects = updateData.objects;
      // Update individual device 3D positions in Device model
      for (const obj of updateData.objects) {
        if (obj.deviceId && obj.position) {
          await Device.findByIdAndUpdate(obj.deviceId, {
            position3D: {
              x: obj.position.x,
              y: obj.position.y,
              z: obj.position.z,
              rotationY: obj.rotation?.y || 0
            }
          });
        }
      }
    }

    scene.lastUpdated = new Date();
    await scene.save();
    return scene;
  }
}

export const digitalTwinService = new DigitalTwinService();
