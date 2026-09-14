// src/features/metadataEngine/components/FieldPropertiesPanel.jsx
//
// Right panel of the Form Builder — WordPress/Zoho-Forms style property
// editor for whichever field is currently selected on the canvas.
import { Plus, Trash2 } from "lucide-react";
import { FIELD_TYPES, OPTION_BASED_FIELD_TYPES, NON_OCR_FIELD_TYPES, fieldMeta, fieldColor, fieldColorSoft } from "../fieldTypes";

const label = "block text-[11px] font-semibold text-[#475569] mb-1";
const input = "w-full rounded-md border border-[#e2e8f0] px-2.5 py-[6px] text-[12.5px] outline-none focus:border-[#0070F2]";
const row = "mb-3";

export default function FieldPropertiesPanel({ field, onChange, onDelete }) {
  if (!field) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-[12.5px] text-[#94a3b8]">
        Select a field on the canvas to edit its properties.
      </div>
    );
  }

  const set = (patch) => onChange({ ...field, ...patch });
  const setValidation = (patch) => onChange({ ...field, validation: { ...(field.validation || {}), ...patch } });

  const isOptionBased = OPTION_BASED_FIELD_TYPES.includes(field.fieldType);
  const isOcrEligible = !NON_OCR_FIELD_TYPES.includes(field.fieldType);
  const isNumericLike = [FIELD_TYPES.NUMBER, FIELD_TYPES.CURRENCY].includes(field.fieldType);
  const meta = fieldMeta(field.fieldType);
  const TypeIcon = meta.icon;
  const color = fieldColor(field.fieldType);

  const updateOption = (idx, patch) => {
    const options = [...(field.options || [])];
    options[idx] = { ...options[idx], ...patch };
    set({ options });
  };
  const addOption = () => {
    const n = (field.options || []).length + 1;
    set({ options: [...(field.options || []), { label: `Option ${n}`, value: `option_${n}` }] });
  };
  const removeOption = (idx) => set({ options: (field.options || []).filter((_, i) => i !== idx) });

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-[#1e293b]">Field Properties</h3>
        <button onClick={onDelete} className="rounded-md p-1.5 text-[#94a3b8] hover:bg-red-50 hover:text-red-500" title="Delete field">
          <Trash2 size={14} />
        </button>
      </div>

      <div
        style={{ backgroundColor: fieldColorSoft(field.fieldType), borderColor: fieldColorSoft(field.fieldType, 0.35) }}
        className="mb-4 flex items-center gap-2 rounded-md border px-2.5 py-1.5"
      >
        <TypeIcon size={14} style={{ color }} />
        <span style={{ color }} className="text-[11px] font-bold uppercase tracking-wide">
          {meta.label}
        </span>
      </div>

      <div className={row}>
        <label className={label}>Label</label>
        <input className={input} value={field.label} onChange={(e) => set({ label: e.target.value })} />
      </div>

      <div className={row}>
        <label className={label}>Internal Name</label>
        <input className={input} value={field.internalName} onChange={(e) => set({ internalName: e.target.value.replace(/\s+/g, "") })} />
      </div>

      <div className={row}>
        <label className={label}>Placeholder</label>
        <input className={input} value={field.placeholder || ""} onChange={(e) => set({ placeholder: e.target.value })} />
      </div>

      <div className={row}>
        <label className={label}>Help Text</label>
        <input className={input} value={field.helpText || ""} onChange={(e) => set({ helpText: e.target.value })} />
      </div>

      <div className={row}>
        <label className={label}>Tooltip</label>
        <input className={input} value={field.tooltip || ""} onChange={(e) => set({ tooltip: e.target.value })} />
      </div>

      {isOptionBased && (
        <div className={row}>
          <label className={label}>Options</label>
          <div className="space-y-1.5">
            {(field.options || []).map((opt, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  className={`${input} flex-1`}
                  value={opt.label}
                  onChange={(e) => updateOption(idx, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  placeholder="Option label"
                />
                <button onClick={() => removeOption(idx)} className="rounded p-1 text-[#94a3b8] hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button onClick={addOption} className="flex items-center gap-1 text-[11.5px] font-semibold text-[#0070F2] hover:underline">
              <Plus size={12} /> Add option
            </button>
          </div>
        </div>
      )}

      <div className={row}>
        <label className={label}>Display Order</label>
        <input type="number" className={input} value={field.displayOrder ?? 0} onChange={(e) => set({ displayOrder: Number(e.target.value) })} />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <Toggle label="Required" checked={!!field.required} onChange={(v) => set({ required: v })} />
        <Toggle label="Read Only" checked={!!field.readonly} onChange={(v) => set({ readonly: v })} />
        <Toggle label="Hidden" checked={!!field.hidden} onChange={(v) => set({ hidden: v })} />
        <Toggle label="Searchable" checked={!!field.searchable} onChange={(v) => set({ searchable: v })} />
      </div>

      <div className="mb-3 border-t border-[#e2e8f0] pt-3">
        <div className={label}>Validation</div>
        <div className="space-y-2">
          <div>
            <label className="text-[11px] text-[#64748b]">Regex</label>
            <input className={input} value={field.validation?.regex || ""} onChange={(e) => setValidation({ regex: e.target.value })} placeholder="^[A-Z0-9-]+$" />
          </div>
          {isNumericLike && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] text-[#64748b]">Min</label>
                <input type="number" className={input} value={field.validation?.min ?? ""} onChange={(e) => setValidation({ min: e.target.value === "" ? undefined : Number(e.target.value) })} />
              </div>
              <div className="flex-1">
                <label className="text-[11px] text-[#64748b]">Max</label>
                <input type="number" className={input} value={field.validation?.max ?? ""} onChange={(e) => setValidation({ max: e.target.value === "" ? undefined : Number(e.target.value) })} />
              </div>
            </div>
          )}
          {field.fieldType === FIELD_TYPES.CURRENCY && (
            <div>
              <label className="text-[11px] text-[#64748b]">Currency Code</label>
              <input className={input} value={field.validation?.currencyCode || ""} onChange={(e) => setValidation({ currencyCode: e.target.value })} placeholder="INR / USD" />
            </div>
          )}
          {field.fieldType === FIELD_TYPES.FORMULA && (
            <div>
              <label className="text-[11px] text-[#64748b]">Formula</label>
              <input className={input} value={field.validation?.formula || ""} onChange={(e) => setValidation({ formula: e.target.value })} placeholder="quantity * unitPrice" />
            </div>
          )}
          <Toggle label="Unique value" checked={!!field.validation?.unique} onChange={(v) => setValidation({ unique: v })} />
        </div>
      </div>

      <div className="mb-3 border-t border-[#e2e8f0] pt-3">
        <div className={label}>SAP Field</div>
        <input className={input} value={field.sapField || ""} onChange={(e) => set({ sapField: e.target.value })} placeholder="e.g. BSEG-WRBTR" />
      </div>

      {isOcrEligible && (
        <div className="border-t border-[#e2e8f0] pt-3">
          <div className={label}>OCR Confidence Threshold</div>
          <input
            type="range" min="0" max="1" step="0.05"
            value={field.confidenceThreshold ?? 0.75}
            onChange={(e) => set({ confidenceThreshold: Number(e.target.value) })}
            className="w-full accent-[#0070F2]"
          />
          <div className="text-right text-[11px] text-[#64748b]">{Math.round((field.confidenceThreshold ?? 0.75) * 100)}%</div>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-1.5 text-[11.5px] text-[#334155]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-3.5 w-3.5 accent-[#0070F2]" />
      {label}
    </label>
  );
}
