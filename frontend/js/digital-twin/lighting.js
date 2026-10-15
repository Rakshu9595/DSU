export function setupLighting(scene) {
  // Ambient fill
  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);

  // Main directional light (Sunlight)
  const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 30;
  dirLight.shadow.bias = -0.0005;

  const d = 6;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  scene.add(dirLight);

  // Ceiling room warm light
  const ceilingPoint = new THREE.PointLight(0xfff4e6, 0.8, 12);
  ceilingPoint.position.set(0, 2.7, 0);
  ceilingPoint.castShadow = true;
  scene.add(ceilingPoint);

  // Subtle futuristic rim accent
  const rimLight = new THREE.DirectionalLight(0x06b6d4, 0.35);
  rimLight.position.set(-6, 4, -6);
  scene.add(rimLight);
}
