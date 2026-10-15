import { auth } from '../core/auth.js';
import { api } from '../core/api-client.js';
import { UI } from '../core/ui.js';
import { renderNavbar } from '../components/navbar.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await auth.requireAuth();
  if (!user) return;

  await renderNavbar();
  loadUserProfile(user);
  checkSystemDiagnostics();
  initSettingsForm();
});

function loadUserProfile(user) {
  document.getElementById('set-user-name').value = user.name || 'User';
  document.getElementById('set-user-email').value = user.email || 'user@visiontwin.io';

  const savedTariff = localStorage.getItem('vt_default_tariff') || '8.0';
  const savedCarbon = localStorage.getItem('vt_default_carbon') || '0.82';

  document.getElementById('set-tariff').value = savedTariff;
  document.getElementById('set-carbon-factor').value = savedCarbon;
}

async function checkSystemDiagnostics() {
  const modelStatusEl = document.getElementById('diag-model-status');

  try {
    const health = await api.get('/analysis/health');
    if (health.isOnline) {
      modelStatusEl.innerHTML = `
        <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
          <i class="bi bi-cpu-fill me-1"></i>YOLO Models Ready (Port 8000)
        </span>
      `;
    } else {
      modelStatusEl.innerHTML = `
        <span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
          <i class="bi bi-exclamation-triangle me-1"></i>Offline
        </span>
      `;
    }
  } catch (err) {
    modelStatusEl.innerHTML = `
      <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
        <i class="bi bi-x-circle me-1"></i>Unreachable
      </span>
    `;
  }
}

function initSettingsForm() {
  const form = document.getElementById('form-settings');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const tariff = document.getElementById('set-tariff').value;
    const carbon = document.getElementById('set-carbon-factor').value;

    localStorage.setItem('vt_default_tariff', tariff);
    localStorage.setItem('vt_default_carbon', carbon);

    UI.toast('Preferences saved successfully!', 'success');
  });
}
