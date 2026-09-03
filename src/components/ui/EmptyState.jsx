import { Inbox } from "lucide-react";
import AppButton from "./Button";

/**
 * EmptyState — used for empty tables/folders and for error states (pass tone="error").
 * Copy should say what happened and what to do next, in the interface's voice.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description,
  actionLabel,
  onAction,
  tone = "empty",
  className = "",
}) {
  const isError = tone === "error";
  return (
    <div className={`flex flex-col items-center justify-center rounded-app-lg border border-dashed border-[var(--border-default)] px-6 py-14 text-center ${className}`}>
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
          isError ? "bg-danger-50 dark:bg-danger-500/15" : "bg-brand-50 dark:bg-brand-500/15"
        }`}
      >
        <Icon className={`h-6 w-6 ${isError ? "text-danger-500" : "text-brand-500"}`} />
      </div>
      <h3 className="font-display font-semibold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-[var(--text-secondary)]">{description}</p>
      )}
      {actionLabel && onAction && (
        <AppButton className="mt-5" variant={isError ? "secondary" : "primary"} onClick={onAction}>
          {actionLabel}
        </AppButton>
      )}
    </div>
  );
}
