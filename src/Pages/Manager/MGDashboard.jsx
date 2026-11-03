import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Hourglass,
  Upload,
  RefreshCw,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Users,
  Check,
  CheckSquare,
  Network,
  FileSearch,
  Zap,
  BarChart3,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { API_BASE_URL } from "../../services/apiClient";
import { ApprovalActionApi } from "../../features/approvalEngine/api";

/* ------------------------------------------------------------------ */
/* Animations (scoped, respects prefers-reduced-motion)                */
/* ------------------------------------------------------------------ */
const CSS = `
@keyframes mg-fade-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes mg-slide-in{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
@keyframes mg-pop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes mg-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes mg-wave{0%,60%,100%{transform:rotate(0)}10%,30%{transform:rotate(16deg)}20%{transform:rotate(-8deg)}40%{transform:rotate(-4deg)}50%{transform:rotate(10deg)}}
@keyframes mg-ring{0%{box-shadow:0 0 0 0 rgba(245,158,11,.45)}100%{box-shadow:0 0 0 12px rgba(245,158,11,0)}}
@keyframes mg-ring-blue{0%{box-shadow:0 0 0 0 rgba(37,99,235,.45)}100%{box-shadow:0 0 0 12px rgba(37,99,235,0)}}
@keyframes mg-line{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes mg-sweep{0%{transform:translateX(-120%)}100%{transform:translateX(220%)}}
@keyframes mg-spin{to{transform:rotate(360deg)}}
@keyframes mg-glow{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.9;transform:scale(1.08)}}
.mg-in{animation:mg-fade-up .7s cubic-bezier(.22,1,.36,1) backwards}
.mg-slide{animation:mg-slide-in .55s cubic-bezier(.22,1,.36,1) backwards}
.mg-pop{animation:mg-pop .5s cubic-bezier(.22,1,.36,1) backwards}
.mg-float{animation:mg-float 5.5s ease-in-out infinite}
.mg-hand{display:inline-block;transform-origin:70% 70%;animation:mg-wave 2.4s ease-in-out .9s 1}
.mg-pulse{animation:mg-ring 1.9s ease-out infinite}
.mg-pulse-blue{animation:mg-ring-blue 1.9s ease-out infinite}
.mg-line{transform-origin:left;animation:mg-line .9s cubic-bezier(.22,1,.36,1) backwards}
.mg-sweep{animation:mg-sweep 6s ease-in-out 1.2s infinite}
.mg-spin{animation:mg-spin 1.4s linear infinite}
.mg-glow{animation:mg-glow 5s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){
  .mg-in,.mg-slide,.mg-pop,.mg-float,.mg-hand,.mg-pulse,.mg-pulse-blue,.mg-line,.mg-sweep,.mg-spin,.mg-glow{animation:none!important}
}
`;

const CARD =
  "rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1A2433]";

// Backend approvals API fail ho jaye to purane jaisa illustrative item dikhega
const PENDING_FALLBACK = { id: "fallback", name: "INV-2024-01501.pdf", vendor: "PQR Ltd", amount: "₹67,000" };

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const authHeaders = () => {
  const token = localStorage.getItem("accessToken") || "";
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

function decodeToken() {
  try {
    const t = localStorage.getItem("accessToken");
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1]));
  } catch {
    return null;
  }
}

const nameOf = (v) => (typeof v === "string" ? v : v?.name || v?.departmentName || v?.title || null);
const flat = (item) => ({ ...(item?.document || {}), ...(item || {}) });

const statusOf = (d) => d?.uploadStatus || d?.status;
const PROCESSING = ["PROCESSING", "OCR_PROCESSING", "OCR_COMPLETED", "SAVING_TO_SAP"];

const getName = (d) =>
  d?.originalFileName || d?.fileName || d?.filename || d?.name || d?.documentName || "Untitled document";
const getType = (d) =>
  nameOf(d?.DocumentType) || nameOf(d?.documentType) || d?.documentTypeName || d?.type || "Doc";
const getDate = (d) => d?.createdAt || d?.uploadedAt || d?.created_at || d?.updatedAt || null;

function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
const fmtDate = (v) => {
  const d = toDate(v);
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—";
};

function pendingMeta(d) {
  const vendor = d?.vendorName || d?.vendor;
  let amount = d?.amount ?? d?.totalAmount;
  if (typeof amount === "number") amount = `₹${amount.toLocaleString("en-IN")}`;
  const parts = [vendor, amount].filter(Boolean);
  if (parts.length) return parts.join(" • ");
  return [getType(d), nameOf(d?.department)].filter(Boolean).join(" • ") || "Awaiting your review";
}

function getFileBadge(name) {
  const l = String(name).toLowerCase();
  if (l.endsWith(".pdf")) return { t: "PDF", c: "bg-red-500 text-white" };
  if (/\.(xlsx|xls|csv)$/.test(l)) return { t: "XLS", c: "bg-emerald-600 text-white" };
  if (/\.(docx|doc)$/.test(l)) return { t: "DOC", c: "bg-blue-500 text-white" };
  if (/\.(jpg|jpeg|png)$/.test(l)) return { t: "IMG", c: "bg-violet-500 text-white" };
  return { t: "FILE", c: "bg-violet-500 text-white" };
}

const TYPE_TONES = [
  "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
];
function typeTone(name) {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TYPE_TONES[h % TYPE_TONES.length];
}

function StatusPill({ status }) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold";
  if (["COMPLETED", "APPROVED"].includes(status))
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300`}>
        <CheckSquare size={13} /> Completed
      </span>
    );
  if (PROCESSING.includes(status))
    return (
      <span className={`${base} bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300`}>
        <span className="mg-spin inline-block h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent" /> Processing
      </span>
    );
  if (status === "WAITING_FOR_APPROVAL")
    return (
      <span className={`${base} bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300`}>
        <Hourglass size={12} /> Pending
      </span>
    );
  if (["FAILED", "REJECTED"].includes(status))
    return (
      <span className={`${base} bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300`}>
        <AlertCircle size={12} /> {status === "FAILED" ? "Failed" : "Rejected"}
      </span>
    );
  return <span className={`${base} bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300`}>{status || "—"}</span>;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning,";
  if (h < 17) return "Good Afternoon,";
  return "Good Evening,";
}

function monthTrend(docs) {
  const now = Date.now();
  const span = 30 * 864e5;
  let cur = 0;
  let prev = 0;
  docs.forEach((d) => {
    const t = toDate(getDate(d))?.getTime();
    if (!t) return;
    if (t >= now - span && t <= now) cur += 1;
    else if (t >= now - 2 * span && t < now - span) prev += 1;
  });
  return prev ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0;
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
/* Hero illustration (folder + document + shield)                      */
/* ------------------------------------------------------------------ */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 260 170" className="h-full w-auto" aria-hidden="true">
      <defs>
        <linearGradient id="mgFb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="mgFf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#60A5FA" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="mgSh" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
      <ellipse cx="130" cy="162" rx="100" ry="6" fill="#0B1E5B" opacity=".25" />
      <path d="M18 56a10 10 0 0 1 10-10h50l13 13h78a10 10 0 0 1 10 10v84a10 10 0 0 1-10 10H28a10 10 0 0 1-10-10z" fill="url(#mgFb)" />
      <g transform="rotate(8 120 70)">
        <rect x="70" y="10" width="100" height="100" rx="8" fill="#fff" />
        <rect x="84" y="28" width="58" height="6" rx="3" fill="#BFDBFE" />
        <rect x="84" y="42" width="72" height="6" rx="3" fill="#DBEAFE" />
        <rect x="84" y="56" width="50" height="6" rx="3" fill="#DBEAFE" />
        <rect x="84" y="70" width="64" height="6" rx="3" fill="#DBEAFE" />
      </g>
      <path d="M18 86a10 10 0 0 1 10-10h160a10 10 0 0 1 10 10v58a10 10 0 0 1-10 10H28a10 10 0 0 1-10-10z" fill="url(#mgFf)" />
      <path d="M196 38l42 15v34c0 26-17 44-42 55-25-11-42-29-42-55V53z" fill="#fff" />
      <path d="M196 47l34 12v28c0 20-14 34-34 43-20-9-34-23-34-43V59z" fill="url(#mgSh)" />
      <path d="M180 92l11 11 22-24" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */
const KPI = {
  blue: { tile: "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300", card: "" },
  amber: {
    tile: "bg-amber-100 text-amber-500 dark:bg-amber-500/20 dark:text-amber-300",
    card: "!border-amber-200 bg-gradient-to-br from-amber-50/80 to-white dark:!border-amber-500/30 dark:from-amber-500/10 dark:to-[#1A2433]",
  },
  green: { tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300", card: "" },
  purple: { tile: "bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300", card: "" },
};
const SUB = {
  green: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  blue: "text-blue-600 dark:text-blue-400",
};

function StatCard({ icon, label, value, sub, subTone, theme, loading, delay, pill, pulse, onClick }) {
  const t = KPI[theme];
  const up = pill >= 0;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`mg-in group relative w-full overflow-hidden p-4 text-left transition duration-300 hover:-translate-y-1 hover:shadow-lg ${CARD} ${t.card}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 ${t.tile} ${pulse ? "mg-pulse" : ""}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100">{label}</div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            {loading ? (
              <div className="h-9 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
            ) : (
              <>
                <span className="text-[32px] font-extrabold leading-tight text-slate-900 dark:text-white">
                  <CountUp value={value} loading={loading} />
                </span>
                {pill !== undefined && (
                  <span
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-bold ${
                      up
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
                    }`}
                  >
                    {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {Math.abs(pill)}%
                  </span>
                )}
              </>
            )}
          </div>
          <div className={`mt-1 text-[14px] font-semibold ${SUB[subTone]}`}>{sub}</div>
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Card heading                                                        */
/* ------------------------------------------------------------------ */
function CardHead({ icon, title, sub, right }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          {icon}
        </span>
        <div>
          <h2 className="text-[17px] font-bold leading-tight text-slate-900 dark:text-white">{title}</h2>
          <p className="mt-0.5 text-[12.5px] text-slate-500 dark:text-slate-400">{sub}</p>
        </div>
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Workflow step                                                       */
/* ------------------------------------------------------------------ */
const STEP_CARD = {
  done: "border-emerald-100 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/10",
  current: "border-amber-100 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10",
  todo: "border-slate-100 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/40",
  error: "border-rose-100 bg-rose-50/70 dark:border-rose-500/20 dark:bg-rose-500/10",
};
const STEP_TILE = {
  done: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
  current: "bg-amber-100 text-amber-500 dark:bg-amber-500/20 dark:text-amber-300",
  todo: "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-400",
  error: "bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300",
};
const STEP_TEXT = {
  done: "text-emerald-600 dark:text-emerald-400",
  current: "text-amber-600 dark:text-amber-400",
  todo: "text-slate-400",
  error: "text-rose-500",
};

function deriveSteps(doc) {
  const st = statusOf(doc);
  const uploaded = { state: "done", text: fmtDate(getDate(doc)) };
  if (PROCESSING.includes(st) && st !== "OCR_COMPLETED")
    return [uploaded, { state: "current", text: "In progress" }, { state: "todo", text: "Waiting" }];
  if (st === "FAILED")
    return [uploaded, { state: "error", text: "Failed" }, { state: "todo", text: "Waiting" }];
  const ocr = { state: "done", text: "Completed" };
  if (["COMPLETED", "APPROVED"].includes(st)) return [uploaded, ocr, { state: "done", text: "Approved" }];
  if (st === "REJECTED") return [uploaded, ocr, { state: "error", text: "Rejected" }];
  return [uploaded, ocr, { state: "current", text: "Pending" }];
}

/* ------------------------------------------------------------------ */
/* Quick action                                                        */
/* ------------------------------------------------------------------ */
const QA = {
  blue: { bg: "bg-blue-50/80 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20", ic: "text-blue-600", ar: "text-blue-600" },
  green: { bg: "bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20", ic: "text-emerald-600", ar: "text-emerald-600" },
  orange: { bg: "bg-orange-50/80 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20", ic: "text-orange-500", ar: "text-orange-500" },
  purple: { bg: "bg-violet-50/80 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20", ic: "text-violet-600", ar: "text-violet-600" },
};
function QuickAction({ icon, label, tone, delay, onClick }) {
  const t = QA[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`mg-pop group relative flex flex-col items-center gap-2 rounded-xl border px-2 pb-7 pt-4 text-center transition duration-300 hover:-translate-y-1 hover:shadow-md ${t.bg}`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 group-hover:scale-110 dark:bg-white/10 ${t.ic}`}>
        {icon}
      </span>
      <span className="text-[13.5px] font-bold leading-tight text-slate-800 dark:text-slate-100">{label}</span>
      <ArrowRight size={16} className={`absolute bottom-3 right-3 transition-transform duration-300 group-hover:translate-x-1 ${t.ar}`} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
export default function MGDashboard({ onNavigate, user }) {
  const [docs, setDocs] = useState([]);
  const [pending, setPending] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    const [docsRes, pendingRes] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/documents`, { headers: authHeaders() }).then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load documents");
        return data;
      }),
      ApprovalActionApi.pending(),
    ]);

    if (docsRes.status === "fulfilled") setDocs(docsRes.value.data || []);
    else {
      setDocs([]);
      setError(docsRes.reason?.message || "Unable to load documents.");
    }

    if (pendingRes.status === "fulfilled") {
      const list = Array.isArray(pendingRes.value?.data) ? pendingRes.value.data : [];
      setPending(list);
      setPendingTotal(Number.isFinite(Number(pendingRes.value?.total)) ? Number(pendingRes.value.total) : list.length);
    } else {
      setPending([PENDING_FALLBACK]);
      setPendingTotal(1);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/profile`, { headers: authHeaders() });
        const data = await res.json();
        if (res.ok && data.success && data.data) setProfile(data.data);
      } catch {
        /* ignore */
      }
    })();
  }, [load]);

  /* ---------------- calculations ---------------- */
  const weekAgo = Date.now() - 7 * 864e5;
  const uploadedThisWeek = useMemo(
    () => docs.filter((d) => (toDate(getDate(d))?.getTime() || 0) >= weekAgo).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docs],
  );
  const processing = useMemo(() => docs.filter((d) => PROCESSING.includes(statusOf(d))).length, [docs]);
  const trend = useMemo(() => monthTrend(docs), [docs]);
  const recent = useMemo(
    () => [...docs].sort((a, b) => (toDate(getDate(b)) || 0) - (toDate(getDate(a)) || 0)).slice(0, 5),
    [docs],
  );
  const steps = useMemo(() => (recent[0] ? deriveSteps(recent[0]) : null), [recent]);

  const userName = useMemo(() => {
    const p = decodeToken();
    return String(profile?.name || user?.u || user?.name || p?.name || "Manager").trim();
  }, [profile, user]);
  const roleName = profile?.role || decodeToken()?.role || "Manager";

  const go = (key) => () => onNavigate?.(key);
  const pendingItem = pending[0] ? flat(pending[0]) : null;

  /* ---------------- render ---------------- */
  return (
    <div className="space-y-4">
      <style>{CSS}</style>

      {/* Hero */}
      <section className="mg-in relative flex min-h-[142px] items-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#1D5BEA] via-[#1E4FD8] to-[#2A3CC4] px-7 py-6 shadow-lg shadow-blue-900/20">
        <div className="mg-glow pointer-events-none absolute -left-10 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="mg-sweep pointer-events-none absolute inset-y-0 left-0 w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative z-10 min-w-0 flex-1">
          <p className="text-[18px] text-white/90">{greeting()}</p>
          <h1 className="truncate text-[36px] font-extrabold leading-tight text-white">
            {userName} <span className="mg-hand">👋</span>
          </h1>
          <p className="mt-1 text-[14.5px] text-blue-100">
            {roleName} Dashboard • Monitor your documents, team activity and approvals.
          </p>
        </div>

        <div className="mg-float pointer-events-none relative z-10 mr-6 hidden h-[150px] shrink-0 lg:block">
          <HeroIllustration />
        </div>

        <div className="mg-pop relative z-10 hidden min-w-[250px] items-center gap-4 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm md:flex">
          <Users size={34} className="text-white" strokeWidth={1.6} />
          <div className="leading-tight">
            <p className="text-[14px] text-blue-100">Your Role</p>
            <p className="text-[19px] font-bold text-white">{roleName}</p>
          </div>
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
          <button type="button" onClick={() => load()} className="shrink-0 text-[11px] font-bold text-rose-600 hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard theme="blue" loading={loading} icon={<FileText size={28} />} label="My Documents" value={docs.length}
          pill={trend} sub="Visible to you" subTone="green" delay={80} onClick={go("documents")} />
        <StatCard theme="amber" loading={loading} icon={<Hourglass size={28} />} label="Approvals" value={pendingTotal}
          sub="Pending review" subTone="amber" delay={160} pulse={!loading && pendingTotal > 0} onClick={go("approvals")} />
        <StatCard theme="green" loading={loading} icon={<Upload size={28} />} label="Uploaded" value={uploadedThisWeek}
          sub="This week" subTone="green" delay={240} onClick={go("documents")} />
        <StatCard theme="purple" loading={loading} icon={<RefreshCw size={28} />} label="Processing" value={processing}
          sub="In workflow" subTone="blue" delay={320} onClick={go("documents")} />
      </div>

      {/* Recent + Pending */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_450px]">
        {/* Recent documents */}
        <div style={{ animationDelay: "300ms" }} className={`mg-in ${CARD} min-w-0 overflow-hidden`}>
          <div className="p-5 pb-3">
            <CardHead
              icon={<FileText size={22} />}
              title="Recent Documents"
              sub="Latest documents in your workspace."
              right={
                <button type="button" onClick={go("documents")}
                  className="group flex items-center gap-1.5 text-[13.5px] font-bold text-blue-600 hover:underline dark:text-blue-400">
                  View All
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              }
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> <span className="text-[12px]">Loading…</span>
            </div>
          ) : recent.length === 0 ? (
            <p className="px-5 pb-10 pt-4 text-center text-[13px] text-slate-500 dark:text-slate-400">No documents yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="bg-slate-50 text-[12.5px] font-semibold text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                    <th className="w-12 px-5 py-2.5">#</th>
                    <th className="px-2 py-2.5">Document Name</th>
                    <th className="px-2 py-2.5">Type</th>
                    <th className="px-2 py-2.5">Status</th>
                    <th className="px-2 py-2.5">Uploaded On</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((d, i) => {
                    const name = getName(d);
                    const badge = getFileBadge(name);
                    const type = getType(d);
                    return (
                      <tr
                        key={d?.id ?? `${name}-${i}`}
                        style={{ animationDelay: `${450 + i * 90}ms` }}
                        className="mg-slide border-t border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-white/5"
                      >
                        <td className="px-5 py-3 text-[13px] font-bold text-slate-800 dark:text-slate-100">{i + 1}</td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-8 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold ${badge.c}`}>
                              {badge.t}
                            </span>
                            <span className="max-w-[260px] truncate text-[13.5px] font-bold text-slate-800 dark:text-slate-100">{name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <span className={`inline-block rounded-full px-3 py-1 text-[12px] font-semibold ${typeTone(type)}`}>{type}</span>
                        </td>
                        <td className="px-2 py-3"><StatusPill status={statusOf(d)} /></td>
                        <td className="whitespace-nowrap px-2 py-3 text-[13px] text-slate-600 dark:text-slate-300">{fmtDate(getDate(d))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending approvals */}
        <div style={{ animationDelay: "380ms" }} className={`mg-in ${CARD} p-5`}>
          <CardHead icon={<ShieldCheck size={22} />} title="Pending Approvals" sub="Documents awaiting your review." />

          {loading ? (
            <div className="mt-5 h-[76px] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
          ) : !pendingItem ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mg-pop mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15">
                <Check size={30} strokeWidth={3} />
              </div>
              <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100">You're all caught up</p>
              <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">No documents are waiting for your review.</p>
            </div>
          ) : (
            <div className="mt-4 max-h-[300px] space-y-2.5 overflow-y-auto pr-1">
              {pending.slice(0, 5).map((item, i) => {
                const d = flat(item);
                return (
                  <div
                    key={d?.id ?? d?.documentId ?? i}
                    style={{ animationDelay: `${500 + i * 90}ms` }}
                    className="mg-slide flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800/40"
                  >
                    <span className="mg-pulse flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[18px] font-extrabold text-amber-500 dark:bg-amber-500/20">
                      !
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-bold text-slate-900 dark:text-white">{getName(d)}</div>
                      <div className="truncate text-[12.5px] text-slate-500 dark:text-slate-400">{pendingMeta(d)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={go("approvals")}
                      className="shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
                    >
                      Approve
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Workflow + Quick actions */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.07fr_1fr]">
        {/* Workflow summary */}
        <div style={{ animationDelay: "460ms" }} className={`mg-in ${CARD} p-5`}>
          <CardHead icon={<Network size={22} />} title="Workflow Summary" sub="Current status of your documents." />

          {!steps ? (
            <p className="py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">
              Upload a document to see its workflow here.
            </p>
          ) : (
            <div className="mt-5">
              {/* stepper */}
              <div className="grid grid-cols-3">
                {steps.map((s, i) => (
                  <div key={i} className="relative flex h-9 items-center justify-center">
                    {i < steps.length - 1 && (
                      <>
                        <span className="absolute left-1/2 top-1/2 h-[3px] w-full -translate-y-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                        {steps[i + 1].state === "done" && (
                          <span
                            style={{ animationDelay: `${700 + i * 400}ms` }}
                            className="mg-line absolute left-1/2 top-1/2 h-[3px] w-full -translate-y-1/2 rounded bg-emerald-500"
                          />
                        )}
                      </>
                    )}
                    <span
                      style={{ animationDelay: `${600 + i * 300}ms` }}
                      className={`mg-pop relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-white ${
                        s.state === "done"
                          ? "bg-emerald-500"
                          : s.state === "current"
                            ? "mg-pulse-blue border-[3px] border-blue-600 bg-white"
                            : s.state === "error"
                              ? "bg-rose-500"
                              : "border-[3px] border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
                      }`}
                    >
                      {s.state === "done" && <Check size={18} strokeWidth={3} />}
                      {s.state === "current" && <span className="h-3 w-3 rounded-full bg-blue-600" />}
                      {s.state === "error" && <AlertCircle size={18} />}
                    </span>
                  </div>
                ))}
              </div>

              {/* step cards */}
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { title: "Uploaded", icon: <Upload size={22} /> },
                  { title: "OCR Processing", icon: <FileSearch size={22} /> },
                  { title: "Approval Review", icon: <Users size={22} /> },
                ].map((c, i) => (
                  <div
                    key={c.title}
                    style={{ animationDelay: `${560 + i * 120}ms` }}
                    className={`mg-in flex items-center gap-3 rounded-xl border p-3 transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${STEP_CARD[steps[i].state]}`}
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${STEP_TILE[steps[i].state]}`}>{c.icon}</span>
                    <div className="min-w-0 leading-tight">
                      <div className="text-[13.5px] font-bold text-slate-900 dark:text-white">{c.title}</div>
                      <div className={`mt-1 text-[12.5px] font-medium ${i === 0 ? "text-slate-500 dark:text-slate-400" : STEP_TEXT[steps[i].state]}`}>
                        {steps[i].text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ animationDelay: "540ms" }} className={`mg-in ${CARD} p-5`}>
          <CardHead icon={<Zap size={22} />} title="Quick Actions" sub="Common actions for your daily work." />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickAction delay={640} tone="blue" icon={<FileText size={22} />} label={<>View<br />Documents</>} onClick={go("documents")} />
            <QuickAction delay={700} tone="green" icon={<Upload size={22} />} label={<>Upload<br />Document</>} onClick={go("newdoc")} />
            <QuickAction delay={760} tone="orange" icon={<ShieldCheck size={22} />} label={<>Review<br />Approvals</>} onClick={go("approvals")} />
            <QuickAction delay={820} tone="purple" icon={<BarChart3 size={22} />} label={<>Department<br />Reports</>} onClick={go("reports")} />
          </div>
        </div>
      </div>
    </div>
  );
}