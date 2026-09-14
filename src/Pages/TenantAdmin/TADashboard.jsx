import { useState, useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import {
  FaUserPlus, FaBuilding, FaIndustry, FaUpload, FaFileAlt,
  FaCheckCircle, FaUsers, FaFolderOpen, FaBolt, FaChartBar,
  FaFolder, FaChartPie, FaHistory, FaClipboardList, FaCompass,
  FaSyncAlt, FaArrowRight,
} from "react-icons/fa";
Chart.register(...registerables);

import { API_BASE_URL } from "../../services/apiClient";
import SubscriptionCard from "../../components/subscription/SubscriptionCard";

const API_BASE = API_BASE_URL;

function getToken() { return localStorage.getItem("accessToken") || ""; }
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}
function decodeToken() {
  try { const t = getToken(); if (!t) return null; return JSON.parse(atob(t.split(".")[1])); }
  catch { return null; }
}

const ROLE_COLORS = {
  TenantAdmin:   "#534AB7", BranchManager: "#185FA5", DeptHead:  "#EF9F27",
  Manager:       "#BA7517", Uploader:      "#1D9E75", Viewer:    "#64748b",
  Auditor:       "#A32D2D", Approver:      "#0F6E56",
};

const STATUS_META = {
  COMPLETED:            { label: "Completed",         color: "text-green-600 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-900/20"  },
  OCR_COMPLETED:        { label: "OCR Done",          color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/20"    },
  OCR_PROCESSING:       { label: "OCR Processing",    color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/20"  },
  WAITING_FOR_APPROVAL: { label: "Awaiting Approval", color: "text-orange-600 dark:text-orange-400",bg: "bg-orange-50 dark:bg-orange-900/20"},
  SAVING_TO_SAP:        { label: "Saving to SAP",     color: "text-purple-600 dark:text-purple-400",bg: "bg-purple-50 dark:bg-purple-900/20"},
  FAILED:               { label: "Failed",            color: "text-red-600 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-900/20"      },
};

// ── KPI Stat Card — icon on right, colored accent bar on left ──────────────
function StatCard({ label, value, sub, subColor = "text-green-600 dark:text-green-400", icon, accent = "bg-blue-500", tint = "bg-blue-50 dark:bg-blue-900/20", loading }) {
  return (
    <div className="relative bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 pl-6 flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden">
      <span className={`absolute left-0 top-0 bottom-0 w-[5px] ${accent}`} />
      <div className="min-w-0 flex-1">
        <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        {loading
          ? <div className="h-9 w-20 bg-slate-100 dark:bg-slate-700 rounded animate-pulse mt-1.5" />
          : <div className="text-[34px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight mt-0.5">{value}</div>
        }
        {sub && <div className={`text-[12px] font-semibold mt-1 ${subColor}`}>{sub}</div>}
      </div>
      <div className={`w-16 h-16 rounded-2xl ${tint} flex items-center justify-center flex-shrink-0 text-[30px]`}>
        {icon}
      </div>
    </div>
  );
}

// ── Section wrapper — consistent card chrome for every panel below ─────────
function Panel({ title, icon, action, className = "", children }) {
  return (
    <div className={`bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          {icon && <span className="text-[15px]">{icon}</span>}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Quick action tile — jumps straight to another module ───────────────────
function QuickAction({ label, icon, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-2.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A2433] hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all text-left"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] ${color}`}>
        {icon}
      </div>
      <span className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {label}
      </span>
    </button>
  );
}

function decodeAccessToken() {
  try {
    const t = getToken();
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1]));
  } catch { return null; }
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function TADashboard({ onNavigate }) {
  const [users,     setUsers]     = useState([]);
  const [docs,      setDocs]      = useState([]);
  const [depts,     setDepts]     = useState([]);
  const [cats,      setCats]      = useState([]);
  const [dts,       setDts]       = useState([]);
  const [loading,   setLoading]   = useState(true);

  const roleChartRef   = useRef(null);
  const statusChartRef = useRef(null);
  const roleChartInst  = useRef(null);
  const statusChartInst = useRef(null);

  const tokenPayload = decodeAccessToken();
  const displayName = tokenPayload?.email?.split("@")[0] || "there";

  useEffect(() => {
    const payload = decodeToken();
    if (payload?.tenantId) fetchAll(payload.tenantId);
    else setLoading(false);
  }, []);

  async function fetchAll(tenantId) {
    setLoading(true);
    try {
      const [uRes, dRes, cRes, dtRes, docRes] = await Promise.all([
        fetch(`${API_BASE}/users`,                          { headers: authHeaders() }),
        fetch(`${API_BASE}/departments/tenant/${tenantId}`, { headers: authHeaders() }),
        fetch(`${API_BASE}/categories`,                     { headers: authHeaders() }),
        fetch(`${API_BASE}/document-types`,                 { headers: authHeaders() }),
        fetch(`${API_BASE}/documents`,                      { headers: authHeaders() }),
      ]);

      if ([uRes, dRes, cRes, dtRes, docRes].some(r => r.status === 401)) {
        console.error("Session expired — redirecting to login");
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return;
      }

      const uData   = await uRes.json();
      const dData   = await dRes.json();
      const cData   = await cRes.json();
      const dtData  = await dtRes.json();
      const docData = await docRes.json();

      setUsers(uData.success ? (uData.data || []) : []);
      setDepts(Array.isArray(dData.data) ? dData.data : []);
      setCats(Array.isArray(cData.data) ? cData.data : Array.isArray(cData) ? cData : []);
      setDts(Array.isArray(dtData.data) ? dtData.data : Array.isArray(dtData) ? dtData : []);
      setDocs(Array.isArray(docData.data) ? docData.data : Array.isArray(docData) ? docData : []);

    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  // ── Derived stats ──────────────────────────────────────────
  const totalUsers    = users.length;
  const activeUsers   = users.filter(u => u.isActive).length;
  const totalDocs     = docs.length;
  const pendingApproval = docs.filter(d =>
    (d.uploadStatus || d.status) === "WAITING_FOR_APPROVAL"
  ).length;

  const roleCounts = {};
  users.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });
  const rolesArr = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);
  const maxRole  = rolesArr[0]?.[1] || 1;

  const statusCounts = {};
  docs.forEach(d => {
    const st = d.uploadStatus || d.status || "UNKNOWN";
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  });
  const statusArr = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);

  const dtMap = {};
  dts.forEach(dt => { dtMap[dt.id] = dt; });
  const deptDocCount = {};
  docs.forEach(doc => {
    const dt   = dtMap[doc.documentTypeId];
    if (!dt) return;
    const cat  = cats.find(c => c.id === dt.categoryId);
    if (!cat) return;
    const dept = depts.find(d => d.id === cat.departmentId);
    if (!dept) return;
    deptDocCount[dept.id] = (deptDocCount[dept.id] || 0) + 1;
  });
  const maxDeptDocs = Math.max(...Object.values(deptDocCount), 1);

  // Recent documents (most recently created first)
  const recentDocs = [...docs]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6);

  // ── Role Bar Chart ─────────────────────────────────────────
  useEffect(() => {
    if (!roleChartRef.current || rolesArr.length === 0) return;
    if (roleChartInst.current) roleChartInst.current.destroy();
    roleChartInst.current = new Chart(roleChartRef.current, {
      type: "bar",
      data: {
        labels: rolesArr.map(([r]) => r),
        datasets: [{
          label: "Users",
          data: rolesArr.map(([, c]) => c),
          backgroundColor: rolesArr.map(([r]) => (ROLE_COLORS[r] || "#378ADD") + "cc"),
          borderColor:     rolesArr.map(([r]) =>  ROLE_COLORS[r] || "#378ADD"),
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 34,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 35 } },
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: "rgba(128,128,128,0.08)" } },
        },
      },
    });
    return () => roleChartInst.current?.destroy();
  }, [users]);

  // ── Status Doughnut Chart ──────────────────────────────────
  useEffect(() => {
    if (!statusChartRef.current || statusArr.length === 0) return;
    if (statusChartInst.current) statusChartInst.current.destroy();
    const COLORS = { COMPLETED:"#1D9E75", OCR_COMPLETED:"#185FA5", OCR_PROCESSING:"#EF9F27",
      WAITING_FOR_APPROVAL:"#BA7517", SAVING_TO_SAP:"#534AB7", FAILED:"#A32D2D" };
    statusChartInst.current = new Chart(statusChartRef.current, {
      type: "doughnut",
      data: {
        labels: statusArr.map(([st]) => STATUS_META[st]?.label || st),
        datasets: [{
          data: statusArr.map(([, c]) => c),
          backgroundColor: statusArr.map(([st]) => (COLORS[st] || "#888") + "cc"),
          borderColor:     statusArr.map(([st]) =>  COLORS[st] || "#888"),
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "68%",
        plugins: {
          legend: {
            display: true, position: "bottom",
            labels: { font: { size: 10 }, boxWidth: 10, padding: 8 },
          },
        },
      },
    });
    return () => statusChartInst.current?.destroy();
  }, [docs]);

  const QUICK_ACTIONS = [
    { key: "users",           label: "Invite User",         icon: "👤", color: "bg-indigo-50 dark:bg-indigo-900/20" },
    { key: "companyCodes",    label: "Company Code",         icon: "🏢", color: "bg-blue-50 dark:bg-blue-900/20" },
    { key: "plants",          label: "Add Plant",            icon: "🏭", color: "bg-teal-50 dark:bg-teal-900/20" },
    { key: "workflow",        label: "Upload Document",      icon: "⬆️", color: "bg-emerald-50 dark:bg-emerald-900/20" },
    { key: "documents",       label: "Browse Documents",     icon: "📄", color: "bg-purple-50 dark:bg-purple-900/20" },
    { key: "approvals",       label: "Review Approvals",     icon: "✅", color: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  return (
    <div className="space-y-5">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-3 sm:p-7 shadow-lg">
        <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10" />
        <div className="absolute -right-4 bottom-[-40px] w-32 h-32 rounded-full bg-white/10" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[13px] font-semibold text-blue-100 mb-1">{greeting()}, <span className="capitalize">{displayName}</span> 👋</p>
            <h1 className="text-[22px] sm:text-[24px] font-extrabold text-white leading-tight">Tenant Overview</h1>
            <p className="text-[12.5px] text-blue-100 mt-1">Here's what's happening across your organization today.</p>
          </div>
          <button
            onClick={() => { const p = decodeToken(); if (p?.tenantId) fetchAll(p.tenantId); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[12.5px] font-bold backdrop-blur-sm border border-white/20 transition-colors"
          >
            <span className={loading ? "animate-spin inline-block" : "inline-block"}><FaSyncAlt className={loading ? "animate-spin" : ""} /></span> Refresh Data
          </button>
        </div>
      </div>

      {/* ── Subscription Card (FREE tenants only) ── */}
      <SubscriptionCard docs={docs} onUpgradeClick={() => onNavigate?.("subscription")} />

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard loading={loading} label="Users" value={totalUsers} sub={`${activeUsers} active · ${totalUsers - activeUsers} inactive`} icon="👥"
          accent="bg-indigo-500" tint="bg-indigo-50 dark:bg-indigo-900/20" />
        <StatCard loading={loading} label="Documents" value={totalDocs} sub={`${statusCounts["COMPLETED"] || 0} completed`} icon="📄"
          accent="bg-blue-500" tint="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard loading={loading} label="Pending Approvals" value={pendingApproval}
          sub={pendingApproval > 0 ? "Needs action" : "None pending"}
          subColor={pendingApproval > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}
          icon="✅"
          accent={pendingApproval > 0 ? "bg-amber-500" : "bg-green-500"}
          tint={pendingApproval > 0 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-green-50 dark:bg-green-900/20"} />
        <StatCard loading={loading} label="Departments" value={depts.length} sub={`${cats.length} categories · ${dts.length} doc types`} icon="🗂️"
          accent="bg-purple-500" tint="bg-purple-50 dark:bg-purple-900/20" />
      </div>

      {/* ── Quick Actions ── */}
      <Panel title="Quick Actions" icon="⚡">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(a => (
            <QuickAction key={a.key} label={a.label} icon={a.icon} color={a.color} onClick={() => onNavigate?.(a.key)} />
          ))}
        </div>
      </Panel>

      {/* ── Row: Role bars + Role chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Users by Role" icon="👥">
          {loading
            ? <div className="space-y-3">{[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-[110px] h-3 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                </div>))}</div>
            : rolesArr.length === 0
              ? <p className="text-[12px] text-slate-400">No users found</p>
              : <div className="space-y-[10px]">
                  {rolesArr.map(([role, count]) => (
                    <div key={role} className="flex items-center gap-3">
                      <div className="w-[110px] text-[12px] text-slate-600 dark:text-slate-400 flex-shrink-0">{role}</div>
                      <div className="w-8 text-[12px] font-bold text-blue-600 dark:text-blue-400 text-right flex-shrink-0">{count}</div>
                      <div className="flex-1 h-[6px] bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((count / maxRole) * 100)}%`, background: ROLE_COLORS[role] || "#378ADD" }} />
                      </div>
                    </div>
                  ))}
                </div>
          }
        </Panel>

        <Panel title="Role Distribution" icon="📊">
          <div style={{ position: "relative", height: 200 }}>
            <canvas ref={roleChartRef}
              role="img"
              aria-label={`Bar chart: ${rolesArr.map(([r,c])=>`${r} ${c}`).join(', ')}`}>
              {rolesArr.map(([r,c])=>`${r}: ${c}`).join(', ')}
            </canvas>
          </div>
        </Panel>
      </div>

      {/* ── Row: Folder usage + Status doughnut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Folder Usage by Department" icon="📁">
          {loading
            ? <div className="space-y-3">{[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="w-16 h-2 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                </div>))}</div>
            : depts.length === 0
              ? <p className="text-[12px] text-slate-400">No departments assigned</p>
              : <div className="space-y-0">
                  {depts.map(dept => {
                    const cnt     = deptDocCount[dept.id] || 0;
                    const catCnt  = cats.filter(c => c.departmentId === dept.id).length;
                    return (
                      <div key={dept.id} className="flex items-center gap-3 py-[8px] border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <span className="text-amber-500 text-[14px]">📁</span>
                        <span className="flex-1 text-[12px] text-slate-700 dark:text-slate-300 truncate">
                          {dept.name}
                          <span className="ml-1 text-[10px] text-slate-400">({catCnt} cat)</span>
                        </span>
                        <div className="w-[80px] h-[5px] bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
                          <div className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${Math.round((cnt / maxDeptDocs) * 100)}%` }} />
                        </div>
                        <span className="text-[11px] text-slate-400 w-14 text-right flex-shrink-0">{cnt} docs</span>
                      </div>
                    );
                  })}
                </div>
          }
        </Panel>

        <Panel title="Document Status" icon="🍩">
          <div style={{ position: "relative", height: 200 }}>
            <canvas ref={statusChartRef}
              role="img"
              aria-label={`Doughnut chart: ${statusArr.map(([s,c])=>`${s} ${c}`).join(', ')}`}>
              {statusArr.map(([s,c])=>`${s}: ${c}`).join(', ')}
            </canvas>
          </div>
        </Panel>
      </div>

      {/* ── Recent Documents ── */}
      <Panel
        title="Recent Documents"
        icon="🕘"
        action={
          <button onClick={() => onNavigate?.("documents")} className="text-[11.5px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
            View all →
          </button>
        }
      >
        {loading ? (
          <div className="space-y-2.5">
            {[...Array(4)].map((_, i) => <div key={i} className="h-9 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />)}
          </div>
        ) : recentDocs.length === 0 ? (
          <p className="text-[12px] text-slate-400 py-6 text-center">No documents uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  <th className="font-semibold px-1 py-2">File</th>
                  <th className="font-semibold px-1 py-2">Status</th>
                  <th className="font-semibold px-1 py-2 hidden sm:table-cell">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {recentDocs.map(d => {
                  const st = d.uploadStatus || d.status || "UNKNOWN";
                  const meta = STATUS_META[st] || { label: st, color: "text-slate-600", bg: "bg-slate-100" };
                  return (
                    <tr key={d.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-1 py-2.5">
                        <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium truncate max-w-[220px]">
                          📄 {d.originalFileName || d.name || "Untitled"}
                        </span>
                      </td>
                      <td className="px-1 py-2.5">
                        <span className={`${meta.bg} ${meta.color} text-[10.5px] font-bold px-2 py-[3px] rounded-full whitespace-nowrap`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-1 py-2.5 text-slate-400 hidden sm:table-cell whitespace-nowrap">
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ── Status breakdown pills ── */}
      {!loading && statusArr.length > 0 && (
        <Panel title="Document Status Breakdown" icon="📋">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {statusArr.map(([st, cnt]) => {
              const meta = STATUS_META[st] || { label: st, color: "text-slate-600", bg: "bg-slate-100" };
              return (
                <div key={st} className={`${meta.bg} rounded-xl p-3 text-center`}>
                  <div className={`text-[20px] font-bold ${meta.color}`}>{cnt}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{meta.label}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* ── Summary footer ── */}
      {!loading && (
        <Panel title="Workspace Summary" icon="🧭">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Departments</p>
              <p className="text-[20px] font-bold text-slate-800 dark:text-slate-100">{depts.length}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Categories</p>
              <p className="text-[20px] font-bold text-slate-800 dark:text-slate-100">{cats.length}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Document Types</p>
              <p className="text-[20px] font-bold text-slate-800 dark:text-slate-100">{dts.length}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Roles in Use</p>
              <p className="text-[20px] font-bold text-slate-800 dark:text-slate-100">{rolesArr.length}</p>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}