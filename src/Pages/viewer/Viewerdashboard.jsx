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
  Check,
  Clock,
  XCircle,
  CheckCircle2,
  ChevronDown,
  Filter,
  FolderOpen,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Copy,
  Info,
} from "lucide-react";
import { API_BASE_URL, getToken } from "../../services/apiClient";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

/* ------------------------------------------------------------------ */
/* Animations (scoped, respects prefers-reduced-motion)                */
/* ------------------------------------------------------------------ */
const CSS = `
@keyframes vw-fade-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes vw-slide-in{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
@keyframes vw-pop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes vw-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes vw-float-slow{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-7px) rotate(3deg)}}
@keyframes vw-wave{0%,60%,100%{transform:rotate(0)}10%,30%{transform:rotate(16deg)}20%{transform:rotate(-8deg)}40%{transform:rotate(-4deg)}50%{transform:rotate(10deg)}}
@keyframes vw-donut{from{stroke-dasharray:0 var(--c)}}
@keyframes vw-drift{0%,100%{transform:translateX(0)}50%{transform:translateX(-30px)}}
@keyframes vw-scan{0%,100%{transform:translate(0,0)}25%{transform:translate(8px,-6px)}50%{transform:translate(-2px,6px)}75%{transform:translate(-8px,-2px)}}
@keyframes vw-line-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes vw-shine{from{transform:translateX(-120%) skewX(-20deg)}to{transform:translateX(320%) skewX(-20deg)}}
.vw-in{animation:vw-fade-up .65s cubic-bezier(.22,1,.36,1) backwards}
.vw-slide{animation:vw-slide-in .55s cubic-bezier(.22,1,.36,1) backwards}
.vw-pop{animation:vw-pop .5s cubic-bezier(.22,1,.36,1) backwards}
.vw-float{animation:vw-float 5s ease-in-out infinite}
.vw-float-slow{animation:vw-float-slow 6s ease-in-out infinite}
.vw-hand{display:inline-block;transform-origin:70% 70%;animation:vw-wave 2.4s ease-in-out .8s 1}
.vw-donut-seg{animation:vw-donut 1.1s cubic-bezier(.22,1,.36,1) backwards}
.vw-drift{animation:vw-drift 9s ease-in-out infinite}
.vw-scan{animation:vw-scan 6s ease-in-out infinite}
.vw-line{transform-origin:top;animation:vw-line-grow .9s cubic-bezier(.22,1,.36,1) .3s backwards}
.vw-shine{position:relative;overflow:hidden}
.vw-shine::after{content:"";position:absolute;top:0;bottom:0;left:0;width:30%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent);transform:translateX(-120%) skewX(-20deg);pointer-events:none}
.vw-shine:hover::after{animation:vw-shine .9s ease}
@media (prefers-reduced-motion:reduce){
  .vw-in,.vw-slide,.vw-pop,.vw-float,.vw-float-slow,.vw-hand,.vw-donut-seg,.vw-drift,.vw-scan,.vw-line{animation:none!important}
  .vw-shine:hover::after{animation:none!important}
}
`;

const CARD =
  "rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1A2433]";

/* ------------------------------------------------------------------ */
/* Status groups                                                       */
/* ------------------------------------------------------------------ */
const GROUP_OF = {
  COMPLETED: "COMPLETED",
  OCR_PROCESSING: "PROCESSING",
  OCR_COMPLETED: "PROCESSING",
  SAVING_TO_SAP: "PROCESSING",
  UPLOADING: "PROCESSING",
  WAITING_FOR_APPROVAL: "AWAITING",
  FAILED: "FAILED",
  REJECTED: "FAILED",
};
const groupOf = (s) => GROUP_OF[s] || "OTHER";

const GROUPS = {
  COMPLETED: {
    label: "Completed",
    short: "Completed",
    color: "#10B981",
    pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  PROCESSING: {
    label: "Processing",
    short: "Processing",
    color: "#3B82F6",
    pill: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  AWAITING: {
    label: "Awaiting Approval",
    short: "Awaiting Approval",
    color: "#F59E0B",
    pill: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  FAILED: {
    label: "Failed",
    short: "Failed",
    color: "#EF4444",
    pill: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  },
  OTHER: {
    label: "Other",
    short: "Other",
    color: "#94A3B8",
    pill: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300",
  },
};

function StatusIcon({ group }) {
  if (group === "COMPLETED") return <CheckCircle2 size={13} />;
  if (group === "PROCESSING")
    return <RefreshCw size={12} className="animate-spin [animation-duration:2.5s]" />;
  if (group === "AWAITING") return <Clock size={13} />;
  if (group === "FAILED") return <XCircle size={13} />;
  return <span className="h-1.5 w-1.5 rounded-full bg-current" />;
}

const FILTER_TABS = [
  { key: "ALL", label: "All" },
  { key: "COMPLETED", label: "Completed" },
  { key: "PROCESSING", label: "Processing" },
  { key: "AWAITING", label: "Awaiting Approval" },
  { key: "FAILED", label: "Failed" },
];

const DATE_FILTERS = {
  any: { label: "Any time", days: null },
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function decodeToken() {
  try {
    const t = getToken() || localStorage.getItem("accessToken");
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1]));
  } catch {
    return null;
  }
}

function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
const timeOf = (d) =>
  d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
const dateOf = (d) =>
  d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function fmtRelative(v) {
  const d = toDate(v);
  if (!d) return "";
  const now = new Date();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return `Today, ${timeOf(d)}`;
  if (d.toDateString() === y.toDateString()) return `Yesterday, ${timeOf(d)}`;
  return `${dateOf(d)}, ${timeOf(d)}`;
}

function pctChange(curr, prev) {
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getDmsCode(doc) {
  return (
    doc?.dmsCode ||
    doc?.dms_code ||
    doc?.dmsNumber ||
    doc?.documentCode ||
    doc?.dmsId ||
    ""
  );
}

function getFileBadge(name) {
  const lower = String(name || "").toLowerCase();
  if (lower.endsWith(".pdf")) return { t: "PDF", c: "bg-red-500 text-white" };
  if (/\.(xlsx|xls|csv)$/.test(lower))
    return { t: "XLS", c: "bg-emerald-500 text-white" };
  if (/\.(docx|doc)$/.test(lower))
    return { t: "DOC", c: "bg-blue-500 text-white" };
  if (/\.(jpg|jpeg|png)$/.test(lower))
    return { t: "IMG", c: "bg-violet-500 text-white" };
  return { t: "FILE", c: "bg-slate-500 text-white" };
}

const viewsKey = () => `evault.viewer.views.${decodeToken()?.id ?? "u"}`;
function readViews() {
  try {
    return JSON.parse(localStorage.getItem(viewsKey()) || "[]");
  } catch {
    return [];
  }
}
function writeViews(v) {
  try {
    localStorage.setItem(viewsKey(), JSON.stringify(v));
  } catch {
    /* ignore */
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
  return <>{useCountUp(value, loading)}</>;
}

/* ------------------------------------------------------------------ */
/* Hero illustration                                                   */
/* ------------------------------------------------------------------ */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 340 190" className="h-full w-auto" aria-hidden="true">
      <defs>
        <linearGradient id="vwPanel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="vwShield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60A5FA" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="180" rx="95" ry="7" fill="#1E3A8A" opacity=".12" />
      <rect x="24" y="52" width="172" height="120" rx="14" fill="url(#vwPanel)" />
      <rect x="10" y="84" width="36" height="6" rx="3" fill="#93C5FD" />
      <rect x="10" y="98" width="28" height="6" rx="3" fill="#93C5FD" />
      <rect x="10" y="112" width="34" height="6" rx="3" fill="#93C5FD" />
      <rect x="58" y="14" width="124" height="130" rx="10" fill="#FFFFFF" />
      <rect x="74" y="32" width="64" height="7" rx="3.5" fill="#BFDBFE" />
      <rect x="74" y="48" width="92" height="7" rx="3.5" fill="#DBEAFE" />
      <rect x="74" y="64" width="78" height="7" rx="3.5" fill="#DBEAFE" />
      <rect x="74" y="80" width="88" height="7" rx="3.5" fill="#DBEAFE" />
      <g className="vw-scan">
        <circle cx="150" cy="104" r="28" fill="#EFF6FF" fillOpacity=".85" stroke="#2563EB" strokeWidth="8" />
        <path d="M171 126l24 24" stroke="#2563EB" strokeWidth="11" strokeLinecap="round" />
      </g>
      <g className="vw-float-slow" style={{ transformOrigin: "290px 84px" }}>
        <g transform="translate(290 80)">
          <path
            d="M0-38 32-25V6C32 26 17 39 0 46-17 39-32 26-32 6V-25Z"
            fill="url(#vwShield)"
          />
          <rect x="-12" y="-6" width="24" height="19" rx="4" fill="#fff" />
          <path
            d="M-7-6v-6a7 7 0 0 1 14 0v6"
            fill="none"
            stroke="#fff"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */
const KPI_THEMES = {
  blue: {
    card: "border-blue-200 from-blue-50/90 to-white dark:border-blue-500/30 dark:from-blue-500/10 dark:to-[#1A2433]",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
  },
  violet: {
    card: "border-violet-200 from-violet-50/90 to-white dark:border-violet-500/30 dark:from-violet-500/10 dark:to-[#1A2433]",
    icon: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
  },
  orange: {
    card: "border-orange-200 from-orange-50/90 to-white dark:border-orange-500/30 dark:from-orange-500/10 dark:to-[#1A2433]",
    icon: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
  },
  green: {
    card: "border-emerald-200 from-emerald-50/90 to-white dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-[#1A2433]",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
};

function TrendPill({ value }) {
  if (value === null || value === undefined || value === 0) return null;
  const up = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        up
          ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
      }`}
    >
      {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      {up ? "+" : ""}
      {value}%
    </span>
  );
}

function StatCard({ icon, label, value, sub, trend, theme, loading, delay }) {
  const t = KPI_THEMES[theme];
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`vw-in group rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${t.card}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 ${t.icon}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-slate-700 dark:text-slate-200">
            {label}
          </div>
          {loading ? (
            <div className="mt-1.5 h-8 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
          ) : (
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-[30px] font-extrabold leading-tight text-slate-900 dark:text-white">
                <CountUp value={value} loading={loading} />
              </span>
              <TrendPill value={trend} />
            </div>
          )}
        </div>
      </div>
      <div className="mt-1 pl-[60px] text-[12px] text-slate-500 dark:text-slate-400">
        {sub}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton row                                                        */
/* ------------------------------------------------------------------ */
function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="h-10 w-9 animate-pulse rounded-md bg-slate-100 dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
        <div className="h-2.5 w-1/4 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
      </div>
      <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
      <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Select with chevron                                                 */
/* ------------------------------------------------------------------ */
function Select({ value, onChange, children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-9 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status breakdown                                                    */
/* ------------------------------------------------------------------ */
function StatusCard({ counts, total, loading, delay }) {
  const [hover, setHover] = useState(null);
  const R = 52;
  const C = 2 * Math.PI * R;

  const items = useMemo(() => {
    const order = ["COMPLETED", "PROCESSING", "AWAITING", "FAILED", "OTHER"];
    return order
      .map((k) => ({ key: k, ...GROUPS[k], count: counts[k] || 0 }))
      .filter((i) => i.key !== "OTHER" || i.count > 0);
  }, [counts]);

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
  }, [items, total, C]);

  const active = hover ? items.find((i) => i.key === hover) : null;

  return (
    <div style={{ animationDelay: `${delay}ms` }} className={`vw-in ${CARD} p-5`}>
      <h2 className="mb-4 text-[16px] font-bold text-slate-900 dark:text-white">
        Status Breakdown
      </h2>

      {loading ? (
        <div className="flex items-center gap-5">
          <div className="h-[130px] w-[130px] animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
          <div className="flex-1 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <div className="relative h-[130px] w-[130px] shrink-0">
            <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
              <circle
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke="currentColor"
                strokeWidth="14"
                className="text-slate-100 dark:text-slate-700"
              />
              {segments.map((s, i) => (
                <circle
                  key={s.key}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hover === s.key ? 18 : 14}
                  strokeDasharray={`${s.len} ${C - s.len}`}
                  strokeDashoffset={s.offset}
                  className="vw-donut-seg cursor-pointer"
                  style={{
                    "--c": C,
                    animationDelay: `${300 + i * 140}ms`,
                    transition: "stroke-width .2s ease",
                  }}
                  onMouseEnter={() => setHover(s.key)}
                  onMouseLeave={() => setHover(null)}
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[24px] font-extrabold leading-none text-slate-900 dark:text-white">
                {active ? active.count : <CountUp value={total} loading={loading} />}
              </span>
              <span className="mt-1 max-w-[76px] truncate text-[11px] text-slate-500 dark:text-slate-400">
                {active ? active.label : "Documents"}
              </span>
            </div>
          </div>

          <div className="flex-1">
            {items.map((s, i) => (
              <div
                key={s.key}
                onMouseEnter={() => setHover(s.key)}
                onMouseLeave={() => setHover(null)}
                style={{ animationDelay: `${450 + i * 90}ms` }}
                className={`vw-slide flex items-center gap-2.5 border-b border-slate-100 px-1 py-2 text-[13px] transition-colors last:border-0 dark:border-slate-700/60 ${
                  hover === s.key ? "bg-slate-50 dark:bg-white/5" : ""
                }`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 truncate font-medium text-slate-700 dark:text-slate-200">
                  {s.label}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Activity                                                            */
/* ------------------------------------------------------------------ */
const ACTIVITY_META = {
  viewed: {
    icon: <Check size={16} />,
    cls: "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300",
  },
  new: {
    icon: <Layers size={16} />,
    cls: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
  },
};

function ActivityCard({ events, loading, onViewAll, delay }) {
  return (
    <div style={{ animationDelay: `${delay}ms` }} className={`vw-in ${CARD} p-5`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
            <Clock size={17} />
          </span>
          <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
            Recent Activity
          </h2>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="group flex items-center gap-1 text-[13px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          View All
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-slate-400 dark:text-slate-500">
          No activity yet.
        </p>
      ) : (
        <ol>
          {events.map((ev, i) => {
            const m = ACTIVITY_META[ev.type];
            const last = i === events.length - 1;
            return (
              <li
                key={ev.id}
                style={{ animationDelay: `${450 + i * 110}ms` }}
                className="vw-slide relative flex gap-3 pb-4 last:pb-0"
              >
                {!last && (
                  <span className="vw-line absolute bottom-0 left-5 top-11 w-px bg-slate-200 dark:bg-slate-700" />
                )}
                <span
                  className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${m.cls}`}
                >
                  {m.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
                    {ev.title}
                  </div>
                  <div className="truncate text-[12.5px] font-medium text-blue-600 dark:text-blue-400">
                    {ev.name}
                  </div>
                  <div className="text-[11.5px] text-slate-400 dark:text-slate-500">
                    {fmtRelative(ev.at)}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
export default function ViewerDashboard({ onNavigate, user }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("any");
  const [showFilters, setShowFilters] = useState(false);
  const [viewingId, setViewingId] = useState(null);
  const [viewError, setViewError] = useState("");
  const [menuId, setMenuId] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [views, setViews] = useState(() => readViews());

  async function loadDocuments({ silent = false } = {}) {
    if (silent) setRefreshing(true);
    else setLoading(true);
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

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    fetch(`${API_BASE_URL}/users/profile`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.data?.name) setProfileName(d.data.name);
      })
      .catch(() => {});
  }, []);

  const firstName = useMemo(() => {
    const p = decodeToken();
    const raw =
      profileName || user?.name || user?.u || p?.name || p?.email?.split("@")[0] || "there";
    const w = String(raw).trim().split(/\s+/)[0];
    return w.charAt(0).toUpperCase() + w.slice(1);
  }, [profileName, user]);

  /* ---------------- derived stats ---------------- */
  const totalDocs = docs.length;

  const departmentCount = useMemo(
    () => new Set(docs.map((d) => d.Department?.name).filter(Boolean)).size,
    [docs],
  );
  const docTypeCount = useMemo(
    () => new Set(docs.map((d) => d.DocumentType?.name).filter(Boolean)).size,
    [docs],
  );

  const weekStats = useMemo(() => {
    const now = Date.now();
    const wk = 7 * 864e5;
    let thisWeek = 0;
    let prevWeek = 0;
    docs.forEach((d) => {
      const t = toDate(d.createdAt)?.getTime();
      if (!t) return;
      if (t >= now - wk) thisWeek += 1;
      else if (t >= now - 2 * wk) prevWeek += 1;
    });
    return {
      thisWeek,
      addedTrend: pctChange(thisWeek, prevWeek),
      visibleTrend: pctChange(totalDocs, totalDocs - thisWeek),
    };
  }, [docs, totalDocs]);

  const groupCounts = useMemo(() => {
    const c = {};
    docs.forEach((d) => {
      const g = groupOf(d.uploadStatus);
      c[g] = (c[g] || 0) + 1;
    });
    return c;
  }, [docs]);

  const deptOptions = useMemo(
    () => [...new Set(docs.map((d) => d.Department?.name).filter(Boolean))].sort(),
    [docs],
  );
  const typeOptions = useMemo(
    () => [...new Set(docs.map((d) => d.DocumentType?.name).filter(Boolean))].sort(),
    [docs],
  );

  const visibleDocs = useMemo(() => {
    let list = [...docs].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    if (activeFilter !== "ALL")
      list = list.filter((d) => groupOf(d.uploadStatus) === activeFilter);
    if (deptFilter !== "ALL") list = list.filter((d) => d.Department?.name === deptFilter);
    if (typeFilter !== "ALL") list = list.filter((d) => d.DocumentType?.name === typeFilter);
    const days = DATE_FILTERS[dateFilter].days;
    if (days) {
      const cutoff = Date.now() - days * 864e5;
      list = list.filter((d) => (toDate(d.createdAt)?.getTime() || 0) >= cutoff);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((d) =>
        [
          d.originalFileName,
          d.Department?.name,
          d.Category?.name,
          d.DocumentType?.name,
          d.tcode,
          getDmsCode(d),
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    return list;
  }, [docs, activeFilter, deptFilter, typeFilter, dateFilter, query]);

  const recent = visibleDocs.slice(0, 8);
  const listKey = `${activeFilter}|${deptFilter}|${typeFilter}|${dateFilter}`;

  const activeFilterCount =
    (deptFilter !== "ALL" ? 1 : 0) +
    (typeFilter !== "ALL" ? 1 : 0) +
    (dateFilter !== "any" ? 1 : 0);

  const clearFilters = () => {
    setDeptFilter("ALL");
    setTypeFilter("ALL");
    setDateFilter("any");
    setActiveFilter("ALL");
    setQuery("");
  };

  // activity: documents this user opened + newest documents
  const activity = useMemo(() => {
    const ev = [];
    views.forEach((v) =>
      ev.push({
        id: `v-${v.id}`,
        type: "viewed",
        title: "Document viewed",
        name: v.name,
        at: v.at,
      }),
    );
    [...docs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .forEach((d) =>
        ev.push({
          id: `n-${d.id}`,
          type: "new",
          title: "New document available",
          name: d.originalFileName || `Document #${d.id}`,
          at: d.createdAt,
        }),
      );
    return ev
      .filter((e) => toDate(e.at))
      .sort((a, b) => toDate(b.at) - toDate(a.at))
      .slice(0, 4);
  }, [views, docs]);

  async function handleView(doc) {
    setViewError("");
    setViewingId(doc.id);
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${doc.id}/view`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Could not open this document.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);

      const next = [
        {
          id: doc.id,
          name: doc.originalFileName || `Document #${doc.id}`,
          at: new Date().toISOString(),
        },
        ...views.filter((v) => v.id !== doc.id),
      ].slice(0, 10);
      setViews(next);
      writeViews(next);
    } catch (e) {
      setViewError(e.message || "Could not open this document.");
    } finally {
      setViewingId(null);
    }
  }

  const goDocs = () => onNavigate?.("documents");

  /* ---------------- render ---------------- */
  return (
    <div className="space-y-5">
      <style>{CSS}</style>

      {/* Hero */}
      <section className="vw-in relative flex min-h-[130px] items-center overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-r from-white via-sky-50 to-blue-100/80 px-6 py-6 shadow-sm dark:border-slate-700 dark:from-[#1A2433] dark:via-[#17263d] dark:to-[#12335f] sm:px-7">
        <svg
          className="vw-drift pointer-events-none absolute -bottom-2 left-0 h-24 w-[115%]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 70C200 20 400 110 600 65S1000 20 1200 70V120H0Z" fill="#3B82F6" opacity=".08" />
          <path d="M0 90C220 50 420 120 640 85S1000 55 1200 95V120H0Z" fill="#60A5FA" opacity=".10" />
        </svg>

        <div className="relative z-10 flex items-center gap-5 md:max-w-[62%]">
          <div className="vw-pop hidden h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-white/80 text-blue-600 shadow-sm ring-1 ring-blue-100 dark:bg-slate-800/80 dark:text-blue-400 dark:ring-slate-700 sm:flex">
            <ShieldCheck size={34} />
          </div>
          <div>
            <h1 className="text-[26px] font-extrabold leading-tight text-slate-900 dark:text-white sm:text-[30px]">
              {greeting()},{" "}
              <span className="text-blue-600 dark:text-blue-400">{firstName}</span>{" "}
              <span className="vw-hand">👋</span>
            </h1>
            <p className="mt-1.5 text-[15px] text-slate-600 dark:text-slate-300">
              You have read-only access to view and search documents.
            </p>
          </div>
        </div>

        <div className="vw-float pointer-events-none absolute bottom-0 right-8 hidden h-[160px] md:block">
          <HeroIllustration />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* ---------------- Left ---------------- */}
        <div className="min-w-0 space-y-5">
          {/* KPI */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <StatCard
              theme="blue"
              loading={loading}
              icon={<FileText size={24} />}
              label="Visible Documents"
              value={totalDocs}
              trend={weekStats.visibleTrend}
              sub="Documents available to you"
              delay={100}
            />
            <StatCard
              theme="violet"
              loading={loading}
              icon={<Building2 size={24} />}
              label="Departments"
              value={departmentCount}
              sub="Departments in your access"
              delay={180}
            />
            <StatCard
              theme="orange"
              loading={loading}
              icon={<Layers size={24} />}
              label="Document Types"
              value={docTypeCount}
              sub="Types you can view"
              delay={260}
            />
            <StatCard
              theme="green"
              loading={loading}
              icon={<CalendarClock size={24} />}
              label="Added This Week"
              value={weekStats.thisWeek}
              trend={weekStats.addedTrend}
              sub="New documents (last 7 days)"
              delay={340}
            />
          </div>

          {/* Recent documents */}
          <div style={{ animationDelay: "400ms" }} className={`vw-in ${CARD} overflow-hidden`}>
            <div className="px-5 pt-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-500 dark:bg-amber-500/15">
                    <FolderOpen size={22} />
                  </span>
                  <div>
                    <h2 className="text-[17px] font-bold leading-tight text-slate-900 dark:text-white">
                      Recent Documents
                    </h2>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
                      Latest documents available for your review
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadDocuments({ silent: true })}
                    disabled={refreshing || loading}
                    aria-label="Refresh"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                  </button>
                  <button
                    type="button"
                    onClick={goDocs}
                    className="group hidden items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:underline dark:text-blue-400 sm:flex"
                  >
                    View All Documents
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              {/* Search + selects + filters */}
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by file name, department, or type..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-[13px] text-slate-700 shadow-sm transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-300/50 dark:border-slate-700 dark:bg-[#151E2D] dark:text-slate-200"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <Select value={deptFilter} onChange={setDeptFilter} className="w-[160px]">
                  <option value="ALL">All Departments</option>
                  {deptOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
                <Select value={typeFilter} onChange={setTypeFilter} className="w-[130px]">
                  <option value="ALL">All Types</option>
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>

                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  className={`relative flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold shadow-sm transition ${
                    showFilters
                      ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  <Filter size={15} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="vw-pop flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* advanced filters (animated) */}
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: showFilters ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                    <span className="text-[12.5px] font-semibold text-slate-600 dark:text-slate-300">
                      Added
                    </span>
                    <Select value={dateFilter} onChange={setDateFilter} className="w-[150px]">
                      {Object.entries(DATE_FILTERS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="ml-auto text-[12.5px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              </div>

              {/* Status pills */}
              <div className="flex flex-wrap items-center gap-2 pb-4">
                {FILTER_TABS.map((tab) => {
                  const count =
                    tab.key === "ALL" ? totalDocs : groupCounts[tab.key] || 0;
                  const on = activeFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveFilter(tab.key)}
                      className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold transition duration-200 hover:-translate-y-0.5 ${
                        on
                          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/25"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-[#151E2D] dark:text-slate-300"
                      }`}
                    >
                      {tab.label}
                      {!loading && ` (${count})`}
                    </button>
                  );
                })}
              </div>
            </div>

            {viewError && (
              <div className="vw-pop mx-5 mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20">
                <AlertTriangle size={13} className="shrink-0 text-red-500" />
                <span className="text-[12px] text-red-600 dark:text-red-400">{viewError}</span>
              </div>
            )}

            {loading ? (
              <div className="divide-y divide-slate-100 px-2 pb-4 dark:divide-slate-700/60">
                {[...Array(5)].map((_, i) => (
                  <RowSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 px-5 pb-10 pt-4 text-center">
                <AlertTriangle size={22} className="text-red-400" />
                <p className="text-[12.5px] text-red-500">{error}</p>
                <button
                  type="button"
                  onClick={() => loadDocuments()}
                  className="text-[12px] font-semibold text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 pb-12 pt-4 text-center">
                <Inbox size={26} className="text-slate-300 dark:text-slate-600" />
                <p className="text-[12.5px] text-slate-400">
                  {query || activeFilter !== "ALL" || activeFilterCount > 0
                    ? "No documents match your filters."
                    : "No documents visible to you yet."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60">
                        {[
                          "Document Name",
                          "DMS Code",
                          "Department",
                          "Type",
                          "Added On",
                          "Status",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody key={listKey}>
                      {recent.map((doc, i) => {
                        const name = doc.originalFileName || `Document #${doc.id}`;
                        const badge = getFileBadge(name);
                        const dms = getDmsCode(doc);
                        const g = GROUPS[groupOf(doc.uploadStatus)];
                        const gk = groupOf(doc.uploadStatus);
                        const created = toDate(doc.createdAt);
                        return (
                          <tr
                            key={doc.id}
                            style={{ animationDelay: `${i * 60}ms` }}
                            className="vw-slide border-t border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-white/5"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-[9px] font-extrabold ${badge.c}`}
                                >
                                  {badge.t}
                                </span>
                                <span className="max-w-[210px] truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                                  {name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {dms ? (
                                <span className="whitespace-nowrap rounded-md bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                                  {dms}
                                </span>
                              ) : (
                                <span className="text-[12px] text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300">
                              {doc.Department?.name || "—"}
                            </td>
                            <td className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300">
                              {doc.DocumentType?.name || "—"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-[12.5px] leading-tight text-slate-700 dark:text-slate-300">
                              {created ? dateOf(created) : "—"}
                              {created && (
                                <div className="text-[11.5px] text-slate-400 dark:text-slate-500">
                                  {timeOf(created)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-bold ${g.pill}`}
                              >
                                <StatusIcon group={gk} />
                                {g.short}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="relative flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleView(doc)}
                                  disabled={viewingId === doc.id}
                                  title="View document"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-blue-600 transition hover:scale-105 hover:bg-blue-50 disabled:opacity-60 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-blue-500/10"
                                >
                                  {viewingId === doc.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Eye size={14} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMenuId((v) => (v === doc.id ? null : doc.id))}
                                  aria-label="More actions"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  <MoreVertical size={14} />
                                </button>

                                {menuId === doc.id && (
                                  <>
                                    <div className="fixed inset-0 z-30" onClick={() => setMenuId(null)} />
                                    <div className="vw-pop absolute right-0 top-9 z-40 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-[#1A2433]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMenuId(null);
                                          handleView(doc);
                                        }}
                                        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                      >
                                        <Eye size={14} /> View document
                                      </button>
                                      {dms && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard?.writeText(dms);
                                            setMenuId(null);
                                          }}
                                          className="flex w-full items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                          <Copy size={14} /> Copy DMS code
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile list */}
                <div key={`m-${listKey}`} className="space-y-2 px-4 pb-4 sm:hidden">
                  {recent.map((doc, i) => {
                    const name = doc.originalFileName || `Document #${doc.id}`;
                    const badge = getFileBadge(name);
                    const gk = groupOf(doc.uploadStatus);
                    const g = GROUPS[gk];
                    return (
                      <div
                        key={doc.id}
                        style={{ animationDelay: `${i * 60}ms` }}
                        className="vw-slide flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"
                      >
                        <span
                          className={`flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-[9px] font-extrabold ${badge.c}`}
                        >
                          {badge.t}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                            {name}
                          </div>
                          <div className="truncate text-[11px] text-slate-400">
                            {doc.createdAt ? dateOf(new Date(doc.createdAt)) : "—"} ·{" "}
                            {doc.Department?.name || "—"}
                          </div>
                          <span
                            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${g.pill}`}
                          >
                            <StatusIcon group={gk} />
                            {g.short}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleView(doc)}
                          disabled={viewingId === doc.id}
                          aria-label="View document"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-blue-600 dark:border-slate-700 dark:text-blue-400"
                        >
                          {viewingId === doc.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={goDocs}
                    className="group flex items-center gap-1.5 text-[12.5px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    View All Documents
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ---------------- Right ---------------- */}
        <div className="min-w-0 space-y-5">
          {/* Viewer Access */}
          <div
            style={{ animationDelay: "120ms" }}
            className="vw-in vw-shine relative flex items-center gap-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-5 text-white shadow-lg shadow-blue-600/25 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/35"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Eye size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-bold">Viewer Access</div>
              <div className="text-[12px] text-white/80">
                Read-only access • View &amp; search documents
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowInfo((v) => !v)}
              aria-label="About viewer access"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30"
            >
              <Info size={17} />
            </button>

            {showInfo && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowInfo(false)} />
                <div className="vw-pop absolute right-3 top-[calc(100%+8px)] z-40 w-[290px] rounded-xl border border-blue-100 bg-white p-4 text-slate-700 shadow-2xl dark:border-slate-700 dark:bg-[#1A2433] dark:text-slate-200">
                  <div className="mb-1 flex items-center gap-2 text-[13px] font-bold text-blue-700 dark:text-blue-300">
                    <ShieldCheck size={15} /> Viewer Access
                  </div>
                  <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
                    You can preview and search documents in your assigned departments and
                    categories. Uploading, editing and deleting are disabled for this role.
                  </p>
                </div>
              </>
            )}
          </div>

          <StatusCard
            counts={groupCounts}
            total={totalDocs}
            loading={loading}
            delay={220}
          />

          <ActivityCard
            events={activity}
            loading={loading}
            onViewAll={goDocs}
            delay={320}
          />
        </div>
      </div>
    </div>
  );
} 