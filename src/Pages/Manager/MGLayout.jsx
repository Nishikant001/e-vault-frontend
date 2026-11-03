import { useEffect, useState } from "react";
import { useTheme } from "../SuperAdmin/Superadmincontext";
import { getAIAssistantNavItems } from "../../features/aiAssistant/nav";
import { useTenantModules } from "../../context/TenantModuleContext";
import { filterNavigationItems } from "../../utils/tenantModuleMapping";
import NotificationBell from "../../components/subscription/NotificationBell";
import { API_BASE_URL } from "../../services/apiClient";
import logo from "../../assets/evault-logo-light.png";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Layers,
  ShieldCheck,
  Hourglass,
  CheckCircle2,
  XCircle,
  MessageCircle,
  ChevronDown,
  Menu,
  Search,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Scoped animations                                                   */
/* ------------------------------------------------------------------ */
const CSS = `
@keyframes mg-wave-a{0%,100%{transform:translateX(0)}50%{transform:translateX(-40px)}}
@keyframes mg-wave-b{0%,100%{transform:translateX(0)}50%{transform:translateX(30px)}}
@keyframes mg-nav-in{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes mg-menu-in{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
.mg-wave-a{animation:mg-wave-a 9s ease-in-out infinite}
.mg-wave-b{animation:mg-wave-b 12s ease-in-out infinite}
.mg-nav-in{animation:mg-nav-in .5s cubic-bezier(.22,1,.36,1) backwards}
.mg-menu-in{animation:mg-menu-in .18s ease-out}
@media (prefers-reduced-motion:reduce){
  .mg-wave-a,.mg-wave-b,.mg-nav-in,.mg-menu-in{animation:none!important}
}
`;

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */
const S = 20;
const SS = 18;
const AiBurst = ({ size = S }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    <circle cx="12" cy="12" r="3.2" />
  </svg>
);

const ICONS = {
  dashboard: <LayoutDashboard size={S} />,
  docs: <FileText size={S} />,
  approvals: <ShieldCheck size={S} />,
  cross: <Layers size={S} />,
  ai: <AiBurst />,
  communication: <MessageCircle size={S} />,
  logout: <LogOut size={S} />,
  // sub-items
  myDocs: <FileText size={SS} />,
  upload: <Upload size={SS} />,
  repo: <Layers size={SS} />,
  pending: <Hourglass size={SS} />,
  approved: <CheckCircle2 size={SS} />,
  rejected: <XCircle size={SS} />,
  aiSub: <AiBurst size={SS} />,
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

/* ------------------------------------------------------------------ */
/* Navigation config                                                   */
/* NOTE: approvedDocuments / rejectedDocuments naye keys hain —        */
/* parent router me map karna hai.                                     */
/* ------------------------------------------------------------------ */
const NAV_DOCS = [
  { key: "documents", label: "My Documents", icon: "myDocs" },
  { key: "newdoc", label: "Upload Document", icon: "upload" },
  { key: "folders", label: "Repository", icon: "repo" },
];
const NAV_APPROVALS = [
  { key: "approvals", label: "Pending", icon: "pending" },
  { key: "approvedDocuments", label: "Approved", icon: "approved" },
  { key: "rejectedDocuments", label: "Rejected", icon: "rejected" },
];
const NAV_AI = getAIAssistantNavItems("Manager").map((item) => ({
  key: item.key,
  label: item.label,
  icon: "aiSub",
}));

// sirf purani known keys tenant-module filter se guzrengi
const MODULE_KEYS = new Set(["documents", "newdoc", "folders", "approvals"]);
const filterKnown = (items, isVisible) => {
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
function Row({ icon, label, active, onClick, sub, chevron, open, collapsed, wrap, delay = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{ animationDelay: `${delay}ms` }}
      className={`mg-nav-in group relative flex w-full items-center gap-3 rounded-xl text-left transition-all duration-200 ${
        sub
          ? "py-2.5 pl-9 pr-2 text-[14px] font-medium"
          : "py-3 text-[15.5px] font-semibold"
      } ${collapsed ? "justify-center px-0" : sub ? "" : "px-3.5"} ${
        active
          ? sub
            ? "bg-white/10 text-white"
            : "bg-gradient-to-r from-[#1D63F0] to-[#2F7BFF] text-white shadow-lg shadow-blue-950/50"
          : sub
            ? "text-white/70 hover:bg-white/[0.06] hover:text-white"
            : "text-white/90 hover:bg-white/[0.07] hover:text-white"
      }`}
    >
      {sub && !collapsed && (
        <span
          className={`absolute -left-[3px] top-1/2 h-[6px] w-[6px] -translate-y-1/2 rounded-full transition-colors ${
            active ? "bg-blue-400" : "bg-white/30 group-hover:bg-white/60"
          }`}
        />
      )}
      <span className="flex w-5 shrink-0 justify-center transition-transform duration-200 group-hover:scale-110">
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className={`flex-1 ${wrap ? "leading-snug" : "truncate"}`}>{label}</span>
          {chevron && (
            <ChevronDown
              size={16}
              className={`shrink-0 text-white/70 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            />
          )}
        </>
      )}
    </button>
  );
}

function Group({ title, icon, items, activePage, onNavigate, onMobileClose, isOpen, onToggle, collapsed, onExpand, delay }) {
  const hasActive = items.some((i) => i.key === activePage);
  return (
    <div>
      <Row
        icon={ICONS[icon]}
        label={title}
        chevron
        open={isOpen}
        collapsed={collapsed}
        delay={delay}
        active={!isOpen && hasActive}
        onClick={() => (collapsed ? onExpand() : onToggle())}
      />
      {!collapsed && (
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="ml-[30px] mt-1 space-y-0.5 border-l border-white/10 pb-1">
              {items.map((item, i) => (
                <Row
                  key={item.key}
                  sub
                  icon={ICONS[item.icon]}
                  label={item.label}
                  delay={i * 40}
                  active={activePage === item.key}
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

function Sidebar({ activePage, onNavigate, onLogout, mobileOpen, onMobileClose, collapsed, onToggleCollapse }) {
  const { isModuleVisible } = useTenantModules();

  const groups = {
    docs: filterKnown(NAV_DOCS, isModuleVisible),
    approvals: filterKnown(NAV_APPROVALS, isModuleVisible),
    ai: filterNavigationItems(NAV_AI, isModuleVisible),
  };

  const [openSections, setOpenSections] = useState({ docs: true, approvals: true, ai: false });
  const toggleSection = (k) => setOpenSections((p) => ({ ...p, [k]: !p[k] }));

  // active page wala group khud khul jaye
  useEffect(() => {
    const found = Object.entries(groups).find(([, items]) => items.some((i) => i.key === activePage));
    if (found) setOpenSections((p) => (p[found[0]] ? p : { ...p, [found[0]]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  const go = (key) => {
    onNavigate(key);
    onMobileClose?.();
  };

  const single = (key, label, icon, delay, extra = {}) => (
    <Row
      icon={ICONS[icon]}
      label={label}
      active={activePage === key}
      collapsed={collapsed}
      delay={delay}
      onClick={() => go(key)}
      {...extra}
    />
  );

  const groupProps = (k, delay) => ({
    activePage,
    onNavigate,
    onMobileClose,
    isOpen: openSections[k],
    onToggle: () => toggleSection(k),
    collapsed,
    delay,
    onExpand: () => {
      onToggleCollapse();
      setOpenSections((p) => ({ ...p, [k]: true }));
    },
  });

  return (
    <>
      <style>{CSS}</style>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onMobileClose} />}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#06122b] via-[#08183a] to-[#0a2250] transition-all duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-[84px]" : "w-[272px]"} lg:static lg:translate-x-0 lg:flex-shrink-0`}
      >
        {/* Logo + toggle */}
        <div className={`relative flex h-[84px] flex-shrink-0 items-center ${collapsed ? "justify-center" : "px-3"}`}>
          {!collapsed && <img src={logo} alt="e-Vault" className="h-14 max-w-[190px] object-contain object-left" />}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Toggle sidebar"
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-slate-400/25 text-white/90 transition hover:bg-slate-400/45 ${collapsed ? "" : "absolute right-3"}`}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
          {single("dashboard", "Dashboard", "dashboard", 0)}

          {groups.docs.length > 0 && <Group title="Documents" icon="docs" items={groups.docs} {...groupProps("docs", 60)} />}
          {groups.approvals.length > 0 && <Group title="Approvals" icon="approvals" items={groups.approvals} {...groupProps("approvals", 120)} />}

          {single("crossDepartmentRequest", "Cross Department Access", "cross", 180, { wrap: true })}

          {groups.ai.length > 0 ? (
            <Group title="AI Assistant" icon="ai" items={groups.ai} {...groupProps("ai", 240)} />
          ) : null}

          {single("communication", "Communication", "communication", 300)}
        </nav>

        {/* Decorative waves (neeche background me) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[96px]" aria-hidden="true">
          <svg className="mg-wave-a absolute bottom-0 left-0 h-full w-[115%]" viewBox="0 0 300 100" preserveAspectRatio="none">
            <path d="M0 55C50 20 110 80 170 50S260 25 300 45V100H0Z" fill="#2563EB" opacity=".35" />
          </svg>
          <svg className="mg-wave-b absolute bottom-0 left-[-10%] h-[80%] w-[120%]" viewBox="0 0 300 100" preserveAspectRatio="none">
            <path d="M0 60C60 30 120 85 180 55S260 35 300 55V100H0Z" fill="#1D4ED8" opacity=".55" />
          </svg>
        </div>

        {/* Logout — sabse neeche */}
        <div className="relative z-10 mx-5 mb-4 flex-shrink-0 border-t border-white/[0.08] pt-3">
          <button
            type="button"
            onClick={() => onLogout?.()}
            title={collapsed ? "Logout" : undefined}
            className={`group flex w-full items-center gap-3 rounded-lg py-2 text-[15.5px] font-semibold text-white/90 transition hover:text-white ${collapsed ? "justify-center" : ""}`}
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-0.5">{ICONS.logout}</span>
            {!collapsed && "Logout"}
          </button>
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

  // Ctrl/Cmd + K => search
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

  const displayName = profile?.name || user?.name || user?.u || tokenPayload?.email?.split("@")[0] || "User";
  const displayRole = profile?.role || tokenPayload?.role || "Manager";

  return (
    <header className="sticky top-0 z-20 flex h-[72px] flex-shrink-0 items-center gap-4 border-b border-slate-200/70 bg-white px-4 transition-colors dark:border-slate-700 dark:bg-[#1A2433] lg:px-6">
      <button onClick={onMenuClick} className="flex-shrink-0 text-slate-500 dark:text-slate-400 lg:hidden" aria-label="Open menu">
        <Menu size={22} />
      </button>

      {onTCodeSearch && (
        <button
          type="button"
          onClick={onTCodeSearch}
          aria-label="Search documents"
          className="group flex h-[46px] min-w-0 flex-1 items-center rounded-full border border-slate-200 bg-white pl-4 pr-2 text-left shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md dark:border-slate-600 dark:bg-slate-800/70 max-w-[950px]"
        >
          <Search size={17} className="mr-3 shrink-0 text-slate-500 transition-colors group-hover:text-blue-600" />
          <span className="flex-1 truncate text-[13.5px] text-slate-500 dark:text-slate-400">
            Search by name, T-code, ERP-ID, invoice no, PAN, vendor, OCR text...
          </span>
          <span className="hidden rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200 sm:block">
            Ctrl K
          </span>
        </button>
      )}

      <div className="ml-auto flex flex-shrink-0 items-center gap-3">
        <button
          onClick={() => setDark((v) => !v)}
          aria-label="Toggle theme"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-600 dark:bg-slate-800">
          <NotificationBell />
        </div>

        <span className="mx-1 hidden h-9 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-[13px] font-bold text-white">
              {getInitials(displayName)}
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="max-w-[160px] truncate text-[14.5px] font-bold text-slate-900 dark:text-slate-100">{displayName}</span>
              <span className="max-w-[160px] truncate text-[12.5px] text-slate-500 dark:text-slate-400">{displayRole}</span>
            </div>
            <ChevronDown size={16} className={`mx-1 text-slate-700 transition-transform duration-200 dark:text-slate-300 ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="mg-menu-in absolute right-0 top-[calc(100%+6px)] z-40 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-[#1A2433]">
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
export function MGLayout({ activePage, onNavigate, onLogout, title, children, user, onTCodeSearch }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) setMobileOpen(false);
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
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} onTCodeSearch={onTCodeSearch} onLogout={onLogout} user={user} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-5">{children}</main>
      </div>
    </div>
  );
}