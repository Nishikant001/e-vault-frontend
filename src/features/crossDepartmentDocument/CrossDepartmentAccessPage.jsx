import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UserRound,
  UsersRound,
} from "lucide-react";
import RequestDocumentAccess from "./RequestDocumentAccess";
import ManageDocumentRequestFlow from "./ManageDocumentRequestFlow";
import { getDocumentAccessRequests, getTemporaryShareViewUrl } from "./api";
import {
  get,
  decodeToken,
  getCurrentTenantId,
  API_BASE_URL,
  authHeaders,
} from "../../services/apiClient";

const ALL_TABS = [
  { key: "request", label: "Request Access", icon: Send },
  { key: "mine", label: "My Requests", icon: ClipboardIcon },
  { key: "manage", label: "Manage Requests", icon: UsersRound },
  { key: "shared", label: "Shared With Me", icon: Inbox },
];

const DEPARTMENT_OWNER_ROLES = new Set([
  "SuperAdmin",
  "TenantAdmin",
  "DeptHead",
  "Manager",
  "BranchManager",
]);

const STATUS_META = {
  PENDING: {
    label: "Pending",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  DOCUMENT_SELECTED: {
    label: "Document selected",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  APPROVED: {
    label: "Approved",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  SHARED: {
    label: "Shared",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  REVOKED: {
    label: "Revoked",
    className:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-500",
  },
  EXPIRED: {
    label: "Expired",
    className:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-500",
  },
};

function ClipboardIcon(props) {
  return <FileText {...props} />;
}

function getDisplayName(value, fallback = "Unknown user") {
  return (
    value?.name ||
    value?.fullName ||
    value?.displayName ||
    value?.userName ||
    value?.username ||
    fallback
  );
}

function getRequesterName(request, currentUserId) {
  const nested =
    request?.requester || request?.requesterUser || request?.createdBy;
  const nestedName = getDisplayName(nested, "");
  if (nestedName) return nestedName;

  const directName =
    request?.requesterName ||
    request?.requesterFullName ||
    request?.createdByName ||
    request?.createdByUserName ||
    request?.userName;

  if (directName) return directName;
  if (String(request?.requesterUserId ?? "") === String(currentUserId ?? "")) {
    return "You";
  }
  if (request?.requesterUserId) return `User #${request.requesterUserId}`;
  return "Unknown user";
}

function getRequesterEmail(request) {
  return (
    request?.requesterEmail ||
    request?.requester?.email ||
    request?.requesterUser?.email ||
    request?.createdBy?.email ||
    ""
  );
}

function getDepartmentName(request, departments) {
  return (
    request?.requestedDepartmentName ||
    request?.departmentName ||
    request?.requestedDepartment?.name ||
    request?.department?.name ||
    departments.find(
      (department) =>
        String(department.id ?? department.departmentId) ===
        String(request?.requestedDepartmentId ?? request?.departmentId),
    )?.name ||
    departments.find(
      (department) =>
        String(department.id ?? department.departmentId) ===
        String(request?.requestedDepartmentId ?? request?.departmentId),
    )?.departmentName ||
    "Department not available"
  );
}

function formatDateTime(value, fallback = "Not available") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatDateOnly(value, fallback = "Not available") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value, fallback = "Not available") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getStatusMeta(status) {
  return (
    STATUS_META[status] || {
      label: status || "Pending",
      className:
        "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
      dot: "bg-slate-400",
    }
  );
}

function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${meta.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, helper, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    violet:
      "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
  };

  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-blue-400" />
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </p>
      <p className="mt-1 text-[10px] leading-4 text-slate-400">{helper}</p>
    </div>
  );
}

function EmptyState({ mode }) {
  const config = {
    mine: {
      icon: ClipboardIcon,
      title: "No requests submitted yet",
      description:
        "Requests you raise for another department will appear here with their status and complete submission timeline.",
    },
    shared: {
      icon: ShieldCheck,
      title: "No shared documents yet",
      description:
        "Documents securely shared with your account will appear here with their temporary access details.",
    },
  }[mode] || {
    icon: Inbox,
    title: "No requests to show",
    description: "There are no requests available in this view.",
  };

  const Icon = config.icon;

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
        {config.title}
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">
        {config.description}
      </p>
    </div>
  );
}

function RequestsTable({
  requests,
  loading,
  mode,
  currentUserId,
  departments,
  onManage,
  onViewShare,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [query, setQuery] = useState("");

  const filteredRequests = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return requests || [];

    return (requests || []).filter((request) => {
      const haystack = [
        request?.documentReference,
        request?.reason,
        getRequesterName(request, currentUserId),
        getRequesterEmail(request),
        getDepartmentName(request, departments),
        request?.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [requests, query, currentUserId, departments]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-blue-600" />
        <p className="mt-3 text-xs font-semibold text-slate-500">
          Loading request history...
        </p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return <EmptyState mode={mode} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-200/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {mode === "mine" ? "Request history" : "Secure shares"}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {filteredRequests.length} of {requests.length} records shown
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search requester, document, status..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[11px] font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
          />
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="px-6 py-10 text-center text-xs text-slate-400">
          No matching requests found.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1050px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/40">
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Requester
                  </th>
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Destination
                  </th>
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Document
                  </th>
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Raised
                  </th>
                  <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  const expanded = expandedId === request.id;
                  const requesterName = getRequesterName(
                    request,
                    currentUserId,
                  );
                  const requesterEmail = getRequesterEmail(request);
                  const departmentName = getDepartmentName(
                    request,
                    departments,
                  );
                  const raisedAt =
                    request.createdAt ||
                    request.requestedAt ||
                    request.created_at;
                  const updatedAt = request.updatedAt || request.updated_at;

                  return (
                    <React.Fragment key={request.id}>
                      <tr className="border-b border-slate-100 transition hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 align-top">
                          <div className="flex min-w-[190px] items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-[10px] font-bold text-white">
                              {requesterName
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0]?.toUpperCase())
                                .join("") || "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                                {requesterName}
                              </p>
                              <p className="truncate text-[10px] text-slate-400">
                                {requesterEmail ||
                                  (request.requesterUserId
                                    ? `User ID: ${request.requesterUserId}`
                                    : "Requester details unavailable")}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="flex items-start gap-2">
                            <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                            <div>
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {departmentName}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {request.requestedDepartmentId
                                  ? `Department ID: ${request.requestedDepartmentId}`
                                  : "Destination department"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-[230px] px-4 py-3 align-top">
                          <div className="flex items-start gap-2">
                            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
                            <div className="min-w-0">
                              <p
                                className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200"
                                title={request.documentReference}
                              >
                                {request.documentReference ||
                                  "Untitled document"}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                {request.reason ||
                                  "No business reason provided"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="flex items-start gap-2">
                            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <div>
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {formatDateOnly(raisedAt)}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {formatTime(raisedAt)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <StatusBadge status={request.status} />
                        </td>

                        <td className="px-4 py-3 text-right align-top">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(expanded ? null : request.id)
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/20 dark:hover:text-blue-300"
                            >
                              Details
                              <ChevronDown
                                className={`h-3.5 w-3.5 transition ${expanded ? "rotate-180" : ""}`}
                              />
                            </button>

                            {mode === "mine" &&
                            request.status &&
                            request.status !== "PENDING"
                              ? null
                              : null}

                            {mode === "shared" &&
                              request.shareId &&
                              request.shareStatus !== "REVOKED" &&
                              request.shareStatus !== "EXPIRED" && (
                                <button
                                  type="button"
                                  onClick={() => onViewShare?.(request.shareId)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-2.5 py-2 text-[10px] font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View
                                </button>
                              )}

                            {mode === "manage" &&
                              !["REJECTED", "SHARED", "REVOKED"].includes(
                                request.status,
                              ) && (
                                <button
                                  type="button"
                                  onClick={() => onManage?.(request.id)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-2.5 py-2 text-[10px] font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700"
                                >
                                  Open
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>

                      {expanded && (
                        <tr className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/30">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <DetailItem
                                icon={UserRound}
                                label="Raised by"
                                value={requesterName}
                              />
                              <DetailItem
                                icon={Clock3}
                                label="Raised on"
                                value={formatDateTime(raisedAt)}
                              />
                              <DetailItem
                                icon={RefreshCw}
                                label="Last updated"
                                value={formatDateTime(updatedAt)}
                              />
                              <DetailItem
                                icon={Building2}
                                label="Destination department"
                                value={departmentName}
                              />
                              <DetailItem
                                icon={FileText}
                                label="Document reference"
                                value={
                                  request.documentReference || "Not specified"
                                }
                              />
                              <DetailItem
                                icon={AlertCircle}
                                label="Business reason"
                                value={request.reason || "Not provided"}
                              />
                              <DetailItem
                                icon={ShieldCheck}
                                label="Share status"
                                value={request.shareStatus || "Not shared"}
                              />
                              <DetailItem
                                icon={TimerReset}
                                label="Access expiry"
                                value={
                                  request.shareExpiresAt
                                    ? formatDateTime(request.shareExpiresAt)
                                    : "Not configured"
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden dark:divide-slate-800">
            {filteredRequests.map((request) => {
              const requesterName = getRequesterName(request, currentUserId);
              const requesterEmail = getRequesterEmail(request);
              const departmentName = getDepartmentName(request, departments);
              const raisedAt =
                request.createdAt || request.requestedAt || request.created_at;
              const updatedAt = request.updatedAt || request.updated_at;

              return (
                <div key={request.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-[10px] font-bold text-white">
                        {requesterName
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("") || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                          {requesterName}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">
                          {requesterEmail || "Requester details unavailable"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {request.documentReference || "Untitled document"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {departmentName}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />{" "}
                        {formatDateTime(raisedAt)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                      {request.reason || "No business reason provided"}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(
                          expandedId === request.id ? null : request.id,
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      Details
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition ${expandedId === request.id ? "rotate-180" : ""}`}
                      />
                    </button>

                    {mode === "shared" &&
                      request.shareId &&
                      request.shareStatus !== "REVOKED" &&
                      request.shareStatus !== "EXPIRED" && (
                        <button
                          type="button"
                          onClick={() => onViewShare?.(request.shareId)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Open secure viewer
                        </button>
                      )}

                    {mode === "manage" &&
                      !["REJECTED", "SHARED", "REVOKED"].includes(
                        request.status,
                      ) && (
                        <button
                          type="button"
                          onClick={() => onManage?.(request.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-700"
                        >
                          Open workflow
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                  </div>

                  {expandedId === request.id && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <DetailItem
                        icon={UserRound}
                        label="Raised by"
                        value={requesterName}
                      />
                      <DetailItem
                        icon={Clock3}
                        label="Raised on"
                        value={formatDateTime(raisedAt)}
                      />
                      <DetailItem
                        icon={RefreshCw}
                        label="Last updated"
                        value={formatDateTime(updatedAt)}
                      />
                      <DetailItem
                        icon={Building2}
                        label="Destination"
                        value={departmentName}
                      />
                      <DetailItem
                        icon={FileText}
                        label="Document"
                        value={request.documentReference || "Not specified"}
                      />
                      <DetailItem
                        icon={AlertCircle}
                        label="Reason"
                        value={request.reason || "Not provided"}
                      />
                      <DetailItem
                        icon={ShieldCheck}
                        label="Share status"
                        value={request.shareStatus || "Not shared"}
                      />
                      <DetailItem
                        icon={TimerReset}
                        label="Expiry"
                        value={
                          request.shareExpiresAt
                            ? formatDateTime(request.shareExpiresAt)
                            : "Not configured"
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1.5 line-clamp-3 text-[11px] font-semibold leading-4 text-slate-700 dark:text-slate-200">
        {value || "Not available"}
      </p>
    </div>
  );
}

export default function CrossDepartmentAccessPage() {
  const [activeTab, setActiveTab] = useState("request");
  const [departments, setDepartments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [departmentError, setDepartmentError] = useState("");
  const [requestError, setRequestError] = useState("");

  const currentUser = useMemo(() => decodeToken() || {}, []);
  const currentUserId = currentUser?.id ?? null;
  const currentUserRole = currentUser?.role ?? null;
  const canManageRequests = DEPARTMENT_OWNER_ROLES.has(currentUserRole);

  const TABS = useMemo(
    () => ALL_TABS.filter((tab) => tab.key !== "manage" || canManageRequests),
    [canManageRequests],
  );

  useEffect(() => {
    if (activeTab === "manage" && !canManageRequests) {
      setActiveTab("request");
    }
  }, [activeTab, canManageRequests]);

  const loadDepartments = useCallback(async () => {
    try {
      setDepartmentError("");
      const tenantId = getCurrentTenantId();
      if (!tenantId) {
        setDepartmentError("Tenant context is unavailable.");
        setDepartments([]);
        return;
      }

      const res = await get(`/departments/tenant/${tenantId}`);
      const list = res?.data || res || [];
      setDepartments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load departments:", err);
      setDepartments([]);
      setDepartmentError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load departments.",
      );
    }
  }, []);

  const loadRequests = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      setRequestError("");
      const res = await getDocumentAccessRequests();
      const list = res?.data || res || [];
      setRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load document access requests:", err);
      setRequests([]);
      setRequestError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load request records.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleViewShare = useCallback(async (shareId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}${getTemporaryShareViewUrl(shareId)}`,
        { headers: authHeaders(false) },
      );
      if (!res.ok) throw new Error("Unable to open the shared document.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      alert(err?.message || "Unable to open the shared document.");
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const myRequests = useMemo(
    () =>
      requests.filter(
        (request) => String(request.requesterUserId) === String(currentUserId),
      ),
    [requests, currentUserId],
  );

  const sharedWithMe = useMemo(
    () =>
      requests.filter(
        (request) =>
          String(
            request.recipientUserId ??
              request.recipientId ??
              request.sharedWithUserId ??
              "",
          ) === String(currentUserId) && request.status === "SHARED",
      ),
    [requests, currentUserId],
  );

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "PENDING").length,
    [requests],
  );

  const activeShares = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status === "SHARED" &&
          request.shareStatus !== "REVOKED" &&
          request.shareStatus !== "EXPIRED",
      ).length,
    [requests],
  );

  const completedRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status === "SHARED" || request.status === "APPROVED",
      ).length,
    [requests],
  );

  return (
    <div className="min-h-full w-full bg-[#f6f8fc] px-3 py-4 sm:px-5 lg:px-6 dark:bg-slate-950">
      <style>{`
        @keyframes cda-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cda-rise { animation: cda-rise .42s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .cda-rise { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-[1500px]">
        <section className="cda-rise relative overflow-hidden rounded-[20px] border border-blue-500/20 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-5 py-4 shadow-[0_18px_45px_rgba(37,99,235,0.18)] sm:px-6 sm:py-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_20%,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_75%_120%,rgba(139,92,246,0.28),transparent_32%)]" />{" "}
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                Cross-Department Access
              </div>
              <h1 className="mt-1 text-[22px] font-bold tracking-tight text-white sm:text-[25px]">
                Controlled document access workspace
              </h1>
              <p className="mt-1 max-w-3xl text-[12px] leading-5 text-blue-50/90">
                {" "}
                Raise controlled requests, track their full submission timeline,
                review owner actions and open temporary shared documents
                securely.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadRequests({ silent: true })}
              disabled={refreshing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-bold text-white backdrop-blur transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh workspace
            </button>
          </div>
        </section>

        <section className="cda-rise mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={ClipboardIcon}
            label="My requests"
            value={myRequests.length}
            helper="Requests raised by your account"
            tone="blue"
          />
          <SummaryCard
            icon={Clock3}
            label="Pending"
            value={pendingRequests}
            helper="Waiting for owner action"
            tone="amber"
          />
          <SummaryCard
            icon={ShieldCheck}
            label="Active shares"
            value={activeShares}
            helper="Currently available secure shares"
            tone="emerald"
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Completed"
            value={completedRequests}
            helper="Approved or shared requests"
            tone="violet"
          />
        </section>

        {(departmentError || requestError) && (
          <div className="cda-rise mt-4 grid gap-3 sm:grid-cols-2">
            {departmentError && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-bold">Department data unavailable</p>
                  <p className="mt-0.5 text-[10px] leading-4 opacity-80">
                    {departmentError}
                  </p>
                </div>
              </div>
            )}
            {requestError && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-bold">Request data unavailable</p>
                  <p className="mt-0.5 text-[10px] leading-4 opacity-80">
                    {requestError}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <section className="cda-rise mt-4 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200/80 px-3 pt-3 dark:border-slate-800 sm:px-4">
            <div className="flex gap-1 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                const count =
                  tab.key === "mine"
                    ? myRequests.length
                    : tab.key === "shared"
                      ? sharedWithMe.length
                      : tab.key === "manage"
                        ? pendingRequests
                        : 0;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`group relative inline-flex shrink-0 items-center gap-2 rounded-t-xl px-3.5 py-3 text-xs font-bold transition sm:text-sm ${
                      active
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        active
                          ? "text-blue-600 dark:text-blue-300"
                          : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                      }`}
                    />
                    {tab.label}
                    {count > 0 && (
                      <span
                        className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[9px] font-bold ${
                          active
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                    <span
                      className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 transition ${
                        active ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {activeTab === "request" && (
              <div className="cda-rise">
                <RequestDocumentAccess
                  departments={departments}
                  onSuccess={async () => {
                    await loadRequests({ silent: true });
                    setActiveTab("mine");
                  }}
                />
              </div>
            )}

            {activeTab === "mine" && (
              <div className="cda-rise">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">
                      My workspace
                    </p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Requests I submitted
                    </h2>
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                      See exactly when the request was raised, who owns it, the
                      current status and the latest access timeline.
                    </p>
                  </div>
                </div>

                <RequestsTable
                  requests={myRequests}
                  loading={loading}
                  mode="mine"
                  currentUserId={currentUserId}
                  departments={departments}
                />
              </div>
            )}

            {activeTab === "manage" && canManageRequests && (
              <div className="cda-rise">
                <div className="mb-4 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-blue-50 p-4 dark:border-violet-900/30 dark:from-violet-950/30 dark:via-slate-900 dark:to-blue-950/20">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm ring-1 ring-violet-100 dark:bg-slate-900 dark:text-violet-300 dark:ring-violet-900/40">
                        <UsersRound className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Department request management
                        </p>
                        <p className="mt-1 text-[10.5px] leading-5 text-slate-500 dark:text-slate-400">
                          Review incoming requests, locate the existing DMS
                          record, prepare a temporary share and apply masking
                          when required.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start rounded-xl border border-violet-200 bg-white px-3 py-2 text-[10px] font-bold text-violet-700 dark:border-violet-900/40 dark:bg-slate-900 dark:text-violet-300">
                      <Clock3 className="h-3.5 w-3.5" />
                      {pendingRequests} pending requests
                    </div>
                  </div>
                </div>

                <ManageDocumentRequestFlow />
              </div>
            )}

            {activeTab === "shared" && (
              <div className="cda-rise">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
                      Recipient access
                    </p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Shared with me
                    </h2>
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Open active document shares through the protected viewer.
                      The table also records the share expiry and request
                      origin.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 self-start rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Secure view only
                  </div>
                </div>

                <RequestsTable
                  requests={sharedWithMe}
                  loading={loading}
                  mode="shared"
                  currentUserId={currentUserId}
                  departments={departments}
                  onViewShare={handleViewShare}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
