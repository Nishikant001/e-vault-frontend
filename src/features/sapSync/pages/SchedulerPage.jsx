// src/features/sapSync/pages/SchedulerPage.jsx
import { useEffect, useState } from "react";
import { RefreshCw, Play, Pencil, FileText } from "lucide-react";
import AppCard, { CardHeader } from "../../../components/ui/Card";
import AppTable from "../../../components/ui/Table";
import AppButton from "../../../components/ui/Button";
import StatusBadge from "../../../components/ui/StatusBadge";
import AppModal from "../../../components/ui/Modal";
import AppInput from "../../../components/ui/Input";
import { useToast } from "../../../components/ui/Toast";
import { SapSyncApi } from "../api";
import { formatDateTime, formatDuration, JOB_LABELS, statusTone } from "../constants";

const CRON_HINTS = {
  MASTER_SYNC: "e.g. 0 2 * * * = every day at 2:00 AM",
  DOCUMENT_SYNC: "e.g. 0 3 * * * = every day at 3:00 AM",
  RETRY_SYNC: "e.g. */30 * * * * = every 30 minutes",
};

export default function SchedulerPage({ onNavigate }) {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState(null);
  const [editRow, setEditRow] = useState(null);

  const load = () => {
    setLoading(true);
    SapSyncApi.listSchedules()
      .then((res) => setRows(res.data || []))
      .catch((e) => toast({ title: "Could not load schedules", description: e.message, tone: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line

  async function toggleEnabled(row) {
    try {
      await SapSyncApi.updateSchedule(row.id, { enabled: !row.enabled });
      toast({ title: `${row.label} ${!row.enabled ? "enabled" : "disabled"}`, tone: "success" });
      load();
    } catch (e) {
      toast({ title: "Could not update schedule", description: e.message, tone: "error" });
    }
  }

  async function runNow(row) {
    setRunningId(row.id);
    try {
      await SapSyncApi.runScheduleNow(row.id);
      toast({ title: `${row.label} triggered`, tone: "success" });
      load();
    } catch (e) {
      toast({ title: "Run Now failed", description: e.message, tone: "error" });
    } finally {
      setRunningId(null);
    }
  }

  const columns = [
    { key: "label", header: "Job Name", render: (r) => <span className="font-medium text-[var(--text-primary)]">{r.label}</span> },
    { key: "cronExpression", header: "Cron", render: (r) => <span className="font-mono text-xs">{r.cronExpression}</span> },
    { key: "enabled", header: "Enabled", render: (r) => <StatusBadge status={r.enabled ? "Enabled" : "Disabled"} tone={r.enabled ? "success" : "neutral"} showIcon={false} /> },
    { key: "lastRunAt", header: "Last Run", render: (r) => formatDateTime(r.lastRunAt) },
    { key: "lastDurationMs", header: "Duration", render: (r) => formatDuration(r.lastDurationMs) },
    { key: "lastRunStatus", header: "Status", render: (r) => (r.lastRunStatus ? <StatusBadge status={r.lastRunStatus} tone={statusTone(r.lastRunStatus)} /> : <span className="text-xs text-[var(--text-tertiary)]">Never run</span>) },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <AppButton size="sm" variant="secondary" icon={Play} loading={runningId === r.id} onClick={() => runNow(r)}>
            Run Now
          </AppButton>
          <AppButton size="sm" variant="ghost" onClick={() => toggleEnabled(r)}>
            {r.enabled ? "Disable" : "Enable"}
          </AppButton>
          <AppButton size="sm" variant="ghost" icon={Pencil} onClick={() => setEditRow(r)}>
            Edit
          </AppButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <AppCard>
        <CardHeader
          title="Scheduler Management"
          subtitle="Controls when SAP Master, Document and Retry synchronization jobs run automatically for this tenant."
          action={
            <div className="flex items-center gap-2">
              <AppButton variant="secondary" size="sm" icon={FileText} onClick={() => onNavigate?.("SAP_SYNC_JOB_HISTORY")}>
                View Logs
              </AppButton>
              <AppButton variant="secondary" size="sm" icon={RefreshCw} onClick={load}>
                Refresh
              </AppButton>
            </div>
          }
        />
        <AppTable columns={columns} rows={rows} loading={loading} emptyTitle="No schedules configured" />
      </AppCard>

      <EditScheduleModal row={editRow} onClose={() => setEditRow(null)} onSaved={() => { setEditRow(null); load(); }} />
    </div>
  );
}

function EditScheduleModal({ row, onClose, onSaved }) {
  const { toast } = useToast();
  const [cron, setCron] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setCron(row?.cronExpression || ""), [row]);

  if (!row) return null;

  async function save() {
    if (!cron.trim()) {
      toast({ title: "Cron expression is required", tone: "warning" });
      return;
    }
    setSaving(true);
    try {
      await SapSyncApi.updateSchedule(row.id, { cronExpression: cron.trim() });
      toast({ title: "Schedule updated", tone: "success" });
      onSaved();
    } catch (e) {
      toast({ title: "Could not update schedule", description: e.message, tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      open={!!row}
      onClose={onClose}
      title={`Edit Schedule — ${row.label}`}
      size="sm"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose} disabled={saving}>Cancel</AppButton>
          <AppButton onClick={save} loading={saving}>Save</AppButton>
        </>
      }
    >
      <AppInput
        label="Cron Expression"
        value={cron}
        onChange={(e) => setCron(e.target.value)}
        hint={CRON_HINTS[row.jobName] || "Standard 5-field cron expression"}
      />
    </AppModal>
  );
}
