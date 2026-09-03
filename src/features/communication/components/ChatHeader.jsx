// src/features/communication/components/ChatHeader.jsx

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Phone, Video, Users, MoreVertical, UserPlus, LogOut } from "lucide-react";
import PresenceIndicator from "./PresenceIndicator";

const AVATAR_GRADIENTS = [
  "var(--comm-avatar-grad-1)",
  "var(--comm-avatar-grad-2)",
  "var(--comm-avatar-grad-3)",
  "var(--comm-avatar-grad-4)",
  "var(--comm-avatar-grad-5)",
  "var(--comm-avatar-grad-6)",
];

function avatarGradient(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function ChatHeader({
  conversation,
  otherUser,
  online,
  onBack,
  onStartCall,
  callDisabled,
  onAddMembers,
  onLeaveGroup,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isGroup = conversation?.type === "GROUP";

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  if (!isGroup && !otherUser) return null;

  return (
    <div className="comm-chat-header">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="comm-icon-btn md:hidden"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
      )}

      {isGroup ? (
        <span className="comm-avatar shrink-0" style={{ background: "var(--comm-avatar-grad-6)" }}>
          <Users className="h-4.5 w-4.5" />
        </span>
      ) : (
        <span className="relative shrink-0">
          <span className="comm-avatar" style={{ background: avatarGradient(otherUser.name || "?") }}>
            {initials(otherUser.name)}
          </span>
          <span className="comm-presence-ring absolute -bottom-0.5 -right-0.5">
            <PresenceIndicator online={online} pulse />
          </span>
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="comm-header-name truncate">{isGroup ? conversation.name : otherUser.name}</p>
        {isGroup ? (
          <p className="comm-header-sub truncate">
            {conversation.memberCount || conversation.members?.length || 0} members
          </p>
        ) : (
          <p className="comm-header-sub truncate">
            <span>{otherUser.department || otherUser.role}</span>
            <span aria-hidden="true">·</span>
            <PresenceIndicator online={online} showLabel />
          </p>
        )}
      </div>

      {!isGroup && onStartCall && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onStartCall("AUDIO")}
            disabled={callDisabled}
            aria-label="Start audio call"
            className="comm-icon-btn disabled:pointer-events-none disabled:opacity-40"
          >
            <Phone className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={() => onStartCall("VIDEO")}
            disabled={callDisabled}
            aria-label="Start video call"
            className="comm-icon-btn disabled:pointer-events-none disabled:opacity-40"
          >
            <Video className="h-4.5 w-4.5" />
          </button>
        </div>
      )}

      {isGroup && (onAddMembers || onLeaveGroup) && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Group options"
            className="comm-icon-btn"
          >
            <MoreVertical className="h-4.5 w-4.5" />
          </button>
          {menuOpen && (
            <div className="comm-menu comm-animate-pop">
              {onAddMembers && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onAddMembers();
                  }}
                  className="comm-menu-item"
                >
                  <UserPlus className="h-4 w-4" /> Add members
                </button>
              )}
              {onLeaveGroup && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onLeaveGroup();
                  }}
                  className="comm-menu-item comm-menu-item--danger"
                >
                  <LogOut className="h-4 w-4" /> Leave group
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
