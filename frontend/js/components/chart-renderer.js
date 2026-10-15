const instances = new Map();
const palette = () => {
  const styles = getComputedStyle(document.documentElement);
  return {
    text: styles.getPropertyValue("--muted").trim() || "#94a3b8",
    border: styles.getPropertyValue("--border").trim() || "#253247",
    primary: styles.getPropertyValue("--primary").trim() || "#818cf8"
  };
};
export function renderChart(canvas, type, labels, datasets, options = {}) {
  if (!canvas || typeof Chart === "undefined") return null;
  const existing = instances.get(canvas);
  existing?.destroy();
  const colors = palette();
  const chart = new Chart(canvas, {
    type,
    data: { labels, datasets: datasets.map((dataset) => ({ borderWidth: 2, borderRadius: type === "bar" ? 7 : 0, tension: .35, fill: type === "line", ...dataset })) },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650, easing: "easeOutQuart" },
      interaction: { mode:"index", intersect:false },
      plugins: {
        legend: { labels: { color: colors.text, usePointStyle: true, boxWidth: 8 } },
        tooltip: { backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--surface-3").trim(), titleColor: getComputedStyle(document.documentElement).getPropertyValue("--text").trim(), bodyColor: colors.text, borderColor: colors.border, borderWidth: 1, padding: 12 }
      },
      scales: ["line","bar"].includes(type) ? { x:{ ticks:{color:colors.text}, grid:{color:colors.border} }, y:{ beginAtZero:true, ticks:{color:colors.text}, grid:{color:colors.border} } } : undefined,
      ...options
    }
  });
  instances.set(canvas, chart);
  return chart;
}

window.addEventListener("visiontwin:themechange", () => {
  for (const [canvas, chart] of instances) {
    if (!canvas.isConnected) { chart.destroy(); instances.delete(canvas); continue; }
    const colors = palette();
    if (chart.options.plugins?.legend?.labels) chart.options.plugins.legend.labels.color = colors.text;
    if (chart.options.scales?.x) {
      chart.options.scales.x.ticks.color = colors.text;
      chart.options.scales.x.grid.color = colors.border;
    }
    if (chart.options.scales?.y) {
      chart.options.scales.y.ticks.color = colors.text;
      chart.options.scales.y.grid.color = colors.border;
    }
    chart.update();
  }
});
