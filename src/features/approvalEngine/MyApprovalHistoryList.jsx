// src/features/approvalEngine/MyApprovalHistoryList.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Eye,
  X,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Ban,
  Send,
  MessageSquare,
  FileText,
  Layers,
} from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import { ApprovalActionApi } from "./api";
import { ACTION_LABEL, formatDateTime } from "./constants";
import ApprovalDetailsDrawer from "./ApprovalDetailsDrawer";
import "./approval-motion.css";

/* ───────────── action styling ───────────── */
const ACTION_META = {
  APPROVE: { icon: CheckCircle2, badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", tile: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15" },
  REJECT: { icon: XCircle, badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300", tile: "bg-rose-50 text-rose-500 dark:bg-rose-500/15" },
  SEND_BACK: { icon: RotateCcw, badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", tile: "bg-amber-50 text-amber-500 dark:bg-amber-500/15" },
  CANCEL: { icon: Ban, badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", tile: "bg-slate-100 text-slate-500 dark:bg-slate-800" },
  SUBMIT: { icon: Send, badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300", tile: "bg-blue-50 text-blue-500 dark:bg-blue-500/15" },
  RESUBMIT: { icon: Send, badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300", tile: "bg-blue-50 text-blue-500 dark:bg-blue-500/15" },
  COMMENT: { icon: MessageSquare, badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", tile: "bg-slate-100 text-slate-500 dark:bg-slate-800" },
};
const metaOf = (a) => ACTION_META[a] || ACTION_META.COMMENT;

const RANGES = [
  { value: "", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

function inRange(dateStr, range) {
  if (!range) return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (range === "today") return d.toDateString() === now.toDateString();
  return now - d <= Number(range) * 86400000;
}

const fmtDate = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
};
const fmtTime = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/* ───────────── small UI pieces ───────────── */
function Select({ value, onChange, children, className = "" }) {
  return (
    <div className={`relative min-w-[150px] ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] pl-3 pr-9 text-sm text-[var(--text-secondary)] outline-none transition-colors hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
    </div>
  );
}

function Chip({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`am-press inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
        active
          ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
          : "border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-blue-300"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
          active ? "bg-blue-600 text-white" : "bg-[var(--surface-sunken)] text-[var(--text-tertiary)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function SkeletonRows() {
  return Array.from({ length: 4 }).map((_, i) => (
    <tr key={i} className="border-t border-[var(--border-default)]">
      {Array.from({ length: 7 }).map((__, j) => (
        <td key={j} className="px-4 py-4">
          <div className="h-3.5 animate-pulse rounded bg-[var(--surface-sunken)]" style={{ width: `${45 + ((i + j) % 4) * 14}%` }} />
        </td>
      ))}
    </tr>
  ));
}

const TH = "whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]";
const TD = "px-4 py-3.5 align-middle text-xs text-[var(--text-secondary)]";

/* ───────────── component ───────────── */
export default function MyApprovalHistoryList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [range, setRange] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openId, setOpenId] = useState(null);

  const load = () => {
    setLoading(true);
    ApprovalActionApi.myActions()
      .then((res) => setRows(res.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => setPage(1), [search, actionFilter, range, pageSize]);

  const counts = useMemo(() => {
    const map = {};
    rows.forEach((r) => (map[r.action] = (map[r.action] || 0) + 1));
    return map;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = rows.filter((r) => {
      if (actionFilter && r.action !== actionFilter) return false;
      if (!inRange(r.createdAt, range)) return false;
      if (!q) return true;
      return (
        String(r.documentId).includes(q) ||
        (r.Document?.fileName || "").toLowerCase().includes(q) ||
        (r.comments || r.rejectReason || "").toLowerCase().includes(q)
      );
    });
    out.sort((a, b) => (sortDir === "asc" ? 1 : -1) * (new Date(a.createdAt) - new Date(b.createdAt)));
    return out;
  }, [rows, search, actionFilter, range, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const from = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, filtered.length);
  const hasFilters = !!(search || actionFilter || range);

  function exportCsv() {
    const header = ["Document ID", "Action", "Level", "Old Status", "New Status", "Remarks", "Date"];
    const lines = filtered.map((r) => [
      r.documentId, ACTION_LABEL[r.action] || r.action, r.levelNumber, r.oldStatus, r.newStatus,
      (r.comments || r.rejectReason || "").replace(/\n/g, " "), formatDateTime(r.createdAt),
    ]);
    const csv = [header, ...lines].map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "approval-history.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Quick action chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Chip label="All" count={rows.length} active={!actionFilter} onClick={() => setActionFilter("")} />
        {Object.keys(ACTION_LABEL)
          .filter((k) => counts[k])
          .map((k) => (
            <Chip
              key={k}
              label={ACTION_LABEL[k]}
              count={counts[k]}
              active={actionFilter === k}
              onClick={() => setActionFilter((f) => (f === k ? "" : k))}
            />
          ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1 lg:w-80 lg:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by document ID or remark…"
              className="h-10 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-[var(--text-tertiary)] hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <Select value={range} onChange={setRange}>
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(""); setActionFilter(""); setRange(""); }}
              className="am-fade am-press inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" /> Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="am-press inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="am-press inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        key={`${page}-${pageSize}-${actionFilter}-${range}-${sortDir}`}
        className="am-rows overflow-x-auto rounded-xl border border-[var(--border-default)]"
      >
        <table className="w-full min-w-[820px] border-collapse">
          <thead className="bg-[var(--surface-sunken)]">
            <tr>
              <th className={TH}>Document</th>
              <th className={TH}>Action</th>
              <th className={TH}>Level</th>
              <th className={TH}>Result</th>
              <th className={TH}>Remarks</th>
              <th className={TH}>
                <button
                  type="button"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-[var(--text-primary)]"
                >
                  Date
                  {sortDir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                </button>
              </th>
              <th className={`${TH} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="bg-[var(--surface-card)]">
            {loading && <SkeletonRows />}
            {!loading && pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {hasFilters ? "No actions match these filters" : "No approval actions yet"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    {hasFilters
                      ? "Try a different action or date range."
                      : "Actions you take (approve, reject, send back…) will show up here."}
                  </p>
                </td>
              </tr>
            )}
            {!loading &&
              pageRows.map((r) => {
                const m = metaOf(r.action);
                const Icon = m.icon;
                const remark = r.comments || r.rejectReason;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setOpenId(r.documentApprovalId)}
                    className="cursor-pointer border-t border-[var(--border-default)] transition-colors duration-150 hover:bg-[var(--surface-sunken)]"
                  >
                    <td className={TD}>
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${m.tile}`}>
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-[13px] font-semibold text-[var(--text-primary)]">
                            {r.Document?.fileName || `Document #${r.documentId}`}
                          </p>
                          <p className="text-[11px] text-[var(--text-tertiary)]">ID #{r.documentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className={TD}>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${m.badge}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {ACTION_LABEL[r.action] || r.action}
                      </span>
                    </td>
                    <td className={TD}>
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--surface-sunken)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)]">
                        <Layers className="h-3 w-3" /> Level {r.levelNumber ?? "—"}
                      </span>
                    </td>
                    <td className={TD}>
                      <StatusBadge status={r.newStatus} />
                    </td>
                    <td className={TD}>
                      {remark ? (
                        <p className="max-w-[240px] truncate" title={remark}>{remark}</p>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">No remarks</span>
                      )}
                    </td>
                    <td className={`${TD} whitespace-nowrap`}>
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{fmtDate(r.createdAt)}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{fmtTime(r.createdAt)}</p>
                    </td>
                    <td className={TD} onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setOpenId(r.documentApprovalId)}
                          className="am-press inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3.5 text-xs font-semibold text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-tertiary)]">
        <span>
          Showing <b className="text-[var(--text-secondary)]">{from}</b> to <b className="text-[var(--text-secondary)]">{to}</b> of{" "}
          <b className="text-[var(--text-secondary)]">{filtered.length}</b> items
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
              className="am-press flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <span key={p} className="flex items-center gap-1.5">
                  {i > 0 && p - arr[i - 1] > 1 && <span>…</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`am-press h-8 min-w-8 rounded-lg px-2 text-xs font-semibold ${
                      p === page
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                        : "border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
              className="am-press flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <label className="flex items-center gap-2">
            Rows per page
            <span className="relative">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-8 cursor-pointer appearance-none rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] pl-3 pr-7 text-xs text-[var(--text-secondary)] outline-none focus:border-blue-500"
              >
                {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
            </span>
          </label>
        </div>
      </div>

      <ApprovalDetailsDrawer documentApprovalId={openId} open={!!openId} onClose={() => setOpenId(null)} onChanged={load} />
    </div>
  );
}