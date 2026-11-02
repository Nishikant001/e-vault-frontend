// src/context/defaultHierarchy.js
//
// Mirrors backend/src/constants/tenantMetadataDefaults.js's DEFAULT_HIERARCHY
// exactly (frontend and backend are separate deployables, so this can't be
// a shared import — keep the two in sync if either changes). Used by
// MetadataProvider as the initial render value (before the
// GET /api/tenants/me/metadata call resolves) and as the fallback on
// unauthenticated pages (Login, marketing site) that never call it at all.
//
// This is exactly today's Golyan wording — using it as the default means
// zero visual change for the current tenant, with or without the backend
// call having completed yet.
export const DEFAULT_HIERARCHY = [
  { key: "DEPARTMENT", label: "Department", level: 1, parentKey: null },
  { key: "CATEGORY", label: "Category", level: 2, parentKey: "DEPARTMENT" },
  { key: "DOCUMENT_TYPE", label: "Document Type", level: 3, parentKey: "CATEGORY" },
];
