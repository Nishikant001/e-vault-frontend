import { useState, useEffect } from "react";
import { API, authHeaders } from "./tenantApi";

// ── 2-Step Register Modal (SuperAdmin-created tenants are always PAID —
// unchanged backend behavior; FREE tenants only via self-service signup) ──
export function RegisterModal({ onClose, onSaved }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdTenant, setCreatedTenant] = useState(null);

  const [tenantName, setTenantName] = useState("");
  const [tenantCode, setTenantCode] = useState("");
  const [erpConfigs, setErpConfigs] = useState([]);
  const [erpConfigIds, setErpConfigIds] = useState([]);
  // ── ERP / Non-ERP Tenant Classification ──────────────────────────
  // SuperAdmin-created tenants are always PAID. This toggle decides
  // PAID+ERP vs PAID+NON-ERP — defaults to true to match the previous
  // (ERP-only) behavior of this modal, so existing SuperAdmin workflows
  // aren't disrupted; SuperAdmin simply flips it off for a NON-ERP tenant.
  const [erpEnabled, setErpEnabled] = useState(true);

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);

  function handleStep1() {
  setError("");
  if (!tenantName.trim()) return setError("Tenant name is required.");
  if (!tenantCode.trim()) return setError("Tenant code is required.");
  if (erpEnabled && erpConfigIds.length === 0) return setError("Please select at least one ERP configuration.");
  setStep(2);
}

  async function handleStep2() {
  setError("");
  if (!adminName.trim()) return setError("Admin name is required.");
  if (!adminEmail.trim()) return setError("Email is required.");
  if (!adminPassword.trim()) return setError("Password is required.");
  if (adminPassword.length < 6) return setError("Password must be at least 6 characters.");

  setLoading(true);
  try {
    const res = await fetch(`${API}/tenants`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        tenantName: tenantName.trim(),
        tenantCode: tenantCode.trim().toUpperCase(),
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
        erpEnabled,
        erpConfigIds: erpEnabled ? erpConfigIds.map(Number) : [],
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) return setError(data.message || "Failed to create tenant.");
    setCreatedTenant(data.tenant);
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
        if (data.success) setErpConfigs((data.data || []).filter((item) =>
  ["ACTIVE", "CONNECTED"].includes(item.status)
));
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
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all ${
          done_ ? "bg-blue-600 border-blue-600 text-white"
            : active ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-transparent"
            : "border-slate-300 dark:border-slate-600 text-slate-400"
        }`}>
          {done_ ? "✓" : n}
        </div>
        <span className={`text-[11px] font-semibold ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>{label}</span>
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
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{done ? "Setup Complete!" : "Register New Tenant"}</h3>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
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
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
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
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Tenant Name <span className="text-red-500">*</span></label>
                <input type="text" value={tenantName} onChange={(e) => { setTenantName(e.target.value); setError(""); }}
                  placeholder="e.g. Veda Hospitality"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Tenant Code <span className="text-red-500">*</span></label>
                <input type="text" value={tenantCode} onChange={(e) => { setTenantCode(e.target.value.toUpperCase()); setError(""); }}
                  placeholder="e.g. VEDA001"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition placeholder-slate-300 dark:placeholder-slate-600" />
                <p className="text-[10px] text-slate-400 mt-1">Unique code — cannot be changed later.</p>
              </div>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#151E2B] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3">
                <div>
                  <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">ERP Integration</div>
                  <div className="text-[10px] text-slate-400">Enable SAP/ERP synchronization for this tenant</div>
                </div>
                <button
                  type="button"
                  onClick={() => { setErpEnabled((v) => !v); if (erpEnabled) setErpConfigIds([]); setError(""); }}
                  aria-pressed={erpEnabled}
                  className={`relative w-10 h-5 rounded-full transition-all duration-200 ${erpEnabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${erpEnabled ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              {erpEnabled && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2">ERP Configuration <span className="text-red-500">*</span></label>
                  <select multiple value={erpConfigIds.map(String)} onChange={(e) => {
                     setErpConfigIds(Array.from(e.target.selectedOptions).map((o) => Number(o.value)));
                     setError("");
                   }}
                     className="w-full min-h-[92px] border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200">
                     {erpConfigs.map((item) => (
                       <option key={item.id} value={item.id}>
                         {item.name} ({item.erpType}) — {item.integrationMode || "BOTH"}
                       </option>
                     ))}
                   </select>
                   <p className="text-[10px] text-slate-400 mt-1">Select one or more ERP connections. INBOUND = SAP → Evault; OUTBOUND = Evault → SAP.</p>
                  {erpConfigs.length === 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      No connected ERP configurations available. Create one under SuperAdmin ERP Configuration management first.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {!done && step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                <span className="text-[12px] font-semibold text-blue-700 dark:text-blue-300">{createdTenant?.tenantCode}_{createdTenant?.tenantName}</span>
                {/* <span className="ml-auto text-[10px] text-blue-500 font-bold">ID: {createdTenant?.id}</span> */}
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Admin Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={adminName} onChange={(e) => { setAdminName(e.target.value); setError(""); }}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Admin Email <span className="text-red-500">*</span></label>
                <input type="email" value={adminEmail} onChange={(e) => { setAdminEmail(e.target.value); setError(""); }}
                  placeholder="admin@vedahospitality.com"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={adminPassword}
                    onChange={(e) => { setAdminPassword(e.target.value); setError(""); }}
                    placeholder="Min. 6 characters"
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] pr-10 text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition" />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                    {showPass ? "🙈" : "👁"}
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
                {loading ? "Processing…" : step === 1 ? "Next: Set Admin →" : "Register & Create Admin"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Edit Tenant Modal ─────────────────────────────────────────
// ── ERP / Non-ERP Tenant Classification ───────────────────────────
// FREE tenants never show the ERP toggle here — their ERP capability is
// forced server-side (erpEnabled: false, erpConfigId: null) regardless of
// what's sent, so exposing the toggle for them would be misleading.
export function EditModal({ tenant, onClose, onSaved }) {
  const isFree = tenant.tenantType === "FREE";
  const [form, setForm] = useState({ tenantName: tenant.tenantName });
  const [erpEnabled, setErpEnabled] = useState(!!tenant.erpEnabled);
  // Do NOT auto-select an ERP config unless the tenant's actual API data
  // already has one assigned — matches the requirement that switching
  // NON-ERP -> ERP always requires an explicit SuperAdmin selection.
  const [erpConfigIds, setErpConfigIds] = useState(
    (tenant.erpConnections?.length
      ? tenant.erpConnections.map((c) => c.erpConfigId)
      : (tenant.erpConfigId ? [tenant.erpConfigId] : [])
    ).map(String)
  );
  const [erpConfigs, setErpConfigs] = useState([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isFree) return;
    async function loadErpConfigs() {
      setLoadingConfigs(true);
      try {
        const res = await fetch(`${API}/erp-configs`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) setErpConfigs((data.data || []).filter((item) =>
  ["ACTIVE", "CONNECTED"].includes(item.status)
));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingConfigs(false);
      }
    }
    loadErpConfigs();
  }, [isFree]);

  function handleToggleErp() {
    setError("");
    setErpEnabled((v) => {
      const next = !v;
      // ERP -> NON-ERP: clear the selection immediately so a stale id can
      // never be sent. NON-ERP -> ERP: leave it empty (no auto-select) so
      // SuperAdmin must explicitly choose one before saving.
      if (!next) setErpConfigIds([]);
      return next;
    });
  }

  async function handleSave() {
    setError("");
    if (!form.tenantName.trim()) return setError("Tenant name is required.");
    if (!isFree && erpEnabled && erpConfigIds.length === 0) {
      return setError("Please select an ERP configuration before enabling ERP.");
    }
    setLoading(true);
    try {
      const body = { tenantName: form.tenantName };
      if (!isFree) {
        // ERP -> NON-ERP must send erpConfigId: null explicitly; NON-ERP ->
        // ERP must send the selected id. Both fields always sent together
        // so the backend's resolveErpClassification sees a consistent pair.
        body.erpEnabled = erpEnabled;
        body.erpConfigIds = erpEnabled ? erpConfigIds.map(Number) : [];
        body.erpConfigId = erpEnabled && erpConfigIds.length ? Number(erpConfigIds[0]) : null;
      }
      const res = await fetch(`${API}/tenants/${tenant.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(body),
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
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Tenant Name</label>
            <input type="text" value={form.tenantName}
              onChange={(e) => { setForm((f) => ({ ...f, tenantName: e.target.value })); setError(""); }}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition" />
          </div>
          <div className="bg-slate-50 dark:bg-[#151E2B] rounded-xl px-3 py-2">
            <div className="text-[10px] text-slate-400">Tenant Code (locked)</div>
            <div className="text-[13px] font-bold text-slate-600 dark:text-slate-400 font-mono">{tenant.tenantCode}</div>
          </div>

          {isFree ? (
            <div className="bg-slate-50 dark:bg-[#151E2B] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
              <div className="text-[10px] text-slate-400">ERP Integration</div>
              <div className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                Not available for FREE tenants.
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#151E2B] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3">
                <div>
                  <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">ERP Integration</div>
                  <div className="text-[10px] text-slate-400">Enable SAP/ERP synchronization for this tenant</div>
                </div>
                <button type="button" onClick={handleToggleErp} aria-pressed={erpEnabled}
                  className={`relative w-10 h-5 rounded-full transition-all duration-200 ${erpEnabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${erpEnabled ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              {erpEnabled && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    ERP Configuration <span className="text-red-500">*</span>
                  </label>
                  <select multiple value={erpConfigIds.map(String)} onChange={(e) => {
                    setErpConfigIds(Array.from(e.target.selectedOptions).map((o) => Number(o.value)));
                    setError("");
                  }}
                    disabled={loadingConfigs}
                    className="w-full min-h-[92px] border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 disabled:opacity-60">
                    {erpConfigs.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.erpType}) — {item.integrationMode || "BOTH"}
                      </option>
                    ))}
                    {tenant.erpConfigId && !erpConfigs.some((c) => c.id === tenant.erpConfigId) && tenant.erpConfig && (
                      <option value={tenant.erpConfigId}>{tenant.erpConfig.name} ({tenant.erpConfig.erpType}) — current</option>
                    )}
                  </select>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Select one or more ERP connections. INBOUND = SAP → Evault; OUTBOUND = Evault → SAP.</p>
                  {!loadingConfigs && erpConfigs.length === 0 && !tenant.erpConfig && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      No connected ERP configurations available.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {error && <div className="text-[12px] text-red-600 dark:text-red-400 font-semibold">{error}</div>}
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-[9px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition disabled:opacity-60">
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Tenant Modal ───────────────────────────────────────
export function DeleteModal({ tenant, onClose, onDeleted }) {
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
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">🗑</div>
        <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 text-center mb-1">Delete Tenant?</h3>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 text-center mb-5">
          <span className="font-bold text-slate-700 dark:text-slate-200">{tenant.tenantName}</span> will be permanently deleted.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
          <button onClick={handleDelete} disabled={loading} className="flex-1 py-[9px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold transition disabled:opacity-60">
            {loading ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit User Modal ───────────────────────────────────────────
export function EditUserModal({ user, onClose, onSaved }) {
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
          <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">Edit User</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Full Name</label>
            <input type="text" value={form.name}
              onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError(""); }}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition" />
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
            <button type="button" onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
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
          <button onClick={handleSave} disabled={loading} className="flex-1 py-[9px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition disabled:opacity-60">
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete User Modal ─────────────────────────────────────────
export function DeleteUserModal({ user, onClose, onDeleted }) {
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
        <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 text-center mb-1">Remove User?</h3>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 text-center mb-5">
          <span className="font-bold text-slate-700 dark:text-slate-200">{user.name}</span> ({user.email}) will be permanently removed.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
          <button onClick={handleDelete} disabled={loading} className="flex-1 py-[9px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold transition disabled:opacity-60">
            {loading ? "Removing…" : "Yes, Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}