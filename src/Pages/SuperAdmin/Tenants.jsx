import { useState, useEffect } from "react";
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
    <span
      className={`text-[10px] font-bold px-[10px] py-[3px] rounded-full border ${
        active
          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function UserStatusBadge({ isActive }) {
  return (
    <span
      className={`text-[10px] font-bold px-[8px] py-[2px] rounded-full border ${
        isActive
          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ── 2-Step Register Modal ─────────────────────────────────────
function RegisterModal({ onClose, onSaved }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdTenant, setCreatedTenant] = useState(null);

  const [tenantName, setTenantName] = useState("");
  const [tenantCode, setTenantCode] = useState("");
  const [erpConfigs, setErpConfigs] = useState([]);
  const [erpConfigId, setErpConfigId] = useState("");

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);

  async function handleStep1() {
    setError("");
    if (!tenantName.trim()) return setError("Tenant name is required.");
    if (!tenantCode.trim()) return setError("Tenant code is required.");
    if (!erpConfigId) return setError("Please select an OData Plugin.");

    setLoading(true);
    try {
      const res = await fetch(`${API}/tenants`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          tenantName: tenantName.trim(),
          tenantCode: tenantCode.trim().toUpperCase(),
          erpConfigId: Number(erpConfigId),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        return setError(data.message || "Failed to create tenant.");
      setCreatedTenant(data.data);
      setStep(2);
    } catch {
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    setError("");
    if (!adminName.trim()) return setError("Admin name is required.");
    if (!adminEmail.trim()) return setError("Email is required.");
    if (!adminPassword.trim()) return setError("Password is required.");
    if (adminPassword.length < 6)
      return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: adminName.trim(),
          email: adminEmail.trim(),
          password: adminPassword,
          role: "TenantAdmin",
          tenantId: createdTenant.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        return setError(data.message || "Failed to create admin.");
      setDone(true);
      onSaved();
    } catch {
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadErpConfigs() {
      try {
        const res = await fetch(`${API}/erp-configs`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) {
          setErpConfigs((data.data || []).filter((item) => item.status === "CONNECTED"));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadErpConfigs();
  }, []);

  function StepDot({ n, label }) {
    const active = step === n;
    const done_ = step > n || done;
    return (
      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all ${
            done_
              ? "bg-blue-600 border-blue-600 text-white"
              : active
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-transparent"
                : "border-slate-300 dark:border-slate-600 text-slate-400"
          }`}
        >
          {done_ ? "✓" : n}
        </div>
        <span className={`text-[11px] font-semibold ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
                {done ? "Setup Complete!" : "Register New Tenant"}
              </h3>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          {!done && (
            <div className="flex items-center gap-3">
              <StepDot n={1} label="Tenant Info" />
              <div className={`flex-1 h-[2px] rounded-full transition-all ${step > 1 ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />
              <StepDot n={2} label="Admin Credentials" />
            </div>
          )}
        </div>

        <div className="px-6 py-5">
          {done && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 mb-2">Tenant Registered!</h4>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-5">Tenant and TenantAdmin have been created successfully.</p>
              <div className="bg-slate-50 dark:bg-[#151E2B] border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left space-y-2 mb-5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Login Credentials</div>
                {[
                  { label: "Tenant", value: `${createdTenant?.tenantCode}_${createdTenant?.tenantName}` },
                  { label: "Role", value: "TenantAdmin" },
                  { label: "Email", value: adminEmail },
                  { label: "Password", value: adminPassword },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">{item.label}</span>
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                ⚠ Save these credentials — password cannot be retrieved later.
              </p>
            </div>
          )}

          {!done && step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Tenant Name <span className="text-red-500">*</span>
                </label>
                <input type="text" value={tenantName} onChange={(e) => { setTenantName(e.target.value); setError(""); }}
                  placeholder="e.g. Veda Hospitality"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Tenant Code <span className="text-red-500">*</span>
                </label>
                <input type="text" value={tenantCode} onChange={(e) => { setTenantCode(e.target.value.toUpperCase()); setError(""); }}
                  placeholder="e.g. VEDA001"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">Unique code — cannot be changed later.</p>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2">
                  OData Plugin <span className="text-red-500">*</span>
                </label>
                <select value={erpConfigId} onChange={(e) => setErpConfigId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-[10px]">
                  <option value="">Select OData Plugin</option>
                  {erpConfigs.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} ({item.erpType})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {!done && step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span className="text-[12px] font-semibold text-blue-700 dark:text-blue-300">
                  {createdTenant?.tenantCode}_{createdTenant?.tenantName}
                </span>
                <span className="ml-auto text-[10px] text-blue-500 font-bold">ID: {createdTenant?.id}</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Admin Full Name <span className="text-red-500">*</span>
                </label>
                <input type="text" value={adminName} onChange={(e) => { setAdminName(e.target.value); setError(""); }}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Admin Email <span className="text-red-500">*</span>
                </label>
                <input type="email" value={adminEmail} onChange={(e) => { setAdminEmail(e.target.value); setError(""); }}
                  placeholder="admin@vedahospitality.com"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={adminPassword}
                    onChange={(e) => { setAdminPassword(e.target.value); setError(""); }}
                    placeholder="Min. 6 characters"
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] pr-10 text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600"
                  />
                  <button type="button" onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                    {showPass ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-[#151E2B] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                <div className="text-[10px] text-slate-400 mb-1">Role assigned automatically</div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center text-[8px] font-bold text-white">TA</div>
                  <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">TenantAdmin</span>
                </div>
              </div>
            </div>
          )}

          {error && !done && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400 mt-4">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          {done ? (
            <button onClick={onClose} className="w-full py-[9px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition">Done</button>
          ) : (
            <>
              <button onClick={step === 1 ? onClose : () => { setStep(1); setError(""); }}
                className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                {step === 1 ? "Cancel" : "← Back"}
              </button>
              <button onClick={step === 1 ? handleStep1 : handleStep2} disabled={loading}
                className="flex-1 py-[9px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? (
                  <><svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg> Processing…</>
                ) : step === 1 ? <>Next: Set Admin →</> : <>Register & Create Admin</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Edit Tenant Modal ─────────────────────────────────────────
function EditModal({ tenant, onClose, onSaved }) {
  const [form, setForm] = useState({ tenantName: tenant.tenantName });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!form.tenantName.trim()) return setError("Tenant name is required.");
    setLoading(true);
    try {
      const res = await fetch(`${API}/tenants/${tenant.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ tenantName: form.tenantName }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) return setError(data.message || "Failed.");
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
          <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">Edit Tenant</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Tenant Name</label>
            <input type="text" value={form.tenantName}
              onChange={(e) => { setForm((f) => ({ ...f, tenantName: e.target.value })); setError(""); }}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
            />
          </div>
          <div className="bg-slate-50 dark:bg-[#151E2B] rounded-xl px-3 py-2">
            <div className="text-[10px] text-slate-400">Tenant Code (locked)</div>
            <div className="text-[13px] font-bold text-slate-600 dark:text-slate-400 font-mono">{tenant.tenantCode}</div>
          </div>
          {error && <div className="text-[12px] text-red-600 dark:text-red-400 font-semibold">{error}</div>}
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-[9px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Tenant Modal ───────────────────────────────────────
function DeleteModal({ tenant, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`${API}/tenants/${tenant.id}`, { method: "DELETE", headers: authHeaders() });
      onDeleted();
      onClose();
    } catch {
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" />
          </svg>
        </div>
        <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 text-center mb-1">Delete Tenant?</h3>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 text-center mb-5">
          <span className="font-bold text-slate-700 dark:text-slate-200">{tenant.tenantName}</span> will be permanently deleted.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-[9px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold transition disabled:opacity-60">
            {loading ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit User Modal ───────────────────────────────────────────
function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ name: user.name, role: user.role, isActive: user.isActive });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    setLoading(true);
    try {
      const res = await fetch(`${API}/users/${user.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ name: form.name, role: form.role, isActive: form.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) return setError(data.message || "Failed.");
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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">Edit User</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Full Name</label>
            <input type="text" value={form.name}
              onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError(""); }}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Role</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition">
              <option value="TenantAdmin">TenantAdmin</option>
              <option value="User">User</option>
            </select>
          </div>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-[#151E2B] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3">
            <div>
              <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">Active Status</div>
              <div className="text-[10px] text-slate-400">Enable or disable this user</div>
            </div>
            <button type="button"
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
              className={`relative w-10 h-5 rounded-full transition-all duration-200 ${form.isActive ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${form.isActive ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
          <div className="bg-slate-50 dark:bg-[#151E2B] rounded-xl px-3 py-2">
            <div className="text-[10px] text-slate-400">Email (locked)</div>
            <div className="text-[13px] font-bold text-slate-600 dark:text-slate-400 font-mono">{user.email}</div>
          </div>
          {error && <div className="text-[12px] text-red-600 dark:text-red-400 font-semibold">{error}</div>}
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-[9px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete User Modal ─────────────────────────────────────────
function DeleteUserModal({ user, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`${API}/users/${user.id}`, { method: "DELETE", headers: authHeaders() });
      onDeleted();
      onClose();
    } catch {
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 text-center mb-1">Remove User?</h3>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 text-center mb-5">
          <span className="font-bold text-slate-700 dark:text-slate-200">{user.name}</span> ({user.email}) will be permanently removed.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-[9px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold transition disabled:opacity-60">
            {loading ? "Removing…" : "Yes, Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Users Section (shown inside expanded tenant) ──────────────
function TenantUsersSection({ tenantId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [delUser, setDelUser] = useState(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/users?tenantId=${tenantId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [tenantId]);

  async function toggleUserStatus(u) {
    try {
      await fetch(`${API}/users/${u.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      fetchUsers();
    } catch {
      /* silent */
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-slate-400">
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
        <span className="text-[12px]">Loading users…</span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
            Users & Admins
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            {users.length}
          </span>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="flex items-center gap-2 py-3 px-3 bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[11px] text-slate-400">No users found for this tenant.</span>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 flex items-center gap-3">
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${
                u.role === "TenantAdmin" ? "bg-purple-600" : "bg-blue-500"
              }`}>
                {u.name?.slice(0, 2).toUpperCase() || "??"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">{u.name}</span>
                  <span className={`text-[9px] font-bold px-[7px] py-[2px] rounded-full border ${
                    u.role === "TenantAdmin"
                      ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                      : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                  }`}>
                    {u.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-px">{u.email}</div>
              </div>

              {/* Status badge */}
              <UserStatusBadge isActive={u.isActive} />

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => toggleUserStatus(u)}
                  title={u.isActive ? "Deactivate" : "Activate"}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg border transition text-[10px] font-bold ${
                    u.isActive
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-100"
                      : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-100"
                  }`}>
                  {u.isActive ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => setEditUser(u)}
                  title="Edit user"
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#232F40] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDelUser(u)}
                  title="Remove user"
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 transition">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editUser && (
        <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={fetchUsers} />
      )}
      {delUser && (
        <DeleteUserModal user={delUser} onClose={() => setDelUser(null)} onDeleted={fetchUsers} />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [delTenant, setDelTenant] = useState(null);
  const [search, setSearch] = useState("");

  async function fetchTenants() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/tenants`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setTenants(data.data || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTenants();
  }, []);

  async function toggleStatus(t) {
    const newStatus = t.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await fetch(`${API}/tenants/${t.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTenants();
    } catch {
      /* silent */
    }
  }

  const filtered = tenants.filter(
    (t) =>
      t.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
      t.tenantCode?.toLowerCase().includes(search.toLowerCase()),
  );
  const activeCount = tenants.filter((t) => t.status === "ACTIVE").length;
  const inactiveCount = tenants.filter((t) => t.status === "INACTIVE").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Tenants", value: tenants.length, icon: "🏢", color: "text-blue-600 dark:text-blue-400" },
          { label: "Active", value: activeCount, icon: "✅", color: "text-green-600 dark:text-green-400" },
          { label: "Inactive", value: inactiveCount, icon: "⏸️", color: "text-red-500 dark:text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{s.label}</span>
              <span className="text-base">{s.icon}</span>
            </div>
            <div className={`text-[26px] font-bold leading-tight ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Tenant Management</h2>
          <p className="text-[11px] text-slate-400 mt-px">{tenants.length} tenants registered</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenants…"
              className="pl-8 pr-3 py-[7px] text-[12px] border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition w-[170px]"
            />
          </div>
          <button onClick={fetchTenants}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#232F40] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-[8px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-lg transition-all">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Register Tenant
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
          <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <span className="text-[13px]">Loading tenants…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[13px]">{search ? "No tenants match your search." : "No tenants registered yet."}</span>
          {!search && (
            <button onClick={() => setShowModal(true)} className="text-[12px] text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              + Register first tenant
            </button>
          )}
        </div>
      )}

      {/* Cards */}
      {!loading && (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all hover:shadow-md">
              {/* Tenant row */}
              <div className="flex items-center gap-3 px-4 py-4 cursor-pointer"
                onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0 ${t.status === "ACTIVE" ? "bg-blue-600" : "bg-slate-400"}`}>
                  {(t.tenantCode || "??").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">
                    {t.tenantCode}_{t.tenantName}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-px">
                    <span>ID: {t.id}</span>
                    <span>·</span>
                    <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <StatusBadge status={t.status} />
                <span className="text-slate-400 dark:text-slate-600 text-xs ml-1">{expanded === t.id ? "▲" : "▼"}</span>
              </div>

              {/* Expanded section */}
              {expanded === t.id && (
                <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-[#151E2B] px-4 py-4">
                  {/* Tenant details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Tenant ID", value: t.id },
                      { label: "Tenant Code", value: t.tenantCode },
                      { label: "Status", value: t.status },
                      { label: "ERP Plugin", value: t.ErpConfig?.name || "-" },
                      { label: "ERP Type", value: t.ErpConfig?.erpType || "-" },
                      { label: "Created", value: new Date(t.createdAt).toLocaleDateString() },
                      { label: "Updated", value: new Date(t.updatedAt).toLocaleDateString() },
                    ].map((item) => (
                      <div key={item.label} className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                        <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider">{item.label}</div>
                        <div className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tenant action buttons */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    <button onClick={(e) => { e.stopPropagation(); setEditTenant(t); }}
                      className="px-3 py-[6px] text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-1">
                      ✏️ Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleStatus(t); }}
                      className={`px-3 py-[6px] text-[11px] font-semibold rounded-lg transition border ${
                        t.status === "ACTIVE"
                          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                          : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                      }`}>
                      {t.status === "ACTIVE" ? "⏸ Suspend" : "▶ Activate"}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDelTenant(t); }}
                      className="px-3 py-[6px] text-[11px] font-semibold bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition flex items-center gap-1 ml-auto">
                      🗑 Delete
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-200 dark:border-slate-700 mb-4" />

                  {/* Users/Admins section */}
                  <TenantUsersSection tenantId={t.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && <RegisterModal onClose={() => setShowModal(false)} onSaved={fetchTenants} />}
      {editTenant && <EditModal tenant={editTenant} onClose={() => setEditTenant(null)} onSaved={fetchTenants} />}
      {delTenant && <DeleteModal tenant={delTenant} onClose={() => setDelTenant(null)} onDeleted={fetchTenants} />}
    </div>
  );
}