import { auth } from '../core/auth.js';
import { api } from '../core/api-client.js';
import { UI } from '../core/ui.js';
import { renderNavbar } from '../components/navbar.js';

let currentProject = null;
let recommendationsList = [];

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
    const select = document.getElementById('rec-project-select');
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

    await loadRecommendations(defaultProj._id);
  } catch (err) {
    UI.toast('Failed to load projects: ' + err.message, 'error');
  }
}

async function loadRecommendations(projectId) {
  const container = document.getElementById('recommendations-container');
  container.innerHTML = `
    <div class="card bg-card border-secondary border-opacity-25 p-5 text-center">
      <div class="spinner-border text-emerald mb-2" role="status"></div>
      <div>Loading recommendations...</div>
    </div>
  `;

  try {
    const res = await api.get(`/recommendations/project/${projectId}`);
    recommendationsList = res.recommendations || [];
    renderRecommendations();
  } catch (err) {
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>Failed to fetch recommendations: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

function renderRecommendations() {
  const container = document.getElementById('recommendations-container');
  container.innerHTML = '';

  if (recommendationsList.length === 0) {
    container.innerHTML = `
      <div class="card bg-card border-secondary border-opacity-25 p-5 text-center">
        <i class="bi bi-magic fs-1 text-emerald mb-3"></i>
        <h5 class="fw-bold">No AI Recommendations Generated Yet</h5>
        <p class="text-muted small mb-4">Click "Generate AI Strategy" to analyze your project's power ratings and usage patterns.</p>
        <div>
          <button class="btn btn-vt-primary" id="btn-empty-generate-action">
            <i class="bi bi-stars me-1"></i> Generate AI Strategy
          </button>
        </div>
      </div>
    `;
    document.getElementById('btn-empty-generate-action')?.addEventListener('click', triggerGenerate);
    return;
  }

  recommendationsList.forEach((rec) => {
    const card = document.createElement('div');
    card.className = 'card bg-card border-secondary border-opacity-25 p-4 shadow-sm';

    const prioColor = rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'info';

    const targetName = rec.targetDeviceName || rec.targetAppliance;
    const costSaved = rec.estimatedCostSavings !== undefined ? rec.estimatedCostSavings : rec.estimatedSavings?.monthlyCost;
    const kwhSaved = rec.estimatedPotentialSavingsKwh !== undefined ? rec.estimatedPotentialSavingsKwh : rec.estimatedSavings?.monthlyEnergyKwh;

    card.innerHTML = `
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-2 mb-3">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-${prioColor}-subtle text-${prioColor} border border-${prioColor}-subtle text-uppercase fw-bold">
              ${rec.priority} Priority
            </span>
            <span class="badge bg-dark border border-secondary text-capitalize">
              ${(rec.category || 'Efficiency').replace('_', ' ')}
            </span>
            ${targetName ? `<span class="badge bg-dark border border-emerald-subtle text-emerald"><i class="bi bi-plug me-1"></i>${escapeHtml(targetName)}</span>` : ''}
          </div>
          <h5 class="fw-bold text-light mb-0">${escapeHtml(rec.title)}</h5>
        </div>

        ${
          costSaved !== undefined
            ? `
          <div class="text-md-end bg-dark p-2 rounded border border-secondary border-opacity-25">
            <div class="text-dim small">Simulated Savings</div>
            <div class="font-monospace text-emerald fw-bold">₹${Math.round(costSaved)} / mo</div>
            <div class="text-dim small font-monospace">${Number(kwhSaved || 0).toFixed(1)} kWh</div>
          </div>
        `
            : ''
        }
      </div>

      <p class="text-muted small mb-3 leading-relaxed">
        ${escapeHtml(rec.description)}
      </p>

      ${
        rec.actionableSteps && rec.actionableSteps.length > 0
          ? `
        <div class="bg-dark p-3 rounded-3 mb-3 border border-secondary border-opacity-25">
          <div class="fw-semibold text-light small mb-2"><i class="bi bi-check2-circle text-emerald me-1"></i>Recommended Action Steps:</div>
          <ul class="mb-0 ps-3 small text-muted">
            ${rec.actionableSteps.map((step) => `<li class="mb-1">${escapeHtml(step)}</li>`).join('')}
          </ul>
        </div>
      `
          : ''
      }

      <div class="d-flex justify-content-between align-items-center text-dim small border-top border-secondary border-opacity-25 pt-2">
        <span><i class="bi bi-robot text-emerald me-1"></i>Synthesized by VisionTwin GenAI Provider</span>
        <span>Confidence: ${Math.round((rec.confidenceScore || 0.9) * 100)}%</span>
      </div>
    `;

    container.appendChild(card);
  });
}

async function triggerGenerate() {
  if (!currentProject) {
    UI.toast('Please select an active project', 'warning');
    return;
  }

  const btn = document.getElementById('btn-generate-recs');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Analyzing Wattages & Patterns...';

  const goal = document.getElementById('rec-goal-select')?.value || 'reduce_bill';
  const customDirective = document.getElementById('rec-custom-directive')?.value.trim();

  try {
    const res = await api.post(`/recommendations/project/${currentProject._id}/generate`, {
      userGoals: [goal],
      customDirective
    });

    UI.toast('AI Optimization Strategy Generated!', 'success');
    recommendationsList = Array.isArray(res) ? res : res.recommendations || res.data || [];
    renderRecommendations();
  } catch (err) {
    UI.toast(err.message || 'Failed to generate recommendations', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-stars me-1"></i> Generate AI Strategy';
  }
}

function initListeners() {
  document.getElementById('rec-project-select')?.addEventListener('change', async (e) => {
    const id = e.target.value;
    if (!id) return;
    localStorage.setItem('vt_active_project', id);
    try {
      const p = await api.get(`/projects/${id}`);
      currentProject = p.project;
      await loadRecommendations(id);
    } catch (err) {
      UI.toast('Failed to load project: ' + err.message, 'error');
    }
  });

  document.getElementById('btn-generate-recs')?.addEventListener('click', triggerGenerate);
  document.getElementById('btn-quick-refresh')?.addEventListener('click', () => {
    if (currentProject) loadRecommendations(currentProject._id);
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
