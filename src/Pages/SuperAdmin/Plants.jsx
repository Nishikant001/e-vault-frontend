import { useState, useEffect, useMemo } from "react";
import {
  Factory, Plus, Pencil, Power, Layers, Building2, AlertCircle,
  ArrowRightCircle, XCircle, Users as UsersIcon, Clock,
} from "lucide-react";
import {
  AppButton, AppCard, AppInput, AppSelect, AppModal, AppDrawer,
  StatusBadge, EmptyState, SkeletonCard, ConfirmDialog, AppSearch,
  AppFilter, Pagination, useToast,
} from "../../components/ui";
import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;
const PAGE_SIZE = 9;

function getToken() {
  return localStorage.getItem("accessToken") || "";
}
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

const CODE_COLORS = ["bg-brand-500", "bg-info-500", "bg-success-500", "bg-warning-500", "bg-danger-500"];
function codeColor(code = "") {
  let n = 0;
  for (let i = 0; i < code.length; i++) n += code.charCodeAt(i);
  return CODE_COLORS[n % CODE_COLORS.length];
}

function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Create / Edit Plant Modal ────────────────────────────────────
function PlantModal({ open, initial, companyCodes, defaultCompanyCodeId, onClose, onSaved }) {
  const isEdit = !!initial;
  const [companyCodeId, setCompanyCodeId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setCompanyCodeId(initial?.companyCodeId || defaultCompanyCodeId || "");
    setCode(initial?.code || "");
    setName(initial?.name || "");
    setDescription(initial?.description || "");
    setError("");
  }, [open, initial, defaultCompanyCodeId]);

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

      const res = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.success) return setError(data.message || "Failed to save plant.");
      toast({ title: isEdit ? "Plant updated" : "Plant created", tone: "success" });
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
      title={isEdit ? "Edit Plant" : "New Plant"}
      size="md"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose}>Cancel</AppButton>
          <AppButton onClick={handleSave} loading={loading}>{isEdit ? "Save Changes" : "Create Plant"}</AppButton>
        </>
      }
    >
      <div className="space-y-4">
        <AppSelect
          label="Company Code" required disabled={isEdit}
          value={companyCodeId}
          onChange={(e) => { setCompanyCodeId(e.target.value); setError(""); }}
        >
          <option value="">— Choose a company code —</option>
          {companyCodes.filter((c) => c.status === "ACTIVE").map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
          ))}
        </AppSelect>
        <AppInput
          label="Code" required disabled={isEdit}
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
          placeholder="e.g. P001, BBSR1"
          maxLength={10}
        />
        <AppInput
          label="Name" required
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="e.g. Bhubaneswar Plant"
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

// ── Manage Departments Drawer ──
// Assignment mechanism: tenant-scoped TenantDepartmentPlant mapping table
// (GET/POST/DELETE /api/departments/plant/:plantId). "Available" = departments
// already assigned to this plant's tenant (via TenantDepartment) but not yet
// mapped to this specific plant. "Assigned" = departments mapped to this
// plant for this tenant. The same department can be mapped to multiple
// plants, and different tenants can map the same global department
// independently — see TenantDepartmentPlant.js on the backend.
function ManageDepartmentsDrawer({ plant, tenantName, onClose, onChanged }) {
  const [allDepts, setAllDepts] = useState([]); // departments assigned to this plant's tenant
  const [tenantDeptIds, setTenantDeptIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAvailable, setSelectedAvailable] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  // Assigned/available now come from the tenant-scoped TenantDepartmentPlant
  // mapping table (GET /departments/plant/:plantId), not the deprecated
  // Department.plantId column — see TenantDepartmentPlant.js on the backend.
  const [assignedDepts, setAssignedDepts] = useState([]);

  async function load() {
    if (!plant) return;
    setLoading(true);
    setError("");
    setSelectedAvailable(new Set());
    try {
      const [tenantDeptRes, plantDeptRes] = await Promise.all([
        fetch(`${API}/departments/tenant/${plant.tenantId}`, { headers: authHeaders() }),
        fetch(`${API}/departments/plant/${plant.id}?tenantId=${plant.tenantId}`, { headers: authHeaders() }),
      ]);
      const tenantDeptData = await tenantDeptRes.json();
      const plantDeptData = await plantDeptRes.json();
      if (!tenantDeptRes.ok || !tenantDeptData.success) throw new Error(tenantDeptData.message || "Failed to load tenant departments");
      if (!plantDeptRes.ok || !plantDeptData.success) throw new Error(plantDeptData.message || "Failed to load plant departments");
      setAllDepts(tenantDeptData.data || []);
      setTenantDeptIds(new Set((tenantDeptData.data || []).map((d) => d.id)));
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

  const lastUpdated = assigned.reduce((max, d) => (!max || new Date(d.updatedAt) > new Date(max) ? d.updatedAt : max), null);

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
          fetch(`${API}/departments/plant/${plant.id}?tenantId=${plant.tenantId}`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ departmentId: id, tenantId: plant.tenantId }),
          }).then((r) => r.json().then((d) => ({ ok: r.ok && d.success, message: d.message })))
        )
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length) toast({ title: `${failed.length} assignment(s) failed`, description: failed[0]?.message, tone: "error" });
      else toast({ title: `${ids.length} department${ids.length > 1 ? "s" : ""} assigned`, tone: "success" });
      await load();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(deptId) {
    setBusy(true);
    try {
      const res = await fetch(`${API}/departments/plant/${plant.id}/${deptId}?tenantId=${plant.tenantId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { toast({ title: "Couldn't remove assignment", description: data.message, tone: "error" }); return; }
      toast({ title: "Department removed from plant", tone: "success" });
      await load();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppDrawer
      open={!!plant}
      onClose={onClose}
      width="lg"
      title={plant ? `Manage Departments — ${plant.name}` : ""}
      subtitle={plant ? `${plant.code} · ${tenantName}` : ""}
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="p-4" />)}
        </div>
      ) : error ? (
        <EmptyState tone="error" title="Couldn't load departments" description={error} actionLabel="Retry" onAction={load} />
      ) : (
        <div className="space-y-6">
          {/* Stat strip */}
          <div className="grid grid-cols-3 gap-3">
            <AppCard padding="p-3">
              <div className="text-lg font-display font-bold text-[var(--text-primary)]">{assigned.length}</div>
              <div className="text-xs text-[var(--text-tertiary)]">Assigned</div>
            </AppCard>
            <AppCard padding="p-3">
              <div className="text-lg font-display font-bold text-[var(--text-primary)]">{available.length}</div>
              <div className="text-xs text-[var(--text-tertiary)]">Available</div>
            </AppCard>
            <AppCard padding="p-3">
              <div className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5 mt-1">
                <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /> {timeAgo(lastUpdated)}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">Last Updated</div>
            </AppCard>
          </div>

          <AppSearch value={search} onChange={setSearch} placeholder="Search departments..." />

          {/* Assigned */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Layers className="h-4 w-4" /> Assigned to this Plant
              </h4>
              <span className="text-xs text-[var(--text-tertiary)]">{filteredAssigned.length}</span>
            </div>
            {filteredAssigned.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)] py-4 text-center rounded-app-md border border-dashed border-[var(--border-default)]">
                No departments assigned yet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {filteredAssigned.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-app-md border border-[var(--border-subtle)] px-3 py-2 hover:bg-[var(--surface-card-hover)] transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">{d.name}</div>
                      <div className="text-xs font-mono text-[var(--text-tertiary)]">{d.code}</div>
                    </div>
                    <AppButton size="sm" variant="ghost" icon={XCircle} disabled={busy} onClick={() => handleRemove(d.id)}>
                      Remove
                    </AppButton>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /> Available (assigned to tenant, unassigned to a plant)
              </h4>
              <span className="text-xs text-[var(--text-tertiary)]">{filteredAvailable.length}</span>
            </div>
            {filteredAvailable.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)] py-4 text-center rounded-app-md border border-dashed border-[var(--border-default)]">
                {available.length === 0
                  ? "No unassigned departments for this tenant. Assign departments to the tenant first."
                  : "No matches for your search."}
              </p>
            ) : (
              <div className="space-y-1.5">
                {filteredAvailable.map((d) => (
                  <label key={d.id} className="flex items-center gap-3 rounded-app-md border border-[var(--border-subtle)] px-3 py-2 hover:bg-[var(--surface-card-hover)] transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAvailable.has(d.id)}
                      onChange={() => toggleAvailable(d.id)}
                      className="h-4 w-4 rounded accent-brand-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">{d.name}</div>
                      <div className="text-xs font-mono text-[var(--text-tertiary)]">{d.code}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {available.length > 0 && (
              <AppButton
                className="mt-3" fullWidth icon={ArrowRightCircle}
                disabled={selectedAvailable.size === 0 || busy}
                loading={busy}
                onClick={handleAssign}
              >
                Add {selectedAvailable.size > 0 ? `${selectedAvailable.size} ` : ""}to this Plant
              </AppButton>
            )}
          </div>
        </div>
      )}
    </AppDrawer>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function Plants() {
  const [tenants, setTenants] = useState([]);
  const [companyCodes, setCompanyCodes] = useState([]);
  const [plants, setPlants] = useState([]);
  const [deptCounts, setDeptCounts] = useState({}); // { [plantId]: count } via TenantDepartmentPlant
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const [tenantFilter, setTenantFilter] = useState(null);
  const [ccFilter, setCcFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [manageDeptsPlant, setManageDeptsPlant] = useState(null);

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      const [tRes, ccRes, pRes] = await Promise.all([
        fetch(`${API}/tenants`, { headers: authHeaders() }),
        fetch(`${API}/company-codes`, { headers: authHeaders() }),
        fetch(`${API}/plants`, { headers: authHeaders() }),
      ]);
      const [tData, ccData, pData] = await Promise.all([tRes.json(), ccRes.json(), pRes.json()]);
      if (!tRes.ok || !tData.success) throw new Error(tData.message || "Failed to load tenants");
      if (!ccRes.ok || !ccData.success) throw new Error(ccData.message || "Failed to load company codes");
      if (!pRes.ok || !pData.success) throw new Error(pData.message || "Failed to load plants");
      setTenants(tData.data || []);
      setCompanyCodes(ccData.data || []);
      setPlants(pData.data || []);

      // Department counts now live in the tenant-scoped TenantDepartmentPlant
      // mapping table, one plant at a time (GET /departments/plant/:plantId),
      // rather than the deprecated Department.plantId column.
      const plantsList = pData.data || [];
      const counts = await Promise.all(
        plantsList.map((p) =>
          fetch(`${API}/departments/plant/${p.id}?tenantId=${p.tenantId}`, { headers: authHeaders() })
            .then((r) => r.json())
            .then((d) => ({ plantId: p.id, count: d.success ? d.count ?? (d.data || []).length : 0 }))
            .catch(() => ({ plantId: p.id, count: 0 }))
        )
      );
      const map = {};
      counts.forEach((c) => { map[c.plantId] = c.count; });
      setDeptCounts(map);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const tenantName = (id) => tenants.find((t) => t.id === id)?.tenantName || `Tenant #${id}`;
  const ccInfo = (id) => companyCodes.find((c) => c.id === id);
  const deptCount = (plantId) => deptCounts[plantId] || 0;

  const filtered = useMemo(() => {
    let list = plants;
    if (tenantFilter) list = list.filter((p) => String(p.tenantId) === String(tenantFilter));
    if (ccFilter) list = list.filter((p) => String(p.companyCodeId) === String(ccFilter));
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
    }
    return list;
  }, [plants, tenantFilter, ccFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [tenantFilter, ccFilter, statusFilter, search]);

  async function handleDeleteConfirm() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API}/plants/${deleteItem.id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) { toast({ title: "Couldn't deactivate", description: data.message, tone: "error" }); return; }
      toast({ title: "Plant deactivated", tone: "success" });
      setDeleteItem(null);
      fetchAll();
    } catch {
      toast({ title: "Server error", description: "Please try again.", tone: "error" });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">Plants</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Manufacturing/operating sites under each Company Code — assign Departments here.</p>
        </div>
        <AppButton icon={Plus} onClick={() => setShowCreate(true)}>New Plant</AppButton>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Plants", value: plants.length, icon: Factory },
          { label: "Active", value: plants.filter((p) => p.status === "ACTIVE").length, icon: Power },
          { label: "Company Codes", value: companyCodes.length, icon: Building2 },
          { label: "Departments Assigned", value: Object.values(deptCounts).reduce((sum, n) => sum + n, 0), icon: Layers },
        ].map((s) => (
          <AppCard key={s.label} padding="p-4">
            <s.icon className="h-4 w-4 text-[var(--text-tertiary)] mb-2" />
            <div className="text-2xl font-display font-bold text-[var(--text-primary)]">{s.value}</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{s.label}</div>
          </AppCard>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <AppSearch value={search} onChange={setSearch} placeholder="Search plants by name or code..." className="flex-1 min-w-[220px]" />
        <AppFilter label="All Tenants" value={tenantFilter} onChange={setTenantFilter} options={tenants.map((t) => ({ label: t.tenantName, value: String(t.id) }))} />
        <AppFilter label="All Company Codes" value={ccFilter} onChange={setCcFilter} options={companyCodes.map((c) => ({ label: `${c.code} — ${c.name}`, value: String(c.id) }))} />
        <AppFilter label="All Status" value={statusFilter} onChange={setStatusFilter} options={[{ label: "Active", value: "ACTIVE" }, { label: "Inactive", value: "INACTIVE" }]} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <EmptyState tone="error" title="Couldn't load plants" description={error} actionLabel="Retry" onAction={fetchAll} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Factory} title="No plants found" description="Create a plant under a company code to get started." actionLabel="New Plant" onAction={() => setShowCreate(true)} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map((p) => {
              const cc = ccInfo(p.companyCodeId);
              const count = deptCount(p.id);
              return (
                <AppCard key={p.id} padding="p-4" accent={p.status === "ACTIVE" ? "brand" : undefined}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-app-md flex items-center justify-center text-xs font-bold text-white ${p.status === "ACTIVE" ? codeColor(p.code) : "bg-[var(--color-ink-400)]"}`}>
                      {p.code?.slice(0, 3)}
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.name}</div>
                  <div className="text-xs font-mono text-[var(--text-tertiary)] mt-0.5">{p.code}</div>

                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-2">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{cc ? `${cc.name} (${cc.code})` : `#${p.companyCodeId}`}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] mt-1">
                    <UsersIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{tenantName(p.tenantId)}</span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <Layers className="h-3.5 w-3.5" /> {count} department{count !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <AppButton size="sm" variant="primary" icon={Layers} className="col-span-2" onClick={() => setManageDeptsPlant(p)}>
                      Manage Departments
                    </AppButton>
                    <AppButton size="sm" variant="secondary" icon={Pencil} onClick={() => setEditItem(p)}>Edit</AppButton>
                    <AppButton size="sm" variant="danger" icon={Power} onClick={() => setDeleteItem(p)}>Deactivate</AppButton>
                  </div>
                </AppCard>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
        </>
      )}

      <PlantModal open={showCreate} companyCodes={companyCodes} defaultCompanyCodeId={ccFilter} onClose={() => setShowCreate(false)} onSaved={fetchAll} />
      <PlantModal open={!!editItem} initial={editItem} companyCodes={companyCodes} onClose={() => setEditItem(null)} onSaved={fetchAll} />

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Deactivate plant?"
        description={deleteItem ? `"${deleteItem.name}" will be marked inactive. Blocked if it still has active departments.` : ""}
        confirmLabel="Deactivate"
      />

      <ManageDepartmentsDrawer
        plant={manageDeptsPlant}
        tenantName={manageDeptsPlant ? tenantName(manageDeptsPlant.tenantId) : ""}
        onClose={() => setManageDeptsPlant(null)}
        onChanged={fetchAll}
      />
    </div>
  );
}
