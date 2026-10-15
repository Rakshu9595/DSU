export function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function passwordStrength(value) {
  const password = String(value);
  return [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length;
}

export function showFieldError(input, message) {
  const target = document.getElementById(`${input.id}Error`);
  if (target) target.textContent = message;
  input.setAttribute("aria-invalid", String(Boolean(message)));
  return !message;
}
