// src/features/sapSync/pages/JobHistoryPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Eye,
  ScrollText,
  Info,
  Sparkles,
  Database,
  ListTree,
  Filter,
  Download,
} from "lucide-react";

import AppCard, { CardHeader } from "../../../components/ui/Card";
import AppTable from "../../../components/ui/Table";
import AppButton from "../../../components/ui/Button";
import AppFilter from "../../../components/ui/FilterDropdown";
import Pagination from "../../../components/ui/Pagination";
import StatusBadge from "../../../components/ui/StatusBadge";
import AppModal from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";

import { SapSyncApi } from "../api";
import { formatDateTime, formatDuration, statusTone } from "../constants";
import { useSapErpConnections } from "../hooks/useSapErpConnections";

const PAGE_SIZE = 15;

const SYNC_TYPE_OPTIONS = [
  { label: "Master", value: "MASTER" },
  { label: "Document", value: "DOCUMENT" },
];

const TRIGGER_OPTIONS = [
  { label: "Manual", value: "MANUAL" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Retry", value: "RETRY" },
];

const STATUS_OPTIONS = [
  { label: "Success", value: "SUCCESS" },
  { label: "Partial Success", value: "PARTIAL_SUCCESS" },
  { label: "Failed", value: "FAILED" },
  { label: "Running", value: "RUNNING" },
];

export default function JobHistoryPage({ onNavigate }) {
  const { toast } = useToast();

  const {
    connections,
    loadingConnections,
  } = useSapErpConnections();

  const [rows, setRows] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [syncType, setSyncType] = useState(null);
  const [triggerType, setTriggerType] = useState(null);
  const [status, setStatus] = useState(null);
  const [erpConfigId, setErpConfigId] = useState(null);

  const [detail, setDetail] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  /**
   * Build ERP filter options from the active tenant ERP connections.
   *
   * We intentionally keep all active ERP connections here because
   * Job History is tenant-wide history, not SAP-only history.
   */
  const erpOptions = useMemo(() => {
    const activeConnections = (connections || []).filter(
      (connection) =>
        connection?.isActive !== false &&
        connection?.status !== "INACTIVE"
    );

    return activeConnections.map((connection) => {
      const erpConfig = connection?.erpConfig || {};

      const id =
        connection?.erpConfigId ??
        erpConfig?.id ??
        connection?.id ??
        null;

      const name =
        connection?.name ||
        erpConfig?.name ||
        connection?.erpName ||
        `ERP ${id ?? ""}`.trim();

      const type =
        connection?.erpType ||
        erpConfig?.erpType ||
        "";

      return {
        label: type ? `${name} · ${type}` : name,
        value: String(id),
      };
    });
  }, [connections]);

  /**
   * Load execution history.
   *
   * erpConfigId is sent only when the user selected an ERP filter.
   * Existing filters continue to work exactly as before.
   */
  const load = () => {
    setLoading(true);

    const params = {
      page,
      limit: PAGE_SIZE,
      syncType,
      triggerType,
      status,
    };

    if (
      erpConfigId !== null &&
      erpConfigId !== undefined &&
      erpConfigId !== ""
    ) {
      params.erpConfigId = Number(erpConfigId);
    }

    SapSyncApi.getLogs(params)
      .then((res) => {
        setRows(Array.isArray(res.data) ? res.data : []);

        setPageInfo(
          res.pagination || {
            total: 0,
            page: 1,
            totalPages: 1,
          }
        );
      })
      .catch((e) => {
        toast({
          title: "Could not load job history",
          description: e.message,
          tone: "error",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [
    page,
    syncType,
    triggerType,
    status,
    erpConfigId,
  ]); // eslint-disable-line

  /**
   * Whenever a filter changes, return to page 1.
   */
  useEffect(() => {
    setPage(1);
  }, [syncType, triggerType, status, erpConfigId]);

  /**
   * Resolve ERP information from different possible backend response shapes.
   *
   * This keeps the UI backward-compatible with existing logs while
   * supporting the new multi-ERP log structure.
   */
  const getErpInfo = (row) => {
    const nested =
      row?.erpConfig ||
      row?.erpConnection ||
      row?.erp ||
      null;

    const id =
      row?.erpConfigId ??
      row?.erp_connection_id ??
      nested?.id ??
      nested?.erpConfigId ??
      null;

    const name =
      row?.erpName ||
      row?.erpConfigName ||
      row?.erpConnectionName ||
      nested?.name ||
      nested?.erpName ||
      null;

    const type =
      row?.erpType ||
      nested?.erpType ||
      null;

    return {
      id,
      name,
      type,
    };
  };

  const columns = useMemo(
    () => [
      {
        key: "syncType",
        header: "Exe Name",
        render: (r) => (
          <span className="font-medium text-[var(--text-primary)]">
            {r.syncType} SYNC
          </span>
        ),
      },

      {
        key: "erp",
        header: "ERP",
        render: (r) => {
          const erp = getErpInfo(r);

          if (!erp.id && !erp.name) {
            return (
              <span className="text-xs text-[var(--text-tertiary)]">
                —
              </span>
            );
          }

          return (
            <div className="min-w-[150px]">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {erp.name || `ERP ${erp.id}`}
              </p>

              <div className="mt-0.5 flex items-center gap-1.5">
                {erp.type && (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                    {erp.type}
                  </span>
                )}

                {erp.id && (
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    #{erp.id}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },

      {
        key: "startTime",
        header: "Started",
        render: (r) => formatDateTime(r.startTime),
      },

      {
        key: "endTime",
        header: "Completed",
        render: (r) => formatDateTime(r.endTime),
      },

      {
        key: "durationMs",
        header: "Duration",
        render: (r) => formatDuration(r.durationMs),
      },

      {
        key: "status",
        header: "Status",
        render: (r) => (
          <StatusBadge
            status={r.status}
            tone={statusTone(r.status)}
          />
        ),
      },

      {
        key: "recordsFetched",
        header: "Records Read",
      },

      {
        key: "recordsCreated",
        header: "Imported",
      },

      {
        key: "recordsUpdated",
        header: "Updated",
      },

      {
        key: "recordsSkipped",
        header: "Skipped",
      },

      {
        key: "recordsFailed",
        header: "Errors",
        render: (r) =>
          r.recordsFailed > 0 ? (
            <span className="font-medium text-danger-600">
              {r.recordsFailed}
            </span>
          ) : (
            "0"
          ),
      },

      {
        key: "actions",
        header: "",
        render: (r) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDetail(r);
            }}
            className="rounded-app-sm p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] hover:text-brand-500"
            title="View Details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        ),
      },
    ],
    []
  );

  const selectedDetailErp = detail
    ? getErpInfo(detail)
    : {
        id: null,
        name: null,
        type: null,
      };

  return (
    <div className="space-y-4">
      <JobHistoryGuideModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
      />

      <AppCard>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <span className="text-lg font-bold text-[var(--text-primary)]">
                Execution History
              </span>

              <button
                type="button"
                onClick={() => setShowGuide(true)}
                aria-label="View Job History guide"
                className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white ring-4 ring-brand-500/20 animate-pulse transition-colors hover:animate-none hover:bg-brand-600"
              >
                <Info className="h-3 w-3" />
              </button>
            </span>
          }
          subtitle="Every ERP Master / Document / Retry synchronization run for this tenant."
          action={
            <div className="flex items-center gap-2">
              <AppButton
                variant="secondary"
                size="sm"
                icon={ScrollText}
                onClick={() =>
                  onNavigate?.("SAP_SYNC_LOG_VIEWER")
                }
              >
                Log Viewer
              </AppButton>

              <AppButton
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={load}
                disabled={loading}
              >
                Refresh
              </AppButton>
            </div>
          }
        />

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <AppFilter
            label="ERP"
            options={erpOptions}
            value={erpConfigId}
            onChange={setErpConfigId}
            disabled={loadingConnections}
          />

          <AppFilter
            label="Job"
            options={SYNC_TYPE_OPTIONS}
            value={syncType}
            onChange={setSyncType}
          />

          <AppFilter
            label="Trigger"
            options={TRIGGER_OPTIONS}
            value={triggerType}
            onChange={setTriggerType}
          />

          <AppFilter
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />
        </div>

        {/* Active ERP context */}
        {connections?.length > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-app-md border border-brand-500/15 bg-brand-500/5 px-3 py-2.5">
            <Database className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />

            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Multi-ERP Execution History
              </p>

              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-tertiary)]">
                Job History contains synchronization runs for the
                tenant's assigned ERP connections. Use the ERP filter
                to view runs for a specific ERP.
              </p>
            </div>
          </div>
        )}

        <AppTable
          columns={columns}
          rows={rows}
          loading={loading}
          onRowClick={setDetail}
          emptyTitle="No sync runs yet"
        />

        <Pagination
          page={pageInfo.page}
          totalPages={pageInfo.totalPages}
          onChange={setPage}
          totalItems={pageInfo.total}
          pageSize={PAGE_SIZE}
        />
      </AppCard>

      {/* Job Details */}
      <AppModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Job Run Details"
        size="lg"
      >
        {detail && (
          <div className="space-y-5">
            {/* ERP Context */}
            <div className="rounded-app-md border border-brand-500/15 bg-brand-500/5 p-4">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                    ERP Connection
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                    {selectedDetailErp.name ||
                      (selectedDetailErp.id
                        ? `ERP ${selectedDetailErp.id}`
                        : "ERP information not available")}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
                    {selectedDetailErp.type && (
                      <span>
                        Type: {selectedDetailErp.type}
                      </span>
                    )}

                    {selectedDetailErp.id && (
                      <span>
                        ERP Configuration ID:{" "}
                        {selectedDetailErp.id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field
                label="Job"
                value={`${detail.syncType} SYNC`}
              />

              <Field
                label="Trigger"
                value={detail.triggerType}
              />

              <Field
                label="Status"
                value={
                  <StatusBadge
                    status={detail.status}
                    tone={statusTone(detail.status)}
                  />
                }
              />

              <Field
                label="Started"
                value={formatDateTime(detail.startTime)}
              />

              <Field
                label="Completed"
                value={formatDateTime(detail.endTime)}
              />

              <Field
                label="Duration"
                value={formatDuration(detail.durationMs)}
              />

              <Field
                label="Records Read"
                value={detail.recordsFetched}
              />

              <Field
                label="Imported"
                value={detail.recordsCreated}
              />

              <Field
                label="Updated"
                value={detail.recordsUpdated}
              />

              <Field
                label="Skipped"
                value={detail.recordsSkipped}
              />

              <Field
                label="Failed"
                value={detail.recordsFailed}
              />

              <Field
                label="Pending Classification"
                value={detail.recordsPendingClassification}
              />
            </div>

            {detail.summary && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                  Per-Entity Summary
                </p>

                <pre className="max-h-40 overflow-auto rounded-app-md bg-[var(--surface-sunken)] p-3 text-xs text-[var(--text-secondary)]">
                  {JSON.stringify(
                    detail.summary,
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

            {Array.isArray(detail.errors) &&
              detail.errors.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-danger-600">
                    Errors ({detail.errors.length})
                  </p>

                  <div className="max-h-40 space-y-1.5 overflow-auto">
                    {detail.errors.map((err, i) => (
                      <div
                        key={i}
                        className="rounded-app-sm bg-danger-50 px-3 py-2 text-xs text-danger-700 dark:bg-danger-500/10 dark:text-danger-400"
                      >
                        <span className="font-mono">
                          {err.entityType ||
                            err.code ||
                            "—"}
                        </span>
                        : {err.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </AppModal>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--text-tertiary)]">
        {label}
      </p>

      <p className="mt-0.5 text-sm text-[var(--text-primary)]">
        {value ?? "—"}
      </p>
    </div>
  );
}

function JobHistoryGuideModal({ open, onClose }) {
  const steps = [
    {
      icon: ScrollText,
      title: "View job runs",
      desc: "Every ERP Master, Document, and Retry synchronization run for this tenant is listed here with its status and record counts.",
    },
    {
      icon: Database,
      title: "Identify the ERP",
      desc: "The ERP column shows which assigned ERP connection was used for the synchronization run. Use the ERP filter to focus on one connection.",
    },
    {
      icon: Filter,
      title: "Filter the list",
      desc: "Use the ERP, Job, Trigger, and Status filters above the table to narrow down specific synchronization runs.",
    },
    {
      icon: Eye,
      title: "Inspect a run",
      desc: "Click any row or the eye icon to see full details — ERP connection, record counts, per-entity summary, and any errors encountered.",
    },
    {
      icon: RefreshCw,
      title: "Refresh anytime",
      desc: "Click Refresh to pull the latest job runs without reloading the page.",
    },
  ];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          Job History — Guide
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