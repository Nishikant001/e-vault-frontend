import { useState } from "react";
import { useTheme } from "../SuperAdmin/Superadmincontext";
import { getAIAssistantNavItems } from "../../features/aiAssistant/nav";
import { useTenantModules } from "../../context/TenantModuleContext";
import { filterNavigationItems } from "../../utils/tenantModuleMapping";

const ICONS = {
  dashboard: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  users:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  docs:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  workflow:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  folder:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  audit:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  approvals: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  logout:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bell:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  sun:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  menu:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  aiAssistant: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/><circle cx="12" cy="12" r="3.2"/></svg>,
  communication: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  shield: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 3.5v6c0 5-3.4 8.7-8 10.5-4.6-1.8-8-5.5-8-10.5v-6z"/><polyline points="9 12 11 14 15 10"/></svg>,

};

const NAV_MAIN = [
  { key: "dashboard", label: "Dashboard",    icon: "dashboard" },
  { key: "documents", label: "Documents",    icon: "docs" },
  { key: "workflow",  label: "DMS Workflow", icon: "workflow" },
  { key: "folders",   label: "Folders",      icon: "folder" },
  { key: "communication", label: "Communication", icon: "communication" },
  { key: "crossDepartmentRequest", label: "Cross Department Access", icon: "shield" },
];
const NAV_REPORTS = [
  { key: "approvals", label: "Approvals",    icon: "approvals", badge: 2 },
];

const NAV_AI = getAIAssistantNavItems("BranchManager").map(item => ({ key: item.key, label: item.label, icon: "aiAssistant" }));

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-[9px] px-[14px] py-[7px] text-[12px] transition-all border-l-[3px] ${
        active ? "bg-blue-600/20 text-[#6BB8FF] border-blue-500" : "text-white/60 border-transparent hover:bg-white/5 hover:text-white/85"
      }`}
    >
      <span className="flex-shrink-0">{ICONS[item.icon]}</span>
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span className={`text-[10px] font-bold px-[7px] py-px rounded-full ${active ? "bg-blue-500 text-white" : "bg-blue-900/40 text-blue-300"}`}>
          {item.badge}
        </span>
      )}
    </button>
  );
}

function Sidebar({
 activePage, onNavigate, onLogout, mobileOpen, onMobileClose, user }) {
  const { isModuleVisible } = useTenantModules();
  const visible_NAV_MAIN = filterNavigationItems(NAV_MAIN, isModuleVisible);
  const visible_NAV_REPORTS = filterNavigationItems(NAV_REPORTS, isModuleVisible);
  const visible_NAV_AI = filterNavigationItems(NAV_AI, isModuleVisible);

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onMobileClose} />}
      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col w-[220px] bg-[#1A2433] transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0 lg:flex-shrink-0`}>

        {/* Logo */}
        <div className="flex items-center gap-[10px] px-4 py-[14px] border-b border-white/10">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="9" rx="1" fill="white"/>
              <rect x="11" y="2" width="7" height="5" rx="1" fill="white"/>
              <rect x="11" y="9" width="7" height="9" rx="1" fill="white"/>
              <rect x="2" y="13" width="7" height="5" rx="1" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="text-white text-[13px] font-bold leading-tight">SAP DMS</div>
          </div>
          <button className="ml-auto text-white/40 hover:text-white lg:hidden" onClick={onMobileClose}>{ICONS.close}</button>
        </div>

        {/* User */}
        <div className="flex items-center gap-2 px-[14px] py-[10px] border-b border-white/10">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">BM</div>
          <div>
            <div className="text-white/90 text-[11px] font-semibold">{user?.u || "branchmanager"}</div>
            <div className="text-white/40 text-[10px]">BranchManager</div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-[14px] py-[6px] text-[9px] font-bold text-white/30 uppercase tracking-[0.8px]">Main</div>
          {visible_NAV_MAIN.map(item => (
            <NavItem key={item.key} item={item} active={activePage === item.key} onClick={() => { onNavigate(item.key); onMobileClose?.(); }} />
          ))}
          <div className="px-[14px] pt-3 pb-[6px] text-[9px] font-bold text-white/30 uppercase tracking-[0.8px]">Reports</div>
          {visible_NAV_REPORTS.map(item => (
            <NavItem key={item.key} item={item} active={activePage === item.key} onClick={() => { onNavigate(item.key); onMobileClose?.(); }} />
          ))}
          <div className="px-[14px] pt-3 pb-[6px] text-[9px] font-bold text-white/30 uppercase tracking-[0.8px]">AI Assistant</div>
          {visible_NAV_AI.map(item => (
            <NavItem key={item.key} item={item} active={activePage === item.key} onClick={() => { onNavigate(item.key); onMobileClose?.(); }} />
          ))}
        </div>

        {/* Logout */}
        <div className="border-t border-white/10 p-2">
          <button onClick={onLogout} className="w-full flex items-center gap-[9px] px-[14px] py-[7px] text-[12px] text-white/50 hover:text-white/80 hover:bg-white/5 rounded transition-all">
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
    <header className="h-[46px] bg-white dark:bg-[#1A2433] border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-3 flex-shrink-0 sticky top-0 z-20 transition-colors">
      <button onClick={onMenuClick} className="lg:hidden text-slate-500 dark:text-slate-400">{ICONS.menu}</button>
      <h1 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 truncate flex-1">{title}</h1>
      <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[11px] font-bold px-[10px] py-[2px] rounded-full hidden sm:inline">BranchManager</span>
      <div className="flex items-center gap-2">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#232F40] text-slate-500 dark:text-slate-400">
          {ICONS.bell}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center">3</span>
        </button>
        <button onClick={() => setDark(v => !v)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#232F40] text-slate-500 dark:text-slate-400">
          {dark ? ICONS.sun : ICONS.moon}
        </button>
        <button onClick={onLogout} className="hidden sm:flex items-center gap-[6px] px-3 py-[5px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold">
          {ICONS.logout}<span>Logout</span>
        </button>
      </div>
    </header>
  );
}

export function BMLayout({ activePage, onNavigate, onLogout, title, children, user }) {
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
