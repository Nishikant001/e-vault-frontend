import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, HardDrive, RefreshCw, Settings2, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { API_BASE_URL } from "../../services/apiClient";

const DEFAULT_DB_GB = 5;
const DEFAULT_FILE_GB = 10;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
  };
}

function bytesToGB(bytes) {
  return (Number(bytes || 0) / 1024 ** 3).toFixed(2);
}

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  if (n < 1024 ** 4) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  return `${(n / 1024 ** 4).toFixed(2)} TB`;
}

function usageTone(percent, over) {
  if (over || percent >= 100) return "bg-red-500";
  if (percent >= 90) return "bg-orange-500";
  if (percent >= 80) return "bg-amber-400";
  return "bg-blue-500";
}

function UsageBar({ value, label, used, quota }) {
  const percent = Math.min(100, Number(value || 0));
  const over = Number(value || 0) > 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`text-[10px] font-bold ${over ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-300"}`}>
          {formatBytes(used)} / {formatBytes(quota)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${usageTone(value, over)}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-1 text-right text-[9px] text-slate-400">{Number(value || 0).toFixed(1)}%</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    violet: "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
          <div className="mt-1 text-[24px] font-bold tabular-nums text-slate-800 dark:text-slate-100">{value}</div>
          <div className="mt-0.5 text-[10px] text-slate-400">{sub}</div>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tones[tone]}`}><Icon size={17} /></div>
      </div>
    </div>
  );
}

function QuotaModal({ tenant, onClose, onSaved }) {
  const [dbGB, setDbGB] = useState(bytesToGB(tenant.databaseQuotaBytes || DEFAULT_DB_GB * 1024 ** 3));
  const [fileGB, setFileGB] = useState(bytesToGB(tenant.fileQuotaBytes || DEFAULT_FILE_GB * 1024 ** 3));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const db = Number(dbGB);
    const file = Number(fileGB);
    if (!Number.isFinite(db) || db < 0 || !Number.isFinite(file) || file < 0) {
      setError("Enter valid non-negative storage limits.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/tenants/${tenant.tenantId}/storage/quota`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ databaseQuotaBytes: Math.round(db * 1024 ** 3), fileQuotaBytes: Math.round(file * 1024 ** 3) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Could not update storage limits");
      onSaved(data.data);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[2px]">
      <div className="w-full max-w-md bg-white dark:bg-[#172131] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <div className="text-[14px] font-bold text-slate-800 dark:text-slate-100">Storage limits</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{tenant.tenant?.tenantName || "Tenant"} · {tenant.tenant?.tenantCode || ""}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-900/40 p-3 flex gap-3">
            <ShieldCheck size={17} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-[10px] leading-4 text-blue-800 dark:text-blue-300">Changing these values changes the tenant quota only. It does not pre-allocate or resize the physical MySQL database.</p>
          </div>
          <label className="block">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Database quota (GB)</span>
            <input type="number" min="0" step="0.1" value={dbGB} onChange={(e) => setDbGB(e.target.value)} className="mt-1.5 w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#111A27] text-[12px] text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            <span className="block mt-1 text-[9px] text-slate-400">Current usage: {formatBytes(tenant.databaseBytes)}</span>
          </label>
          <label className="block">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">File storage quota (GB)</span>
            <input type="number" min="0" step="0.1" value={fileGB} onChange={(e) => setFileGB(e.target.value)} className="mt-1.5 w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#111A27] text-[12px] text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            <span className="block mt-1 text-[9px] text-slate-400">Current usage: {formatBytes(tenant.fileBytes)}</span>
          </label>
          {error && <div className="text-[10px] font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-lg px-3 py-2">{error}</div>}
        </div>
        <div className="px-5 py-4 bg-slate-50 dark:bg-[#111A27] border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 h-9 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700">Cancel</button>
          <button disabled={saving} onClick={save} className="px-4 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-bold">{saving ? "Saving…" : "Save limits"}</button>
        </div>
      </div>
    </div>
  );
}

export default function Billing() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/tenants/storage`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Could not load storage usage");
      setRows(data.data || []);
      setTotals(data.totals || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function refreshUsage() {
    setRefreshing(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/tenants/storage/refresh`, { method: "POST", headers: authHeaders() });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Could not refresh usage");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }

  const filtered = useMemo(() => rows.filter((row) => {
    const text = `${row.tenant?.tenantName || ""} ${row.tenant?.tenantCode || ""}`.toLowerCase();
    return text.includes(query.toLowerCase());
  }), [rows, query]);

  const overLimit = rows.filter((r) => r.overDatabaseQuota || r.overFileQuota || r.overTotalQuota).length;

  function mergeSaved(storage) {
    setRows((current) => {
      const next = current.map((r) => r.tenantId === storage.tenantId ? { ...r, ...storage, tenant: r.tenant } : r);
      const nextTotals = next.reduce((acc, row) => {
        acc.databaseBytes += Number(row.databaseBytes || 0);
        acc.fileBytes += Number(row.fileBytes || 0);
        acc.totalBytes += Number(row.totalBytes || 0);
        acc.databaseQuotaBytes += Number(row.databaseQuotaBytes || 0);
        acc.fileQuotaBytes += Number(row.fileQuotaBytes || 0);
        return acc;
      }, { databaseBytes: 0, fileBytes: 0, totalBytes: 0, databaseQuotaBytes: 0, fileQuotaBytes: 0 });
      nextTotals.totalQuotaBytes = nextTotals.databaseQuotaBytes + nextTotals.fileQuotaBytes;
      setTotals(nextTotals);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Billing & Storage</h2>
          <p className="text-[11px] text-slate-400 mt-px">Monitor tenant usage and control database/file quotas</p>
        </div>
        <button onClick={refreshUsage} disabled={refreshing} className="inline-flex items-center gap-2 px-3.5 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[11px] font-bold shadow-sm">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Measuring…" : "Refresh usage"}
        </button>
      </div>

      {error && <div className="rounded-lg px-3.5 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-[11px] font-semibold text-red-600 dark:text-red-400">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Database} label="MySQL storage" value={formatBytes(totals?.databaseBytes)} sub="Data + indexes across tenants" />
        <StatCard icon={HardDrive} label="File storage" value={formatBytes(totals?.fileBytes)} sub="Application-managed files" tone="violet" />
        <StatCard icon={ShieldCheck} label="Total quota" value={formatBytes(totals?.totalQuotaBytes)} sub={`${rows.length} ready tenant databases`} tone="emerald" />
        <StatCard icon={TriangleAlert} label="Over quota" value={overLimit} sub={overLimit ? "Requires attention" : "All tenants within limits"} tone={overLimit ? "amber" : "emerald"} />
      </div>

      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Tenant storage</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">MySQL footprint is measured as data + index bytes from information_schema</p>
          </div>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tenant…" className="h-8 w-44 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#111A27] text-[10px] outline-none text-slate-700 dark:text-slate-200 focus:border-blue-500" />
        </div>

        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3].map((i) => <div key={i} className="h-24 rounded-lg bg-slate-100 dark:bg-slate-700/40 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-[11px] text-slate-400">No tenant storage records found.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map((row) => {
              const tenant = row.tenant || {};
              const status = row.overDatabaseQuota || row.overFileQuota || row.overTotalQuota ? "Over quota" : row.totalUsagePercent >= 80 ? "Near limit" : "Healthy";
              const statusClass = status === "Over quota" ? "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400" : status === "Near limit" ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400";
              return (
                <div key={row.tenantId} className="px-4 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">{(tenant.tenantCode || tenant.tenantName || "TN").slice(0,2).toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100 truncate">{tenant.tenantName || "Unknown tenant"}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{row.databaseName}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusClass}`}>{status}</span>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-3">
                        <UsageBar label="MySQL database" value={row.databaseUsagePercent} used={row.databaseBytes} quota={row.databaseQuotaBytes} />
                        <UsageBar label="File storage" value={row.fileUsagePercent} used={row.fileBytes} quota={row.fileQuotaBytes} />
                        <UsageBar label="Combined" value={row.totalUsagePercent} used={row.totalBytes} quota={row.totalQuotaBytes} />
                      </div>
                    </div>
                    <button onClick={() => setSelected(row)} title="Manage quotas" className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 flex items-center justify-center shrink-0">
                      <Settings2 size={15} />
                    </button>
                  </div>
                  <div className="ml-12 mt-3 flex items-center gap-4 text-[9px] text-slate-400 flex-wrap">
                    <span>DB: <b className="text-slate-600 dark:text-slate-300">{formatBytes(row.databaseBytes)}</b></span>
                    <span>Files: <b className="text-slate-600 dark:text-slate-300">{formatBytes(row.fileBytes)}</b></span>
                    <span>Total: <b className="text-slate-600 dark:text-slate-300">{formatBytes(row.totalBytes)}</b></span>
                    <span className="ml-auto">Measured: {row.storageMeasuredAt ? new Date(row.storageMeasuredAt).toLocaleString() : "Not measured yet"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[9px] text-slate-400 px-1">Storage quotas are application-level limits. Increasing a quota does not allocate empty space in MySQL; the tenant database grows only as data is written.</div>

      {selected && <QuotaModal tenant={selected} onClose={() => setSelected(null)} onSaved={mergeSaved} />}
    </div>
  );
}
