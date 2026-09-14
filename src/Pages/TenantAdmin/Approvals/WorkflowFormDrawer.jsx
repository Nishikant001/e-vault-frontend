// src/Pages/TenantAdmin/Approvals/WorkflowFormDrawer.jsx
import { useEffect, useState } from "react";
import { Loader2, GitBranch, ChevronDown, ChevronRight, ListChecks, SlidersHorizontal, Layers } from "lucide-react";
import AppDrawer from "../../../components/ui/Drawer";
import AppInput from "../../../components/ui/Input";
import AppSelect from "../../../components/ui/Select";
import AppButton from "../../../components/ui/Button";
import { useToast } from "../../../components/ui/Toast";
import { ApprovalWorkflowApi, MasterDataApi } from "../../../features/approvalEngine/api";
import { ACTOR_ROLES, emptyLevel } from "../../../features/approvalEngine/constants";
import WorkflowBuilder from "../../../features/approvalEngine/WorkflowBuilder";
import EntityComboSelector from "../../../features/approvalEngine/EntityComboSelector";

// ────────────────────────────────────────────────────────────
// NOTE: everything in this file below the JSX return is IDENTICAL
// to the original — no state shape, validation, or API payload
// was touched. Only the visual layout (the return()) changed.
// ────────────────────────────────────────────────────────────

function levelsFromServer(levels) {
  return (levels || [])
    .slice()
    .sort((a, b) => a.levelNumber - b.levelNumber)
    .map((l, i) => ({
      key: `srv-${l.id}`,
      name: l.name,
      isParallel: !!l.isParallel,
      assignments: (l.assignments || []).map((a) => ({
        approverType: a.approverType,
        approverRole: a.approverRole || "",
        approverUserId: a.approverUserId || null,
        approverDepartmentId: a.approverDepartmentId || null,
      })),
    }));
}

function levelsToPayload(levels) {
  return levels.map((l, i) => ({
    levelNumber: i + 1,
    name: l.name?.trim() || `Level ${i + 1}`,
    isParallel: !!l.isParallel,
    assignments: l.assignments
      .filter((a) => (a.approverType === "USER" ? a.approverUserId : a.approverRole))
      .map((a) => ({
        approverType: a.approverType,
        approverRole: a.approverType === "USER" ? null : a.approverRole,
        approverUserId: a.approverType === "USER" ? a.approverUserId : null,
        approverDepartmentId: a.approverDepartmentId || null,
      })),
  }));
}

const INITIAL_FORM = {
  name: "",
  description: "",
  departmentId: "",
  categoryId: "",
  documentTypeId: "",
  allowSelfApproval: false,
  status: "ACTIVE",
};

// Small presentational helper for the left-panel collapsible sections.
// Purely visual — does not own or touch any business state.
function ConfigSection({ icon: Icon, title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Icon className="h-4 w-4 text-brand-500" /> {title}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
        )}
      </button>
      {open && <div className="space-y-4 border-t border-[var(--border-subtle)] px-4 py-4">{children}</div>}
    </div>
  );
}

export default function WorkflowFormDrawer({ open, workflowId, onClose, onSaved }) {
  const { toast } = useToast();
  const isEdit = !!workflowId;
  const [form, setForm] = useState(INITIAL_FORM);
  const [levels, setLevels] = useState([emptyLevel(0)]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    MasterDataApi.users().then((res) => setUsers(res.data || res.users || [])).catch(() => setUsers([]));

    if (isEdit) {
      setLoading(true);
      ApprovalWorkflowApi.getById(workflowId)
        .then((res) => {
          const wf = res.data;
          setForm({
            name: wf.name || "",
            description: wf.description || "",
            departmentId: wf.departmentId,
            categoryId: wf.categoryId,
            documentTypeId: wf.documentTypeId,
            allowSelfApproval: !!wf.allowSelfApproval,
            status: wf.status,
          });
          setLevels(levelsFromServer(wf.levels).length ? levelsFromServer(wf.levels) : [emptyLevel(0)]);
        })
        .catch((e) => toast({ title: "Could not load workflow", description: e.message, tone: "error" }))
        .finally(() => setLoading(false));
    } else {
      setForm(INITIAL_FORM);
      setLevels([emptyLevel(0)]);
    }
  }, [open, workflowId]); // eslint-disable-line

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Workflow name is required";
    if (!form.departmentId) e.departmentId = "Required";
    if (!form.categoryId) e.categoryId = "Required";
    if (!form.documentTypeId) e.documentTypeId = "Required";
    if (levels.length === 0) e.levels = "At least one approval level is required";
    const payloadLevels = levelsToPayload(levels);
    if (payloadLevels.some((l) => l.assignments.length === 0)) e.levels = "Every level needs at least one approver";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      departmentId: form.departmentId,
      categoryId: form.categoryId,
      documentTypeId: form.documentTypeId,
      approvalMode: "SEQUENTIAL",
      allowSelfApproval: form.allowSelfApproval,
      status: form.status,
      levels: levelsToPayload(levels),
    };
    try {
      if (isEdit) await ApprovalWorkflowApi.update(workflowId, payload);
      else await ApprovalWorkflowApi.create(payload);
      toast({ title: isEdit ? "Workflow updated" : "Workflow created", tone: "success" });
      onSaved?.();
    } catch (e) {
      toast({ title: "Save failed", description: e.message, tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  const scopeError = errors.departmentId || errors.categoryId || errors.documentTypeId;

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      width="2xl"
      title={
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-app-md bg-brand-500/10 text-brand-500">
            <GitBranch className="h-4 w-4" />
          </span>
          {isEdit ? "Edit Approval Workflow" : "Create Approval Workflow"}
        </span>
      }
      subtitle="Define when approval is required and who approves at each level."
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose} disabled={saving}>Cancel</AppButton>
          <AppButton onClick={handleSave} loading={saving}>{isEdit ? "Save Changes" : "Create Workflow"}</AppButton>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--text-tertiary)]"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_1fr] xl:items-start">
          {/* ───────────── LEFT: Configuration panel ───────────── */}
          <div className="space-y-4 xl:sticky xl:top-0">
            <ConfigSection icon={SlidersHorizontal} title="Basic Information">
              <AppInput
                label="Workflow Name" required
                value={form.name} error={errors.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Finance Invoice Approval"
              />
              <AppInput
                label="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What this workflow is for"
              />
              <AppSelect
                label="Status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="ACTIVE">Active — approval required</option>
                <option value="INACTIVE">Inactive — normal upload flow</option>
              </AppSelect>
            </ConfigSection>

            <ConfigSection icon={Layers} title="Scope — Applies To">
              <EntityComboSelector
                value={{ departmentId: form.departmentId, categoryId: form.categoryId, documentTypeId: form.documentTypeId }}
                onChange={(v) => setForm((f) => ({ ...f, ...v }))}
                disabled={isEdit}
              />
              {scopeError && (
                <p className="text-xs text-danger-600">Department, Category and Document Type are all required.</p>
              )}
              {isEdit && (
                <p className="text-xs text-[var(--text-tertiary)]">
                  The Department/Category/Document Type combo can't be changed after creation — deactivate and create a new workflow instead.
                </p>
              )}
            </ConfigSection>

            <ConfigSection icon={ListChecks} title="Rules">
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.allowSelfApproval}
                  onChange={(e) => setForm((f) => ({ ...f, allowSelfApproval: e.target.checked }))}
                  className="h-4 w-4 rounded accent-[var(--color-brand-500)]"
                />
                Allow the uploader to approve their own document
              </label>
            </ConfigSection>
          </div>

          {/* ───────────── RIGHT: Visual approval builder ───────────── */}
          <div className="min-w-0">
            <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Approval Levels</p>
            <WorkflowBuilder levels={levels} onChange={setLevels} roles={ACTOR_ROLES} users={users} />
            {errors.levels && <p className="mt-2 text-xs text-danger-600">{errors.levels}</p>}
          </div>
        </div>
      )}
    </AppDrawer>
  );
}