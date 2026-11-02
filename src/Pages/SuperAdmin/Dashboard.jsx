import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
  };
}

// ── Shared styles ─────────────────────────────────────────────
const CARD =
  "bg-white dark:bg-[#111C36] border border-slate-200/70 dark:border-white/[0.06] rounded-2xl shadow-[0_2px_14px_rgba(30,64,175,0.06)]";

// ── Helpers ───────────────────────────────────────────────────
const DAY = 86400000;

// last 30 din me kitne naye bane -> growth %
function growthLabel(list) {
  const total = list.length;
  if (!total) return null;
  const recent = list.filter((x) => x.createdAt && Date.now() - new Date(x.createdAt).getTime() <= 30 * DAY).length;
  if (!recent) return null;
  const prior = total - recent;
  return prior === 0 ? "New" : `+${Math.round((recent / prior) * 100)}%`;
}

// last 6 months ka cumulative count (real createdAt data se)
function buildTrend(tenants, users) {
  const now = new Date();
  const out = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const count = (list) => list.filter((x) => !x.createdAt || new Date(x.createdAt) < end).length;
    out.push({
      month: d.toLocaleString("en-US", { month: "short" }),
      "Total Users": count(users),
      Tenants: count(tenants),
    });
  }
  return out;
}

const moduleCount = (t) =>
  t.modulesCount ?? t.moduleCount ?? t.modules?.length ?? t.Modules?.length ?? t._count?.modules ?? null;

const AVATAR_COLORS = ["bg-blue-600", "bg-purple-600", "bg-teal-600", "bg-rose-500", "bg-amber-500"];

// ── Count-up ──────────────────────────────────────────────────
function CountUp({ value, duration = 900 }) {
  const [n, setN] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    const to = Number(value) || 0;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      setN(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{n}</>;
}

// ── Icons ─────────────────────────────────────────────────────
const I = ({ children, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const Icons = {
  tenant: (
    <I>
      <rect x="4" y="2" width="12" height="20" rx="1.5" />
      <path d="M16 9h3a1 1 0 0 1 1 1v12h-4M8 6h4M8 10h4M8 14h4M8 18h4" />
    </I>
  ),
  users: (
    <I>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </I>
  ),
  layers: (
    <I>
      <path d="m12 2 9 4.5-9 4.5-9-4.5z" />
      <path d="m3 12 9 4.5 9-4.5" />
      <path d="m3 17.5 9 4.5 9-4.5" />
    </I>
  ),
  trend: (
    <I size={20}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </I>
  ),
  gear: (
    <I size={18}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
    </I>
  ),
  bolt: (
    <I size={20}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
    </I>
  ),
  plus: (
    <I size={24}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </I>
  ),
  userPlus: (
    <I size={22}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </I>
  ),
  cog: (
    <I size={22}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </I>
  ),
  eye: (
    <I size={18}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </I>
  ),
  dots: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="19" r="1.7" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <polyline points="8 12.5 11 15.5 16 9" />
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  ),
  arrowUp: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  ),
};

// ── Hero illustration ─────────────────────────────────────────
function HeroIllustration() {
  return (
    <svg viewBox="0 0 300 150" className="h-full w-auto" aria-hidden="true">
      <defs>
        <linearGradient id="hCloud" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D3FD8" />
        </linearGradient>
        <linearGradient id="hShield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <g className="ev-float-a">
        <rect x="100" y="14" width="78" height="62" rx="8" fill="#DBEAFE" />
        <rect x="110" y="26" width="40" height="6" rx="3" fill="#60A5FA" />
        <rect x="110" y="38" width="56" height="5" rx="2.5" fill="#93C5FD" />
        <rect x="110" y="48" width="48" height="5" rx="2.5" fill="#93C5FD" />
      </g>
      <rect x="170" y="38" width="26" height="70" rx="6" fill="#2563EB" opacity="0.9" />
      <g className="ev-float-b">
        <path d="M40 120a24 24 0 0 1 4-47 32 32 0 0 1 60-4 28 28 0 0 1 8 55z" fill="url(#hCloud)" />
        <circle cx="124" cy="104" r="26" fill="#2563EB" />
        <circle cx="124" cy="104" r="22" fill="#fff" />
        <path d="M124 114V96m0 0-8 8m8-8 8 8" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      <g className="ev-float-c">
        <path d="M250 28 224 38v22c0 18 11 30 26 36 15-6 26-18 26-36V38z" fill="url(#hShield)" />
        <polyline points="238 62 247 71 263 52" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, icon, tint, children, delta, sub, subClass, onClick, loading, index }) {
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => onClick && (e.key === "Enter" || e.key === " ") && onClick()}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ animationDelay: `${index * 70}ms` }}
      className={`ev-rise group relative overflow-hidden ${CARD} p-5 flex items-start gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(30,64,175,0.12)] ${
        onClick ? "cursor-pointer" : ""
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
    >
      <span className="absolute left-0 top-0 h-full w-[3px] bg-blue-600 origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${tint}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">{label}</div>
        {loading ? (
          <div className="h-9 w-20 mt-1 rounded-lg bg-slate-100 dark:bg-white/10 ev-shimmer" />
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="text-[34px] leading-tight font-bold text-slate-900 dark:text-white tabular-nums">{children}</div>
            {delta && (
              <span className="flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-500/15 text-green-600 dark:text-green-400">
                {Icons.arrowUp}
                {delta}
              </span>
            )}
          </div>
        )}
        {sub && !loading && <div className={`text-[12.5px] font-medium ${subClass}`}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#16223F] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 shadow-lg text-[12px]">
      <div className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2" style={{ color: p.color || p.stroke }}>
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.stroke }} />
          {p.name}: <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Pills ─────────────────────────────────────────────────────
function PlanPill({ name }) {
  const n = (name || "").toLowerCase();
  const style = n.includes("enterprise")
    ? "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300"
    : n.includes("professional") || n.includes("pro")
    ? "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300"
    : n.includes("free")
    ? "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
    : "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300";
  return <span className={`inline-flex px-3 py-1 rounded-full text-[12px] font-semibold ${style}`}>{name}</span>;
}

function ErpPill({ configured }) {
  return configured ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400">
      {Icons.check} Configured
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300">
      {Icons.clock} Pending Setup
    </span>
  );
}

function StatusPill({ status }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-[12px] font-semibold ${
        active
          ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400"
          : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
      }`}
    >
      {active ? "Active" : status === "PENDING" ? "Pending" : "Inactive"}
    </span>
  );
}

// ── Dashboard ─────────────────────────────────────────────────
export default function Dashboard({ onNavigate, userName = "Super Admin" }) {
  const [tenants, setTenants] = useState([]);
  const [erpConfigs, setErpConfigs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [usersByTenant, setUsersByTenant] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [tenantsRes, erpRes] = await Promise.all([
        fetch(`${API}/tenants`, { headers: authHeaders() }),
        fetch(`${API}/erp-configs`, { headers: authHeaders() }),
      ]);
      const tenantsData = await tenantsRes.json();
      const erpData = await erpRes.json();

      const tenantList = tenantsData.success ? tenantsData.data || [] : [];
      setTenants(tenantList);
      setErpConfigs(erpData.success ? erpData.data || [] : []);

      const perTenant = await Promise.all(
        tenantList.map((t) =>
          fetch(`${API}/users?tenantId=${t.id}`, { headers: authHeaders() })
            .then((r) => r.json())
            .then((d) => ({ id: t.id, list: d.success ? d.data || [] : [] }))
            .catch(() => ({ id: t.id, list: [] }))
        )
      );
      const map = {};
      perTenant.forEach((p) => (map[p.id] = p.list.length));
      setUsersByTenant(map);
      setAllUsers(perTenant.flatMap((p) => p.list));
    } catch {
      setError("Could not load dashboard data. Check API connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // ── Derived ──
  const totalUsers = allUsers.length;
  const activeTenants = tenants.filter((t) => t.status === "ACTIVE").length;
  const inactiveTenants = tenants.length - activeTenants;
  const connectedErp = erpConfigs.filter((e) => e.status === "CONNECTED").length;
  const totalModules = tenants.reduce((s, t) => s + (moduleCount(t) || 0), 0);
  const trendData = buildTrend(tenants, allUsers);
  const pct = (n) => (tenants.length ? Math.round((n / tenants.length) * 100) : 0);
  const pieData = [
    { name: "Active", value: activeTenants, color: "#22C55E" },
    { name: "Inactive", value: inactiveTenants, color: "#CBD5E1" },
  ];

  const quickActions = [
    { label: "Add Tenant", page: "tenants", icon: Icons.plus },
    { label: "Add User", page: "users", icon: Icons.userPlus },
    { label: "Manage Modules", page: "moduleManagement", icon: Icons.layers },
    { label: "System Settings", page: "settings", icon: Icons.cog },
  ];

  return (
    <div className="space-y-5 max-w-[1500px]">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[13px] font-semibold rounded-xl px-4 py-3 flex items-center justify-between">
          {error}
          <button onClick={loadDashboard} className="text-[12px] underline">Retry</button>
        </div>
      )}

      {/* Welcome banner */}
      <section className={`ev-rise relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-gradient-to-r from-white via-blue-50/60 to-blue-100/70 dark:from-[#111C36] dark:via-[#12203F] dark:to-[#15295A] px-7 py-6`}>
        <h1 className="text-[28px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Welcome back, <span className="text-blue-700 dark:text-blue-400">{userName}</span>
          <span className="inline-block ev-wave origin-[70%_70%]">👋</span>
        </h1>
        <p className="mt-1 text-[15px] text-slate-600 dark:text-slate-300 max-w-[560px]">
          Manage tenants, users, modules and system configuration from a single place.
        </p>
        <div className="hidden md:block absolute right-6 bottom-0 h-[120%] pointer-events-none">
          <HeroIllustration />
        </div>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          index={1}
          label="Tenants"
          icon={Icons.tenant}
          tint="bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
          loading={loading}
          delta={growthLabel(tenants)}
          sub={`${activeTenants} Active · ${inactiveTenants} Inactive`}
          subClass="text-green-600 dark:text-green-400"
          onClick={() => onNavigate("tenants")}
        >
          <CountUp value={tenants.length} />
        </StatCard>

        <StatCard
          index={2}
          label="Total Users"
          icon={Icons.users}
          tint="bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300"
          loading={loading}
          delta={growthLabel(allUsers)}
          sub="Across all tenants"
          subClass="text-slate-500 dark:text-slate-400"
          onClick={() => onNavigate("users")}
        >
          <CountUp value={totalUsers} />
        </StatCard>

        <StatCard
          index={3}
          label="ERP Active"
          icon={Icons.layers}
          tint="bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-300"
          loading={loading}
          sub={erpConfigs.length - connectedErp > 0 ? `${erpConfigs.length - connectedErp} pending setup` : "All connected"}
          subClass={
            erpConfigs.length - connectedErp > 0
              ? "inline-block px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300"
              : "text-green-600 dark:text-green-400"
          }
          onClick={() => onNavigate("odata")}
        >
          <CountUp value={connectedErp} />/{erpConfigs.length}
        </StatCard>

        <StatCard
          index={4}
          label="Active Modules"
          icon={Icons.layers}
          tint="bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300"
          loading={loading}
          sub="In use across tenants"
          subClass="text-slate-500 dark:text-slate-400"
          onClick={() => onNavigate("moduleManagement")}
        >
          <CountUp value={totalModules} />
        </StatCard>
      </div>

      {/* Charts + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px_340px] gap-4">
        {/* Growth trend */}
        <div className={`ev-rise ${CARD} p-5 lg:col-span-2 xl:col-span-1`} style={{ animationDelay: "320ms" }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                {Icons.trend}
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-white leading-tight">Growth Trend</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Tenants & users over the last 6 months</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[12px] font-medium text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Total Users</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />Tenants</span>
            </div>
          </div>

          {loading ? (
            <div className="h-[230px] rounded-xl bg-slate-100 dark:bg-white/[0.06] ev-shimmer" />
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={trendData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gTenants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#CBD5E1" strokeOpacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Total Users"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fill="url(#gUsers)"
                  dot={{ r: 4, fill: "#fff", stroke: "#3B82F6", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  animationDuration={1300}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="Tenants"
                  stroke="#22C55E"
                  strokeWidth={2.5}
                  fill="url(#gTenants)"
                  dot={{ r: 4, fill: "#fff", stroke: "#22C55E", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  animationBegin={200}
                  animationDuration={1300}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tenant status donut */}
        <div className={`ev-rise ${CARD} p-5 flex flex-col`} style={{ animationDelay: "400ms" }}>
          <h2 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <span className="text-blue-600 dark:text-blue-400">{Icons.gear}</span> Tenant Status
          </h2>
          {loading ? (
            <div className="flex-1 min-h-[200px] rounded-xl bg-slate-100 dark:bg-white/[0.06] ev-shimmer" />
          ) : (
            <>
              <div className="relative h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tenants.length ? pieData : [{ name: "None", value: 1, color: "#E2E8F0" }]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={72}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={tenants.length && inactiveTenants && activeTenants ? 3 : 0}
                      stroke="none"
                      animationDuration={1000}
                      animationEasing="ease-out"
                    >
                      {(tenants.length ? pieData : [{ color: "#E2E8F0" }]).map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[28px] font-bold leading-none text-slate-900 dark:text-white tabular-nums">
                    <CountUp value={tenants.length} />
                  </span>
                  <span className="text-[13px] text-slate-500 dark:text-slate-400">Tenants</span>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {pieData.map((e) => (
                  <div key={e.name} className="flex items-center justify-between text-[13px] text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: e.color }} />
                      {e.name}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
                      {e.value} ({pct(e.value)}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Quick actions */}
        <div className={`ev-rise ${CARD} p-5`} style={{ animationDelay: "480ms" }}>
          <h2 className="text-[16px] font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 flex items-center justify-center">
              {Icons.bolt}
            </span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => onNavigate(a.page)}
                className="group flex flex-col items-center gap-2.5 py-4 px-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16223F] text-[13px] font-semibold text-slate-800 dark:text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-[0_8px_20px_rgba(37,99,235,0.14)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 flex items-center justify-center transition-all duration-200 group-hover:bg-blue-600 group-hover:text-white">
                  {a.icon}
                </span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tenant overview table */}
      <section className={`ev-rise ${CARD} p-5`} style={{ animationDelay: "560ms" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 flex items-center justify-center">
              {Icons.tenant}
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white leading-tight">Tenant Overview</h2>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">All registered tenants in your system</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("tenants")}
            className="group flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[13px] font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/25 transition-colors"
          >
            View All
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/[0.04] text-[11.5px] font-bold text-slate-500 dark:text-slate-400 tracking-wide">
                {["TENANT", "DMS CODE", "PLAN", "USERS", "ERP STATUS", "MODULES", "CREATED ON", "STATUS", "ACTIONS"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 ${i === 0 ? "rounded-l-lg" : ""} ${i === 8 ? "rounded-r-lg text-center" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading &&
                [0, 1, 2].map((i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-4 py-2">
                      <div className="h-[56px] rounded-xl bg-slate-100 dark:bg-white/[0.06] ev-shimmer" />
                    </td>
                  </tr>
                ))}

              {!loading && tenants.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-[13px] text-slate-400">
                    No tenants yet. Use Add Tenant to register the first one.
                  </td>
                </tr>
              )}

              {!loading &&
                tenants.map((t, idx) => {
                  const erp = t.ErpConfig || erpConfigs.find((e) => e.id === t.erpConfigId);
                  const mods = moduleCount(t);
                  const plan = t.plan?.name || t.planName || (t.tenantType === "PAID" ? "Paid" : "Free");
                  return (
                    <tr
                      key={t.id}
                      style={{ animationDelay: `${640 + idx * 70}ms` }}
                      className="ev-rise border-b border-slate-100 dark:border-white/[0.05] last:border-0 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[14px] font-bold text-white flex-shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                            {(t.tenantCode || "??").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[14px] font-bold text-slate-900 dark:text-slate-100 truncate">
                              {t.tenantCode}_{t.tenantName}
                            </div>
                            <div className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
                              {t.companyName || t.description || erp?.name || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-3 py-1 rounded-full text-[12px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                          {t.dmsCode || t.tenantCode}
                        </span>
                      </td>
                      <td className="px-4 py-3"><PlanPill name={plan} /></td>
                      <td className="px-4 py-3 text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        <span className="inline-flex items-center gap-2">
                          <span className="text-slate-500">
                            <I size={15}>
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                            </I>
                          </span>
                          {usersByTenant[t.id] ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3"><ErpPill configured={erp?.status === "CONNECTED"} /></td>
                      <td className="px-4 py-3 text-[13.5px] font-semibold text-slate-800 dark:text-slate-200">
                        {mods === null ? "—" : `${mods} Modules`}
                      </td>
                      <td className="px-4 py-3 text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {t.createdAt
                          ? new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3"><StatusPill status={t.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onNavigate("tenants")}
                            aria-label="View tenant"
                            className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 flex items-center justify-center hover:bg-blue-600 hover:text-white active:scale-90 transition-all"
                          >
                            {Icons.eye}
                          </button>
                          <button
                            onClick={() => onNavigate("tenants")}
                            aria-label="More actions"
                            className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/[0.12] active:scale-90 transition-all"
                          >
                            {Icons.dots}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        @keyframes evRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes evShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes evWaveHand { 0%,60%,100% { transform: rotate(0); } 10%,30% { transform: rotate(16deg); } 20%,40% { transform: rotate(-10deg); } 50% { transform: rotate(8deg); } }
        @keyframes evFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .ev-rise { opacity: 0; animation: evRise 0.5s cubic-bezier(.22,.8,.3,1) forwards; }
        .ev-shimmer {
          background-image: linear-gradient(90deg, transparent 0%, rgba(148,163,184,.25) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: evShimmer 1.4s linear infinite;
        }
        .ev-wave { display: inline-block; animation: evWaveHand 2.2s ease-in-out 0.8s 2; }
        .ev-float-a { animation: evFloat 5s ease-in-out infinite; }
        .ev-float-b { animation: evFloat 6s ease-in-out 0.6s infinite; }
        .ev-float-c { animation: evFloat 5.5s ease-in-out 1.2s infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ev-rise { opacity: 1; animation: none; }
          .ev-shimmer, .ev-wave, .ev-float-a, .ev-float-b, .ev-float-c { animation: none; }
        }
      `}</style>
    </div>
  );
}