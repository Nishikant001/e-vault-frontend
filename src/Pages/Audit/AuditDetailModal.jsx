import { useEffect, useState } from "react";
import {
  X,
  User,
  Zap,
  Layers,
  Clock,
  Globe,
  Monitor,
  Smartphone,
  FileText,
  Database,
  MessageSquare,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { fetchAuditLogById } from "./auditApi";
import { actionColor, statusColor, formatDateTime, displayValue } from "./auditDisplay";

function Field({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5">
      <div className="mt-0.5 w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center flex-shrink-0">
        <Icon size={12} className="text-slate-400 dark:text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">
          {label}
        </div>
        <div className="text-[12.5px] text-slate-700 dark:text-slate-200 break-words">{children}</div>
      </div>
    </div>
  );
}

function ValueBlock({ label, value, tone }) {
  const empty = value === null || value === undefined;
  return (
    <div className="flex-1 min-w-0">
      <div
        className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${
          tone === "old" ? "text-red-500 dark:text-red-400" : "text-green-600 dark:text-green-400"
        }`}
      >
        {label}
      </div>
      <pre
        className={`text-[11px] leading-[1.5] font-mono whitespace-pre-wrap break-words rounded-lg border p-2.5 max-h-52 overflow-auto ${
          empty
            ? "text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
            : tone === "old"
            ? "text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10"
            : "text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10"
        }`}
      >
        {empty ? "No data" : displayValue(value)}
      </pre>
    </div>
  );
}

export default function AuditDetailModal({ entry, onClose }) {
  const [detail, setDetail] = useState(entry);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The row already carries most fields, but we re-fetch by id to guarantee
  // the modal always reflects the full, authoritative record (oldValue/
  // newValue can be large and some list views may choose to trim them later).
  useEffect(() => {
    if (!entry?.id) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchAuditLogById(entry.id)
      .then((full) => {
        if (!cancelled) setDetail(full || entry);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load full details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entry]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!entry) return null;
  const e = detail || entry;
  const ts = formatDateTime(e.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A2433] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">Audit Entry #{e.id}</h2>
              <span className={`text-[10px] font-bold px-2 py-[3px] rounded-full ${actionColor(e.action)}`}>
                {e.action || "—"}
              </span>
              <span className={`text-[10px] font-bold px-2 py-[3px] rounded-full border ${statusColor(e.status)}`}>
                {e.status || "SUCCESS"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {ts.date} at {ts.time}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4">
          {loading && !detail && (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
              <Loader2 size={16} className="animate-spin" /> Loading full details…
            </div>
          )}

          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-[11.5px] text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle size={13} /> {error} — showing the summary from the list.
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            <Field icon={User} label="User">
              {e.username || (e.userId ? `User #${e.userId}` : "System")}
              {e.role && <span className="ml-2 text-[10.5px] text-slate-400">({e.role})</span>}
            </Field>
            <Field icon={Layers} label="Module">
              {e.module || "—"}
            </Field>
            <Field icon={Zap} label="Action">
              {e.action || "—"}
            </Field>
            <Field icon={Clock} label="Timestamp">
              {ts.date} · {ts.time}
            </Field>
            {e.department && (
              <Field icon={Layers} label="Department">
                {e.department}
              </Field>
            )}
            <Field icon={FileText} label="Document">
              {e.documentId ? `Internal Document #${e.documentId}` : "—"}
            </Field>
            <Field icon={Database} label="SAP Document">
              {e.sapDocumentId || "—"}
            </Field>
            <Field icon={Globe} label="IP Address">
              {e.ipAddress || "—"}
            </Field>
            <Field icon={Monitor} label="Browser">
              {e.browser || "—"}
            </Field>
            <Field icon={Smartphone} label="Device / OS">
              {[e.device, e.operatingSystem].filter(Boolean).join(" · ") || "—"}
            </Field>
            <Field icon={MessageSquare} label="Remarks">
              {e.remarks || e.details || "—"}
            </Field>
          </div>

          {/* Old / New value diff */}
          {(e.oldValue || e.newValue) && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                Change Details
              </div>
              <div className="flex gap-3 flex-col sm:flex-row">
                <ValueBlock label="Old Value" value={e.oldValue} tone="old" />
                <ValueBlock label="New Value" value={e.newValue} tone="new" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
