// src/features/metadataEngine/TemplateManager.jsx
//
// OCR Templates workspace — restructured to the new design:
//
//   Header (breadcrumb · title · Help & Guide)
//   Card 1 : [Templates | Assign Template] tabs  +  Department → Category → Document Type pickers
//   Card 2 : Templates (n)  [+ Create Template]
//              └ template card  (Duplicate · Archive · New Draft Version · ⋮)
//                   └ version rows (View fields · Assign · ⋮)
//
// All logic / API calls are the same as before (api.js unchanged,
// FormBuilder unchanged). New in this version (all backed by existing endpoints):
//   • template "Edit details"  → PUT  /metadata-templates/:id   (name / description)
//   • draft "Delete"           → DELETE /metadata-templates/versions/:id  (DRAFT only)
//   • picker selection is shared by both tabs (no re-picking when switching tabs)
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Home, ChevronRight, ChevronDown, HelpCircle, Info, Layers, Link2, Plus, Copy, Archive,
  GitBranch, Rocket, Pencil, MoreVertical, ScanText, Building2, Folder, FileText,
  CheckCircle2, Loader2, Trash2, ArchiveRestore,
} from "lucide-react";
import AppButton from "../../components/ui/Button";
import AppInput from "../../components/ui/Input";
import AppModal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { useLabels } from "../../context/MetadataContext";
import { getCurrentTenantId } from "../../services/apiClient";
import * as api from "./api";
import FormBuilder from "./FormBuilder";

// ── Scoped animations ──────────────────────────────────────────
const ANIM_CSS = `
@keyframes tm-fade-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes tm-fade-down{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:none}}
@keyframes tm-pop{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
.tm-fade-up{animation:tm-fade-up .5s cubic-bezier(.22,1,.36,1) both}
.tm-menu-in{animation:tm-fade-down .16s ease-out both;transform-origin:top right}
.tm-pop{animation:tm-pop .3s cubic-bezier(.34,1.56,.64,1) both}
.tm-press{transition:transform .15s ease,box-shadow .2s ease,background-color .2s ease,border-color .2s ease}
.tm-press:active:not(:disabled){transform:scale(.97)}
@media (prefers-reduced-motion:reduce){
  .tm-root *{animation-duration:.01ms!important;animation-delay:0ms!important;transition-duration:.01ms!important}
}
`;

// ── Shared styling helpers ─────────────────────────────────────
const btnBase =
  "tm-press inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";
const btnOutline = `${btnBase} border border-slate-200 dark:border-slate-600 bg-white dark:bg-transparent text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:-translate-y-px`;
const btnBlueOutline = `${btnBase} border border-blue-500 bg-white dark:bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:-translate-y-px`;
const btnBlue = `${btnBase} bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_12px_rgba(37,99,235,0.28)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.38)] hover:-translate-y-px`;
const btnSoft = `${btnBase} bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700`;

function Card({ children, className = "", style }) {
  return (
    <div
      style={style}
      className={`bg-white dark:bg-[#1A2433] border border-slate-200/70 dark:border-slate-700 rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const raw = String(status || "").toUpperCase();
  const label = raw === "INACTIVE" ? "ARCHIVED" : raw;
  const tone = raw === "ACTIVE" || raw === "PUBLISHED" ? "green" : raw === "DRAFT" ? "amber" : "slate";
  const styles = {
    green: ["bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", "bg-emerald-500"],
    amber: ["bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400", "bg-amber-500"],
    slate: ["bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300", "bg-slate-400"],
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-bold tracking-wide ${styles[0]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles[1]}`} />
      {label}
    </span>
  );
}

function SectionTitle({ icon: Icon, title, count, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[16px] font-bold text-slate-900 dark:text-slate-100">
            {title}
            {count !== undefined && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                ({count})
              </span>
            )}
          </h3>
          {subtitle && <p className="mt-0.5 text-[12.5px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function EmptyBlock({ icon: Icon, title, description, action }) {
  return (
    <div className="tm-fade-up flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-700">
      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Icon className="h-7 w-7" />
      </span>
      <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      {description && <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ⋮ menu (outside-click close, animated)
function KebabMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const visible = items.filter(Boolean);
  if (!visible.length) return null;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="tm-press flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-100"
        aria-label="More actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="tm-menu-in absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-600 dark:bg-[#232F40]">
          {visible.map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-[12.5px] font-medium transition-colors ${
                it.danger
                  ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <it.icon className="h-3.5 w-3.5" /> {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Picker select (icon on the left, chevron on the right) ─────
function PickerSelect({ labelIcon: LabelIcon, icon: Icon, label, value, onChange, disabled, placeholder, children }) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-700 dark:text-slate-200">
        <LabelIcon className="h-4 w-4 text-slate-500" />
        {label}
      </label>
      <div className="relative">
        <Icon
          className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
            value ? "text-blue-600" : "text-slate-400"
          }`}
        />
        <select
          value={value}
          disabled={disabled}
          onChange={onChange}
          className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-[14px] font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-[#232F40] dark:text-slate-100"
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  );
}

function HierarchyPicker({ department, category, docType, onChange }) {
  const { level1Label, level2Label, level3Label } = useLabels();
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [docTypes, setDocTypes] = useState([]);

  useEffect(() => {
    const tenantId = getCurrentTenantId();
    if (!tenantId) return;
    api.listDepartmentsForTenant(tenantId).then((res) => setDepartments(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!department) {
      setCategories([]);
      return;
    }
    api.listCategories(department).then((res) => setCategories(res.data || [])).catch(() => {});
  }, [department]);

  useEffect(() => {
    if (!category) {
      setDocTypes([]);
      return;
    }
    api.listDocumentTypes(category).then((res) => setDocTypes(res.data || [])).catch(() => {});
  }, [category]);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <PickerSelect
        labelIcon={Building2}
        icon={FileText}
        label={level1Label}
        value={department || ""}
        placeholder={`Select ${level1Label}…`}
        onChange={(e) => onChange({ department: e.target.value || null, category: null, docType: null, docTypeName: "" })}
      >
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </PickerSelect>
      <PickerSelect
        labelIcon={Folder}
        icon={Folder}
        label={level2Label}
        value={category || ""}
        disabled={!department}
        placeholder={`Select ${level2Label}…`}
        onChange={(e) => onChange({ department, category: e.target.value || null, docType: null, docTypeName: "" })}
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </PickerSelect>
      <PickerSelect
        labelIcon={FileText}
        icon={FileText}
        label={level3Label}
        value={docType || ""}
        disabled={!category}
        placeholder={`Select ${level3Label}…`}
        onChange={(e) => {
          const id = e.target.value || null;
          const name = docTypes.find((d) => String(d.id) === String(id))?.name || "";
          onChange({ department, category, docType: id, docTypeName: name });
        }}
      >
        {docTypes.map((dt) => (
          <option key={dt.id} value={dt.id}>{dt.name}</option>
        ))}
      </PickerSelect>
    </div>
  );
}

// ── Tabs (live inside the first card, above the pickers) ───────
function TabBar({ tab, onChange }) {
  const tabs = [
    { value: "templates", label: "Templates", icon: Layers },
    { value: "assign", label: "Assign Template", icon: Link2 },
  ];
  return (
    <div className="flex gap-2 border-b border-slate-200/80 px-3 dark:border-slate-700">
      {tabs.map((t) => {
        const on = tab === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`relative flex items-center gap-2 px-4 py-4 text-[14px] font-semibold transition-colors duration-300 ${
              on ? "text-blue-600 dark:text-blue-400" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            <span
              className={`absolute inset-x-0 bottom-[-1px] h-[2px] origin-left bg-blue-600 transition-transform duration-300 ${
                on ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ── Version row ────────────────────────────────────────────────
function VersionRow({ version, index, onPublish, onEdit, onAssign, onDelete, publishing }) {
  const isDraft = version.status === "DRAFT";
  const isPublished = version.status === "PUBLISHED";
  return (
    <div
      style={{ animationDelay: `${index * 70}ms` }}
      className="tm-fade-up flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#151E2B]/60"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
          <GitBranch className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-[14px] font-bold text-slate-900 dark:text-slate-100">Version {version.versionNumber}</p>
            <StatusPill status={version.status} />
          </div>
          {version.notes && <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-slate-400">{version.notes}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onEdit(version)} className={btnSoft}>
          <Pencil className="h-4 w-4" />
          {isDraft ? "Edit fields" : "View fields"}
        </button>
        {isDraft && (
          <button type="button" onClick={() => onPublish(version)} disabled={publishing} className={btnBlue}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Publish
          </button>
        )}
        {isPublished && (
          <button type="button" onClick={() => onAssign(version)} className={btnBlue}>
            <Link2 className="h-4 w-4" /> Assign
          </button>
        )}
        <KebabMenu
          items={[
            { label: isDraft ? "Edit fields" : "View fields", icon: Pencil, onClick: () => onEdit(version) },
            isDraft && { label: "Publish", icon: Rocket, onClick: () => onPublish(version) },
            isPublished && { label: "Assign", icon: Link2, onClick: () => onAssign(version) },
            isDraft && { label: "Delete draft", icon: Trash2, danger: true, onClick: () => onDelete(version) },
          ]}
        />
      </div>
    </div>
  );
}

// ── Modals ─────────────────────────────────────────────────────
const textareaCls =
  "h-20 w-full rounded-app-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

function CreateTemplateModal({ open, onClose, onCreate, documentTypeId, docTypeLabel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Create OCR Template"
      description={docTypeLabel ? `For document type: ${docTypeLabel}` : undefined}
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose}>Cancel</AppButton>
          <AppButton
            variant="primary"
            loading={saving}
            disabled={!name.trim()}
            onClick={async () => {
              setSaving(true);
              try {
                await onCreate({ documentTypeId, name: name.trim(), description });
                onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            Create Template
          </AppButton>
        </>
      }
    >
      <div className="space-y-4">
        <AppInput label="Template Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Invoice Template" />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Description</label>
          <textarea className={textareaCls} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this template captures…" />
        </div>
      </div>
    </AppModal>
  );
}

function EditTemplateModal({ open, onClose, template, onSave }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && template) {
      setName(template.name || "");
      setDescription(template.description || "");
    }
  }, [open, template]);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Edit Template Details"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose}>Cancel</AppButton>
          <AppButton
            variant="primary"
            loading={saving}
            disabled={!name.trim()}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave({ name: name.trim(), description: description.trim() });
                onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            Save Changes
          </AppButton>
        </>
      }
    >
      <div className="space-y-4">
        <AppInput label="Template Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Description</label>
          <textarea className={textareaCls} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
    </AppModal>
  );
}

function DuplicateTemplateModal({ open, onClose, sourceTemplate, onDuplicate }) {
  const { level3Label } = useLabels();
  const [name, setName] = useState("");
  const [targetDocTypeId, setTargetDocTypeId] = useState("");
  const [availableDocTypes, setAvailableDocTypes] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(sourceTemplate ? `${sourceTemplate.name} (Copy)` : "");
    setTargetDocTypeId("");
    Promise.all([api.listDocumentTypes(), api.listTemplates()])
      .then(([dtRes, tRes]) => {
        const taken = new Set((tRes.data || []).map((t) => t.documentTypeId));
        setAvailableDocTypes((dtRes.data || []).filter((dt) => !taken.has(dt.id)));
      })
      .catch(() => {});
  }, [open, sourceTemplate]);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Duplicate Template"
      description={`Copy every field from "${sourceTemplate?.name}" into a new template for a different ${level3Label.toLowerCase()}.`}
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose}>Cancel</AppButton>
          <AppButton
            variant="primary"
            loading={saving}
            disabled={!name.trim() || !targetDocTypeId}
            onClick={async () => {
              setSaving(true);
              try {
                await onDuplicate({ name: name.trim(), targetDocTypeId });
                onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            Duplicate
          </AppButton>
        </>
      }
    >
      <div className="space-y-4">
        <AppInput label="New Template Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Target {level3Label}</label>
          <select
            className="w-full rounded-app-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            value={targetDocTypeId}
            onChange={(e) => setTargetDocTypeId(e.target.value)}
          >
            <option value="">Select…</option>
            {availableDocTypes.map((dt) => (
              <option key={dt.id} value={dt.id}>{dt.name}</option>
            ))}
          </select>
        </div>
        {availableDocTypes.length === 0 && (
          <p className="text-xs text-[var(--text-tertiary)]">
            Every {level3Label.toLowerCase()} already has its own template — create a new {level3Label.toLowerCase()} first to duplicate into it.
          </p>
        )}
      </div>
    </AppModal>
  );
}

function GuideModal({ open, onClose }) {
  const steps = [
    { title: "Pick a Document Type", desc: "Use the Department → Category → Document Type pickers to select which document type's template you're managing." },
    { title: "Create a Template", desc: "If none exists yet, click Create Template to start one. Each document type has at most one template." },
    { title: "Add Fields & Version", desc: "Use Edit fields on a draft version to open the Form Builder. Create a New Draft Version to make changes without affecting a published one." },
    { title: "Publish", desc: "Publish a draft version once it's ready — only published versions can be assigned to a document type." },
    { title: "Assign Template", desc: "Switch to the Assign Template tab, pick the document type, and choose which published version new uploads should be OCR-mapped against." },
  ];
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="OCR Templates — Guide"
      footer={<AppButton variant="primary" onClick={onClose}>Got it</AppButton>}
    >
      <div className="space-y-4">
        {steps.map((s, i) => (
          <div key={s.title} className="flex gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-[11px] font-bold text-brand-500">
              {i + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{s.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-tertiary)]">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </AppModal>
  );
}

// ── Picker card (tabs + pickers) shared by both tabs ───────────
function PickerCard({ tabBar, hierarchy, onHierarchy }) {
  return (
    <Card className="tm-fade-up" style={{ animationDelay: "60ms" }}>
      {tabBar}
      <div className="p-5">
        <HierarchyPicker
          department={hierarchy.department}
          category={hierarchy.category}
          docType={hierarchy.docType}
          onChange={onHierarchy}
        />
      </div>
    </Card>
  );
}

// ── Templates tab ──────────────────────────────────────────────
function TemplatesTab({ tabBar, hierarchy, onHierarchy, onEditVersion, onAssignVersion }) {
  const { level3Label } = useLabels();
  const { toast } = useToast();
  const [template, setTemplate] = useState(undefined); // undefined = not loaded, null = none exists
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [deleteVersion, setDeleteVersion] = useState(null);
  const [publishingId, setPublishingId] = useState(null);

  const docTypeId = hierarchy.docType;

  const refresh = useCallback(() => {
    if (!docTypeId) {
      setTemplate(undefined);
      setVersions([]);
      return;
    }
    setLoading(true);
    api
      .listTemplates(docTypeId)
      .then(async (res) => {
        const t = (res.data || [])[0] || null;
        setTemplate(t);
        if (t) {
          const vRes = await api.listVersions(t.id);
          setVersions(vRes.data || []);
        } else {
          setVersions([]);
        }
      })
      .catch((err) => toast({ title: "Failed to load template", description: err.message, tone: "error" }))
      .finally(() => setLoading(false));
  }, [docTypeId, toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreateTemplate = async (payload) => {
    try {
      await api.createTemplate(payload);
      toast({ title: "Template created", tone: "success" });
      refresh();
    } catch (err) {
      toast({ title: "Failed to create template", description: err.message, tone: "error" });
      throw err;
    }
  };

  // Backend allows exactly one template per document type.
  const handleCreateClick = () => {
    if (!docTypeId) return;
    if (template) {
      toast({
        title: "Template already exists",
        description: `This ${level3Label.toLowerCase()} already has a template — use "New Draft Version" to change it.`,
        tone: "info",
      });
      return;
    }
    setShowCreate(true);
  };

  const handleEditDetails = async (patch) => {
    try {
      await api.updateTemplate(template.id, patch);
      toast({ title: "Template updated", tone: "success" });
      refresh();
    } catch (err) {
      toast({ title: "Failed to update template", description: err.message, tone: "error" });
      throw err;
    }
  };

  const handleDuplicate = async ({ name, targetDocTypeId }) => {
    try {
      const created = await api.createTemplate({ documentTypeId: targetDocTypeId, name, description: template?.description });
      const newVersionId = created.data.draftVersion.id;
      if (template) {
        const latest = versions[0];
        if (latest) {
          const fieldsRes = await api.listFields(latest.id);
          for (const f of fieldsRes.data || []) {
            // eslint-disable-next-line no-unused-vars
            const { id, metadataTemplateVersionId, createdAt, updatedAt, ocrAliases, ...rest } = f;
            await api.createField(newVersionId, rest);
          }
        }
      }
      toast({ title: "Template duplicated", tone: "success" });
    } catch (err) {
      toast({ title: "Failed to duplicate template", description: err.message, tone: "error" });
      throw err;
    }
  };

  const handleNewVersion = async () => {
    try {
      await api.createVersion(template.id, true);
      toast({ title: "New draft version created", tone: "success" });
      refresh();
    } catch (err) {
      toast({ title: "Failed to create version", description: err.message, tone: "error" });
    }
  };

  const handlePublish = async (version) => {
    setPublishingId(version.id);
    try {
      await api.publishVersion(version.id);
      toast({ title: `Version ${version.versionNumber} published`, tone: "success" });
      refresh();
    } catch (err) {
      toast({ title: "Failed to publish", description: err.message, tone: "error" });
    } finally {
      setPublishingId(null);
    }
  };

  const handleDeleteVersion = async () => {
    try {
      await api.deleteVersion(deleteVersion.id);
      toast({ title: `Draft version ${deleteVersion.versionNumber} deleted`, tone: "success" });
      setDeleteVersion(null);
      refresh();
    } catch (err) {
      toast({ title: "Failed to delete draft", description: err.message, tone: "error" });
    }
  };

  const handleArchiveToggle = async () => {
    try {
      await api.updateTemplate(template.id, { status: template.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
      toast({ title: template.status === "ACTIVE" ? "Template archived" : "Template reactivated", tone: "success" });
      setArchiveConfirm(false);
      refresh();
    } catch (err) {
      toast({ title: "Failed to update template", description: err.message, tone: "error" });
    }
  };

  const isActive = template?.status === "ACTIVE";

  return (
    <div className="space-y-5">
      <PickerCard tabBar={tabBar} hierarchy={hierarchy} onHierarchy={onHierarchy} />

      <Card className="tm-fade-up p-5" style={{ animationDelay: "120ms" }}>
        <SectionTitle
          icon={Layers}
          title="Templates"
          count={docTypeId ? (template ? 1 : 0) : 0}
          subtitle={`Manage OCR field templates for the selected ${level3Label.toLowerCase()}.`}
          right={
            <button
              type="button"
              onClick={handleCreateClick}
              disabled={!docTypeId}
              title={template ? `Each ${level3Label.toLowerCase()} can have only one template` : undefined}
              className={btnBlue}
            >
              <Plus className="h-4 w-4" /> Create Template
            </button>
          }
        />

        <div className="mt-5">
          {!docTypeId && (
            <EmptyBlock
              icon={Layers}
              title={`Select a ${level3Label.toLowerCase()} to manage its template`}
              description="Every document type has at most one OCR template, versioned so old documents keep the field set they were reviewed against."
            />
          )}

          {docTypeId && loading && (
            <div className="animate-pulse space-y-3">
              <div className="h-[84px] rounded-2xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-[64px] rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
          )}

          {docTypeId && !loading && template === null && (
            <EmptyBlock
              icon={Plus}
              title="No OCR template yet"
              description={`Create one to start capturing fields for this ${level3Label.toLowerCase()}.`}
              action={
                <button type="button" onClick={() => setShowCreate(true)} className={btnBlue}>
                  <Plus className="h-4 w-4" /> Create Template
                </button>
              }
            />
          )}

          {docTypeId && !loading && template && (
            <div
              key={template.id}
              className="tm-fade-up rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1A2433]"
            >
              {/* template header */}
              <div className="relative flex flex-wrap items-center justify-between gap-4 rounded-t-2xl bg-blue-50/60 px-5 py-4 dark:bg-blue-900/10">
                <span className="absolute bottom-0 left-0 top-0 w-1 rounded-tl-2xl bg-blue-600" />
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                    <ScanText className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="truncate text-[18px] font-bold text-slate-900 dark:text-slate-100">{template.name}</h4>
                      <StatusPill status={template.status} />
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-slate-500 dark:text-slate-400">
                      {template.description || "No description"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setShowDuplicate(true)} className={btnOutline}>
                    <Copy className="h-4 w-4" /> Duplicate
                  </button>
                  <button type="button" onClick={() => setArchiveConfirm(true)} className={btnOutline}>
                    {isActive ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
                    {isActive ? "Archive" : "Reactivate"}
                  </button>
                  <button type="button" onClick={handleNewVersion} className={btnBlueOutline}>
                    <Plus className="h-4 w-4" /> New Draft Version
                  </button>
                  <KebabMenu
                    items={[
                      { label: "Edit details", icon: Pencil, onClick: () => setShowEdit(true) },
                      { label: "Duplicate", icon: Copy, onClick: () => setShowDuplicate(true) },
                      { label: isActive ? "Archive" : "Reactivate", icon: isActive ? Archive : ArchiveRestore, onClick: () => setArchiveConfirm(true) },
                    ]}
                  />
                </div>
              </div>

              {/* versions */}
              <div className="space-y-2.5 rounded-b-2xl p-4">
                {versions.length === 0 ? (
                  <p className="py-4 text-center text-[12.5px] text-slate-400">No versions yet.</p>
                ) : (
                  versions.map((v, i) => (
                    <VersionRow
                      key={v.id}
                      index={i}
                      version={v}
                      publishing={publishingId === v.id}
                      onPublish={handlePublish}
                      onDelete={setDeleteVersion}
                      onEdit={(ver) => onEditVersion(ver, template)}
                      onAssign={(ver) => onAssignVersion(ver, template, docTypeId)}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      <CreateTemplateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreateTemplate}
        documentTypeId={docTypeId}
        docTypeLabel={hierarchy.docTypeName}
      />
      <EditTemplateModal open={showEdit} onClose={() => setShowEdit(false)} template={template} onSave={handleEditDetails} />
      <DuplicateTemplateModal
        open={showDuplicate}
        onClose={() => setShowDuplicate(false)}
        sourceTemplate={template}
        onDuplicate={handleDuplicate}
      />
      <ConfirmDialog
        open={archiveConfirm}
        onClose={() => setArchiveConfirm(false)}
        onConfirm={handleArchiveToggle}
        title={isActive ? "Archive this template?" : "Reactivate this template?"}
        description={
          isActive
            ? "Archived templates stay assigned to existing documents but won't be offered for new uploads."
            : "This template becomes available again for new uploads."
        }
        tone={isActive ? "danger" : "primary"}
        confirmLabel={isActive ? "Archive" : "Reactivate"}
      />
      <ConfirmDialog
        open={!!deleteVersion}
        onClose={() => setDeleteVersion(null)}
        onConfirm={handleDeleteVersion}
        title={`Delete draft version ${deleteVersion?.versionNumber ?? ""}?`}
        description="The draft and all of its fields will be permanently removed. Published versions are never affected."
        tone="danger"
        confirmLabel="Delete draft"
      />
    </div>
  );
}

// ── Assign Template tab ────────────────────────────────────────
function AssignTab({ tabBar, hierarchy, onHierarchy, initialVersion, initialTemplate, onGoTemplates }) {
  const { level3Label } = useLabels();
  const { toast } = useToast();
  const [template, setTemplate] = useState(initialTemplate || null);
  const [versions, setVersions] = useState([]);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(initialVersion?.id || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const docTypeId = hierarchy.docType;

  useEffect(() => {
    if (!docTypeId) {
      setTemplate(null);
      setActiveAssignment(null);
      return;
    }
    setLoading(true);
    Promise.all([api.listTemplates(docTypeId), api.getActiveAssignment(docTypeId)])
      .then(([tRes, aRes]) => {
        setTemplate((tRes.data || [])[0] || null);
        setActiveAssignment(aRes.data || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [docTypeId]);

  useEffect(() => {
    if (!template) {
      setVersions([]);
      return;
    }
    api
      .listVersions(template.id)
      .then((res) => setVersions((res.data || []).filter((v) => v.status === "PUBLISHED")))
      .catch(() => {});
  }, [template]);

  const handleAssign = async () => {
    if (!docTypeId || !selectedVersionId) return;
    setSaving(true);
    try {
      const res = await api.assignTemplateVersion(docTypeId, selectedVersionId);
      setActiveAssignment(res.data);
      toast({ title: "Template assigned", tone: "success" });
    } catch (err) {
      toast({ title: "Failed to assign template", description: err.message, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const liveVersionNumber = activeAssignment
    ? activeAssignment.MetadataTemplateVersion?.versionNumber ?? activeAssignment.metadataTemplateVersionId
    : null;

  return (
    <div className="space-y-5">
      <PickerCard tabBar={tabBar} hierarchy={hierarchy} onHierarchy={onHierarchy} />

      <Card className="tm-fade-up p-5" style={{ animationDelay: "120ms" }}>
        <SectionTitle
          icon={Link2}
          title="Assign Template"
          subtitle={`Choose which published version new uploads of this ${level3Label.toLowerCase()} are OCR-mapped against.`}
        />

        <div className="mt-5">
          {!docTypeId && (
            <EmptyBlock
              icon={Link2}
              title={`Select a ${level3Label.toLowerCase()} to manage its assignment`}
              description="Choose which published template version new uploads will be OCR-mapped against."
            />
          )}

          {docTypeId && loading && <div className="h-[110px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />}

          {docTypeId && !loading && !template && (
            <EmptyBlock
              icon={Layers}
              title={`No template exists for this ${level3Label.toLowerCase()} yet`}
              description="Create one from the Templates tab first."
              action={
                <button type="button" onClick={onGoTemplates} className={btnBlueOutline}>
                  <Layers className="h-4 w-4" /> Go to Templates
                </button>
              }
            />
          )}

          {docTypeId && !loading && template && (
            <div className="tm-fade-up rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1A2433]">
              <div className="relative flex flex-wrap items-center justify-between gap-4 rounded-t-2xl bg-blue-50/60 px-5 py-4 dark:bg-blue-900/10">
                <span className="absolute bottom-0 left-0 top-0 w-1 rounded-tl-2xl bg-blue-600" />
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                    <ScanText className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-[18px] font-bold text-slate-900 dark:text-slate-100">{template.name}</h4>
                      <StatusPill status={template.status} />
                    </div>
                    <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                      {activeAssignment
                        ? `Currently live: Version ${liveVersionNumber}`
                        : "No version currently assigned — new uploads won't be OCR-mapped until one is assigned."}
                    </p>
                  </div>
                </div>
                {activeAssignment && (
                  <span key={liveVersionNumber} className="tm-pop inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Live · v{liveVersionNumber}
                  </span>
                )}
              </div>

              <div className="rounded-b-2xl p-5">
                {versions.length === 0 ? (
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">
                    Publish a draft version from the Templates tab before it can be assigned.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <PickerSelect
                        labelIcon={GitBranch}
                        icon={GitBranch}
                        label="Published Version"
                        value={selectedVersionId}
                        placeholder="Select version…"
                        onChange={(e) => setSelectedVersionId(e.target.value)}
                      >
                        {versions.map((v) => (
                          <option key={v.id} value={v.id}>
                            Version {v.versionNumber} {activeAssignment?.metadataTemplateVersionId === v.id ? "(currently live)" : ""}
                          </option>
                        ))}
                      </PickerSelect>
                    </div>
                    <button type="button" onClick={handleAssign} disabled={!selectedVersionId || saving} className={btnBlue}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Assign
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function TemplateManager({ showHeader = true }) {
  const [tab, setTab] = useState("templates");
  const [builderCtx, setBuilderCtx] = useState(null); // { version, template }
  const [assignCtx, setAssignCtx] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  // shared by both tabs so the selection survives switching between them
  const [hierarchy, setHierarchy] = useState({ department: null, category: null, docType: null, docTypeName: "" });

  if (builderCtx) {
    return (
      <div className="tm-root">
        <style>{ANIM_CSS}</style>
        <div className="tm-fade-up h-[calc(100vh-120px)] overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] dark:border-slate-700">
          <FormBuilder version={builderCtx.version} template={builderCtx.template} onBack={() => setBuilderCtx(null)} />
        </div>
      </div>
    );
  }

  const tabBar = (
    <TabBar
      tab={tab}
      onChange={(v) => {
        setTab(v);
        setAssignCtx(null);
      }}
    />
  );

  return (
    <div className="tm-root">
      <style>{ANIM_CSS}</style>
      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />

      {showHeader && (
        <div className="tm-fade-up mb-6 flex items-start justify-between gap-4">
          <div>
            <nav className="mb-3 flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400">
              <Home className="h-4 w-4 text-blue-600" />
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              <span className="text-teal-600 dark:text-teal-400">Tenant</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              <span>Documents</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              <span className="font-semibold text-slate-800 dark:text-slate-100">OCR Templates</span>
            </nav>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[28px] font-bold leading-tight text-slate-900 dark:text-slate-50">OCR Templates</h1>
              <button
                type="button"
                onClick={() => setShowGuide(true)}
                title="How to use this page"
                className="tm-press mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-blue-500 hover:text-white dark:bg-slate-600 dark:text-slate-300"
              >
                <Info className="h-3 w-3" />
              </button>
            </div>
            <p className="mt-1.5 text-[14px] text-slate-500 dark:text-slate-400">
              Define, version and assign field templates for each document type to extract data using OCR.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="tm-press flex flex-shrink-0 items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-4 py-2.5 text-[13px] font-semibold text-blue-600 shadow-sm hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-[#1A2433]"
          >
            <HelpCircle className="h-4 w-4" /> Help &amp; Guide
          </button>
        </div>
      )}

      {tab === "templates" && (
        <TemplatesTab
          tabBar={tabBar}
          hierarchy={hierarchy}
          onHierarchy={setHierarchy}
          onEditVersion={(version, template) => setBuilderCtx({ version, template })}
          onAssignVersion={(version, template, docTypeId) => {
            setAssignCtx({ version, template, docTypeId });
            setTab("assign");
          }}
        />
      )}
      {tab === "assign" && (
        <AssignTab
          key={assignCtx?.version?.id || "blank"}
          tabBar={tabBar}
          hierarchy={hierarchy}
          onHierarchy={setHierarchy}
          initialVersion={assignCtx?.version}
          initialTemplate={assignCtx?.template}
          onGoTemplates={() => setTab("templates")}
        />
      )}
    </div>
  );
}