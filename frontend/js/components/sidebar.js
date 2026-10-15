export function initSidebar() {
  const sidebar = document.querySelector("#appSidebar");
  const toggle = document.querySelector("#sidebarToggle");
  toggle?.addEventListener("click", () => {
    const open = sidebar?.classList.toggle("open") ?? false;
    toggle.setAttribute("aria-expanded", String(open));
  });
}
