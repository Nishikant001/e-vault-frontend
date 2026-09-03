// src/features/sapSync/api.js
//
// API service layer for the SAP Synchronization module.
// Talks to /api/sap-sync/* (see DMS-Backend/src/routes/sapSyncRoutes.js).
// Follows the exact same fetch + JWT pattern already used across the app
// (see Pages/Audit/auditApi.js, Pages/TenantAdmin/UserAssignment/userAssignmentApi.js).

import { API_BASE_URL } from "../../services/apiClient";

export const API = API_BASE_URL;

function getToken() {
  return localStorage.getItem("accessToken") || "";
}

export function getCurrentTenantId() {
  try {
    const t = getToken();
    if (!t) return null;
    const payload = JSON.parse(atob(t.split(".")[1]));
    return payload?.tenantId || null;
  } catch {
    return null;
  }
}

function authHeaders(json = true) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

async function parseJson(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned an invalid response (HTTP ${res.status})`);
  }
  if (!res.ok || data.success === false) {
    const err = new Error(data.message || `Request failed (HTTP ${res.status})`);
    err.statusCode = res.status;
    err.payload = data;
    // ERP / Non-ERP Tenant Classification: every route in this module sits
    // behind requireSAP, which returns 403 { code: "ERP_NOT_ENABLED" } for
    // PAID+NON-ERP tenants. Surface the code so pages can show a dedicated
    // "ERP not enabled" message instead of a generic failure toast.
    err.code = data.code;
    throw err;
  }
  return data;
}

async function get(path, query) {
  const res = await fetch(`${API}${path}${buildQuery(query)}`, { headers: authHeaders(false), cache: "no-store" });
  return parseJson(res);
}

async function post(path, body) {
  const res = await fetch(`${API}${path}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body || {}) });
  return parseJson(res);
}

async function put(path, body) {
  const res = await fetch(`${API}${path}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(body || {}) });
  return parseJson(res);
}

export const SapSyncApi = {
  // ── Sync execution + status (core 6) ──────────────────────
  triggerMasterSync: () => post("/sap-sync/masters"),
  triggerDocumentSync: () => post("/sap-sync/documents"),
  triggerRetry: (entityType) => post("/sap-sync/retry", entityType ? { entityType } : {}),
  getStatus: () => get("/sap-sync/status"),
  getLogs: (filters) => get("/sap-sync/logs", filters),
  getRetryQueue: (filters) => get("/sap-sync/retry-queue", filters),

  // ── Master Synchronization page ───────────────────────────
  // type: "departments" | "categories" | "document-types"
  listMasters: (type, filters) => get(`/sap-sync/masters/${type}`, filters),

  // ── Document Synchronization page ─────────────────────────
  listDocuments: (filters) => get("/sap-sync/documents", filters),
  getDocumentDetail: (id) => get(`/sap-sync/documents/${id}`),

  // ── Pending Classification page ───────────────────────────
  listPendingClassification: (filters) => get("/sap-sync/pending-classification", filters),
  assignClassification: (id, payload) => post(`/sap-sync/pending-classification/${id}/assign`, payload),
  bulkAssignClassification: (items) => post("/sap-sync/pending-classification/bulk-assign", { items }),
  // Returns the raw fetch Response (not parsed as JSON) so the caller can
  // read it as a blob for inline preview. Mirrors the existing
  // /documents/:id/view pattern used elsewhere in the app.
  viewPendingClassificationDocument: (id) =>
    fetch(`${API}/sap-sync/pending-classification/${id}/view`, { headers: authHeaders(false), cache: "no-store" }),

  // ── Scheduler Management page ─────────────────────────────
  listSchedules: () => get("/sap-sync/schedules"),
  updateSchedule: (id, payload) => put(`/sap-sync/schedules/${id}`, payload),
  runScheduleNow: (id) => post(`/sap-sync/schedules/${id}/run-now`),

  // ── Settings page ──────────────────────────────────────────
  getSettings: () => get("/sap-sync/settings"),
  updateSettings: (payload) => put("/sap-sync/settings", payload),
  testConnection: () => post("/sap-sync/settings/test-connection"),

  // ── Reference data for Pending Classification assign form ──
  // Departments are scoped to what's assigned to the caller's tenant.
  listDepartmentsLite: (tenantId) => get(`/departments/tenant/${tenantId}`),
  listCategoriesLite: (departmentId) => get("/categories", departmentId ? { departmentId } : {}),
  listDocumentTypesLite: (categoryId) => get("/document-types", categoryId ? { categoryId } : {}),
};
