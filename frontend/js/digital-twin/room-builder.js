export function buildRoom(THREE, scene, dimensions = { width:6, depth:4.5, height:2.8 }) {
  const group = new THREE.Group();
  const { width, depth, height } = dimensions;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width,depth), new THREE.MeshStandardMaterial({ color:0x34445b, roughness:.82, metalness:.04 }));
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; group.add(floor);
  const wallMaterial = new THREE.MeshStandardMaterial({ color:0x23334a, roughness:.9, side:THREE.DoubleSide });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(width,height), wallMaterial);
  back.position.set(0,height/2,-depth/2); back.receiveShadow=true; group.add(back);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(depth,height), wallMaterial);
  side.rotation.y = Math.PI/2; side.position.set(-width/2,height/2,0); group.add(side);
  const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(width*.32,height*.34,.055),new THREE.MeshStandardMaterial({color:0x91b8ce,roughness:.32,metalness:.16}));
  windowFrame.position.set(width*.18,height*.62,-depth/2+.04); windowFrame.castShadow=true; group.add(windowFrame);
  const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(width*.29,height*.31),new THREE.MeshStandardMaterial({color:0x89c9e8,emissive:0x1e536e,emissiveIntensity:.12,roughness:.2,metalness:.2,side:THREE.DoubleSide}));
  windowGlass.position.set(width*.18,height*.62,-depth/2+.075); group.add(windowGlass);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(width*.36,.07,.14),new THREE.MeshStandardMaterial({color:0x62758d,roughness:.7}));
  sill.position.set(width*.18,height*.445,-depth/2+.02); group.add(sill);
  const trimMaterial = new THREE.MeshStandardMaterial({color:0x52647b,roughness:.78});
  for (const [x,z,length,rotation] of [[0,-depth/2,width,0],[-width/2,0,depth,Math.PI/2]]) {
    const trim=new THREE.Mesh(new THREE.BoxGeometry(length,.1,.07),trimMaterial);
    trim.position.set(x,.05,z); trim.rotation.y=rotation; group.add(trim);
  }
  const grid = new THREE.GridHelper(width,12,0x7186a4,0x43536d); grid.position.y=.006; group.add(grid);
  group.userData.dimensions = {width,depth,height}; scene.add(group);
  return group;
}
