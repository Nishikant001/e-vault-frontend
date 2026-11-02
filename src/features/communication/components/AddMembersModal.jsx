// src/features/communication/components/AddMembersModal.jsx
//
// Adds one or more people to an existing GROUP conversation. Mirrors
// GroupCreateModal's picker but without the name field.

import { useEffect, useState } from "react";
import { X, Search, UserPlus, Loader2 } from "lucide-react";
import CommunicationApi from "../api/communicationApi";
import { EmptyState, Skeleton } from "../../../components/ui";

const DEBOUNCE_MS = 300;

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function AddMembersModal({ conversationId, existingMemberIds = [], onClose, onAdded, onError }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      CommunicationApi.searchUsers(query)
        .then((res) => !cancelled && setResults((res.data || []).filter((u) => !existingMemberIds.includes(u.id))))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoading(false));
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const toggleUser = (user) => {
    setSelected((prev) => (prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]));
  };

  const handleAdd = async () => {
    if (!selected.length) return;
    setSaving(true);
    try {
      await CommunicationApi.addParticipants(conversationId, selected.map((u) => u.id));
      onAdded();
    } catch (err) {
      onError?.(err.message || "Could not add members");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-app-lg border border-subtle bg-surface-card shadow-xl">
        <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-ink-900">Add members</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-app-sm p-1.5 text-ink-500 hover:bg-surface-card-hover">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-subtle px-4 py-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people to add..."
              className="w-full rounded-app-md border border-default bg-surface-card py-2 pl-9 pr-3 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-11 w-full rounded-app-md" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState title="No employees found" description="Try a different name or email." />
          ) : (
            <div className="space-y-0.5">
              {results.map((user) => {
                const isSelected = selected.some((u) => u.id === user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleUser(user)}
                    className={`flex w-full items-center gap-3 rounded-app-md px-3 py-2 text-left transition ${
                      isSelected ? "bg-brand-50" : "hover:bg-surface-card-hover"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                      {initials(user.name)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-800">{user.name}</span>
                    <span
                      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border ${
                        isSelected ? "border-brand-500 bg-brand-500" : "border-default"
                      }`}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-sm bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-subtle px-4 py-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selected.length || saving}
            className="flex items-center gap-1.5 rounded-app-md bg-brand-500 px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-ink-200"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Add {selected.length > 0 ? selected.length : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
