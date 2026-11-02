import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
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
  Info,
  MoreVertical,
  Home,
  HelpCircle,
  RefreshCw,
  Filter,
  CheckCircle2,
  BarChart3,
  CalendarDays,
  User,
  Clock,
  AlignLeft,
} from "lucide-react";
import { useLabels } from "../../context/MetadataContext";

import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;
const BLUE = "#0D6EFD";

// ── Auth / API helpers ──────────────────────────────────────────
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
// success === false ya !res.ok dono par error throw hota hai
async function apiCall(path, method = "GET", body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {}
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
}
const asList = (d) => (Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);

function fmtDateTime(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return "—";
  const date = dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const time = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date} ${time}`;
}

// ── Node types ──────────────────────────────────────────────────
const NODE_TYPE = {
  DEPARTMENT: "DEPARTMENT",
  CATEGORY: "CATEGORY",
  DOCUMENT_TYPE: "DOCUMENT_TYPE",
};

/** Labels tenant-wise badalte hain (useLabels), isliye helper ko labels pass karte hain. */
function typeLabelFor(labels, type) {
  return (
    {
      [NODE_TYPE.DEPARTMENT]: labels.level1Label,
      [NODE_TYPE.CATEGORY]: labels.level2Label,
      [NODE_TYPE.DOCUMENT_TYPE]: labels.level3Label,
    }[type] || ""
  );
}

const docCount = (o) =>
  Number(o.documentCount ?? o.documentsCount ?? o.docCount ?? o.documents ?? 0) || 0;

const metaOf = (o) => ({
  code: o.code || "",
  status: o.status || "ACTIVE",
  description: o.description || "",
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
  createdBy:
    o.createdByName ||
    o.creator?.name ||
    o.createdBy?.name ||
    (typeof o.createdBy === "string" ? o.createdBy : "") ||
    "",
});

// ── Animations (scoped) ─────────────────────────────────────────
const ANIM_CSS = `
@keyframes fs-fade-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes fs-swap{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes fs-fade-in{from{opacity:0}to{opacity:1}}
@keyframes fs-fade-out{from{opacity:1}to{opacity:0}}
@keyframes fs-slide-left{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}
@keyframes fs-scale-in{from{opacity:0;transform:translateY(10px) scale(.95)}to{opacity:1;transform:none}}
@keyframes fs-scale-out{from{opacity:1;transform:none}to{opacity:0;transform:translateY(6px) scale(.96)}}
@keyframes fs-menu-in{from{opacity:0;transform:translateY(-6px) scale(.96)}to{opacity:1;transform:none}}
@keyframes fs-toast-in{from{opacity:0;transform:translateY(18px) scale(.95)}to{opacity:1;transform:none}}
@keyframes fs-pop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}
@keyframes fs-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
@keyframes fs-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.fs-fade-up{animation:fs-fade-up .55s cubic-bezier(.22,1,.36,1) both}
.fs-swap{animation:fs-swap .38s cubic-bezier(.22,1,.36,1) both}
.fs-fade-in{animation:fs-fade-in .2s ease-out both}
.fs-fade-out{animation:fs-fade-out .18s ease-in both}
.fs-slide-left{animation:fs-slide-left .45s cubic-bezier(.22,1,.36,1) both}
.fs-scale-in{animation:fs-scale-in .28s cubic-bezier(.22,1,.36,1) both}
.fs-scale-out{animation:fs-scale-out .18s ease-in both}
.fs-menu-in{animation:fs-menu-in .16s ease-out both;transform-origin:top right}
.fs-toast-in{animation:fs-toast-in .35s cubic-bezier(.22,1,.36,1) both}
.fs-pop{animation:fs-pop .35s cubic-bezier(.34,1.56,.64,1) both}
.fs-float{animation:fs-float 4s ease-in-out infinite}
.fs-skel{background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:1200px 100%;animation:fs-shimmer 1.5s infinite linear}
.dark .fs-skel{background:linear-gradient(90deg,#243247 25%,#2d3d54 50%,#243247 75%);background-size:1200px 100%}
.fs-press{transition:transform .15s ease,box-shadow .2s ease,background-color .2s ease,border-color .2s ease}
.fs-press:active{transform:scale(.96)}
@media (prefers-reduced-motion:reduce){
  .fs-root *{animation-duration:.01ms!important;animation-delay:0ms!important;transition-duration:.01ms!important}
}
`;

// ── Hooks ──────────────────────────────────────────────────────
function useCountUp(target, duration = 800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}
function CountUp({ value }) {
  return <>{useCountUp(value)}</>;
}

function useOutsideClose(open, setOpen) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, setOpen]);
  return ref;
}

// ── Small UI pieces ────────────────────────────────────────────
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

function StatusBadge({ status }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-[3px] rounded-full border whitespace-nowrap ${
        active
          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
          : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function NodeIcon({ type, className = "w-[18px] h-[18px]" }) {
  if (type === NODE_TYPE.DOCUMENT_TYPE)
    return <FileText className={`${className} text-[#0D6EFD] flex-shrink-0`} strokeWidth={1.9} />;
  if (type === NODE_TYPE.CATEGORY)
    return (
      <Folder
        className={`${className} text-amber-500 flex-shrink-0`}
        fill="#FDE68A"
        strokeWidth={1.75}
      />
    );
  return (
    <Folder className={`${className} text-slate-600 dark:text-slate-300 flex-shrink-0`} strokeWidth={1.75} />
  );
}

function HighlightText({ text, q }) {
  const s = q.trim();
  if (!s) return text;
  const i = text.toLowerCase().indexOf(s.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-amber-200/70 dark:bg-amber-500/30 text-inherit rounded px-0.5">
        {text.slice(i, i + s.length)}
      </mark>
      {text.slice(i + s.length)}
    </>
  );
}

const inputCls =
  "w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-[#0D6EFD] focus:ring-2 focus:ring-blue-500/15 transition placeholder-slate-300 dark:placeholder-slate-600";
const labelCls =
  "block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2";
const selectCls =
  "appearance-none w-full text-[13px] pl-3.5 pr-9 py-[11px] border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-[#0D6EFD] focus:ring-2 focus:ring-blue-500/15 transition disabled:opacity-50";

// ── Toast ─────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, toast.type === "error" ? 4500 : 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  const isErr = toast.type === "error";
  return (
    <div
      key={toast.id}
      className="fs-toast-in fixed bottom-6 right-6 z-[80] max-w-sm flex items-start gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[13px] font-semibold rounded-xl px-4 py-3 shadow-2xl"
    >
      {isErr ? (
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400 dark:text-red-500" />
      ) : (
        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400 dark:text-emerald-600" />
      )}
      <p className="leading-snug">{toast.msg}</p>
      <button onClick={onClose} className="ml-2 flex-shrink-0 opacity-60 hover:opacity-100 transition">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────
function ModalShell({ onClose, maxW = "max-w-md", children }) {
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    const h = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [close]);

  return (
    <div
      className={`fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 ${
        closing ? "fs-fade-out" : "fs-fade-in"
      }`}
      style={{ backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className={`bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full ${maxW} shadow-2xl overflow-hidden ${
          closing ? "fs-scale-out" : "fs-scale-in"
        }`}
      >
        {children(close)}
      </div>
    </div>
  );
}

function ModalHeader({ icon: Icon, title, subtitle, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-[#0D6EFD] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={onClose}
        className="fs-press w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="fs-scale-in flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message}
    </div>
  );
}

// ── Add (department / category / document type) ───────────────
function AddNodeModal({ type, context, labels, onSubmit, onClose }) {
  const isDept = type === NODE_TYPE.DEPARTMENT;
  const typeLabel = typeLabelFor(labels, type);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save(close) {
    setError("");
    if (!name.trim()) return setError(`${typeLabel} name is required.`);
    if (isDept && !code.trim()) return setError(`${typeLabel} code is required.`);
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), code: code.trim() });
      close();
    } catch (e) {
      setError(e.message || "Server error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <>
          <ModalHeader icon={Folder} title={`New ${typeLabel}`} subtitle={context} onClose={close} />
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className={labelCls}>
                {typeLabel} Name <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && !loading && save(close)}
                placeholder={`e.g. ${isDept ? "Finance" : type === NODE_TYPE.CATEGORY ? "Invoices" : "Purchase Invoice"}`}
                className={inputCls}
              />
            </div>
            {isDept && (
              <div>
                <label className={labelCls}>
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && !loading && save(close)}
                  maxLength={10}
                  placeholder="e.g. D001"
                  className={`${inputCls} font-mono`}
                />
              </div>
            )}
            <ErrorBox message={error} />
          </div>
          <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={close}
              className="fs-press flex-1 py-[10px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => save(close)}
              disabled={loading}
              className="fs-press flex-1 py-[10px] rounded-xl bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[12.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                </>
              ) : (
                `Create ${typeLabel}`
              )}
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ── Rename ────────────────────────────────────────────────────
function RenameModal({ node, labels, onSubmit, onClose }) {
  const typeLabel = typeLabelFor(labels, node.type);
  const [name, setName] = useState(node.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save(close) {
    setError("");
    if (!name.trim()) return setError("Name is required.");
    if (name.trim() === node.name) return close();
    setLoading(true);
    try {
      await onSubmit(name.trim());
      close();
    } catch (e) {
      setError(e.message || "Server error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <>
          <ModalHeader icon={Pencil} title={`Edit ${typeLabel}`} subtitle={node.name} onClose={close} />
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className={labelCls}>
                {typeLabel} Name <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && !loading && save(close)}
                className={inputCls}
              />
            </div>
            <ErrorBox message={error} />
          </div>
          <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={close}
              className="fs-press flex-1 py-[10px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => save(close)}
              disabled={loading}
              className="fs-press flex-1 py-[10px] rounded-xl bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[12.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ── Delete ────────────────────────────────────────────────────
function DeleteModal({ nodes, labels, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const single = nodes.length === 1;
  const first = nodes[0];

  async function run(close) {
    setLoading(true);
    setError("");
    try {
      await onConfirm();
      close();
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell onClose={onClose} maxW="max-w-sm">
      {(close) => (
        <div className="p-6">
          <div className="fs-pop w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 text-center mb-1">
            {single ? `Delete ${typeLabelFor(labels, first.type)}?` : `Delete ${nodes.length} items?`}
          </h3>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 text-center mb-4 leading-relaxed">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              "{single ? first.name : `${nodes.length} selected`}"
            </span>{" "}
            and everything inside {single ? "it" : "them"} will be permanently removed. This can't be undone.
          </p>
          {error && (
            <div className="mb-4">
              <ErrorBox message={error} />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={close}
              className="fs-press flex-1 py-[10px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => run(close)}
              disabled={loading}
              className="fs-press flex-1 py-[10px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…
                </>
              ) : (
                "Yes, delete"
              )}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

// ── Guide ─────────────────────────────────────────────────────
function GuideModal({ labels, onClose }) {
  const l1 = labels.level1Label;
  const l2 = labels.level2Label;
  const l3 = labels.level3Label;
  const steps = [
    {
      title: "Select Company Code & Plant",
      desc: `Choose a Company Code, then a Plant. ${l1}s, ${l2.toLowerCase()}s and ${l3.toLowerCase()}s are scoped to a plant.`,
    },
    {
      title: `Add a ${l1}`,
      desc: `Click Add ${l1} to create one under the selected plant. You'll need a name and a short code.`,
    },
    {
      title: `Add ${l2}s and ${l3}s`,
      desc: `Select a ${l1.toLowerCase()} and click Add ${l2}, or select a ${l2.toLowerCase()} and click Add ${l3}. The ⋮ menu on any row works too.`,
    },
    {
      title: "Edit or Delete",
      desc: `Use ⋮ on a ${l2.toLowerCase()} or ${l3.toLowerCase()} row, or Edit in the Folder Contents panel. ${l1}s can't be renamed or deleted here.`,
    },
    {
      title: "Search and browse",
      desc: "Search filters the tree and opens matching branches. Click any row to see its contents, counts and details on the right.",
    },
  ];
  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <>
          <ModalHeader icon={Info} title="Folder Structure — Guide" onClose={close} />
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {steps.map((s, i) => (
              <div key={s.title} className="fs-fade-up flex gap-3" style={{ animationDelay: `${80 + i * 60}ms` }}>
                <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#0D6EFD] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{s.title}</div>
                  <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={close}
              className="fs-press w-full py-[10px] rounded-xl bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[12.5px] font-bold"
            >
              Got it
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ── Expand / collapse menu (funnel button) ────────────────────
function ExpandMenu({ onExpandAll, onCollapseAll }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, setOpen);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="View options"
        className="fs-press w-[42px] h-[42px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#1A2433] text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
      >
        <Filter className="w-4 h-4" />
      </button>
      {open && (
        <div className="fs-menu-in absolute right-0 top-full mt-1.5 w-40 z-30 bg-white dark:bg-[#232F40] border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl py-1">
          <button
            onClick={() => {
              onExpandAll();
              setOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Expand all
          </button>
          <button
            onClick={() => {
              onCollapseAll();
              setOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-[12.5px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Collapse all
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tree node ─────────────────────────────────────────────────
function TreeNode({ node, depth, index, ctx }) {
  const { selectedId, isExpanded, onSelect, onToggle, onMenu, hasMenu, q } = ctx;
  const expanded = isExpanded(node.id);
  const selected = selectedId === node.id;
  const hasKids = node.children?.length > 0;
  const isDept = node.type === NODE_TYPE.DEPARTMENT;
  const count = node.type === NODE_TYPE.DOCUMENT_TYPE ? node.documents : node.children.length;
  const menuOn = hasMenu(node);

  return (
    <div>
      <div
        onClick={() => onSelect(node)}
        style={{ animationDelay: `${depth * 70 + index * 40}ms` }}
        className={`fs-slide-left group relative flex items-center gap-2 pl-2 pr-2 py-[7px] my-[2px] rounded-lg cursor-pointer transition-colors duration-200 ${
          selected
            ? "bg-blue-100/70 dark:bg-blue-900/30"
            : isDept
              ? "bg-blue-50/60 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-white/10"
              : "hover:bg-slate-50 dark:hover:bg-white/5"
        }`}
      >
        {selected && (
          <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-[#0D6EFD] fs-pop" />
        )}
        {hasKids ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:bg-white/80 dark:hover:bg-slate-700 flex-shrink-0"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${expanded ? "" : "-rotate-90"}`}
            />
          </button>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}

        {expanded && hasKids && node.type === NODE_TYPE.DEPARTMENT ? (
          <FolderOpen className="w-[18px] h-[18px] text-slate-600 dark:text-slate-300 flex-shrink-0" strokeWidth={1.75} />
        ) : (
          <NodeIcon type={node.type} />
        )}

        <span
          className={`text-[13.5px] flex-1 truncate select-none ${
            node.type === NODE_TYPE.DOCUMENT_TYPE
              ? "text-slate-700 dark:text-slate-200"
              : "font-bold text-slate-900 dark:text-slate-100"
          }`}
        >
          <HighlightText text={node.name} q={q} />
        </span>

        <span className="text-[11.5px] font-semibold text-[#0D6EFD] bg-blue-50 dark:bg-blue-900/30 rounded-full px-2 min-w-[28px] text-center py-[1px] flex-shrink-0">
          {count}
        </span>

        {menuOn ? (
          <button
            data-fs-menu-btn
            onClick={(e) => onMenu(e, node, `tree-${node.id}`)}
            className="fs-press w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 flex-shrink-0"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        ) : (
          <span className="w-7 flex-shrink-0" />
        )}
      </div>

      {hasKids && (
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden min-h-0">
            <div className="ml-[18px] pl-2 border-l border-slate-200 dark:border-slate-700">
              {node.children.map((child, i) => (
                <TreeNode key={child.id} node={child} depth={depth + 1} index={i} ctx={ctx} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TreeSkeleton() {
  return (
    <div className="px-3 py-2 space-y-2">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3" style={{ paddingLeft: i % 3 === 0 ? 0 : 24 + (i % 3) * 8 }}>
          <div className="fs-skel w-5 h-5 rounded" />
          <div className="fs-skel h-4 flex-1 rounded" />
          <div className="fs-skel h-5 w-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ── Info section (Category Information etc.) ──────────────────
function InfoSection({ title, rows, side }) {
  return (
    <div className="px-6 pb-6 pt-1">
      <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-50 mb-4">{title}</h4>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_230px] gap-5 items-start">
        <div className="space-y-3.5">
          {rows.map((r, i) => (
            <div
              key={r.k}
              style={{ animationDelay: `${i * 45}ms` }}
              className="fs-fade-up grid grid-cols-[22px_130px_minmax(0,1fr)] items-start gap-3 text-[13.5px]"
            >
              <r.icon className="w-4 h-4 text-slate-400 mt-0.5" />
              <span className="text-slate-500 dark:text-slate-400">{r.k}</span>
              <span className="text-slate-800 dark:text-slate-100 break-words">{r.v || "—"}</span>
            </div>
          ))}
        </div>
        <div className="fs-fade-up rounded-xl bg-emerald-50/70 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/40 p-4 space-y-4" style={{ animationDelay: "120ms" }}>
          {side.map((s) => (
            <div key={s.k} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#1A2433] border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center flex-shrink-0">
                <s.icon className="w-4 h-4 text-slate-500 dark:text-slate-300" />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] text-slate-500 dark:text-slate-400">{s.k}</div>
                <div className="text-[15px] font-bold text-slate-900 dark:text-slate-50">{s.v}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Children table (categories / document types) ─────────────
function SortTh({ label, k, sort, setSort }) {
  const on = sort.key === k;
  return (
    <th className="px-4 py-3 text-left">
      <button
        onClick={() =>
          setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" }))
        }
        className={`inline-flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-wide transition-colors ${
          on ? "text-[#0D6EFD]" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        }`}
      >
        {label}
        <ChevronsUpDown className="w-3 h-3" />
      </button>
    </th>
  );
}

function ChildrenTable({ rows, emptyText, onAddEmpty, addLabel, canManage, hasRowMenu, onOpen, onMenu, onBulkDelete }) {
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [picked, setPicked] = useState(new Set());

  const sorted = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      if (typeof x === "number" || typeof y === "number") return ((x || 0) - (y || 0)) * dir;
      return String(x || "").localeCompare(String(y || "")) * dir;
    });
  }, [rows, sort]);

  const allPicked = sorted.length > 0 && sorted.every((r) => picked.has(r.id));
  const toggle = (id) =>
    setPicked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  if (rows.length === 0) {
    return (
      <div className="mx-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="fs-fade-up flex flex-col items-center justify-center min-h-[200px] gap-3 text-slate-400">
          <Inbox className="w-9 h-9 opacity-40" />
          <span className="text-[12.5px]">{emptyText}</span>
          {onAddEmpty && (
            <button
              onClick={onAddEmpty}
              className="fs-press flex items-center gap-1.5 text-[12px] font-semibold text-[#0D6EFD] border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Plus className="w-3.5 h-3.5" /> {addLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-6">
      {canManage && picked.size > 0 && (
        <div className="fs-scale-in flex items-center justify-between mb-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-2">
          <span className="text-[12.5px] font-semibold text-[#0D6EFD]">{picked.size} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPicked(new Set())}
              className="fs-press text-[12px] font-semibold text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-white/70 dark:hover:bg-slate-700"
            >
              Clear
            </button>
            <button
              onClick={() => onBulkDelete(rows.filter((r) => picked.has(r.id)), () => setPicked(new Set()))}
              className="fs-press flex items-center gap-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 bg-white dark:bg-transparent rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete selected
            </button>
          </div>
        </div>
      )}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px] min-w-[560px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#151E2B] border-b border-slate-200 dark:border-slate-700">
                <th className="pl-4 pr-1 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPicked}
                    onChange={() => setPicked(allPicked ? new Set() : new Set(sorted.map((r) => r.id)))}
                    className="h-4 w-4 rounded accent-[#0D6EFD]"
                  />
                </th>
                <SortTh label="Name" k="name" sort={sort} setSort={setSort} />
                <SortTh label="Code" k="code" sort={sort} setSort={setSort} />
                <SortTh label="Documents" k="documents" sort={sort} setSort={setSort} />
                <SortTh label="Status" k="status" sort={sort} setSort={setSort} />
                {hasRowMenu && (
                  <th className="px-4 py-3 text-right text-[11.5px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr
                  key={r.id}
                  onClick={() => onOpen(r)}
                  style={{ animationDelay: `${i * 55}ms` }}
                  className={`fs-fade-up cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors duration-200 ${
                    picked.has(r.id) ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-slate-50/80 dark:hover:bg-[#151E2B]"
                  }`}
                >
                  <td className="pl-4 pr-1 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={picked.has(r.id)}
                      onChange={() => toggle(r.id)}
                      className="h-4 w-4 rounded accent-[#0D6EFD]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2.5 font-semibold text-slate-800 dark:text-slate-100">
                      <NodeIcon type={r.type} />
                      {r.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-[12.5px]">{r.code || "—"}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{r.documents}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  {hasRowMenu && (
                    <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      {hasRowMenu(r) && (
                        <button
                          data-fs-menu-btn
                          onClick={(e) => onMenu(e, r, `row-${r.id}`)}
                          className="fs-press w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DocumentsEmpty() {
  return (
    <div className="mx-6 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-[#151E2B] border-b border-slate-200 dark:border-slate-700">
            {["Document", "Type", "Date", "Status", "Action"].map((col) => (
              <th
                key={col}
                className="text-left text-[11.5px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 px-4 py-3"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={5} className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-700/30 flex items-center justify-center mx-auto mb-2.5 fs-float">
                <Inbox className="w-6 h-6 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-[12.5px] text-slate-400">No documents in this document type yet</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Main page
// ═════════════════════════════════════════════════════════════
export default function FolderStructurePage({ showHeader = true }) {
  const labels = useLabels();
  const l1 = labels.level1Label;
  const l2 = labels.level2Label;
  const l3 = labels.level3Label;

  const [tenantInfo, setTenantInfo] = useState(null);
  const [erpEnabled, setErpEnabled] = useState(false);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [companyCodes, setCompanyCodes] = useState([]);
  const [plants, setPlants] = useState([]);
  const [selectedCCId, setSelectedCCId] = useState("");
  const [selectedPlantId, setSelectedPlantId] = useState("");
  const [loadingCC, setLoadingCC] = useState(true);
  const [loadingPlants, setLoadingPlants] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("children");

  const [menu, setMenu] = useState(null); // { node, src, top, left }
  const [modal, setModal] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const reqRef = useRef(0);
  const initRef = useRef(false);

  const showToast = useCallback((msg, type = "success") => setToast({ id: Date.now(), msg, type }), []);
  const closeToast = useCallback(() => setToast(null), []);
  const raiseError = useCallback(
    (msg) => {
      setError(msg);
      showToast(msg, "error");
    },
    [showToast],
  );

  // ── Init: JWT decode ───────────────────────────────────────
  useEffect(() => {
    const payload = decodeToken();
    if (!payload?.tenantId) {
      setError("Session invalid. Please login again.");
      setLoading(false);
      return;
    }
    setTenantInfo({ id: payload.tenantId, email: payload.email, role: payload.role });
  }, []);

  // ── ERP flag ───────────────────────────────────────────────
  useEffect(() => {
    if (!tenantInfo?.id) return;
    (async () => {
      try {
        const data = await apiCall(`/tenants/me/metadata`);
        setErpEnabled(Boolean(data.data?.erpEnabled));
      } catch (err) {
        raiseError(err.message || "Failed to load tenant ERP status");
      }
    })();
  }, [tenantInfo?.id, raiseError]);

  // ── Company codes (pehla active auto-select) ───────────────
  useEffect(() => {
    if (!tenantInfo?.id) return;
    (async () => {
      setLoadingCC(true);
      try {
        const list = asList(await apiCall(`/company-codes`));
        setCompanyCodes(list);
        const first = list.find((c) => c.status === "ACTIVE") || list[0];
        if (first) setSelectedCCId(String(first.id));
      } catch (err) {
        raiseError(err.message || "Failed to load company codes");
      } finally {
        setLoadingCC(false);
      }
    })();
  }, [tenantInfo?.id, raiseError]);

  // ── Plants (company code badalne par, pehla auto-select) ───
  useEffect(() => {
    setSelectedPlantId("");
    setPlants([]);
    if (!selectedCCId) return;
    let cancelled = false;
    (async () => {
      setLoadingPlants(true);
      try {
        const list = asList(await apiCall(`/plants?companyCodeId=${selectedCCId}`));
        if (cancelled) return;
        setPlants(list);
        if (list.length) setSelectedPlantId(String(list[0].id));
      } catch (err) {
        if (!cancelled) raiseError(err.message || "Failed to load plants");
      } finally {
        if (!cancelled) setLoadingPlants(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCCId, raiseError]);

  // ── Tree fetch ─────────────────────────────────────────────
  const fetchTree = useCallback(
    async ({ silent = false } = {}) => {
      if (!selectedPlantId) return;
      const reqId = ++reqRef.current;
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const [deptRes, catRes, dtRes] = await Promise.all([
          apiCall(`/departments/plant/${selectedPlantId}`),
          apiCall(`/categories`),
          apiCall(`/document-types`),
        ]);
        if (reqId !== reqRef.current) return;
        const depts = asList(deptRes);
        const cats = asList(catRes);
        const dts = asList(dtRes);

        const built = depts.map((dept) => {
          const catNodes = cats
            .filter((c) => c.departmentId === dept.id)
            .map((cat) => {
              const dtNodes = dts
                .filter((d) => d.categoryId === cat.id)
                .map((dt) => ({
                  id: `dt_${dt.id}`,
                  _id: dt.id,
                  name: dt.name,
                  type: NODE_TYPE.DOCUMENT_TYPE,
                  categoryId: cat.id,
                  children: [],
                  documents: docCount(dt),
                  ...metaOf(dt),
                }));
              return {
                id: `cat_${cat.id}`,
                _id: cat.id,
                name: cat.name,
                type: NODE_TYPE.CATEGORY,
                departmentId: dept.id,
                children: dtNodes,
                documents: dtNodes.reduce((s, n) => s + n.documents, 0),
                ...metaOf(cat),
              };
            });
          return {
            id: `dept_${dept.id}`,
            _id: dept.id,
            name: dept.name,
            type: NODE_TYPE.DEPARTMENT,
            children: catNodes,
            documents: catNodes.reduce((s, n) => s + n.documents, 0),
            ...metaOf(dept),
          };
        });

        const role = decodeToken()?.role;
        const unrestricted = role === "TenantAdmin" || role === "SuperAdmin";
        const finalTree = unrestricted ? built : built.filter((d) => d.children.length > 0);

        setTree(finalTree);

        const allIds = new Set();
        const withKids = [];
        const walk = (nodes) =>
          nodes.forEach((n) => {
            allIds.add(n.id);
            if (n.children.length) withKids.push(n.id);
            walk(n.children);
          });
        walk(finalTree);

        if (initRef.current) {
          initRef.current = false;
          setExpandedIds(new Set(withKids));
          setSelectedId(finalTree[0]?.id ?? null);
        } else {
          setSelectedId((prev) => (prev && allIds.has(prev) ? prev : (finalTree[0]?.id ?? null)));
        }
      } catch (err) {
        if (reqId === reqRef.current) raiseError(err.message || "Failed to load folder structure");
      } finally {
        if (reqId === reqRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [selectedPlantId, raiseError],
  );

  useEffect(() => {
    setSelectedId(null);
    setExpandedIds(new Set());
    setQuery("");
    setMenu(null);
    if (!selectedPlantId) {
      reqRef.current++;
      setTree([]);
      setLoading(false);
      return;
    }
    initRef.current = true;
    fetchTree();
  }, [selectedPlantId, fetchTree]);

  useEffect(() => setTab("children"), [selectedId]);

  // ── Derived ────────────────────────────────────────────────
  const index = useMemo(() => {
    const m = new Map();
    const walk = (nodes, parent) =>
      nodes.forEach((n) => {
        m.set(n.id, { node: n, parent });
        walk(n.children || [], n);
      });
    walk(tree, null);
    return m;
  }, [tree]);

  const sel = selectedId ? index.get(selectedId)?.node || null : null;
  const parentOf = (n) => index.get(n.id)?.parent || null;
  const selDept = !sel
    ? null
    : sel.type === NODE_TYPE.DEPARTMENT
      ? sel
      : sel.type === NODE_TYPE.CATEGORY
        ? parentOf(sel)
        : parentOf(parentOf(sel) || sel);
  const selCat = !sel ? null : sel.type === NODE_TYPE.CATEGORY ? sel : sel.type === NODE_TYPE.DOCUMENT_TYPE ? parentOf(sel) : null;

  const { viewTree, openIds } = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { viewTree: tree, openIds: null };
    const open = new Set();
    const f = (n) => {
      if (n.name.toLowerCase().includes(q)) return n;
      const kids = (n.children || []).map(f).filter(Boolean);
      if (!kids.length) return null;
      open.add(n.id);
      return { ...n, children: kids };
    };
    return { viewTree: tree.map(f).filter(Boolean), openIds: open };
  }, [tree, query]);

  const isExpanded = (id) => expandedIds.has(id) || (openIds ? openIds.has(id) : false);

  const canManageHierarchy = tenantInfo?.role === "TenantAdmin" && !erpEnabled;
  const canAddDepartment =
    tenantInfo?.role === "SuperAdmin" || (tenantInfo?.role === "TenantAdmin" && !erpEnabled);

  const plant = plants.find((p) => String(p.id) === String(selectedPlantId));

  // ── Tree interactions ──────────────────────────────────────
  const onToggle = useCallback((id) => {
    setExpandedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);
  const expandKey = useCallback((id) => {
    setExpandedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);
  const onSelect = useCallback(
    (node) => {
      setSelectedId(node.id);
      if (node.children?.length) expandKey(node.id);
    },
    [expandKey],
  );

  function expandAll() {
    const ids = [];
    const walk = (nodes) =>
      nodes.forEach((n) => {
        if (n.children.length) ids.push(n.id);
        walk(n.children);
      });
    walk(tree);
    setExpandedIds(new Set(ids));
  }

  // ── Menu ───────────────────────────────────────────────────
  function menuItemsFor(node) {
    const items = [];
    if (!canManageHierarchy) return items;
    if (node.type === NODE_TYPE.DEPARTMENT)
      items.push({ key: "addcat", label: `Add ${l2.toLowerCase()}`, icon: Plus, run: () => setModal({ kind: "add", type: NODE_TYPE.CATEGORY, parent: node }) });
    if (node.type === NODE_TYPE.CATEGORY)
      items.push({ key: "adddt", label: `Add ${l3.toLowerCase()}`, icon: Plus, run: () => setModal({ kind: "add", type: NODE_TYPE.DOCUMENT_TYPE, parent: node }) });
    if (node.type !== NODE_TYPE.DEPARTMENT) {
      items.push({ key: "rename", label: "Rename", icon: Pencil, run: () => setModal({ kind: "rename", node }) });
      items.push({ key: "delete", label: "Delete", icon: Trash2, danger: true, run: () => setModal({ kind: "delete", nodes: [node] }) });
    }
    return items;
  }

  function openMenu(e, node, src) {
    e.stopPropagation();
    if (menu?.src === src) return setMenu(null);
    const r = e.currentTarget.getBoundingClientRect();
    const h = menuItemsFor(node).length * 38 + 12;
    const top = r.bottom + 6 + h > window.innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6;
    setMenu({ node, src, top, left: Math.max(8, r.right - 192) });
  }

  useEffect(() => {
    if (!menu) return;
    const down = (e) => {
      if (e.target.closest?.("[data-fs-menu]") || e.target.closest?.("[data-fs-menu-btn]")) return;
      setMenu(null);
    };
    const close = () => setMenu(null);
    document.addEventListener("mousedown", down);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", down);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  // ── Mutations ──────────────────────────────────────────────
  async function createDepartment({ name, code }) {
    // 1) global department  2) tenant ko assign  3) selected plant se map
    const created = await apiCall(`/departments`, "POST", { name, code });
    const newId = created.data.id;
    await apiCall(`/departments/assign/${tenantInfo.id}`, "POST", { departmentIds: [newId] });
    await apiCall(`/departments/plant/${selectedPlantId}`, "POST", { departmentId: newId });
    await fetchTree({ silent: true });
    setSelectedId(`dept_${newId}`);
    showToast(`${l1} "${name}" created`);
  }

  async function createCategory(dept, { name }) {
    await apiCall(`/categories`, "POST", { name, departmentId: dept._id });
    await fetchTree({ silent: true });
    expandKey(dept.id);
    showToast(`${l2} "${name}" created`);
  }

  async function createDocType(cat, { name }) {
    await apiCall(`/document-types`, "POST", { name, categoryId: cat._id });
    await fetchTree({ silent: true });
    expandKey(cat.id);
    if (parentOf(cat)) expandKey(parentOf(cat).id);
    showToast(`${l3} "${name}" created`);
  }

  async function renameNode(node, name) {
    const path = node.type === NODE_TYPE.CATEGORY ? "categories" : "document-types";
    await apiCall(`/${path}/${node._id}`, "PUT", { name });
    await fetchTree({ silent: true });
    showToast(`${typeLabelFor(labels, node.type)} renamed`);
  }

  async function deleteNodes(nodes, done) {
    if (nodes.some((n) => n.id === selectedId)) setSelectedId(parentOf(nodes[0])?.id ?? null);
    const results = await Promise.allSettled(
      nodes.map((n) =>
        apiCall(`/${n.type === NODE_TYPE.CATEGORY ? "categories" : "document-types"}/${n._id}`, "DELETE"),
      ),
    );
    const failed = results.filter((r) => r.status === "rejected");
    await fetchTree({ silent: true });
    done?.();
    if (failed.length) throw new Error(failed[0].reason?.message || "Failed to delete");
    showToast(nodes.length === 1 ? `"${nodes[0].name}" deleted` : `${nodes.length} items deleted`);
  }

  const hasRowMenuFor = (node) => menuItemsFor(node).length > 0;

  const treeCtx = {
    selectedId,
    isExpanded,
    onSelect,
    onToggle,
    onMenu: openMenu,
    hasMenu: hasRowMenuFor,
    q: query,
  };

  // ── Right panel data ───────────────────────────────────────
  const chain = useMemo(() => {
    if (!sel) return [];
    const out = [];
    let cur = sel;
    while (cur) {
      out.unshift(cur);
      cur = index.get(cur.id)?.parent;
    }
    return out;
  }, [sel, index]);

  const tabs = sel
    ? sel.type === NODE_TYPE.DEPARTMENT
      ? [
          { id: "children", label: `${l2}s (${sel.children.length})` },
          { id: "details", label: `${l1} Details` },
        ]
      : sel.type === NODE_TYPE.CATEGORY
        ? [
            { id: "children", label: `${l3}s (${sel.children.length})` },
            { id: "details", label: `${l2} Details` },
          ]
        : [
            { id: "children", label: `Documents (${sel.documents})` },
            { id: "details", label: `${l3} Details` },
          ]
    : [];

  const addForSel =
    sel && canManageHierarchy
      ? sel.type === NODE_TYPE.DEPARTMENT
        ? { label: `Add ${l2}`, run: () => setModal({ kind: "add", type: NODE_TYPE.CATEGORY, parent: sel }) }
        : sel.type === NODE_TYPE.CATEGORY
          ? { label: `Add ${l3}`, run: () => setModal({ kind: "add", type: NODE_TYPE.DOCUMENT_TYPE, parent: sel }) }
          : null
      : null;

  function infoFor(n) {
    const common = [
      { icon: AlignLeft, k: "Description", v: n.description },
      { icon: CalendarDays, k: "Created On", v: fmtDateTime(n.createdAt) },
      { icon: User, k: "Created By", v: n.createdBy },
      { icon: Clock, k: "Last Updated", v: fmtDateTime(n.updatedAt) },
    ];
    const status = { icon: CheckCircle2, k: "Status", v: <StatusBadge status={n.status} /> };
    const docs = { icon: FileText, k: "Total Documents", v: n.documents };
    if (n.type === NODE_TYPE.DEPARTMENT) {
      return {
        title: `${l1} Information`,
        rows: [
          { icon: Folder, k: `${l1} Name`, v: n.name },
          { icon: Building2, k: "Plant", v: plant?.name },
          { icon: FileText, k: "Code", v: n.code },
          ...common,
        ],
        side: [status, { icon: Layers, k: `${l2}s`, v: n.children.length }, docs],
      };
    }
    if (n.type === NODE_TYPE.CATEGORY) {
      return {
        title: `${l2} Information`,
        rows: [
          { icon: Folder, k: `${l2} Name`, v: n.name },
          { icon: Building2, k: l1, v: parentOf(n)?.name },
          ...common,
        ],
        side: [status, { icon: Layers, k: `${l3}s`, v: n.children.length }, docs],
      };
    }
    const cat = parentOf(n);
    return {
      title: `${l3} Information`,
      rows: [
        { icon: FileText, k: `${l3} Name`, v: n.name },
        { icon: FileText, k: "Code", v: n.code },
        { icon: Folder, k: l2, v: cat?.name },
        { icon: Building2, k: l1, v: cat ? parentOf(cat)?.name : "" },
        ...common,
      ],
      side: [status, { icon: FileText, k: "Documents", v: n.documents }],
    };
  }

  const selInfo = sel ? infoFor(sel) : null;
  const headerMenuItems = sel ? menuItemsFor(sel) : [];
  const typeLabel = sel ? typeLabelFor(labels, sel.type) : "";

  // ═════════ RENDER ═════════
  return (
    <div className="fs-root">
      <style>{ANIM_CSS}</style>

      {/* ── Page header ── */}
      {showHeader && (
        <div className="fs-fade-up flex items-start justify-between gap-4 mb-6">
          <div>
            <nav className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400 mb-3">
              <Home className="w-4 h-4 text-[#0D6EFD]" />
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span>Organization</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span className="font-semibold text-slate-800 dark:text-slate-100">Folder Repository</span>
            </nav>
            <h1 className="flex items-center gap-3 text-[28px] leading-tight font-bold text-slate-900 dark:text-slate-50">
              Folder Structure
              <FileText className="w-6 h-6 text-[#0D6EFD]" />
            </h1>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1.5">
              {l1} → {l2} → {l3}
            </p>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="fs-press flex-shrink-0 flex items-center gap-2 bg-white dark:bg-[#1A2433] border border-slate-200/70 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-[#0D6EFD] shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <HelpCircle className="w-4 h-4" /> Help &amp; Guide
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-5 items-stretch">
        {/* ═══════════ LEFT: Tree ═══════════ */}
        <Card className="fs-fade-up flex flex-col min-h-[640px] overflow-hidden" style={{ animationDelay: "60ms" }}>
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-3 mb-4">
              <FolderTree className="w-[18px] h-[18px] text-slate-700 dark:text-slate-200" />
              <h2 className="text-[17px] font-bold text-slate-900 dark:text-slate-50">Folder Structure</h2>
              {!loading && !error && selectedPlantId && (
                <span className="fs-pop text-[12px] font-semibold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-full px-3 py-1">
                  {tree.length} {l1}
                  {tree.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[12.5px] text-slate-500 dark:text-slate-400 mb-1.5">Company Code</label>
                <div className="relative">
                  <select
                    value={selectedCCId}
                    onChange={(e) => setSelectedCCId(e.target.value)}
                    disabled={loadingCC}
                    className={selectCls}
                  >
                    <option value="">{loadingCC ? "Loading…" : "Select"}</option>
                    {companyCodes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} · {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[12.5px] text-slate-500 dark:text-slate-400 mb-1.5">Plant</label>
                <div className="relative">
                  <select
                    value={selectedPlantId}
                    onChange={(e) => setSelectedPlantId(e.target.value)}
                    disabled={!selectedCCId || loadingPlants}
                    className={selectCls}
                  >
                    <option value="">{loadingPlants ? "Loading…" : "Select"}</option>
                    {plants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} · {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${l2.toLowerCase()}s & ${l3.toLowerCase()}s...`}
                  className="w-full text-[13px] pl-10 pr-9 py-[11px] border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-[#0D6EFD] focus:ring-2 focus:ring-blue-500/15 transition placeholder-slate-400 dark:placeholder-slate-600"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <ExpandMenu onExpandAll={expandAll} onCollapseAll={() => setExpandedIds(new Set())} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canAddDepartment && (
                <button
                  onClick={() => setModal({ kind: "add", type: NODE_TYPE.DEPARTMENT })}
                  disabled={!selectedPlantId}
                  className="fs-press flex items-center gap-1.5 bg-[#0D6EFD] hover:bg-[#0B5ED7] disabled:opacity-40 text-white text-[13px] font-semibold rounded-lg px-4 py-2.5 shadow-[0_4px_12px_rgba(13,110,253,0.3)] hover:shadow-[0_6px_16px_rgba(13,110,253,0.4)]"
                >
                  <Plus className="w-4 h-4" /> Add {l1}
                </button>
              )}
              {canManageHierarchy && (
                <>
                  <button
                    onClick={() => selDept && setModal({ kind: "add", type: NODE_TYPE.CATEGORY, parent: selDept })}
                    disabled={!selDept}
                    title={selDept ? `Add ${l2.toLowerCase()} to ${selDept.name}` : `Select a ${l1.toLowerCase()} first`}
                    className="fs-press flex items-center gap-1.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-transparent text-slate-700 dark:text-slate-200 text-[13px] font-semibold rounded-lg px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <Plus className="w-4 h-4" /> Add {l2}
                  </button>
                  <button
                    onClick={() => selCat && setModal({ kind: "add", type: NODE_TYPE.DOCUMENT_TYPE, parent: selCat })}
                    disabled={!selCat}
                    title={selCat ? `Add ${l3.toLowerCase()} to ${selCat.name}` : `Select a ${l2.toLowerCase()} first`}
                    className="fs-press flex items-center gap-1.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-transparent text-slate-700 dark:text-slate-200 text-[13px] font-semibold rounded-lg px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <Plus className="w-4 h-4" /> Add {l3}
                  </button>
                </>
              )}
              <button
                onClick={() => fetchTree({ silent: true })}
                disabled={!selectedPlantId || loading || refreshing}
                title="Refresh"
                className="fs-press ml-auto w-[42px] h-[42px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#1A2433] text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing || loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 px-3 pb-3 overflow-y-auto max-h-[640px] border-t border-slate-100 dark:border-slate-700 pt-3">
            {!selectedPlantId && !loadingCC && !loadingPlants && (
              <div className="fs-fade-up flex flex-col items-center gap-2.5 text-center py-16 px-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-700/30 flex items-center justify-center fs-float">
                  <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                  {!selectedCCId ? "Select a Company Code to begin" : plants.length === 0 ? "No plants under this company code" : `Select a Plant to view its ${l1.toLowerCase()}s`}
                </p>
                <p className="text-[11.5px] text-slate-400 dark:text-slate-500 max-w-[280px]">
                  {l1}s, {l2.toLowerCase()}s and {l3.toLowerCase()}s are scoped to a Plant. No Company Codes yet? Create one from the "Company Codes" page.
                </p>
              </div>
            )}

            {selectedPlantId && loading && <TreeSkeleton />}

            {selectedPlantId && !loading && error && !tree.length && (
              <div className="fs-fade-up flex flex-col items-center gap-3 mx-4 mt-6 text-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <p className="text-[12px] font-semibold text-red-500">{error}</p>
                <button
                  onClick={() => fetchTree()}
                  className="fs-press flex items-center gap-1.5 text-[12px] font-semibold text-[#0D6EFD] border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Try again
                </button>
              </div>
            )}

            {selectedPlantId && !loading && !(error && !tree.length) && (
              <>
                {tree.length === 0 ? (
                  <div className="fs-fade-up flex flex-col items-center gap-2.5 text-center py-14">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-700/30 flex items-center justify-center">
                      <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                      No {l1.toLowerCase()}s in this plant yet
                    </p>
                    {canAddDepartment && (
                      <p className="text-[11.5px] text-slate-400 dark:text-slate-500 max-w-[240px]">
                        Use <span className="font-semibold">Add {l1}</span> above to create the first one.
                      </p>
                    )}
                  </div>
                ) : viewTree.length === 0 ? (
                  <div className="fs-fade-up flex flex-col items-center gap-2 text-center py-14">
                    <Search className="w-7 h-7 text-slate-300 dark:text-slate-700" />
                    <p className="text-[12.5px] font-medium text-slate-400">No matches for "{query}"</p>
                  </div>
                ) : (
                  viewTree.map((node, i) => <TreeNode key={node.id} node={node} depth={0} index={i} ctx={treeCtx} />)
                )}
              </>
            )}
          </div>

          {!loading && tree.length > 0 && (
            <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40">
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3 h-3 flex-shrink-0" />
                {l1}s are assigned by a SuperAdmin · use ⋮ on a row to add or edit
              </p>
            </div>
          )}
        </Card>

        {/* ═══════════ RIGHT: Folder contents ═══════════ */}
        <Card className="fs-fade-up flex flex-col min-h-[640px] overflow-hidden" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <FolderOpen className="w-5 h-5 text-slate-600 dark:text-slate-300 flex-shrink-0" strokeWidth={1.75} />
              <h3 className="text-[18px] font-bold text-slate-900 dark:text-slate-50 truncate">Folder Contents</h3>
            </div>
            {sel && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {canManageHierarchy && sel.type !== NODE_TYPE.DEPARTMENT && (
                  <button
                    onClick={() => setModal({ kind: "rename", node: sel })}
                    className="fs-press flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-transparent text-[13px] font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:-translate-y-0.5"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit {typeLabel}
                  </button>
                )}
                {headerMenuItems.length > 0 && (
                  <button
                    data-fs-menu-btn
                    onClick={(e) => openMenu(e, sel, "header")}
                    className="fs-press w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {loading && selectedPlantId ? (
            <div className="p-6 space-y-5">
              <div className="fs-skel h-[110px] rounded-2xl" />
              <div className="fs-skel h-10 w-2/3 rounded-xl" />
              <div className="fs-skel h-[200px] rounded-2xl" />
            </div>
          ) : !sel ? (
            <div className="fs-fade-up flex-1 flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-700/30 flex items-center justify-center fs-float">
                <FolderOpen className="w-9 h-9 text-slate-300 dark:text-slate-600" strokeWidth={1.75} />
              </div>
              <p className="text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">Select a folder on the left</p>
              <p className="text-[12px] text-slate-400 dark:text-slate-500">
                {l1} → {l2} → {l3}
              </p>
            </div>
          ) : (
            <div key={sel.id} className="fs-swap flex-1 overflow-y-auto">
              {/* Summary */}
              <div className="mx-6 mt-5 rounded-2xl bg-slate-50/80 dark:bg-[#151E2B] border border-slate-100 dark:border-slate-700 p-5 flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-[72px] h-[72px] rounded-xl flex items-center justify-center flex-shrink-0 ${
                      sel.type === NODE_TYPE.CATEGORY ? "bg-amber-50 dark:bg-amber-900/20" : "bg-blue-50 dark:bg-blue-900/20"
                    }`}
                  >
                    {sel.type === NODE_TYPE.CATEGORY ? (
                      <Folder className="w-9 h-9 text-amber-500" fill="#FDE68A" strokeWidth={1.6} />
                    ) : sel.type === NODE_TYPE.DOCUMENT_TYPE ? (
                      <FileText className="w-9 h-9 text-[#0D6EFD]" strokeWidth={1.6} />
                    ) : (
                      <FolderOpen className="w-9 h-9 text-[#0D6EFD]" strokeWidth={1.6} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 truncate">{sel.name}</h4>
                      <StatusBadge status={sel.status} />
                    </div>
                    <div className="flex items-center flex-wrap gap-1.5 mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">
                      <Folder className="w-3.5 h-3.5" />
                      {chain.map((n, i) => (
                        <span key={n.id} className="flex items-center gap-1.5">
                          {i > 0 && <ChevronRight className="w-3 h-3 opacity-60" />}
                          <button
                            onClick={() => n.id !== sel.id && setSelectedId(n.id)}
                            className={n.id === sel.id ? "font-medium text-slate-700 dark:text-slate-200" : "hover:text-[#0D6EFD] transition-colors"}
                          >
                            {n.name}
                          </button>
                        </span>
                      ))}
                    </div>
                    {sel.description && (
                      <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5">{sel.description}</p>
                    )}
                  </div>
                </div>

                <div className="relative rounded-xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 px-5 py-4 flex items-center gap-4 min-w-[210px]">
                  <div className="w-11 h-11 rounded-lg bg-white dark:bg-[#1A2433] border border-blue-100 dark:border-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#0D6EFD]" />
                  </div>
                  <div>
                    <div className="text-[12px] text-slate-500 dark:text-slate-400">Total Documents</div>
                    <div className="text-[30px] leading-tight font-bold text-slate-900 dark:text-slate-50">
                      <CountUp key={sel.id} value={sel.documents} />
                    </div>
                  </div>
                  <BarChart3 className="absolute right-3 bottom-3 w-4 h-4 text-[#0D6EFD]" />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center justify-between gap-3 px-6 mt-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {tabs.map((t) => {
                    const on = tab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`relative px-3 py-3.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors ${
                          on ? "text-[#0D6EFD]" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                        }`}
                      >
                        {t.label}
                        <span
                          className="absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#0D6EFD] origin-center transition-transform duration-300"
                          style={{ transform: on ? "scaleX(1)" : "scaleX(0)" }}
                        />
                      </button>
                    );
                  })}
                </div>
                {addForSel && (
                  <button
                    onClick={addForSel.run}
                    className="fs-press mb-2 flex-shrink-0 flex items-center gap-1.5 bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[13px] font-semibold rounded-lg px-4 py-2.5 shadow-[0_4px_12px_rgba(13,110,253,0.3)]"
                  >
                    <Plus className="w-4 h-4" /> {addForSel.label}
                  </button>
                )}
              </div>

              <div key={`${sel.id}-${tab}`} className="fs-fade-in pt-5">
                {tab === "children" && (
                  <>
                    {sel.type === NODE_TYPE.DOCUMENT_TYPE ? (
                      <DocumentsEmpty />
                    ) : (
                      <ChildrenTable
                        key={sel.id}
                        rows={sel.children}
                        emptyText={`No ${(sel.type === NODE_TYPE.DEPARTMENT ? l2 : l3).toLowerCase()}s yet`}
                        onAddEmpty={addForSel?.run}
                        addLabel={addForSel?.label}
                        canManage={canManageHierarchy}
                        hasRowMenu={canManageHierarchy ? hasRowMenuFor : null}
                        onOpen={(r) => onSelect(r)}
                        onMenu={openMenu}
                        onBulkDelete={(nodes, done) => setModal({ kind: "delete", nodes, done })}
                      />
                    )}
                    <div className="mt-6" />
                  </>
                )}
                <InfoSection title={selInfo.title} rows={selInfo.rows} side={selInfo.side} />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Floating row menu (fixed, tree clipping se bachne ke liye) ── */}
      {menu && (
        <div
          data-fs-menu
          style={{ top: menu.top, left: menu.left }}
          className="fs-menu-in fixed z-[70] w-48 bg-white dark:bg-[#232F40] border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl py-1"
        >
          {menuItemsFor(menu.node).map((it) => (
            <button
              key={it.key}
              onClick={() => {
                setMenu(null);
                it.run();
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium transition-colors ${
                it.danger
                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <it.icon className="w-3.5 h-3.5" /> {it.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {showGuide && <GuideModal labels={labels} onClose={() => setShowGuide(false)} />}

      {modal?.kind === "add" && (
        <AddNodeModal
          type={modal.type}
          labels={labels}
          context={
            modal.type === NODE_TYPE.DEPARTMENT
              ? plant
                ? `in ${plant.name} (${plant.code})`
                : undefined
              : `in ${modal.parent.name}`
          }
          onSubmit={(vals) =>
            modal.type === NODE_TYPE.DEPARTMENT
              ? createDepartment(vals)
              : modal.type === NODE_TYPE.CATEGORY
                ? createCategory(modal.parent, vals)
                : createDocType(modal.parent, vals)
          }
          onClose={() => setModal(null)}
        />
      )}

      {modal?.kind === "rename" && (
        <RenameModal
          node={modal.node}
          labels={labels}
          onSubmit={(name) => renameNode(modal.node, name)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.kind === "delete" && (
        <DeleteModal
          nodes={modal.nodes}
          labels={labels}
          onConfirm={() => deleteNodes(modal.nodes, modal.done)}
          onClose={() => setModal(null)}
        />
      )}

      {toast && <Toast toast={toast} onClose={closeToast} />}
    </div>
  );
}