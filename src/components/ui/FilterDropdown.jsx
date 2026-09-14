import { useEffect, useRef, useState } from "react";
import { ChevronDown, Filter, Check } from "lucide-react";

/**
 * AppFilter — a labeled dropdown chip for filtering tables/lists.
 * options: [{ label, value }]
 */
export default function AppFilter({ label, options = [], value, onChange, icon: Icon = Filter }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex h-10 items-center gap-2 rounded-app-md border px-3 text-sm transition-colors
          ${value ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" : "border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-card-hover)]"}`}
      >
        <Icon className="h-4 w-4" />
        {selected ? selected.label : label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-2 min-w-[180px] overflow-hidden rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-app-lg py-1">
          <button
            onClick={() => { onChange?.(null); setOpen(false); }}
            className="flex w-full items-center justify-between px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"
          >
            All
            {!value && <Check className="h-3.5 w-3.5 text-brand-500" />}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange?.(opt.value); setOpen(false); }}
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]"
            >
              {opt.label}
              {value === opt.value && <Check className="h-3.5 w-3.5 text-brand-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
