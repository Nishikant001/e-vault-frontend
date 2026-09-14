// src/features/metadataEngine/TemplateManager.jsx
//
// Tenant Admin's "Metadata Templates" workspace — Part 2 (Template
// Management) and Part 3 (Assign Template) of the Dynamic Metadata
// Template Engine spec, plus the entry point into the Form Builder
// (Part 1). Everything lives behind a single sidebar nav item
// ("Metadata Templates") and switches views internally, the same
// self-contained-container pattern already used by DMSPage.jsx and
// TAWorkflow.jsx for their own multi-step flows — so wiring this in only
// required one new nav entry + one new page-map entry in App.jsx.
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus, Layers, GitBranch, Rocket, Archive, Copy, Pencil, CheckCircle2,
  Loader2, ChevronRight, Link2, Info,
} from "lucide-react";
import AppButton from "../../components/ui/Button";
import AppSelect from "../../components/ui/Select";
import AppInput from "../../components/ui/Input";
import AppModal from "../../components/ui/Modal";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Tabs from "../../components/ui/Tabs";
import { useToast } from "../../components/ui/Toast";
import { useLabels } from "../../context/MetadataContext";
import { getCurrentTenantId } from "../../services/apiClient";
import * as api from "./api";
import FormBuilder from "./FormBuilder";

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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <AppSelect
        label={level1Label}
        value={department || ""}
        onChange={(e) => onChange({ department: e.target.value || null, category: null, docType: null })}
      >
        <option value="">Select {level1Label}…</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </AppSelect>
      <AppSelect
        label={level2Label}
        value={category || ""}
        disabled={!department}
        onChange={(e) => onChange({ department, category: e.target.value || null, docType: null })}
      >
        <option value="">Select {level2Label}…</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </AppSelect>
      <AppSelect
        label={level3Label}
        value={docType || ""}
        disabled={!category}
        onChange={(e) => onChange({ department, category, docType: e.target.value || null })}
      >
        <option value="">Select {level3Label}…</option>
        {docTypes.map((dt) => (
          <option key={dt.id} value={dt.id}>{dt.name}</option>
        ))}
      </AppSelect>
    </div>
  );
}

function VersionRow({ version, onPublish, onEdit, onAssign, publishing }) {
  const tone = version.status === "PUBLISHED" ? "success" : version.status === "DRAFT" ? "warning" : "neutral";
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <GitBranch className="h-4 w-4 text-[var(--text-tertiary)]" />
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Version {version.versionNumber}</p>
          {version.notes && <p className="text-xs text-[var(--text-tertiary)]">{version.notes}</p>}
        </div>
        <StatusBadge status={version.status} tone={tone} />
      </div>
      <div className="flex items-center gap-1.5">
        <AppButton variant="ghost" size="sm" icon={Pencil} onClick={() => onEdit(version)}>
          {version.status === "DRAFT" ? "Edit fields" : "View fields"}
        </AppButton>
        {version.status === "DRAFT" && (
          <AppButton variant="primary" size="sm" icon={Rocket} loading={publishing} onClick={() => onPublish(version)}>
            Publish
          </AppButton>
        )}
        {version.status === "PUBLISHED" && (
          <AppButton variant="secondary" size="sm" icon={Link2} onClick={() => onAssign(version)}>
            Assign
          </AppButton>
        )}
      </div>
    </div>
  );
}

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
      title="Create Metadata Template"
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
          <textarea
            className="h-20 w-full rounded-app-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this template captures…"
          />
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
    Promise.all([api.listDocumentTypes(), api.listTemplates()]).then(([dtRes, tRes]) => {
      const taken = new Set((tRes.data || []).map((t) => t.documentTypeId));
      setAvailableDocTypes((dtRes.data || []).filter((dt) => !taken.has(dt.id)));
    });
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
        <AppSelect label={`Target ${level3Label}`} required value={targetDocTypeId} onChange={(e) => setTargetDocTypeId(e.target.value)}>
          <option value="">Select…</option>
          {availableDocTypes.map((dt) => (
            <option key={dt.id} value={dt.id}>{dt.name}</option>
          ))}
        </AppSelect>
        {availableDocTypes.length === 0 && (
          <p className="text-xs text-[var(--text-tertiary)]">
            Every {level3Label.toLowerCase()} already has its own template — create a new {level3Label.toLowerCase()} first to duplicate into it.
          </p>
        )}
      </div>
    </AppModal>
  );
}

// ── Templates tab ────────────────────────────────────────────────
function TemplatesTab({ onEditVersion, onAssignVersion }) {
  const { level3Label } = useLabels();
  const { toast } = useToast();
  const [hierarchy, setHierarchy] = useState({ department: null, category: null, docType: null });
  const [template, setTemplate] = useState(undefined); // undefined = not loaded, null = none exists
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
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

  const handleDuplicate = async ({ name, targetDocTypeId }) => {
    try {
      const created = await api.createTemplate({ documentTypeId: targetDocTypeId, name });
      const newVersionId = created.data.draftVersion.id;
      if (template) {
        const latest = versions[0];
        if (latest) {
          const fieldsRes = await api.listFields(latest.id);
          for (const f of fieldsRes.data || []) {
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

  return (
    <div className="space-y-5 py-4">
      <HierarchyPicker
        department={hierarchy.department}
        category={hierarchy.category}
        docType={hierarchy.docType}
        onChange={setHierarchy}
      />

      {!docTypeId && (
        <EmptyState
          icon={Layers}
          title={`Select a ${level3Label.toLowerCase()} to manage its template`}
          description="Every document type has at most one metadata template, versioned so old documents keep the field set they were reviewed against."
        />
      )}

      {docTypeId && loading && (
        <div className="flex items-center gap-2 py-10 justify-center text-[var(--text-tertiary)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {docTypeId && !loading && template === null && (
        <EmptyState
          icon={Plus}
          title="No metadata template yet"
          description={`Create one to start capturing fields for this ${level3Label.toLowerCase()}.`}
          actionLabel="Create Template"
          onAction={() => setShowCreate(true)}
        />
      )}

      {docTypeId && !loading && template && (
        <div className="rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{template.name}</h3>
                <StatusBadge status={template.status} />
              </div>
              {template.description && <p className="mt-1 text-sm text-[var(--text-tertiary)]">{template.description}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              <AppButton variant="ghost" size="sm" icon={Copy} onClick={() => setShowDuplicate(true)}>Duplicate</AppButton>
              <AppButton variant="ghost" size="sm" icon={Archive} onClick={() => setArchiveConfirm(true)}>
                {template.status === "ACTIVE" ? "Archive" : "Reactivate"}
              </AppButton>
              <AppButton variant="secondary" size="sm" icon={Plus} onClick={handleNewVersion}>New Draft Version</AppButton>
            </div>
          </div>

          <div className="space-y-2">
            {versions.map((v) => (
              <VersionRow
                key={v.id}
                version={v}
                publishing={publishingId === v.id}
                onPublish={handlePublish}
                onEdit={(ver) => onEditVersion(ver, template)}
                onAssign={(ver) => onAssignVersion(ver, template, docTypeId)}
              />
            ))}
          </div>
        </div>
      )}

      <CreateTemplateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreateTemplate}
        documentTypeId={docTypeId}
      />
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
        title={template?.status === "ACTIVE" ? "Archive this template?" : "Reactivate this template?"}
        description={
          template?.status === "ACTIVE"
            ? "Archived templates stay assigned to existing documents but won't be offered for new uploads."
            : "This template becomes available again for new uploads."
        }
        tone={template?.status === "ACTIVE" ? "danger" : "primary"}
        confirmLabel={template?.status === "ACTIVE" ? "Archive" : "Reactivate"}
      />
    </div>
  );
}

// ── Assign Template tab ─────────────────────────────────────────
function AssignTab({ initialVersion, initialTemplate, initialDocTypeId }) {
  const { level3Label } = useLabels();
  const { toast } = useToast();
  const [hierarchy, setHierarchy] = useState({ department: null, category: null, docType: initialDocTypeId || null });
  const [template, setTemplate] = useState(initialTemplate || null);
  const [versions, setVersions] = useState([]);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(initialVersion?.id || "");
  const [saving, setSaving] = useState(false);

  const docTypeId = hierarchy.docType;

  useEffect(() => {
    if (!docTypeId) return;
    api.listTemplates(docTypeId).then((res) => setTemplate((res.data || [])[0] || null));
    api.getActiveAssignment(docTypeId).then((res) => setActiveAssignment(res.data || null));
  }, [docTypeId]);

  useEffect(() => {
    if (!template) {
      setVersions([]);
      return;
    }
    api.listVersions(template.id).then((res) => setVersions((res.data || []).filter((v) => v.status === "PUBLISHED")));
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

  return (
    <div className="space-y-5 py-4">
      <HierarchyPicker
        department={hierarchy.department}
        category={hierarchy.category}
        docType={hierarchy.docType}
        onChange={setHierarchy}
      />

      {!docTypeId && (
        <EmptyState
          icon={Link2}
          title="Select a document type to manage its assignment"
          description="Choose which published template version new uploads of this document type will be OCR-mapped against."
        />
      )}

      {docTypeId && !template && (
        <EmptyState icon={Layers} title="No template exists for this document type yet" description="Create one from the Templates tab first." />
      )}

      {docTypeId && template && (
        <div className="rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
          <h3 className="mb-1 text-base font-semibold text-[var(--text-primary)]">{template.name}</h3>
          <p className="mb-4 text-sm text-[var(--text-tertiary)]">
            {activeAssignment
              ? `Currently live: Version ${activeAssignment.MetadataTemplateVersion?.versionNumber ?? activeAssignment.metadataTemplateVersionId}`
              : "No version currently assigned — new uploads won't be OCR-mapped until one is assigned."}
          </p>

          {versions.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">Publish a draft version from the Templates tab before it can be assigned.</p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <AppSelect label="Published Version" value={selectedVersionId} onChange={(e) => setSelectedVersionId(e.target.value)}>
                  <option value="">Select version…</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      Version {v.versionNumber} {activeAssignment?.metadataTemplateVersionId === v.id ? "(currently live)" : ""}
                    </option>
                  ))}
                </AppSelect>
              </div>
              <AppButton variant="primary" icon={CheckCircle2} loading={saving} disabled={!selectedVersionId} onClick={handleAssign}>
                Assign
              </AppButton>
            </div>
          )}
        </div>
      )}
    </div>
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
      title="Metadata Templates — Guide"
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

export default function TemplateManager() {
  const [tab, setTab] = useState("templates");
  const [builderCtx, setBuilderCtx] = useState(null); // { version, template }
  const [assignCtx, setAssignCtx] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  if (builderCtx) {
    return (
      <div className="h-[calc(100vh-120px)] rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)]">
        <FormBuilder version={builderCtx.version} template={builderCtx.template} onBack={() => setBuilderCtx(null)} />
      </div>
    );
  }

    return (
    <div className="rounded-app-lg border border-[var(--border-subtle)] bg-slate-50 p-5 dark:bg-slate-900/40">
      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />
            <div className="mb-3">
        <div className="flex items-center gap-1.5">
          <h1 className="text-[17px] font-bold text-[var(--text-primary)]">Metadata Templates</h1>
          <div className="group relative">
            <button
              onClick={() => setShowGuide(true)}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--border-subtle)] text-[var(--text-tertiary)] transition-colors hover:bg-brand-500 hover:text-white"
            >
              <Info className="h-3 w-3" />
            </button>
            <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-56 rounded-lg bg-slate-800 px-3 py-2 text-[10.5px] leading-relaxed text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 dark:bg-slate-700">
              Click to see a step-by-step guide on how to use this page.
            </div>
          </div>
          {assignCtx && (
            <>
              <ChevronRight className="ml-1 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <span className="text-sm text-[var(--text-primary)]">Assign</span>
            </>
          )}
        </div>
        <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
          Tenant → Documents → <span className="font-semibold text-[var(--text-secondary)]">Metadata Templates</span>
          <span className="mx-2 opacity-40">·</span>
          Define, version and assign field templates for each document type
        </p>
      </div>
      <Tabs
        tabs={[
          { value: "templates", label: "Templates", icon: Layers },
          { value: "assign", label: "Assign Template", icon: Link2 },
        ]}
        value={tab}
        onChange={(v) => {
          setTab(v);
          setAssignCtx(null);
        }}
      />
      {tab === "templates" && (
        <TemplatesTab
          onEditVersion={(version, template) => setBuilderCtx({ version, template })}
          onAssignVersion={(version, template, docTypeId) => {
            setAssignCtx({ version, template, docTypeId });
            setTab("assign");
          }}
        />
      )}
      {tab === "assign" && (
        <AssignTab
          key={assignCtx?.docTypeId || "blank"}
          initialVersion={assignCtx?.version}
          initialTemplate={assignCtx?.template}
          initialDocTypeId={assignCtx?.docTypeId}
        />
      )}
    </div>
  );
}
