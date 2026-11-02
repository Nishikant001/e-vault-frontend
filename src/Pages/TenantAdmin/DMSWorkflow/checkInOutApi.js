// src/Pages/TenantAdmin/DMSWorkflow/checkInOutApi.js
//
// API service layer for Enterprise Check-In / Check-Out.
// Talks to /api/documents/:id/{checkout,checkin,force-unlock,lock-status,version-history}
// (see DMS-Backend/src/routes/checkInOutRoutes.js).
//
// Follows the exact same fetch + JWT pattern already used across the DMS
// module (see DMSWorkflow/pages/DMSPage.jsx, Audit/auditApi.js) so it drops
// in without touching how auth/tokens work anywhere else.

import { API } from "./constants";

function getToken() {
  return localStorage.getItem("accessToken") || "";
}

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
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

/** POST /api/documents/:id/checkout — reserve the lock. */
export async function checkOutDocument(documentId, { reason, expectedReturnDate }) {
  const res = await fetch(`${API}/documents/${documentId}/checkout`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ reason, expectedReturnDate: expectedReturnDate || null }),
  });
  const data = await parseJsonResponse(res);
  return data.data;
}

/**
 * POST /api/documents/:id/checkin — upload modified file (optional),
 * release the lock, create a new version if a file was supplied.
 * `file` may be null/undefined for a "check-in with no changes" flow.
 */
export async function checkInDocument(documentId, { file, comments, versionNotes }) {
  const form = new FormData();
  if (file) form.append("file", file);
  // Comments and version notes are combined server-side into a single
  // `comments` field (the backend model only has one checkInComments
  // column) — keep them readably separated so both are preserved.
  const combinedComments = [comments, versionNotes ? `Version notes: ${versionNotes}` : ""]
    .filter(Boolean)
    .join(" — ");
  if (combinedComments) form.append("comments", combinedComments);

  const res = await fetch(`${API}/documents/${documentId}/checkin`, {
    method: "POST",
    headers: authHeaders(), // no Content-Type — browser sets multipart boundary
    body: form,
  });
  const data = await parseJsonResponse(res);
  return data.data;
}

/** POST /api/documents/:id/force-unlock — TenantAdmin/DeptHead override. */
export async function forceUnlockDocument(documentId, { reason }) {
  const res = await fetch(`${API}/documents/${documentId}/force-unlock`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ reason }),
  });
  const data = await parseJsonResponse(res);
  return data.data;
}

/** GET /api/documents/:id/lock-status — current lock state. */
export async function getLockStatus(documentId) {
  const res = await fetch(`${API}/documents/${documentId}/lock-status`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await parseJsonResponse(res);
  return data.data;
}

/** GET /api/documents/:id/version-history — all versions + current lock state. */
export async function getVersionHistory(documentId) {
  const res = await fetch(`${API}/documents/${documentId}/version-history`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const data = await parseJsonResponse(res);
  return { versions: data.data || [], lockStatus: data.lockStatus || null };
}

// ── Role-based permission helpers ──────────────────────────────
// Mirrors CheckInOutService.CHECKOUT_ROLES / FORCE_UNLOCK_ROLES on the
// backend exactly, so buttons never appear only to 403 on click.
export const CHECKOUT_ROLES = [
  "SuperAdmin",
  "TenantAdmin",
  "BranchManager",
  "DeptHead",
  "Manager",
  "Uploader",
];
export const FORCE_UNLOCK_ROLES = ["SuperAdmin", "TenantAdmin", "DeptHead"];

export function canCheckOut(user, lock) {
  if (!user || !CHECKOUT_ROLES.includes(user.role)) return false;
  return !lock?.isCheckedOut;
}

export function canCheckIn(user, lock) {
  if (!user || !CHECKOUT_ROLES.includes(user.role)) return false;
  return !!lock?.isCheckedOut && lock?.checkedOutBy === user.id;
}

export function canForceUnlock(user, lock) {
  if (!user || !FORCE_UNLOCK_ROLES.includes(user.role)) return false;
  return !!lock?.isCheckedOut;
}
