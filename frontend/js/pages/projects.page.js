import { auth } from '../core/auth.js';
import { api } from '../core/api-client.js';
import { UI } from '../core/ui.js';
import { renderNavbar } from '../components/navbar.js';

let projectsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await auth.requireAuth();
  if (!user) return;

  await renderNavbar();
  await loadProjects();
  initFormListener();
});

async function loadProjects() {
  const container = document.getElementById('projects-grid');
  container.innerHTML = `
    <div class="col-12 text-center py-5 text-muted">
      <div class="spinner-border text-emerald mb-2" role="status"></div>
      <div>Loading your projects...</div>
    </div>
  `;

  try {
    const res = await api.get('/projects');
    projectsList = Array.isArray(res) ? res : (res?.projects || res?.data || []);
    renderProjects();
  } catch (err) {
    container.innerHTML = `
      <div class="col-12 alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>Failed to load projects: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

function renderProjects() {
  const container = document.getElementById('projects-grid');
  container.innerHTML = '';

  if (projectsList.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="card bg-card border-secondary border-opacity-25 p-5 text-center">
          <i class="bi bi-folder-x fs-1 text-muted mb-3"></i>
          <h4 class="fw-bold">No Projects Found</h4>
          <p class="text-muted small mb-4">Create your first room workspace to start uploading video and configuring appliances.</p>
          <div>
            <button class="btn btn-vt-primary" data-bs-toggle="modal" data-bs-target="#createProjectModal">
              <i class="bi bi-plus-lg me-1"></i> Create Project
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  projectsList.forEach((proj) => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    const dims = proj.roomDimensions || { length: 5, width: 4, height: 2.8 };

    col.innerHTML = `
      <div class="card bg-card border-secondary border-opacity-25 h-100 shadow-sm d-flex flex-column hover-lift">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <span class="badge bg-dark border border-secondary text-capitalize mb-2">
                ${proj.roomType.replace('_', ' ')}
              </span>
              <h5 class="fw-bold mb-1 text-light">${escapeHtml(proj.name)}</h5>
            </div>
            <div class="dropdown">
              <button class="btn btn-link text-dim p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-three-dots-vertical"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end border-secondary">
                <li><button class="dropdown-item text-danger btn-delete-proj" data-id="${proj._id}"><i class="bi bi-trash me-2"></i>Delete Project</button></li>
              </ul>
            </div>
          </div>

          <p class="text-muted small mb-3 text-truncate-2">
            ${escapeHtml(proj.description || 'VisionTwin room workspace with automated YOLO CV detection.')}
          </p>

          <div class="row g-2 text-muted small border-top border-secondary border-opacity-25 pt-3 mb-3">
            <div class="col-6">
              <span class="text-dim">Tariff:</span>
              <span class="font-monospace text-emerald ms-1 fw-bold">₹${Number(proj.electricityTariffPerKwh || 8).toFixed(2)}</span>
            </div>
            <div class="col-6 text-end">
              <span class="text-dim">Room:</span>
              <span class="font-monospace text-light ms-1">${dims.length}×${dims.width}×${dims.height}m</span>
            </div>
          </div>
        </div>

        <div class="card-footer bg-dark border-secondary border-opacity-25 p-3 d-flex justify-content-between gap-2 mt-auto">
          <button class="btn btn-vt-outline btn-sm flex-grow-1 btn-open-dash" data-id="${proj._id}">
            <i class="bi bi-grid-1x2 me-1"></i> Dashboard
          </button>
          <button class="btn btn-vt-primary btn-sm flex-grow-1 btn-open-twin" data-id="${proj._id}">
            <i class="bi bi-box me-1"></i> 3D Twin
          </button>
        </div>
      </div>
    `;

    container.appendChild(col);
  });

  // Attach button events
  container.querySelectorAll('.btn-open-dash').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      localStorage.setItem('vt_active_project', id);
      window.location.href = '/dashboard.html';
    });
  });

  container.querySelectorAll('.btn-open-twin').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      localStorage.setItem('vt_active_project', id);
      window.location.href = '/digital-twin.html';
    });
  });

  container.querySelectorAll('.btn-delete-proj').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Are you sure you want to permanently delete this project and all its devices?')) return;

      try {
        await api.delete(`/projects/${id}`);
        UI.toast('Project deleted successfully', 'info');
        projectsList = projectsList.filter((p) => p._id !== id);
        renderProjects();
      } catch (err) {
        UI.toast('Failed to delete project: ' + err.message, 'error');
      }
    });
  });
}

function initFormListener() {
  const form = document.getElementById('form-create-project');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('new-proj-name').value.trim();
    const roomType = document.getElementById('new-proj-room-type').value;
    const tariff = parseFloat(document.getElementById('new-proj-tariff').value) || 8.0;
    const length = parseFloat(document.getElementById('new-proj-len').value) || 5.0;
    const width = parseFloat(document.getElementById('new-proj-width').value) || 4.0;
    const height = parseFloat(document.getElementById('new-proj-height').value) || 2.8;
    const desc = document.getElementById('new-proj-desc').value.trim();

    if (!name) return;

    const btn = document.getElementById('btn-submit-project');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Creating...';

    try {
      const payload = {
        name,
        roomType,
        electricityTariffPerKwh: tariff,
        roomDimensions: { length, width, height },
        description: desc
      };

      const res = await api.post('/projects', payload);
      UI.toast('Project created successfully!', 'success');

      // Close modal
      const modalEl = document.getElementById('createProjectModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      form.reset();

      localStorage.setItem('vt_active_project', res.project._id);
      projectsList.unshift(res.project);
      renderProjects();
    } catch (err) {
      UI.toast(err.message || 'Failed to create project', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Create Project';
    }
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
