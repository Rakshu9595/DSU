import { mountApp, escapeHTML, toast } from "../core/ui.js";
import { reportService } from "../services/report.service.js";
import { formatDate } from "../utils/format-date.js";
import { showDetailsDialog } from "../components/confirmation-dialog.js";

mountApp("Reports",`<div class="app-page-title"><div><span class="demo-label">DEMO REPORT LIST</span><h1 class="mt-3">Reports</h1><p>Download sample CSV data or connect the backend for generated reports and PDFs.</p></div><button class="btn-primary-soft" id="generateReport"><i class="bi bi-file-earmark-plus"></i> Generate report</button></div><section class="card-surface panel"><div class="d-flex flex-wrap gap-3 justify-content-between mb-3"><input class="form-control" id="reportSearch" placeholder="Search reports…" style="max-width:380px"><select class="form-select" id="reportStatus" style="max-width:200px"><option value="">All statuses</option><option>Sample</option><option>Ready</option><option>Processing</option></select></div><div id="reportList"></div></section>`);
let reports=await reportService.list();
function render(){
  const q=document.querySelector("#reportSearch").value.trim().toLowerCase();
  const status=document.querySelector("#reportStatus").value;
  const matches=reports.filter((report)=>report.name.toLowerCase().includes(q)&&(!status||report.status===status));
  document.querySelector("#reportList").innerHTML=matches.length?matches.map((report)=>`<article class="report-row"><div><strong>${escapeHTML(report.name)}</strong><div class="small text-muted">${escapeHTML(report.kind)} · ${formatDate(report.createdAt)}</div></div><span class="badge-soft badge-warning">${escapeHTML(report.status)}</span><div class="d-flex flex-wrap gap-2"><button class="btn-quiet" data-details="${escapeHTML(report.id)}">Details</button><button class="btn-outline-soft" data-download="csv" data-id="${escapeHTML(report.id)}" aria-label="Download sample CSV"><i class="bi bi-filetype-csv"></i> CSV</button><button class="btn-outline-soft" data-download="pdf" data-id="${escapeHTML(report.id)}" aria-label="Download PDF"><i class="bi bi-filetype-pdf"></i> PDF</button></div></article>`).join(""):`<div class="empty-state"><span class="icon-tile"><i class="bi bi-file-earmark"></i></span><h2 class="h5 mt-3">No reports match</h2><p>Adjust your search or filters.</p></div>`;
}
document.querySelector("#reportSearch").addEventListener("input",render);
document.querySelector("#reportStatus").addEventListener("change",render);
document.querySelector("#reportList").addEventListener("click",async(event)=>{
  const button=event.target.closest("[data-download]");if(!button)return;
  try{await reportService.download(button.dataset.id,button.dataset.download);if(button.dataset.download==="csv")toast("Downloaded a clearly labeled demo CSV.","success");}
  catch(error){toast(error.message,"error");}
});
document.querySelector("#reportList").addEventListener("click",async(event)=>{
  const button=event.target.closest("[data-details]");if(!button)return;
  const report=reports.find((item)=>item.id===button.dataset.details);
  if(report) await showDetailsDialog(report.name,`${report.kind} · ${formatDate(report.createdAt)} · ${report.status}. This is a sample report record; no real analysis report has been generated.`);
});
document.querySelector("#generateReport").addEventListener("click",()=>toast("Report generation requires the reports backend. No report was created."));
render();
