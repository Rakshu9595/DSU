import { escapeHTML } from "../core/ui.js";
export function dataTable({ columns, rows, emptyText = "No data to display." }) {
  if (!rows.length) return `<div class="empty-state text-muted">${escapeHTML(emptyText)}</div>`;
  return `<div class="table-responsive"><table class="table align-middle"><thead><tr>${columns.map((column) => `<th scope="col">${escapeHTML(column.label)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHTML(column.render ? column.render(row) : row[column.key] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
