// src/features/aiAssistant/pages/AISavedPromptsPage.jsx
//
// The backend has no saved-prompts endpoint, so this is a client-side
// prompt library (persisted in localStorage via AIAssistantContext) —
// not wired to fake API calls. Clicking a prompt starts a new chat with
// it pre-filled.

import { useState } from "react";
import { BookmarkPlus, Trash2, Send } from "lucide-react";
import { useAIAssistant } from "../AIAssistantContext";
import { AppButton, EmptyState } from "../../../components/ui";

export default function AISavedPromptsPage({ onNavigate }) {
  const { savedPrompts, addSavedPrompt, removeSavedPrompt, setPendingDraft } = useAIAssistant();
  const [draft, setDraft] = useState("");

  const save = () => {
    if (!draft.trim()) return;
    addSavedPrompt(draft.trim());
    setDraft("");
  };

  const use = (prompt) => {
    setPendingDraft(prompt);
    onNavigate?.("aiChat");
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="font-display font-semibold text-lg text-[var(--text-primary)]">Saved Prompts</h2>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="e.g. Summarize the GST breakdown and flag missing fields"
          className="flex-1 h-10 rounded-lg border border-slate-200 px-3 text-[13px] outline-none focus:border-brand-400"
        />
        <AppButton icon={BookmarkPlus} onClick={save}>Save</AppButton>
      </div>

      {savedPrompts.length === 0 ? (
        <EmptyState icon={BookmarkPlus} title="No saved prompts yet" description="Save prompts you use often for one-click reuse." />
      ) : (
        <div className="space-y-2">
          {savedPrompts.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <p className="flex-1 text-[13px] text-slate-700">{p.text}</p>
              <button title="Use in chat" onClick={() => use(p.text)} className="p-1.5 rounded hover:bg-brand-50 text-brand-500">
                <Send className="h-3.5 w-3.5" />
              </button>
              <button title="Delete" onClick={() => removeSavedPrompt(p.id)} className="p-1.5 rounded hover:bg-danger-50 text-slate-400 hover:text-danger-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
