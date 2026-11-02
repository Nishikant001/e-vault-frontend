// src/features/communication/components/ConversationItem.jsx

import { Users } from "lucide-react";
import PresenceIndicator from "./PresenceIndicator";

const AVATAR_GRADIENTS = [
  "var(--comm-avatar-grad-1)",
  "var(--comm-avatar-grad-2)",
  "var(--comm-avatar-grad-3)",
  "var(--comm-avatar-grad-4)",
  "var(--comm-avatar-grad-5)",
  "var(--comm-avatar-grad-6)",
];

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// Deterministic gradient per person, so the same user always gets the
// same avatar color across the conversation list, header, etc.
function avatarGradient(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function formatTimestamp(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const isThisYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: isThisYear ? undefined : "numeric" });
}

export default function ConversationItem({ conversation, active, online, onSelect }) {
  const { type, otherUser, name, memberCount, lastMessagePreview, lastMessageAt, unreadCount } = conversation;
  const isGroup = type === "GROUP";
  const hasUnread = unreadCount > 0;
  const displayName = isGroup ? name : otherUser?.name;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation)}
      className={`comm-row ${active ? "comm-row--active" : ""}`}
    >
      {active && <span className="comm-row-accent-bar" aria-hidden="true" />}

      <span className="relative shrink-0">
        <span
          className="comm-avatar"
          style={{ background: isGroup ? "var(--comm-avatar-grad-6)" : avatarGradient(displayName || "?") }}
        >
          {isGroup ? <Users className="h-4.5 w-4.5" /> : initials(otherUser?.name)}
        </span>
        {!isGroup && (
          <span className="comm-presence-ring absolute -bottom-0.5 -right-0.5">
            <PresenceIndicator online={online} pulse />
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className={`truncate ${hasUnread ? "comm-name comm-name--unread" : "comm-name"}`}>
            {displayName}
            {isGroup && memberCount ? <span className="comm-name-meta"> · {memberCount}</span> : null}
          </span>
          <span className={`shrink-0 ${hasUnread ? "comm-timestamp comm-timestamp--unread" : "comm-timestamp"}`}>
            {formatTimestamp(lastMessageAt)}
          </span>
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className={`truncate ${hasUnread ? "comm-preview comm-preview--unread" : "comm-preview"}`}>
            {lastMessagePreview || "No messages yet"}
          </span>
          {hasUnread && (
            <span className="comm-unread-badge ml-1 shrink-0">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </span>
      </span>
    </button>
  );
}
