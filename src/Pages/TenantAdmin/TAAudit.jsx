import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Info,
} from "lucide-react";

import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;
function getToken() {
  return localStorage.getItem("accessToken") || "";
}
function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

const ACTION_PALETTE = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
];
function actionColor(action = "") {
  if (/delete/i.test(action)) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  let hash = 0;
  for (let i = 0; i < action.length; i++) hash = (hash * 31 + action.charCodeAt(i)) >>> 0;
  return ACTION_PALETTE[hash % ACTION_PALETTE.length];
}

const PAGE_SIZE = 25;

function GuideModal({ open, onClose }) {
  if (!open) return null;
  const steps = [
    { title: "Search & Filter", desc: "Use the search box, Module, and Action dropdowns to narrow the log to what you're looking for." },
    { title: "Filter by Date Range", desc: "Set a From and To date to restrict entries to a specific window." },
    { title: "Review Entries", desc: "Each row shows who did what, when, in which module, plus details and the IP address it came from." },
    { title: "Export", desc: "Click Export CSV to download the currently filtered page as a CSV file." },
    { title: "Clear Filters", desc: "Click Clear to reset search, module, action, and date filters back to showing everything." },
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1C2A3A] rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Info className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Audit Log — Guide</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-lg leading-none">
            ×
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <div className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{s.title}</div>
                <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="w-full py-[9px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TAAudit({ tenantName = "" }) {
  const [entries, setEntries]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate]     = useState("");
  const [toDate, setToDate]         = useState("");

  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [filterOptions, setFilterOptions] = useState({ modules: [], actions: [] });
  const [showGuide, setShowGuide] = useState(false);
  useEffect(() => {
    fetch(`${API}/audit-logs/filters`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setFilterOptions(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (moduleFilter) params.set("module", moduleFilter);
      if (actionFilter) params.set("action", actionFilter);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`${API}/audit-logs?${params.toString()}`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load audit logs");
      }
      setEntries(data.data || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, moduleFilter, actionFilter, fromDate, toDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setModuleFilter("");
    setActionFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const hasFilters = search || moduleFilter || actionFilter || fromDate || toDate;

  const handleExportCsv = () => {
    const rows = [
      ["Time", "User", "Action", "Module", "Details", "IP Address"],
      ...entries.map((e) => [
        e.createdAt ? new Date(e.createdAt).toISOString() : "",
        e.user || `User #${e.userId ?? "—"}`,
        e.action || "—",
        e.module || "—",
        (e.details || "").replace(/"/g, '""'),
        e.ipAddress || "—",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-page-${page}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const rangeLabel = useMemo(() => {
    if (pagination.total === 0) return "0 results";
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, pagination.total);
    return `${start}–${end} of ${pagination.total}`;
  }, [page, pagination.total]);

    return (
    <div className="space-y-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#151E2B] p-5">
      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />
      <div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-[17px] font-bold text-slate-800 dark:text-slate-100">
            Audit Log{tenantName ? ` — ${tenantName}` : ""}
          </h1>
          <div className="relative group">
            <button
              onClick={() => setShowGuide(true)}
              className="w-4 h-4 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-blue-500 hover:text-white transition-colors"
            >
              <Info className="w-2.5 h-2.5" />
            </button>
            <div className="pointer-events-none absolute left-0 top-full mt-2 w-56 bg-slate-800 dark:bg-slate-700 text-white text-[10.5px] leading-relaxed rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
              Click to see a step-by-step guide on how to use this page.
            </div>
          </div>
        </div>
        <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
          Reports & Analytics → <span className="font-semibold text-slate-600 dark:text-slate-300">Audit Log</span>
          <span className="mx-2 opacity-40">·</span>
          Search, filter, and export every recorded system action
        </p>
      </div>

      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-end flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={handleExportCsv}
            disabled={entries.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors"
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search action, module, or details..."
            className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 dark:focus:border-blue-400"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
        >
          <option value="">All Modules</option>
          {filterOptions.modules.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
        >
          <option value="">All Actions</option>
          {filterOptions.actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-400" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="px-2 py-1.5 text-[12px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
          />
          <span className="text-[11px] text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="px-2 py-1.5 text-[12px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400 dark:text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-[13px]">Loading audit log…</span>
        </div>
      )}

      {!loading && error && (
        <div className="m-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[12.5px] text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-2">
          <Shield size={32} className="text-slate-200 dark:text-slate-700" />
          <span className="text-[13px]">
            {hasFilters ? "No entries match your filters." : "No audit log entries found."}
          </span>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {["Time", "User", "Action", "Module", "Details", "IP"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const ts = e.createdAt ? new Date(e.createdAt) : null;
                return (
                  <tr
                    key={e.id}
                    className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {ts ? (
                        <div className="flex flex-col">
                          <span>{ts.toLocaleDateString(undefined, { day: "2-digit", month: "short" })}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-semibold text-blue-600 dark:text-blue-400">
                        {e.user || (e.userId ? `User #${e.userId}` : "System")}
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
                    <td className="px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400 max-w-[280px] truncate" title={e.details || ""}>
                      {e.details || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        <Globe size={11} />
                        {e.ipAddress || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  );
}