// src/features/communication/components/VoiceRecorder.jsx
//
// Recording UI shown inline in the composer once the mic button is
// pressed. States: recording (timer + cancel/stop) → preview
// (playback + delete/send). Never auto-sends.

import { Mic, Square, Trash2, Send, Play, Pause } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function formatDuration(totalSeconds = 0) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VoiceRecorder({ recorder, onSend, onCancel }) {
  const { status, durationSeconds, previewUrl, errorMessage, getBlob, stop, cancel } = recorder;
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!previewUrl) return;
    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    audio.onended = () => setPreviewPlaying(false);
    return () => audio.pause();
  }, [previewUrl]);

  const togglePreview = () => {
    if (!audioRef.current) return;
    if (previewPlaying) {
      audioRef.current.pause();
      setPreviewPlaying(false);
    } else {
      audioRef.current.play();
      setPreviewPlaying(true);
    }
  };

  const handleCancel = () => {
    cancel();
    onCancel();
  };

  const handleSend = () => {
    const blob = getBlob();
    if (blob) onSend(blob, durationSeconds);
  };

  if (status === "error") {
    return (
      <div className="flex items-center justify-between rounded-app-md bg-danger-50 px-3.5 py-2.5 text-sm text-danger-600">
        <span>{errorMessage}</span>
        <button type="button" onClick={onCancel} className="text-xs font-medium underline">
          Dismiss
        </button>
      </div>
    );
  }

  if (status === "requesting") {
    return (
      <div className="flex items-center gap-2 rounded-app-md bg-surface-sunken px-3.5 py-2.5 text-sm text-ink-500">
        <Mic className="h-4 w-4 animate-pulse" />
        Requesting microphone access...
      </div>
    );
  }

  if (status === "recording") {
    return (
      <div className="flex items-center justify-between rounded-app-md bg-danger-50 px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-sm font-medium text-danger-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-danger-500" />
          Recording {formatDuration(durationSeconds)}
        </span>
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-app-sm px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={stop}
            className="flex items-center gap-1 rounded-app-sm bg-danger-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-danger-600"
          >
            <Square className="h-3 w-3" /> Stop
          </button>
        </span>
      </div>
    );
  }

  if (status === "stopped") {
    return (
      <div className="flex items-center justify-between rounded-app-md bg-brand-50 px-3.5 py-2.5">
        <button
          type="button"
          onClick={togglePreview}
          aria-label={previewPlaying ? "Pause preview" : "Play preview"}
          className="flex items-center gap-2 text-sm font-medium text-brand-700"
        >
          {previewPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {formatDuration(durationSeconds)}
        </button>
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Delete recording"
            className="rounded-app-sm p-1.5 text-ink-500 hover:bg-white hover:text-danger-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleSend}
            aria-label="Send voice message"
            className="flex items-center gap-1 rounded-app-sm bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
          >
            <Send className="h-3.5 w-3.5" /> Send
          </button>
        </span>
      </div>
    );
  }

  return null;
}
