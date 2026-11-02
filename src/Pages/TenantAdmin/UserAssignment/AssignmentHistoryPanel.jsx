import { useEffect, useState } from "react";
import {
  CheckCircle2,
  PencilLine,
  XCircle,
  History,
  UserRound,
  Clock3,
  AlertCircle,
  Plus,
} from "lucide-react";
import { fetchAssignmentHistory } from "./userAssignmentApi";

// Props:
//   userId
//   compact       — screenshot-style list (used on the User Assignment page).
//                   Default false = the original timeline (used by UserDetailDrawer).
//   showAll       — compact only: false = latest 3, true = everything
//   refreshKey    — change it to re-fetch (e.g. after saving)
//   resolveLabel  — (assignmentId) => "Employee (Department)" | null

const ACTION_META = {
  USER_ASSIGNMENT_CREATED: {
    label: "Access assigned",
    Icon: CheckCircle2,
    CompactIcon: Plus,
    color: "text-emerald-700 dark:text-emerald-300",
    surface: "bg-emerald-50 dark:bg-emerald-950/40",
    solid: "bg-emerald-500 text-white",
    line: "bg-emerald-200 dark:bg-emerald-900",
  },
  USER_ASSIGNMENT_UPDATED: {
    label: "Access updated",
    Icon: PencilLine,
    CompactIcon: PencilLine,
    color: "text-amber-700 dark:text-amber-300",
    surface: "bg-amber-50 dark:bg-amber-950/40",
    solid: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
    line: "bg-amber-200 dark:bg-amber-900",
  },
  USER_ASSIGNMENT_REVOKED: {
    label: "Access revoked",
    Icon: XCircle,
    CompactIcon: XCircle,
    color: "text-rose-700 dark:text-rose-300",
    surface: "bg-rose-50 dark:bg-rose-950/40",
    solid: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300",
    line: "bg-rose-200 dark:bg-rose-900",
  },
};

const FALLBACK_META = {
  Icon: History,
  CompactIcon: History,
  color: "text-slate-600 dark:text-slate-300",
  surface: "bg-slate-100 dark:bg-slate-800",
  solid: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  line: "bg-slate-200 dark:bg-slate-700",
};

const LEVEL_SINGULAR = {
  DEPARTMENT: "Department",
  CATEGORY: "Category",
  DOCUMENT_TYPE: "Document Type",
};

function formatWhen(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return "";
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const now = new Date();
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return `Today, ${time}`;
  if (sameDay(d, yesterday)) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })} ${time}`;
}

// Audit rows only store ids, so names are resolved by the page (from the
// assignments it has already loaded). Falls back to level + id, then remarks.
function describeTarget(entry, resolveLabel) {
  const val = entry.newValue?.assignmentLevel
    ? entry.newValue
    : entry.oldValue?.assignmentLevel
      ? entry.oldValue
      : null;
  const remarkId = typeof entry.remarks === "string" ? entry.remarks.match(/assignment #(\d+)/i)?.[1] : null;
  const id = val?.id ?? entry.newValue?.id ?? entry.oldValue?.id ?? (remarkId ? Number(remarkId) : null);

  const resolved = id != null ? resolveLabel?.(id) : null;
  if (resolved) return resolved;
  if (val) {
    const tid = val.departmentId || val.categoryId || val.documentTypeId;
    return `${LEVEL_SINGULAR[val.assignmentLevel] || "Scope"}${tid ? ` #${tid}` : ""}`;
  }
  return entry.remarks || "";
}

export default function AssignmentHistoryPanel({
  userId,
  compact = false,
  showAll = false,
  refreshKey = 0,
  resolveLabel,
}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchAssignmentHistory(userId)
      .then((rows) => !cancelled && setEntries(rows))
      .catch((e) => !cancelled && setError(e.message || "Failed to load history"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  if (loading) {
    return compact ? (
      <div className="space-y-4 animate-pulse">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-2.5 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-500 dark:text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        Loading assignment history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center dark:border-slate-700">
        <History className="h-6 w-6 text-slate-400" />
        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">No history yet</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Assignment changes will appear here.</p>
      </div>
    );
  }

  /* ───────────── Compact (page) variant ───────────── */
  if (compact) {
    const list = showAll ? entries : entries.slice(0, 3);
    return (
      <div>
        {list.map((entry, i) => {
          const meta = ACTION_META[entry.action] || { ...FALLBACK_META, label: entry.action };
          const Icon = meta.CompactIcon;
          return (
            <article
              key={entry.id}
              style={{ animationDelay: `${i * 60}ms` }}
              className="ua-fade-up flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-700/70 last:border-b-0"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.solid}`}>
                <Icon className="h-4 w-4" strokeWidth={2.4} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold text-slate-900 dark:text-slate-100">{meta.label}</div>
                <div className="truncate text-[12px] text-slate-500 dark:text-slate-400">
                  {describeTarget(entry, resolveLabel)}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[12px] text-slate-500 dark:text-slate-400">{formatWhen(entry.createdAt)}</div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400">
                  by {entry.username || `User #${entry.userId}`}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  /* ───────────── Timeline (original / drawer) variant ───────────── */
  return (
    <div className="space-y-0">
      {entries.map((entry, index) => {
        const meta = ACTION_META[entry.action] || { ...FALLBACK_META, label: entry.action };
        const Icon = meta.Icon;
        return (
          <article key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
            <div className="flex flex-col items-center">
              <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${meta.surface} ${meta.color}`}>
                <Icon className="h-4 w-4" />
              </span>
              {index < entries.length - 1 && <span className={`mt-1 w-px flex-1 ${meta.line}`} />}
            </div>
            <div className="min-w-0 flex-1 rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <Clock3 className="h-3 w-3" />
                  {entry.createdAt
                    ? new Date(entry.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </div>
              {entry.remarks && (
                <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600 dark:text-slate-300">
                  {entry.remarks}
                </p>
              )}
              <div className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[10px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <UserRound className="h-3 w-3" />
                By {entry.username || `User #${entry.userId}`}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}