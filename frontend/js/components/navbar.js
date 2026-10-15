export function initNavbar() {
  const nav = document.querySelector("#siteNav");
  if (!nav) return;
  const toggle = nav.querySelector("#navToggle");
  const links = nav.querySelector("#publicNav");
  toggle?.addEventListener("click", () => {
    const expanded = links?.classList.toggle("open") ?? false;
    toggle.setAttribute("aria-expanded", String(expanded));
  });
}
