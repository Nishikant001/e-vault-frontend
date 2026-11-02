import { ChevronRight, Home } from "lucide-react";

/**
 * items: [{ label, onClick }] — last item renders as current (non-clickable) page.
 */
export default function Breadcrumb({ items = [], showHome = true, onHome, className = "" }) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-sm ${className}`}>
      {showHome && (
        <>
          <button
            onClick={onHome}
            className="flex items-center gap-1 rounded-app-sm p-1 text-[var(--text-tertiary)] hover:text-brand-500"
            aria-label="Home"
          >
            <Home className="h-3.5 w-3.5" />
          </button>
          {items.length > 0 && <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />}
        </>
      )}
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {isLast ? (
              <span className="font-medium text-[var(--text-primary)]">{item.label}</span>
            ) : (
              <button onClick={item.onClick} className="text-[var(--text-secondary)] hover:text-brand-500">
                {item.label}
              </button>
            )}
            {!isLast && <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />}
          </span>
        );
      })}
    </nav>
  );
}
