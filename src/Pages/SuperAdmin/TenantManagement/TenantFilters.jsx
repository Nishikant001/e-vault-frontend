export function TenantFilters({ search, onSearch, statusFilter, onStatus, erpTypeFilter, onErpType, erpTypes, sortBy, onSort }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-3">
      <div className="relative flex-1 min-w-[180px]">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name, code, or ID…"
          className="w-full pl-8 pr-3 py-[8px] text-[12px] border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition"
        />
      </div>

      <select value={statusFilter} onChange={(e) => onStatus(e.target.value)}
        className="text-[12px] font-medium border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-[8px] bg-white dark:bg-[#232F40] text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition">
        <option value="ALL">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>

      <select value={erpTypeFilter} onChange={(e) => onErpType(e.target.value)}
        className="text-[12px] font-medium border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-[8px] bg-white dark:bg-[#232F40] text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition">
        <option value="ALL">All ERP Types</option>
        {erpTypes.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <select value={sortBy} onChange={(e) => onSort(e.target.value)}
        className="text-[12px] font-medium border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-[8px] bg-white dark:bg-[#232F40] text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition">
        <option value="name">Sort: Name</option>
        <option value="created">Sort: Created Date</option>
        <option value="status">Sort: Status</option>
      </select>
    </div>
  );
}