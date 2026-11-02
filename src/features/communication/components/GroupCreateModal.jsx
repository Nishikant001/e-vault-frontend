// src/features/communication/components/GroupCreateModal.jsx
//
// Minimal group-creation flow: name + multi-select member picker, reusing
// the same tenant-scoped /communication/users search as 1-to-1 UserSearch.

import { useEffect, useState } from "react";
import { X, Search, Users, Loader2 } from "lucide-react";
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

export default function GroupCreateModal({ onClose, onCreated, onError }) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]); // [{id, name, email}]
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      CommunicationApi.searchUsers(query)
        .then((res) => !cancelled && setResults(res.data || []))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoading(false));
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const toggleUser = (user) => {
    setSelected((prev) => (prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]));
  };

  const canCreate = name.trim().length > 0 && selected.length >= 2 && !creating;

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      const res = await CommunicationApi.createGroup(
        name.trim(),
        selected.map((u) => u.id)
      );
      onCreated(res.data.conversationId);
    } catch (err) {
      onError?.(err.message || "Could not create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-app-lg border border-subtle bg-surface-card shadow-xl">
        <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-ink-900">New group</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-app-sm p-1.5 text-ink-500 hover:bg-surface-card-hover">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-subtle px-4 py-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            maxLength={120}
            className="w-full rounded-app-md border border-default bg-surface-card px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-subtle px-4 py-2.5">
            {selected.map((u) => (
              <span
                key={u.id}
                className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
              >
                {u.name}
                <button type="button" onClick={() => toggleUser(u)} aria-label={`Remove ${u.name}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="border-b border-subtle px-4 py-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
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

        <div className="flex items-center justify-between gap-3 border-t border-subtle px-4 py-3">
          <p className="text-xs text-ink-400">
            {selected.length < 2 ? "Select at least 2 people" : `${selected.length} member${selected.length === 1 ? "" : "s"} selected`}
          </p>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className="flex items-center gap-1.5 rounded-app-md bg-brand-500 px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-ink-200"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            Create group
          </button>
        </div>
      </div>
    </div>
  );
}
