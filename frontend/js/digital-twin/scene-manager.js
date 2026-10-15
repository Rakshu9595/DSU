import { buildRoom } from "./room-builder.js";
import { makeAppliance } from "./appliance-models.js";
import { addRoomLighting } from "./lighting.js";
import { createOrbitControls } from "./camera-controls.js";
import { placeAppliance } from "./appliance-placement.js";

export async function createDigitalTwin(canvas, sceneData = null) {
  const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js");
  if(sceneData&&!sceneData.dimensions)throw new TypeError("The backend scene response is missing room dimensions.");
  const rawDimensions=sceneData?.dimensions||{width:6,depth:4.5,height:2.8};
  const dimensions={width:Number(rawDimensions.width),depth:Number(rawDimensions.depth),height:Number(rawDimensions.height??2.8)};
  const validDimensions=[dimensions.width,dimensions.depth,dimensions.height].every((value)=>Number.isFinite(Number(value))&&Number(value)>0);
  if(!validDimensions)throw new TypeError("The scene response contains invalid room dimensions.");
  const initialObjects=sceneData?sceneData.objects:[
    { name:"Sofa", kind:"sofa", position:[0,.08,1.1], color:0x6366f1, watts:0 },
    { name:"Television", kind:"box", position:[-1.75,.4,-1.8], color:0x253c5d, watts:110 },
    { name:"Floor lamp", kind:"lamp", position:[2.2,0,.6], color:0xfbbf24, watts:36 },
    { name:"Indoor plant", kind:"plant", position:[2.35,0,-1.6], color:0x34d399, watts:0 },
    { name:"Air conditioner", kind:"box", position:[-2.4,1.9,-2.15], color:0x94a3b8, watts:1200 }
  ];
  if(!Array.isArray(initialObjects)||!initialObjects.length)throw new Error("The backend scene has no objects; demo objects will not be substituted in live mode.");
  initialObjects.forEach((item)=>{
    if(!item||typeof item.name!=="string"||typeof item.kind!=="string"||!Array.isArray(item.position)||item.position.length!==3||item.position.some((value)=>!Number.isFinite(Number(value))))throw new TypeError("The scene response contains an invalid object.");
  });
  const sceneObjects=initialObjects.map((item)=>({...item,position:item.position.map(Number),watts:Number(item.watts)||0}));
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d19);
  const camera = new THREE.PerspectiveCamera(45,1,.1,100);
  camera.position.set(7,5.4,8);
  addRoomLighting(THREE,scene);
  let room = buildRoom(THREE,scene,{width:Number(dimensions.width),depth:Number(dimensions.depth),height:Number(dimensions.height)});
  const objects = [];
  const meshes = [];
  const addDevice = (item) => {
    const model = makeAppliance(THREE,item.kind,Number(item.color)||0x64748b);
    model.traverse((part) => { if (part.isMesh) part.userData.device = item; });
    model.userData.device = item;
    placeAppliance(scene,model,item.position); meshes.push(model); objects.push(item);
    return model;
  };
  sceneObjects.forEach(addDevice);
  let controls;
  try {
    controls=await createOrbitControls(THREE,camera,renderer.domElement);
  } catch(error) {
    scene.traverse((part)=>{part.geometry?.dispose();if(Array.isArray(part.material))part.material.forEach((material)=>material.dispose());else part.material?.dispose();});
    renderer.dispose();renderer.forceContextLoss();
    throw error;
  }
  const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width,rect.height,false);
    camera.aspect = rect.width/rect.height; camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas.parentElement); resize();
  let keyboardIndex = -1;
  let contextAvailable=true;
  const announceSelection = (item) => canvas.dispatchEvent(new CustomEvent("device-select",{detail:item}));
  function select(event) {
    const rect=canvas.getBoundingClientRect();
    pointer.x=(event.clientX-rect.left)/rect.width*2-1; pointer.y=-((event.clientY-rect.top)/rect.height*2-1);
    raycaster.setFromCamera(pointer,camera);
    const item=raycaster.intersectObjects(meshes,true).find((hit)=>hit.object.userData.device)?.object.userData.device;
    if (item) { keyboardIndex=objects.indexOf(item); announceSelection(item); }
  }
  canvas.addEventListener("click",select);
  const onKeyDown=(event)=>{
    if (!["ArrowRight","ArrowDown","ArrowLeft","ArrowUp","Enter"," "].includes(event.key) || !objects.length) return;
    event.preventDefault();
    if (event.key==="ArrowRight"||event.key==="ArrowDown") keyboardIndex=(keyboardIndex+1)%objects.length;
    else if (event.key==="ArrowLeft"||event.key==="ArrowUp") keyboardIndex=(keyboardIndex-1+objects.length)%objects.length;
    else if (keyboardIndex<0) keyboardIndex=0;
    announceSelection(objects[keyboardIndex]);
  };
  canvas.addEventListener("keydown",onKeyDown);
  const onContextLost=(event)=>{event.preventDefault();contextAvailable=false;canvas.dispatchEvent(new CustomEvent("webgl-lost"));};
  const onContextRestored=()=>{contextAvailable=true;canvas.dispatchEvent(new CustomEvent("webgl-restored"));};
  canvas.addEventListener("webglcontextlost",onContextLost,false);
  canvas.addEventListener("webglcontextrestored",onContextRestored,false);
  let frame; const animate=()=>{ frame=requestAnimationFrame(animate);if(contextAvailable){controls.update();renderer.render(scene,camera);} }; animate();
  return {
    scene,camera,controls,objects,models:meshes,
    addDevice,
    getDimensions(){return {...room.userData.dimensions};},
    serialize(){return {dimensions:this.getDimensions(),objects:objects.map((item)=>({...item,position:[...item.position]}))};},
    setDimensions(width,depth) {
      scene.remove(room);
      room.traverse((part)=>{part.geometry?.dispose();if(Array.isArray(part.material))part.material.forEach((material)=>material.dispose());else part.material?.dispose();});
      room=buildRoom(THREE,scene,{width,depth,height:room.userData.dimensions.height});
    },
    dispose(){
      cancelAnimationFrame(frame);resizeObserver.disconnect();canvas.removeEventListener("click",select);canvas.removeEventListener("keydown",onKeyDown);
      canvas.removeEventListener("webglcontextlost",onContextLost);canvas.removeEventListener("webglcontextrestored",onContextRestored);controls.dispose();
      scene.traverse((part)=>{part.geometry?.dispose();if(Array.isArray(part.material))part.material.forEach((material)=>material.dispose());else part.material?.dispose();});
      renderer.dispose();renderer.forceContextLoss();
    }
  };
}
