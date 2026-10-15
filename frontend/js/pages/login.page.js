import { toast, setButtonLoading, initCommonUi } from "../core/ui.js";
import { validateEmail, showFieldError } from "../core/validation.js";
import { auth } from "../core/auth.js";

initCommonUi();
const form = document.querySelector("#loginForm");
form?.querySelectorAll("[data-password-toggle]").forEach((button) => button.addEventListener("click", () => {
  const input = document.getElementById(button.dataset.passwordToggle);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
  button.setAttribute("aria-label", input.type === "password" ? "Show password" : "Hide password");
  button.querySelector("i").className = `bi bi-eye${input.type === "password" ? "" : "-slash"}`;
}));
form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = form.elements.email;
  const password = form.elements.password;
  const validEmail = showFieldError(email, validateEmail(email.value) ? "" : "Enter a valid email address.");
  const validPassword = showFieldError(password, password.value.length >= 8 ? "" : "Password must be at least 8 characters.");
  if (!validEmail || !validPassword) return;
  const button = form.querySelector("[type=submit]");
  setButtonLoading(button, true);
  try {
    const result = await auth.login({ email: email.value, password: password.value });
    const message = document.querySelector("#authMessage");
    if (result.mode === "demo") {
      message.textContent = "Authentication is not connected in demo mode. No credentials were sent or stored.";
      toast("Use Explore demo workspace to browse sample data.");
    } else {
      message.textContent = "Sign-in request completed. Backend session handling must be configured for the application.";
    }
  } catch (error) {
    document.querySelector("#authMessage").textContent = error.message;
  } finally {
    setButtonLoading(button, false);
  }
});
document.querySelector("#forgotLink")?.addEventListener("click", (event) => {
  event.preventDefault();
  toast("Password recovery requires a connected authentication backend.");
});
