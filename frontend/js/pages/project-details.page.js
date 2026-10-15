import { auth } from '../core/auth.js';
import { api } from '../core/api-client.js';
import { UI } from '../core/ui.js';
import { renderNavbar } from '../components/navbar.js';

let currentProject = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await auth.requireAuth();
  if (!user) return;

  await renderNavbar();

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id') || localStorage.getItem('vt_active_project');

  if (!projectId) {
    window.location.href = '/projects.html';
    return;
  }

  await loadProjectDetails(projectId);
  initFormListeners(projectId);
});

async function loadProjectDetails(projectId) {
  try {
    const [projRes, devRes, energyRes] = await Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/devices?projectId=${projectId}`),
      api.get(`/energy/project/${projectId}`)
    ]);

    currentProject = projRes.project;
    localStorage.setItem('vt_active_project', currentProject._id);

    // Populate header
    document.getElementById('det-proj-name').textContent = currentProject.name;
    document.getElementById('proj-crumb').textContent = currentProject.name;
    document.getElementById('det-room-type').textContent = currentProject.roomType.replace('_', ' ');
    document.getElementById('det-proj-desc').textContent = currentProject.description || 'VisionTwin room workspace with CV object detection.';

    const dims = currentProject.roomDimensions || { length: 5, width: 4, height: 2.8 };
    document.getElementById('det-dimensions').textContent = `${dims.length}×${dims.width}×${dims.height}m`;

    const devices = devRes.devices || [];
    document.getElementById('det-devices-count').textContent = devices.length;

    const estimate = energyRes.estimate || energyRes;
    document.getElementById('det-monthly-kwh').textContent = `${(estimate?.totalMonthlyEnergyKwh || 0).toFixed(1)} kWh`;
    document.getElementById('det-monthly-cost').textContent = `₹${Math.round(estimate?.estimatedMonthlyCost || 0).toLocaleString()}`;

    // Fill form
    document.getElementById('edit-proj-name').value = currentProject.name;
    document.getElementById('edit-proj-tariff').value = currentProject.electricityTariffPerKwh || 8.0;
    document.getElementById('edit-proj-len').value = dims.length || 5.0;
    document.getElementById('edit-proj-width').value = dims.width || 4.0;
    document.getElementById('edit-proj-height').value = dims.height || 2.8;
    document.getElementById('edit-proj-desc').value = currentProject.description || '';
  } catch (err) {
    UI.toast('Failed to load project details: ' + err.message, 'error');
  }
}

function initFormListeners(projectId) {
  const form = document.getElementById('form-edit-project');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('edit-proj-name').value.trim();
    const tariff = parseFloat(document.getElementById('edit-proj-tariff').value) || 8.0;
    const length = parseFloat(document.getElementById('edit-proj-len').value) || 5.0;
    const width = parseFloat(document.getElementById('edit-proj-width').value) || 4.0;
    const height = parseFloat(document.getElementById('edit-proj-height').value) || 2.8;
    const desc = document.getElementById('edit-proj-desc').value.trim();

    const btn = document.getElementById('btn-save-project-edit');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

    try {
      await api.put(`/projects/${projectId}`, {
        name,
        electricityTariffPerKwh: tariff,
        roomDimensions: { length, width, height },
        description: desc
      });

      UI.toast('Project configuration updated!', 'success');
      document.getElementById('det-proj-name').textContent = name;
      document.getElementById('proj-crumb').textContent = name;
      document.getElementById('det-dimensions').textContent = `${length}×${width}×${height}m`;
    } catch (err) {
      UI.toast(err.message || 'Failed to update project', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check2 me-1"></i> Update Configuration';
    }
  });

  document.getElementById('btn-delete-this-project')?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to permanently delete this project?')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      UI.toast('Project deleted', 'info');
      window.location.href = '/projects.html';
    } catch (err) {
      UI.toast('Failed to delete project: ' + err.message, 'error');
    }
  });
}
