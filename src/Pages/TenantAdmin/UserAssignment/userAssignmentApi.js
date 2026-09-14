// src/Pages/TenantAdmin/UserAssignment/userAssignmentApi.js
//
// API service layer for the Dynamic User Assignment module.
// Talks to the endpoints already implemented in the DMS backend:
//   GET    /api/users
//   GET    /api/departments/tenant/:tenantId
//   GET    /api/categories                (?departmentId=)
//   GET    /api/document-types            (?categoryId=)
//   GET    /api/user-assignments          (?userId=&status=)
//   GET    /api/user-assignments/user/:userId
//   POST   /api/user-assignments
//   PUT    /api/user-assignments/:id
//   DELETE /api/user-assignments/:id
//   GET    /api/audit-logs                (?module=USER_ASSIGNMENT&...)
//
// Follows the exact fetch + Bearer-token pattern already used everywhere
// else in the app (see Pages/TenantAdmin/TAUsers.jsx, Pages/Audit/auditApi.js)
// so it drops in without introducing a second HTTP client convention.

import { API_BASE_URL } from "../../../services/apiClient";

export const API_BASE = API_BASE_URL;

// sessionStorage key used to hand off a "preselected" user from TAUsers.jsx's
// "Manage Assignments" action into this module's user picker, without
// needing route params (the app navigates by page-key string only).
export const PRESELECT_STORAGE_KEY = "dms_ua_preselect_user";

export function getToken() {
  return localStorage.getItem("accessToken") || "";
}

export function authHeaders(json = false) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

// Decode the JWT once to get { id, tenantId, role, email, name } — the
// same decoding App.jsx already does for the top-level `user` object.
// Individual TenantAdmin pages (TAUsers, TAFolder, etc.) don't currently
// receive `user` as a prop, so each fetches it from the token itself —
// this mirrors that existing convention instead of changing page props.
export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id || payload.userId || null,
      email: payload.email,
      role: payload.role || "Viewer",
      name: payload.name || payload.email,
      tenantId: payload.tenantId || null,
    };
  } catch {
    return null;
  }
}

async function parseJson(res) {
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

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

// ── Users (for the "User" dropdown) ──────────────────────────────────────
export async function fetchTenantUsers() {
  const res = await fetch(`${API_BASE}/users`, { headers: authHeaders(), cache: "no-store" });
  const data = await parseJson(res);
  return data.data || [];
}

// ── Hierarchy: Departments → Categories → Document Types ────────────────
// GET /api/departments/tenant/:tenantId returns the departments actually
// assigned to this tenant (the master-list departments minus tenant scoping).
export async function fetchTenantDepartments(tenantId) {
  const res = await fetch(`${API_BASE}/departments/tenant/${tenantId}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await parseJson(res);
  return data.data || [];
}

// Lazy-loaded per department when its node is expanded (or unfiltered for
// search mode). The backend already scopes this to the caller's tenant
// (and, per the Dynamic User Assignment Engine, to the caller's own
// permission scope) — no client-side permission logic needed.
export async function fetchCategories({ departmentId } = {}) {
  const res = await fetch(`${API_BASE}/categories${buildQuery({ departmentId })}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await parseJson(res);
  return data.data || [];
}

// Lazy-loaded per category when its node is expanded (or unfiltered for
// search mode).
export async function fetchDocumentTypes({ categoryId } = {}) {
  const res = await fetch(`${API_BASE}/document-types${buildQuery({ categoryId })}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await parseJson(res);
  return data.data || [];
}

// ── Assignments (Dynamic User Assignment Engine) ─────────────────────────
export async function fetchUserAssignments(userId) {
  const res = await fetch(`${API_BASE}/user-assignments/user/${userId}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await parseJson(res);
  return data.data || [];
}

export async function createAssignment({ userId, assignmentLevel, departmentId, categoryId, documentTypeId }) {
  const res = await fetch(`${API_BASE}/user-assignments`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ userId, assignmentLevel, departmentId, categoryId, documentTypeId }),
  });
  const data = await parseJson(res);
  return data.data;
}

export async function updateAssignment(id, payload) {
  const res = await fetch(`${API_BASE}/user-assignments/${id}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data.data;
}

export async function revokeAssignment(id) {
  const res = await fetch(`${API_BASE}/user-assignments/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return parseJson(res);
}

// ── Assignment history (reuses the Enterprise Audit Trail, module=USER_ASSIGNMENT) ──
// The audit `userId` query filter matches the *actor* who performed the
// action (the TenantAdmin), not the target user, so we pull a bounded
// window of USER_ASSIGNMENT entries for the tenant and filter client-side
// by the target userId embedded in each entry's oldValue/newValue/remarks.
export async function fetchAssignmentHistory(targetUserId, { limit = 100 } = {}) {
  const res = await fetch(
    `${API_BASE}/audit-logs${buildQuery({ module: "USER_ASSIGNMENT", limit, sortBy: "createdAt", sortOrder: "DESC" })}`,
    { headers: authHeaders(), cache: "no-store" }
  );
  const data = await parseJson(res);
  const rows = data.data || [];
  const idStr = String(targetUserId);
  return rows.filter((r) => {
    if (r.newValue && String(r.newValue.userId) === idStr) return true;
    if (r.oldValue && String(r.oldValue.userId) === idStr) return true;
    return typeof r.remarks === "string" && r.remarks.includes(`#${idStr}`) && r.remarks.toLowerCase().includes("user");
  });
}
