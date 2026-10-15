import { appConfig } from "../config/app-config.js";
import { apiRequest } from "../core/api-client.js";

const seed = [
  { id: "prj-001", name: "Willow Creek Residence", location: "Bengaluru, IN", room: "Living room", status: "Analyzed", devices: 8, updatedAt: "2026-10-12" },
  { id: "prj-002", name: "Studio North", location: "Mysuru, IN", room: "Studio", status: "In review", devices: 5, updatedAt: "2026-10-10" },
  { id: "prj-003", name: "Lakeview Apartment", location: "Chennai, IN", room: "Bedroom", status: "Ready to scan", devices: 0, updatedAt: "2026-10-08" }
];
function read() {
  try { return JSON.parse(localStorage.getItem(appConfig.demoStorageKey) || "{}").projects || seed; }
  catch (error) { console.error("Could not load demo projects", error); return seed; }
}
function write(projects) {
  const state = JSON.parse(localStorage.getItem(appConfig.demoStorageKey) || "{}");
  localStorage.setItem(appConfig.demoStorageKey, JSON.stringify({ ...state, projects }));
}
export const projectService = {
  async list() { return appConfig.mode === "demo" ? read() : apiRequest(appConfig.endpoints.projects); },
  async get(id) { const items = await this.list(); return items.find((item) => item.id === id) || items[0] || null; },
  async create(project) {
    if (appConfig.mode !== "demo") return apiRequest(appConfig.endpoints.projects, { method: "POST", body: project });
    const items = read(); const record = { ...project, id: `demo-${Date.now()}`, status: "Ready to scan", devices: 0, updatedAt: new Date().toISOString().slice(0, 10) };
    items.unshift(record); write(items); return record;
  },
  async update(id, changes) {
    if (appConfig.mode !== "demo") return apiRequest(`${appConfig.endpoints.projects}/${encodeURIComponent(id)}`, { method: "PATCH", body: changes });
    const items = read().map((item) => item.id === id ? { ...item, ...changes } : item); write(items); return items.find((item) => item.id === id);
  },
  async remove(id) {
    if (appConfig.mode !== "demo") return apiRequest(`${appConfig.endpoints.projects}/${encodeURIComponent(id)}`, { method: "DELETE" });
    write(read().filter((item) => item.id !== id)); return { deleted: true };
  }
};
