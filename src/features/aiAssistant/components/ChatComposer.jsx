// src/features/aiAssistant/components/ChatComposer.jsx
import { useRef } from "react";
import { Send, Square } from "lucide-react";
import { MicButton } from "./VoiceControls";

export default function ChatComposer({ value, onChange, onSend, onStop, busy, disabled }) {
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !busy) onSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm">
      <MicButton
        disabled={disabled}
        onResult={(transcript) => onChange((value ? value + " " : "") + transcript)}
      />
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
        }}
        onKeyDown={handleKeyDown}
        placeholder="Ask about your documents… (Shift+Enter for a new line)"
        className="flex-1 resize-none max-h-[140px] text-[13.5px] leading-relaxed outline-none py-1.5 disabled:text-slate-400"
      />
      {busy ? (
        <button
          type="button"
          onClick={onStop}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700"
          title="Stop generating"
        >
          <Square className="h-3.5 w-3.5" fill="currentColor" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600 disabled:bg-slate-200 disabled:text-slate-400"
          title="Send"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
