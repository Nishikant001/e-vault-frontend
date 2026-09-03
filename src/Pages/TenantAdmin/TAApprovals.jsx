import { useEffect, useState } from "react";
import { Clock, CheckCircle2, XCircle, ListChecks, Info } from "lucide-react";
import AppCard from "../../components/ui/Card";
import AppButton from "../../components/ui/Button";
import AppModal from "../../components/ui/Modal";
import Tabs from "../../components/ui/Tabs";
import { ApprovalActionApi } from "../../features/approvalEngine/api";
import PendingApprovalsList from "../../features/approvalEngine/PendingApprovalsList";
import MyApprovalHistoryList from "../../features/approvalEngine/MyApprovalHistoryList";

function StatCard({ icon: Icon, label, value, tone }) {
  const TONE = {
    brand: "bg-brand-500/10 text-brand-500",
    success: "bg-success-50 text-success-500 dark:bg-success-500/15",
    danger: "bg-danger-50 text-danger-500 dark:bg-danger-500/15",
    warning: "bg-warning-50 text-warning-500 dark:bg-warning-500/15",
  };
  return (
    <AppCard padding="p-4" className="flex items-center gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-app-md ${TONE[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-[var(--text-primary)] leading-tight">{value}</p>
        <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
      </div>
    </AppCard>
  );
}

export default function TAApprovals() {
  const [tab, setTab] = useState("pending");
  const [pendingCount, setPendingCount] = useState(0);
    const [showGuide, setShowGuide] = useState(false);

  const [todayApproved, setTodayApproved] = useState(0);
  const [todayRejected, setTodayRejected] = useState(0);

  useEffect(() => {
    ApprovalActionApi.pending().then((res) => setPendingCount(res.total ?? res.data?.length ?? 0)).catch(() => {});
    ApprovalActionApi.myActions().then((res) => {
      const today = new Date().toDateString();
      const items = res.data || [];
      setTodayApproved(items.filter((i) => i.action === "APPROVE" && new Date(i.createdAt).toDateString() === today).length);
      setTodayRejected(items.filter((i) => i.action === "REJECT" && new Date(i.createdAt).toDateString() === today).length);
    }).catch(() => {});
  }, []);

    return (
    <div className="space-y-4 rounded-app-lg border border-[var(--border-subtle)] bg-slate-50 p-5 dark:bg-slate-900/40">
      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />
      <div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-[17px] font-bold text-[var(--text-primary)]">Inbox</h1>
          <div className="group relative">
            <button
              onClick={() => setShowGuide(true)}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--border-subtle)] text-[var(--text-tertiary)] transition-colors hover:bg-brand-500 hover:text-white"
            >
              <Info className="h-3 w-3" />
            </button>
            <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-56 rounded-lg bg-slate-800 px-3 py-2 text-[10.5px] leading-relaxed text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 dark:bg-slate-700">
              Click to see a step-by-step guide on how to use this page.
            </div>
          </div>
        </div>
        <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
          Approval Management → <span className="font-semibold text-[var(--text-secondary)]">Inbox</span>
          <span className="mx-2 opacity-40">·</span>
          Review and act on documents pending your approval
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={Clock} label="Pending Approvals" value={pendingCount} tone="warning" />
        <StatCard icon={CheckCircle2} label="Approved Today (by me)" value={todayApproved} tone="success" />
        <StatCard icon={XCircle} label="Rejected Today (by me)" value={todayRejected} tone="danger" />
      </div>

      <AppCard>
        <Tabs
          tabs={[
            { value: "pending", label: "Pending Approvals", icon: Clock },
            { value: "mine", label: "My Actions", icon: ListChecks },
          ]}
          value={tab}
          onChange={setTab}
          className="mb-4"
        />
        {tab === "pending" ? <PendingApprovalsList /> : <MyApprovalHistoryList />}
      </AppCard>
    </div>
  );
}
function GuideModal({ open, onClose }) {
  const steps = [
    { title: "Check Pending Approvals", desc: "The Pending Approvals tab lists every document currently waiting on your sign-off." },
    { title: "Review & Decide", desc: "Open a document to review its details, then approve or reject it — your decision moves it to the next level or sends it back." },
    { title: "Track Your Actions", desc: "Switch to My Actions to see everything you've approved or rejected, along with when you did it." },
    { title: "Watch the Stat Cards", desc: "The cards at the top show your pending count and how many you've approved or rejected today, at a glance." },
  ];
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Inbox — Guide"
      footer={<AppButton variant="primary" onClick={onClose}>Got it</AppButton>}
    >
      <div className="space-y-4">
        {steps.map((s, i) => (
          <div key={s.title} className="flex gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-[11px] font-bold text-brand-500">
              {i + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{s.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-tertiary)]">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </AppModal>
  );
}

