export class RoomBuilder {
  constructor(scene) {
    this.scene = scene;
    this.roomGroup = new THREE.Group();
    this.scene.add(this.roomGroup);
  }

  buildRoom(dimensions = { length: 5.5, width: 4.5, height: 2.8 }, theme = {}) {
    // Clear previous room geometry
    this.roomGroup.clear();

    const L = dimensions?.length || 5.5;
    const W = dimensions?.width || 4.5;
    const H = dimensions?.height || 2.8;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(L, W);
    const floorMat = new THREE.MeshStandardMaterial({
      color: theme.floorColor || 0x1e293b,
      roughness: 0.4,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.roomGroup.add(floor);

    // Floor subtle grid overlay
    const grid = new THREE.GridHelper(Math.max(L, W), Math.round(Math.max(L, W) * 2), 0x334155, 0x1e293b);
    grid.position.y = 0.005;
    this.roomGroup.add(grid);

    // Wall Material
    const wallColor = theme.wallColor || 0x0f172a;
    const wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.7,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // Back Wall (at -W/2)
    const backWallGeo = new THREE.PlaneGeometry(L, H);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, H / 2, -W / 2);
    backWall.receiveShadow = true;
    this.roomGroup.add(backWall);

    // Left Wall (at -L/2)
    const leftWallGeo = new THREE.PlaneGeometry(W, H);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-L / 2, H / 2, 0);
    leftWall.receiveShadow = true;
    this.roomGroup.add(leftWall);

    // Right Wall (at +L/2)
    const rightWallGeo = new THREE.PlaneGeometry(W, H);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(L / 2, H / 2, 0);
    rightWall.receiveShadow = true;
    this.roomGroup.add(rightWall);

    // Baseboards / Trim lines
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const trimBackGeo = new THREE.BoxGeometry(L, 0.08, 0.04);
    const trimBack = new THREE.Mesh(trimBackGeo, trimMat);
    trimBack.position.set(0, 0.04, -W / 2 + 0.02);
    this.roomGroup.add(trimBack);

    const trimSideGeo = new THREE.BoxGeometry(0.04, 0.08, W);
    const trimLeft = new THREE.Mesh(trimSideGeo, trimMat);
    trimLeft.position.set(-L / 2 + 0.02, 0.04, 0);
    this.roomGroup.add(trimLeft);

    const trimRight = new THREE.Mesh(trimSideGeo, trimMat);
    trimRight.position.set(L / 2 - 0.02, 0.04, 0);
    this.roomGroup.add(trimRight);

    return this.roomGroup;
  }
}
