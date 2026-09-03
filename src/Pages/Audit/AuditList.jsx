import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Calendar,
  X,
  Globe,
  List as ListIcon,
  GitBranch,
  Lock,
} from "lucide-react";
import useAuditLogs, { PAGE_SIZE } from "./useAuditLogs";
import { fetchAuditFilterMeta, fetchTenantsLite, exportAuditLogsCsv } from "./auditApi";
import { actionColor, statusColor, formatDateTime } from "./auditDisplay";
import AuditStatCards from "./AuditStatCards";
import AuditTimeline from "./AuditTimeline";
import AuditDetailModal from "./AuditDetailModal";

const AUDIT_VIEWER_ROLES = ["SuperAdmin", "TenantAdmin", "Auditor"];

export default function AuditList({ role, tenantName = "" }) {
  const {
    entries,
    loading,
    refreshing,
    error,
    page,
    setPage,
    pagination,
    searchInput,
    setSearchInput,
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    activeQuery,
    refresh,
  } = useAuditLogs({ role });

  const [filterMeta, setFilterMeta] = useState({ modules: [], actions: [], statuses: [] });
  const [tenants, setTenants] = useState([]);
  const [view, setView] = useState("list"); // "list" | "timeline"
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [statsRefreshToken, setStatsRefreshToken] = useState(0);

  useEffect(() => {
    fetchAuditFilterMeta()
      .then(setFilterMeta)
      .catch(() => {});
    if (role === "SuperAdmin") {
      fetchTenantsLite()
        .then(setTenants)
        .catch(() => {});
    }
  }, [role]);

  const handleRefresh = () => {
    refresh();
    setStatsRefreshToken((n) => n + 1);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError("");
    try {
      await exportAuditLogsCsv(activeQuery);
    } catch (err) {
      setExportError(err.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const rangeLabel = useMemo(() => {
    if (pagination.total === 0) return "0 results";
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, pagination.total);
    return `${start}–${end} of ${pagination.total}`;
  }, [page, pagination.total]);

  // Defensive guard — App.jsx only wires this component into roles that are
  // meant to see it, but this keeps the component safe if reused elsewhere.
  if (role && !AUDIT_VIEWER_ROLES.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 gap-2">
        <Lock size={28} className="text-slate-200 dark:text-slate-700" />
        <span className="text-[13px]">You don't have permission to view the audit trail.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dashboard summary */}
      <AuditStatCards baseQuery={activeQuery} refreshToken={statsRefreshToken} />

      {/* Main panel */}
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Shield size={14} className="text-blue-600 dark:text-blue-400" />
            Enterprise Audit Trail{tenantName ? ` — ${tenantName}` : ""}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
              <button
                onClick={() => setView("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  view === "list"
                    ? "bg-blue-600 text-white"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                }`}
              >
                <ListIcon size={12} /> List
              </button>
              <button
                onClick={() => setView("timeline")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors border-l border-slate-200 dark:border-slate-600 ${
                  view === "timeline"
                    ? "bg-blue-600 text-white"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                }`}
              >
                <GitBranch size={12} /> Timeline
              </button>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
            >
              <RefreshCw size={12} className={loading || refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || entries.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors"
            >
              {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              Export CSV
            </button>
          </div>
        </div>

        {exportError && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[11.5px] text-red-600 dark:text-red-400">
            {exportError}
          </div>
        )}

        {/* Filters */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search action, module, remarks, SAP doc…"
              className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>

          <select
            value={filters.module}
            onChange={(e) => setFilter("module", e.target.value)}
            className="px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="">All Modules</option>
            {filterMeta.modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={filters.action}
            onChange={(e) => setFilter("action", e.target.value)}
            className="px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="">All Actions</option>
            {filterMeta.actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value)}
            className="px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            {(filterMeta.statuses.length ? filterMeta.statuses : ["SUCCESS", "FAILED", "PENDING"]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            value={filters.userId}
            onChange={(e) => setFilter("userId", e.target.value)}
            placeholder="User ID"
            className="w-[90px] px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
          />

          {role === "SuperAdmin" && tenants.length > 0 && (
            <select
              value={filters.tenantId}
              onChange={(e) => setFilter("tenantId", e.target.value)}
              className="px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="">All Tenants</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.tenantName}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-slate-400" />
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilter("fromDate", e.target.value)}
              className="px-2 py-1.5 text-[12px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
            />
            <span className="text-[11px] text-slate-400">to</span>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilter("toDate", e.target.value)}
              className="px-2 py-1.5 text-[12px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400 dark:text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-[13px]">Loading audit log…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="m-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[12.5px] text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle size={15} />
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-2">
            <Shield size={32} className="text-slate-200 dark:text-slate-700" />
            <span className="text-[13px]">
              {hasActiveFilters ? "No entries match your filters." : "No audit log entries found."}
            </span>
          </div>
        )}

        {/* Timeline view */}
        {!loading && !error && entries.length > 0 && view === "timeline" && (
          <AuditTimeline entries={entries} onSelect={setSelectedEntry} />
        )}

        {/* Table view */}
        {!loading && !error && entries.length > 0 && view === "list" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  {["Time", "User", "Action", "Module", "Status", "Document", "IP", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const ts = formatDateTime(e.createdAt);
                  return (
                    <tr
                      key={e.id}
                      onClick={() => setSelectedEntry(e)}
                      className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{ts.date}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{ts.time}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-semibold text-blue-600 dark:text-blue-400">
                          {e.username || (e.userId ? `User #${e.userId}` : "System")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2 py-[3px] rounded-full whitespace-nowrap ${actionColor(e.action)}`}>
                          {e.action || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {e.module || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-[3px] rounded-full border whitespace-nowrap ${statusColor(e.status)}`}>
                          {e.status || "SUCCESS"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11.5px] text-slate-500 dark:text-slate-400 whitespace-nowrap max-w-[160px] truncate">
                        {e.sapDocumentId || (e.documentId ? `#${e.documentId}` : "—")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          <Globe size={11} />
                          {e.ipAddress || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(evt) => {
                            evt.stopPropagation();
                            setSelectedEntry(e);
                          }}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && entries.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{rangeLabel}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 px-1">
                Page {page} of {pagination.totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
                disabled={page >= (pagination.totalPages || 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedEntry && <AuditDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
    </div>
  );
}
