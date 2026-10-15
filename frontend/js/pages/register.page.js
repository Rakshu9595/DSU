import { toast, setButtonLoading, initCommonUi } from "../core/ui.js";
import { validateEmail, passwordStrength, showFieldError } from "../core/validation.js";
import { auth } from "../core/auth.js";

initCommonUi();
const form = document.querySelector("#registerForm");
const password = document.querySelector("#password");
password?.addEventListener("input", () => {
  document.querySelector("#passwordMeter")?.setAttribute("data-strength", String(passwordStrength(password.value)));
});
form?.querySelectorAll("[data-password-toggle]").forEach((button) => button.addEventListener("click", () => {
  const input = document.getElementById(button.dataset.passwordToggle);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
  button.setAttribute("aria-label", input.type === "password" ? "Show password" : "Hide password");
}));
form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = form.elements.name;
  const email = form.elements.email;
  const confirm = form.elements.confirmPassword;
  const valid = [
    showFieldError(name, name.value.trim().length >= 2 ? "" : "Enter at least 2 characters."),
    showFieldError(email, validateEmail(email.value) ? "" : "Enter a valid email address."),
    showFieldError(password, password.value.length >= 8 ? "" : "Choose a password with at least 8 characters."),
    showFieldError(confirm, confirm.value === password.value ? "" : "Passwords do not match.")
  ].every(Boolean);
  if (!valid || !form.elements.terms.checked) {
    if (!form.elements.terms.checked) toast("Please accept the terms to continue.", "error");
    return;
  }
  const button = form.querySelector("[type=submit]");
  setButtonLoading(button, true);
  try {
    const result = await auth.register({ name: name.value.trim(), email: email.value, password: password.value });
    document.querySelector("#authMessage").textContent = result.mode === "demo"
      ? "Account creation is disabled in demo mode. Your details were not sent or stored."
      : "Registration request completed. Backend verification and session handling are required.";
    toast("Explore demo workspace is available without registration.");
  } catch (error) {
    document.querySelector("#authMessage").textContent = error.message;
  } finally {
    setButtonLoading(button, false);
  }
});
