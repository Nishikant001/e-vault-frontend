// Tenant-module availability is an entitlement layer on top of the existing
// role/page architecture. Keys not listed here remain governed exclusively
// by the existing role/subscription/ERP rules.
const PAGE_MODULES = {
  documents: "dms",
  folder: "dms",
  folders: "dms",
  upload: "dms",
  newdoc: "dms",
  workflow: "workflow",
  audit: "audit",
  auditlog: "audit",
  communication: "communication",
  crossDepartmentRequest: "cross_department",
  metadataTemplates: "metadata_engine",
  approvals: "approval_engine",
  approvalWorkflows: "approval_engine",
  workflowAssignment: "approval_engine",
  aiChat: "ai_assistant",
  aiSearch: "ai_assistant",
  aiSummaries: "ai_assistant",
  aiCompare: "ai_assistant",
  aiRecentChats: "ai_assistant",
  aiSavedPrompts: "ai_assistant",
  aiSettings: "ai_assistant",
  SAP_SYNC_DASHBOARD: "sap_sync",
  SAP_SYNC_MASTERS: "sap_sync",
  SAP_SYNC_DOCUMENTS: "sap_sync",
  SAP_SYNC_PENDING_CLASSIFICATION: "sap_sync",
  SAP_SYNC_SCHEDULER: "sap_sync",
  SAP_SYNC_JOB_HISTORY: "sap_sync",
  SAP_SYNC_LOG_VIEWER: "sap_sync",
  SAP_SYNC_SETTINGS: "sap_sync",
};

export function getModuleForPage(pageKey) {
  return PAGE_MODULES[pageKey] || null;
}

export function filterNavigationItems(items, isModuleVisible) {
  return items.filter((item) => {
    const moduleKey = getModuleForPage(item.key);
    return !moduleKey || isModuleVisible(moduleKey);
  });
}
