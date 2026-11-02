// src/features/crossDepartmentDocument/OwnerDocumentRequests.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  FileCheck2,
  FileKey2,
  FileSearch2,
  FileText,
  Inbox,
  Info,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";

import {
  CROSS_DEPARTMENT_REQUEST_STATUS,
  getDocumentAccessRequests,
  rejectDocumentAccessRequest,
} from "./api";

const STATUS_CONFIG = {
  [CROSS_DEPARTMENT_REQUEST_STATUS.PENDING]: {
    label: "Pending",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
    dotClass: "bg-amber-500",
    icon: Clock3,
  },

  [CROSS_DEPARTMENT_REQUEST_STATUS.DOCUMENT_SELECTED]: {
    label: "Document Selected",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300",
    dotClass: "bg-blue-500",
    icon: FileCheck2,
  },

  [CROSS_DEPARTMENT_REQUEST_STATUS.APPROVED]: {
    label: "Approved",
    className:
      "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300",
    dotClass: "bg-indigo-500",
    icon: CheckCircle2,
  },

  [CROSS_DEPARTMENT_REQUEST_STATUS.SHARED]: {
    label: "Shared",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
    icon: ShieldCheck,
  },

  [CROSS_DEPARTMENT_REQUEST_STATUS.REJECTED]: {
    label: "Rejected",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300",
    dotClass: "bg-rose-500",
    icon: XCircle,
  },

  [CROSS_DEPARTMENT_REQUEST_STATUS.REVOKED]: {
    label: "Revoked",
    className:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dotClass: "bg-slate-500",
    icon: XCircle,
  },

  [CROSS_DEPARTMENT_REQUEST_STATUS.EXPIRED]: {
    label: "Expired",
    className:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
    dotClass: "bg-slate-500",
    icon: Clock3,
  },
};

function getErrorMessage(error, fallback) {
  return (
    error?.payload?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function getRequestStatus(request) {
  return (
    request?.status ||
    request?.requestStatus ||
    CROSS_DEPARTMENT_REQUEST_STATUS.PENDING
  );
}

function getRequesterName(request) {
  const requester =
    request?.requester ||
    request?.requesterUser ||
    request?.requestedBy ||
    request?.user;

  if (typeof requester === "string") {
    return requester;
  }

  const fullName = [
    requester?.firstName,
    requester?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    requester?.name ||
    requester?.fullName ||
    fullName ||
    request?.requesterName ||
    request?.requesterFullName ||
    (request?.requesterUserId
      ? `User #${request.requesterUserId}`
      : "Unknown requester")
  );
}

function getDepartmentName(department) {
  if (typeof department === "string") {
    return department;
  }

  if (typeof department === "number") {
    return `Department #${department}`;
  }

  return (
    department?.name ||
    department?.departmentName ||
    department?.title ||
    department?.code ||
    ""
  );
}

function getRequesterDepartment(request) {
  const department = request?.requesterDepartment;
  const departmentName = getDepartmentName(department);

  if (departmentName) {
    return departmentName;
  }

  if (request?.requesterDepartmentName) {
    return request.requesterDepartmentName;
  }

  if (request?.requester?.departmentName) {
    return request.requester.departmentName;
  }

  if (request?.requester?.department?.name) {
    return request.requester.department.name;
  }

  if (request?.requesterDepartmentCode) {
    return request.requesterDepartmentCode;
  }

  if (request?.requesterDepartmentId) {
    return `Department #${request.requesterDepartmentId}`;
  }

  return "—";
}

function getRequestedDepartment(request) {
  const department = request?.requestedDepartment;
  const departmentName = getDepartmentName(department);

  if (departmentName) {
    return departmentName;
  }

  if (request?.requestedDepartmentName) {
    return request.requestedDepartmentName;
  }

  if (request?.departmentName) {
    return request.departmentName;
  }

  if (request?.requestedDepartmentCode) {
    return request.requestedDepartmentCode;
  }

  if (request?.requestedDepartmentId) {
    return `Department #${request.requestedDepartmentId}`;
  }

  return "—";
}

function getDocumentReference(request) {
  return (
    request?.documentReference ||
    request?.reference ||
    request?.documentName ||
    "—"
  );
}

function getRequestReason(request) {
  return request?.reason || request?.message || "No reason provided.";
}

function getRequestId(request) {
  return request?.id || request?.requestId;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name) {
  if (!name) return "U";

  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function StatusBadge({ status }) {
  const config =
    STATUS_CONFIG[status] ||
    {
      label: status || "Pending",
      className:
        "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
      dotClass: "bg-slate-500",
      icon: Info,
    };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      <Icon size={12} />
      {config.label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  tone = "blue",
}) {
  const toneMap = {
    blue: {
      icon: "bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-900/50",
      glow: "bg-blue-500/10",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/50",
      glow: "bg-amber-500/10",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/50",
      glow: "bg-emerald-500/10",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-900/50",
      glow: "bg-violet-500/10",
    },
  };

  const toneStyles = toneMap[tone] || toneMap.blue;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900">
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition duration-300 group-hover:scale-125 ${toneStyles.glow}`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {value}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${toneStyles.icon}`}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  truncate = false,
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        <Icon size={12} />
        {label}
      </p>
      <p
        className={`mt-1.5 text-sm font-medium text-slate-800 dark:text-slate-100 ${
          truncate ? "truncate" : ""
        }`}
        title={truncate ? String(value || "") : undefined}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function RequestCard({
  request,
  onFindDocument,
  onReject,
  rejectingRequestId,
}) {
  const requestId = getRequestId(request);
  const status = getRequestStatus(request);

  const statusConfig =
    STATUS_CONFIG[status] ||
    {
      label: status,
      className:
        "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    };

  const canSelectDocument =
    status === CROSS_DEPARTMENT_REQUEST_STATUS.PENDING ||
    status === CROSS_DEPARTMENT_REQUEST_STATUS.DOCUMENT_SELECTED;

  const canReject =
    status === CROSS_DEPARTMENT_REQUEST_STATUS.PENDING ||
    status === CROSS_DEPARTMENT_REQUEST_STATUS.DOCUMENT_SELECTED;

  const requesterName = getRequesterName(request);
  const isRejecting = rejectingRequestId === requestId;

  return (
    <article className="group relative overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(15,23,42,0.07)] dark:border-slate-800 dark:bg-slate-900">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="p-4 sm:p-4.5 lg:p-5">
        {/* Top row */}
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
              <FileKey2 size={20} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className="max-w-[720px] truncate text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-[17px]"
                  title={getDocumentReference(request)}
                >
                  {getDocumentReference(request)}
                </h3>

                <StatusBadge status={status} />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 size={12} />
                  Requested {formatDate(request?.createdAt || request?.requestedAt)}
                </span>

                {requestId && (
                  <span className="font-mono text-[10px] text-slate-400">
                    #{requestId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 xl:justify-end">
            {canSelectDocument && (
              <button
                type="button"
                onClick={() => onFindDocument?.(request)}
                className="group/button inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-900/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <Search
                  size={14}
                  className="transition-transform duration-200 group-hover/button:scale-110"
                />
                Find DMS Document
                <ChevronRight size={14} />
              </button>
            )}

            {canReject && (
              <button
                type="button"
                onClick={() => onReject?.(request)}
                disabled={Boolean(rejectingRequestId)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/50 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/20"
              >
                <XCircle size={14} />
                Reject
              </button>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="mt-4 grid gap-2.5 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4 dark:border-slate-800">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
            <DetailItem
              icon={UserRound}
              label="Requester"
              value={requesterName}
              truncate
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
            <DetailItem
              icon={Building2}
              label="Requester Department"
              value={getRequesterDepartment(request)}
              truncate
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
            <DetailItem
              icon={UsersRound}
              label="Requested Department"
              value={getRequestedDepartment(request)}
              truncate
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
            <DetailItem
              icon={FileText}
              label="Document Reference"
              value={getDocumentReference(request)}
              truncate
            />
          </div>
        </div>

        {/* Reason */}
        <div className="mt-3 rounded-xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <Info size={15} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Business reason
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-600 dark:text-slate-300">
                {getRequestReason(request)}
              </p>
            </div>
          </div>
        </div>

        {/* Security note */}
        {canSelectDocument && (
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-3.5 py-3 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-indigo-950/20">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
              <ShieldCheck size={15} />
            </div>

            <div>
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                Select an existing DMS document
              </p>
              <p className="mt-0.5 text-[11px] leading-5 text-blue-700/80 dark:text-blue-300/70">
                This workflow does not upload a new file. Only a document you
                already have permission to access in the DMS should be selected.
              </p>
            </div>
          </div>
        )}

        {/* Footer status */}
        {isRejecting && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-950/20 dark:text-rose-300">
            <Loader2 size={14} className="animate-spin" />
            Rejecting request...
          </div>
        )}
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-white p-10 text-center shadow-[0_15px_55px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
        <Loader2 size={24} className="animate-spin" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
        Loading access requests
      </h3>

      <p className="mt-1 text-xs text-slate-400">
        Fetching the requests assigned to your authorized department.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-10 text-center shadow-[0_15px_55px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <Inbox size={27} />
      </div>

      <h3 className="relative mt-4 text-base font-bold text-slate-900 dark:text-white">
        No document access requests
      </h3>

      <p className="relative mx-auto mt-1.5 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        Requests assigned to your authorized department will appear here when
        another department requests controlled document access.
      </p>
    </div>
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

  const startItem =
    totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const visiblePages = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let page = 1; page <= totalPages; page += 1) {
      visiblePages.push(page);
    }
  } else {
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);

    if (start === 1) {
      end = 5;
    }

    if (end === totalPages) {
      start = Math.max(1, totalPages - 4);
    }

    for (let page = start; page <= end; page += 1) {
      visiblePages.push(page);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
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
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
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

        {visiblePages.map((page) => (
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

export default function OwnerDocumentRequests({
  onFindDocument,
  onRequestUpdated,
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [rejectingRequestId, setRejectingRequestId] =
    useState(null);

  const [showRejectDialog, setShowRejectDialog] =
    useState(false);

  const [selectedRequest, setSelectedRequest] =
    useState(null);

  const [rejectReason, setRejectReason] = useState("");

  // Pagination for the complete request list.
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadRequests = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getDocumentAccessRequests({
          scope: "manage",
        });

        const requestList = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

        setRequests(requestList);
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Failed to load document access requests."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleFindDocument = useCallback(
    (request) => {
      if (!onFindDocument) {
        return;
      }

      onFindDocument(request);
    },
    [onFindDocument]
  );

  const handleOpenReject = useCallback((request) => {
    setSelectedRequest(request);
    setRejectReason("");
    setShowRejectDialog(true);
  }, []);

  const handleCloseReject = useCallback(() => {
    if (rejectingRequestId) {
      return;
    }

    setShowRejectDialog(false);
    setSelectedRequest(null);
    setRejectReason("");
  }, [rejectingRequestId]);

  const handleReject = async () => {
    const requestId = getRequestId(selectedRequest);

    if (!requestId) {
      setError("Invalid document request.");
      return;
    }

    try {
      setRejectingRequestId(requestId);
      setError("");

      await rejectDocumentAccessRequest(
        requestId,
        rejectReason.trim()
      );

      handleCloseReject();

      await loadRequests({ silent: true });

      if (onRequestUpdated) {
        onRequestUpdated();
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to reject document access request."
        )
      );
    } finally {
      setRejectingRequestId(null);
    }
  };

  const metrics = useMemo(() => {
    const pending = requests.filter(
      (request) =>
        getRequestStatus(request) ===
        CROSS_DEPARTMENT_REQUEST_STATUS.PENDING
    ).length;

    const documentSelected = requests.filter(
      (request) =>
        getRequestStatus(request) ===
        CROSS_DEPARTMENT_REQUEST_STATUS.DOCUMENT_SELECTED
    ).length;

    const completed = requests.filter((request) => {
      const status = getRequestStatus(request);

      return (
        status === CROSS_DEPARTMENT_REQUEST_STATUS.APPROVED ||
        status === CROSS_DEPARTMENT_REQUEST_STATUS.SHARED
      );
    }).length;

    const rejected = requests.filter(
      (request) =>
        getRequestStatus(request) ===
        CROSS_DEPARTMENT_REQUEST_STATUS.REJECTED
    ).length;

    return {
      total: requests.length,
      pending,
      documentSelected,
      completed,
      rejected,
    };
  }, [requests]);

  const totalPages = Math.max(1, Math.ceil(requests.length / pageSize));

  useEffect(() => {
    setCurrentPage((page) => Math.min(Math.max(page, 1), totalPages));
  }, [totalPages]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return requests.slice(start, start + pageSize);
  }, [requests, currentPage, pageSize]);

  const handlePageChange = useCallback(
    (page) => {
      const safePage = Math.min(Math.max(page, 1), totalPages);
      setCurrentPage(safePage);
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
        @keyframes owner-rise {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes owner-pulse {
          0%, 100% {
            opacity: .45;
          }
          50% {
            opacity: .85;
          }
        }

        @keyframes owner-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .owner-rise {
          animation: owner-rise .45s ease-out both;
        }

        .owner-pulse {
          animation: owner-pulse 3s ease-in-out infinite;
        }

        .owner-float {
          animation: owner-float 4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .owner-rise,
          .owner-pulse,
          .owner-float {
            animation: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1500px] space-y-4">
        {/* Premium page hero */}
{/* <section className="owner-rise relative overflow-hidden rounded-[20px] border border-blue-500/20 bg-gradient-to-r from-[#155DFC] via-[#246AF5] to-[#3C3EE3] px-5 py-4 shadow-[0_16px_45px_rgba(37,88,240,0.20)] sm:px-6 sm:py-4"> 
  <div className="pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full bg-white/10" />
  <div className="pointer-events-none absolute -right-4 top-8 h-24 w-24 rounded-full bg-white/[0.06]" />

  <div className="relative flex items-center justify-between gap-4">
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[11px] font-semibold text-blue-100">
          Department Access Control
        </span>

        <span className="h-1 w-1 rounded-full bg-blue-200/70" />

        <span className="text-[10px] font-medium text-blue-200/80">
          Secure Workflow
        </span>
      </div>

      <h1 className="text-xl font-bold tracking-tight text-white sm:text-[24px]">
        Document Access Requests
      </h1>

      <p className="mt-1 max-w-2xl text-xs leading-5 text-blue-100/80 sm:text-[13px]">
        Review incoming cross-department requests and continue the controlled
        DMS access workflow.
      </p>
    </div>

    <div className="hidden shrink-0 items-center gap-2 sm:flex">
      <div className="rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
          <ShieldCheck size={13} className="text-emerald-300" />
          Controlled
        </div>
        <p className="mt-0.5 text-[9px] text-blue-100/70">
          Existing DMS only
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
          <FileKey2 size={13} className="text-blue-200" />
          Secure
        </div>
        <p className="mt-0.5 text-[9px] text-blue-100/70">
          Role based
        </p>
      </div>
    </div>
  </div>
</section> */}

        {/* Stats */}
        {/* {!loading && !error && (
          <section className="owner-rise grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Inbox}
              label="Total requests"
              value={metrics.total}
              description="Assigned to your scope"
              tone="blue"
            />

            <StatCard
              icon={Clock3}
              label="Pending"
              value={metrics.pending}
              description="Awaiting document action"
              tone="amber"
            />

            <StatCard
              icon={FileCheck2}
              label="Document selected"
              value={metrics.documentSelected}
              description="Ready for next workflow step"
              tone="violet"
            />

            <StatCard
              icon={CheckCircle2}
              label="Completed"
              value={metrics.completed}
              description="Approved or shared"
              tone="green"
            />
          </section>
        )} */}

        {/* Main workspace */}
        <section className="owner-rise rounded-[22px] border border-slate-200/80 bg-white shadow-[0_16px_55px_rgba(15,23,42,0.055)] dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                  <UsersRound size={18} />
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">
                    Incoming requests
                  </p>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    Review & process
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Process each request according to your department's access
                    rules.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadRequests({ silent: true })}
                disabled={loading || refreshing}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-rose-600 dark:bg-slate-900/60 dark:text-rose-300">
                  <AlertCircle size={16} />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold">Unable to load requests</p>
                  <p className="mt-0.5 text-xs leading-5 text-rose-700/80 dark:text-rose-300/80">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {loading && <LoadingState />}

            {!loading && !error && requests.length === 0 && (
              <EmptyState />
            )}

            {!loading && requests.length > 0 && (
              <>
                <div className="space-y-3">
                  {paginatedRequests.map((request, index) => (
                    <div
                      key={getRequestId(request) || `request-${index}`}
                      className="owner-rise"
                      style={{
                        animationDelay: `${Math.min(index * 45, 260)}ms`,
                      }}
                    >
                      <RequestCard
                        request={request}
                        onFindDocument={handleFindDocument}
                        onReject={handleOpenReject}
                        rejectingRequestId={rejectingRequestId}
                      />
                    </div>
                  ))}
                </div>

                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={requests.length}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </>
            )}
          </div>
        </section>

        {/* Security footer */}
        <div className="owner-rise flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
              <ShieldCheck size={15} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Only existing DMS documents should be selected for sharing.
              </p>
              <p className="mt-0.5 text-[11px] leading-5 text-slate-400">
                This page does not upload files and does not bypass department
                authorization.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <Building2 size={13} />
            Department owner workspace
          </div>
        </div>
      </div>

      {/* Reject modal */}
      {showRejectDialog && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-document-request-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-900">
            <div className="relative border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6">
              <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-rose-500/10 blur-2xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                    <XCircle size={20} />
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-rose-500">
                      Access decision
                    </p>

                    <h3
                      id="reject-document-request-title"
                      className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                    >
                      Reject document request
                    </h3>

                    <p className="mt-1.5 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">
                      This action will reject the request and stop the current
                      access flow.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseReject}
                  disabled={Boolean(rejectingRequestId)}
                  aria-label="Close"
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Request
                </p>

                <div className="mt-2 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                    <FileText size={16} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {getDocumentReference(selectedRequest)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Requested by {getRequesterName(selectedRequest)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reject-reason"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400"
                >
                  Rejection reason
                  <span className="ml-1 font-medium normal-case tracking-normal text-slate-400">
                    optional
                  </span>
                </label>

                <textarea
                  id="reject-reason"
                  rows={4}
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  disabled={Boolean(rejectingRequestId)}
                  placeholder="Example: Document cannot be shared at this time."
                  className="block w-full resize-y rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={handleCloseReject}
                disabled={Boolean(rejectingRequestId)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={Boolean(rejectingRequestId)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {rejectingRequestId ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle size={15} />
                    Confirm rejection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
