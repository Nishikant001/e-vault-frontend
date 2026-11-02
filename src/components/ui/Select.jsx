import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

const AppSelect = forwardRef(function AppSelect(
  { label, hint, error, required, className = "", id, children, ...props },
  ref,
) {
  const selectId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`h-10 w-full appearance-none rounded-app-md border bg-[var(--surface-card)] pl-3 pr-9 text-sm text-[var(--text-primary)]
            transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
            disabled:bg-[var(--surface-sunken)] disabled:cursor-not-allowed
            ${error ? "border-danger-500" : "border-[var(--border-default)]"}
            ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-danger-600 dark:text-danger-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">{hint}</p>
      ) : null}
    </div>
  );
});

export default AppSelect;
