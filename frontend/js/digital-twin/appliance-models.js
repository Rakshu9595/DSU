export function makeAppliance(THREE, kind = "box", color = 0x6366f1) {
  const material = new THREE.MeshStandardMaterial({ color, roughness:.56, metalness:.12 });
  const group = new THREE.Group();
  const box = (size, y, x = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(x, y, 0); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
  };
  if (kind === "lamp") {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.72,12), new THREE.MeshStandardMaterial({ color:0x94a3b8 }));
    stem.position.y = .36; group.add(stem);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(.28,.12,.24,20), new THREE.MeshStandardMaterial({ color:0xfbbf24, emissive:0x6b4e00, emissiveIntensity:.25 }));
    shade.position.y = .82; group.add(shade);
    const bulb = new THREE.PointLight(0xffd17a, 4, 3); bulb.position.y = .68; group.add(bulb);
  } else if (kind === "sofa") {
    box([1.55,.35,.58],.35); box([1.55,.72,.22],.72); box([.28,.48,.58],.55,-.64); box([.28,.48,.58],.55,.64);
  } else if (kind === "plant") {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(.22,.16,.32,16), new THREE.MeshStandardMaterial({ color:0xb7794b }));
    pot.position.y=.16; group.add(pot);
    const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(.38,1), new THREE.MeshStandardMaterial({ color:0x34d399, roughness:.9 }));
    foliage.position.y=.62; foliage.scale.set(.8,1.2,.8); group.add(foliage);
  } else box([1,.65,.5],.35);
  group.userData = { kind };
  return group;
}
