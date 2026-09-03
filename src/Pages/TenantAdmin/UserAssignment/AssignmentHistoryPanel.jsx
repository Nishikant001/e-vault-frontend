// src/Pages/TenantAdmin/UserAssignment/AssignmentHistoryPanel.jsx
//
// "View assignment history" — reuses the Enterprise Audit Trail
// (module=USER_ASSIGNMENT) instead of inventing a parallel history log,
// so every assignment/revoke/update this module performs is automatically
// traceable through the same audit pipeline the rest of the app already
// trusts (see auditActions.js: USER_ASSIGNMENT_CREATED/UPDATED/REVOKED).

import { useEffect, useState } from "react";
import { fetchAssignmentHistory } from "./userAssignmentApi";

const ACTION_META = {
  USER_ASSIGNMENT_CREATED: { label: "Assigned", color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  USER_ASSIGNMENT_UPDATED: { label: "Updated", color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  USER_ASSIGNMENT_REVOKED: { label: "Revoked", color: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
};

export default function AssignmentHistoryPanel({ userId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
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
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-slate-400 py-4 justify-center">
        <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
        Loading history…
      </div>
    );
  }
  if (error) return <div className="text-[12px] text-red-500 py-3">{error}</div>;
  if (!entries.length) return <div className="text-[12px] text-slate-400 italic py-3">No assignment history yet.</div>;

  return (
    <div className="space-y-0">
      {entries.map((e, idx) => {
        const meta = ACTION_META[e.action] || { label: e.action, color: "text-slate-500", dot: "bg-slate-400" };
        return (
          <div key={e.id} className="flex gap-3 pb-3 relative">
            <div className="flex flex-col items-center">
              <span className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${meta.dot}`} />
              {idx < entries.length - 1 && <span className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11.5px] font-bold ${meta.color}`}>{meta.label}</span>
                <span className="text-[10.5px] text-slate-400">
                  {e.createdAt ? new Date(e.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
              </div>
              <div className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-0.5">{e.remarks}</div>
              <div className="text-[10.5px] text-slate-400 mt-0.5">by {e.username || `User #${e.userId}`}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
