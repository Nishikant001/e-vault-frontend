import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastCtx = createContext(null);

const TONE = {
  success: { icon: CheckCircle2, className: "text-success-500", bar: "bg-success-500" },
  error: { icon: XCircle, className: "text-danger-500", bar: "bg-danger-500" },
  warning: { icon: AlertTriangle, className: "text-warning-500", bar: "bg-warning-500" },
  info: { icon: Info, className: "text-info-500", bar: "bg-info-500" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, tone = "info", duration = 4000 }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, title, description, tone }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  return (
    <ToastCtx.Provider value={{ toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2.5">
        {toasts.map((t) => {
          const { icon: Icon, className, bar } = TONE[t.tone] || TONE.info;
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto relative overflow-hidden rounded-app-md border border-[var(--border-subtle)]
                bg-[var(--surface-card)] shadow-app-lg animate-[toastIn_200ms_cubic-bezier(0.16,1,0.3,1)]"
            >
              <div className={`absolute left-0 top-0 h-full w-1 ${bar}`} />
              <div className="flex items-start gap-3 py-3 pl-4 pr-3">
                <Icon className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${className}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{t.description}</p>}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="rounded-app-sm p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
