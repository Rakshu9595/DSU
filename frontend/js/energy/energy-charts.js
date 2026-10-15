import { renderChart } from "../components/chart-renderer.js";

export function renderEnergyCharts(devices, dailyMultiplier = 1) {
  const colors=["#818cf8","#22d3ee","#34d399","#fbbf24","#fb7185","#c084fc"];
  const labels=devices.map((item)=>item.name);
  const kwh=devices.map((item)=>item.watts*Math.min(24,item.hours*dailyMultiplier)/1000);
  const totalDaily=kwh.reduce((sum,value)=>sum+value,0);
  const trendFactors=[1.02,.99,1.05,1.01,1.04,.88,1.01];
  const chartData=[
    {id:"dailyEnergyChart",labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],values:trendFactors.map((factor)=>totalDaily*factor),heading:"Estimated daily kWh"},
    {id:"energyMixChart",labels,values:kwh,heading:"Estimated energy share"},
    {id:"deviceEnergyChart",labels,values:kwh,heading:"Estimated kWh per appliance"}
  ];
  chartData.forEach(({id,labels:tableLabels,values,heading})=>{
    const details=document.querySelector(`[data-chart-table="${id}"]`);
    if(details)details.innerHTML=`<summary>View chart data</summary><div class="table-responsive"><table class="table table-sm"><caption class="visually-hidden">${heading} underlying chart data</caption><thead><tr><th scope="col">Category</th><th scope="col">Estimated kWh</th></tr></thead><tbody>${tableLabels.map((label,index)=>`<tr><th scope="row">${String(label).replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}</th><td>${Number(values[index]||0).toFixed(2)}</td></tr>`).join("")}</tbody></table></div>`;
  });
  renderChart(document.querySelector("#dailyEnergyChart"),"line",chartData[0].labels,[{label:"Estimated kWh",data:chartData[0].values,borderColor:"#22d3ee",backgroundColor:"rgba(34,211,238,.12)"}]);
  renderChart(document.querySelector("#deviceEnergyChart"),"bar",labels,[{label:"Estimated daily kWh",data:kwh,backgroundColor:colors}],{plugins:{legend:{display:false}}});
  renderChart(document.querySelector("#energyMixChart"),"doughnut",labels,[{label:"Share",data:kwh,backgroundColor:colors,borderColor:"transparent"}],{cutout:"68%"});
}
