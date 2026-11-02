
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  RefreshCw,
  FileText,
  CheckCircle2,
  Upload,
  Clock3,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;

function getToken() {
  return localStorage.getItem("accessToken") || "";
}

function authHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
}

const STATUS_META = {
  COMPLETED: {
    label: "Completed",
    color:
      "text-green-700 dark:text-green-400",
    bg:
      "bg-green-50 dark:bg-green-900/20",
    border:
      "border-green-200 dark:border-green-800",
  },

  WAITING_FOR_APPROVAL: {
    label: "Pending Approval",
    color:
      "text-amber-700 dark:text-amber-400",
    bg:
      "bg-amber-50 dark:bg-amber-900/20",
    border:
      "border-amber-200 dark:border-amber-800",
  },

  OCR_PROCESSING: {
    label: "OCR Processing",
    color:
      "text-blue-700 dark:text-blue-400",
    bg:
      "bg-blue-50 dark:bg-blue-900/20",
    border:
      "border-blue-200 dark:border-blue-800",
  },

  OCR_COMPLETED: {
    label: "OCR Completed",
    color:
      "text-blue-700 dark:text-blue-400",
    bg:
      "bg-blue-50 dark:bg-blue-900/20",
    border:
      "border-blue-200 dark:border-blue-800",
  },

  PROCESSING: {
    label: "Processing",
    color:
      "text-blue-700 dark:text-blue-400",
    bg:
      "bg-blue-50 dark:bg-blue-900/20",
    border:
      "border-blue-200 dark:border-blue-800",
  },

  SAVING_TO_SAP: {
    label: "Saving to SAP",
    color:
      "text-purple-700 dark:text-purple-400",
    bg:
      "bg-purple-50 dark:bg-purple-900/20",
    border:
      "border-purple-200 dark:border-purple-800",
  },

  FAILED: {
    label: "Failed",
    color:
      "text-red-700 dark:text-red-400",
    bg:
      "bg-red-50 dark:bg-red-900/20",
    border:
      "border-red-200 dark:border-red-800",
  },
};

function getStatusMeta(status) {
  return (
    STATUS_META[status] || {
      label: status || "Unknown",
      color:
        "text-slate-600 dark:text-slate-400",
      bg:
        "bg-slate-100 dark:bg-slate-800",
      border:
        "border-slate-200 dark:border-slate-700",
    }
  );
}

function getDocumentName(doc) {
  return (
    doc?.originalFileName ||
    doc?.fileName ||
    doc?.filename ||
    doc?.name ||
    "Untitled document"
  );
}

function getDocumentType(doc) {
  return (
    doc?.DocumentType?.name ||
    doc?.documentType?.name ||
    doc?.DocumentTypeName ||
    doc?.documentTypeName ||
    "Document"
  );
}

function getCreatedDate(doc) {
  return (
    doc?.createdAt ||
    doc?.uploadedAt ||
    doc?.created_at ||
    doc?.updatedAt ||
    null
  );
}

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileIcon(name) {
  const fileName = String(name).toLowerCase();

  if (fileName.endsWith(".pdf")) {
    return "📄";
  }

  if (
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".csv")
  ) {
    return "📊";
  }

  if (
    fileName.endsWith(".doc") ||
    fileName.endsWith(".docx")
  ) {
    return "📝";
  }

  if (
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png")
  ) {
    return "🖼️";
  }

  return "📁";
}

function StatCard({
  label,
  value,
  sub,
  icon,
  iconBg,
  accent,
  loading,
  subColor = "text-slate-500 dark:text-slate-400",
}) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${accent}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>

          {loading ? (
            <div className="h-8 w-14 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse mt-2" />
          ) : (
            <p className="text-[28px] font-extrabold leading-tight text-slate-800 dark:text-slate-100 mt-1">
              {value}
            </p>
          )}

          <p
            className={`text-[10.5px] font-medium mt-1 ${subColor}`}
          >
            {sub}
          </p>
        </div>

        <div
          className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function DocumentRow({ doc }) {
  const name = getDocumentName(doc);
  const status = doc?.uploadStatus || doc?.status;
  const meta = getStatusMeta(status);

  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/80 bg-white dark:bg-[#1A2433] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[16px] flex-shrink-0">
        {getFileIcon(name)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">
          {name}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {getDocumentType(doc)}
          </span>

          <span className="text-slate-300 dark:text-slate-600">
            •
          </span>

          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {formatDateTime(getCreatedDate(doc))}
          </span>
        </div>
      </div>

      <span
        className={`text-[9.5px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${meta.bg} ${meta.color} ${meta.border}`}
      >
        {meta.label}
      </span>
    </div>
  );
}

export default function DHDashboard({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [docs, setDocs] = useState([]);

  async function loadDocuments(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const res = await fetch(`${API}/documents`, {
        headers: authHeaders(),
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load documents"
        );
      }

      setDocs(
        Array.isArray(data.data)
          ? data.data
          : []
      );
    } catch (e) {
      console.error(
        "DH Dashboard document fetch error:",
        e
      );

      setError(
        e?.message ||
          "Unable to load documents."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();

    const weekAgo = new Date();
    weekAgo.setDate(
      weekAgo.getDate() - 7
    );

    const uploadedThisWeek = docs.filter(
      (doc) => {
        const value = getCreatedDate(doc);

        if (!value) return false;

        const date = new Date(value);

        return (
          !Number.isNaN(date.getTime()) &&
          date >= weekAgo &&
          date <= now
        );
      }
    ).length;

    const pendingApprovals = docs.filter(
      (doc) =>
        (doc?.uploadStatus || doc?.status) ===
        "WAITING_FOR_APPROVAL"
    );

    const processing = docs.filter((doc) => {
      const status =
        doc?.uploadStatus || doc?.status;

      return [
        "PROCESSING",
        "OCR_PROCESSING",
        "OCR_COMPLETED",
        "SAVING_TO_SAP",
      ].includes(status);
    }).length;

    const completed = docs.filter(
      (doc) =>
        (doc?.uploadStatus || doc?.status) ===
        "COMPLETED"
    ).length;

    return {
      total: docs.length,
      uploadedThisWeek,
      pendingApprovals,
      pendingCount: pendingApprovals.length,
      processing,
      completed,
    };
  }, [docs]);

  const recentDocuments = useMemo(() => {
    return [...docs]
      .sort((a, b) => {
        const aDate = new Date(
          getCreatedDate(a) || 0
        ).getTime();

        const bDate = new Date(
          getCreatedDate(b) || 0
        ).getTime();

        return bDate - aDate;
      })
      .slice(0, 5);
  }, [docs]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-5 sm:p-6 shadow-lg">
        <div className="absolute -right-12 -top-16 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute right-20 -bottom-20 w-32 h-32 rounded-full bg-white/10" />

        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] sm:text-[12px] font-semibold text-blue-100 mb-1">
              Department Head Dashboard
            </p>

            <h1 className="text-[21px] sm:text-[24px] font-extrabold text-white">
              Document Overview
            </h1>

            <p className="text-[11px] sm:text-[12px] text-blue-100 mt-1">
              Monitor documents, workflow progress and approvals.
            </p>
          </div>

          <button
            onClick={() => loadDocuments(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-[11px] font-bold backdrop-blur-sm transition-colors disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="My Documents"
          value={docs.length}
          sub="Documents visible to you"
          icon={
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          }
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          accent="bg-blue-500"
          loading={loading}
        />

        <StatCard
          label="Pending Approvals"
          value={stats.pendingCount}
          sub={
            stats.pendingCount > 0
              ? "Requires review"
              : "Nothing pending"
          }
          subColor={
            stats.pendingCount > 0
              ? "text-amber-600 dark:text-amber-400"
              : "text-green-600 dark:text-green-400"
          }
          icon={
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          }
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          accent="bg-amber-500"
          loading={loading}
        />

        <StatCard
          label="Uploaded"
          value={stats.uploadedThisWeek}
          sub="Last 7 days"
          icon={
            <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          }
          iconBg="bg-indigo-50 dark:bg-indigo-900/20"
          accent="bg-indigo-500"
          loading={loading}
        />

        <StatCard
          label="In Progress"
          value={stats.processing}
          sub={
            stats.processing > 0
              ? "Active workflow"
              : "No active processing"
          }
          subColor="text-blue-600 dark:text-blue-400"
          icon={
            <Clock3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          }
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          accent="bg-blue-500"
          loading={loading}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
        {/* Recent Documents */}
        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">
                Recent Documents
              </h2>

              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Latest documents available in your workspace
              </p>
            </div>

            <button
              onClick={() =>
                onNavigate?.("documents")
              }
              className="flex items-center gap-1 text-[10.5px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mb-2" />

              <span className="text-[11px]">
                Loading documents...
              </span>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />

                <div>
                  <p className="text-[12px] font-semibold text-red-700 dark:text-red-400">
                    Unable to load documents
                  </p>

                  <p className="text-[10.5px] text-red-500 dark:text-red-400/80 mt-1">
                    {error}
                  </p>

                  <button
                    onClick={() =>
                      loadDocuments()
                    }
                    className="mt-3 text-[10.5px] font-bold text-red-600 dark:text-red-400 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          ) : recentDocuments.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>

              <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                No documents yet
              </p>

              <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1">
                Documents will appear here once they are uploaded.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDocuments.map((doc) => (
                <DocumentRow
                  key={
                    doc?.id ||
                    `${getDocumentName(doc)}-${getCreatedDate(doc)}`
                  }
                  doc={doc}
                />
              ))}
            </div>
          )}

          <button
            onClick={() =>
              onNavigate?.("workflow")
            }
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11.5px] font-bold transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            New Document
          </button>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">
                Pending Approvals
              </h2>

              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Documents awaiting approval
              </p>
            </div>

            {stats.pendingCount > 0 && (
              <span className="min-w-6 h-6 px-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold">
                {stats.pendingCount}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mb-2" />

              <span className="text-[11px]">
                Loading approvals...
              </span>
            </div>
          ) : stats.pendingApprovals.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>

              <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                All caught up
              </p>

              <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1">
                There are no documents waiting for approval.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[390px] overflow-y-auto pr-1">
              {stats.pendingApprovals
                .slice(0, 8)
                .map((doc) => {
                  const name =
                    getDocumentName(doc);

                  return (
                    <div
                      key={
                        doc?.id ||
                        `${name}-${getCreatedDate(doc)}`
                      }
                      className="p-3 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1A2433] border border-amber-200 dark:border-amber-800 flex items-center justify-center text-[14px] flex-shrink-0">
                          {getFileIcon(name)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 truncate">
                            {name}
                          </p>

                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            {getDocumentType(doc)}
                          </p>

                          <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {formatDateTime(
                              getCreatedDate(doc)
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          onNavigate?.("approvals")
                        }
                        className="mt-3 w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-bold transition-colors"
                      >
                        Review Document
                      </button>
                    </div>
                  );
                })}
            </div>
          )}

          {!loading &&
            stats.pendingCount > 0 && (
              <button
                onClick={() =>
                  onNavigate?.("approvals")
                }
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[10.5px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                View all approvals
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
        </div>
      </div>

      {/* Bottom Summary */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Total Documents
            </p>

            <p className="text-[22px] font-extrabold text-slate-800 dark:text-slate-100 mt-1">
              {stats.total}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Completed
            </p>

            <p className="text-[22px] font-extrabold text-green-600 dark:text-green-400 mt-1">
              {stats.completed}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Active Workflow
            </p>

            <p className="text-[22px] font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {stats.processing}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

