import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Edit3,
  Eye,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import {
  assignModule,
  createModule,
  getTenantModuleAssignments,
  listModules,
  updateModule,
} from "../../services/tenantModuleApi";
import { get } from "../../services/apiClient";

const PAGE_SIZE = 10;

const FALLBACK_ICONS = {
  folder: Archive,
  workflow: ShieldCheck,
  audit: CircleCheck,
  communication: Users,
  aiAssistant: Box,
  metadataTemplate: Box,
  approvalCheck: ShieldCheck,
  shield: ShieldCheck,
  sapSync: Box,
};

function getModuleIcon(icon) {
  return FALLBACK_ICONS[icon] || Box;
}

function normalizeList(response) {
  return Array.isArray(response?.data) ? response.data : [];
}

function normalizeTenants(response) {
  return Array.isArray(response?.data) ? response.data : [];
}

function StatCard({ label, value, icon: Icon, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    red: "bg-red-50 text-red-500 ring-red-100",
    purple: "bg-violet-50 text-violet-600 ring-violet-100",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-4 py-3.5 flex items-center justify-between min-w-0">
      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
        <div className="text-[20px] leading-6 font-bold text-slate-900 mt-1">{value}</div>
      </div>
      <div className={`w-10 h-10 rounded-full ring-8 flex items-center justify-center ${tones[tone]}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
    </div>
  );
}

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-500 border border-red-100">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Inactive
    </span>
  );
}

function EmptyState({ text = "No modules found" }) {
  return <div className="py-14 text-center text-sm text-slate-400">{text}</div>;
}

function ModuleModal({ open, mode, module, onClose, onSaved }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState({
    moduleKey: "",
    moduleName: "",
    description: "",
    icon: "",
    routeKey: "",
    isActive: true,
    isDefault: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm({
      moduleKey: module?.module_key || "",
      moduleName: module?.module_name || "",
      description: module?.description || "",
      icon: module?.icon || "",
      routeKey: module?.route_key || "",
      isActive: module?.enabled ?? true,
      isDefault: module?.is_default ?? false,
    });
  }, [open, module]);

  if (!open) return null;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = isEdit
        ? {
            moduleName: form.moduleName.trim(),
            description: form.description.trim() || null,
            icon: form.icon.trim() || null,
            routeKey: form.routeKey.trim() || null,
            isActive: form.isActive,
            isDefault: form.isDefault,
          }
        : {
            moduleKey: form.moduleKey.trim(),
            moduleName: form.moduleName.trim(),
            description: form.description.trim() || null,
            icon: form.icon.trim() || null,
            routeKey: form.routeKey.trim() || null,
            isActive: form.isActive,
            isDefault: form.isDefault,
          };
      const response = isEdit ? await updateModule(module.id, payload) : await createModule(payload);
      onSaved(response?.data);
      onClose();
    } catch (err) {
      setError(err?.message || "Unable to save module");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" onClick={onClose} />
      <form onSubmit={submit} className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">{isEdit ? "Edit Module" : "Register Module"}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Configure the system module metadata.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Module Name" required>
              <input value={form.moduleName} onChange={(e) => update("moduleName", e.target.value)} required className="module-input" placeholder="Document Management" />
            </Field>
            <Field label="Module Key" required>
              <input value={form.moduleKey} onChange={(e) => update("moduleKey", e.target.value)} required disabled={isEdit} className="module-input disabled:bg-slate-50 disabled:text-slate-400" placeholder="dms" />
            </Field>
          </div>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} className="module-input resize-none" placeholder="Describe what this module provides" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Icon Key">
              <input value={form.icon} onChange={(e) => update("icon", e.target.value)} className="module-input" placeholder="folder" />
            </Field>
            <Field label="Route Key">
              <input value={form.routeKey} onChange={(e) => update("routeKey", e.target.value)} className="module-input" placeholder="documents" />
            </Field>
          </div>
          <div className="flex items-center gap-5 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} className="accent-blue-600" />
              Active module
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => update("isDefault", e.target.checked)} className="accent-blue-600" />
              Default module
            </label>
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
        </div>
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button disabled={saving} type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">{saving ? "Saving..." : isEdit ? "Save Changes" : "Register Module"}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}{required && <span className="text-red-500"> *</span>}</span>
      {children}
    </label>
  );
}

function AssignModuleModal({ open, module, tenants, onClose, onAssigned }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [assignments, setAssignments] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !module) return;
    setQuery("");
    setSelected([]);
    setError("");
    let cancelled = false;
    setLoading(true);
    Promise.all(tenants.map(async (tenant) => {
      try {
        const response = await getTenantModuleAssignments(tenant.id);
        return normalizeList(response).some((row) => Number(row.moduleId) === Number(module.id));
      } catch {
        return false;
      }
    })).then((flags) => {
      if (!cancelled) setAssignments(new Set(tenants.filter((_, i) => flags[i]).map((t) => t.id)));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, module, tenants]);

  if (!open || !module) return null;

  const filtered = tenants.filter((tenant) => {
    const haystack = `${tenant.tenantName || ""} ${tenant.tenantCode || ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const toggle = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const submit = async () => {
    if (!selected.length) return;
    setSaving(true);
    setError("");
    try {
      await Promise.all(selected.map((tenantId) => assignModule(tenantId, module.id)));
      onAssigned();
      onClose();
    } catch (err) {
      setError(err?.message || "One or more assignments could not be completed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-[455px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">Assign Module to Tenant</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Select one or more tenants for this module.</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="p-5">
          <div className="mb-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Module</div>
            <div className="px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
              <Box size={15} className="text-blue-500" /> {module.module_name} <span className="font-normal text-slate-400">({module.module_key})</span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Select Tenants</div>
          <div className="relative mb-2.5">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="module-input pl-9" placeholder="Search tenants..." />
          </div>
          <div className="border border-slate-200 rounded-lg max-h-[270px] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading assignments...</div>
            ) : filtered.length ? filtered.map((tenant) => {
              const alreadyAssigned = assignments.has(tenant.id);
              const checked = alreadyAssigned || selected.includes(tenant.id);
              return (
                <label key={tenant.id} className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer hover:bg-slate-50 ${alreadyAssigned ? "bg-blue-50/30" : ""}`}>
                  <input type="checkbox" checked={checked} disabled={alreadyAssigned} onChange={() => toggle(tenant.id)} className="w-4 h-4 accent-blue-600" />
                  <span className="min-w-0 flex-1 text-xs font-medium text-slate-700 truncate">{tenant.tenantName || `Tenant ${tenant.id}`}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">({tenant.tenantCode || tenant.id})</span>
                  {alreadyAssigned && <span className="text-[9px] font-semibold text-emerald-600">Assigned</span>}
                </label>
              );
            }) : <div className="py-8 text-center text-xs text-slate-400">No tenants found</div>}
          </div>
          {error && <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
        </div>
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">{selected.length} tenant{selected.length === 1 ? "" : "s"} selected</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button disabled={!selected.length || saving || !module.enabled} onClick={submit} className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Assigning..." : "Assign Module"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionMenu({ module, onView, onEdit, onAssign }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"><MoreVertical size={15} /></button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-30 w-36 bg-white rounded-lg border border-slate-200 shadow-lg py-1">
            <button onClick={() => { setOpen(false); onView(); }} className="w-full px-3 py-2 text-left text-[11px] text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Eye size={13} /> View tenants</button>
            <button onClick={() => { setOpen(false); onEdit(); }} className="w-full px-3 py-2 text-left text-[11px] text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Edit3 size={13} /> Edit module</button>
            <button disabled={!module.enabled} onClick={() => { setOpen(false); onAssign(); }} className="w-full px-3 py-2 text-left text-[11px] text-slate-600 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-40"><Users size={13} /> Assign</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ModuleManagement({ onNavigate }) {
  const [modules, setModules] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [assignmentCounts, setAssignmentCounts] = useState({});
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ type: null, module: null });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [moduleResponse, tenantResponse] = await Promise.all([listModules(), get("/tenants")]);
      const nextModules = normalizeList(moduleResponse);
      const nextTenants = normalizeTenants(tenantResponse);
      setModules(nextModules);
      setTenants(nextTenants);

      const countEntries = await Promise.all(nextModules.map(async (module) => {
        const tenantRows = await Promise.all(nextTenants.map(async (tenant) => {
          try {
            const response = await getTenantModuleAssignments(tenant.id);
            return normalizeList(response).some((row) => Number(row.moduleId) === Number(module.id));
          } catch {
            return false;
          }
        }));
        return [module.id, tenantRows.filter(Boolean).length];
      }));
      setAssignmentCounts(Object.fromEntries(countEntries));
    } catch (err) {
      setError(err?.message || "Unable to load module management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => { setPage(1); }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter((module) => `${module.module_name} ${module.module_key} ${module.description || ""}`.toLowerCase().includes(q));
  }, [modules, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = modules.filter((m) => m.enabled).length;
  const inactiveCount = modules.length - activeCount;

  const openTenantPage = (tenantId) => {
    sessionStorage.setItem("superAdminModuleTenantId", String(tenantId));
    onNavigate?.("tenantModules");
  };

  return (
    <div className="min-h-full">
      <style>{`.module-input{width:100%;border:1px solid rgb(226 232 240);border-radius:.5rem;padding:.55rem .75rem;font-size:.75rem;color:rgb(51 65 85);outline:none;background:white}.module-input:focus{border-color:rgb(96 165 250);box-shadow:0 0 0 3px rgb(59 130 246 / .08)}`}</style>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900">Module Management</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Manage system modules and tenant assignments</p>
        </div>
        <button onClick={() => setModal({ type: "create", module: null })} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold shadow-sm">
          <Plus size={14} /> Register Module
        </button>
      </div>

      {error && <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">{error}</div>}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Modules" value={modules.length} icon={Box} tone="blue" />
        <StatCard label="Active Modules" value={activeCount} icon={CircleCheck} tone="green" />
        <StatCard label="Inactive Modules" value={inactiveCount} icon={CircleX} tone="red" />
        <StatCard label="Total Tenants" value={tenants.length} icon={Users} tone="purple" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <h2 className="text-[12px] font-bold text-slate-800">System Modules</h2>
          <div className="relative w-[190px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full h-8 pl-8 pr-2.5 text-[10px] rounded-lg border border-slate-200 outline-none focus:border-blue-300" placeholder="Search modules..." />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[9px] uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 w-12">#</th>
                <th className="px-3 py-2.5">Module Name</th>
                <th className="px-3 py-2.5">Module Key</th>
                <th className="px-3 py-2.5">Description</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-center">Tenants Assigned</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 7 }).map((__, j) => <td key={j} className="px-3 py-3"><div className="h-3 bg-slate-100 rounded" /></td>)}
                </tr>
              )) : pageRows.length ? pageRows.map((module, index) => {
                const Icon = getModuleIcon(module.icon);
                return (
                  <tr key={module.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-[10px] text-slate-400">{(page - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Icon size={14} /></div>
                        <span className="text-[11px] font-semibold text-slate-700">{module.module_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3"><code className="text-[10px] text-slate-500">{module.module_key}</code></td>
                    <td className="px-3 py-3 max-w-[280px]"><span className="text-[10px] text-slate-500 line-clamp-2">{module.description || "—"}</span></td>
                    <td className="px-3 py-3"><StatusBadge active={module.enabled} /></td>
                    <td className="px-3 py-3 text-center"><span className="text-[11px] font-semibold text-slate-600">{assignmentCounts[module.id] ?? 0}</span></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button title="View tenant assignments" onClick={() => { const firstAssigned = tenants.find((t) => t.id && assignmentCounts[module.id] > 0); if (firstAssigned) openTenantPage(firstAssigned.id); }} className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Eye size={14} /></button>
                        <button title="Edit module" onClick={() => setModal({ type: "edit", module })} className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Edit3 size={14} /></button>
                        <ActionMenu module={module} onView={() => { const first = tenants.find((t) => assignmentCounts[module.id] > 0); if (first) openTenantPage(first.id); }} onEdit={() => setModal({ type: "edit", module })} onAssign={() => setModal({ type: "assign", module })} />
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan="7"><EmptyState text={query ? "No modules match your search" : "No modules registered"} /></td></tr>}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[9px] text-slate-400">Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries</span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={13} /></button>
            {Array.from({ length: totalPages }).map((_, i) => <button key={i} onClick={() => setPage(i + 1)} className={`w-6 h-6 rounded-md text-[9px] font-semibold ${page === i + 1 ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>{i + 1}</button>)}
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>

      <ModuleModal open={modal.type === "create" || modal.type === "edit"} mode={modal.type} module={modal.module} onClose={() => setModal({ type: null, module: null })} onSaved={load} />
      <AssignModuleModal open={modal.type === "assign"} module={modal.module} tenants={tenants} onClose={() => setModal({ type: null, module: null })} onAssigned={load} />
    </div>
  );
}
