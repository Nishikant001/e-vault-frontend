// src/components/subscription/TrialExpiredModal.jsx
//
// Task 7 — Expired Trial: full-screen, non-dismissible block shown to FREE
// tenants once their trial has expired (Subscription.status === "EXPIRED",
// surfaced by GET /api/subscriptions/status via SubscriptionContext).
//
// Deliberately NOT built on AppModal — AppModal closes on backdrop
// click/Escape by design, which is exactly the behavior this screen must
// NOT have. Everything except "Upgrade Now" and "Logout" must stay
// unreachable while this is up, so the parent (TenantLayout) renders this
// as a full-viewport, top-most overlay instead of gating each page
// individually.

export default function TrialExpiredModal({ open, onUpgrade, onLogout }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-expired-title"
    >
      <div className="w-full max-w-sm rounded-app-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 text-center shadow-app-lg">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-500/15">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger-500">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 id="trial-expired-title" className="font-display text-lg font-semibold text-[var(--text-primary)]">
          Free Trial Expired
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Upgrade your subscription to continue using Excelligent.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onUpgrade}
            className="w-full rounded-app-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Upgrade Now
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-app-md border border-[var(--border-default)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
