import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Layers,
  Factory,
  RefreshCw,
  Landmark,
  CheckCircle2,
  ArrowUp,
  ArrowRight,
  AlertCircle,
  MoreVertical,
  Eye,
  Copy,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Zap,
  Folder,
  Activity,
  Loader2,
} from "lucide-react";
import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;

/* ------------------------------------------------------------------ */
/* Animations (scoped, respects prefers-reduced-motion)                */
/* ------------------------------------------------------------------ */
const CSS = `
@keyframes bm-fade-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes bm-slide-in{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
@keyframes bm-pop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes bm-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes bm-donut{from{stroke-dasharray:0 var(--c)}}
@keyframes bm-bar{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes bm-spin{to{transform:rotate(360deg)}}
@keyframes bm-sweep{0%{transform:translateX(-120%)}100%{transform:translateX(260%)}}
@keyframes bm-glow{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:.85;transform:scale(1.08)}}
@keyframes bm-ring{0%{box-shadow:0 0 0 0 rgba(249,115,22,.4)}100%{box-shadow:0 0 0 12px rgba(249,115,22,0)}}
.bm-in{animation:bm-fade-up .7s cubic-bezier(.22,1,.36,1) backwards}
.bm-slide{animation:bm-slide-in .55s cubic-bezier(.22,1,.36,1) backwards}
.bm-pop{animation:bm-pop .5s cubic-bezier(.22,1,.36,1) backwards}
.bm-float{animation:bm-float 5.5s ease-in-out infinite}
.bm-donut-seg{animation:bm-donut 1.1s cubic-bezier(.22,1,.36,1) backwards}
.bm-bar{transform-origin:bottom;animation:bm-bar .8s cubic-bezier(.22,1,.36,1) backwards}
.bm-spin{animation:bm-spin 1.4s linear infinite}
.bm-sweep{animation:bm-sweep 6s ease-in-out 1.2s infinite}
.bm-glow{animation:bm-glow 5s ease-in-out infinite}
.bm-pulse{animation:bm-ring 1.9s ease-out infinite}
@media (prefers-reduced-motion:reduce){
  .bm-in,.bm-slide,.bm-pop,.bm-float,.bm-donut-seg,.bm-bar,.bm-spin,.bm-sweep,.bm-glow,.bm-pulse{animation:none!important}
}
`;

const CARD =
  "rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1A2433]";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const authHeaders = () => {
  const token = localStorage.getItem("accessToken") || "";
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const nameOf = (v) => (typeof v === "string" ? v : v?.name || v?.code || v?.title || null);

function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
const fmtDate = (v) => {
  const d = toDate(v);
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—";
};

const getName = (d) => d?.originalFileName || d?.fileName || d?.name || "Untitled document";
const getType = (d) =>
  nameOf(d?.DocumentType) || nameOf(d?.documentType) || d?.documentTypeName || d?.type || "—";
const getDate = (d) => d?.createdAt || d?.uploadedAt || d?.updatedAt || null;

function getFileBadge(name) {
  const l = String(name).toLowerCase();
  if (l.endsWith(".pdf")) return { t: "PDF", c: "bg-red-500 text-white" };
  if (/\.(xlsx|xls|csv)$/.test(l)) return { t: "XLS", c: "bg-emerald-600 text-white" };
  if (/\.(docx|doc)$/.test(l)) return { t: "DOC", c: "bg-blue-500 text-white" };
  if (/\.(jpg|jpeg|png)$/.test(l)) return { t: "IMG", c: "bg-violet-500 text-white" };
  return { t: "FILE", c: "bg-slate-500 text-white" };
}

function StatusPill({ status }) {
  const base = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-semibold";
  switch (status) {
    case "COMPLETED":
      return (
        <span className={`${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300`}>
          <CheckCircle2 size={14} className="text-emerald-600" /> Completed
        </span>
      );
    case "PROCESSING":
      return (
        <span className={`${base} bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300`}>
          <span className="bm-spin inline-block h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent" /> Processing
        </span>
      );
    case "FAILED":
      return (
        <span className={`${base} bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300`}>
          <AlertCircle size={13} /> Failed
        </span>
      );
    case "UPLOADED":
      return <span className={`${base} bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300`}>Uploaded</span>;
    default:
      return <span className={`${base} bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300`}>{status || "—"}</span>;
  }
}

/* count-up */
function useCountUp(target, loading, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (loading) {
      setVal(0);
      return undefined;
    }
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !target) {
      setVal(target || 0);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, loading, duration]);
  return val;
}
function CountUp({ value, loading }) {
  return <>{useCountUp(value, loading)}</>;
}

/* ------------------------------------------------------------------ */
/* Hero illustration (building + folder + shield)                      */
/* ------------------------------------------------------------------ */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 300 130" className="h-full w-auto" aria-hidden="true">
      <defs>
        <linearGradient id="bmB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#93C5FD" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="bmF" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#60A5FA" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="bmS" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60A5FA" />
          <stop offset="1" stopColor="#1E40AF" />
        </linearGradient>
      </defs>
      <path d="M96 20l60-12v110H96z" fill="#BFDBFE" />
      <path d="M156 8l50 10v100h-50z" fill="url(#bmB)" />
      {[28, 44, 60, 76, 92].map((y) => (
        <g key={y}>
          <rect x="106" y={y} width="38" height="7" rx="2" fill="#fff" opacity=".85" />
          <rect x="166" y={y - 4} width="30" height="7" rx="2" fill="#fff" opacity=".7" />
        </g>
      ))}
      <path d="M40 78a8 8 0 0 1 8-8h34l9 9h56a8 8 0 0 1 8 8v36a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8z" fill="url(#bmF)" />
      <path d="M230 40l32 12v28c0 20-13 33-32 42-19-9-32-22-32-42V52z" fill="#fff" />
      <path d="M230 48l25 9v22c0 15-10 26-25 33-15-7-25-18-25-33V57z" fill="url(#bmS)" />
      <path d="M218 80l9 9 17-19" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */
const KPI = {
  blue: { bar: "bg-blue-500", tile: "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300" },
  purple: { bar: "bg-violet-500", tile: "bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300" },
  green: { bar: "bg-emerald-500", tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300" },
  orange: { bar: "bg-orange-400", tile: "bg-orange-50 text-orange-500 dark:bg-orange-500/20 dark:text-orange-300" },
};

function StatCard({ icon, label, value, sub, bad, subIcon, theme, loading, delay, onClick, spin }) {
  const t = KPI[theme];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`bm-in group relative w-full overflow-hidden p-4 pl-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-lg ${CARD}`}
    >
      <span className={`absolute inset-y-0 left-0 w-[5px] ${t.bar}`} />
      <div className="flex items-start gap-4">
        <div className={`flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 ${t.tile}`}>
          <span className={spin ? "bm-spin-slow" : ""}>{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-bold text-slate-900 dark:text-white">{label}</div>
          {loading ? (
            <div className="mt-1 h-9 w-14 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
          ) : (
            <div className="text-[34px] font-extrabold leading-tight text-slate-900 dark:text-white">
              <CountUp value={value} loading={loading} />
            </div>
          )}
          {!loading && (
            <div className={`mt-0.5 flex items-center gap-1.5 text-[14px] font-semibold ${bad ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${bad ? "bg-rose-500" : "bg-emerald-500"}`}>{subIcon}</span>
              {sub}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function CardHead({ icon, title, sub, right }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          {icon}
        </span>
        <div>
          <h2 className="text-[17px] font-bold leading-tight text-slate-900 dark:text-white">{title}</h2>
          {sub && <p className="mt-0.5 text-[12.5px] text-slate-500 dark:text-slate-400">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Document status donut                                               */
/* ------------------------------------------------------------------ */
function StatusCard({ completed, processing, failed, total, loading, delay }) {
  const [hover, setHover] = useState(null);
  const R = 52;
  const C = 2 * Math.PI * R;
  const other = Math.max(total - completed - processing - failed, 0);

  const items = [
    { key: "Completed", count: completed, color: "#16A34A" },
    { key: "Processing", count: processing, color: "#2563EB" },
    { key: "Failed", count: failed, color: "#EF4444" },
    ...(other > 0 ? [{ key: "Other", count: other, color: "#CBD5E1" }] : []),
  ];

  const segments = useMemo(() => {
    if (!total) return [];
    const visible = items.filter((i) => i.count > 0);
    let acc = 0;
    return visible.map((s) => {
      const full = (s.count / total) * C;
      const gap = visible.length > 1 ? 3 : 0;
      const seg = { ...s, len: Math.max(full - gap, 0.5), offset: -acc };
      acc += full;
      return seg;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, processing, failed, total, C]);

  return (
    <div style={{ animationDelay: `${delay}ms` }} className={`bm-in ${CARD} p-5`}>
      <CardHead icon={<BadgeCheck size={22} />} title="Document Status" />
      {loading ? (
        <div className="mt-5 flex items-center gap-6">
          <div className="h-[140px] w-[140px] animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
          <div className="flex-1 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />)}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-5">
          <div className="relative h-[142px] w-[142px] shrink-0">
            <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
              <circle cx="70" cy="70" r={R} fill="none" stroke="currentColor" strokeWidth="16" className="text-slate-100 dark:text-slate-700" />
              {segments.map((s, i) => (
                <circle
                  key={s.key}
                  cx="70" cy="70" r={R} fill="none" stroke={s.color}
                  strokeWidth={hover === s.key ? 20 : 16}
                  strokeDasharray={`${s.len} ${C - s.len}`}
                  strokeDashoffset={s.offset}
                  className="bm-donut-seg cursor-pointer"
                  style={{ "--c": C, animationDelay: `${400 + i * 160}ms`, transition: "stroke-width .2s ease" }}
                  onMouseEnter={() => setHover(s.key)}
                  onMouseLeave={() => setHover(null)}
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-[22px] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-sm dark:bg-[#1A2433]">
              <span className="text-[30px] font-extrabold leading-none text-slate-900 dark:text-white">
                <CountUp value={total} loading={loading} />
              </span>
              <span className="mt-1 text-[14px] text-slate-600 dark:text-slate-300">Total</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {items.map((s, i) => (
              <div
                key={s.key}
                onMouseEnter={() => setHover(s.key)}
                onMouseLeave={() => setHover(null)}
                style={{ animationDelay: `${500 + i * 100}ms` }}
                className={`bm-slide flex items-center gap-2.5 border-b border-slate-100 py-3 text-[14px] transition-colors last:border-0 dark:border-slate-700/60 ${hover === s.key ? "bg-slate-50 dark:bg-white/5" : ""}`}
              >
                <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 text-slate-800 dark:text-slate-100">{s.key}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quick action                                                        */
/* ------------------------------------------------------------------ */
const QA = {
  blue: { bg: "bg-blue-50/80 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20", ic: "text-blue-600" },
  green: { bg: "bg-emerald-50/80 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20", ic: "text-emerald-600" },
  orange: { bg: "bg-orange-50/80 border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20", ic: "text-orange-500" },
  purple: { bg: "bg-violet-50/80 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20", ic: "text-violet-600" },
};
function QuickAction({ icon, label, tone, delay, onClick }) {
  const t = QA[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`bm-pop group flex items-center gap-3 rounded-xl border p-3 text-left transition duration-300 hover:-translate-y-1 hover:shadow-md ${t.bg}`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm transition-transform duration-300 group-hover:scale-110 dark:bg-white/10 ${t.ic}`}>
        {icon}
      </span>
      <span className="flex-1 text-[14px] font-bold leading-tight text-slate-900 dark:text-white">{label}</span>
      <ArrowRight size={18} className="shrink-0 text-slate-900 transition-transform duration-300 group-hover:translate-x-1 dark:text-white" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
export default function BMDashboard({ onNavigate }) {
  const [docs, setDocs] = useState([]);
  const [companyCodes, setCompanyCodes] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(7);
  const [menuId, setMenuId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const get = (path) =>
      fetch(`${API}${path}`, { headers: authHeaders() }).then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || `Failed to load ${path}`);
        return data.data || [];
      });
    const [d, c, p] = await Promise.allSettled([get("/documents"), get("/company-codes"), get("/plants")]);
    if (d.status === "fulfilled") setDocs(d.value);
    else {
      setDocs([]);
      setError(d.reason?.message || "Failed to load documents");
    }
    setCompanyCodes(c.status === "fulfilled" ? c.value : []);
    setPlants(p.status === "fulfilled" ? p.value : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- calculations ---------------- */
  const byStatus = useMemo(
    () => docs.reduce((acc, d) => ({ ...acc, [d.uploadStatus]: (acc[d.uploadStatus] || 0) + 1 }), {}),
    [docs],
  );
  const failed = byStatus.FAILED || 0;
  const completed = byStatus.COMPLETED || 0;
  const processing = byStatus.PROCESSING || 0;
  const activeCC = companyCodes.filter((c) => c.status === "ACTIVE").length;
  const activePlants = plants.filter((p) => p.status === "ACTIVE").length;

  const ccById = useMemo(() => Object.fromEntries(companyCodes.map((c) => [c.id, c])), [companyCodes]);
  const plantById = useMemo(() => Object.fromEntries(plants.map((p) => [p.id, p])), [plants]);
  const ccOf = (d) =>
    d?.companyCode?.code || nameOf(d?.CompanyCode) || d?.companyCodeName ||
    ccById[d?.companyCodeId]?.code || ccById[d?.companyCodeId]?.name || "—";
  const plantOf = (d) =>
    d?.plant?.code || nameOf(d?.Plant) || d?.plantName ||
    plantById[d?.plantId]?.code || plantById[d?.plantId]?.name || "—";

  const recent = useMemo(
    () => [...docs].sort((a, b) => (toDate(getDate(b)) || 0) - (toDate(getDate(a)) || 0)).slice(0, 6),
    [docs],
  );

  const activity = useMemo(() => {
    const today = new Date();
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - i));
      return { key: d.toDateString(), label: d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }), count: 0 };
    });
    docs.forEach((d) => {
      const t = toDate(getDate(d));
      if (!t) return;
      const b = buckets.find((x) => x.key === t.toDateString());
      if (b) b.count += 1;
    });
    const max = Math.max(3, ...buckets.map((b) => b.count));
    const top = Math.ceil(max / 3) * 3;
    return { buckets, top, ticks: [3, 2, 1, 0].map((i) => (top / 3) * i) };
  }, [docs, days]);

  const go = (key) => () => onNavigate?.(key);

  /* ---------------- render ---------------- */
  return (
    <div className="space-y-4">
      <style>{CSS}</style>

      {/* Hero */}
      <section className="bm-in relative flex min-h-[128px] items-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#1D5BEA] via-[#1E55E0] to-[#2352D8] px-6 py-5 shadow-lg shadow-blue-900/20">
        <div className="bm-glow pointer-events-none absolute -left-10 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="bm-sweep pointer-events-none absolute inset-y-0 left-0 w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative z-10 flex min-w-0 flex-1 items-center gap-5">
          <span className="bm-pop flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20">
            <Landmark size={40} strokeWidth={1.6} />
          </span>
          <div className="min-w-0">
            <h1 className="text-[32px] font-extrabold leading-tight text-white">Branch Manager Dashboard</h1>
            <p className="mt-1 text-[15px] text-blue-100">Manage documents, workflows and approvals for your assigned branch.</p>
          </div>
        </div>

        <div className="bm-float pointer-events-none relative z-10 mr-6 hidden h-[130px] shrink-0 lg:block">
          <HeroIllustration />
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 dark:border-rose-500/20 dark:bg-rose-500/10">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-rose-600">Unable to load dashboard data</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{error}</p>
          </div>
          <button type="button" onClick={load} className="shrink-0 text-[11px] font-bold text-rose-600 hover:underline">Retry</button>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard theme="blue" loading={loading} icon={<FileText size={30} />} label="Total Documents" value={docs.length}
          sub={`${completed} completed`} subIcon={<CheckCircle2 size={14} />} delay={80} onClick={go("documents")} />
        <StatCard theme="purple" loading={loading} icon={<Layers size={30} />} label="Company Codes" value={companyCodes.length}
          sub={`${activeCC} active`} subIcon={<ArrowUp size={13} strokeWidth={3} />} delay={160} />
        <StatCard theme="green" loading={loading} icon={<Factory size={30} />} label="Plants" value={plants.length}
          sub={`${activePlants} active`} subIcon={<ArrowUp size={13} strokeWidth={3} />} delay={240} />
        <StatCard theme="orange" loading={loading} icon={<RefreshCw size={30} />} label="Processing" value={processing}
          bad={failed > 0} sub={failed > 0 ? `${failed} failed` : "No failures"}
          subIcon={failed > 0 ? <AlertCircle size={13} /> : <ArrowUp size={13} strokeWidth={3} />} delay={320} onClick={go("workflow")} />
      </div>

      {/* Recent + Status */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div style={{ animationDelay: "300ms" }} className={`bm-in ${CARD} min-w-0`}>
          <div className="p-5 pb-3">
            <CardHead
              icon={<FileText size={22} />}
              title="Recent Documents"
              sub="Latest documents from your branch."
              right={
                <button type="button" onClick={go("documents")} className="group flex items-center gap-1.5 text-[13.5px] font-bold text-blue-600 hover:underline dark:text-blue-400">
                  View All <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              }
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> <span className="text-[12px]">Loading…</span>
            </div>
          ) : recent.length === 0 ? (
            <p className="px-5 pb-10 pt-4 text-center text-[13px] text-slate-500 dark:text-slate-400">No documents uploaded yet.</p>
          ) : (
            <div className="overflow-x-auto pb-3">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="bg-slate-100/80 text-[12.5px] font-semibold text-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
                    <th className="w-10 px-5 py-2.5">#</th>
                    <th className="px-2 py-2.5">Document Name</th>
                    <th className="px-2 py-2.5">Type</th>
                    <th className="px-2 py-2.5">Company Code</th>
                    <th className="px-2 py-2.5">Plant</th>
                    <th className="px-2 py-2.5">Status</th>
                    <th className="px-2 py-2.5">Uploaded On</th>
                    <th className="w-10 px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {recent.map((d, i) => {
                    const name = getName(d);
                    const badge = getFileBadge(name);
                    const rowId = d?.id ?? `${name}-${i}`;
                    return (
                      <tr
                        key={rowId}
                        style={{ animationDelay: `${450 + i * 90}ms` }}
                        className="bm-slide border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-white/5"
                      >
                        <td className="px-5 py-3.5 text-[13px] font-medium text-slate-800 dark:text-slate-100">{i + 1}</td>
                        <td className="px-2 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-8 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold ${badge.c}`}>{badge.t}</span>
                            <span className="max-w-[230px] truncate text-[13.5px] font-semibold text-slate-900 dark:text-white">{name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3.5">
                          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-[12px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">{getType(d)}</span>
                        </td>
                        <td className="px-2 py-3.5">
                          <span className="inline-block rounded-full bg-sky-50 px-3 py-1 text-[12px] font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">{ccOf(d)}</span>
                        </td>
                        <td className="px-2 py-3.5">
                          <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{plantOf(d)}</span>
                        </td>
                        <td className="px-2 py-3.5"><StatusPill status={d.uploadStatus} /></td>
                        <td className="whitespace-nowrap px-2 py-3.5 text-[13px] text-slate-700 dark:text-slate-300">{fmtDate(getDate(d))}</td>
                        <td className="relative px-2 py-3.5">
                          <button
                            type="button"
                            aria-label="More actions"
                            onClick={() => setMenuId((v) => (v === rowId ? null : rowId))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {menuId === rowId && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setMenuId(null)} />
                              <div className="bm-pop absolute right-2 top-11 z-40 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-[#1A2433]">
                                <button type="button" onClick={() => { setMenuId(null); onNavigate?.("documents"); }}
                                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                                  <Eye size={14} /> Open Documents
                                </button>
                                <button type="button" onClick={() => { navigator.clipboard?.writeText(name); setMenuId(null); }}
                                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                                  <Copy size={14} /> Copy file name
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <StatusCard completed={completed} processing={processing} failed={failed} total={docs.length} loading={loading} delay={380} />
      </div>

      {/* Activity + Quick actions */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_500px]">
        <div style={{ animationDelay: "460ms" }} className={`bm-in ${CARD} p-5`}>
          <CardHead
            icon={<BarChart3 size={22} />}
            title="Branch Activity"
            sub={`Document uploads and processing in last ${days} days.`}
            right={
              <div className="relative">
                <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300" />
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-[13.5px] font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={14}>Last 14 Days</option>
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300" />
              </div>
            }
          />

          <div className="mt-5 flex gap-3">
            <div className="flex h-[150px] w-5 flex-col justify-between text-right text-[13px] text-slate-700 dark:text-slate-300">
              {activity.ticks.map((t) => (
                <span key={t} className="-my-2 leading-none">{t}</span>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="relative h-[150px] border-b border-l border-slate-300 dark:border-slate-600">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="absolute inset-x-0 border-t border-slate-200 dark:border-slate-700" style={{ top: `${(i / 3) * 100}%` }} />
                ))}
                <div className="absolute inset-0 flex items-end">
                  {activity.buckets.map((b, i) => (
                    <div key={b.key} className="relative flex h-full flex-1 items-end justify-center" title={`${b.label}: ${b.count}`}>
                      {b.count > 0 && (
                        <>
                          <span className="absolute text-[13px] font-semibold text-slate-900 dark:text-white" style={{ bottom: `calc(${(b.count / activity.top) * 100}% + 4px)` }}>
                            {b.count}
                          </span>
                          <div
                            className="bm-bar w-[60%] max-w-[64px] rounded-t-md bg-blue-600 transition-colors hover:bg-blue-500"
                            style={{ height: `${(b.count / activity.top) * 100}%`, animationDelay: `${600 + i * 70}ms` }}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex">
                {activity.buckets.map((b) => (
                  <span key={b.key} className="flex-1 text-center text-[12.5px] text-slate-700 dark:text-slate-300">{b.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ animationDelay: "540ms" }} className={`bm-in ${CARD} p-5`}>
          <CardHead icon={<Zap size={22} />} title="Quick Actions" sub="Common tasks for branch operations." />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <QuickAction delay={640} tone="blue" icon={<FileText size={22} />} label={<>Browse<br />Documents</>} onClick={go("documents")} />
            <QuickAction delay={700} tone="green" icon={<Activity size={22} />} label="DMS Workflow" onClick={go("workflow")} />
            <QuickAction delay={760} tone="orange" icon={<Folder size={22} />} label="Folders" onClick={go("folders")} />
            <QuickAction delay={820} tone="purple" icon={<BadgeCheck size={22} />} label="View Approvals" onClick={go("approvals")} />
          </div>
        </div>
      </div>
    </div>
  );
}