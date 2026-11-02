// src/features/communication/components/VoiceMessagePlayer.jsx
//
// Plays a received voice message. Fetches the audio only on first play
// (authenticated blob fetch — project brief §56: never auto-play
// incoming voice messages) and reuses the blob URL afterwards.

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import CommunicationApi from "../api/communicationApi";

function formatDuration(totalSeconds = 0) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VoiceMessagePlayer({ voice, mine }) {
  const [status, setStatus] = useState("idle"); // idle | loading | ready | playing | error
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const urlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      audioRef.current?.pause();
    };
  }, []);

  const togglePlay = async () => {
    if (status === "loading") return;

    if (audioRef.current && status === "playing") {
      audioRef.current.pause();
      setStatus("ready");
      return;
    }
    if (audioRef.current && status === "ready") {
      audioRef.current.play();
      setStatus("playing");
      return;
    }

    setStatus("loading");
    try {
      const url = await CommunicationApi.fetchVoiceBlobUrl(voice.id);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setStatus("ready");
        setProgress(0);
      };
      audio.ontimeupdate = () => {
        if (audio.duration) setProgress(audio.currentTime / audio.duration);
      };
      await audio.play();
      setStatus("playing");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex items-center gap-2.5 py-0.5">
      <button
        type="button"
        onClick={togglePlay}
        disabled={status === "error"}
        aria-label={status === "playing" ? "Pause voice message" : "Play voice message"}
        className={`comm-voice-btn ${mine ? "comm-voice-btn--sent" : "comm-voice-btn--received"}`}
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "playing" ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="ml-0.5 h-3.5 w-3.5" />
        )}
      </button>

      <div className={`comm-voice-track ${mine ? "comm-voice-track--sent" : "comm-voice-track--received"}`}>
        <div
          className={`comm-voice-bar ${mine ? "comm-voice-bar--sent" : "comm-voice-bar--received"}`}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <span className={`comm-voice-time ${mine ? "comm-voice-time--sent" : "comm-voice-time--received"}`}>
        {status === "error" ? "Unavailable" : formatDuration(voice.durationSeconds)}
      </span>
    </div>
  );
}
