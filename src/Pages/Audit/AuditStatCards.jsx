import { useEffect, useState } from "react";
import { Shield, AlertTriangle, Clock3 } from "lucide-react";
import { fetchAuditLogs } from "./auditApi";

function StatCard({ icon: Icon, label, value, tone = "slate", loading }) {
  const toneClasses = {
    slate: "text-slate-600 dark:text-slate-300",
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-600 dark:text-red-400",
    amber: "text-amber-600 dark:text-amber-400",
  }[tone];

  return (
    <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-colors">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] font-semibold mb-2">
        <Icon size={13} /> {label}
      </div>
      {loading ? (
        <div className="h-8 w-16 rounded bg-slate-100 dark:bg-slate-700 animate-pulse" />
      ) : (
        <div className={`text-[26px] leading-none font-bold ${toneClasses}`}>{value}</div>
      )}
    </div>
  );
}

/**
 * Lightweight dashboard summary for the Audit module. There is no dedicated
 * /audit-logs/stats endpoint on the backend, so this derives numbers from a
 * couple of cheap, count-only calls (limit=1, we only read `pagination.total`)
 * against the same GET /api/audit-logs endpoint the list view already uses.
 */
export default function AuditStatCards({ baseQuery, refreshToken }) {
  const [stats, setStats] = useState({ total: null, today: null, failed: null, modules: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const todayIso = new Date().toISOString().slice(0, 10);
    const tenantId = baseQuery?.tenantId;

    Promise.all([
      fetchAuditLogs({ limit: 1, tenantId }),
      fetchAuditLogs({ limit: 1, tenantId, dateFrom: todayIso }),
      fetchAuditLogs({ limit: 1, tenantId, status: "FAILED" }),
    ])
      .then(([all, today, failed]) => {
        if (cancelled) return;
        setStats({
          total: all.pagination.total,
          today: today.pagination.total,
          failed: failed.pagination.total,
        });
      })
      .catch(() => {
        if (!cancelled) setStats({ total: 0, today: 0, failed: 0 });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseQuery?.tenantId, refreshToken]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <StatCard icon={Shield} label="Total Audit Events" value={stats.total ?? "—"} tone="blue" loading={loading} />
      <StatCard icon={Clock3} label="Events Today" value={stats.today ?? "—"} tone="slate" loading={loading} />
      <StatCard icon={AlertTriangle} label="Failed Events" value={stats.failed ?? "—"} tone={stats.failed > 0 ? "red" : "slate"} loading={loading} />
    </div>
  );
}
