import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Database,
  FileArchive,
  HardDrive,
  Layers3,
  RefreshCw,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { API_BASE_URL } from "../../services/apiClient";

const DEFAULT_DB_GB = 5;
const DEFAULT_FILE_GB = 10;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
  };
}

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  if (n < 1024 ** 4) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  return `${(n / 1024 ** 4).toFixed(2)} TB`;
}

function bytesToGB(bytes) {
  return (Number(bytes || 0) / 1024 ** 3).toFixed(2);
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

function getUsage(row) {
  const databaseBytes = Number(row?.databaseBytes || 0);
  const fileBytes = Number(row?.fileBytes || 0);
  const totalBytes = Number(row?.totalBytes || databaseBytes + fileBytes);
  const databaseQuotaBytes = Number(row?.databaseQuotaBytes || DEFAULT_DB_GB * 1024 ** 3);
  const fileQuotaBytes = Number(row?.fileQuotaBytes || DEFAULT_FILE_GB * 1024 ** 3);
  const totalQuotaBytes = Number(row?.totalQuotaBytes || databaseQuotaBytes + fileQuotaBytes);
  const databaseUsagePercent = Number(row?.databaseUsagePercent ?? (databaseQuotaBytes ? (databaseBytes / databaseQuotaBytes) * 100 : 0));
  const fileUsagePercent = Number(row?.fileUsagePercent ?? (fileQuotaBytes ? (fileBytes / fileQuotaBytes) * 100 : 0));
  const totalUsagePercent = Number(row?.totalUsagePercent ?? (totalQuotaBytes ? (totalBytes / totalQuotaBytes) * 100 : 0));
  return { databaseBytes, fileBytes, totalBytes, databaseQuotaBytes, fileQuotaBytes, totalQuotaBytes, databaseUsagePercent, fileUsagePercent, totalUsagePercent };
}

function getStatus(row) {
  const u = getUsage(row);
  if (row?.overDatabaseQuota || row?.overFileQuota || row?.overTotalQuota || u.totalUsagePercent > 100) return { label: "Over quota", tone: "danger" };
  if (u.totalUsagePercent >= 80) return { label: "Near limit", tone: "warning" };
  return { label: "Healthy", tone: "healthy" };
}

function StatusPill({ row }) {
  const status = getStatus(row);
  const Icon = status.tone === "danger" ? AlertTriangle : status.tone === "warning" ? Activity : CheckCircle2;
  return (
    <span className={`billing-status billing-status-${status.tone}`}>
      <Icon size={12} /> {status.label}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone = "blue" }) {
  return (
    <div className={`billing-metric billing-metric-${tone}`}>
      <div className="billing-metric-glow" />
      <div className="billing-metric-top">
        <div className="billing-metric-icon"><Icon size={17} /></div>
        <span>{label}</span>
      </div>
      <div className="billing-metric-value">{value}</div>
      <div className="billing-metric-detail">{detail}</div>
    </div>
  );
}

function ProgressTrack({ label, used, quota, percent, accent = "blue" }) {
  const p = clampPercent(percent);
  return (
    <div className="billing-progress-block">
      <div className="billing-progress-head">
        <span>{label}</span>
        <strong>{formatBytes(used)} <em>/ {formatBytes(quota)}</em></strong>
      </div>
      <div className="billing-progress-track">
        <div className={`billing-progress-fill billing-fill-${accent}`} style={{ width: `${p}%` }} />
      </div>
      <div className="billing-progress-foot"><span>{Number(percent || 0).toFixed(1)}% consumed</span><span>{formatBytes(Math.max(0, Number(quota || 0) - Number(used || 0)))} free</span></div>
    </div>
  );
}

function StorageTower({ row }) {
  const u = getUsage(row);
  const percent = clampPercent(u.totalUsagePercent);
  const dbShare = u.totalBytes > 0 ? (u.databaseBytes / u.totalBytes) * 100 : 0;
  const fileShare = u.totalBytes > 0 ? (u.fileBytes / u.totalBytes) * 100 : 0;
  return (
    <div className="storage-scene" aria-label={`Storage usage ${percent.toFixed(1)} percent`}>
      <div className="storage-orbit storage-orbit-a" />
      <div className="storage-orbit storage-orbit-b" />
      <div className="storage-floor" />
      <div className="storage-label storage-label-top"><span>CAPACITY</span><b>{formatBytes(u.totalQuotaBytes)}</b></div>
      <div className="storage-tower">
        <div className="tower-top" />
        <div className="tower-shell">
          <div className="tower-empty-glass" />
          <div className="tower-liquid" style={{ height: `${percent}%` }}>
            <div className="liquid-surface" />
            <div className="liquid-wave" />
            <div className="liquid-highlight" />
            <div className="storage-layer layer-db" style={{ height: `${Math.max(24, dbShare)}%` }}><span>DB</span></div>
            <div className="storage-layer layer-files" style={{ height: `${Math.max(24, fileShare)}%` }}><span>FILES</span></div>
          </div>
          <div className="tower-scan" />
          <div className="tower-reflection" />
        </div>
        <div className="tower-bottom" />
      </div>
      <div className="storage-center-readout"><strong>{percent.toFixed(1)}%</strong><span>USED</span></div>
      <div className="storage-label storage-label-bottom"><span>IN USE</span><b>{formatBytes(u.totalBytes)}</b></div>
    </div>
  );
}

function BreakdownVisual({ row }) {
  const u = getUsage(row);
  const db = u.totalQuotaBytes ? (u.databaseBytes / u.totalQuotaBytes) * 100 : 0;
  const files = u.totalQuotaBytes ? (u.fileBytes / u.totalQuotaBytes) * 100 : 0;
  const free = Math.max(0, 100 - db - files);
  return (
    <div className="breakdown-visual">
      <div className="breakdown-head"><span>Capacity composition</span><span>{formatBytes(u.totalQuotaBytes)} total quota</span></div>
      <div className="breakdown-stack">
        <div className="breakdown-segment breakdown-db" style={{ width: `${db}%` }}><span>DB</span></div>
        <div className="breakdown-segment breakdown-files" style={{ width: `${files}%` }}><span>FILES</span></div>
        <div className="breakdown-segment breakdown-free" style={{ width: `${free}%` }}><span>FREE</span></div>
      </div>
      <div className="breakdown-legend">
        <span><i className="dot dot-db" /> Database <b>{formatBytes(u.databaseBytes)}</b></span>
        <span><i className="dot dot-files" /> Files <b>{formatBytes(u.fileBytes)}</b></span>
        <span><i className="dot dot-free" /> Remaining <b>{formatBytes(Math.max(0, u.totalQuotaBytes - u.totalBytes))}</b></span>
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
    <div className="billing-modal-backdrop">
      <div className="quota-modal">
        <div className="quota-modal-head"><div><span className="eyebrow">TENANT POLICY</span><h3>Storage limits</h3><p>{tenant.tenant?.tenantName || "Tenant"} · {tenant.tenant?.tenantCode || ""}</p></div><button onClick={onClose}><X size={17} /></button></div>
        <div className="quota-modal-body">
          <div className="quota-note"><ShieldCheck size={16} /><span>These are application-level quotas. Changing them does not resize or pre-allocate the physical MySQL database.</span></div>
          <label>Database quota (GB)<input type="number" min="0" step="0.1" value={dbGB} onChange={(e) => setDbGB(e.target.value)} /><small>Current usage · {formatBytes(tenant.databaseBytes)}</small></label>
          <label>File storage quota (GB)<input type="number" min="0" step="0.1" value={fileGB} onChange={(e) => setFileGB(e.target.value)} /><small>Current usage · {formatBytes(tenant.fileBytes)}</small></label>
          {error && <div className="quota-error"><AlertTriangle size={14} />{error}</div>}
        </div>
        <div className="quota-modal-foot"><button className="ghost-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save limits"}</button></div>
      </div>
    </div>
  );
}

function TenantDetail({ row, onClose, onQuota }) {
  const u = getUsage(row);
  const tenant = row.tenant || {};
  const measured = row.storageMeasuredAt ? new Date(row.storageMeasuredAt).toLocaleString() : "Not measured yet";
  return (
    <div className="billing-detail-backdrop">
      <div className="billing-detail-panel">
        <div className="detail-header">
          <div className="detail-title-wrap">
            <button className="detail-back" onClick={onClose}><ChevronRight size={18} /></button>
            <div className="tenant-mark large">{(tenant.tenantCode || tenant.tenantName || "TN").slice(0, 2).toUpperCase()}</div>
            <div><span className="eyebrow">TENANT STORAGE / LIVE SNAPSHOT</span><h2>{tenant.tenantName || "Unknown tenant"}</h2><p>{tenant.tenantCode || "—"} <span>·</span> {row.databaseName || "Database unavailable"}</p></div>
          </div>
          <div className="detail-actions"><StatusPill row={row} /><button className="icon-btn" onClick={() => onQuota(row)} title="Manage quota"><Settings2 size={16} /></button><button className="icon-btn" onClick={onClose}><X size={16} /></button></div>
        </div>

        <div className="detail-grid">
          <section className="detail-hero-card">
            <div className="hero-copy"><span className="eyebrow">STORAGE CORE</span><h3>Tenant capacity</h3><p>Measured usage across the database and application-managed file storage.</p><div className="hero-total"><strong>{formatBytes(u.totalBytes)}</strong><span>of {formatBytes(u.totalQuotaBytes)} quota</span></div></div>
            <StorageTower row={row} />
          </section>

          <section className="detail-side-stack">
            <div className="detail-stat-row"><div className="detail-stat"><span><Database size={14} /> MySQL</span><strong>{formatBytes(u.databaseBytes)}</strong><small>{Number(u.databaseUsagePercent).toFixed(1)}% of DB quota</small></div><div className="detail-stat"><span><FileArchive size={14} /> Files</span><strong>{formatBytes(u.fileBytes)}</strong><small>{Number(u.fileUsagePercent).toFixed(1)}% of file quota</small></div></div>
            <div className="detail-panel-card"><div className="panel-card-title"><span>Quota utilization</span><CircleGauge size={15} /></div><ProgressTrack label="Database" used={u.databaseBytes} quota={u.databaseQuotaBytes} percent={u.databaseUsagePercent} accent="cyan" /><ProgressTrack label="File storage" used={u.fileBytes} quota={u.fileQuotaBytes} percent={u.fileUsagePercent} accent="violet" /><ProgressTrack label="Combined" used={u.totalBytes} quota={u.totalQuotaBytes} percent={u.totalUsagePercent} accent="blue" /></div>
            <div className="detail-panel-card"><div className="panel-card-title"><span>System snapshot</span><Server size={15} /></div><div className="snapshot-list"><div><span>Database</span><b>{row.databaseName || "—"}</b></div><div><span>Tenant ID</span><b>{row.tenantId || "—"}</b></div><div><span>Measured</span><b>{measured}</b></div></div></div>
          </section>
        </div>

        <div className="detail-bottom-grid">
          <section className="detail-panel-card"><div className="panel-card-title"><span>Storage breakup</span><Layers3 size={15} /></div><BreakdownVisual row={row} /></section>
          <section className="detail-panel-card technical-card"><div className="panel-card-title"><span>Capacity controls</span><ShieldCheck size={15} /></div><div className="technical-line"><span>Database quota</span><strong>{formatBytes(u.databaseQuotaBytes)}</strong></div><div className="technical-line"><span>File quota</span><strong>{formatBytes(u.fileQuotaBytes)}</strong></div><div className="technical-line"><span>Total quota</span><strong>{formatBytes(u.totalQuotaBytes)}</strong></div><button className="primary-btn full" onClick={() => onQuota(row)}><Settings2 size={14} /> Manage quotas</button></section>
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
  const [quotaTenant, setQuotaTenant] = useState(null);
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
      setSelected((current) => current ? (data.data || []).find((r) => r.tenantId === current.tenantId) || current : null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
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

  const filtered = useMemo(() => rows.filter((row) => `${row.tenant?.tenantName || ""} ${row.tenant?.tenantCode || ""} ${row.databaseName || ""}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const overLimit = rows.filter((r) => getStatus(r).tone === "danger").length;
  const totalUsagePercent = Number(totals?.totalQuotaBytes) ? (Number(totals?.totalBytes || 0) / Number(totals.totalQuotaBytes)) * 100 : 0;

  function mergeSaved(storage) {
    setRows((current) => {
      const next = current.map((r) => r.tenantId === storage.tenantId ? { ...r, ...storage, tenant: r.tenant } : r);
      const nextTotals = next.reduce((acc, row) => {
        const u = getUsage(row);
        acc.databaseBytes += u.databaseBytes;
        acc.fileBytes += u.fileBytes;
        acc.totalBytes += u.totalBytes;
        acc.databaseQuotaBytes += u.databaseQuotaBytes;
        acc.fileQuotaBytes += u.fileQuotaBytes;
        return acc;
      }, { databaseBytes: 0, fileBytes: 0, totalBytes: 0, databaseQuotaBytes: 0, fileQuotaBytes: 0 });
      nextTotals.totalQuotaBytes = nextTotals.databaseQuotaBytes + nextTotals.fileQuotaBytes;
      setTotals(nextTotals);
      setSelected((currentSelected) => currentSelected?.tenantId === storage.tenantId ? next.find((r) => r.tenantId === storage.tenantId) || currentSelected : currentSelected);
      return next;
    });
  }

  return (
    <div className="billing-page">
      <style>{`
        .billing-page{--ink:#172033;--muted:#64748b;--line:rgba(100,116,139,.16);--panel:#ffffff;--panel2:#f8fafc;--blue:#3b82f6;--cyan:#0891b2;--violet:#7c3aed;min-height:100%;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;position:relative;overflow:hidden;background:radial-gradient(circle at 78% 0%,rgba(59,130,246,.12),transparent 34%),linear-gradient(180deg,#f8fbff 0%,#f3f7fc 48%,#eef3f9 100%);border:1px solid rgba(148,163,184,.08);border-radius:24px;padding:26px;box-shadow:0 25px 80px rgba(30,64,175,.08)}
        .billing-page:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(to bottom,black,transparent 72%);pointer-events:none}
        .billing-page *{box-sizing:border-box}.billing-top{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:22px}.billing-kicker,.eyebrow{font-size:9px;letter-spacing:.16em;font-weight:800;color:#6f8199}.billing-title{font-size:27px;line-height:1.05;font-weight:750;letter-spacing:-.035em;margin:7px 0 6px;color:#172033}.billing-subtitle{font-size:11px;color:#64748b;max-width:650px}.primary-btn,.ghost-btn,.icon-btn{border:0;cursor:pointer;transition:.2s ease}.primary-btn{height:38px;padding:0 14px;border-radius:11px;background:linear-gradient(135deg,#4b8bff,#3974e9);color:#fff;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-size:11px;font-weight:750;box-shadow:0 9px 26px rgba(55,115,235,.25)}.primary-btn:hover{transform:translateY(-1px);filter:brightness(1.06)}.primary-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}.ghost-btn{height:38px;padding:0 14px;border-radius:11px;background:rgba(226,232,240,.72);color:#475569;font-size:11px;font-weight:700}.ghost-btn:hover{background:rgba(226,232,240,.95)}
        .billing-actions{display:flex;gap:9px;align-items:center}.refresh-btn{min-width:126px}.billing-alert{position:relative;z-index:1;margin-bottom:14px;padding:11px 13px;border:1px solid rgba(248,113,113,.2);background:rgba(127,29,29,.18);color:#fca5a5;border-radius:12px;font-size:11px;font-weight:650;display:flex;gap:8px;align-items:center}
        .billing-metrics{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin-bottom:17px}.billing-metric{position:relative;overflow:hidden;min-height:122px;border:1px solid var(--line);border-radius:16px;background:linear-gradient(145deg,#ffffff,#f7faff);padding:15px;box-shadow:0 15px 40px rgba(0,0,0,.12)}.billing-metric-glow{position:absolute;width:100px;height:100px;border-radius:50%;right:-35px;top:-50px;filter:blur(4px);opacity:.22}.billing-metric-blue .billing-metric-glow{background:#3b82f6}.billing-metric-violet .billing-metric-glow{background:#8b5cf6}.billing-metric-cyan .billing-metric-glow{background:#06b6d4}.billing-metric-amber .billing-metric-glow{background:#f59e0b}.billing-metric-top{display:flex;align-items:center;gap:8px;color:#7889a0;font-size:9px;font-weight:750;text-transform:uppercase;letter-spacing:.08em}.billing-metric-icon{width:31px;height:31px;border:1px solid rgba(148,163,184,.13);border-radius:9px;display:grid;place-items:center;background:rgba(255,255,255,.035);color:#8cb4ff}.billing-metric-violet .billing-metric-icon{color:#b19cff}.billing-metric-cyan .billing-metric-icon{color:#62e5ff}.billing-metric-amber .billing-metric-icon{color:#ffd37b}.billing-metric-value{font-size:23px;font-weight:760;letter-spacing:-.035em;margin-top:11px;color:#172033;font-variant-numeric:tabular-nums}.billing-metric-detail{font-size:9px;color:#718096;margin-top:3px}
        .billing-workspace{position:relative;z-index:1;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.88);box-shadow:0 20px 60px rgba(30,64,175,.07);overflow:hidden}.workspace-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 17px;border-bottom:1px solid var(--line)}.workspace-title{font-size:12px;font-weight:750;color:#1e293b}.workspace-meta{font-size:9px;color:#718096;margin-top:3px}.search-wrap{width:220px;position:relative}.search-wrap svg{position:absolute;left:10px;top:9px;color:#5f7088}.search-wrap input{width:100%;height:31px;border:1px solid rgba(148,163,184,.14);border-radius:9px;outline:0;background:#ffffff;color:#172033;padding:0 10px 0 29px;font-size:10px}.search-wrap input:focus{border-color:rgba(79,140,255,.55);box-shadow:0 0 0 3px rgba(79,140,255,.08)}
        .tenant-row{display:grid;grid-template-columns:minmax(210px,1.35fr) minmax(280px,2fr) 108px 42px;align-items:center;gap:16px;padding:16px 17px;border-bottom:1px solid rgba(148,163,184,.08);transition:.22s ease}.tenant-row:last-child{border-bottom:0}.tenant-row:hover{background:linear-gradient(90deg,rgba(79,140,255,.045),transparent)}.tenant-identity{display:flex;align-items:center;gap:11px;min-width:0}.tenant-mark{width:38px;height:38px;flex:none;border-radius:11px;display:grid;place-items:center;color:#2563eb;font-size:10px;font-weight:850;background:linear-gradient(145deg,#e7f0ff,#dbeafe);border:1px solid rgba(89,147,255,.23);box-shadow:inset 0 1px rgba(255,255,255,.06)}.tenant-mark.large{width:46px;height:46px;border-radius:13px}.tenant-name{font-size:12px;font-weight:750;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tenant-code{font-size:9px;color:#718096;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;margin-top:3px}.tenant-db{font-size:9px;color:#64748b;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tenant-db b{color:#475569;font-weight:600}.tenant-progresses{display:grid;gap:8px}.billing-progress-block{min-width:0}.billing-progress-head{display:flex;justify-content:space-between;gap:10px;align-items:center;font-size:9px;color:#74859c}.billing-progress-head strong{font-weight:700;color:#334155;white-space:nowrap}.billing-progress-head em{font-style:normal;color:#586a82;font-weight:500}.billing-progress-track{height:5px;margin-top:6px;border-radius:20px;background:#e8eef6;overflow:hidden;position:relative}.billing-progress-fill{height:100%;border-radius:20px;position:relative;box-shadow:0 0 12px currentColor}.billing-fill-blue{background:#4f8cff;color:#4f8cff}.billing-fill-cyan{background:#25d8ff;color:#25d8ff}.billing-fill-violet{background:#8b7cff;color:#8b7cff}.billing-progress-foot{display:flex;justify-content:space-between;margin-top:3px;font-size:8px;color:#64748b}.tenant-status{text-align:left}.billing-status{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 8px;font-size:8px;font-weight:800;white-space:nowrap;border:1px solid transparent}.billing-status-healthy{color:#67e1a1;background:rgba(16,185,129,.08);border-color:rgba(16,185,129,.15)}.billing-status-warning{color:#ffd276;background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.15)}.billing-status-danger{color:#ff8d8d;background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.15)}.row-arrow{width:34px;height:34px;border-radius:10px;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.78);color:#64748b;display:grid;place-items:center;cursor:pointer;transition:.2s}.row-arrow:hover{color:#2563eb;border-color:rgba(79,140,255,.35);background:rgba(59,130,246,.08);transform:translateX(2px)}.workspace-empty{padding:52px;text-align:center;color:#687a91;font-size:11px}.workspace-loading{display:grid;gap:8px;padding:15px}.skeleton{height:70px;border-radius:11px;background:linear-gradient(90deg,#eef3f8,#dfe8f2,#eef3f8);background-size:200% 100%;animation:billing-shimmer 1.3s infinite}@keyframes billing-shimmer{to{background-position:-200% 0}}
        .billing-footnote{position:relative;z-index:1;margin:11px 3px 0;font-size:9px;color:#51637a;display:flex;gap:7px;align-items:center}.billing-footnote svg{color:#61738b}
        .billing-detail-backdrop{position:fixed;inset:0;z-index:80;background:rgba(15,23,42,.34);backdrop-filter:blur(14px);display:flex;align-items:stretch;justify-content:flex-end}.billing-detail-panel{width:min(1120px,100%);height:100%;overflow:auto;background:radial-gradient(circle at 80% 0%,rgba(59,130,246,.12),transparent 35%),#f7faff;border-left:1px solid rgba(148,163,184,.14);box-shadow:-30px 0 100px rgba(0,0,0,.4);animation:detail-in .35s cubic-bezier(.2,.8,.2,1)}@keyframes detail-in{from{transform:translateX(35px);opacity:.4}to{transform:none;opacity:1}}.detail-header{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 22px;border-bottom:1px solid var(--line);background:rgba(255,255,255,.86);backdrop-filter:blur(18px)}.detail-title-wrap{display:flex;align-items:center;gap:12px;min-width:0}.detail-back{width:34px;height:34px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.78);color:#64748b;display:grid;place-items:center;cursor:pointer}.detail-back svg{transform:rotate(180deg)}.detail-header h2{font-size:18px;margin:4px 0 3px;letter-spacing:-.025em}.detail-header p{font-size:9px;color:#667991}.detail-header p span{margin:0 5px;color:#35465b}.detail-actions{display:flex;align-items:center;gap:7px}.icon-btn{width:34px;height:34px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.78);color:#8494aa;display:grid;place-items:center}.icon-btn:hover{background:rgba(255,255,255,.06);color:#fff}.detail-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(320px,.7fr);gap:13px;padding:18px}.detail-hero-card,.detail-panel-card,.detail-stat{border:1px solid var(--line);background:linear-gradient(145deg,#ffffff,#f5f8fc);border-radius:17px;box-shadow:0 18px 50px rgba(30,64,175,.08)}.detail-hero-card{min-height:510px;position:relative;overflow:hidden;padding:21px}.detail-hero-card:after{content:"";position:absolute;width:300px;height:300px;right:-100px;top:-120px;border-radius:50%;background:rgba(37,216,255,.055);filter:blur(20px)}.hero-copy{position:relative;z-index:2;max-width:370px}.hero-copy h3{font-size:23px;letter-spacing:-.035em;margin:6px 0 7px}.hero-copy p{font-size:10px;line-height:1.55;color:#718299;max-width:330px}.hero-total{margin-top:16px;display:flex;align-items:baseline;gap:7px}.hero-total strong{font-size:21px;letter-spacing:-.03em}.hero-total span{font-size:9px;color:#63758c}.detail-side-stack{display:grid;gap:11px}.detail-stat-row{display:grid;grid-template-columns:1fr 1fr;gap:11px}.detail-stat{padding:15px}.detail-stat span{display:flex;align-items:center;gap:6px;color:#7e90a8;font-size:9px;font-weight:700}.detail-stat span svg{color:#55dffb}.detail-stat:nth-child(2) span svg{color:#a99aff}.detail-stat strong{display:block;font-size:19px;margin-top:11px;letter-spacing:-.025em}.detail-stat small{display:block;color:#5e7189;font-size:8px;margin-top:4px}.detail-panel-card{padding:16px}.panel-card-title{display:flex;justify-content:space-between;align-items:center;color:#b9c7d9;font-size:10px;font-weight:750;margin-bottom:14px}.panel-card-title svg{color:#657990}.snapshot-list{display:grid;gap:10px}.snapshot-list div,.technical-line{display:flex;align-items:center;justify-content:space-between;gap:15px;padding-bottom:9px;border-bottom:1px solid rgba(148,163,184,.08);font-size:9px}.snapshot-list div:last-child,.technical-line:last-of-type{border-bottom:0;padding-bottom:0}.snapshot-list span,.technical-line span{color:#60728a}.snapshot-list b,.technical-line strong{color:#c9d5e5;font-weight:650;text-align:right;max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.detail-bottom-grid{display:grid;grid-template-columns:1.3fr .7fr;gap:13px;padding:0 18px 20px}.technical-card{display:flex;flex-direction:column}.technical-line{padding:10px 0}.primary-btn.full{width:100%;margin-top:14px}
        .storage-scene{position:absolute;inset:100px 20px 0;display:flex;align-items:center;justify-content:center;min-height:380px;perspective:1000px}.storage-floor{position:absolute;width:300px;height:70px;border-radius:50%;bottom:10px;background:radial-gradient(ellipse,rgba(37,216,255,.18),rgba(37,216,255,.02) 55%,transparent 72%);filter:blur(5px)}.storage-orbit{position:absolute;border:1px solid rgba(91,156,255,.13);border-radius:50%;transform:rotateX(67deg) rotateZ(-18deg);pointer-events:none}.storage-orbit-a{width:390px;height:155px;animation:orbit-spin 12s linear infinite}.storage-orbit-b{width:320px;height:125px;border-color:rgba(37,216,255,.09);transform:rotateX(68deg) rotateZ(35deg);animation:orbit-spin 17s linear infinite reverse}@keyframes orbit-spin{to{transform:rotateX(67deg) rotateZ(342deg)}}.storage-tower{position:relative;width:184px;height:320px;transform:rotateY(-9deg) rotateX(2deg);filter:drop-shadow(0 28px 25px rgba(0,0,0,.45));z-index:3}.tower-top,.tower-bottom{position:absolute;left:0;width:184px;height:44px;border-radius:50%;z-index:5}.tower-top{top:0;background:radial-gradient(ellipse at 50% 45%,#182b40 0%,#0c1828 57%,#050b13 100%);border:1px solid rgba(149,189,226,.14);box-shadow:inset 0 3px 9px rgba(255,255,255,.05)}.tower-bottom{bottom:0;background:linear-gradient(180deg,#26364b,#101a29);border:1px solid rgba(149,189,226,.1)}.tower-shell{position:absolute;left:1px;right:1px;top:20px;bottom:20px;border-radius:0 0 50% 50% / 0 0 18px 18px;overflow:hidden;background:linear-gradient(90deg,#07101b,#17263a 12%,#0a1524 28%,#1b2b40 50%,#0a1422 72%,#17263a 89%,#050c14);border-left:1px solid rgba(180,211,239,.14);border-right:1px solid rgba(180,211,239,.09);box-shadow:inset 18px 0 25px rgba(255,255,255,.025),inset -18px 0 25px rgba(0,0,0,.22)}.tower-empty-glass{position:absolute;inset:0;background:linear-gradient(90deg,transparent 8%,rgba(132,190,236,.05) 21%,transparent 34%,rgba(255,255,255,.035) 49%,transparent 62%,rgba(106,157,207,.04) 80%,transparent 92%)}.tower-liquid{position:absolute;left:0;right:0;bottom:0;min-height:4px;background:linear-gradient(90deg,#0b4b79,#0e91bd 30%,#2b75e9 52%,#704bd5 76%,#9e4fc8);border-top:1px solid rgba(117,231,255,.8);box-shadow:0 -4px 18px rgba(37,216,255,.18),inset 0 10px 18px rgba(255,255,255,.05);transition:height 1.15s cubic-bezier(.2,.8,.2,1);animation:liquid-breathe 3.2s ease-in-out infinite}@keyframes liquid-breathe{50%{filter:brightness(1.08)}}.liquid-surface{position:absolute;top:-9px;left:-3%;width:106%;height:18px;border-radius:50%;background:radial-gradient(ellipse at 50% 45%,rgba(98,239,255,.85),rgba(42,128,226,.35) 50%,transparent 72%);box-shadow:0 0 18px rgba(37,216,255,.35)}.liquid-wave{position:absolute;top:-2px;left:-20%;width:140%;height:8px;border-radius:50%;border-top:2px solid rgba(255,255,255,.22);animation:wave 4s ease-in-out infinite}@keyframes wave{50%{transform:translateX(12px)}}.liquid-highlight{position:absolute;inset:0;background:linear-gradient(90deg,transparent 14%,rgba(255,255,255,.12) 24%,transparent 34%,transparent 66%,rgba(255,255,255,.05) 76%,transparent 86%);mix-blend-mode:screen}.storage-layer{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;min-height:28px;border-top:1px solid rgba(255,255,255,.12);font-size:7px;font-weight:850;letter-spacing:.13em;color:rgba(255,255,255,.7);text-shadow:0 1px 5px rgba(0,0,0,.4)}.layer-db{background:linear-gradient(180deg,rgba(57,223,255,.42),rgba(25,125,213,.3))}.layer-files{background:linear-gradient(180deg,rgba(137,111,255,.5),rgba(106,64,189,.32));bottom:0}.layer-db{bottom:0}.layer-files{bottom:0;opacity:.82}.tower-scan{position:absolute;left:8%;right:8%;height:1px;background:linear-gradient(90deg,transparent,#70eaff,transparent);box-shadow:0 0 9px #38dcff;animation:scan 3.8s ease-in-out infinite;z-index:7}@keyframes scan{0%,100%{top:16%}50%{top:82%}}.tower-reflection{position:absolute;top:0;bottom:0;left:17%;width:18%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);transform:skewX(-5deg)}.storage-center-readout{position:absolute;z-index:8;top:48%;left:50%;transform:translate(-50%,-50%);text-align:center;text-shadow:0 3px 15px #000}.storage-center-readout strong{display:block;font-size:27px;letter-spacing:-.04em;color:#172033}.storage-center-readout span{font-size:7px;letter-spacing:.22em;color:#64748b}.storage-label{position:absolute;z-index:9;display:flex;flex-direction:column;gap:3px}.storage-label span{font-size:7px;letter-spacing:.17em;color:#64748b;font-weight:800}.storage-label b{font-size:10px;color:#334155}.storage-label-top{top:22px;right:18px;text-align:right}.storage-label-bottom{bottom:35px;left:18px}.storage-label-bottom b{color:#68dffb}
        .breakdown-visual{margin-top:3px}.breakdown-head{display:flex;justify-content:space-between;gap:10px;color:#64768e;font-size:8px;margin-bottom:10px}.breakdown-stack{height:30px;display:flex;overflow:hidden;border-radius:9px;background:#e2e8f0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.04)}.breakdown-segment{height:100%;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:850;letter-spacing:.1em;min-width:0;transition:width .8s}.breakdown-db{background:linear-gradient(90deg,#087b9f,#2bdcf4);color:#d8fbff}.breakdown-files{background:linear-gradient(90deg,#6548c8,#9a7dff);color:#eee9ff}.breakdown-free{background:linear-gradient(90deg,#cbd5e1,#e2e8f0);color:#64748b}.breakdown-legend{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.breakdown-legend span{display:flex;align-items:center;gap:6px;font-size:8px;color:#64768e}.breakdown-legend b{margin-left:auto;color:#bac7d8}.dot{width:6px;height:6px;border-radius:50%;display:inline-block}.dot-db{background:#2bdcf4;box-shadow:0 0 8px #2bdcf4}.dot-files{background:#9a7dff;box-shadow:0 0 8px #9a7dff}.dot-free{background:#42556c}
        .billing-modal-backdrop{position:fixed;inset:0;z-index:100;background:rgba(15,23,42,.34);backdrop-filter:blur(12px);display:grid;place-items:center;padding:20px}.quota-modal{width:min(440px,100%);border:1px solid rgba(148,163,184,.15);border-radius:18px;background:#ffffff;box-shadow:0 30px 100px rgba(0,0,0,.55);overflow:hidden}.quota-modal-head{display:flex;justify-content:space-between;gap:12px;padding:18px 19px;border-bottom:1px solid var(--line)}.quota-modal-head h3{margin:5px 0 3px;font-size:17px}.quota-modal-head p{font-size:9px;color:#63758d}.quota-modal-head button{width:31px;height:31px;border:0;border-radius:9px;background:rgba(255,255,255,.04);color:#64748b;cursor:pointer}.quota-modal-body{padding:18px}.quota-note{display:flex;gap:8px;padding:10px;border:1px solid rgba(79,140,255,.14);background:rgba(79,140,255,.06);border-radius:11px;color:#52657d;font-size:9px;line-height:1.5;margin-bottom:16px}.quota-note svg{color:#66a0ff;flex:none;margin-top:1px}.quota-modal-body label{display:block;color:#64748b;font-size:9px;font-weight:750;margin-top:13px}.quota-modal-body input{display:block;width:100%;height:40px;margin-top:7px;border-radius:10px;border:1px solid rgba(148,163,184,.14);background:#f8fafc;color:#172033;outline:0;padding:0 11px;font-size:11px}.quota-modal-body input:focus{border-color:rgba(79,140,255,.55);box-shadow:0 0 0 3px rgba(79,140,255,.08)}.quota-modal-body small{display:block;color:#64748b;font-size:8px;margin-top:5px}.quota-error{display:flex;align-items:center;gap:7px;color:#ff9a9a;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.15);padding:9px;border-radius:9px;font-size:9px;margin-top:13px}.quota-modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:14px 18px;background:#f8fafc;border-top:1px solid var(--line)}
        @media(max-width:980px){.billing-metrics{grid-template-columns:repeat(2,1fr)}.tenant-row{grid-template-columns:minmax(190px,1fr) minmax(230px,1.4fr) 95px 38px}.detail-grid,.detail-bottom-grid{grid-template-columns:1fr}.detail-hero-card{min-height:570px}.detail-side-stack{grid-template-columns:1fr 1fr;align-content:start}.detail-stat-row{grid-template-columns:1fr}.detail-side-stack .detail-panel-card:last-child{grid-column:1/-1}}
        @media(max-width:720px){.billing-page{padding:16px;border-radius:18px}.billing-top{align-items:flex-start;flex-direction:column}.billing-title{font-size:23px}.billing-actions{width:100%}.refresh-btn{flex:1}.billing-metrics{grid-template-columns:1fr 1fr}.workspace-head{align-items:flex-start;flex-direction:column}.search-wrap{width:100%}.tenant-row{grid-template-columns:1fr;gap:11px}.tenant-status{position:absolute;right:17px}.tenant-row{position:relative}.row-arrow{display:none}.detail-header{padding:14px;align-items:flex-start}.detail-title-wrap{align-items:flex-start}.detail-actions .billing-status{display:none}.detail-grid{padding:12px}.detail-bottom-grid{padding:0 12px 14px}.detail-side-stack{grid-template-columns:1fr}.detail-hero-card{min-height:570px}.storage-scene{inset:120px 0 0}.storage-label-top{right:0}.storage-label-bottom{left:0}.breakdown-legend{grid-template-columns:1fr}.billing-detail-panel{width:100%}}
        @media(prefers-reduced-motion:reduce){.storage-orbit,.tower-scan,.liquid-wave,.billing-shimmer,.billing-detail-panel{animation:none!important}.billing-progress-fill,.tower-liquid{transition:none!important}}
      `}</style>

      <div className="billing-top">
        <div><div className="billing-kicker">INFRASTRUCTURE / BILLING</div><h1 className="billing-title">Storage command center</h1><p className="billing-subtitle">A live operational view of tenant database and application-managed storage. Quotas are controls; usage is measured from the real backend.</p></div>
        <div className="billing-actions"><button className="primary-btn refresh-btn" disabled={refreshing} onClick={refreshUsage}><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Measuring…" : "Refresh usage"}</button></div>
      </div>

      {error && <div className="billing-alert"><AlertTriangle size={14} />{error}</div>}

      <div className="billing-metrics">
        <MetricCard icon={Database} label="MySQL footprint" value={formatBytes(totals?.databaseBytes)} detail="Data + indexes across tenants" tone="blue" />
        <MetricCard icon={HardDrive} label="File storage" value={formatBytes(totals?.fileBytes)} detail="Application-managed files" tone="violet" />
        <MetricCard icon={CircleGauge} label="Fleet utilization" value={`${totalUsagePercent.toFixed(1)}%`} detail={`${formatBytes(totals?.totalBytes)} of ${formatBytes(totals?.totalQuotaBytes)}`} tone="cyan" />
        <MetricCard icon={ShieldCheck} label="Policy health" value={`${overLimit} flagged`} detail={overLimit ? "Tenant quota needs attention" : "All tenants within limits"} tone={overLimit ? "amber" : "cyan"} />
      </div>

      <section className="billing-workspace">
        <div className="workspace-head"><div><div className="workspace-title">Tenant storage inventory</div><div className="workspace-meta">Select a tenant to open its full storage command view.</div></div><div className="search-wrap"><Search size={13} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tenant or database…" /></div></div>
        {loading ? <div className="workspace-loading">{[1,2,3].map((i) => <div className="skeleton" key={i} />)}</div> : filtered.length === 0 ? <div className="workspace-empty">No tenant storage records found.</div> : filtered.map((row) => {
          const tenant = row.tenant || {};
          const u = getUsage(row);
          return <div className="tenant-row" key={row.tenantId}>
            <div className="tenant-identity"><div className="tenant-mark">{(tenant.tenantCode || tenant.tenantName || "TN").slice(0,2).toUpperCase()}</div><div style={{minWidth:0}}><div className="tenant-name">{tenant.tenantName || "Unknown tenant"}</div><div className="tenant-code">{tenant.tenantCode || "—"}</div><div className="tenant-db">DB <b>{row.databaseName || "Not available"}</b></div></div></div>
            <div className="tenant-progresses"><ProgressTrack label="Database" used={u.databaseBytes} quota={u.databaseQuotaBytes} percent={u.databaseUsagePercent} accent="cyan" /><ProgressTrack label="Files" used={u.fileBytes} quota={u.fileQuotaBytes} percent={u.fileUsagePercent} accent="violet" /></div>
            <div className="tenant-status"><StatusPill row={row} /></div>
            <button className="row-arrow" onClick={() => setSelected(row)} title="View storage breakdown"><ChevronRight size={16} /></button>
          </div>;
        })}
      </section>

      <div className="billing-footnote"><ShieldCheck size={12} /> Increasing a quota changes the application limit only; it does not allocate empty space inside MySQL.</div>

      {selected && <TenantDetail row={selected} onClose={() => setSelected(null)} onQuota={(row) => setQuotaTenant(row)} />}
      {quotaTenant && <QuotaModal tenant={quotaTenant} onClose={() => setQuotaTenant(null)} onSaved={(storage) => { mergeSaved(storage); setQuotaTenant(null); }} />}
    </div>
  );
}
