import { useState, useEffect } from "react";
import { API, authHeaders } from "./tenantApi";
import { TenantPlanBadge, TenantStatusBadge, ErpStatusBadge, UserRoleBadge, UserStatusBadge } from "./Badges";
import { EditUserModal, DeleteUserModal } from "./Modals";

function UsersSection({ tenantId, onCountLoaded }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [delUser, setDelUser] = useState(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/users?tenantId=${tenantId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
        onCountLoaded?.(tenantId, (data.data || []).length);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, [tenantId]);

  async function toggleUserStatus(u) {
    try {
      await fetch(`${API}/users/${u.id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ isActive: !u.isActive }) });
      fetchUsers();
    } catch { /* silent */ }
  }

  if (loading) {
    return <div className="text-[12px] text-slate-400 py-3">Loading users…</div>;
  }

  return (
    <div>
      {users.length === 0 ? (
        <div className="text-[11px] text-slate-400 py-3">No users found for this tenant.</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${u.role === "TenantAdmin" ? "bg-purple-600" : "bg-blue-500"}`}>
                {u.name?.slice(0, 2).toUpperCase() || "??"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100 truncate">{u.name}</span>
                  <UserRoleBadge role={u.role} />
                </div>
                <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
              </div>
              <UserStatusBadge isActive={u.isActive} />
              <div className="flex items-center gap-1">
                <button onClick={() => toggleUserStatus(u)} title={u.isActive ? "Deactivate" : "Activate"}
                  className="w-6 h-6 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-[10px]">
                  {u.isActive ? "⏸" : "▶"}
                </button>
                <button onClick={() => setEditUser(u)} title="Edit"
                  className="w-6 h-6 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-[10px]">✏️</button>
                <button onClick={() => setDelUser(u)} title="Remove"
                  className="w-6 h-6 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-[10px]">🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={fetchUsers} />}
      {delUser && <DeleteUserModal user={delUser} onClose={() => setDelUser(null)} onDeleted={fetchUsers} />}
    </div>
  );
}

export function TenantDetailsDrawer({ tenant, onClose, onEdit, onToggleStatus, onDelete, onCountLoaded }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-[480px] h-full bg-white dark:bg-[#1A2433] shadow-2xl flex flex-col animate-[slideIn_.25s_ease-out] overflow-hidden">
        <style>{`@keyframes slideIn { from { transform: translateX(100%);} to { transform: translateX(0);} }`}</style>

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">✕</button>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[14px] font-bold text-white flex-shrink-0 ${tenant.status === "ACTIVE" ? "bg-blue-600" : "bg-slate-400"}`}>
              {(tenant.tenantCode || "??").slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate">{tenant.tenantName}</div>
              <div className="text-[11px] text-slate-400 font-mono">{tenant.tenantCode}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TenantPlanBadge tenantType={tenant.tenantType} />
            <TenantStatusBadge status={tenant.status} />
            {tenant.tenantType === "PAID" && <ErpStatusBadge erpEnabled={tenant.erpEnabled} />}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Overview */}
          <section>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Overview</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Tenant ID", value: tenant.id },
                { label: "Tenant Code", value: tenant.tenantCode },
                { label: "Plan", value: tenant.tenantType === "PAID" ? "Paid" : "Free" },
                { label: "Status", value: tenant.status === "ACTIVE" ? "Active" : "Inactive" },
                { label: "Created", value: new Date(tenant.createdAt).toLocaleDateString() },
                { label: "Updated", value: new Date(tenant.updatedAt).toLocaleDateString() },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 dark:bg-[#151E2B] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</div>
                  <div className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{item.value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ERP */}
          {tenant.tenantType === "PAID" && (
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">ERP Integration</h4>
              <div className="bg-slate-50 dark:bg-[#151E2B] border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-bold text-slate-800 dark:text-slate-200">
                    {tenant.erpEnabled ? tenant.erpConfig?.name || "ERP Enabled" : "Not enabled"}
                  </div>
                  <div className="text-[10px] text-slate-400">{tenant.erpEnabled ? tenant.erpConfig?.erpType || "—" : "Non-ERP tenant"}</div>
                </div>
                <ErpStatusBadge erpEnabled={tenant.erpEnabled} />
              </div>
            </section>
          )}

          {/* Users */}
          <section>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Users & Admins</h4>
            <UsersSection tenantId={tenant.id} onCountLoaded={onCountLoaded} />
          </section>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0 space-y-2">
          <div className="flex gap-2">
            <button onClick={() => onEdit(tenant)} className="flex-1 py-[9px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition">Edit Tenant</button>
            <button onClick={() => onToggleStatus(tenant)}
              className={`flex-1 py-[9px] rounded-xl text-[12px] font-bold transition border ${
                tenant.status === "ACTIVE"
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                  : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
              }`}>
              {tenant.status === "ACTIVE" ? "Suspend" : "Activate"}
            </button>
          </div>
          <button onClick={() => onDelete(tenant)}
            className="w-full py-[9px] rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[12px] font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition">
            Delete Tenant
          </button>
        </div>
      </div>
    </div>
  );
}