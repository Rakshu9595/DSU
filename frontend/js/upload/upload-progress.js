export function setUploadProgress(progress, percent, label) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  progress.value = safe;
  progress.setAttribute("aria-valuenow", String(safe));
  if (label) label.textContent = `${safe}%`;
}
