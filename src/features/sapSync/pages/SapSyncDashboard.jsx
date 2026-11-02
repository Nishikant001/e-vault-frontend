// src/features/sapSync/pages/SapSyncDashboard.jsx

import { useEffect, useState } from "react";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  FileCheck2,
  FileStack,
  Info,
  Layers,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";

import AppCard from "../../../components/ui/Card";

import AppButton from "../../../components/ui/Button";

import AppModal from "../../../components/ui/Modal";

import { SkeletonCard } from "../../../components/ui/Skeleton";

import { useToast } from "../../../components/ui/Toast";

import { SapSyncApi } from "../api";

import { useSapErpConnections } from "../hooks/useSapErpConnections";

import ErpConnectionSelect from "../components/ErpConnectionSelect";

import { formatDateTime, formatDuration, formatRelative } from "../constants";

function isSuccessfulRun(run) {
  if (!run) return false;

  const status = String(run.status || "").toUpperCase();

  return (
    status === "SUCCESS" ||
    status === "COMPLETED" ||
    status === "SUCCEEDED" ||
    status === "SUCCESSFUL"
  );
}

function getRunTime(run) {
  return (
    run?.finishedAt ||
    run?.endTime ||
    run?.completedAt ||
    run?.startedAt ||
    run?.startTime ||
    run?.createdAt ||
    new Date().toISOString()
  );
}

function toTitleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")

    .toLowerCase()

    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function SapSyncDashboard({ onNavigate }) {
  const { toast } = useToast();

  const {
    connections,

    selectedErpConfigId,

    setSelectedErpConfigId,

    erpConfigIdForRequest,

    showSelector,
  } = useSapErpConnections();

  const selectedErp =
    connections.find(
      (connection) =>
        Number(connection.erpConfigId) === Number(selectedErpConfigId),
    ) || null;

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
        const data = res.data || {};

        setStatus(data);

        const documentRun = data.lastDocumentRun;

        const completed =
          documentRun?.recordsCompleted ??
          documentRun?.completedDocuments ??
          documentRun?.recordsCreated ??
          0;

        setCompletedDocuments(
          Number.isFinite(Number(completed)) ? Number(completed) : 0,
        );

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
  };

  useEffect(load, []); // eslint-disable-line

  async function runTrigger(kind) {
    if (
      (kind === "masters" || kind === "documents") &&
      showSelector &&
      !erpConfigIdForRequest
    ) {
      toast({
        title: "Select an ERP connection",

        description:
          "Please select the SAP ERP connection before starting synchronization.",

        tone: "error",
      });

      return;
    }

    setTriggering(kind);

    setTriggerFailed(false);

    try {
      if (kind === "masters") {
        await SapSyncApi.triggerMasterSync(erpConfigIdForRequest);
      }

      if (kind === "documents") {
        await SapSyncApi.triggerDocumentSync(erpConfigIdForRequest);
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
                               {" "}
        <div className="space-y-2">
                                       {" "}
          <div className="h-7 w-52 animate-pulse rounded bg-[var(--surface-sunken)]" />
                                       {" "}
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-[var(--surface-sunken)]" />
                                   {" "}
        </div>
                               {" "}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                       {" "}
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
                                   {" "}
        </div>
                               {" "}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
                                       {" "}
          <div className="h-[320px] animate-pulse rounded-app-lg bg-[var(--surface-sunken)]" />
                                       {" "}
          <div className="h-[320px] animate-pulse rounded-app-lg bg-[var(--surface-sunken)]" />
                                   {" "}
        </div>
                           {" "}
      </div>
    );
  }

  const isRunning = !!status?.isRunning;

  const syncActive = isRunning || !!triggering;

  const syncFailed = triggerFailed && !syncActive;

  const lastMaster = status?.lastMasterRun;

  const lastDocument = status?.lastDocumentRun;

  const currentRun = isRunning
    ? [lastMaster, lastDocument].find((run) => run?.status === "RUNNING") ||
      null
    : null;

  const retryBacklog = status?.retryBacklogCount || 0;

  const recentLogs = [lastMaster, lastDocument].filter(Boolean);

  const lastSuccessful = [...recentLogs]

    .filter((run) => isSuccessfulRun(run))

    .sort((a, b) => new Date(getRunTime(b)) - new Date(getRunTime(a)))[0];

  const lastFailed = [...recentLogs]

    .filter((run) => run.status === "FAILED")

    .sort((a, b) => new Date(getRunTime(b)) - new Date(getRunTime(a)))[0];

  const lastAnySync = [...recentLogs].sort(
    (a, b) => new Date(getRunTime(b)) - new Date(getRunTime(a)),
  )[0];

  const mastersImported =
    (lastMaster?.recordsCreated || 0) + (lastMaster?.recordsUpdated || 0);

  const hasEverSynced =
    !!lastMaster ||
    !!lastDocument ||
    !!lastMaster?.erpConfigId ||
    !!lastDocument?.erpConfigId;

  const successfulRuns = recentLogs.filter((run) =>
    isSuccessfulRun(run),
  ).length;

  const successRate = recentLogs.length
    ? Math.round((successfulRuns / recentLogs.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <AppCard>
                         {" "}
        <ErpSyncGuideModal
          open={showGuide}
          onClose={() => setShowGuide(false)}
        />
                         {" "}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--surface)]">
          <div className="px-5 py-5 md:px-7 lg:px-8 lg:py-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(520px,0.95fr)] xl:items-center">
              {/* Page identity */}
              <div className="min-w-0">
                <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--text-tertiary)]">
                  <span>ERP Configuration</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-[var(--text-secondary)]">
                    Synchronization
                  </span>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400">
                    <Layers className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-[24px] font-bold tracking-tight text-[var(--text-primary)]">
                        SAP Integration
                      </h1>

                      <button
                        type="button"
                        onClick={() => setShowGuide(true)}
                        aria-label="View SAP integration guide"
                        title="SAP integration guide"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-brand-600 transition hover:border-brand-200 hover:bg-brand-50 dark:text-brand-400 dark:hover:border-brand-500/20 dark:hover:bg-brand-500/10"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                          syncActive
                            ? "border-warning-500/20 bg-warning-500/10 text-warning-500"
                            : syncFailed
                              ? "border-danger-500/20 bg-danger-500/10 text-danger-500"
                              : hasEverSynced
                                ? "border-success-500/20 bg-success-500/10 text-success-500"
                                : "border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-tertiary)]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            syncActive
                              ? "bg-warning-500"
                              : syncFailed
                                ? "bg-danger-500"
                                : hasEverSynced
                                  ? "bg-success-500"
                                  : "bg-[var(--text-tertiary)]"
                          }`}
                        />
                        {syncActive
                          ? "Sync in progress"
                          : syncFailed
                            ? "Attention required"
                            : hasEverSynced
                              ? "Connected"
                              : "Not initialized"}
                      </span>
                    </div>

                    <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[var(--text-tertiary)]">
                      Monitor ERP synchronization, master data ingestion and
                      document processing from one enterprise workspace.
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[10px] text-[var(--text-tertiary)]">
                      {lastAnySync ? (
                        <>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-3 w-3" />
                            Last activity{" "}
                            {formatRelative(getRunTime(lastAnySync))}
                          </span>
                          <span>•</span>
                        </>
                      ) : null}

                      <span>
                        {connections.length} SAP connection
                        {connections.length === 1 ? "" : "s"} available
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ERP context + actions — kept together as one control panel */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/35 p-3.5 shadow-sm">
                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        
                      </div>

                      {showSelector ? (
                        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                          <ErpConnectionSelect
                            connections={connections}
                            value={selectedErpConfigId}
                            onChange={setSelectedErpConfigId}
                            className="flex-wrap"
                          />
                        </div>
                      ) : selectedErp ? (
                        <div className="flex min-h-[46px] items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3.5 py-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                            <Server className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                              {selectedErp.name ||
                                `ERP #${selectedErp.erpConfigId}`}
                            </p>
                            <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                              {selectedErp.erpType || "SAP"}
                              {selectedErp.protocol
                                ? ` · ${selectedErp.protocol}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-h-[46px] items-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface)] px-3.5 text-xs text-[var(--text-tertiary)]">
                          No ERP connection selected
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    <AppButton
                      variant="secondary"
                      size="sm"
                      icon={RefreshCw}
                      loading={loading}
                      disabled={loading}
                      onClick={load}
                      className="h-9 max-w-25 justify-center whitespace-nowrap  text-xs"
                    >
                      Refresh
                    </AppButton>

                    <AppButton
                      size="sm"
                      icon={Database}
                      loading={triggering === "masters"}
                      disabled={
                        isRunning ||
                        !!triggering ||
                        (showSelector && !erpConfigIdForRequest)
                      }
                      onClick={() => runTrigger("masters")}
                      className="h-9 w-full -ml-5 justify-center whitespace-nowrap px-2 text-xs"
                    >
                      Sync Masters
                    </AppButton>

                    <AppButton
                      size="sm"
                      icon={FileStack}
                      loading={triggering === "documents"}
                      disabled={
                        isRunning ||
                        !!triggering ||
                        (showSelector && !erpConfigIdForRequest)
                      }
                      onClick={() => runTrigger("documents")}
                      className="h-9 max-w-35 -ml-5 justify-center whitespace-nowrap px-2 text-xs"
                    >
                      Sync Documents
                    </AppButton>

                    {retryBacklog > 0 ? (
                      <AppButton
                        size="sm"
                        variant="secondary"
                        icon={RefreshCw}
                        loading={triggering === "retry"}
                        disabled={isRunning || !!triggering}
                        onClick={() => runTrigger("retry")}
                        className="h-9 max-w-35  justify-center whitespace-nowrap px-2 text-xs"
                      >
                        Retry Failed 
                        
                      </AppButton>
                    ) : (
                      <div className="hidden sm:block" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-[1680px] space-y-4 px-5 py-5 md:px-7 lg:px-8 lg:py-6">
                                 {" "}
          {selectedErp && (
            <section className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-sm">
              <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400">
                    <Server className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                        Active ERP Connection
                      </span>

                      {selectedErp.isDefault && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-success-500/20 bg-success-500/10 px-2.5 py-1 text-[9px] font-bold text-success-600 dark:text-success-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                          Tenant Default
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5 rounded-full border border-success-500/20 bg-success-500/10 px-2.5 py-1 text-[9px] font-bold text-success-600 dark:text-success-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                        {syncActive ? "Syncing" : "Connected"}
                      </span>
                    </div>

                    <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2.5">
                      <h2 className="truncate text-base font-bold tracking-tight text-[var(--text-primary)]">
                        {selectedErp.name || `ERP #${selectedErp.erpConfigId}`}
                      </h2>

                      <span className="rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-brand-600 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400">
                        {selectedErp.erpType || "SAP"}
                      </span>

                      {selectedErp.protocol && (
                        <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                          {selectedErp.protocol}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                  <div className="min-w-[110px] rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/45 px-3.5 py-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                      Connection
                    </p>
                    <p className="mt-1 text-xs font-bold text-success-500">
                      {syncActive ? "Syncing" : "Connected"}
                    </p>
                  </div>

                  <div className="min-w-[90px] rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/45 px-3.5 py-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                      ERP ID
                    </p>
                    <p className="mt-1 text-xs font-bold text-[var(--text-primary)]">
                      #{selectedErp.erpConfigId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-sunken)]/25 px-5 py-2.5 lg:px-6">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[10px] text-[var(--text-tertiary)]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                    Manual synchronization enabled
                  </span>

                  <span className="hidden h-3 w-px bg-[var(--border-subtle)] sm:block" />

                  <span>
                    Master and document jobs use this ERP until the connection
                    selector is changed.
                  </span>
                </div>
              </div>
            </section>
          )}
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                         {" "}
            <div className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                                 {" "}
              <div className="flex items-start justify-between gap-4">
                                                         {" "}
                <div>
                                                                 {" "}
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                                      Completed Documents                {" "}
                  </p>
                                                                 {" "}
                  <p className="mt-2 text-[30px] font-bold tracking-tight text-[var(--text-primary)]">
                                      {completedDocuments}               {" "}
                  </p>
                                                                 {" "}
                  <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                                      Successfully processed by the latest
                    document synchronization                {" "}
                  </p>
                                                             {" "}
                </div>
                                                         {" "}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-500/10 text-success-500">
                                                 {" "}
                  <FileCheck2 className="h-[18px] w-[18px]" />                 
                                           {" "}
                </div>
                                                     {" "}
              </div>
                                                 {" "}
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-sunken)]">
                                                         {" "}
                <div
                  className={`h-full rounded-full transition-all ${completedDocuments > 0 ? "w-full bg-success-500" : "w-0"}`}
                />
                                                     {" "}
              </div>
                                             {" "}
            </div>
                                         {" "}
            <div className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                                 {" "}
              <div className="flex items-start justify-between gap-4">
                                                         {" "}
                <div>
                                                                 {" "}
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                                      Master Records                {" "}
                  </p>
                                                                 {" "}
                  <p className="mt-2 text-[30px] font-bold tracking-tight text-[var(--text-primary)]">
                                      {mastersImported}               {" "}
                  </p>
                                                                 {" "}
                  <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                                      Created + updated in the latest master
                    synchronization                {" "}
                  </p>
                                                             {" "}
                </div>
                                                         {" "}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                                                 {" "}
                  <Database className="h-[18px] w-[18px]" />                   
                                         {" "}
                </div>
                                                     {" "}
              </div>
                                                 {" "}
              <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-brand-500">
                                                         {" "}
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />     
                                      Latest master sync result                
                       {" "}
              </div>
                                             {" "}
            </div>
                                         {" "}
            <div className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                                 {" "}
              <div className="flex items-start justify-between gap-4">
                                                         {" "}
                <div>
                                                                 {" "}
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                                      Sync Success Rate                {" "}
                  </p>
                                                                 {" "}
                  <p className="mt-2 text-[30px] font-bold tracking-tight text-[var(--text-primary)]">
                                      {successRate}%                {" "}
                  </p>
                                                                 {" "}
                  <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                                     {" "}
                    {recentLogs.length
                      ? "Based on latest available sync runs"
                      : "No synchronization history"}
                                   {" "}
                  </p>
                                                             {" "}
                </div>
                                                         {" "}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    successRate >= 80
                      ? "bg-success-500/10 text-success-500"
                      : successRate > 0
                        ? "bg-warning-500/10 text-warning-500"
                        : "bg-[var(--surface-sunken)] text-[var(--text-tertiary)]"
                  }`}
                >
                                                 {" "}
                  <CheckCircle2 className="h-[18px] w-[18px]" />               
                                             {" "}
                </div>
                                                     {" "}
              </div>
                                                 {" "}
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-sunken)]">
                                                         {" "}
                <div
                  className={`h-full rounded-full transition-all ${successRate >= 80 ? "bg-success-500" : successRate > 0 ? "bg-warning-500" : ""}`}
                  style={{ width: `${successRate}%` }}
                />
                                                     {" "}
              </div>
                                             {" "}
            </div>
                                     {" "}
          </section>
                                 {" "}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
                                         {" "}
            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-sm">
                                                 {" "}
              <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-5 sm:px-6">
                                                         {" "}
                <div>
                                                                 {" "}
                  <div className="flex items-center gap-2">
                                                                         {" "}
                    <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                          Document Processing                
                       {" "}
                    </h2>
                                                                         {" "}
                    {lastDocument && (
                      <span className="rounded-full bg-[var(--surface-sunken)] px-2 py-0.5 text-[9px] font-semibold text-[var(--text-tertiary)]">
                                                                               
                                  {formatRelative(getRunTime(lastDocument))}   
                                                                               
                         {" "}
                      </span>
                    )}
                                                                     {" "}
                  </div>
                                                                 {" "}
                  <p className="mt-1 text-[11px] leading-5 text-[var(--text-tertiary)]">
                                                        Completed document
                    processing from the                   latest ERP document
                    synchronization.                                {" "}
                  </p>
                                                             {" "}
                </div>
                                                         {" "}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-500/10 text-success-500">
                                                 {" "}
                  <FileStack className="h-[18px] w-[18px]" />                   
                                         {" "}
                </div>
                                                     {" "}
              </div>
                                                 {" "}
              <div className="p-5 sm:p-6">
                                                         {" "}
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                                                                 {" "}
                  <div>
                                                                         {" "}
                    <p className="text-[44px] font-bold leading-none tracking-tight text-[var(--text-primary)]">
                                          {completedDocuments}               
                       {" "}
                    </p>
                                                                         {" "}
                    <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                                          completed documents                
                       {" "}
                    </p>
                                                                     {" "}
                  </div>
                                                                 {" "}
                  <div className="rounded-2xl border border-success-500/15 bg-success-500/5 px-4 py-3">
                                                                         {" "}
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                                          Processing state                
                       {" "}
                    </p>
                                                                         {" "}
                    <p className="mt-1 text-xs font-bold text-success-500">
                                         {" "}
                      {completedDocuments > 0
                        ? "Completed"
                        : "No completed documents"}
                                       {" "}
                    </p>
                                                                     {" "}
                  </div>
                                                             {" "}
                </div>
                                                         {" "}
                <div className="mt-8">
                                                                 {" "}
                  <div className="mb-2 flex items-center justify-between">
                                                                         {" "}
                    <span className="text-[10px] font-semibold text-[var(--text-tertiary)]">
                                          Successful processing                
                       {" "}
                    </span>
                                                                         {" "}
                    <span className="text-[10px] font-bold text-success-500">
                                         {" "}
                      {completedDocuments > 0 ? "Completed" : "Awaiting sync"} 
                                     {" "}
                    </span>
                                                                     {" "}
                  </div>
                                                                 {" "}
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-sunken)]">
                                                                         {" "}
                    <div
                      className={`h-full rounded-full transition-all ${completedDocuments > 0 ? "w-full bg-success-500" : "w-0"}`}
                    />
                                                                     {" "}
                  </div>
                                                             {" "}
                </div>
                                                         {" "}
                <div className="mt-7 grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] pt-5">
                                                                 {" "}
                  <div>
                                                                         {" "}
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                                          Latest document status                
                       {" "}
                    </p>
                                                                         {" "}
                    <p
                      className={`mt-1 text-xs font-bold ${isSuccessfulRun(lastDocument) ? "text-success-500" : lastDocument?.status === "FAILED" ? "text-danger-500" : "text-[var(--text-primary)]"}`}
                    >
                                                                               
                       {" "}
                      {lastDocument
                        ? toTitleCase(lastDocument.status)
                        : "No run available"}
                                                                           
                       {" "}
                    </p>
                                                                     {" "}
                  </div>
                                                                 {" "}
                  <div>
                                                                         {" "}
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                                          Duration                  {" "}
                    </p>
                                                                         {" "}
                    <p className="mt-1 text-xs font-bold text-[var(--text-primary)]">
                                         {" "}
                      {formatDuration(lastDocument?.durationMs)}               
                       {" "}
                    </p>
                                                                     {" "}
                  </div>
                                                             {" "}
                </div>
                                                     {" "}
              </div>
                                             {" "}
            </div>
                                         {" "}
            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-sm">
                                                 {" "}
              <div className="border-b border-[var(--border-subtle)] px-5 py-5 sm:px-6">
                                                         {" "}
                <div className="flex items-center gap-2">
                                                                 {" "}
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                      Integration Health                {" "}
                  </h2>
                                                                 {" "}
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${syncActive ? "bg-warning-500" : syncFailed ? "bg-danger-500" : hasEverSynced ? "bg-success-500" : "bg-[var(--text-tertiary)]"}`}
                  />
                                                             {" "}
                </div>
                                                         {" "}
                <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                                  Live operational state of the selected SAP
                  integration.              {" "}
                </p>
                                                     {" "}
              </div>
                                                 {" "}
              <div className="p-5 sm:p-6">
                                                         {" "}
                <div className="flex items-start gap-3.5">
                                                                 {" "}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      syncActive
                        ? "bg-warning-500/10 text-warning-500"
                        : syncFailed
                          ? "bg-danger-500/10 text-danger-500"
                          : hasEverSynced
                            ? "bg-success-500/10 text-success-500"
                            : "bg-[var(--surface-sunken)] text-[var(--text-tertiary)]"
                    }`}
                  >
                                                                         {" "}
                    {syncActive ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : syncFailed ? (
                      <XCircle className="h-5 w-5" />
                    ) : hasEverSynced ? (
                      <Wifi className="h-5 w-5" />
                    ) : (
                      <WifiOff className="h-5 w-5" />
                    )}
                                                                     {" "}
                  </div>
                                                                 {" "}
                  <div className="min-w-0">
                                                                         {" "}
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                                                                               
                       {" "}
                      {syncActive
                        ? "Synchronization in progress"
                        : syncFailed
                          ? "Synchronization failed"
                          : hasEverSynced
                            ? "SAP integration is healthy"
                            : "SAP integration not initialized"}
                                                                           
                       {" "}
                    </p>
                                                                         {" "}
                    <p className="mt-1.5 text-[11px] leading-5 text-[var(--text-tertiary)]">
                                                                               
                       {" "}
                      {syncActive
                        ? currentRun
                          ? `${toTitleCase(currentRun.syncType)} synchronization is currently running.`
                          : "A synchronization request is currently being processed."
                        : syncFailed
                          ? "The latest synchronization attempt requires attention."
                          : hasEverSynced
                            ? "ERP connection is available and synchronization is currently idle."
                            : "Run a Master Sync to initialize ERP synchronization."}
                                                                           
                       {" "}
                    </p>
                                                                     {" "}
                  </div>
                                                             {" "}
                </div>
                                                         {" "}
                <div className="mt-6 divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
                                                                 {" "}
                  <div className="flex items-center justify-between gap-4 py-3.5">
                                                                         {" "}
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                                          Current job                  {" "}
                    </span>
                                                                         {" "}
                    <span
                      className={`text-xs font-bold ${currentRun ? "text-warning-500" : "text-[var(--text-primary)]"}`}
                    >
                                         {" "}
                      {currentRun ? toTitleCase(currentRun.syncType) : "None"} 
                                     {" "}
                    </span>
                                                                     {" "}
                  </div>
                                                                 {" "}
                  <div className="flex items-center justify-between gap-4 py-3.5">
                                                                         {" "}
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                                          Retry queue                  {" "}
                    </span>
                                                                         {" "}
                    <span
                      className={`text-xs font-bold ${retryBacklog > 0 ? "text-danger-500" : "text-success-500"}`}
                    >
                                          {retryBacklog}                 {" "}
                    </span>
                                                                     {" "}
                  </div>
                                                                 {" "}
                  <div className="flex items-center justify-between gap-4 py-3.5">
                                                                         {" "}
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                                          Connection                  {" "}
                    </span>
                                                                         {" "}
                    <span
                      className={`text-xs font-bold ${hasEverSynced ? "text-success-500" : "text-[var(--text-primary)]"}`}
                    >
                                         {" "}
                      {hasEverSynced ? "Connected" : "Not initialized"}         
                             {" "}
                    </span>
                                                                     {" "}
                  </div>
                                                             {" "}
                </div>
                                                     {" "}
              </div>
                                             {" "}
            </div>
                                     {" "}
          </section>
                                 {" "}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
                                         {" "}
            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-sm">
                                                 {" "}
              <div className="border-b border-[var(--border-subtle)] px-5 py-5 sm:px-6">
                                                         {" "}
                <div className="flex items-center justify-between gap-3">
                                                                 {" "}
                  <div>
                                                                         {" "}
                    <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                          Latest Synchronization                
                       {" "}
                    </h2>
                                                                         {" "}
                    <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                                          Most recent master and document
                      synchronization results.                  {" "}
                    </p>
                                                                     {" "}
                  </div>
                                                                 {" "}
                  <Activity className="h-4 w-4 text-[var(--text-tertiary)]" /> 
                                                           {" "}
                </div>
                                                     {" "}
              </div>
                                                 {" "}
              <div className="p-5 sm:p-6">
                                                         {" "}
                <div className="grid gap-3 sm:grid-cols-2">
                                                                 {" "}
                  {[
                    {
                      icon: FileStack,

                      label: "Document Sync",

                      run: lastDocument,

                      value: completedDocuments,

                      valueLabel: "completed",

                      tone: "success",
                    },

                    {
                      icon: Database,

                      label: "Master Sync",

                      run: lastMaster,

                      value: mastersImported,

                      valueLabel: "records",

                      tone: "brand",
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    const success = isSuccessfulRun(item.run);

                    return (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-4"
                      >
                                                                               
                                 {" "}
                        <div className="flex items-center gap-3">
                                                                               
                                           {" "}
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.tone === "success" ? "bg-success-500/10 text-success-500" : "bg-brand-500/10 text-brand-500"}`}
                          >
                                                                               {" "}
                            <Icon className="h-4 w-4" />                       
                                                                           
                             {" "}
                          </div>
                                                                               
                                           {" "}
                          <div className="min-w-0">
                                                                               {" "}
                                                     {" "}
                            <p className="text-xs font-bold text-[var(--text-primary)]">
                                                          {item.label}         
                                             {" "}
                            </p>
                                                                               {" "}
                                                     {" "}
                            <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                                                         {" "}
                              {item.run
                                ? formatRelative(getRunTime(item.run))
                                : "No run available"}
                                                       {" "}
                            </p>
                                                                               
                                                 {" "}
                          </div>
                                                                               
                                       {" "}
                        </div>
                                                                               
                                 {" "}
                        <div className="mt-5 flex items-end justify-between gap-3">
                                                                               
                                           {" "}
                          <div>
                                                                               {" "}
                                                     {" "}
                            <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                                                          {item.value}         
                                             {" "}
                            </p>
                                                                               {" "}
                                                     {" "}
                            <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                                                          {item.valueLabel}     
                                                 {" "}
                            </p>
                                                                               
                                                 {" "}
                          </div>
                                                                               
                                           {" "}
                          <span
                            className={`text-[10px] font-bold ${success ? "text-success-500" : item.run?.status === "FAILED" ? "text-danger-500" : "text-[var(--text-tertiary)]"}`}
                          >
                                                                               {" "}
                                                     {" "}
                            {item.run ? toTitleCase(item.run.status) : "—"}     
                                                                               
                                           {" "}
                          </span>
                                                                               
                                       {" "}
                        </div>
                                                                               
                             {" "}
                      </div>
                    );
                  })}
                                                             {" "}
                </div>
                                                         {" "}
                <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--border-subtle)] pt-5">
                                                                 {" "}
                  <div>
                                                                         {" "}
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                                          Document duration                
                       {" "}
                    </p>
                                                                         {" "}
                    <p className="mt-1 text-xs font-bold text-[var(--text-primary)]">
                                         {" "}
                      {formatDuration(lastDocument?.durationMs)}               
                       {" "}
                    </p>
                                                                     {" "}
                  </div>
                                                                 {" "}
                  <div>
                                                                         {" "}
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                                          Master duration                  {" "}
                    </p>
                                                                         {" "}
                    <p className="mt-1 text-xs font-bold text-[var(--text-primary)]">
                                         {" "}
                      {formatDuration(lastMaster?.durationMs)}               
                       {" "}
                    </p>
                                                                     {" "}
                  </div>
                                                                 {" "}
                  <div>
                                                                         {" "}
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                                          Last successful                  {" "}
                    </p>
                                                                         {" "}
                    <p className="mt-1 text-xs font-bold text-success-500">
                                         {" "}
                      {lastSuccessful
                        ? toTitleCase(lastSuccessful.syncType)
                        : "—"}
                                       {" "}
                    </p>
                                                                     {" "}
                  </div>
                                                                 {" "}
                  <div>
                                                                         {" "}
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                                          Last failed                  {" "}
                    </p>
                                                                         {" "}
                    <p
                      className={`mt-1 text-xs font-bold ${lastFailed ? "text-danger-500" : "text-[var(--text-primary)]"}`}
                    >
                                         {" "}
                      {lastFailed ? toTitleCase(lastFailed.syncType) : "None"} 
                                     {" "}
                    </p>
                                                                     {" "}
                  </div>
                                                             {" "}
                </div>
                                                     {" "}
              </div>
                                             {" "}
            </div>
                                         {" "}
            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-sm">
                                                 {" "}
              <div className="border-b border-[var(--border-subtle)] px-5 py-5 sm:px-6">
                                                         {" "}
                <div className="flex items-center gap-2">
                                                                 {" "}
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                      Sync Activity                {" "}
                  </h2>
                                                                 {" "}
                  <span className="rounded-full bg-[var(--surface-sunken)] px-2 py-0.5 text-[9px] font-bold text-[var(--text-tertiary)]">
                                      Recent                {" "}
                  </span>
                                                             {" "}
                </div>
                                                         {" "}
                <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                                  Latest ERP synchronization events.            
                   {" "}
                </p>
                                                     {" "}
              </div>
                                                 {" "}
              <div className="p-5 sm:p-6">
                                                         {" "}
                {recentLogs.length > 0 ? (
                  <div className="relative space-y-5">
                                                                         {" "}
                    <div className="absolute bottom-5 left-[15px] top-5 w-px bg-[var(--border-subtle)]" />
                                                                         {" "}
                    {[...recentLogs]

                      .sort(
                        (a, b) =>
                          new Date(getRunTime(b)) - new Date(getRunTime(a)),
                      )

                      .map((run) => {
                        const success = isSuccessfulRun(run);

                        const failed = run.status === "FAILED";

                        const Icon =
                          run.syncType === "DOCUMENTS" ? FileStack : Database;

                        return (
                          <div
                            key={`${run.syncType}-${getRunTime(run)}`}
                            className="relative flex gap-3.5"
                          >
                                                                               {" "}
                                                     {" "}
                            <div
                              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-[var(--surface)] ${success ? "bg-success-500/10 text-success-500" : failed ? "bg-danger-500/10 text-danger-500" : "bg-warning-500/10 text-warning-500"}`}
                            >
                                                                               
                                                               {" "}
                              <Icon className="h-3.5 w-3.5" />                 
                                                                               
                                         {" "}
                            </div>
                                                                               {" "}
                                                     {" "}
                            <div className="min-w-0 flex-1">
                                                                               
                                                               {" "}
                              <div className="flex items-center justify-between gap-3">
                                                                               
                                                                         {" "}
                                <p className="text-xs font-bold text-[var(--text-primary)]">
                                                                 {" "}
                                  {toTitleCase(run.syncType)} Sync              
                                                 {" "}
                                </p>
                                                                               
                                                                         {" "}
                                <span
                                  className={`shrink-0 text-[10px] font-bold ${success ? "text-success-500" : failed ? "text-danger-500" : "text-warning-500"}`}
                                >
                                                                               
                                                                               
                                      {toTitleCase(run.status)}                 
                                                                               
                                                             {" "}
                                </span>
                                                                               
                                                                     {" "}
                              </div>
                                                                               
                                                               {" "}
                              <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
                                                                               
                                                                         {" "}
                                {formatRelative(getRunTime(run))}               
                                                                               
                                                         {" "}
                                {run.durationMs
                                  ? ` · ${formatDuration(run.durationMs)}`
                                  : ""}
                                                                               
                                                                     {" "}
                              </p>
                                                                               
                                                           {" "}
                            </div>
                                                                               
                                                 {" "}
                          </div>
                        );
                      })}
                                                                     {" "}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                                                                         {" "}
                    <Activity className="mx-auto h-7 w-7 text-[var(--text-tertiary)]" />
                                                                         {" "}
                    <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                                          No synchronization activity yet.      
                                 {" "}
                    </p>
                                                                     {" "}
                  </div>
                )}
                                                     {" "}
              </div>
                                             {" "}
            </div>
                                     {" "}
          </section>
                                 {" "}
          {!hasEverSynced && !isRunning && (
            <section className="overflow-hidden rounded-2xl border border-warning-500/20 bg-warning-500/5">
                                                 {" "}
              <div className="flex items-start gap-3.5 p-5">
                                                         {" "}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning-500/10 text-warning-500">
                                                 {" "}
                  <AlertTriangle className="h-4 w-4" />                         
                                   {" "}
                </div>
                                                         {" "}
                <div className="min-w-0">
                                                                 {" "}
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                                      ERP synchronization is not initialized    
                               {" "}
                  </p>
                                                                 {" "}
                  <p className="mt-1 text-[11px] leading-5 text-[var(--text-tertiary)]">
                                                        Run a Master Sync first.
                    Once master data is                   available, run
                    Document Sync to import ERP documents.                      
                                               {" "}
                  </p>
                                                             {" "}
                </div>
                                                     {" "}
              </div>
                                             {" "}
            </section>
          )}
                                 {" "}
          {syncActive && (
            <section className="overflow-hidden rounded-2xl border border-warning-500/20 bg-[var(--surface)] shadow-sm">
                                                 {" "}
              <div className="flex items-center gap-3.5 px-5 py-4 sm:px-6">
                                                         {" "}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning-500/10 text-warning-500">
                                                 {" "}
                  <RefreshCw className="h-4 w-4 animate-spin" />               
                                             {" "}
                </div>
                                                         {" "}
                <div className="min-w-0 flex-1">
                                                                 {" "}
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                                                                         {" "}
                    {currentRun
                      ? `${toTitleCase(currentRun.syncType)} Sync is running`
                      : "Starting synchronization"}
                                                                     {" "}
                  </p>
                                                                 {" "}
                  <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                                      Please wait until the current
                    synchronization completes.                {" "}
                  </p>
                                                             {" "}
                </div>
                                                         {" "}
                {currentRun?.startTime && (
                  <span className="hidden text-[10px] text-[var(--text-tertiary)] sm:block">
                                                        Started                
                      {formatRelative(currentRun.startTime)}                   
                               {" "}
                  </span>
                )}
                                                     {" "}
              </div>
                                                 {" "}
              <div className="h-1 overflow-hidden bg-warning-500/10">
                                                         {" "}
                <div className="h-full w-1/3 animate-pulse rounded-r bg-warning-500" />
                                                     {" "}
              </div>
                                             {" "}
            </section>
          )}
                                 {" "}
          <section className="flex items-start gap-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-sm">
                                         {" "}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                                      <ShieldCheck className="h-4 w-4" />       
                         {" "}
            </div>
                                         {" "}
            <div className="min-w-0">
                                                 {" "}
              <p className="text-xs font-bold text-[var(--text-primary)]">
                              Enterprise synchronization boundary          
                 {" "}
              </p>
                                                 {" "}
              <p className="mt-0.5 text-[11px] leading-5 text-[var(--text-tertiary)]">
                                            Manual synchronization always uses
                the currently               selected tenant ERP connection.
                Protected ERP credentials remain               outside this
                dashboard.                        {" "}
              </p>
                                             {" "}
            </div>
                                     {" "}
          </section>
                             {" "}
        </main>
                     
      </AppCard>
    </div>
  );
}

function ErpSyncGuideModal({ open, onClose }) {
  const steps = [
    {
      icon: Database,

      title: "Select the ERP to synchronize",

      desc: "When multiple active SAP ERP connections are assigned to the tenant, select the SAP ERP you want to use. Master Sync and Document Sync will use only that selected ERP connection.",
    },

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
                SAP           Integration Guide                {" "}
        </span>
      }
      footer={
        <AppButton variant="primary" onClick={onClose}>
                              Got it                {" "}
        </AppButton>
      }
    >
                       {" "}
      <div className="space-y-5">
                               {" "}
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div key={step.title} className="flex gap-3.5">
                                                       {" "}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400">
                                                <Icon className="h-4 w-4" />   
                                       {" "}
              </div>
                                                       {" "}
              <div className="min-w-0">
                                                               {" "}
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                      {index + 1}. {step.title} 
                                                                 {" "}
                </p>
                                                               {" "}
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
                                                      {step.desc}               {" "}
                                 {" "}
                </p>
                                                           {" "}
              </div>
                                                   {" "}
            </div>
          );
        })}
                           {" "}
      </div>
                   {" "}
    </AppModal>
  );
}
