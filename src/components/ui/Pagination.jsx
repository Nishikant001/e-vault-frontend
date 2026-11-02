import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onChange, totalItems, pageSize }) {
  if (totalPages <= 1 && !totalItems) return null;

  const pages = [];
  const windowSize = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= windowSize) pages.push(p);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }

  const rangeStart = totalItems ? (page - 1) * pageSize + 1 : null;
  const rangeEnd = totalItems ? Math.min(page * pageSize, totalItems) : null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--border-subtle)] px-1 py-3 sm:flex-row">
      {totalItems != null && (
        <p className="text-xs text-[var(--text-tertiary)]">
          Showing <span className="font-medium text-[var(--text-secondary)]">{rangeStart}–{rangeEnd}</span> of{" "}
          <span className="font-medium text-[var(--text-secondary)]">{totalItems}</span>
        </p>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-app-sm text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="px-1.5 text-[var(--text-tertiary)]">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`flex h-8 min-w-8 items-center justify-center rounded-app-sm px-2 text-sm font-medium transition-colors
                ${p === page ? "bg-brand-500 text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"}`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-app-sm text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
