// src/Pages/TenantAdmin/UserAssignment/AssignedAccessBadges.jsx
//
// Reusable "Assigned Access" badge display — grouped by level
// (Department / Category / Document Type). Used by:
//   - TAUsers.jsx (User Details drawer → "Assigned Access" section)
//   - UserAssignmentPage.jsx (live summary of the selected user's access)
//
// Kept presentational + reusable: takes the raw assignment rows returned by
// GET /api/user-assignments/user/:userId and does its own grouping.

const LEVEL_META = {
  DEPARTMENT: {
    label: "Department",
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  CATEGORY: {
    label: "Category",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  DOCUMENT_TYPE: {
    label: "Document Type",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
};

function labelFor(assignment) {
  if (assignment.assignmentLevel === "DEPARTMENT") return assignment.Department?.name || `Department #${assignment.departmentId}`;
  if (assignment.assignmentLevel === "CATEGORY") return assignment.Category?.name || `Category #${assignment.categoryId}`;
  return assignment.DocumentType?.name || `Document Type #${assignment.documentTypeId}`;
}

export default function AssignedAccessBadges({ assignments = [], loading, onRemove, removingId, emptyText = "No access assigned yet." }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-slate-400 py-2">
        <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
        Loading assigned access…
      </div>
    );
  }

  if (!assignments.length) {
    return <div className="text-[12px] text-slate-400 italic py-1">{emptyText}</div>;
  }

  const groups = { DEPARTMENT: [], CATEGORY: [], DOCUMENT_TYPE: [] };
  assignments.forEach((a) => {
    if (groups[a.assignmentLevel]) groups[a.assignmentLevel].push(a);
  });

  return (
    <div className="space-y-2.5">
      {Object.entries(groups).map(([level, rows]) => {
        if (!rows.length) return null;
        const meta = LEVEL_META[level];
        return (
          <div key={level}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{meta.label}</span>
              <span className="text-[10px] text-slate-300">({rows.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {rows.map((a) => (
                <span
                  key={a.id}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${meta.color}`}
                >
                  {labelFor(a)}
                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(a)}
                      disabled={removingId === a.id}
                      title="Remove assignment"
                      className="ml-0.5 opacity-60 hover:opacity-100 disabled:opacity-30 leading-none"
                    >
                      {removingId === a.id ? "…" : "×"}
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
