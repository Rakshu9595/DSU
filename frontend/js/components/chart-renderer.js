export class ChartRenderer {
  static renderEnergyDoughnut(canvasId, breakdown = []) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const labels = breakdown.map((b) => b.name);
    const data = breakdown.map((b) => b.monthlyEnergyKwh);

    const colors = [
      '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
      '#f59e0b', '#f43f5e', '#ec4899', '#14b8a6'
    ];

    if (ctx.chartInstance) {
      ctx.chartInstance.destroy();
    }

    ctx.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: '#0f172a',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#94a3b8', font: { family: 'Outfit', size: 11 }, boxWidth: 12 }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${context.raw} kWh (${breakdown[context.dataIndex]?.percentOfTotalEnergy || 0}%)`
            }
          }
        },
        cutout: '68%'
      }
    });

    return ctx.chartInstance;
  }

  static renderConsumptionBar(canvasId, breakdown = []) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const labels = breakdown.slice(0, 8).map((b) => b.name.substring(0, 14));
    const data = breakdown.slice(0, 8).map((b) => b.monthlyCost);

    if (ctx.chartInstance) {
      ctx.chartInstance.destroy();
    }

    ctx.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Estimated Cost (₹/mo)',
            data,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: '#94a3b8', font: { family: 'Outfit' } },
            grid: { display: false }
          },
          y: {
            ticks: { color: '#94a3b8', callback: (val) => `₹${val}` },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    return ctx.chartInstance;
  }

  static renderScenarioComparison(canvasId, baseline, proposed) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    if (ctx.chartInstance) {
      ctx.chartInstance.destroy();
    }

    ctx.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Monthly Energy (kWh)', 'Monthly Cost (₹)'],
        datasets: [
          {
            label: 'Baseline (Current)',
            data: [baseline.monthlyEnergyKwh, baseline.monthlyCost],
            backgroundColor: 'rgba(244, 63, 94, 0.65)',
            borderColor: '#f43f5e',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Proposed Scenario',
            data: [proposed.monthlyEnergyKwh, proposed.monthlyCost],
            backgroundColor: 'rgba(16, 185, 129, 0.65)',
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
        },
        plugins: {
          legend: { labels: { color: '#ffffff', font: { family: 'Outfit' } } }
        }
      }
    });

    return ctx.chartInstance;
  }
}
