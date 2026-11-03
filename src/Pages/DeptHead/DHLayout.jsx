import { useEffect, useState } from "react";
import { useTheme } from "../SuperAdmin/Superadmincontext";
import { getAIAssistantNavItems } from "../../features/aiAssistant/nav";
import { ApprovalActionApi } from "../../features/approvalEngine/api";
import { useTenantModules } from "../../context/TenantModuleContext";
import { filterNavigationItems } from "../../utils/tenantModuleMapping";
import NotificationBell from "../../components/subscription/NotificationBell";
import { API_BASE_URL } from "../../services/apiClient";
import logo from "../../assets/evault-logo-light.png";
import {
  LayoutDashboard,
  FileText,
  Clock,
  FileCheck,
  FileX,
  GitBranch,
  UserCheck,
  BarChart3,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  Users,
  ChevronDown,
  ChevronRight,
  Menu,
  Search,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */
const S = 19;
const ICONS = {
  dashboard: <LayoutDashboard size={S} />,
  docs: <FileText size={S} />,
  pending: <Clock size={S} />,
  approved: <FileCheck size={S} />,
  rejected: <FileX size={S} />,
  workflow: <GitBranch size={S} />,
  delegation: <UserCheck size={S} />,
  reports: <BarChart3 size={S} />,
  logs: <ClipboardList size={S} />,
  shield: <ShieldCheck size={S} />,
  aiAssistant: <Sparkles size={S} />,
  communication: <MessageSquare size={S} />,
  dept: <Users size={S} />,
  logout: <LogOut size={S} />,
};

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
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

const roleLabel = (r) =>
  !r || r === "DeptHead" ? "Department Head" : String(r);

/* ------------------------------------------------------------------ */
/* Navigation config                                                   */
/* page keys: parent router me map karne hain                          */
/* ------------------------------------------------------------------ */
const NAV_DOCS = [
  { key: "documents", label: "My Documents", icon: "docs" },
  { key: "approvals", label: "Pending Approvals", icon: "pending", badge: true },
  { key: "approvedDocuments", label: "Approved Documents", icon: "approved" },
  { key: "rejectedDocuments", label: "Rejected Documents", icon: "rejected" },
];
const NAV_WORKFLOW = [
  { key: "approvalWorkflow", label: "Approval Workflow", icon: "workflow" },
  { key: "delegation", label: "Delegation", icon: "delegation" },
];
const NAV_REPORTS = [
  { key: "reports", label: "Department Reports", icon: "reports" },
  { key: "activityLogs", label: "Activity Logs", icon: "logs" },
];
const NAV_AI = getAIAssistantNavItems("DeptHead").map((item) => ({
  key: item.key,
  label: item.label,
  icon: "aiAssistant",
}));

// sirf yeh keys tenant-module filter se guzrengi
const MODULE_KEYS = new Set(["documents", "approvals"]);
const filterDocs = (items, isVisible) => {
  const ok = new Set(
    filterNavigationItems(
      items.filter((i) => MODULE_KEYS.has(i.key)),
      isVisible,
    ).map((i) => i.key),
  );
  return items.filter((i) => !MODULE_KEYS.has(i.key) || ok.has(i.key));
};

/* ------------------------------------------------------------------ */
/* Sidebar pieces                                                      */
/* ------------------------------------------------------------------ */
const TONES = {
  red: "bg-red-500 text-white",
  green: "bg-emerald-500 text-white",
  blue: "bg-blue-500 text-white",
  purple: "bg-violet-600 text-white",
};

function Row({
  icon,
  label,
  active,
  badge,
  tone = "blue",
  onClick,
  sub,
  chevron,
  open,
  collapsed,
}) {
  const hasBadge = badge !== null && badge !== undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group flex w-full items-center gap-3 rounded-xl text-left font-medium transition-all duration-150 ${
        sub ? "py-2 pl-3 pr-2 text-[13.5px]" : "py-3 text-[15px]"
      } ${collapsed ? "justify-center px-0" : sub ? "" : "px-3.5"} ${
        active
          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-950/40"
          : "text-white/75 hover:bg-white/[0.07] hover:text-white"
      }`}
    >
      <span className="relative flex w-5 shrink-0 justify-center">
        {icon}
        {collapsed && badge ? (
          <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#08183a]" />
        ) : null}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {hasBadge ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold leading-none ${TONES[tone]}`}
            >
              {badge}
            </span>
          ) : null}
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
  badge,
  tone,
  itemBadges = {},
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
        badge={isOpen ? null : badge}
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
                  badge={item.badge ? (itemBadges[item.key] ?? 0) : null}
                  tone="green"
                  onClick={() => {
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

function DeptCard({ active, collapsed, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? "My Department" : undefined}
      className={`flex w-full items-center rounded-xl border text-left transition ${
        collapsed ? "justify-center p-2.5" : "gap-3 p-3"
      } ${
        active
          ? "border-emerald-400/60 bg-emerald-500/20"
          : "border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
        {ICONS.dept}
      </span>
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-semibold leading-tight text-emerald-300">
              My Department
            </span>
            <span className="mt-0.5 block truncate text-[11.5px] text-white/60">
              View team activity & stats
            </span>
          </span>
          <ChevronRight size={16} className="shrink-0 text-emerald-300" />
        </>
      )}
    </button>
  );
}

function Sidebar({
  activePage,
  onNavigate,
  onLogout,
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
  pendingApprovalsCount,
}) {
  const { isModuleVisible } = useTenantModules();
  const { dark, setDark } = useTheme();

  const groups = {
    docs: filterDocs(NAV_DOCS, isModuleVisible),
    workflow: NAV_WORKFLOW,
    reports: NAV_REPORTS,
    ai: filterNavigationItems(NAV_AI, isModuleVisible),
  };

  const [openSections, setOpenSections] = useState({
    docs: true,
    workflow: false,
    reports: false,
    ai: false,
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

  const go = (key) => {
    onNavigate(key);
    onMobileClose?.();
  };

  const single = (key, label, icon) => (
    <Row
      icon={ICONS[icon]}
      label={label}
      active={activePage === key}
      collapsed={collapsed}
      onClick={() => go(key)}
    />
  );

  const groupProps = (k) => ({
    activePage,
    onNavigate,
    onMobileClose,
    isOpen: openSections[k],
    onToggle: () => toggleSection(k),
    collapsed,
    onExpand: () => {
      onToggleCollapse();
      setOpenSections((p) => ({ ...p, [k]: true }));
    },
  });

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

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

          {groups.docs.length > 0 && (
            <Group
              title="Documents"
              icon="docs"
              items={groups.docs}
              badge={pendingApprovalsCount || null}
              tone="red"
              itemBadges={{ approvals: pendingApprovalsCount }}
              {...groupProps("docs")}
            />
          )}

          <Group
            title="Workflow"
            icon="workflow"
            items={groups.workflow}
            {...groupProps("workflow")}
          />

          <Group
            title="Reports"
            icon="reports"
            items={groups.reports}
            {...groupProps("reports")}
          />

          <div className="my-2 border-t border-white/[0.07]" />

          {single("crossDepartmentRequest", "Cross Department Access", "shield")}

          {groups.ai.length > 0 && (
            <Group
              title="AI Assistant"
              icon="aiAssistant"
              items={groups.ai}
              badge="New"
              tone="purple"
              {...groupProps("ai")}
            />
          )}

          {single("communication", "Communication", "communication")}

          <div className="pt-3">
            <DeptCard
              active={activePage === "department"}
              collapsed={collapsed}
              onClick={() => go("department")}
            />
          </div>
        </nav>

        {/* Footer: logout + theme */}
        <div className="flex items-center gap-2 border-t border-white/[0.07] p-3">
          <div className="flex-1">
            <Row
              icon={ICONS.logout}
              label="Logout"
              collapsed={collapsed}
              onClick={() => onLogout?.()}
            />
          </div>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              aria-label="Toggle theme"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/[0.07] hover:text-white"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Topbar                                                              */
/* ------------------------------------------------------------------ */
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
          /* ignore — falls back to email/role below */
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
    profile?.name ||
    user?.name ||
    user?.u ||
    tokenPayload?.email?.split("@")[0] ||
    "User";
  const displayRole = roleLabel(profile?.role || tokenPayload?.role);

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
      {onTCodeSearch && (
        <button
          type="button"
          onClick={onTCodeSearch}
          aria-label="Search documents"
          className="flex h-11 min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-white pl-3.5 text-left shadow-sm transition hover:border-blue-300 dark:border-slate-600 dark:bg-slate-800/70 xl:max-w-[1000px]"
        >
          <Search size={17} className="mr-3 shrink-0 text-slate-400" />
          <span className="flex-1 truncate text-[14px] text-slate-400">
            Search by name, T-code, ERP-ID, invoice no, PAN, vendor, OCR text...
          </span>
          <span className="mr-2 hidden rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 sm:block">
            Ctrl&nbsp;&nbsp;K
          </span>
          <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-r-xl bg-blue-600 text-white">
            <Search size={18} />
          </span>
        </button>
      )}

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
              <span className="max-w-[160px] truncate text-[12px] text-slate-400">
                {displayRole}
              </span>
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
export function DHLayout({
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
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  // Live pending-approvals count: mount par, phir har 15s par
  useEffect(() => {
    let cancelled = false;

    const fetchPendingCount = async () => {
      try {
        const res = await ApprovalActionApi.pending();
        if (cancelled) return;
        setPendingApprovalsCount(res?.total ?? res?.data?.length ?? 0);
      } catch {
        if (!cancelled) setPendingApprovalsCount(0);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggle}
        pendingApprovalsCount={pendingApprovalsCount}
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