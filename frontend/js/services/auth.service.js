import { appConfig } from "../config/app-config.js";
import { apiRequest } from "../core/api-client.js";

function validateEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 8;
}

function requireValidCredentials({ email, password } = {}) {
  if (!validateEmail(email)) throw new TypeError("Enter a valid email address.");
  if (!validatePassword(password)) throw new TypeError("Password must be at least 8 characters.");
}

export const authService = Object.freeze({
  async login({ email, password } = {}) {
    requireValidCredentials({ email, password });
    if (appConfig.mode === "demo") {
      return { authenticated: false, mode: "demo", message: "Authentication is not connected in demo mode." };
    }

    return apiRequest(appConfig.endpoints.auth.login, {
      method: "POST",
      body: { email: email.trim(), password }
    });
  },

  async register({ name, email, password } = {}) {
    if (typeof name !== "string" || name.trim().length < 2) {
      throw new TypeError("Name must be at least 2 characters.");
    }
    requireValidCredentials({ email, password });
    if (appConfig.mode === "demo") {
      return { created: false, mode: "demo", message: "Registration is not connected in demo mode." };
    }

    return apiRequest(appConfig.endpoints.auth.register, {
      method: "POST",
      body: { name: name.trim(), email: email.trim(), password }
    });
  },

  async logout() {
    if (appConfig.mode === "demo") {
      return { loggedOut: true, mode: "demo" };
    }

    const result = await apiRequest(appConfig.endpoints.auth.logout, { method: "POST" });
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("visiontwin-authenticated");
    }
    return result;
  },

  async getCurrentUser() {
    if (appConfig.mode === "demo") return null;
    const result = await apiRequest(appConfig.endpoints.auth.me);
    if (!result || typeof result !== "object") return null;
    if (result.authenticated === false || result.isAuthenticated === false) return null;
    if (Object.hasOwn(result, "user")) return result.user ?? null;
    if (result.data && typeof result.data === "object" && Object.hasOwn(result.data, "user")) {
      return result.data.user ?? null;
    }
    return result;
  },

  async isAuthenticated() {
    return Boolean(await authService.getCurrentUser());
  }
});

export const login = (...args) => authService.login(...args);
export const register = (...args) => authService.register(...args);
export const logout = (...args) => authService.logout(...args);
export const getCurrentUser = (...args) => authService.getCurrentUser(...args);
export const isAuthenticated = (...args) => authService.isAuthenticated(...args);
