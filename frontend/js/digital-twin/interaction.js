export class TwinInteraction {
  constructor(renderer, camera, objectsGroup, onSelectCallback) {
    this.renderer = renderer;
    this.camera = camera;
    this.objectsGroup = objectsGroup;
    this.onSelect = onSelectCallback;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedObject = null;
    this.hoveredObject = null;

    this.selectionBox = new THREE.BoxHelper(new THREE.Mesh(), 0x10b981);
    this.selectionBox.visible = false;
    this.renderer.scene.add(this.selectionBox);

    this.domElement = renderer.renderer.domElement;
    this.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
  }

  getPointerCoordinates(event) {
    const rect = this.domElement.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((event.clientY - rect.top) / rect.height) * 2 + 1
    };
  }

  onPointerDown(event) {
    const coords = this.getPointerCoordinates(event);
    this.mouse.x = coords.x;
    this.mouse.y = coords.y;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.objectsGroup.children, true);

    if (intersects.length > 0) {
      // Find top-level appliance group under objectsGroup
      let target = intersects[0].object;
      while (target.parent && target.parent !== this.objectsGroup) {
        target = target.parent;
      }

      this.selectObject(target);
    } else {
      this.deselect();
    }
  }

  onPointerMove(event) {
    const coords = this.getPointerCoordinates(event);
    this.mouse.x = coords.x;
    this.mouse.y = coords.y;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.objectsGroup.children, true);

    if (intersects.length > 0) {
      this.domElement.style.cursor = 'pointer';
    } else {
      this.domElement.style.cursor = 'default';
    }
  }

  selectObject(obj) {
    this.selectedObject = obj;
    this.selectionBox.setFromObject(obj);
    this.selectionBox.visible = true;

    if (this.onSelect && obj.userData) {
      this.onSelect(obj.userData, obj);
    }
  }

  deselect() {
    this.selectedObject = null;
    this.selectionBox.visible = false;
    if (this.onSelect) {
      this.onSelect(null);
    }
  }
}
