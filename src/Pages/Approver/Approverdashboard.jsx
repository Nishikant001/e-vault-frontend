import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Bell,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  MoreVertical,
  Eye,
  Copy,
  BarChart3,
  Zap,
  FileCheck,
  Folder,
  Network,
  MessageSquare,
  Settings,
  ChevronDown,
  Hourglass,
} from "lucide-react";
import { ApprovalActionApi } from "../../features/approvalEngine/api";

/* ------------------------------------------------------------------ */
/* Animations (scoped, respects prefers-reduced-motion)                */
/* ------------------------------------------------------------------ */
const CSS = `
@keyframes ap-fade-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes ap-slide-in{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
@keyframes ap-pop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes ap-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes ap-wave{0%,60%,100%{transform:rotate(0)}10%,30%{transform:rotate(16deg)}20%{transform:rotate(-8deg)}40%{transform:rotate(-4deg)}50%{transform:rotate(10deg)}}
@keyframes ap-donut{from{stroke-dasharray:0 var(--c)}}
@keyframes ap-ring{0%{box-shadow:0 0 0 0 rgba(245,158,11,.45)}100%{box-shadow:0 0 0 12px rgba(245,158,11,0)}}
@keyframes ap-drift{0%,100%{transform:translateX(0)}50%{transform:translateX(-30px)}}
@keyframes ap-badge{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
@keyframes ap-bell{0%,100%{transform:rotate(0)}10%,30%{transform:rotate(14deg)}20%,40%{transform:rotate(-12deg)}50%{transform:rotate(0)}}
.ap-in{animation:ap-fade-up .65s cubic-bezier(.22,1,.36,1) backwards}
.ap-slide{animation:ap-slide-in .55s cubic-bezier(.22,1,.36,1) backwards}
.ap-pop{animation:ap-pop .5s cubic-bezier(.22,1,.36,1) backwards}
.ap-float{animation:ap-float 5s ease-in-out infinite}
.ap-hand{display:inline-block;transform-origin:70% 70%;animation:ap-wave 2.4s ease-in-out .8s 1}
.ap-donut-seg{animation:ap-donut 1.1s cubic-bezier(.22,1,.36,1) backwards}
.ap-pulse{animation:ap-ring 1.8s ease-out infinite}
.ap-drift{animation:ap-drift 9s ease-in-out infinite}
.ap-badge{animation:ap-badge 2.6s ease-in-out infinite}
.ap-bell{transform-origin:50% 10%;animation:ap-bell 1.6s ease-in-out 1s 1}
@media (prefers-reduced-motion:reduce){
  .ap-in,.ap-slide,.ap-pop,.ap-float,.ap-hand,.ap-donut-seg,.ap-pulse,.ap-drift,.ap-badge,.ap-bell{animation:none!important}
}
`;

const CARD =
  "rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1A2433]";

const RANGES = {
  today: { label: "Today", days: 0 },
  "7d": { label: "Last 7 Days", days: 7 },
  "30d": { label: "Last 30 Days", days: 30 },
  all: { label: "All Time", days: null },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function decodeToken() {
  try {
    const t = localStorage.getItem("accessToken");
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1]));
  } catch {
    return null;
  }
}

const nameOf = (v) =>
  typeof v === "string" ? v : v?.name || v?.departmentName || v?.title || null;

// approval items may nest the document — merge so every getter works
const flat = (item) => ({ ...(item?.document || {}), ...(item || {}) });

function getDocumentName(doc) {
  return (
    doc?.fileName ||
    doc?.originalFileName ||
    doc?.name ||
    doc?.documentName ||
    doc?.documentReference ||
    doc?.documentNumber ||
    "Untitled document"
  );
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

function getDepartment(doc) {
  return (
    nameOf(doc?.department) ||
    doc?.departmentName ||
    doc?.dept ||
    null
  );
}

function getDocumentType(doc) {
  return (
    nameOf(doc?.documentType) ||
    doc?.documentTypeName ||
    doc?.type ||
    nameOf(doc?.category) ||
    null
  );
}

function getRequester(doc) {
  const v =
    doc?.requestedBy ??
    doc?.submittedBy ??
    doc?.uploadedBy ??
    doc?.createdBy ??
    doc?.uploader ??
    doc?.requester;
  if (v && typeof v === "object")
    return v.name || v.fullName || v.username || v.email?.split("@")[0] || "";
  if (typeof v === "string") return v;
  return (
    doc?.requestedByName ||
    doc?.requesterName ||
    doc?.uploadedByName ||
    doc?.uploaderName ||
    doc?.submittedByName ||
    doc?.createdByName ||
    ""
  );
}

function getFileBadge(name) {
  const lower = String(name).toLowerCase();
  if (lower.endsWith(".pdf")) return { t: "PDF", c: "bg-red-500 text-white" };
  if (/\.(xlsx|xls|csv)$/.test(lower))
    return { t: "XLS", c: "bg-emerald-500 text-white" };
  if (/\.(docx|doc)$/.test(lower))
    return { t: "DOC", c: "bg-blue-500 text-white" };
  if (/\.(jpg|jpeg|png)$/.test(lower))
    return { t: "IMG", c: "bg-violet-500 text-white" };
  return { t: "FILE", c: "bg-slate-500 text-white" };
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

function fmtDateTime(v) {
  const d = toDate(v);
  return d ? `${dateOf(d)}, ${timeOf(d)}` : "—";
}

function inRange(d, key) {
  if (!d) return false;
  const r = RANGES[key];
  if (r.days === null) return true;
  if (r.days === 0) return d.toDateString() === new Date().toDateString();
  return d.getTime() >= Date.now() - r.days * 864e5;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

const AVATARS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
];
function avatarFor(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATARS[h % AVATARS.length];
}
function initials(name) {
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[1][0]).toUpperCase();
}

/* count-up */
function useCountUp(target, loading, decimals = 0, duration = 900) {
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
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Number((target * eased).toFixed(decimals)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, loading, decimals, duration]);
  return val;
}

function CountUp({ value, loading, decimals = 0 }) {
  const v = useCountUp(value, loading, decimals);
  return <>{v.toFixed(decimals)}</>;
}

/* ------------------------------------------------------------------ */
/* Hero illustration                                                   */
/* ------------------------------------------------------------------ */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 250 170" className="h-full w-auto" aria-hidden="true">
      <defs>
        <linearGradient id="apFb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="apFf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#60A5FA" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="apCk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1E40AF" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="160" rx="92" ry="7" fill="#1E3A8A" opacity=".12" />
      <path
        d="M24 48a10 10 0 0 1 10-10h46l13 13h84a10 10 0 0 1 10 10v88a10 10 0 0 1-10 10H34a10 10 0 0 1-10-10z"
        fill="url(#apFb)"
      />
      <g transform="rotate(6 140 70)">
        <rect x="92" y="14" width="96" height="92" rx="8" fill="#FFFFFF" />
        <rect x="106" y="32" width="56" height="6" rx="3" fill="#BFDBFE" />
        <rect x="106" y="46" width="68" height="6" rx="3" fill="#DBEAFE" />
        <rect x="106" y="60" width="48" height="6" rx="3" fill="#DBEAFE" />
      </g>
      <path
        d="M24 80a10 10 0 0 1 10-10h172a10 10 0 0 1 10 10v66a10 10 0 0 1-10 10H34a10 10 0 0 1-10-10z"
        fill="url(#apFf)"
      />
      <g className="ap-badge" style={{ transformOrigin: "186px 126px" }}>
        <circle cx="186" cy="126" r="30" fill="#FFFFFF" />
        <circle cx="186" cy="126" r="24" fill="url(#apCk)" />
        <path
          d="M174 126l8 8 16-17"
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */
const KPI_THEMES = {
  amber: {
    card: "from-amber-50/90 to-white dark:from-amber-500/10 dark:to-[#1A2433]",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
    arrow: "text-blue-600 dark:text-blue-400",
  },
  green: {
    card: "from-emerald-50/90 to-white dark:from-emerald-500/10 dark:to-[#1A2433]",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
    arrow: "text-emerald-600 dark:text-emerald-400",
  },
  red: {
    card: "from-rose-50/90 to-white dark:from-rose-500/10 dark:to-[#1A2433]",
    icon: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
    arrow: "text-rose-600 dark:text-rose-400",
  },
  blue: {
    card: "from-blue-50/90 to-white dark:from-blue-500/10 dark:to-[#1A2433]",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
    arrow: "text-blue-600 dark:text-blue-400",
  },
};

function StatCard({
  icon,
  label,
  value,
  unit,
  decimals = 0,
  empty,
  sub,
  theme,
  loading,
  delay,
  pulse,
  onClick,
}) {
  const t = KPI_THEMES[theme];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`ap-in group w-full rounded-2xl border border-slate-200/70 bg-gradient-to-br p-4 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 ${t.card}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 ${t.icon} ${pulse ? "ap-pulse" : ""}`}
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
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-[30px] font-extrabold leading-tight text-slate-900 dark:text-white">
                {empty ? (
                  "—"
                ) : (
                  <CountUp value={value} loading={loading} decimals={decimals} />
                )}
              </span>
              {!empty && unit ? (
                <span className="text-[16px] font-bold text-slate-700 dark:text-slate-200">
                  {unit}
                </span>
              ) : null}
            </div>
          )}
        </div>
        <ArrowRight
          size={18}
          className={`mt-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${t.arrow}`}
        />
      </div>
      <div className="mt-1 pl-[60px] text-[12px] text-slate-500 dark:text-slate-400">
        {sub}
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Pending row                                                         */
/* ------------------------------------------------------------------ */
function PendingRow({ doc, index, menuId, setMenuId, onReview, onApprove, onReject }) {
  const name = getDocumentName(doc);
  const badge = getFileBadge(name);
  const dms = getDmsCode(doc);
  const meta = [dms, getDocumentType(doc), getDepartment(doc)].filter(Boolean);
  const requester = getRequester(doc);
  const when = fmtRelative(doc?.createdAt || doc?.submittedAt || doc?.updatedAt);
  const rowId = doc?.id ?? doc?.documentId ?? `${name}-${index}`;

  return (
    <div
      style={{ animationDelay: `${350 + index * 90}ms` }}
      className="ap-slide flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
    >
      <div className="flex min-w-[220px] flex-1 items-center gap-3">
        <span
          className={`flex h-10 w-9 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold ${badge.c}`}
        >
          {badge.t}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[14px] font-bold text-slate-800 dark:text-slate-100">
            {name}
          </div>
          <div className="truncate text-[12px] text-slate-500 dark:text-slate-400">
            {meta.length ? meta.join(" • ") : "Pending review"}
          </div>
        </div>
      </div>

      {requester ? (
        <div className="hidden items-center gap-2.5 md:flex">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${avatarFor(requester)}`}
          >
            {initials(requester)}
          </span>
          <div className="leading-tight">
            <div className="text-[11px] text-slate-400">Requested by</div>
            <div className="max-w-[120px] truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
              {requester}
            </div>
          </div>
        </div>
      ) : null}

      <div className="hidden whitespace-nowrap text-[12.5px] text-slate-500 dark:text-slate-400 lg:block">
        {when}
      </div>

      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={() => onApprove(doc)}
          className="group flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[12.5px] font-semibold text-emerald-700 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          <Check size={14} strokeWidth={3} className="transition-transform group-hover:scale-125" />
          Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(doc)}
          className="group flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-[12.5px] font-semibold text-rose-600 transition duration-200 hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-sm dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
        >
          <X size={14} strokeWidth={3} className="transition-transform group-hover:rotate-90" />
          Reject
        </button>
        <button
          type="button"
          onClick={() => setMenuId((v) => (v === rowId ? null : rowId))}
          aria-label="More actions"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <MoreVertical size={16} />
        </button>

        {menuId === rowId && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuId(null)} />
            <div className="ap-pop absolute right-0 top-10 z-40 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-[#1A2433]">
              <button
                type="button"
                onClick={() => {
                  setMenuId(null);
                  onReview(doc);
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Eye size={14} /> Review in Inbox
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Performance donut                                                   */
/* ------------------------------------------------------------------ */
function PerformanceCard({ approved, rejected, pending, loading, delay, range, setRange }) {
  const [hover, setHover] = useState(null);
  const R = 52;
  const C = 2 * Math.PI * R;
  const total = approved + rejected + pending;
  const decided = approved + rejected;
  const rate = decided > 0 ? Math.round((approved / decided) * 100) : null;

  const items = [
    { key: "Approved", count: approved, color: "#10B981" },
    { key: "Rejected", count: rejected, color: "#EF4444" },
    { key: "Pending", count: pending, color: "#CBD5E1" },
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
  }, [approved, rejected, pending, total, C]);

  return (
    <div style={{ animationDelay: `${delay}ms` }} className={`ap-in ${CARD} p-5`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
            <BarChart3 size={19} />
          </span>
          <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
            Approval Performance
          </h2>
        </div>
        <div className="relative">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[13px] font-semibold text-slate-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {Object.entries(RANGES).map(([k, r]) => (
              <option key={k} value={k}>
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-6">
          <div className="h-[140px] w-[140px] animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
          <div className="flex-1 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="relative h-[140px] w-[140px] shrink-0">
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
                  className="ap-donut-seg cursor-pointer"
                  style={{
                    "--c": C,
                    animationDelay: `${300 + i * 160}ms`,
                    transition: "stroke-width .2s ease",
                  }}
                  onMouseEnter={() => setHover(s.key)}
                  onMouseLeave={() => setHover(null)}
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[26px] font-extrabold leading-none text-slate-900 dark:text-white">
                {rate === null ? "—" : <><CountUp value={rate} loading={loading} />%</>}
              </span>
              <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Approval Rate
              </span>
            </div>
          </div>

          <div className="flex-1">
            {items.map((s, i) => (
              <div
                key={s.key}
                onMouseEnter={() => setHover(s.key)}
                onMouseLeave={() => setHover(null)}
                style={{ animationDelay: `${450 + i * 100}ms` }}
                className={`ap-slide flex items-center gap-2.5 border-b border-slate-100 px-1 py-2.5 text-[13.5px] transition-colors last:border-0 dark:border-slate-700/60 ${
                  hover === s.key ? "bg-slate-50 dark:bg-white/5" : ""
                }`}
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 font-medium text-slate-700 dark:text-slate-200">
                  {s.key}
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
/* Quick action tile                                                   */
/* ------------------------------------------------------------------ */
function QuickAction({ icon, label, onClick, highlight, delay }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`ap-pop group flex flex-col items-center justify-center gap-2.5 rounded-xl border px-2 py-4 text-center text-[13px] font-semibold leading-tight transition duration-300 hover:-translate-y-1 hover:shadow-md ${
        highlight
          ? "border-blue-200 bg-blue-50 text-slate-800 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-slate-100"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-blue-500/50"
      }`}
    >
      <span className="text-blue-600 transition-transform duration-300 group-hover:scale-110 dark:text-blue-400">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
export default function TAApproverDashboard({
  onNavigate,
  onApprove,
  onReject,
  user,
}) {
  const [pending, setPending] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [myActions, setMyActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState("7d");
  const [menuId, setMenuId] = useState(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [pendingRes, actionsRes] = await Promise.all([
        ApprovalActionApi.pending(),
        ApprovalActionApi.myActions(),
      ]);

      const pendingList = Array.isArray(pendingRes?.data) ? pendingRes.data : [];
      const actionsList = Array.isArray(actionsRes?.data) ? actionsRes.data : [];

      setPending(pendingList);
      setPendingTotal(
        Number.isFinite(Number(pendingRes?.total))
          ? Number(pendingRes.total)
          : pendingList.length,
      );
      setMyActions(actionsList);
    } catch (err) {
      console.error("TA Approver Dashboard error:", err);
      setPending([]);
      setPendingTotal(0);
      setMyActions([]);
      setError(err?.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* ---------------- calculations ---------------- */
  const todayCount = useCallback(
    (type) =>
      myActions.filter((item) => {
        if (item?.action !== type) return false;
        const d = toDate(item?.createdAt);
        return d && d.toDateString() === new Date().toDateString();
      }).length,
    [myActions],
  );
  const todayApproved = useMemo(() => todayCount("APPROVE"), [todayCount]);
  const todayRejected = useMemo(() => todayCount("REJECT"), [todayCount]);

  // average turnaround over the last 7 days
  const avgTurnaround = useMemo(() => {
    const durations = myActions
      .map((item) => {
        const end = toDate(item?.createdAt || item?.actionedAt);
        const start = toDate(item?.documentCreatedAt || item?.submittedAt);
        if (!start || !end || !inRange(end, "7d")) return null;
        const ms = end.getTime() - start.getTime();
        return ms > 0 ? ms : null;
      })
      .filter(Boolean);
    if (!durations.length) return null;
    const avgMs = durations.reduce((s, m) => s + m, 0) / durations.length;
    const hours = avgMs / 36e5;
    if (hours < 1)
      return { value: Math.max(1, Math.round(avgMs / 6e4)), unit: "mins", decimals: 0 };
    return { value: Number(hours.toFixed(1)), unit: "hrs", decimals: 1 };
  }, [myActions]);

  const perf = useMemo(() => {
    let approved = 0;
    let rejected = 0;
    myActions.forEach((item) => {
      if (!inRange(toDate(item?.createdAt), range)) return;
      if (item?.action === "APPROVE") approved += 1;
      if (item?.action === "REJECT") rejected += 1;
    });
    return { approved, rejected };
  }, [myActions, range]);

  const recentApprovals = useMemo(
    () =>
      myActions
        .filter((i) => toDate(i?.createdAt))
        .sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt))
        .slice(0, 5),
    [myActions],
  );

  const previewList = useMemo(() => pending.slice(0, 5), [pending]);

  const userName = useMemo(() => {
    const p = decodeToken();
    const raw =
      user?.u ||
      user?.name ||
      user?.username ||
      p?.name ||
      "Approver";
    return String(raw).trim().split(/\s+/)[0];
  }, [user]);

  const goInbox = () => onNavigate?.("approvals");
  const go = (key) => () => onNavigate?.(key);
  const handleApprove = (doc) => (onApprove ? onApprove(doc) : goInbox());
  const handleReject = (doc) => (onReject ? onReject(doc) : goInbox());

  /* ---------------- render ---------------- */
  return (
    <div className="space-y-5">
      <style>{CSS}</style>

      {/* Hero */}
      <section className="ap-in relative flex min-h-[130px] items-center overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-r from-white via-sky-50 to-blue-100/80 px-6 py-6 shadow-sm dark:border-slate-700 dark:from-[#1A2433] dark:via-[#17263d] dark:to-[#12335f] sm:px-7">
        <svg
          className="ap-drift pointer-events-none absolute -bottom-2 left-0 h-24 w-[115%]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 70C200 20 400 110 600 65S1000 20 1200 70V120H0Z" fill="#3B82F6" opacity=".08" />
          <path d="M0 90C220 50 420 120 640 85S1000 55 1200 95V120H0Z" fill="#60A5FA" opacity=".10" />
        </svg>

        <div className="relative z-10 flex items-center gap-5 md:max-w-[65%]">
          <div className="ap-pop hidden h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-white/80 text-blue-600 shadow-sm ring-1 ring-blue-100 dark:bg-slate-800/80 dark:text-blue-400 dark:ring-slate-700 sm:flex">
            <ShieldCheck size={34} />
          </div>
          <div>
            <h1 className="text-[26px] font-extrabold leading-tight text-slate-900 dark:text-white sm:text-[30px]">
              {greeting()},{" "}
              <span className="text-blue-600 dark:text-blue-400">{userName}</span>{" "}
              <span className="ap-hand">👋</span>
            </h1>
            <p className="mt-1.5 text-[15px] text-slate-600 dark:text-slate-300">
              Review, approve and manage document requests securely in e-Vault.
            </p>
          </div>
        </div>

        <div className="ap-float pointer-events-none absolute bottom-0 right-8 hidden h-[150px] md:block">
          <HeroIllustration />
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 dark:border-rose-500/20 dark:bg-rose-500/10">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-rose-600">Unable to load dashboard</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => loadDashboard()}
            className="shrink-0 text-[11px] font-bold text-rose-600 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          theme="amber"
          loading={loading}
          icon={<Hourglass size={24} />}
          label="Pending Approvals"
          value={pendingTotal}
          sub={pendingTotal > 0 ? "Documents waiting for your action" : "No pending items"}
          pulse={!loading && pendingTotal > 0}
          delay={100}
          onClick={goInbox}
        />
        <StatCard
          theme="green"
          loading={loading}
          icon={<CheckCircle2 size={24} />}
          label="Approved Today"
          value={todayApproved}
          sub="Documents approved today"
          delay={180}
          onClick={goInbox}
        />
        <StatCard
          theme="red"
          loading={loading}
          icon={<XCircle size={24} />}
          label="Rejected Today"
          value={todayRejected}
          sub="Documents rejected today"
          delay={260}
          onClick={goInbox}
        />
        <StatCard
          theme="blue"
          loading={loading}
          icon={<TrendingUp size={24} />}
          label="Avg. Turnaround"
          value={avgTurnaround?.value ?? 0}
          unit={avgTurnaround?.unit}
          decimals={avgTurnaround?.decimals ?? 0}
          empty={!avgTurnaround}
          sub="Based on last 7 days"
          delay={340}
          onClick={goInbox}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* ---------------- Left ---------------- */}
        <div className="min-w-0 space-y-5">
          {/* Needs your attention */}
          <div style={{ animationDelay: "300ms" }} className={`ap-in ${CARD} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                  <Bell size={20} className="ap-bell" />
                </span>
                <div>
                  <h2 className="text-[17px] font-bold leading-tight text-slate-900 dark:text-white">
                    Needs Your Attention
                  </h2>
                  <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
                    Documents awaiting your approval ({pendingTotal})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadDashboard(true)}
                  disabled={refreshing}
                  aria-label="Refresh"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300"
                >
                  <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                </button>
                <button
                  type="button"
                  onClick={goInbox}
                  className="group flex items-center gap-1.5 rounded-lg bg-blue-50 px-3.5 py-2 text-[13px] font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                >
                  View All
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2 px-5 pb-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700" />
                ))}
              </div>
            ) : previewList.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 pb-12 pt-6 text-center">
                <div className="ap-pop mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15">
                  <CheckCircle2 size={28} />
                </div>
                <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">
                  You're all caught up
                </p>
                <p className="mt-1 max-w-xs text-[12px] text-slate-500 dark:text-slate-400">
                  There are no pending approval items assigned to you right now.
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-700/60 dark:border-slate-700/60">
                  {previewList.map((item, i) => {
                    const doc = flat(item);
                    return (
                      <PendingRow
                        key={doc?.id ?? doc?.documentId ?? `${getDocumentName(doc)}-${i}`}
                        doc={doc}
                        index={i}
                        menuId={menuId}
                        setMenuId={setMenuId}
                        onReview={goInbox}
                        onApprove={handleApprove}
                        onReject={handleReject}
                      />
                    );
                  })}
                </div>
                {pendingTotal > previewList.length && (
                  <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={goInbox}
                      className="group flex items-center gap-1.5 text-[12.5px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      View all {pendingTotal} pending
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Recent approvals */}
          <div style={{ animationDelay: "420ms" }} className={`ap-in ${CARD} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <CheckCircle2 size={21} />
                </span>
                <div>
                  <h2 className="text-[17px] font-bold leading-tight text-slate-900 dark:text-white">
                    Recent Approvals
                  </h2>
                  <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
                    Latest documents you have processed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={goInbox}
                className="group flex items-center gap-1.5 rounded-lg bg-blue-50 px-3.5 py-2 text-[13px] font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
              >
                View All
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-2 px-5 pb-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700" />
                ))}
              </div>
            ) : recentApprovals.length === 0 ? (
              <p className="px-5 pb-10 pt-4 text-center text-[12px] text-slate-400 dark:text-slate-500">
                No processed documents yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                      {["Document Name", "DMS Code", "Department", "Action", "Actioned On"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentApprovals.map((item, i) => {
                      const doc = flat(item);
                      const name = getDocumentName(doc);
                      const badge = getFileBadge(name);
                      const dms = getDmsCode(doc);
                      const dept = getDepartment(doc);
                      const rejected = item?.action === "REJECT";
                      const label =
                        item?.action === "APPROVE"
                          ? "Approved"
                          : rejected
                            ? "Rejected"
                            : String(item?.action || "—")
                                .toLowerCase()
                                .replace(/^\w/, (c) => c.toUpperCase());
                      return (
                        <tr
                          key={item?.id ?? `${name}-${i}`}
                          style={{ animationDelay: `${520 + i * 80}ms` }}
                          className="ap-slide border-t border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-white/5"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-[9px] font-extrabold ${badge.c}`}
                              >
                                {badge.t}
                              </span>
                              <span className="max-w-[240px] truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                                {name}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {dms ? (
                              <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                                {dms}
                              </span>
                            ) : (
                              <span className="text-[12px] text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-[13px] text-slate-600 dark:text-slate-300">
                            {dept || "—"}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
                                rejected
                                  ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
                                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                              }`}
                            >
                              {rejected ? <X size={12} strokeWidth={3} /> : <Check size={12} strokeWidth={3} />}
                              {label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-[12.5px] text-slate-600 dark:text-slate-300">
                            {fmtDateTime(item?.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ---------------- Right ---------------- */}
        <div className="min-w-0 space-y-5">
          <PerformanceCard
            approved={perf.approved}
            rejected={perf.rejected}
            pending={pendingTotal}
            loading={loading}
            delay={250}
            range={range}
            setRange={setRange}
          />

          <div style={{ animationDelay: "380ms" }} className={`ap-in ${CARD} p-5`}>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                <Zap size={19} />
              </span>
              <div>
                <h2 className="text-[16px] font-bold leading-tight text-slate-900 dark:text-white">
                  Quick Actions
                </h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  Frequently used approval actions
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <QuickAction highlight delay={460} icon={<FileCheck size={28} />} label={<>Pending<br />Approvals</>} onClick={goInbox} />
              <QuickAction delay={520} icon={<Folder size={28} />} label={<>View<br />Documents</>} onClick={go("documents")} />
              <QuickAction delay={580} icon={<Network size={28} />} label={<>Cross Dept.<br />Access</>} onClick={go("crossDepartmentRequest")} />
              <QuickAction delay={640} icon={<MessageSquare size={28} />} label="Communication" onClick={go("communication")} />
              <QuickAction delay={700} icon={<BarChart3 size={28} />} label={<>Approval<br />Reports</>} onClick={go("reports")} />
              <QuickAction delay={760} icon={<Settings size={28} />} label="Settings" onClick={go("settings")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}