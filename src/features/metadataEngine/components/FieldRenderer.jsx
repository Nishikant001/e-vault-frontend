// src/features/metadataEngine/components/FieldRenderer.jsx
//
// Single dynamic control renderer used by BOTH the Form Builder canvas
// (read-only preview of what the field will look like) and the Dynamic
// OCR Review page (live, editable). This is the piece that replaces the
// old hardcoded "Invoice Number / PO Number / ..." inputs — everything
// here is driven purely by the MetadataField's `fieldType`.
import { useRef, useState, useEffect } from "react";
import { Search, Paperclip, PenTool, Barcode, QrCode } from "lucide-react";
import { FIELD_TYPES, fieldColor, fieldColorSoft } from "../fieldTypes";

// Border/focus color is set per-instance via the `--field-accent` CSS
// variable (see `accentStyle` below) rather than a hardcoded hex, so every
// control picks up its field type's identity color on focus instead of one
// blanket blue everywhere.
const baseInputClass =
  "w-full rounded-lg border px-3 py-[7px] text-[13px] outline-none font-[inherit] transition-colors " +
  "border-[#e2e8f0] text-[#1e293b] focus:border-[var(--field-accent)] disabled:bg-[#f8fafc] disabled:text-[#94a3b8]";

/** Lightweight canvas signature pad — mouse + touch, no external deps. */
function SignaturePad({ value, onChange, disabled, color = "#1e293b" }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = value;
  }, [value]);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const start = (e) => {
    if (disabled) return;
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e) => {
    if (!drawing.current || disabled) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange?.(canvasRef.current.toDataURL("image/png"));
  };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onChange?.("");
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={320}
        height={100}
        className="rounded-lg border border-[#e2e8f0] bg-white touch-none"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      {!disabled && (
        <button
          type="button"
          onClick={clear}
          className="mt-1 text-[11px] text-[#64748b] transition-colors"
          onMouseEnter={(e) => (e.currentTarget.style.color = color)}
          onMouseLeave={(e) => (e.currentTarget.style.color = "")}
        >
          Clear signature
        </button>
      )}
    </div>
  );
}

/** BARCODE/QR — lightweight visual placeholder (no external codec library
 * bundled in this project). Renders the encoded value legibly with a
 * recognizable icon rather than a fake/misleading barcode graphic. */
function CodePreview({ kind, value, color }) {
  const Icon = kind === "QR" ? QrCode : Barcode;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-2">
      <Icon size={18} className="shrink-0" style={{ color }} />
      <span className="truncate text-[13px] text-[#334155]">{value || "No value scanned"}</span>
    </div>
  );
}

export default function FieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled = false,
  preview = false, // true inside the Form Builder canvas: never editable, ignores `value`
}) {
  const color = fieldColor(field.fieldType);
  const softColor = fieldColorSoft(field.fieldType);

  const commonProps = {
    id: `field-${field.internalName}`,
    disabled: disabled || preview,
    placeholder: field.placeholder || "",
    style: { "--field-accent": color },
  };

  const set = (v) => !preview && onChange?.(v);

  const errorClass = error ? "border-[#ef4444] focus:border-[#ef4444]" : "";

  let control;
  switch (field.fieldType) {
    case FIELD_TYPES.TEXTAREA:
      control = (
        <textarea
          {...commonProps}
          rows={3}
          className={`${baseInputClass} ${errorClass} resize-y`}
          value={value ?? ""}
          onChange={(e) => set(e.target.value)}
        />
      );
      break;

    case FIELD_TYPES.NUMBER:
      control = (
        <input
          {...commonProps}
          type="number"
          className={`${baseInputClass} ${errorClass}`}
          value={value ?? ""}
          onChange={(e) => set(e.target.value)}
        />
      );
      break;

    case FIELD_TYPES.CURRENCY:
      control = (
        <div
          style={{ "--field-accent": color, backgroundColor: softColor }}
          className={`flex items-center rounded-lg border bg-white ${error ? "border-[#ef4444]" : "border-[#e2e8f0]"} focus-within:border-[var(--field-accent)]`}
        >
          <span className="pl-3 pr-1 text-[13px] font-semibold" style={{ color }}>{field.validation?.currencyCode || "₹"}</span>
          <input
            {...commonProps}
            type="number"
            step="0.01"
            className="w-full border-0 bg-transparent px-1 py-[7px] text-[13px] text-[#1e293b] outline-none disabled:text-[#94a3b8]"
            value={value ?? ""}
            onChange={(e) => set(e.target.value)}
          />
        </div>
      );
      break;

    case FIELD_TYPES.DATE:
      control = (
        <input
          {...commonProps}
          type="date"
          className={`${baseInputClass} ${errorClass}`}
          value={value ?? ""}
          onChange={(e) => set(e.target.value)}
        />
      );
      break;

    case FIELD_TYPES.TIME:
      control = (
        <input
          {...commonProps}
          type="time"
          className={`${baseInputClass} ${errorClass}`}
          value={value ?? ""}
          onChange={(e) => set(e.target.value)}
        />
      );
      break;

    case FIELD_TYPES.CHECKBOX:
      control = (
        <label className="flex items-center gap-2 text-[13px] text-[#334155]">
          <input
            type="checkbox"
            disabled={disabled || preview}
            checked={!!value}
            onChange={(e) => set(e.target.checked)}
            style={{ accentColor: color }}
            className="h-4 w-4 rounded border-[#cbd5e1]"
          />
          {field.placeholder || "Yes"}
        </label>
      );
      break;

    case FIELD_TYPES.RADIO:
      control = (
        <div className="flex flex-wrap gap-3">
          {(field.options || []).map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 text-[13px] text-[#334155]">
              <input
                type="radio"
                name={`field-${field.internalName}`}
                disabled={disabled || preview}
                checked={value === opt.value}
                onChange={() => set(opt.value)}
                style={{ accentColor: color }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      );
      break;

    case FIELD_TYPES.DROPDOWN:
      control = (
        <select
          {...commonProps}
          className={`${baseInputClass} ${errorClass}`}
          value={value ?? ""}
          onChange={(e) => set(e.target.value)}
        >
          <option value="">Select…</option>
          {(field.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
      break;

    case FIELD_TYPES.MULTI_SELECT: {
      const selected = Array.isArray(value) ? value : value ? [value] : [];
      control = (
        <div className="flex flex-wrap gap-2">
          {(field.options || []).map((opt) => {
            const active = selected.includes(opt.value);
            return (
              <button
                type="button"
                key={opt.value}
                disabled={disabled || preview}
                onClick={() =>
                  set(active ? selected.filter((v) => v !== opt.value) : [...selected, opt.value])
                }
                style={
                  active
                    ? { borderColor: color, backgroundColor: softColor, color }
                    : { "--field-accent": color }
                }
                className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
                  active
                    ? ""
                    : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[var(--field-accent)]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      );
      break;
    }

    case FIELD_TYPES.EMAIL:
      control = (
        <input {...commonProps} type="email" className={`${baseInputClass} ${errorClass}`} value={value ?? ""} onChange={(e) => set(e.target.value)} />
      );
      break;

    case FIELD_TYPES.PHONE:
      control = (
        <input {...commonProps} type="tel" className={`${baseInputClass} ${errorClass}`} value={value ?? ""} onChange={(e) => set(e.target.value)} />
      );
      break;

    case FIELD_TYPES.URL:
      control = (
        <input {...commonProps} type="url" className={`${baseInputClass} ${errorClass}`} value={value ?? ""} onChange={(e) => set(e.target.value)} />
      );
      break;

    case FIELD_TYPES.PASSWORD:
      control = (
        <input {...commonProps} type="password" className={`${baseInputClass} ${errorClass}`} value={value ?? ""} onChange={(e) => set(e.target.value)} />
      );
      break;

    case FIELD_TYPES.SIGNATURE:
      control = <SignaturePad value={value} onChange={set} disabled={disabled || preview} color={color} />;
      break;

    case FIELD_TYPES.BARCODE:
      control = preview || disabled
        ? <CodePreview kind="BARCODE" value={value} color={color} />
        : <input {...commonProps} type="text" className={`${baseInputClass} ${errorClass}`} value={value ?? ""} onChange={(e) => set(e.target.value)} placeholder="Scan or enter barcode value" />;
      break;

    case FIELD_TYPES.QR:
      control = preview || disabled
        ? <CodePreview kind="QR" value={value} color={color} />
        : <input {...commonProps} type="text" className={`${baseInputClass} ${errorClass}`} value={value ?? ""} onChange={(e) => set(e.target.value)} placeholder="Scan or enter QR value" />;
      break;

    case FIELD_TYPES.FILE:
      control = (
        <label
          style={{ "--field-accent": color }}
          className={`flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-[13px] ${preview || disabled ? "cursor-not-allowed text-[#94a3b8] border-[#e2e8f0]" : "cursor-pointer text-[#64748b] border-[#cbd5e1] hover:border-[var(--field-accent)]"}`}
        >
          <Paperclip size={15} style={{ color: preview || disabled ? undefined : color }} />
          {value?.name || value || "Choose file…"}
          <input
            type="file"
            className="hidden"
            disabled={preview || disabled}
            onChange={(e) => set(e.target.files?.[0] || null)}
          />
        </label>
      );
      break;

    case FIELD_TYPES.IMAGE:
      control = (
        <label
          style={{ "--field-accent": color }}
          className={`flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-[13px] ${preview || disabled ? "cursor-not-allowed text-[#94a3b8] border-[#e2e8f0]" : "cursor-pointer text-[#64748b] border-[#cbd5e1] hover:border-[var(--field-accent)]"}`}
        >
          <Paperclip size={15} style={{ color: preview || disabled ? undefined : color }} />
          {value?.name || value || "Choose image…"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={preview || disabled}
            onChange={(e) => set(e.target.files?.[0] || null)}
          />
        </label>
      );
      break;

    case FIELD_TYPES.HIDDEN:
      control = (
        <div style={{ backgroundColor: softColor }} className="rounded-lg border border-dashed border-[#e2e8f0] px-3 py-2 text-[12px] italic" >
          <span style={{ color }}>Hidden field</span> <span className="text-[#94a3b8]">— not shown to end users</span>
        </div>
      );
      break;

    case FIELD_TYPES.FORMULA:
      control = (
        <input {...commonProps} disabled type="text" style={{ ...commonProps.style, backgroundColor: softColor }} className={`${baseInputClass} italic`} value={value ?? ""} placeholder={field.validation?.formula ? `= ${field.validation.formula}` : "Derived value"} />
      );
      break;

    case FIELD_TYPES.AUTO_NUMBER:
      control = (
        <input {...commonProps} disabled type="text" style={{ ...commonProps.style, backgroundColor: softColor }} className={baseInputClass} value={value ?? "(assigned automatically)"} />
      );
      break;

    case FIELD_TYPES.LOOKUP:
      control = (
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color }} />
          <input {...commonProps} type="text" className={`${baseInputClass} ${errorClass} pl-8`} value={value ?? ""} onChange={(e) => set(e.target.value)} placeholder={field.placeholder || "Search…"} />
        </div>
      );
      break;

    case FIELD_TYPES.TEXT:
    default:
      control = (
        <input {...commonProps} type="text" className={`${baseInputClass} ${errorClass}`} value={value ?? ""} onChange={(e) => set(e.target.value)} />
      );
  }

  return control;
}
