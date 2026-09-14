// src/features/aiAssistant/pages/AIComparePage.jsx
//
// POST /api/ai/documents/compare returns one AI-written narrative (similarities /
// differences / missing-from-one / verdict) — there's no raw-text diff endpoint,
// so the "Highlight Added/Removed/Modified" requirement is satisfied two ways:
//   1. The AI narrative itself (which explicitly calls out differences), and
//   2. A concrete, non-hallucinated field-by-field diff of each document's
//      real dynamic metadata (GET /api/documents/:id/metadata), which is exact
//      data, not model output.

import { useEffect, useState } from "react";
import { GitCompare, AlertTriangle } from "lucide-react";
import { DocumentAIApi, DocumentMetadataApi, DocumentPickerApi } from "../api";
import { AppSearch, AppButton, AppCard, CardHeader, EmptyState, SkeletonCard } from "../../../components/ui";
import MarkdownMessage from "../components/MarkdownMessage";

const PRESETS = [
  { key: "invoice_po", label: "Invoice vs PO" },
  { key: "po_grn", label: "PO vs GRN" },
  { key: "contract_versions", label: "Old vs New Contract" },
  { key: "custom", label: "Custom" },
];

function DocPicker({ label, value, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) return setResults([]);
    const handle = setTimeout(() => {
      DocumentPickerApi.search({ q: query, pageSize: 8 }).then((res) => setResults(res.data || [])).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="relative flex-1">
      <p className="text-[11.5px] font-medium text-slate-500 mb-1">{label}</p>
      <AppSearch
        value={value?.originalFileName || query}
        onChange={(v) => { onSelect(null); setQuery(v); }}
        placeholder="Search documents…"
      />
      {results.length > 0 && !value && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-auto">
          {results.map((doc) => (
            <button
              key={doc.id}
              type="button"
              className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-slate-50 border-b border-slate-100 last:border-0"
              onClick={() => { onSelect(doc); setQuery(""); setResults([]); }}
            >
              {doc.originalFileName || doc.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function fieldDiffRows(metaA, metaB) {
  const a = metaA?.mappedMetadata || {};
  const b = metaB?.mappedMetadata || {};
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
  return keys.map((key) => {
    const va = a[key];
    const vb = b[key];
    const same = JSON.stringify(va ?? null) === JSON.stringify(vb ?? null);
    let status = "same";
    if (!same) status = va === undefined ? "added" : vb === undefined ? "removed" : "modified";
    return { key, va, vb, status };
  });
}

const STATUS_STYLE = {
  same: "text-slate-500",
  added: "text-success-600 bg-success-50",
  removed: "text-danger-600 bg-danger-50",
  modified: "text-warning-600 bg-warning-50",
};

export default function AIComparePage() {
  const [preset, setPreset] = useState("custom");
  const [docA, setDocA] = useState(null);
  const [docB, setDocB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [metaA, setMetaA] = useState(null);
  const [metaB, setMetaB] = useState(null);

  const canCompare = docA && docB;

  const runCompare = async () => {
    if (!canCompare) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const [cmp, mA, mB] = await Promise.all([
        DocumentAIApi.compare(docA.id, docB.id),
        DocumentMetadataApi.get(docA.id).catch(() => ({ data: null })),
        DocumentMetadataApi.get(docB.id).catch(() => ({ data: null })),
      ]);
      setResult(cmp.data);
      setMetaA(mA.data);
      setMetaB(mB.data);
    } catch (err) {
      setError(err.message || "Couldn't compare these documents.");
    } finally {
      setLoading(false);
    }
  };

  const rows = result ? fieldDiffRows(metaA, metaB) : [];
  const changedRows = rows.filter((r) => r.status !== "same");

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg text-[var(--text-primary)]">Compare Documents</h2>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPreset(p.key)}
            className={`px-2.5 py-1 rounded-full text-[11.5px] font-medium border transition-colors ${
              preset === p.key ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-brand-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <DocPicker label="Document A" value={docA} onSelect={setDocA} />
        <div className="hidden sm:flex items-center justify-center h-10 mt-5"><GitCompare className="h-4 w-4 text-slate-300" /></div>
        <DocPicker label="Document B" value={docB} onSelect={setDocB} />
        <AppButton className="mt-5" disabled={!canCompare} loading={loading} onClick={runCompare}>Compare</AppButton>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard /><SkeletonCard />
        </div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} tone="error" title="Comparison failed" description={error} actionLabel="Retry" onAction={runCompare} />
      ) : result ? (
        <div className="space-y-4">
          <AppCard>
            <CardHeader title="AI Comparison" subtitle={`${result.documentA.name} vs ${result.documentB.name}`} />
            <MarkdownMessage content={result.result} />
          </AppCard>

          {changedRows.length > 0 && (
            <AppCard>
              <CardHeader title="Metadata Field Differences" subtitle={`${changedRows.length} field(s) differ`} />
              <div className="overflow-x-auto">
                <table className="min-w-full text-[12.5px]">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="py-1.5 pr-3">Field</th>
                      <th className="py-1.5 pr-3">{result.documentA.name}</th>
                      <th className="py-1.5 pr-3">{result.documentB.name}</th>
                      <th className="py-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changedRows.map((r) => (
                      <tr key={r.key} className="border-b border-slate-50">
                        <td className="py-1.5 pr-3 text-slate-600">{r.key}</td>
                        <td className="py-1.5 pr-3">{String(r.va ?? "—")}</td>
                        <td className="py-1.5 pr-3">{String(r.vb ?? "—")}</td>
                        <td className="py-1.5"><span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLE[r.status]}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AppCard>
          )}
        </div>
      ) : (
        <EmptyState icon={GitCompare} title="Pick two documents to compare" description="Search and select Document A and Document B above." />
      )}
    </div>
  );
}
