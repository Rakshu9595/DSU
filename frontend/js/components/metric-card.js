import { escapeHTML } from "../core/ui.js";
export function metricCard({ label, value, unit = "", detail = "", icon = "activity", trend = "" }) {
  return `<article class="card-surface metric-card"><div class="d-flex justify-content-between"><span class="text-muted small">${escapeHTML(label)}</span><span class="icon-tile" style="width:36px;height:36px"><i class="bi bi-${escapeHTML(icon)}"></i></span></div><div class="metric-value">${escapeHTML(value)} <small class="fs-6 text-muted">${escapeHTML(unit)}</small></div><div class="d-flex justify-content-between small"><span class="text-muted">${escapeHTML(detail)}</span><span class="metric-trend">${escapeHTML(trend)}</span></div></article>`;
}
