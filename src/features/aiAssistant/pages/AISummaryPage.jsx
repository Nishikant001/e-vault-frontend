// src/features/aiAssistant/pages/AISummaryPage.jsx
//
// summarize() and explain() are real, dedicated backend endpoints and map
// directly to "Short Summary" and "Detailed Summary" below. The backend
// has no separate endpoints for Key Points / Risks / Recommendations /
// Important Dates / Important Amounts / People / Organizations, so those
// are derived from ONE additional scoped chat turn (real RAG call, scoped
// to this document) asking the model to return that breakdown as JSON.
// If the model doesn't return valid JSON, the raw markdown answer is
// shown instead under "Key Insights" rather than silently failing.

import { useEffect, useState } from "react";
import { FileSearch, AlertTriangle, Lightbulb, CalendarDays, Landmark, Users, Building2 } from "lucide-react";
import { DocumentAIApi, ChatApi } from "../api";
import ScopeSelector from "../components/ScopeSelector";
import MarkdownMessage from "../components/MarkdownMessage";
import { AppCard, CardHeader, EmptyState, SkeletonCard, AppButton } from "../../../components/ui";

const STRUCTURED_PROMPT = [
  "Extract the following from this document and respond ONLY with minified JSON,",
  "no prose, using exactly these keys:",
  '{"keyPoints":[string],"risks":[string],"recommendations":[string],',
  '"importantDates":[string],"importantAmounts":[string],"people":[string],"organizations":[string]}',
  "Use an empty array for anything not present.",
].join(" ");

function tryParseJson(text) {
  try {
    const cleaned = text.trim().replace(/^```json\s*|```$/g, "");
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function InsightList({ icon: Icon, title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <AppCard>
      <CardHeader title={title} action={<Icon className="h-4 w-4 text-brand-500" />} />
      <ul className="list-disc pl-5 space-y-1 text-[13px] text-slate-700">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </AppCard>
  );
}

export default function AISummaryPage({ presetDocumentId = null }) {
  const [scope, setScope] = useState(
    presetDocumentId ? { scopeType: "DOCUMENT", scopeDocumentIds: [presetDocumentId], label: `Document #${presetDocumentId}` } : { scopeType: "ALL", label: "All Documents" }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shortSummary, setShortSummary] = useState(null);
  const [detailedSummary, setDetailedSummary] = useState(null);
  const [structured, setStructured] = useState(null);
  const [structuredRaw, setStructuredRaw] = useState(null);

  const documentId = scope.scopeDocumentIds?.[0];

  const runAnalysis = async () => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    setShortSummary(null);
    setDetailedSummary(null);
    setStructured(null);
    setStructuredRaw(null);
    try {
      const [sum, exp] = await Promise.all([
        DocumentAIApi.summarize(documentId),
        DocumentAIApi.explain(documentId),
      ]);
      setShortSummary(sum.data);
      setDetailedSummary(exp.data);

      const session = await ChatApi.createSession({ scopeType: "DOCUMENT", scopeDocumentIds: [documentId], title: "Summary insights" });
      const chatRes = await ChatApi.sendMessage(session.data.id, { message: STRUCTURED_PROMPT });
      const parsed = tryParseJson(chatRes.data.message.content);
      if (parsed) setStructured(parsed);
      else setStructuredRaw(chatRes.data.message.content);
      await ChatApi.deleteSession(session.data.id).catch(() => {});
    } catch (err) {
      setError(err.message || "Couldn't generate a summary for this document.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg text-[var(--text-primary)]">Document Summaries</h2>
      </div>
      <ScopeSelector scope={scope} onChange={setScope} presetDocumentId={presetDocumentId} />

      {!documentId ? (
        <EmptyState icon={FileSearch} title="Pick a document" description={`Choose "Current Document" above to generate its summary.`} />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} tone="error" title="Couldn't generate summary" description={error} actionLabel="Retry" onAction={runAnalysis} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {shortSummary && (
            <AppCard className="sm:col-span-2">
              <CardHeader title="Short Summary" subtitle={shortSummary.documentName} />
              <MarkdownMessage content={shortSummary.result} />
            </AppCard>
          )}
          {detailedSummary && (
            <AppCard className="sm:col-span-2">
              <CardHeader title="Detailed Summary" />
              <MarkdownMessage content={detailedSummary.result} />
            </AppCard>
          )}
          {structured ? (
            <>
              <InsightList icon={Lightbulb} title="Key Points" items={structured.keyPoints} />
              <InsightList icon={AlertTriangle} title="Risks" items={structured.risks} />
              <InsightList icon={Lightbulb} title="Recommendations" items={structured.recommendations} />
              <InsightList icon={CalendarDays} title="Important Dates" items={structured.importantDates} />
              <InsightList icon={Landmark} title="Important Amounts" items={structured.importantAmounts} />
              <InsightList icon={Users} title="People" items={structured.people} />
              <InsightList icon={Building2} title="Organizations" items={structured.organizations} />
            </>
          ) : structuredRaw ? (
            <AppCard className="sm:col-span-2">
              <CardHeader title="Key Insights" />
              <MarkdownMessage content={structuredRaw} />
            </AppCard>
          ) : null}
          <div className="sm:col-span-2">
            <AppButton variant="secondary" size="sm" onClick={runAnalysis}>Regenerate</AppButton>
          </div>
        </div>
      )}
    </div>
  );
}
