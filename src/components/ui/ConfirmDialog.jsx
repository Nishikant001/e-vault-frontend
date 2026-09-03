import { AlertTriangle } from "lucide-react";
import AppModal from "./Modal";
import AppButton from "./Button";

/**
 * ConfirmDialog — for destructive or consequential actions
 * (delete tenant, revoke user, deactivate plant, etc).
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
}) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </AppButton>
          <AppButton variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </AppButton>
        </>
      }
    >
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            tone === "danger" ? "bg-danger-50 dark:bg-danger-500/15" : "bg-warning-50 dark:bg-warning-500/15"
          }`}
        >
          <AlertTriangle className={`h-5 w-5 ${tone === "danger" ? "text-danger-500" : "text-warning-500"}`} />
        </div>
        <div>
          <h3 className="font-display font-semibold text-[var(--text-primary)]">{title}</h3>
          {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
        </div>
      </div>
    </AppModal>
  );
}
