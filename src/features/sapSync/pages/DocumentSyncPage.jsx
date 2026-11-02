// src/features/sapSync/pages/DocumentSyncPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshCw,
  FileStack,
  RotateCcw,
  Eye,
  Info,
  Sparkles,
} from "lucide-react";

import AppCard from "../../../components/ui/Card";
import AppTable from "../../../components/ui/Table";
import AppButton from "../../../components/ui/Button";
import AppSearch from "../../../components/ui/SearchInput";
import AppFilter from "../../../components/ui/FilterDropdown";
import Pagination from "../../../components/ui/Pagination";
import StatusBadge from "../../../components/ui/StatusBadge";
import AppModal from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";

import { SapSyncApi } from "../api";
import { useSapErpConnections } from "../hooks/useSapErpConnections";
import ErpConnectionSelect from "../components/ErpConnectionSelect";
import ErpMultiSelect from "../components/ErpMultiSelect";
import { summarizeMultiSync } from "../syncResultSummary";

import {
  formatDateTime,
  DOC_SYNC_STATUS_OPTIONS,
  CLASSIFICATION_OPTIONS,
  statusTone,
} from "../constants";

const PAGE_SIZE = 10;

/* ---------------------------------------------------------
 * Helpers
 * --------------------------------------------------------- */

// "0000000000000010000000243" -> "10000000243"
function trimLeadingZeros(value) {
  if (!value) return value;

  const trimmed = String(value).replace(/^0+(?=\d)/, "");

  return trimmed || "0";
}

// Short value by default, full value in floating tooltip
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

// Truncated text with hover animation
function MarqueeText({
  text,
  className = "",
  widthClass = "max-w-[150px]",
}) {
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
          transform: hovering
            ? `translateX(-${offset}px)`
            : "translateX(0)",
          transition: hovering
            ? `transform ${Math.min(
                Math.max(offset * 8, 900),
                4000,
              )}ms linear`
            : "transform 200ms ease-out",
        }}
      >
        {text}
      </span>
    </div>
  );
}

// Plain truncated text
function TruncatedText({
  text,
  widthClass = "max-w-[90px]",
}) {
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

  /* ---------------------------------------------------------
   * ERP CONNECTIONS
   * --------------------------------------------------------- */

  const {
    connections,
    loadingConnections,
    selectedErpConfigId,
    setSelectedErpConfigId,
    erpConfigIdForRequest,
    showSelector,
    showSyncAll,
    sapConnections,
    selectedErpConfigIds,
    toggleErpSelection,
    selectAllErps,
    clearErpSelection,
    erpConfigIdsForRequest,
    showMultiSelect,
  } = useSapErpConnections();

  /* ---------------------------------------------------------
   * DOCUMENT STATE
   * --------------------------------------------------------- */

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

  const [classificationFilter, setClassificationFilter] =
    useState("COMPLETE");

  const [syncing, setSyncing] = useState(false);

  const [retrying, setRetrying] = useState(false);

  const [detailId, setDetailId] = useState(null);

  const [detail, setDetail] = useState(null);

  const [detailLoading, setDetailLoading] = useState(false);

  const [showGuide, setShowGuide] = useState(false);

  /* ---------------------------------------------------------
   * LOAD DOCUMENTS
   * --------------------------------------------------------- */

  const load = () => {
    setLoading(true);

    SapSyncApi.listDocuments({
      page,
      limit: PAGE_SIZE,
      sapDocumentId: search || undefined,
      sapSyncStatus: statusFilter || undefined,
      classification: classificationFilter || undefined,
      erpConfigId: erpConfigIdForRequest || undefined,
    })
      .then((res) => {
        setRows(res.data || []);

        setPageInfo(
          res.pagination || {
            total: 0,
            page: 1,
            totalPages: 1,
          },
        );
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
  }, [statusFilter, classificationFilter, erpConfigIdForRequest]); // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);

    return () => clearTimeout(t);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, classificationFilter, erpConfigIdForRequest]);

  /* ---------------------------------------------------------
   * LOAD DOCUMENT DETAIL
   * --------------------------------------------------------- */

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

  /* ---------------------------------------------------------
   * DOCUMENT SYNC
   * --------------------------------------------------------- */

  async function runSync() {
    /*
     * Multiple SAP ERP connections:
     * user MUST explicitly select one.
     */
    if (showSelector && !erpConfigIdForRequest) {
      toast({
        title: "Select an ERP connection",
        description:
          "Please select the SAP ERP connection before starting Document Synchronization.",
        tone: "error",
      });

      return;
    }

    setSyncing(true);

    try {
      await SapSyncApi.triggerDocumentSync(
        erpConfigIdForRequest,
      );

      toast({
        title: "Document Synchronization completed",
        tone: "success",
      });

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

  /* ---------------------------------------------------------
   * RETRY FAILED
   * --------------------------------------------------------- */

  async function retryFailed() {
    setRetrying(true);

    try {
      if (showSelector && !erpConfigIdForRequest) {
        toast({
          title: "Select an ERP connection",
          description:
            "Please select the SAP ERP connection before retrying failed documents.",
          tone: "error",
        });
        return;
      }

      const res = await SapSyncApi.triggerRetry(
        "DOCUMENT",
        erpConfigIdForRequest,
      );

      toast({
        title: "Retry completed",
        description: `Resolved: ${
          res.data?.recordsCreated ?? 0
        }, Still failing: ${
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

  /* ---------------------------------------------------------
   * SYNC ALL ACTIVE ERPs
   * --------------------------------------------------------- */

  async function runSyncAll() {
    setSyncing(true);

    try {
      const res = await SapSyncApi.triggerSyncAllDocuments();

      const results = res?.data?.results || res?.results || [];
      const failedCount = results.filter((item) =>
        ["FAILED", "ERROR"].includes(String(item?.status || "").toUpperCase()),
      ).length;
      const successCount = results.filter((item) =>
        ["SUCCESS", "COMPLETED", "QUEUED", "STARTED", "RUNNING"].includes(
          String(item?.status || "").toUpperCase(),
        ),
      ).length;

      if (failedCount > 0 && successCount > 0) {
        toast({
          title: "Document Synchronization partially completed",
          description: `${successCount} ERP(s) completed/started and ${failedCount} ERP(s) failed.`,
          tone: "error",
        });
      } else if (failedCount > 0) {
        toast({
          title: "Document Synchronization failed",
          description: `${failedCount} ERP synchronization(s) failed.`,
          tone: "error",
        });
      } else {
        toast({
          title: "All ERP Document Synchronization started",
          description:
            successCount > 0
              ? `${successCount} ERP synchronization(s) completed/started successfully.`
              : "All active ERP synchronization jobs were started.",
          tone: "success",
        });
      }

      load();
    } catch (e) {
      toast({
        title: "Sync All failed",
        description: e.message,
        tone: "error",
      });
    } finally {
      setSyncing(false);
    }
  }

  /* ---------------------------------------------------------
   * SYNC SELECTED ERPs (flexible subset — e.g. 2 of 3)
   *
   * Sends erpConfigIds[] to /sap-sync/documents. Each ERP runs
   * independently on the backend; failures are reported per ERP.
   * --------------------------------------------------------- */

  async function runSyncSelected() {
    if (!erpConfigIdsForRequest) {
      toast({
        title: "Select at least one ERP",
        description: "Tick the ERP connections you want to synchronize.",
        tone: "error",
      });
      return;
    }

    setSyncing(true);

    try {
      const res = await SapSyncApi.triggerDocumentSync(
        erpConfigIdsForRequest,
      );

      toast(summarizeMultiSync(res, "Document Synchronization"));

      load();
    } catch (e) {
      toast({
        title: "Sync Selected failed",
        description: e.message,
        tone: "error",
      });
    } finally {
      setSyncing(false);
    }
  }

  /* ---------------------------------------------------------
   * TABLE COLUMNS
   * --------------------------------------------------------- */

  const columns = useMemo(
    () => [
      {
        key: "sapDocumentId",
        header: "ERP Document ID",
        width: "110px",
        render: (r) => (
          <SapIdCell value={r.sapDocumentId} />
        ),
      },

      {
        key: "department",
        header: "Department",
        width: "90px",
        render: (r) => (
          <TruncatedText
            text={r.department}
            widthClass="max-w-[90px]"
          />
        ),
      },

      {
        key: "category",
        header: "Category",
        width: "90px",
        render: (r) => (
          <TruncatedText
            text={r.category}
            widthClass="max-w-[90px]"
          />
        ),
      },

      {
        key: "documentType",
        header: "Document Type",
        width: "100px",
        render: (r) => (
          <TruncatedText
            text={r.documentType}
            widthClass="max-w-[100px]"
          />
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
            <span className="text-[11px] text-[var(--text-tertiary)]">
              —
            </span>
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
            tone={
              r.mappedStatus === "MAPPED"
                ? "success"
                : "warning"
            }
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
        key: "erpSource",
        header: "ERP Source",
        width: "90px",
        render: (r) => (
          <TruncatedText text={r.erpSource || "—"} widthClass="max-w-[90px]" />
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

  /* ---------------------------------------------------------
   * UI
   * --------------------------------------------------------- */

  return (
    <div className="space-y-5">
      <DocumentSyncGuideModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
      />

      <AppCard>
        {/* =======================================================
         * PREMIUM DMS SYNCHRONIZATION WORKSPACE
         * UI/layout only — all existing sync logic is preserved.
         * ======================================================= */}

        {/* PAGE IDENTITY */}
        {/* PAGE IDENTITY */}
<div className="relative overflow-hidden rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]">
  <div className="absolute inset-x-0 top-0 h-px bg-brand-500/30" />

          <div className="flex flex-col gap-5 p-5 lg:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-app-md bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
                  <FileStack className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                      Data Synchronization
                    </h1>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/15 bg-brand-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                      SAP Document Pipeline
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowGuide(true)}
                      aria-label="View Document Synchronization guide"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-brand-500/20 bg-brand-500/5 text-brand-500 transition-all hover:bg-brand-500/10 hover:text-brand-600"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--text-tertiary)]">
                    Synchronize ERP DocumentMetaSet records into e-Vault.
                    Only documents with <span className="font-semibold text-[var(--text-secondary)]">HasOriginal = 'X'</span> are imported.
                  </p>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-2">
                <AppButton
                  size="sm"
                  icon={FileStack}
                  loading={syncing}
                  disabled={
                    syncing ||
                    loadingConnections ||
                    (showSelector && !selectedErpConfigId)
                  }
                  onClick={runSync}
                >
                  Sync Documents
                </AppButton>
              </div>
            </div>

           {/* ERP CONTROL BAR */}
<div className="relative z-30 rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/45 p-4">
  <div className="flex flex-col gap-4">

    {/* ERP CONNECTION ROW */}
    <div className="flex flex-wrap items-center gap-3">

      {/* Label */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />

        {/* <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          ERP Connection
        </span> */}
      </div>

      {/* ERP SELECTOR */}
      {showSelector && (
        <div className="w-full sm:w-[275px] shrink-0">
          <ErpConnectionSelect
            connections={connections}
            value={selectedErpConfigId}
            onChange={setSelectedErpConfigId}
            className="w-full"
          />
        </div>
      )}

      {/* DEFAULT BADGE */}
      {/* {showSelector && (
        <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 text-[10px] font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Default
        </span>
      )} */}
    </div>

    {/* ACTION ROW */}
    <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3">

      {/* REFRESH */}
      <AppButton
        variant="secondary"
        size="sm"
        icon={RefreshCw}
        onClick={load}
      >
        Refresh
      </AppButton>

      {/* RETRY */}
      <AppButton
        variant="secondary"
        size="sm"
        icon={RotateCcw}
        loading={retrying}
        onClick={retryFailed}
      >
        Retry Failed
      </AppButton>

      {/* ERP MULTI SELECT */}
      {showMultiSelect && (
        <>
          <div className="shrink-0">
            <ErpMultiSelect
              connections={sapConnections}
              selectedIds={selectedErpConfigIds}
              onToggle={toggleErpSelection}
              onSelectAll={selectAllErps}
              onClear={clearErpSelection}
              disabled={syncing}
            />
          </div>

          {/* SYNC SELECTED */}
          <AppButton
            variant="secondary"
            size="sm"
            icon={FileStack}
            loading={syncing}
            disabled={
              syncing ||
              loadingConnections ||
              !erpConfigIdsForRequest
            }
            onClick={runSyncSelected}
          >
            Sync Selected ({selectedErpConfigIds.length})
          </AppButton>
        </>
      )}

      {/* SYNC ALL */}
      {showSyncAll && (
        <AppButton
          variant="secondary"
          size="sm"
          icon={FileStack}
          loading={syncing}
          disabled={syncing || loadingConnections}
          onClick={runSyncAll}
        >
          Sync All ERPs
        </AppButton>
      )}
    </div>
  </div>
</div>
          </div>
        </div>

        {/* CONNECTION CONTEXT */}
        {showSelector && (
          <div className="mt-4 flex items-start gap-3 rounded-app-md border border-brand-500/15 bg-brand-500/[0.035] px-4 py-3.5">
            <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
              <Info className="h-4 w-4" />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                ERP synchronization context
              </p>
              <p className="mt-0.5 text-xs leading-5 text-[var(--text-tertiary)]">
                Select the SAP ERP connection that should be used for this
                Document Synchronization.
              </p>
            </div>
          </div>
        )}

        {/* FILTER WORKSPACE */}
        <div className="mt-4 rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Document workspace
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                Search and refine synchronized ERP documents.
              </p>
            </div>

            <span className="hidden text-[10px] font-medium text-[var(--text-tertiary)] sm:block">
              {pageInfo.total || 0} document{pageInfo.total === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1 lg:max-w-[430px]">
              <AppSearch
                value={search}
                onChange={setSearch}
                placeholder="Search by SAP Document ID…"
                className="w-full"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="mt-4 overflow-hidden rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-sunken)]/35 px-4 py-2.5">
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Synchronized Documents
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                ERP document metadata and synchronization status
              </p>
            </div>

            <div className="hidden items-center gap-1.5 text-[10px] text-[var(--text-tertiary)] md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live data
            </div>
          </div>

          <div className="overflow-x-auto">
            <AppTable
              columns={columns}
              rows={rows}
              loading={loading}
              onRowClick={(r) => setDetailId(r.id)}
              tableClassName="table-fixed w-full min-w-[1120px]"
              emptyTitle="No synced documents found"
              emptyDescription="Run a Document Synchronization to pull documents from SAP."
            />
          </div>
        </div>

        <div className="pt-1">
          <Pagination
            page={pageInfo.page}
            totalPages={pageInfo.totalPages}
            onChange={setPage}
            totalItems={pageInfo.total}
            pageSize={PAGE_SIZE}
          />
        </div>
      </AppCard>

      {/* -------------------------------------------------------
       * DETAIL MODAL
       * ------------------------------------------------------- */}

      <AppModal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title="Document Details"
        size="lg"
      >
        {detailLoading && (
          <p className="text-sm text-[var(--text-tertiary)]">
            Loading…
          </p>
        )}

        {!detailLoading && detail && (
          <DocumentDetailBody detail={detail} />
        )}
      </AppModal>
    </div>
  );
}

/* ---------------------------------------------------------
 * FIELD
 * --------------------------------------------------------- */

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-[var(--text-tertiary)]">
        {label}
      </p>

      <p className="mt-0.5 break-words text-sm text-[var(--text-primary)]">
        {value ?? "—"}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------
 * SAP ID FIELD
 * --------------------------------------------------------- */

function SapIdField({ value }) {
  const short = trimLeadingZeros(value);
  const isTrimmed = short !== value;

  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-[var(--text-tertiary)]">
        SAP Document ID
      </p>

      <span className="group/id relative mt-0.5 inline-flex max-w-full cursor-default font-mono text-sm text-[var(--text-primary)]">
        <span className="truncate">
          {short || "—"}
        </span>

        {isTrimmed && (
          <span className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden whitespace-nowrap rounded-md border border-[var(--border-primary)] bg-[var(--surface-2)] px-2 py-1 text-xs font-mono text-[var(--text-primary)] shadow-lg group-hover/id:block">
            {value}
          </span>
        )}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------
 * FILENAME FIELD
 * --------------------------------------------------------- */

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
        <p className="mt-0.5 text-sm text-[var(--text-primary)]">
          —
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
 * DOCUMENT DETAIL
 * --------------------------------------------------------- */

function DocumentDetailBody({ detail }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
        <SapIdField value={detail.sapDocumentId} />

        <Field
          label="Department"
          value={detail.department}
        />

        <Field
          label="Category"
          value={detail.category}
        />

        <Field
          label="Document Type"
          value={detail.documentType}
        />

        <FilenameField
          value={detail.originalFilename}
        />

        <Field
          label="Has Original"
          value={detail.hasOriginal ? "Yes" : "No"}
        />
      </div>

      <div className="rounded-app-md bg-[var(--surface-sunken)] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          Mapped Local Values
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field
            label="Mapped Department"
            value={detail.mappedDepartment}
          />

          <Field
            label="Mapped Category"
            value={detail.mappedCategory}
          />

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
                  {formatDateTime(log.startTime)} ·{" "}
                  {log.triggerType}
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
            Retry attempts:{" "}
            {detail.retryHistory.attempts} · Last error:{" "}
            {detail.retryHistory.lastError || "—"}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          Raw SAP Metadata
        </p>

        <pre className="max-h-56 overflow-auto rounded-app-md bg-[var(--surface-sunken)] p-3 text-xs text-[var(--text-secondary)]">
          {JSON.stringify(
            detail.rawMetadata,
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
 * DOCUMENT SYNC GUIDE
 * --------------------------------------------------------- */

function DocumentSyncGuideModal({
  open,
  onClose,
}) {
  const steps = [
    {
      title: "Trigger a sync",
      desc: "Click Sync Documents to pull documents from SAP's DocumentMetaSet into this tenant.",
    },
    {
      title: "Select ERP connection",
      desc: "When multiple SAP ERP connections are assigned to the tenant, select the ERP connection that should be used before starting the synchronization.",
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
        <AppButton
          variant="primary"
          onClick={onClose}
        >
          Got it
        </AppButton>
      }
    >
      <div className="space-y-4">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="flex gap-3"
          >
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