// src/features/communication/components/AttachmentPreviewList.jsx
//
// Shows the files staged in the composer before send, and (while
// uploading) the shared progress bar + per-batch cancel/retry. Purely
// local UI state — nothing here talks to the backend directly.

import { X, AlertCircle, RotateCcw, Loader2, Paperclip } from "lucide-react";

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentPreviewList({ files, status, progress, errorMessage, onRemove, onCancel, onRetry }) {
  if (!files.length) return null;

  return (
    <div className="mb-2 rounded-app-sm border border-subtle bg-surface-muted p-2">
      <div className="flex flex-wrap gap-1.5">
        {files.map((file, idx) => {
          const isImage = file.type?.startsWith("image/");
          return (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center gap-1.5 rounded-app-sm border border-default bg-surface-card px-2 py-1 text-xs"
            >
              {isImage ? (
                <img src={URL.createObjectURL(file)} alt="" className="h-6 w-6 rounded object-cover" />
              ) : (
                <Paperclip className="h-3.5 w-3.5 text-ink-400" />
              )}
              <span className="max-w-[140px] truncate text-ink-700">{file.name}</span>
              <span className="text-ink-400">{formatSize(file.size)}</span>
              {status === "idle" && (
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  aria-label={`Remove ${file.name}`}
                  className="text-ink-400 hover:text-danger-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {status === "uploading" && (
        <div className="mt-2 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-500" />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-200">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-ink-500">{progress}%</span>
          <button type="button" onClick={onCancel} aria-label="Cancel upload" className="text-ink-400 hover:text-danger-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="mt-2 flex items-center gap-2 text-xs text-danger-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">{errorMessage || "Upload failed"}</span>
          <button type="button" onClick={onRetry} className="flex items-center gap-1 font-medium hover:underline">
            <RotateCcw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}
    </div>
  );
}
