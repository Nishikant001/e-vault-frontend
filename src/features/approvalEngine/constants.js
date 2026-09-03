// src/features/approvalEngine/constants.js
//
// Nothing DMS-specific lives here — this is the vocabulary of the
// reusable engine itself (roles that can act in ANY chain, the four
// ways an approver can be resolved, and the statuses a run can be in).

export const ACTOR_ROLES = [
  "TenantAdmin",
  "BranchManager",
  "DeptHead",
  "Manager",
  "Approver",
  "Uploader",
];

export const APPROVER_TYPES = [
  { value: "ROLE", label: "By Role" },
  { value: "USER", label: "Specific User" },
  { value: "DESIGNATION", label: "By Designation" },
  { value: "DEPARTMENT", label: "By Department" },
];

// DocumentApproval.status values, mapped to the shared StatusBadge tones.
export const RUN_STATUS_TONE = {
  SUBMITTED: "info",
  PENDING_APPROVAL: "warning",
  PARTIALLY_APPROVED: "warning",
  APPROVED: "success",
  COMPLETED: "success",
  REJECTED: "danger",
  CANCELLED: "danger",
  SENT_BACK: "warning",
};

export const RUN_STATUS_LABEL = {
  SUBMITTED: "Submitted",
  PENDING_APPROVAL: "Pending Approval",
  PARTIALLY_APPROVED: "Partially Approved",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  SENT_BACK: "Sent Back",
};

export const ACTION_LABEL = {
  SUBMIT: "Submitted",
  APPROVE: "Approved",
  REJECT: "Rejected",
  SEND_BACK: "Sent Back",
  CANCEL: "Cancelled",
  RESUBMIT: "Resubmitted",
  COMMENT: "Commented",
};

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

let localKeySeq = 1;
export function newKey() {
  return `new-${Date.now()}-${localKeySeq++}`;
}

// Creates a fresh, empty approval level for the Workflow Builder. Lives
// here (not in WorkflowBuilder.jsx) so that file can stay a pure
// component module.
export function emptyLevel(index) {
  return {
    key: newKey(),
    name: `Level ${index + 1}`,
    isParallel: false,
    assignments: [{ approverType: "ROLE", approverRole: "", approverUserId: null, approverDepartmentId: null }],
  };
}
