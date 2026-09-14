import { TenantPlanBadge, TenantStatusBadge, ErpStatusBadge } from "./Badges";
import {
  TenantRowSkeletonDesktop,
  TenantRowSkeletonMobile,
} from "./TenantSkeleton";
export function TenantList({
  tenants,
  loading,
  userCounts,
  onOpen,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  if (loading) {
    return (
      <>
        <div className="hidden lg:block bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <tbody>
              {[0, 1, 2, 3, 4].map((i) => (
                <TenantRowSkeletonDesktop key={i} />
              ))}
            </tbody>
          </table>{" "}
        </div>
        <div className="lg:hidden space-y-3">
          {[0, 1, 2].map((i) => (
            <TenantRowSkeletonMobile key={i} />
          ))}
        </div>{" "}
      </>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden lg:block bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-[#151E2B]">
              {[
                "Tenant",
                "Plan",
                "Status",
                "ERP Status",
                "ERP Configuration",
                "Users",
                "Created",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr
                key={t.id}
                className="border-b border-slate-100 dark:border-slate-700/60 last:border-0 hover:bg-slate-50 dark:hover:bg-[#151E2B] transition-colors cursor-pointer"
                onClick={() => onOpen(t)}
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${t.status === "ACTIVE" ? "bg-blue-600" : "bg-slate-400"}`}
                    >
                      {(t.tenantCode || "??").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">
                        {t.tenantName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {t.tenantCode} · ID {t.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <TenantPlanBadge tenantType={t.tenantType} />
                </td>
                <td className="px-4 py-3.5">
                  <TenantStatusBadge status={t.status} />
                </td>
                <td className="px-4 py-3.5">
                  <ErpStatusBadge erpEnabled={t.erpEnabled} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                    {t.erpConfig?.name || "—"}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {t.erpConfig?.erpType || ""}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                  {t.userCount ?? userCounts[t.id] ?? "—"}
                </td>
                <td className="px-4 py-3.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {new Date(t.createdAt).toLocaleDateString()}
                </td>
                <td
                  className="px-4 py-3.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpen(t)}
                      title="View"
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-[11px]"
                    >
                      👁
                    </button>
                    <button
                      onClick={() => onEdit(t)}
                      title="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-[11px]"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(t)}
                      title="Delete"
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-[11px]"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {tenants.map((t) => (
          <div
            key={t.id}
            onClick={() => onOpen(t)}
            className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 cursor-pointer hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0 ${t.status === "ACTIVE" ? "bg-blue-600" : "bg-slate-400"}`}
              >
                {(t.tenantCode || "??").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">
                  {t.tenantName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {t.tenantCode}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <TenantPlanBadge tenantType={t.tenantType} />
              <TenantStatusBadge status={t.status} />
              <ErpStatusBadge erpEnabled={t.erpEnabled} />
              <span className="text-[10px] text-slate-400 ml-auto">
                {new Date(t.createdAt).toLocaleDateString()}
              </span>
            </div>
            {t.erpEnabled && t.erpConfig && (
              <div className="text-[10px] text-slate-400">
                ERP Config:{" "}
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {t.erpConfig.name}
                </span>{" "}
                ({t.erpConfig.erpType})
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
