import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Upload,
  Search,
  BarChart3,
  Building2,
  Users,
  UserCheck,
  ClipboardList,
  Pencil,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Zap,
} from "lucide-react";
import { API_BASE_URL } from "../../services/apiClient";
import { ApprovalActionApi } from "../../features/approvalEngine/api";

/* ------------------------------------------------------------------ */
/* Animations (scoped, respects prefers-reduced-motion)                */
/* ------------------------------------------------------------------ */
const CSS = `
@keyframes dh-fade-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes dh-slide-in{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
@keyframes dh-pop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes dh-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes dh-wave{0%,60%,100%{transform:rotate(0)}10%,30%{transform:rotate(16deg)}20%{transform:rotate(-8deg)}40%{transform:rotate(-4deg)}50%{transform:rotate(10deg)}}
@keyframes dh-donut{from{stroke-dasharray:0 var(--c)}}
@keyframes dh-bar{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes dh-ring{0%{box-shadow:0 0 0 0 rgba(245,158,11,.45)}100%{box-shadow:0 0 0 12px rgba(245,158,11,0)}}
.dh-in{animation:dh-fade-up .65s cubic-bezier(.22,1,.36,1) backwards}
.dh-slide{animation:dh-slide-in .55s cubic-bezier(.22,1,.36,1) backwards}
.dh-pop{animation:dh-pop .5s cubic-bezier(.22,1,.36,1) backwards}
.dh-float{animation:dh-float 5s ease-in-out infinite}
.dh-hand{display:inline-block;transform-origin:70% 70%;animation:dh-wave 2.4s ease-in-out .8s 1}
.dh-donut-seg{animation:dh-donut 1.1s cubic-bezier(.22,1,.36,1) backwards}
.dh-bar{transform-origin:bottom;animation:dh-bar .8s cubic-bezier(.22,1,.36,1) backwards}
.dh-pulse{animation:dh-ring 1.8s ease-out infinite}
@media (prefers-reduced-motion:reduce){
  .dh-in,.dh-slide,.dh-pop,.dh-float,.dh-hand,.dh-donut-seg,.dh-bar,.dh-pulse{animation:none!important}
}
`;

const CARD =
  "rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1A2433]";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const authHeaders = () => {
  const token = localStorage.getItem("accessToken") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const nameOf = (v) =>
  typeof v === "string" ? v : v?.name || v?.departmentName || v?.title || null;

// approval items may nest the document — merge so every getter works
const flat = (item) => ({ ...(item?.document || {}), ...(item || {}) });

const statusOf = (d) => d?.uploadStatus || d?.status;
const isApproved = (d) => ["COMPLETED", "APPROVED"].includes(statusOf(d));
const isPending = (d) => statusOf(d) === "WAITING_FOR_APPROVAL";
const isRejected = (d) => statusOf(d) === "REJECTED";

const getName = (d) =>
  d?.originalFileName ||
  d?.fileName ||
  d?.filename ||
  d?.name ||
  d?.documentName ||
  "Untitled document";
const getType = (d) =>
  nameOf(d?.DocumentType) ||
  nameOf(d?.documentType) ||
  d?.DocumentTypeName ||
  d?.documentTypeName ||
  "Document";
const getDate = (d) =>
  d?.createdAt || d?.uploadedAt || d?.created_at || d?.updatedAt || null;
const getUploader = (d) => {
  const v =
    d?.uploadedBy ?? d?.uploader ?? d?.User ?? d?.user ?? d?.createdBy;
  if (v && typeof v === "object")
    return v.name || v.fullName || v.email?.split("@")[0] || "—";
  return (typeof v === "string" && v) || d?.uploadedByName || "—";
};

function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
const fmtDate = (v) => {
  const d = toDate(v);
  return d
    ? d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "—";
};
const fmtDateTime = (v) => {
  const d = toDate(v);
  return d
    ? `${fmtDate(v)} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
    : "—";
};
const fmtTick = (n) => (n >= 1000 ? `${+(n / 1000).toFixed(1)}K` : String(n));

function getFileBadge(name) {
  const l = String(name).toLowerCase();
  if (l.endsWith(".pdf")) return { t: "PDF", c: "bg-red-500 text-white" };
  if (/\.(xlsx|xls|csv)$/.test(l)) return { t: "XLS", c: "bg-emerald-500 text-white" };
  if (/\.(docx|doc)$/.test(l)) return { t: "DOC", c: "bg-blue-500 text-white" };
  if (/\.(jpg|jpeg|png)$/.test(l)) return { t: "IMG", c: "bg-violet-500 text-white" };
  return { t: "FILE", c: "bg-slate-500 text-white" };
}

const PILL = {
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  red: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
};
function statusPill(d) {
  if (isApproved(d)) return { label: "Approved", cls: PILL.green };
  if (isPending(d)) return { label: "Pending", cls: PILL.amber };
  if (isRejected(d)) return { label: "Rejected", cls: PILL.red };
  if (statusOf(d) === "FAILED") return { label: "Failed", cls: PILL.red };
  return { label: "In Progress", cls: PILL.blue };
}

// last `days` vs the `days` before that
function periodCounts(docs, pred, days) {
  const now = Date.now();
  const span = days * 864e5;
  let cur = 0;
  let prev = 0;
  docs.forEach((d) => {
    if (!pred(d)) return;
    const t = toDate(getDate(d))?.getTime();
    if (!t) return;
    if (t >= now - span && t <= now) cur += 1;
    else if (t >= now - 2 * span && t < now - span) prev += 1;
  });
  const pct = prev ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0;
  return { cur, prev, pct };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning,";
  if (h < 17) return "Good Afternoon,";
  return "Good Evening,";
}

/* count-up */
function useCountUp(target, loading, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (loading) {
      setVal(0);
      return undefined;
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
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
  const v = useCountUp(value, loading);
  return <>{v.toLocaleString("en-US")}</>;
}

/* ------------------------------------------------------------------ */
/* Hero illustration                                                   */
/* ------------------------------------------------------------------ */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 230 150" className="h-full w-auto" aria-hidden="true">
      <rect x="22" y="22" width="112" height="110" rx="10" fill="#fff" fillOpacity=".92" />
      <rect x="36" y="38" width="22" height="22" rx="5" fill="#93C5FD" />
      <rect x="66" y="40" width="54" height="6" rx="3" fill="#BFDBFE" />
      <rect x="66" y="52" width="36" height="6" rx="3" fill="#DBEAFE" />
      <rect x="36" y="74" width="84" height="6" rx="3" fill="#DBEAFE" />
      <rect x="36" y="88" width="84" height="6" rx="3" fill="#DBEAFE" />
      <rect x="36" y="102" width="56" height="6" rx="3" fill="#DBEAFE" />
      <path d="M156 28l46 17v36c0 28-19 46-46 58-27-12-46-30-46-58V45z" fill="#1E40AF" fillOpacity=".8" />
      <path d="M156 38l36 13v30c0 21-15 36-36 46-21-10-36-25-36-46V51z" fill="#2F6BFF" />
      <circle cx="156" cy="80" r="17" fill="none" stroke="#fff" strokeWidth="4" />
      <path d="M148 80l6 6 11-12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */
const KPI = {
  blue: { card: "", icon: "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300" },
  amber: {
    card: "!border-amber-200 bg-gradient-to-br from-amber-50/70 to-white dark:!border-amber-500/30 dark:from-amber-500/10 dark:to-[#1A2433]",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  },
  green: { card: "", icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300" },
  red: { card: "", icon: "bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300" },
};

function StatCard({ icon, label, value, pct, upIsGood, sub, theme, loading, delay, pulse, onClick }) {
  const t = KPI[theme];
  const up = pct >= 0;
  const good = upIsGood ? up : !up;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`dh-in group w-full p-4 text-left transition duration-300 hover:-translate-y-1 hover:shadow-lg ${CARD} ${t.card}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 ${t.icon} ${pulse ? "dh-pulse" : ""}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{label}</div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
            ) : (
              <>
                <span className="text-[30px] font-extrabold leading-tight text-slate-900 dark:text-white">
                  <CountUp value={value} loading={loading} />
                </span>
                <span
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-bold ${good ? PILL.green : PILL.red}`}
                >
                  {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  {Math.abs(pct)}%
                </span>
              </>
            )}
          </div>
          <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">{sub}</div>
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Workflow donut                                                      */
/* ------------------------------------------------------------------ */
function WorkflowCard({ approved, pending, rejected, loading, delay }) {
  const [hover, setHover] = useState(null);
  const R = 52;
  const C = 2 * Math.PI * R;
  const total = approved + pending + rejected;

  const items = [
    { key: "Approved", count: approved, color: "#22C55E" },
    { key: "Pending", count: pending, color: "#F59E0B" },
    { key: "Rejected", count: rejected, color: "#EF4444" },
  ];

  const segments = useMemo(() => {
    if (!total) return [];
    const visible = items.filter((i) => i.count > 0);
    let acc = 0;
    return visible.map((s) => {
      const full = (s.count / total) * C;
      const gap = visible.length > 1 ? 2 : 0;
      const seg = { ...s, len: Math.max(full - gap, 0.5), offset: -acc };
      acc += full;
      return seg;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approved, pending, rejected, total, C]);

  return (
    <div style={{ animationDelay: `${delay}ms` }} className={`dh-in ${CARD} p-5`}>
      <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Department Workflow Overview</h2>
      <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">Document status for your department</p>

      {loading ? (
        <div className="mt-6 flex items-center gap-6">
          <div className="h-[150px] w-[150px] animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
          <div className="flex-1 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <div className="relative h-[150px] w-[150px] shrink-0">
            <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
              <circle cx="70" cy="70" r={R} fill="none" stroke="currentColor" strokeWidth="16" className="text-slate-100 dark:text-slate-700" />
              {segments.map((s, i) => (
                <circle
                  key={s.key}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hover === s.key ? 20 : 16}
                  strokeDasharray={`${s.len} ${C - s.len}`}
                  strokeDashoffset={s.offset}
                  className="dh-donut-seg cursor-pointer"
                  style={{ "--c": C, animationDelay: `${300 + i * 160}ms`, transition: "stroke-width .2s ease" }}
                  onMouseEnter={() => setHover(s.key)}
                  onMouseLeave={() => setHover(null)}
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[22px] font-extrabold leading-none text-slate-900 dark:text-white">
                <CountUp value={total} loading={loading} />
              </span>
              <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Total Documents</span>
            </div>
          </div>

          <div className="min-w-[190px] flex-1">
            {items.map((s, i) => (
              <div
                key={s.key}
                onMouseEnter={() => setHover(s.key)}
                onMouseLeave={() => setHover(null)}
                style={{ animationDelay: `${450 + i * 100}ms` }}
                className={`dh-slide flex items-center gap-2.5 px-1 py-2.5 text-[13px] transition-colors ${
                  hover === s.key ? "bg-slate-50 dark:bg-white/5" : ""
                }`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 text-slate-700 dark:text-slate-200">{s.key}</span>
                <span className="w-12 text-right font-bold text-slate-900 dark:text-white">{s.count.toLocaleString("en-US")}</span>
                <span className="w-14 text-right text-slate-500 dark:text-slate-400">
                  {total ? ((s.count / total) * 100).toFixed(1) : "0.0"}%
                </span>
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
const QA_TONES = {
  purple: "border-violet-100 bg-violet-50/70 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10",
  blue: "border-blue-100 bg-blue-50/70 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10",
  green: "border-emerald-100 bg-emerald-50/70 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10",
  orange: "border-orange-100 bg-orange-50/70 text-orange-500 dark:border-orange-500/20 dark:bg-orange-500/10",
};
function QuickAction({ icon, label, tone, delay, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`dh-pop group flex items-center gap-3 rounded-xl border p-3 text-left transition duration-300 hover:-translate-y-1 hover:shadow-md ${QA_TONES[tone]}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/80 transition-transform duration-300 group-hover:scale-110 dark:bg-white/10">
        {icon}
      </span>
      <span className="flex-1 text-[12.5px] font-semibold leading-snug text-slate-700 dark:text-slate-200">{label}</span>
      <ChevronRight size={16} className="shrink-0 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

const ViewAll = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex items-center gap-1.5 text-[12.5px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
  >
    View All
    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
  </button>
);

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
export default function DHDashboard({ onNavigate, onTCodeSearch, user }) {
  const [docs, setDocs] = useState([]);
  const [pending, setPending] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(null);
  const [profile, setProfile] = useState(null);
  const [members, setMembers] = useState({ total: null, active: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [months, setMonths] = useState(12);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    const [docsRes, pendingRes] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/documents`, { headers: authHeaders() }).then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("accessToken");
          window.location.href = "/login";
          return null;
        }
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load documents");
        return data;
      }),
      ApprovalActionApi.pending(),
    ]);

    if (docsRes.status === "fulfilled" && docsRes.value) {
      setDocs(Array.isArray(docsRes.value.data) ? docsRes.value.data : []);
    } else if (docsRes.status === "rejected") {
      console.error("DH Dashboard documents error:", docsRes.reason);
      setDocs([]);
      setError(docsRes.reason?.message || "Unable to load documents.");
    }

    if (pendingRes.status === "fulfilled") {
      const list = Array.isArray(pendingRes.value?.data) ? pendingRes.value.data : [];
      setPending(list);
      setPendingTotal(
        Number.isFinite(Number(pendingRes.value?.total)) ? Number(pendingRes.value.total) : list.length,
      );
    } else {
      setPending([]);
      setPendingTotal(null); // fallback: docs se count hoga
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  // profile + team counts (best effort)
  const loadMeta = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/profile`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success || !data.data) return;
      const me = data.data;
      setProfile(me);
      const deptId = me.departmentId || me.department?.id || me.Department?.id;
      if (!deptId) return;
      const ur = await fetch(`${API_BASE_URL}/users`, { headers: authHeaders() });
      const ud = await ur.json();
      if (ur.ok && ud.success && Array.isArray(ud.data)) {
        const team = ud.data.filter(
          (u) => (u.departmentId || u.department?.id || u.Department?.id) === deptId,
        );
        setMembers({
          total: team.length,
          active: team.filter((u) => u.isActive ?? (u.status ? u.status === "ACTIVE" : true)).length,
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadMeta();
  }, [loadDashboard, loadMeta]);

  /* ---------------- calculations ---------------- */
  const dept = profile?.department || profile?.Department || {};
  const deptName = nameOf(dept) || profile?.departmentName || "—";
  const deptCode = dept?.code || profile?.departmentCode || "—";
  const userName = String(profile?.name || user?.u || user?.name || "User").trim();

  const s = useMemo(() => {
    const pendingDocs = docs.filter(isPending);
    return {
      total: docs.length,
      approved: docs.filter(isApproved).length,
      rejected: docs.filter(isRejected).length,
      pending: pendingTotal ?? pendingDocs.length,
      tTotal: periodCounts(docs, () => true, 30),
      tApproved: periodCounts(docs, isApproved, 30),
      tRejected: periodCounts(docs, isRejected, 30),
      tPending: periodCounts(docs, isPending, 7),
    };
  }, [docs, pendingTotal]);

  // "My pending approvals": approval-engine items; fallback to waiting docs
  const pendingList = useMemo(
    () => (pending.length ? pending.map(flat) : docs.filter(isPending)),
    [pending, docs],
  );

  const recent = useMemo(
    () => [...docs].sort((a, b) => (toDate(getDate(b)) || 0) - (toDate(getDate(a)) || 0)).slice(0, 5),
    [docs],
  );

  const progress = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("en-US", { month: "short" }), count: 0 };
    });
    docs.forEach((d) => {
      const t = toDate(getDate(d));
      if (!t) return;
      const b = buckets.find((x) => x.key === `${t.getFullYear()}-${t.getMonth()}`);
      if (b) b.count += 1;
    });
    const max = Math.max(4, ...buckets.map((b) => b.count));
    const step = max > 40 ? 40 : 4;
    const top = Math.ceil(max / step) * step;
    return { buckets, top, ticks: [4, 3, 2, 1, 0].map((i) => (top / 4) * i) };
  }, [docs, months]);

  const diff = s.tPending.cur - s.tPending.prev;
  const go = (key) => () => onNavigate?.(key);

  /* ---------------- render ---------------- */
  return (
    <div className="space-y-5">
      <style>{CSS}</style>

      {/* Hero */}
      <section className="dh-in relative flex min-h-[140px] items-center overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-6 py-6 shadow-md sm:px-7">
        <div className="relative z-10 min-w-0 flex-1">
          <p className="text-[17px] text-white/90">{greeting()}</p>
          <h1 className="truncate text-[28px] font-extrabold leading-tight text-white sm:text-[34px]">
            {userName} <span className="dh-hand">👋</span>
          </h1>
          <p className="mt-1 text-[14px] text-blue-100">Here's what's happening with your department today.</p>
        </div>

        <div className="dh-pop relative z-10 mr-4 hidden min-w-[280px] items-center gap-4 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm md:flex">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
            <Users size={24} />
          </span>
          <div>
            <p className="text-[12px] text-blue-100">Your Department</p>
            <p className="text-[16px] font-bold leading-tight text-white">{deptName}</p>
            <button
              type="button"
              onClick={go("department")}
              className="group mt-1 flex items-center gap-1 text-[12px] font-medium text-white hover:underline"
            >
              View Details
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        <div className="dh-float pointer-events-none hidden h-[130px] shrink-0 xl:block">
          <HeroIllustration />
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 dark:border-rose-500/20 dark:bg-rose-500/10">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-rose-600">Unable to load documents</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{error}</p>
          </div>
          <button type="button" onClick={() => loadDashboard()} className="shrink-0 text-[11px] font-bold text-rose-600 hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          theme="blue" loading={loading} icon={<FileText size={26} />} label="Total Documents"
          value={s.total} pct={s.tTotal.pct} upIsGood delay={80}
          sub={`+${s.tTotal.cur} than last month`} onClick={go("documents")}
        />
        <StatCard
          theme="amber" loading={loading} icon={<Clock size={26} />} label="Pending Approvals"
          value={s.pending} pct={s.tPending.pct} upIsGood={false} delay={160}
          pulse={!loading && s.pending > 0}
          sub={`${diff >= 0 ? "+" : ""}${diff} than last week`} onClick={go("approvals")}
        />
        <StatCard
          theme="green" loading={loading} icon={<CheckCircle2 size={26} />} label="Approved"
          value={s.approved} pct={s.tApproved.pct} upIsGood delay={240}
          sub={`+${s.tApproved.cur} than last month`} onClick={go("approvedDocuments")}
        />
        <StatCard
          theme="red" loading={loading} icon={<XCircle size={26} />} label="Rejected"
          value={s.rejected} pct={s.tRejected.pct} upIsGood={false} delay={320}
          sub={`+${s.tRejected.cur} than last month`} onClick={go("rejectedDocuments")}
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,0.95fr)]">
        <WorkflowCard approved={s.approved} pending={s.pending} rejected={s.rejected} loading={loading} delay={300} />

        {/* Recent documents */}
        <div style={{ animationDelay: "380ms" }} className={`dh-in ${CARD} min-w-0 p-5`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Recent Documents</h2>
              <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">Latest documents in your department</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                aria-label="Refresh"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              </button>
              <ViewAll onClick={go("documents")} />
            </div>
          </div>

          {loading ? (
            <div className="mt-4 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="py-12 text-center text-[13px] text-slate-500 dark:text-slate-400">
              No documents yet. Upload one to get started.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-[12.5px]">
                <thead>
                  <tr className="bg-slate-50 text-[12px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    {["Document Name", "Type", "Uploaded By", "Date", "Status"].map((h) => (
                      <th key={h} className="px-3 py-2.5 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((d, i) => {
                    const name = getName(d);
                    const badge = getFileBadge(name);
                    const st = statusPill(d);
                    return (
                      <tr
                        key={d?.id ?? `${name}-${i}`}
                        style={{ animationDelay: `${480 + i * 80}ms` }}
                        className="dh-slide border-t border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-white/5"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`flex h-7 w-6 shrink-0 items-center justify-center rounded text-[8px] font-extrabold ${badge.c}`}>
                              {badge.t}
                            </span>
                            <span className="max-w-[150px] truncate font-semibold text-slate-800 dark:text-slate-100">{name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{getType(d)}</td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{getUploader(d)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-slate-600 dark:text-slate-300">{fmtDate(getDate(d))}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-block rounded-full px-3 py-1 text-[11.5px] font-semibold ${st.cls}`}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* My pending approvals */}
        <div style={{ animationDelay: "460ms" }} className={`dh-in ${CARD} flex min-w-0 flex-col p-5`}>
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">My Pending Approvals</h2>
            <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-md bg-slate-100 px-1.5 text-[11.5px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {s.pending}
            </span>
          </div>
          <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">Documents awaiting your approval</p>

          {loading ? (
            <div className="mt-4 space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700" />
              ))}
            </div>
          ) : pendingList.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
              <div className="dh-pop mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-500/15">
                <ShieldCheck size={36} strokeWidth={1.6} />
              </div>
              <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100">No pending Approvals</p>
              <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">You're all caught up!</p>
            </div>
          ) : (
            <div className="mt-4 max-h-[300px] space-y-2.5 overflow-y-auto pr-1">
              {pendingList.slice(0, 6).map((d, i) => {
                const name = getName(d);
                const badge = getFileBadge(name);
                return (
                  <div
                    key={d?.id ?? d?.documentId ?? `${name}-${i}`}
                    style={{ animationDelay: `${520 + i * 80}ms` }}
                    className="dh-slide rounded-xl border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-[9px] font-extrabold ${badge.c}`}>
                        {badge.t}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">{name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {getType(d)} • {fmtDate(getDate(d))}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={go("approvals")}
                      className="mt-2.5 w-full rounded-lg bg-blue-600 py-1.5 text-[12px] font-semibold text-white transition hover:bg-blue-700"
                    >
                      Review Document
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.05fr)_minmax(0,0.85fr)]">
        {/* Department progress */}
        <div style={{ animationDelay: "540ms" }} className={`dh-in ${CARD} p-5`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Department Progress</h2>
              <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">Monthly document activity</p>
            </div>
            <div className="relative">
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-[12px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value={12}>Last 12 Months</option>
                <option value={6}>Last 6 Months</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <div className="flex h-[130px] w-8 flex-col justify-between text-right text-[11px] text-slate-500 dark:text-slate-400">
              {progress.ticks.map((t) => (
                <span key={t}>{fmtTick(t)}</span>
              ))}
            </div>
            <div className="flex-1">
              <div className="flex h-[130px] items-end gap-2 border-b border-slate-200 dark:border-slate-700">
                {progress.buckets.map((b, i) => (
                  <div
                    key={b.key}
                    title={`${b.label}: ${b.count}`}
                    style={{
                      height: `${Math.max((b.count / progress.top) * 100, b.count ? 3 : 0)}%`,
                      animationDelay: `${600 + i * 50}ms`,
                    }}
                    className={`dh-bar flex-1 rounded-t-md transition-colors ${
                      i === progress.buckets.length - 1 ? "bg-blue-600" : "bg-blue-400/80 hover:bg-blue-500"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                {progress.buckets.map((b) => (
                  <span key={b.key} className="flex-1 text-center text-[11px] text-slate-500 dark:text-slate-400">
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ animationDelay: "620ms" }} className={`dh-in ${CARD} p-5`}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
              <Zap size={19} />
            </span>
            <div>
              <h2 className="text-[16px] font-bold leading-tight text-slate-900 dark:text-white">Quick Actions</h2>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">Manage your department documents</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <QuickAction delay={680} tone="purple" icon={<Clock size={20} />} label="View Pending Approvals" onClick={go("approvals")} />
            <QuickAction delay={740} tone="blue" icon={<Upload size={20} />} label="Upload Document" onClick={go("workflow")} />
            <QuickAction delay={800} tone="green" icon={<Search size={20} />} label="Search Documents" onClick={() => onTCodeSearch?.()} />
            <QuickAction delay={860} tone="orange" icon={<BarChart3 size={20} />} label="Department Reports" onClick={go("reports")} />
          </div>
        </div>

        {/* Department details */}
        <div style={{ animationDelay: "700ms" }} className={`dh-in ${CARD} p-5`}>
          <div className="flex items-start justify-between">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Department Details</h2>
            <button
              type="button"
              onClick={go("department")}
              className="flex items-center gap-1 text-[12.5px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              <Pencil size={12} /> Edit
            </button>
          </div>
          <dl className="mt-4 space-y-3.5">
            {[
              [Building2, "Department Name", deptName],
              [ClipboardList, "Department Code", deptCode],
              [Users, "Total Members", members.total ?? "—"],
              [UserCheck, "Active Users", members.active ?? "—"],
              [Clock, "Last Activity", recent.length ? fmtDateTime(getDate(recent[0])) : "—"],
            ].map(([Icon, label, value]) => (
              <div key={label} className="flex items-center gap-3 text-[12.5px]">
                <Icon size={16} className="shrink-0 text-slate-400" />
                <dt className="w-[120px] shrink-0 text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="truncate font-semibold text-slate-800 dark:text-slate-100">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}