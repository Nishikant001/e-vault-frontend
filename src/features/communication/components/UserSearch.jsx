// src/features/communication/components/UserSearch.jsx
//
// Employee discovery: searches /api/communication/users (tenant-scoped
// on the backend — this component never sees another tenant's users).

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import CommunicationApi from "../api/communicationApi";
import UserSearchResult from "./UserSearchResult";
import { EmptyState, Skeleton } from "../../../components/ui";

const DEBOUNCE_MS = 300;

export default function UserSearch({ isUserOnline, onSelectUser, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-subtle px-4 py-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people by name or email..."
            className="w-full rounded-app-md border border-default bg-surface-card py-2 pl-9 pr-3 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-app-sm p-1.5 text-ink-500 hover:bg-surface-card-hover"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-11 w-full rounded-app-md" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            title="No employees found"
            description={query ? "Try a different name or email." : "Start typing to search your organization."}
          />
        ) : (
          <div className="space-y-0.5">
            {results.map((user) => (
              <UserSearchResult
                key={user.id}
                user={user}
                online={isUserOnline?.(user.id)}
                onSelect={onSelectUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
