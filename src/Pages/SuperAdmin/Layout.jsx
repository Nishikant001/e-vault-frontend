import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../../services/apiClient";
import { useTheme } from "./Superadmincontext";
import logoImg from "../../assets/evault-logo-light.png"; // apna actual path/filename

// ── Brand logo ────────────────────────────────────────────────
function BrandLogo() {
  return (
    <img
      src={logoImg}
      alt="e-Vault"
      className="h-10 w-auto max-w-[150px] object-contain"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

// ── Icons (inline SVG, no external dep) ───────────────────────
const Ico = ({ size = 18, sw = 1.9, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const ICONS = {
  dashboard: (
    <Ico>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Ico>
  ),
  odata: (
    <Ico>
      <path d="M9 2v6M15 2v6" />
      <path d="M6 8h12v4a6 6 0 0 1-12 0z" />
      <path d="M12 18v4" />
    </Ico>
  ),
  tenants: (
    <Ico>
      <rect x="4" y="2" width="12" height="20" rx="1.5" />
      <path d="M16 9h3a1 1 0 0 1 1 1v12h-4" />
      <path d="M8 6h4M8 10h4M8 14h4M8 18h4" />
    </Ico>
  ),
  users: (
    <Ico>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Ico>
  ),
  moduleManagement: (
    <Ico>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.27 6.96 8.73 5.05 8.73-5.05M12 22.08V12" />
    </Ico>
  ),
  settings: (
    <Ico>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Ico>
  ),
  billing: (
    <Ico>
      <rect x="1" y="4" width="22" height="16" rx="2.5" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </Ico>
  ),
  subscriptions: (
    <Ico>
      <path d="m12 2 9 4.5-9 4.5-9-4.5z" />
      <path d="m3 12 9 4.5 9-4.5" />
      <path d="m3 17.5 9 4.5 9-4.5" />
    </Ico>
  ),
  plans: (
    <Ico>
      <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.82 0l5.6-5.6a2 2 0 0 0 0-2.82Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </Ico>
  ),
  logout: (
    <Ico>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </Ico>
  ),
  moon: (
    <Ico size={17}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Ico>
  ),
  sun: (
    <Ico size={17}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </Ico>
  ),
  menu: (
    <Ico size={20}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </Ico>
  ),
  close: (
    <Ico size={20}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Ico>
  ),
  search: (
    <Ico size={17}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Ico>
  ),
  bell: (
    <Ico size={18}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Ico>
  ),
  chevron: (
    <Ico size={16} sw={2.2}>
      <polyline points="6 9 12 15 18 9" />
    </Ico>
  ),
};

// ── Nav config ────────────────────────────────────────────────
const NAV_MAIN_TOP = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "odata", label: "ERP Plugin", icon: "odata" },
];
const NAV_MAIN_BOTTOM = [
  { key: "users", label: "All Users", icon: "users" },
  { key: "moduleManagement", label: "Module Management", icon: "moduleManagement" },
];
const NAV_CONFIG = [
  { key: "settings", label: "System Settings", icon: "settings" },
  { key: "billing", label: "Billing", icon: "billing" },
  { key: "subscriptions", label: "Subscriptions", icon: "subscriptions" },
  { key: "plans", label: "Plan Catalog", icon: "plans" },
];
const TENANT_MGMT_CHILDREN = [
  { key: "tenantsPaid", label: "Paid Tenants" },
  { key: "tenantsFree", label: "Free Tenants" },
];

// ── Nav item ──────────────────────────────────────────────────
function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group relative w-full flex items-center gap-3 px-4 py-[9px] my-[2px] text-[14px] rounded-xl transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-[0_8px_20px_-8px_rgba(37,99,235,0.8)]"
          : "text-white/75 hover:bg-white/[0.07] hover:text-white"
      }`}
    >
      <span className={`flex-shrink-0 transition-transform duration-200 ${active ? "" : "group-hover:scale-110"}`}>
        {ICONS[item.icon]}
      </span>
      <span className="flex-1 text-left">{item.label}</span>
    </button>
  );
}

// ── Tenant management (expandable) ────────────────────────────
function TenantManagementNav({ activePage, onClick }) {
  const isChildActive = TENANT_MGMT_CHILDREN.some((c) => c.key === activePage);
  const [open, setOpen] = useState(isChildActive);
  const [counts, setCounts] = useState({ paid: null, free: null });

  useEffect(() => {
    let cancelled = false;
    async function loadCounts() {
      try {
        const token = localStorage.getItem("accessToken") || "";
        const res = await fetch(`${API_BASE_URL}/tenants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && !cancelled) {
          const list = data.data || [];
          setCounts({
            paid: list.filter((t) => t.tenantType === "PAID").length,
            free: list.filter((t) => t.tenantType === "FREE").length,
          });
        }
      } catch {
        /* silent */
      }
    }
    loadCounts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`group w-full flex items-center gap-3 px-4 py-[9px] my-[2px] text-[14px] rounded-xl transition-all duration-200 ${
          isChildActive
            ? "bg-white/[0.08] text-white font-semibold"
            : "text-white/75 hover:bg-white/[0.07] hover:text-white"
        }`}
      >
        <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">{ICONS.tenants}</span>
        <span className="flex-1 min-w-0 text-left whitespace-nowrap truncate">Tenant Management</span>
        <span className={`flex-shrink-0 text-white/50 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>{ICONS.chevron}</span>
      </button>

      <div
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
        style={{ maxHeight: open ? "96px" : "0px", opacity: open ? 1 : 0 }}
      >
        {TENANT_MGMT_CHILDREN.map((child) => {
          const active = activePage === child.key;
          const count = child.key === "tenantsPaid" ? counts.paid : counts.free;
          return (
            <button
              key={child.key}
              onClick={() => onClick(child.key)}
              className={`w-full flex items-center gap-[10px] pl-[46px] pr-4 py-2 my-[1px] text-[13px] rounded-lg transition-all duration-200 ${
                active ? "text-white font-semibold bg-blue-600/30" : "text-white/55 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <span className="flex-1 text-left">{child.label}</span>
              {count !== null && (
                <span className={`text-[10px] font-bold px-[7px] py-px rounded-full ${active ? "bg-blue-500 text-white" : "bg-white/10 text-white/60"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────
export function Sidebar({ activePage, onNavigate, onLogout, mobileOpen, onMobileClose, userName = "superadmin", userRole = "Super Admin" }) {
  const { dark, setDark } = useTheme();
  const go = (key) => {
    onNavigate(key);
    onMobileClose?.();
  };
  const initials = userRole
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-[2px] evault-fade" onClick={onMobileClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col overflow-hidden
          w-[272px] bg-gradient-to-b from-[#0B1F5C] via-[#081845] to-[#050F30]
          transition-transform duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:flex-shrink-0
        `}
      >
        {/* Logo + theme toggle */}
        <div className="relative z-10 flex items-center justify-between gap-2 px-5 pt-4 pb-3">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.08] text-white/80 hover:text-white hover:bg-white/[0.15] active:scale-90 transition-all"
              title={dark ? "Light mode" : "Dark mode"}
              aria-label="Toggle theme"
            >
              <span key={String(dark)} className="evault-spin-in">{dark ? ICONS.sun : ICONS.moon}</span>
            </button>
            <button className="text-white/50 hover:text-white lg:hidden" onClick={onMobileClose} aria-label="Close menu">
              {ICONS.close}
            </button>
          </div>
        </div>

        {/* User */}
        <div className="relative z-10 mx-5 flex items-center gap-3 py-3 border-y border-white/[0.08]">
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-[13px] font-bold text-white ring-2 ring-white/10">
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 w-[11px] h-[11px] rounded-full bg-green-400 border-2 border-[#081845]" />
          </div>
          <div className="min-w-0">
            <div className="text-white text-[14px] font-semibold truncate">{userName}</div>
            <div className="text-white/50 text-[12px]">{userRole}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 overflow-y-auto px-4 pt-4 pb-3 ev-noscroll">
          <div className="px-2 pb-2 text-[11px] font-semibold text-white/40 tracking-[0.08em]">MAIN</div>
          {NAV_MAIN_TOP.map((item) => (
            <NavItem key={item.key} item={item} active={activePage === item.key} onClick={() => go(item.key)} />
          ))}
          <TenantManagementNav activePage={activePage} onClick={go} />
          {NAV_MAIN_BOTTOM.map((item) => (
            <NavItem key={item.key} item={item} active={activePage === item.key} onClick={() => go(item.key)} />
          ))}

          <div className="px-2 pt-4 pb-2 text-[11px] font-semibold text-white/40 tracking-[0.08em]">CONFIG</div>
          {NAV_CONFIG.map((item) => (
            <NavItem key={item.key} item={item} active={activePage === item.key} onClick={() => go(item.key)} />
          ))}
        </nav>

        {/* Decorative wave */}
        <svg
          className="absolute bottom-0 left-0 w-[200%] h-[150px] pointer-events-none evault-wave"
          viewBox="0 0 800 150"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="evWave" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 70 C 100 20, 200 20, 300 70 S 500 120, 600 70 S 750 30, 800 60 L800 150 L0 150 Z" fill="url(#evWave)" />
        </svg>

        {/* Logout */}
        <div className="relative z-10 mx-5 mb-3 pt-2 border-t border-white/[0.08]">
          <button
            onClick={onLogout}
            className="group w-full flex items-center gap-3 px-3 py-[10px] text-[14px] text-white/75 hover:text-white hover:bg-white/[0.07] rounded-xl transition-all"
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-0.5">{ICONS.logout}</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Topbar ────────────────────────────────────────────────────
export function Topbar({
  onMenuClick,
  onLogout,
  userName = "superadmin",
  userRole = "Super Admin",
  notificationCount = 0, // backend se count pass karo; 0 hone par badge hide
  onSearch,
}) {
  const { dark, setDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  // Ctrl/Cmd + K => search focus
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // outside click => dropdown close
  useEffect(() => {
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const initials = userRole
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-[72px] bg-white/90 dark:bg-[#0F1A33]/90 backdrop-blur border-b border-slate-200/70 dark:border-white/[0.06] flex items-center gap-4 px-4 lg:px-6 flex-shrink-0 sticky top-0 z-20 transition-colors">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        aria-label="Open menu"
      >
        {ICONS.menu}
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-[700px] group">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
          {ICONS.search}
        </span>
        <input
          ref={searchRef}
          type="text"
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder="Search by tenant, user, DMS code, document, module..."
          className="w-full h-11 pl-11 pr-20 rounded-full text-[13.5px] bg-white dark:bg-[#16223F] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
        <kbd className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0F1A33] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-[3px]">
          Ctrl K
        </kbd>
      </div>

      <div className="flex-1" />

      {/* Theme */}
      <button
        onClick={() => setDark((v) => !v)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.12] active:scale-90 transition-all"
        aria-label="Toggle theme"
      >
        <span key={String(dark)} className="evault-spin-in">{dark ? ICONS.sun : ICONS.moon}</span>
      </button>

      {/* Bell */}
      <button
        className="relative w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.12] active:scale-90 transition-all"
        aria-label="Notifications"
      >
        {ICONS.bell}
        {notificationCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center evault-pop">
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        )}
      </button>

      {/* Profile dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-[12px] font-bold text-white">
            {initials}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <div className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">{userName}</div>
            <div className="text-[12px] text-slate-500 dark:text-slate-400">{userRole}</div>
          </div>
          <span className={`hidden md:block text-slate-500 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}>
            {ICONS.chevron}
          </span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#16223F] border border-slate-200 dark:border-white/10 shadow-xl p-1.5 evault-dropdown">
            <button
              onClick={() => {
                setMenuOpen(false);
                onLogout?.();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors"
            >
              {ICONS.logout}
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ── Layout shell ──────────────────────────────────────────────
export function Layout({ activePage, onNavigate, onLogout, notificationCount, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F3F6FC] dark:bg-[#0A1224] transition-colors overflow-hidden">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} onLogout={onLogout} notificationCount={notificationCount} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
          {/* key => page change par soft transition */}
          <div key={activePage} className="evault-page">
            {children}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes evPage { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes evFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes evWave { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes evPop { 0% { transform: scale(0); } 70% { transform: scale(1.25); } 100% { transform: scale(1); } }
        @keyframes evDrop { from { opacity: 0; transform: translateY(-6px) scale(0.97); } to { opacity: 1; transform: none; } }
        @keyframes evSpinIn { from { opacity: 0; transform: rotate(-90deg) scale(0.6); } to { opacity: 1; transform: none; } }
        .ev-noscroll { scrollbar-width: none; -ms-overflow-style: none; }
        .ev-noscroll::-webkit-scrollbar { display: none; }
        .evault-page { animation: evPage 0.35s ease-out both; }
        .evault-fade { animation: evFade 0.2s ease-out both; }
        .evault-wave { animation: evWave 18s linear infinite; }
        .evault-pop { animation: evPop 0.4s cubic-bezier(.2,.9,.3,1.3) both; }
        .evault-dropdown { animation: evDrop 0.16s ease-out both; transform-origin: top right; }
        .evault-spin-in { display: inline-flex; animation: evSpinIn 0.3s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .evault-page, .evault-fade, .evault-wave, .evault-pop, .evault-dropdown, .evault-spin-in { animation: none !important; }
        }
      `}</style>
    </div>
  );
}