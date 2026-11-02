// src/Pages/SuperAdmin/SubscriptionsAdmin.jsx
//
// SuperAdmin subscription administration — table of every tenant's
// subscription + row actions (Upgrade, Downgrade, Extend Trial,
// Deactivate Trial, Convert to Paid), each behind a small confirm modal
// with an optional reason field. Follows the same AppTable/AppModal/
// useToast pattern as Plants.jsx / CompanyCodes.jsx rather than the
// older hand-rolled inline-style pattern in Tenants.jsx.

import { useState, useEffect, useCallback } from "react";
import { ArrowUpCircle, ArrowDownCircle, CalendarPlus, Ban, BadgeCheck } from "lucide-react";
import { AppTable, AppModal, AppButton, AppInput, AppSelect, StatusBadge, useToast } from "../../components/ui";
import { SubscriptionAdminApi } from "../../services/subscriptionApi";

const ACTIONS = [
  { key: "upgrade", label: "Upgrade", icon: ArrowUpCircle, needsPlanCode: true },
  { key: "downgrade", label: "Downgrade", icon: ArrowDownCircle, needsPlanCode: true },
  { key: "extend-trial", label: "Extend Trial", icon: CalendarPlus, needsDays: true },
  { key: "deactivate-trial", label: "Deactivate Trial", icon: Ban, tone: "danger" },
  { key: "convert-to-paid", label: "Convert to Paid", icon: BadgeCheck },
];

function ActionModal({ action, row, onClose, onDone }) {
  const { toast } = useToast();
  const [planCode, setPlanCode] = useState("PAID");
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!action) return null;

  async function submit() {
    setLoading(true);
    try {
      const tenantId = row.tenantId || row.Tenant?.id;
      if (action.key === "upgrade") await SubscriptionAdminApi.upgrade(tenantId, { planCode, reason });
      else if (action.key === "downgrade") await SubscriptionAdminApi.downgrade(tenantId, { planCode, reason });
      else if (action.key === "extend-trial") await SubscriptionAdminApi.extendTrial(tenantId, { days: Number(days), reason });
      else if (action.key === "deactivate-trial") await SubscriptionAdminApi.deactivateTrial(tenantId, { reason });
      else if (action.key === "convert-to-paid") await SubscriptionAdminApi.convertToPaid(tenantId, { reason });

      toast({ title: `${action.label} applied`, description: row.Tenant?.tenantName, tone: "success" });
      onDone();
    } catch (err) {
      toast({ title: "Action failed", description: err.message, tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppModal
      open={!!action}
      onClose={onClose}
      title={`${action.label} — ${row.Tenant?.tenantName || "Tenant"}`}
      size="sm"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </AppButton>
          <AppButton variant={action.tone === "danger" ? "danger" : "primary"} loading={loading} onClick={submit}>
            Confirm
          </AppButton>
        </>
      }
    >
      <div className="space-y-4">
        {action.needsPlanCode && (
          <AppSelect label="Target plan" value={planCode} onChange={(e) => setPlanCode(e.target.value)}>
            <option value="FREE">FREE</option>
            <option value="PAID">PAID</option>
          </AppSelect>
        )}
        {action.needsDays && (
          <AppInput
            label="Additional days"
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        )}
        <AppInput
          label="Reason"
          hint="Optional — recorded in the subscription history."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. customer requested via support ticket #123"
        />
      </div>
    </AppModal>
  );
}

export default function SubscriptionsAdmin() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState(null); // { action, row }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SubscriptionAdminApi.list();
      setRows(res.data || []);
    } catch (err) {
      toast({ title: "Could not load subscriptions", description: err.message, tone: "error" });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { key: "tenant", header: "Tenant", render: (r) => r.Tenant?.tenantName || "—" },
    { key: "plan", header: "Plan", render: (r) => r.Plan?.name || r.Plan?.code || "—" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "trial",
      header: "Trial days left",
      render: (r) => (r.status === "TRIAL" ? r.remainingTrialDays ?? "—" : "—"),
    },
    {
      key: "payment",
      header: "Payment status",
      render: (r) => (r.Tenant?.tenantType === "PAID" ? <StatusBadge status="Paid" /> : <StatusBadge status="Trial" tone="neutral" />),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex flex-wrap gap-1.5">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              onClick={() => setActionState({ action: a, row: r })}
              title={a.label}
              className={`rounded-app-sm p-1.5 hover:bg-[var(--surface-sunken)] ${
                a.tone === "danger" ? "text-danger-500" : "text-[var(--text-secondary)]"
              }`}
            >
              <a.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">Subscriptions</h2>
        <p className="text-sm text-[var(--text-secondary)]">Manage every tenant's plan, trial, and status.</p>
      </div>
      <AppTable
        columns={columns}
        rows={rows}
        rowKey="id"
        loading={loading}
        emptyTitle="No subscriptions found"
        emptyDescription="Tenants will appear here once they register or are created."
      />
      <ActionModal
        action={actionState?.action}
        row={actionState?.row || {}}
        onClose={() => setActionState(null)}
        onDone={() => {
          setActionState(null);
          load();
        }}
      />
    </div>
  );
}
