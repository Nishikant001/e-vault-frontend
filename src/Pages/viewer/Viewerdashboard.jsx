import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Search,
  RefreshCw,
  FileText,
  Building2,
  Layers,
  CalendarClock,
  Inbox,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import { API_BASE_URL, getToken } from "../../services/apiClient";

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

// ── Status meta — kept consistent with the rest of the app (TADashboard) ──
const STATUS_META = {
  COMPLETED:            { label: "Completed",         color: "text-green-600 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-900/20",  dot: "bg-green-500"  },
  OCR_COMPLETED:        { label: "OCR Done",           color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/20",    dot: "bg-blue-500"   },
  OCR_PROCESSING:       { label: "OCR Processing",     color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/20",  dot: "bg-amber-500"  },
  WAITING_FOR_APPROVAL: { label: "Awaiting Approval",  color: "text-orange-600 dark:text-orange-400",bg: "bg-orange-50 dark:bg-orange-900/20",dot: "bg-orange-500" },
  SAVING_TO_SAP:        { label: "Saving to SAP",      color: "text-purple-600 dark:text-purple-400",bg: "bg-purple-50 dark:bg-purple-900/20",dot: "bg-purple-500" },
  UPLOADING:             { label: "Uploading",         color: "text-slate-500 dark:text-slate-400",  bg: "bg-slate-100 dark:bg-slate-700/40", dot: "bg-slate-400"  },
  FAILED:                { label: "Failed",            color: "text-red-600 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-900/20",      dot: "bg-red-500"    },
  REJECTED:              { label: "Rejected",          color: "text-red-600 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-900/20",      dot: "bg-red-500"    },
};
const statusMeta = (s) => STATUS_META[s] || { label: s || "Unknown", color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-700/40", dot: "bg-slate-400" };

const FILTER_TABS = [
  { key: "ALL",     label: "All" },
  { key: "COMPLETED", label: "Completed" },
  { key: "OCR_PROCESSING", label: "Processing" },
  { key: "WAITING_FOR_APPROVAL", label: "Awaiting Approval" },
  { key: "FAILED", label: "Failed" },
];

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
}

function timeAgo(d) {
  if (!d) return "";
  const diffMs = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

function StatCard({ icon: Icon, label, value, sub, loading, accent = "text-blue-600 dark:text-blue-400" }) {
  return (
    <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-colors hover:border-blue-300 dark:hover:border-blue-700/60">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`w-7 h-7 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center ${accent}`}>
          <Icon size={14} />
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-14 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
      ) : (
        <div className="text-[26px] font-bold text-slate-800 dark:text-slate-100 leading-none">{value}</div>
      )}
      {sub && <div className="text-[11px] text-slate-400 mt-[6px]">{sub}</div>}
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-[11px] px-1">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-2 w-1/4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
      </div>
      <div className="h-5 w-16 bg-slate-100 dark:bg-slate-700 rounded-full animate-pulse" />
      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse" />
    </div>
  );
}

function DocIcon() {
  return (
    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
      <FileText size={14} className="text-slate-400 dark:text-slate-400" />
    </div>
  );
}

export default function ViewerDashboard({ onNavigate }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [viewingId, setViewingId] = useState(null);
  const [viewError, setViewError] = useState("");

  async function loadDocuments({ silent = false } = {}) {
    silent ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/documents`, { headers: authHeaders() });
      if (res.status === 401) {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data?.message || "Failed to load documents");
      }
      setDocs(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setError(e.message || "Something went wrong while loading your documents.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadDocuments(); }, []);

  // ── Derived stats ──────────────────────────────────────────
  const totalDocs = docs.length;

  const departmentCount = useMemo(
    () => new Set(docs.map((d) => d.Department?.name).filter(Boolean)).size,
    [docs]
  );
  const docTypeCount = useMemo(
    () => new Set(docs.map((d) => d.DocumentType?.name).filter(Boolean)).size,
    [docs]
  );
  const addedThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return docs.filter((d) => new Date(d.createdAt).getTime() >= weekAgo).length;
  }, [docs]);

  const statusCounts = useMemo(() => {
    const c = {};
    docs.forEach((d) => { const s = d.uploadStatus || "UNKNOWN"; c[s] = (c[s] || 0) + 1; });
    return c;
  }, [docs]);

  const visibleDocs = useMemo(() => {
    let list = [...docs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (activeFilter !== "ALL") list = list.filter((d) => d.uploadStatus === activeFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((d) =>
        [d.originalFileName, d.Department?.name, d.Category?.name, d.DocumentType?.name, d.tcode]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    return list;
  }, [docs, activeFilter, query]);

  const recent = visibleDocs.slice(0, 8);

  async function handleView(doc) {
    setViewError("");
    setViewingId(doc.id);
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${doc.id}/view`, { headers: authHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Could not open this document.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setViewError(e.message || "Could not open this document.");
    } finally {
      setViewingId(null);
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-5 transition-colors">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-500" />
              Read-Only Access
            </h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-[3px]">
              You can view and search documents assigned to you. Contact your admin to request edit permissions.
            </p>
          </div>
          <button
            onClick={() => loadDocuments({ silent: true })}
            disabled={refreshing || loading}
            className="flex items-center gap-[6px] px-3 py-[7px] rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-white/5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="Visible Documents" value={totalDocs} sub={`${statusCounts.COMPLETED || 0} completed`} loading={loading} />
        <StatCard icon={Building2} label="Departments" value={departmentCount} sub="Accessible to you" loading={loading} accent="text-purple-600 dark:text-purple-400" />
        <StatCard icon={Layers} label="Document Types" value={docTypeCount} sub="Across your scope" loading={loading} accent="text-orange-600 dark:text-orange-400" />
        <StatCard icon={CalendarClock} label="Added This Week" value={addedThisWeek} sub="Last 7 days" loading={loading} accent="text-green-600 dark:text-green-400" />
      </div>

      {/* ── Main grid: recent documents + side panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

        {/* Recent documents */}
        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
          <div className="px-5 pt-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Recent Documents</h2>
              <button
                onClick={() => onNavigate && onNavigate("documents")}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex-shrink-0"
              >
                View All →
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by file name, department or type…"
                className="w-full pl-9 pr-8 py-[8px] text-[12px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#151E2D] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-[6px] flex-wrap pb-3">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-[10px] py-[5px] rounded-lg text-[11px] font-semibold border transition-all ${
                    activeFilter === tab.key
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-[#151E2D] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {viewError && (
            <div className="mx-5 mb-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
              <span className="text-[11px] text-red-600 dark:text-red-400">{viewError}</span>
            </div>
          )}

          <div className="px-5 pb-2">
            {loading ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {[...Array(5)].map((_, i) => <RowSkeleton key={i} />)}
              </div>
            ) : error ? (
              <div className="py-10 flex flex-col items-center text-center gap-2">
                <AlertTriangle size={20} className="text-red-400" />
                <p className="text-[12px] text-red-500">{error}</p>
                <button onClick={() => loadDocuments()} className="text-[11px] text-blue-600 font-semibold hover:underline">Try again</button>
              </div>
            ) : recent.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-center gap-2">
                <Inbox size={22} className="text-slate-300 dark:text-slate-600" />
                <p className="text-[12px] text-slate-400">
                  {query || activeFilter !== "ALL" ? "No documents match your filters." : "No documents visible to you yet."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {recent.map((doc) => {
                  const meta = statusMeta(doc.uploadStatus);
                  return (
                    <div key={doc.id} className="flex items-center gap-3 py-[11px] hover:bg-slate-50 dark:hover:bg-white/5 -mx-1 px-1 rounded-lg transition-colors">
                      <DocIcon />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {doc.originalFileName || `Document #${doc.id}`}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-[1px] truncate">
                          {formatDate(doc.createdAt)} · {doc.Department?.name || "—"}
                          {doc.DocumentType?.name ? ` · ${doc.DocumentType.name}` : ""}
                        </div>
                      </div>
                      <span className={`hidden sm:inline-flex items-center gap-[5px] text-[10px] font-bold px-[9px] py-[3px] rounded-full ${meta.bg} ${meta.color} flex-shrink-0`}>
                        <span className={`w-[5px] h-[5px] rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 hidden md:inline">{timeAgo(doc.createdAt)}</span>
                      <button
                        onClick={() => handleView(doc)}
                        disabled={viewingId === doc.id}
                        title="View document"
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-blue-500 hover:border-blue-300 transition-all flex-shrink-0 disabled:opacity-60"
                      >
                        {viewingId === doc.id ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 mt-1">
            <button
              onClick={() => onNavigate && onNavigate("documents")}
              className="text-[12px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              View All Documents →
            </button>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Status breakdown */}
          <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-colors">
            <h2 className="text-[12px] font-bold text-slate-800 dark:text-slate-100 mb-3">Status Breakdown</h2>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />)}
              </div>
            ) : totalDocs === 0 ? (
              <p className="text-[11px] text-slate-400">No documents yet.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(statusCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => {
                    const meta = statusMeta(status);
                    const pct = Math.round((count / totalDocs) * 100);
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between text-[11px] mb-[3px]">
                          <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                          <span className="text-slate-400">{count}</span>
                        </div>
                        <div className="h-[5px] bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${meta.dot}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Access notice */}
          <div className="bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={14} className="text-blue-500 flex-shrink-0" />
              <h3 className="text-[12px] font-bold text-blue-700 dark:text-blue-300">Viewer Access</h3>
            </div>
            <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
              You can preview and search documents in your assigned departments and categories. Uploading, editing and deleting are disabled for this role.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}