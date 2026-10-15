export function resetCamera(camera, controls) {
  camera.position.set(7,5.4,8);
  controls.target.set(0,1,0);
  controls.update();
}
