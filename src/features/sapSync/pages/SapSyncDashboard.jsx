// src/features/sapSync/pages/SapSyncDashboard.jsx
import { useEffect, useState } from "react";
import {
  Activity,
  Database,
  FileStack,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Layers,
  FileCheck2,
  AlertTriangle,
  Copy,
  ListChecks,
  Wifi,
  WifiOff,
  Info,
  Sparkles,
} from "lucide-react";
import AppCard, { CardHeader } from "../../../components/ui/Card";
import AppButton from "../../../components/ui/Button";
import AppModal from "../../../components/ui/Modal";
import StatusBadge from "../../../components/ui/StatusBadge";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import { SapSyncApi } from "../api";
import { formatDateTime, formatDuration, formatRelative } from "../constants";

const TONE_CLASSES = {
  brand: "bg-brand-500/10 text-brand-500",
  success: "bg-success-500/10 text-success-500",
  warning: "bg-warning-500/10 text-warning-500",
  danger: "bg-danger-500/10 text-danger-500",
  info: "bg-info-500/10 text-info-500",
  neutral: "bg-[var(--surface-sunken)] text-[var(--text-tertiary)]",
};

function toTitleCase(value) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/* ------------------------------------------------------------------ */
/*  Presentational pieces                                              */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }) {
  return (
    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.6px] text-[var(--text-tertiary)]">
      {children}
    </p>
  );
}

function MetricCard({ icon: Icon, label, value, sub, tone = "brand" }) {
  return (
    <AppCard className="flex items-start gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-app-md ${TONE_CLASSES[tone] || TONE_CLASSES.brand}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--text-tertiary)]">
          {label}
        </p>
        <p className="mt-0.5 truncate text-lg font-semibold text-[var(--text-primary)]">
          {value}
        </p>
        {sub && (
          <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">
            {sub}
          </p>
        )}
      </div>
    </AppCard>
  );
}

export default function SapSyncDashboard({ onNavigate }) {
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(null);
  const [triggerFailed, setTriggerFailed] = useState(false); // "masters" | "documents" | "retry" | null
  const [showGuide, setShowGuide] = useState(false);

  const load = () => {
    setLoading(true);
    SapSyncApi.getStatus()
      .then((res) => setStatus(res.data))
      .catch((e) =>
        toast({
          title: "Could not load sync status",
          description: e.message,
          tone: "error",
        }),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line

  async function runTrigger(kind) {
    setTriggering(kind);
    setTriggerFailed(false);
    try {
      if (kind === "masters") await SapSyncApi.triggerMasterSync();
      if (kind === "documents") await SapSyncApi.triggerDocumentSync();
      if (kind === "retry") await SapSyncApi.triggerRetry();
      toast({ title: "Synchronization completed", tone: "success" });
      load();
    } catch (e) {
      setTriggerFailed(true);
      toast({
        title: "Synchronization failed",
        description: e.message,
        tone: "error",
      });
    } finally {
      setTriggering(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-app-lg bg-[var(--surface-sunken)]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Backend (sapSyncController.getSyncStatus) responds with:
  //   { lastMasterRun, lastDocumentRun, retryBacklogCount, isRunning }
  // It does not send a separate "currentRun" object — the currently
  // running job (if any) is just whichever of the two logs has
  // status === "RUNNING", so we derive it here instead of changing the API.
  const isRunning = status?.isRunning;
  const syncActive = isRunning || !!triggering;
  const syncFailed = triggerFailed && !syncActive;
  const lastMaster = status?.lastMasterRun;
  const lastDocument = status?.lastDocumentRun;
  const currentRun = isRunning
    ? [lastMaster, lastDocument].find((l) => l?.status === "RUNNING") || null
    : null;
  const retryBacklog = status?.retryBacklogCount || 0;

  // "Last Successful" / "Last Failed" — pick the more recent between master & document logs.
  const recentLogs = [lastMaster, lastDocument].filter(Boolean);
  const lastSuccessful = recentLogs
    .filter((l) => l.status === "SUCCESS" || l.status === "PARTIAL_SUCCESS")
    .sort(
      (a, b) =>
        new Date(b.endTime || b.createdAt) - new Date(a.endTime || a.createdAt),
    )[0];
  const lastFailed = recentLogs
    .filter((l) => l.status === "FAILED")
    .sort(
      (a, b) =>
        new Date(b.endTime || b.createdAt) - new Date(a.endTime || a.createdAt),
    )[0];

  const lastAnySync = recentLogs.sort(
    (a, b) =>
      new Date(b.endTime || b.createdAt) - new Date(a.endTime || a.createdAt),
  )[0];

  const documentsImported =
    (lastDocument?.recordsCreated || 0) + (lastDocument?.recordsUpdated || 0);
  const mastersImported =
    (lastMaster?.recordsCreated || 0) + (lastMaster?.recordsUpdated || 0);
  const pendingClassification = lastDocument?.recordsPendingClassification || 0;
  const duplicateSkipped = lastDocument?.recordsSkipped || 0;
  const hasEverSynced = !!lastMaster?.erpConfigId;

  return (
    <div className="space-y-5">
      <ErpSyncGuideModal open={showGuide} onClose={() => setShowGuide(false)} />

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[19px] font-bold text-[var(--text-primary)]">
              ERP Connectivity
            </h1>
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              aria-label="View ERP Connectivity guide"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white ring-4 ring-brand-500/20 animate-pulse transition-colors hover:animate-none hover:bg-brand-600"
            >
              <Info className="h-3 w-3" />
            </button>
          </div>
          <p className="mt-0.5 text-[12.5px] text-[var(--text-tertiary)]">
            Live status of the connection between this tenant and ERP — Master
            and Document synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AppButton
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={loading}
            disabled={loading}
            onClick={load}
          >
            {loading ? "Checking..." : "Refresh"}
          </AppButton>
          <AppButton
            size="sm"
            icon={Database}
            loading={triggering === "masters"}
            disabled={isRunning || !!triggering}
            onClick={() => runTrigger("masters")}
          >
            Sync Masters
          </AppButton>
          <AppButton
            size="sm"
            icon={FileStack}
            loading={triggering === "documents"}
            disabled={isRunning || !!triggering}
            onClick={() => runTrigger("documents")}
          >
            Sync Documents
          </AppButton>
          {retryBacklog > 0 && (
            <AppButton
              size="sm"
              variant="secondary"
              icon={RefreshCw}
              loading={triggering === "retry"}
              disabled={isRunning || !!triggering}
              onClick={() => runTrigger("retry")}
            >
              Retry Failed ({retryBacklog})
            </AppButton>
          )}
        </div>
      </div>

      {/* Hero connection status */}
      <AppCard
        className={`relative overflow-hidden border ${
          syncActive
            ? "border-warning-500/30 bg-warning-50 dark:bg-warning-500/10"
            : syncFailed
              ? "border-danger-500/30 bg-danger-50 dark:bg-danger-500/10"
              : "border-success-500/20 bg-success-50/60 dark:bg-success-500/10"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                syncActive
                  ? "bg-warning-500/15 text-warning-500"
                  : syncFailed
                    ? "bg-danger-500/15 text-danger-500"
                    : !hasEverSynced
                      ? "bg-[var(--surface-sunken)] text-[var(--text-tertiary)]"
                      : "bg-success-500/15 text-success-500"
              }`}
            >
              {syncFailed ? (
                <XCircle className="h-5 w-5" />
              ) : !hasEverSynced ? (
                <WifiOff className="h-5 w-5" />
              ) : (
                <Wifi
                  className={`h-5 w-5 ${syncActive ? "animate-pulse" : ""}`}
                />
              )}
            </div>
            <div>
              <p className="text-[15px] font-bold text-[var(--text-primary)]">
                {syncActive
                  ? "Sync in progress"
                  : syncFailed
                    ? "Sync failed"
                    : !hasEverSynced
                      ? "Disconnected"
                      : "Idle / Connected"}
              </p>
              <p className="text-[12px] text-[var(--text-tertiary)]">
                {isRunning && currentRun
                  ? `Running ${toTitleCase(currentRun.syncType)} Sync since ${formatDateTime(currentRun.startTime)}`
                  : triggering
                    ? `Connecting… starting ${
                        triggering === "masters"
                          ? "Master"
                          : triggering === "documents"
                            ? "Document"
                            : "Retry"
                      } Sync`
                    : syncFailed
                      ? "The last sync attempt failed — check Job Activity below or try again."
                      : lastAnySync
                        ? `Last activity ${formatRelative(lastAnySync.endTime || lastAnySync.createdAt)}`
                        : "No synchronization has run yet for this tenant"}
              </p>
            </div>
          </div>

          {(syncActive || syncFailed) && (
            <StatusBadge
              status={
                isRunning && currentRun
                  ? `Running: ${toTitleCase(currentRun.syncType)}`
                  : syncActive
                    ? "Connecting..."
                    : "Failed"
              }
              tone={syncActive ? "warning" : "danger"}
            />
          )}
        </div>

        {syncActive && (
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-warning-500/15">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-warning-500" />
          </div>
        )}
      </AppCard>

      {!hasEverSynced && !isRunning && (
        <AppCard className="flex items-center gap-3 border-warning-500/30 bg-warning-50 dark:bg-warning-500/10">
          <WifiOff className="h-5 w-5 shrink-0 text-warning-500" />
          <p className="text-sm text-[var(--text-secondary)]">
            No ERP synchronization has run yet for this tenant. Trigger a Master
            Sync first, then a Document Sync.
          </p>
        </AppCard>
      )}

      {/* Sync overview */}
      <div>
        <SectionLabel>Sync Overview</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={syncFailed ? XCircle : !hasEverSynced ? WifiOff : Wifi}
            label="ERP Connection Status"
            value={
              syncActive
                ? "Syncing"
                : syncFailed
                  ? "Failed"
                  : !hasEverSynced
                    ? "Disconnected"
                    : "Connected"
            }
            tone={
              syncActive
                ? "warning"
                : syncFailed
                  ? "danger"
                  : !hasEverSynced
                    ? "neutral"
                    : "success"
            }
          />
          <MetricCard
            icon={Database}
            label="Last Master Sync"
            value={formatRelative(lastMaster?.createdAt)}
            sub={formatDateTime(lastMaster?.createdAt)}
          />
          <MetricCard
            icon={FileStack}
            label="Last Document Sync"
            value={formatRelative(lastDocument?.createdAt)}
            sub={formatDateTime(lastDocument?.createdAt)}
          />
          <MetricCard
            icon={Layers}
            label="Sync Duration (last run)"
            value={formatDuration(
              lastDocument?.durationMs ?? lastMaster?.durationMs,
            )}
            tone="info"
          />
        </div>
      </div>

      {/* Job activity */}
      <div>
        <SectionLabel>Job Activity</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Activity}
            label="Current Running Job"
            value={
              currentRun ? `${toTitleCase(currentRun.syncType)} Sync` : "None"
            }
            sub={
              currentRun
                ? formatDateTime(currentRun.startTime)
                : "No job running"
            }
            tone={currentRun ? "warning" : "neutral"}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Last Successful Job"
            value={
              lastSuccessful
                ? `${toTitleCase(lastSuccessful.syncType)} Sync`
                : "—"
            }
            sub={
              lastSuccessful
                ? formatDateTime(
                    lastSuccessful.endTime || lastSuccessful.createdAt,
                  )
                : "No successful run yet"
            }
            tone="success"
          />
          <MetricCard
            icon={XCircle}
            label="Last Failed Job"
            value={
              lastFailed ? `${toTitleCase(lastFailed.syncType)} Sync` : "None"
            }
            sub={
              lastFailed
                ? formatDateTime(lastFailed.endTime || lastFailed.createdAt)
                : "No failures recorded"
            }
            tone={lastFailed ? "danger" : "neutral"}
          />
          <MetricCard
            icon={ListChecks}
            label="Retry Queue Count"
            value={retryBacklog}
            tone={retryBacklog ? "danger" : "success"}
            sub={retryBacklog ? "Items awaiting retry" : "Nothing pending"}
          />
        </div>
      </div>

      {/* Import summary */}
      <div>
        <SectionLabel>Import Summary (Last Run)</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={FileCheck2}
            label="Documents sync"
            value={documentsImported}
            sub="Created + updated, last document sync"
          />
          <MetricCard
            icon={Database}
            label="Masters sync"
            value={mastersImported}
            sub="Created + updated, last master sync"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Pending Classification"
            value={pendingClassification}
            tone={pendingClassification ? "warning" : "neutral"}
          />
          <MetricCard
            icon={Copy}
            label="Duplicate Skipped"
            value={duplicateSkipped}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Guide modal                                                         */
/* ------------------------------------------------------------------ */

function ErpSyncGuideModal({ open, onClose }) {
  const steps = [
    {
      icon: Wifi,
      title: "Check ERP Connection Status",
      desc: "The status banner shows whether the ERP link is Idle/Connected or a sync is currently in progress.",
    },
    {
      icon: Database,
      title: "Run a Master Sync first",
      desc: "Always trigger Sync Masters before Sync Documents — masters (vendors, GL codes, etc.) must exist before documents referencing them can be imported.",
    },
    {
      icon: FileStack,
      title: "Then run a Document Sync",
      desc: "Once masters are up to date, click Sync Documents to pull the latest documents from ERP into this tenant.",
    },
    {
      icon: Activity,
      title: "Watch the current job",
      desc: "While a sync runs, the status banner switches to 'Sync in progress' and the Current Running Job card shows which sync type is active.",
    },
    {
      icon: XCircle,
      title: "Handle failures",
      desc: "If a job fails, it shows under Last Failed Job and adds items to the Retry Queue. Use Retry Failed to reprocess only the failed records.",
    },
    {
      icon: ListChecks,
      title: "Review the metrics",
      desc: "Documents Imported, Masters Imported, Pending Classification, and Duplicate Skipped tell you the outcome of the last run at a glance.",
    },
  ];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          ERP Connectivity — Guide
        </span>
      }
      footer={
        <AppButton variant="primary" onClick={onClose}>
          Got it
        </AppButton>
      }
    >
      <div className="space-y-4">
        {steps.map((s, i) => (
          <div key={s.title} className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {i + 1}. {s.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-tertiary)]">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </AppModal>
  );
}
