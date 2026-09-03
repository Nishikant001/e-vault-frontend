// src/features/approvalEngine/api.js
//
// Thin fetch wrapper around the backend Approval Engine
// (/api/approval-workflows/*  and  /api/approvals/*).
//
// This file is intentionally the ONLY place that knows the approval
// endpoints. Every page/component in the app talks to the engine through
// the functions exported here — never via a raw fetch() call. That's what
// lets the same engine be reused later for Leave / Purchase / Vendor /
// Contract / Invoice / User-Registration approvals: only this file (plus
// the entity-selector piece) would need a new variant, none of the UI.

import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;

function getToken() {
  return localStorage.getItem("accessToken") || "";
}

export function decodeToken() {
  try {
    const t = getToken();
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1]));
  } catch {
    return null;
  }
}

export function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok || (data && data.success === false)) {
    const message = data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.statusCode = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

// ── Master data (for building the Department -> Category -> DocumentType
//    combo selector; kept here so the builder never hardcodes a lookup) ──
export const MasterDataApi = {
  tenantDepartments: (tenantId) => request(`/departments/tenant/${tenantId}`),
  categories: (departmentId) => request(`/categories?departmentId=${departmentId}`),
  documentTypes: (categoryId) => request(`/document-types?categoryId=${categoryId}`),
  users: () => request(`/users`),
};

// ── Approval Workflow configuration (Tenant/Super Admin — the "builder") ──
export const ApprovalWorkflowApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""))
    ).toString();
    return request(`/approval-workflows${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => request(`/approval-workflows/${id}`),
  getByCombo: (departmentId, categoryId, documentTypeId) =>
    request(`/approval-workflows/by-combo?departmentId=${departmentId}&categoryId=${categoryId}&documentTypeId=${documentTypeId}`),
  create: (payload) => request(`/approval-workflows`, { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/approval-workflows/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => request(`/approval-workflows/${id}`, { method: "DELETE" }),
  assignApprovers: (levelId, assignments) =>
    request(`/approval-workflows/levels/${levelId}/assignments`, { method: "POST", body: JSON.stringify({ assignments }) }),
};

// ── Runtime approval actions (any actor moving a document through a chain) ──
export const ApprovalActionApi = {
  submit: (documentId) => request(`/approvals/documents/${documentId}/submit`, { method: "POST" }),
  pending: () => request(`/approvals/pending`),
  myActions: () => request(`/approvals/my-actions`),
  getByDocument: (documentId) => request(`/approvals/document/${documentId}`),
  getById: (id) => request(`/approvals/${id}`),
  timeline: (id) => request(`/approvals/${id}/timeline`),
  addComment: (id, comment, levelNumber) =>
    request(`/approvals/${id}/comments`, { method: "POST", body: JSON.stringify({ comment, levelNumber }) }),
  approve: (id, comments) => request(`/approvals/${id}/approve`, { method: "POST", body: JSON.stringify({ comments }) }),
  reject: (id, reason) => request(`/approvals/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
  sendBack: (id, comments) => request(`/approvals/${id}/send-back`, { method: "POST", body: JSON.stringify({ comments }) }),
  cancel: (id, reason) => request(`/approvals/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }),
  resubmit: (id) => request(`/approvals/${id}/resubmit`, { method: "POST" }),
};
