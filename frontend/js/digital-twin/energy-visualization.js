export function setEnergyVisualization(models, enabled) {
  models.forEach((model) => model.traverse((part) => {
    if (!part.isMesh || !part.material?.emissive) return;
    part.material.emissive.setHex(enabled ? 0x0e7490 : 0x000000);
    part.material.emissiveIntensity = enabled ? .28 : 0;
  }));
}
