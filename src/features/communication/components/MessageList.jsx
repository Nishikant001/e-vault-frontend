// src/features/communication/components/MessageList.jsx

import { useEffect, useMemo, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

function dateLabel(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString([], { month: "long", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

export default function MessageList({
  messages,
  loading,
  loadingOlder,
  hasMore,
  currentUserId,
  conversationId,
  initialUnreadCount,
  otherUserRead,
  isOtherTyping,
  otherUserName,
  isGroup,
  onLoadOlder,
  onReply,
  onEdit,
  onDelete,
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const prevMessageCountRef = useRef(0);
  // Freezes the "N unread" count the moment a conversation is opened, so
  // the divider doesn't jump around as read-receipts/new messages arrive
  // — it marks where the conversation was when the user walked in.
  const unreadAnchorRef = useRef({ conversationId: null, count: 0 });
  if (unreadAnchorRef.current.conversationId !== conversationId) {
    unreadAnchorRef.current = { conversationId, count: initialUnreadCount || 0 };
  }

  // Auto-scroll to bottom on new messages (but not when just loading older history).
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const grewFromOlderLoad = prevScrollHeightRef.current > 0 && loadingOlder === false;
      if (!grewFromOlderLoad || messages.length - prevMessageCountRef.current <= 3) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, loadingOlder]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el || loadingOlder || !hasMore) return;
    if (el.scrollTop < 80) {
      prevScrollHeightRef.current = el.scrollHeight;
      onLoadOlder();
    }
  };

  // Precompute which messages need a date separator above them, and
  // whether each message should visually "group" with the one above it
  // (same sender, no separator between them, within a short time window)
  // — this is what keeps consecutive messages compact instead of
  // repeating full spacing/name for every single line (project brief §6).
  const withSeparators = useMemo(() => {
    return messages.map((message, index) => {
      const msgDate = new Date(message.createdAt).toDateString();
      const prev = index > 0 ? messages[index - 1] : null;
      const prevDate = prev ? new Date(prev.createdAt).toDateString() : null;
      const showDateSeparator = msgDate !== prevDate;
      const grouped =
        !showDateSeparator &&
        prev &&
        prev.senderId === message.senderId &&
        !prev.isDeleted &&
        !message.isDeleted &&
        new Date(message.createdAt) - new Date(prev.createdAt) < 3 * 60 * 1000;
      return { message, showDateSeparator, grouped };
    });
  }, [messages]);

  const unreadDividerIndex = useMemo(() => {
    const { count } = unreadAnchorRef.current;
    if (!count || count <= 0 || count > messages.length) return -1;
    return messages.length - count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, conversationId]);

  if (loading) {
    return (
      <div className="comm-panel-chat flex-1 space-y-4 overflow-y-auto p-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={i % 2 === 0 ? "flex justify-start" : "flex justify-end"}>
            <div className="w-1/3 space-y-2 rounded-app-lg p-3">
              <div className="comm-skeleton h-3 w-full" />
              <div className="comm-skeleton h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} onScroll={handleScroll} className="comm-panel-chat flex-1 overflow-y-auto py-3">
      {loadingOlder && <p className="comm-loading-older">Loading earlier messages...</p>}

      {withSeparators.map(({ message, showDateSeparator, grouped }, index) => {
        const mine = message.senderId === currentUserId;
        const isRead = mine && otherUserRead && message.id <= otherUserRead;

        return (
          <div key={message.id}>
            {showDateSeparator && (
              <div className="my-3 flex items-center justify-center">
                <span className="comm-day-divider">{dateLabel(message.createdAt)}</span>
              </div>
            )}
            {index === unreadDividerIndex && (
              <div className="my-3 flex items-center gap-3 px-4" role="separator" aria-label="Unread messages">
                <span className="comm-unread-divider-line" />
                <span className="comm-unread-divider-label">New messages</span>
                <span className="comm-unread-divider-line" />
              </div>
            )}
            <MessageBubble
              message={message}
              mine={mine}
              isRead={isRead}
              grouped={grouped}
              showSenderName={isGroup && !mine && !grouped}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        );
      })}

      {isOtherTyping && <TypingIndicator label={`${otherUserName || "They"} are typing`} />}

      <div ref={bottomRef} />
    </div>
  );
}
