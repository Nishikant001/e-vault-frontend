import { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

const AppInput = forwardRef(function AppInput(
  { label, hint, error, icon: Icon, required, className = "", id, ...props },
  ref,
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={`h-10 w-full rounded-app-md border bg-[var(--surface-card)] text-sm text-[var(--text-primary)]
            placeholder:text-[var(--text-tertiary)] transition-colors
            focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
            disabled:bg-[var(--surface-sunken)] disabled:cursor-not-allowed
            ${Icon ? "pl-9 pr-3" : "px-3"}
            ${error ? "border-danger-500" : "border-[var(--border-default)]"}
            ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600 dark:text-danger-500">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">{hint}</p>
      ) : null}
    </div>
  );
});

export default AppInput;
