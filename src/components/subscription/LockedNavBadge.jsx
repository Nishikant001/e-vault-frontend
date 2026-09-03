// src/components/subscription/LockedNavBadge.jsx
//
// Small lock icon + hover tooltip for sidebar nav items a FREE tenant
// can't use yet. Per the brief: default to showing gated items
// grayed-out with a lock + tooltip (discoverable upsell) rather than
// hiding them outright, since there's no existing "disabled nav item"
// convention in this codebase to match.

import { Lock } from "lucide-react";

export default function LockedNavBadge() {
  return (
    <span className="group/lock relative inline-flex shrink-0">
      <Lock className="h-3 w-3 text-white/40" />
      <span
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 w-max max-w-[160px] -translate-x-1/2
          rounded-app-sm bg-[var(--surface-card)] px-2 py-1 text-[10px] font-medium text-[var(--text-primary)]
          opacity-0 shadow-app-md transition-opacity group-hover/lock:opacity-100"
      >
        Upgrade to unlock
      </span>
    </span>
  );
}
