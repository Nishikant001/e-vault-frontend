import { useState } from "react";
import { Building2, Folder, FileText, X, ShieldCheck, ChevronUp, Loader2 } from "lucide-react";

// Same props as before: assignments, loading, onRemove, removingId, emptyText
// (so UserDetailDrawer keeps working unchanged).

const LEVEL_META = {
  DEPARTMENT: {
    label: "Departments",
    Icon: Building2,
    tile: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
    chip: "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  CATEGORY: {
    label: "Categories",
    Icon: Folder,
    tile: "bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-300",
    chip: "border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  DOCUMENT_TYPE: {
    label: "Document types",
    Icon: FileText,
    tile: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
    chip: "border-purple-100 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300",
    dot: "bg-purple-500",
  },
};

function labelFor(a) {
  if (a.assignmentLevel === "DEPARTMENT") return a.Department?.name || `Department #${a.departmentId}`;
  if (a.assignmentLevel === "CATEGORY") return a.Category?.name || `Category #${a.categoryId}`;
  return a.DocumentType?.name || `Document Type #${a.documentTypeId}`;
}

export default function AssignedAccessBadges({
  assignments = [],
  loading,
  onRemove,
  removingId,
  emptyText = "No access assigned yet.",
}) {
  const [closed, setClosed] = useState({});

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-700 p-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-2.5 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!assignments.length) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-7 text-center dark:border-slate-700 dark:bg-slate-800/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No access assigned</p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">{emptyText}</p>
      </div>
    );
  }

  const groups = { DEPARTMENT: [], CATEGORY: [], DOCUMENT_TYPE: [] };
  assignments.forEach((a) => groups[a.assignmentLevel] && groups[a.assignmentLevel].push(a));

  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([level, rows]) => {
        if (!rows.length) return null;
        const meta = LEVEL_META[level];
        const Icon = meta.Icon;
        const open = !closed[level];
        return (
          <section
            key={level}
            className="ua-fade-up rounded-xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-700 dark:bg-[#1A2433]"
          >
            <button
              type="button"
              onClick={() => setClosed((c) => ({ ...c, [level]: open }))}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <span className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.tile}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[14px] font-bold text-slate-900 dark:text-slate-100">{meta.label}</span>
                  <span className="block text-[12px] text-slate-500 dark:text-slate-400">Granted access scope</span>
                </span>
              </span>
              <span className="flex items-center gap-2.5">
                <span className="inline-flex min-w-[26px] items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {rows.length}
                </span>
                <ChevronUp
                  className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${open ? "" : "rotate-180"}`}
                />
              </span>
            </button>

            {/* smooth collapse */}
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="flex flex-wrap gap-2 pt-3.5">
                  {rows.map((a) => (
                    <span
                      key={a.id}
                      className={`ua-pop inline-flex max-w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold ${meta.chip}`}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                      <span className="break-words">{labelFor(a)}</span>
                      {onRemove && (
                        <button
                          type="button"
                          onClick={() => onRemove(a)}
                          disabled={removingId === a.id}
                          title="Remove assignment"
                          aria-label={`Remove ${labelFor(a)}`}
                          className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md opacity-70 transition hover:bg-black/5 hover:opacity-100 disabled:opacity-40 dark:hover:bg-white/10"
                        >
                          {removingId === a.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}