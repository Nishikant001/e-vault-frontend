import { useState, useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { NotificationApi } from "../../services/subscriptionApi";
import { getDocumentAccessRequests } from "../../features/crossDepartmentDocument/api";
import { get } from "../../services/apiClient";
import { useTenantStorage, formatBytes } from "../../hooks/useTenantStorage";
import {
  Users,
  FileText,
  CheckCircle2,
  ClipboardList,
  MoreHorizontal,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Activity,
  XCircle,
  Hourglass,
  User,
  Zap,
  ShieldCheck,
  Bell,
  Upload,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Clock,
  Folder,
  PieChart,
  HardDrive,
} from "lucide-react";

import { API_BASE_URL } from "../../services/apiClient";
import SubscriptionCard from "../../components/subscription/SubscriptionCard";

Chart.register(...registerables);

const API_BASE = API_BASE_URL;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function getToken() {
  return localStorage.getItem("accessToken") || "";
}
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
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
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function formatRole(role) {
  return String(role || "Unknown")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function timeAgo(date) {
  if (!date) return "—";
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}
const docStatus = (d) => d.uploadStatus || d.status || "UNKNOWN";
const dayKey = (d) => new Date(d).toDateString();

/* Running total of items over time (oldest item -> now) — gives a real growth curve. */
function growth(items, points = 8) {
  const times = items
    .map((x) => (x.createdAt ? new Date(x.createdAt).getTime() : null))
    .filter((t) => t !== null && !Number.isNaN(t));
  if (times.length === 0) return Array(points).fill(items.length);
  const start = Math.min(...times);
  const end = Date.now();
  const step = (end - start || 1) / (points - 1);
  const noDate = items.length - times.length;
  return Array.from({ length: points }, (_, i) => {
    const t = start + step * i;
    return noDate + times.filter((x) => x <= t).length;
  });
}

/* Growth %: items added in the last `days` vs. what existed before that. Never negative. */
function delta(items, days = 30) {
  const cutoff = Date.now() - days * 864e5;
  const cur = items.filter((x) => x.createdAt && new Date(x.createdAt).getTime() > cutoff).length;
  const before = items.length - cur;
  if (cur === 0) return "+0%";
  if (before === 0) return "+100%";
  return `+${Math.round((cur / before) * 100)}%`;
}

const ROLE_COLORS = {
  TenantAdmin: "#2563eb",
  BranchManager: "#0f766e",
  DeptHead: "#d97706",
  Manager: "#b45309",
  Uploader: "#059669",
  Viewer: "#64748b",
  Auditor: "#b91c1c",
  Approver: "#047857",
};

const STATUS_META = {
  COMPLETED: { label: "Completed", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  OCR_COMPLETED: { label: "OCR Done", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
  OCR_PROCESSING: { label: "OCR Processing", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
  WAITING_FOR_APPROVAL: { label: "Awaiting Approval", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
  SAVING_TO_SAP: { label: "Saving to SAP", color: "text-violet-700 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20" },
  FAILED: { label: "Failed", color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
};

const STATUS_COLORS = {
  COMPLETED: "#059669",
  OCR_COMPLETED: "#2563eb",
  OCR_PROCESSING: "#d97706",
  WAITING_FOR_APPROVAL: "#ea580c",
  SAVING_TO_SAP: "#7c3aed",
  FAILED: "#dc2626",
};

const TONE_DOT = { blue: "bg-blue-500", amber: "bg-amber-500", emerald: "bg-emerald-500", violet: "bg-violet-500" };

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */
const CARD =
  "rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_-4px_rgba(15,40,90,0.10)] dark:border-slate-700 dark:bg-[#172130]";

function Spark({ data, color }) {
  const w = 110, h = 44;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [
    (i * w) / (data.length - 1),
    max === min ? h / 2 : h - 6 - ((v - min) / (max - min)) * (h - 14),
  ]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1][0] + pts[i][0]) / 2;
    d += ` C ${mx} ${pts[i - 1][1]}, ${mx} ${pts[i][1]}, ${pts[i][0]} ${pts[i][1]}`;
  }
  const gid = `sp${color.replace("#", "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function StatCard({ label, value, delta, sub, subColor, icon, tint, spark, sparkColor, loading }) {
  return (
    <div className={`${CARD} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tint}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {label}
            </span>
            <MoreHorizontal size={16} className="text-slate-400" />
          </div>
          <div className="mt-1 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                {loading ? (
                  <div className="h-8 w-12 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                ) : (
                  <span className="text-[30px] font-extrabold leading-none text-slate-900 dark:text-white">
                    {value}
                  </span>
                )}
                {delta && (
                  <span className={`flex items-center text-[11px] font-semibold ${delta.startsWith("-") ? "text-red-500" : "text-emerald-600"}`}>
                    {delta.startsWith("-") ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
                    {delta}
                  </span>
                )}
              </div>
              <div className={`mt-1.5 text-[11.5px] font-medium ${subColor || "text-slate-500 dark:text-slate-400"}`}>
                {sub}
              </div>
            </div>
            <Spark data={spark} color={sparkColor} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelHead({ icon, tint, title, subtitle, right }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && (
            <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

function LinkBtn({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-[12px] font-semibold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300"
    >
      {children}
    </button>
  );
}

function Empty({ text }) {
  return (
    <div className="flex min-h-[110px] items-center justify-center text-[12px] text-slate-400">
      {text}
    </div>
  );
}

function MiniStat({ icon, tint, label, value, delta, loading }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3 dark:border-slate-700 dark:bg-slate-800/50">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        {icon}
      </span>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[22px] font-extrabold leading-tight text-slate-900 dark:text-white">
            {loading ? "—" : value}
          </span>
          <span className={`text-[10.5px] font-semibold ${delta?.startsWith("-") ? "text-red-500" : "text-emerald-600"}`}>{delta}</span>
        </div>
      </div>
    </div>
  );
}

/* Hero illustration (DEMO artwork built with CSS) */
function HeroArt() {
  return (
    <div className="pointer-events-none relative hidden h-full w-[470px] shrink-0 lg:block" aria-hidden="true">
      <div className="absolute right-24 top-6 h-40 w-52 -rotate-6 rounded-2xl bg-white/60 shadow-xl backdrop-blur" />
      <div className="absolute right-28 top-3 h-40 w-52 -rotate-3 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-xl">
        <div className="m-4 h-4 w-20 rounded-full bg-white/80" />
        <div className="mx-4 h-2 w-28 rounded-full bg-white/40" />
      </div>
      <div className="absolute right-[88px] top-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-lg">
        <ShieldCheck className="text-blue-600" size={28} />
      </div>
      <div className="absolute bottom-3 left-8 w-52 -rotate-[8deg] rounded-xl bg-white/80 p-3 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2">
          <ShieldCheck className="shrink-0 text-blue-600" size={26} />
          <div className="text-[11px] font-semibold leading-4 text-slate-700">
            Secure<br />Organize<br />Access Everywhere
          </div>
        </div>
      </div>
      <div className="absolute right-0 top-2 flex w-24 flex-col gap-2 rounded-2xl bg-white/70 p-2.5 shadow-xl">
        {[["PDF", "bg-red-500"], ["DOC", "bg-blue-500"], ["XLS", "bg-emerald-500"]].map(([t, c]) => (
          <div key={t} className="flex items-center gap-2 rounded-lg bg-white p-1.5 shadow-sm">
            <span className={`rounded px-1 py-0.5 text-[8px] font-bold text-white ${c}`}>{t}</span>
            <span className="h-1.5 flex-1 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main dashboard                                                      */
/* ------------------------------------------------------------------ */
export default function TADashboard({ onNavigate }) {
  const [users, setUsers] = useState([]);
  const [docs, setDocs] = useState([]);
  const [depts, setDepts] = useState([]);
  const [cats, setCats] = useState([]);
  const [dts, setDts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);
  const [extra, setExtra] = useState({ access: 0, notif: 0, logs: [] });
  const storage = useTenantStorage();

  const trendRef = useRef(null);
  const trendInst = useRef(null);
  const statusRef = useRef(null);
  const statusInst = useRef(null);

  const tokenPayload = decodeToken();
  const rawName =
    tokenPayload?.name || tokenPayload?.fullName || tokenPayload?.email?.split("@")[0] || "there";
  const displayName = String(rawName).replace(/^\w/, (c) => c.toUpperCase());

  useEffect(() => {
    const payload = decodeToken();
    if (payload?.tenantId) fetchAll(payload.tenantId);
    else setLoading(false);
  }, []);

  async function fetchAll(tenantId) {
    setLoading(true);
    try {
      const [uRes, dRes, cRes, dtRes, docRes] = await Promise.all([
        fetch(`${API_BASE}/users`, { headers: authHeaders() }),
        fetch(`${API_BASE}/departments/tenant/${tenantId}`, { headers: authHeaders() }),
        fetch(`${API_BASE}/categories`, { headers: authHeaders() }),
        fetch(`${API_BASE}/document-types`, { headers: authHeaders() }),
        fetch(`${API_BASE}/documents`, { headers: authHeaders() }),
      ]);

      if ([uRes, dRes, cRes, dtRes, docRes].some((r) => r.status === 401)) {
        console.error("Session expired — redirecting to login");
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return;
      }

      const uData = await uRes.json();
      const dData = await dRes.json();
      const cData = await cRes.json();
      const dtData = await dtRes.json();
      const docData = await docRes.json();
      const arr = (x) => (Array.isArray(x?.data) ? x.data : Array.isArray(x) ? x : []);

      setUsers(uData.success ? uData.data || [] : []);
      setDepts(Array.isArray(dData.data) ? dData.data : []);
      setCats(arr(cData));
      setDts(arr(dtData));
      setDocs(arr(docData));

      const [acc, notif, logs] = await Promise.allSettled([
        getDocumentAccessRequests({ status: "PENDING" }),
        NotificationApi.unreadCount(),
        get("/audit-logs", { limit: 5, sortBy: "createdAt", sortOrder: "DESC" }),
      ]);
      setExtra({
        access: acc.value?.data?.length ?? 0,
        notif: notif.value?.data?.count ?? 0,
        logs: logs.value?.data ?? [],
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  const refresh = () => {
    const p = decodeToken();
    if (p?.tenantId) fetchAll(p.tenantId);
  };

  /* ---- derived numbers ---- */
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;
  const totalDocs = docs.length;
  const pendingApproval = docs.filter((d) => docStatus(d) === "WAITING_FOR_APPROVAL").length;
  const failedDocs = docs.filter((d) => docStatus(d) === "FAILED").length;
  const completedDocs = docs.filter((d) => docStatus(d) === "COMPLETED").length;
  const waitingDocs = docs.filter((d) => docStatus(d) === "WAITING_FOR_APPROVAL");
  const doneDocs = docs.filter((d) => docStatus(d) === "COMPLETED");
  const failedList = docs.filter((d) => docStatus(d) === "FAILED");
  const todayStr = new Date().toDateString();
  const uploadedToday = docs.filter(
    (d) => d.createdAt && new Date(d.createdAt).toDateString() === todayStr
  ).length;

  const roleCounts = {};
  users.forEach((u) => (roleCounts[u.role] = (roleCounts[u.role] || 0) + 1));
  const rolesArr = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);
  const maxRole = rolesArr[0]?.[1] || 1;

  const statusCounts = {};
  docs.forEach((d) => (statusCounts[docStatus(d)] = (statusCounts[docStatus(d)] || 0) + 1));
  const statusArr = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);

  const dtMap = {};
  dts.forEach((dt) => (dtMap[dt.id] = dt));
  const deptDocCount = {};
  docs.forEach((doc) => {
    const dt = dtMap[doc.documentTypeId];
    const cat = dt && cats.find((c) => c.id === dt.categoryId);
    const dept = cat && depts.find((d) => d.id === cat.departmentId);
    if (dept) deptDocCount[dept.id] = (deptDocCount[dept.id] || 0) + 1;
  });
  const maxDeptDocs = Math.max(...Object.values(deptDocCount), 1);

  const recentDocs = [...docs]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 4);

  const activities = extra.logs.map((l) => ({
    text: formatRole(l.action),
    by: l.username || "System",
    time: timeAgo(l.createdAt),
    tone: l.status === "FAILED" ? "amber" : "blue",
  }));

  /* ---- storage breakdown (real, from documents) ---- */
  const mt = (d) => d.mimeType || "";
  const sz = (d) => Number(d.fileSizeBytes) || 0;
  const imgBytes = docs.filter((d) => mt(d).startsWith("image/")).reduce((a, d) => a + sz(d), 0);
  const docBytes = docs
    .filter((d) => /pdf|word|excel|sheet|text|presentation|csv/.test(mt(d)))
    .reduce((a, d) => a + sz(d), 0);
  const otherBytes = Math.max(0, storage.usedBytes - imgBytes - docBytes);
  const storageBreakdown = [
    { label: "Documents", size: formatBytes(docBytes), color: "#2563eb" },
    { label: "Images", size: formatBytes(imgBytes), color: "#10b981" },
    { label: "Others", size: formatBytes(otherBytes), color: "#f59e0b" },
  ];

  /* ---- upload trend chart (real data) ---- */
  const trend = (() => {
    const days = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const real = days.map(
      (day) => docs.filter((d) => d.createdAt && new Date(d.createdAt).toDateString() === day.toDateString()).length
    );
    return {
      labels: days.map((d) => d.toLocaleDateString("en-US", { month: "short", day: "2-digit" })),
      data: real,
    };
  })();

  useEffect(() => {
    if (!trendRef.current) return;
    trendInst.current?.destroy();
    const ctx = trendRef.current.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, "rgba(37,99,235,0.28)");
    grad.addColorStop(1, "rgba(37,99,235,0.02)");
    trendInst.current = new Chart(trendRef.current, {
      type: "line",
      data: {
        labels: trend.labels,
        datasets: [
          {
            data: trend.data,
            borderColor: "#2563eb",
            backgroundColor: grad,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 2.5,
            pointBackgroundColor: "#fff",
            pointBorderColor: "#2563eb",
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            backgroundColor: "#0f172a",
            callbacks: { label: (c) => `${c.parsed.y} documents uploaded` },
          },
        },
        scales: {
          x: { grid: { color: "rgba(128,128,128,0.10)" }, ticks: { font: { size: 10 }, maxTicksLimit: 10, maxRotation: 0 } },
          y: { beginAtZero: true, ticks: { font: { size: 10 }, precision: 0 }, grid: { color: "rgba(128,128,128,0.10)" } },
        },
      },
    });
    return () => {
      trendInst.current?.destroy();
      trendInst.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs, range]);

  useEffect(() => {
    if (!statusRef.current || statusArr.length === 0) return;
    statusInst.current?.destroy();
    statusInst.current = new Chart(statusRef.current, {
      type: "doughnut",
      data: {
        labels: statusArr.map(([s]) => STATUS_META[s]?.label || formatRole(s)),
        datasets: [
          {
            data: statusArr.map(([, c]) => c),
            backgroundColor: statusArr.map(([s]) => `${STATUS_COLORS[s] || "#64748b"}dd`),
            borderColor: statusArr.map(([s]) => STATUS_COLORS[s] || "#64748b"),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: { legend: { position: "bottom", labels: { font: { size: 10 }, boxWidth: 9, padding: 8 } } },
      },
    });
    return () => {
      statusInst.current?.destroy();
      statusInst.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs, loading]);

  /* ---- Action Center rows ---- */
  const actionRows = [
    {
      key: "approvals",
      title: "Pending approvals",
      sub: pendingApproval > 0 ? `${pendingApproval} document${pendingApproval === 1 ? "" : "s"} need review` : "Nothing waiting for approval",
      badge: pendingApproval,
      badgeCls: "bg-red-50 text-red-500",
      icon: <FileText size={18} className="text-orange-500" />,
      tint: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      key: "crossDepartmentRequest",
      title: "Access requests",
      sub: extra.access > 0 ? `${extra.access} pending request${extra.access === 1 ? "" : "s"}` : "No pending requests",
      badge: extra.access,
      badgeCls: "bg-blue-50 text-blue-600",
      icon: <ShieldCheck size={18} className="text-blue-600" />,
      tint: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      key: "audit",
      title: "System notifications",
      sub: extra.notif > 0 ? `${extra.notif} unread notification${extra.notif === 1 ? "" : "s"}` : "No unread notifications",
      badge: extra.notif,
      badgeCls: "bg-red-50 text-red-500",
      icon: <Bell size={18} className="text-orange-500" />,
      tint: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      key: "documents",
      title: "Recent uploads",
      sub: `${uploadedToday} document${uploadedToday === 1 ? "" : "s"} uploaded today`,
      badge: uploadedToday,
      badgeCls: "bg-emerald-50 text-emerald-600",
      icon: <Upload size={18} className="text-emerald-600" />,
      tint: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      key: "aiChat",
      title: "AI Assistant",
      sub: "Chat, search and summarize documents",
      badge: "Open",
      badgeCls: "bg-violet-50 text-violet-600",
      icon: <Sparkles size={18} className="text-violet-600" />,
      tint: "bg-violet-50 dark:bg-violet-900/20",
    },
  ];

  const ringC = 2 * Math.PI * 38;

  return (
    <div className="space-y-4 pb-6">
      {/* ================= HERO ================= */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-[#eaf1ff] via-[#dce9fc] to-[#c7dbf7] px-6 py-6 dark:border-slate-700 dark:from-[#14264a] dark:via-[#163059] dark:to-[#1a3a70] sm:px-8">
        <div className="relative flex items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-blue-200">
              Tenant Administration
            </div>
            <h1 className="mt-1 text-[30px] font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[36px]">
              <span className="text-blue-600 dark:text-blue-400">{greeting()}</span>, {displayName} <span>👋</span>
            </h1>
            <p className="mt-1 max-w-xl text-[13.5px] text-slate-600 dark:text-blue-100">
              Monitor your document workspace, people, approvals and organizational structure from one place.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate?.("documents")}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-[13px] font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700"
              >
                Document Management <ArrowRight size={14} />
              </button>
              {[
                ["Workflow", "workflow"],
                ["Organization Control", "companyCodes"],
                ["Reports", "audit"],
              ].map(([label, key]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onNavigate?.(key)}
                  className="rounded-full border border-blue-200 bg-white/60 px-5 py-2.5 text-[13px] font-bold text-blue-700 transition hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <HeroArt />
        </div>
      </div>

      {/* Existing subscription logic preserved */}
      <SubscriptionCard docs={docs} onUpgradeClick={() => onNavigate?.("subscription")} />

      {/* ================= KPI STRIP ================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          loading={loading}
          label="Total Users"
          value={totalUsers}
          delta={delta(users)}
          sub={`${activeUsers} active • ${inactiveUsers} inactive`}
          icon={<Users size={22} className="text-blue-600" />}
          tint="bg-blue-50 dark:bg-blue-900/20"
          spark={growth(users)}
          sparkColor="#2563eb"
        />
        <StatCard
          loading={loading}
          label="Documents"
          value={totalDocs}
          delta={delta(docs)}
          sub={`${completedDocs} completed`}
          subColor="text-emerald-600"
          icon={<FileText size={22} className="text-indigo-600" />}
          tint="bg-indigo-50 dark:bg-indigo-900/20"
          spark={growth(docs)}
          sparkColor="#7c3aed"
        />
        <StatCard
          loading={loading}
          label="Pending Approvals"
          value={pendingApproval}
          delta={delta(waitingDocs)}
          sub={pendingApproval > 0 ? "Needs attention" : "All clear"}
          subColor={pendingApproval > 0 ? "text-amber-600" : "text-emerald-600"}
          icon={<CheckCircle2 size={22} className="text-emerald-600" />}
          tint="bg-emerald-50 dark:bg-emerald-900/20"
          spark={growth(waitingDocs)}
          sparkColor="#10b981"
        />
        <StatCard
          loading={loading}
          label="Organization"
          value={depts.length}
          delta={delta(depts)}
          sub={`${cats.length} categories • ${dts.length} document types`}
          icon={<ClipboardList size={22} className="text-orange-500" />}
          tint="bg-orange-50 dark:bg-orange-900/20"
          spark={growth(depts)}
          sparkColor="#f59e0b"
        />
      </div>

      {/* ================= WORKSPACE HEALTH + ACTION CENTER ================= */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section className={`${CARD} p-5`}>
          <PanelHead
            icon={<Activity size={20} className="text-blue-600" />}
            tint="bg-blue-50 dark:bg-blue-900/20"
            title="Workspace Health"
            subtitle="Real-time overview of your tenant environment"
            right={
              <div className="flex items-center gap-2.5">
                <div className="relative hidden sm:block">
                  <select
                    value={range}
                    onChange={(e) => setRange(Number(e.target.value))}
                    className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-7 text-[12px] font-medium text-slate-600 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <button
                  type="button"
                  onClick={refresh}
                  title="Click to refresh"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                >
                  <span className={`h-2 w-2 rounded-full bg-emerald-500 ${loading ? "animate-pulse" : ""}`} />
                  Live Overview
                </button>
              </div>
            }
          />

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MiniStat loading={loading} label="Active Users" value={activeUsers} delta={delta(users.filter((u) => u.isActive))} tint="bg-blue-50 dark:bg-blue-900/20" icon={<User size={18} className="text-blue-600" />} />
            <MiniStat loading={loading} label="Completed" value={completedDocs} delta={delta(doneDocs)} tint="bg-emerald-50 dark:bg-emerald-900/20" icon={<CheckCircle2 size={18} className="text-emerald-600" />} />
            <MiniStat loading={loading} label="Awaiting Approval" value={pendingApproval} delta={delta(waitingDocs)} tint="bg-orange-50 dark:bg-orange-900/20" icon={<Hourglass size={18} className="text-orange-500" />} />
            <MiniStat loading={loading} label="Failed" value={failedDocs} delta={delta(failedList)} tint="bg-red-50 dark:bg-red-900/20" icon={<XCircle size={18} className="text-red-500" />} />
          </div>

          <div className="relative mt-4 h-[200px]">
            <canvas ref={trendRef} role="img" aria-label="Documents uploaded over time" />
          </div>
        </section>

        <section className={`${CARD} p-5`}>
          <PanelHead
            icon={<Zap size={20} className="text-orange-500" />}
            tint="bg-orange-50 dark:bg-orange-900/20"
            title="Action Center"
            subtitle="Your pending tasks and important updates"
            right={
              <LinkBtn onClick={() => onNavigate?.("approvals")}>
                View All <ArrowRight size={13} />
              </LinkBtn>
            }
          />
          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-700/70">
            {actionRows.map((r) => (
              <button
                key={r.title}
                type="button"
                onClick={() => onNavigate?.(r.key)}
                className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${r.tint}`}>{r.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-slate-800 dark:text-slate-100">{r.title}</span>
                  <span className="block truncate text-[11.5px] text-slate-500 dark:text-slate-400">{r.sub}</span>
                </span>
                <span className={`min-w-[30px] rounded-full px-2.5 py-1 text-center text-[11px] font-bold ${r.badgeCls}`}>
                  {r.badge}
                </span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ================= RECENT DOCS / ACTIVITIES / STORAGE ================= */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent Documents */}
        <section className={`${CARD} p-5`}>
          <PanelHead
            icon={<FileText size={20} className="text-blue-600" />}
            tint="bg-blue-50 dark:bg-blue-900/20"
            title="Recent Documents"
            right={<LinkBtn onClick={() => onNavigate?.("documents")}>View All <ArrowRight size={13} /></LinkBtn>}
          />
          <div className="mt-3">
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700" />
                ))}
              </div>
            ) : recentDocs.length === 0 ? (
              <Empty text="No documents uploaded yet" />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/70">
                {recentDocs.map((doc) => {
                  const s = docStatus(doc);
                  const meta = STATUS_META[s] || { label: formatRole(s), color: "text-slate-600", bg: "bg-slate-100" };
                  return (
                    <div key={doc.id} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                        <FileText size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">
                          {doc.originalFileName || doc.name || "Untitled"}
                        </div>
                        <div className="text-[11px] text-slate-400">{timeAgo(doc.createdAt)}</div>
                      </div>
                      <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Recent Activities */}
        <section className={`${CARD} p-5`}>
          <PanelHead
            icon={<Clock size={20} className="text-slate-600 dark:text-slate-300" />}
            tint="bg-slate-100 dark:bg-slate-800"
            title="Recent Activities"
            right={<LinkBtn onClick={() => onNavigate?.("audit")}>View All <ArrowRight size={13} /></LinkBtn>}
          />
          <div className="mt-3 space-y-3">
            {loading ? (
              <Empty text="Loading..." />
            ) : activities.length === 0 ? (
              <Empty text="No recent activity" />
            ) : (
              activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOT[a.tone]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">{a.text}</div>
                    <div className="text-[11px] text-slate-400">{a.by}</div>
                  </div>
                  <span className="whitespace-nowrap text-[11px] text-slate-400">{a.time}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Storage Usage */}
        <section className={`${CARD} p-5`}>
          <PanelHead
            icon={<HardDrive size={20} className="text-blue-600" />}
            tint="bg-blue-50 dark:bg-blue-900/20"
            title="Storage Usage"
            right={<LinkBtn onClick={() => onNavigate?.("subscription")}>Manage</LinkBtn>}
          />
          <div className="mt-4 flex items-center gap-5">
            <div className="relative h-[104px] w-[104px] shrink-0">
              <svg viewBox="0 0 100 100" className="-rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" strokeWidth="10" className="stroke-slate-100 dark:stroke-slate-700" />
                <circle
                  cx="50" cy="50" r="38" fill="none" stroke="#2563eb" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(storage.percent / 100) * ringC} ${ringC}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[20px] font-extrabold text-slate-900 dark:text-white">
                {storage.percent}%
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-slate-800 dark:text-white">
                {formatBytes(storage.usedBytes)} / {formatBytes(storage.quotaBytes)}
              </div>
              <div className="mt-2 space-y-1.5">
                {storageBreakdown.map((b) => (
                  <div key={b.label} className="flex items-center gap-2 text-[11.5px] text-slate-500 dark:text-slate-400">
                    <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                    <span className="flex-1">{b.label}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{b.size}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ================= EXISTING ANALYTICS (kept) ================= */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className={`${CARD} p-5`}>
          <PanelHead
            icon={<Users size={20} className="text-blue-600" />}
            tint="bg-blue-50 dark:bg-blue-900/20"
            title="Users by Role"
            right={<LinkBtn onClick={() => onNavigate?.("users")}>Manage <ArrowRight size={13} /></LinkBtn>}
          />
          <div className="mt-4 space-y-3">
            {loading ? (
              <Empty text="Loading..." />
            ) : rolesArr.length === 0 ? (
              <Empty text="No users found" />
            ) : (
              rolesArr.map(([role, count]) => (
                <div key={role} className="flex items-center gap-3">
                  <div className="w-[100px] shrink-0 truncate text-[12px] font-medium text-slate-600 dark:text-slate-400">
                    {formatRole(role)}
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((count / maxRole) * 100)}%`, backgroundColor: ROLE_COLORS[role] || "#2563eb" }}
                    />
                  </div>
                  <div className="w-6 text-right text-[12px] font-bold text-slate-700 dark:text-slate-200">{count}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={`${CARD} p-5`}>
          <PanelHead
            icon={<PieChart size={20} className="text-indigo-600" />}
            tint="bg-indigo-50 dark:bg-indigo-900/20"
            title="Document Status"
            right={
              failedDocs > 0 ? (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">{failedDocs} failed</span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">Healthy</span>
              )
            }
          />
          <div className="relative mt-3 h-[190px]">
            {loading || statusArr.length === 0 ? (
              <Empty text={loading ? "Loading..." : "No document status data"} />
            ) : (
              <canvas ref={statusRef} role="img" aria-label="Document status doughnut chart" />
            )}
          </div>
        </section>

        <section className={`${CARD} p-5`}>
          <PanelHead
            icon={<Folder size={20} className="text-amber-600" />}
            tint="bg-amber-50 dark:bg-amber-900/20"
            title="Documents by Department"
            right={<span className="text-[11px] font-semibold text-slate-400">{depts.length} depts</span>}
          />
          <div className="mt-3 max-h-[200px] overflow-y-auto">
            {loading ? (
              <Empty text="Loading..." />
            ) : depts.length === 0 ? (
              <Empty text="No departments configured" />
            ) : (
              depts.map((dept) => {
                const count = deptDocCount[dept.id] || 0;
                return (
                  <div key={dept.id} className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-700/70">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20">
                      <Folder size={13} />
                    </span>
                    <div className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-700 dark:text-slate-300">{dept.name}</div>
                    <div className="hidden w-[70px] sm:block">
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.round((count / maxDeptDocs) * 100)}%` }} />
                      </div>
                    </div>
                    <span className="w-6 text-right text-[11px] font-semibold text-slate-500">{count}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}