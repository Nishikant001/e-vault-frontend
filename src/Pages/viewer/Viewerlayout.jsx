import { useState } from "react";
import { useTheme } from "../SuperAdmin/Superadmincontext";
import { getAIAssistantNavItems } from "../../features/aiAssistant/nav";
import { useTenantModules } from "../../context/TenantModuleContext";
import { filterNavigationItems } from "../../utils/tenantModuleMapping";
import NotificationBell from "../../components/subscription/NotificationBell";

const ICONS = {
  dashboard: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  docs:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  folder:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  logout:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bell:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  sun:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  menu:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chevronDown: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  aiAssistant: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/><circle cx="12" cy="12" r="3.2"/></svg>,
  communication: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
};

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard",           icon: "dashboard" },
  { key: "documents", label: "Documents (Read-only)",icon: "docs" },
  { key: "folders",   label: "Folders",             icon: "folder" },
  { key: "communication", label: "Communication", icon: "communication" },
];

const NAV_AI = getAIAssistantNavItems("Viewer").map(item => ({ key: item.key, label: item.label, icon: "aiAssistant" }));

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-[10px] w-[calc(100%-20px)] mx-[10px] my-[2px] px-3.5 py-[10px] rounded-[9px] text-[13px] font-medium transition-all duration-150 ${
        active
          ? "bg-gradient-to-r from-blue-500/25 to-blue-500/[0.06] text-[#6FB6FF] shadow-[inset_2.5px_0_0_0_#3B82F6]"
          : "text-white/60 hover:bg-white/[0.05] hover:text-white/90"
      }`}
    >
      <span className={`flex-shrink-0 w-[18px] flex items-center justify-center transition-colors ${active ? "text-[#6FB6FF]" : "text-white/40 group-hover:text-white/70"}`}>{ICONS[item.icon]}</span>
      <span className="flex-1 text-left">{item.label}</span>
    </button>
  );
}

function AiNavSection({ items, activePage, onNavigate, onMobileClose, isOpen, onToggle, renderItem }) {
  if (!items.length) return null;
  const hasActive = items.some((item) => activePage === item.key);
  return (
    <div className="px-2 py-[3px]">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-[9px] px-3.5 py-[10px] rounded-[9px] text-[11px] font-bold uppercase tracking-[0.9px] transition-all duration-150 ${
          isOpen || hasActive
            ? "text-white/75 bg-white/[0.045]"
            : "text-white/35 hover:text-white/60 hover:bg-white/[0.03]"
        }`}
      >
        <span className="flex-1 text-left">AI Assistant</span>
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
          <div className="mt-[3px] mb-[2px]">
            {items.map((item) => renderItem(item))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({
 activePage, onNavigate, onLogout, mobileOpen, onMobileClose, user }) {
  const { isModuleVisible } = useTenantModules();
  const visible_NAV_ITEMS = filterNavigationItems(NAV_ITEMS, isModuleVisible);
  const visible_NAV_AI = filterNavigationItems(NAV_AI, isModuleVisible);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onMobileClose} />}
      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col w-[252px] bg-[#1A2433] transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0 lg:flex-shrink-0`}>

        {/* Logo */}
        <div className="flex items-center gap-[10px] px-[18px] py-[18px] border-b border-white/[0.08]">
          <div className="w-9 h-9 bg-blue-600 rounded-[10px] flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="9" rx="1" fill="white"/>
              <rect x="11" y="2" width="7" height="5" rx="1" fill="white"/>
              <rect x="11" y="9" width="7" height="9" rx="1" fill="white"/>
              <rect x="2" y="13" width="7" height="5" rx="1" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="text-white text-[14px] font-bold leading-tight tracking-[0.2px]">SAP DMS</div>
          </div>
          <button className="ml-auto text-white/40 hover:text-white lg:hidden" onClick={onMobileClose}>{ICONS.close}</button>
        </div>

        {/* User */}
        <div className="flex items-center gap-[10px] px-[18px] py-[14px] border-b border-white/[0.08] bg-white/[0.015]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ring-2 ring-white/10">
            VW
          </div>
          <div>
            <div className="text-white/90 text-[12px] font-semibold">{user?.u || "viewer"}</div>
            <div className="text-white/40 text-[10.5px] font-medium mt-px">Viewer</div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-3 space-y-[2px]">
          <div className="px-[18px] pt-4 pb-[9px] text-[11px] font-bold text-white/35 uppercase tracking-[0.9px]">Main</div>
          {visible_NAV_ITEMS.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              active={activePage === item.key}
              onClick={() => { onNavigate(item.key); onMobileClose?.(); }}
            />
          ))}
          <AiNavSection
            items={visible_NAV_AI}
            activePage={activePage}
            onNavigate={onNavigate}
            onMobileClose={onMobileClose}
            isOpen={aiOpen}
            onToggle={() => setAiOpen(v => !v)}
            renderItem={(item) => (
              <NavItem key={item.key} item={item} active={activePage === item.key} onClick={() => { onNavigate(item.key); onMobileClose?.(); }} />
            )}
          />
        </div>

        {/* Logout */}
        <div className="border-t border-white/[0.08] p-2.5">
          <button onClick={onLogout} className="w-full flex items-center gap-[9px] px-3.5 py-[10px] text-[13px] text-white/55 hover:text-white/90 hover:bg-white/[0.05] rounded-[9px] transition-all">
            {ICONS.logout} Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ title, onMenuClick, onLogout }) {
  const { dark, setDark } = useTheme();
  return (
    <header className="h-[60px] bg-white dark:bg-[#1A2433] border-b border-slate-200 dark:border-slate-700 flex items-center px-5 gap-4 flex-shrink-0 sticky top-0 z-20 transition-colors">
      <button onClick={onMenuClick} className="lg:hidden text-slate-500 dark:text-slate-400">{ICONS.menu}</button>
      <h1 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate flex-1">{title}</h1>
      <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold px-[12px] py-[5px] rounded-full hidden sm:inline tracking-[0.2px]">
        Viewer
      </span>
      <div className="flex items-center gap-2">
       <NotificationBell />
        <button onClick={() => setDark(v => !v)} className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#232F40] text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
          {dark ? ICONS.sun : ICONS.moon}
        </button>
        <button onClick={onLogout} className="hidden sm:flex items-center gap-[7px] px-4 py-[8px] rounded-[9px] bg-blue-600 hover:bg-blue-700 text-white text-[11.5px] font-bold transition-colors">
          {ICONS.logout}<span>Logout</span>
        </button>
      </div>
    </header>
  );
}

export function ViewerLayout({ activePage, onNavigate, onLogout, title, children, user }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-screen bg-slate-100 dark:bg-[#0F1623] transition-colors overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={title} onMenuClick={() => setMobileOpen(true)} onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-5">{children}</main>
      </div>
    </div>
  );
}