import { mountApp, escapeHTML, toast } from "../core/ui.js";
import { appConfig } from "../config/app-config.js";
import { deviceService } from "../services/device.service.js";
import { calculateEnergy, estimateCost, estimateDeviceSavings } from "../energy/energy-calculator.js";
import { formatCurrency, formatNumber } from "../utils/format-number.js";
import { renderEnergyCharts } from "../energy/energy-charts.js";
import { scenarioService } from "../services/scenario.service.js";

mountApp("Energy analysis",`<div class="app-page-title"><div><span class="demo-label">${appConfig.mode==="demo"?"ESTIMATES · SAMPLE DEVICES":"MODELED ESTIMATES"}</span><h1 class="mt-3">Energy analysis</h1><p>Transparent calculations from device ratings and runtime assumptions — not meter readings.</p></div></div>
<section class="energy-hero" id="energyMetrics" aria-live="polite" aria-busy="true"><p class="small text-muted">Loading energy inputs…</p></section>
<div class="energy-charts">
<section class="card-surface panel"><div class="panel-heading"><div><h2>Estimated daily trend</h2><small class="text-muted">kWh · scaled to the current device/runtime estimate</small></div></div><div class="chart-container"><canvas id="dailyEnergyChart" aria-label="Estimated energy trend line"></canvas></div><details class="chart-data" data-chart-table="dailyEnergyChart"></details></section>
<section class="card-surface panel"><div class="panel-heading"><h2>Energy mix</h2><span class="badge-soft">Estimated share</span></div><div class="chart-container"><canvas id="energyMixChart" aria-label="Device energy mix doughnut chart"></canvas></div><details class="chart-data" data-chart-table="energyMixChart"></details></section>
<section class="card-surface panel"><div class="panel-heading"><div><h2>By appliance</h2><small class="text-muted">Estimated kWh/day</small></div></div><div class="chart-container"><canvas id="deviceEnergyChart" aria-label="Appliance energy bar chart"></canvas></div><details class="chart-data" data-chart-table="deviceEnergyChart"></details></section>
<section class="card-surface panel"><div class="panel-heading"><h2>Adjust assumptions</h2><span class="badge-soft">Saved in this browser</span></div><label class="form-label" for="tariffInput">Electricity tariff (₹ per kWh)</label><input class="form-control mb-1" id="tariffInput" type="number" min="0" step=".1" value="9" inputmode="decimal" aria-describedby="tariffHelp tariffError"><div class="small text-muted mb-3" id="tariffHelp">Used to calculate estimated costs and scenario comparisons.</div><div id="tariffError" class="small text-danger mb-2" role="alert" hidden>Enter a valid non-negative tariff.</div><label class="form-label" for="runtimeInput">Runtime multiplier <span id="runtimeLabel" class="text-info"></span></label><input class="form-range" id="runtimeInput" type="range" min="50" max="150" value="100"><div class="small text-muted">Scaled around the listed device hours/day. Runtime is capped at 24 hours per device.</div><button class="btn-primary-soft mt-3" id="saveAssumptions">Save assumptions</button></section></div>
<section class="card-surface panel mt-3"><div class="panel-heading"><div><h2>Compare scenarios</h2><small class="text-muted">Calculated from this page’s baseline and tariff assumptions</small></div><span class="badge-soft">Illustrative potential only</span></div><div id="scenarioRows" aria-live="polite"></div><p class="small text-muted mb-0 mt-3">Carbon estimate uses a simplified 0.7 kg CO₂e/kWh factor. Actual emissions vary by grid and time. Scenario reductions are assumptions, not guaranteed savings.</p></section>`);

let devices,scenarios,loadError;
try {
  [devices,scenarios]=await Promise.all([deviceService.list(),scenarioService.list()]);
  if(!Array.isArray(devices)||!Array.isArray(scenarios))throw new TypeError("Energy inputs must be returned as device and scenario lists.");
  devices.forEach((item)=>calculateEnergy(item.watts,item.hours));
} catch(error) {
  loadError=error;
  document.querySelector("#energyMetrics").setAttribute("aria-busy","false");
  document.querySelector("#energyMetrics").innerHTML=`<div class="alert alert-warning bg-transparent" role="alert">Energy analysis could not load its inputs: ${escapeHTML(error.message)}</div>`;
  document.querySelector("#scenarioRows").textContent="Scenario comparisons are unavailable until the inputs load.";
  ["tariffInput","runtimeInput","saveAssumptions"].forEach((id)=>{document.querySelector(`#${id}`).disabled=true;});
  toast(`Energy analysis unavailable: ${error.message}`,"error");
}
if(!loadError) {
const tariffInput=document.querySelector("#tariffInput");
const runtimeInput=document.querySelector("#runtimeInput");
tariffInput.value=localStorage.getItem("visiontwin-tariff")||"9";
runtimeInput.value=localStorage.getItem("visiontwin-runtime-multiplier")||"100";

function validTariff() {
  const tariff=Number(tariffInput.value);
  const valid=tariffInput.value.trim()!==""&&Number.isFinite(tariff)&&tariff>=0;
  tariffInput.setAttribute("aria-invalid",String(!valid));
  document.querySelector("#tariffError").hidden=valid;
  return valid?tariff:null;
}
function update() {
  document.querySelector("#energyMetrics").setAttribute("aria-busy","false");
  const tariff=validTariff();
  const multiplier=Number(runtimeInput.value)/100;
  const daily=devices.reduce((sum,item)=>sum+calculateEnergy(item.watts,Math.min(24,item.hours*multiplier)),0);
  const monthly=daily*30;
  document.querySelector("#runtimeLabel").textContent=`${runtimeInput.value}%`;
  document.querySelector("#energyMetrics").innerHTML=[
    ["Daily estimate",`${formatNumber(daily)} kWh`,"Device load × adjusted hours","lightning-charge"],
    ["Monthly estimate",`${formatNumber(monthly)} kWh`,"Daily estimate × 30 days","calendar3"],
    ["Monthly cost",tariff===null?"—":formatCurrency(estimateCost(monthly,tariff)),"At current tariff assumption","currency-rupee"],
    ["Carbon estimate",`${formatNumber(monthly*.7)} kg`,"0.7 kg CO₂e/kWh assumption","cloud"]
  ].map(([label,value,detail,icon])=>`<article class="card-surface metric-card"><div class="small text-muted">${label}</div><div class="metric-value">${escapeHTML(value)}</div><div class="small text-muted"><i class="bi bi-${icon} text-info me-1"></i>${escapeHTML(detail)}</div></article>`).join("");
  renderEnergyCharts(devices,multiplier);
  document.querySelector("#scenarioRows").innerHTML=scenarios.map((item,index)=>{
    const reduction=Number(item.reductionPercent);
    const affectedDevices=Array.isArray(item.affectedDeviceIds)?devices.filter((device)=>item.affectedDeviceIds.includes(device.id)):[];
    const estimate=Number.isFinite(reduction)?estimateDeviceSavings(devices,{deviceIds:item.affectedDeviceIds,reductionPercent:reduction,runtimeMultiplier:multiplier,tariff:tariff??0}):null;
    const scenarioDaily=estimate?daily-estimate.savedDailyKwh:Number(item.dailyKwh);
    const validScenario=Number.isFinite(scenarioDaily)&&scenarioDaily>=0;
    const savings=tariff===null||!validScenario?null:estimate?estimate.monthlySavings:Math.max(0,(daily-scenarioDaily)*30*tariff);
    const title=escapeHTML(item.name||`Scenario ${index+1}`);
    const target=Array.isArray(item.affectedDeviceIds)&&item.affectedDeviceIds.length?affectedDevices.length?` on ${affectedDevices.map((device)=>escapeHTML(device.name)).join(", ")}`:" on unavailable devices":" of modeled total";
    const scenarioLabel=index===0?"Baseline estimate":`Potential estimate${Number.isFinite(reduction)?` · ${Math.max(0,Math.min(100,reduction))}%${target}`:""}`;
    const savingsLabel=!validScenario?"Not available":tariff===null?"Tariff required":index?`~${formatCurrency(savings)}/mo`:"Baseline";
    return `<div class="scenario-row"><div><strong>${title}</strong><div class="small text-muted">${scenarioLabel}</div></div><span class="small">${validScenario?`${formatNumber(scenarioDaily,2)} kWh/day`:"Not provided"}</span><strong class="${index?"text-success":"text-muted"}">${savingsLabel}</strong></div>`;
  }).join("");
}
runtimeInput.addEventListener("input",update);
tariffInput.addEventListener("input",update);
document.querySelector("#saveAssumptions").addEventListener("click",()=>{
  if(validTariff()===null){toast("Tariff must be a valid non-negative number.","error");tariffInput.focus();return;}
  localStorage.setItem("visiontwin-tariff",String(Number(tariffInput.value)));
  localStorage.setItem("visiontwin-runtime-multiplier",runtimeInput.value);
  toast("Assumptions saved in this browser.","success");
});
update();
}
