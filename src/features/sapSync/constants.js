// src/features/sapSync/constants.js

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(value) {
  if (!value) return "Never";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function formatDuration(ms) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
}

export const JOB_LABELS = {
  MASTER_SYNC: "SAP Master Synchronization",
  DOCUMENT_SYNC: "SAP Document Synchronization",
  RETRY_SYNC: "Retry Failed Sync",
};

// Was a static constant (Departments/Categories/Document Types hardcoded).
// Now a small pure function so the caller (MasterSyncPage.jsx) can feed in
// the current tenant's labels from useLabels() — this file itself isn't a
// component/hook and can't call useLabels() directly.
export function getMasterTypeTabs(labels) {
  return [
    { value: "departments", label: `${labels.level1Label}s` },
    { value: "categories", label: `${labels.level2Label}s` },
    { value: "document-types", label: `${labels.level3Label}s` },
  ];
}

export const SYNC_STATUS_OPTIONS = [
  { label: "Mapped", value: "MAPPED" },
  { label: "Pending", value: "PENDING" },
];

export const DOC_SYNC_STATUS_OPTIONS = [
  { label: "Synced", value: "SYNCED" },
  { label: "Pending Classification", value: "PENDING_CLASSIFICATION" },
  { label: "Failed", value: "FAILED" },
];

export const CLASSIFICATION_OPTIONS = [
  { label: "Complete", value: "COMPLETE" },
  { label: "Pending", value: "PENDING" },
];

export function statusTone(status) {
  const s = String(status || "").toUpperCase();
  if (["SYNCED", "MAPPED", "SUCCESS", "CONNECTED", "RESOLVED"].includes(s)) return "success";
  if (["PENDING", "PENDING_CLASSIFICATION", "RUNNING", "RETRYING", "PARTIAL_SUCCESS"].includes(s)) return "warning";
  if (["FAILED", "ERROR", "ABANDONED", "DISCONNECTED"].includes(s)) return "danger";
  return "neutral";
}
