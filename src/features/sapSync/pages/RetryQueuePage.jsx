// src/features/sapSync/pages/RetryQueuePage.jsx
//
// MULTI-ERP FIX — this page is new.
//
// SapSyncApi.getRetryQueue() (-> GET /sap-sync/retry-queue) has existed
// on the frontend all along but nothing ever called it, so the retry
// queue was invisible — the only thing a Tenant Admin could do was
// mash "Retry Failed" on the Document Sync page and hope. Now that the
// backend retry queue is ERP-aware (see SapSyncRetryQueue's erpConfigId
// column), this page gives it a real view: what's queued, which ERP it
// belongs to, how many attempts it's had, its last error — and lets the
// Tenant Admin retry a specific ERP's failures on purpose, the same way
// Master Sync / Document Sync already let you pick an ERP to act on.

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  RotateCcw,
  Eye,
  Info,
  Sparkles,
  ListChecks,
  AlertTriangle,
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
import { useSapErpConnections } from "../hooks/useSapErpConnections";
import ErpConnectionSelect from "../components/ErpConnectionSelect";
import {
  formatDateTime,
  statusTone,
  RETRY_ENTITY_TYPE_OPTIONS,
  RETRY_QUEUE_STATUS_OPTIONS,
} from "../constants";

const PAGE_SIZE = 15;

function entityTypeLabel(value) {
  const match = RETRY_ENTITY_TYPE_OPTIONS.find((o) => o.value === value);
  return match ? match.label : value || "—";
}

export default function RetryQueuePage() {
  const { toast } = useToast();

  /*
   * MULTI ERP CONTEXT
   *
   * Same selector pattern as Master Sync / Document Sync: single active
   * SAP ERP -> no selector shown, request just goes unscoped. Multiple
   * active SAP ERPs -> selector shown, and both the queue VIEW and the
   * "Retry Failed" ACTION are scoped to whichever ERP is selected here.
   */
  const {
    connections,
    sapConnections,
    selectedErpConfigId,
    setSelectedErpConfigId,
    erpConfigIdForRequest,
    showSelector,
  } = useSapErpConnections();

  const [rows, setRows] = useState([]);
  const [pageInfo, setPageInfo] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [entityType, setEntityType] = useState(null);
  const [status, setStatus] = useState(null);

  const [retrying, setRetrying] = useState(false);
  const [detail, setDetail] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const erpNameById = useMemo(() => {
    const map = {};
    (connections || []).forEach((connection) => {
      const id = connection?.erpConfigId;
      if (id === undefined || id === null) return;
      map[id] = connection?.name || connection?.erpName || `ERP #${id}`;
    });
    return map;
  }, [connections]);

  const load = () => {
    setLoading(true);

    const params = {
      page,
      limit: PAGE_SIZE,
      entityType: entityType || undefined,
      status: status || undefined,
    };

    // Only scope the VIEW to an ERP once one is actually selected —
    // leaving it off shows every queued failure for the tenant across
    // every ERP, same as before this page existed.
    if (erpConfigIdForRequest) {
      params.erpConfigId = erpConfigIdForRequest;
    }

    SapSyncApi.getRetryQueue(params)
      .then((res) => {
        setRows(Array.isArray(res.data) ? res.data : []);
        setPageInfo(res.pagination || { total: 0, page: 1, totalPages: 1 });
      })
      .catch((e) =>
        toast({
          title: "Could not load retry queue",
          description: e.message,
          tone: "error",
        }),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, entityType, status, erpConfigIdForRequest]); // eslint-disable-line

  useEffect(() => {
    setPage(1);
  }, [entityType, status, erpConfigIdForRequest]);

  async function retryFailed() {
    if (showSelector && !erpConfigIdForRequest) {
      toast({
        title: "Select an ERP first",
        description:
          "Please select the ERP connection whose queued failures you want to retry.",
        tone: "error",
      });
      return;
    }

    setRetrying(true);

    try {
      const res = await SapSyncApi.triggerRetry(
        entityType || undefined,
        erpConfigIdForRequest,
      );

      toast({
        title: "Retry completed",
        description: `Resolved: ${res.data?.recordsCreated ?? 0}, Still failing: ${
          res.data?.recordsFailed ?? 0
        }`,
        tone: "success",
      });

      load();
    } catch (e) {
      toast({
        title: "Retry failed",
        description: e.message,
        tone: "error",
      });
    } finally {
      setRetrying(false);
    }
  }

  const columns = [
    {
      key: "entityType",
      header: "Entity Type",
      render: (r) => (
        <span className="text-xs font-medium text-[var(--text-primary)]">
          {entityTypeLabel(r.entityType)}
        </span>
      ),
    },
    {
      key: "referenceCode",
      header: "Reference Code",
      render: (r) => (
        <span className="font-mono text-xs">{r.referenceCode || "—"}</span>
      ),
    },
    {
      key: "erp",
      header: "ERP",
      render: (r) =>
        r.erpConfigId ? (
          <span className="text-xs text-[var(--text-secondary)]">
            {erpNameById[r.erpConfigId] || `ERP #${r.erpConfigId}`}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-tertiary)]">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} tone={statusTone(r.status)} />,
    },
    {
      key: "attempts",
      header: "Attempts",
      render: (r) => (
        <span className="text-xs">
          {r.attempts ?? 0} / {r.maxAttempts ?? "—"}
        </span>
      ),
    },
    {
      key: "lastError",
      header: "Last Error",
      render: (r) => (
        <span
          className="block max-w-[220px] truncate text-xs text-[var(--text-tertiary)]"
          title={r.lastError || ""}
        >
          {r.lastError || "—"}
        </span>
      ),
    },
    {
      key: "nextRetryAt",
      header: "Next Retry",
      render: (r) => (
        <span className="whitespace-nowrap text-xs">
          {formatDateTime(r.nextRetryAt)}
        </span>
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
  ];

  return (
    <div className="space-y-4">
      <RetryQueueGuideModal open={showGuide} onClose={() => setShowGuide(false)} />

      <AppCard>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <span className="text-lg font-bold text-[var(--text-primary)]">
                Retry Queue
              </span>

              <button
                type="button"
                onClick={() => setShowGuide(true)}
                aria-label="View Retry Queue guide"
                className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white ring-4 ring-brand-500/20 animate-pulse transition-colors hover:animate-none hover:bg-brand-600"
              >
                <Info className="h-3 w-3" />
              </button>
            </span>
          }
          subtitle="SAP records that failed to sync and are waiting to be retried, per ERP connection."
          action={
            <div className="flex flex-wrap items-center gap-2">
              {showSelector && (
                <ErpConnectionSelect
                  connections={connections}
                  value={selectedErpConfigId}
                  onChange={setSelectedErpConfigId}
                />
              )}

              <AppButton variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading || retrying}>
                Refresh
              </AppButton>

              <AppButton
                size="sm"
                icon={RotateCcw}
                loading={retrying}
                disabled={retrying || (showSelector && !erpConfigIdForRequest)}
                onClick={retryFailed}
              >
                Retry Failed
              </AppButton>
            </div>
          }
        />

        {showSelector && !erpConfigIdForRequest && (
          <div className="mb-4 flex items-start gap-2 rounded-app-md border border-warning-500/20 bg-warning-500/5 px-3 py-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-500" />
            <p className="text-xs text-[var(--text-tertiary)]">
              This tenant has multiple SAP ERP connections. Select one above to
              view and retry its queued failures — retrying without a
              selection is not available here on purpose, so a retry never
              runs against the wrong ERP.
            </p>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <AppFilter
            label="Entity Type"
            value={entityType}
            onChange={setEntityType}
            options={RETRY_ENTITY_TYPE_OPTIONS}
          />

          <AppFilter
            label="Status"
            value={status}
            onChange={setStatus}
            options={RETRY_QUEUE_STATUS_OPTIONS}
          />
        </div>

        <AppTable
          columns={columns}
          rows={rows}
          loading={loading}
          onRowClick={(r) => setDetail(r)}
          emptyTitle="Nothing queued for retry"
          emptyDescription={
            sapConnections.length === 0
              ? "No active SAP ERP connections are assigned to this tenant."
              : "Every synced record made it through on the last run."
          }
        />

        <Pagination
          page={pageInfo.page}
          totalPages={pageInfo.totalPages}
          onChange={setPage}
          totalItems={pageInfo.total}
          pageSize={PAGE_SIZE}
        />
      </AppCard>

      <AppModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Retry Queue Item"
        size="md"
      >
        {detail && (
          <div className="space-y-4 text-sm">
            <dl className="space-y-3">
              <Row label="Entity Type" value={entityTypeLabel(detail.entityType)} />
              <Row label="Reference Code" value={detail.referenceCode || "—"} />
              <Row
                label="ERP Connection"
                value={
                  detail.erpConfigId
                    ? erpNameById[detail.erpConfigId] || `ERP #${detail.erpConfigId}`
                    : "—"
                }
              />
              <Row
                label="Status"
                value={<StatusBadge status={detail.status} tone={statusTone(detail.status)} />}
              />
              <Row label="Attempts" value={`${detail.attempts ?? 0} / ${detail.maxAttempts ?? "—"}`} />
              <Row label="Next Retry At" value={formatDateTime(detail.nextRetryAt)} />
              <Row label="Last Error" value={detail.lastError || "—"} />
            </dl>

            {Array.isArray(detail.history) && detail.history.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                  Attempt History
                </p>

                <div className="space-y-2">
                  {detail.history.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-app-sm border border-[var(--border-subtle)] px-3 py-2 text-xs"
                    >
                      <span className="text-[var(--text-secondary)]">
                        Attempt {entry.attempt} · {formatDateTime(entry.timestamp)}
                      </span>
                      <span className="max-w-[220px] truncate text-danger-600" title={entry.error}>
                        {entry.error}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                Queued Payload
              </p>

              <pre className="max-h-56 overflow-auto rounded-app-md bg-[var(--surface-sunken)] p-3 text-xs text-[var(--text-secondary)]">
                {JSON.stringify(detail.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-2 last:border-0">
      <dt className="text-[var(--text-tertiary)]">{label}</dt>
      <dd className="max-w-[60%] break-words text-right font-medium text-[var(--text-primary)]">
        {value}
      </dd>
    </div>
  );
}

function RetryQueueGuideModal({ open, onClose }) {
  const steps = [
    {
      icon: ListChecks,
      title: "See what's waiting",
      desc: "Every SAP record that failed during Master or Document Sync lands here, tagged with the ERP connection it failed against.",
    },
    {
      icon: RotateCcw,
      title: "Select an ERP, then retry",
      desc: "When multiple SAP ERPs are assigned, pick one before retrying. Retry Failed only re-attempts that ERP's queued failures, using that ERP's own connection — never a different one.",
    },
    {
      icon: AlertTriangle,
      title: "Abandoned records",
      desc: "A record stops retrying automatically once it exceeds its max attempts and is marked Abandoned. Check the Last Error and payload before retrying it again by hand.",
    },
  ];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          Retry Queue — Guide
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