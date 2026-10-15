import { auth } from '../core/auth.js';
import { api } from '../core/api-client.js';
import { UI } from '../core/ui.js';
import { renderNavbar } from '../components/navbar.js';
import { renderDeviceCard } from '../components/device-card.js';

let currentProject = null;
let allDevices = [];
let filteredDevices = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await auth.requireAuth();
  if (!user) return;

  await renderNavbar();
  await loadProjects();
  initEventListeners();
});

async function loadProjects() {
  try {
    const res = await api.get('/projects');
    const projects = Array.isArray(res) ? res : (res?.projects || res?.data || []);
    const select = document.getElementById('device-project-select');
    select.innerHTML = '';

    if (projects.length === 0) {
      select.innerHTML = '<option value="">No projects available</option>';
      renderEmptyState('No projects found. Please create a project from the dashboard or projects tab.');
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

    await loadDevices(defaultProj._id);
  } catch (err) {
    UI.toast(err.message || 'Failed to load projects', 'error');
  }
}

async function loadDevices(projectId) {
  const container = document.getElementById('devices-container');
  container.innerHTML = `
    <div class="text-center py-5 text-muted col-span-full">
      <div class="spinner-border text-emerald mb-2" role="status"></div>
      <div>Loading appliances & fittings...</div>
    </div>
  `;

  try {
    const res = await api.get(`/devices?projectId=${projectId}`);
    allDevices = res.devices || [];
    applyFilters();
  } catch (err) {
    container.innerHTML = `
      <div class="alert alert-danger col-span-full">
        <i class="bi bi-exclamation-triangle me-2"></i>Failed to load devices: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

function applyFilters() {
  const searchTerm = (document.getElementById('filter-search')?.value || '').toLowerCase().trim();
  const category = document.getElementById('filter-category')?.value || '';
  const ratingSource = document.getElementById('filter-rating-source')?.value || '';

  filteredDevices = allDevices.filter((d) => {
    // Search match
    if (searchTerm) {
      const name = (d.displayName || '').toLowerCase();
      const brand = (d.manufacturer || '').toLowerCase();
      const model = (d.modelNumber || '').toLowerCase();
      const cat = (d.category || '').toLowerCase();
      if (!name.includes(searchTerm) && !brand.includes(searchTerm) && !model.includes(searchTerm) && !cat.includes(searchTerm)) {
        return false;
      }
    }

    // Category match
    if (category) {
      if (category === 'fitting') {
        if (!d.isFitting) return false;
      } else {
        if (d.isFitting || d.category !== category) return false;
      }
    }

    // Rating source match
    if (ratingSource && d.powerRatingSource !== ratingSource) {
      return false;
    }

    return true;
  });

  renderKPIs();
  renderDeviceGrid();
}

function renderKPIs() {
  const tariff = Number(currentProject?.electricityTariffPerKwh || 8.0);
  let activeCount = 0;
  let fittingCount = 0;
  let verifiedCount = 0;
  let totalDailyKwh = 0;
  let totalMonthlyCost = 0;

  allDevices.forEach((d) => {
    if (d.isFitting) {
      fittingCount++;
    } else {
      activeCount++;
      if (d.powerRatingVerified || d.powerRatingSource === 'user_entered') {
        verifiedCount++;
      }
      const watts = Number(d.powerRatingWatts || 0);
      const hours = Number(d.dailyUsageHours || 0);
      const days = Number(d.daysUsedPerMonth || 30);
      const devTariff = Number(d.electricityTariffPerKwh || tariff);

      const daily = (watts * hours) / 1000;
      const monthly = daily * days;
      totalDailyKwh += daily;
      totalMonthlyCost += monthly * devTariff;
    }
  });

  const verifiedPct = activeCount > 0 ? Math.round((verifiedCount / activeCount) * 100) : 0;

  document.getElementById('stat-active-count').textContent = activeCount;
  document.getElementById('stat-fitting-count').textContent = `+ ${fittingCount} passive fittings`;
  document.getElementById('stat-verified-count').textContent = verifiedCount;
  document.getElementById('stat-verified-pct').textContent = `${verifiedPct}% user-calibrated`;
  document.getElementById('stat-daily-kwh').innerHTML = `${totalDailyKwh.toFixed(2)} <span class="fs-6 fw-normal text-muted">kWh</span>`;
  document.getElementById('stat-monthly-cost').textContent = `₹${Math.round(totalMonthlyCost).toLocaleString()}`;
  document.getElementById('stat-tariff-rate').textContent = `Tariff: ₹${tariff.toFixed(2)}/kWh`;
}

function renderDeviceGrid() {
  const container = document.getElementById('devices-container');
  container.innerHTML = '';

  if (filteredDevices.length === 0) {
    if (allDevices.length === 0) {
      renderEmptyState('No appliances or fittings detected in this project yet. Upload a room video or add a device manually.');
    } else {
      container.innerHTML = `
        <div class="card bg-card border-secondary border-opacity-25 p-5 text-center col-span-full">
          <i class="bi bi-funnel fs-1 text-muted mb-3"></i>
          <h5 class="fw-bold">No matching devices found</h5>
          <p class="text-muted small mb-3">Try adjusting your search terms or filters.</p>
          <div>
            <button class="btn btn-vt-outline btn-sm" id="btn-clear-empty-filter">Clear Filters</button>
          </div>
        </div>
      `;
      document.getElementById('btn-clear-empty-filter')?.addEventListener('click', resetFilters);
    }
    return;
  }

  const tariff = Number(currentProject?.electricityTariffPerKwh || 8.0);

  filteredDevices.forEach((device) => {
    const card = renderDeviceCard(device, tariff, handleDeviceUpdate);
    container.appendChild(card);
  });
}

function handleDeviceUpdate(updatedDevice, deletedId) {
  if (deletedId) {
    allDevices = allDevices.filter((d) => d._id !== deletedId);
  } else if (updatedDevice) {
    const idx = allDevices.findIndex((d) => d._id === updatedDevice._id);
    if (idx !== -1) {
      allDevices[idx] = updatedDevice;
    }
  }
  applyFilters();
}

function renderEmptyState(message) {
  const container = document.getElementById('devices-container');
  container.innerHTML = `
    <div class="card bg-card border-secondary border-opacity-25 p-5 text-center col-span-full">
      <i class="bi bi-plug fs-1 text-emerald mb-3"></i>
      <h5 class="fw-bold">Device Inventory Empty</h5>
      <p class="text-muted small mb-4">${escapeHtml(message)}</p>
      <div class="d-flex justify-content-center gap-2">
        <a href="/upload.html" class="btn btn-vt-primary">
          <i class="bi bi-cloud-arrow-up me-1"></i> Upload Room Video
        </a>
        <button class="btn btn-vt-outline" data-bs-toggle="modal" data-bs-target="#addDeviceModal">
          <i class="bi bi-plus-circle me-1"></i> Add Manually
        </button>
      </div>
    </div>
  `;
}

function resetFilters() {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-category').value = '';
  document.getElementById('filter-rating-source').value = '';
  applyFilters();
}

function initEventListeners() {
  // Project switch
  const projectSelect = document.getElementById('device-project-select');
  projectSelect.addEventListener('change', async (e) => {
    const projectId = e.target.value;
    if (!projectId) return;
    localStorage.setItem('vt_active_project', projectId);
    try {
      const p = await api.get(`/projects/${projectId}`);
      currentProject = p.project;
      await loadDevices(projectId);
    } catch (err) {
      UI.toast('Failed to load selected project', 'error');
    }
  });

  // Filters
  document.getElementById('filter-search')?.addEventListener('input', applyFilters);
  document.getElementById('filter-category')?.addEventListener('change', applyFilters);
  document.getElementById('filter-rating-source')?.addEventListener('change', applyFilters);
  document.getElementById('btn-reset-filters')?.addEventListener('click', resetFilters);

  // Add Device Modal Form
  const formAdd = document.getElementById('form-add-device');
  formAdd?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentProject) {
      UI.toast('Please select an active project first', 'warning');
      return;
    }

    const name = document.getElementById('add-name').value.trim();
    const category = document.getElementById('add-category').value;
    const watts = parseFloat(document.getElementById('add-watts').value);
    const hours = parseFloat(document.getElementById('add-hours').value) || 8;
    const days = parseInt(document.getElementById('add-days').value, 10) || 30;
    const manufacturer = document.getElementById('add-manufacturer').value.trim();
    const modelNumber = document.getElementById('add-model').value.trim();

    if (!watts || watts <= 0 || isNaN(watts)) {
      UI.toast('Please enter a valid positive wattage (W)', 'error');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-add-device');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Adding...';

    try {
      const payload = {
        projectId: currentProject._id,
        displayName: name,
        category,
        powerRatingWatts: watts,
        powerRatingSource: 'user_entered',
        powerRatingVerified: true,
        dailyUsageHours: hours,
        daysUsedPerMonth: days,
        electricityTariffPerKwh: currentProject.electricityTariffPerKwh || 8.0,
        manufacturer,
        modelNumber
      };

      const res = await api.post('/devices', payload);
      UI.toast('Device added successfully!', 'success');

      // Close modal
      const modalEl = document.getElementById('addDeviceModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      formAdd.reset();

      allDevices.unshift(res.device);
      applyFilters();
    } catch (err) {
      UI.toast(err.message || 'Failed to add device', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Add Appliance';
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
