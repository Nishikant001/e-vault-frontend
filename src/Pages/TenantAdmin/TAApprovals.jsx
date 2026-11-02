// TAApprovals.jsx  (same location as your current file)
import { useCallback, useEffect, useState } from "react";
import {
  Clock3,
  CheckCircle2,
  XCircle,
  ListChecks,
  Info,
  RefreshCw,
  Inbox,
  CircleHelp,
  ChevronRight,
  Home,
  BarChart3,
  FileText,
  ShieldCheck,
} from "lucide-react";
import AppButton from "../../components/ui/Button";
import AppModal from "../../components/ui/Modal";
import { ApprovalActionApi } from "../../features/approvalEngine/api";
import PendingApprovalsList from "../../features/approvalEngine/PendingApprovalsList";
import MyApprovalHistoryList from "../../features/approvalEngine/MyApprovalHistoryList";
import useCountUp from "../../features/approvalEngine/useCountUp";
import "../../features/approvalEngine/approval-motion.css";

/* ───────────────────────── Stat card ───────────────────────── */

const TONES = {
  warning: {
    tile: "bg-amber-50 text-amber-500 dark:bg-amber-500/15",
    wash: "from-amber-500/[0.07]",
    chev: "border-amber-300 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10",
  },
  success: {
    tile: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15",
    wash: "from-emerald-500/[0.07]",
    chev: "border-emerald-300 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
  },
  danger: {
    tile: "bg-rose-50 text-rose-500 dark:bg-rose-500/15",
    wash: "from-rose-500/[0.07]",
    chev: "border-rose-300 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10",
  },
};

function StatCard({ icon: Icon, label, value, caption, tone, index, onOpen }) {
  const t = TONES[tone];
  const shown = useCountUp(value);
  return (
    <div
      className={`am-rise group flex items-center gap-4 rounded-2xl border border-[var(--border-default)] bg-gradient-to-br ${t.wash} via-[var(--surface-card)] to-[var(--surface-card)] p-4 transition-shadow duration-200 hover:shadow-lg hover:shadow-slate-900/[0.05] sm:p-5`}
      style={{ "--am-i": index + 3 }}
    >
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${t.tile}`}
      >
        <Icon className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">{label}</p>
        <p className="mt-1 text-3xl font-bold leading-none tabular-nums text-[var(--text-primary)]">{shown}</p>
        <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">{caption}</p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${label}`}
        className={`am-press flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[var(--surface-card)] transition-transform duration-200 group-hover:translate-x-0.5 ${t.chev}`}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ───────────────────────── Tab bar ───────────────────────── */

function TabBar({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="flex gap-2 border-b border-[var(--border-default)] px-4 sm:px-6">
      {tabs.map((t) => {
        const active = t.value === value;
        const Icon = t.icon;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={`relative inline-flex items-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors duration-200 ${
              active ? "text-blue-600 dark:text-blue-400" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {t.label}
            {/* underline grows from the centre when a tab becomes active */}
            <span
              className={`absolute inset-x-3 bottom-0 h-0.5 origin-center rounded-full bg-blue-600 transition-transform duration-300 ease-out dark:bg-blue-400 ${
                active ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function TAApprovals() {
  const [tab, setTab] = useState("pending");
  const [pendingCount, setPendingCount] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [todayApproved, setTodayApproved] = useState(0);
  const [todayRejected, setTodayRejected] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(new Date());

  const loadSummary = useCallback(async () => {
    setRefreshing(true);
    try {
      const [pendingResult, actionsResult] = await Promise.allSettled([
        ApprovalActionApi.pending(),
        ApprovalActionApi.myActions(),
      ]);

      if (pendingResult.status === "fulfilled") {
        const result = pendingResult.value;
        setPendingCount(result.total ?? result.data?.length ?? 0);
      }

      if (actionsResult.status === "fulfilled") {
        const today = new Date().toDateString();
        const items = actionsResult.value.data || [];
        const isToday = (i) => new Date(i.createdAt).toDateString() === today;
        setTodayApproved(items.filter((i) => i.action === "APPROVE" && isToday(i)).length);
        setTodayRejected(items.filter((i) => i.action === "REJECT" && isToday(i)).length);
      }
      setUpdatedAt(new Date());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const goTo = (value) => {
    setTab(value);
    document.getElementById("manage-approvals")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-4 p-3 sm:p-5 lg:p-6">
      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="am-fade flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <Home className="h-3.5 w-3.5" />
        <ChevronRight className="h-3 w-3" />
        <span>Approval Management</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-[var(--text-primary)]">Inbox</span>
      </nav>

      {/* Hero */}
      <section
        className="am-rise relative isolate overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-indigo-50/60 shadow-sm dark:border-blue-900/50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/50"
        style={{ "--am-i": 0 }}
      >
        {/* decorative document stack (right) */}
        <div className="pointer-events-none absolute -right-6 -top-4 -z-10 hidden h-48 w-72 lg:block" aria-hidden="true">
          <div className="am-fade absolute right-4 top-6 h-36 w-52 rotate-6 rounded-3xl bg-gradient-to-br from-blue-200/60 to-indigo-200/40 blur-[1px] dark:from-blue-500/15 dark:to-indigo-500/10" />
          <div
            className="am-pop absolute right-16 top-8 flex h-28 w-24 -rotate-6 items-center justify-center rounded-2xl border border-white/70 bg-white/80 shadow-xl shadow-blue-500/10 dark:border-slate-700 dark:bg-slate-800/80"
            style={{ "--am-i": 4 }}
          >
            <FileText className="h-9 w-9 text-blue-400" strokeWidth={1.4} />
          </div>
          <div
            className="am-pop absolute right-4 top-14 flex h-24 w-20 rotate-3 items-center justify-center rounded-2xl border border-white/70 bg-white/90 shadow-xl shadow-blue-500/10 dark:border-slate-700 dark:bg-slate-800/90"
            style={{ "--am-i": 6 }}
          >
            <ShieldCheck className="h-8 w-8 text-indigo-400" strokeWidth={1.4} />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 p-4 sm:p-6 lg:flex-row lg:items-start">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100/80 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
              <Inbox className="h-8 w-8" strokeWidth={1.6} />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Approval workspace
              </span>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  Approval Inbox
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 [animation-iteration-count:2]" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Live summary
                </span>
              </div>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Review pending documents, make confident decisions, and keep every approval moving through your
                workflow.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <AppButton variant="secondary" icon={RefreshCw} loading={refreshing} onClick={loadSummary}>
              Refresh summary
            </AppButton>
            <AppButton variant="secondary" icon={CircleHelp} onClick={() => setShowGuide(true)}>
              How it works
            </AppButton>
          </div>
        </div>

        <div className="grid grid-cols-1 border-t border-blue-100/80 bg-white/40 dark:border-slate-700 dark:bg-slate-900/30 sm:grid-cols-3 sm:divide-x sm:divide-blue-100/80 dark:sm:divide-slate-700">
          {[
            { icon: Clock3, text: "Prioritise items waiting for review", tone: "text-blue-600 bg-blue-50 dark:bg-blue-500/15 dark:text-blue-300" },
            { icon: CheckCircle2, text: "Keep decisions auditable", tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300" },
            { icon: BarChart3, text: "Track your daily activity at a glance", tone: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-300" },
          ].map(({ icon: Icon, text, tone }, i) => (
            <div
              key={text}
              className="am-fade flex items-center gap-3 px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300"
              style={{ animationDelay: `${300 + i * 90}ms` }}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}>
                <Icon className="h-4 w-4" />
              </span>
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* Overview */}
      <section aria-label="Approval summary" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Your overview</h2>
            <p className="mt-0.5 text-sm text-[var(--text-tertiary)]">
              A quick summary of your current queue and today's decisions.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <Clock3 className="h-3.5 w-3.5" />
            Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            index={0}
            icon={Clock3}
            tone="warning"
            label="Pending approvals"
            value={pendingCount}
            caption={pendingCount === 1 ? "1 item waiting for your review" : `${pendingCount} items waiting for your review`}
            onOpen={() => goTo("pending")}
          />
          <StatCard
            index={1}
            icon={CheckCircle2}
            tone="success"
            label="Approved today"
            value={todayApproved}
            caption="Decisions completed by you"
            onOpen={() => goTo("mine")}
          />
          <StatCard
            index={2}
            icon={XCircle}
            tone="danger"
            label="Rejected today"
            value={todayRejected}
            caption="Items sent back by you"
            onOpen={() => goTo("mine")}
          />
        </div>
      </section>

      {/* Manage approvals */}
      <section
        id="manage-approvals"
        className="am-rise scroll-mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-[var(--surface-card)] shadow-[0_8px_30px_rgba(15,23,42,0.045)] dark:border-slate-700"
        style={{ "--am-i": 6 }}
      >
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Manage approvals</h2>
            <p className="mt-0.5 text-sm text-[var(--text-tertiary)]">
              Review items awaiting action or revisit decisions you have made.
            </p>
          </div>
          <button
            type="button"
            onClick={() => goTo("mine")}
            className="am-press inline-flex w-fit items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
          >
            <BarChart3 className="h-4 w-4" />
            Workflow activity
          </button>
        </div>

        <TabBar
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "pending", label: `Pending Approvals${pendingCount > 0 ? ` (${pendingCount})` : ""}`, icon: Inbox },
            { value: "mine", label: "My Actions", icon: ListChecks },
          ]}
        />

        {/* key → content cross-fades when the tab changes */}
        <div key={tab} className="am-fade min-w-0 px-3 py-4 sm:px-5 sm:pb-5">
          {tab === "pending" ? <PendingApprovalsList onChanged={loadSummary} /> : <MyApprovalHistoryList />}
        </div>
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
          Approval decisions are part of your workflow history. Review document details before approving or rejecting
          an item.
        </p>
      </div>
    </main>
  );
}

function GuideModal({ open, onClose }) {
  const steps = [
    {
      title: "Start with Pending Approvals",
      desc: "This tab lists documents currently waiting for your decision. Open an item to inspect its details before taking action.",
    },
    {
      title: "Review, then decide",
      desc: "Approve or reject only after reviewing the document. Your action moves the item through the configured workflow.",
    },
    {
      title: "Use My Actions for history",
      desc: "Switch to My Actions to review decisions you have already made and check their timestamps.",
    },
    {
      title: "Use the summary cards",
      desc: "Pending approvals shows your current queue; Approved Today and Rejected Today summarise your actions for the current day.",
    },
  ];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Approval Inbox guide"
      footer={
        <AppButton variant="primary" onClick={onClose}>
          Got it
        </AppButton>
      }
    >
      <div className="mb-5 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-blue-900/50 dark:from-blue-950/40 dark:to-indigo-950/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Your decisions matter</p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">A simple guide to the approval workflow.</p>
          </div>
        </div>
      </div>
      <div className="space-y-5">
        {steps.map((step, index) => (
          <div key={step.title} className="am-pop flex gap-3" style={{ "--am-i": index }}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1 border-b border-[var(--border-default)] pb-4 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </AppModal>
  );
}