import { mountApp, toast, escapeHTML } from "../core/ui.js";
import { projectService } from "../services/project.service.js";
import { uploadService } from "../services/upload.service.js";
import { analysisService } from "../services/analysis.service.js";
import { appConfig } from "../config/app-config.js";
import { validateVideo } from "../upload/video-validator.js";
import { showVideoPreview } from "../upload/video-preview.js";

mountApp("Video upload", `<div class="app-page-title"><div><span class="demo-label">${appConfig.mode==="demo"?"LOCAL PREVIEW ONLY":"BACKEND UPLOAD"}</span><h1 class="mt-3">Scan a room</h1><p>Choose a walkthrough video. In demo mode it stays in this browser and is never uploaded.</p></div></div><div class="row g-3"><div class="col-lg-8"><section class="card-surface panel"><label class="form-label" for="uploadProject">Project</label><select id="uploadProject" class="form-select mb-3"></select><label for="videoFile" class="upload-dropzone" id="dropzone"><div><span class="upload-icon"><i class="bi bi-cloud-arrow-up"></i></span><h2 class="h5">Drop your walkthrough video here</h2><p class="mb-2">or browse files from your device</p><span class="btn-outline-soft">Choose video</span><div class="small text-muted mt-3">MP4, MOV, WebM · Up to 250 MB</div></div></label><input type="file" id="videoFile" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" hidden><div id="fileFeedback" class="small mt-3" role="status" aria-live="polite"></div><video id="videoPreview" class="video-preview mt-3" controls hidden aria-label="Selected video preview"></video><div id="fileMetadata" class="small text-muted mt-2"></div><div class="mt-3" id="progressWrap" hidden><div class="d-flex justify-content-between small mb-1"><span id="progressLabel">Waiting to upload</span><span id="progressValue">0%</span></div><progress id="uploadProgress" class="w-100" max="100" value="0" aria-label="Video upload progress"></progress></div><div class="d-flex flex-wrap gap-2 mt-4"><button id="uploadButton" class="btn-primary-soft" disabled><i class="bi bi-cloud-upload"></i> ${appConfig.mode==="demo"?"Live mode required to upload":"Upload for analysis"}</button><button id="cancelUpload" class="btn-outline-soft" hidden>Cancel upload</button><a href="dashboard.html" class="btn-outline-soft">Cancel</a><a href="analysis.html?demo=1" class="btn-outline-soft"><i class="bi bi-play-circle"></i> Explore sample analysis</a></div></section></div><div class="col-lg-4"><aside class="card-surface panel"><h2 class="h5">Before you upload</h2><ul class="small text-muted ps-3 mt-3"><li class="mb-2">Move slowly and include each corner of the room.</li><li class="mb-2">Keep appliances and fittings in view.</li><li class="mb-2">Avoid filming people or private documents.</li></ul><div class="alert alert-info bg-transparent small mb-0">${appConfig.mode==="demo"?"Demo mode validates and previews the file only. No upload or AI processing is performed. Explore the sample analysis separately.":"Uploads use the configured backend. Progress is shown only when actual upload bytes are reported; results appear only after the backend confirms job completion."}</div></aside></div></div>`);

const fileInput=document.querySelector("#videoFile");
const video=document.querySelector("#videoPreview");
const feedback=document.querySelector("#fileFeedback");
const uploadButton=document.querySelector("#uploadButton");
const projectSelect=document.querySelector("#uploadProject");
let projects=[];
let projectsAvailable=false;
try {
  projects=await projectService.list();
  if(!Array.isArray(projects))throw new TypeError("Projects response must be a list.");
  projectSelect.innerHTML=projects.map((project)=>`<option value="${escapeHTML(project.id)}">${escapeHTML(project.name)} · ${escapeHTML(project.room)}</option>`).join("");
  projectsAvailable=true;
} catch(error) {
  feedback.textContent=`Projects could not be loaded: ${error.message}`;
  feedback.className="small mt-3 text-danger";
  uploadButton.disabled=true;
  toast(`Project list unavailable: ${error.message}`,"error");
}
const selectedProject=new URLSearchParams(location.search).get("projectId");
if(selectedProject) projectSelect.value=selectedProject;
let selectedFile=null;
let activeUpload=null;
let uploadedId=null;
function receiveFile(file) {
  const result=validateVideo(file);
  feedback.textContent=result.message;
  feedback.className=`small mt-3 ${result.valid?"text-success":"text-danger"}`;
  if(!result.valid){selectedFile=null;uploadButton.disabled=true;video.pause();video.hidden=true;if(video.dataset.objectUrl){URL.revokeObjectURL(video.dataset.objectUrl);delete video.dataset.objectUrl;}video.removeAttribute("src");document.querySelector("#fileMetadata").textContent="";return;}
  selectedFile=file;uploadButton.disabled=!projectsAvailable||(appConfig.mode==="demo"&&!uploadedId);showVideoPreview(video,file);
  document.querySelector("#fileMetadata").textContent=`${file.name} · ${(file.size/1024/1024).toFixed(1)} MB · ${appConfig.mode==="demo"?"Local preview; not uploaded":"Ready for backend upload"}`;
  if(appConfig.mode==="demo"){feedback.textContent="Demo mode: this file remains local and cannot be uploaded. Use “Explore sample analysis” to view clearly labeled sample results.";feedback.className="small mt-3 text-info";}
}
fileInput.addEventListener("change",()=>receiveFile(fileInput.files?.[0]));
document.querySelector("#dropzone").addEventListener("click",(event)=>{event.preventDefault();fileInput.click();});
const dropzone=document.querySelector("#dropzone");
["dragenter","dragover"].forEach((name)=>dropzone.addEventListener(name,(event)=>{event.preventDefault();dropzone.classList.add("dragover");}));
["dragleave","drop"].forEach((name)=>dropzone.addEventListener(name,(event)=>{event.preventDefault();dropzone.classList.remove("dragover");}));
dropzone.addEventListener("drop",(event)=>receiveFile(event.dataTransfer.files?.[0]));
uploadButton.addEventListener("click",async()=>{
  if(!selectedFile)return;
  if(uploadedId){
    uploadButton.disabled=true;
    try{
      const job=await analysisService.start(uploadedId);
      if(!job?.id)throw new Error("The backend did not return an analysis job identifier.");
      location.assign(`analysis.html?id=${encodeURIComponent(job.id)}`);
    }catch(error){feedback.textContent=error.message;feedback.className="small mt-3 text-danger";toast(error.message,"error");uploadButton.disabled=false;}
    return;
  }
  activeUpload=new AbortController();
  const progressWrap=document.querySelector("#progressWrap");
  const progress=document.querySelector("#uploadProgress");
  const progressLabel=document.querySelector("#progressLabel");
  const progressValue=document.querySelector("#progressValue");
  progressWrap.hidden=false;
  progressLabel.textContent="Uploading to the configured backend…";
  progressValue.textContent="Waiting for progress";
  document.querySelector("#cancelUpload").hidden=false;
  uploadButton.disabled=true;
  try {
    const result=await uploadService.upload(selectedFile,{projectId:projectSelect.value,signal:activeUpload.signal,onProgress:(percent)=>{progress.value=percent;progress.setAttribute("aria-valuenow",String(percent));progressValue.textContent=`${percent}%`;progressLabel.textContent="Uploading…";}});
    if(!result?.id) throw new Error("The backend did not return an upload identifier.");
    uploadedId=result.id;
    progress.value=100;progressValue.textContent="100%";progressLabel.textContent="Upload complete";
    uploadButton.innerHTML='<i class="bi bi-stars"></i> Start analysis';
    feedback.textContent="Backend confirmed the upload. Start analysis when ready.";
    feedback.className="small mt-3 text-success";
    toast("Backend confirmed the upload.","success");
  } catch(error) { feedback.textContent=error.message; feedback.className="small mt-3 text-warning"; progressLabel.textContent=activeUpload.signal.aborted?"Upload cancelled":"Upload did not complete"; toast(error.message,"error"); }
  finally {document.querySelector("#cancelUpload").hidden=true;uploadButton.disabled=!selectedFile;activeUpload=null;}
});
document.querySelector("#cancelUpload").addEventListener("click",()=>activeUpload?.abort(new DOMException("Upload cancelled by the user.","AbortError")));
window.addEventListener("beforeunload",()=>{if(video.dataset.objectUrl)URL.revokeObjectURL(video.dataset.objectUrl);});
