export function addRoomLighting(THREE, scene) {
  scene.add(new THREE.HemisphereLight(0xa8c5ff, 0x101827, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(-4,7,5); key.castShadow = true; key.shadow.mapSize.set(1024,1024); scene.add(key);
}
