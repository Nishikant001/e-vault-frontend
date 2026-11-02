import { useState, useEffect } from "react";
import { useTheme } from "../SuperAdmin/Superadmincontext";
import { useSubscription } from "../../context/SubscriptionContext";
import { useTenantCapabilities } from "../../context/MetadataContext";
import { getAIAssistantNavItems } from "../../features/aiAssistant/nav";
import logo from "../../assets/evault-logo-light.png";
import {
  LayoutDashboard,
  Building2,
  Building,
  Factory,
  Folder,
  Users,
  UserCog,
  FileText,
  LayoutTemplate,
  ClipboardCheck,
  GitBranch,
  Inbox,
  ShieldCheck,
  Clock,
  Sparkles,
  MessageSquare,
  BarChart3,
  Settings,
  Settings2,
  PlugZap,
  Database,
  RefreshCw,
  History,
  RotateCw,
  ScrollText,
  Wrench,
  ChevronDown,
  Menu,
  X,
  Search,
  Sun,
  Moon,
  LogOut,
  AlertTriangle,
  HardDrive,
} from "lucide-react";
import NotificationBell from "../../components/subscription/NotificationBell";
import { API_BASE_URL } from "../../services/apiClient";
import { useTenantModules } from "../../context/TenantModuleContext";
import { filterNavigationItems } from "../../utils/tenantModuleMapping";
import { ApprovalActionApi } from "../../features/approvalEngine/api";
import { getDocumentAccessRequests } from "../../features/crossDepartmentDocument/api";
import { useTenantStorage, formatBytes } from "../../hooks/useTenantStorage";
/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */
const S = 19;
const ICONS = {
  dashboard: <LayoutDashboard size={S} />,
  organization: <Building2 size={S} />,
  docs: <FileText size={S} />,
  inbox: <Inbox size={S} />,
  shield: <ShieldCheck size={S} />,
  audit: <Clock size={S} />,
  aiAssistant: <Sparkles size={S} />,
  communication: <MessageSquare size={S} />,
  reports: <BarChart3 size={S} />,
  settings: <Settings size={S} />,
  companyCode: <Building size={S} />,
  plant: <Factory size={S} />,
  folder: <Folder size={S} />,
  users: <Users size={S} />,
  userAssign: <UserCog size={S} />,
  metadataTemplate: <LayoutTemplate size={S} />,
  approvalCheck: <ClipboardCheck size={S} />,
  workflow: <GitBranch size={S} />,
  erpConfiguration: <Settings2 size={S} />,
  sapSync: <PlugZap size={S} />,
  masterData: <Database size={S} />,
  syncDocs: <RefreshCw size={S} />,
  jobHistory: <History size={S} />,
  retryQueue: <RotateCw size={S} />,
  logViewer: <ScrollText size={S} />,
  syncSettings: <Wrench size={S} />,
};

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Navigation config                                                   */
/* ------------------------------------------------------------------ */
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
  { key: "ocrSettings", label: "OCR Settings", icon: "metadataTemplate" },
  { key: "approvalWorkflows", label: "Approval Config", icon: "approvalCheck" },
  { key: "workflow", label: "Upload & Manage", icon: "workflow" },
  { key: "documents", label: "Document Repository", icon: "docs" },
];

const NAV_SAP_SYNC = [
  {
    key: "ERP_INTEGRATION",
    label: "All ERP Connections",
    icon: "erpConfiguration",
  },
  { key: "SAP_SYNC_DASHBOARD", label: "ERP Connectivity", icon: "sapSync" },
  { key: "SAP_SYNC_MASTERS", label: "Masterdata Sync", icon: "masterData" },
  { key: "SAP_SYNC_DOCUMENTS", label: "Data Sync", icon: "syncDocs" },
  {
    key: "SAP_SYNC_JOB_HISTORY",
    label: "Execution History",
    icon: "jobHistory",
  },
  { key: "SAP_SYNC_RETRY_QUEUE", label: "Retry Queue", icon: "retryQueue" },
  { key: "SAP_SYNC_LOG_VIEWER", label: "Audit Trail", icon: "logViewer" },
  { key: "SAP_SYNC_SETTINGS", label: "Configuration", icon: "syncSettings" },
];

/* DEMO — placeholder pages for the new "Reports" group (add routes in App.jsx) */

/* DEMO — placeholder pages for "Settings" group (add routes in App.jsx) */
const NAV_SETTINGS = [
  { key: "ocrSettings", label: "OCR Settings", icon: "metadataTemplate" },
  { key: "subscription", label: "Subscription", icon: "settings" },
];

/* DEMO — sidebar badge counts (hardcoded; connect to real counts later) */

const NAV_AI = getAIAssistantNavItems("TenantAdmin").map((item) => ({
  key: item.key,
  label: item.label,
  icon: "aiAssistant",
}));

/* ------------------------------------------------------------------ */
/* Sidebar pieces                                                      */
/* ------------------------------------------------------------------ */
const TONES = {
  red: "bg-red-500 text-white",
  blue: "bg-blue-500 text-white",
  purple: "bg-violet-600 text-white",
};

function Row({
  icon,
  label,
  active,
  badge,
  tone = "blue",
  locked,
  onClick,
  sub,
  chevron,
  open,
  collapsed,
  title,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : title}
      aria-disabled={locked}
      className={`group flex w-full items-center gap-3 rounded-xl text-left font-medium transition-all duration-150 ${
        sub ? "py-2 pl-3 pr-2 text-[13.5px]" : "py-3 text-[15px]"
      } ${collapsed ? "justify-center px-0" : sub ? "" : "px-3.5"} ${
        active
          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-950/40"
          : locked
            ? "text-white/30 hover:bg-white/5 hover:text-amber-300/80"
            : "text-white/75 hover:bg-white/[0.07] hover:text-white"
      }`}
    >
      <span className="flex w-5 shrink-0 justify-center">{icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate">
            {label}
            {locked && (
              <span className="ml-1 font-bold text-amber-400/90">*</span>
            )}
          </span>
          {badge && !locked && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold leading-none ${TONES[tone]}`}
            >
              {badge}
            </span>
          )}
          {chevron && (
            <ChevronDown
              size={16}
              className={`shrink-0 text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          )}
        </>
      )}
    </button>
  );
}

function Group({
  title,
  icon,
  items,
  activePage,
  onNavigate,
  onMobileClose,
  isOpen,
  onToggle,
  onLockedClick,
  badge,
  tone,
  collapsed,
  onExpand,
}) {
  const hasActive = items.some((i) => i.key === activePage);
  return (
    <div>
      <Row
        icon={ICONS[icon]}
        label={title}
        chevron
        open={isOpen}
        badge={badge}
        tone={tone}
        collapsed={collapsed}
        active={!isOpen && hasActive}
        onClick={() => (collapsed ? onExpand() : onToggle())}
      />
      {!collapsed && (
        <div
          className="grid transition-[grid-template-rows] duration-200 ease-in-out"
          style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="ml-[22px] mt-1 space-y-0.5 border-l border-white/10 pl-2">
              {items.map((item) => (
                <Row
                  key={item.key}
                  sub
                  icon={ICONS[item.icon]}
                  label={item.label}
                  active={activePage === item.key}
                  locked={item.lock}
                  title={
                    item.lock
                      ? "Premium feature — click to upgrade your plan"
                      : undefined
                  }
                  onClick={() => {
                    if (item.lock) return onLockedClick?.();
                    onNavigate(item.key);
                    onMobileClose?.();
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
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
        className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1A2433] p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
          <span className="text-2xl font-bold text-amber-400">*</span>
        </div>
        <h3 className="mb-2 text-[15px] font-bold text-white">
          Premium Feature
        </h3>
        <p className="mb-5 text-[13px] leading-relaxed text-white/60">
          This feature isn't included in your current plan. Please subscribe to
          a paid plan to unlock it.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-[12px] font-semibold text-white/70 hover:bg-white/5 hover:text-white/90"
          >
            Maybe Later
          </button>
          <button
            onClick={onUpgrade}
            className="rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-blue-700"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}

function StorageCard({ used, quota, percent, onManage }) {
  const c = 2 * Math.PI * 26;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 backdrop-blur">
      <div className="flex items-center gap-3.5">
        <div className="relative h-[66px] w-[66px] shrink-0">
          <svg viewBox="0 0 64 64" className="-rotate-90">
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(percent / 100) * c} ${c}`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-white">
            {percent}%
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-[12.5px] text-white/60">Storage Usage</div>
          <div className="text-[15px] font-bold text-white">
            {formatBytes(used)} / {formatBytes(quota)}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onManage}
        className="mt-2 block w-full text-right text-[13px] font-semibold text-blue-400 hover:text-blue-300"
      >
        Manage
      </button>
    </div>
  );
}

function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
}) {
  const { isModuleVisible } = useTenantModules();
  const { isFree } = useSubscription();
  const { erpEnabled } = useTenantCapabilities();
  const storage = useTenantStorage();
  const [counts, setCounts] = useState({ inbox: 0, access: 0 });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [a, c] = await Promise.allSettled([
        isModuleVisible("approval_engine")
          ? ApprovalActionApi.pending()
          : Promise.resolve(null),
        isModuleVisible("cross_department")
          ? getDocumentAccessRequests({ status: "PENDING" })
          : Promise.resolve(null),
      ]);
      if (!alive) return;
      setCounts({
        inbox: a.value?.total ?? a.value?.data?.length ?? 0,
        access: c.value?.data?.length ?? 0,
      });
    };
    load();
    const t = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const visibleDocs = filterNavigationItems(NAV_DOCS, isModuleVisible);
  const visibleAI = filterNavigationItems(NAV_AI, isModuleVisible);
  const visibleSap = filterNavigationItems(NAV_SAP_SYNC, isModuleVisible);

  // ERP items: shown for FREE (locked) or PAID+ERP tenants — same rule as before.
  const erpItems =
    visibleSap.length > 0 && (isFree || erpEnabled)
      ? visibleSap.map((i) => ({ ...i, lock: isFree }))
      : [];
  const settingsItems = [...erpItems, ...NAV_SETTINGS];
  const aiItems = visibleAI.map((i) => ({ ...i, lock: isFree }));

  const groups = {
    admin: NAV_ADMIN,
    docs: visibleDocs,
    ai: aiItems,
    settings: settingsItems,
  };

  const [openSections, setOpenSections] = useState({
    admin: false,
    docs: false,
    ai: false,
    reports: false,
    settings: false,
  });
  const toggleSection = (k) => setOpenSections((p) => ({ ...p, [k]: !p[k] }));

  // auto-open the group that contains the active page
  useEffect(() => {
    const found = Object.entries(groups).find(([, items]) =>
      items.some((i) => i.key === activePage),
    );
    if (found)
      setOpenSections((p) => (p[found[0]] ? p : { ...p, [found[0]]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  const [plantLeaveDialogOpen, setPlantLeaveDialogOpen] = useState(false);
  const [pendingPage, setPendingPage] = useState(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const handlePageNavigate = (next) => {
    if (activePage === "plants" && next !== "plants") {
      setPendingPage(next);
      setPlantLeaveDialogOpen(true);
      return;
    }
    onNavigate(next);
  };
  const cancelPlantLeave = () => {
    setPlantLeaveDialogOpen(false);
    setPendingPage(null);
  };
  const confirmPlantLeave = () => {
    const dest = pendingPage;
    setPlantLeaveDialogOpen(false);
    setPendingPage(null);
    if (dest) onNavigate(dest);
  };

  const single = (key, label, icon, extra = {}) => (
    <Row
      icon={ICONS[icon]}
      label={label}
      active={activePage === key}
      collapsed={collapsed}
      onClick={() => {
        handlePageNavigate(key);
        onMobileClose?.();
      }}
      {...extra}
    />
  );
  const groupProps = (k) => ({
    activePage,
    onNavigate: handlePageNavigate,
    onMobileClose,
    isOpen: openSections[k],
    onToggle: () => toggleSection(k),
    onLockedClick: () => setUpgradeModalOpen(true),
    collapsed,
    onExpand: () => {
      onToggleCollapse();
      setOpenSections((p) => ({ ...p, [k]: true }));
    },
  });

  return (
    <>
      {plantLeaveDialogOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[5px]"
          role="presentation"
          onMouseDown={(e) =>
            e.target === e.currentTarget && cancelPlantLeave()
          }
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="plant-leave-title"
            className="w-full max-w-[560px] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-900/70 dark:bg-orange-950/50 dark:text-orange-300">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                      Unsaved workflow check
                    </p>
                    <h2
                      id="plant-leave-title"
                      className="text-lg font-bold text-slate-900 dark:text-white"
                    >
                      Leave plant configuration?
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cancelPlantLeave}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Before moving to another page, make sure the required
                departments are properly managed for the selected plant.
              </p>
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-3 dark:border-slate-700 dark:bg-slate-800/70">
                <Building2 className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-300" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    Quick reminder
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Incomplete department mapping can affect document routing
                    and plant-level configuration.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelPlantLeave}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={confirmPlantLeave}
                  className="min-h-11 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Continue
                </button>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
          </section>
        </div>
      )}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
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

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full flex-col bg-gradient-to-b from-[#06122b] via-[#08183a] to-[#0a2250] transition-all duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-[84px]" : "w-[272px]"} lg:static lg:translate-x-0 lg:flex-shrink-0`}
      >
        {/* Logo + collapse toggle */}
        <div
          className={`relative flex h-[84px] items-center border-b border-white/[0.07] ${collapsed ? "justify-center" : "px-3"}`}
        >
          {!collapsed && (
            <img
              src={logo}
              alt="e-Vault"
              className="h-14 max-w-[190px] object-contain object-left"
            />
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Toggle sidebar"
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-slate-400/30 text-white/90 transition hover:bg-slate-400/50 ${collapsed ? "" : "absolute right-3"}`}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {single("dashboard", "Dashboard", "dashboard")}

          <Group
            title="Organization"
            icon="organization"
            items={groups.admin}
            {...groupProps("admin")}
          />

          {visibleDocs.length > 0 && (
            <Group
              title="Document Config"
              icon="docs"
              items={groups.docs}
              {...groupProps("docs")}
            />
          )}

          {isModuleVisible("approval_engine") &&
            single("approvals", "Inbox", "inbox", {
              badge: counts.inbox || null,
              tone: "red",
            })}
          {isModuleVisible("cross_department") &&
            single("crossDepartmentRequest", "Access Requests", "shield", {
              badge: counts.access || null,
              tone: "blue",
            })}
          {isModuleVisible("audit") && single("audit", "Audit Log", "audit")}

          {aiItems.length > 0 && (
            <Group
              title="AI Assistant"
              icon="aiAssistant"
              items={groups.ai}
              badge="New"
              tone="purple"
              {...groupProps("ai")}
            />
          )}

          {isModuleVisible("communication") &&
            single("communication", "Chat Center", "communication")}

          <Group
            title="Settings"
            icon="settings"
            items={groups.settings}
            {...groupProps("settings")}
          />
        </nav>

        {/* Storage card */}
        <div className="border-t border-white/[0.07] p-3">
          {isFree && !collapsed && (
            <div className="px-1 pb-2 text-[10px] leading-snug text-amber-400/80">
              <span className="font-bold">*</span> Premium feature — upgrade to
              unlock
            </div>
          )}
          {collapsed ? (
            <button
              type="button"
              onClick={() => onNavigate("subscription")}
              title={`Storage ${storage.percent}%`}
              className="flex w-full justify-center rounded-xl py-2 text-cyan-300 hover:bg-white/5"
            >
              <HardDrive size={20} />
            </button>
          ) : (
            <StorageCard
              used={storage.usedBytes}
              quota={storage.quotaBytes}
              percent={storage.percent}
              onManage={() => onNavigate("subscription")}
            />
          )}
        </div>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Topbar                                                              */
/* ------------------------------------------------------------------ */
function decodeAccessToken() {
  try {
    const t = localStorage.getItem("accessToken");
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1]));
  } catch {
    return null;
  }
}

function Topbar({ onMenuClick, onTCodeSearch, onLogout, user }) {
  const { dark, setDark } = useTheme();
  const tokenPayload = decodeAccessToken();
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    async function loadProfile() {
      try {
        const res = await fetch(`${API_BASE_URL}/users/profile`, { headers });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setProfile(data.data);
          return;
        }
        throw new Error("no /users/profile");
      } catch {
        try {
          const res = await fetch(`${API_BASE_URL}/users`, { headers });
          const data = await res.json();
          if (
            res.ok &&
            data.success &&
            Array.isArray(data.data) &&
            tokenPayload?.id
          ) {
            const match = data.data.find((u) => u.id === tokenPayload.id);
            if (match) setProfile(match);
          }
        } catch {
          /* ignore */
        }
      }
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ctrl/Cmd + K opens search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onTCodeSearch?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onTCodeSearch]);

  const displayName =
    profile?.name || user?.u || tokenPayload?.email?.split("@")[0] || "User";
  const displayRole = profile?.role || tokenPayload?.role || "";

  return (
    <header className="sticky top-0 z-20 flex h-[76px] flex-shrink-0 items-center gap-4 border-b border-slate-200/70 bg-white px-4 transition-colors dark:border-slate-700 dark:bg-[#1A2433] lg:px-6">
      <button
        onClick={onMenuClick}
        className="flex-shrink-0 text-slate-500 dark:text-slate-400 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Search */}
      <button
        type="button"
        onClick={onTCodeSearch}
        aria-label="Search documents"
        className="flex h-11 min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-white pl-3.5 text-left shadow-sm transition hover:border-blue-300 dark:border-slate-600 dark:bg-slate-800/70 xl:max-w-[1000px]"
      >
        <Search size={17} className="mr-3 shrink-0 text-slate-400" />
        <span className="flex-1 truncate text-[14px] text-slate-400">
          Search by name, DMS-CODE, ERP-ID, invoice no, PAN, vendor, OCR text...
        </span>
        <span className="mr-2 hidden rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 sm:block">
          Ctrl&nbsp;&nbsp;K
        </span>
        <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-r-xl bg-blue-600 text-white">
          <Search size={18} />
        </span>
      </button>

      <div className="flex-1 max-xl:hidden" />

      <div className="flex items-center gap-3">
        <button
          onClick={() => setDark((v) => !v)}
          aria-label="Toggle theme"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
          <NotificationBell />
        </div>

        <span className="hidden h-8 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-[13px] font-bold text-white ring-2 ring-emerald-100 dark:ring-white/10">
              {getInitials(displayName)}
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="max-w-[160px] truncate text-[14px] font-semibold text-slate-800 dark:text-slate-100">
                {displayName}
              </span>
              {displayRole && (
                <span className="max-w-[160px] truncate text-[12px] text-slate-400">
                  {displayRole}
                </span>
              )}
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-[calc(100%+6px)] z-40 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-[#1A2433]">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout?.();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */
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
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024)
      setMobileOpen(false);
    else setCollapsed((v) => !v);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F2F6FC] transition-colors dark:bg-[#0F1623]">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggle}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          onTCodeSearch={onTCodeSearch}
          onLogout={onLogout}
          user={user}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-5">{children}</main>
      </div>
    </div>
  );
}
