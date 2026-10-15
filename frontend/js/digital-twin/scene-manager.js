import { TwinRenderer } from './renderer.js';
import { CameraController } from './camera-controls.js';
import { setupLighting } from './lighting.js';
import { RoomBuilder } from './room-builder.js';
import { ApplianceModelFactory } from './appliance-models.js';
import { TwinInteraction } from './interaction.js';
import { EnergyVisualization } from './energy-visualization.js';
import { api } from '../core/api-client.js';

export class DigitalTwinSceneManager {
  constructor(containerElement, onSelectDeviceCallback) {
    this.container = containerElement;
    this.onSelectDevice = onSelectDeviceCallback;

    this.renderer = new TwinRenderer(containerElement);
    this.cameraController = new CameraController(this.renderer.camera, this.renderer.renderer.domElement);
    setupLighting(this.renderer.scene);

    this.roomBuilder = new RoomBuilder(this.renderer.scene);
    this.objectsGroup = new THREE.Group();
    this.objectsGroup.name = 'roomAppliances';
    this.renderer.scene.add(this.objectsGroup);

    this.interaction = new TwinInteraction(
      this.renderer,
      this.renderer.camera,
      this.objectsGroup,
      this.onSelectDevice
    );

    this.visualization = new EnergyVisualization(this.objectsGroup);

    this.animationId = null;
    this.isSpinningFans = true;
    this.startAnimationLoop();
  }

  startAnimationLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      // Animate fan blades
      if (this.isSpinningFans) {
        this.objectsGroup.children.forEach((app) => {
          if (app.userData?.canonicalName === 'ceiling_fan') {
            const blades = app.getObjectByName('fanBlades');
            if (blades) blades.rotation.y += 0.08;
          }
        });
      }

      this.cameraController.update();
      this.renderer.renderer.render(this.renderer.scene, this.renderer.camera);
    };
    animate();
  }

  async loadProjectScene(projectId) {
    const sceneData = await api.get(`/digital-twin/project/${projectId}`);
    this.currentSceneData = sceneData;

    // 1. Build room
    this.roomBuilder.buildRoom(sceneData.roomDimensions, sceneData.roomTheme);

    // 2. Clear & rebuild appliances
    this.objectsGroup.clear();
    const objects = sceneData.objects || [];

    objects.forEach((obj) => {
      const model = ApplianceModelFactory.createModel(obj.canonicalName, obj);
      this.objectsGroup.add(model);
    });

    return sceneData;
  }

  updateDimensions(dimensions) {
    this.roomBuilder.buildRoom(dimensions);
  }

  setVisualMode(mode, scenarioAdjustments = []) {
    this.visualization.setMode(mode, scenarioAdjustments);
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.renderer.destroy();
  }
}
