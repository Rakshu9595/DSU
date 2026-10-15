import { mountApp, toast } from "../core/ui.js";
import { initializeTwin } from "../digital-twin/renderer.js";
import { bindTwinSelection } from "../digital-twin/interaction.js";
import { resetCamera } from "../digital-twin/scene-editor.js";
import { setEnergyVisualization } from "../digital-twin/energy-visualization.js";
import { digitalTwinService } from "../services/digital-twin.service.js";

mountApp("Digital twin",`<div class="app-page-title"><div><span class="demo-label">PROCEDURAL 3D DEMO</span><h1 class="mt-3">Digital twin</h1><p>Interactive illustrative room model. Objects are procedural, not AI-detected from a real video.</p></div><button id="saveScene" class="btn-outline-soft"><i class="bi bi-cloud-check"></i> Save scene</button></div><div class="twin-layout"><section class="twin-stage"><canvas id="twinCanvas" aria-label="Interactive 3D room; use mouse or touch to rotate and zoom"></canvas><div class="twin-tools"><button id="resetCamera"><i class="bi bi-arrow-counterclockwise"></i> Reset view</button><button id="energyToggle"><i class="bi bi-lightning-charge"></i> Energy view</button></div></section><aside class="twin-panel card-surface panel"><div class="panel-heading"><h2>Selected object</h2><span class="badge-soft">Demo model</span></div><p id="selectedObject" class="text-muted">Select an object in the room to inspect it.</p><hr style="border-color:var(--border)"><h3 class="h6">Room dimensions</h3><p class="small text-muted">Dimensions shown for this illustrative scene (metres).</p><div class="row g-2"><div class="col"><label class="small form-label" for="roomWidth">Width</label><input id="roomWidth" class="form-control" type="number" min="2" max="12" step=".5" value="6"></div><div class="col"><label class="small form-label" for="roomDepth">Depth</label><input id="roomDepth" class="form-control" type="number" min="2" max="12" step=".5" value="4.5"></div></div><button id="applyDimensions" class="btn-outline-soft w-100 mt-3">Apply to preview</button><hr style="border-color:var(--border)"><div class="small text-muted"><i class="bi bi-mouse me-2"></i>Drag to rotate · scroll to zoom · tap an object to select</div></aside></div><div id="twinStatus" class="small text-muted mt-2" role="status" aria-live="polite"></div>`);

const canvas=document.querySelector("#twinCanvas");
let twin;
try {
  await digitalTwinService.getScene();
  twin=await initializeTwin(canvas);
  bindTwinSelection(canvas,document.querySelector("#selectedObject"));
  document.querySelector("#resetCamera").addEventListener("click",()=>resetCamera(twin.camera,twin.controls));
  let energyOn=false;
  document.querySelector("#energyToggle").addEventListener("click",(event)=>{
    energyOn=!energyOn; setEnergyVisualization(twin.models,energyOn);
    event.currentTarget.innerHTML=`<i class="bi bi-lightning-charge"></i> ${energyOn?"Hide energy view":"Energy view"}`;
    toast(energyOn?"Energy visualization is illustrative.":"Energy view disabled.");
  });
  document.querySelector("#applyDimensions").addEventListener("click",()=>{
    const width=Number(document.querySelector("#roomWidth").value),depth=Number(document.querySelector("#roomDepth").value);
    if(width<2||width>12||depth<2||depth>12){toast("Room dimensions must be between 2 and 12 metres.","error");return;}
    const room=twin.scene.children.find((child)=>child.userData.dimensions);
    if(room){room.scale.set(width/6,1,depth/4.5);room.userData.dimensions={width,depth,height:2.8};}
    document.querySelector("#twinStatus").textContent=`Preview dimensions adjusted to ${width} × ${depth} m. This change is not saved.`;
  });
} catch(error) {
  document.querySelector("#twinStatus").textContent=error.message;
}
document.querySelector("#saveScene").addEventListener("click",async()=>{
  try{await digitalTwinService.saveScene({id:"demo-room"});toast("Scene saved.","success");}
  catch(error){toast(error.message,"error");}
});
window.addEventListener("beforeunload",()=>twin?.dispose());
