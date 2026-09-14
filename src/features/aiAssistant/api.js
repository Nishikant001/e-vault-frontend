// src/features/aiAssistant/api.js
//
// Thin, single-purpose wrapper around the backend AI Document Assistant:
//   /api/ai/chat/*        → chat sessions + messages (RAG)
//   /api/ai/documents/*   → per-document AI actions (summarize, explain,
//                           compare, duplicates, missing-metadata,
//                           ocr-inconsistencies, validate-totals,
//                           auto-classify, auto-tag, folder-suggestions,
//                           reindex)
//   /api/ai/search/*      → semantic / metadata / OCR search
//   /api/ai/providers,
//   /api/ai/settings      → AI Settings page
//
// Follows the same convention as features/metadataEngine/api.js and
// features/approvalEngine/api.js: this is the ONLY file in the app that
// knows these endpoint paths. Every AI Assistant page/component talks to
// the backend through the functions exported here, on top of the shared
// services/apiClient helpers, so auth headers, base URL, and the
// `{ success, message }` error contract stay centralized in one place.

import { get, post, put, del } from "../../services/apiClient";

// ─────────────────────────────────────────────────────────────
// Role permissions — mirrors the backend's role arrays exactly
// (authRoutes/documentAIRoutes/aiSettingsRoutes) so the UI never
// shows a control the backend would 403 on.
// ─────────────────────────────────────────────────────────────
export const ALL_AI_ROLES = [
  "SuperAdmin", "TenantAdmin", "BranchManager", "DeptHead",
  "Manager", "Uploader", "Viewer", "Auditor", "Approver",
];

// documentAIRoutes.js WRITE_ROLES — actions that mutate/classify a document
export const AI_WRITE_ROLES = [
  "SuperAdmin", "TenantAdmin", "BranchManager", "DeptHead", "Manager", "Uploader",
];

// aiSettingsRoutes.js READ_ROLES — who can even see AI Settings
export const AI_SETTINGS_READ_ROLES = [
  "SuperAdmin", "TenantAdmin", "BranchManager", "DeptHead", "Manager", "Auditor",
];

// aiSettingsRoutes.js — who can edit providers/settings
export const AI_SETTINGS_WRITE_ROLES = ["SuperAdmin", "TenantAdmin"];

// chatRoutes.js — flat AI usage/audit log (distinct from "Recent Chats")
export const AI_USAGE_LOG_ROLES = ["SuperAdmin", "TenantAdmin", "Auditor"];

export const canWriteAI = (role) => AI_WRITE_ROLES.includes(role);
export const canViewAISettings = (role) => AI_SETTINGS_READ_ROLES.includes(role);
export const canEditAISettings = (role) => AI_SETTINGS_WRITE_ROLES.includes(role);
export const canViewAIUsageLog = (role) => AI_USAGE_LOG_ROLES.includes(role);

// ─────────────────────────────────────────────────────────────
// Chat — /api/ai/chat/*
// ─────────────────────────────────────────────────────────────
export const ChatApi = {
  createSession: ({ title, scopeType, scopeDocumentIds, scopeFolderJson }) =>
    post("/ai/chat/sessions", { title, scopeType, scopeDocumentIds, scopeFolderJson }),

  listSessions: () => get("/ai/chat/sessions"),

  getMessages: (sessionId) => get(`/ai/chat/sessions/${sessionId}/messages`),

  sendMessage: (sessionId, { message, topK }) =>
    post(`/ai/chat/sessions/${sessionId}/messages`, { message, topK }),

  deleteSession: (sessionId) => del(`/ai/chat/sessions/${sessionId}`),

  // Flat prompt/usage audit log across every AI feature (SuperAdmin/TenantAdmin/Auditor only)
  listUsageHistory: ({ feature, page = 1, pageSize = 25 } = {}) =>
    get("/ai/chat/history", { feature, page, pageSize }),
};

// ─────────────────────────────────────────────────────────────
// Per-document AI actions — /api/ai/documents/*
// ─────────────────────────────────────────────────────────────
export const DocumentAIApi = {
  summarize: (documentId) => get(`/ai/documents/${documentId}/summarize`),
  explain: (documentId) => get(`/ai/documents/${documentId}/explain`),
  compare: (documentIdA, documentIdB) =>
    post("/ai/documents/compare", { documentIdA, documentIdB }),
  duplicates: (documentId) => get(`/ai/documents/${documentId}/duplicates`),
  missingMetadata: (documentId) => get(`/ai/documents/${documentId}/missing-metadata`),
  ocrInconsistencies: (documentId) => get(`/ai/documents/${documentId}/ocr-inconsistencies`),
  validateTotals: (documentId) => get(`/ai/documents/${documentId}/validate-totals`),
  autoClassify: (documentId) => get(`/ai/documents/${documentId}/auto-classify`),
  autoTag: (documentId) => get(`/ai/documents/${documentId}/auto-tag`),
  folderSuggestions: (documentId) => get(`/ai/documents/${documentId}/folder-suggestions`),
  reindex: (documentId) => post(`/ai/documents/${documentId}/reindex`),
};

// ─────────────────────────────────────────────────────────────
// Search — /api/ai/search/*
// ─────────────────────────────────────────────────────────────
export const AISearchApi = {
  semantic: ({ query, documentIds, topK }) =>
    get("/ai/search/semantic", { query, documentIds: documentIds?.join(","), topK }),
  metadata: ({ keyword }) => get("/ai/search/metadata", { keyword }),
  ocr: ({ keyword }) => get("/ai/search/ocr", { keyword }),
};

// ─────────────────────────────────────────────────────────────
// AI Settings — /api/ai/providers, /api/ai/settings
// ─────────────────────────────────────────────────────────────
export const AISettingsApi = {
  listProviders: () => get("/ai/providers"),
  createProvider: (payload) => post("/ai/providers", payload),
  updateProvider: (id, payload) => put(`/ai/providers/${id}`, payload),
  deleteProvider: (id) => del(`/ai/providers/${id}`),
  getSettings: () => get("/ai/settings"),
  updateSettings: (payload) => put("/ai/settings", payload),
};

// ─────────────────────────────────────────────────────────────
// Document / folder pickers used by the scope selector, document
// summary page and compare page. Reuses the app's existing
// documents + master-data endpoints — no new backend surface.
// ─────────────────────────────────────────────────────────────
export const DocumentPickerApi = {
  search: ({ q, departmentId, categoryId, documentTypeId, page = 1, pageSize = 20 } = {}) =>
    get("/documents", { search: q, departmentId, categoryId, documentTypeId, page, pageSize }),
  getOne: (documentId) => get(`/documents/${documentId}`),
};

export const DocumentMetadataApi = {
  // /api/documents/:id/metadata → { rawOcr, mappedMetadata, confidence, fields, ... }
  get: (documentId) => get(`/documents/${documentId}/metadata`),
};

export const MasterDataApi = {
  departments: (tenantId) => get(`/departments/tenant/${tenantId}`),
  categories: (departmentId) => get("/categories", { departmentId }),
  documentTypes: (categoryId) => get("/document-types", { categoryId }),
};
