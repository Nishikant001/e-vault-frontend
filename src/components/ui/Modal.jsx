import { useEffect } from "react";
import { X } from "lucide-react";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function AppModal({ open, onClose, title, description, size = "md", footer, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--surface-overlay)] backdrop-blur-sm animate-[fadeIn_150ms_ease]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={`relative w-full ${SIZES[size]} rounded-app-xl border border-[var(--border-subtle)] bg-[var(--surface-card)]
          shadow-app-lg animate-[modalIn_180ms_cubic-bezier(0.16,1,0.3,1)] max-h-[90vh] flex flex-col`}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-6 py-4">
            <div>
              {title && (
                <h2 id="modal-title" className="font-display font-semibold text-lg text-[var(--text-primary)]">
                  {title}
                </h2>
              )}
              {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-app-sm p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border-subtle)] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalIn { from { opacity: 0; transform: translateY(8px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}
