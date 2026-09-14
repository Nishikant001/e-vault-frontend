import { useState } from "react";
import { AUDIT_LOG } from "../SuperAdmin/Superadmincontext";

export default function SystemAudit() {
  const [filterTenant, setFilterTenant] = useState("All");
  const [filterAction, setFilterAction] = useState("All");
  const [search, setSearch] = useState("");

  const tenants = ["All", ...new Set(AUDIT_LOG.map(a => a.tenant))];
  const actions = ["All", ...new Set(AUDIT_LOG.map(a => a.action))];

  const filtered = AUDIT_LOG.filter(a => {
    const matchT = filterTenant === "All" || a.tenant === filterTenant;
    const matchA = filterAction === "All" || a.action === filterAction;
    const matchS = !search || a.user.includes(search) || a.doc.toLowerCase().includes(search.toLowerCase());
    return matchT && matchA && matchS;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">System Audit</h2>
          <p className="text-[11px] text-slate-400 mt-px">Complete audit log across all tenants</p>
        </div>
        <button className="px-4 py-[8px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#1A2433] text-slate-700 dark:text-slate-300 text-[12px] font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          ↓ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search user or document…"
          className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-[12px] bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition w-52 placeholder-slate-300 dark:placeholder-slate-600"
        />
        <select value={filterTenant} onChange={e => setFilterTenant(e.target.value)}
          className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-[12px] bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition">
          {tenants.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
          className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-[12px] bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition">
          {actions.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100">📋 Audit Log — All Tenants</span>
          <span className="ml-auto text-[11px] text-slate-400">{filtered.length} records</span>
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#151E2B]">
                {["Time", "User", "Tenant", "Action", "Document", "IP"].map(h => (
                  <th key={h} className="text-left px-4 py-[9px] text-[11px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">{a.time}</td>
                  <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-semibold">{a.user}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.tenant}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-[8px] py-[3px] rounded-full ${a.actionColor}`}>{a.action}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{a.doc}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{a.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
          {filtered.map((a, i) => (
            <div key={i} className="px-4 py-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-[12px]">{a.user}</span>
                <span className={`text-[10px] font-bold px-2 py-[2px] rounded-full ${a.actionColor}`}>{a.action}</span>
              </div>
              <div className="text-[11px] text-slate-700 dark:text-slate-300">{a.doc}</div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span>{a.time}</span><span>·</span><span>{a.tenant}</span><span>·</span><span>{a.ip}</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-[13px]">No audit records found.</div>
        )}
      </div>
    </div>
  );
}