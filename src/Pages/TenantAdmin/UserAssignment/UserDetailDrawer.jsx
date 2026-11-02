// src/Pages/TenantAdmin/UserAssignment/UserDetailDrawer.jsx
// Premium user-details drawer. Preserves the existing assignment APIs and navigation flow.

import { useEffect, useState } from "react";
import {
  X,
  UserRound,
  ShieldCheck,
  CheckCircle2,
  CircleSlash,
  Building2,
  Mail,
  History,
  ArrowUpRight,
  ChevronDown,
  Settings2,
  LockKeyhole,
  Clock3,
} from "lucide-react";
import { fetchUserAssignments, revokeAssignment, PRESELECT_STORAGE_KEY } from "./userAssignmentApi";
import AssignedAccessBadges from "./AssignedAccessBadges";
import AssignmentHistoryPanel from "./AssignmentHistoryPanel";

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "??";
}

export default function UserDetailDrawer({ open, user, onClose, onNavigate, onToast }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!open || !user) return undefined;
    let cancelled = false;
    setShowHistory(false);
    setLoading(true);
    fetchUserAssignments(user.id)
      .then((rows) => {
        if (!cancelled) setAssignments(rows);
      })
      .catch((error) => {
        if (!cancelled) onToast?.(error.message || "Failed to load assigned access", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !user) return null;

  async function handleRemove(assignment) {
    setRemovingId(assignment.id);
    try {
      await revokeAssignment(assignment.id);
      setAssignments((previous) => previous.filter((item) => item.id !== assignment.id));
      onToast?.("Assignment removed");
    } catch (error) {
      onToast?.(error.message || "Failed to remove assignment", "error");
    } finally {
      setRemovingId(null);
    }
  }

  function handleManageAssignments() {
    try {
      sessionStorage.setItem(
        PRESELECT_STORAGE_KEY,
        JSON.stringify({ id: user.id, name: user.name, email: user.email })
      );
    } catch {
      // Navigation still works if sessionStorage is unavailable.
    }
    onClose();
    onNavigate?.("userAssignment");
  }

  const active = Boolean(user.isActive);
  const accessCount = assignments.length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close user details"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[2px] animate-in fade-in duration-200"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
        className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-slate-50 shadow-2xl shadow-slate-950/20 animate-in slide-in-from-right duration-300 dark:border-slate-700 dark:bg-slate-950"
      >
        {/* Identity header */}
        <header className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
          <div className="flex items-start gap-4 px-5 pb-5 pt-6 sm:px-7">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-base font-bold tracking-wide text-white shadow-lg shadow-blue-700/20 ring-4 ring-blue-50 dark:ring-blue-950/60">
              {initials(user.name)}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300">
                  User profile
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold ${active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                  {active ? <CheckCircle2 className="h-3 w-3" /> : <CircleSlash className="h-3 w-3" />}
                  {active ? "Active" : "Inactive"}
                </span>
              </div>
              <h2 id="user-detail-title" className="mt-2 truncate text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                {user.name || "Unnamed user"}
              </h2>
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user.email || "No email available"}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
          {/* Profile overview */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <UserRound className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">Profile overview</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="h-4 w-4" /> Assigned role
                </div>
                <p className="mt-2 break-words text-sm font-bold text-slate-900 dark:text-white">{user.role || "No role assigned"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <LockKeyhole className="h-4 w-4" /> Direct assignments
                </div>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  {loading ? "Loading…" : accessCount}
                  <span className="ml-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">
                    {accessCount === 1 ? "access rule" : "access rules"}
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Assigned access */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assigned access</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Departments, categories and document types available to this user.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleManageAssignments}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Manage
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-4 sm:p-5">
              <AssignedAccessBadges
                assignments={assignments}
                loading={loading}
                onRemove={handleRemove}
                removingId={removingId}
                emptyText="No direct access has been assigned. This user may still receive permissions from their role."
              />
              {!loading && accessCount > 0 && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2.5 text-xs leading-5 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  Direct permissions are listed above. Review carefully before removing an assignment.
                </div>
              )}
            </div>
          </section>

          {/* Assignment history */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              aria-expanded={showHistory}
              onClick={() => setShowHistory((value) => !value)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 sm:px-5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <History className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">Assignment history</span>
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Audit trail of access changes</span>
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                {showHistory ? "Hide history" : "View history"}
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showHistory ? "rotate-180" : ""}`} />
              </span>
            </button>
            {showHistory && (
              <div className="border-t border-slate-100 p-4 dark:border-slate-800 sm:p-5">
                <AssignmentHistoryPanel userId={user.id} />
              </div>
            )}
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-100/80 p-3.5 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            Access changes are applied through User Assignment and are subject to your organisation's permission rules.
          </div>
        </div>

        {/* Sticky action footer */}
        <footer className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:px-7 sm:py-5">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="hidden text-[11px] text-slate-500 dark:text-slate-400 sm:block">
              User ID: <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">{user.id}</span>
            </p>
            <button
              type="button"
              onClick={handleManageAssignments}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-700/15 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 dark:focus:ring-offset-slate-900 sm:w-auto"
            >
              <Settings2 className="h-4 w-4" />
              Change assignments
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
