import { mountApp, escapeHTML, toast } from "../core/ui.js";
import { projectService } from "../services/project.service.js";
import { confirmAction, showFormDialog } from "../components/confirmation-dialog.js";

mountApp("Projects", `<div class="app-page-title"><div><span class="demo-label">DEMO WORKSPACE</span><h1 class="mt-3">Your projects</h1><p>Organize rooms and building scans in one place.</p></div><button class="btn-primary-soft" id="createProject"><i class="bi bi-plus-lg"></i> Create project</button></div><div class="card-surface panel mb-3"><div class="d-flex flex-wrap gap-3"><input class="form-control flex-grow-1" id="projectSearch" placeholder="Search projects…" aria-label="Search projects"><select class="form-select" id="projectFilter" style="max-width:200px"><option value="">All statuses</option><option>Analyzed</option><option>In review</option><option>Ready to scan</option></select><button class="btn-outline-soft" id="projectView" aria-label="Toggle project view"><i class="bi bi-list"></i> List view</button></div></div><div class="row g-3" id="projectGrid"></div>`);

let projects = await projectService.list();
let listMode = false;
function render() {
  const query = document.querySelector("#projectSearch").value.trim().toLowerCase();
  const status = document.querySelector("#projectFilter").value;
  const results = projects.filter((item) => `${item.name} ${item.location} ${item.room}`.toLowerCase().includes(query) && (!status || item.status === status));
  const grid = document.querySelector("#projectGrid");
  grid.className = listMode ? "d-grid gap-2" : "row g-3";
  grid.innerHTML = results.length ? results.map((item) => `<div class="${listMode?"":"col-sm-6 col-xl-4"}"><article class="card-surface panel h-100"><div class="d-flex justify-content-between"><span class="icon-tile"><i class="bi bi-house"></i></span><span class="badge-soft">${escapeHTML(item.status)}</span></div><h2 class="h5 mt-4">${escapeHTML(item.name)}</h2><p class="small mb-3"><i class="bi bi-geo-alt me-1"></i>${escapeHTML(item.location)} · ${escapeHTML(item.room)}</p><div class="d-flex justify-content-between small text-muted"><span>${item.devices} mapped devices</span><span>Updated ${escapeHTML(item.updatedAt)}</span></div><div class="d-flex gap-2 mt-4"><a class="btn-primary-soft flex-grow-1" href="project-details.html?id=${encodeURIComponent(item.id)}">Open project <i class="bi bi-arrow-right"></i></a><button class="btn-outline-soft" data-edit="${escapeHTML(item.id)}" aria-label="Edit project"><i class="bi bi-pencil"></i></button><button class="btn-outline-soft" data-delete="${escapeHTML(item.id)}" aria-label="Delete project"><i class="bi bi-trash"></i></button></div></article></div>`).join("") : `<div class="col-12"><div class="card-surface empty-state"><span class="icon-tile"><i class="bi bi-search"></i></span><h2 class="h5 mt-3">No projects found</h2><p>Try another search or create a new project.</p><button class="btn-primary-soft" id="emptyCreate">Create project</button></div></div>`;
  grid.querySelector("#emptyCreate")?.addEventListener("click", createProject);
}
async function createProject() {
  const values = await showFormDialog({title:"Create a project",fields:[{name:"name",label:"Project name",required:true},{name:"location",label:"Location",required:false},{name:"room",label:"Room",required:false}]});
  if (!values) return;
  try { await projectService.create({ name:values.name.trim(), location:values.location.trim()||"Location not set", room:values.room.trim()||"Room to be defined" }); projects = await projectService.list(); render(); toast("Demo project created and saved in this browser.","success"); }
  catch (error) { toast(error.message,"error"); }
}
document.querySelector("#createProject").addEventListener("click", createProject);
document.querySelector("#projectSearch").addEventListener("input", render);
document.querySelector("#projectFilter").addEventListener("change", render);
document.querySelector("#projectView").addEventListener("click", (event) => { listMode=!listMode; event.currentTarget.innerHTML=`<i class="bi bi-${listMode?"grid":"list"}"></i> ${listMode?"Grid":"List"} view`; render(); });
document.querySelector("#projectGrid").addEventListener("click", async (event) => {
  const editId=event.target.closest("[data-edit]")?.dataset.edit;
  const deleteId=event.target.closest("[data-delete]")?.dataset.delete;
  if (editId) {
    const project=projects.find((item)=>item.id===editId);
    const values=await showFormDialog({title:"Edit project",fields:[{name:"name",label:"Project name",value:project?.name},{name:"location",label:"Location",value:project?.location,required:false},{name:"room",label:"Room",value:project?.room,required:false}]});
    if (values?.name.trim()) { await projectService.update(editId,{name:values.name.trim(),location:values.location.trim(),room:values.room.trim()}); projects=await projectService.list(); render(); toast("Project updated locally.","success"); }
  }
  if (deleteId && await confirmAction("This removes the project from this browser's demo data.","Delete project")) {
    await projectService.remove(deleteId); projects=await projectService.list(); render(); toast("Demo project deleted.","success");
  }
});
render();
