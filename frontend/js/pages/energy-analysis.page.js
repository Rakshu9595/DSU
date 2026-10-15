import { auth } from '../core/auth.js';
import { api } from '../core/api-client.js';
import { UI } from '../core/ui.js';
import { renderNavbar } from '../components/navbar.js';
import { ChartRenderer } from '../components/chart-renderer.js';

let currentProject = null;
let currentEstimate = null;
let currentDevices = [];
let scenarioProposals = {}; // { [deviceId]: proposedHours }

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
    const select = document.getElementById('energy-project-select');
    select.innerHTML = '';

    if (projects.length === 0) {
      select.innerHTML = '<option value="">No projects found</option>';
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

    // Set tariff input
    document.getElementById('tariff-input').value = currentProject.electricityTariffPerKwh || 8.0;

    await loadEnergyData(defaultProj._id);
  } catch (err) {
    UI.toast('Failed to load projects: ' + err.message, 'error');
  }
}

async function loadEnergyData(projectId) {
  try {
    const [estimateRes, devicesRes] = await Promise.all([
      api.get(`/energy/project/${projectId}`),
      api.get(`/devices?projectId=${projectId}`)
    ]);

    currentEstimate = estimateRes.estimate || estimateRes;
    currentDevices = devicesRes.devices || [];

    renderKPIs();
    renderCharts();
    renderTable();
    initScenarioTab();
  } catch (err) {
    UI.toast('Failed to load energy analysis: ' + err.message, 'error');
  }
}

function renderKPIs() {
  const dailyKwh = currentEstimate?.totalDailyEnergyKwh || 0;
  const monthlyKwh = currentEstimate?.totalMonthlyEnergyKwh || 0;
  const monthlyCost = currentEstimate?.estimatedMonthlyCost || 0;
  const carbonFactor = currentEstimate?.carbonEmissionsFactor || 0.82;
  const carbonKg = currentEstimate?.estimatedCarbonEmissionsKg || monthlyKwh * carbonFactor;

  const activeCount = currentDevices.filter((d) => !d.isFitting).length;

  document.getElementById('kpi-daily-kwh').innerHTML = `${dailyKwh.toFixed(2)} <span class="fs-6 fw-normal text-muted">kWh</span>`;
  document.getElementById('kpi-daily-cost').textContent = `₹${((monthlyCost / 30) || 0).toFixed(1)} / day`;
  document.getElementById('kpi-monthly-kwh').innerHTML = `${monthlyKwh.toFixed(1)} <span class="fs-6 fw-normal text-muted">kWh</span>`;
  document.getElementById('kpi-monthly-cost').textContent = `₹${Math.round(monthlyCost).toLocaleString()}`;
  document.getElementById('kpi-active-appliances').textContent = `${activeCount} active energy-drawing appliances`;
  document.getElementById('kpi-carbon-kg').innerHTML = `${carbonKg.toFixed(1)} <span class="fs-6 fw-normal text-muted">kg CO₂</span>`;
}

function renderCharts() {
  const breakdown = currentEstimate?.deviceBreakdown || [];
  ChartRenderer.renderEnergyDoughnut('chart-energy-doughnut', breakdown);
  ChartRenderer.renderConsumptionBar('chart-cost-bar', breakdown);
}

function renderTable() {
  const tbody = document.getElementById('breakdown-table-body');
  const breakdown = currentEstimate?.deviceBreakdown || [];

  if (breakdown.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-muted">
          No energy-consuming devices detected in this project yet.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = breakdown
    .map((b) => {
      const isVerified = b.ratingSource === 'user_entered';
      const sourceBadge = isVerified
        ? `<span class="badge bg-success-subtle text-success border border-success-subtle">User Entered</span>`
        : `<span class="badge bg-warning-subtle text-warning border border-warning-subtle">AI Estimate</span>`;

      return `
        <tr>
          <td>
            <div class="fw-semibold text-light">${escapeHtml(b.name)}</div>
            <div class="text-dim small">${b.isVariablePower ? 'Variable Load' : 'Fixed Load'}</div>
          </td>
          <td><span class="badge bg-dark border border-secondary text-capitalize">${(b.category || 'other').replace('_', ' ')}</span></td>
          <td class="text-end font-monospace text-emerald fw-semibold">${b.powerRatingWatts} W</td>
          <td class="text-end font-monospace">${b.dailyUsageHours} h</td>
          <td class="text-end font-monospace">${b.dailyEnergyKwh.toFixed(2)}</td>
          <td class="text-end font-monospace text-light fw-bold">${b.monthlyEnergyKwh.toFixed(1)}</td>
          <td class="text-end font-monospace text-warning fw-bold">₹${Math.round(b.monthlyCost).toLocaleString()}</td>
          <td class="text-center">${sourceBadge}</td>
        </tr>
      `;
    })
    .join('');
}

function initScenarioTab() {
  const container = document.getElementById('scenario-device-rows');
  container.innerHTML = '';

  const activeDevices = currentDevices.filter((d) => !d.isFitting);
  if (activeDevices.length === 0) {
    container.innerHTML = '<div class="text-muted small">No active appliances available to simulate.</div>';
    return;
  }

  // Initialize proposals with existing hours
  scenarioProposals = {};
  activeDevices.forEach((d) => {
    scenarioProposals[d._id] = d.dailyUsageHours || 8;
  });

  activeDevices.forEach((dev) => {
    const card = document.createElement('div');
    card.className = 'p-3 rounded bg-card border border-secondary border-opacity-25';
    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div>
          <span class="fw-semibold text-light me-2">${escapeHtml(dev.displayName)}</span>
          <span class="badge bg-dark border border-secondary text-emerald font-monospace">${dev.powerRatingWatts} W</span>
        </div>
        <div class="text-end">
          <span class="text-muted small">Baseline: ${dev.dailyUsageHours || 8} h/d &nbsp;→&nbsp; </span>
          <span class="text-emerald fw-bold font-monospace" id="prop-lbl-${dev._id}">${scenarioProposals[dev._id]} h/d</span>
        </div>
      </div>
      <input
        type="range"
        class="form-range scen-slider"
        id="scen-slider-${dev._id}"
        data-device-id="${dev._id}"
        min="0"
        max="24"
        step="0.5"
        value="${scenarioProposals[dev._id]}"
      />
    `;
    container.appendChild(card);
  });

  // Slider events
  container.querySelectorAll('.scen-slider').forEach((slider) => {
    slider.addEventListener('input', (e) => {
      const devId = e.target.getAttribute('data-device-id');
      const val = parseFloat(e.target.value);
      scenarioProposals[devId] = val;
      document.getElementById(`prop-lbl-${devId}`).textContent = `${val} h/d`;
      recalculateScenario();
    });
  });

  recalculateScenario();
}

function recalculateScenario() {
  const tariff = Number(currentProject?.electricityTariffPerKwh || 8.0);
  const carbonFactor = 0.82;

  let baselineMonthlyKwh = 0;
  let proposedMonthlyKwh = 0;

  currentDevices.forEach((dev) => {
    if (dev.isFitting) return;
    const watts = Number(dev.powerRatingWatts || 0);
    const baseHours = Number(dev.dailyUsageHours || 0);
    const propHours = scenarioProposals[dev._id] !== undefined ? scenarioProposals[dev._id] : baseHours;
    const days = Number(dev.daysUsedPerMonth || 30);

    baselineMonthlyKwh += (watts * baseHours * days) / 1000;
    proposedMonthlyKwh += (watts * propHours * days) / 1000;
  });

  const diffKwh = Math.max(0, baselineMonthlyKwh - proposedMonthlyKwh);
  const diffCost = diffKwh * tariff;
  const diffCarbon = diffKwh * carbonFactor;

  document.getElementById('scen-base-kwh').textContent = `${baselineMonthlyKwh.toFixed(1)} kWh`;
  document.getElementById('scen-prop-kwh').textContent = `${proposedMonthlyKwh.toFixed(1)} kWh`;
  document.getElementById('scen-diff-kwh').textContent = `-${diffKwh.toFixed(1)} kWh`;
  document.getElementById('scen-diff-cost').textContent = `₹${Math.round(diffCost).toLocaleString()} / month`;
  document.getElementById('scen-diff-carbon').textContent = `Reduces ${diffCarbon.toFixed(1)} kg CO₂ emissions`;

  ChartRenderer.renderScenarioComparison(
    'chart-scenario-compare',
    { monthlyEnergyKwh: baselineMonthlyKwh, monthlyCost: baselineMonthlyKwh * tariff },
    { monthlyEnergyKwh: proposedMonthlyKwh, monthlyCost: proposedMonthlyKwh * tariff }
  );
}

function initListeners() {
  // Project switch
  document.getElementById('energy-project-select')?.addEventListener('change', async (e) => {
    const projId = e.target.value;
    if (!projId) return;
    localStorage.setItem('vt_active_project', projId);
    try {
      const p = await api.get(`/projects/${projId}`);
      currentProject = p.project;
      document.getElementById('tariff-input').value = currentProject.electricityTariffPerKwh || 8.0;
      await loadEnergyData(projId);
    } catch (err) {
      UI.toast('Failed to load project: ' + err.message, 'error');
    }
  });

  // Tariff update button
  document.getElementById('btn-save-tariff')?.addEventListener('click', async () => {
    if (!currentProject) return;
    const tariff = parseFloat(document.getElementById('tariff-input').value);
    if (!tariff || tariff <= 0) {
      UI.toast('Please enter a valid positive tariff (₹/kWh)', 'error');
      return;
    }

    const btn = document.getElementById('btn-save-tariff');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>';

    try {
      await api.put(`/projects/${currentProject._id}`, {
        electricityTariffPerKwh: tariff
      });
      currentProject.electricityTariffPerKwh = tariff;
      UI.toast(`Tariff updated to ₹${tariff.toFixed(2)} / kWh!`, 'success');
      await loadEnergyData(currentProject._id);
    } catch (err) {
      UI.toast('Failed to update tariff: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Update Tariff';
    }
  });

  // Recalculate all button
  document.getElementById('btn-recalculate-all')?.addEventListener('click', async () => {
    if (!currentProject) return;
    const btn = document.getElementById('btn-recalculate-all');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>';
    try {
      await loadEnergyData(currentProject._id);
      UI.toast('Recalculated all energy parameters!', 'success');
    } catch (err) {
      UI.toast('Recalculation error: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Recalculate';
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
