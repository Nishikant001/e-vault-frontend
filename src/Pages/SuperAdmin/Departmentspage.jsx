import { useState, useEffect } from "react";
import { useLabels } from "../../context/MetadataContext";
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

// ── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const active = status === "ACTIVE";
  return (
    <span className={`text-[10px] font-bold px-[10px] py-[3px] rounded-full border ${
      active
        ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
        : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
    }`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ── Create Department Modal ───────────────────────────────────
function CreateDeptModal({ onClose, onSaved }) {
  const { level1Label } = useLabels();
  const [name,        setName]        = useState("");
  const [code,        setCode]        = useState("");
  const [description, setDescription] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  async function handleCreate() {
    setError("");
    if (!name.trim()) return setError(`${level1Label} name is required.`);
    if (!code.trim()) return setError(`${level1Label} code is required.`);

    setLoading(true);
    try {
      const res  = await fetch(`${API}/departments`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({
          name:        name.trim(),
          code:        code.trim().toUpperCase(),
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) return setError(data.message || "Failed to create department.");
      onSaved();
      onClose();
    } catch {
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                <line x1="12" y1="12" x2="12" y2="16"/>
                <line x1="10" y1="14" x2="14" y2="14"/>
              </svg>
            </div>
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">New {level1Label}</h3>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {level1Label} Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Human Resources"
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {level1Label} Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
              placeholder="e.g. HR"
              maxLength={10}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] font-mono bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600"
            />
            <p className="text-[10px] text-slate-400 mt-1">Short unique code — auto-uppercased.</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Description <span className="text-slate-400 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={`Brief description of this ${level1Label.toLowerCase()}...`}
              rows={3}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose}
            className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={loading}
            className="flex-1 py-[9px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? (
              <><svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10"/></svg> Creating…</>
            ) : (
              <>Create {level1Label}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Department Modal ─────────────────────────────────────
function EditDeptModal({ dept, onClose, onSaved }) {
  const { level1Label } = useLabels();
  const [form,    setForm]    = useState({ name: dept.name, description: dept.description || "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSave() {
    setError("");
    if (!form.name.trim()) return setError(`${level1Label} name is required.`);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/departments/${dept.id}`, {
        method:  "PUT",
        headers: authHeaders(),
        body:    JSON.stringify({ name: form.name.trim(), description: form.description.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) return setError(data.message || "Failed to update.");
      onSaved();
      onClose();
    } catch {
      setError("Server error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">Edit {level1Label}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{level1Label} Name</label>
            <input type="text" value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError(""); }}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Description</label>
            <textarea value={form.description} rows={3}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition resize-none" />
          </div>
          <div className="bg-slate-50 dark:bg-[#151E2B] rounded-xl px-3 py-2">
            <div className="text-[10px] text-slate-400">Code (locked)</div>
            <div className="text-[13px] font-bold text-slate-600 dark:text-slate-400 font-mono">{dept.code}</div>
          </div>
          {error && <div className="text-[12px] text-red-600 dark:text-red-400 font-semibold">{error}</div>}
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-[9px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Assign Dept to Tenant Modal ───────────────────────────────
function AssignModal({ dept, tenants, onClose, onSaved }) {
  const { level1Label } = useLabels();
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  async function handleAssign() {
    setError("");
    if (!selectedTenantId) return setError("Please select a tenant.");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/departments/assign/${selectedTenantId}`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ departmentIds: [dept.id] }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) return setError(data.message || "Failed to assign.");
      setSuccess(true);
      onSaved();
    } catch {
      setError("Server error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">Assign to Tenant</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mb-1">Assigned!</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                <span className="font-bold text-blue-600 dark:text-blue-400">{dept.code}</span> assigned to tenant successfully.
              </p>
            </div>
          ) : (
            <>
              {/* Dept pill */}
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2">
                <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-[9px] font-bold text-white">{dept.code.slice(0,2)}</div>
                <span className="text-[12px] font-semibold text-blue-700 dark:text-blue-300">{dept.code} — {dept.name}</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Select Tenant <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTenantId}
                  onChange={e => { setSelectedTenantId(e.target.value); setError(""); }}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition">
                  <option value="">— Choose a tenant —</option>
                  {tenants.filter(t => t.status === "ACTIVE").map(t => (
                    <option key={t.id} value={t.id}>{t.tenantCode}_{t.tenantName}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            {success ? "Close" : "Cancel"}
          </button>
          {!success && (
            <button onClick={handleAssign} disabled={loading}
              className="flex-1 py-[9px] rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[12px] font-bold transition flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? (
                <><svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10"/></svg> Assigning…</>
              ) : `Assign ${level1Label}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Toggle Status Confirm ─────────────────────────────────────
function ToggleModal({ dept, onClose, onToggled }) {
  const { level1Label } = useLabels();
  const [loading, setLoading] = useState(false);
  const isActive = dept.status === "ACTIVE";

  async function handleToggle() {
    setLoading(true);
    try {
      await fetch(`${API}/departments/${dept.id}`, {
        method:  "PUT",
        headers: authHeaders(),
        body:    JSON.stringify({ status: isActive ? "INACTIVE" : "ACTIVE" }),
      });
      onToggled();
      onClose();
    } catch { onClose(); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isActive ? "bg-amber-100 dark:bg-amber-900/30" : "bg-green-100 dark:bg-green-900/30"}`}>
          {isActive ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </div>
        <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 text-center mb-1">
          {isActive ? `Deactivate ${level1Label}?` : `Activate ${level1Label}?`}
        </h3>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 text-center mb-5">
          <span className="font-bold text-slate-700 dark:text-slate-200">{dept.name}</span> will be marked as {isActive ? "Inactive" : "Active"}.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
          <button onClick={handleToggle} disabled={loading}
            className={`flex-1 py-[9px] rounded-xl text-white text-[12px] font-bold transition disabled:opacity-60 ${isActive ? "bg-amber-500 hover:bg-amber-600" : "bg-green-600 hover:bg-green-700"}`}>
            {loading ? "Updating…" : isActive ? "Yes, Deactivate" : "Yes, Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dept Code Avatar color ────────────────────────────────────
const CODE_COLORS = [
  "bg-blue-600", "bg-purple-600", "bg-emerald-600",
  "bg-orange-500", "bg-pink-600", "bg-teal-600", "bg-indigo-600",
];
function codeColor(code) {
  let n = 0;
  for (let i = 0; i < code.length; i++) n += code.charCodeAt(i);
  return CODE_COLORS[n % CODE_COLORS.length];
}

// ── Main Departments Page ─────────────────────────────────────
export default function Departments() {
  const { level1Label } = useLabels();
  const [depts,      setDepts]      = useState([]);
  const [tenants,    setTenants]    = useState([]);
  const [assignments, setAssignments] = useState({});  // { deptId: [...tenants] }
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [selected,   setSelected]   = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editDept,   setEditDept]   = useState(null);
  const [assignDept, setAssignDept] = useState(null);
  const [toggleDept, setToggleDept] = useState(null);

  async function fetchDepts() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/departments`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setDepts(data.data || []);
    } finally { setLoading(false); }
  }

  async function fetchTenants() {
    try {
      const res  = await fetch(`${API}/tenants`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setTenants(data.data || []);
    } catch {}
  }

  // Department ke assigned tenants fetch karo
async function fetchAssignments(deptId) {
  try {
    const res = await fetch(`${API}/departments/${deptId}/tenants`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (data.success) {
      setAssignments(prev => ({ ...prev, [deptId]: data.data || [] }));
    }
  } catch (error) {
    console.error(error);
  }
}

  function handleSelectDept(dept) {
    setSelected(dept);
    if (!assignments[dept.id]) fetchAssignments(dept.id);
  }

  useEffect(() => { fetchDepts(); fetchTenants(); }, []);

  const filtered = depts.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.code?.toLowerCase().includes(search.toLowerCase())
  );

  const deptAssignments = selected ? (assignments[selected.id] || []) : [];
  const activeCount  = deptAssignments.filter(a => a.status === "ACTIVE").length;
  const totalEmp     = deptAssignments.reduce((s, a) => s + (a.employeeCount || 0), 0);

  return (
    <div className="flex gap-0 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden min-h-[600px] bg-white dark:bg-[#1A2433]">

      {/* ── LEFT PANEL: Department List ── */}
      <div className="w-[280px] min-w-[280px] border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-[#151E2B]">

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{level1Label} master</h2>
            <button onClick={() => setShowCreate(true)}
              className="w-6 h-6 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-md transition text-[14px] font-bold">+</button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{depts.length} departments total</p>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or code…"
            className="w-full text-[11px] px-3 py-[6px] border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition placeholder-slate-300 dark:placeholder-slate-600"
          />
        </div>

        {/* Dept list */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a10 10 0 0 1 10 10"/></svg>
              <span className="text-[11px]">Loading…</span>
            </div>
          )}
          {!loading && filtered.map(d => (
            <div key={d.id}
              onClick={() => handleSelectDept(d)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-100 dark:border-slate-700 transition-all ${
                selected?.id === d.id
                  ? "bg-white dark:bg-[#1A2433] border-l-2 border-l-blue-600"
                  : "hover:bg-white dark:hover:bg-[#1A2433]"
              }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${d.status === "ACTIVE" ? codeColor(d.code) : "bg-slate-400"}`}>
                {d.code.slice(0, 3)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate">{d.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{d.code} · {(assignments[d.id] || []).length} tenants</div>
              </div>
              <StatusBadge status={d.status} />
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-10 text-[11px] text-slate-400">No departments found.</div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Assignments ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 p-10">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
            </svg>
            <span className="text-[13px]">Select a department to view tenant assignments</span>
          </div>
        ) : (
          <>
            {/* Right header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white ${selected.status === "ACTIVE" ? codeColor(selected.code) : "bg-slate-400"}`}>
                    {selected.code.slice(0,3)}
                  </div>
                  <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100">{selected.name}</span>
                  <StatusBadge status={selected.status} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-9">
                  {selected.description} · Code: <span className="font-mono font-bold text-blue-500">{selected.code}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditDept(selected)}
                  className="text-[11px] font-semibold px-3 py-[6px] border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                  ✏️ Edit
                </button>
                <button onClick={() => setToggleDept(selected)}
                  className={`text-[11px] font-semibold px-3 py-[6px] rounded-lg border transition ${
                    selected.status === "ACTIVE"
                      ? "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
                      : "border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                  }`}>
                  {selected.status === "ACTIVE" ? "⏸ Deactivate" : "▶ Activate"}
                </button>
                <button onClick={() => setAssignDept(selected)}
                  className="text-[11px] font-bold px-4 py-[6px] bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
                  🏢 Assign to Tenant
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-700">
              {[
                { label: "Total tenants assigned", value: deptAssignments.length, color: "text-blue-600 dark:text-blue-400" },
                { label: "Active assignments",      value: activeCount,             color: "text-green-600 dark:text-green-400" },
                { label: "Inactive assignments",    value: deptAssignments.length - activeCount, color: "text-orange-500" },
                { label: "Total employees",         value: totalEmp,                color: "text-slate-700 dark:text-slate-200" },
              ].map(s => (
                <div key={s.label} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                  <div className="text-[10px] text-slate-400">{s.label}</div>
                  <div className={`text-[22px] font-bold mt-0.5 ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-5">
              {deptAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                  <span className="text-[13px]">No tenants assigned yet.</span>
                  <button onClick={() => setAssignDept(selected)}
                    className="text-[12px] text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                    + Assign to first tenant
                  </button>
                </div>
              ) : (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#151E2B]">
                      {["#","Tenant code","Tenant name","Assigned on","Employees","Status",""].map(h => (
                        <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deptAssignments.map((a, i) => (
                      <tr key={a.tenantId} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#151E2B] transition">
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                            {a.tenantId}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-100">{a.tenantName}</td>
                        <td className="px-3 py-2 text-slate-400">{new Date(a.assignedAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-3 py-2 font-mono text-right">{a.employeeCount ?? 0}</td>
                        <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
                        <td className="px-3 py-2 text-right">
                          <button className="text-[10px] px-3 py-1 rounded-full border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showCreate  && <CreateDeptModal onClose={() => setShowCreate(false)} onSaved={fetchDepts} />}
      {editDept    && <EditDeptModal dept={editDept} onClose={() => setEditDept(null)} onSaved={fetchDepts} />}
      {assignDept  && <AssignModal dept={assignDept} tenants={tenants} onClose={() => setAssignDept(null)} onSaved={() => { fetchDepts(); fetchAssignments(assignDept.id); }} />}
      {toggleDept  && <ToggleModal dept={toggleDept} onClose={() => setToggleDept(null)} onToggled={fetchDepts} />}
    </div>
  );
}