// src/features/communication/components/IncomingCallModal.jsx
//
// Minimal, professional incoming-call prompt. Deliberately reuses the
// existing design tokens (brand/ink/surface colors, rounded-app radii)
// rather than introducing new styling — this phase is calling
// functionality only, not a visual redesign (project brief §18).

import { Phone, PhoneOff, Video } from "lucide-react";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function IncomingCallModal({ call, onAccept, onDecline }) {
  if (!call) return null;
  const isVideo = call.callType === "VIDEO";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-app-lg border border-subtle bg-surface-card p-6 text-center shadow-xl">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
          {initials(call.caller?.name)}
        </span>
        <p className="mt-3 text-base font-semibold text-ink-900">{call.caller?.name || "Unknown caller"}</p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-ink-500">
          {isVideo ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          Incoming {isVideo ? "video" : "audio"} call
        </p>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={onDecline}
            aria-label="Decline call"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-500 text-white transition hover:bg-danger-600"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onAccept}
            aria-label="Accept call"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-success-500 text-white transition hover:bg-success-600"
          >
            <Phone className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
