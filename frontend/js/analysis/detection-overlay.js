export function drawDetectionBoxes(container, detections) {
  container.querySelectorAll(".analysis-box").forEach((box)=>box.remove());
  detections.filter((item) => item.box && [item.box.x,item.box.y,item.box.width,item.box.height].every(Number.isFinite)).forEach((item) => {
    const box = document.createElement("div");
    box.className = "analysis-box";
    box.setAttribute("role","img");
    box.setAttribute("aria-label",`${item.name}, confidence ${Math.round(item.confidence*100)} percent`);
    const left=Math.max(0,Math.min(100,item.box.x*100));
    const top=Math.max(0,Math.min(100,item.box.y*100));
    box.style.left = `${left}%`;
    box.style.top = `${top}%`;
    box.style.width = `${Math.max(0,Math.min(100-left,item.box.width*100))}%`;
    box.style.height = `${Math.max(0,Math.min(100-top,item.box.height*100))}%`;
    const label = document.createElement("span");
    label.textContent = `${item.name} · ${Number.isFinite(item.confidence)?`${Math.round(item.confidence*100)}% confidence`:"confidence unavailable"}`;
    box.append(label); container.append(box);
  });
}
