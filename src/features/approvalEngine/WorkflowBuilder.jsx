// src/features/approvalEngine/WorkflowBuilder.jsx
//
// Reusable, entity-agnostic drag & drop workflow builder.
//
// It knows nothing about "documents" or "departments" — it only edits an
// ordered array of levels:
//   [{ key, name, isParallel, assignments: [{approverType, approverRole, approverUserId, approverDepartmentId}] }]
// via onChange(levels). Any future approval module can drop this component
// in as-is and supply its own `roles` / `users` / `departments` lists.
//
// Motion notes (all CSS, see approval-motion.css):
//  • levels pop in when added; the new one gets a one-time focus ring
//  • connectors grow downward so the flow reads top → bottom
//  • dragging dims the source card and highlights the drop target
//  • the settings panel cross-fades when you select a different level
import { useState } from "react";
import {
  GripVertical, Plus, Trash2, Copy, ChevronUp, ChevronDown,
  User, Users, Building2, Tag, ArrowDown, X, FileText, CheckCircle2, MousePointerClick,
} from "lucide-react";
import AppButton from "../../components/ui/Button";
import AppSelect from "../../components/ui/Select";
import AppInput from "../../components/ui/Input";
import { APPROVER_TYPES, emptyLevel, newKey } from "./constants";
import "./approval-motion.css";

const APPROVER_ICON = { ROLE: Tag, USER: User, DESIGNATION: Users, DEPARTMENT: Building2 };

function assignmentSummary(a, roles, users) {
  if (a.approverType === "USER") {
    const u = users.find((x) => String(x.id) === String(a.approverUserId));
    return u ? u.name || u.email : "Select user…";
  }
  if (a.approverType === "ROLE" || a.approverType === "DESIGNATION") {
    return a.approverRole || "Select role…";
  }
  if (a.approverType === "DEPARTMENT") {
    return a.approverRole ? `Dept scope · ${a.approverRole}` : "Select scope…";
  }
  return "—";
}

function Connector({ index = 0, children }) {
  return (
    <div className="flex items-center justify-center py-1">
      <ArrowDown className="am-connector h-4 w-4 text-[var(--text-tertiary)]" style={{ "--am-i": index }} />
      {children}
    </div>
  );
}

export default function WorkflowBuilder({ levels, onChange, roles = [], users = [], disabled = false }) {
  const [selectedKey, setSelectedKey] = useState(levels[0]?.key || null);
  const [dragKey, setDragKey] = useState(null);
  const [overKey, setOverKey] = useState(null);
  const [justAddedKey, setJustAddedKey] = useState(null);

  const selected = levels.find((l) => l.key === selectedKey) || null;

  function update(next) {
    onChange(next);
  }

  function updateLevel(key, patch) {
    update(levels.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function focusNew(key) {
    setSelectedKey(key);
    setJustAddedKey(key);
    window.setTimeout(() => setJustAddedKey((k) => (k === key ? null : k)), 800);
  }

  function addLevel(afterKey = null) {
    const lvl = emptyLevel(levels.length);
    if (afterKey == null) {
      update([...levels, lvl]);
    } else {
      const idx = levels.findIndex((l) => l.key === afterKey);
      const next = [...levels];
      next.splice(idx + 1, 0, lvl);
      update(next);
    }
    focusNew(lvl.key);
  }

  function cloneLevel(key) {
    const idx = levels.findIndex((l) => l.key === key);
    const clone = { ...levels[idx], key: newKey(), name: `${levels[idx].name} (Copy)` };
    const next = [...levels];
    next.splice(idx + 1, 0, clone);
    update(next);
    focusNew(clone.key);
  }

  function deleteLevel(key) {
    const next = levels.filter((l) => l.key !== key);
    update(next);
    if (selectedKey === key) setSelectedKey(next[0]?.key || null);
  }

  function moveLevel(key, dir) {
    const idx = levels.findIndex((l) => l.key === key);
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= levels.length) return;
    const next = [...levels];
    [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
    update(next);
  }

  function reorderByDrag(targetKey) {
    if (!dragKey || dragKey === targetKey) return;
    const from = levels.findIndex((l) => l.key === dragKey);
    const to = levels.findIndex((l) => l.key === targetKey);
    const next = [...levels];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    update(next);
  }

  function endDrag() {
    setDragKey(null);
    setOverKey(null);
  }

  function addAssignment(levelKey) {
    updateLevel(levelKey, {
      assignments: [
        ...(levels.find((l) => l.key === levelKey)?.assignments || []),
        { approverType: "ROLE", approverRole: "", approverUserId: null, approverDepartmentId: null },
      ],
    });
  }

  function updateAssignment(levelKey, idx, patch) {
    const lvl = levels.find((l) => l.key === levelKey);
    const assignments = lvl.assignments.map((a, i) => (i === idx ? { ...a, ...patch } : a));
    updateLevel(levelKey, { assignments });
  }

  function removeAssignment(levelKey, idx) {
    const lvl = levels.find((l) => l.key === levelKey);
    updateLevel(levelKey, { assignments: lvl.assignments.filter((_, i) => i !== idx) });
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
      {/* ── Flow canvas ── */}
      <div className="rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-5">
        <div className="flex flex-col items-stretch">
          {/* Start node */}
          <div className="am-pop mx-auto flex h-9 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 text-xs font-medium text-[var(--text-secondary)] shadow-app-xs">
            <FileText className="h-3.5 w-3.5 text-brand-500" /> Document Uploaded
          </div>
          <Connector index={0} />

          {levels.map((lvl, i) => {
            const isSelected = selectedKey === lvl.key;
            const isDragging = dragKey === lvl.key;
            const isOver = overKey === lvl.key && dragKey && dragKey !== lvl.key;
            return (
              <div key={lvl.key}>
                <div
                  draggable={!disabled}
                  onDragStart={() => setDragKey(lvl.key)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (overKey !== lvl.key) setOverKey(lvl.key);
                  }}
                  onDragLeave={() => setOverKey((k) => (k === lvl.key ? null : k))}
                  onDrop={() => {
                    reorderByDrag(lvl.key);
                    endDrag();
                  }}
                  onDragEnd={endDrag}
                  onClick={() => setSelectedKey(lvl.key)}
                  style={{ "--am-i": i }}
                  className={`am-pop group relative flex cursor-pointer items-center gap-3 rounded-app-lg border-2 bg-[var(--surface-card)] px-4 py-3 shadow-app-sm transition-[border-color,box-shadow,transform,opacity] duration-200
                    ${isSelected ? "border-brand-500 shadow-app-glow" : "border-[var(--border-subtle)] hover:-translate-y-px hover:border-brand-300"}
                    ${isDragging ? "scale-[0.98] opacity-40" : ""}
                    ${isOver ? "border-dashed border-brand-500 bg-brand-500/5" : ""}
                    ${justAddedKey === lvl.key ? "am-ring" : ""}`}
                >
                  {!disabled && (
                    <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[var(--text-tertiary)] active:cursor-grabbing" />
                  )}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200 ${
                      isSelected ? "bg-brand-500 text-white" : "bg-brand-500/10 text-brand-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {lvl.name || `Level ${i + 1}`}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {lvl.assignments.map((a, ai) => {
                        const Icon = APPROVER_ICON[a.approverType] || Tag;
                        return (
                          <span
                            key={ai}
                            className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-sunken)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]"
                          >
                            <Icon className="h-3 w-3" /> {assignmentSummary(a, roles, users)}
                          </span>
                        );
                      })}
                      {lvl.assignments.length === 0 && (
                        <span className="text-[11px] text-danger-500">No approver assigned</span>
                      )}
                    </div>
                  </div>

                  {!disabled && (
                    <div
                      className={`flex shrink-0 items-center gap-0.5 transition-opacity duration-200 group-hover:opacity-100 ${
                        isSelected ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <button
                        title="Move up"
                        onClick={(e) => { e.stopPropagation(); moveLevel(lvl.key, -1); }}
                        disabled={i === 0}
                        className="am-press rounded-app-sm p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] disabled:opacity-30"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Move down"
                        onClick={(e) => { e.stopPropagation(); moveLevel(lvl.key, 1); }}
                        disabled={i === levels.length - 1}
                        className="am-press rounded-app-sm p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] disabled:opacity-30"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Clone level"
                        onClick={(e) => { e.stopPropagation(); cloneLevel(lvl.key); }}
                        className="am-press rounded-app-sm p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)]"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Delete level"
                        onClick={(e) => { e.stopPropagation(); deleteLevel(lvl.key); }}
                        className="am-press rounded-app-sm p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/15"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <Connector index={i + 1}>
                  {!disabled && (
                    <button
                      onClick={() => addLevel(lvl.key)}
                      title="Insert level here"
                      className="am-press ml-1 flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-[var(--border-default)] text-[var(--text-tertiary)] hover:border-brand-500 hover:text-brand-500"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </Connector>
              </div>
            );
          })}

          {/* End node */}
          <div className="am-pop mx-auto flex h-9 items-center gap-2 rounded-full border border-success-500/30 bg-success-50 px-4 text-xs font-semibold text-success-600 dark:bg-success-500/15 dark:text-success-500">
            <CheckCircle2 className="h-3.5 w-3.5" /> ERP Upload · Completed
          </div>
        </div>

        {!disabled && (
          <AppButton variant="secondary" size="sm" icon={Plus} className="mt-4 w-full" onClick={() => addLevel(null)}>
            Add Approval Level
          </AppButton>
        )}
      </div>

      {/* ── Selected level settings ── */}
      <div className="rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 xl:sticky xl:top-0">
        {!selected ? (
          <div className="am-fade flex flex-col items-center gap-2 py-8 text-center">
            <MousePointerClick className="h-6 w-6 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-tertiary)]">Select a level to configure its approver(s).</p>
          </div>
        ) : (
          // key → panel cross-fades whenever a different level is selected
          <div key={selected.key} className="am-fade space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Level Settings</h4>
              <button
                onClick={() => setSelectedKey(null)}
                className="am-press text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                aria-label="Close level settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AppInput
              label="Level Name"
              value={selected.name}
              disabled={disabled}
              onChange={(e) => updateLevel(selected.key, { name: e.target.value })}
              placeholder="e.g. Branch Manager"
            />

            <label className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={!!selected.isParallel}
                disabled={disabled}
                onChange={(e) => updateLevel(selected.key, { isParallel: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded accent-[var(--color-brand-500)]"
              />
              <span>
                Run in parallel with previous level
                <span className="mt-0.5 block text-xs text-[var(--text-tertiary)]">
                  Approvers at this level can approve simultaneously with the previous level.
                </span>
              </span>
            </label>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-primary)]">Approvers</span>
                {!disabled && (
                  <button
                    onClick={() => addAssignment(selected.key)}
                    className="am-press text-xs font-medium text-brand-500 hover:text-brand-600"
                  >
                    + Add approver
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {selected.assignments.map((a, idx) => (
                  <div
                    key={idx}
                    className="am-pop space-y-2 rounded-app-md border border-[var(--border-subtle)] p-3"
                    style={{ "--am-i": 0 }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <AppSelect
                        value={a.approverType}
                        disabled={disabled}
                        onChange={(e) =>
                          updateAssignment(selected.key, idx, {
                            approverType: e.target.value,
                            approverRole: "",
                            approverUserId: null,
                          })
                        }
                        className="h-8 text-xs"
                      >
                        {APPROVER_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </AppSelect>
                      {!disabled && selected.assignments.length > 1 && (
                        <button
                          onClick={() => removeAssignment(selected.key, idx)}
                          className="am-press shrink-0 text-danger-500 hover:text-danger-600"
                          title="Remove approver"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {a.approverType === "USER" ? (
                      <AppSelect
                        value={a.approverUserId || ""}
                        disabled={disabled}
                        onChange={(e) => updateAssignment(selected.key, idx, { approverUserId: e.target.value })}
                        className="h-8 text-xs"
                      >
                        <option value="">Select user…</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name || u.email} · {u.role}</option>
                        ))}
                      </AppSelect>
                    ) : (
                      <AppSelect
                        value={a.approverRole || ""}
                        disabled={disabled}
                        onChange={(e) => updateAssignment(selected.key, idx, { approverRole: e.target.value })}
                        className="h-8 text-xs"
                      >
                        <option value="">Select role…</option>
                        {roles.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </AppSelect>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}