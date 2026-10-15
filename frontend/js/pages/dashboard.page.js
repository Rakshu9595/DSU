import { mountApp, escapeHTML, toast } from "../core/ui.js";
import { appConfig } from "../config/app-config.js";
import { projectService } from "../services/project.service.js";
import { deviceService } from "../services/device.service.js";
import { energyService } from "../services/energy.service.js";
import { recommendationService } from "../services/recommendation.service.js";
import { renderChart } from "../components/chart-renderer.js";
import { estimateDeviceSavings } from "../energy/energy-calculator.js";
import { formatCurrency } from "../utils/format-number.js";

const chartRanges = {
  "7d": { label:"Last 7 days", days:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], values:[8.4,7.7,9.2,8.1,7.5,6.8,7.9] },
  "30d": { label:"Last 30 days", days:["Week 1","Week 2","Week 3","Week 4"], values:[57.4,53.8,60.2,51.6] }
};

mountApp("Overview", `<div class="app-page-title"><div><span class="demo-label">${appConfig.mode==="demo"?"DEMO DATA":"CONNECTED WORKSPACE"}</span><h1 class="mt-3">Workspace overview</h1><p>${appConfig.mode==="demo"?"Your sample workspace at a glance. Energy values are estimates, not meter readings.":"Your connected workspace at a glance. Energy metrics are provided by the configured service."}</p></div><div class="quick-actions"><a class="btn-outline-soft" href="projects.html"><i class="bi bi-buildings"></i> Projects</a><a class="btn-primary-soft" href="upload.html"><i class="bi bi-plus-lg"></i> New room scan</a></div></div>
<div class="metric-grid" id="dashboardMetrics" aria-label="Workspace metrics" aria-busy="true">${Array.from({length:4},()=>'<article class="card-surface metric-card skeleton-card"><span class="skeleton-line w-50"></span><span class="skeleton-line skeleton-value"></span><span class="skeleton-line w-75"></span></article>').join("")}</div>
<div class="dashboard-grid mt-3">
<section class="card-surface panel"><div class="panel-heading"><div><h2>Energy trend</h2><small class="text-muted">${appConfig.mode==="demo"?"Sample illustrative profile · not measured · kWh":"Illustrative profile · not a measured time series · kWh"}</small></div><div class="btn-group btn-group-sm" role="group" aria-label="Energy chart time range"><button type="button" class="btn-outline-soft chart-range active" data-range="7d" aria-pressed="true">7 days</button><button type="button" class="btn-outline-soft chart-range" data-range="30d" aria-pressed="false">30 days</button></div></div><div class="chart-frame"><canvas id="energyChart" aria-label="Illustrative estimated energy trend chart, not measured"></canvas></div><details class="dashboard-chart-data" id="dashboardEnergyData"><summary>View chart data</summary><div></div></details><p class="chart-accessible-note">These illustrative usage values are not a measured time series. Select a range above.</p></section>
<section class="card-surface panel"><div class="panel-heading"><div><h2>Appliance usage</h2><small class="text-muted">${appConfig.mode==="demo"?"Sample device ratings":"Device ratings from the connected list"}</small></div><span class="badge-soft">${appConfig.mode==="demo"?"Demo":"Device data"}</span></div><div class="chart-frame"><canvas id="deviceChart" aria-label="Appliance rated power chart"></canvas></div><details class="dashboard-chart-data" id="dashboardDeviceData"><summary>View device ratings</summary><div></div></details></section>
<section class="card-surface panel"><div class="panel-heading"><h2>Recent projects</h2><a class="small fw-semibold" href="projects.html">View all</a></div><div id="recentProjects"><div class="skeleton-line w-100 mb-3"></div><div class="skeleton-line w-75 mb-3"></div><div class="skeleton-line w-50"></div></div></section>
<section class="card-surface panel"><div class="panel-heading"><h2>Energy ideas</h2><a class="small fw-semibold" href="recommendations.html">Explore</a></div><div id="recommendationsPreview"><div class="skeleton-line w-100 mb-3"></div><div class="skeleton-line w-75"></div></div></section>
<section class="card-surface panel"><div class="panel-heading"><div><h2>Workspace activity</h2><small class="text-muted">Illustrative sample timeline</small></div><span class="badge-soft">Demo</span></div><div class="activity-timeline" id="activityTimeline"></div></section>
<section class="card-surface panel dashboard-spotlight"><span class="icon-tile"><i class="bi bi-stars"></i></span><h2 class="h5 mt-3">Make your next scan count</h2><p class="small text-muted">A steady walkthrough helps the demo workflow show how room inventory and energy estimates fit together.</p><a class="btn-primary-soft" href="upload.html">Start a room scan <i class="bi bi-arrow-right"></i></a></section>
</div>`);

const countUp = (element, target, format) => {
  const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700;
  const start = performance.now();
  const tick = (now) => {
    const progress = duration ? Math.min(1,(now-start)/duration) : 1;
    element.textContent = format(target * (1 - Math.pow(1-progress,3)));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
let energyChart;
function renderAccessibleTable(container,labels,values,unit) {
  container.querySelector("div").innerHTML=`<div class="table-responsive"><table class="table table-sm"><caption class="visually-hidden">${unit} underlying chart data</caption><thead><tr><th scope="col">Period/device</th><th scope="col">${unit}</th></tr></thead><tbody>${labels.map((label,index)=>`<tr><th scope="row">${escapeHTML(label)}</th><td>${escapeHTML(values[index])}</td></tr>`).join("")}</tbody></table></div>`;
}
async function loadDashboard() {
  try {
    const [projects,devices,energy,recommendations] = await Promise.all([
      projectService.list(), deviceService.list(), energyService.overview(), recommendationService.list()
    ]);
    if(!Array.isArray(projects)||!Array.isArray(devices)||!Array.isArray(recommendations))throw new TypeError("Dashboard services must return lists for projects, devices, and recommendations.");
    if(!energy||!Number.isFinite(Number(energy.monthlyKwh))||!Number.isFinite(Number(energy.monthlyCost))||Number(energy.monthlyKwh)<0||Number(energy.monthlyCost)<0)throw new TypeError("Energy service must return non-negative monthly energy and cost values.");
    devices.forEach((device)=>{if(!Number.isFinite(Number(device.watts))||Number(device.watts)<0)throw new TypeError("Device data is missing a valid rated-power value.");});
    const metrics = [
      ["Projects",projects.length,appConfig.mode==="demo"?"Across your sample workspace":"Projects returned by the service","buildings",(n)=>Math.round(n)],
      ["Mapped devices",devices.length,appConfig.mode==="demo"?"Reviewable sample device ratings":"Devices returned by the service","plug",(n)=>Math.round(n)],
      ["Monthly energy",Number(energy.monthlyKwh),appConfig.mode==="demo"?"Estimated kWh · assumptions apply":"Monthly kWh from energy service","lightning-charge",(n)=>Math.round(n).toLocaleString()],
      ["Monthly cost",Number(energy.monthlyCost),appConfig.mode==="demo"?`At ${energy.tariff} per kWh demo tariff`:"Monthly cost from energy service","currency-rupee",(n)=>formatCurrency(n)]
    ];
    const metricRoot=document.querySelector("#dashboardMetrics");
    metricRoot.innerHTML=metrics.map(([label,,detail,icon])=>`<article class="card-surface metric-card"><span class="text-muted small">${escapeHTML(label)}</span><div class="metric-value" data-metric="${escapeHTML(label)}">0</div><div class="small text-muted"><i class="bi bi-${icon} me-1 text-info"></i>${escapeHTML(detail)}</div></article>`).join("");
    metricRoot.setAttribute("aria-busy","false");
    metrics.forEach(([label,value,,,format])=>{const node=metricRoot.querySelector(`[data-metric="${CSS.escape(label)}"]`);if(node)countUp(node,Number(value)||0,format);});
    document.querySelector("#recentProjects").innerHTML=projects.length?projects.slice(0,3).map((project)=>`<a class="project-row" href="project-details.html?id=${encodeURIComponent(project.id)}"><span class="project-avatar"><i class="bi bi-house"></i></span><span class="flex-grow-1"><strong>${escapeHTML(project.name)}</strong><span class="d-block small text-muted">${escapeHTML(project.room)} · ${escapeHTML(project.location)}</span></span><span class="badge-soft">${escapeHTML(project.status)}</span></a>`).join(""):'<p class="small text-muted mb-0">No projects in this workspace yet.</p>';
    const recommendationTariff=Number(localStorage.getItem("visiontwin-tariff")||energy.tariff||9);
    document.querySelector("#recommendationsPreview").innerHTML=recommendations.length?recommendations.slice(0,3).map((item)=>{const percent=Number(item.reductionPercent);const estimate=Number.isFinite(percent)&&Number.isFinite(recommendationTariff)&&recommendationTariff>=0?estimateDeviceSavings(devices,{deviceIds:item.affectedDeviceIds,reductionPercent:percent,tariff:recommendationTariff,runtimeMultiplier:Number(localStorage.getItem("visiontwin-runtime-multiplier")||100)/100}):null;const savings=estimate?.monthlySavings??(Number.isFinite(Number(item.savings))?Number(item.savings):null);return `<div class="recommendation-mini"><span class="icon-tile" style="width:36px;height:36px"><i class="bi bi-${escapeHTML(item.icon)}"></i></span><div><strong class="small">${escapeHTML(item.title)}</strong><div class="small text-muted">${savings===null?"Potential savings unavailable":`Potential ${formatCurrency(savings)}/month · estimate`}</div></div></div>`;}).join(""):'<p class="small text-muted mb-0">No suggestions are available.</p>';
    document.querySelector("#activityTimeline").innerHTML=[
      ["bi-house-add","Room profile created","Demo workspace · Today"],
      ["bi-camera-video","Walkthrough upload flow explored","No file uploaded · Demo"],
      ["bi-lightning-charge","Energy assumptions reviewed","Illustrative calculations · Demo"]
    ].map(([icon,title,detail])=>`<div class="activity-item"><span class="activity-icon"><i class="bi ${icon}"></i></span><div><strong>${title}</strong><span>${detail}</span></div></div>`).join("");
    const paintTrend=(range)=> {
      const selected=chartRanges[range]||chartRanges["7d"];
      energyChart=renderChart(document.querySelector("#energyChart"),"line",selected.days,[{label:"Estimated kWh",data:selected.values,borderColor:"#818cf8",backgroundColor:"rgba(129,140,248,.14)",pointBackgroundColor:"#a5b4fc",pointRadius:4,pointHoverRadius:6}]);
      renderAccessibleTable(document.querySelector("#dashboardEnergyData"),selected.days,selected.values.map((value)=>value.toFixed(1)),"kWh · illustrative sample");
      document.querySelectorAll(".chart-range").forEach((button)=>{const active=button.dataset.range===range;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));});
    };
    document.querySelector(".panel .chart-range")?.closest(".panel-heading")?.parentElement?.addEventListener("click",(event)=>{const button=event.target.closest("[data-range]");if(button)paintTrend(button.dataset.range);});
    paintTrend("7d");
    const chartDevices=devices.slice(0,5);
    const deviceLabels=chartDevices.map((device)=>device.name);
    const deviceValues=chartDevices.map((device)=>Number(device.watts));
    renderAccessibleTable(document.querySelector("#dashboardDeviceData"),deviceLabels,deviceValues.map((value)=>String(value)),"Rated power · watts");
    renderChart(document.querySelector("#deviceChart"),"bar",deviceLabels,[{label:"Rated power · W",data:deviceValues,backgroundColor:["#818cf8","#22d3ee","#34d399","#fbbf24","#fb7185"]}],{plugins:{legend:{display:false}}});
  } catch(error) {
    const metricRoot=document.querySelector("#dashboardMetrics");
    metricRoot.setAttribute("aria-busy","false");
    metricRoot.innerHTML=`<div class="alert alert-warning bg-transparent mb-0" role="alert">Dashboard data could not be loaded: ${escapeHTML(error.message)}</div>`;
    toast(`Dashboard data unavailable: ${error.message}`,"error");
  }
}
loadDashboard();
