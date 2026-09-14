// src/Pages/TenantAdmin/UserAssignment/UserDetailDrawer.jsx
//
// "User Details" panel — added as a right-side drawer opened from the
// existing Users table (TAUsers.jsx) rather than a brand-new route, since
// the app navigates via page-key strings, not real routing/params. Adds
// the required "Assigned Access" section (badges, grouped by level) plus
// quick actions to remove an assignment inline, jump into the full
// User Assignment screen to change assignments, or view history —
// satisfying the "User Details Page" and "Edit User" requirements without
// touching the existing Add/Edit User modal or its flow.

import { useEffect, useState } from "react";
import { fetchUserAssignments, revokeAssignment, PRESELECT_STORAGE_KEY } from "./userAssignmentApi";
import AssignedAccessBadges from "./AssignedAccessBadges";
import AssignmentHistoryPanel from "./AssignmentHistoryPanel";

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "??";
}

export default function UserDetailDrawer({ open, user, onClose, onNavigate, onToast }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setShowHistory(false);
    setLoading(true);
    fetchUserAssignments(user.id)
      .then(setAssignments)
      .catch((e) => onToast?.(e.message || "Failed to load assigned access", "error"))
      .finally(() => setLoading(false));
  }, [open, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !user) return null;

  async function handleRemove(assignment) {
    setRemovingId(assignment.id);
    try {
      await revokeAssignment(assignment.id);
      setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
      onToast?.("Assignment removed");
    } catch (e) {
      onToast?.(e.message || "Failed to remove assignment", "error");
    } finally {
      setRemovingId(null);
    }
  }

  function handleManageAssignments() {
    try {
      sessionStorage.setItem(PRESELECT_STORAGE_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email }));
    } catch {
      /* sessionStorage unavailable — navigation still works, just without preselect */
    }
    onClose();
    onNavigate?.("userAssignment");
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white dark:bg-[#1A2433] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</div>
            <div className="text-[11.5px] text-slate-400 truncate">{user.email}</div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Profile summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-[#16202E] rounded-xl px-3 py-2.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Role</div>
              <div className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{user.role}</div>
            </div>
            <div className="bg-slate-50 dark:bg-[#16202E] rounded-xl px-3 py-2.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</div>
              <div className={`text-[12.5px] font-semibold mt-0.5 ${user.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                {user.isActive ? "Active" : "Inactive"}
              </div>
            </div>
          </div>

          {/* Assigned Access */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">Assigned Access</h3>
              <button
                type="button"
                onClick={handleManageAssignments}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Manage Assignments →
              </button>
            </div>
            <AssignedAccessBadges
              assignments={assignments}
              loading={loading}
              onRemove={handleRemove}
              removingId={removingId}
              emptyText="No access assigned yet — this user relies on their role's default access."
            />
          </div>

          {/* History */}
          <div>
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="w-full flex items-center justify-between text-[12.5px] font-bold text-slate-800 dark:text-slate-100"
            >
              Assignment History
              <span className="text-slate-400 text-[11px]">{showHistory ? "Hide ▲" : "Show ▼"}</span>
            </button>
            {showHistory && (
              <div className="mt-3">
                <AssignmentHistoryPanel userId={user.id} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-[#16202E]">
          <button
            type="button"
            onClick={handleManageAssignments}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-xl transition-colors"
          >
            Change Assignments
          </button>
        </div>
      </div>
    </div>
  );
}
