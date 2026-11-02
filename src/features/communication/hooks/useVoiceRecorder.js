// src/features/communication/hooks/useVoiceRecorder.js
//
// Wraps the browser MediaRecorder API for voice message recording.
// Recorded audio is uploaded as-is (no WebRTC, no calling — project
// brief §12/§39). Picks the first MIME type the browser actually
// supports rather than assuming one blindly (§36).

import { useCallback, useRef, useState } from "react";

const CANDIDATE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
];

function pickSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  return CANDIDATE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported?.(type)) || "";
}

export function useVoiceRecorder({ maxDurationSeconds = 120 } = {}) {
  const [status, setStatus] = useState("idle"); // idle | requesting | recording | stopped | error
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const blobRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopTracks = () => {
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    streamRef.current = null;
  };

  const start = useCallback(async () => {
    setErrorMessage(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage("Voice recording isn't supported in this browser.");
      return;
    }

    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickSupportedMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        setStatus("stopped");
        stopTracks();
      };

      recorder.start();
      setStatus("recording");
      setDurationSeconds(0);

      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxDurationSeconds) {
            recorder.stop();
            clearTimer();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err?.name === "NotAllowedError"
          ? "Microphone permission was denied."
          : "Couldn't access the microphone."
      );
      stopTracks();
    }
  }, [maxDurationSeconds]);

  const stop = useCallback(() => {
    clearTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    clearTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      // Discard: stop, then drop the produced blob.
      mediaRecorderRef.current.onstop = () => stopTracks();
      mediaRecorderRef.current.stop();
    } else {
      stopTracks();
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    blobRef.current = null;
    setPreviewUrl(null);
    setDurationSeconds(0);
    setStatus("idle");
  }, [previewUrl]);

  const reset = useCallback(() => {
    clearTimer();
    stopTracks();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    blobRef.current = null;
    setPreviewUrl(null);
    setDurationSeconds(0);
    setStatus("idle");
    setErrorMessage(null);
  }, [previewUrl]);

  return {
    status, // idle | requesting | recording | stopped | error
    durationSeconds,
    previewUrl,
    errorMessage,
    getBlob: () => blobRef.current,
    start,
    stop,
    cancel,
    reset,
  };
}

export default useVoiceRecorder;
