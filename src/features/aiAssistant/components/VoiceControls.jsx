// src/features/aiAssistant/components/VoiceControls.jsx
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

function getSpeechRecognition() {
  return typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
}

/** Microphone button — speech-to-text, dictates into the composer. */
export function MicButton({ onResult, disabled = false }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const SpeechRecognitionCtor = getSpeechRecognition();

  useEffect(() => () => recognitionRef.current?.stop(), []);

  if (!SpeechRecognitionCtor) return null; // hide entirely when unsupported, rather than a dead button

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      onResult?.(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <button
      type="button"
      title={listening ? "Stop listening" : "Speak your question"}
      disabled={disabled}
      onClick={toggle}
      className={`h-9 w-9 flex items-center justify-center rounded-full transition-colors ${
        listening ? "bg-danger-500 text-white animate-pulse" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      } disabled:opacity-50`}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}

/** Speaker button — text-to-speech playback of a single AI message. */
export function SpeakButton({ text, className = "" }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(
    () => () => {
      if (supported) window.speechSynthesis.cancel();
    },
    [supported]
  );

  if (!supported || !text) return null;

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      title={speaking ? "Stop playback" : "Read aloud"}
      onClick={toggle}
      className={`inline-flex items-center gap-1 text-[11.5px] text-slate-500 hover:text-slate-700 ${className}`}
    >
      {speaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      {speaking ? "Stop" : "Listen"}
    </button>
  );
}
