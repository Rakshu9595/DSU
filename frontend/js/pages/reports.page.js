import { auth } from '../core/auth.js';
import { api } from '../core/api-client.js';
import { UI } from '../core/ui.js';
import { renderNavbar } from '../components/navbar.js';

let currentProject = null;
let reportsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await auth.requireAuth();
  if (!user) return;

  await renderNavbar();
  await loadProjects();
  initListeners();
});

async function loadProjects() {
  try {
    const res = await api.get('/projects');
    const projects = Array.isArray(res) ? res : (res?.projects || res?.data || []);
    const select = document.getElementById('report-project-select');
    select.innerHTML = '';

    if (projects.length === 0) {
      select.innerHTML = '<option value="">No projects available</option>';
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id') || urlParams.get('projectId') || localStorage.getItem('vt_active_project');
    let defaultProj = projects[0];

    projects.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p._id;
      opt.textContent = `${p.name} (${p.roomType.replace('_', ' ')})`;
      if (targetId && p._id === targetId) {
        defaultProj = p;
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    currentProject = defaultProj;
    select.value = defaultProj._id;
    localStorage.setItem('vt_active_project', defaultProj._id);

    await loadReports(defaultProj._id);
  } catch (err) {
    UI.toast('Failed to load projects: ' + err.message, 'error');
  }
}

async function loadReports(projectId) {
  const tbody = document.getElementById('reports-archive-tbody');
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center py-4 text-muted">
        <div class="spinner-border spinner-border-sm text-emerald me-2" role="status"></div>
        Loading generated reports...
      </td>
    </tr>
  `;

  try {
    const res = await api.get(`/reports/project/${projectId}`);
    reportsList = res.reports || [];
    renderReportsTable();
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4 text-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>Failed to load reports: ${escapeHtml(err.message)}
        </td>
      </tr>
    `;
  }
}

function renderReportsTable() {
  const tbody = document.getElementById('reports-archive-tbody');

  if (reportsList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4 text-muted">
          No reports generated for this project yet. Click "Generate PDF" or "Export CSV" above.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = reportsList
    .map((rep) => {
      const isPdf = rep.reportType === 'pdf';
      const typeBadge = isPdf
        ? '<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="bi bi-filetype-pdf me-1"></i>PDF</span>'
        : '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-filetype-csv me-1"></i>CSV</span>';

      const dateStr = rep.createdAt ? new Date(rep.createdAt).toLocaleString() : 'Recent';
      const sizeBytes = rep.fileSize || rep.fileSizeBytes;
      const sizeStr = sizeBytes ? `${(sizeBytes / 1024).toFixed(1)} KB` : '--';

      return `
        <tr>
          <td>
            <div class="fw-semibold text-light">${escapeHtml(rep.filename || 'audit-report')}</div>
          </td>
          <td>${typeBadge}</td>
          <td class="font-monospace text-muted small">${sizeStr}</td>
          <td class="text-muted small">${dateStr}</td>
          <td class="text-end">
            <a href="/api/reports/${rep._id}/download" class="btn btn-vt-outline btn-sm" download>
              <i class="bi bi-download me-1"></i> Download
            </a>
          </td>
        </tr>
      `;
    })
    .join('');
}

async function triggerGenerateReport(type) {
  if (!currentProject) {
    UI.toast('Please select an active project', 'warning');
    return;
  }

  const btnId = type === 'pdf' ? 'btn-gen-pdf' : 'btn-gen-csv';
  const btn = document.getElementById(btnId);
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Generating ${type.toUpperCase()}...`;

  try {
    const res = await api.post(`/reports/project/${currentProject._id}/generate`, {
      reportType: type
    });

    UI.toast(`${type.toUpperCase()} report compiled successfully!`, 'success');
    reportsList.unshift(res.report || res.data || res);
    renderReportsTable();
  } catch (err) {
    UI.toast(err.message || `Failed to generate ${type} report`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = type === 'pdf' ? '<i class="bi bi-filetype-pdf me-1"></i> Generate PDF' : '<i class="bi bi-filetype-csv me-1"></i> Export CSV';
  }
}

function initListeners() {
  document.getElementById('report-project-select')?.addEventListener('change', async (e) => {
    const id = e.target.value;
    if (!id) return;
    localStorage.setItem('vt_active_project', id);
    try {
      const p = await api.get(`/projects/${id}`);
      currentProject = p.project;
      await loadReports(id);
    } catch (err) {
      UI.toast('Failed to load project: ' + err.message, 'error');
    }
  });

  document.getElementById('btn-gen-pdf')?.addEventListener('click', () => triggerGenerateReport('pdf'));
  document.getElementById('btn-gen-csv')?.addEventListener('click', () => triggerGenerateReport('csv'));
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
