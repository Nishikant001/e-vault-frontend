import { createContext, useContext, useEffect, useState } from "react";

// ── Theme Context ─────────────────────────────────────────────
const THEME_KEY = "dms-theme";
const ThemeCtx = createContext({ dark: false, setDark: () => {}, toggleDark: () => {} });

function getInitialDark() {
  if (typeof window === "undefined") return false;
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "dark") return true;
    if (saved === "light") return false;
  } catch {
    /* localStorage unavailable — fall back to system preference */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(getInitialDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      /* ignore persistence failures (private browsing, etc.) */
    }
  }, [dark]);

  const toggleDark = () => setDark((d) => !d);

  return (
    <ThemeCtx.Provider value={{ dark, setDark, toggleDark }}>
      <div className={dark ? "dark" : ""}>{children}</div>
    </ThemeCtx.Provider>
  );
}
export const useTheme = () => useContext(ThemeCtx);

// ── Mock Data ─────────────────────────────────────────────────
export const TENANTS = [
  { id: "T001", code: "3501", name: "Veda Hospitality",         users: 60,  docs: 1420, odata: "Connected", status: "Active",  plan: "Enterprise", amount: "₹40,000/mo", paid: true  },
  { id: "T002", code: "2501", name: "Positive Energy Pvt Ltd",  users: 45,  docs: 980,  odata: "Connected", status: "Active",  plan: "Enterprise", amount: "₹40,000/mo", paid: true  },
  { id: "T003", code: "1500", name: "Westar Galaxy Trading Pvt",users: 30,  docs: 540,  odata: "Pending",   status: "Pending", plan: "Enterprise", amount: "₹40,000/mo", paid: true  },
];

export const ALL_USERS = [
  { u: "superadmin",    av: "SA", avc: "bg-purple-600", role: "SuperAdmin",    tenant: "Veda Hospitality", status: "Active" },
  { u: "tenantadmin",   av: "TA", avc: "bg-green-700",  role: "TenantAdmin",   tenant: "Veda Hospitality", status: "Active" },
  { u: "branchmanager", av: "BM", avc: "bg-blue-600",   role: "BranchManager", tenant: "Veda Hospitality", status: "Active" },
  { u: "depthead",      av: "DH", avc: "bg-orange-600", role: "DeptHead",      tenant: "Veda Hospitality", status: "Active" },
  { u: "manager",       av: "MG", avc: "bg-amber-700",  role: "Manager",       tenant: "Veda Hospitality", status: "Active" },
  { u: "uploader",      av: "UP", avc: "bg-blue-800",   role: "Uploader",      tenant: "Veda Hospitality", status: "Active" },
  { u: "viewer",        av: "VW", avc: "bg-slate-500",  role: "Viewer",        tenant: "Veda Hospitality", status: "Active" },
  { u: "auditor",       av: "AU", avc: "bg-orange-800", role: "Auditor",       tenant: "Veda Hospitality", status: "Active" },
];

export const AUDIT_LOG = [
  { time: "10:22", user: "john.doe", tenant: "Veda",   action: "Upload",   doc: "INV-2024-01568.pdf", ip: "192.168.1.10", actionColor: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" },
  { time: "09:48", user: "priya.k",  tenant: "Veda",   action: "Approve",  doc: "INV-2024-01560.pdf", ip: "192.168.1.22", actionColor: "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400" },
  { time: "09:10", user: "manager",  tenant: "PE",     action: "Edit OCR", doc: "GRN-2024-00892.pdf", ip: "10.0.0.5",     actionColor: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400" },
  { time: "08:55", user: "uploader", tenant: "Westar", action: "Upload",   doc: "CTR-2024-00045.pdf", ip: "10.0.0.8",     actionColor: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" },
  { time: "08:30", user: "depthead", tenant: "Veda",   action: "Delete",   doc: "OLD-2023-00112.pdf", ip: "192.168.1.15", actionColor: "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400" },
  { time: "07:55", user: "viewer",   tenant: "PE",     action: "View",     doc: "PO-2024-00678.pdf",  ip: "10.0.0.9",     actionColor: "text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300" },
];

export const ODATA_CONNECTIONS = [
  { tenant: "Veda Hospitality",         endpoint: "/sap/opu/odata/sap/ZIVMS_SRV", auth: "OAuth 2.0", status: "Connected", lastSync: "2 min ago" },
  { tenant: "Positive Energy Pvt Ltd",  endpoint: "/sap/opu/odata/sap/ZIVMS_SRV", auth: "OAuth 2.0", status: "Connected", lastSync: "2 min ago" },
  { tenant: "Westar Galaxy Trading Pvt",endpoint: "/sap/opu/odata/sap/ZIVMS_SRV", auth: "OAuth 2.0", status: "Pending",   lastSync: "—" },
];

export const RECENT_ACTIVITY = [
  { msg: "Tenant Veda Hospitality activated",    time: "2 min ago" },
  { msg: "OData plugin connected for T002",      time: "15 min ago" },
  { msg: "New user: john.doe@veda",              time: "1 hr ago" },
  { msg: "Westar Galaxy — OData pending",        time: "3 hr ago" },
  { msg: "System backup completed",              time: "6 hr ago" },
];

export const SYS_CONFIG = [
  { label: "Max tenants",         value: "100" },
  { label: "Max users per tenant",value: "60" },
  { label: "OCR engine",          value: "Azure Cognitive" },
  { label: "Session timeout",     value: "8 hours" },
  { label: "File size limit",     value: "20 MB" },
];

export const NOTIF_SETTINGS = [
  { label: "Email on upload",  key: "upload",   on: true },
  { label: "Approval alerts",  key: "approval", on: true },
  { label: "Failed OCR alert", key: "ocr",      on: true },
  { label: "Daily summary",    key: "daily",    on: false },
];