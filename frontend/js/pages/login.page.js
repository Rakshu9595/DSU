import { auth } from '../core/auth.js';
import { renderNavbar } from '../components/navbar.js';
import { UI } from '../core/ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar();

  // If already logged in, redirect to dashboard
  const user = await auth.checkAuth();
  if (user) {
    window.location.href = '/dashboard.html';
    return;
  }

  const form = document.getElementById('login-form');
  const alertEl = document.getElementById('login-alert');
  const submitBtn = document.getElementById('login-submit-btn');
  const demoBtn = document.getElementById('demo-autofill-btn');

  // Handle Demo button autofill & submit
  if (demoBtn) {
    demoBtn.addEventListener('click', async () => {
      document.getElementById('email').value = 'demo@visiontwin.io';
      document.getElementById('password').value = 'Password123!';
      form.requestSubmit();
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertEl.classList.add('d-none');
    UI.setLoading(submitBtn, true, 'Signing In...');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      await auth.login(email, password);
      UI.showToast('Login successful! Redirecting...', 'success');

      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirect') || '/dashboard.html';
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 400);
    } catch (err) {
      alertEl.textContent = err.message || 'Login failed. Please check your credentials.';
      alertEl.classList.remove('d-none');
      UI.setLoading(submitBtn, false);
    }
  });
});
