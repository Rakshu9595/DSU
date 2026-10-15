import { buildRoom } from "./room-builder.js";
import { makeAppliance } from "./appliance-models.js";
import { addRoomLighting } from "./lighting.js";
import { createOrbitControls } from "./camera-controls.js";

export async function createDigitalTwin(canvas) {
  const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d19);
  const camera = new THREE.PerspectiveCamera(45,1,.1,100);
  camera.position.set(7,5.4,8);
  addRoomLighting(THREE,scene);
  buildRoom(THREE,scene);
  const objects = [
    { name:"Sofa", kind:"sofa", position:[0,.08,1.1], color:0x6366f1, watts:0 },
    { name:"Television", kind:"box", position:[-1.75,.4,-1.8], color:0x253c5d, watts:110 },
    { name:"Floor lamp", kind:"lamp", position:[2.2,0,.6], color:0xfbbf24, watts:36 },
    { name:"Indoor plant", kind:"plant", position:[2.35,0,-1.6], color:0x34d399, watts:0 },
    { name:"Air conditioner", kind:"box", position:[-2.4,1.9,-2.15], color:0x94a3b8, watts:1200 }
  ];
  const meshes = [];
  objects.forEach((item) => {
    const model = makeAppliance(THREE,item.kind,item.color);
    model.position.set(...item.position); model.traverse((part) => { if (part.isMesh) part.userData.device = item; });
    scene.add(model); meshes.push(model);
  });
  const controls = await createOrbitControls(THREE,camera,renderer.domElement);
  const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width,rect.height,false);
    camera.aspect = rect.width/rect.height; camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas.parentElement); resize();
  function select(event) {
    const rect=canvas.getBoundingClientRect();
    pointer.x=(event.clientX-rect.left)/rect.width*2-1; pointer.y=-((event.clientY-rect.top)/rect.height*2-1);
    raycaster.setFromCamera(pointer,camera);
    const item=raycaster.intersectObjects(meshes,true).find((hit)=>hit.object.userData.device)?.object.userData.device;
    if (item) canvas.dispatchEvent(new CustomEvent("device-select",{detail:item}));
  }
  canvas.addEventListener("click",select);
  let frame; const animate=()=>{ frame=requestAnimationFrame(animate); controls.update(); renderer.render(scene,camera); }; animate();
  return { scene,camera,controls,objects,models:meshes,dispose(){ cancelAnimationFrame(frame); resizeObserver.disconnect(); canvas.removeEventListener("click",select); controls.dispose(); renderer.dispose(); } };
}
