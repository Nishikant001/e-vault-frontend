import { useState, useEffect, useMemo } from "react";
import { API, authHeaders } from "./tenantApi";
import { TenantFilters } from "./TenantFilters";
import { TenantList } from "./TenantList";
import { TenantDetailsDrawer } from "./TenantDetailsDrawer";
import { RegisterModal, EditModal, DeleteModal } from "./Modals";
import { TenantStatsSkeleton } from "./TenantSkeleton";

// planFilter: "PAID" | "FREE" — filters strictly on tenant.tenantType (real field)
export default function TenantsPage({ planFilter }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCounts, setUserCounts] = useState({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [erpTypeFilter, setErpTypeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("name");

  const [openTenant, setOpenTenant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [delTenant, setDelTenant] = useState(null);

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
      setOpenTenant((cur) =>
        cur && cur.id === t.id ? { ...cur, status: newStatus } : cur,
      );
    } catch {
      /* silent */
    }
  }

  const planTenants = useMemo(
    () => tenants.filter((t) => t.tenantType === planFilter),
    [tenants, planFilter],
  );

  const erpTypes = useMemo(
    () => [
      ...new Set(planTenants.map((t) => t.erpConfig?.erpType).filter(Boolean)),
    ],
    [planTenants],
  );

  const filtered = useMemo(() => {
    let list = planTenants.filter((t) => {
      const matchesSearch =
        !search ||
        t.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
        t.tenantCode?.toLowerCase().includes(search.toLowerCase()) ||
        String(t.id).includes(search);
      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
      const matchesErp =
        erpTypeFilter === "ALL" || t.erpConfig?.erpType === erpTypeFilter;
      return matchesSearch && matchesStatus && matchesErp;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "name")
        return (a.tenantName || "").localeCompare(b.tenantName || "");
      if (sortBy === "created")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "status")
        return (a.status || "").localeCompare(b.status || "");
      return 0;
    });
    return list;
  }, [planTenants, search, statusFilter, erpTypeFilter, sortBy]);

  const activeCount = planTenants.filter((t) => t.status === "ACTIVE").length;
  const inactiveCount = planTenants.filter(
    (t) => t.status === "INACTIVE",
  ).length;

  const isPaid = planFilter === "PAID";
  const heading = isPaid ? "Paid Tenants" : "Free Tenants";
  const sub = isPaid
    ? "Manage and monitor all subscribed enterprise tenants."
    : "Manage tenants currently using the free plan.";
  const emptyTitle = isPaid
    ? "Your paid tenant portfolio is empty."
    : "No free tenants yet.";

  function handleCountLoaded(tenantId, count) {
    setUserCounts((prev) => ({ ...prev, [tenantId]: count }));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-[17px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {heading}
            {isPaid && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Priority
              </span>
            )}
          </h2>
          <p className="text-[12px] text-slate-400 mt-0.5">{sub}</p>
        </div>
        {isPaid && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-[8px] bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-lg transition-all"
          >
            + Register Tenant
          </button>
        )}
      </div>

      {/* Stats */}
      {loading ? (
        <TenantStatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Tenants", value: planTenants.length, icon: "🏢" },
            { label: "Active", value: activeCount, icon: "✅" },
            { label: "Inactive", value: inactiveCount, icon: "⏸️" },
            {
              label: isPaid ? "Paid Plan" : "Free Plan",
              value: planTenants.length,
              icon: isPaid ? "💎" : "🆓",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {s.label}
                </span>
                <span className="text-base">{s.icon}</span>
              </div>
              <div className="text-[24px] font-bold leading-tight text-slate-800 dark:text-slate-100">
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <TenantFilters
        search={search}
        onSearch={setSearch}
        statusFilter={statusFilter}
        onStatus={setStatusFilter}
        erpTypeFilter={erpTypeFilter}
        onErpType={setErpTypeFilter}
        erpTypes={erpTypes}
        sortBy={sortBy}
        onSort={setSortBy}
      />

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl">
          <span className="text-4xl">{isPaid ? "💼" : "🆓"}</span>
          <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
            {search || statusFilter !== "ALL" || erpTypeFilter !== "ALL"
              ? "No tenants match your filters."
              : emptyTitle}
          </span>
          {isPaid && !search && (
            <button
              onClick={() => setShowModal(true)}
              className="text-[12px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              + Register first tenant
            </button>
          )}
        </div>
      )}

      {/* List */}
      {(loading || filtered.length > 0) && (
        <TenantList
          tenants={filtered}
          loading={loading}
          userCounts={userCounts}
          onOpen={setOpenTenant}
          onEdit={setEditTenant}
          onToggleStatus={toggleStatus}
          onDelete={setDelTenant}
        />
      )}

      {openTenant && (
        <TenantDetailsDrawer
          tenant={openTenant}
          onClose={() => setOpenTenant(null)}
          onEdit={(t) => {
            setEditTenant(t);
          }}
          onToggleStatus={toggleStatus}
          onDelete={(t) => {
            setDelTenant(t);
          }}
          onCountLoaded={handleCountLoaded}
        />
      )}

      {showModal && (
        <RegisterModal
          onClose={() => setShowModal(false)}
          onSaved={fetchTenants}
        />
      )}
      {editTenant && (
        <EditModal
          tenant={editTenant}
          onClose={() => setEditTenant(null)}
          onSaved={fetchTenants}
        />
      )}
      {delTenant && (
        <DeleteModal
          tenant={delTenant}
          onClose={() => {
            setDelTenant(null);
            setOpenTenant(null);
          }}
          onDeleted={fetchTenants}
        />
      )}
    </div>
  );
}
