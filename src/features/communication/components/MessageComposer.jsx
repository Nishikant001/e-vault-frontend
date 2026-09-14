// src/features/communication/components/MessageComposer.jsx

import { useRef, useState, useCallback } from "react";
import { Mic, Send, X, Loader2, Paperclip } from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import useVoiceRecorder from "../hooks/useVoiceRecorder";
import AttachmentPreviewList from "./AttachmentPreviewList";

const MAX_VOICE_DURATION_SECONDS = Number(
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_CHAT_VOICE_MAX_DURATION_SECONDS) || 120
);
const MAX_FILES_PER_MESSAGE = Number(
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_CHAT_ATTACHMENT_MAX_FILES) || 10
);

export default function MessageComposer({
  sending,
  replyTo,
  onCancelReply,
  onSendText,
  onSendVoice,
  onSendAttachments,
  onTyping,
}) {
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [stagedFiles, setStagedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle | uploading | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  const recorder = useVoiceRecorder({ maxDurationSeconds: MAX_VOICE_DURATION_SECONDS });
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const cancelUploadRef = useRef(null);
  const dragCounterRef = useRef(0);

  const hasStagedFiles = stagedFiles.length > 0;

  const addFiles = useCallback((incoming) => {
    if (!incoming?.length) return;
    setStagedFiles((prev) => {
      const merged = [...prev, ...Array.from(incoming)];
      return merged.slice(0, MAX_FILES_PER_MESSAGE);
    });
    setUploadStatus("idle");
    setUploadError(null);
  }, []);

  const removeFile = (idx) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetAttachmentState = () => {
    setStagedFiles([]);
    setUploadStatus("idle");
    setUploadProgress(0);
    setUploadError(null);
    cancelUploadRef.current = null;
  };

  const handleSendText = async () => {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    setDraft("");
    try {
      await onSendText(trimmed, { replyToMessageId: replyTo?.id });
    } finally {
      inputRef.current?.focus();
    }
  };

  const handleSendAttachments = async () => {
    if (!stagedFiles.length || uploadStatus === "uploading") return;
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError(null);

    const caption = draft.trim();
    const { promise, cancel } = onSendAttachments(stagedFiles, caption, {
      replyToMessageId: replyTo?.id,
      onProgress: setUploadProgress,
    });
    cancelUploadRef.current = cancel;

    try {
      await promise;
      setDraft("");
      resetAttachmentState();
    } catch (err) {
      if (err?.cancelled) {
        resetAttachmentState();
        return;
      }
      setUploadStatus("error");
      setUploadError(err?.message || "Upload failed");
    }
  };

  const handleSend = () => {
    if (hasStagedFiles) return handleSendAttachments();
    return handleSendText();
  };

  const handleVoiceSend = async (blob, durationSeconds) => {
    recorder.reset();
    setRecording(false);
    await onSendVoice(blob, durationSeconds, { replyToMessageId: replyTo?.id });
  };

  const startRecording = () => {
    setRecording(true);
    recorder.start();
  };

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const files = items
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setDragActive(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) setDragActive(false);
  };

  if (recording) {
    return (
      <div className="comm-composer-wrap">
        <VoiceRecorder recorder={recorder} onSend={handleVoiceSend} onCancel={() => setRecording(false)} />
      </div>
    );
  }

  const canSend = hasStagedFiles ? uploadStatus !== "uploading" : !!draft.trim();

  return (
    <div
      className={`comm-composer-wrap ${dragActive ? "comm-composer-wrap--drag" : ""}`}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragActive && <div className="comm-drop-overlay">Drop files to attach</div>}

      {replyTo && (
        <div className="comm-reply-bar">
          <span className="truncate">
            Replying to: {replyTo.messageType === "VOICE" ? "Voice message" : replyTo.messageType === "FILE" ? "Attachment" : replyTo.content}
          </span>
          <button type="button" onClick={onCancelReply} aria-label="Cancel reply" className="comm-reply-bar-close">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <AttachmentPreviewList
        files={stagedFiles}
        status={uploadStatus}
        progress={uploadProgress}
        errorMessage={uploadError}
        onRemove={removeFile}
        onCancel={() => cancelUploadRef.current?.()}
        onRetry={handleSendAttachments}
      />

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach files"
          disabled={uploadStatus === "uploading"}
          className="comm-composer-icon-btn"
        >
          <Paperclip className="h-4.5 w-4.5" />
        </button>

        <button
          type="button"
          onClick={startRecording}
          aria-label="Record a voice message"
          disabled={hasStagedFiles}
          className="comm-composer-icon-btn"
        >
          <Mic className="h-4.5 w-4.5" />
        </button>

        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            onTyping?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          onPaste={handlePaste}
          placeholder={hasStagedFiles ? "Add a caption (optional)..." : "Type a message..."}
          className="comm-composer-input"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend || (sending && !hasStagedFiles)}
          aria-label="Send message"
          className="comm-send-btn"
        >
          {uploadStatus === "uploading" || (sending && !hasStagedFiles) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
