// src/features/sapSync/syncResultSummary.js
//
// FLEXIBLE MULTI-SELECT SYNC
//
// Turns the backend's per-ERP results ({ data: { results: [...] } })
// into a toast-ready { title, description, tone } so Master Sync,
// Document Sync and any future page report "Sync Selected" / "Sync All"
// outcomes identically. Failed ERPs are named, so one failure can't be
// hidden behind a generic "completed" message.

const OK = ["SUCCESS", "COMPLETED", "QUEUED", "STARTED", "RUNNING"];
const BAD = ["FAILED", "ERROR"];

export function summarizeMultiSync(response, label) {
  const results = response?.data?.results || response?.results || [];

  const status = (item) => String(item?.status || "").toUpperCase();
  const ok = results.filter((item) => OK.includes(status(item)));
  const failed = results.filter((item) => BAD.includes(status(item)));

  const failedNames = failed
    .map((item) => item.erpName || `ERP #${item.erpConfigId}`)
    .join(", ");

  if (failed.length > 0 && ok.length > 0) {
    return {
      title: `${label} partially completed`,
      description: `${ok.length} ERP(s) succeeded, ${failed.length} failed: ${failedNames}.`,
      tone: "error",
    };
  }

  if (failed.length > 0) {
    return {
      title: `${label} failed`,
      description: `Failed for: ${failedNames}.`,
      tone: "error",
    };
  }

  return {
    title: `${label} completed`,
    description: `${ok.length || results.length} ERP(s) synchronized successfully.`,
    tone: "success",
  };
}