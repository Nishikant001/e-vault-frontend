// src/features/aiAssistant/pages/AISearchPage.jsx
import { useState } from "react";
import { Search as SearchIcon, AlertTriangle } from "lucide-react";
import { AISearchApi } from "../api";
import { AppSearch, AppButton, EmptyState, SkeletonText, Tabs, useToast } from "../../../components/ui";
import { DocumentCard } from "../components/MetadataAndDocCards";

const TABS = [
  { value: "semantic", label: "Semantic (AI vectors)" },
  { value: "metadata", label: "Metadata" },
  { value: "ocr", label: "OCR Text" },
];

const EXAMPLES = {
  semantic: ["Show invoices above ₹500000", "Find vendor ABC", "Show expired contracts"],
  metadata: ["ABC Traders", "PO-2026", "Maharashtra"],
  ocr: ["force majeure", "GSTIN", "purchase order"],
};

export default function AISearchPage({ onOpenDocument }) {
  const [tab, setTab] = useState("semantic");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const { toast } = useToast();

  const run = async (q) => {
    const term = (q ?? query).trim();
    if (!term) return;
    setQuery(term);
    setLoading(true);
    setError(null);
    try {
      if (tab === "semantic") {
        const res = await AISearchApi.semantic({ query: term });
        setResults(res.data || []);
      } else if (tab === "metadata") {
        const res = await AISearchApi.metadata({ keyword: term });
        setResults(res.data || []);
      } else {
        const res = await AISearchApi.ocr({ keyword: term });
        setResults(res.data || []);
      }
    } catch (err) {
      setError(err.message || "Search failed.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const openDoc = (documentId, documentName) => {
    if (onOpenDocument) onOpenDocument(documentId);
    else toast({ title: `Opening ${documentName || `document #${documentId}`}` });
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg text-[var(--text-primary)]">AI Search</h2>
      <Tabs tabs={TABS} value={tab} onChange={(v) => { setTab(v); setResults(null); setError(null); }} />

      <div className="flex gap-2">
        <AppSearch
          className="flex-1"
          value={query}
          onChange={setQuery}
          placeholder={tab === "semantic" ? "Ask a natural-language question…" : "Enter a keyword…"}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <AppButton loading={loading} onClick={() => run()}>Search</AppButton>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES[tab].map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => run(ex)}
            className="px-2.5 py-1 rounded-full text-[11.5px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            {ex}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonText lines={5} />
      ) : error ? (
        <EmptyState icon={AlertTriangle} tone="error" title="Search failed" description={error} />
      ) : results === null ? (
        <EmptyState icon={SearchIcon} title="Search across your documents" description="Try a natural-language query, a metadata keyword, or OCR text." />
      ) : results.length === 0 ? (
        <EmptyState icon={SearchIcon} title="No matches found" description="Try a different phrasing or search mode." />
      ) : tab === "semantic" ? (
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.chunkId} className="rounded-lg border border-slate-200 bg-white p-3">
              <DocumentCard name={r.documentName} subtitle={`Page ${r.pageNumber}`} score={r.score} onOpen={() => openDoc(r.documentId, r.documentName)} />
              <p className="mt-2 text-[12.5px] text-slate-600 line-clamp-3">{r.content}</p>
            </div>
          ))}
        </div>
      ) : tab === "metadata" ? (
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.documentId} className="rounded-lg border border-slate-200 bg-white p-3">
              <DocumentCard name={r.documentName} onOpen={() => openDoc(r.documentId, r.documentName)} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.matchedFields.map((f, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                    {f.field}: {String(f.value)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.documentId} className="rounded-lg border border-slate-200 bg-white p-3">
              <DocumentCard name={r.documentName} onOpen={() => openDoc(r.documentId, r.documentName)} />
              {r.snippet && <p className="mt-2 text-[12.5px] text-slate-600">…{r.snippet}…</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
