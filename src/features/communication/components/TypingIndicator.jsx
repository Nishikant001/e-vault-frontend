// src/features/communication/components/TypingIndicator.jsx

export default function TypingIndicator({ label = "typing" }) {
  return (
    <div className="comm-typing">
      <span className="flex gap-0.5">
        <span className="comm-typing-dot-el comm-typing-dot [animation-delay:-0.3s]" />
        <span className="comm-typing-dot-el comm-typing-dot [animation-delay:-0.15s]" />
        <span className="comm-typing-dot-el comm-typing-dot" />
      </span>
      <span>{label}...</span>
    </div>
  );
}
