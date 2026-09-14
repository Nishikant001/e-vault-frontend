import { Search, X } from "lucide-react";

export default function AppSearch({ value, onChange, placeholder = "Search...", className = "", ...props }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-app-md border border-[var(--border-default)] bg-[var(--surface-card)]
          pl-9 pr-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
          transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        {...props}
      />
      {value && (
        <button
          onClick={() => onChange?.("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
