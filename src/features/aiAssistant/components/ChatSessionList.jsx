// src/features/aiAssistant/components/ChatSessionList.jsx
import { useMemo, useState } from "react";
import { Pin, PinOff, Pencil, Trash2, MessageCircle, Check, X } from "lucide-react";
import { AppSearch, EmptyState, SkeletonText } from "../../../components/ui";
import { useAIAssistant } from "../AIAssistantContext";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ChatSessionList({
  sessions,
  loading,
  activeSessionId,
  onSelect,
  onDelete,
  compact = false,
}) {
  const { pinnedSessionIds, togglePinned, renamedTitles, renameSession } = useAIAssistant();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const filtered = useMemo(() => {
    const list = [...(sessions || [])];
    list.sort((a, b) => {
      const aPinned = pinnedSessionIds.includes(a.id);
      const bPinned = pinnedSessionIds.includes(b.id);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      return new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt);
    });
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((s) => (renamedTitles[s.id] || s.title || "Untitled conversation").toLowerCase().includes(q));
  }, [sessions, query, pinnedSessionIds, renamedTitles]);

  const titleOf = (session) => renamedTitles[session.id] || session.title || "Untitled conversation";

  const startRename = (session) => {
    setEditingId(session.id);
    setEditValue(titleOf(session));
  };

  const commitRename = (session) => {
    renameSession(session.id, editValue.trim() || "Untitled conversation");
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="space-y-3 p-3">
        {[1, 2, 3].map((i) => <SkeletonText key={i} lines={2} />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {!compact && (
        <div className="p-3 border-b border-slate-100">
          <AppSearch value={query} onChange={setQuery} placeholder="Search conversations…" />
        </div>
      )}
      {compact && filtered.length > 0 && (
        <div className="px-2 pt-2 pb-1">
          <AppSearch value={query} onChange={setQuery} placeholder="Search…" />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Start a new chat to see it appear here."
          className="border-0 py-8"
        />
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filtered.map((session) => {
            const pinned = pinnedSessionIds.includes(session.id);
            const active = String(session.id) === String(activeSessionId);
            const isEditing = editingId === session.id;
            return (
              <div
                key={session.id}
                className={`group px-3 py-2.5 cursor-pointer transition-colors ${active ? "bg-brand-50" : "hover:bg-slate-50"}`}
                onClick={() => !isEditing && onSelect?.(session)}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && commitRename(session)}
                      className="flex-1 h-7 rounded border border-slate-300 px-2 text-[12.5px]"
                    />
                    <button onClick={() => commitRename(session)} className="text-success-600"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditingId(null)} className="text-slate-400"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-slate-800 truncate flex items-center gap-1.5">
                        {pinned && <Pin className="h-3 w-3 text-brand-500 shrink-0" />}
                        {titleOf(session)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {session.scopeType || "ALL"} · {timeAgo(session.lastMessageAt || session.createdAt)}
                      </p>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button title={pinned ? "Unpin" : "Pin"} onClick={() => togglePinned(session.id)} className="p-1 rounded hover:bg-slate-200 text-slate-400">
                        {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </button>
                      <button title="Rename" onClick={() => startRename(session)} className="p-1 rounded hover:bg-slate-200 text-slate-400">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button title="Delete" onClick={() => onDelete?.(session)} className="p-1 rounded hover:bg-danger-50 text-slate-400 hover:text-danger-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
