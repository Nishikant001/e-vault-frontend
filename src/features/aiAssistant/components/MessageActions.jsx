// src/features/aiAssistant/components/MessageActions.jsx
import { useState } from "react";
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw, Share2, Download, Pencil } from "lucide-react";
import { SpeakButton } from "./VoiceControls";
import { useToast } from "../../../components/ui";

export default function MessageActions({
  content,
  onRegenerate,
  onEdit,
  onLike,
  onDislike,
  feedback, // "like" | "dislike" | null
  showEdit = false,
  onExport,
  onShare,
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "Couldn't copy", tone: "error" });
    }
  };

  const share = () => {
    if (onShare) return onShare();
    if (navigator.share) {
      navigator.share({ text: content }).catch(() => {});
    } else {
      copy();
      toast({ title: "Copied to clipboard", description: "Sharing isn't supported here, so the text was copied instead." });
    }
  };

  const btn = "h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors";

  return (
    <div className="flex items-center gap-0.5 mt-1.5">
      <button type="button" title="Copy" onClick={copy} className={btn}>
        {copied ? <Check className="h-3.5 w-3.5 text-success-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      {onRegenerate && (
        <button type="button" title="Regenerate" onClick={onRegenerate} className={btn}>
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
      {showEdit && onEdit && (
        <button type="button" title="Edit prompt" onClick={onEdit} className={btn}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {onLike && (
        <button
          type="button"
          title="Good response"
          onClick={onLike}
          className={`${btn} ${feedback === "like" ? "text-success-500 bg-success-50" : ""}`}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
      )}
      {onDislike && (
        <button
          type="button"
          title="Bad response"
          onClick={onDislike}
          className={`${btn} ${feedback === "dislike" ? "text-danger-500 bg-danger-50" : ""}`}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      )}
      <button type="button" title="Share" onClick={share} className={btn}>
        <Share2 className="h-3.5 w-3.5" />
      </button>
      {onExport && (
        <button type="button" title="Export" onClick={onExport} className={btn}>
          <Download className="h-3.5 w-3.5" />
        </button>
      )}
      <SpeakButton text={content} className="ml-1" />
    </div>
  );
}
