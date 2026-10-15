import { mountApp, escapeHTML, toast } from "../core/ui.js";
import { recommendationService } from "../services/recommendation.service.js";
import { deviceService } from "../services/device.service.js";
import { calculateEnergy, estimateDeviceSavings } from "../energy/energy-calculator.js";
import { formatCurrency } from "../utils/format-number.js";

mountApp("Recommendations",`<div class="app-page-title"><div><span class="demo-label">ILLUSTRATIVE SUGGESTIONS</span><h1 class="mt-3">Ideas for using less</h1><p>Potential savings are estimates, not guarantees. Demo estimates use the tariff and runtime assumptions on Energy analysis.</p></div><a class="btn-outline-soft" href="energy-analysis.html"><i class="bi bi-sliders"></i> Compare scenarios</a></div><div class="d-flex flex-wrap gap-2 mb-3" id="recommendationFilters" role="group" aria-label="Filter recommendations"><button class="btn-primary-soft" data-filter="all" aria-pressed="true">All ideas</button></div><div class="recommendation-grid" id="recommendationGrid"></div>`);
let items,devices;
try {
  [items,devices]=await Promise.all([recommendationService.list(),deviceService.list()]);
  if(!Array.isArray(items)||!Array.isArray(devices))throw new TypeError("Recommendation and device inputs must be lists.");
  devices.forEach((device)=>calculateEnergy(device.watts,device.hours));
} catch(error) {
  document.querySelector("#recommendationGrid").innerHTML=`<div class="alert alert-warning bg-transparent" role="alert">Recommendations could not be loaded: ${escapeHTML(error.message)}</div>`;
  document.querySelector("#recommendationFilters").hidden=true;
  toast(`Recommendations unavailable: ${error.message}`,"error");
}
if(items&&devices) {
const tariff=Number(localStorage.getItem("visiontwin-tariff")||9);
const runtimeMultiplier=Number(localStorage.getItem("visiontwin-runtime-multiplier")||100)/100;
const categories=["all",...new Set(items.map((item)=>item.category))];
document.querySelector("#recommendationFilters").innerHTML=categories.map((category,index)=>`<button class="${index?"btn-outline-soft":"btn-primary-soft"}" data-filter="${escapeHTML(category)}" aria-pressed="${String(index===0)}">${index?escapeHTML(category):"All ideas"}</button>`).join("");
function render(filter="all"){
  const shown=items.filter((item)=>filter==="all"||item.category===filter);
  document.querySelector("#recommendationGrid").innerHTML=shown.map((item)=>{
    const percentage=Number(item.reductionPercent);
    const estimate=Number.isFinite(percentage)?estimateDeviceSavings(devices,{deviceIds:item.affectedDeviceIds,reductionPercent:percentage,tariff,runtimeMultiplier}):null;
    const savings=estimate?.monthlySavings??(Number.isFinite(Number(item.savings))?Number(item.savings):null);
    const affected=Array.isArray(item.affectedDeviceIds)?devices.filter((device)=>item.affectedDeviceIds.includes(device.id)):[];
    const assumption=estimate?`${Math.max(0,Math.min(100,percentage))}% reduction on ${affected.length?affected.map((device)=>escapeHTML(device.name)).join(", "):"modeled device usage"}; changes with tariff/runtime assumptions.`:savings===null?"No comparable device estimate is available.":"Potential backend estimate; verify against your actual usage.";
    return `<article class="card-surface recommendation-card"><div class="d-flex justify-content-between"><span class="icon-tile"><i class="bi bi-${escapeHTML(item.icon)}"></i></span><span class="badge-soft badge-warning">${escapeHTML(item.priority)}</span></div><span class="eyebrow d-block mt-4">${escapeHTML(item.category)}</span><h2 class="h5 mt-2">${escapeHTML(item.title)}</h2><p class="small">${escapeHTML(item.detail)}</p><div class="savings-number">${savings===null?"—":`~${formatCurrency(savings)}`}<small class="fs-6 text-muted">${savings===null?"":" / month"}</small></div><div class="small text-muted">${assumption}</div><div class="d-flex gap-2 mt-4"><a class="btn-primary-soft flex-grow-1" href="energy-analysis.html">Try a scenario</a><button class="btn-outline-soft" data-feedback="${escapeHTML(item.id)}" aria-label="Mark ${escapeHTML(item.title)} as helpful" aria-pressed="false"><i class="bi bi-hand-thumbs-up"></i></button></div></article>`;
  }).join("");
}
document.querySelector("#recommendationFilters").addEventListener("click",(event)=>{const button=event.target.closest("[data-filter]");if(!button)return;document.querySelectorAll("#recommendationFilters button").forEach((item)=>{const active=item===button;item.className=active?"btn-primary-soft":"btn-outline-soft";item.setAttribute("aria-pressed",String(active));});render(button.dataset.filter);});
document.querySelector("#recommendationGrid").addEventListener("click",async(event)=>{const button=event.target.closest("[data-feedback]");if(!button)return;try{const result=await recommendationService.feedback(button.dataset.feedback,true);button.disabled=true;button.setAttribute("aria-pressed","true");button.innerHTML='<i class="bi bi-check2"></i>';toast(result.demo?"Thanks — feedback was not sent in demo mode.":"Thanks for your feedback.","success");}catch(error){toast(error.message,"error");}});
render();
}
