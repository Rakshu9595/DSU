import { auth } from '../core/auth.js';
import { renderNavbar } from '../components/navbar.js';
import { UI } from '../core/ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar();

  const user = await auth.checkAuth();
  if (user) {
    window.location.href = '/dashboard.html';
    return;
  }

  const form = document.getElementById('register-form');
  const alertEl = document.getElementById('register-alert');
  const submitBtn = document.getElementById('register-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertEl.classList.add('d-none');

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (password.length < 6) {
      alertEl.textContent = 'Password must be at least 6 characters.';
      alertEl.classList.remove('d-none');
      return;
    }

    UI.setLoading(submitBtn, true, 'Creating Account...');

    try {
      await auth.register(name, email, password);
      UI.showToast('Account created successfully! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 500);
    } catch (err) {
      alertEl.textContent = err.message || 'Registration failed. Please try again.';
      alertEl.classList.remove('d-none');
      UI.setLoading(submitBtn, false);
    }
  });
});
