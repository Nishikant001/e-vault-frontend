// src/features/aiAssistant/components/MetadataAndDocCards.jsx
import { FileText, ExternalLink } from "lucide-react";

function humanizeKey(key) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/** Renders an arbitrary metadata object as labeled rows — never assumes
 * specific field names, so it works for any DocumentMetadata template. */
export function MetadataPanel({ metadata, title = "Document Metadata" }) {
  const entries = metadata && typeof metadata === "object" ? Object.entries(metadata) : [];
  if (!entries.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-[11.5px] font-semibold text-slate-600 uppercase tracking-wide">
        {title}
      </div>
      <dl className="divide-y divide-slate-100">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-start justify-between gap-4 px-3 py-1.5 text-[12.5px]">
            <dt className="text-slate-500 shrink-0">{humanizeKey(key)}</dt>
            <dd className="text-slate-800 text-right break-words">{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Compact inline document reference card shown in chat messages / search results. */
export function DocumentCard({ name, subtitle, onOpen, score }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-brand-300 hover:bg-brand-50/40 transition-colors"
    >
      <div className="h-8 w-8 rounded-md bg-brand-50 flex items-center justify-center shrink-0">
        <FileText className="h-4 w-4 text-brand-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-slate-800 truncate">{name}</p>
        {subtitle && <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>}
      </div>
      {typeof score === "number" && (
        <span className="text-[10.5px] font-medium text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded shrink-0">
          {Math.round(score * 100)}%
        </span>
      )}
      <ExternalLink className="h-3.5 w-3.5 text-slate-300 shrink-0" />
    </button>
  );
}

/** Citation pill — clicking jumps the PDF viewer to that page (via onOpen). */
export function CitationChip({ citation, onOpen }) {
  return (
    <button
      type="button"
      title={`${citation.documentName} — page ${citation.pageNumber}`}
      onClick={() => onOpen?.(citation)}
      className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded bg-brand-100 text-brand-700 text-[10px] font-semibold align-super hover:bg-brand-200"
    >
      {citation.marker}
    </button>
  );
}

export function CitationList({ citations, onOpen }) {
  if (!citations?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {citations.map((c) => (
        <button
          key={c.chunkId ?? `${c.documentId}-${c.marker}`}
          type="button"
          onClick={() => onOpen?.(c)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 hover:border-brand-300 hover:text-brand-700"
        >
          <span className="font-semibold">[{c.marker}]</span> {c.documentName} · p.{c.pageNumber}
        </button>
      ))}
    </div>
  );
}
