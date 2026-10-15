const instances = new Map();
export function renderChart(canvas, type, labels, datasets, options = {}) {
  if (!canvas || typeof Chart === "undefined") return null;
  const existing = instances.get(canvas);
  existing?.destroy();
  const dark = document.documentElement.dataset.theme !== "light";
  const chart = new Chart(canvas, {
    type,
    data: { labels, datasets: datasets.map((dataset) => ({ borderWidth: 2, borderRadius: type === "bar" ? 7 : 0, tension: .35, fill: type === "line", ...dataset })) },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: dark ? "#cbd5e1" : "#475569", usePointStyle: true, boxWidth: 8 } } },
      scales: ["line","bar"].includes(type) ? { x:{ ticks:{color:dark?"#94a3b8":"#64748b"}, grid:{color:dark?"#253247":"#e2e8f0"} }, y:{ beginAtZero:true, ticks:{color:dark?"#94a3b8":"#64748b"}, grid:{color:dark?"#253247":"#e2e8f0"} } } : undefined,
      ...options
    }
  });
  instances.set(canvas, chart);
  return chart;
}
