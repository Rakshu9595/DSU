export function bindTwinSelection(canvas, panel) {
  canvas.addEventListener("device-select", (event) => {
    const { name, watts } = event.detail;
    panel.textContent = `${name} · ${watts ? `${watts} W estimated` : "Decorative object"}`;
  });
}
