// src/features/metadataEngine/api.js
//
// Thin, single-purpose wrapper around the backend Dynamic Metadata
// Template Engine:
//   /api/metadata-templates/*   → template + version CRUD, publish, assign
//   /api/metadata-fields/*      → form-builder fields + OCR aliases
//   /api/documents/:id/metadata → dynamic OCR metadata for a document
//
// Follows the same convention as features/approvalEngine/api.js and
// features/sapSync/api.js: one file owns every endpoint for this module,
// built on top of the shared services/apiClient helpers (get/post/put/del)
// so auth headers, base URL and the `{ success, message }` error contract
// are handled in exactly one place.
import { get, post, put, del } from "../../services/apiClient";

// ── Templates ──────────────────────────────────────────────────
export const listTemplates = (documentTypeId) =>
  get("/metadata-templates", documentTypeId ? { documentTypeId } : undefined);

export const getTemplate = (templateId) => get(`/metadata-templates/${templateId}`);

export const createTemplate = ({ documentTypeId, name, description }) =>
  post("/metadata-templates", { documentTypeId, name, description });

export const updateTemplate = (templateId, patch) => put(`/metadata-templates/${templateId}`, patch);

export const deleteTemplate = (templateId) => del(`/metadata-templates/${templateId}`);

// ── Versions ───────────────────────────────────────────────────
export const listVersions = (templateId) => get(`/metadata-templates/${templateId}/versions`);

export const createVersion = (templateId, cloneFromLatest = true) =>
  post(`/metadata-templates/${templateId}/versions`, { cloneFromLatest });

export const getVersion = (versionId) => get(`/metadata-templates/versions/${versionId}`);

export const updateVersion = (versionId, patch) => put(`/metadata-templates/versions/${versionId}`, patch);

export const publishVersion = (versionId) => post(`/metadata-templates/versions/${versionId}/publish`);

export const deleteVersion = (versionId) => del(`/metadata-templates/versions/${versionId}`);

// ── Assignment ─────────────────────────────────────────────────
export const assignTemplateVersion = (documentTypeId, metadataTemplateVersionId) =>
  post("/metadata-templates/assign", { documentTypeId, metadataTemplateVersionId });

export const getActiveAssignment = (documentTypeId) =>
  get(`/metadata-templates/document-types/${documentTypeId}/assignment`);

// ── Fields (Form Builder) ───────────────────────────────────────
export const listFields = (versionId) => get(`/metadata-fields/versions/${versionId}/fields`);

export const createField = (versionId, field) => post(`/metadata-fields/versions/${versionId}/fields`, field);

export const updateField = (fieldId, patch) => put(`/metadata-fields/${fieldId}`, patch);

export const deleteField = (fieldId) => del(`/metadata-fields/${fieldId}`);

export const reorderFields = (versionId, order) =>
  put(`/metadata-fields/versions/${versionId}/reorder`, { order });

// ── OCR aliases ──────────────────────────────────────────────────
export const listAliases = (fieldId) => get(`/metadata-fields/${fieldId}/aliases`);

export const createAlias = (fieldId, alias) => post(`/metadata-fields/${fieldId}/aliases`, { alias });

export const deleteAlias = (aliasId) => del(`/metadata-fields/aliases/${aliasId}`);

// ── Document dynamic metadata (OCR review) ──────────────────────
export const getDocumentMetadata = (documentId) => get(`/documents/${documentId}/metadata`);

export const correctDocumentMetadata = (documentId, values, confirm = false) =>
  put(`/documents/${documentId}/metadata`, { values, confirm });

export const validateDocumentMetadata = (documentId, values) =>
  post(`/documents/${documentId}/metadata/validate`, { values });

// ── Hierarchy helpers (Department → Category → Document Type) ───
// Reused by the Template Manager + Assign Template screens; these already
// exist as tenant-scoped endpoints elsewhere in the app.
export const listDepartmentsForTenant = (tenantId) => get(`/departments/tenant/${tenantId}`);
export const listCategories = (departmentId) => get("/categories", departmentId ? { departmentId } : undefined);
export const listDocumentTypes = (categoryId) => get("/document-types", categoryId ? { categoryId } : undefined);
