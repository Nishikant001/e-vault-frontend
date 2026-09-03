import { API_BASE_URL } from "../../../services/apiClient";

export const SAP_BLUE   = "#0070F2";
export const SAP_DARK   = "#003366";
export const SAP_LIGHT  = "#E8F1FD";
export const SAP_AMBER  = "#E76500";
export const SAP_PURPLE = "#6A1DCB";
export const SAP_GREEN  = "#22c55e";
export const SAP_RED    = "#ef4444";

// Re-exported from the centralized client (src/services/apiClient.js) so
// the 7 files in this folder that still import `API` from here keep
// working unchanged, but now resolve through VITE_API_BASE_URL instead of
// a hardcoded literal. New code should import API_BASE_URL directly from
// services/apiClient instead of through here.
export const API = API_BASE_URL;

export const STATUS_COLORS = {
  Approved:           { bg: "#f0fdf4", color: "#166534", border: "#86efac" },
  "Pending Approval": { bg: "#fff8f0", color: "#92400e", border: "#fde68a" },
  "OCR Processing":   { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  Rejected:           { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" },
  Completed:          { bg: "#f0fdf4", color: "#166534", border: "#86efac" },
};

// NOTE: MOCK_DEPARTMENTS / MOCK_DOCUMENTS (a hardcoded Golyan-flavored demo
// tree — "Vendor KYC", "GST Amount", etc.) previously lived here as dead
// code: grep confirmed nothing in the app imported either constant. Removed
// rather than risk a new tenant ever seeing fake Golyan department data.
// If a "no backend / demo mode" fallback is wanted in the future, it should
// be reintroduced explicitly behind a dev-only flag, not as an always-
// present unused export.