import { appConfig } from "../config/app-config.js";
import { authService } from "../services/auth.service.js";

export async function requireAuthentication() {
  if (appConfig.mode === "demo") return true;
  const authenticated = await authService.isAuthenticated();
  if (!authenticated) location.replace("login.html");
  return authenticated;
}
