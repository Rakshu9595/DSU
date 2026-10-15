import { auth } from '../core/auth.js';
import { api } from '../core/api-client.js';
import { UI } from '../core/ui.js';
import { renderNavbar } from '../components/navbar.js';
import { DigitalTwinSceneManager } from '../digital-twin/scene-manager.js';

let sceneManager = null;
let currentProject = null;
let currentSceneData = null;
let selectedDeviceObject = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await auth.requireAuth();
  if (!user) return;

  await renderNavbar();
  initSceneManager();
  await loadProjects();
  initUIListeners();
});

function initSceneManager() {
  const container = document.getElementById('twin-canvas-container');
  if (!container) return;

  sceneManager = new DigitalTwinSceneManager(container, onApplianceSelected);
}

async function loadProjects() {
  try {
    const res = await api.get('/projects');
    const projects = Array.isArray(res) ? res : (res?.projects || res?.data || []);
    const select = document.getElementById('twin-project-select');
    select.innerHTML = '';

    if (projects.length === 0) {
      select.innerHTML = '<option value="">No projects available</option>';
      UI.toast('Please create a project first from Dashboard', 'info');
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

    await loadProjectScene(defaultProj._id);
  } catch (err) {
    UI.toast('Failed to load projects: ' + err.message, 'error');
  }
}

async function loadProjectScene(projectId) {
  try {
    currentSceneData = await sceneManager.loadProjectScene(projectId);

    // Sync room dimensions modal values
    if (currentSceneData.roomDimensions) {
      const { length, width, height } = currentSceneData.roomDimensions;
      if (document.getElementById('dim-length')) document.getElementById('dim-length').value = length || 5;
      if (document.getElementById('dim-width')) document.getElementById('dim-width').value = width || 4;
      if (document.getElementById('dim-height')) document.getElementById('dim-height').value = height || 2.8;
    }
  } catch (err) {
    UI.toast('Failed to load 3D scene: ' + err.message, 'error');
  }
}

function onApplianceSelected(mesh) {
  const inspector = document.getElementById('twin-inspector');
  if (!mesh || !mesh.userData) {
    inspector.classList.remove('active');
    selectedDeviceObject = null;
    return;
  }

  selectedDeviceObject = mesh;
  const data = mesh.userData;

  inspector.classList.add('active');

  // Fill inspector
  document.getElementById('insp-title').textContent = data.displayName || data.canonicalName || 'Device';
  document.getElementById('insp-category').textContent = (data.category || 'Appliance').replace('_', ' ');
  document.getElementById('insp-confidence').innerHTML = `<i class="bi bi-eye text-emerald me-1"></i>${Math.round((data.detectionConfidence || 0.85) * 100)}%`;

  const sourceBadge = document.getElementById('insp-source-badge');
  if (data.powerRatingVerified || data.powerRatingSource === 'user_entered') {
    sourceBadge.innerHTML = `<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-patch-check-fill me-1"></i>Verified</span>`;
  } else {
    sourceBadge.innerHTML = `<span class="badge bg-warning-subtle text-warning border border-warning-subtle"><i class="bi bi-cpu me-1"></i>AI Estimate</span>`;
  }

  const wattsInput = document.getElementById('insp-watts-input');
  const hoursSlider = document.getElementById('insp-hours-range');
  const hoursVal = document.getElementById('insp-hours-val');

  if (data.isFitting) {
    wattsInput.value = 0;
    wattsInput.disabled = true;
    document.getElementById('insp-save-watts-btn').disabled = true;
    document.getElementById('insp-reset-watts-btn').disabled = true;
    document.getElementById('insp-type-label').textContent = 'Passive Fitting (0W)';
  } else {
    wattsInput.value = data.powerRatingWatts || 75;
    wattsInput.disabled = false;
    document.getElementById('insp-save-watts-btn').disabled = false;
    document.getElementById('insp-reset-watts-btn').disabled = false;
    document.getElementById('insp-type-label').textContent = 'Rated Input Power';
  }

  const hours = data.dailyUsageHours || 8;
  hoursSlider.value = hours;
  hoursVal.textContent = `${hours} hrs/day`;

  // Coordinates
  document.getElementById('insp-pos-x').value = mesh.position.x.toFixed(2);
  document.getElementById('insp-pos-y').value = mesh.position.y.toFixed(2);
  document.getElementById('insp-pos-z').value = mesh.position.z.toFixed(2);

  updateInspectorCalculations();
}

function updateInspectorCalculations() {
  if (!selectedDeviceObject) return;
  const watts = parseFloat(document.getElementById('insp-watts-input').value) || 0;
  const hours = parseFloat(document.getElementById('insp-hours-range').value) || 0;
  const tariff = Number(currentProject?.electricityTariffPerKwh || 8.0);

  const dailyKwh = (watts * hours) / 1000;
  const monthlyKwh = dailyKwh * 30;
  const monthlyCost = monthlyKwh * tariff;

  document.getElementById('insp-daily-kwh').textContent = `${dailyKwh.toFixed(2)} kWh`;
  document.getElementById('insp-monthly-cost').textContent = `₹${Math.round(monthlyCost).toLocaleString()}`;
}

function initUIListeners() {
  // Project switch
  document.getElementById('twin-project-select')?.addEventListener('change', async (e) => {
    const projectId = e.target.value;
    if (!projectId) return;
    localStorage.setItem('vt_active_project', projectId);
    try {
      const p = await api.get(`/projects/${projectId}`);
      currentProject = p.project;
      await loadProjectScene(projectId);
    } catch (err) {
      UI.toast('Failed to load project: ' + err.message, 'error');
    }
  });

  // Close inspector
  document.getElementById('btn-close-inspector')?.addEventListener('click', () => {
    document.getElementById('twin-inspector').classList.remove('active');
    selectedDeviceObject = null;
  });

  // Camera presets
  document.getElementById('cam-iso')?.addEventListener('click', () => sceneManager?.cameraController?.setPreset('iso'));
  document.getElementById('cam-top')?.addEventListener('click', () => sceneManager?.cameraController?.setPreset('top'));
  document.getElementById('cam-front')?.addEventListener('click', () => sceneManager?.cameraController?.setPreset('front'));
  document.getElementById('cam-reset')?.addEventListener('click', () => sceneManager?.cameraController?.setPreset('iso'));

  // Visual mode toggles
  const btnReal = document.getElementById('mode-realistic');
  const btnHeat = document.getElementById('mode-heatmap');
  const btnScen = document.getElementById('mode-scenario');

  btnReal?.addEventListener('click', () => {
    btnReal.classList.add('active');
    btnHeat.classList.remove('active');
    btnScen.classList.remove('active');
    sceneManager?.setVisualMode('realistic');
  });

  btnHeat?.addEventListener('click', () => {
    btnHeat.classList.add('active');
    btnReal.classList.remove('active');
    btnScen.classList.remove('active');
    sceneManager?.setVisualMode('heatmap');
  });

  btnScen?.addEventListener('click', () => {
    btnScen.classList.add('active');
    btnReal.classList.remove('active');
    btnHeat.classList.remove('active');
    sceneManager?.setVisualMode('scenario');
  });

  // Slider hours live calc
  const hoursSlider = document.getElementById('insp-hours-range');
  hoursSlider?.addEventListener('input', (e) => {
    document.getElementById('insp-hours-val').textContent = `${e.target.value} hrs/day`;
    updateInspectorCalculations();
  });

  // Input watts live calc
  document.getElementById('insp-watts-input')?.addEventListener('input', updateInspectorCalculations);

  // Position inputs live update in Three.js scene
  ['insp-pos-x', 'insp-pos-y', 'insp-pos-z'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => {
      if (!selectedDeviceObject) return;
      const x = parseFloat(document.getElementById('insp-pos-x').value) || 0;
      const y = parseFloat(document.getElementById('insp-pos-y').value) || 0;
      const z = parseFloat(document.getElementById('insp-pos-z').value) || 0;
      selectedDeviceObject.position.set(x, y, z);
    });
  });

  // Save Power Rating from 3D Inspector to MongoDB
  document.getElementById('insp-save-watts-btn')?.addEventListener('click', async () => {
    if (!selectedDeviceObject || !selectedDeviceObject.userData) return;
    const deviceId = selectedDeviceObject.userData.deviceId || selectedDeviceObject.userData._id;
    const watts = parseFloat(document.getElementById('insp-watts-input').value);
    const hours = parseFloat(document.getElementById('insp-hours-range').value);

    if (!watts || watts <= 0) {
      UI.toast('Please enter a valid positive power rating (W)', 'error');
      return;
    }

    const saveBtn = document.getElementById('insp-save-watts-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>';

    try {
      // 1. Update power rating
      const res = await api.patch(`/devices/${deviceId}/power-rating`, {
        powerRatingWatts: watts,
        powerRatingSource: 'user_entered'
      });

      // 2. Also update daily usage hours if changed
      await api.put(`/devices/${deviceId}`, {
        dailyUsageHours: hours
      });

      // Update in-memory userData
      selectedDeviceObject.userData.powerRatingWatts = watts;
      selectedDeviceObject.userData.dailyUsageHours = hours;
      selectedDeviceObject.userData.powerRatingSource = 'user_entered';
      selectedDeviceObject.userData.powerRatingVerified = true;

      // Update badge
      document.getElementById('insp-source-badge').innerHTML = `
        <span class="badge bg-success-subtle text-success border border-success-subtle">
          <i class="bi bi-patch-check-fill me-1"></i>Verified
        </span>
      `;

      UI.toast('Power rating and usage saved to database!', 'success');
    } catch (err) {
      UI.toast(err.message || 'Failed to save rating', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="bi bi-check2"></i> Save Rating';
    }
  });

  // Reset to reference estimate
  document.getElementById('insp-reset-watts-btn')?.addEventListener('click', async () => {
    if (!selectedDeviceObject || !selectedDeviceObject.userData) return;
    const deviceId = selectedDeviceObject.userData.deviceId || selectedDeviceObject.userData._id;

    try {
      const res = await api.delete(`/devices/${deviceId}/power-rating`);
      const updated = res.device;

      selectedDeviceObject.userData.powerRatingWatts = updated.powerRatingWatts;
      selectedDeviceObject.userData.powerRatingSource = updated.powerRatingSource;
      selectedDeviceObject.userData.powerRatingVerified = false;

      document.getElementById('insp-watts-input').value = updated.powerRatingWatts;
      document.getElementById('insp-source-badge').innerHTML = `
        <span class="badge bg-warning-subtle text-warning border border-warning-subtle">
          <i class="bi bi-cpu me-1"></i>AI Estimate
        </span>
      `;

      updateInspectorCalculations();
      UI.toast('Power rating reset to reference estimate', 'info');
    } catch (err) {
      UI.toast(err.message || 'Failed to reset rating', 'error');
    }
  });

  // Save full 3D layout to MongoDB
  document.getElementById('btn-save-scene')?.addEventListener('click', async () => {
    if (!currentProject || !sceneManager) return;
    const saveBtn = document.getElementById('btn-save-scene');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

    try {
      const objects = sceneManager.objectsGroup.children.map((mesh) => ({
        deviceId: mesh.userData?.deviceId || mesh.userData?._id,
        name: mesh.userData?.displayName || mesh.userData?.canonicalName || 'Appliance',
        canonicalName: mesh.userData?.canonicalName || 'generic',
        category: mesh.userData?.category || 'cooling',
        isFitting: !!mesh.userData?.isFitting,
        position: {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z
        },
        rotation: {
          x: mesh.rotation.x,
          y: mesh.rotation.y,
          z: mesh.rotation.z
        },
        scale: {
          x: mesh.scale.x,
          y: mesh.scale.y,
          z: mesh.scale.z
        }
      }));

      await api.put(`/digital-twin/project/${currentProject._id}/scene`, {
        roomDimensions: currentSceneData?.roomDimensions || { length: 5, width: 4, height: 2.8 },
        objects
      });

      UI.toast('3D room layout saved successfully!', 'success');
    } catch (err) {
      UI.toast(err.message || 'Failed to save layout', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="bi bi-floppy me-1"></i> Save Layout';
    }
  });

  // Room dimensions modal form
  const dimForm = document.getElementById('form-room-dimensions');
  dimForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentProject) return;

    const length = parseFloat(document.getElementById('dim-length').value) || 5;
    const width = parseFloat(document.getElementById('dim-width').value) || 4;
    const height = parseFloat(document.getElementById('dim-height').value) || 2.8;
    const theme = document.getElementById('dim-theme').value || 'modern_dark';

    const saveDimBtn = document.getElementById('btn-save-dimensions');
    saveDimBtn.disabled = true;
    saveDimBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Applying...';

    try {
      await api.put(`/digital-twin/project/${currentProject._id}/dimensions`, {
        roomDimensions: { length, width, height },
        roomTheme: theme
      });

      sceneManager.updateDimensions({ length, width, height });
      if (currentSceneData) {
        currentSceneData.roomDimensions = { length, width, height };
        currentSceneData.roomTheme = theme;
      }

      // Hide modal
      const modalEl = document.getElementById('roomSettingsModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      UI.toast('Room dimensions updated live!', 'success');
    } catch (err) {
      UI.toast(err.message || 'Failed to update dimensions', 'error');
    } finally {
      saveDimBtn.disabled = false;
      saveDimBtn.innerHTML = 'Apply Dimensions';
    }
  });
}
