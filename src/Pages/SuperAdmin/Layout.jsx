import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../services/apiClient";
import { useTheme } from "./Superadmincontext";
import { getAIAssistantNavItems } from "../../features/aiAssistant/nav";
import logoImg from "../../assets/evault-logo-light.png"; // apna actual path/filename daalo

// ── Your Logo ──────────────────────────────────────────────
// Replace "/logo.png" with the actual path to your logo file
// (put it in your public/ folder, e.g. public/logo.png)
function BrandLogo() {
  return (
    <img
      src={logoImg}
      alt="Logo"
      className="w-32 h-full object-contain p-1"
      onError={(e) => {
        e.target.style.display = "none";
      }}
    />
  );
}

// ── Nav icons (inline SVG, no external dep) ───────────────────
const ICONS = {
  dashboard: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  tenants: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  companyCodes: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="12" y2="15" />
    </svg>
  ),
  plants: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20" />
      <path d="M4 20V10l5-4v4l5-4v4l5-4v14" />
    </svg>
  ),
  odata: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  ),
  users: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  departments: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  ),
  audit: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  settings: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  billing: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  logout: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  sun: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ),
  menu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  aiAssistant: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  ),
  subscriptions: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </svg>
  ),
  plans: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.82 0l5.6-5.6a2 2 0 0 0 0-2.82Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  ),
};

// 👇 "Departments" hata diya gaya hai is list se — sidebar mein nahi dikhega
const NAV_MAIN = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "odata", label: "OData Plugins", icon: "odata" },
  { key: "users", label: "All Users", icon: "users" },
  // { key: "departments", label: "Departments", icon: "departments" }, // hidden
];

const TENANT_MGMT_CHILDREN = [
  { key: "tenantsPaid", label: "Paid Tenants" },
  { key: "tenantsFree", label: "Free Tenants" },
];

const NAV_CONFIG = [
  { key: "settings", label: "System Settings", icon: "settings" },
  { key: "billing", label: "Billing", icon: "billing" },
  { key: "subscriptions", label: "Subscriptions", icon: "subscriptions" },
  { key: "plans", label: "Plan Catalog", icon: "plans" },
];

const NAV_AI = getAIAssistantNavItems("SuperAdmin").map((item) => ({
  key: item.key,
  label: item.label,
  icon: "aiAssistant",
}));

function TenantManagementNav({ activePage, onClick }) {
  const isChildActive = TENANT_MGMT_CHILDREN.some((c) => c.key === activePage);
  const [open, setOpen] = useState(isChildActive);
  const [counts, setCounts] = useState({ paid: null, free: null });

  useEffect(() => {
    async function loadCounts() {
      try {
        const token = localStorage.getItem("accessToken") || "";
        const res = await fetch(`${API_BASE_URL}/tenants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
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
  }, []);

  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  return (
    <div className="px-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-[10px] px-3 py-[9px] my-[2px] text-[12.5px] rounded-lg transition-all duration-150 ${
          isChildActive
            ? "bg-blue-600/15 text-[#7CC0FF] shadow-[inset_2px_0_0_0_#3B82F6]"
            : "text-white/55 hover:bg-white/[0.06] hover:text-white/90"
        }`}
      >
        <span className="flex-shrink-0">{ICONS.tenants}</span>
        <span className="flex-1 text-left font-medium">Tenant Management</span>
        <span className={`text-white/35 text-[10px] transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
          ▸
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{ maxHeight: open ? "90px" : "0px" }}
      >
        {TENANT_MGMT_CHILDREN.map((child) => {
          const active = activePage === child.key;
          const count = child.key === "tenantsPaid" ? counts.paid : counts.free;
          return (
            <button
              key={child.key}
              onClick={() => onClick(child.key)}
              className={`w-full flex items-center gap-[9px] pl-[34px] pr-3 py-[7px] my-[1px] text-[11.5px] rounded-lg transition-all duration-150 ${
                active
                  ? "bg-blue-600/20 text-[#7CC0FF] font-semibold"
                  : "text-white/45 hover:bg-white/[0.06] hover:text-white/80"
              }`}
            >
              <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${active ? "bg-blue-400" : "bg-white/20"}`} />
              <span className="flex-1 text-left">{child.label}</span>
              {count !== null && (
                <span className={`text-[9px] font-bold px-[6px] py-px rounded-full ${active ? "bg-blue-500 text-white" : "bg-white/10 text-white/50"}`}>
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
export function Sidebar({ activePage, onNavigate, onLogout, mobileOpen, onMobileClose }) {
  const { dark, setDark } = useTheme();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-[2px]" onClick={onMobileClose} />
      )}

      <aside
        className={`
        fixed top-0 left-0 h-full z-40 flex flex-col
        w-[228px] bg-gradient-to-b from-[#1A2433] to-[#141C29]
        border-r border-white/[0.06]
        transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:static lg:translate-x-0 lg:flex-shrink-0
      `}
      >
        {/* Logo + theme toggle */}
        <div className="flex items-center gap-[10px] px-4 py-[14px] border-b border-white/[0.07]">
          <div className=" flex items-center justify-center flex-shrink-0 overflow-hidden">
            <BrandLogo />
          </div>

          
          

          {/* Dark/light toggle — ab logo ke bagal mein */}
          <button
            onClick={() => setDark((v) => !v)}
            className="w-8 h-8 flex-shrink-0 flex ml-5 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? ICONS.sun : ICONS.moon}
          </button>

          <button className="text-white/40 hover:text-white lg:hidden flex-shrink-0" onClick={onMobileClose}>
            {ICONS.close}
          </button>
        </div>

        {/* User */}
        <div className="flex items-center gap-[10px] px-4 py-[12px] border-b border-white/[0.07]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ring-2 ring-white/10">
            SA
          </div>
          <div className="min-w-0">
            <div className="text-white/90 text-[11.5px] font-semibold truncate">superadmin</div>
            <div className="text-white/35 text-[10px]">SuperAdmin</div>
          </div>
        </div>

        {/* Main nav */}
        <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">
          <div className="px-4 pb-[7px] text-[9.5px] font-bold text-white/30 uppercase tracking-[1px]">Main</div>

          <div className="px-2">
            {NAV_MAIN.slice(0, 2).map((item) => (
              <NavItem
                key={item.key}
                item={item}
                active={activePage === item.key}
                onClick={() => {
                  onNavigate(item.key);
                  onMobileClose?.();
                }}
              />
            ))}
          </div>

          <TenantManagementNav
            activePage={activePage}
            onClick={(key) => {
              onNavigate(key);
              onMobileClose?.();
            }}
          />

          <div className="px-2">
            {NAV_MAIN.slice(2).map((item) => (
              <NavItem
                key={item.key}
                item={item}
                active={activePage === item.key}
                onClick={() => {
                  onNavigate(item.key);
                  onMobileClose?.();
                }}
              />
            ))}
          </div>

          <div className="px-4 pt-4 pb-[7px] text-[9.5px] font-bold text-white/30 uppercase tracking-[1px]">Config</div>
          <div className="px-2">
            {NAV_CONFIG.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                active={activePage === item.key}
                onClick={() => {
                  onNavigate(item.key);
                  onMobileClose?.();
                }}
              />
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-white/[0.07] p-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-[9px] px-3 py-[9px] text-[12px] text-white/50 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all"
          >
            {ICONS.logout}
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-[10px] px-3 py-[9px] my-[2px] text-[12.5px] rounded-lg transition-all duration-150 ${
        active
          ? "bg-blue-600/15 text-[#7CC0FF] shadow-[inset_2px_0_0_0_#3B82F6] font-medium"
          : "text-white/55 hover:bg-white/[0.06] hover:text-white/90"
      }`}
    >
      <span className="flex-shrink-0">{ICONS[item.icon]}</span>
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span className={`text-[10px] font-bold px-[7px] py-px rounded-full ${active ? "bg-blue-500 text-white" : "bg-white/10 text-white/50"}`}>
          {item.badge}
        </span>
      )}
    </button>
  );
}

// ── Topbar ────────────────────────────────────────────────────
// Title, notification bell aur logout button hata diye gaye hain.
// Sirf mobile hamburger bacha hai sidebar open karne ke liye.
export function Topbar({ onMenuClick }) {
  return (
    <header className="h-[46px] bg-white dark:bg-[#1A2433] border-b border-slate-200 dark:border-slate-700 flex items-center px-4 flex-shrink-0 sticky top-0 z-20 transition-colors">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        {ICONS.menu}
      </button>
    </header>
  );
}

// ── Main Layout shell ─────────────────────────────────────────
export function Layout({ activePage, onNavigate, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-[#0F1623] transition-colors overflow-hidden">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-5 scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}