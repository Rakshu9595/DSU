const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);

export const appConfig = Object.freeze({
  mode: localStorage.getItem("visiontwin-mode") || "demo",
  apiBaseUrl: localStorage.getItem("visiontwin-api-url") || (isLocal ? "http://localhost:3000/api" : "/api"),
  requestTimeoutMs: 20000,
  demoStorageKey: "visiontwin-demo-state",
  endpoints: Object.freeze({
    auth: { login: "/auth/login", register: "/auth/register", logout: "/auth/logout", me: "/auth/me" },
    projects: "/projects", uploads: "/uploads", analyses: "/analyses", devices: "/devices",
    energy: "/energy", scenarios: "/scenarios", recommendations: "/recommendations", reports: "/reports", settings: "/settings",
    digitalTwin: "/digital-twins"
  })
});
