export function bindTwinSelection(canvas, panel) {
  canvas.addEventListener("device-select", (event) => {
    const { name, watts, category } = event.detail;
    panel.textContent = `${name} · ${category || "Room object"} · ${watts ? `${watts} W estimated` : "Decorative object"}`;
  });
}
