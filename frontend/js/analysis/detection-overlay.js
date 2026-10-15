export function drawDetectionBoxes(container, detections) {
  container.replaceChildren();
  detections.filter((item) => item.box && [item.box.x,item.box.y,item.box.width,item.box.height].every(Number.isFinite)).forEach((item) => {
    const box = document.createElement("div");
    box.className = "analysis-box";
    box.style.left = `${Math.max(0, Math.min(95, item.box.x * 100))}%`;
    box.style.top = `${Math.max(0, Math.min(95, item.box.y * 100))}%`;
    box.style.width = `${Math.max(2, Math.min(100, item.box.width * 100))}%`;
    box.style.height = `${Math.max(2, Math.min(100, item.box.height * 100))}%`;
    const label = document.createElement("span");
    label.textContent = `${item.name} · ${Math.round(item.confidence * 100)}%`;
    box.append(label); container.append(box);
  });
}
