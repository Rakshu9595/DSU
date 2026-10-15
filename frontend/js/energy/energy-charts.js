import { renderChart } from "../components/chart-renderer.js";

export function renderEnergyCharts(devices, dailyMultiplier = 1) {
  const colors=["#818cf8","#22d3ee","#34d399","#fbbf24","#fb7185","#c084fc"];
  const labels=devices.map((item)=>item.name);
  const kwh=devices.map((item)=>item.watts*Math.min(24,item.hours*dailyMultiplier)/1000);
  renderChart(document.querySelector("#dailyEnergyChart"),"line",["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],[{label:"Estimated kWh",data:[7.6,8.2,7.9,9.1,8.4,6.8,7.5].map((v)=>v*dailyMultiplier),borderColor:"#22d3ee",backgroundColor:"rgba(34,211,238,.12)"}]);
  renderChart(document.querySelector("#deviceEnergyChart"),"bar",labels,[{label:"Estimated daily kWh",data:kwh,backgroundColor:colors}],{plugins:{legend:{display:false}}});
  renderChart(document.querySelector("#energyMixChart"),"doughnut",labels,[{label:"Share",data:kwh,backgroundColor:colors,borderColor:"transparent"}],{cutout:"68%"});
}
