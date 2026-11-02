// src/features/erpIntegration/api.js
//
// Talks to /api/tenant-erp/* (backend/src/routes/tenantErpRoutes.js) — the
// generic Multi-ERP endpoints, as opposed to /api/sap-sync/* which is
// deliberately SAP-only. Same fetch + JWT pattern as features/sapSync/api.js.

import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;

function getToken() {
  return localStorage.getItem("accessToken") || "";
}

function authHeaders(json = true) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
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
    throw err;
  }
  return data;
}

async function get(path) {
  const res = await fetch(`${API}${path}`, { headers: authHeaders(false), cache: "no-store" });
  return parseJson(res);
}

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body || {}),
  });
  return parseJson(res);
}

export const ErpIntegrationApi = {
  /** Every active ERP connection assigned to this tenant — any erpType. */
  listConnections: () => get("/tenant-erp/connections"),

  /** Test one connection. Works for any erpType via the backend's ErpFactory. */
  testConnection: (erpConfigId) => post(`/tenant-erp/connections/${erpConfigId}/test`),

  /** CATEGORY / DOCUMENT_TYPE master sync for a non-SAP connection. */
  syncEntity: (erpConfigId, entity) => post(`/tenant-erp/connections/${erpConfigId}/sync/${entity}`),
};
