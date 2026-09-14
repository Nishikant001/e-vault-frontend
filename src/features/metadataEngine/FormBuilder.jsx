// src/features/metadataEngine/FormBuilder.jsx
//
// Drag & Drop Metadata Template Builder (Zoho Creator / WordPress Form
// Builder / JotForm / Google Forms style) — Tenant Admin builds the field
// set for one DRAFT MetadataTemplateVersion here. Every add/edit/delete/
// reorder persists immediately against the real backend (no separate
// "Save" step needed for field data — only the version's own publish
// action, done from the Template Manager, is a separate deliberate step).
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import ComponentPalette from "./components/ComponentPalette";
import FormCanvas from "./components/FormCanvas";
import FieldPropertiesPanel from "./components/FieldPropertiesPanel";
import { defaultFieldForType } from "./fieldTypes";
import * as api from "./api";

let localIdSeq = 0;
const nextLocalId = () => `local-${++localIdSeq}`;

export default function FormBuilder({ version, template, onBack }) {
  const [fields, setFields] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [error, setError] = useState("");
  const saveTimers = useRef({});

  const isDraft = version.status === "DRAFT";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listFields(version.id)
      .then((res) => {
        if (cancelled) return;
        const loaded = (res.data || [])
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((f) => ({ ...f, _localId: `server-${f.id}` }));
        setFields(loaded);
        setSelectedId(loaded[0]?._localId || null);
      })
      .catch((err) => setError(err.message || "Failed to load fields"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [version.id]);

  const selectedField = useMemo(() => fields.find((f) => f._localId === selectedId) || null, [fields, selectedId]);

  const flashSaved = () => {
    setSaveState("saved");
    setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
  };

  // ── Add a new field (from palette drag or click) ──────────────
  const handleAddField = useCallback(
    async (type, atIndex) => {
      if (!isDraft) return;
      const draft = defaultFieldForType(type, fields.length);
      const localId = nextLocalId();
      const optimistic = { ...draft, _localId: localId, id: undefined };
      setFields((prev) => {
        const next = [...prev];
        next.splice(atIndex ?? next.length, 0, optimistic);
        return next;
      });
      setSelectedId(localId);
      setSaveState("saving");
      try {
        const res = await api.createField(version.id, { ...draft, displayOrder: atIndex ?? fields.length });
        setFields((prev) => prev.map((f) => (f._localId === localId ? { ...res.data, _localId: `server-${res.data.id}` } : f)));
        setSelectedId(`server-${res.data.id}`);
        flashSaved();
      } catch (err) {
        setSaveState("error");
        setError(err.message || "Failed to add field");
        setFields((prev) => prev.filter((f) => f._localId !== localId));
      }
    },
    [fields.length, isDraft, version.id]
  );

  // ── Update a field's properties (debounced persist) ───────────
  const handleFieldChange = useCallback(
    (updated) => {
      setFields((prev) => prev.map((f) => (f._localId === updated._localId ? updated : f)));
      if (!isDraft || !updated.id) return;
      clearTimeout(saveTimers.current[updated._localId]);
      saveTimers.current[updated._localId] = setTimeout(async () => {
        setSaveState("saving");
        try {
          await api.updateField(updated.id, {
            label: updated.label,
            internalName: updated.internalName,
            placeholder: updated.placeholder,
            required: updated.required,
            defaultValue: updated.defaultValue,
            displayOrder: updated.displayOrder,
            validation: updated.validation,
            options: updated.options,
            helpText: updated.helpText,
            tooltip: updated.tooltip,
            searchable: updated.searchable,
            sapField: updated.sapField,
            confidenceThreshold: updated.confidenceThreshold,
            readonly: updated.readonly,
            hidden: updated.hidden,
          });
          flashSaved();
        } catch (err) {
          setSaveState("error");
          setError(err.message || "Failed to save field");
        }
      }, 600);
    },
    [isDraft]
  );

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (localId) => {
      const field = fields.find((f) => f._localId === localId);
      setFields((prev) => prev.filter((f) => f._localId !== localId));
      if (selectedId === localId) setSelectedId(null);
      if (!isDraft || !field?.id) return;
      try {
        await api.deleteField(field.id);
      } catch (err) {
        setError(err.message || "Failed to delete field");
      }
    },
    [fields, isDraft, selectedId]
  );

  // ── Duplicate ───────────────────────────────────────────────────
  const handleDuplicate = useCallback(
    async (localId) => {
      const field = fields.find((f) => f._localId === localId);
      if (!field) return;
      const idx = fields.findIndex((f) => f._localId === localId);
      const copy = {
        ...field,
        label: `${field.label} (Copy)`,
        internalName: `${field.internalName}Copy${Date.now() % 1000}`,
        displayOrder: idx + 1,
      };
      delete copy.id;
      const localCopyId = nextLocalId();
      setFields((prev) => {
        const next = [...prev];
        next.splice(idx + 1, 0, { ...copy, _localId: localCopyId });
        return next;
      });
      if (!isDraft) return;
      try {
        const res = await api.createField(version.id, copy);
        setFields((prev) => prev.map((f) => (f._localId === localCopyId ? { ...res.data, _localId: `server-${res.data.id}` } : f)));
      } catch (err) {
        setError(err.message || "Failed to duplicate field");
      }
    },
    [fields, isDraft, version.id]
  );

  // ── Reorder (drag within canvas) ───────────────────────────────
  const handleReorder = useCallback(
    async (fromIdx, toIdx) => {
      setFields((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        return next.map((f, i) => ({ ...f, displayOrder: i }));
      });
      if (!isDraft) return;
      setSaveState("saving");
      try {
        const reordered = [...fields];
        const [moved] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, moved);
        const order = reordered.filter((f) => f.id).map((f, i) => ({ fieldId: f.id, displayOrder: i }));
        if (order.length) await api.reorderFields(version.id, order);
        flashSaved();
      } catch (err) {
        setSaveState("error");
        setError(err.message || "Failed to save field order");
      }
    },
    [fields, isDraft, version.id]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-md p-1.5 text-[#64748b] hover:bg-[#f1f5f9]">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-[14px] font-bold text-[#1e293b]">{template.name}</h2>
            <p className="text-[11.5px] text-[#94a3b8]">
              Version {version.versionNumber} · {version.status}
              {!isDraft && " — read-only (create a new draft to edit fields)"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          {saveState === "saving" && <span className="flex items-center gap-1 text-[#94a3b8]"><Loader2 size={13} className="animate-spin" /> Saving…</span>}
          {saveState === "saved" && <span className="flex items-center gap-1 text-[#22c55e]"><CheckCircle2 size={13} /> Saved</span>}
          {saveState === "error" && <span className="flex items-center gap-1 text-red-500"><AlertCircle size={13} /> {error}</span>}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-[#94a3b8]">
          <Loader2 className="mr-2 animate-spin" size={16} /> Loading form fields…
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-3 overflow-hidden p-3 md:grid-cols-[200px_1fr_280px]">
          <ComponentPalette onAdd={(type) => handleAddField(type)} />
          <FormCanvas
            fields={fields}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDropNew={handleAddField}
            onReorder={handleReorder}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
          <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
            <FieldPropertiesPanel field={selectedField} onChange={handleFieldChange} onDelete={() => selectedField && handleDelete(selectedField._localId)} />
          </div>
        </div>
      )}
    </div>
  );
}
