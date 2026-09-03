// src/Pages/TenantAdmin/SubscriptionPage.jsx
//
// Task 8 — Upgrade Page: FREE vs PRO comparison + current subscription
// status, driven entirely by GET /api/subscriptions/status
// (SubscriptionContext). There is no self-service upgrade endpoint on the
// backend today — /api/subscriptions/:tenantId/upgrade is SuperAdmin-only
// (see subscriptionRoutes.js) — so "Upgrade Now" here is an interest-
// capture action (mailto), matching the existing pattern already used by
// components/subscription/UpgradeModal.jsx, rather than a dummy API call.

import { CheckCircle2, XCircle, Sparkles, Clock } from "lucide-react";
import { AppCard, AppButton } from "../../components/ui";
import { useSubscription } from "../../context/SubscriptionContext";

const FREE_FEATURES = [
  { label: "30 days trial", included: true },
  { label: "5 uploads per day", included: true },
  { label: "Limited OCR", included: true },
  { label: "Approval workflow", included: true },
  { label: "AI Assistant", included: false },
  { label: "SAP Synchronization", included: false },
  { label: "Unlimited storage", included: false },
  { label: "Priority support", included: false },
];

const PRO_FEATURES = [
  { label: "Unlimited uploads", included: true },
  { label: "Unlimited OCR", included: true },
  { label: "AI Assistant", included: true },
  { label: "SAP Synchronization", included: true },
  { label: "Unlimited storage", included: true },
  { label: "Priority support", included: true },
  { label: "Approval workflow", included: true },
  { label: "Advanced analytics & reports", included: true },
];

function FeatureRow({ label, included }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {included ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success-500" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
      )}
      <span className={included ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] line-through"}>{label}</span>
    </li>
  );
}

export default function SubscriptionPage() {
  const { plan, status, remainingTrialDays, trialExpired, loading } = useSubscription();
  const isFree = plan?.code === "FREE";

  function contactSales() {
    window.location.href = "mailto:sales@excelligent.example?subject=Upgrade%20to%20PRO%20plan";
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AppCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Current plan</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-[var(--text-primary)]">
              {loading ? "Loading…" : plan?.name || "—"}
            </h2>
          </div>
          {isFree && !loading && (
            <div className="flex items-center gap-2 rounded-app-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm">
              <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
              {trialExpired ? (
                <span className="font-medium text-danger-500">Trial expired</span>
              ) : (
                <span className="font-medium text-[var(--text-secondary)]">
                  {remainingTrialDays} {remainingTrialDays === 1 ? "day" : "days"} remaining
                </span>
              )}
            </div>
          )}
          {!isFree && !loading && (
            <span className="rounded-app-md bg-success-50 px-3 py-1.5 text-sm font-medium text-success-600 dark:bg-success-500/10 dark:text-success-500">
              Active — full access
            </span>
          )}
        </div>
      </AppCard>

      <div className="grid gap-6 sm:grid-cols-2">
        <AppCard className={!isFree ? "opacity-70" : ""}>
          <div className="mb-4">
            <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">FREE</h3>
            <p className="text-sm text-[var(--text-secondary)]">Your current plan{isFree ? "" : " (previous)"}</p>
          </div>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <FeatureRow key={f.label} {...f} />
            ))}
          </ul>
        </AppCard>

        <AppCard accent="brand">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-500" />
            <div>
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">PRO</h3>
              <p className="text-sm text-[var(--text-secondary)]">Everything unlocked</p>
            </div>
          </div>
          <ul className="space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <FeatureRow key={f.label} {...f} />
            ))}
          </ul>
          <AppButton fullWidth className="mt-6" onClick={contactSales}>
            Upgrade Now
          </AppButton>
        </AppCard>
      </div>
    </div>
  );
}
