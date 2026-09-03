// src/features/aiAssistant/components/SuggestedQuestions.jsx
import { Sparkles } from "lucide-react";

const DEFAULT_CHIPS = [
  "Summarize this",
  "Explain the GST breakdown",
  "Find the vendor name",
  "Show payment terms",
  "Compare with PO",
  "Translate to English",
];

export default function SuggestedQuestions({ chips = DEFAULT_CHIPS, onPick, disabled = false }) {
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          disabled={disabled}
          onClick={() => onPick?.(chip)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium
            bg-brand-50 text-brand-600 border border-brand-100 hover:bg-brand-100 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-3 w-3" />
          {chip}
        </button>
      ))}
    </div>
  );
}
