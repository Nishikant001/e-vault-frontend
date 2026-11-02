import { useState, useEffect, useMemo } from "react";
import {
  Building2, Plus, Pencil, Power, Factory, Layers, AlertCircle,
} from "lucide-react";
import {
  AppButton, AppCard, AppInput, AppSelect, AppModal,
  StatusBadge, EmptyState, SkeletonCard, ConfirmDialog, AppSearch,
  AppFilter, useToast,
} from "../../components/ui";
import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;

function getToken() {
  return localStorage.getItem("accessToken") || "";
}
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

const CODE_COLORS = [
  "bg-brand-500", "bg-info-500", "bg-success-500",
  "bg-warning-500", "bg-danger-500",
];
function codeColor(code = "") {
  let n = 0;
  for (let i = 0; i < code.length; i++) n += code.charCodeAt(i);
  return CODE_COLORS[n % CODE_COLORS.length];
}

// ── Create / Edit Modal ─────────────────────────────────────────
function CompanyCodeModal({ open, initial, tenants, defaultTenantId, onClose, onSaved }) {
  const isEdit = !!initial;
  const [tenantId, setTenantId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setTenantId(initial?.tenantId || defaultTenantId || "");
    setCode(initial?.code || "");
    setName(initial?.name || "");
    setDescription(initial?.description || "");
    setError("");
  }, [open, initial, defaultTenantId]);

  async function handleSave() {
    setError("");
    if (!isEdit && !tenantId) return setError("Please select a tenant.");
    if (!isEdit && !code.trim()) return setError("Company code is required.");
    if (!name.trim()) return setError("Name is required.");

    setLoading(true);
    try {
      const url = isEdit ? `${API}/company-codes/${initial.id}` : `${API}/company-codes`;
      const body = isEdit
        ? { name: name.trim(), description: description.trim() || undefined }
        : { tenantId: Number(tenantId), code: code.trim().toUpperCase(), name: name.trim(), description: description.trim() || undefined };

      const res = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.success) return setError(data.message || "Failed to save company code.");
      toast({ title: isEdit ? "Company code updated" : "Company code created", tone: "success" });
      onSaved();
      onClose();
    } catch {
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Company Code" : "New Company Code"}
      size="md"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose}>Cancel</AppButton>
          <AppButton onClick={handleSave} loading={loading}>{isEdit ? "Save Changes" : "Create Company Code"}</AppButton>
        </>
      }
    >
      <div className="space-y-4">
        <AppSelect
          label="Tenant"
          required
          value={tenantId}
          disabled={isEdit}
          onChange={(e) => { setTenantId(e.target.value); setError(""); }}
        >
          <option value="">— Choose a tenant —</option>
          {tenants.filter((t) => t.status === "ACTIVE").map((t) => (
            <option key={t.id} value={t.id}>{t.tenantCode} — {t.tenantName}</option>
          ))}
        </AppSelect>

        <AppInput
          label="Code" required disabled={isEdit}
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
          placeholder="e.g. CC01, IN01"
          maxLength={10}
        />
        <AppInput
          label="Name" required
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="e.g. Acme India Pvt Ltd"
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            Description <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description..."
            rows={3}
            className="w-full rounded-app-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-app-md bg-danger-50 dark:bg-danger-500/15 px-3 py-2 text-sm font-medium text-danger-600 dark:text-danger-500">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
      </div>
    </AppModal>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function CompanyCodes({ onNavigate }) {
  const [tenants, setTenants] = useState([]);
  const [companyCodes, setCompanyCodes] = useState([]);
  const [plantCounts, setPlantCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const [tenantFilter, setTenantFilter] = useState(null);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      const [tRes, ccRes, pRes] = await Promise.all([
        fetch(`${API}/tenants`, { headers: authHeaders() }),
        fetch(`${API}/company-codes`, { headers: authHeaders() }),
        fetch(`${API}/plants`, { headers: authHeaders() }),
      ]);
      const tData = await tRes.json();
      const ccData = await ccRes.json();
      const pData = await pRes.json();
      if (!tRes.ok || !tData.success) throw new Error(tData.message || "Failed to load tenants");
      if (!ccRes.ok || !ccData.success) throw new Error(ccData.message || "Failed to load company codes");
      setTenants(tData.data || []);
      setCompanyCodes(ccData.data || []);
      const counts = {};
      (pData.data || []).forEach((p) => { counts[p.companyCodeId] = (counts[p.companyCodeId] || 0) + 1; });
      setPlantCounts(counts);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const tenantName = (id) => tenants.find((t) => t.id === id)?.tenantName || `Tenant #${id}`;
  const tenantCode = (id) => tenants.find((t) => t.id === id)?.tenantCode || "";

  const filtered = useMemo(() => {
    let list = companyCodes;
    if (tenantFilter) list = list.filter((c) => String(c.tenantId) === String(tenantFilter));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || tenantName(c.tenantId).toLowerCase().includes(q));
    }
    return list;
  }, [companyCodes, tenantFilter, search, tenants]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((c) => { (map[c.tenantId] ??= []).push(c); });
    return map;
  }, [filtered]);

  async function handleDeleteConfirm() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API}/company-codes/${deleteItem.id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) { toast({ title: "Couldn't deactivate", description: data.message, tone: "error" }); return; }
      toast({ title: "Company code deactivated", tone: "success" });
      setDeleteItem(null);
      fetchAll();
    } catch {
      toast({ title: "Server error", description: "Please try again.", tone: "error" });
    } finally {
      setDeleteLoading(false);
    }
  }

  const totalPlants = Object.values(plantCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">Company Codes</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Legal/financial entities under each tenant — the layer above Plants.</p>
        </div>
        <AppButton icon={Plus} onClick={() => setShowCreate(true)}>New Company Code</AppButton>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Company Codes", value: companyCodes.length, icon: Building2 },
          { label: "Active", value: companyCodes.filter((c) => c.status === "ACTIVE").length, icon: Power },
          { label: "Tenants Covered", value: Object.keys(grouped).length, icon: Layers },
          { label: "Plants Under These", value: totalPlants, icon: Factory },
        ].map((s) => (
          <AppCard key={s.label} padding="p-4">
            <s.icon className="h-4 w-4 text-[var(--text-tertiary)] mb-2" />
            <div className="text-2xl font-display font-bold text-[var(--text-primary)]">{s.value}</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{s.label}</div>
          </AppCard>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <AppSearch value={search} onChange={setSearch} placeholder="Search by name, code, or tenant..." className="flex-1" />
        <AppFilter
          label="All Tenants"
          value={tenantFilter}
          onChange={setTenantFilter}
          options={tenants.map((t) => ({ label: t.tenantName, value: String(t.id) }))}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <EmptyState tone="error" title="Couldn't load company codes" description={error} actionLabel="Retry" onAction={fetchAll} />
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState icon={Building2} title="No company codes found" description="Create one to start building out a tenant's hierarchy." actionLabel="New Company Code" onAction={() => setShowCreate(true)} />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([tId, codes]) => (
            <div key={tId}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-app-sm bg-[var(--color-ink-700)] flex items-center justify-center text-[9px] font-bold text-white">
                  {tenantCode(tId).slice(0, 2) || "T"}
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{tenantName(tId)}</span>
                <span className="text-xs text-[var(--text-tertiary)]">· {codes.length} company code{codes.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-6 border-l-2 border-[var(--border-subtle)] ml-3">
                {codes.map((c) => (
                  <AppCard key={c.id} interactive padding="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 rounded-app-md flex items-center justify-center text-[10px] font-bold text-white ${c.status === "ACTIVE" ? codeColor(c.code) : "bg-[var(--color-ink-400)]"}`}>
                        {c.code?.slice(0, 3)}
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{c.name}</div>
                    <div className="text-xs font-mono text-[var(--text-tertiary)] mt-0.5">{c.code}</div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] mt-3 pt-3 border-t border-[var(--border-subtle)]">
                      <Factory className="w-3.5 h-3.5" />
                      {plantCounts[c.id] || 0} plant{(plantCounts[c.id] || 0) !== 1 ? "s" : ""}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <AppButton size="sm" variant="secondary" icon={Pencil} className="flex-1" onClick={() => setEditItem(c)}>Edit</AppButton>
                      <AppButton size="sm" variant="secondary" icon={Factory} className="flex-1" onClick={() => onNavigate?.("plants")}>Plants</AppButton>
                      <AppButton size="sm" variant="danger" onClick={() => setDeleteItem(c)} aria-label="Deactivate"><Power className="h-4 w-4" /></AppButton>
                    </div>
                  </AppCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CompanyCodeModal
        open={showCreate}
        tenants={tenants}
        defaultTenantId={tenantFilter}
        onClose={() => setShowCreate(false)}
        onSaved={fetchAll}
      />
      <CompanyCodeModal
        open={!!editItem}
        initial={editItem}
        tenants={tenants}
        onClose={() => setEditItem(null)}
        onSaved={fetchAll}
      />
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Deactivate company code?"
        description={deleteItem ? `"${deleteItem.name}" will be marked inactive. This is blocked if it still has active plants.` : ""}
        confirmLabel="Deactivate"
      />
    </div>
  );
}
