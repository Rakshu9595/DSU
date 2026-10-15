export class ApplianceModelFactory {
  static createModel(canonicalName, options = {}) {
    const group = new THREE.Group();
    group.name = options.name || canonicalName;
    group.userData = {
      deviceId: options.deviceId,
      name: options.name || canonicalName,
      canonicalName,
      category: options.category || 'cooling',
      powerRatingWatts: options.powerRatingWatts || 75,
      isFitting: !!options.isFitting,
      tier: options.tier || 'low'
    };

    switch (canonicalName) {
      case 'ceiling_fan':
        this.buildCeilingFan(group, options);
        break;
      case 'air_conditioner':
        this.buildAirConditioner(group, options);
        break;
      case 'television':
        this.buildTelevision(group, options);
        break;
      case 'laptop':
        this.buildLaptop(group, options);
        break;
      case 'refrigerator':
        this.buildRefrigerator(group, options);
        break;
      case 'lamp':
        this.buildLamp(group, options);
        break;
      case 'switch':
        this.buildWallSwitch(group, options);
        break;
      case 'socket':
        this.buildPowerSocket(group, options);
        break;
      default:
        this.buildGenericAppliance(group, options);
        break;
    }

    if (options.position) {
      group.position.set(options.position.x || 0, options.position.y || 0, options.position.z || 0);
    }
    if (options.rotation) {
      group.rotation.set(options.rotation.x || 0, options.rotation.y || 0, options.rotation.z || 0);
    }

    return group;
  }

  static buildCeilingFan(group, opts) {
    // Rod
    const rodGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 16);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
    const rod = new THREE.Mesh(rodGeo, metalMat);
    rod.position.y = 0.2;
    group.add(rod);

    // Motor Hub
    const motorGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 24);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const motor = new THREE.Mesh(motorGeo, bodyMat);
    motor.castShadow = true;
    group.add(motor);

    // 3 Aerodynamic Blades
    const bladeGroup = new THREE.Group();
    bladeGroup.name = 'fanBlades';
    const bladeGeo = new THREE.BoxGeometry(0.55, 0.01, 0.1);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });

    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.castShadow = true;
      blade.position.x = 0.32;
      const pivot = new THREE.Group();
      pivot.rotation.y = (i * 2 * Math.PI) / 3;
      pivot.add(blade);
      bladeGroup.add(pivot);
    }
    group.add(bladeGroup);
  }

  static buildAirConditioner(group, opts) {
    // Indoor AC body
    const bodyGeo = new THREE.BoxGeometry(1.1, 0.32, 0.24);
    const acMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, acMat);
    body.castShadow = true;
    group.add(body);

    // Lower louver
    const louverGeo = new THREE.BoxGeometry(1.04, 0.06, 0.02);
    const louverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
    const louver = new THREE.Mesh(louverGeo, louverMat);
    louver.position.set(0, -0.1, 0.125);
    group.add(louver);

    // Digital Temperature Display
    const displayGeo = new THREE.PlaneGeometry(0.12, 0.05);
    const displayMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const display = new THREE.Mesh(displayGeo, displayMat);
    display.position.set(0.35, 0.02, 0.122);
    group.add(display);
  }

  static buildTelevision(group, opts) {
    // Screen Frame
    const frameGeo = new THREE.BoxGeometry(1.4, 0.82, 0.04);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.1, metalness: 0.7 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true;
    group.add(frame);

    // Screen Glass
    const screenGeo = new THREE.PlaneGeometry(1.36, 0.78);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.z = 0.022;
    group.add(screen);

    // Stand base
    const standGeo = new THREE.BoxGeometry(0.4, 0.02, 0.25);
    const stand = new THREE.Mesh(standGeo, frameMat);
    stand.position.set(0, -0.42, 0);
    group.add(stand);

    const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 16);
    const pole = new THREE.Mesh(poleGeo, frameMat);
    pole.position.set(0, -0.38, 0);
    group.add(pole);
  }

  static buildLaptop(group, opts) {
    // Desk Table
    const tableTopGeo = new THREE.BoxGeometry(1.2, 0.05, 0.65);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.6 });
    const tableTop = new THREE.Mesh(tableTopGeo, woodMat);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    group.add(tableTop);

    // Table legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.75, 12);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6 });
    [
      [-0.52, -0.4, -0.25],
      [0.52, -0.4, -0.25],
      [-0.52, -0.4, 0.25],
      [0.52, -0.4, 0.25]
    ].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      group.add(leg);
    });

    // Laptop Base
    const laptopBaseGeo = new THREE.BoxGeometry(0.32, 0.015, 0.22);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const laptopBase = new THREE.Mesh(laptopBaseGeo, metalMat);
    laptopBase.position.set(0, 0.035, 0);
    laptopBase.castShadow = true;
    group.add(laptopBase);

    // Laptop Screen
    const screenGeo = new THREE.BoxGeometry(0.32, 0.2, 0.01);
    const laptopScreen = new THREE.Mesh(screenGeo, metalMat);
    laptopScreen.position.set(0, 0.13, -0.1);
    laptopScreen.rotation.x = -0.2;
    group.add(laptopScreen);
  }

  static buildRefrigerator(group, opts) {
    // Fridge Body
    const bodyGeo = new THREE.BoxGeometry(0.75, 1.7, 0.75);
    const fridgeMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.5, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, fridgeMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Door seam line
    const seamGeo = new THREE.BoxGeometry(0.76, 0.01, 0.02);
    const seamMat = new THREE.MeshBasicMaterial({ color: 0x374151 });
    const seam = new THREE.Mesh(seamGeo, seamMat);
    seam.position.set(0, 0.15, 0.38);
    group.add(seam);

    // Chrome Handle
    const handleGeo = new THREE.BoxGeometry(0.03, 0.4, 0.04);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.1 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.3, 0.38, 0.4);
    group.add(handle);
  }

  static buildLamp(group, opts) {
    // Base
    const baseGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.03, 24);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 });
    const base = new THREE.Mesh(baseGeo, goldMat);
    group.add(base);

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 16);
    const pole = new THREE.Mesh(poleGeo, goldMat);
    pole.position.y = 0.3;
    group.add(pole);

    // Shade
    const shadeGeo = new THREE.ConeGeometry(0.18, 0.25, 24, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.4, side: THREE.DoubleSide });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.y = 0.62;
    group.add(shade);

    // Bulb Glow PointLight
    const lampLight = new THREE.PointLight(0xfef08a, 0.6, 3);
    lampLight.position.set(0, 0.58, 0);
    group.add(lampLight);
  }

  static buildWallSwitch(group, opts) {
    const plateGeo = new THREE.BoxGeometry(0.1, 0.1, 0.015);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    group.add(plate);

    const switchGeo = new THREE.BoxGeometry(0.03, 0.05, 0.01);
    const swMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const sw = new THREE.Mesh(switchGeo, swMat);
    sw.position.z = 0.01;
    group.add(sw);
  }

  static buildPowerSocket(group, opts) {
    const plateGeo = new THREE.BoxGeometry(0.1, 0.1, 0.015);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    group.add(plate);

    // Socket holes
    const holeGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.02, 12);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const h1 = new THREE.Mesh(holeGeo, holeMat);
    h1.rotation.x = Math.PI / 2;
    h1.position.set(-0.02, -0.01, 0.01);
    group.add(h1);

    const h2 = new THREE.Mesh(holeGeo, holeMat);
    h2.rotation.x = Math.PI / 2;
    h2.position.set(0.02, -0.01, 0.01);
    group.add(h2);

    const h3 = new THREE.Mesh(holeGeo, holeMat);
    h3.rotation.x = Math.PI / 2;
    h3.position.set(0, 0.02, 0.01);
    group.add(h3);
  }

  static buildGenericAppliance(group, opts) {
    const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    group.add(mesh);
  }
}
