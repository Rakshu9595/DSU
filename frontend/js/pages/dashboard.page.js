import { mountApp, escapeHTML, toast } from "../core/ui.js";
import { projectService } from "../services/project.service.js";
import { deviceService } from "../services/device.service.js";
import { energyService } from "../services/energy.service.js";
import { recommendationService } from "../services/recommendation.service.js";
import { renderChart } from "../components/chart-renderer.js";
import { formatCurrency } from "../utils/format-number.js";

mountApp("Overview", `<div class="app-page-title"><div><span class="demo-label">DEMO DATA</span><h1 class="mt-3">Good morning, Alex</h1><p>Your sample workspace at a glance. Estimates are illustrative, not meter readings.</p></div><div class="quick-actions"><a class="btn-outline-soft" href="projects.html"><i class="bi bi-buildings"></i> Projects</a><a class="btn-primary-soft" href="upload.html"><i class="bi bi-plus-lg"></i> New room scan</a></div></div><div class="metric-grid" id="dashboardMetrics"></div><div class="dashboard-grid mt-3"><section class="card-surface panel"><div class="panel-heading"><div><h2>Energy trend</h2><small class="text-muted">Illustrative estimated usage · kWh</small></div><span class="badge-soft">Last 7 days</span></div><div class="chart-frame"><canvas id="energyChart" aria-label="Sample energy trend line chart"></canvas></div></section><section class="card-surface panel"><div class="panel-heading"><h2>Appliance usage</h2><span class="badge-soft">Demo</span></div><div class="chart-frame"><canvas id="deviceChart" aria-label="Sample appliance usage chart"></canvas></div></section><section class="card-surface panel"><div class="panel-heading"><h2>Recent projects</h2><a class="small fw-semibold" href="projects.html">View all</a></div><div id="recentProjects"></div></section><section class="card-surface panel"><div class="panel-heading"><h2>Energy ideas</h2><a class="small fw-semibold" href="recommendations.html">Explore</a></div><div id="recommendationsPreview"></div></section></div>`);

try {
  const [projects, devices, energy, recommendations] = await Promise.all([
    projectService.list(), deviceService.list(), energyService.overview(), recommendationService.list()
  ]);
  const metrics = [
    ["Projects", projects.length, "Across your sample workspace", "buildings"],
    ["Mapped devices", devices.length, "Reviewable device estimates", "plug"],
    ["Monthly energy", energy.monthlyKwh.toFixed(0), "Estimated kWh · assumptions apply", "lightning-charge"],
    ["Monthly cost", formatCurrency(energy.monthlyCost), `At ${energy.tariff} per kWh demo tariff`, "currency-rupee"]
  ];
  document.querySelector("#dashboardMetrics").innerHTML = metrics.map(([label,value,detail,icon]) => `<article class="card-surface metric-card"><span class="text-muted small">${label}</span><div class="metric-value">${escapeHTML(value)}</div><div class="small text-muted"><i class="bi bi-${icon} me-1 text-info"></i>${escapeHTML(detail)}</div></article>`).join("");
  document.querySelector("#recentProjects").innerHTML = projects.slice(0,3).map((project) => `<a class="project-row" href="project-details.html?id=${encodeURIComponent(project.id)}"><span class="project-avatar"><i class="bi bi-house"></i></span><span class="flex-grow-1"><strong>${escapeHTML(project.name)}</strong><span class="d-block small text-muted">${escapeHTML(project.room)} · ${escapeHTML(project.location)}</span></span><span class="badge-soft">${escapeHTML(project.status)}</span></a>`).join("");
  document.querySelector("#recommendationsPreview").innerHTML = recommendations.slice(0,3).map((item) => `<div class="recommendation-mini"><span class="icon-tile" style="width:36px;height:36px"><i class="bi bi-${escapeHTML(item.icon)}"></i></span><div><strong class="small">${escapeHTML(item.title)}</strong><div class="small text-muted">Potential ₹${item.savings}/month · estimate</div></div></div>`).join("");
  renderChart(document.querySelector("#energyChart"),"line",["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],[{label:"Estimated kWh",data:[8.4,7.7,9.2,8.1,7.5,6.8,7.9],borderColor:"#818cf8",backgroundColor:"rgba(129,140,248,.14)"}]);
  renderChart(document.querySelector("#deviceChart"),"bar",devices.slice(0,5).map((device)=>device.name.split(" ")[0]),[{label:"Estimated W",data:devices.slice(0,5).map((device)=>device.watts),backgroundColor:["#818cf8","#22d3ee","#34d399","#fbbf24","#fb7185"]}],{plugins:{legend:{display:false}}});
} catch (error) {
  toast(`Dashboard data unavailable: ${error.message}`,"error");
}
