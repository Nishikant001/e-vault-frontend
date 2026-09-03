// src/Pages/TenantAdmin/Approvals/WorkflowAssignmentPage.jsx
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Settings, ListTree } from "lucide-react";
import AppCard, { CardHeader } from "../../../components/ui/Card";
import AppButton from "../../../components/ui/Button";
import StatusBadge from "../../../components/ui/StatusBadge";
import { ApprovalWorkflowApi } from "../../../features/approvalEngine/api";
import EntityComboSelector from "../../../features/approvalEngine/EntityComboSelector";
import WorkflowFormDrawer from "./WorkflowFormDrawer";

export default function WorkflowAssignmentPage() {
  const [combo, setCombo] = useState({ departmentId: "", categoryId: "", documentTypeId: "" });
  const [status, setStatus] = useState(null); // { approvalRequired, data }
  const [checking, setChecking] = useState(false);
  const [drawer, setDrawer] = useState({ open: false, workflowId: null });
  const [allWorkflows, setAllWorkflows] = useState([]);

  const loadAll = () => {
    ApprovalWorkflowApi.list().then((res) => setAllWorkflows(res.data || [])).catch(() => setAllWorkflows([]));
  };
  useEffect(loadAll, []);

  useEffect(() => {
    const { departmentId, categoryId, documentTypeId } = combo;
    if (!departmentId || !categoryId || !documentTypeId) { setStatus(null); return; }
    setChecking(true);
    ApprovalWorkflowApi.getByCombo(departmentId, categoryId, documentTypeId)
      .then((res) => setStatus(res))
      .catch(() => setStatus(null))
      .finally(() => setChecking(false));
  }, [combo]);

  const comboReady = combo.departmentId && combo.categoryId && combo.documentTypeId;

  return (
    <div className="space-y-4">
      <AppCard>
        <CardHeader
          title="Workflow Assignment"
          subtitle="Choose Department → Category → Document Type to see whether approval is required, and configure it."
        />

        <EntityComboSelector value={combo} onChange={setCombo} />

        {comboReady && (
          <div className="mt-5 rounded-app-lg border border-[var(--border-subtle)] p-4">
            {checking ? (
              <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]"><Loader2 className="h-4 w-4 animate-spin" /> Checking…</div>
            ) : status?.approvalRequired ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-50 text-success-500 dark:bg-success-500/15">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Approval Required</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Workflow: <span className="font-medium text-[var(--text-secondary)]">{status.data?.name}</span> · {status.data?.levels?.length || 0} level(s)
                    </p>
                  </div>
                </div>
                <AppButton variant="secondary" size="sm" icon={Settings} onClick={() => setDrawer({ open: true, workflowId: status.data.id })}>
                  Configure
                </AppButton>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--text-tertiary)]">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">No Approval Required</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Documents of this type follow the normal upload → SAP flow.</p>
                  </div>
                </div>
                <AppButton size="sm" icon={Settings} onClick={() => setDrawer({ open: true, workflowId: null })}>
                  Assign a Workflow
                </AppButton>
              </div>
            )}
          </div>
        )}
      </AppCard>

      <AppCard>
        <CardHeader title="Currently Assigned Combinations" subtitle="Every Department → Category → Document Type with an active workflow." action={<ListTree className="h-4 w-4 text-[var(--text-tertiary)]" />} />
        <div className="divide-y divide-[var(--border-subtle)]">
          {allWorkflows.filter((w) => w.status === "ACTIVE").length === 0 && (
            <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">No workflows assigned yet.</p>
          )}
          {allWorkflows.filter((w) => w.status === "ACTIVE").map((w) => (
            <button
              key={w.id}
              onClick={() => setDrawer({ open: true, workflowId: w.id })}
              className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-[var(--surface-sunken)] px-2 -mx-2 rounded-app-sm"
            >
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {w.Department?.name} <span className="text-[var(--text-tertiary)]">→</span> {w.Category?.name} <span className="text-[var(--text-tertiary)]">→</span> {w.DocumentType?.name}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">{w.name} · {w.levels?.length || 0} level(s)</p>
              </div>
              <StatusBadge status={w.status} />
            </button>
          ))}
        </div>
      </AppCard>

      <WorkflowFormDrawer
        open={drawer.open}
        workflowId={drawer.workflowId}
        onClose={() => setDrawer({ open: false, workflowId: null })}
        onSaved={() => {
          setDrawer({ open: false, workflowId: null });
          loadAll();
          setCombo((c) => ({ ...c })); // re-trigger combo check
        }}
      />
    </div>
  );
}
