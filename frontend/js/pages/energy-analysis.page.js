import { mountApp, escapeHTML, toast } from "../core/ui.js";
import { deviceService } from "../services/device.service.js";
import { calculateEnergy, estimateCost } from "../energy/energy-calculator.js";
import { formatCurrency, formatNumber } from "../utils/format-number.js";
import { renderEnergyCharts } from "../energy/energy-charts.js";
import { scenarioService } from "../services/scenario.service.js";

mountApp("Energy analysis",`<div class="app-page-title"><div><span class="demo-label">ESTIMATES · DEMO DATA</span><h1 class="mt-3">Energy analysis</h1><p>Transparent estimates from sample device ratings and runtime assumptions — not meter readings.</p></div></div><section class="energy-hero" id="energyMetrics"></section><div class="energy-charts"><section class="card-surface panel"><div class="panel-heading"><div><h2>Estimated daily trend</h2><small class="text-muted">kWh · illustrative profile</small></div></div><div class="chart-container"><canvas id="dailyEnergyChart" aria-label="Estimated energy trend line"></canvas></div></section><section class="card-surface panel"><div class="panel-heading"><h2>Energy mix</h2><span class="badge-soft">Demo</span></div><div class="chart-container"><canvas id="energyMixChart" aria-label="Device energy mix doughnut chart"></canvas></div></section><section class="card-surface panel"><div class="panel-heading"><h2>By appliance</h2><small class="text-muted">Estimated kWh/day</small></div><div class="chart-container"><canvas id="deviceEnergyChart" aria-label="Appliance energy bar chart"></canvas></div></section><section class="card-surface panel"><div class="panel-heading"><h2>Adjust assumptions</h2><span class="badge-soft">Saved locally</span></div><label class="form-label" for="tariffInput">Electricity tariff (₹ per kWh)</label><input class="form-control mb-3" id="tariffInput" type="number" min="0" step=".1" value="9"><label class="form-label" for="runtimeInput">Runtime multiplier <span id="runtimeLabel" class="text-info"></span></label><input class="form-range" id="runtimeInput" type="range" min="50" max="150" value="100"><div class="small text-muted">Runtime is scaled around the sample hours/day recorded per device.</div><button class="btn-primary-soft mt-3" id="saveAssumptions">Save assumptions</button></section></div><section class="card-surface panel mt-3"><div class="panel-heading"><h2>Compare scenarios</h2><span class="badge-soft">Illustrative potential only</span></div><div id="scenarioRows"></div><p class="small text-muted mb-0 mt-3">Carbon estimate uses a simplified 0.7 kg CO₂e/kWh factor. Actual emissions vary by grid and time.</p></section>`);

const [devices,scenarios]=await Promise.all([deviceService.list(),scenarioService.list()]);
const tariffInput=document.querySelector("#tariffInput");
const runtimeInput=document.querySelector("#runtimeInput");
tariffInput.value=localStorage.getItem("visiontwin-tariff")||"9";
function update(){
  const multiplier=Number(runtimeInput.value)/100;
  const daily=devices.reduce((sum,item)=>sum+calculateEnergy(item.watts,Math.min(24,item.hours*multiplier)),0);
  const monthly=daily*30;
  const tariff=Number(tariffInput.value)||0;
  document.querySelector("#runtimeLabel").textContent=`${runtimeInput.value}%`;
  document.querySelector("#energyMetrics").innerHTML=[
    ["Daily estimate",`${formatNumber(daily)} kWh`,"Calculated from device load × hours","lightning-charge"],
    ["Monthly estimate",`${formatNumber(monthly)} kWh`,"Daily estimate × 30 days","calendar3"],
    ["Monthly cost",formatCurrency(estimateCost(monthly,tariff)),"At current tariff assumption","currency-rupee"],
    ["Carbon estimate",`${formatNumber(monthly*.7)} kg`,"0.7 kg CO₂e/kWh assumption","cloud"]
  ].map(([label,value,detail,icon])=>`<article class="card-surface metric-card"><div class="small text-muted">${label}</div><div class="metric-value">${escapeHTML(value)}</div><div class="small text-muted"><i class="bi bi-${icon} text-info me-1"></i>${detail}</div></article>`).join("");
  renderEnergyCharts(devices,multiplier);
  document.querySelector("#scenarioRows").innerHTML=scenarios.map((item,index)=>{const scenarioDaily=index===0?daily:item.dailyKwh*multiplier;const savings=Math.max(0,(daily-scenarioDaily)*30*tariff);return `<div class="scenario-row"><div><strong>${escapeHTML(item.name)}</strong><div class="small text-muted">${index===0?"Baseline estimate":"Potential scenario; verify comfort and actual usage"}</div></div><span class="small">${formatNumber(scenarioDaily)} kWh/day</span><strong class="${index?"text-success":"text-muted"}">${index?`~${formatCurrency(savings)}/mo`:"Baseline"}</strong></div>`;}).join("");
}
runtimeInput.addEventListener("input",update);
tariffInput.addEventListener("input",update);
document.querySelector("#saveAssumptions").addEventListener("click",()=>{
  if(!Number.isFinite(Number(tariffInput.value))||Number(tariffInput.value)<0){toast("Tariff must be a non-negative number.","error");return;}
  localStorage.setItem("visiontwin-tariff",String(Number(tariffInput.value)));
  localStorage.setItem("visiontwin-runtime-multiplier",runtimeInput.value);
  toast("Demo assumptions saved in this browser.","success");
});
runtimeInput.value=localStorage.getItem("visiontwin-runtime-multiplier")||"100";
update();
