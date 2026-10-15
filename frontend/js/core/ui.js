const icons = { dashboard: "grid-1x2", projects: "buildings", devices: "plug", "energy-analysis": "lightning-charge", "digital-twin": "box", recommendations: "stars", reports: "file-earmark-bar-graph", settings: "gear" };

export function toast(message, type = "info") {
  let stack = document.querySelector("#toastStack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "toastStack";
    stack.className = "toast-stack";
    stack.setAttribute("aria-live", "polite");
    document.body.append(stack);
  }
  const item = document.createElement("div");
  item.className = "toast-message";
  item.setAttribute("role", "status");
  const icon = document.createElement("i");
  icon.className = `bi bi-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"} me-2`;
  const text = document.createElement("span");
  text.textContent = message;
  item.append(icon, text);
  stack.append(item);
  window.setTimeout(() => item.remove(), 3800);
}

export function setButtonLoading(button, loading, label = "Please wait…") {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.textContent.trim();
    button.disabled = true;
    button.textContent = label;
  } else {
    button.disabled = false;
    if (button.dataset.originalText) button.textContent = button.dataset.originalText;
  }
}

export function initCommonUi() {
  document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = String(new Date().getFullYear()); });
  const toggle = document.querySelector("#themeToggle");
  const savedTheme = localStorage.getItem("visiontwin-theme") || "dark";
  document.documentElement.dataset.theme = savedTheme;
  toggle?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("visiontwin-theme", next);
    toast(`${next === "light" ? "Light" : "Dark"} theme enabled`);
  });
  const navToggle = document.querySelector("#navToggle");
  const publicNav = document.querySelector("#publicNav");
  navToggle?.addEventListener("click", () => {
    const open = publicNav?.classList.toggle("open") ?? false;
    navToggle.setAttribute("aria-expanded", String(open));
  });
  const siteNav = document.querySelector("#siteNav");
  if (siteNav) {
    const updateNav = () => siteNav.classList.toggle("scrolled", window.scrollY > 16);
    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true });
  }
  const sidebar = document.querySelector("#appSidebar");
  const sidebarToggle = document.querySelector("#sidebarToggle");
  sidebarToggle?.addEventListener("click", () => {
    const open = sidebar?.classList.toggle("open") ?? false;
    sidebarToggle.setAttribute("aria-expanded", String(open));
  });
  const currentPage = location.pathname.split("/").pop()?.replace(".html", "");
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    if (link.getAttribute("href") === `${currentPage}.html`) link.classList.add("active");
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

export function appShell(pageTitle) {
  return `<div class="app-shell"><aside class="app-sidebar" id="appSidebar"><div class="sidebar-brand"><a class="brand" href="dashboard.html"><span class="brand-mark"><i class="bi bi-soundwave"></i></span>VisionTwin</a></div><div class="sidebar-label">Workspace</div><nav class="sidebar-nav">${["dashboard","projects","devices","energy-analysis","digital-twin"].map((name) => `<a class="sidebar-link" href="${name}.html"><i class="bi bi-${icons[name]}"></i>${name.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</a>`).join("")}</nav><div class="sidebar-label">Insights</div><nav class="sidebar-nav">${["recommendations","reports"].map((name) => `<a class="sidebar-link" href="${name}.html"><i class="bi bi-${icons[name]}"></i>${name[0].toUpperCase()}${name.slice(1)}</a>`).join("")}</nav><div class="sidebar-label">Account</div><nav class="sidebar-nav"><a class="sidebar-link" href="settings.html"><i class="bi bi-gear"></i>Settings</a></nav><div class="mt-auto p-2 pt-4"><div class="card-surface p-3"><span class="demo-label">DEMO WORKSPACE</span><p class="small mb-0 mt-2">Sample data only</p></div></div></aside><main class="app-main"><header class="app-topbar"><div class="d-flex align-items-center gap-3"><button class="btn-quiet p-2" id="sidebarToggle" aria-label="Toggle sidebar" aria-expanded="false"><i class="bi bi-list fs-5"></i></button><span class="fw-semibold">${pageTitle}</span></div><div class="d-flex align-items-center gap-2"><input class="form-control topbar-search" style="width:220px" type="search" placeholder="Search…"><button class="btn-quiet" id="themeToggle" aria-label="Toggle theme"><i class="bi bi-circle-half"></i></button><a class="btn-quiet" href="settings.html" aria-label="Settings"><i class="bi bi-person-circle fs-5"></i></a></div></header><div class="app-content page-enter" id="pageContent"></div></main></div>`;
}

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

export function mountApp(pageTitle, content) {
  document.body.insertAdjacentHTML("afterbegin", appShell(pageTitle));
  const pageContent = document.querySelector("#pageContent");
  pageContent.innerHTML = content;
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  const footerInner = document.createElement("div");
  footerInner.className = "container-wide d-flex flex-wrap justify-content-between gap-2";
  const copyright = document.createElement("span");
  copyright.textContent = `© ${new Date().getFullYear()} VisionTwin`;
  const tagline = document.createElement("span");
  tagline.textContent = "Understand your space. Make energy visible.";
  footerInner.append(copyright, tagline);
  document.querySelector(".app-main").append(footer);
  initCommonUi();
}
