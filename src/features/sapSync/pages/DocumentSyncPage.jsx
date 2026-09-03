// src/features/sapSync/pages/DocumentSyncPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshCw,
  FileStack,
  RotateCcw,
  Eye,
  FileWarning,
  Info, // ADD
  Sparkles, // ADD
} from "lucide-react";
import AppCard, { CardHeader } from "../../../components/ui/Card";
import AppTable from "../../../components/ui/Table";
import AppButton from "../../../components/ui/Button";
import AppSearch from "../../../components/ui/SearchInput";
import AppFilter from "../../../components/ui/FilterDropdown";
import Pagination from "../../../components/ui/Pagination";
import StatusBadge from "../../../components/ui/StatusBadge";
import AppModal from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import { SapSyncApi } from "../api";
import {
  formatDateTime,
  DOC_SYNC_STATUS_OPTIONS,
  CLASSIFICATION_OPTIONS,
  statusTone,
} from "../constants";

const PAGE_SIZE = 10;

/* ---------------------------------------------------------
 * Helpers — same pattern used on PendingClassificationPage
 * --------------------------------------------------------- */

// "0000000000000010000000243" -> "10000000243"
function trimLeadingZeros(value) {
  if (!value) return value;
  const trimmed = String(value).replace(/^0+(?=\d)/, "");
  return trimmed || "0";
}

// Short value by default, full value in a floating tooltip on hover
function SapIdCell({ value }) {
  const short = trimLeadingZeros(value);
  const isTrimmed = short !== value;

  return (
    <span className="group/id relative inline-flex max-w-[100px] cursor-default font-mono text-[11px] text-[var(--text-primary)]">
      <span className="truncate">{short}</span>
      {isTrimmed && (
        <span className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden whitespace-nowrap rounded-md border border-[var(--border-primary)] bg-[var(--surface-2)] px-2 py-1 text-[11px] font-mono text-[var(--text-primary)] shadow-lg group-hover/id:block">
          {value}
        </span>
      )}
    </span>
  );
}

// Truncated by default; on hover slides right-to-left just enough to
// reveal the full string, then resets when the mouse leaves
function MarqueeText({ text, className = "", widthClass = "max-w-[150px]" }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [hovering, setHovering] = useState(false);

  const handleEnter = () => {
    const container = containerRef.current;
    const label = textRef.current;
    if (!container || !label) return;
    const overflow = label.scrollWidth - container.clientWidth;
    if (overflow > 0) {
      setOffset(overflow);
      setHovering(true);
    }
  };

  const handleLeave = () => {
    setHovering(false);
    setOffset(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      title={text}
      className={`relative overflow-hidden whitespace-nowrap ${widthClass} ${className}`}
    >
      <span
        ref={textRef}
        className="inline-block ease-linear"
        style={{
          transform: hovering ? `translateX(-${offset}px)` : "translateX(0)",
          transition: hovering
            ? `transform ${Math.min(Math.max(offset * 8, 900), 4000)}ms linear`
            : "transform 200ms ease-out",
        }}
      >
        {text}
      </span>
    </div>
  );
}

// Plain truncated text with native tooltip fallback (Department / Category / Document Type)
function TruncatedText({ text, widthClass = "max-w-[90px]" }) {
  return (
    <span
      className={`block truncate text-[11px] ${widthClass}`}
      title={text || ""}
    >
      {text || "—"}
    </span>
  );
}

export default function DocumentSyncPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [classificationFilter, setClassificationFilter] = useState("COMPLETE");
  const [syncing, setSyncing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false); // ADD THIS

  const load = () => {
    setLoading(true);
    SapSyncApi.listDocuments({
      page,
      limit: PAGE_SIZE,
      sapDocumentId: search || undefined,
      sapSyncStatus: statusFilter || undefined,
      classification: classificationFilter || undefined,
    })
      .then((res) => {
        setRows(res.data || []);
        setPageInfo(res.pagination || { total: 0, page: 1, totalPages: 1 });
      })
      .catch((e) =>
        toast({
          title: "Could not load documents",
          description: e.message,
          tone: "error",
        }),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]); // eslint-disable-line
  useEffect(() => {
    setPage(1);
  }, [statusFilter, classificationFilter]); // eslint-disable-line
  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, classificationFilter]);

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    SapSyncApi.getDocumentDetail(detailId)
      .then((res) => setDetail(res.data))
      .catch((e) =>
        toast({
          title: "Could not load document details",
          description: e.message,
          tone: "error",
        }),
      )
      .finally(() => setDetailLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailId]);

  async function runSync() {
    setSyncing(true);
    try {
      await SapSyncApi.triggerDocumentSync();
      toast({ title: "Document Synchronization completed", tone: "success" });
      load();
    } catch (e) {
      toast({
        title: "Document Synchronization failed",
        description: e.message,
        tone: "error",
      });
    } finally {
      setSyncing(false);
    }
  }

  async function retryFailed() {
    setRetrying(true);
    try {
      const res = await SapSyncApi.triggerRetry("DOCUMENT");
      toast({
        title: "Retry completed",
        description: `Resolved: ${res.data?.recordsCreated ?? 0}, Still failing: ${res.data?.recordsFailed ?? 0}`,
        tone: "success",
      });
      load();
    } catch (e) {
      toast({ title: "Retry failed", description: e.message, tone: "error" });
    } finally {
      setRetrying(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        key: "sapDocumentId",
        header: "ERP Document ID",
        width: "110px",
        render: (r) => <SapIdCell value={r.sapDocumentId} />,
      },
      {
        key: "department",
        header: "Department",
        width: "90px",
        render: (r) => (
          <TruncatedText text={r.department} widthClass="max-w-[90px]" />
        ),
      },
      {
        key: "category",
        header: "Category",
        width: "90px",
        render: (r) => (
          <TruncatedText text={r.category} widthClass="max-w-[90px]" />
        ),
      },
      {
        key: "documentType",
        header: "Document Type",
        width: "100px",
        render: (r) => (
          <TruncatedText text={r.documentType} widthClass="max-w-[100px]" />
        ),
      },
      {
        key: "originalFilename",
        header: "Original Filename",
        width: "150px",
        render: (r) =>
          r.originalFilename ? (
            <MarqueeText
              text={r.originalFilename}
              widthClass="max-w-[145px]"
              className="text-[11px]"
            />
          ) : (
            <span className="text-[11px] text-[var(--text-tertiary)]">—</span>
          ),
      },
      {
        key: "hasOriginal",
        header: "Has Original",
        width: "80px",
        render: (r) => (
          <StatusBadge
            status={r.hasOriginal ? "Yes" : "No"}
            tone={r.hasOriginal ? "success" : "neutral"}
            showIcon={false}
            className="text-[10px]"
          />
        ),
      },
      {
        key: "classificationStatus",
        header: "Classification",
        width: "100px",
        render: (r) => (
          <StatusBadge
            status={r.classificationStatus}
            tone={statusTone(r.classificationStatus)}
            className="text-[10px]"
          />
        ),
      },
      {
        key: "mappedStatus",
        header: "Mapped",
        width: "80px",
        render: (r) => (
          <StatusBadge
            status={r.mappedStatus}
            tone={r.mappedStatus === "MAPPED" ? "success" : "warning"}
            showIcon={false}
            className="text-[10px]"
          />
        ),
      },
      {
        key: "importDate",
        header: "Import Date",
        width: "100px",
        render: (r) => (
          <span className="whitespace-nowrap text-[11px]">
            {formatDateTime(r.importDate)}
          </span>
        ),
      },
      {
        key: "syncStatus",
        header: "Sync Status",
        width: "90px",
        render: (r) => (
          <StatusBadge
            status={r.syncStatus}
            tone={statusTone(r.syncStatus)}
            className="text-[10px]"
          />
        ),
      },
      {
        key: "retryCount",
        header: "Retry Count",
        width: "70px",
        render: (r) =>
          r.retryCount > 0 ? (
            <span className="text-[11px] font-medium text-warning-600">
              {r.retryCount}
            </span>
          ) : (
            <span className="text-[11px]">0</span>
          ),
      },
      {
        key: "actions",
        header: "",
        width: "50px",
        render: (r) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDetailId(r.id);
            }}
            className="rounded-app-sm p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] hover:text-brand-500"
            title="Open Details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
          <DocumentSyncGuideModal open={showGuide} onClose={() => setShowGuide(false)} />   {/* ADD THIS LINE */}

      <AppCard>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <span className="text-lg font-bold text-[var(--text-primary)]">
                Data Synchronization
              </span>
              <button
                type="button"
                onClick={() => setShowGuide(true)}
                aria-label="View Document Synchronization guide"
                className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white ring-4 ring-brand-500/20 animate-pulse hover:animate-none hover:bg-brand-600 transition-colors"
              >
                <Info className="h-3 w-3" />
              </button>
            </span>
          }
          subtitle="Documents synchronized from ERP DocumentMetaSet (HasOriginal = 'X' only)."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <AppButton
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={load}
              >
                Refresh
              </AppButton>
              <AppButton
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                loading={retrying}
                onClick={retryFailed}
              >
                Retry Failed
              </AppButton>
              <AppButton
                size="sm"
                icon={FileStack}
                loading={syncing}
                onClick={runSync}
              >
                Sync Documents
              </AppButton>
            </div>
          }
        />

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <AppSearch
            value={search}
            onChange={setSearch}
            placeholder="Search by SAP Document ID…"
            className="max-w-xs"
          />
          <AppFilter
            label="Classification"
            value={classificationFilter}
            onChange={setClassificationFilter}
            options={CLASSIFICATION_OPTIONS}
          />
          <AppFilter
            label="Sync Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={DOC_SYNC_STATUS_OPTIONS}
          />
        </div>

        <div className="overflow-x-hidden">
          <AppTable
            columns={columns}
            rows={rows}
            loading={loading}
            onRowClick={(r) => setDetailId(r.id)}
            tableClassName="table-fixed w-full"
            emptyTitle="No synced documents found"
            emptyDescription="Run a Document Synchronization to pull documents from SAP."
          />
        </div>
        <Pagination
          page={pageInfo.page}
          totalPages={pageInfo.totalPages}
          onChange={setPage}
          totalItems={pageInfo.total}
          pageSize={PAGE_SIZE}
        />
      </AppCard>

      <AppModal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title="Document Details"
        size="lg"
      >
        {detailLoading && (
          <p className="text-sm text-[var(--text-tertiary)]">Loading…</p>
        )}
        {!detailLoading && detail && <DocumentDetailBody detail={detail} />}
      </AppModal>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-0.5 break-words text-sm text-[var(--text-primary)]">
        {value ?? "—"}
      </p>
    </div>
  );
}

// Same trim + hover-tooltip pattern used in the table, sized for the modal grid
function SapIdField({ value }) {
  const short = trimLeadingZeros(value);
  const isTrimmed = short !== value;
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-[var(--text-tertiary)]">
        SAP Document ID
      </p>
      <span className="group/id relative mt-0.5 inline-flex max-w-full cursor-default font-mono text-sm text-[var(--text-primary)]">
        <span className="truncate">{short || "—"}</span>
        {isTrimmed && (
          <span className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden whitespace-nowrap rounded-md border border-[var(--border-primary)] bg-[var(--surface-2)] px-2 py-1 text-xs font-mono text-[var(--text-primary)] shadow-lg group-hover/id:block">
            {value}
          </span>
        )}
      </span>
    </div>
  );
}

// Filename path truncated in the modal grid, full path on hover
function FilenameField({ value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-[var(--text-tertiary)]">
        Original Filename
      </p>
      {value ? (
        <MarqueeText
          text={value}
          widthClass="max-w-full"
          className="mt-0.5 text-sm"
        />
      ) : (
        <p className="mt-0.5 text-sm text-[var(--text-primary)]">—</p>
      )}
    </div>
  );
}

function DocumentDetailBody({ detail }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
        <SapIdField value={detail.sapDocumentId} />
        <Field label="Department" value={detail.department} />
        <Field label="Category" value={detail.category} />
        <Field label="Document Type" value={detail.documentType} />
        <FilenameField value={detail.originalFilename} />
        <Field label="Has Original" value={detail.hasOriginal ? "Yes" : "No"} />
      </div>

      <div className="rounded-app-md bg-[var(--surface-sunken)] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          Mapped Local Values
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Mapped Department" value={detail.mappedDepartment} />
          <Field label="Mapped Category" value={detail.mappedCategory} />
          <Field
            label="Mapped Document Type"
            value={detail.mappedDocumentType}
          />
          <Field
            label="Current Status"
            value={
              <StatusBadge
                status={detail.currentStatus}
                tone={statusTone(detail.currentStatus)}
              />
            }
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          Synchronization History
        </p>
        {detail.synchronizationHistory?.length ? (
          <div className="space-y-2">
            {detail.synchronizationHistory.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-app-sm border border-[var(--border-subtle)] px-3 py-2 text-xs"
              >
                <span className="text-[var(--text-secondary)]">
                  {formatDateTime(log.startTime)} · {log.triggerType}
                </span>
                <StatusBadge
                  status={log.status}
                  tone={statusTone(log.status)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)]">
            No related sync runs found.
          </p>
        )}
        {detail.retryHistory && (
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
            Retry attempts: {detail.retryHistory.attempts} · Last error:{" "}
            {detail.retryHistory.lastError || "—"}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          Raw SAP Metadata
        </p>
        <pre className="max-h-56 overflow-auto rounded-app-md bg-[var(--surface-sunken)] p-3 text-xs text-[var(--text-secondary)]">
          {JSON.stringify(detail.rawMetadata, null, 2)}
        </pre>
      </div>
    </div>
  );
}
function DocumentSyncGuideModal({ open, onClose }) {
  const steps = [
    {
      title: "Trigger a sync",
      desc: "Click Sync Documents to pull documents from SAP's DocumentMetaSet into this tenant.",
    },
    {
      title: "Filter what you see",
      desc: "Use the Classification and Sync Status filters, or search by SAP Document ID, to narrow the list.",
    },
    {
      title: "Check classification & mapping",
      desc: "The Classification and Mapped columns show whether a document was auto-classified and mapped to a local Department/Category/Document Type.",
    },
    {
      title: "Handle failures",
      desc: "Documents with a non-zero Retry Count failed at least once. Click Retry Failed to reprocess them.",
    },
    {
      title: "Open full details",
      desc: "Click any row or the eye icon to see mapped values, sync history, and raw SAP metadata for that document.",
    },
  ];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          Document Synchronization — Guide
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
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-[11px] font-bold text-brand-500">
              {i + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {s.title}
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
