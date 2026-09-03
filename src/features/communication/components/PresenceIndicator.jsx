// src/features/communication/components/PresenceIndicator.jsx
//
// Small colored dot + optional label for online/offline state.
// `pulse` adds a subtle breathing ring around the dot while online.
export default function PresenceIndicator({ online, showLabel = false, pulse = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`comm-presence-dot ${online ? "comm-presence-dot--online" : "comm-presence-dot--offline"} ${
          online && pulse ? "comm-presence-live" : ""
        }`}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={`comm-presence-label ${online ? "comm-presence-label--online" : "comm-presence-label--offline"}`}>
          {online ? "Online" : "Offline"}
        </span>
      )}
    </span>
  );
}
