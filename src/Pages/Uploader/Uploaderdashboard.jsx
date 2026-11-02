import { useEffect, useMemo, useState } from "react";
import {
  UploadCloud,
  FileText,
  Hourglass,
  Check,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Eye,
  MoreVertical,
  Zap,
  Network,
  ClipboardCheck,
  FolderOpen,
  BookOpen,
  Play,
  Clock,
  X,
  Copy,
} from "lucide-react";
import { API_BASE_URL } from "../../services/apiClient";

const API_BASE = API_BASE_URL;

/* ------------------------------------------------------------------ */
/* Animations (scoped, respects prefers-reduced-motion)                */
/* ------------------------------------------------------------------ */
const CSS = `
@keyframes ud-fade-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes ud-slide-in{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
@keyframes ud-pop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes ud-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes ud-float-slow{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-6px) rotate(3deg)}}
@keyframes ud-wave{0%,60%,100%{transform:rotate(0)}10%,30%{transform:rotate(16deg)}20%{transform:rotate(-8deg)}40%{transform:rotate(-4deg)}50%{transform:rotate(10deg)}}
@keyframes ud-shine{from{transform:translateX(-120%) skewX(-20deg)}to{transform:translateX(320%) skewX(-20deg)}}
@keyframes ud-donut{from{stroke-dasharray:0 var(--c)}}
@keyframes ud-ring{0%{box-shadow:0 0 0 0 rgba(245,158,11,.45)}100%{box-shadow:0 0 0 12px rgba(245,158,11,0)}}
@keyframes ud-line-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes ud-drift{0%,100%{transform:translateX(0)}50%{transform:translateX(-30px)}}
.ud-in{animation:ud-fade-up .65s cubic-bezier(.22,1,.36,1) backwards}
.ud-slide{animation:ud-slide-in .55s cubic-bezier(.22,1,.36,1) backwards}
.ud-pop{animation:ud-pop .5s cubic-bezier(.22,1,.36,1) backwards}
.ud-float{animation:ud-float 5s ease-in-out infinite}
.ud-float-slow{animation:ud-float-slow 6s ease-in-out infinite}
.ud-hand{display:inline-block;transform-origin:70% 70%;animation:ud-wave 2.4s ease-in-out .8s 1}
.ud-donut-seg{animation:ud-donut 1.1s cubic-bezier(.22,1,.36,1) backwards}
.ud-pulse{animation:ud-ring 1.8s ease-out infinite}
.ud-drift{animation:ud-drift 9s ease-in-out infinite}
.ud-line{transform-origin:top;animation:ud-line-grow .9s cubic-bezier(.22,1,.36,1) .3s backwards}
.ud-shine{position:relative;overflow:hidden}
.ud-shine::after{content:"";position:absolute;top:0;bottom:0;left:0;width:30%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);transform:translateX(-120%) skewX(-20deg);pointer-events:none}
.ud-shine:hover::after{animation:ud-shine .9s ease}
@media (prefers-reduced-motion:reduce){
  .ud-in,.ud-slide,.ud-pop,.ud-float,.ud-float-slow,.ud-hand,.ud-donut-seg,.ud-pulse,.ud-drift,.ud-line{animation:none!important}
  .ud-shine:hover::after{animation:none!important}
}
`;

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
const STATUS_META = {
  COMPLETED: {
    label: "Approved",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/30",
    icon: true,
  },
  OCR_COMPLETED: {
    label: "OCR Done",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30",
  },
  OCR_PROCESSING: {
    label: "OCR Processing",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/30",
  },
  WAITING_FOR_APPROVAL: {
    label: "Pending",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/30",
  },
  SAVING_TO_SAP: {
    label: "Saving to SAP",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/30",
  },
  FAILED: {
    label: "Rejected",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/30",
  },
};

const PALETTE = [
  "#2563EB",
  "#06B6D4",
  "#8B5CF6",
  "#F59E0B",
  "#10B981",
  "#94A3B8",
];

const CARD =
  "rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1A2433]";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function getToken() {
  return localStorage.getItem("accessToken") || "";
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function decodeToken() {
  try {
    const token = getToken();
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function getArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.documents)) return data.documents;
  if (Array.isArray(data?.users)) return data.users;
  return [];
}

function getDocumentStatus(doc) {
  return doc?.uploadStatus || doc?.status || "UNKNOWN";
}

function getDocumentName(doc) {
  return (
    doc?.originalFileName ||
    doc?.fileName ||
    doc?.filename ||
    doc?.name ||
    doc?.documentName ||
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

function getDocumentSize(doc) {
  const value = doc?.fileSize ?? doc?.size ?? doc?.file_size ?? doc?.documentSize;
  if (value === null || value === undefined || value === "") return "—";
  const bytes = Number(value);
  if (!Number.isNaN(bytes)) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return String(value);
}

function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
const docCreated = (doc) =>
  toDate(doc?.createdAt || doc?.uploadedAt || doc?.created_at);
const docUpdated = (doc) => toDate(doc?.updatedAt || doc?.updated_at);

const fmtDate = (d) =>
  d
    ? d.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const fmtTime = (d) =>
  d
    ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : "";

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

function getFileBadge(name) {
  const lower = String(name).toLowerCase();
  if (lower.endsWith(".pdf"))
    return { t: "PDF", c: "bg-red-500 text-white" };
  if (/\.(xlsx|xls|csv)$/.test(lower))
    return { t: "XLS", c: "bg-emerald-500 text-white" };
  if (/\.(docx|doc)$/.test(lower))
    return { t: "DOC", c: "bg-blue-500 text-white" };
  if (/\.(jpg|jpeg|png)$/.test(lower))
    return { t: "IMG", c: "bg-violet-500 text-white" };
  return { t: "FILE", c: "bg-slate-500 text-white" };
}

function getDepartmentName(doc, departments, categories, documentTypes) {
  const directDepartment =
    doc?.department?.name ||
    doc?.departmentName ||
    doc?.department?.departmentName ||
    doc?.deptName;
  if (directDepartment) return directDepartment;

  const documentTypeId =
    doc?.documentTypeId ?? doc?.document_type_id ?? doc?.documentType?.id;
  const documentType =
    doc?.documentType ||
    documentTypes.find((item) => String(item?.id) === String(documentTypeId));

  const categoryId =
    doc?.categoryId ??
    doc?.category_id ??
    documentType?.categoryId ??
    documentType?.category?.id;
  const category =
    doc?.category ||
    categories.find((item) => String(item?.id) === String(categoryId));

  const departmentId =
    doc?.departmentId ??
    doc?.department_id ??
    category?.departmentId ??
    category?.department?.id;
  const department =
    departments.find((item) => String(item?.id) === String(departmentId)) ||
    category?.department ||
    documentType?.department;

  return department?.name || department?.departmentName || "Unassigned";
}

/* count-up for KPI numbers */
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
    if (reduce || target === 0) {
      setVal(target);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, loading, duration]);
  return val;
}

function CountUp({ value, loading }) {
  const v = useCountUp(value, loading);
  return <>{v}</>;
}

/* ------------------------------------------------------------------ */
/* Hero illustration                                                   */
/* ------------------------------------------------------------------ */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 320 190" className="h-full w-auto" aria-hidden="true">
      <defs>
        <linearGradient id="udFb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="udFf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#60A5FA" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="udCl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id="udSh" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60A5FA" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <ellipse cx="140" cy="178" rx="105" ry="8" fill="#1E3A8A" opacity=".12" />
      {/* folder back */}
      <path
        d="M24 58a10 10 0 0 1 10-10h50l14 14h92a10 10 0 0 1 10 10v92a10 10 0 0 1-10 10H34a10 10 0 0 1-10-10z"
        fill="url(#udFb)"
      />
      {/* papers */}
      <g transform="rotate(-7 130 70)">
        <rect x="70" y="24" width="104" height="86" rx="8" fill="#EFF6FF" />
      </g>
      <g transform="rotate(4 130 70)">
        <rect x="82" y="22" width="104" height="86" rx="8" fill="#FFFFFF" />
        <rect x="96" y="40" width="60" height="6" rx="3" fill="#BFDBFE" />
        <rect x="96" y="54" width="76" height="6" rx="3" fill="#DBEAFE" />
        <rect x="96" y="68" width="52" height="6" rx="3" fill="#DBEAFE" />
      </g>
      {/* folder front */}
      <path
        d="M24 92a10 10 0 0 1 10-10h192a10 10 0 0 1 10 10v66a10 10 0 0 1-10 10H34a10 10 0 0 1-10-10z"
        fill="url(#udFf)"
      />
      {/* cloud */}
      <g transform="translate(150 92)">
        <g fill="url(#udCl)">
          <rect x="6" y="40" width="104" height="30" rx="15" />
          <circle cx="36" cy="38" r="20" />
          <circle cx="66" cy="28" r="28" />
          <circle cx="94" cy="42" r="17" />
        </g>
        <path
          d="M64 62V36M52 48l12-12 12 12"
          fill="none"
          stroke="#2563EB"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {/* shield */}
      <g className="ud-float-slow" style={{ transformOrigin: "290px 70px" }}>
        <g transform="translate(290 64)">
          <path
            d="M0-26 22-17V4C22 18 12 27 0 32-12 27-22 18-22 4V-17Z"
            fill="url(#udSh)"
          />
          <rect x="-8" y="-3" width="16" height="13" rx="3" fill="#fff" />
          <path
            d="M-5-3v-4a5 5 0 0 1 10 0v4"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
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
    card: "from-blue-50/90 to-white dark:from-blue-500/10 dark:to-[#1A2433]",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
  },
  violet: {
    card: "from-violet-50/90 to-white dark:from-violet-500/10 dark:to-[#1A2433]",
    icon: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
  },
  amber: {
    card: "from-amber-50/90 to-white dark:from-amber-500/10 dark:to-[#1A2433]",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  },
  green: {
    card: "from-emerald-50/90 to-white dark:from-emerald-500/10 dark:to-[#1A2433]",
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

function StatCard({
  icon,
  label,
  value,
  sub,
  trend,
  theme = "blue",
  loading,
  delay = 0,
  pulse,
}) {
  const t = KPI_THEMES[theme];
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`ud-in group rounded-2xl border border-slate-200/70 bg-gradient-to-br p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 ${t.card}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${t.icon} ${pulse ? "ud-pulse" : ""}`}
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
/* Quick actions                                                       */
/* ------------------------------------------------------------------ */
function QuickAction({ icon, label, onClick, highlight, delay }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`ud-pop group flex flex-col items-center justify-center gap-2.5 rounded-xl border px-2 py-4 text-center text-[13px] font-semibold leading-tight transition duration-300 hover:-translate-y-1 hover:shadow-md ${
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
/* Department donut                                                    */
/* ------------------------------------------------------------------ */
function DepartmentCard({ breakdown, total, loading, delay }) {
  const [hover, setHover] = useState(null);
  const R = 52;
  const C = 2 * Math.PI * R;

  const segments = useMemo(() => {
    if (!total) return [];
    let acc = 0;
    return breakdown.map((b, i) => {
      const frac = b.count / total;
      const full = frac * C;
      const gap = breakdown.length > 1 ? 3 : 0;
      const len = Math.max(full - gap, 0.5);
      const seg = {
        ...b,
        color: PALETTE[i % PALETTE.length],
        len,
        offset: -acc,
        pct: Math.round(frac * 100),
      };
      acc += full;
      return seg;
    });
  }, [breakdown, total, C]);

  const active = hover !== null ? segments[hover] : null;

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`ud-in ${CARD} p-5`}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-500 dark:bg-amber-500/15">
          <FolderOpen size={19} />
        </span>
        <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
          My Docs by Department
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-6">
          <div className="h-[150px] w-[150px] animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
          <div className="flex-1 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-700"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative h-[150px] w-[150px] shrink-0">
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
                  key={s.dept}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hover === i ? 18 : 14}
                  strokeDasharray={`${s.len} ${C - s.len}`}
                  strokeDashoffset={s.offset}
                  className="ud-donut-seg cursor-pointer"
                  style={{
                    "--c": C,
                    animationDelay: `${300 + i * 140}ms`,
                    transition: "stroke-width .2s ease",
                  }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[26px] font-extrabold leading-none text-slate-900 dark:text-white">
                {active ? active.count : total}
              </span>
              <span className="mt-1 max-w-[80px] truncate text-[12px] text-slate-500 dark:text-slate-400">
                {active ? active.dept : "Total Docs"}
              </span>
            </div>
          </div>

          <div className="w-full flex-1">
            {segments.length === 0 ? (
              <p className="text-center text-[12px] text-slate-400 dark:text-slate-500">
                No documents available.
              </p>
            ) : (
              segments.map((s, i) => (
                <div
                  key={s.dept}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  style={{ animationDelay: `${400 + i * 90}ms` }}
                  className={`ud-slide flex items-center gap-2.5 border-b border-slate-100 py-2.5 text-[13px] transition-colors last:border-0 dark:border-slate-700/60 ${
                    hover === i ? "bg-slate-50 dark:bg-white/5" : ""
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="flex-1 truncate font-semibold text-slate-700 dark:text-slate-200">
                    {s.dept}
                  </span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {s.count}{" "}
                    <span className="font-medium text-slate-400">
                      ({s.pct}%)
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Recent activity                                                     */
/* ------------------------------------------------------------------ */
const ACTIVITY_META = {
  approved: {
    icon: <Check size={16} />,
    cls: "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300",
  },
  uploaded: {
    icon: <UploadCloud size={16} />,
    cls: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
  },
  workflow: {
    icon: <Play size={14} className="ml-0.5" />,
    cls: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
  },
  pending: {
    icon: <Clock size={15} />,
    cls: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  },
  rejected: {
    icon: <X size={16} />,
    cls: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
  },
};

function ActivityCard({ events, loading, onViewAll, delay }) {
  return (
    <div style={{ animationDelay: `${delay}ms` }} className={`ud-in ${CARD} p-5`}>
      <h2 className="mb-4 text-[18px] font-bold text-slate-900 dark:text-white">
        Recent Activity
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
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
                style={{ animationDelay: `${300 + i * 110}ms` }}
                className="ud-slide relative flex gap-3 pb-5 last:pb-0"
              >
                {!last && (
                  <span className="ud-line absolute left-[17px] top-10 bottom-1 w-px bg-slate-200 dark:bg-slate-700" />
                )}
                <span
                  className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${m.cls}`}
                >
                  {m.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
                    {ev.title}
                  </div>
                  <div className="truncate text-[12px] text-slate-500 dark:text-slate-400">
                    {ev.name}
                  </div>
                  <div className="text-[11.5px] text-slate-400 dark:text-slate-500">
                    {fmtDate(ev.date)} · {fmtTime(ev.date)}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <button
        type="button"
        onClick={onViewAll}
        className="group mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-50 py-2.5 text-[13px] font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
      >
        View All Activity
        <ArrowRight
          size={15}
          className="transition-transform group-hover:translate-x-1"
        />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
export default function UploaderDashboard({ onNavigate, user }) {
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [menuId, setMenuId] = useState(null);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const tokenPayload = decodeToken();
      const tenantId = tokenPayload?.tenantId;

      if (!tenantId) {
        console.error("Tenant ID not found in access token.");
        setDocuments([]);
        setDepartments([]);
        setCategories([]);
        setDocumentTypes([]);
        return;
      }

      const [depRes, catRes, typeRes, docRes] = await Promise.all([
        fetch(`${API_BASE}/departments/tenant/${tenantId}`, {
          headers: authHeaders(),
        }),
        fetch(`${API_BASE}/categories`, { headers: authHeaders() }),
        fetch(`${API_BASE}/document-types`, { headers: authHeaders() }),
        fetch(`${API_BASE}/documents`, { headers: authHeaders() }),
      ]);

      if ([depRes, catRes, typeRes, docRes].some((r) => r.status === 401)) {
        console.error("Session expired — redirecting to login");
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return;
      }

      if (!depRes.ok || !catRes.ok || !typeRes.ok || !docRes.ok) {
        throw new Error("Failed to load dashboard data.");
      }

      const [depData, catData, typeData, docData] = await Promise.all([
        depRes.json(),
        catRes.json(),
        typeRes.json(),
        docRes.json(),
      ]);

      setDepartments(getArray(depData));
      setCategories(getArray(catData));
      setDocumentTypes(getArray(typeData));
      setDocuments(getArray(docData));
    } catch (error) {
      console.error("Uploader dashboard fetch error:", error);
      setDocuments([]);
      setDepartments([]);
      setCategories([]);
      setDocumentTypes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // greeting name (non-blocking)
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/users/profile`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.data?.name) setProfileName(d.data.name);
      })
      .catch(() => {});
  }, []);

  const firstName = useMemo(() => {
    const payload = decodeToken();
    const raw =
      profileName ||
      user?.name ||
      user?.u ||
      payload?.name ||
      payload?.email?.split("@")[0] ||
      "there";
    const w = String(raw).trim().split(/\s+/)[0];
    return w.charAt(0).toUpperCase() + w.slice(1);
  }, [profileName, user]);

  const uploaderDocuments = useMemo(() => {
    const payload = decodeToken();
    const currentUserId = payload?.userId ?? payload?.id ?? payload?.user?.id;
    const currentEmployeeId = payload?.employeeId ?? payload?.employee?.id;

    // Only filter when the document response exposes an owner identifier.
    return documents.filter((doc) => {
      const documentUserId =
        doc?.uploadedById ??
        doc?.uploaderId ??
        doc?.createdById ??
        doc?.userId ??
        doc?.uploadedBy?.id ??
        doc?.createdBy?.id;

      const documentEmployeeId =
        doc?.employeeId ??
        doc?.uploadedByEmployeeId ??
        doc?.uploadedByEmployee?.id;

      if (
        currentUserId !== undefined &&
        currentUserId !== null &&
        documentUserId !== undefined &&
        documentUserId !== null
      ) {
        return String(documentUserId) === String(currentUserId);
      }

      if (
        currentEmployeeId !== undefined &&
        currentEmployeeId !== null &&
        documentEmployeeId !== undefined &&
        documentEmployeeId !== null
      ) {
        return String(documentEmployeeId) === String(currentEmployeeId);
      }

      return true;
    });
  }, [documents]);

  const stats = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let uploadedToday = 0;
    let uploadedYesterday = 0;
    let pendingApproval = 0;
    let approvedThisMonth = 0;
    let approvedLastMonth = 0;

    uploaderDocuments.forEach((doc) => {
      const d = docCreated(doc);
      const status = getDocumentStatus(doc);
      if (status === "WAITING_FOR_APPROVAL") pendingApproval += 1;
      if (!d) return;
      if (d.toDateString() === now.toDateString()) uploadedToday += 1;
      if (d.toDateString() === yesterday.toDateString()) uploadedYesterday += 1;
      if (status === "COMPLETED") {
        if (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        )
          approvedThisMonth += 1;
        if (
          d.getMonth() === lastMonth.getMonth() &&
          d.getFullYear() === lastMonth.getFullYear()
        )
          approvedLastMonth += 1;
      }
    });

    return {
      uploadedToday,
      uploadedTrend: pctChange(uploadedToday, uploadedYesterday),
      totalDocs: uploaderDocuments.length,
      pendingApproval,
      approvedThisMonth,
      approvedTrend: pctChange(approvedThisMonth, approvedLastMonth),
    };
  }, [uploaderDocuments]);

  const recentUploads = useMemo(
    () =>
      [...uploaderDocuments]
        .sort(
          (a, b) =>
            (docCreated(b)?.getTime() || 0) - (docCreated(a)?.getTime() || 0),
        )
        .slice(0, 6),
    [uploaderDocuments],
  );

  const breakdown = useMemo(() => {
    const counts = {};
    uploaderDocuments.forEach((doc) => {
      const dept = getDepartmentName(doc, departments, categories, documentTypes);
      counts[dept] = (counts[dept] || 0) + 1;
    });
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([dept, count]) => ({ dept, count }));
    if (sorted.length <= 6) return sorted;
    const top = sorted.slice(0, 5);
    const others = sorted.slice(5).reduce((s, i) => s + i.count, 0);
    return [...top, { dept: "Others", count: others }];
  }, [uploaderDocuments, departments, categories, documentTypes]);

  // Activity timeline derived from document records
  const activity = useMemo(() => {
    const rank = { approved: 4, rejected: 4, pending: 3, uploaded: 2, workflow: 1 };
    const events = [];
    uploaderDocuments.forEach((doc, idx) => {
      const id = doc?.id ?? idx;
      const name = getDocumentName(doc);
      const created = docCreated(doc);
      const updated = docUpdated(doc) || created;
      const status = getDocumentStatus(doc);
      if (created) {
        events.push({ id: `${id}-up`, type: "uploaded", title: "Document Uploaded", name, date: created });
        events.push({ id: `${id}-wf`, type: "workflow", title: "Workflow Started", name, date: created });
      }
      if (status === "COMPLETED" && updated)
        events.push({ id: `${id}-ok`, type: "approved", title: "Document Approved", name, date: updated });
      if (status === "FAILED" && updated)
        events.push({ id: `${id}-no`, type: "rejected", title: "Document Rejected", name, date: updated });
      if (status === "WAITING_FOR_APPROVAL" && updated)
        events.push({ id: `${id}-wait`, type: "pending", title: "Sent for Approval", name, date: updated });
    });
    return events
      .sort(
        (a, b) =>
          b.date.getTime() - a.date.getTime() || rank[b.type] - rank[a.type],
      )
      .slice(0, 4);
  }, [uploaderDocuments]);

  const go = (key) => () => onNavigate?.(key);

  return (
    <div className="space-y-5">
      <style>{CSS}</style>

      {/* Hero */}
      <section className="ud-in relative flex min-h-[150px] items-center overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-r from-white via-sky-50 to-blue-100/80 px-6 py-7 shadow-sm dark:border-slate-700 dark:from-[#1A2433] dark:via-[#17263d] dark:to-[#12335f] sm:px-8">
        <svg
          className="ud-drift pointer-events-none absolute -bottom-2 left-0 h-24 w-[115%]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 70C200 20 400 110 600 65S1000 20 1200 70V120H0Z" fill="#3B82F6" opacity=".08" />
          <path d="M0 90C220 50 420 120 640 85S1000 55 1200 95V120H0Z" fill="#60A5FA" opacity=".10" />
        </svg>

        <div className="relative z-10 md:max-w-[58%]">
          <h1 className="text-[26px] font-extrabold leading-tight text-slate-900 dark:text-white sm:text-[30px]">
            {greeting()},{" "}
            <span className="text-blue-600 dark:text-blue-400">{firstName}</span>{" "}
            <span className="ud-hand">👋</span>
          </h1>
          <p className="mt-1.5 text-[15px] text-slate-600 dark:text-slate-300">
            Upload, manage and track your documents securely in e-Vault.
          </p>
        </div>

        <div className="ud-float pointer-events-none absolute bottom-0 right-6 hidden h-[170px] md:block">
          <HeroIllustration />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* ---------------- Left column ---------------- */}
        <div className="min-w-0 space-y-5">
          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <StatCard
              loading={loading}
              theme="blue"
              icon={<UploadCloud size={24} />}
              label="Uploaded"
              value={stats.uploadedToday}
              trend={stats.uploadedTrend}
              sub="Documents uploaded"
              delay={100}
            />
            <StatCard
              loading={loading}
              theme="violet"
              icon={<FileText size={24} />}
              label="Total My Docs"
              value={stats.totalDocs}
              sub="Across your documents"
              delay={180}
            />
            <StatCard
              loading={loading}
              theme="amber"
              icon={<Hourglass size={24} />}
              label="Pending Approval"
              value={stats.pendingApproval}
              sub={
                stats.pendingApproval > 0
                  ? "Awaiting review"
                  : "No pending approvals"
              }
              pulse={!loading && stats.pendingApproval > 0}
              delay={260}
            />
            <StatCard
              loading={loading}
              theme="green"
              icon={<Check size={24} />}
              label="Approved This Month"
              value={stats.approvedThisMonth}
              trend={stats.approvedTrend}
              sub="Completed this month"
              delay={340}
            />
          </div>

          {/* Quick actions + department */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div style={{ animationDelay: "400ms" }} className={`ud-in ${CARD} p-5`}>
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                  <Zap size={19} />
                </span>
                <div>
                  <h2 className="text-[16px] font-bold leading-tight text-slate-900 dark:text-white">
                    Quick Actions
                  </h2>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">
                    Common tasks to manage your documents
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-4">
                <QuickAction
                  highlight
                  delay={480}
                  icon={<UploadCloud size={28} />}
                  label={<>Upload<br />Document</>}
                  onClick={go("upload")}
                />
                <QuickAction
                  delay={540}
                  icon={<FileText size={28} />}
                  label={<>View<br />My Documents</>}
                  onClick={go("documents")}
                />
                <QuickAction
                  delay={600}
                  icon={<ClipboardCheck size={28} />}
                  label={<>Check<br />Approval Status</>}
                  onClick={go("documents")}
                />
                <QuickAction
                  delay={660}
                  icon={<Network size={28} />}
                  label={<>Cross Dept.<br />Access</>}
                  onClick={go("crossDepartmentRequest")}
                />
              </div>
            </div>

            <DepartmentCard
              breakdown={breakdown}
              total={uploaderDocuments.length}
              loading={loading}
              delay={460}
            />
          </div>

          {/* Recent uploads */}
          <div style={{ animationDelay: "520ms" }} className={`ud-in ${CARD} p-5`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                  <BookOpen size={19} />
                </span>
                <div>
                  <h2 className="text-[16px] font-bold leading-tight text-slate-900 dark:text-white">
                    Recent Uploads
                  </h2>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">
                    Latest documents uploaded by you
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  aria-label="Refresh"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300"
                >
                  <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                </button>
                <button
                  type="button"
                  onClick={go("documents")}
                  className="group flex items-center gap-1.5 rounded-lg bg-blue-50 px-3.5 py-2 text-[13px] font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                >
                  View All
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700"
                  />
                ))}
              </div>
            ) : recentUploads.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mb-2 text-3xl">📄</div>
                <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                  No documents uploaded yet.
                </p>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Upload your first document to see it here.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60">
                        {[
                          "File Name",
                          "DMS Code",
                          "Department",
                          "Status",
                          "Uploaded On",
                          "Size",
                          "Actions",
                        ].map((h, i, arr) => (
                          <th
                            key={h}
                            className={`px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${
                              i === 0 ? "rounded-l-lg" : ""
                            } ${i === arr.length - 1 ? "rounded-r-lg" : ""}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentUploads.map((doc, i) => {
                        const status = getDocumentStatus(doc);
                        const meta = STATUS_META[status] || {
                          label: status,
                          color: "text-slate-600 dark:text-slate-400",
                          bg: "bg-slate-100 dark:bg-slate-700",
                        };
                        const fileName = getDocumentName(doc);
                        const badge = getFileBadge(fileName);
                        const dms = getDmsCode(doc);
                        const created = docCreated(doc);
                        const rowId = doc?.id ?? `${fileName}-${i}`;

                        return (
                          <tr
                            key={rowId}
                            style={{ animationDelay: `${600 + i * 70}ms` }}
                            className="ud-slide border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-white/5"
                          >
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-[9px] font-extrabold ${badge.c}`}
                                >
                                  {badge.t}
                                </span>
                                <span className="max-w-[220px] truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                                  {fileName}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              {dms ? (
                                <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                                  {dms}
                                </span>
                              ) : (
                                <span className="text-[12px] text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-[13px] text-slate-600 dark:text-slate-300">
                              {getDepartmentName(doc, departments, categories, documentTypes)}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${meta.bg} ${meta.color}`}
                              >
                                {meta.icon ? (
                                  <Check size={12} strokeWidth={3} />
                                ) : (
                                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                )}
                                {meta.label}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-[12.5px] leading-tight text-slate-700 dark:text-slate-300">
                              {fmtDate(created)}
                              <div className="text-[11.5px] text-slate-400 dark:text-slate-500">
                                {fmtTime(created)}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-[12.5px] text-slate-500 dark:text-slate-400">
                              {getDocumentSize(doc)}
                            </td>
                            <td className="px-3 py-3">
                              <div className="relative flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={go("documents")}
                                  aria-label="View document"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-blue-600 transition hover:scale-105 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-blue-500/10"
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMenuId((v) => (v === rowId ? null : rowId))
                                  }
                                  aria-label="More actions"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  <MoreVertical size={15} />
                                </button>

                                {menuId === rowId && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-30"
                                      onClick={() => setMenuId(null)}
                                    />
                                    <div className="ud-pop absolute right-0 top-9 z-40 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-[#1A2433]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMenuId(null);
                                          onNavigate?.("documents");
                                        }}
                                        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                      >
                                        <Eye size={14} /> Open repository
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

                {/* Mobile */}
                <div className="space-y-2 sm:hidden">
                  {recentUploads.map((doc, i) => {
                    const status = getDocumentStatus(doc);
                    const meta = STATUS_META[status] || {
                      label: status,
                      color: "text-slate-600 dark:text-slate-400",
                      bg: "bg-slate-100 dark:bg-slate-700",
                    };
                    const fileName = getDocumentName(doc);
                    const badge = getFileBadge(fileName);
                    const created = docCreated(doc);
                    return (
                      <div
                        key={doc?.id ?? `${fileName}-${i}`}
                        style={{ animationDelay: `${i * 70}ms` }}
                        className="ud-slide flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"
                      >
                        <span
                          className={`mt-0.5 flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-[9px] font-extrabold ${badge.c}`}
                        >
                          {badge.t}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                            {fileName}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-slate-400">
                            {getDepartmentName(doc, departments, categories, documentTypes)} ·{" "}
                            {fmtDate(created)} · {getDocumentSize(doc)}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.bg} ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ---------------- Right column ---------------- */}
        <div className="min-w-0 space-y-5">
          <button
            type="button"
            onClick={go("upload")}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              onNavigate?.("upload");
            }}
            style={{ animationDelay: "120ms" }}
            className={`ud-in ud-shine group flex w-full items-center gap-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-5 text-left text-white shadow-lg shadow-blue-600/25 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/35 ${
              dragging ? "scale-[1.02] ring-4 ring-blue-300/60" : ""
            }`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
              <UploadCloud size={26} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-bold">Upload Document</span>
              <span className="block text-[12px] text-white/80">
                {dragging ? "Drop to start workflow" : "Drag & drop or browse files"}
              </span>
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 transition-transform duration-300 group-hover:translate-x-1">
              <ArrowRight size={18} />
            </span>
          </button>

          <ActivityCard
            events={activity}
            loading={loading}
            onViewAll={go("documents")}
            delay={200}
          />
        </div>
      </div>
    </div>
  );
}