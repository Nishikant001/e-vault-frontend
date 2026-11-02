// src/features/communication/components/CallWindow.jsx
//
// Full-screen overlay for an active/connecting outgoing or incoming
// call. Handles both AUDIO (avatar + controls, no video elements
// rendered) and VIDEO (large remote video + small self-preview) per
// project brief §8. Kept intentionally simple visually — this phase is
// calling functionality, not the final redesign pass (§18).

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff, Maximize, Minimize } from "lucide-react";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function formatDuration(totalSeconds = 0) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

const STATE_LABELS = {
  CALLING: "Calling…",
  CONNECTING: "Connecting…",
  CONNECTED: null, // duration shown instead
  RECONNECTING: "Reconnecting…",
  ENDED: "Call ended",
  DECLINED: "Call declined",
  BUSY: "User is busy",
  MISSED: "Missed call",
  TIMEOUT: "No answer",
  FAILED: "Call connection failed",
};

export default function CallWindow({
  call,
  callState,
  localStream,
  remoteStream,
  muted,
  cameraOff,
  screenSharing,
  durationSeconds,
  errorMessage,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const containerRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);

  const isVideo = call?.callType === "VIDEO";

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream || null;
  }, [localStream]);

  useEffect(() => {
    if (isVideo && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream || null;
    if (!isVideo && remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream || null;
  }, [remoteStream, isVideo]);

  if (!call) return null;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  const statusLabel = STATE_LABELS[callState];

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col bg-ink-900 text-white">
      {/* Remote video fills the frame for video calls; audio calls just get the dark background */}
      {isVideo && (
        <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 h-full w-full bg-ink-900 object-cover" />
      )}
      {!isVideo && <audio ref={remoteAudioRef} autoPlay />}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-semibold">{call.otherUser?.name || "Unknown"}</p>
          <p className="text-xs text-white/70">
            {statusLabel || formatDuration(durationSeconds)}
          </p>
        </div>
        {isVideo && (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            className="rounded-full p-2 text-white/80 hover:bg-white/10"
          >
            {fullscreen ? <Minimize className="h-4.5 w-4.5" /> : <Maximize className="h-4.5 w-4.5" />}
          </button>
        )}
      </div>

      {/* Center content for audio calls / no remote video yet */}
      {(!isVideo || !remoteStream) && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-3xl font-semibold">
            {initials(call.otherUser?.name)}
          </span>
          <p className="text-lg font-medium">{call.otherUser?.name || "Unknown"}</p>
          <p className="text-sm text-white/70">{statusLabel || formatDuration(durationSeconds)}</p>
        </div>
      )}

      {errorMessage && (
        <div className="relative z-10 mx-auto mb-2 max-w-sm rounded-app-sm bg-danger-600/90 px-3 py-1.5 text-center text-xs text-white">
          {errorMessage}
        </div>
      )}

      {/* Self preview (video calls only) */}
      {isVideo && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-28 right-5 z-10 h-32 w-24 rounded-app-sm border border-white/20 bg-ink-800 object-cover shadow-lg sm:h-40 sm:w-28"
        />
      )}

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-center gap-4 pb-8 pt-4">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? "Unmute microphone" : "Mute microphone"}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
            muted ? "bg-white text-ink-900" : "bg-white/15 text-white hover:bg-white/25"
          }`}
        >
          {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {isVideo && (
          <button
            type="button"
            onClick={onToggleCamera}
            aria-label={cameraOff ? "Turn camera on" : "Turn camera off"}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
              cameraOff ? "bg-white text-ink-900" : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            {cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </button>
        )}

        {isVideo && (
          <button
            type="button"
            onClick={onToggleScreenShare}
            aria-label={screenSharing ? "Stop screen sharing" : "Share screen"}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
              screenSharing ? "bg-brand-500 text-white" : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            {screenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </button>
        )}

        <button
          type="button"
          onClick={onEndCall}
          aria-label="End call"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-500 text-white transition hover:bg-danger-600"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
