import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  Loader2,
  Eye,
  Clock3,
  UserRound,
  Workflow,
  MessageSquareText,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import AppDrawer from "../../components/ui/Drawer";
import StatusBadge from "../../components/ui/StatusBadge";
import Tabs from "../../components/ui/Tabs";
import { ApprovalActionApi, decodeToken } from "./api";
import { RUN_STATUS_LABEL, formatDateTime } from "./constants";
import ApprovalTimeline from "./ApprovalTimeline";
import ApprovalActionsPanel from "./ApprovalActionsPanel";
import { API_BASE_URL } from "../../services/apiClient";

const IN_PROGRESS = ["SUBMITTED", "PENDING_APPROVAL", "PARTIALLY_APPROVED"];

function userCanActOnCurrentLevel(user, data) {
  if (!data || !IN_PROGRESS.includes(data.status)) return false;
  const levels = data.ApprovalWorkflow?.levels || [];
  const level = levels.find((item) => item.levelNumber === data.currentLevel);
  if (!level) return false;

  if (
    String(user?.id) === String(data.Document?.uploadedBy) &&
    !data.ApprovalWorkflow?.allowSelfApproval
  ) {
    return false;
  }

  return (level.assignments || []).some((assignment) => {
    if (assignment.approverType === "USER") {
      return String(assignment.approverUserId) === String(user?.id);
    }
    return assignment.approverRole && assignment.approverRole === user?.role;
  });
}

function SummaryMetric({ icon: Icon, label, value, tone = "blue" }) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  };

  return (
    <div className="min-w-0 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-3 shadow-sm sm:p-3.5">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>
      <p className="truncate text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
        {value ?? "—"}
      </p>
      <p className="mt-1 text-[11px] font-medium text-[var(--text-tertiary)] sm:text-xs">{label}</p>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-3 flex items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs leading-5 text-[var(--text-tertiary)]">{description}</p>
        )}
      </div>
    </div>
  );
}

export default function ApprovalDetailsDrawer({
  documentApprovalId,
  open,
  onClose,
  onChanged,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("timeline");
  const [viewingDoc, setViewingDoc] = useState(false);

  const load = useCallback(() => {
    if (!documentApprovalId) return Promise.resolve();
    setLoading(true);
    setLoadError("");

    return ApprovalActionApi.getById(documentApprovalId)
      .then((response) => setData(response.data))
      .catch((error) => {
        setData(null);
        setLoadError(error?.message || "Could not load approval details.");
      })
      .finally(() => setLoading(false));
  }, [documentApprovalId]);

  const handleViewDocument = async () => {
    if (!data?.documentId || viewingDoc) return;

    setViewingDoc(true);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const response = await fetch(
        `${API_BASE_URL}/documents/${data.documentId}/view`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load document (status ${response.status})`);
      }

      const blob = await response.blob();
      if (!blob.size) throw new Error("The server returned an empty document.");

      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (!newWindow) {
        URL.revokeObjectURL(url);
        throw new Error("The document window was blocked. Allow pop-ups and try again.");
      }
      // Keep the object URL alive while the newly opened tab uses it.
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      window.alert(`Could not open document: ${error.message}`);
    } finally {
      setViewingDoc(false);
    }
  };

  useEffect(() => {
    if (open) {
      setTab("timeline");
      load();
    }
  }, [open, load]);

  const user = decodeToken();
  const canAct = data ? userCanActOnCurrentLevel(user, data) : false;
  const workflow = data?.ApprovalWorkflow;
  const documentName = data?.Document?.fileName || `Document #${data?.documentId ?? ""}`;
  const statusLabel = data
    ? RUN_STATUS_LABEL[data.status] || data.status
    : "";

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Approval details"
      subtitle="Review document information, workflow progress and decisions."
      width="xl"
    >
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-start justify-center bg-[var(--surface-card)]/75 pt-24 backdrop-blur-[2px]">
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-secondary)] shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              Loading approval details…
            </div>
          </div>
        )}

        {!data && !loading && (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[var(--text-primary)]">
              {loadError ? "Unable to load approval" : "Approval details unavailable"}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
              {loadError || "Select an approval item to view its details."}
            </p>
            {loadError && (
              <button
                type="button"
                onClick={load}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--border-default)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-sunken)]"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            )}
          </div>
        )}

        {data && (
          <div className="space-y-4 pb-2">
            {/* Document identity */}
            <section className="overflow-hidden rounded-2xl border border-blue-100/90 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 shadow-sm dark:border-blue-900/50 dark:from-blue-950/35 dark:via-slate-900 dark:to-indigo-950/25">
              <div className="p-3.5 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                    <FileText className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
                        Document approval
                      </span>
                      <StatusBadge status={statusLabel} />
                    </div>
                    <h2 className="mt-1.5 break-words text-base font-bold leading-6 text-slate-950 dark:text-white sm:text-lg">
                      {documentName}
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                      {workflow?.name || "Approval workflow"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 border-t border-blue-100 pt-3 dark:border-slate-700 sm:grid-cols-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Submitted
                      </p>
                      <p className="mt-0.5 break-words text-xs font-medium text-slate-800 dark:text-slate-200">
                        {formatDateTime(data.submittedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex min-w-0 items-start gap-2">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Submitted by
                      </p>
                      <p className="mt-0.5 break-words text-xs font-medium text-slate-800 dark:text-slate-200">
                        {data.submitter?.name || data.submitter?.email || "Not available"}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleViewDocument}
                  disabled={viewingDoc}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/15 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {viewingDoc ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {viewingDoc ? "Opening document…" : "Preview source document"}
                  {!viewingDoc && <ArrowUpRight className="ml-auto h-4 w-4 opacity-80" />}
                </button>
              </div>
            </section>

            {/* Workflow metrics */}
            <section>
              <div className="mb-2.5 flex items-center gap-2">
                <Workflow className="h-4 w-4 text-[var(--text-tertiary)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Workflow overview</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <SummaryMetric
                  icon={CheckCircle2}
                  label="Current level"
                  value={data.currentLevel ?? "—"}
                  tone="blue"
                />
                <SummaryMetric
                  icon={Workflow}
                  label="Total levels"
                  value={data.totalLevels ?? workflow?.levels?.length ?? "—"}
                  tone="violet"
                />
                <SummaryMetric
                  icon={ShieldCheck}
                  label="Can take action"
                  value={canAct ? "Yes" : "No"}
                  tone="slate"
                />
              </div>
            </section>

            {/* Detail tabs */}
            <section className="min-w-0 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-3 sm:p-3.5">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Approval activity</h3>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Follow progress, inspect the configured levels, and read reviewer comments.
                </p>
              </div>
              <Tabs
                tabs={[
                  { value: "timeline", label: "Timeline", icon: Clock3 },
                  { value: "levels", label: "Workflow", icon: Workflow },
                  {
                    value: "comments",
                    label: `Comments (${data.comments?.length || 0})`,
                    icon: MessageSquareText,
                  },
                ]}
                value={tab}
                onChange={setTab}
              />

              <div className="mt-4 min-w-0">
                {tab === "timeline" && (
                  <ApprovalTimeline
                    history={data.history || []}
                    sapCompleted={data.status === "COMPLETED"}
                  />
                )}

                {tab === "levels" && (
                  <div className="space-y-2">
                    {(workflow?.levels || []).length === 0 && (
                      <p className="rounded-xl bg-[var(--surface-sunken)] p-4 text-sm text-[var(--text-tertiary)]">
                        No workflow levels are available for this approval.
                      </p>
                    )}
                    {(workflow?.levels || []).map((level) => {
                      const current = level.levelNumber === data.currentLevel;
                      const assignments = (level.assignments || [])
                        .map((assignment) => assignment.approverRole || assignment.approverUserId)
                        .filter(Boolean);

                      return (
                        <div
                          key={level.id}
                          className={`rounded-xl border p-3 transition-colors ${
                            current
                              ? "border-blue-300 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-950/30"
                              : "border-[var(--border-default)] bg-[var(--surface-card)]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                current
                                  ? "bg-blue-600 text-white"
                                  : "bg-[var(--surface-sunken)] text-[var(--text-secondary)]"
                              }`}
                            >
                              {level.levelNumber}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                  {level.name || `Level ${level.levelNumber}`}
                                </p>
                                {current && (
                                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-200">
                                    Current level
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 break-words text-xs leading-5 text-[var(--text-tertiary)]">
                                {assignments.length
                                  ? assignments.join(", ")
                                  : "No approver assigned"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {tab === "comments" && (
                  <div className="space-y-3">
                    {(data.comments || []).length === 0 && (
                      <div className="flex flex-col items-center rounded-xl border border-dashed border-[var(--border-default)] px-4 py-8 text-center">
                        <MessageSquareText className="h-7 w-7 text-[var(--text-tertiary)]" />
                        <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                          No comments yet
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                          Reviewer comments will appear here when available.
                        </p>
                      </div>
                    )}
                    {(data.comments || []).map((comment) => (
                      <article
                        key={comment.id}
                        className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-3 sm:p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-sunken)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                            <MessageSquareText className="h-3 w-3" />
                            Level {comment.levelNumber}
                          </span>
                          <span className="text-right text-[10px] text-[var(--text-tertiary)]">
                            {formatDateTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--text-secondary)]">
                          {comment.comment}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Actions */}
            <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-3 sm:p-3.5">
              <div className="mb-3 flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Decision & actions
                  </h3>
                  <p className="mt-0.5 text-xs leading-5 text-[var(--text-tertiary)]">
                    Available actions depend on your role and the current workflow level.
                  </p>
                </div>
              </div>
              {!canAct && IN_PROGRESS.includes(data.status) && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
                  <p className="text-xs leading-5 text-amber-800 dark:text-amber-200">
                    This approval is not currently actionable by your account at this workflow level.
                  </p>
                </div>
              )}
              {data.status === "COMPLETED" && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                  <p className="text-xs leading-5 text-emerald-800 dark:text-emerald-200">
                    This approval workflow is completed.
                  </p>
                </div>
              )}
              <ApprovalActionsPanel
                documentApprovalId={data.id}
                canAct={canAct}
                onDone={() => {
                  load();
                  onChanged?.();
                }}
              />
            </section>
          </div>
        )}
      </div>
    </AppDrawer>
  );
}
