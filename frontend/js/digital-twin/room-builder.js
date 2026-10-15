export function buildRoom(THREE, scene, dimensions = { width:6, depth:4.5, height:2.8 }) {
  const group = new THREE.Group();
  const { width, depth, height } = dimensions;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width,depth), new THREE.MeshStandardMaterial({ color:0x34445b, roughness:.82 }));
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; group.add(floor);
  const wallMaterial = new THREE.MeshStandardMaterial({ color:0x23334a, roughness:.9, side:THREE.DoubleSide });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(width,height), wallMaterial);
  back.position.set(0,height/2,-depth/2); group.add(back);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(depth,height), wallMaterial);
  side.rotation.y = Math.PI/2; side.position.set(-width/2,height/2,0); group.add(side);
  const grid = new THREE.GridHelper(width,12,0x7186a4,0x43536d); grid.position.y=.006; group.add(grid);
  group.userData.dimensions = dimensions; scene.add(group);
  return group;
}
