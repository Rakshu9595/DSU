import { auth } from '../core/auth.js';
import { api } from '../core/api-client.js';

export async function renderNavbar(containerId = 'navbar-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const user = await auth.checkAuth();
  const currentPath = window.location.pathname;

  // Check model server health
  let modelOnline = false;
  try {
    const health = await api.get('/analysis/health');
    modelOnline = health.isOnline;
  } catch (e) {
    modelOnline = false;
  }

  const modelBadge = modelOnline
    ? `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i class="bi bi-cpu-fill me-1"></i>YOLO Models Ready</span>`
    : `<span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1" title="Start FastAPI model server on port 8000"><i class="bi bi-exclamation-circle me-1"></i>Model Server Offline</span>`;

  container.innerHTML = `
    <nav class="vt-navbar">
      <div class="container-fluid px-4 d-flex justify-content-between align-items-center">
        <a href="${user ? '/dashboard.html' : '/index.html'}" class="vt-brand">
          <div class="vt-brand-icon"><i class="bi bi-lightning-charge-fill"></i></div>
          <span>Vision<span class="text-emerald">Twin</span></span>
        </a>

        ${
          user
            ? `
          <div class="d-none d-lg-flex align-items-center gap-4">
            <a href="/dashboard.html" class="nav-link ${currentPath.includes('dashboard') ? 'text-emerald fw-bold' : 'text-muted'}"><i class="bi bi-grid-1x2 me-1"></i>Dashboard</a>
            <a href="/projects.html" class="nav-link ${currentPath.includes('projects') ? 'text-emerald fw-bold' : 'text-muted'}"><i class="bi bi-folder2-open me-1"></i>Projects</a>
            <a href="/upload.html" class="nav-link ${currentPath.includes('upload') ? 'text-emerald fw-bold' : 'text-muted'}"><i class="bi bi-cloud-arrow-up me-1"></i>Upload Video</a>
            <a href="/devices.html" class="nav-link ${currentPath.includes('devices') ? 'text-emerald fw-bold' : 'text-muted'}"><i class="bi bi-plug me-1"></i>Device Ratings</a>
            <a href="/digital-twin.html" class="nav-link ${currentPath.includes('digital-twin') ? 'text-emerald fw-bold' : 'text-muted'}"><i class="bi bi-box me-1"></i>Digital Twin</a>
            <a href="/energy-analysis.html" class="nav-link ${currentPath.includes('energy-analysis') ? 'text-emerald fw-bold' : 'text-muted'}"><i class="bi bi-graph-up-arrow me-1"></i>Energy Analytics</a>
            <a href="/recommendations.html" class="nav-link ${currentPath.includes('recommendations') ? 'text-emerald fw-bold' : 'text-muted'}"><i class="bi bi-magic me-1"></i>AI Recommendations</a>
            <a href="/reports.html" class="nav-link ${currentPath.includes('reports') ? 'text-emerald fw-bold' : 'text-muted'}"><i class="bi bi-file-earmark-pdf me-1"></i>Reports</a>
          </div>

          <div class="d-flex align-items-center gap-3">
            <div class="d-none d-md-block">${modelBadge}</div>
            <div class="dropdown">
              <button class="btn btn-vt-secondary dropdown-toggle d-flex align-items-center gap-2 py-1 px-3" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-person-circle fs-5 text-emerald"></i>
                <span class="fw-semibold">${user.name.split(' ')[0]}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow-lg border-secondary">
                <li><h6 class="dropdown-header text-muted">${user.email}</h6></li>
                <li><a class="dropdown-item" href="/settings.html"><i class="bi bi-gear me-2"></i>Tariff & Settings</a></li>
                <li><hr class="dropdown-divider border-secondary"></li>
                <li><button class="dropdown-item text-danger" id="nav-logout-btn"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</button></li>
              </ul>
            </div>
          </div>
        `
            : `
          <div class="d-flex align-items-center gap-3">
            ${modelBadge}
            <a href="/login.html" class="btn btn-vt-outline btn-sm">Sign In</a>
            <a href="/register.html" class="btn btn-vt-primary btn-sm">Get Started</a>
          </div>
        `
        }
      </div>
    </nav>
  `;

  const logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      auth.logout();
    });
  }
}
