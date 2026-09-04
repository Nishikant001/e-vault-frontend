import { useState, useEffect } from "react";
import { useTheme } from "../SuperAdmin/Superadmincontext";
import { useSubscription } from "../../context/SubscriptionContext";
import { useTenantCapabilities } from "../../context/MetadataContext";
import { getAIAssistantNavItems } from "../../features/aiAssistant/nav";
import logo from "../../assets/evault-logo-light.png";
import { Settings2, PlugZap ,Building2 } from "lucide-react";
import { API_BASE_URL } from "../../services/apiClient";
import { useTenantModules } from "../../context/TenantModuleContext";
import { filterNavigationItems } from "../../utils/tenantModuleMapping";
const ICONS = {
  inbox: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),

  erpConfiguration: <Settings2 size={15} strokeWidth={2} />,
  erpConnectivity: <PlugZap size={15} strokeWidth={2} />,
  userAssign: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.5 21a8.38 8.38 0 00-15 0" />
      <circle cx="13" cy="8" r="5" />
      <path d="M3 10l2 2 4-4" />
    </svg>
  ),
  dashboard: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  users: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  folder: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  ),
  companyCode: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="13" y2="15" />
    </svg>
  ),
  plant: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 20h20" />
      <path d="M4 20V10l6 4v-4l6 4V6l4 3v11" />
    </svg>
  ),
  docs: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  workflow: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  audit: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  approvals: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  logout: (
    <svg
      width="15"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  bell: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  sun: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ),
  menu: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  sapSync: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M3 21v-5h5" />
    </svg>
  ),
  metadataTemplate: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 17.5h7M17.5 14v7" />
    </svg>
  ),
  aiAssistant: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  ),
  communication: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  chevronDown: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  grid: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  shield: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l8 3.5v6c0 5-3.4 8.7-8 10.5-4.6-1.8-8-5.5-8-10.5v-6z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  reportsIcon: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  masterData: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  ),
  syncDocs: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 14a3 3 0 015-2" />
      <path d="M15 16a3 3 0 01-5 2" />
    </svg>
  ),
  pendingTag: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41L11 3.83A2 2 0 009.59 3.24L3 3l.24 6.59a2 2 0 00.59 1.41l9.58 9.58a2 2 0 002.83 0l4.35-4.35a2 2 0 000-2.82z" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  scheduler: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M12 14v3l2 1" />
    </svg>
  ),
  jobHistory: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 109-9" />
      <polyline points="3 5 3 12 8 12" />
      <path d="M12 8v4l3 2" />
    </svg>
  ),
  logViewer: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="7" y1="9" x2="17" y2="9" />
      <line x1="7" y1="13" x2="14" y2="13" />
      <line x1="7" y1="17" x2="11" y2="17" />
    </svg>
  ),
  syncSettings: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a4 4 0 01-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 015.4-5.4z" />
    </svg>
  ),
  approvalCheck: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3v2h6V3" />
      <polyline points="9 13 11 15 15 11" />
    </svg>
  ),
  workflowAssign: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="3" />
      <path d="M2 20a6 6 0 0112 0" />
      <path d="M16 8h6M19 5l3 3-3 3" />
    </svg>
  ),
  organization: <Building2 size={15} strokeWidth={2} />,
};
function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const NAV_DASHBOARD = [
  { key: "dashboard", label: "DASHBOARD", icon: "dashboard" },
];

const NAV_ADMIN = [
  { key: "companyCodes", label: "Company Code Config", icon: "companyCode" },
  { key: "plants", label: "Plant Config", icon: "plant" },
  { key: "folder", label: "Folder Repository", icon: "folder" },
  { key: "users", label: "User Management", icon: "users" },
  { key: "userAssignment", label: "User Access Config", icon: "userAssign" },
];

const NAV_DOCS = [
  {
    key: "metadataTemplates",
    label: "OCR Template Config",
    icon: "metadataTemplate",
  },
  {
    key: "approvalWorkflows",
    label: "Approval Config",
    icon: "approvalCheck",
  },
  { key: "workflow", label: "Upload & Manage", icon: "workflow" },
  { key: "documents", label: "Document Repository", icon: "docs" },
];

const NAV_COMMUNICATION = [
  { key: "communication", label: "Chat Center", icon: "communication" },
];
const NAV_APPROVALS = [
  {
    key: "workflowAssignment",
    label: "Workflow Assignment",
    icon: "workflowAssign",
  },
];

const NAV_INBOX = [
{ key: "approvals", label: "Inbox", icon: "inbox" },
];

const NAV_CROSS_DEPARTMENT = [
  { key: "crossDepartmentRequest", label: "Access Requests", icon: "shield" },
];

const NAV_REPORTS = [{ key: "audit", label: "Audit Log", icon: "audit" }];

// Settings → SAP Synchronization — TenantAdmin only (this whole layout is
// only rendered for the TenantAdmin role in App.jsx).
const NAV_SAP_SYNC = [
  { key: "SAP_SYNC_DASHBOARD", label: "ERP Connectivity", icon: "sapSync" },
  { key: "SAP_SYNC_MASTERS", label: "Masterdata Sync", icon: "masterData" },
  { key: "SAP_SYNC_DOCUMENTS", label: "Data Sync", icon: "syncDocs" },
  // { key: "SAP_SYNC_PENDING_CLASSIFICATION", label: "Pending Classification", icon: "pendingTag" },
  // { key: "SAP_SYNC_SCHEDULER", label: "Scheduler Management", icon: "scheduler" },
  {
    key: "SAP_SYNC_JOB_HISTORY",
    label: "Execution History",
    icon: "jobHistory",
  },
  { key: "SAP_SYNC_LOG_VIEWER", label: "Audit Trail", icon: "logViewer" },
  { key: "SAP_SYNC_SETTINGS", label: "Configuration", icon: "syncSettings" },
];

// AI Assistant — Copilot-style chat, search, summaries, compare, settings.
// Item list is role-filtered centrally in features/aiAssistant/nav.js so it
// always matches what the backend actually allows TenantAdmin to do.
const NAV_AI = getAIAssistantNavItems("TenantAdmin").map((item) => ({
  key: item.key,
  label: item.label,
  icon: "aiAssistant",
}));

// lockReason: null (unlocked) | "upgrade" (FREE tier premium gate,
// existing behavior) | "erp" (ERP / Non-ERP Tenant Classification gate —
// PAID tenant, but SuperAdmin hasn't enabled ERP for it). Both render as
// "locked" visually, but with different tooltip copy and a different
// marker glyph so a PAID NON-ERP admin doesn't get told to "upgrade their
// plan" for something their plan already includes.
function NavItem({ item, active, onClick, lockReason }) {
  const locked = !!lockReason;
  const title =
    lockReason === "erp"
      ? "ERP integration is not enabled for this tenant"
      : lockReason === "upgrade"
        ? "Premium feature — click to upgrade your plan"
        : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={locked}
      title={title}
      className={`group flex items-center gap-[10px] w-[calc(100%-16px)] mx-2 my-[3px] px-3.5 py-[10px] rounded-[9px] text-[14.5px] font-medium transition-all duration-150 ${        locked
          ? lockReason === "erp"
            ? "text-white/30 hover:text-slate-300/80 hover:bg-white/[0.04] cursor-pointer"
            : "text-white/30 hover:text-amber-300/80 hover:bg-white/[0.04] cursor-pointer"
          : active
            ? "bg-gradient-to-r from-blue-500/25 to-blue-500/[0.06] text-[#6FB6FF] shadow-[inset_2.5px_0_0_0_#3B82F6]"
            : "text-white/55 hover:bg-white/[0.05] hover:text-white/90"
      }`}
    >
      <span
        className={`flex-shrink-0 w-[18px] flex items-center justify-center transition-colors ${
          locked
            ? "text-white/20"
            : active
              ? "text-[#6FB6FF]"
              : "text-white/40 group-hover:text-white/70"
        }`}
      >
        {ICONS[item.icon]}
      </span>
      <span className="flex-1 text-left truncate flex items-center gap-[5px]">
        {item.label}
        {locked && (
          <span
            className={`text-[12px] leading-none font-bold ${
              lockReason === "erp" ? "text-slate-400/90" : "text-amber-400/90"
            }`}
            aria-hidden="true"
          >
            {lockReason === "erp" ? "⛔" : "*"}
          </span>
        )}
      </span>
      {item.badge && !locked && (
        <span
          className={`text-[10px] font-bold px-[7px] py-px rounded-full ${
            active ? "bg-blue-500 text-white" : "bg-blue-900/40 text-blue-300"
          }`}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
}

function SectionLabel({ title, icon }) {
  return (
        <div className="flex items-center gap-[8px] px-[16px] pt-4 pb-[9px] text-[12px] font-bold text-white/35 uppercase tracking-[0.9px]">
      <span className="opacity-70 flex-shrink-0 w-[18px] flex items-center justify-center">
        {ICONS[icon]}
      </span>
      <span>{title}</span>
    </div>
  );
}

function UpgradeModal({ open, onClose, onUpgrade }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1A2433] border border-white/10 rounded-xl max-w-sm w-full p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/15 flex items-center justify-center mb-4">
          <span className="text-amber-400 text-2xl font-bold">*</span>
        </div>
        <h3 className="text-white text-[15px] font-bold mb-2">
          Premium Feature
        </h3>
        <p className="text-white/60 text-[13px] leading-relaxed mb-5">
          This feature isn't included in your current plan. Please subscribe to
          a paid plan to unlock it.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white/70 hover:text-white/90 hover:bg-white/5"
          >
            Maybe Later
          </button>
          <button
            onClick={onUpgrade}
            className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}

function ErpNotEnabledModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1A2433] border border-white/10 rounded-xl max-w-sm w-full p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-500/15 flex items-center justify-center mb-4">
          <span className="text-slate-300 text-2xl font-bold">⛔</span>
        </div>
        <h3 className="text-white text-[15px] font-bold mb-2">
          ERP Not Enabled
        </h3>
        <p className="text-white/60 text-[13px] leading-relaxed mb-5">
          ERP integration is not enabled for this tenant. Contact your
          SuperAdmin if you need SAP synchronization enabled for your
          organization.
        </p>
        <div className="flex items-center justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function StandaloneNavSection({ item, activePage, onNavigate, onMobileClose }) {
  return (
    <div className="px-2 py-[3px]">
      <button
        type="button"
        onClick={() => {
          onNavigate(item.key);
          onMobileClose?.();
        }}
                className={`w-full flex items-center gap-[9px] px-3.5 py-[12px] rounded-[9px] text-[12.5px] font-bold uppercase tracking-[0.7px] transition-all duration-150 ${
          activePage === item.key
            ? "text-white/75 bg-white/[0.045]"
            : "text-white/35 hover:text-white/60 hover:bg-white/[0.03]"
        }`}
      >
               <span className="flex-shrink-0 opacity-80 w-[18px] flex items-center justify-center">
          {ICONS[item.icon]}
        </span>

        <span className="flex-1 text-left">{item.label}</span>

        {item.badge && (
          <span className="text-[10px] font-bold px-[7px] py-px rounded-full bg-blue-900/40 text-blue-300 normal-case tracking-normal">
            {item.badge}
          </span>
        )}
      </button>
    </div>
  );
}

// lockReason: same "upgrade" | "erp" | null contract as NavItem. `lockAll`
// (boolean) is still accepted for backward compatibility with any other
// call site, but new call sites should pass `lockReason` directly.
function NavSection({
  title,
  icon,
  items,
  activePage,
  onNavigate,
  onMobileClose,
  isOpen,
  onToggle,
  lockAll,
  lockReason,
  onLockedClick,
}) {
  const effectiveLockReason = lockReason ?? (lockAll ? "upgrade" : null);
  const locked = !!effectiveLockReason;
  const hasActive = items.some((item) => activePage === item.key);
  const title_ =
    effectiveLockReason === "erp"
      ? "ERP integration is not enabled for this tenant"
      : effectiveLockReason === "upgrade"
        ? "Premium feature — upgrade your plan to unlock"
        : undefined;
  return (
    <div className="px-2 py-[3px]">
      <button
        type="button"
        onClick={onToggle}
        title={title_}
                className={`w-full flex items-center gap-[9px] px-3.5 py-[12px] rounded-[9px] text-[12.5px] font-bold uppercase tracking-[0.7px] transition-all duration-150 ${
          isOpen || hasActive
            ? "text-white/75 bg-white/[0.045]"
            : "text-white/35 hover:text-white/60 hover:bg-white/[0.03]"
        }`}
      >
                <span className="flex-shrink-0 opacity-80 w-[18px] flex items-center justify-center">
          {ICONS[icon]}
        </span>{" "}
        <span className="flex-1 text-left flex items-center gap-[5px]">
          {title}
          {locked && (
            <span
              className={`text-[11px] leading-none font-bold ${
                effectiveLockReason === "erp"
                  ? "text-slate-400/90"
                  : "text-amber-400/90"
              }`}
              aria-hidden="true"
            >
              {effectiveLockReason === "erp" ? "⛔" : "*"}
            </span>
          )}
        </span>
        <span
          className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 opacity-90" : "opacity-50"}`}
        >
          {ICONS.chevronDown}
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mx-2 mt-[5px] mb-2 rounded-[10px] bg-white/[0.04] border border-white/[0.06] py-[5px]">
                      {items.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                active={activePage === item.key}
                lockReason={effectiveLockReason}
                onClick={() => {
                  if (locked) {
                    onLockedClick?.();
                    return;
                  }
                  onNavigate(item.key);
                  onMobileClose?.();
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({

  activePage,
  onNavigate,
  onLogout,
  mobileOpen,
  onMobileClose,
  user,
}) {
  const { isModuleVisible } = useTenantModules();
  const visibleNAV_SAP_SYNC = filterNavigationItems(NAV_SAP_SYNC, isModuleVisible);
  const visibleNAV_DOCS = filterNavigationItems(NAV_DOCS, isModuleVisible);
  const visibleNAV_APPROVALS = filterNavigationItems(NAV_APPROVALS, isModuleVisible);
  const visibleNAV_AI = filterNavigationItems(NAV_AI, isModuleVisible);

  const [openSections, setOpenSections] = useState({
    admin: false,
    docs: false,
    approvals: false,
    reports: false,
    sync: false,
    ai: false,
  });
  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // FREE tenants: every page under "Main" (Dashboard, User Management,
  // User Assignment, Company Codes, Plants, Folder Structure, Documents,
  // DMS Workflow, Metadata Templates) always stays clickable — those are
  // included in the free tier. Only the other sections (Synchronization,
  // Approval Management, Reports, AI Assistant) are premium: they still
  // show in the sidebar marked with "*", and clicking one pops the
  // upgrade modal instead of navigating. PAID tenants (isFree === false)
  // are completely unaffected — lockAll stays false everywhere below.
  const { isFree } = useSubscription();
  // ── ERP / Non-ERP Tenant Classification ──────────────────────────
  // Independent of the FREE/PAID gate above. A PAID tenant only sees the
  // Synchronization (SAP Sync) section unlocked when SuperAdmin has
  // switched it to ERP mode. FREE tenants keep their existing behavior —
  // isFree already locks this section for them via lockReason="upgrade"
  // below, so erpEnabled never even gets consulted for a FREE tenant.
  const { erpEnabled } = useTenantCapabilities();
  const [erpModalOpen, setErpModalOpen] = useState(false);
  const syncLockReason = isFree ? "upgrade" : !erpEnabled ? "erp" : null;
    const { dark, setDark } = useTheme();
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onUpgrade={() => {
          setUpgradeModalOpen(false);
          onNavigate("subscription");
          onMobileClose?.();
        }}
      />
      <ErpNotEnabledModal
        open={erpModalOpen}
        onClose={() => setErpModalOpen(false)}
      />
      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col w-[264px] bg-[#1A2433] transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0 lg:flex-shrink-0`}
      >
        {/* Logo */}
        <div className="px-1 py-1 border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <img
              src={logo}
              alt="e-Vault"
              className="h-13.5 w-100 object-contain"
            />
            <button
              className="text-white/40 hover:text-white lg:hidden"
              onClick={onMobileClose}
            >
              {ICONS.close}
            </button>
          </div>
        </div>

        {/* User */}
        {/* User */}
        {/* <div className="flex items-center gap-[9px] px-[14px] py-[11px] border-b border-white/[0.08] bg-white/[0.015]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ring-2 ring-white/10">
            {getInitials(user?.u)}
          </div>
          <div className="min-w-0">
            <div className="text-white/90 text-[11px] font-semibold truncate">
              {user?.u || "User"}
            </div>
          </div>
        </div> */}

        {/* Nav */}
        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-3 space-y-[2px] text-[13px]">          {visibleNAV_SAP_SYNC.length > 0 && <NavSection
            title="Erp Configuration"
            icon="erpConfiguration"
            items={visibleNAV_SAP_SYNC}
            activePage={activePage}
            onNavigate={onNavigate}
            onMobileClose={onMobileClose}
            isOpen={openSections.sync}
            onToggle={() => toggleSection("sync")}
            lockReason={syncLockReason}
            onLockedClick={() =>
              syncLockReason === "erp"
                ? setErpModalOpen(true)
                : setUpgradeModalOpen(true)
            }
          />}

          <div className="mt-2 mb-1 border-t border-white/[0.06]" />

          {/* <SectionLabel title="Main" icon="grid" /> */}
          <StandaloneNavSection
            item={NAV_DASHBOARD[0]}
            activePage={activePage}
            onNavigate={onNavigate}
            onMobileClose={onMobileClose}
          />

          <NavSection
            title="Organization"
            icon="organization"
            items={NAV_ADMIN}
            activePage={activePage}
            onNavigate={onNavigate}
            onMobileClose={onMobileClose}
            isOpen={openSections.admin}
            onToggle={() => toggleSection("admin")}
          />

          {visibleNAV_DOCS.length > 0 && <NavSection
            title="Document Config"
            icon="docs"
            items={visibleNAV_DOCS}
            activePage={activePage}
            onNavigate={onNavigate}
            onMobileClose={onMobileClose}
            isOpen={openSections.docs}
            onToggle={() => toggleSection("docs")}
          />}
          {visibleNAV_APPROVALS.length > 0 && <NavSection
            title="Approvals"
            icon="workflowAssign"
            items={visibleNAV_APPROVALS}
            activePage={activePage}
            onNavigate={onNavigate}
            onMobileClose={onMobileClose}
            isOpen={openSections.approvals}
            onToggle={() => toggleSection("approvals")}
          />}

          <div className="mt-2 mb-1 border-t border-white/[0.06]" />

          {isModuleVisible("approval_engine") && (
          <StandaloneNavSection
            item={NAV_INBOX[0]}
            activePage={activePage}
            onNavigate={onNavigate}
            onMobileClose={onMobileClose}
          />
          )}
          {isModuleVisible("cross_department") && (
          <StandaloneNavSection
            item={NAV_CROSS_DEPARTMENT[0]}
            activePage={activePage}
            onNavigate={onNavigate}
            onMobileClose={onMobileClose}
          />
          )}
          {isModuleVisible("audit") && (
          <StandaloneNavSection
            item={NAV_REPORTS[0]}
            activePage={activePage}
            onNavigate={onNavigate}
            onMobileClose={onMobileClose}
          />
          )}
          {visibleNAV_AI.length > 0 && <NavSection
            title="AI Assistant"
            icon="aiAssistant"
            items={visibleNAV_AI}
            activePage={activePage}
            onNavigate={onNavigate}
            onMobileClose={onMobileClose}
            isOpen={openSections.ai}
            onToggle={() => toggleSection("ai")}
            lockAll={isFree}
            onLockedClick={() => setUpgradeModalOpen(true)}
          />}
          {isModuleVisible("communication") && (
          <StandaloneNavSection
            item={NAV_COMMUNICATION[0]}
            activePage={activePage}
            onNavigate={onNavigate}
            onMobileClose={onMobileClose}
          />
          )}
        </div>

        {/* Logout */}
        <div className="border-t border-white/10 p-2">
          {isFree && (
            <div className="px-[14px] pb-2 text-[10px] text-amber-400/80 leading-snug">
              <span className="font-bold">*</span> Premium feature — upgrade to
              unlock
            </div>
          )}
          {!isFree && !erpEnabled && (
            <div className="px-[14px] pb-2 text-[10px] text-slate-400/80 leading-snug">
              <span className="font-bold">⛔</span> ERP integration not enabled
              for this tenant
            </div>
          )}
                    <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="flex-1 flex items-center gap-[9px] px-[14px] py-[7px] text-[12px] text-white/50 hover:text-white/80 hover:bg-white/5 rounded transition-all"
            >
              {ICONS.logout} Logout
            </button>
            <button
              onClick={() => setDark((v) => !v)}
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
            >
              {dark ? ICONS.sun : ICONS.moon}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function decodeAccessToken() {
  try {
    const t = localStorage.getItem("accessToken");
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1]));
  } catch {
    return null;
  }
}

function Topbar({ onMenuClick, onTCodeSearch, user }) {
  const { dark, setDark } = useTheme();
  const tokenPayload = decodeAccessToken();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    async function loadProfile() {
      try {
        // Try a dedicated "current user" endpoint first.
        const res = await fetch(`${API_BASE_URL}/users/me`, { headers });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setProfile(data.data);
          return;
        }
        throw new Error("no /users/me");
      } catch {
        // Fallback: fetch the tenant user list and match by id from the JWT.
        try {
          const res = await fetch(`${API_BASE_URL}/users`, { headers });
          const data = await res.json();
          if (res.ok && data.success && Array.isArray(data.data) && tokenPayload?.id) {
            const match = data.data.find((u) => u.id === tokenPayload.id);
            if (match) setProfile(match);
          }
        } catch {
          /* ignore — falls back to email/role below */
        }
      }
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = profile?.name || user?.u || tokenPayload?.email?.split("@")[0] || "User";
  const displayRole = profile?.role || tokenPayload?.role || "";
  return (
    <header className="h-[64px] bg-white dark:bg-[#1A2433] border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-4 flex-shrink-0 sticky top-0 z-20 transition-colors">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-500 dark:text-slate-400 flex-shrink-0"
      >
        {ICONS.menu}
      </button>

      <button
        onClick={onTCodeSearch}
        className="group flex items-center ml-17 h-[42px] rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#232F40] hover:bg-gray-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:border-blue-500 focus:outline-none hover:shadow-md transition-all duration-200 flex-1 max-w-[900px] overflow-hidden"
      >
        <span className="flex-1 text-left pl-5 text-[13px] font-medium text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-300 truncate transition-colors">
          Search documents, T-codes...
        </span>
        <span className="flex items-center justify-center h-full w-[46px] bg-blue-500 group-hover:bg-blue-700 flex-shrink-0 transition-colors">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
      </button>

      <div className="flex-1" />
           <div className="flex-1" />
            <div className="flex items-center gap-2 ">
        <button className="relative w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#232F40] text-slate-500 dark:text-slate-400">
          {ICONS.bell}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            3
          </span>
        </button>
      </div>
      <div className="hidden sm:flex items-center gap-[8px] pl-2 pr-4 py-1.5 mr-10 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#232F40]">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ring-2 ring-white/10">
          {getInitials(displayName)}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">
            {displayName}
          </span>
          {displayRole && (
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
              {displayRole}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

export function TenantLayout({
  activePage,
  onNavigate,
  onLogout,
  title,
  children,
  user,
  onTCodeSearch,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-screen bg-slate-100 dark:bg-[#0F1623] transition-colors overflow-hidden">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        user={user}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          onTCodeSearch={onTCodeSearch}
          user={user}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-5">{children}</main>
      </div>
    </div>
  );
}
