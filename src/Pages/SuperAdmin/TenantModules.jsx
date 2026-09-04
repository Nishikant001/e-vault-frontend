import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Box, Check, Trash2, UserRound } from "lucide-react";
import { get } from "../../services/apiClient";
import { getTenantModuleAssignments, setModuleEnabled, unassignModule } from "../../services/tenantModuleApi";

function statusBadge(enabled) {
  return enabled ? (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">Enabled</span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-500 border border-red-100">Disabled</span>
  );
}

export default function TenantModules({ onNavigate }) {
  const tenantId = sessionStorage.getItem("superAdminModuleTenantId");
  const [tenant, setTenant] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [tenantResponse, assignmentsResponse] = await Promise.all([
        get(`/tenants/${tenantId}`),
        getTenantModuleAssignments(tenantId),
      ]);
      setTenant(tenantResponse?.data || null);
      setRows(Array.isArray(assignmentsResponse?.data) ? assignmentsResponse.data : []);
    } catch (err) {
      setError(err?.message || "Unable to load tenant modules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tenantId]);

  const counts = useMemo(() => ({
    enabled: rows.filter((r) => r.enabled).length,
    disabled: rows.filter((r) => !r.enabled).length,
  }), [rows]);

  const toggle = async (row) => {
    setBusyId(row.id);
    setError("");
    try {
      await setModuleEnabled(tenantId, row.moduleId, !row.enabled);
      await load();
    } catch (err) {
      setError(err?.message || "Unable to update module status");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Remove ${row.module?.module_name || "this module"} from ${tenant?.tenantName || "this tenant"}?`)) return;
    setBusyId(row.id);
    setError("");
    try {
      await unassignModule(tenantId, row.moduleId);
      await load();
    } catch (err) {
      setError(err?.message || "Unable to unassign module");
    } finally {
      setBusyId(null);
    }
  };

  if (!tenantId) {
    return <div className="py-16 text-center text-sm text-slate-500">Select a tenant from Module Management first.</div>;
  }

  return (
    <div className="min-h-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate?.("moduleManagement")} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm"><ArrowLeft size={16} /></button>
          <div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-0.5"><span>Module Management</span><span>›</span><span>Tenant Modules</span></div>
            <h1 className="text-[20px] font-bold text-slate-900">Tenant Modules - {tenant?.tenantName || "Tenant"}</h1>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-4 py-4 mb-4">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Tenant Information</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Info label="Tenant Name" value={tenant?.tenantName || "—"} />
          <Info label="Tenant Code" value={tenant?.tenantCode || "—"} />
          <Info label="Status" value={tenant?.status || "—"} badge={tenant?.status === "ACTIVE"} />
          <Info label="Assigned Modules" value={rows.length} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-4 py-3 flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Check size={17} /></div><div><div className="text-[10px] text-slate-400 uppercase font-semibold">Enabled Modules</div><div className="text-lg font-bold text-slate-900">{counts.enabled}</div></div></div>
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-4 py-3 flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><Box size={17} /></div><div><div className="text-[10px] text-slate-400 uppercase font-semibold">Disabled Modules</div><div className="text-lg font-bold text-slate-900">{counts.disabled}</div></div></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-[12px] font-bold text-slate-800">Modules Assigned to Tenant</h2>
          <span className="text-[10px] text-slate-400">{rows.length} assignments</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead><tr className="bg-slate-50/70 border-b border-slate-100 text-[9px] uppercase tracking-wide text-slate-400"><th className="px-4 py-2.5 w-12">#</th><th className="px-3 py-2.5">Module Name</th><th className="px-3 py-2.5">Module Key</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Assigned On</th><th className="px-3 py-2.5 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? Array.from({ length: 6 }).map((_, i) => <tr key={i} className="animate-pulse">{Array.from({ length: 6 }).map((__, j) => <td key={j} className="px-3 py-3"><div className="h-3 bg-slate-100 rounded" /></td>)}</tr>) : rows.length ? rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-[10px] text-slate-400">{index + 1}</td>
                  <td className="px-3 py-3"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center"><Box size={14} /></div><span className="text-[11px] font-semibold text-slate-700">{row.module?.module_name || "Unknown module"}</span></div></td>
                  <td className="px-3 py-3"><code className="text-[10px] text-slate-500">{row.module?.module_key || "—"}</code></td>
                  <td className="px-3 py-3">{statusBadge(row.enabled)}</td>
                  <td className="px-3 py-3 text-[10px] text-slate-500">{row.assignedAt ? new Date(row.assignedAt).toLocaleString() : "—"}</td>
                  <td className="px-3 py-3"><div className="flex items-center justify-end gap-2">
                    <button disabled={busyId === row.id} onClick={() => toggle(row)} className={`relative w-9 h-5 rounded-full transition-colors ${row.enabled ? "bg-blue-600" : "bg-slate-200"} disabled:opacity-50`} title={row.enabled ? "Disable module" : "Enable module"}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${row.enabled ? "translate-x-4" : "translate-x-0.5"}`} /></button>
                    <button disabled={busyId === row.id} onClick={() => remove(row)} title="Unassign module" className="p-1.5 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              )) : <tr><td colSpan="6" className="py-14 text-center text-sm text-slate-400">No modules assigned to this tenant.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, badge }) {
  return <div><div className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</div>{badge ? <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-semibold">{value}</span> : <div className="text-[12px] font-semibold text-slate-700 flex items-center gap-1.5">{label === "Tenant Name" && <UserRound size={13} className="text-slate-400" />}{value}</div>}</div>;
}
