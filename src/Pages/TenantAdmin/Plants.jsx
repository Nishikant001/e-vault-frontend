import { useState, useEffect, useMemo } from "react";
import {
  Factory, Plus, X, Search, Loader2, AlertCircle, Pencil,
  Trash2, ChevronLeft, ChevronRight, Building2, Power, Layers,
  ArrowRightCircle, XCircle, Settings2, Info,
} from "lucide-react";

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
function decodeToken() {
  try {
    const t = getToken();
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1]));
  } catch {
    return null;
  }
}

const PAGE_SIZE = 8;

function StatusBadge({ status }) {
  const active = status === "ACTIVE";
  return (
    <span className={`text-[10px] font-bold px-[10px] py-[3px] rounded-full border whitespace-nowrap ${
      active
        ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
        : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
    }`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

const CODE_COLORS = [
  "bg-teal-600", "bg-purple-600", "bg-emerald-600",
  "bg-orange-500", "bg-pink-600", "bg-blue-600", "bg-indigo-600",
];
function codeColor(code = "") {
  let n = 0;
  for (let i = 0; i < code.length; i++) n += code.charCodeAt(i);
  return CODE_COLORS[n % CODE_COLORS.length];
}

// ── Pure CSS ring stat (conic-gradient, no SVG) ─────────────────
function RingStat({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative w-14 h-14 rounded-full flex-shrink-0"
        style={{
          background: `conic-gradient(${color} ${pct * 3.6}deg, rgb(226 232 240) ${pct * 3.6}deg)`,
        }}
      >
        <div className="absolute inset-[3px] rounded-full bg-white dark:bg-[#1A2433] flex items-center justify-center">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{pct}%</span>
        </div>
      </div>
      <div>
        <div className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{value}</div>
        <div className="text-[10px] text-slate-400">{label}</div>
      </div>
    </div>
  );
}

// ── Pure CSS horizontal bar comparison ──────────────────────────
function BarStat({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  return (
    <div className="space-y-2.5">
      {segments.map((seg) => {
        const pct = Math.round((seg.value / total) * 100);
        return (
          <div key={seg.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-sm" style={{ background: seg.color }} />
                {seg.label}
              </span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{seg.value}</span>
            </div>
            <div className="h-[6px] w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: seg.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Create / Edit Modal ─────────────────────────────────────────
function PlantModal({ initial, companyCodes, defaultCompanyCodeId, onClose, onSaved }) {
  const isEdit = !!initial;
  const [companyCodeId, setCompanyCodeId] = useState(initial?.companyCodeId || defaultCompanyCodeId || "");
  const [code, setCode] = useState(initial?.code || "");
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!isEdit && !companyCodeId) return setError("Please select a company code.");
    if (!isEdit && !code.trim()) return setError("Plant code is required.");
    if (!name.trim()) return setError("Name is required.");

    setLoading(true);
    try {
      const url = isEdit ? `${API}/plants/${initial.id}` : `${API}/plants`;
      const body = isEdit
        ? { name: name.trim(), description: description.trim() || undefined }
        : { companyCodeId: Number(companyCodeId), code: code.trim().toUpperCase(), name: name.trim(), description: description.trim() || undefined };

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) return setError(data.message || "Failed to save plant.");
      onSaved();
      onClose();
    } catch {
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Factory className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
              {isEdit ? "Edit Plant" : "New Plant"}
            </h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Company Code <span className="text-red-500">*</span>
            </label>
            {isEdit ? (
              <div className="bg-slate-50 dark:bg-[#151E2B] rounded-xl px-3 py-[10px] text-[13px] font-semibold text-slate-600 dark:text-slate-400">
                {companyCodes.find((c) => c.id === initial.companyCodeId)?.name || `#${initial.companyCodeId}`}
              </div>
            ) : (
              <select
                value={companyCodeId}
                onChange={(e) => { setCompanyCodeId(e.target.value); setError(""); }}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
              >
                <option value="">— Choose a company code —</option>
                {companyCodes.filter((c) => c.status === "ACTIVE").map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Code {!isEdit && <span className="text-red-500">*</span>}
            </label>
            {isEdit ? (
              <div className="bg-slate-50 dark:bg-[#151E2B] rounded-xl px-3 py-[10px] text-[13px] font-mono font-bold text-slate-600 dark:text-slate-400">
                {initial.code}
              </div>
            ) : (
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
                placeholder="e.g. P001, BBSR1"
                maxLength={10}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] font-mono bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600"
              />
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Bhubaneswar Plant"
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Description <span className="text-slate-400 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              rows={3}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-[9px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[12px] font-bold transition flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : isEdit ? "Save Changes" : "Create Plant"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Department Modal ──
// Departments are a global master (SuperAdmin-created and assigned to the
// tenant). This modal maps one of the tenant's already-assigned departments
// to this plant via the tenant-scoped TenantDepartmentPlant mapping table —
// it no longer creates a brand-new department (TenantAdmin isn't permitted
// to create master departments; see departmentController.js on the backend).
function AddDepartmentModal({ plant, availableDepts, onClose, onSaved }) {
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!departmentId) return setError("Please select a department.");

    setLoading(true);
    try {
      const res = await fetch(`${API}/departments/plant/${plant.id}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ departmentId: Number(departmentId) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) return setError(data.message || "Failed to add department.");
      onSaved();
      onClose();
    } catch {
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Add Department</h3>
              <p className="text-[10px] text-slate-400">to {plant.name} ({plant.code})</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={departmentId}
              onChange={(e) => { setDepartmentId(e.target.value); setError(""); }}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
            >
              <option value="">— Choose a department —</option>
              {availableDepts.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
            {availableDepts.length === 0 && (
              <p className="text-[10px] text-slate-400 mt-2">
                No unassigned departments for your tenant right now. Ask your SuperAdmin to assign more departments to this tenant.
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-[9px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[12px] font-bold transition flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding…</> : "Add Department"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Manage Departments Drawer (TenantAdmin) ─────────────────────
// Assignment mechanism: tenant-scoped TenantDepartmentPlant mapping table
// (GET/POST/DELETE /api/departments/plant/:plantId) — the tenant is resolved
// from the caller's JWT automatically. "Available" = departments already
// assigned to this tenant (via TenantDepartment / SuperAdmin) but not yet
// mapped to this specific plant. "Assigned" = departments mapped to this
// plant. The same department can be mapped to multiple plants — see
// TenantDepartmentPlant.js on the backend.
function ManageDepartmentsDrawer({ plant, onClose, onChanged }) {
  const [allDepts, setAllDepts] = useState([]); // departments assigned to this tenant
  const [assignedDepts, setAssignedDepts] = useState([]); // departments mapped to this plant
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAvailable, setSelectedAvailable] = useState(new Set());
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!plant) return;
    setLoading(true);
    setError("");
    setSelectedAvailable(new Set());
    try {
      const payload = decodeToken();
      const tenantId = payload?.tenantId;
      const [tenantDeptRes, plantDeptRes] = await Promise.all([
        fetch(`${API}/departments/tenant/${tenantId}`, { headers: authHeaders() }),
        fetch(`${API}/departments/plant/${plant.id}`, { headers: authHeaders() }),
      ]);
      const tenantDeptData = await tenantDeptRes.json();
      const plantDeptData = await plantDeptRes.json();
      if (!tenantDeptRes.ok || !tenantDeptData.success) throw new Error(tenantDeptData.message || "Failed to load tenant departments");
      if (!plantDeptRes.ok || !plantDeptData.success) throw new Error(plantDeptData.message || "Failed to load plant departments");
      setAllDepts(tenantDeptData.data || []);
      setAssignedDepts(plantDeptData.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [plant?.id]);

  const assigned = assignedDepts;
  const available = useMemo(() => {
    const assignedIds = new Set(assignedDepts.map((d) => d.id));
    return allDepts.filter((d) => !assignedIds.has(d.id) && d.status !== "INACTIVE");
  }, [allDepts, assignedDepts]);

  const q = search.trim().toLowerCase();
  const filteredAssigned = q ? assigned.filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)) : assigned;
  const filteredAvailable = q ? available.filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)) : available;

  function toggleAvailable(id) {
    setSelectedAvailable((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleAssign() {
    if (selectedAvailable.size === 0) return;
    setBusy(true);
    try {
      const ids = Array.from(selectedAvailable);
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`${API}/departments/plant/${plant.id}`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ departmentId: id }),
          }).then((r) => r.json().then((d) => ({ ok: r.ok && d.success, message: d.message })))
        )
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length) setError(failed[0]?.message || "Some assignments failed.");
      await load();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(deptId) {
    setBusy(true);
    try {
      const res = await fetch(`${API}/departments/plant/${plant.id}/${deptId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.message || "Couldn't remove assignment."); return; }
      await load();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  if (!plant) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end" style={{ backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-[#1A2433] border-l border-slate-200 dark:border-slate-700 w-full max-w-md h-full shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
              <Settings2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate">Manage Departments</h3>
              <p className="text-[10px] text-slate-400 truncate">{plant.name} ({plant.code})</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[11px]">Loading…</span>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search departments…"
                  className="w-full text-[11px] pl-8 pr-3 py-[6px] border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-teal-500 transition placeholder-slate-300 dark:placeholder-slate-600"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                </div>
              )}

              {/* Assigned */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Assigned to this Plant
                  </h4>
                  <span className="text-[10px] text-slate-400">{filteredAssigned.length}</span>
                </div>
                {filteredAssigned.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    No departments assigned yet.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {filteredAssigned.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-700 px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#151E2B] transition-colors">
                        <div className="min-w-0">
                          <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate">{d.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{d.code}</div>
                        </div>
                        <button
                          disabled={busy}
                          onClick={() => handleRemove(d.id)}
                          className="text-[10px] font-semibold px-2 py-[5px] rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition flex items-center gap-1 disabled:opacity-40"
                        >
                          <XCircle className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Available (assigned to tenant, unassigned to a plant)
                  </h4>
                  <span className="text-[10px] text-slate-400">{filteredAvailable.length}</span>
                </div>
                {filteredAvailable.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    {available.length === 0
                      ? "No unassigned departments for your tenant right now."
                      : "No matches for your search."}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {filteredAvailable.map((d) => (
                      <label key={d.id} className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-700 px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#151E2B] transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAvailable.has(d.id)}
                          onChange={() => toggleAvailable(d.id)}
                          className="h-4 w-4 rounded accent-teal-600"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate">{d.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{d.code}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {available.length > 0 && (
                  <button
                    disabled={selectedAvailable.size === 0 || busy}
                    onClick={handleAssign}
                    className="w-full mt-3 py-[9px] rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:hover:bg-teal-600 text-white text-[12px] font-bold transition flex items-center justify-center gap-2"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightCircle className="w-3.5 h-3.5" />}
                    Add {selectedAvailable.size > 0 ? `${selectedAvailable.size} ` : ""}to this Plant
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ item, onClose, onConfirm, loading, error }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 text-center mb-1">Delete Plant?</h3>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 text-center mb-4">
          <span className="font-bold text-slate-700 dark:text-slate-200">"{item.name}"</span> will be marked inactive.
          This is blocked if it still has active departments.
        </p>
        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400 mb-4">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-[9px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold transition disabled:opacity-60">
            {loading ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Guide / Info Modal ──────────────────────────────────────────
function GuideModal({ onClose }) {
  const steps = [
    { title: "Create a Plant", desc: "Click the + button to add a new plant. You'll need to pick a company code first, then give the plant a short unique code and a name." },
    { title: "Select a Plant", desc: "Click any plant from the list on the left to view its details, including linked departments, on the right." },
    { title: "Filter by Company Code", desc: "Use the dropdown above the search box to narrow the plant list down to one company code." },
    { title: "Manage Departments", desc: "Click Manage next to Departments to assign or remove departments already assigned to your tenant for this plant." },
    { title: "Edit or Deactivate", desc: "Use Edit to update a plant's name or description. Deactivate marks it inactive — blocked if it still has active departments." },
  ];
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Info className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Plants — Guide</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <div className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{s.title}</div>
                <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="w-full py-[9px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[12px] font-bold transition">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function Plants() {
  const [companyCodes, setCompanyCodes] = useState([]);
  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [tenantDepartments, setTenantDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ccFilter, setCcFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showAddDept, setShowAddDept] = useState(false);
  const [showManageDepts, setShowManageDepts] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      const [ccRes, plantRes] = await Promise.all([
        fetch(`${API}/company-codes`, { headers: authHeaders() }),
        fetch(`${API}/plants`, { headers: authHeaders() }),
      ]);
      const ccData = await ccRes.json();
      const plantData = await plantRes.json();
      if (!ccRes.ok || !ccData.success) throw new Error(ccData.message || "Failed to load company codes");
      if (!plantRes.ok || !plantData.success) throw new Error(plantData.message || "Failed to load plants");
      setCompanyCodes(ccData.data || []);
      setPlants(plantData.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartmentsForPlant(plantId) {
    try {
      const res = await fetch(`${API}/departments/plant/${plantId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setDepartments((prev) => ({ ...prev, [plantId]: data.data || [] }));
    } catch {}
  }

  // Departments the SuperAdmin has assigned to this whole tenant (not tied to
  // a specific plant in the DB) — these should be visible under every plant.
  async function fetchTenantDepartments() {
    const payload = decodeToken();
    const tenantId = payload?.tenantId;
    if (!tenantId) return;
    try {
      const res = await fetch(`${API}/departments/tenant/${tenantId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setTenantDepartments(data.data || []);
    } catch {}
  }

   useEffect(() => { fetchAll(); fetchTenantDepartments(); }, []);
  useEffect(() => { setPage(1); }, [search, ccFilter]);

  // Auto-select the first plant once the list loads, so details show
  // immediately instead of the empty "select one" placeholder.
  useEffect(() => {
    if (!loading && !selected && plants.length > 0) {
      handleSelect(plants[0]);
    }
  }, [loading, plants]);

  function handleSelect(p) {
    setSelected(p);
    fetchDepartmentsForPlant(p.id);
  }

  const filtered = useMemo(() => plants.filter((p) => {
    const matchesCc = ccFilter ? p.companyCodeId === Number(ccFilter) : true;
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase());
    return matchesCc && matchesSearch;
  }), [plants, ccFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const ccName = (id) => companyCodes.find((c) => c.id === id)?.name || "—";
  const ccCode = (id) => companyCodes.find((c) => c.id === id)?.code || "";

  // Only departments actually mapped to this plant via TenantDepartmentPlant —
  // being assigned to the tenant no longer implies being assigned to every
  // plant (that was the exact bug the new backend mapping table fixes).
  const selectedDepts = useMemo(() => {
    if (!selected) return [];
    return (departments[selected.id] || []).map((d) => ({ ...d, status: d.status || "ACTIVE", source: "plant" }));
  }, [selected, departments]);

  // Tenant-assigned departments not yet mapped to the selected plant —
  // used to populate the "Add Department" picker.
  const availableDeptsForSelected = useMemo(() => {
    if (!selected) return [];
    const mappedIds = new Set((departments[selected.id] || []).map((d) => d.id));
    return tenantDepartments.filter((d) => !mappedIds.has(d.id));
  }, [selected, departments, tenantDepartments]);

  async function handleDeleteConfirm() {
    if (!deleteItem) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`${API}/plants/${deleteItem.id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) { setDeleteError(data.message || "Failed to delete."); return; }
      if (selected?.id === deleteItem.id) setSelected(null);
      setDeleteItem(null);
      fetchAll();
    } catch {
      setDeleteError("Server error.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex gap-0 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden min-h-[600px] bg-white dark:bg-[#1A2433]">
      {/* ── LEFT: List ── */}
      <div className="w-[320px] min-w-[320px] border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-[#151E2B]">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-[17px] font-bold text-slate-800 dark:text-slate-100">Plants</h2>
                <div className="relative group">
                  <button
                    onClick={() => setShowGuide(true)}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-teal-500 hover:text-white transition-colors">
                    <Info className="w-3 h-3" />
                  </button>
                  <div className="pointer-events-none absolute left-0 top-full mt-2 w-56 bg-slate-800 dark:bg-slate-700 text-white text-[10.5px] leading-relaxed rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                    Click to see a step-by-step guide on how to use this page.
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-600 dark:text-slate-300">{plants.length}</span> plant(s)
                {/* <span className="mx-2 opacity-40">·</span> */}
                <br />
                Company Code &rarr; Plant &rarr; Department
              </p>
            </div>
            <button onClick={() => setShowCreate(true)} disabled={companyCodes.length === 0}
              title={companyCodes.length === 0 ? "Create a company code first" : "Add plant"}
              className="w-12 h-8 flex items-center justify-center bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:hover:bg-teal-600 text-white rounded-full transition-all shadow-lg shadow-teal-600/40 ring-2 ring-teal-400/50 hover:ring-teal-400/80 hover:scale-110">
              <Plus className="w-7 h-5" />
            </button>
          </div>
        </div>

        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 space-y-2">
          <select
            value={ccFilter}
            onChange={(e) => setCcFilter(e.target.value)}
            className="w-full text-[11px] px-3 py-[6px] border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-teal-500 transition"
          >
            <option value="">All company codes</option>
            {companyCodes.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or code…"
              className="w-full text-[11px] pl-8 pr-3 py-[6px] border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-teal-500 transition placeholder-slate-300 dark:placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[11px]">Loading…</span>
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-[11px] font-semibold text-red-500">{error}</p>
            </div>
          )}
          {!loading && !error && companyCodes.length === 0 && (
            <div className="text-center py-10 px-4 text-[11px] text-slate-400">
              No company codes yet. Create one from the Company Codes page first.
            </div>
          )}
          {!loading && !error && paged.map((p) => (
            <div key={p.id}
              onClick={() => handleSelect(p)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-100 dark:border-slate-700 transition-all ${
                selected?.id === p.id
                  ? "bg-white dark:bg-[#1A2433] border-l-2 border-l-teal-600"
                  : "hover:bg-white dark:hover:bg-[#1A2433]"
              }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${p.status === "ACTIVE" ? codeColor(p.code) : "bg-slate-400"}`}>
                {p.code?.slice(0, 3)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate">{p.name}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{p.code} · {ccCode(p.companyCodeId)}</div>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
          {!loading && !error && companyCodes.length > 0 && filtered.length === 0 && (
            <div className="text-center py-10 text-[11px] text-slate-400">No plants found.</div>
          )}
        </div>

        {!loading && !error && filtered.length > 0 && (
          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700/40 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700/40 transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Details ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 p-10">
            <Factory className="w-10 h-10 opacity-40" />
            <span className="text-[13px]">Select a plant to view details</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white ${selected.status === "ACTIVE" ? codeColor(selected.code) : "bg-slate-400"}`}>
                    {selected.code?.slice(0, 3)}
                  </div>
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100">{selected.name}</span>
                  <StatusBadge status={selected.status} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-9 flex items-center gap-1.5 flex-wrap">
                  <Building2 className="w-3 h-3" /> {ccName(selected.companyCodeId)} ({ccCode(selected.companyCodeId)})
                  <span className="mx-1">·</span>
                  Code: <span className="font-mono font-bold text-teal-500">{selected.code}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditItem(selected)}
                  className="text-[11px] font-semibold px-3 py-[6px] border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => { setDeleteItem(selected); setDeleteError(""); }}
                  className="text-[11px] font-semibold px-3 py-[6px] rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition flex items-center gap-1.5">
                  <Power className="w-3 h-3" /> Deactivate
                </button>
              </div>
            </div>

            {/* Body: compressed main content + graph sidebar */}
            <div className="flex-1 flex min-h-0">
              {/* Main compressed content */}
              <div className="flex-1 min-w-0 overflow-auto p-5 border-r border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[12px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Departments
                  </h4>
                  {selected.status === "ACTIVE" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowManageDepts(true)}
                        className="text-[11px] font-semibold px-3 py-[6px] rounded-lg border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition flex items-center gap-1.5"
                      >
                        <Settings2 className="w-3 h-3" /> Manage
                      </button>
                      {/* <button
                        onClick={() => setShowAddDept(true)}
                        className="text-[11px] font-semibold px-3 py-[6px] rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button> */}
                    </div>
                  )}
                </div>
                {selectedDepts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-400">
                    <Layers className="w-8 h-8 opacity-40" />
                    <span className="text-[12px]">No departments yet. Add one above, or from Folder Structure.</span>
                  </div>
                ) : (
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#151E2B]">
                        {["Code", "Name", "Status", "Source"].map((h) => (
                          <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2 border-b border-slate-200 dark:border-slate-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDepts.map((d) => (
                        <tr key={d.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#151E2B] transition">
                          <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400">{d.code}</td>
                          <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-100">{d.name}</td>
                          <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] font-bold px-[10px] py-[3px] rounded-full border whitespace-nowrap ${
                              d.source === "tenant"
                                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                                : "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800"
                            }`}>
                              {d.source === "tenant" ? "SuperAdmin" : "This plant"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Graph sidebar — pure CSS (conic-gradient rings + bars), no SVG */}
              <div className="w-[260px] min-w-[260px] p-5 space-y-5 overflow-auto bg-slate-50/60 dark:bg-[#151E2B]/40">
                <div>
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Status Breakdown</h5>
                  <div className="mb-4">
                    <RingStat
                      label="Active departments"
                      value={selectedDepts.filter((d) => d.status === "ACTIVE").length}
                      total={selectedDepts.length}
                      color="#0d9488"
                    />
                  </div>
                  <BarStat
                    segments={[
                      { label: "Active", value: selectedDepts.filter((d) => d.status === "ACTIVE").length, color: "#0d9488" },
                      { label: "Inactive", value: selectedDepts.filter((d) => d.status !== "ACTIVE").length, color: "#ef4444" },
                    ]}
                  />
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700" />

                <div>
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Source Split</h5>
                  <BarStat
                    segments={[
                      { label: "This plant", value: selectedDepts.filter((d) => d.source !== "tenant").length, color: "#0d9488" },
                      { label: "SuperAdmin", value: selectedDepts.filter((d) => d.source === "tenant").length, color: "#6366f1" },
                    ]}
                  />
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Plant status</span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Total departments</span>
                    <span className="text-[13px] font-bold text-teal-600 dark:text-teal-400">{selectedDepts.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      {showCreate && (
        <PlantModal
          companyCodes={companyCodes}
          defaultCompanyCodeId={ccFilter}
          onClose={() => setShowCreate(false)}
          onSaved={fetchAll}
        />
      )}
      {editItem && (
        <PlantModal
          initial={editItem}
          companyCodes={companyCodes}
          onClose={() => setEditItem(null)}
          onSaved={fetchAll}
        />
      )}
      {showAddDept && selected && (
        <AddDepartmentModal
          plant={selected}
          availableDepts={availableDeptsForSelected}
          onClose={() => setShowAddDept(false)}
          onSaved={() => fetchDepartmentsForPlant(selected.id)}
        />
      )}
      {showManageDepts && selected && (
        <ManageDepartmentsDrawer
          plant={selected}
          onClose={() => setShowManageDepts(false)}
          onChanged={() => { fetchDepartmentsForPlant(selected.id); fetchTenantDepartments(); }}
        />
      )}
      {deleteItem && (
        <DeleteModal
          item={deleteItem}
          onClose={() => { setDeleteItem(null); setDeleteError(""); }}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
          error={deleteError}
        />
      )}
    </div>
  );
}