export function createOrbitControls(THREE, camera, element) {
  return import("https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/controls/OrbitControls.js")
    .then(({ OrbitControls }) => {
      const controls = new OrbitControls(camera, element);
      controls.enableDamping = true; controls.dampingFactor = .07; controls.target.set(0,1,0);
      controls.minDistance = 3; controls.maxDistance = 14; controls.maxPolarAngle = Math.PI * .49;
      return controls;
    });
}
