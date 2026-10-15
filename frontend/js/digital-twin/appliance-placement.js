export function placeAppliance(scene, model, position) {
  if (!Array.isArray(position) || position.length !== 3 || position.some((value) => !Number.isFinite(value))) throw new TypeError("Position must contain three finite coordinates.");
  model.position.set(...position);
  scene.add(model);
  return model;
}
