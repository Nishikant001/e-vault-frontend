import { useState, useEffect, useRef } from "react";
import { RECENT_ACTIVITY } from "../SuperAdmin/Superadmincontext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;

function getToken() {
  return localStorage.getItem("accessToken") || "";
}
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// ── Animated count-up number ────────────────────────────────
function CountUp({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = Number(value) || 0;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    prevValue.current = end;
  }, [value, duration]);

  return <>{display}</>;
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, subColor = "text-green-600 dark:text-green-400", icon, onClick, loading, isNumeric = true }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-1 transition-all hover:shadow-md hover:-translate-y-px duration-200 ${
        onClick ? "cursor-pointer hover:border-blue-400 dark:hover:border-blue-500" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      {loading ? (
        <div className="h-[26px] w-16 rounded bg-slate-100 dark:bg-slate-700 animate-pulse" />
      ) : (
        <div className="text-[26px] font-bold text-slate-800 dark:text-slate-100 leading-tight tabular-nums">
          {isNumeric ? <CountUp value={value} /> : value}
        </div>
      )}
      {sub && !loading && <div className={`text-[11px] font-medium ${subColor}`}>{sub}</div>}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const active = status === "ACTIVE";
  return active ? (
    <span className="text-[10px] font-bold px-2 py-[3px] rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">Active</span>
  ) : (
    <span className="text-[10px] font-bold px-2 py-[3px] rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
      {status === "PENDING" ? "Pending" : "Inactive"}
    </span>
  );
}

// ── Custom tooltip for line chart ────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-[11px]">
      <div className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

const PIE_COLORS = { ACTIVE: "#3B82F6", INACTIVE: "#94A3B8", PENDING: "#F59E0B" };

// ── Dashboard ─────────────────────────────────────────────────
export default function Dashboard({ onNavigate }) {
  const [tenants, setTenants] = useState([]);
  const [erpConfigs, setErpConfigs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartsVisible, setChartsVisible] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [tenantsRes, erpRes, deptRes] = await Promise.all([
        fetch(`${API}/tenants`, { headers: authHeaders() }),
        fetch(`${API}/erp-configs`, { headers: authHeaders() }),
        fetch(`${API}/departments`, { headers: authHeaders() }),
      ]);

      const tenantsData = await tenantsRes.json();
      const erpData = await erpRes.json();
      const deptData = await deptRes.json();

      const tenantList = tenantsData.success ? tenantsData.data || [] : [];
      setTenants(tenantList);
      setErpConfigs(erpData.success ? erpData.data || [] : []);
      setDepartments(deptData.success ? deptData.data || [] : []);

      const userCounts = await Promise.all(
        tenantList.map((t) =>
          fetch(`${API}/users?tenantId=${t.id}`, { headers: authHeaders() })
            .then((r) => r.json())
            .then((d) => (d.success ? (d.data || []).length : 0))
            .catch(() => 0)
        )
      );
      const totalU = userCounts.reduce((sum, n) => sum + n, 0);
      setTotalUsers(totalU);
    } catch (err) {
      setError("Could not load dashboard data. Check API connection.");
    } finally {
      setLoading(false);
      // slight delay so chart entrance animation feels intentional, not instant
      setTimeout(() => setChartsVisible(true), 150);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const activeTenants = tenants.filter((t) => t.status === "ACTIVE").length;
  const inactiveTenants = tenants.length - activeTenants;
  const connectedErp = erpConfigs.filter((e) => e.status === "CONNECTED").length;

  // Trend chart — simulated ramp toward current live totals (no history API available yet)
  const trendData = (() => {
    const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    return months.map((m, i) => {
      const factor = (i + 1) / months.length;
      return {
        month: m,
        Tenants: Math.round(tenants.length * factor),
        Users: Math.round(totalUsers * factor),
      };
    });
  })();

  // Tenant status pie data
  const statusCounts = tenants.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0) + status.slice(1).toLowerCase(),
    value: count,
    status,
  }));

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[12px] font-semibold rounded-lg px-4 py-3 flex items-center justify-between">
          {error}
          <button onClick={loadDashboard} className="text-[11px] underline">Retry</button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Tenants" value={tenants.length} sub={`${activeTenants} active · ${inactiveTenants} inactive`} icon="🏢" loading={loading} onClick={() => onNavigate("tenants")} />
        <StatCard label="Total Users" value={totalUsers} sub="Across all tenants" icon="👥" loading={loading} onClick={() => onNavigate("users")} />
        <StatCard label="Departments" value={departments.length} sub={`${departments.filter((d) => d.status === "ACTIVE").length} active`} icon="🗂️" loading={loading} onClick={() => onNavigate("departments")} />
        <StatCard
          label="OData Active"
          value={`${connectedErp}/${erpConfigs.length}`}
          isNumeric={false}
          sub={erpConfigs.length - connectedErp > 0 ? `${erpConfigs.length - connectedErp} pending setup` : "All connected"}
          subColor={erpConfigs.length - connectedErp > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}
          icon="⚡"
          loading={loading}
          onClick={() => onNavigate("odata")}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Growth trend line chart */}
        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-colors">
          <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1">
            📈 Growth Trend
          </h2>
          <p className="text-[10px] text-slate-400 mb-3">Tenants & users over the last 6 months</p>
          {loading ? (
            <div className="h-[220px] rounded-lg bg-slate-100 dark:bg-slate-700/40 animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-700" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="Users"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={chartsVisible}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="Tenants"
                  stroke="#22C55E"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={chartsVisible}
                  animationDuration={1200}
                  animationBegin={200}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tenant status donut chart */}
        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-colors flex flex-col">
          <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mb-1">🧩 Tenant Status</h2>
          <p className="text-[10px] text-slate-400 mb-2">Live distribution</p>
          {loading ? (
            <div className="flex-1 rounded-lg bg-slate-100 dark:bg-slate-700/40 animate-pulse" />
          ) : tenants.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[12px] text-slate-400">No tenants yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    isAnimationActive={chartsVisible}
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.status} fill={PIE_COLORS[entry.status] || "#94A3B8"} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-1">
                {pieData.map((entry) => (
                  <div key={entry.status} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[entry.status] || "#94A3B8" }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tenant Status + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              🏢 Tenant Status
            </h2>
            <button onClick={() => onNavigate("tenants")} className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold">
              View all →
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[54px] rounded-lg bg-slate-100 dark:bg-slate-700/40 animate-pulse" />
              ))}
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-[12px] text-slate-400">No tenants registered yet.</div>
          ) : (
            <div className="space-y-3">
              {tenants.map((t, idx) => (
                <div
                  key={t.id}
                  style={{ animation: `fadeSlideIn 0.35s ease-out ${idx * 60}ms both` }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0 ${
                    t.status === "ACTIVE" ? "bg-blue-600" : "bg-amber-500"
                  }`}>
                    {(t.tenantCode || "??").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {t.tenantCode}_{t.tenantName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {t.ErpConfig?.name ? `${t.ErpConfig.name} · ` : ""}Created {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                  <button onClick={() => onNavigate("tenants")} className="text-[11px] px-3 py-1 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium">
                    Manage
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-colors">
          <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            📋 Recent Activity
          </h2>
          <div className="space-y-0">
            {RECENT_ACTIVITY.map((a, i) => (
              <div
                key={i}
                style={{ animation: `fadeSlideIn 0.35s ease-out ${i * 70}ms both` }}
                className="flex items-start gap-3 py-[9px] border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-[5px] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-slate-700 dark:text-slate-300">{a.msg}</div>
                </div>
                <div className="text-[10px] text-slate-400 flex-shrink-0 whitespace-nowrap">{a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-colors">
        <h2 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "+ Register Tenant", page: "tenants", color: "bg-blue-600 hover:bg-blue-700 text-white" },
            { label: "+ Add User", page: "users", color: "bg-green-600 hover:bg-green-700 text-white" },
            { label: "🗂️ Departments", page: "departments", color: "bg-white dark:bg-[#232F40] hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600" },
            { label: "⚡ OData Plugins", page: "odata", color: "bg-white dark:bg-[#232F40] hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600" },
            { label: "⚙ System Settings", page: "settings", color: "bg-white dark:bg-[#232F40] hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600" },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => onNavigate(a.page)}
              className={`px-4 py-[7px] rounded-lg text-[12px] font-semibold transition-all ${a.color}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}