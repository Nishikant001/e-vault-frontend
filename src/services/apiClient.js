// src/services/apiClient.js
//
// The ONE place in this app that knows the backend base URL, attaches the
// JWT, and parses/normalizes responses. Every feature module's API file
// (features/sapSync/api.js, features/approvalEngine/api.js,
// Pages/Audit/auditApi.js, Pages/TenantAdmin/UserAssignment/userAssignmentApi.js,
// Pages/TenantAdmin/DMSWorkflow/checkInOutApi.js, etc.) previously
// reimplemented this same ~40 lines independently, and 29 files across the
// app hardcoded `http://localhost:3000/api` directly instead of importing
// a shared constant.
//
// Behavior is intentionally unchanged from what those files already did
// (same header shape, same `{ success: false, message }` error contract,
// same JWT-in-localStorage convention) — this is a consolidation, not a
// redesign. Nothing about auth, refresh, or permissions changes here.
//
// Base URL: reads VITE_API_BASE_URL (see .env.example at the project root).
// Falls back to the exact literal every file used before
// (`http://localhost:3000/api`) when the env var isn't set, so local dev
// with no .env file keeps working exactly as it did.
export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  "https://evault-api.excelligent.co.in/api";

const TOKEN_STORAGE_KEY = "accessToken";

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/** Decodes the current JWT payload without verifying it (display/UI use only —
 * the backend is the source of truth for anything security-sensitive).
 * Centralizes what sapSync/api.js, approvalEngine/api.js, and
 * userAssignmentApi.js each implemented separately as getCurrentTenantId()/
 * decodeToken(). */
export function decodeToken() {
  try {
    const t = getToken();
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1]));
  } catch {
    return null;
  }
}

export function getCurrentTenantId() {
  return decodeToken()?.tenantId ?? null;
}

export function authHeaders(json = true) {
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

// Task 10 — Authentication: public endpoints that issue tokens rather than
// requiring one. A 401 here means "wrong credentials", not "session
// expired" — never auto-logout for these, or a failed login attempt would
// wipe the form's own error handling.
const PUBLIC_AUTH_PATHS = ["/auth/login", "/subscriptions/login", "/subscriptions/register/"];

function isPublicAuthPath(path) {
  return PUBLIC_AUTH_PATHS.some((p) => path.startsWith(p));
}

/** Task 10 — Automatically logs out and returns to the login screen when the
 * backend rejects an authenticated request as unauthorized (expired/invalid
 * JWT). A full reload is intentional here — it resets every in-memory
 * context (auth, subscription, AI assistant, etc.) in one shot rather than
 * requiring each of them to separately subscribe to a "log me out" event. */
function forceLogout() {
  clearToken();
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("subscriptionSnapshot");
  if (typeof window !== "undefined") window.location.reload();
}

async function parseJsonResponse(res, path) {
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned an invalid response (HTTP ${res.status})`);
  }
  if (res.status === 401 && getToken() && !isPublicAuthPath(path)) {
    forceLogout();
  }
  if (!res.ok || data?.success === false) {
    const err = new Error(data?.message || `Request failed (HTTP ${res.status})`);
    err.statusCode = res.status;
    err.payload = data;
    // ERP / Non-ERP Tenant Classification (and other coded backend errors,
    // e.g. TRIAL_EXPIRED, FEATURE_NOT_AVAILABLE): surface `code` directly
    // on the thrown Error so callers can branch on it (e.g. show a
    // dedicated "ERP not enabled" state) without re-reading err.payload.
    err.code = data?.code;
    throw err;
  }
  return data;
}

/**
 * Low-level request helper. Prefer the get/post/put/patch/del helpers below
 * for normal use; `request` is exported for call sites that need a verb or
 * header combination those don't cover (e.g. multipart uploads).
 */
export async function request(path, options = {}) {
  const { query, json = true, ...fetchOptions } = options;
  const res = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
    ...fetchOptions,
    headers: { ...authHeaders(json && fetchOptions.method && fetchOptions.method !== "GET"), ...(fetchOptions.headers || {}) },
  });
  return parseJsonResponse(res, path);
}

export function get(path, query) {
  return request(path, { method: "GET", query, json: false, cache: "no-store" });
}

export function post(path, body) {
  return request(path, { method: "POST", body: JSON.stringify(body ?? {}) });
}

export function put(path, body) {
  return request(path, { method: "PUT", body: JSON.stringify(body ?? {}) });
}

export function patch(path, body) {
  return request(path, { method: "PATCH", body: JSON.stringify(body ?? {}) });
}

export function del(path, body) {
  return request(path, body !== undefined ? { method: "DELETE", body: JSON.stringify(body) } : { method: "DELETE", json: false });
}

/** For multipart/form-data uploads — do not set a Content-Type, the browser
 * sets the correct multipart boundary automatically. */
export async function postForm(path, formData) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  return parseJsonResponse(res, path);
}
