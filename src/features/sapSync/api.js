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
  const headers = {
    Authorization: `Bearer ${getToken()}`,
  };

  if (json) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

function buildQuery(params = {}) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      qs.set(key, String(value));
    }
  });

  const s = qs.toString();

  return s ? `?${s}` : "";
}

async function parseJson(res) {
  let data;

  try {
    data = await res.json();
  } catch {
    throw new Error(
      `Server returned an invalid response (HTTP ${res.status})`
    );
  }

  if (!res.ok || data.success === false) {
    const err = new Error(
      data.message ||
        `Request failed (HTTP ${res.status})`
    );

    err.statusCode = res.status;
    err.payload = data;

    // ERP / Non-ERP Tenant Classification:
    // every route in this module sits behind requireSAP,
    // which returns 403 { code: "ERP_NOT_ENABLED" } for
    // PAID+NON-ERP tenants.
    //
    // Surface the code so pages can show a dedicated
    // "ERP not enabled" message instead of a generic failure toast.
    err.code = data.code;

    throw err;
  }

  return data;
}

async function get(path, query) {
  const res = await fetch(
    `${API}${path}${buildQuery(query)}`,
    {
      headers: authHeaders(false),
      cache: "no-store",
    }
  );

  return parseJson(res);
}

async function post(path, body) {
  const res = await fetch(
    `${API}${path}`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body || {}),
    }
  );

  return parseJson(res);
}

async function put(path, body) {
  const res = await fetch(
    `${API}${path}`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body || {}),
    }
  );

  return parseJson(res);
}

// Builds the request body for master/document sync.
//   undefined / null / ""  -> {}                  (tenant default ERP)
//   12                     -> { erpConfigId: 12 } (single ERP)
//   [12, 15]               -> { erpConfigIds: [12, 15] } (Sync Selected)
function buildErpSyncBody(erpTarget) {
  if (Array.isArray(erpTarget)) {
    return { erpConfigIds: erpTarget.map(Number) };
  }

  return erpTarget ? { erpConfigId: erpTarget } : {};
}

export const SapSyncApi = {
  // ─────────────────────────────────────────────────────────
  // Sync execution + status
  // ─────────────────────────────────────────────────────────

  // erpConfigId is optional.
  //
  // Existing single-ERP behavior is preserved.
  //
  // Multiple SAP ERP tenant:
  // explicitly pass the selected erpConfigId.
  //
  // FLEXIBLE MULTI-SELECT SYNC:
  // The argument may now be EITHER
  //   - a single erpConfigId (number)  -> original single-ERP sync
  //   - an array of erpConfigIds       -> "Sync Selected" (any subset)
  // The backend answers the array form with a per-ERP results list.
  triggerMasterSync: (erpTarget) =>
    post("/sap-sync/masters", buildErpSyncBody(erpTarget)),

  triggerDocumentSync: (erpTarget) =>
    post("/sap-sync/documents", buildErpSyncBody(erpTarget)),

  // PHASE 3 — Sync all active SAP ERP connections.
  triggerSyncAllMasters: () =>
    post("/sap-sync/masters/all"),
  // Generic ERP master sync (Oracle / Custom)
triggerGenericErpSync: (erpConfigId, entity) =>
  post(
    `/tenant-erp/connections/${erpConfigId}/sync/${entity}`,
    {}
  ),

  triggerSyncAllDocuments: () =>
    post("/sap-sync/documents/all"),

  // Retry failed sync jobs.
  //
  // erpConfigId is optional to preserve existing behavior.
  //
  // When multiple ERPs are assigned to a tenant, the selected
  // ERP can be explicitly passed so retry remains ERP-specific.
  triggerRetry: (entityType, erpConfigId) =>
    post(
      "/sap-sync/retry",
      {
        ...(entityType
          ? { entityType }
          : {}),
        ...(erpConfigId !== undefined &&
        erpConfigId !== null &&
        erpConfigId !== ""
          ? { erpConfigId }
          : {}),
      }
    ),

  // ─────────────────────────────────────────────────────────
  // ERP Connections
  // ─────────────────────────────────────────────────────────

  /**
   * Returns ERP connections assigned to the authenticated tenant.
   *
   * Existing backend implementation is retained.
   *
   * Current SAP Sync pages use this for the SAP ERP selector.
   */
  listErpConnections: () =>
    get("/sap-sync/erp-connections"),

  /**
   * Set tenant's default ERP connection.
   *
   * IMPORTANT:
   * This method is intentionally kept separate from the SAP
   * sync selector.
   *
   * Selecting an ERP for a particular sync does NOT change
   * the tenant-wide default.
   *
   * Tenant Admin ERP Configuration UI will call this method
   * when the user clicks "Set Default".
   */
  setDefaultErpConnection: (erpConfigId) => {
    if (
      erpConfigId === undefined ||
      erpConfigId === null ||
      erpConfigId === ""
    ) {
      return Promise.reject(
        new Error(
          "ERP configuration is required."
        )
      );
    }

    return put(
      `/sap-sync/erp-connections/${Number(
        erpConfigId
      )}/default`
    );
  },

  getStatus: () =>
    get("/sap-sync/status"),

  getLogs: (filters) =>
    get("/sap-sync/logs", filters),

  getRetryQueue: (filters) =>
    get("/sap-sync/retry-queue", filters),

  // ─────────────────────────────────────────────────────────
  // Master Synchronization page
  // ─────────────────────────────────────────────────────────

  // type:
  //   "departments"
  //   "categories"
  //   "document-types"
  listMasters: (type, filters) =>
    get(
      `/sap-sync/masters/${type}`,
      filters
    ),

  // ─────────────────────────────────────────────────────────
  // Document Synchronization page
  // ─────────────────────────────────────────────────────────

  listDocuments: (filters) =>
    get(
      "/sap-sync/documents",
      filters
    ),

  getDocumentDetail: (id) =>
    get(
      `/sap-sync/documents/${id}`
    ),

  // ─────────────────────────────────────────────────────────
  // Pending Classification page
  // ─────────────────────────────────────────────────────────

  listPendingClassification: (filters) =>
    get(
      "/sap-sync/pending-classification",
      filters
    ),

  assignClassification: (id, payload) =>
    post(
      `/sap-sync/pending-classification/${id}/assign`,
      payload
    ),

  bulkAssignClassification: (items) =>
    post(
      "/sap-sync/pending-classification/bulk-assign",
      { items }
    ),

  // Returns the raw fetch Response (not parsed as JSON)
  // so the caller can read it as a blob for inline preview.
  //
  // Mirrors the existing /documents/:id/view pattern used
  // elsewhere in the application.
  viewPendingClassificationDocument: (id) =>
    fetch(
      `${API}/sap-sync/pending-classification/${id}/view`,
      {
        headers: authHeaders(false),
        cache: "no-store",
      }
    ),

  // ─────────────────────────────────────────────────────────
  // Scheduler Management page
  // ─────────────────────────────────────────────────────────

  listSchedules: () =>
    get("/sap-sync/schedules"),

  updateSchedule: (id, payload) =>
    put(
      `/sap-sync/schedules/${id}`,
      payload
    ),

  runScheduleNow: (id) =>
    post(
      `/sap-sync/schedules/${id}/run-now`
    ),

  // ─────────────────────────────────────────────────────────
  // Settings page
  // ─────────────────────────────────────────────────────────

  getSettings: () =>
    get("/sap-sync/settings"),

  updateSettings: (payload) =>
    put(
      "/sap-sync/settings",
      payload
    ),

  // ERP-specific SAP connection test.
  //
  // Single ERP:
  //   testConnection()
  //
  // Multiple ERP:
  //   testConnection(erpConfigId)
  //
  // The selected ERP is sent to the backend so the connection
  // test is performed against that specific ERP configuration.
  testConnection: (erpConfigId) =>
    post(
      "/sap-sync/settings/test-connection",
      erpConfigId !== undefined &&
      erpConfigId !== null &&
      erpConfigId !== ""
        ? { erpConfigId }
        : {}
    ),

  // ─────────────────────────────────────────────────────────
  // Reference data for Pending Classification
  // assign form
  // ─────────────────────────────────────────────────────────

  // Departments are scoped to what's assigned
  // to the caller's tenant.
  listDepartmentsLite: (tenantId) =>
    get(
      `/departments/tenant/${tenantId}`
    ),

  listCategoriesLite: (departmentId) =>
    get(
      "/categories",
      departmentId
        ? { departmentId }
        : {}
    ),

  listDocumentTypesLite: (categoryId) =>
    get(
      "/document-types",
      categoryId
        ? { categoryId }
        : {}
    ),
};