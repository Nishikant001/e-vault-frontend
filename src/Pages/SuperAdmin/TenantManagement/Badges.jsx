// Reusable badges — TenantPlanBadge, TenantStatusBadge, UserRoleBadge, UserStatusBadge

export function TenantPlanBadge({ tenantType }) {
  const paid = tenantType === "PAID";
  if (paid) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-[10px] py-[3px] rounded-full border bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
        <span className="w-[5px] h-[5px] rounded-full bg-amber-500" />
        PAID
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-[10px] py-[3px] rounded-full border bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600">
      FREE
    </span>
  );
}

// ── ERP / Non-ERP Tenant Classification ─────────────────────────────
// Visually distinguishes ERP-enabled vs ERP-disabled tenants without
// exposing any technical database detail (no erpConfigId, no raw SAP
// connection info — just enabled/disabled + the config's display name).
export function ErpStatusBadge({ erpEnabled }) {
  if (erpEnabled) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-[10px] py-[3px] rounded-full border bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
        <span className="w-[5px] h-[5px] rounded-full bg-blue-500" />
        ERP Enabled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-[10px] py-[3px] rounded-full border bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600">
      ERP Disabled
    </span>
  );
}

export function TenantStatusBadge({ status }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-[10px] py-[3px] rounded-full border ${
        active
          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
      }`}
    >
      <span className={`w-[5px] h-[5px] rounded-full ${active ? "bg-green-500" : "bg-red-500"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function UserStatusBadge({ isActive }) {
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

export function UserRoleBadge({ role }) {
  const admin = role === "TenantAdmin";
  return (
    <span
      className={`text-[9px] font-bold px-[7px] py-[2px] rounded-full border ${
        admin
          ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800"
          : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
      }`}
    >
      {role}
    </span>
  );
}