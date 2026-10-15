export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Use window.THREE.OrbitControls or fallback
    if (window.THREE && window.THREE.OrbitControls) {
      this.controls = new window.THREE.OrbitControls(camera, domElement);
    } else if (window.OrbitControls) {
      this.controls = new window.OrbitControls(camera, domElement);
    }

    if (this.controls) {
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Do not go below floor
      this.controls.minDistance = 2;
      this.controls.maxDistance = 25;
      this.controls.target.set(0, 1.2, 0);
    }
  }

  update() {
    if (this.controls) this.controls.update();
  }

  setPreset(preset) {
    if (!this.controls) return;
    const duration = 800;
    let targetPos = { x: 6, y: 6, z: 8 };
    let targetLook = { x: 0, y: 1.2, z: 0 };

    if (preset === 'top') {
      targetPos = { x: 0, y: 12, z: 0.1 };
      this.controls.maxPolarAngle = Math.PI;
    } else if (preset === 'front') {
      targetPos = { x: 0, y: 2, z: 8 };
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    } else if (preset === 'iso') {
      targetPos = { x: 6, y: 6, z: 8 };
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    }

    this.animateCamera(targetPos, targetLook, duration);
  }

  animateCamera(pos, target, duration) {
    const startPos = { ...this.camera.position };
    const startTarget = { ...this.controls.target };
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      this.camera.position.x = startPos.x + (pos.x - startPos.x) * ease;
      this.camera.position.y = startPos.y + (pos.y - startPos.y) * ease;
      this.camera.position.z = startPos.z + (pos.z - startPos.z) * ease;

      this.controls.target.x = startTarget.x + (target.x - startTarget.x) * ease;
      this.controls.target.y = startTarget.y + (target.y - startTarget.y) * ease;
      this.controls.target.z = startTarget.z + (target.z - startTarget.z) * ease;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }
}
