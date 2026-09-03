// src/features/communication/components/ConversationList.jsx

import { useMemo, useState } from "react";
import { Search, SquarePen, Users, MessagesSquare, Sun, Moon } from "lucide-react";
import ConversationItem from "./ConversationItem";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
];

export default function ConversationList({
  conversations,
  loading,
  activeConversationId,
  isUserOnline,
  searchValue,
  onSearchChange,
  onSelectConversation,
  onNewConversation,
  onNewGroup,
  themeMode,
  onToggleTheme,
}) {
  const [filter, setFilter] = useState("all");

  const visibleConversations = useMemo(() => {
    if (filter === "unread") return conversations.filter((c) => c.unreadCount > 0);
    return conversations;
  }, [conversations, filter]);

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount > 0 ? 1 : 0), 0),
    [conversations]
  );

  return (
    <div className="comm-panel-list flex h-full flex-col">
      <div className="comm-list-header">
        <span className="flex items-center gap-2">
          <span className="comm-brand-icon">
            <MessagesSquare className="h-4 w-4" />
          </span>
          <h2 className="comm-title">Chat</h2>
        </span>
        <div className="flex items-center gap-1">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              title={themeMode === "light" ? "Switch to dark mode" : "Switch to light mode"}
              aria-label="Toggle chat theme"
              className="comm-icon-btn comm-theme-toggle"
            >
              {themeMode === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>
          )}
          <button
            type="button"
            onClick={onNewGroup}
            title="New group"
            aria-label="Create a new group"
            className="comm-icon-btn"
          >
            <Users className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={onNewConversation}
            title="New conversation"
            aria-label="Start a new conversation"
            className="comm-icon-btn comm-icon-btn--accent"
          >
            <SquarePen className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <div className="comm-search-block">
        <div className="relative">
          <Search className="comm-search-icon pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search people, conversations..."
            className="comm-search-input"
          />
        </div>

        <div className="mt-2.5 flex items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`comm-filter-btn ${filter === f.key ? "comm-filter-btn--active" : ""}`}
            >
              {f.label}
              {f.key === "unread" && unreadTotal > 0 && (
                <span className={`comm-filter-count ${filter !== "unread" ? "comm-filter-count--idle" : ""}`}>
                  {unreadTotal}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="comm-skeleton h-14 w-full" />
            ))}
          </div>
        ) : visibleConversations.length === 0 ? (
          <div className="comm-animate-in flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="comm-empty-icon comm-float mb-4">
              <SquarePen className="h-6 w-6" />
            </div>
            <h3 className="comm-empty-title">
              {filter === "unread" ? "You're all caught up" : "No conversations yet"}
            </h3>
            <p className="comm-empty-body mt-1.5">
              {filter === "unread"
                ? "No unread messages right now."
                : "Start a conversation with someone in your organization."}
            </p>
            {filter !== "unread" && (
              <button type="button" onClick={onNewConversation} className="comm-empty-cta mt-5">
                New conversation
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {visibleConversations.map((conv, i) => (
              <div key={conv.conversationId} className="comm-animate-in" style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}>
                <ConversationItem
                  conversation={conv}
                  active={conv.conversationId === activeConversationId}
                  online={isUserOnline?.(conv.otherUser?.id)}
                  onSelect={() => onSelectConversation(conv)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
