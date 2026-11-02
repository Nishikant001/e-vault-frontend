// src/features/metadataEngine/components/ComponentPalette.jsx
//
// Left panel of the Form Builder — the draggable list of available field
// components (Zoho Creator / WordPress Form Builder style). Drag onto the
// canvas, or click to append to the end.
import { FIELD_PALETTE, FIELD_PALETTE_CATEGORIES, fieldColorSoft } from "../fieldTypes";

export default function ComponentPalette({ onAdd }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto border-r border-[#e2e8f0] bg-[#f8fafc] p-3">
      <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-[#64748b]">
        Available Components
      </h3>
      {FIELD_PALETTE_CATEGORIES.map((category) => (
        <div key={category} className="mb-3">
          <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
            {category}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {FIELD_PALETTE.filter((f) => f.category === category).map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.type}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/field-type", f.type)}
                  onClick={() => onAdd(f.type)}
                  title={`Add ${f.label}`}
                  style={{ "--field-color": f.color, "--field-color-soft": fieldColorSoft(f.type) }}
                  className="group flex cursor-grab flex-col items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-2 py-2.5 text-center text-[11px] text-[#475569] shadow-sm transition-all hover:border-[var(--field-color)] hover:bg-[var(--field-color-soft)] hover:shadow active:cursor-grabbing"
                >
                  <Icon size={16} style={{ color: f.color }} />
                  <span className="leading-tight transition-colors group-hover:text-[var(--field-color)]">{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
