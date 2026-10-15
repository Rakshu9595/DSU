import { escapeHTML } from "../core/ui.js";
export function statusBadge(status) {
  const kind = /complete|ready|verified|active|sample/i.test(status) ? "badge-success" : /error|failed/i.test(status) ? "badge-danger" : "badge-warning";
  return `<span class="badge-soft ${kind}">${escapeHTML(status)}</span>`;
}
