// src/features/metadataEngine/fieldTypes.js
//
// Single source of truth for every Form Builder component type. Mirrors
// backend/src/constants/metadataFieldTypes.js's FIELD_TYPES exactly (kept
// in sync manually, same convention already used by
// context/defaultHierarchy.js for the tenant hierarchy constants).
//
// `category` groups the palette in the Form Builder's left panel.
// `supportsOptions` marks types that need the {label,value}[] options
// editor. `ocrEligible` marks types a document OCR pass can ever populate
// (system-managed types like AUTO_NUMBER/FORMULA/HIDDEN/SIGNATURE/FILE/
// IMAGE cannot be OCR-mapped, matching NON_OCR_FIELD_TYPES on the backend).
import {
  Type, AlignLeft, Hash, DollarSign, Calendar, Clock, CheckSquare,
  CircleDot, ChevronDown, ListChecks, Mail, Phone, Link2, KeyRound,
  PenTool, Barcode, QrCode, ListOrdered, Sigma, EyeOff, Search,
  Paperclip, Image as ImageIcon,
} from "lucide-react";

export const FIELD_TYPES = {
  TEXT: "TEXT",
  TEXTAREA: "TEXTAREA",
  NUMBER: "NUMBER",
  CURRENCY: "CURRENCY",
  DATE: "DATE",
  TIME: "TIME",
  CHECKBOX: "CHECKBOX",
  RADIO: "RADIO",
  DROPDOWN: "DROPDOWN",
  MULTI_SELECT: "MULTI_SELECT",
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  URL: "URL",
  PASSWORD: "PASSWORD",
  SIGNATURE: "SIGNATURE",
  BARCODE: "BARCODE",
  QR: "QR",
  AUTO_NUMBER: "AUTO_NUMBER",
  FORMULA: "FORMULA",
  HIDDEN: "HIDDEN",
  LOOKUP: "LOOKUP",
  FILE: "FILE",
  IMAGE: "IMAGE",
};

export const OPTION_BASED_FIELD_TYPES = [FIELD_TYPES.RADIO, FIELD_TYPES.DROPDOWN, FIELD_TYPES.MULTI_SELECT];

export const NON_OCR_FIELD_TYPES = [
  FIELD_TYPES.AUTO_NUMBER, FIELD_TYPES.FORMULA, FIELD_TYPES.HIDDEN,
  FIELD_TYPES.SIGNATURE, FIELD_TYPES.FILE, FIELD_TYPES.IMAGE,
];

// Palette definition — order here is the order fields appear in the Form
// Builder's left panel, grouped by `category`.
//
// `color` is this field type's identity color — a muted, professional
// tone (not saturated/toy-like) used consistently everywhere the type
// appears: the palette tile, the canvas type badge + selected border,
// and accents inside the live FieldRenderer control (e.g. the currency
// symbol). Chosen so every type in a category is visually distinct
// from its category-mates, letting a glance at just the color identify
// the field type — see fieldColor()/fieldColorSoft() below.
export const FIELD_PALETTE = [
  { type: FIELD_TYPES.TEXT, label: "Textbox", icon: Type, category: "Basic", color: "#475569" },
  { type: FIELD_TYPES.TEXTAREA, label: "Textarea", icon: AlignLeft, category: "Basic", color: "#0EA5A4" },
  { type: FIELD_TYPES.NUMBER, label: "Number", icon: Hash, category: "Basic", color: "#2563EB" },
  { type: FIELD_TYPES.CURRENCY, label: "Currency", icon: DollarSign, category: "Basic", color: "#15803D" },
  { type: FIELD_TYPES.DATE, label: "Date", icon: Calendar, category: "Basic", color: "#7C3AED" },
  { type: FIELD_TYPES.TIME, label: "Time", icon: Clock, category: "Basic", color: "#9333EA" },
  { type: FIELD_TYPES.CHECKBOX, label: "Checkbox", icon: CheckSquare, category: "Choice", color: "#C2410C" },
  { type: FIELD_TYPES.RADIO, label: "Radio", icon: CircleDot, category: "Choice", color: "#B45309" },
  { type: FIELD_TYPES.DROPDOWN, label: "Dropdown", icon: ChevronDown, category: "Choice", color: "#A16207" },
  { type: FIELD_TYPES.MULTI_SELECT, label: "Multi Select", icon: ListChecks, category: "Choice", color: "#CA8A04" },
  { type: FIELD_TYPES.EMAIL, label: "Email", icon: Mail, category: "Contact", color: "#0369A1" },
  { type: FIELD_TYPES.PHONE, label: "Phone", icon: Phone, category: "Contact", color: "#0891B2" },
  { type: FIELD_TYPES.URL, label: "URL", icon: Link2, category: "Contact", color: "#1D4ED8" },
  { type: FIELD_TYPES.PASSWORD, label: "Password", icon: KeyRound, category: "Contact", color: "#4338CA" },
  { type: FIELD_TYPES.BARCODE, label: "Barcode", icon: Barcode, category: "Advanced", color: "#334155" },
  { type: FIELD_TYPES.QR, label: "QR", icon: QrCode, category: "Advanced", color: "#1E293B" },
  { type: FIELD_TYPES.SIGNATURE, label: "Signature", icon: PenTool, category: "Advanced", color: "#BE185D" },
  { type: FIELD_TYPES.IMAGE, label: "Image", icon: ImageIcon, category: "Advanced", color: "#0D9488" },
  { type: FIELD_TYPES.FILE, label: "File", icon: Paperclip, category: "Advanced", color: "#57534E" },
  { type: FIELD_TYPES.HIDDEN, label: "Hidden", icon: EyeOff, category: "Advanced", color: "#64748B" },
  { type: FIELD_TYPES.FORMULA, label: "Formula", icon: Sigma, category: "Advanced", color: "#6D28D9" },
  { type: FIELD_TYPES.LOOKUP, label: "Lookup", icon: Search, category: "Advanced", color: "#0F766E" },
  { type: FIELD_TYPES.AUTO_NUMBER, label: "Auto Number", icon: ListOrdered, category: "Advanced", color: "#B91C1C" },
];

export const FIELD_PALETTE_CATEGORIES = ["Basic", "Choice", "Contact", "Advanced"];

export function fieldMeta(type) {
  return FIELD_PALETTE.find((f) => f.type === type) || FIELD_PALETTE[0];
}

// This type's identity color (hex). Used via inline `style`, not Tailwind
// classes — the value is dynamic per field type so it can't be a static
// class the Tailwind JIT scanner would pick up at build time.
export function fieldColor(type) {
  return fieldMeta(type).color;
}

// Low-alpha tint of the same identity color, for badge/tile backgrounds
// and selected-state fills — keeps the palette muted/professional rather
// than painting large areas in a saturated color.
export function fieldColorSoft(type, alpha = 0.12) {
  const hex = fieldColor(type).replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Sensible defaults for a brand-new field of a given type, dropped onto
// the canvas. `n` is the running count of fields already on the canvas —
// used only to make the default label/internalName unique.
export function defaultFieldForType(type, n = 0) {
  const meta = fieldMeta(type);
  const suffix = n > 0 ? ` ${n + 1}` : "";
  return {
    label: `${meta.label}${suffix}`,
    internalName: `${meta.label.replace(/[^a-zA-Z0-9]/g, "")}${n > 0 ? n + 1 : ""}`
      .replace(/^./, (c) => c.toLowerCase()),
    placeholder: "",
    fieldType: type,
    required: false,
    defaultValue: "",
    displayOrder: n,
    validation: {},
    options: OPTION_BASED_FIELD_TYPES.includes(type)
      ? [{ label: "Option 1", value: "option_1" }, { label: "Option 2", value: "option_2" }]
      : null,
    helpText: "",
    tooltip: "",
    searchable: false,
    sapField: "",
    confidenceThreshold: 0.75,
    readonly: type === FIELD_TYPES.FORMULA || type === FIELD_TYPES.AUTO_NUMBER,
    hidden: type === FIELD_TYPES.HIDDEN,
  };
}

export function confidenceColor(level) {
  if (level === "High") return "#22c55e";
  if (level === "Mid") return "#E76500";
  return "#ef4444";
}

// Backend stores confidence as a 0..1 score in confidenceJson[key].score, or
// a precomputed label in .confidence. Normalize either shape to a label.
export function confidenceLabel(entry) {
  if (!entry) return "Low";
  if (entry.confidence) return entry.confidence;
  const score = typeof entry.score === "number" ? entry.score : 0;
  if (score >= 0.95) return "High";
  if (score >= 0.7) return "Mid";
  return "Low";
}
