export class EnergyVisualization {
  constructor(objectsGroup) {
    this.objectsGroup = objectsGroup;
    this.mode = 'realistic'; // 'realistic' | 'heatmap' | 'scenario'
    this.originalMaterials = new Map();
  }

  setMode(mode, scenarioAdjustments = []) {
    this.mode = mode;

    this.objectsGroup.children.forEach((appliance) => {
      const data = appliance.userData || {};
      const watts = data.powerRatingWatts || 0;
      const isFitting = data.isFitting;

      if (mode === 'heatmap') {
        const tierColor = isFitting
          ? 0x64748b
          : watts > 1000
          ? 0xf43f5e
          : watts > 200
          ? 0xf59e0b
          : 0x10b981;

        this.applyColorToGroup(appliance, tierColor, 0.85);
      } else if (mode === 'scenario') {
        const isAdjusted = scenarioAdjustments.some(
          (a) => a.deviceId?.toString() === data.deviceId?.toString()
        );
        const color = isAdjusted ? 0x10b981 : 0x475569;
        this.applyColorToGroup(appliance, color, isAdjusted ? 1.0 : 0.4);
      } else {
        // Reset to realistic
        this.restoreMaterials(appliance);
      }
    });
  }

  applyColorToGroup(group, colorHex, opacity = 1.0) {
    group.traverse((child) => {
      if (child.isMesh) {
        if (!this.originalMaterials.has(child.id)) {
          this.originalMaterials.set(child.id, child.material);
        }
        child.material = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.3,
          metalness: 0.2,
          transparent: opacity < 1.0,
          opacity
        });
      }
    });
  }

  restoreMaterials(group) {
    group.traverse((child) => {
      if (child.isMesh && this.originalMaterials.has(child.id)) {
        child.material = this.originalMaterials.get(child.id);
      }
    });
  }
}
