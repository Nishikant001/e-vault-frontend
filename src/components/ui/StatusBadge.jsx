import { CheckCircle2, Clock, XCircle, AlertTriangle, Circle } from "lucide-react";

// Maps common DMS status strings to a semantic tone. Add synonyms here rather
// than inlining color logic on every page.
const STATUS_MAP = {
  active: "success", connected: "success", approved: "success", completed: "success", paid: "success", online: "success",
  pending: "warning", "in review": "warning", processing: "warning", draft: "warning", queued: "warning",
  rejected: "danger", failed: "danger", inactive: "danger", overdue: "danger", disconnected: "danger", expired: "danger",
  info: "info", new: "info", uploaded: "info",
};

const TONE_STYLES = {
  success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500",
  danger: "bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-500",
  info: "bg-info-50 text-info-600 dark:bg-info-500/15 dark:text-info-500",
  neutral: "bg-[var(--surface-sunken)] text-[var(--text-secondary)]",
};

const TONE_ICONS = {
  success: CheckCircle2,
  warning: Clock,
  danger: XCircle,
  info: AlertTriangle,
  neutral: Circle,
};

export default function StatusBadge({ status, tone, showIcon = true, className = "" }) {
  const resolvedTone = tone || STATUS_MAP[String(status).toLowerCase()] || "neutral";
  const Icon = TONE_ICONS[resolvedTone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_STYLES[resolvedTone]} ${className}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {status}
    </span>
  );
}
