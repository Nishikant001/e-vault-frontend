// src/components/subscription/TrialStatusBanner.jsx
//
// Shown at the top of the dashboard for FREE tenants only. Reads live
// status from SubscriptionContext (backed by GET /api/subscriptions/status).
// Renders nothing for PAID tenants, for SuperAdmin, or once the trial has
// already expired (TrialExpiredModal takes over from TenantLayout at that
// point instead).
//
// Task 5 thresholds: remaining <= 7 days → orange warning,
// remaining <= 3 days → red warning.

import { useState } from "react";
import { AlertTriangle, Clock, X } from "lucide-react";
import { useSubscription } from "../../context/SubscriptionContext";

export default function TrialStatusBanner({ onUpgradeClick }) {
  const { isFree, remainingTrialDays, trialExpired } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (!isFree || remainingTrialDays == null || trialExpired) return null;
  if (dismissed) return null;

  const critical = remainingTrialDays <= 3;
  const warning = remainingTrialDays <= 7;

  const tone = critical
    ? "border-danger-600/30 bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500"
    : warning
    ? "border-warning-600/30 bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500"
    : "border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-secondary)]";

  const Icon = critical ? AlertTriangle : Clock;

  return (
    <div className={`flex items-center gap-3 border-b px-4 py-2 text-sm ${tone}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <p className="flex-1 font-medium">
        FREE PLAN — {remainingTrialDays} {remainingTrialDays === 1 ? "day" : "days"} remaining
        {critical ? " — upgrade soon to avoid interruption" : ""}
      </p>
      <button
        onClick={onUpgradeClick}
        className="shrink-0 rounded-app-md border border-current px-3 py-1 text-xs font-semibold hover:opacity-80"
      >
        Upgrade
      </button>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
