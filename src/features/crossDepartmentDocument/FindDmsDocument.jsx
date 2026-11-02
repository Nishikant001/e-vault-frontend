// src/features/crossDepartmentDocument/FindDmsDocument.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileCheck2,
  FileKey2,
  FileSearch2,
  FileText,
  FolderSearch2,
  Info,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  searchSourceDocuments,
  selectSourceDocument,
} from "./api";

function getErrorMessage(error, fallback) {
  return (
    error?.payload?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function getDocumentId(document) {
  return (
    document?.id ||
    document?.documentId ||
    document?.sourceDocumentId
  );
}

function getDocumentName(document) {
  return (
    document?.originalFileName ||
    document?.fileName ||
    document?.filename ||
    document?.name ||
    document?.documentName ||
    document?.title ||
    "Untitled Document"
  );
}

function getDocumentDepartment(document) {
  const department =
    document?.Department ||
    document?.department ||
    document?.departmentInfo;

  if (typeof department === "string") {
    return department;
  }

  return (
    department?.name ||
    department?.departmentName ||
    document?.departmentName ||
    "—"
  );
}

function getDocumentType(document) {
  const documentType =
    document?.DocumentType ||
    document?.documentType ||
    document?.type;

  if (typeof documentType === "string") {
    return documentType;
  }

  return (
    documentType?.name ||
    documentType?.documentTypeName ||
    document?.documentTypeName ||
    document?.categoryName ||
    "—"
  );
}

function getDocumentVersion(document) {
  return (
    document?.version ||
    document?.documentVersion ||
    document?.currentVersion ||
    null
  );
}

function getRequestId(request) {
  return request?.id || request?.requestId;
}

function getDocumentReference(request) {
  return (
    request?.documentReference ||
    request?.reference ||
    request?.documentName ||
    ""
  );
}

function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  if (totalItems <= 0) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pages = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let page = 1; page <= totalPages; page += 1) {
      pages.push(page);
    }
  } else {
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);

    if (start === 1) end = 5;
    if (end === totalPages) start = Math.max(1, totalPages - 4);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {startItem}-{endItem}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {totalItems}
          </span>
        </p>

        <label className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(event) =>
              onPageSizeChange(Number(event.target.value))
            }
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            aria-label="Rows per page"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/30"
        >
          <ChevronsLeft size={14} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/30"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={currentPage === page ? "page" : undefined}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
              currentPage === page
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                : "border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/30"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/30"
        >
          <ChevronRight size={14} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/30"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}

function DocumentCard({
  document,
  selected,
  disabled,
  onSelect,
}) {
  const documentName = getDocumentName(document);
  const documentVersion = getDocumentVersion(document);

  return (
    <button
      type="button"
      onClick={() => onSelect(getDocumentId(document))}
      disabled={disabled}
      className={`group block w-full rounded-2xl border p-3.5 text-left transition duration-200 ${
        selected
          ? "border-blue-300 bg-blue-50/70 shadow-[0_8px_28px_rgba(37,99,235,0.08)] dark:border-blue-800/70 dark:bg-blue-950/30"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:bg-slate-50/70 hover:shadow-[0_8px_28px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900/50 dark:hover:bg-slate-800/70"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
            selected
              ? "border-blue-200 bg-blue-600 text-white dark:border-blue-800"
              : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {selected ? <Check size={16} /> : <FileText size={17} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className="truncate text-sm font-semibold text-slate-900 dark:text-white"
                title={documentName}
              >
                {documentName}
              </p>

              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-semibold text-slate-400">Department</span>
                  {getDocumentDepartment(document)}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <span className="font-semibold text-slate-400">Type</span>
                  {getDocumentType(document)}
                </span>

                {documentVersion && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-semibold text-slate-400">Version</span>
                    {documentVersion}
                  </span>
                )}
              </div>
            </div>

            <ChevronRight
              size={15}
              className={`mt-0.5 shrink-0 transition-transform ${
                selected
                  ? "text-blue-600"
                  : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-blue-500"
              }`}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

export default function FindDmsDocument({
  request,
  onDocumentSelected,
  onBack,
}) {
  const requestId = getRequestId(request);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState(
    getDocumentReference(request)
  );

  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [selecting, setSelecting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadDocuments = useCallback(
    async (query = "") => {
      if (!requestId) {
        setError("Invalid document request.");
        setLoading(false);
        return;
      }

      try {
        setError("");

        setLoading(true);
        if (documents.length > 0) {
          setSearching(true);
        }

        const response = await searchSourceDocuments(
          requestId,
          query.trim()
            ? {
                q: query.trim(),
              }
            : {}
        );

        const documentList = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : Array.isArray(response?.documents)
              ? response.documents
              : [];

        setDocuments(documentList);
        setSelectedDocumentId(null);
        setCurrentPage(1);
      } catch (err) {
        setDocuments([]);
        setSelectedDocumentId(null);
        setCurrentPage(1);
        setError(
          getErrorMessage(
            err,
            "Failed to search existing DMS documents."
          )
        );
      } finally {
        setLoading(false);
        setSearching(false);
      }
    },
    [requestId, documents.length]
  );

  useEffect(() => {
    loadDocuments(getDocumentReference(request));
    // Initial request search intentionally runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    await loadDocuments(searchTerm);
  };

  const handleSelectDocument = async () => {
    const selectedDocument = documents.find(
      (document) =>
        String(getDocumentId(document)) ===
        String(selectedDocumentId)
    );

    if (!selectedDocument) {
      setError("Please select an existing DMS document.");
      return;
    }

    const sourceDocumentId = getDocumentId(selectedDocument);

    if (!sourceDocumentId) {
      setError(
        "The selected document does not have a valid document ID."
      );
      return;
    }

    try {
      setSelecting(true);
      setError("");

      const response = await selectSourceDocument(requestId, {
        sourceDocumentId,
        sourceDocumentVersion: getDocumentVersion(selectedDocument),
      });

      if (onDocumentSelected) {
        onDocumentSelected({
          request,
          document: selectedDocument,
          response,
        });
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to select the DMS document."
        )
      );
    } finally {
      setSelecting(false);
    }
  };

  const totalPages = Math.max(
    1,
    Math.ceil(documents.length / pageSize)
  );

  useEffect(() => {
    setCurrentPage((page) =>
      Math.min(Math.max(page, 1), totalPages)
    );
  }, [totalPages]);

  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return documents.slice(start, start + pageSize);
  }, [documents, currentPage, pageSize]);

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(
        Math.min(Math.max(page, 1), totalPages)
      );
    },
    [totalPages]
  );

  const handlePageSizeChange = useCallback((nextSize) => {
    setPageSize(nextSize);
    setCurrentPage(1);
  }, []);

  return (
    <div className="w-full bg-[#f6f8fc] dark:bg-slate-950">
      <style>{`
        @keyframes find-dms-rise {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes find-dms-glow {
          0%, 100% {
            opacity: .35;
          }
          50% {
            opacity: .7;
          }
        }

        .find-dms-rise {
          animation: find-dms-rise .4s ease-out both;
        }

        .find-dms-glow {
          animation: find-dms-glow 3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .find-dms-rise,
          .find-dms-glow {
            animation: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1500px] space-y-4">
        {/* Header */}
        <section className="find-dms-rise relative overflow-hidden rounded-[22px] border border-blue-500/20 bg-gradient-to-r from-[#155DFC] via-[#246AF5] to-[#3C3EE3] px-5 py-4 shadow-[0_16px_45px_rgba(37,88,240,0.18)] sm:px-6 sm:py-4">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 find-dms-glow" />
          <div className="pointer-events-none absolute -right-3 top-8 h-24 w-24 rounded-full bg-violet-300/10" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.12] text-white sm:flex">
                <FileSearch2 size={18} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100">
                    Document Selection
                  </span>
                  <span className="h-1 w-1 rounded-full bg-blue-100/70" />
                  <span className="text-[10px] font-medium text-blue-100/80">
                    Secure DMS workflow
                  </span>
                </div>

                <h1 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-[24px]">
                  Find DMS Document
                </h1>

                <p className="mt-0.5 max-w-3xl text-[11px] leading-5 text-blue-100/80 sm:text-xs">
                  Search and select an existing document that you are already authorized to access.
                </p>
              </div>
            </div>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={selecting}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.10] px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Back to Requests</span>
                <span className="sm:hidden">Back</span>
              </button>
            )}
          </div>
        </section>

        {/* Request reference + security */}
        {request && (
          <section className="find-dms-rise grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3.5 dark:border-blue-900/40 dark:bg-blue-950/25">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                  <FileKey2 size={15} />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">
                    Requested document
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-blue-950 dark:text-blue-100">
                    {getDocumentReference(request) || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm dark:bg-slate-900 dark:text-amber-300">
                  <ShieldCheck size={15} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
                    Existing DMS documents only
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-amber-800/80 dark:text-amber-200/75">
                    No file, PDF or image upload is allowed in this workflow.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="find-dms-rise flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-rose-600 dark:bg-slate-900/60 dark:text-rose-300">
              <AlertCircle size={16} />
            </div>

            <div>
              <p className="font-semibold">Search could not be completed</p>
              <p className="mt-0.5 text-xs leading-5 text-rose-700/80 dark:text-rose-300/80">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Search toolbar */}
        <section className="find-dms-rise rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.045)] dark:border-slate-800 dark:bg-slate-900">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2.5 lg:flex-row"
          >
            <div className="relative flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                disabled={loading || selecting}
                placeholder="Search by document name, reference or ERP document ID..."
                className="block h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:bg-slate-950 dark:disabled:bg-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading || searching || selecting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-700/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
            >
              {searching ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Search
                </>
              )}
            </button>
          </form>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-[11px] text-slate-400">
              Only documents available within your authorized DMS scope are returned.
            </p>

            {documents.length > 0 && !loading && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <FolderSearch2 size={12} />
                {documents.length} matching document{documents.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_12px_40px_rgba(15,23,42,0.045)] dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
              <Loader2 size={21} className="animate-spin" />
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
              Searching existing DMS documents
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Checking documents you are authorized to access.
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !searching &&
          !error &&
          documents.length === 0 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-10 text-center shadow-[0_12px_40px_rgba(15,23,42,0.045)] dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <FolderSearch2 size={24} />
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                No matching documents found
              </h3>

              <p className="mx-auto mt-1.5 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Try another document name, reference or ERP document ID.
                Only documents you are authorized to access are shown.
              </p>
            </div>
          )}

        {/* Documents */}
        {!loading && documents.length > 0 && (
          <section className="find-dms-rise">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_15px_55px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-2 border-b border-slate-100 px-1 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText
                      size={15}
                      className="text-blue-600 dark:text-blue-300"
                    />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Available DMS documents
                    </h2>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Select one document to continue the access workflow.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <FileCheck2 size={12} />
                  {selectedDocumentId ? "1 document selected" : "No selection"}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {paginatedDocuments.map((document) => (
                  <DocumentCard
                    key={getDocumentId(document)}
                    document={document}
                    selected={
                      String(getDocumentId(document)) ===
                      String(selectedDocumentId)
                    }
                    disabled={selecting}
                    onSelect={setSelectedDocumentId}
                  />
                ))}
              </div>

              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={documents.length}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </section>
        )}

        {/* Footer action */}
        <div className="find-dms-rise flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-2.5">
            <Info
              size={15}
              className="mt-0.5 shrink-0 text-slate-400"
            />
            <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              Selecting a document does not grant the requester access to the original document.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSelectDocument}
            disabled={
              !selectedDocumentId ||
              selecting ||
              loading
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-700/20 focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {selecting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Selecting...
              </>
            ) : (
              <>
                <ShieldCheck size={14} />
                Select This Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
