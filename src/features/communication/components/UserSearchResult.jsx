// src/features/communication/components/UserSearchResult.jsx

import PresenceIndicator from "./PresenceIndicator";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function UserSearchResult({ user, online, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(user)}
      className="flex w-full items-center gap-3 rounded-app-md px-3 py-2.5 text-left transition hover:bg-surface-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
        {initials(user.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-ink-900">{user.name}</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-ink-500">
          <span className="truncate">{user.department || "Unassigned"}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{user.role}</span>
        </span>
      </span>
      <PresenceIndicator online={online} showLabel />
    </button>
  );
}
