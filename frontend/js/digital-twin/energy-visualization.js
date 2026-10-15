export function setEnergyVisualization(models, enabled, reductionPercent = 0) {
  models.forEach((model) => model.traverse((part) => {
    if (!part.isMesh || !part.material?.emissive) return;
    const watts=Number(part.userData.device?.watts)||0;
    part.material.emissive.setHex(enabled?(reductionPercent>=20?0x22c55e:watts>=800?0xf97316:watts>=100?0xfacc15:0x38bdf8):0x000000);
    part.material.emissiveIntensity=enabled ? .16+Math.min(watts/1600,.3) : 0;
  }));
}
