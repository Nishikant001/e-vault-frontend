import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ChevronRight,
  Plus,
  X,
  FileText,
  Building2,
  Loader2,
  AlertCircle,
  Search,
  FolderTree,
  Check,
  Pencil,
  Trash2,
  Inbox,
  Layers,
  Folder,
  FolderOpen,
  Boxes,
  Info,
  MoreVertical,
} from "lucide-react";
import { useLabels } from "../../context/MetadataContext";

import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;

function getToken() {
  return localStorage.getItem("accessToken") || "";
}
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}
function decodeToken() {
  try {
    const t = getToken();
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1]));
  } catch {
    return null;
  }
}

// ── Node type config ──────────────────────────────────────────
const NODE_TYPE = {
  DEPARTMENT: "DEPARTMENT",
  CATEGORY: "CATEGORY",
  DOCUMENT_TYPE: "DOCUMENT_TYPE",
};

// NOTE: labels are intentionally NOT part of this object anymore — they
// used to be static ("Department"/"Category"/"Document Type"). Display
// text now comes from useLabels() (see context/MetadataContext.jsx) at
// each call site, since TYPE_META/typeLabelFor are plain module-level
// values/functions and can't call a hook themselves. Styling (colors)
// stays fixed per level regardless of tenant wording.
const TYPE_META = {
  // Department — deep indigo (root-level, authoritative, calm)
  [NODE_TYPE.DEPARTMENT]: {
    solid: "bg-indigo-600 dark:bg-indigo-500",
    tint: "bg-indigo-50/80 dark:bg-indigo-500/10",
    tintHover: "hover:bg-indigo-50 dark:hover:bg-indigo-500/15",
    text: "text-indigo-700 dark:text-indigo-300",
    icon: "text-indigo-600 dark:text-indigo-400",
    chip: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/25",
    border: "border-indigo-200 dark:border-indigo-500/30",
    bar: "bg-indigo-600 dark:bg-indigo-400",
  },
  // Category — warm amber-gold (mid-level, matches your Command Console accent)
  [NODE_TYPE.CATEGORY]: {
    solid: "bg-amber-600 dark:bg-amber-500",
    tint: "bg-amber-50/80 dark:bg-amber-500/10",
    tintHover: "hover:bg-amber-50 dark:hover:bg-amber-500/15",
    text: "text-amber-800 dark:text-amber-400",
    icon: "text-amber-700 dark:text-amber-500",
    chip: "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/25",
    border: "border-amber-200 dark:border-amber-500/30",
    bar: "bg-amber-600 dark:bg-amber-500",
  },
  // Document Type — teal-cyan (leaf-level, crisp and readable)
  [NODE_TYPE.DOCUMENT_TYPE]: {
    solid: "bg-cyan-700 dark:bg-cyan-500",
    tint: "bg-cyan-50/80 dark:bg-cyan-500/10",
    tintHover: "hover:bg-cyan-50 dark:hover:bg-cyan-500/15",
    text: "text-cyan-800 dark:text-cyan-400",
    icon: "text-cyan-700 dark:text-cyan-500",
    chip: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/25",
    border: "border-cyan-200 dark:border-cyan-500/30",
    bar: "bg-cyan-700 dark:bg-cyan-500",
  },
};

/** Maps a NODE_TYPE to its current tenant-facing label. `labels` is the
 * object returned by useLabels() — pass it in from whichever component
 * called the hook, since this helper itself is not a component/hook. */
function typeLabelFor(labels, type) {
  return (
    {
      [NODE_TYPE.DEPARTMENT]: labels.level1Label,
      [NODE_TYPE.CATEGORY]: labels.level2Label,
      [NODE_TYPE.DOCUMENT_TYPE]: labels.level3Label,
    }[type] || ""
  );
}

// A real folder glyph in a colored tile — reads as "this holds documents",
// not a generic file tab. Opens visually (FolderOpen) when expanded, and
// document-types (leaf nodes with no children of their own) always render
// as a closed folder since they can't be expanded further here.
function FolderIcon({ type, expanded, size = "md" }) {
  const meta = TYPE_META[type];
  const canOpen = type !== NODE_TYPE.DOCUMENT_TYPE;
  const Icon = canOpen && expanded ? FolderOpen : Folder;

  const dims = {
    sm: { tile: "w-6 h-6 rounded-md", icon: "w-3.5 h-3.5" },
    md: { tile: "w-8 h-8 rounded-lg", icon: "w-[18px] h-[18px]" },
    lg: { tile: "w-11 h-11 rounded-xl", icon: "w-6 h-6" },
  }[size];

  return (
    <span
      className={`flex-shrink-0 flex items-center justify-center ${dims.tile} ${meta.tint}`}
    >
      <Icon
        className={`${dims.icon} ${meta.icon}`}
        strokeWidth={2.25}
        fill="none"
      />
    </span>
  );
}

function TypeChip({ type }) {
  const labels = useLabels();
  const meta = TYPE_META[type];
  return (
    <span
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${meta.chip}`}
    >
      {typeLabelFor(labels, type)}
    </span>
  );
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-[60] max-w-sm animate-[toast-in_.25s_ease-out]">
      <div className="flex items-start gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl shadow-2xl px-4 py-3">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400 dark:text-red-500" />
        <p className="text-[12.5px] leading-snug">{message}</p>
        <button
          onClick={onClose}
          className="ml-auto flex-shrink-0 opacity-60 hover:opacity-100 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <style>{`@keyframes toast-in { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }`}</style>
    </div>
  );
}

// ── Inline Input (add) ────────────────────────────────────────
function InlineInput({
  depth,
  inputRef,
  value,
  onChange,
  onConfirm,
  onCancel,
  placeholder,
  saving,
}) {
  return (
    <div
      className="flex items-center gap-2 py-1.5 pr-3 mx-2 my-0.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-dashed border-blue-200 dark:border-blue-800"
      style={{ paddingLeft: `${14 + depth * 22}px` }}
    >
      <span className="w-4 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={saving}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onConfirm();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        placeholder={placeholder || "Name..."}
        className="flex-1 text-[12.5px] rounded-md border border-blue-300 dark:border-blue-700 focus:border-blue-500 outline-none bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 px-2 py-1"
      />
      <button
        onClick={onConfirm}
        disabled={saving || !value.trim()}
        className="p-1 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white flex-shrink-0 transition"
        title="Confirm"
      >
        <Check className="w-3 h-3" />
      </button>
      <button
        onClick={onCancel}
        className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0 transition"
        title="Cancel"
      >
        <X className="w-3 h-3 text-slate-400" />
      </button>
    </div>
  );
}

// ── Inline Rename ─────────────────────────────────────────────
function InlineRename({
  depth,
  renameRef,
  value,
  onChange,
  onConfirm,
  onCancel,
  saving,
}) {
  return (
    <div
      className="flex items-center gap-2 py-1.5 pr-3 mx-2 my-0.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/10 border border-dashed border-amber-200 dark:border-amber-800"
      style={{ paddingLeft: `${14 + depth * 22}px` }}
    >
      <span className="w-4 flex-shrink-0" />
      <input
        ref={renameRef}
        type="text"
        value={value}
        disabled={saving}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onConfirm();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        className="flex-1 text-[12.5px] rounded-md border border-amber-300 dark:border-amber-700 focus:border-amber-500 outline-none bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 px-2 py-1 font-medium"
      />
      <button
        onClick={onConfirm}
        disabled={saving || !value.trim()}
        className="p-1 rounded-md bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white flex-shrink-0 transition"
        title="Save"
      >
        <Check className="w-3 h-3" />
      </button>
      <button
        onClick={onCancel}
        className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0 transition"
        title="Cancel"
      >
        <X className="w-3 h-3 text-slate-400" />
      </button>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────
function DeleteModal({ name, type, onConfirm, onCancel }) {
  const labels = useLabels();
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 text-center mb-1">
          Delete {typeLabelFor(labels, type)}?
        </h3>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 text-center mb-5">
          <span className="font-bold text-slate-700 dark:text-slate-200">
            "{name}"
          </span>{" "}
          and everything inside it will be permanently removed. This can't be
          undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-[9px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-[9px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold transition"
          >
            Yes, delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Guide / Info Modal ──────────────────────────────────────────
function GuideModal({ onClose }) {
  const labels = useLabels();
  const steps = [
    { title: "Select Company Code & Plant", desc: `Choose a Company Code, then a Plant. ${labels.level1Label}s, ${labels.level2Label.toLowerCase()}s and ${labels.level3Label.toLowerCase()}s are scoped to a plant.` },
    { title: `Add a ${labels.level1Label}`, desc: `Click the + ${labels.level1Label} button to add one under the selected plant. You'll need a name and a short code.` },
    { title: `Add ${labels.level2Label}s / ${labels.level3Label}s`, desc: "Hover any row and use the + icon to add a category or document type under it." },
    { title: "Rename or Delete", desc: "Hover a category or document type row to reveal the pencil (rename) and X (delete) icons. Departments can't be renamed or deleted here." },
    { title: "Search", desc: "Use the search box to filter categories and document types — matching branches auto-expand." },
  ];
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 dark:bg-slate-700 flex items-center justify-center">
              <Info className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Folder Structure — Guide</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <div className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{s.title}</div>
                <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="w-full py-[9px] rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-[12px] font-bold transition">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tree Node ─────────────────────────────────────────────────
function TreeNode({ node, depth, ctx }) {
  const {
    selectedId,
    expandedIds,
    addingTo,
    renamingId,
    renameValue,
    newName,
    onSelect,
    onToggle,
    onStartAdd,
    onChangeName,
    onConfirmAdd,
    onCancelAdd,
    onStartRename,
    onRenameChange,
    onConfirmRename,
    onCancelRename,
    onDeleteRequest,
    inputRef,
    renameRef,
    savingId,
    deletingId,
       matchIds,
    canManage,
    openMenuId,
    onToggleMenu,
    onCloseMenu,
  } = ctx;

  const isSelected = selectedId === node.id;
  const isMenuOpen = openMenuId === node.id;
  const isExpanded = expandedIds.has(node.id);
  const isRenaming = renamingId === node.id;
  const isAddingHere = addingTo === node.id;
  const isSaving = savingId === node.id;
  const isDeleting = deletingId === node.id;
  const isDimmed = matchIds && !matchIds.has(node.id);

  const isDept = node.type === NODE_TYPE.DEPARTMENT;
  const canAddChild = isDept || node.type === NODE_TYPE.CATEGORY;
  const hasChildren = node.children?.length > 0 || isAddingHere;
  const meta = TYPE_META[node.type];
  const childCount = node.children?.length || 0;

  if (isRenaming) {
    return (
      <div>
        <InlineRename
          depth={depth}
          renameRef={renameRef}
          value={renameValue}
          onChange={onRenameChange}
          onConfirm={onConfirmRename}
          onCancel={onCancelRename}
          saving={isSaving}
        />
        {isExpanded &&
          node.children?.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} ctx={ctx} />
          ))}
      </div>
    );
  }

  return (
    <div className={isDimmed ? "opacity-35" : ""}>
      <div
        className={`relative flex items-center gap-2.5 py-[7px] pr-2.5 mx-2 my-[1px] rounded-lg cursor-pointer group transition-colors
          ${isSelected ? `${meta.tint} ring-1 ring-inset ${meta.border}` : "hover:bg-slate-50 dark:hover:bg-slate-700/30"}`}
                  style={{ paddingLeft: `${10 + depth * 22}px` }}
        onClick={() => {
          onSelect(node);
          if (hasChildren) onToggle(node.id);
        }}
      >
        {isSelected && (
          <span
            className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full ${meta.bar}`}
          />
        )}

        {hasChildren ? (
          <ChevronRight
            className={`w-3.5 h-3.5 flex-shrink-0 transition-transform text-slate-400 ${isExpanded ? "rotate-90" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
          />
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}

        <FolderIcon type={node.type} expanded={isExpanded} size="md" />

        <span
          className={`text-[13px] flex-1 select-none truncate ${
            isSelected
              ? `${meta.text} font-bold`
              : isDept
                ? "text-slate-700 dark:text-slate-200 font-semibold"
                : "text-slate-600 dark:text-slate-300"
          }`}
        >
          {node.name}
          {node.code && (
            <span className="ml-1.5 text-[10px] text-slate-400 font-mono">
              {node.code}
            </span>
          )}
        </span>

        {!isSaving && !isDeleting && childCount > 0 && (
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-700/60 rounded-full px-[7px] py-[1px] flex-shrink-0">
            {childCount}
          </span>
        )}

        {(isSaving || isDeleting) && (
          <Loader2 className="w-3 h-3 animate-spin text-slate-400 flex-shrink-0" />
        )}

                {!isSaving && !isDeleting && canManage && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {canAddChild && (
              <button
                title={isDept ? "Add category" : "Add document type"}
                className="p-1 rounded hover:bg-white dark:hover:bg-slate-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(node.id, true);
                  onStartAdd(node);
                }}
              >
                <Plus className="w-3 h-3 text-slate-500" />
              </button>
            )}

            {!isDept && (
              <div className="relative">
                <button
                  title="More"
                  className="p-1 rounded hover:bg-white dark:hover:bg-slate-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMenu(node.id);
                  }}
                >
                  <MoreVertical className="w-3 h-3 text-slate-500" />
                </button>

                {isMenuOpen && (
                  <div
                    className="absolute right-0 top-6 z-20 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={() => {
                        onCloseMenu();
                        onStartRename(node);
                      }}
                    >
                      <Pencil className="w-3 h-3" /> Rename
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => {
                        onCloseMenu();
                        onDeleteRequest(node);
                      }}
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
          
      </div>

      {isExpanded && (
        <div>
          {node.children?.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} ctx={ctx} />
          ))}
          {isAddingHere && (
            <InlineInput
              depth={depth + 1}
              inputRef={inputRef}
              value={newName}
              onChange={onChangeName}
              onConfirm={onConfirmAdd}
              onCancel={onCancelAdd}
              placeholder={
                isDept ? "Category name..." : "Document type name..."
              }
              saving={isSaving}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
        active
          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-red-500"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ── Stat pill (compact metric card for the right panel) ─────────
function StatPill({ label, value, meta }) {
  return (
    <div
      className={`flex-1 min-w-[90px] rounded-xl border border-slate-100 dark:border-slate-700 ${meta ? meta.tint : "bg-slate-50 dark:bg-slate-800/50"} px-3 py-2.5`}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </p>
      <p
        className={`text-[17px] font-extrabold leading-none ${meta ? meta.text : "text-slate-700 dark:text-slate-200"}`}
      >
        {value}
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function FolderStructurePage() {
  const labels = useLabels();
  const [tenantInfo, setTenantInfo] = useState(null);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // ── Enterprise hierarchy: Company Code → Plant ──────────────
  const [companyCodes, setCompanyCodes] = useState([]);
  const [plants, setPlants] = useState([]);
  const [selectedCCId, setSelectedCCId] = useState("");
  const [selectedPlantId, setSelectedPlantId] = useState("");
  const [loadingCC, setLoadingCC] = useState(true);
  const [loadingPlants, setLoadingPlants] = useState(false);

  // ── Add Department (root level, under selected plant) ───────
  const [addingDept, setAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");

  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [query, setQuery] = useState("");

  const [addingTo, setAddingTo] = useState(null);
  const [newName, setNewName] = useState("");

  const [renamingNode, setRenamingNode] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
    const [showGuide, setShowGuide] = useState(false);

    const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const onToggleMenu = useCallback((id) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }, []);
  const onCloseMenu = useCallback(() => setOpenMenuId(null), []);

  useEffect(() => {
    const close = () => setOpenMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const inputRef = useRef(null);
  const renameRef = useRef(null);

  function raiseError(message) {
    setError(message);
    setToast(message);
  }

  // ── Init: decode JWT ────────────────────────────────────────
  useEffect(() => {
    const payload = decodeToken();
    if (!payload?.tenantId) {
      setError("Session invalid. Please login again.");
      setLoading(false);
      return;
    }
    setTenantInfo({
      id: payload.tenantId,
      email: payload.email,
      role: payload.role,
    });
  }, []);

  // ── Fetch company codes on init ──────────────────────────────
  useEffect(() => {
    if (!tenantInfo?.id) return;
    (async () => {
      setLoadingCC(true);
      try {
        const res = await fetch(`${API}/company-codes`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok || !data.success)
          throw new Error(data.message || "Failed to load company codes");
        setCompanyCodes(data.data || []);
      } catch (err) {
        raiseError(err.message);
      } finally {
        setLoadingCC(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantInfo?.id]);

  // ── Fetch plants when company code changes ───────────────────
  useEffect(() => {
    setSelectedPlantId("");
    setPlants([]);
    if (!selectedCCId) return;
    (async () => {
      setLoadingPlants(true);
      try {
        const res = await fetch(`${API}/plants?companyCodeId=${selectedCCId}`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok || !data.success)
          throw new Error(data.message || "Failed to load plants");
        setPlants(data.data || []);
      } catch (err) {
        raiseError(err.message);
      } finally {
        setLoadingPlants(false);
      }
    })();
  }, [selectedCCId]);

  // ── Fetch folder tree when plant changes ─────────────────────
  useEffect(() => {
    setSelectedNode(null);
    setExpandedIds(new Set());
    if (!selectedPlantId) {
      setTree([]);
      setLoading(false);
      return;
    }
    fetchTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlantId]);

  async function fetchTree() {
    if (!selectedPlantId) return;
    setLoading(true);
    setError("");
    try {
      const deptRes = await fetch(
        `${API}/departments/plant/${selectedPlantId}`,
        { headers: authHeaders() },
      );
      const deptData = await deptRes.json();
      if (!deptRes.ok)
        throw new Error(deptData.message || "Failed to load departments");
      const depts = deptData.data || [];

      const catRes = await fetch(`${API}/categories`, {
        headers: authHeaders(),
      });
      const catData = await catRes.json();
      const cats = catData.data || catData || [];

      const dtRes = await fetch(`${API}/document-types`, {
        headers: authHeaders(),
      });
      const dtData = await dtRes.json();
      const dts = dtData.data || dtData || [];

      const builtTree = depts.map((dept) => {
        const deptCats = cats.filter((c) => c.departmentId === dept.id);
        return {
          id: `dept_${dept.id}`,
          _id: dept.id,
          name: dept.name,
          code: dept.code,
          status: dept.status,
          type: NODE_TYPE.DEPARTMENT,
          children: deptCats.map((cat) => {
            const catDts = dts.filter((d) => d.categoryId === cat.id);
            return {
              id: `cat_${cat.id}`,
              _id: cat.id,
              name: cat.name,
              type: NODE_TYPE.CATEGORY,
              departmentId: dept.id,
              children: catDts.map((dt) => ({
                id: `dt_${dt.id}`,
                _id: dt.id,
                name: dt.name,
                type: NODE_TYPE.DOCUMENT_TYPE,
                categoryId: cat.id,
                children: [],
              })),
            };
          }),
        };
      });

      setTree(builtTree);
    } catch (err) {
      raiseError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Add Department (under selected plant) ────────────────────
  async function onConfirmAddDept() {
    const name = newDeptName.trim();
    const code = newDeptCode.trim();
    if (!name || !code || !selectedPlantId) {
      setAddingDept(false);
      return;
    }

    setSavingId("__new_dept__");
    setAddingDept(false);
    setNewDeptName("");
    setNewDeptCode("");

    try {
      // Step 1: create global department
      const createRes = await fetch(`${API}/departments`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name, code }),
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.success) {
        throw new Error(createData.message || "Failed to create department");
      }
      const newDeptId = createData.data.id;

      // Step 2: assign it to this tenant
      const assignRes = await fetch(
        `${API}/departments/assign/${tenantInfo.id}`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ departmentIds: [newDeptId] }),
        },
      );
      const assignData = await assignRes.json();
      if (!assignRes.ok || !assignData.success) {
        throw new Error(
          assignData.message || "Failed to assign department to tenant",
        );
      }

      // Step 3: map it to the selected plant
      const mapRes = await fetch(
        `${API}/departments/plant/${selectedPlantId}`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ departmentId: newDeptId }),
        },
      );
      const mapData = await mapRes.json();
      if (!mapRes.ok || !mapData.success) {
        throw new Error(mapData.message || "Failed to map department to plant");
      }

      await fetchTree();
    } catch (err) {
      raiseError(err.message);
    } finally {
      setSavingId(null);
    }
  }
  function onCancelAddDept() {
    setAddingDept(false);
    setNewDeptName("");
    setNewDeptCode("");
  }

  const handleToggle = useCallback((id, forceOpen = false) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (forceOpen) {
        next.add(id);
        return next;
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onStartAdd = useCallback((node) => {
    setAddingTo(node);
    setNewName("");
  }, []);
  const onCancelAdd = useCallback(() => {
    setAddingTo(null);
    setNewName("");
  }, []);

  const onConfirmAdd = useCallback(async () => {
    const name = newName.trim();
    if (!name || !addingTo) {
      onCancelAdd();
      return;
    }

    setSavingId(addingTo.id);
    const target = addingTo;
    setAddingTo(null);
    setNewName("");

    try {
      if (target.type === NODE_TYPE.DEPARTMENT) {
        const res = await fetch(`${API}/categories`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ name, departmentId: target._id }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to create category");
      } else if (target.type === NODE_TYPE.CATEGORY) {
        const res = await fetch(`${API}/document-types`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ name, categoryId: target._id }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to create document type");
      }
      await fetchTree();
      setExpandedIds((prev) => new Set([...prev, target.id]));
    } catch (err) {
      raiseError(err.message);
    } finally {
      setSavingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newName, addingTo]);

  const onStartRename = useCallback((node) => {
    setRenamingNode(node);
    setRenameValue(node.name);
  }, []);
  const onCancelRename = useCallback(() => {
    setRenamingNode(null);
    setRenameValue("");
  }, []);

  const onConfirmRename = useCallback(async () => {
    const name = renameValue.trim();
    if (!name || !renamingNode) {
      onCancelRename();
      return;
    }

    setSavingId(renamingNode.id);
    const target = renamingNode;
    setRenamingNode(null);
    setRenameValue("");

    try {
      if (target.type === NODE_TYPE.CATEGORY) {
        const res = await fetch(`${API}/categories/${target._id}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to rename");
      } else if (target.type === NODE_TYPE.DOCUMENT_TYPE) {
        const res = await fetch(`${API}/document-types/${target._id}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to rename");
      }
      await fetchTree();
    } catch (err) {
      raiseError(err.message);
    } finally {
      setSavingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renamingNode, renameValue]);

  const onDeleteRequest = useCallback((node) => setDeleteTarget(node), []);

  const onDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const node = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(node.id);

    try {
      if (node.type === NODE_TYPE.CATEGORY) {
        const res = await fetch(`${API}/categories/${node._id}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to delete");
      } else if (node.type === NODE_TYPE.DOCUMENT_TYPE) {
        const res = await fetch(`${API}/document-types/${node._id}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to delete");
      }
      if (selectedNode?.id === node.id) setSelectedNode(null);
      await fetchTree();
    } catch (err) {
      raiseError(err.message);
    } finally {
      setDeletingId(null);
    }
  }, [deleteTarget, selectedNode]);

  useEffect(() => {
    if (addingTo) setTimeout(() => inputRef.current?.focus(), 0);
  }, [addingTo]);
  useEffect(() => {
    if (renamingNode) setTimeout(() => renameRef.current?.focus(), 0);
  }, [renamingNode]);

  // ── Search: highlight matches + auto-expand ancestors ───────
  const matchIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const matched = new Set();
    const toExpand = new Set();

    function walk(nodes, ancestors) {
      for (const n of nodes) {
        const isMatch = n.name.toLowerCase().includes(q);
        if (isMatch) {
          matched.add(n.id);
          ancestors.forEach((a) => toExpand.add(a));
        }
        if (n.children?.length) walk(n.children, [...ancestors, n.id]);
      }
    }
    walk(tree, []);
    setExpandedIds((prev) => new Set([...prev, ...toExpand]));
    return matched;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tree]);

  // Category/Document-Type create/rename/delete is TenantAdmin-only per backend
  const canManageHierarchy = tenantInfo?.role === "TenantAdmin";
  // Department create is SuperAdmin or TenantAdmin per backend
  const canAddDepartment =
    tenantInfo?.role === "TenantAdmin" || tenantInfo?.role === "SuperAdmin";

  const ctx = {
    selectedId: selectedNode?.id,
    expandedIds,
    addingTo: addingTo?.id,
    renamingId: renamingNode?.id,
    renameValue,
    newName,
    onSelect: setSelectedNode,
    onToggle: handleToggle,
    onStartAdd,
    onChangeName: setNewName,
    onConfirmAdd,
    onCancelAdd,
    onStartRename,
    onRenameChange: setRenameValue,
    onConfirmRename,
    onCancelRename,
    onDeleteRequest,
    inputRef,
    renameRef,
    savingId,
    deletingId,
       matchIds,
    canManage: canManageHierarchy,
    openMenuId,
    onToggleMenu,
    onCloseMenu,
  };

  function findAncestorDept(nodeId) {
    function hasDesc(node, id) {
      if (node.id === id) return true;
      return node.children?.some((c) => hasDesc(c, id));
    }
    function search(nodes) {
      for (const n of nodes) {
        if (n.type === NODE_TYPE.DEPARTMENT && hasDesc(n, nodeId)) return n;
      }
      return null;
    }
    return search(tree);
  }

  const selectedDept = selectedNode ? findAncestorDept(selectedNode.id) : null;

  const totalCategories = tree.reduce(
    (s, d) => s + (d.children?.length || 0),
    0,
  );
  const totalDocTypes = tree.reduce(
    (s, d) =>
      s + d.children.reduce((s2, c) => s2 + (c.children?.length || 0), 0),
    0,
  );

   return (
    <div className="space-y-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#151E2B] p-5 font-sans">
      {toast && <Toast message={toast} onClose={() => setToast("")} />}

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-[17px] font-bold text-slate-800 dark:text-slate-100">Folder Structure</h1>
          <div className="relative group">
            <button
              onClick={() => setShowGuide(true)}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
              <Info className="w-3 h-3" />
            </button>
            <div className="pointer-events-none absolute left-0 top-full mt-2 w-56 bg-slate-800 dark:bg-slate-700 text-white text-[10.5px] leading-relaxed rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
              Click to see a step-by-step guide on how to use this page.
            </div>
          </div>
        </div>
        <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
          {labels.level1Label} &rarr; {labels.level2Label} &rarr; {labels.level3Label}
        </p>
      </div>

      <div className="flex gap-4 items-start">
      {/* ── LEFT: Tree Panel ── */}

      {/* ── LEFT: Tree Panel ── */}
      <div className="w-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex flex-col min-h-[620px] shadow-sm">
        {/* Header */}
        <div className="px-4 pt-3.5 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              {/* <div className="w-8 h-8 rounded-lg bg-slate-800 dark:bg-slate-700 flex items-center justify-center shadow-sm shadow-slate-800/20">
                {" "}
                <Boxes className="w-4 h-4 text-white" />
              </div> */}
              <div>
                {/* <span className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100 block leading-tight">
                  Folder Structure
                </span> */}
                {!loading && !error && tree.length > 0 && (
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {tree.length} {labels.level1Label.toLowerCase()} ·{" "}
                    {totalCategories} {labels.level2Label.toLowerCase()} ·{" "}
                    {totalDocTypes} {labels.level3Label.toLowerCase()}
                  </span>
                )}
              </div>
            </div>
            {/* {tenantInfo && (
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px] hidden sm:block">
                {tenantInfo.email}
              </span>
            )} */}
          </div>

          {/* Company Code → Plant selector */}
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            <select
              value={selectedCCId}
              onChange={(e) => setSelectedCCId(e.target.value)}
              disabled={loadingCC}
              className="text-[12px] px-2.5 py-[7px] rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 outline-none focus:border-teal-400 dark:focus:border-teal-500 transition"
            >
              <option value="">
                {loadingCC ? "Loading…" : "Company Code"}
              </option>
              {companyCodes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
            <select
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              disabled={!selectedCCId || loadingPlants}
              className="text-[12px] px-2.5 py-[7px] rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 outline-none focus:border-teal-400 dark:focus:border-teal-500 transition disabled:opacity-50"
            >
              <option value="">{loadingPlants ? "Loading…" : "Plant"}</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search + Add Department */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories & document types..."
                className="w-full text-[12.5px] pl-8 pr-3 py-[7px] rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40 outline-none focus:border-teal-400 dark:focus:border-teal-500 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {selectedPlantId && canAddDepartment && (
              <button
                onClick={() => setAddingDept(true)}
                title={`Add ${labels.level1Label.toLowerCase()} under this plant`}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-[7px] rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11.5px] font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" /> {labels.level1Label}
              </button>
            )}
          </div>

          {addingDept && canAddDepartment && (
            <div className="flex items-center gap-1.5 mt-2.5 p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-dashed border-blue-200 dark:border-blue-800">
              <input
                autoFocus
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder={`${labels.level1Label} name...`}
                className="flex-1 text-[12px] rounded-md border border-blue-300 dark:border-blue-700 outline-none bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 px-2 py-1"
              />
              <input
                value={newDeptCode}
                onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                placeholder="CODE"
                maxLength={10}
                className="w-20 text-[12px] font-mono rounded-md border border-blue-300 dark:border-blue-700 outline-none bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 px-2 py-1"
              />
              <button
                onClick={onConfirmAddDept}
                disabled={!newDeptName.trim() || !newDeptCode.trim()}
                className="p-1 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex-shrink-0 transition"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={onCancelAddDept}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0 transition"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          )}

          {/* Legend */}
          {!loading && !error && tree.length > 0 && (
            <div className="flex items-center gap-3 mt-2.5 text-[10px] text-slate-400">
              {Object.entries(TYPE_META).map(([type]) => (
                <div key={type} className="flex items-center gap-1">
                  <FolderIcon type={type} size="sm" />
                  <span>{typeLabelFor(labels, type)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 py-1.5 overflow-y-auto">
          {!selectedPlantId && !loadingCC && !loadingPlants && (
            <div className="flex flex-col items-center gap-2.5 text-center py-16 px-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-700/30 flex items-center justify-center">
                <Layers className="w-8 h-8 text-slate-200 dark:text-slate-600" />
              </div>
              <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400">
                {!selectedCCId
                  ? "Select a Company Code to begin"
                  : "Select a Plant to view its departments"}
              </p>
              <p className="text-[11px] text-slate-300 dark:text-slate-600 max-w-[260px]">
                {labels.level1Label}s, {labels.level2Label.toLowerCase()}s and{" "}
                {labels.level3Label.toLowerCase()}s are scoped to a Plant. No
                Company Codes yet? Create one from the "Company Codes" page.
              </p>
            </div>
          )}

          {selectedPlantId && loading && (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[12px]">Loading folder structure...</span>
            </div>
          )}

          {selectedPlantId && !loading && error && !tree.length && (
            <div className="flex flex-col items-center gap-2 mx-4 mt-6 text-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <p className="text-[12px] font-semibold text-red-500">{error}</p>
              <button
                onClick={fetchTree}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {selectedPlantId && !loading && !error && (
            <>
              <div className="flex items-center gap-2 px-4 py-2 mb-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400">
                  {companyCodes.find(
                    (c) => String(c.id) === String(selectedCCId),
                  )?.name || "My Workspace"}
                  {" / "}
                  <span className="text-slate-700 dark:text-slate-200">
                    {
                      plants.find(
                        (p) => String(p.id) === String(selectedPlantId),
                      )?.name
                    }
                  </span>
                </span>
              </div>

              {tree.length === 0 ? (
                <div className="flex flex-col items-center gap-2.5 text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-700/30 flex items-center justify-center">
                    <Inbox className="w-8 h-8 text-slate-200 dark:text-slate-600" />
                  </div>
                  <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400">
                    No {labels.level1Label.toLowerCase()}s in this plant yet
                  </p>
                  <p className="text-[11px] text-slate-300 dark:text-slate-600 max-w-[240px]">
                    Use the{" "}
                    <span className="font-semibold">
                      + {labels.level1Label}
                    </span>{" "}
                    button above to add the first one.
                  </p>
                </div>
              ) : matchIds && matchIds.size === 0 ? (
                <div className="flex flex-col items-center gap-2 text-center py-16">
                  <Search className="w-7 h-7 text-slate-200 dark:text-slate-700" />
                  <p className="text-[12px] font-medium text-slate-400">
                    No matches for "{query}"
                  </p>
                </div>
              ) : (
                tree.map((node) => (
                  <TreeNode key={node.id} node={node} depth={0} ctx={ctx} />
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && tree.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              {labels.level1Label}s are assigned by a SuperAdmin · hover a row
              and use <Plus className="w-2.5 h-2.5 inline" /> to add a{" "}
              {labels.level2Label.toLowerCase()} or{" "}
              {labels.level3Label.toLowerCase()}
            </p>
          </div>
        )}
      </div>

      {/* ── RIGHT: Detail Panel ── */}
      <div className="w-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden min-h-[620px] flex flex-col shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100 dark:border-slate-700">
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100 truncate">
            {selectedNode ? selectedNode.name : "Folder Contents"}
          </span>
          {selectedNode && <TypeChip type={selectedNode.type} />}
          {selectedDept?.status && <StatusBadge status={selectedDept.status} />}
        </div>

        {selectedNode && (
          <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-[#151E2B] flex items-center gap-1.5 flex-wrap text-[11px]">
            {selectedDept && (
              <>
                <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">
                  {selectedDept.code}
                </span>
                <span className="text-slate-300">/</span>
                <button
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  onClick={() => setSelectedNode(selectedDept)}
                >
                  {selectedDept.name}
                </button>
              </>
            )}
            {selectedNode.type !== NODE_TYPE.DEPARTMENT && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  {selectedNode.name}
                </span>
              </>
            )}
          </div>
        )}

        {selectedNode && (
          <div className="px-4 pt-4 pb-2 flex flex-col gap-3">
            <div
              className={`rounded-2xl border ${TYPE_META[selectedNode.type].border} p-4 ${TYPE_META[selectedNode.type].tint}`}
            >
              <div className="flex items-center gap-3 mb-3.5">
                <FolderIcon type={selectedNode.type} expanded size="lg" />
                <div className="min-w-0">
                  <span className="text-[15px] font-extrabold text-slate-800 dark:text-slate-100 block truncate">
                    {selectedNode.name}
                  </span>
                  {selectedNode.code && (
                    <span className="text-[10.5px] font-mono text-slate-400">
                      {selectedNode.code}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatPill
                  label="Type"
                  value={typeLabelFor(labels, selectedNode.type)}
                  meta={TYPE_META[selectedNode.type]}
                />
                {selectedDept?.status && (
                  <div className="flex-1 min-w-[90px] rounded-xl border border-slate-100 dark:border-slate-700 bg-white/70 dark:bg-slate-800/50 px-3 py-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Status
                    </p>
                    <StatusBadge status={selectedDept.status} />
                  </div>
                )}
                {selectedNode.type === NODE_TYPE.DEPARTMENT && (
                  <StatPill
                    label={`${labels.level2Label}s`}
                    value={selectedNode.children?.length || 0}
                  />
                )}
                {selectedNode.type === NODE_TYPE.CATEGORY && (
                  <StatPill
                    label={`${labels.level3Label}s`}
                    value={selectedNode.children?.length || 0}
                  />
                )}
              </div>
            </div>

            {selectedNode.children?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-0.5">
                  {selectedNode.type === NODE_TYPE.DEPARTMENT
                    ? `${labels.level2Label}s`
                    : `${labels.level3Label}s`}
                </p>
                <div className="flex flex-col gap-1.5">
                  {selectedNode.children.map((child) => {
                    const childMeta = TYPE_META[child.type];
                    return (
                      <div
                        key={child.id}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-all"
                        onClick={() => setSelectedNode(child)}
                      >
                        <FolderIcon type={child.type} size="md" />
                        <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 flex-1 truncate">
                          {child.name}
                        </span>
                        {child.children?.length > 0 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${childMeta.chip}`}
                          >
                            {child.children.length}
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedNode && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-700/30 flex items-center justify-center">
              <FolderOpen
                className="w-9 h-9 text-slate-200 dark:text-slate-600"
                strokeWidth={1.75}
              />
            </div>
            <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
              Select a folder on the left
            </p>
            <p className="text-[11px] text-slate-300 dark:text-slate-600">
              {labels.level1Label} → {labels.level2Label} → {labels.level3Label}
            </p>
          </div>
        )}

        {selectedNode?.type === NODE_TYPE.DOCUMENT_TYPE && (
          <div className="flex-1 border-t border-slate-100 dark:border-slate-700 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-slate-800">
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  {["Document", "Type", "Date", "Status", "Action"].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 py-3"
                      >
                        {col}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-700/30 flex items-center justify-center mx-auto mb-2.5">
                      <Inbox className="w-6 h-6 text-slate-200 dark:text-slate-700" />
                    </div>
                    <p className="text-[12px] text-slate-400">
                      No documents in this document type yet
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

           </div>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          type={deleteTarget.type}
          onConfirm={onDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
