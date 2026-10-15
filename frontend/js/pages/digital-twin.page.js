import { mountApp, toast } from "../core/ui.js";
import { initializeTwin } from "../digital-twin/renderer.js";
import { bindTwinSelection } from "../digital-twin/interaction.js";
import { resetCamera } from "../digital-twin/scene-editor.js";
import { setEnergyVisualization } from "../digital-twin/energy-visualization.js";
import { scenarioImpact } from "../digital-twin/scenario-view.js";
import { digitalTwinService } from "../services/digital-twin.service.js";
import { appConfig } from "../config/app-config.js";

mountApp("Digital twin",`<div class="app-page-title"><div><span class="demo-label">${appConfig.mode==="demo"?"PROCEDURAL 3D DEMO":"CONNECTED SCENE"}</span><h1 class="mt-3">Digital twin</h1><p>${appConfig.mode==="demo"?"Interactive illustrative room model. Objects are procedural, not AI-detected from a real video.":"Interactive model uses only room dimensions and objects returned by the configured backend."}</p></div><button id="saveScene" class="btn-outline-soft"><i class="bi bi-cloud-check"></i> Save scene</button></div><div class="twin-layout"><section class="twin-stage"><canvas id="twinCanvas" tabindex="0" role="application" aria-label="Interactive 3D room. Use mouse or touch to orbit and zoom; focus this view and press arrow keys to select devices."></canvas><div class="twin-tools"><button id="resetCamera"><i class="bi bi-arrow-counterclockwise"></i> Reset view</button><button id="energyToggle" aria-pressed="false"><i class="bi bi-lightning-charge"></i> Energy view</button></div></section><aside class="twin-panel card-surface panel"><div class="panel-heading"><h2>Selected object</h2><span class="badge-soft">${appConfig.mode==="demo"?"Demo model":"Backend model"}</span></div><p id="selectedObject" class="text-muted" aria-live="polite">Select an object in the room or use arrow keys while the 3D view is focused.</p><hr style="border-color:var(--border)"><h3 class="h6">Add appliance</h3><label class="small form-label" for="applianceKind">Procedural model</label><div class="d-flex gap-2"><select id="applianceKind" class="form-select"><option value="lamp">Floor lamp</option><option value="box">Appliance unit</option><option value="plant">Indoor plant</option></select><button id="addAppliance" class="btn-outline-soft flex-shrink-0">Add</button></div><hr style="border-color:var(--border)"><h3 class="h6">Room dimensions</h3><p class="small text-muted">Dimensions shown for this ${appConfig.mode==="demo"?"illustrative":"backend-provided"} scene (metres).</p><div class="row g-2"><div class="col"><label class="small form-label" for="roomWidth">Width</label><input id="roomWidth" class="form-control" type="number" min="2" max="12" step=".5" value="6"></div><div class="col"><label class="small form-label" for="roomDepth">Depth</label><input id="roomDepth" class="form-control" type="number" min="2" max="12" step=".5" value="4.5"></div></div><button id="applyDimensions" class="btn-outline-soft w-100 mt-3">Apply to preview</button><hr style="border-color:var(--border)"><h3 class="h6">What-if energy scenario</h3><label class="small form-label" for="scenarioReduction">Illustrative reduction <span id="scenarioLabel">0%</span></label><input id="scenarioReduction" class="form-range" type="range" min="0" max="30" value="0"><p id="scenarioImpact" class="small text-muted mb-0" aria-live="polite">Scenario values are illustrative only.</p><hr style="border-color:var(--border)"><div class="small text-muted"><i class="bi bi-mouse me-2"></i>Drag to rotate · scroll/pinch to zoom · tap an object to select · arrow keys to cycle</div></aside></div><div id="twinStatus" class="small text-muted mt-2" role="status" aria-live="polite"></div>`);

const canvas=document.querySelector("#twinCanvas");
let twin;
let storedScene;
try {
  storedScene=await digitalTwinService.getScene();
  twin=await initializeTwin(canvas,appConfig.mode==="demo"?null:storedScene);
  const sceneDimensions=twin.getDimensions();
  document.querySelector("#roomWidth").value=String(sceneDimensions.width);
  document.querySelector("#roomDepth").value=String(sceneDimensions.depth);
  document.querySelector("#twinStatus").textContent=appConfig.mode==="demo"?"Interactive procedural sample scene ready. Preview changes are not saved.":"Connected backend scene loaded.";
  bindTwinSelection(canvas,document.querySelector("#selectedObject"));
  document.querySelector("#resetCamera").addEventListener("click",()=>resetCamera(twin.camera,twin.controls));
  let energyOn=false;
  const reductionInput=document.querySelector("#scenarioReduction");
  const updateEnergyView=()=>{
    setEnergyVisualization(twin.models,energyOn,Number(reductionInput.value));
    document.querySelector("#scenarioLabel").textContent=`${reductionInput.value}%`;
    const totalWatts=twin.objects.reduce((sum,item)=>sum+(Number(item.watts)||0),0);
    const impact=scenarioImpact(totalWatts/1000*4,Number(reductionInput.value));
    document.querySelector("#scenarioImpact").textContent=`Illustration only: ${impact.projected.toFixed(2)} kWh/day versus ${impact.baseline.toFixed(2)} kWh/day, based on a simplified 4-hour average. Not measured usage or a guaranteed saving.`;
  };
  reductionInput.addEventListener("input",updateEnergyView);
  document.querySelector("#energyToggle").addEventListener("click",(event)=>{
    energyOn=!energyOn; updateEnergyView();
    event.currentTarget.setAttribute("aria-pressed",String(energyOn));
    event.currentTarget.innerHTML=`<i class="bi bi-lightning-charge"></i> ${energyOn?"Hide energy view":"Energy view"}`;
    toast(energyOn?"Colors visualize illustrative rated power, not measured usage.":"Energy view disabled.");
  });
  document.querySelector("#applyDimensions").addEventListener("click",()=>{
    const width=Number(document.querySelector("#roomWidth").value),depth=Number(document.querySelector("#roomDepth").value);
    if(!Number.isFinite(width)||!Number.isFinite(depth)||width<2||width>12||depth<2||depth>12){toast("Room dimensions must be between 2 and 12 metres.","error");return;}
    twin.setDimensions(width,depth);
    document.querySelector("#twinStatus").textContent=`Preview dimensions adjusted to ${width} × ${depth} m. This change is not saved.`;
  });
  document.querySelector("#addAppliance").addEventListener("click",()=>{
    const kind=document.querySelector("#applianceKind").value;
    const count=twin.objects.filter((item)=>item.kind===kind).length;
    const item={name:`${kind==="box"?"Appliance unit":kind==="lamp"?"Floor lamp":"Indoor plant"} ${count+1}`,kind,category:"User-added procedural model",position:[-1+(count%4)*.45,0,1.2+Math.floor(count/4)*.45],color:kind==="lamp"?0xfbbf24:kind==="plant"?0x34d399:0x64748b,watts:kind==="lamp"?36:kind==="box"?120:0};
    twin.addDevice(item);
    if(energyOn)updateEnergyView();
    document.querySelector("#twinStatus").textContent=`Added ${item.name} to the room preview. Save the scene to persist it.`;
    toast(`${item.name} added to the preview.`);
  });
  canvas.addEventListener("webgl-lost",()=>{document.querySelector("#twinStatus").textContent="The browser lost the WebGL context. Try reloading the page to restore the 3D preview.";});
  canvas.addEventListener("webgl-restored",()=>{document.querySelector("#twinStatus").textContent="WebGL context restored.";});
  updateEnergyView();
} catch(error) {
  document.querySelector("#twinStatus").textContent=`3D preview could not be initialized: ${error.message}`;
  ["resetCamera","energyToggle","addAppliance","applyDimensions","scenarioReduction"].forEach((id)=>{document.querySelector(`#${id}`).disabled=true;});
}
document.querySelector("#saveScene").addEventListener("click",async()=>{
  try{
    if(!twin)throw new Error("The 3D scene is not available to save.");
    await digitalTwinService.saveScene({id:storedScene?.id||"demo-room",...twin.serialize()});
    toast("Scene saved by the configured backend.","success");
  }
  catch(error){toast(error.message,"error");}
});
window.addEventListener("beforeunload",()=>twin?.dispose());
