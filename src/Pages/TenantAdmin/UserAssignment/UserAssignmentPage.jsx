// src/Pages/TenantAdmin/UserAssignment/UserAssignmentPage.jsx
//
// "User Assignment" module inside the Tenant Panel — extends the existing
// Tenant → Users → Roles flow with a fourth, finer-grained step:
//
//   Tenant → Users → Roles → **User Assignment** (Department / Category / Document Type)
//
// TenantAdmin picks a user, picks an Assignment Level, then multi-selects
// targets in an expandable/searchable/lazily-loaded tree and saves. Every
// permission decision this produces is enforced entirely by the backend's
// Dynamic User Assignment Engine (UserAssignment model + resolveScope() +
// accessControlMiddleware) — this screen only manages the assignment rows
// through the existing REST API; it contains no hardcoded permission logic.

import { useEffect, useMemo, useState, useCallback } from "react";
import { Info } from "lucide-react";
import {
  fetchTenantUsers,
  fetchUserAssignments,
  createAssignment,
  revokeAssignment,
  getCurrentUser,
  PRESELECT_STORAGE_KEY,
} from "./userAssignmentApi";
import { createTreeDataSource } from "./treeDataSource";
import TreeSelect from "./TreeSelect";
import AssignedAccessBadges from "./AssignedAccessBadges";
import AssignmentHistoryPanel from "./AssignmentHistoryPanel";

const PRESELECT_KEY = PRESELECT_STORAGE_KEY;

const LEVELS = [
  {
    key: "DEPARTMENT",
    label: "Department",
    desc: "Grants everything under the selected department(s)",
  },
  {
    key: "CATEGORY",
    label: "Category",
    desc: "Grants selected categories and everything under them",
  },
  {
    key: "DOCUMENT_TYPE",
    label: "Document Type",
    desc: "Grants only the selected document type(s)",
  },
];

function initials(name = "") {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??"
  );
}

function keyToTarget(level, node) {
  if (level === "DEPARTMENT")
    return { assignmentLevel: level, departmentId: node.id };
  if (level === "CATEGORY")
    return { assignmentLevel: level, categoryId: node.id };
  return { assignmentLevel: level, documentTypeId: node.id };
}

// ── Toast (self-contained, matches the per-page pattern used in TAUsers.jsx) ──
function Toast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-xl text-[13px] font-semibold text-white transition-all
            ${t.type === "success" ? "bg-emerald-600" : t.type === "error" ? "bg-red-600" : "bg-blue-600"}`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
// ── Guide / Info Modal ──────────────────────────────────────────────────────
function GuideModal({ open, onClose }) {
  if (!open) return null;
  const steps = [
    {
      title: "Select a User",
      desc: "Click the User field and pick the person you want to grant or review access for.",
    },
    {
      title: "Choose an Assignment Level",
      desc: "Department grants everything under it, Category grants that category and its document types, Document Type grants only that specific type.",
    },
    {
      title: "Pick from the Hierarchy",
      desc: "Use the tree to search and select one or more departments, categories, or document types for the chosen level.",
    },
    {
      title: "Save or Discard",
      desc: "Click Save Assignments to apply your changes, or Discard Changes to revert to what was previously saved.",
    },
    {
      title: "Review & Remove",
      desc: "The Assigned Access panel on the right shows everything currently granted — remove any item directly from there.",
    },
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1C2A3A] rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Info className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
              User Assignment — Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <div className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
                  {s.title}
                </div>
                <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-[9px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Searchable user picker ──────────────────────────────────────────────
function UserPicker({ users, selected, onSelect, loading }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = users.filter((u) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-xl text-left hover:border-blue-400 transition-colors disabled:opacity-60"
      >
        {selected ? (
          <>
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
              {initials(selected.name)}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                {selected.name}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {selected.email} · {selected.role}
              </div>
            </div>
          </>
        ) : (
          <span className="text-[13px] text-slate-400">
            {loading ? "Loading users…" : "Select a user…"}
          </span>
        )}
        <span className="ml-auto text-slate-400 text-[10px]">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-40 w-full bg-white dark:bg-[#1C2A3A] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full px-3 py-2 text-[12.5px] bg-slate-50 dark:bg-[#243044] border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <div className="px-3 py-3 text-[12px] text-slate-400">
                  No users found
                </div>
              )}
              {filtered.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    onSelect(u);
                    setOpen(false);
                    setQ("");
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selected?.id === u.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-400 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                    {initials(u.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {u.name}
                    </div>
                    <div className="text-[10.5px] text-slate-400 truncate">
                      {u.email}
                    </div>
                  </div>
                  <span className="ml-auto text-[10px] font-bold text-slate-400">
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function UserAssignmentPage() {
  const tenant = useMemo(() => getCurrentUser(), []);
  const [toasts, setToasts] = useState([]);
  function toast(msg, type = "success") {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const [level, setLevel] = useState("DEPARTMENT");
  const [selectedKeysByLevel, setSelectedKeysByLevel] = useState({
    DEPARTMENT: new Set(),
    CATEGORY: new Set(),
    DOCUMENT_TYPE: new Set(),
  });
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const dataSource = useMemo(
    () => createTreeDataSource(level, tenant?.tenantId),
    [level, tenant?.tenantId],
  );

  // ── Load users once ──────────────────────────────────────────────────
  useEffect(() => {
    setUsersLoading(true);
    fetchTenantUsers()
      .then((rows) => {
        setUsers(rows);
        // Honour a preselection handed off from TAUsers.jsx's "Manage Assignments" action.
        try {
          const raw = sessionStorage.getItem(PRESELECT_KEY);
          if (raw) {
            sessionStorage.removeItem(PRESELECT_KEY);
            const target = JSON.parse(raw);
            const match = rows.find((u) => u.id === target.id);
            if (match) setSelectedUser(match);
          }
        } catch {
          /* ignore malformed preselect payload */
        }
      })
      .catch((e) => toast(e.message || "Failed to load users", "error"))
      .finally(() => setUsersLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keysFromAssignments = useCallback((rows) => {
    const byLevel = {
      DEPARTMENT: new Set(),
      CATEGORY: new Set(),
      DOCUMENT_TYPE: new Set(),
    };
    rows.forEach((a) => {
      if (a.assignmentLevel === "DEPARTMENT" && a.departmentId)
        byLevel.DEPARTMENT.add(`dept-${a.departmentId}`);
      if (a.assignmentLevel === "CATEGORY" && a.categoryId)
        byLevel.CATEGORY.add(`cat-${a.categoryId}`);
      if (a.assignmentLevel === "DOCUMENT_TYPE" && a.documentTypeId)
        byLevel.DOCUMENT_TYPE.add(`dt-${a.documentTypeId}`);
    });
    return byLevel;
  }, []);

  const loadAssignments = useCallback(
    (userId) => {
      setAssignmentsLoading(true);
      return fetchUserAssignments(userId)
        .then((rows) => {
          setAssignments(rows);
          setSelectedKeysByLevel(keysFromAssignments(rows));
        })
        .catch((e) => toast(e.message || "Failed to load assignments", "error"))
        .finally(() => setAssignmentsLoading(false));
    },
    [keysFromAssignments],
  );

  useEffect(() => {
    if (selectedUser) loadAssignments(selectedUser.id);
    else {
      setAssignments([]);
      setSelectedKeysByLevel({
        DEPARTMENT: new Set(),
        CATEGORY: new Set(),
        DOCUMENT_TYPE: new Set(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  function handleToggle(node) {
    setSelectedKeysByLevel((prev) => {
      const set = new Set(prev[level]);
      if (set.has(node.key)) set.delete(node.key);
      else set.add(node.key);
      return { ...prev, [level]: set };
    });
  }

  function handleBulkToggle(nodes, checked) {
    setSelectedKeysByLevel((prev) => {
      const set = new Set(prev[level]);
      nodes.forEach((n) => (checked ? set.add(n.key) : set.delete(n.key)));
      return { ...prev, [level]: set };
    });
  }

  const originalKeysForLevel = useMemo(
    () => keysFromAssignments(assignments)[level],
    [assignments, level, keysFromAssignments],
  );
  const currentKeysForLevel = selectedKeysByLevel[level];
  const isDirty = useMemo(() => {
    if (originalKeysForLevel.size !== currentKeysForLevel.size) return true;
    for (const k of currentKeysForLevel)
      if (!originalKeysForLevel.has(k)) return true;
    return false;
  }, [originalKeysForLevel, currentKeysForLevel]);

  // Map "cat-42" -> assignment row, for resolving which assignment.id to revoke.
  const assignmentByKey = useMemo(() => {
    const m = new Map();
    assignments.forEach((a) => {
      if (a.assignmentLevel === "DEPARTMENT")
        m.set(`dept-${a.departmentId}`, a);
      if (a.assignmentLevel === "CATEGORY") m.set(`cat-${a.categoryId}`, a);
      if (a.assignmentLevel === "DOCUMENT_TYPE")
        m.set(`dt-${a.documentTypeId}`, a);
    });
    return m;
  }, [assignments]);

  async function handleSave() {
    if (!selectedUser || !isDirty) return;
    setSaving(true);
    const toAdd = [...currentKeysForLevel].filter(
      (k) => !originalKeysForLevel.has(k),
    );
    const toRemove = [...originalKeysForLevel].filter(
      (k) => !currentKeysForLevel.has(k),
    );

    let failures = 0;
    await Promise.all([
      ...toAdd.map((key) => {
        const id = Number(key.split("-")[1]);
        return createAssignment({
          userId: selectedUser.id,
          ...keyToTarget(level, { id }),
        }).catch(() => {
          failures += 1;
        });
      }),
      ...toRemove.map((key) => {
        const a = assignmentByKey.get(key);
        if (!a) return Promise.resolve();
        return revokeAssignment(a.id).catch(() => {
          failures += 1;
        });
      }),
    ]);

    setSaving(false);
    if (failures) toast(`${failures} change(s) could not be saved`, "error");
    else toast("Assignments updated");
    loadAssignments(selectedUser.id);
  }

  function handleReset() {
    setSelectedKeysByLevel((prev) => ({
      ...prev,
      [level]: new Set(originalKeysForLevel),
    }));
  }

  async function handleRemoveBadge(assignment) {
    setRemovingId(assignment.id);
    try {
      await revokeAssignment(assignment.id);
      toast("Assignment removed");
      await loadAssignments(selectedUser.id);
    } catch (e) {
      toast(e.message || "Failed to remove assignment", "error");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#151E2B] p-5">
      <Toast toasts={toasts} />
      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />

      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-[17px] font-bold text-slate-800 dark:text-slate-100">
            User Assignment
          </h1>
          <div className="relative group">
            <button
              onClick={() => setShowGuide(true)}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-blue-500 hover:text-white transition-colors"
            >
              <Info className="w-3 h-3" />
            </button>
            <div className="pointer-events-none absolute left-0 top-full mt-2 w-56 bg-slate-800 dark:bg-slate-700 text-white text-[10.5px] leading-relaxed rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
              Click to see a step-by-step guide on how to use this page.
            </div>
          </div>
        </div>
        <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
          Tenant → Users → Roles →{" "}
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            User Assignment
          </span>
          <span className="mx-2 opacity-40">·</span>
          Grant a user access to specific departments, categories or document
          types
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: user + level + tree */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                User
              </label>
              <UserPicker
                users={users}
                selected={selectedUser}
                onSelect={setSelectedUser}
                loading={usersLoading}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Assignment Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => setLevel(l.key)}
                    disabled={!selectedUser}
                    className={`text-left px-3 py-2.5 rounded-xl border transition-colors disabled:opacity-40
                      ${
                        level === l.key
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                  >
                    <div
                      className={`text-[12.5px] font-bold ${level === l.key ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}
                    >
                      {l.label}
                    </div>
                    <div className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">
                      {l.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {!selectedUser ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <div className="text-4xl mb-2">🌳</div>
                <div className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                  Select a user to manage their access
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    {LEVELS.find((l) => l.key === level)?.label} Hierarchy
                  </label>
                  {currentKeysForLevel.size > 0 && (
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      {currentKeysForLevel.size} selected
                    </span>
                  )}
                </div>
                <TreeSelect
                  key={level}
                  dataSource={dataSource}
                  selectedKeys={currentKeysForLevel}
                  onToggle={handleToggle}
                  onBulkToggle={handleBulkToggle}
                  searchPlaceholder={`Search ${LEVELS.find((l) => l.key === level)?.label.toLowerCase()}…`}
                />

                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[12px] font-bold rounded-xl transition-colors"
                  >
                    {saving && (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    Save Assignments
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={!isDirty || saving}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-600 disabled:opacity-40 text-[12px] font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Discard Changes
                  </button>
                  {isDirty && (
                    <span className="text-[11px] text-amber-500 font-semibold">
                      Unsaved changes
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: assigned access summary + history */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mb-3">
              Assigned Access
            </h3>
            {!selectedUser ? (
              <div className="text-[12px] text-slate-400 italic">
                No user selected
              </div>
            ) : (
              <AssignedAccessBadges
                assignments={assignments}
                loading={assignmentsLoading}
                onRemove={handleRemoveBadge}
                removingId={removingId}
              />
            )}
          </div>

          {selectedUser && (
            <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="w-full flex items-center justify-between text-[13px] font-bold text-slate-800 dark:text-slate-100"
              >
                Assignment History
                <span className="text-slate-400 text-[11px]">
                  {showHistory ? "Hide ▲" : "Show ▼"}
                </span>
              </button>
              {showHistory && (
                <div className="mt-3">
                  <AssignmentHistoryPanel userId={selectedUser.id} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
