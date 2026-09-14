// src/components/subscription/SubscriptionCard.jsx
//
// Task 5 — Dashboard subscription card (FREE tenants only): current plan,
// remaining trial days, trial expiry date, upgrade button, with the same
// 7-day/3-day orange/red thresholds as TrialStatusBanner.
//
// Task 6 — Daily upload limit: FREE tenants get 5 uploads/day
// (FREE_DAILY_UPLOAD_LIMIT on the backend). There is no dedicated
// "today's upload count" endpoint, so this counts createdAt >= today
// (local midnight) from the same `docs` array the dashboard already
// fetches from GET /api/documents — no extra API call needed.

import { Clock, Sparkles, UploadCloud } from "lucide-react";
import { useSubscription } from "../../context/SubscriptionContext";

const FREE_DAILY_UPLOAD_LIMIT = 5;

function startOfTodayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export default function SubscriptionCard({ docs = [], onUpgradeClick }) {
  const { isFree, plan, status, remainingTrialDays, trialExpired, trialEndDate, loading } = useSubscription();

  if (loading || !isFree) return null;

  const todayStart = startOfTodayUTC();
  const uploadsToday = docs.filter((d) => {
    const ts = d.createdAt ? new Date(d.createdAt) : null;
    return ts && ts >= todayStart;
  }).length;
  const remainingUploads = Math.max(0, FREE_DAILY_UPLOAD_LIMIT - uploadsToday);
  const uploadPct = Math.min(100, Math.round((uploadsToday / FREE_DAILY_UPLOAD_LIMIT) * 100));

  const critical = remainingTrialDays != null && remainingTrialDays <= 3;
  const warning = remainingTrialDays != null && remainingTrialDays <= 7;
  const trialTone = trialExpired || critical
    ? "border-danger-500/30 bg-danger-50 dark:bg-danger-500/10"
    : warning
    ? "border-warning-500/30 bg-warning-50 dark:bg-warning-500/10"
    : "border-[var(--border-subtle)] bg-[var(--surface-card)]";

  return (
    <div className={`rounded-xl border p-4 ${trialTone}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {plan?.name || "FREE PLAN"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <Clock className="h-4 w-4" />
            {trialExpired
              ? "Trial expired"
              : `${remainingTrialDays ?? "—"} ${remainingTrialDays === 1 ? "day" : "days"} remaining`}
          </div>
          {trialEndDate && !trialExpired && (
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Expires on {new Date(trialEndDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <button
          onClick={onUpgradeClick}
          className="shrink-0 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
        >
          Upgrade Now
        </button>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <UploadCloud className="h-3.5 w-3.5" /> Today's uploads
          </span>
          <span>
            {uploadsToday} / {FREE_DAILY_UPLOAD_LIMIT} ({remainingUploads} remaining)
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full rounded-full transition-all ${uploadPct >= 100 ? "bg-danger-500" : uploadPct >= 60 ? "bg-warning-500" : "bg-success-500"}`}
            style={{ width: `${uploadPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
