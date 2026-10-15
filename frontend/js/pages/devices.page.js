import { mountApp, escapeHTML, toast } from "../core/ui.js";
import { deviceService, demoDevices } from "../services/device.service.js";
import { deviceCard } from "../components/device-card.js";
import { formatPower } from "../energy/unit-formatter.js";
import { showFormDialog } from "../components/confirmation-dialog.js";

mountApp("Devices",`<div class="app-page-title"><div><span class="demo-label">SAMPLE INVENTORY</span><h1 class="mt-3">Devices</h1><p>Review estimated appliance details. Power ratings are illustrative.</p></div><a href="analysis.html" class="btn-outline-soft"><i class="bi bi-stars"></i> Sample analysis</a></div><div class="card-surface panel mb-3"><div class="d-flex flex-wrap gap-3"><input class="form-control flex-grow-1" id="deviceSearch" placeholder="Search devices…" aria-label="Search devices"><select class="form-select" id="categoryFilter" style="max-width:220px"><option value="">All categories</option></select></div></div><div class="row g-3" id="deviceGrid"></div>`);
let devices=await deviceService.list();
const filter=document.querySelector("#categoryFilter");
[...new Set(devices.map((item)=>item.category))].forEach((category)=>filter.insertAdjacentHTML("beforeend",`<option>${escapeHTML(category)}</option>`));
function render(){
  const q=document.querySelector("#deviceSearch").value.toLowerCase();
  const category=filter.value;
  const shown=devices.filter((item)=>item.name.toLowerCase().includes(q)&&(!category||item.category===category));
  document.querySelector("#deviceGrid").innerHTML=shown.length?shown.map((item)=>`<div class="col-sm-6 col-xl-4">${deviceCard(item)}</div>`).join(""):`<div class="col-12"><div class="card-surface empty-state"><h2 class="h5">No matching devices</h2><p>Change the search or category filter.</p></div></div>`;
}
document.querySelector("#deviceSearch").addEventListener("input",render);
filter.addEventListener("change",render);
document.querySelector("#deviceGrid").addEventListener("click",async(event)=>{
  const button=event.target.closest("[data-edit-device]");if(!button)return;
  const device=devices.find((item)=>item.id===button.dataset.editDevice);if(!device)return;
  const values=await showFormDialog({title:`Review ${device.name}`,fields:[{name:"watts",label:"Estimated power (W)",type:"number",min:0,step:1,value:device.watts}]});
  if(!values)return;
  const numeric=Number(values.watts);
  if(!Number.isFinite(numeric)||numeric<0){toast("Power must be a non-negative number.","error");return;}
  try{
    const custom=JSON.parse(localStorage.getItem("visiontwin-device-overrides")||"{}");
    custom[device.id]={...device,watts:numeric,status:"Edited in demo"};
    localStorage.setItem("visiontwin-device-overrides",JSON.stringify(custom));
    devices=devices.map((item)=>item.id===device.id?{...item,watts:numeric,status:"Edited in demo"}:item);render();
    toast(`Updated to ${formatPower(numeric)} in this browser demo.`,"success");
  }catch(error){toast(`Could not save device changes: ${error.message}`,"error");}
});
render();
