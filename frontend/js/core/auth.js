import { api } from './api-client.js';

export class AuthManager {
  constructor() {
    this.user = null;
  }

  async checkAuth() {
    try {
      const data = await api.get('/auth/me');
      this.user = data.user;
      localStorage.setItem('vt_user', JSON.stringify(data.user));
      return this.user;
    } catch (err) {
      this.user = null;
      localStorage.removeItem('vt_user');
      return null;
    }
  }

  getCachedUser() {
    if (this.user) return this.user;
    const stored = localStorage.getItem('vt_user');
    if (stored) {
      try {
        this.user = JSON.parse(stored);
        return this.user;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    this.user = data.user;
    localStorage.setItem('vt_user', JSON.stringify(data.user));
    return this.user;
  }

  async register(name, email, password) {
    const data = await api.post('/auth/register', { name, email, password });
    this.user = data.user;
    localStorage.setItem('vt_user', JSON.stringify(data.user));
    return this.user;
  }

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    this.user = null;
    localStorage.removeItem('vt_user');
    window.location.href = '/login.html';
  }

  async requireAuth() {
    const user = await this.checkAuth();
    if (!user) {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return null;
    }
    return user;
  }
}

export const auth = new AuthManager();
