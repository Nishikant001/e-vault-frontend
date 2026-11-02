import { Shield, Globe } from "lucide-react";
import { actionColor, statusColor, formatDateTime, groupByDay } from "./auditDisplay";

export default function AuditTimeline({ entries, onSelect }) {
  const groups = groupByDay(entries);

  if (groups.length === 0) return null;

  return (
    <div className="px-4 py-4 space-y-6">
      {groups.map((group) => (
        <div key={group.key}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {group.label}
            </span>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700" />
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{group.items.length} events</span>
          </div>

          <div className="relative pl-5 border-l-2 border-slate-100 dark:border-slate-700 space-y-4">
            {group.items.map((e) => {
              const ts = formatDateTime(e.createdAt);
              return (
                <button
                  key={e.id}
                  onClick={() => onSelect?.(e)}
                  className="relative block w-full text-left group"
                >
                  <span
                    className={`absolute -left-[26px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-[#1A2433] ${
                      e.status === "FAILED" ? "bg-red-500" : e.status === "PENDING" ? "bg-amber-500" : "bg-blue-500"
                    }`}
                  />
                  <div className="rounded-lg border border-slate-100 dark:border-slate-700/70 px-3 py-2.5 group-hover:bg-slate-50 dark:group-hover:bg-slate-700/30 group-hover:border-slate-200 dark:group-hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-semibold text-blue-600 dark:text-blue-400">
                        {e.username || (e.userId ? `User #${e.userId}` : "System")}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-[2px] rounded-full ${actionColor(e.action)}`}>
                        {e.action || "—"}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">in {e.module || "—"}</span>
                      <span className={`text-[9.5px] font-bold px-[6px] py-[1px] rounded-full border ${statusColor(e.status)}`}>
                        {e.status || "SUCCESS"}
                      </span>
                      <span className="ml-auto text-[10.5px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {ts.time}
                      </span>
                    </div>
                    {(e.remarks || e.details) && (
                      <p className="mt-1 text-[11.5px] text-slate-500 dark:text-slate-400 truncate">
                        {e.remarks || e.details}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-[10.5px] text-slate-400 dark:text-slate-500">
                      {e.sapDocumentId && (
                        <span className="flex items-center gap-1">
                          <Shield size={10} /> {e.sapDocumentId}
                        </span>
                      )}
                      {e.ipAddress && (
                        <span className="flex items-center gap-1">
                          <Globe size={10} /> {e.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
