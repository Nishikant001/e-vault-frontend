// src/Pages/Audit/auditApi.js
//
// API service layer for the Enterprise Audit Trail module.
// Talks to the backend endpoints mounted at /api/audit-logs
// (see DMS-Backend/src/routes/auditRoutes.js).
//
// Follows the exact same fetch + JWT pattern already used across the app
// (see Pages/TenantAdmin/TAAudit.jsx, Pages/SuperAdmin/Tenants.jsx) so it
// drops in without touching how auth/tokens work anywhere else.

import { API_BASE_URL } from "../../services/apiClient";

export const API = API_BASE_URL;

export function getToken() {
  return localStorage.getItem("accessToken") || "";
}

export function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value));
    }
  });
  return qs.toString();
}

async function parseJsonResponse(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned an invalid response (HTTP ${res.status})`);
  }
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Request failed (HTTP ${res.status})`);
  }
  return data;
}

/**
 * GET /api/audit-logs — paginated, filterable, searchable list.
 * filters: { page, limit, module, action, userId, department, status,
 *            documentId, sapDocumentId, search, dateFrom, dateTo,
 *            sortBy, sortOrder, tenantId (SuperAdmin only) }
 */
export async function fetchAuditLogs(filters = {}) {
  const query = buildQuery(filters);
  const res = await fetch(`${API}/audit-logs${query ? `?${query}` : ""}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await parseJsonResponse(res);
  return {
    data: data.data || [],
    pagination: data.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 },
  };
}

/** GET /api/audit-logs/:id — single entry (used to hydrate the detail modal). */
export async function fetchAuditLogById(id) {
  const res = await fetch(`${API}/audit-logs/${id}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await parseJsonResponse(res);
  return data.data;
}

/** GET /api/audit-logs/meta/filters — distinct modules/actions/statuses for dropdowns. */
export async function fetchAuditFilterMeta() {
  const res = await fetch(`${API}/audit-logs/meta/filters`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await parseJsonResponse(res);
  return data.data || { modules: [], actions: [], statuses: [] };
}

/**
 * GET /api/audit-logs/export — streams a CSV file (same filters as the list).
 * The endpoint requires a Bearer token, so it can't be opened as a plain
 * link; we fetch it as a blob and trigger the download client-side.
 */
export async function exportAuditLogsCsv(filters = {}) {
  const query = buildQuery(filters);
  const res = await fetch(`${API}/audit-logs/export${query ? `?${query}` : ""}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    let message = `Export failed (HTTP ${res.status})`;
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      // response wasn't JSON (likely the CSV itself on a rare error path) — keep default message
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-logs-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** GET /api/tenants — used only for the SuperAdmin "Tenant" filter dropdown. */
export async function fetchTenantsLite() {
  const res = await fetch(`${API}/tenants`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data || data.success === false) return [];
  return data.data || [];
}
