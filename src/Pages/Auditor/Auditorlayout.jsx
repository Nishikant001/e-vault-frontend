import { useState, useEffect } from "react";
import { useTheme } from "../SuperAdmin/Superadmincontext";
import { getAIAssistantNavItems } from "../../features/aiAssistant/nav";
import { useTenantModules } from "../../context/TenantModuleContext";
import { filterNavigationItems } from "../../utils/tenantModuleMapping";
import NotificationBell from "../../components/subscription/NotificationBell";
import { API_BASE_URL } from "../../services/apiClient";
import logo from "../../assets/evault-logo-light.png";

const ICONS = {
  dashboard: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  docs:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  audit:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  logout:    <svg width="15" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bell:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  sun:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  menu:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  aiAssistant: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/><circle cx="12" cy="12" r="3.2"/></svg>,
  communication: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  shield: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 3.5v6c0 5-3.4 8.7-8 10.5-4.6-1.8-8-5.5-8-10.5v-6z"/><polyline points="9 12 11 14 15 10"/></svg>,
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

const NAV_DASHBOARD = [{ key: "dashboard", label: "Dashboard", icon: "dashboard" }];
const NAV_DOCS = [{ key: "documents", label: "Documents", icon: "docs" }];
const NAV_AUDIT = [{ key: "auditlog", label: "Full Audit Log", icon: "audit" }];
const NAV_CROSS_DEPARTMENT = [{ key: "crossDepartmentRequest", label: "Cross Department Access", icon: "shield" }];
const NAV_COMMUNICATION = [{ key: "communication", label: "Communication", icon: "communication" }];

const NAV_AI = getAIAssistantNavItems("Auditor").map(item => ({ key: item.key, label: item.label, icon: "aiAssistant" }));

function NavItem({ item, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-[10px] w-[calc(100%-16px)] mx-2 my-[3px] px-3.5 py-[10px] rounded-[9px] text-[14.5px] font-medium transition-all duration-150 ${
        active
          ? "bg-gradient-to-r from-blue-500/25 to-blue-500/[0.06] text-[#6FB6FF] shadow-[inset_2.5px_0_0_0_#3B82F6]"
          : "text-white/55 hover:bg-white/[0.05] hover:text-white/90"
      }`}
    >
      <span className={`flex-shrink-0 w-[18px] flex items-center justify-center transition-colors ${active ? "text-[#6FB6FF]" : "text-white/40 group-hover:text-white/70"}`}>
        {ICONS[item.icon]}
      </span>
      <span className="flex-1 text-left truncate">{item.label}</span>
    </button>
  );
}

function NavSection({ title, icon, items, activePage, onNavigate, onMobileClose, isOpen, onToggle }) {
  if (!items.length) return null;
  const hasActive = items.some((item) => activePage === item.key);
  return (
    <div className="px-2 py-[3px]">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-[9px] px-3.5 py-[12px] rounded-[9px] text-[12.5px] font-bold uppercase tracking-[0.7px] transition-all duration-150 ${
          isOpen || hasActive ? "text-white/75 bg-white/[0.045]" : "text-white/35 hover:text-white/60 hover:bg-white/[0.03]"
        }`}
      >
        <span className="flex-shrink-0 opacity-80 w-[18px] flex items-center justify-center">{ICONS[icon]}</span>
        <span className="flex-1 text-left">{title}</span>
        <span className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 opacity-90" : "opacity-50"}`}>{ICONS.chevronDown}</span>
      </button>
      <div className="grid transition-[grid-template-rows] duration-200 ease-in-out" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <div className="mx-2 mt-[5px] mb-2 rounded-[10px] bg-white/[0.04] border border-white/[0.06] py-[5px]">
            {items.map((item) => (
              <NavItem key={item.key} item={item} active={activePage === item.key} onClick={() => { onNavigate(item.key); onMobileClose?.(); }} />
            ))}
          </div>
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
        onClick={() => { onNavigate(item.key); onMobileClose?.(); }}
        className={`w-full flex items-center gap-[9px] px-3.5 py-[12px] rounded-[9px] text-[12.5px] font-bold uppercase tracking-[0.7px] transition-all duration-150 ${
          activePage === item.key ? "text-white/75 bg-white/[0.045]" : "text-white/35 hover:text-white/60 hover:bg-white/[0.03]"
        }`}
      >
        <span className="flex-shrink-0 opacity-80 w-[18px] flex items-center justify-center">{ICONS[item.icon]}</span>
        <span className="flex-1 text-left">{item.label}</span>
      </button>
    </div>
  );
}

function Sidebar({ activePage, onNavigate, onLogout, mobileOpen, onMobileClose, user }) {
  const { isModuleVisible } = useTenantModules();
  const visible_NAV_DOCS = filterNavigationItems(NAV_DOCS, isModuleVisible);
  const visible_NAV_AI = filterNavigationItems(NAV_AI, isModuleVisible);
  const [docsOpen, setDocsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const { dark, setDark } = useTheme();

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onMobileClose} />}
      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col w-[264px] bg-[#1A2433] transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0 lg:flex-shrink-0`}>

        {/* Logo */}
        <div className="px-1 py-1 border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <img src={logo} alt="e-Vault" className="h-13.5 w-100 object-contain" />
            <button className="text-white/40 hover:text-white lg:hidden" onClick={onMobileClose}>{ICONS.close}</button>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-3 space-y-[2px] text-[13px]">
          <StandaloneNavSection item={NAV_DASHBOARD[0]} activePage={activePage} onNavigate={onNavigate} onMobileClose={onMobileClose} />

          {visible_NAV_DOCS.length > 0 && (
            <NavSection
              title="Documents"
              icon="docs"
              items={visible_NAV_DOCS}
              activePage={activePage}
              onNavigate={onNavigate}
              onMobileClose={onMobileClose}
              isOpen={docsOpen}
              onToggle={() => setDocsOpen((v) => !v)}
            />
          )}

          <div className="mt-2 mb-1 border-t border-white/[0.06]" />

          <StandaloneNavSection item={NAV_AUDIT[0]} activePage={activePage} onNavigate={onNavigate} onMobileClose={onMobileClose} />
          <StandaloneNavSection item={NAV_CROSS_DEPARTMENT[0]} activePage={activePage} onNavigate={onNavigate} onMobileClose={onMobileClose} />

          {visible_NAV_AI.length > 0 && (
            <NavSection
              title="AI Assistant"
              icon="aiAssistant"
              items={visible_NAV_AI}
              activePage={activePage}
              onNavigate={onNavigate}
              onMobileClose={onMobileClose}
              isOpen={aiOpen}
              onToggle={() => setAiOpen((v) => !v)}
            />
          )}

          <StandaloneNavSection item={NAV_COMMUNICATION[0]} activePage={activePage} onNavigate={onNavigate} onMobileClose={onMobileClose} />
        </div>

        {/* Logout */}
        <div className="border-t border-white/10 p-2">
          <div className="flex items-center gap-2">
            <button onClick={onLogout} className="flex-1 flex items-center gap-[9px] px-[14px] py-[7px] text-[12px] text-white/50 hover:text-white/80 hover:bg-white/5 rounded transition-all">
              {ICONS.logout} Logout
            </button>
            <button onClick={() => setDark((v) => !v)} className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">
              {dark ? ICONS.sun : ICONS.moon}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ onMenuClick, onTCodeSearch, user }) {
  const tokenPayload = decodeAccessToken();
  const [profile, setProfile] = useState(null);

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

  const displayName = profile?.name || user?.name || tokenPayload?.email?.split("@")[0] || "User";
  const displayRole = profile?.role || tokenPayload?.role || "Auditor";

  return (
    <header className="h-[64px] bg-white dark:bg-[#1A2433] border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-4 flex-shrink-0 sticky top-0 z-20 transition-colors">
      <button onClick={onMenuClick} className="lg:hidden text-slate-500 dark:text-slate-400 flex-shrink-0">{ICONS.menu}</button>

      {onTCodeSearch && (
        <button
          onClick={onTCodeSearch}
          className="group flex items-center ml-17 h-[42px] rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#232F40] hover:bg-gray-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:border-blue-500 focus:outline-none hover:shadow-md transition-all duration-200 flex-1 max-w-[900px] overflow-hidden"
        >
          <span className="flex-1 text-left pl-5 text-[13px] font-medium text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-300 truncate transition-colors">
            Search by name, T-code, ERP-ID, invoice no, PAN, vendor, OCR text...
          </span>
          <span className="flex items-center justify-center h-full w-[46px] bg-blue-500 group-hover:bg-blue-700 flex-shrink-0 transition-colors">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
        </button>
      )}

      <div className="flex-1" />
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <NotificationBell />
      </div>
      <div className="hidden sm:flex items-center gap-[8px] pl-2 pr-4 py-1.5 mr-10 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#232F40]">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ring-2 ring-white/10">
          {getInitials(displayName)}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">{displayName}</span>
          {displayRole && (
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate max-w-[140px]">{displayRole}</span>
          )}
        </div>
      </div>
    </header>
  );
}

export function AuditorLayout({ activePage, onNavigate, onLogout, title, children, user, onTCodeSearch }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-screen bg-slate-100 dark:bg-[#0F1623] transition-colors overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} onTCodeSearch={onTCodeSearch} user={user} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-5">{children}</main>
      </div>
    </div>
  );
}