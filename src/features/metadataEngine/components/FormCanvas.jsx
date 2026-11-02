// src/features/metadataEngine/components/FormCanvas.jsx
//
// Center drag-drop canvas of the Form Builder. Renders each field as a
// selectable/reorderable card with a live FieldRenderer preview inside —
// dropping a palette component here (or reordering an existing card)
// updates `fields`, whose displayOrder is kept in sync with array order.
import { GripVertical, Trash2, Copy, Lock, EyeOff, Search as SearchIcon, AlertTriangle } from "lucide-react";
import { useState } from "react";
import FieldRenderer from "./FieldRenderer";
import { OPTION_BASED_FIELD_TYPES, fieldColor, fieldColorSoft } from "../fieldTypes";

export default function FormCanvas({ fields, selectedId, onSelect, onDropNew, onReorder, onDuplicate, onDelete }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const handleDragOverCanvas = (e) => {
    e.preventDefault();
  };

  const handleDropCanvas = (e) => {
    e.preventDefault();
    const newType = e.dataTransfer.getData("text/field-type");
    if (newType) {
      onDropNew(newType, fields.length);
      return;
    }
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      onReorder(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  if (fields.length === 0) {
    return (
      <div
        onDragOver={handleDragOverCanvas}
        onDrop={handleDropCanvas}
        className="flex h-full min-h-[400px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#cbd5e1] bg-white text-center"
      >
        <p className="text-[13px] font-semibold text-[#64748b]">Drag components here</p>
        <p className="text-[12px] text-[#94a3b8]">or click a component on the left to add it</p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOverCanvas}
      onDrop={handleDropCanvas}
      className="flex h-full flex-col gap-2.5 overflow-y-auto rounded-xl bg-white p-3"
    >
      {fields.map((field, idx) => {
        const active = selectedId === field._localId;
        const invalid =
          OPTION_BASED_FIELD_TYPES.includes(field.fieldType) && !(field.options || []).length;
        const color = fieldColor(field.fieldType);
        return (
          <div
            key={field._localId}
            draggable
            onDragStart={() => setDragIndex(idx)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(idx);
            }}
            onDrop={(e) => {
              e.stopPropagation();
              handleDropCanvas(e);
            }}
            onClick={() => onSelect(field._localId)}
            style={{ borderLeftColor: color, borderLeftWidth: 3 }}
            className={`group relative flex cursor-pointer gap-2 rounded-lg border-2 p-3 transition-all ${
              active ? "border-[#0070F2] bg-[#F5F9FF] shadow-sm" : "border-[#e2e8f0] hover:border-[#93c5fd]"
            } ${overIndex === idx && dragIndex !== null && dragIndex !== idx ? "border-dashed border-[#0070F2]" : ""}`}
          >
            <span className="mt-1 cursor-grab text-[#cbd5e1] group-hover:text-[#94a3b8]">
              <GripVertical size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="truncate text-[12.5px] font-semibold text-[#1e293b]">{field.label}</span>
                {field.required && <span className="text-[11px] text-red-500">*</span>}
                {field.readonly && <Lock size={11} className="text-[#94a3b8]" />}
                {field.hidden && <EyeOff size={11} className="text-[#94a3b8]" />}
                {field.searchable && <SearchIcon size={11} className="text-[#0070F2]" />}
                {invalid && <AlertTriangle size={11} className="text-amber-500" title="Needs at least one option" />}
                <span
                  style={{ backgroundColor: fieldColorSoft(field.fieldType), color }}
                  className="ml-auto rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
                >
                  {field.fieldType}
                </span>
              </div>
              <div className="pointer-events-none opacity-90">
                <FieldRenderer field={field} preview />
              </div>
              {field.helpText && <p className="mt-1 text-[11px] text-[#94a3b8]">{field.helpText}</p>}
            </div>
            <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(field._localId);
                }}
                className="rounded p-1 text-[#94a3b8] hover:bg-white hover:text-[#0070F2]"
                title="Duplicate"
              >
                <Copy size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(field._localId);
                }}
                className="rounded p-1 text-[#94a3b8] hover:bg-white hover:text-red-500"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
