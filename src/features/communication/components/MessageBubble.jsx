// src/features/communication/components/MessageBubble.jsx

import { useState } from "react";
import { Pencil, Trash2, Reply, Check, CheckCheck, X } from "lucide-react";
import VoiceMessagePlayer from "./VoiceMessagePlayer";
import AttachmentGrid from "./AttachmentGrid";

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function MessageBubble({ message, mine, isRead, grouped, showSenderName, onReply, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content || "");
  const [hovering, setHovering] = useState(false);

  const isDeleted = message.isDeleted;
  const isVoice = message.messageType === "VOICE";
  const isFile = message.messageType === "FILE";

  const saveEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== message.content) onEdit(message.id, trimmed);
    setEditing(false);
  };

  return (
    <div
      className={`group flex ${mine ? "justify-end" : "justify-start"} px-4 ${grouped ? "py-px" : "py-0.5 mt-1"}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}>
        {!mine &&
          (!grouped ? (
            <span className="comm-bubble-avatar" aria-hidden="true">
              {initials(message.sender?.name)}
            </span>
          ) : (
            <span className="w-7 shrink-0" aria-hidden="true" />
          ))}

                <div className="comm-bubble-wrap">
        <div
          className={`comm-bubble ${
            isDeleted ? "comm-bubble--deleted" : mine ? "comm-bubble--sent" : "comm-bubble--received"
          }`}
        >
          {showSenderName && !isDeleted && (
            <p className="comm-bubble-sender-name">{message.sender?.name || "Unknown"}</p>
          )}
          {message.replyPreview && !isDeleted && (
            <div className="comm-bubble-reply">
              {message.replyPreview.deleted ? "Original message deleted" : message.replyPreview.content}
            </div>
          )}

          {isDeleted ? (
            <p className="text-sm">This message was deleted</p>
          ) : isVoice && message.voice ? (
            <VoiceMessagePlayer voice={message.voice} mine={mine} />
          ) : isFile ? (
            <div className="flex flex-col gap-1.5">
              <AttachmentGrid attachments={message.attachments} mine={mine} />
              {message.content && <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>}
            </div>
          ) : editing ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="comm-bubble-edit-input"
              />
              <button type="button" onClick={saveEdit} aria-label="Save edit" className="comm-bubble-action-btn" style={{ color: "#fff" }}>
                <Check className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setEditing(false)} aria-label="Cancel edit" className="comm-bubble-action-btn" style={{ color: "#fff" }}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
          )}

          {!isDeleted && !editing && (
            <div className={`mt-0.5 flex items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}>
              {message.editedAt && <span className="comm-bubble-status-text">edited</span>}
              <span className="comm-bubble-status-text">{formatTime(message.createdAt)}</span>
              {mine &&
                (isRead ? (
                  <CheckCheck className="comm-bubble-check--read h-3 w-3" />
                ) : (
                  <Check className="comm-bubble-check--sent h-3 w-3" />
                ))}
            </div>
          )}
        </div>

                {!isDeleted && hovering && !editing && (
          <div
            className={`comm-bubble-actions ${
              mine ? "comm-bubble-actions--mine" : "comm-bubble-actions--theirs"
            } opacity-0 transition-opacity group-hover:opacity-100`}
          >
            <button type="button" onClick={() => onReply(message)} aria-label="Reply" className="comm-bubble-action-btn">
              <Reply className="h-3.5 w-3.5" />
            </button>
            {mine && !isVoice && !isFile && (
              <button type="button" onClick={() => setEditing(true)} aria-label="Edit message" className="comm-bubble-action-btn">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {mine && (
              <button
                type="button"
                onClick={() => onDelete(message.id)}
                aria-label="Delete message"
                className="comm-bubble-action-btn comm-bubble-action-btn--danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
