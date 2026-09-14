// src/features/approvalEngine/ApprovalTimeline.jsx
//
// Generic vertical timeline. Takes an array of ApprovalHistory rows
// (action, actionByName, actionByRole, oldStatus, newStatus, comments,
// rejectReason, createdAt, levelNumber) — nothing DMS-specific.
import { CheckCircle2, XCircle, RotateCcw, Send, Ban, MessageSquare, Upload } from "lucide-react";
import { ACTION_LABEL, formatDateTime } from "./constants";

const ACTION_ICON = {
  SUBMIT: Send,
  APPROVE: CheckCircle2,
  REJECT: XCircle,
  SEND_BACK: RotateCcw,
  CANCEL: Ban,
  RESUBMIT: Send,
  COMMENT: MessageSquare,
};

const ACTION_TONE = {
  SUBMIT: "text-info-500 bg-info-50 dark:bg-info-500/15",
  APPROVE: "text-success-500 bg-success-50 dark:bg-success-500/15",
  REJECT: "text-danger-500 bg-danger-50 dark:bg-danger-500/15",
  SEND_BACK: "text-warning-500 bg-warning-50 dark:bg-warning-500/15",
  CANCEL: "text-danger-500 bg-danger-50 dark:bg-danger-500/15",
  RESUBMIT: "text-info-500 bg-info-50 dark:bg-info-500/15",
  COMMENT: "text-[var(--text-secondary)] bg-[var(--surface-sunken)]",
};

export default function ApprovalTimeline({ history = [], sapCompleted = false }) {
  if (history.length === 0) {
    return <p className="text-sm text-[var(--text-tertiary)]">No activity yet.</p>;
  }

  const items = [...history];

  return (
    <div className="relative pl-6">
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--border-subtle)]" />
      <div className="space-y-6">
        {items.map((h, i) => {
          const Icon = ACTION_ICON[h.action] || CheckCircle2;
          const tone = ACTION_TONE[h.action] || ACTION_TONE.COMMENT;
          return (
            <div key={h.id ?? i} className="relative">
              <div className={`absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-[var(--surface-card)] ${tone}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {ACTION_LABEL[h.action] || h.action}
                  {h.levelNumber ? <span className="ml-1.5 font-normal text-[var(--text-tertiary)]">· Level {h.levelNumber}</span> : null}
                </p>
                <span className="text-xs text-[var(--text-tertiary)]">{formatDateTime(h.createdAt)}</span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {h.actionByName || "System"}{h.actionByRole ? ` · ${h.actionByRole}` : ""}
              </p>
              {(h.comments || h.rejectReason) && (
                <p className="mt-1.5 rounded-app-md bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                  {h.rejectReason ? <span className="font-medium text-danger-500">Reason: </span> : null}
                  {h.rejectReason || h.comments}
                </p>
              )}
            </div>
          );
        })}

        {sapCompleted && (
          <div className="relative">
            <div className="absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-[var(--surface-card)] text-success-500 bg-success-50 dark:bg-success-500/15">
              <Upload className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">SAP Upload Completed</p>
          </div>
        )}
      </div>
    </div>
  );
}
