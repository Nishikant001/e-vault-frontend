// src/features/crossDepartmentDocument/api.js
//
// Cross-Department Document Access API
//
// IMPORTANT:
// - Requester never uploads a document.
// - Requester never sends sourceDocumentId.
// - Owner searches/selects an EXISTING DMS document.
// - Recipient uses shareId only.
// - All requests use the existing centralized apiClient.

import {
  get,
  post,
} from "../../services/apiClient";


// ============================================================
// REQUESTS
// ============================================================

/**
 * Create a new cross-department document request.
 *
 * Requester sends ONLY:
 * - requestedDepartmentId
 * - documentReference
 * - reason
 *
 * No file.
 * No sourceDocumentId.
 */
export function createDocumentAccessRequest({
  requestedDepartmentId,
  documentReference,
  reason,
}) {
  return post(
    "/cross-department-documents/cross-department-requests",
    {
      requestedDepartmentId,
      documentReference,
      reason,
    }
  );
}


/**
 * List requests visible to the current user.
 *
 * Backend decides whether the user sees:
 * - own requests
 * - department-owner requests
 */
export function getDocumentAccessRequests(
  params = {}
) {
  return get(
    "/cross-department-documents/cross-department-requests",
    params
  );
}


/**
 * Get one request.
 */
export function getDocumentAccessRequest(
  requestId
) {
  return get(
    `/cross-department-documents/cross-department-requests/${requestId}`
  );
}


/**
 * Reject a request.
 *
 * Owner only.
 */
export function rejectDocumentAccessRequest(
  requestId,
  reason = ""
) {
  return post(
    `/cross-department-documents/cross-department-requests/${requestId}/reject`,
    {
      reason,
    }
  );
}


// ============================================================
// OWNER — EXISTING DMS DOCUMENT SEARCH
// ============================================================

/**
 * Search EXISTING DMS documents for a request.
 *
 * IMPORTANT:
 * This endpoint is for the authorized department owner.
 *
 * The requester UI must NEVER call this function.
 *
 * No upload is involved.
 */
export function searchSourceDocuments(
  requestId,
  params = {}
) {
  return get(
    `/cross-department-documents/cross-department-requests/${requestId}/source-documents`,
    params
  );
}


/**
 * Select an EXISTING DMS document.
 *
 * IMPORTANT:
 * This is NOT an upload.
 *
 * sourceDocumentId is sent ONLY after the owner
 * selects an existing DMS document.
 */
export function selectSourceDocument(
  requestId,
  {
    sourceDocumentId,
    sourceDocumentVersion = null,
  }
) {
  return post(
    `/cross-department-documents/cross-department-requests/${requestId}/select-document`,
    {
      sourceDocumentId,
      sourceDocumentVersion,
    }
  );
}


// ============================================================
// OWNER — TEMPORARY SHARE PREPARATION
// ============================================================

/**
 * Prepare temporary share.
 *
 * durationMinutes:
 * 15
 * 30
 * 60
 * 240
 * 1440
 * 4320
 * 10080
 *
 * Server calculates expiresAt.
 */
export function prepareDocumentShare(
  requestId,
  {
    durationMinutes,
    maskingRequired = false,
  }
) {
  return post(
    `/cross-department-documents/cross-department-requests/${requestId}/prepare`,
    {
      durationMinutes,
      maskingRequired,
    }
  );
}


// ============================================================
// OWNER — MASKING
// ============================================================

/**
 * Apply masking to the temporary shared copy.
 *
 * The backend accepts:
 *
 * {
 *   masks: [
 *     {
 *       page,
 *       x,
 *       y,
 *       width,
 *       height
 *     }
 *   ]
 * }
 *
 * Do NOT send arbitrary expiresAt or sourceDocumentId here.
 */
export function maskDocumentShare(
  shareId,
  masks
) {
  return post(
    `/cross-department-documents/cross-department-shares/${shareId}/mask`,
    {
      masks,
    }
  );
}


// ============================================================
// OWNER — SEND
// ============================================================

/**
 * Send the prepared temporary copy.
 *
 * The owner has already decided:
 * - maskingRequired = false
 * OR
 * - maskingRequired = true and masks were applied.
 */
export function sendDocumentShare(
  shareId
) {
  return post(
    `/cross-department-documents/cross-department-shares/${shareId}/send`,
    {}
  );
}


// ============================================================
// OWNER — REVOKE
// ============================================================

/**
 * Revoke an active temporary share.
 */
export function revokeDocumentShare(
  shareId,
  reason = ""
) {
  return post(
    `/cross-department-documents/cross-department-shares/${shareId}/revoke`,
    {
      reason,
    }
  );
}


// ============================================================
// RECIPIENT — TEMPORARY VIEW
// ============================================================

/**
 * View temporary shared document.
 *
 * IMPORTANT:
 * Uses shareId.
 *
 * This does NOT call:
 * /documents/:id/view
 *
 * The backend returns binary document data.
 *
 * Binary handling will be connected through the
 * existing frontend API client in the next required
 * file rather than exposing sourceDocumentId.
 */
export function getTemporaryShareViewUrl(
  shareId
) {
  return `/cross-department-documents/cross-department-shares/${shareId}/view`;
}


// ============================================================
// RECIPIENT — TEMPORARY DOWNLOAD
// ============================================================

/**
 * Download temporary shared document.
 *
 * Uses shareId only.
 */
export function getTemporaryShareDownloadUrl(
  shareId
) {
  return `/cross-department-documents/cross-department-shares/${shareId}/download`;
}


// ============================================================
// STATUS HELPERS
// ============================================================

export const CROSS_DEPARTMENT_REQUEST_STATUS = {
  PENDING: "PENDING",
  DOCUMENT_SELECTED: "DOCUMENT_SELECTED",
  APPROVED: "APPROVED",
  SHARED: "SHARED",
  REJECTED: "REJECTED",
  REVOKED: "REVOKED",
  EXPIRED: "EXPIRED",
};


// ============================================================
// ACCESS DURATIONS
// ============================================================

export const DOCUMENT_SHARE_DURATIONS = [
  {
    value: 15,
    label: "15 minutes",
  },
  {
    value: 30,
    label: "30 minutes",
  },
  {
    value: 60,
    label: "1 hour",
  },
  {
    value: 240,
    label: "4 hours",
  },
  {
    value: 1440,
    label: "1 day",
  },
  {
    value: 4320,
    label: "3 days",
  },
  {
    value: 10080,
    label: "7 days",
  },
];