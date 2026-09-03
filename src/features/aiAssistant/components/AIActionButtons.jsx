// src/features/aiAssistant/components/AIActionButtons.jsx
import {
  FileText, MessageSquareText, GitCompare, Languages, ListChecks,
  ScanSearch, Tags, FileBarChart2, Mail, Building2, RefreshCw,
} from "lucide-react";
import { canWriteAI } from "../api";

// Each action maps to either a real backend endpoint (documentAI) or a
// chat-composer prompt (translate/report/email/SAP summary aren't
// dedicated endpoints yet — they're sent as chat turns scoped to this
// document, which the backend's RAG chat already supports via scopeType=DOCUMENT).
const ACTIONS = [
  { key: "summarize", label: "Summarize", icon: FileText, kind: "endpoint" },
  { key: "explain", label: "Explain", icon: MessageSquareText, kind: "endpoint" },
  { key: "compare", label: "Compare", icon: GitCompare, kind: "navigate" },
  { key: "translate", label: "Translate", icon: Languages, kind: "prompt", prompt: "Translate this document to English." },
  { key: "missingMetadata", label: "Find Missing Fields", icon: ListChecks, kind: "endpoint", writeOnly: false },
  { key: "ocrInconsistencies", label: "Validate OCR", icon: ScanSearch, kind: "endpoint" },
  { key: "autoTag", label: "Extract Metadata", icon: Tags, kind: "endpoint", writeOnly: true },
  { key: "generateReport", label: "Generate Report", icon: FileBarChart2, kind: "prompt", prompt: "Generate a structured business report summarizing this document." },
  { key: "generateEmail", label: "Generate Email", icon: Mail, kind: "prompt", prompt: "Draft a professional email summarizing this document for a stakeholder." },
  { key: "generateSapSummary", label: "Generate SAP Summary", icon: Building2, kind: "prompt", prompt: "Summarize this document's key fields as they would appear in an SAP posting (vendor, amount, dates, GL-relevant details)." },
  { key: "reindex", label: "Re-index", icon: RefreshCw, kind: "endpoint", writeOnly: true },
];

export default function AIActionButtons({ role, onEndpointAction, onPromptAction, onNavigateAction, loadingKey }) {
  const visible = ACTIONS.filter((a) => !a.writeOnly || canWriteAI(role));

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((action) => {
        const Icon = action.icon;
        const busy = loadingKey === action.key;
        return (
          <button
            key={action.key}
            type="button"
            disabled={busy}
            onClick={() => {
              if (action.kind === "endpoint") onEndpointAction?.(action.key);
              else if (action.kind === "prompt") onPromptAction?.(action.prompt);
              else onNavigateAction?.(action.key);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[12.5px] font-medium text-slate-700
              hover:border-brand-300 hover:bg-brand-50/60 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            <Icon className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
