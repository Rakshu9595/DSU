import { mountApp, escapeHTML, toast } from "../core/ui.js";
import { appConfig } from "../config/app-config.js";
import { analysisService } from "../services/analysis.service.js";
import { normalizeAnalysis } from "../analysis/result-normalizer.js";
import { summarizeDetections } from "../analysis/summary-renderer.js";
import { drawDetectionBoxes } from "../analysis/detection-overlay.js";
import { pollJobStatus } from "../analysis/job-poller.js";
import { formatDate } from "../utils/format-date.js";

const query=new URLSearchParams(location.search);
const demoMode=appConfig.mode==="demo"||query.get("demo")==="1";
const jobId=query.get("id");
mountApp("AI analysis",`<div class="app-page-title"><div><span class="demo-label">${demoMode?"INTERACTIVE SAMPLE":"LIVE BACKEND JOB"}</span><h1 class="mt-3">Room analysis</h1><p>${demoMode?"Preset illustrative results only. No video was uploaded or processed by AI.":"Results below are shown only after the configured backend confirms job completion."}</p></div><div class="quick-actions"><a class="btn-outline-soft" href="devices.html">View devices</a><a class="btn-primary-soft" href="energy-analysis.html">Energy analysis <i class="bi bi-arrow-right"></i></a></div></div>
<section class="card-surface panel mb-3" id="jobStatusPanel"><div class="d-flex justify-content-between flex-wrap gap-2"><strong>${demoMode?"Illustrative demo analysis":`Analysis job · ${escapeHTML(jobId||"No job ID")}`}</strong><span class="badge-soft">${demoMode?"DEMO":jobId?"Waiting":"Missing job ID"}</span></div><div class="progress mt-3" role="progressbar" aria-label="Analysis job progress" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"><div id="jobProgressBar" class="progress-bar bg-info" style="width:0%"></div></div><div class="d-flex justify-content-between small text-muted mt-2"><span id="jobMessage" aria-live="polite">${demoMode?"Displaying clearly labeled sample results.":"Connecting to the configured analysis service…"}</span><button id="cancelPolling" class="btn-outline-soft btn-sm" type="button" ${demoMode?"hidden":""}>Stop checking</button></div></section><div id="analysisView" aria-live="polite"></div>`);

const analysisRoot=document.querySelector("#analysisView");
const jobMessage=document.querySelector("#jobMessage");
const progressBar=document.querySelector("#jobProgressBar");
const cancelButton=document.querySelector("#cancelPolling");
let pollingController;

function safeFrameSource(value) {
  if(typeof value!=="string"||!value.trim())return null;
  try {
    const url=new URL(value,location.href);
    return url.protocol==="https:"||url.origin===location.origin?url.href:null;
  } catch { return null; }
}
function setJobProgress(percent,label) {
  const value=Math.max(0,Math.min(100,Number(percent)||0));
  progressBar.style.width=`${value}%`;
  document.querySelector("#jobStatusPanel .progress").setAttribute("aria-valuenow",String(value));
  jobMessage.textContent=label;
}
function renderAnalysis(rawResult,{demo=false}={}) {
  const result=normalizeAnalysis(rawResult);
  const summary=summarizeDetections(result.detections);
  const source=safeFrameSource(result.frameUrl||result.frame?.url);
  const sourceMarkup=source?`<img class="analysis-frame" src="${escapeHTML(source)}" alt="Frame returned by the analysis backend">`:demo?'<div class="analysis-demo-scene" aria-hidden="true"></div>':'<div class="position-absolute top-50 start-50 translate-middle text-center text-muted small">No source frame was provided.</div>';
  analysisRoot.innerHTML=`<div class="metric-grid mb-3"><article class="card-surface metric-card"><span class="small text-muted">Appliances detected</span><div class="metric-value">${summary.appliances}</div></article><article class="card-surface metric-card"><span class="small text-muted">Fittings detected</span><div class="metric-value">${summary.fittings}</div></article><article class="card-surface metric-card"><span class="small text-muted">Average confidence</span><div class="metric-value">${result.summary.avgConfidence==null?"N/A":`${result.summary.avgConfidence}%`}</div></article><article class="card-surface metric-card"><span class="small text-muted">Result source</span><div class="metric-value fs-4">${demo?"Sample":"Backend"}</div></article></div>
<div class="dashboard-grid"><section class="card-surface panel"><div class="panel-heading"><h2>Frame preview</h2><span class="badge-soft">${demo?"Synthetic demo frame":source?"Backend frame":"No frame"}</span></div><div class="analysis-visual"><div class="analysis-room" id="detectionOverlay">${sourceMarkup}</div></div><p class="small text-muted mt-3">${demo?"Synthetic illustration and invented sample coordinates only; no real frame was uploaded or analyzed.":source?"Bounding boxes are drawn only for backend-provided normalized coordinates.":"Detection boxes require a backend frame and normalized coordinates."}</p></section><section class="card-surface panel"><div class="panel-heading"><h2>Detection details</h2><span class="badge-soft">${result.detections.length} entries</span></div>${result.detections.length?`<div class="table-responsive"><table class="table table-dark table-hover align-middle analysis-table"><caption class="visually-hidden">Detected objects, category, count, confidence and illustrative rated power</caption><thead><tr><th scope="col">Object</th><th scope="col">Category</th><th scope="col">Count</th><th scope="col">Confidence</th><th scope="col">Power*</th></tr></thead><tbody>${result.detections.map((item)=>`<tr><th scope="row">${escapeHTML(item.name)}</th><td>${escapeHTML(item.category)}</td><td>${item.count??"—"}</td><td><span class="badge-soft ${Number.isFinite(item.confidence)?item.confidence<.75?"badge-warning":"badge-success":""}">${Number.isFinite(item.confidence)?`${Math.round(item.confidence*100)}%`:"N/A"}</span></td><td>${item.watts==null?"—":`${item.watts} W`}</td></tr>`).join("")}</tbody></table></div>`:'<p class="small text-muted">The backend completed this job without returning detections.</p>'}</section></div><p class="small text-muted mt-3">*Power values are estimates where supplied and are not electrical measurements. ${demo?"All displayed detections and confidence values are prewritten sample data.":`Backend job ${escapeHTML(result.id||jobId)} completed${result.createdAt?` · ${formatDate(result.createdAt)}`:""}.`} ${summary.lowConfidence?`${summary.lowConfidence} detection(s) have confidence below 75%.`:""}</p>`;
  if(source||demo)drawDetectionBoxes(document.querySelector("#detectionOverlay"),result.detections);
}
function renderFailure(message) {
  document.querySelector("#jobStatusPanel .badge-soft").textContent="Unavailable";
  analysisRoot.innerHTML=`<div class="card-surface panel analysis-error" role="alert"><i class="bi bi-exclamation-triangle text-warning me-2"></i>${escapeHTML(message)}<div class="small text-muted mt-2">No sample results have been substituted for this live job.</div></div>`;
}

if(demoMode) {
  try {
    const result=await analysisService.get(jobId);
    setJobProgress(100,"Demo results · illustrative sample only");
    document.querySelector("#jobStatusPanel .badge-soft").textContent="DEMO";
    renderAnalysis(result,{demo:true});
  } catch(error) { renderFailure(error.message);toast(error.message,"error"); }
} else if(!jobId) {
  setJobProgress(0,"A live job identifier is required.");
  renderFailure("No analysis job ID was provided. Return to the upload workflow after the backend confirms an analysis job.");
} else {
  pollingController=new AbortController();
  cancelButton.hidden=false;
  cancelButton.addEventListener("click",()=>pollingController.abort(new DOMException("Status polling stopped by the user.","AbortError")));
  try {
    const job=await pollJobStatus(async()=>{
      const status=await analysisService.getStatus(jobId,{signal:pollingController.signal});
      const state=String(status?.status||"unknown").toLowerCase();
      const progress=Number(status?.progress);
      setJobProgress(Number.isFinite(progress)?progress:state==="completed"||state==="complete"||state==="succeeded"||state==="success"?100:5,`Backend status: ${String(status?.status||"unknown")}`);
      if(state==="failed"||state==="error")throw new Error(status.message||"The backend reported that analysis failed.");
      if(state==="cancelled")throw new DOMException("The backend cancelled this analysis job.","AbortError");
      return status;
    },{intervalMs:1800,timeoutMs:300000,signal:pollingController.signal});
    const state=String(job.status||"").toLowerCase();
    if(["failed","error"].includes(state))throw new Error(job.message||"The backend reported that analysis failed.");
    if(state==="cancelled")throw new DOMException("The backend cancelled this analysis job.","AbortError");
    const result=job.result&&typeof job.result==="object"?{...job.result,id:job.result.id||jobId,status:job.status}:{...job,id:job.id||jobId};
    setJobProgress(100,"Backend confirmed completion.");
    document.querySelector("#jobStatusPanel .badge-soft").textContent="Completed";
    renderAnalysis(result);
  } catch(error) {
    const cancelled=error.name==="AbortError";
    setJobProgress(0,cancelled?"Status checking stopped.":error.message);
    if(cancelled&&String(error.message).includes("user"))analysisRoot.textContent="Status checking stopped; no sample results were displayed.";
    else renderFailure(error.message);
    if(!cancelled)toast(error.message,"error");
  } finally {cancelButton.hidden=true;}
}
