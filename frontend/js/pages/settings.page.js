import { mountApp, toast, escapeHTML } from "../core/ui.js";
import { settingsService } from "../services/settings.service.js";
import { validateEmail } from "../core/validation.js";

mountApp("Settings",`<div class="app-page-title"><div><span class="demo-label">LOCAL DEMO PREFERENCES</span><h1 class="mt-3">Settings</h1><p>Preferences are stored in this browser only. Account security requires a backend.</p></div></div><div class="row g-3"><div class="col-xl-8"><form id="settingsForm" class="d-grid gap-3"><section class="card-surface panel"><h2 class="h5 mb-3">Profile</h2><div class="row g-3"><div class="col-md-6"><label class="form-label" for="profileName">Display name</label><input class="form-control" id="profileName" required minlength="2"></div><div class="col-md-6"><label class="form-label" for="profileEmail">Email address</label><input class="form-control" id="profileEmail" type="email" required></div></div></section><section class="card-surface panel"><h2 class="h5 mb-3">Energy preferences</h2><div class="row g-3"><div class="col-md-4"><label class="form-label" for="settingsTariff">Tariff per kWh</label><input class="form-control" id="settingsTariff" type="number" min="0" step=".1" required></div><div class="col-md-4"><label class="form-label" for="currency">Currency</label><select class="form-select" id="currency"><option value="INR">INR · ₹</option><option value="USD">USD · $</option><option value="EUR">EUR · €</option></select></div><div class="col-md-4"><label class="form-label" for="units">Measurement units</label><select class="form-select" id="units"><option value="metric">Metric</option><option value="imperial">Imperial</option></select></div></div></section><section class="card-surface panel"><h2 class="h5 mb-3">Notifications</h2><div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="notifications"><label class="form-check-label" for="notifications">Product updates and energy insights</label></div></section><section class="card-surface panel"><h2 class="h5 mb-3">Security</h2><label class="form-label" for="newPassword">Change password</label><input class="form-control" id="newPassword" type="password" minlength="8" autocomplete="new-password" placeholder="Available when authentication is connected"><div class="small text-muted mt-2">Password changes are disabled until a secure authentication backend is connected.</div></section><div class="d-flex gap-2 justify-content-end"><button class="btn-outline-soft" type="reset" id="resetSettings">Reset</button><button class="btn-primary-soft" type="submit">Save preferences</button></div></form></div><div class="col-xl-4"><aside class="card-surface panel"><h2 class="h5">Appearance</h2><p class="small text-muted">Choose between dark and light themes.</p><button class="btn-outline-soft w-100" id="settingsTheme"><i class="bi bi-circle-half"></i> Toggle theme</button><hr style="border-color:var(--border)"><p class="small mb-0"><strong>Storage note</strong><br><span class="text-muted">Demo profile settings use local browser storage. Do not enter sensitive information.</span></p></aside></div></div><p class="small mt-3" id="settingsFeedback" role="status" aria-live="polite"></p>`);

const form=document.querySelector("#settingsForm");
const saved=await settingsService.get();
function fill(values){
  document.querySelector("#profileName").value=values.name||"";
  document.querySelector("#profileEmail").value=values.email||"";
  document.querySelector("#settingsTariff").value=values.tariff??9;
  document.querySelector("#currency").value=values.currency||"INR";
  document.querySelector("#units").value=values.units||"metric";
  document.querySelector("#notifications").checked=values.notifications!==false;
}
fill(saved);
form.addEventListener("submit",async(event)=>{
  event.preventDefault();
  const settings={name:document.querySelector("#profileName").value.trim(),email:document.querySelector("#profileEmail").value.trim(),tariff:Number(document.querySelector("#settingsTariff").value),currency:document.querySelector("#currency").value,units:document.querySelector("#units").value,notifications:document.querySelector("#notifications").checked};
  if(settings.name.length<2||!validateEmail(settings.email)||!Number.isFinite(settings.tariff)||settings.tariff<0){toast("Check your name, email, and non-negative tariff.","error");return;}
  try{await settingsService.save(settings);document.querySelector("#settingsFeedback").textContent="Preferences saved in this browser.";toast("Preferences saved locally.","success");}
  catch(error){toast(`Unable to save settings: ${error.message}`,"error");}
});
document.querySelector("#resetSettings").addEventListener("click",(event)=>{event.preventDefault();fill(saved);toast("Settings reset to the loaded values.");});
document.querySelector("#settingsTheme").addEventListener("click",()=>{const toggle=document.querySelector("#themeToggle");if(toggle)toggle.click();else toast("Theme toggle is unavailable.");});
document.querySelector("#newPassword").addEventListener("change",()=>{if(document.querySelector("#newPassword").value)toast("Password change is unavailable without backend authentication.");});
