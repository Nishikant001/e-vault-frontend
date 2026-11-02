// src/services/documentSearchApi.js
//
// Thin wrapper around GET /api/documents/search — the new Universal
// Document Search endpoint. Uses the existing shared apiClient (base
// URL, JWT header, 401 auto-logout, error contract) exactly like every
// other *Api.js file in this project — nothing hardcoded here.
import { get } from "./apiClient";

/**
 * @param {object} params
 * @param {string} params.q
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @param {string|number} [params.departmentId]
 * @param {string|number} [params.categoryId]
 * @param {string|number} [params.documentTypeId]
 * @param {string} [params.uploadStatus]
 * @param {string} [params.sourceType]
 * @param {string} [params.dateFrom]
 * @param {string} [params.dateTo]
 */
export function searchDocuments(query = {}) {
  return get("/documents/search", query);
}
