import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  TrendingUp,
  ArrowRight,
  Building2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Inbox as InboxIcon,
} from "lucide-react";
import AppCard from "../../components/ui/Card";
import AppButton from "../../components/ui/Button";
import { ApprovalActionApi } from "../../features/approvalEngine/api";

/* ------------------------------------------------------------------ */
/*  Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

function StatCard({ icon: Icon, label, value, tone, hint }) {
  const TONE = {
    brand: "bg-brand-500/10 text-brand-500",
    success: "bg-success-50 text-success-500 dark:bg-success-500/15",
    danger: "bg-danger-50 text-danger-500 dark:bg-danger-500/15",
    warning: "bg-warning-50 text-warning-500 dark:bg-warning-500/15",
  };
  return (
    <AppCard padding="p-4" className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-app-md ${TONE[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight text-[var(--text-primary)]">
          {value}
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
        {hint && (
          <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]/80">
            {hint}
          </p>
        )}
      </div>
    </AppCard>
  );
}

function QuickLink({ icon: Icon, title, desc, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-app-md border border-[var(--border-subtle)] bg-white p-3 text-left transition-colors hover:border-brand-500/50 hover:bg-brand-500/5 dark:bg-slate-900/40"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-app-md bg-brand-500/10 text-brand-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
            {title}
          </p>
          {badge ? (
            <span className="rounded-full bg-brand-500/10 px-[7px] py-px text-[10px] font-bold text-brand-500">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="truncate text-[11px] text-[var(--text-tertiary)]">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
    </button>
  );
}

function PendingPreviewRow({ doc, onReview }) {
  const name = doc?.fileName || doc?.name || doc?.documentName || "Untitled document";
  const vendor = doc?.vendor || doc?.department || doc?.dept || "—";
  const amount = doc?.amount ?? doc?.value ?? null;
  const type = doc?.type || doc?.documentType || doc?.category || "Document";

  return (
    <div className="flex items-center gap-3 px-4 py-[10px] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-50 text-warning-500 dark:bg-warning-500/15">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold text-[var(--text-primary)]">
          {name}
        </p>
        <p className="truncate text-[11px] text-[var(--text-tertiary)]">
          {vendor} · {type}
          {amount ? ` · ${amount}` : ""}
        </p>
      </div>
      <button
        onClick={onReview}
        className="shrink-0 rounded-app-md border border-[var(--border-subtle)] px-3 py-[5px] text-[11px] font-semibold text-brand-500 hover:border-brand-500 transition-colors"
      >
        Review
      </button>
    </div>
  );
}

function DeptBreakdownRow({ label, count, max }) {
  const pct = max > 0 ? Math.max(6, Math.round((count / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 truncate text-[11px] text-[var(--text-tertiary)]">
        {label}
      </span>
      <div className="h-[6px] flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-[6px] rounded-full bg-brand-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-[11px] font-semibold text-[var(--text-primary)]">
        {count}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                      */
/* ------------------------------------------------------------------ */

export default function TAApproverDashboard({ onNavigate, user }) {
  const [pending, setPending] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [myActions, setMyActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([ApprovalActionApi.pending(), ApprovalActionApi.myActions()])
      .then(([pendingRes, actionsRes]) => {
        if (cancelled) return;
        const pendingList = pendingRes?.data || [];
        setPending(pendingList);
        setPendingTotal(pendingRes?.total ?? pendingList.length ?? 0);
        setMyActions(actionsRes?.data || []);
      })
      .catch(() => {
        if (!cancelled) {
          setPending([]);
          setMyActions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date().toDateString();

  const todayApproved = useMemo(
    () =>
      myActions.filter(
        (i) => i.action === "APPROVE" && new Date(i.createdAt).toDateString() === today
      ).length,
    [myActions, today]
  );

  const todayRejected = useMemo(
    () =>
      myActions.filter(
        (i) => i.action === "REJECT" && new Date(i.createdAt).toDateString() === today
      ).length,
    [myActions, today]
  );

  const avgTurnaroundLabel = useMemo(() => {
    const withDurations = myActions
      .map((i) => {
        const start = i.documentCreatedAt || i.submittedAt;
        const end = i.createdAt || i.actionedAt;
        if (!start || !end) return null;
        const ms = new Date(end) - new Date(start);
        return ms > 0 ? ms : null;
      })
      .filter(Boolean);

    if (withDurations.length === 0) return "—";
    const avgMs =
      withDurations.reduce((sum, ms) => sum + ms, 0) / withDurations.length;
    const hours = avgMs / (1000 * 60 * 60);
    return hours < 1
      ? `${Math.round(avgMs / (1000 * 60))}m`
      : `${hours.toFixed(1)}h`;
  }, [myActions]);

  const deptBreakdown = useMemo(() => {
    const map = {};
    pending.forEach((doc) => {
      const key = doc?.department || doc?.dept || doc?.vendor || "General";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [pending]);

  const maxDept = deptBreakdown.reduce((m, [, v]) => Math.max(m, v), 0);
  const previewList = pending.slice(0, 5);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[18px] font-bold text-[var(--text-primary)]">
            <Sparkles className="h-4 w-4 text-brand-500" />
            {greeting}, {user?.u || "Approver"}
          </h1>
          <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
            Here's what's waiting on your desk today.
          </p>
        </div>
        <AppButton
          variant="primary"
          onClick={() => onNavigate && onNavigate("approvals")}
        >
          <InboxIcon className="mr-1.5 h-4 w-4" />
          Go to Inbox
        </AppButton>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Pending Approvals"
          value={loading ? "—" : pendingTotal}
          tone="warning"
        />
        <StatCard
          icon={CheckCircle2}
          label="Approved Today"
          value={loading ? "—" : todayApproved}
          tone="success"
        />
        <StatCard
          icon={XCircle}
          label="Rejected Today"
          value={loading ? "—" : todayRejected}
          tone="danger"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg. Turnaround"
          value={loading ? "—" : avgTurnaroundLabel}
          tone="brand"
          hint="per decision"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Pending preview */}
        <AppCard className="lg:col-span-2" padding="p-0">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
            <h2 className="text-[13px] font-bold text-[var(--text-primary)]">
              Needs Your Attention
            </h2>
            {pendingTotal > 0 && (
              <span className="rounded-full bg-warning-50 px-[10px] py-[2px] text-[11px] font-bold text-warning-500 dark:bg-warning-500/15">
                {pendingTotal} pending
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center text-[12px] text-[var(--text-tertiary)]">
              Loading pending approvals…
            </div>
          ) : previewList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-[var(--text-tertiary)]">
              <CheckCircle2 className="h-7 w-7 opacity-40" />
              <span className="text-[12.5px]">You're all caught up</span>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {previewList.map((doc, i) => (
                <PendingPreviewRow
                  key={doc.id ?? i}
                  doc={doc}
                  onReview={() => onNavigate && onNavigate("approvals")}
                />
              ))}
            </div>
          )}

          {pendingTotal > previewList.length && (
            <div className="border-t border-[var(--border-subtle)] px-4 py-[10px]">
              <button
                onClick={() => onNavigate && onNavigate("approvals")}
                className="flex items-center gap-1 text-[12px] font-semibold text-brand-500 hover:underline"
              >
                View all {pendingTotal} pending
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </AppCard>

        {/* Side column */}
        <div className="space-y-4">
          <AppCard padding="p-4">
            <h2 className="mb-3 text-[13px] font-bold text-[var(--text-primary)]">
              Quick Links
            </h2>
            <div className="space-y-2">
              <QuickLink
                icon={InboxIcon}
                title="Pending Approvals"
                desc="Review and act on your inbox"
                badge={pendingTotal > 0 ? pendingTotal : null}
                onClick={() => onNavigate && onNavigate("approvals")}
              />
              <QuickLink
                icon={FileText}
                title="View Documents"
                desc="Browse the document repository"
                onClick={() => onNavigate && onNavigate("documents")}
              />
              <QuickLink
                icon={MessageSquare}
                title="Communication"
                desc="Messages related to your approvals"
                onClick={() => onNavigate && onNavigate("communication")}
              />
              <QuickLink
                icon={ShieldCheck}
                title="Cross Department Access"
                desc="Manage access across departments"
                onClick={() => onNavigate && onNavigate("crossDepartmentRequest")}
              />
            </div>
          </AppCard>

          <AppCard padding="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--text-tertiary)]" />
              <h2 className="text-[13px] font-bold text-[var(--text-primary)]">
                Pending by Department
              </h2>
            </div>
            {deptBreakdown.length === 0 ? (
              <p className="text-[11.5px] text-[var(--text-tertiary)]">
                Nothing pending right now.
              </p>
            ) : (
              <div className="space-y-2.5">
                {deptBreakdown.map(([label, count]) => (
                  <DeptBreakdownRow
                    key={label}
                    label={label}
                    count={count}
                    max={maxDept}
                  />
                ))}
              </div>
            )}
          </AppCard>
        </div>
      </div>
    </div>
  );
}