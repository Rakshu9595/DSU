import { createDigitalTwin } from "./scene-manager.js";
export async function initializeTwin(canvas, sceneData = null) {
  try { return await createDigitalTwin(canvas,sceneData); }
  catch (error) {
    const message = document.createElement("div");
    message.className = "position-absolute top-50 start-50 translate-middle text-center p-4";
    message.innerHTML = '<i class="bi bi-boxes fs-1 text-info"></i><p class="mt-3 mb-0">3D view unavailable. Check WebGL support and network access to the Three.js CDN.</p>';
    canvas.parentElement.append(message);
    throw error;
  }
}
