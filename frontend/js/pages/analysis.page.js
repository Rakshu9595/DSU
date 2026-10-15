import { auth } from '../core/auth.js';
import { api } from '../core/api-client.js';
import { UI } from '../core/ui.js';
import { renderNavbar } from '../components/navbar.js';

let pollInterval = null;
let jobId = null;
let projectId = null;
let devicesList = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await auth.requireAuth();
  if (!user) return;

  await renderNavbar();

  const urlParams = new URLSearchParams(window.location.search);
  jobId = urlParams.get('jobId');
  projectId = urlParams.get('projectId') || localStorage.getItem('vt_active_project');

  if (!projectId) {
    UI.toast('No project selected. Returning to dashboard...', 'warning');
    setTimeout(() => { window.location.href = '/dashboard.html'; }, 1500);
    return;
  }

  document.getElementById('job-id-badge').textContent = `Job ID: ${jobId || 'Latest'}`;

  if (jobId) {
    startPollingJob(jobId);
  } else {
    // Load latest completed analysis for this project
    loadExistingProjectAnalysis();
  }
});

function startPollingJob(id) {
  let attempts = 0;
  const maxAttempts = 60; // 2 minutes

  const checkStatus = async () => {
    attempts++;
    try {
      const res = await api.get(`/analysis/job/${id}/status`);
      const status = res.status;

      if (status === 'completed') {
        clearInterval(pollInterval);
        handleAnalysisCompleted();
      } else if (status === 'failed') {
        clearInterval(pollInterval);
        handleAnalysisFailed(res.error || 'YOLO analysis processing error');
      } else {
        document.getElementById('job-status-title').textContent = `Running YOLO Computer Vision (${status})...`;
        document.getElementById('job-status-desc').textContent = `Frame inference attempt ${attempts}... Detecting appliances and electrical fittings.`;
      }
    } catch (err) {
      // If error occurs polling, don't crash immediately
      if (attempts > maxAttempts) {
        clearInterval(pollInterval);
        handleAnalysisFailed('Analysis polling timed out');
      }
    }
  };

  checkStatus();
  pollInterval = setInterval(checkStatus, 2000);
}

async function loadExistingProjectAnalysis() {
  document.getElementById('job-status-title').textContent = 'Loading Detection Results...';
  try {
    await handleAnalysisCompleted();
  } catch (err) {
    handleAnalysisFailed('No prior analysis found for this project.');
  }
}

async function handleAnalysisCompleted() {
  const banner = document.getElementById('job-status-banner');
  banner.className = 'card bg-card border-emerald-subtle p-4 shadow-sm mb-4';

  document.getElementById('status-spinner-icon').outerHTML = `
    <div class="fs-1 text-emerald"><i class="bi bi-check-circle-fill"></i></div>
  `;
  document.getElementById('job-status-title').textContent = 'YOLO Detection Complete';
  document.getElementById('job-status-desc').textContent = 'Appliance and fitting detections have been normalized and stored in MongoDB.';

  document.getElementById('summary-stats-bar').classList.remove('d-none');
  document.getElementById('review-container').classList.remove('d-none');

  // Load project devices and energy summary
  await refreshDevicesAndStats();
}

function handleAnalysisFailed(msg) {
  const banner = document.getElementById('job-status-banner');
  banner.className = 'card bg-card border-danger p-4 shadow-sm mb-4';

  document.getElementById('status-spinner-icon').outerHTML = `
    <div class="fs-1 text-danger"><i class="bi bi-exclamation-octagon-fill"></i></div>
  `;
  document.getElementById('job-status-title').textContent = 'Analysis Failed';
  document.getElementById('job-status-desc').textContent = msg;
}

async function refreshDevicesAndStats() {
  try {
    const [devRes, energyRes] = await Promise.all([
      api.get(`/devices?projectId=${projectId}`),
      api.get(`/energy/project/${projectId}`)
    ]);

    devicesList = devRes.devices || [];
    const estimate = energyRes.estimate || energyRes;

    let appliancesCount = 0;
    let switchesCount = 0;
    let socketsCount = 0;

    devicesList.forEach((d) => {
      if (d.isFitting) {
        if (d.fittingType === 'switch') switchesCount++;
        else socketsCount++;
      } else {
        appliancesCount++;
      }
    });

    document.getElementById('sum-appliances-count').textContent = appliancesCount;
    document.getElementById('sum-switches-count').textContent = switchesCount;
    document.getElementById('sum-sockets-count').textContent = socketsCount;
    document.getElementById('sum-est-kwh').textContent = `${(estimate?.totalMonthlyEnergyKwh || 0).toFixed(0)} kWh`;

    renderDetectionsTable();
  } catch (err) {
    UI.toast('Failed to load detection items: ' + err.message, 'error');
  }
}

function renderDetectionsTable() {
  const tbody = document.getElementById('detections-review-tbody');
  if (devicesList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4 text-muted">
          No detections found in this video stream.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = devicesList
    .map((dev) => {
      const conf = Math.round((dev.detectionConfidence || 0.85) * 100);
      const isFitting = dev.isFitting;
      const typeBadge = isFitting
        ? `<span class="badge badge-fitting text-uppercase">${dev.fittingType}</span>`
        : `<span class="badge bg-dark border border-secondary text-capitalize">${dev.category}</span>`;

      return `
        <tr id="row-dev-${dev._id}">
          <td>
            <div class="d-flex align-items-center gap-2">
              <input
                type="text"
                class="form-control form-control-sm bg-dark border-secondary text-light dev-name-edit"
                id="edit-name-${dev._id}"
                value="${escapeHtml(dev.displayName)}"
                style="max-width: 220px;"
              />
              <button class="btn btn-outline-secondary btn-sm btn-save-name" data-id="${dev._id}" title="Save corrected label">
                <i class="bi bi-check2"></i>
              </button>
            </div>
            ${dev.isVariablePower ? '<span class="text-dim small"><i class="bi bi-info-circle me-1"></i>Variable power</span>' : ''}
          </td>
          <td>${typeBadge}</td>
          <td>
            <span class="badge bg-dark border border-secondary text-dim">
              <i class="bi bi-eye text-emerald me-1"></i>${conf}%
            </span>
          </td>
          <td>
            <button class="btn btn-outline-danger btn-sm btn-delete-dev" data-id="${dev._id}" title="Remove false positive detection">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join('');

  // Attach rename & delete listeners
  tbody.querySelectorAll('.btn-save-name').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = btn.getAttribute('data-id');
      const input = document.getElementById(`edit-name-${id}`);
      const newName = input?.value.trim();
      if (!newName) return;

      btn.disabled = true;
      try {
        await api.put(`/devices/${id}`, { displayName: newName });
        UI.toast('Device name updated!', 'success');
      } catch (err) {
        UI.toast('Failed to update name: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });

  tbody.querySelectorAll('.btn-delete-dev').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Remove this false detection from your project?')) return;

      btn.disabled = true;
      try {
        await api.delete(`/devices/${id}`);
        document.getElementById(`row-dev-${id}`)?.remove();
        devicesList = devicesList.filter((d) => d._id !== id);
        UI.toast('False detection removed', 'info');
      } catch (err) {
        UI.toast('Failed to delete detection: ' + err.message, 'error');
        btn.disabled = false;
      }
    });
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
