import { auth } from '../core/auth.js';
import { api } from '../core/api-client.js';
import { renderNavbar } from '../components/navbar.js';
import { ChartRenderer } from '../components/chart-renderer.js';
import { UI } from '../core/ui.js';

let currentProjectId = null;
let allProjects = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar();
  const user = await auth.requireAuth();
  if (!user) return;

  const greetingEl = document.getElementById('dash-greeting');
  if (greetingEl) {
    greetingEl.textContent = `Hello, ${user.name.split(' ')[0]}`;
  }

  await loadProjects();

  // Setup Project creation form
  const projectForm = document.getElementById('create-project-form');
  if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-project');
      UI.setLoading(saveBtn, true, 'Creating...');

      const name = document.getElementById('proj-name').value.trim();
      const roomType = document.getElementById('proj-room-type').value;
      const electricityTariff = parseFloat(document.getElementById('proj-tariff').value) || 8.0;
      const length = parseFloat(document.getElementById('proj-len').value) || 5.0;
      const width = parseFloat(document.getElementById('proj-width').value) || 4.0;
      const height = parseFloat(document.getElementById('proj-height').value) || 2.8;
      const description = document.getElementById('proj-desc').value.trim();

      try {
        const newProj = await api.post('/projects', {
          name,
          roomType,
          electricityTariff,
          roomDimensions: { length, width, height, unit: 'meters' },
          description
        });

        UI.showToast(`Project "${newProj.name}" created!`, 'success');

        // Close modal
        const modalEl = document.getElementById('newProjectModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
        projectForm.reset();

        await loadProjects(newProj._id);
      } catch (err) {
        UI.showToast(err.message || 'Failed to create project', 'danger');
      } finally {
        UI.setLoading(saveBtn, false);
      }
    });
  }

  // Active project select change
  const selectEl = document.getElementById('active-project-select');
  if (selectEl) {
    selectEl.addEventListener('change', (e) => {
      if (e.target.value) {
        switchActiveProject(e.target.value);
      }
    });
  }
});

async function loadProjects(selectId = null) {
  try {
    allProjects = await api.get('/projects');
    const selectEl = document.getElementById('active-project-select');
    const tbody = document.getElementById('projects-table-body');

    selectEl.innerHTML = '';

    if (allProjects.length === 0) {
      selectEl.innerHTML = '<option value="">No projects yet</option>';
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-5">
            <i class="bi bi-folder2-open display-6 text-muted d-block mb-3"></i>
            No projects found. Create your first room project to get started!
          </td>
        </tr>
      `;
      return;
    }

    // Populate select
    allProjects.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p._id;
      opt.textContent = `${p.name} (${p.roomType.replace('_', ' ')})`;
      selectEl.appendChild(opt);
    });

    // Populate table
    tbody.innerHTML = '';
    allProjects.forEach((p) => {
      const tr = document.createElement('tr');
      const dims = p.roomDimensions ? `${p.roomDimensions.length}x${p.roomDimensions.width}x${p.roomDimensions.height}m` : '-';
      const statusBadge = p.status === 'optimized'
        ? '<span class="badge bg-success-subtle text-success border border-success-subtle">Optimized</span>'
        : p.status === 'analyzed'
        ? '<span class="badge bg-info-subtle text-info border border-info-subtle">Analyzed</span>'
        : '<span class="badge bg-secondary-subtle text-muted border border-secondary-subtle">Draft</span>';

      tr.innerHTML = `
        <td>
          <a href="/project-details.html?id=${p._id}" class="fw-bold text-white text-decoration-none">
            ${escapeHtml(p.name)}
          </a>
          ${p.description ? `<div class="small text-muted text-truncate" style="max-width: 250px;">${escapeHtml(p.description)}</div>` : ''}
        </td>
        <td class="text-capitalize text-muted">${p.roomType.replace('_', ' ')}</td>
        <td class="font-monospace text-muted small">${dims}</td>
        <td class="font-monospace text-emerald">₹${Number(p.electricityTariff).toFixed(2)}</td>
        <td>${statusBadge}</td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <a href="/devices.html?id=${p._id}" class="btn btn-vt-secondary" title="Edit Device Ratings">
              <i class="bi bi-sliders text-emerald"></i>
            </a>
            <a href="/digital-twin.html?id=${p._id}" class="btn btn-vt-secondary" title="View 3D Digital Twin">
              <i class="bi bi-box text-warning"></i>
            </a>
            <a href="/energy-analysis.html?id=${p._id}" class="btn btn-vt-secondary" title="Energy Analytics">
              <i class="bi bi-graph-up text-cyan"></i>
            </a>
            <a href="/upload.html?id=${p._id}" class="btn btn-vt-secondary" title="Upload Video">
              <i class="bi bi-cloud-arrow-up text-info"></i>
            </a>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Choose active project
    const chosenId = selectId || allProjects[0]._id;
    selectEl.value = chosenId;
    await switchActiveProject(chosenId);
  } catch (err) {
    UI.showToast(err.message, 'danger');
  }
}

async function switchActiveProject(projectId) {
  currentProjectId = projectId;
  localStorage.setItem('vt_active_project', projectId);

  // Update quick links with query param ?id=...
  ['ql-upload', 'ql-devices', 'ql-twin', 'ql-energy', 'ql-recs', 'ql-reports'].forEach((linkId) => {
    const el = document.getElementById(linkId);
    if (el) {
      const baseHref = el.getAttribute('href').split('?')[0];
      el.setAttribute('href', `${baseHref}?id=${projectId}`);
    }
  });

  // Load project energy estimate
  try {
    const estimate = await api.get(`/energy/project/${projectId}`);
    updateKpiCards(estimate);

    const breakdown = estimate.deviceBreakdown || [];
    ChartRenderer.renderEnergyDoughnut('energyDoughnutChart', breakdown);
    ChartRenderer.renderConsumptionBar('costBarChart', breakdown);
  } catch (err) {
    console.error('Failed to load project energy:', err);
  }
}

function updateKpiCards(estimate) {
  document.getElementById('kpi-monthly-kwh').innerHTML = `${Number(estimate.totalMonthlyEnergyKwh || 0).toFixed(1)} <span class="fs-6 font-sans text-muted">kWh</span>`;
  document.getElementById('kpi-daily-kwh').textContent = `Daily: ${Number(estimate.totalDailyEnergyKwh || 0).toFixed(2)} kWh`;
  document.getElementById('kpi-monthly-cost').textContent = UI.formatCurrency(estimate.totalMonthlyCost);
  document.getElementById('kpi-tariff-applied').textContent = `Tariff: ₹${Number(estimate.tariffApplied || 8.0).toFixed(2)} / kWh`;
  document.getElementById('kpi-appliances-count').textContent = `${estimate.totalAppliancesCount || 0} Units`;
  document.getElementById('kpi-fittings-count').textContent = `+ ${estimate.totalFittingsCount || 0} passive fittings`;

  const carbonKg = estimate.totalCarbonEmissionsKg || 0;
  document.getElementById('kpi-carbon').innerHTML = `${Number(carbonKg).toFixed(1)} <span class="fs-6 font-sans text-muted">kg</span>`;
  const trees = (carbonKg / 21.77).toFixed(1);
  document.getElementById('kpi-trees').textContent = `~${trees} trees needed / yr`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
