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
  ListChecks,
  Wifi,
  WifiOff,
  Info,
  Sparkles,
} from "lucide-react";

import AppCard from "../../../components/ui/Card";
import AppButton from "../../../components/ui/Button";
import AppModal from "../../../components/ui/Modal";
import StatusBadge from "../../../components/ui/StatusBadge";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import { SapSyncApi } from "../api";
import {
  formatDateTime,
  formatDuration,
  formatRelative,
} from "../constants";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function toTitleCase(value) {
  if (!value) return "";

  return String(value)
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function getRunTime(run) {
  return run?.endTime || run?.createdAt;
}

function isSuccessfulRun(run) {
  return (
    run?.status === "SUCCESS" ||
    run?.status === "PARTIAL_SUCCESS"
  );
}

/* ------------------------------------------------------------------ */
/* Small UI components                                                */
/* ------------------------------------------------------------------ */

function StatusDot({ tone = "neutral" }) {
  const classes = {
    success: "bg-success-500",
    warning: "bg-warning-500",
    danger: "bg-danger-500",
    neutral: "bg-[var(--text-tertiary)]",
  };

  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        classes[tone] || classes.neutral
      }`}
    />
  );
}

function SectionTitle({ title, description }) {
  return (
    <div className="mb-5">
<h2 className="text-sm font-semibold text-[var(--text-primary)]">        {title}
      </h2>

      {description && (
        <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
          {description}
        </p>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  description,
  tone = "brand",
}) {
  const toneClasses = {
    brand: "bg-brand-500/10 text-brand-500",
    success: "bg-success-500/10 text-success-500",
    warning: "bg-warning-500/10 text-warning-500",
    danger: "bg-danger-500/10 text-danger-500",
    neutral:
      "bg-[var(--surface-sunken)] text-[var(--text-tertiary)]",
  };

  return (
    <AppCard className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--text-tertiary)]">
            {label}
          </p>

          <p className="mt-2 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            {value}
          </p>

          {description && (
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-tertiary)]">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-app-md ${
            toneClasses[tone] || toneClasses.brand
          }`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
    </AppCard>
  );
}

function StatLine({ label, value, tone = "neutral" }) {
  const valueClasses = {
    success: "text-success-500",
    warning: "text-warning-500",
    danger: "text-danger-500",
    neutral: "text-[var(--text-primary)]",
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-xs text-[var(--text-tertiary)]">
        {label}
      </span>

      <span
        className={`text-sm font-semibold ${
          valueClasses[tone] || valueClasses.neutral
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Completed document visual                                         */
/* ------------------------------------------------------------------ */

function CompletedDocumentsCard({
  completed,
  lastDocument,
}) {
  const hasDocuments = completed > 0;

  return (
    <AppCard className="p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
    <h2 className="text-sm font-semibold text-[var(--text-primary)]">   
               Completed Documents
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
            Documents successfully completed by the latest
            document synchronization.
          </p>
        </div>

        {lastDocument && (
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {formatRelative(getRunTime(lastDocument))}
          </span>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              {completed}
            </p>

            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              completed documents
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-500/10 text-success-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Simple completion graph */}
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
              Successful processing
            </span>

            <span className="text-[11px] font-semibold text-success-500">
              {hasDocuments ? "Completed" : "No completed documents"}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-sunken)]">
            <div
              className={`h-full rounded-full transition-all ${
                hasDocuments
                  ? "w-full bg-success-500"
                  : "w-0"
              }`}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-[var(--border-subtle)] pt-4">
        <p className="text-[11px] leading-relaxed text-[var(--text-tertiary)]">
          Only documents that have completed processing are
          included in this figure.
        </p>
      </div>
    </AppCard>
  );
}

/* ------------------------------------------------------------------ */
/* Integration health                                                */
/* ------------------------------------------------------------------ */

function IntegrationHealth({
  syncActive,
  syncFailed,
  hasEverSynced,
  currentRun,
  retryBacklog,
}) {
  let state;

  if (syncActive) {
    state = {
      title: "Synchronization in progress",
      description: currentRun
        ? `${toTitleCase(currentRun.syncType)} synchronization is currently running.`
        : "A synchronization request is currently being processed.",
      tone: "warning",
    };
  } else if (syncFailed) {
    state = {
      title: "Synchronization failed",
      description:
        "The latest synchronization attempt requires attention.",
      tone: "danger",
    };
  } else if (hasEverSynced) {
    state = {
      title: "SAP integration is healthy",
      description:
        "ERP connection is available and synchronization is currently idle.",
      tone: "success",
    };
  } else {
    state = {
      title: "SAP integration not initialized",
      description:
        "Run a Master Sync to initialize ERP synchronization.",
      tone: "neutral",
    };
  }

  const Icon =
    state.tone === "warning"
      ? RefreshCw
      : state.tone === "danger"
        ? XCircle
        : state.tone === "success"
          ? Wifi
          : WifiOff;

  return (
    <AppCard className="p-5 sm:p-6">
      <SectionTitle
        title="Integration Health"
        description="Current ERP synchronization status."
      />

      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            state.tone === "success"
              ? "bg-success-500/10 text-success-500"
              : state.tone === "warning"
                ? "bg-warning-500/10 text-warning-500"
                : state.tone === "danger"
                  ? "bg-danger-500/10 text-danger-500"
                  : "bg-[var(--surface-sunken)] text-[var(--text-tertiary)]"
          }`}
        >
          <Icon
            className={`h-5 w-5 ${
              state.tone === "warning"
                ? "animate-spin"
                : ""
            }`}
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {state.title}
            </h3>

            <StatusDot tone={state.tone} />
          </div>

          <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-tertiary)]">
            {state.description}
          </p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
        <StatLine
          label="Current job"
          value={
            currentRun
              ? toTitleCase(currentRun.syncType)
              : "None"
          }
          tone={currentRun ? "warning" : "neutral"}
        />

        <StatLine
          label="Retry queue"
          value={retryBacklog}
          tone={retryBacklog > 0 ? "danger" : "success"}
        />

        <StatLine
          label="Connection"
          value={
            hasEverSynced
              ? "Connected"
              : "Not initialized"
          }
          tone={hasEverSynced ? "success" : "neutral"}
        />
      </div>
    </AppCard>
  );
}

/* ------------------------------------------------------------------ */
/* Latest synchronization                                             */
/* ------------------------------------------------------------------ */

function LatestSyncCard({
  lastMaster,
  lastDocument,
  completedDocuments,
}) {
  const masterRecords =
    (lastMaster?.recordsCreated || 0) +
    (lastMaster?.recordsUpdated || 0);

  return (
    <AppCard className="p-5 sm:p-6">
      <SectionTitle
        title="Latest Synchronization"
        description="Most recent ERP synchronization results."
      />

      <div className="space-y-5">
        <SyncRow
          icon={FileStack}
          title="Document Sync"
          run={lastDocument}
          value={completedDocuments}
          label="completed"
          tone="success"
        />

        <SyncRow
          icon={Database}
          title="Master Sync"
          run={lastMaster}
          value={masterRecords}
          label="records"
          tone="brand"
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[var(--border-subtle)] pt-5">
        <SmallStat
          label="Document status"
          value={
            lastDocument
              ? toTitleCase(lastDocument.status)
              : "—"
          }
          tone={
            isSuccessfulRun(lastDocument)
              ? "success"
              : "neutral"
          }
        />

        <SmallStat
          label="Master status"
          value={
            lastMaster
              ? toTitleCase(lastMaster.status)
              : "—"
          }
          tone={
            isSuccessfulRun(lastMaster)
              ? "success"
              : "neutral"
          }
        />

        <SmallStat
          label="Document duration"
          value={formatDuration(
            lastDocument?.durationMs,
          )}
        />

        <SmallStat
          label="Master duration"
          value={formatDuration(
            lastMaster?.durationMs,
          )}
        />
      </div>
    </AppCard>
  );
}

function SyncRow({
  icon: Icon,
  title,
  run,
  value,
  label,
  tone,
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-app-md ${
            tone === "success"
              ? "bg-success-500/10 text-success-500"
              : "bg-brand-500/10 text-brand-500"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            {title}
          </p>

          <p className="mt-0.5 truncate text-[11px] text-[var(--text-tertiary)]">
            {run
              ? formatRelative(getRunTime(run))
              : "No run available"}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {value}
        </p>

        <p className="text-[10px] text-[var(--text-tertiary)]">
          {label}
        </p>
      </div>
    </div>
  );
}

function SmallStat({
  label,
  value,
  tone = "neutral",
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-[var(--text-tertiary)]">
        {label}
      </p>

      <p
        className={`mt-1 truncate text-sm font-semibold ${
          tone === "success"
            ? "text-success-500"
            : tone === "warning"
              ? "text-warning-500"
              : tone === "danger"
                ? "text-danger-500"
                : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Activity                                                           */
/* ------------------------------------------------------------------ */

function SyncActivityCard({
  lastMaster,
  lastDocument,
  lastSuccessful,
  lastFailed,
}) {
  const activities = [
    {
      label: "Document Sync",
      run: lastDocument,
      icon: FileStack,
    },
    {
      label: "Master Sync",
      run: lastMaster,
      icon: Database,
    },
  ]
    .filter((item) => item.run)
    .sort(
      (a, b) =>
        new Date(getRunTime(b.run)) -
        new Date(getRunTime(a.run)),
    );

  return (
    <AppCard className="p-5 sm:p-6">
      <SectionTitle
        title="Sync Activity"
        description="Recent ERP synchronization activity."
      />

      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((item) => {
            const Icon = item.icon;
            const success = isSuccessfulRun(item.run);
            const failed = item.run.status === "FAILED";

            return (
              <div
                key={item.label}
                className="flex items-center gap-3"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    success
                      ? "bg-success-500/10 text-success-500"
                      : failed
                        ? "bg-danger-500/10 text-danger-500"
                        : "bg-warning-500/10 text-warning-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      {item.label}
                    </p>

                    <span
                      className={`text-[11px] font-medium ${
                        success
                          ? "text-success-500"
                          : failed
                            ? "text-danger-500"
                            : "text-warning-500"
                      }`}
                    >
                      {toTitleCase(item.run.status)}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                    {formatRelative(getRunTime(item.run))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Activity className="mx-auto h-7 w-7 text-[var(--text-tertiary)]" />

          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            No synchronization activity yet.
          </p>
        </div>
      )}

      <div className="mt-6 border-t border-[var(--border-subtle)] pt-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              Last successful
            </p>

            <p className="mt-1 text-xs font-semibold text-success-500">
              {lastSuccessful
                ? toTitleCase(lastSuccessful.syncType)
                : "—"}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              Last failed
            </p>

            <p
              className={`mt-1 text-xs font-semibold ${
                lastFailed
                  ? "text-danger-500"
                  : "text-[var(--text-primary)]"
              }`}
            >
              {lastFailed
                ? toTitleCase(lastFailed.syncType)
                : "None"}
            </p>
          </div>
        </div>
      </div>
    </AppCard>
  );
}

/* ------------------------------------------------------------------ */
/* Main Dashboard                                                     */
/* ------------------------------------------------------------------ */

export default function SapSyncDashboard({ onNavigate }) {
  const { toast } = useToast();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedDocuments, setCompletedDocuments] = useState(0);
  const [triggering, setTriggering] = useState(null);
  const [triggerFailed, setTriggerFailed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const load = () => {
  setLoading(true);

  SapSyncApi.getStatus()
    .then((res) => {
      setStatus(res.data);
      setTriggerFailed(false);
    })
    .catch((e) => {
      toast({
        title: "Could not load sync status",
        description: e.message,
        tone: "error",
      });
    })
    .finally(() => {
      setLoading(false);
    });

  // Load only documents that are actually COMPLETE
  SapSyncApi.listDocuments({
    page: 1,
    limit: 1,
    classification: "COMPLETE",
  })
    .then((res) => {
      setCompletedDocuments(res.pagination?.total || 0);
    })
    .catch((e) => {
      console.error("Could not load completed documents:", e);
      setCompletedDocuments(0);
    });
};

  useEffect(load, []); // eslint-disable-line

  async function runTrigger(kind) {
    setTriggering(kind);
    setTriggerFailed(false);

    try {
      if (kind === "masters") {
        await SapSyncApi.triggerMasterSync();
      }

      if (kind === "documents") {
        await SapSyncApi.triggerDocumentSync();
      }

      if (kind === "retry") {
        await SapSyncApi.triggerRetry();
      }

      toast({
        title: "Synchronization completed",
        tone: "success",
      });

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
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-52 animate-pulse rounded bg-[var(--surface-sunken)]" />

          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-[var(--surface-sunken)]" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="h-[320px] animate-pulse rounded-app-lg bg-[var(--surface-sunken)]" />

          <div className="h-[320px] animate-pulse rounded-app-lg bg-[var(--surface-sunken)]" />
        </div>
      </div>
    );
  }

  const isRunning = !!status?.isRunning;
  const syncActive = isRunning || !!triggering;
  const syncFailed = triggerFailed && !syncActive;

  const lastMaster = status?.lastMasterRun;
  const lastDocument = status?.lastDocumentRun;

  const currentRun = isRunning
    ? [lastMaster, lastDocument].find(
        (run) => run?.status === "RUNNING",
      ) || null
    : null;

  const retryBacklog =
    status?.retryBacklogCount || 0;

  const recentLogs = [
    lastMaster,
    lastDocument,
  ].filter(Boolean);

  const lastSuccessful = [...recentLogs]
    .filter((run) => isSuccessfulRun(run))
    .sort(
      (a, b) =>
        new Date(getRunTime(b)) -
        new Date(getRunTime(a)),
    )[0];

  const lastFailed = [...recentLogs]
    .filter((run) => run.status === "FAILED")
    .sort(
      (a, b) =>
        new Date(getRunTime(b)) -
        new Date(getRunTime(a)),
    )[0];

  const lastAnySync = [...recentLogs].sort(
    (a, b) =>
      new Date(getRunTime(b)) -
      new Date(getRunTime(a)),
  )[0];

  /* -------------------------------------------------------------- */
  /* DOCUMENT SUCCESS LOGIC                                         */
  /* -------------------------------------------------------------- */

  /*
   * SAP document sync returns:
   *
   * recordsCreated
   * recordsUpdated
   * recordsPendingClassification
   *
   * Created + Updated = imported records.
   *
   * Pending classification records are not considered
   * completed, therefore they are removed from the
   * dashboard's Completed Documents figure.
   *
   * Example:
   *
   * Created       = 60
   * Updated       = 22
   * Imported      = 82
   * Pending       = 7
   *
   * Completed     = 75
   *
   * Pending documents are NOT displayed in the UI.
   */

  

  const mastersImported =
    (lastMaster?.recordsCreated || 0) +
    (lastMaster?.recordsUpdated || 0);

  const hasEverSynced =
    !!lastMaster?.erpConfigId ||
    !!lastDocument?.erpConfigId;

  /*
   * Success rate here is RUN level, not individual
   * document level. The backend currently exposes
   * lastMasterRun and lastDocumentRun, not a list of
   * individual successful documents.
   */

  const successfulRuns = recentLogs.filter(
    (run) => isSuccessfulRun(run),
  ).length;

  const successRate = recentLogs.length
    ? Math.round(
        (successfulRuns / recentLogs.length) * 100,
      )
    : 0;

 return (
  <AppCard className="p-5 sm:p-6">
    <div className="space-y-7">
      <ErpSyncGuideModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
      />

      {/* ---------------------------------------------------------- */}
      {/* Header                                                     */}
      {/* ---------------------------------------------------------- */}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
<h1 className="text-lg font-bold text-[var(--text-primary)]">
                SAP Integration
            </h1>

            <button
              type="button"
              onClick={() => setShowGuide(true)}
              aria-label="View SAP integration guide"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 transition-colors hover:bg-brand-500/20"
            >
              <Info className="h-3 w-3" />
            </button>
          </div>

          <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
            Monitor ERP synchronization and completed
            document processing from one place.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <StatusDot
              tone={
                syncActive
                  ? "warning"
                  : syncFailed
                    ? "danger"
                    : hasEverSynced
                      ? "success"
                      : "neutral"
              }
            />

            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {syncActive
                ? "Synchronization in progress"
                : syncFailed
                  ? "Attention required"
                  : hasEverSynced
                    ? "Connected"
                    : "Not initialized"}
            </span>

            {lastAnySync && !syncActive && (
              <span className="text-xs text-[var(--text-tertiary)]">
                · Last activity{" "}
                {formatRelative(getRunTime(lastAnySync))}
              </span>
            )}
          </div>
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
            Refresh
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

      {/* ---------------------------------------------------------- */}
      {/* Primary KPIs                                               */}
      {/* ---------------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          icon={FileCheck2}
          label="Completed Documents"
          value={completedDocuments}
          description="Successfully completed document processing"
          tone="success"
        />

        <KpiCard
          icon={Database}
          label="Master Records"
          value={mastersImported}
          description="Created + updated in latest master sync"
          tone="brand"
        />

        <KpiCard
          icon={CheckCircle2}
          label="Sync Success Rate"
          value={`${successRate}%`}
          description={
            recentLogs.length
              ? "Based on latest available sync runs"
              : "No synchronization history"
          }
          tone={
            successRate >= 80
              ? "success"
              : successRate > 0
                ? "warning"
                : "neutral"
          }
        />
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Main content                                                */}
      {/* ---------------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <CompletedDocumentsCard
          completed={completedDocuments}
          lastDocument={lastDocument}
        />

        <IntegrationHealth
          syncActive={syncActive}
          syncFailed={syncFailed}
          hasEverSynced={hasEverSynced}
          currentRun={currentRun}
          retryBacklog={retryBacklog}
        />
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Detail section                                              */}
      {/* ---------------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <LatestSyncCard
          lastMaster={lastMaster}
          lastDocument={lastDocument}
          completedDocuments={completedDocuments}
        />

        <SyncActivityCard
          lastMaster={lastMaster}
          lastDocument={lastDocument}
          lastSuccessful={lastSuccessful}
          lastFailed={lastFailed}
        />
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Initial state                                               */}
      {/* ---------------------------------------------------------- */}

      {!hasEverSynced && !isRunning && (
        <AppCard className="border-warning-500/20 bg-warning-500/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-500" />

            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                ERP synchronization is not initialized
              </p>

              <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
                Run a Master Sync first. Once master data is
                available, run Document Sync to import ERP
                documents.
              </p>
            </div>
          </div>
        </AppCard>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Running state                                               */}
      {/* ---------------------------------------------------------- */}

      {syncActive && (
        <AppCard className="overflow-hidden border-warning-500/20 p-0">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <RefreshCw className="h-4 w-4 animate-spin text-warning-500" />

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                {currentRun
                  ? `${toTitleCase(currentRun.syncType)} Sync is running`
                  : "Starting synchronization"}
              </p>

              <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
                Please wait until the current synchronization
                completes.
              </p>
            </div>

            {currentRun?.startTime && (
              <span className="hidden text-[11px] text-[var(--text-tertiary)] sm:block">
                Started{" "}
                {formatRelative(currentRun.startTime)}
              </span>
            )}
          </div>

          <div className="h-1 w-full overflow-hidden bg-warning-500/10">
            <div className="h-full w-1/3 animate-pulse rounded-r bg-warning-500" />
          </div>
        </AppCard>
          )}
    </div>
  </AppCard>
  );
}

/* ------------------------------------------------------------------ */
/* Guide modal                                                        */
/* ------------------------------------------------------------------ */

function ErpSyncGuideModal({ open, onClose }) {
  const steps = [
    {
      icon: Wifi,
      title: "Check SAP connection",
      desc: "The status indicator shows whether the ERP integration is connected, running, or requires attention.",
    },
    {
      icon: Database,
      title: "Run Master Sync first",
      desc: "Synchronize master data before documents so ERP references are available.",
    },
    {
      icon: FileStack,
      title: "Run Document Sync",
      desc: "Run Document Sync after master data is current to import the latest ERP documents.",
    },
    {
      icon: CheckCircle2,
      title: "Review completed documents",
      desc: "The Completed Documents metric includes only documents that have completed processing. Pending classification records are excluded.",
    },
    {
      icon: Activity,
      title: "Monitor synchronization",
      desc: "Use Integration Health and Sync Activity to monitor the current and latest synchronization jobs.",
    },
    {
      icon: XCircle,
      title: "Handle failures",
      desc: "Failed synchronization records can be reprocessed using the Retry Failed action when items are available in the retry queue.",
    },
  ];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          SAP Integration Guide
        </span>
      }
      footer={
        <AppButton
          variant="primary"
          onClick={onClose}
        >
          Got it
        </AppButton>
      }
    >
      <div className="space-y-5">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className="flex gap-3.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {index + 1}. {step.title}
                </p>

                <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </AppModal>
  );
}