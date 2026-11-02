import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Folder,
  FileText,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  HelpCircle,
  Search,
  X,
  UploadCloud,
  ScanLine,
  ClipboardCheck,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pencil,
  Eye,
  MoreVertical,
  Trash2,
  Archive,
  Play,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileSearch,
  History,
  Zap,
  FilePlus,
  Check,
  FolderOpen,
  Info,
} from "lucide-react";

import { API_BASE_URL } from "../../services/apiClient";
import * as metadataApi from "../../features/metadataEngine/api";
import FieldRenderer from "../../features/metadataEngine/components/FieldRenderer";
import { confidenceColor, confidenceLabel } from "../../features/metadataEngine/fieldTypes";

const API = API_BASE_URL;

function getToken() { return localStorage.getItem("accessToken") || ""; }
function authHeaders() { return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }; }
function decodeToken() {
  try { const t = getToken(); if (!t) return null; return JSON.parse(atob(t.split(".")[1])); } catch { return null; }
}

/* ────────────────────────── constants ────────────────────────── */

const STEPS = [
  { label: "Hierarchy", hint: "Select location", icon: Building2 },
  { label: "Upload", hint: "Add document", icon: FileText },
  { label: "OCR Processing", hint: "Extract data", icon: ScanLine },
  { label: "OCR Review", hint: "Verify information", icon: ClipboardCheck },
  { label: "ERP Archive", hint: "Send to ERP", icon: Database },
];

const ACCEPT = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"];
const MAX_MB = 50;
const DOC_PAGE_SIZE = 5;

const LOG_COLOR = { SUCCESS: "#4ADE80", PROCESSING: "#FBBF24", FAILED: "#F87171", INFO: "#7DA8FF" };

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-app-md bg-brand-500 px-5 h-10 text-[13px] font-semibold text-white transition duration-200 hover:brightness-110 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 h-10 text-[13px] font-semibold text-[var(--text-primary)] transition duration-200 hover:border-brand-300 hover:text-brand-500 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--border-subtle)] disabled:hover:text-[var(--text-primary)]";
const BTN_DANGER =
  "inline-flex items-center justify-center gap-2 rounded-app-md border border-danger-500/30 bg-danger-50 px-4 h-10 text-[13px] font-semibold text-danger-500 transition duration-200 hover:bg-danger-500 hover:text-white active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-danger-50 disabled:hover:text-danger-500 dark:bg-danger-500/15";

/* ────────────────────────── motion (scoped, prefixed `uw-`) ────────────────────────── */

const LOCAL_CSS = `
@keyframes uw-fade-down{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@keyframes uw-rise{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
@keyframes uw-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes uw-row-in{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
@keyframes uw-chip{from{opacity:0;transform:scale(.85) translateY(4px)}to{opacity:1;transform:none}}
@keyframes uw-pop{from{opacity:0;transform:scale(.94) translateY(-4px)}to{opacity:1;transform:none}}
@keyframes uw-modal{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
@keyframes uw-backdrop{from{opacity:0}to{opacity:1}}
@keyframes uw-toast{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
@keyframes uw-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes uw-ring{0%{box-shadow:0 0 0 0 rgba(10,110,209,.45)}70%{box-shadow:0 0 0 11px rgba(10,110,209,0)}100%{box-shadow:0 0 0 0 rgba(10,110,209,0)}}
@keyframes uw-glow{0%{box-shadow:0 0 0 0 rgba(10,110,209,.4)}100%{box-shadow:0 0 0 16px rgba(10,110,209,0)}}
@keyframes uw-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes uw-dot{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes uw-success{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
.uw-head{animation:uw-fade-down .45s cubic-bezier(.2,.8,.2,1) both}
.uw-rise{animation:uw-rise .5s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*80ms)}
.uw-fade{animation:uw-fade .35s ease-out both;animation-delay:calc(var(--i,0)*45ms)}
.uw-row{animation:uw-row-in .4s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*50ms)}
.uw-chip{animation:uw-chip .3s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*60ms)}
.uw-pop{animation:uw-pop .16s ease-out both;transform-origin:top right}
.uw-modal{animation:uw-modal .25s cubic-bezier(.2,.8,.2,1) both}
.uw-backdrop{animation:uw-backdrop .2s ease-out both}
.uw-toast{animation:uw-toast .3s cubic-bezier(.2,.8,.2,1) both}
.uw-float{animation:uw-float 3.2s ease-in-out infinite}
.uw-ring{animation:uw-ring 2s ease-out infinite}
.uw-glow{animation:uw-glow 1.1s ease-out 1}
.uw-dot{animation:uw-dot 1.2s ease-in-out infinite}
.uw-success{animation:uw-success .6s cubic-bezier(.2,.8,.2,1) both}
.uw-skel{background:linear-gradient(90deg,var(--surface-sunken) 25%,rgba(148,163,184,.28) 50%,var(--surface-sunken) 75%);background-size:200% 100%;animation:uw-shimmer 1.4s linear infinite}
@media (prefers-reduced-motion:reduce){
  .uw-head,.uw-rise,.uw-fade,.uw-row,.uw-chip,.uw-pop,.uw-modal,.uw-backdrop,.uw-toast,.uw-float,.uw-ring,.uw-glow,.uw-dot,.uw-success,.uw-skel{animation:none!important}
}
`;

/* ────────────────────────── helpers ────────────────────────── */

function formatBytes(n) {
  if (n == null || isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function stamp(ms) {
  if (!ms) return "—";
  const d = new Date(ms);
  if (isNaN(d)) return "—";
  return `${d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
}

function fileKind(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf") return { label: "PDF", bg: "bg-red-500" };
  if (ext === "doc" || ext === "docx") return { label: "DOC", bg: "bg-blue-600" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { label: "XLS", bg: "bg-emerald-600" };
  if (["jpg", "jpeg", "png"].includes(ext)) return { label: "IMG", bg: "bg-violet-500" };
  return { label: "FILE", bg: "bg-slate-500" };
}

function mapStatus(raw) {
  const s = String(raw || "").toUpperCase();
  if (["OCR_COMPLETED", "COMPLETED", "WAITING_FOR_APPROVAL", "APPROVED"].includes(s)) return "Completed";
  if (s === "FAILED") return "Failed";
  if (["PROCESSING", "OCR_PROCESSING", "UPLOADED", "IN_PROGRESS"].includes(s)) return "Processing";
  return "Pending";
}

function normalizeDoc(d) {
  const t = new Date(d.createdAt || d.uploadedAt || d.created_at || Date.now()).getTime();
  return {
    id: d.id ?? d.documentId,
    name: d.fileName || d.originalName || d.name || "Untitled",
    size: d.size ?? d.fileSize ?? null,
    uploadedAt: isNaN(t) ? null : t,
    status: mapStatus(d.status || d.ocrStatus),
  };
}

function pageList(total, cur) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, cur, cur - 1, cur + 1]);
  const arr = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  arr.forEach((n, i) => {
    if (i && n - arr[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

/* ────────────────────────── small building blocks ────────────────────────── */

function Stepper({ current }) {
  const last = STEPS.length - 1;
  const pct = Math.min(100, (Math.min(current, last) / last) * 100 + (current < last ? 7 : 0));
  return (
    <div className="uw-rise rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] px-6 py-5">
      <div className="relative flex">
        <div className="absolute top-[18px] h-[3px] overflow-hidden rounded-full bg-[var(--surface-sunken)]" style={{ left: "10%", right: "10%" }}>
          <div className="h-full rounded-full bg-brand-500 transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
        </div>
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const Icon = s.icon;
          return (
            <div key={s.label} className="relative z-10 flex flex-1 flex-col items-center gap-2 text-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500 ${
                  done
                    ? "border-success-500 bg-success-500 text-white"
                    : active
                    ? "uw-ring border-brand-500 bg-brand-500 text-white"
                    : "border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-tertiary)]"
                }`}
              >
                {done ? <Check key="c" className="uw-success h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div>
                <p className={`text-[13px] font-semibold transition-colors duration-300 ${active ? "text-brand-500" : "text-[var(--text-primary)]"}`}>
                  {i + 1}. {s.label}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">{s.hint}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Collapse({ open, children }) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-out ${
        open ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function TreeRow({ depth, icon, label, open, hasChildren, active, onClick, onToggle, index = 0 }) {
  return (
    <div className="uw-fade" style={{ paddingLeft: depth * 22, "--i": Math.min(index, 8) }}>
      <div
        role="treeitem"
        aria-selected={active}
        aria-expanded={hasChildren ? open : undefined}
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
        }}
        className={`flex cursor-pointer items-center gap-2 rounded-app-md px-2 py-1.5 text-[13px] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
          active
            ? "bg-brand-500/10 font-semibold text-[var(--text-primary)]"
            : "text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]"
        }`}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? "Collapse" : "Expand"}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-sunken)] ${hasChildren ? "" : "invisible"}`}
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? "" : "-rotate-90"}`} />
        </button>
        {icon}
        <span className="min-w-0 truncate">{label}</span>
      </div>
    </div>
  );
}

function TreeSkeleton({ depth }) {
  return (
    <div className="space-y-2 py-1.5" style={{ paddingLeft: depth * 22 + 8 }}>
      {[70, 55, 62].map((w, i) => (
        <div key={i} className="uw-skel h-6 rounded-app-md" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

function TreeNote({ depth, children }) {
  return (
    <p className="py-2 text-xs text-[var(--text-tertiary)]" style={{ paddingLeft: depth * 22 + 8 }}>
      {children}
    </p>
  );
}

function SectionTitle({ title, sub, icon: Icon, action }) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-app-md bg-brand-500/10 text-brand-500">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">{sub}</p>
      </div>
      {action}
    </div>
  );
}

function PanelLabel({ icon: Icon, text }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[var(--text-tertiary)]">
      <Icon className="h-3.5 w-3.5 text-brand-500" /> {text}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}

function StatusPill({ status }) {
  const map = {
    Completed: { cls: "bg-success-50 text-success-500 dark:bg-success-500/15", dot: "bg-success-500" },
    Processing: { cls: "bg-brand-500/10 text-brand-500", dot: "bg-brand-500 uw-dot" },
    Pending: { cls: "bg-[var(--surface-sunken)] text-[var(--text-secondary)]", dot: "bg-slate-400" },
    Failed: { cls: "bg-danger-50 text-danger-500 dark:bg-danger-500/15", dot: "bg-danger-500" },
  };
  const m = map[status] || map.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {status}
    </span>
  );
}

function FileBadge({ name }) {
  const k = fileKind(name);
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[8px] font-bold tracking-tight text-white ${k.bg}`}>
      {k.label}
    </span>
  );
}

function PageButton({ children, active, disabled, onClick, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 min-w-[36px] items-center justify-center rounded-app-md border px-2 text-[13px] font-medium transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-brand-500 bg-brand-500 text-white shadow-app-sm"
          : "border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-brand-300 hover:text-brand-500"
      }`}
    >
      {children}
    </button>
  );
}

/* ────────────────────────── terminal + preview ────────────────────────── */

function ActivityTerminal({ logs, polling, compact }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [logs]);
  return (
    <div className="overflow-hidden rounded-app-lg border border-[#1B3358] bg-[#0B1F3A] font-mono">
      <div className="flex items-center gap-2 border-b border-[#1B3358] bg-[#0F2947] px-3.5 py-2">
        <History className="h-3 w-3 text-[#6C86A8]" />
        <span className="text-[11px] tracking-wide text-[#8FA6C4]">pipeline · activity</span>
        {polling && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-[#4ADE80]">
            <span className="uw-dot h-1.5 w-1.5 rounded-full bg-[#4ADE80]" /> LIVE
          </span>
        )}
      </div>
      <div className={`overflow-y-auto px-4 py-3 ${compact ? "max-h-40 min-h-[90px]" : "max-h-56 min-h-[140px]"}`}>
        {logs.length === 0 && <span className="text-xs text-[#4B6485]">Waiting for activity…</span>}
        {logs.map((log, i) => {
          const st = log.status || "INFO";
          const ts = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "";
          return (
            <div key={i} className="uw-fade flex gap-2.5 text-xs leading-7" style={{ color: LOG_COLOR[st] || "#94a3b8" }}>
              <span className="mt-0.5 min-w-[68px] text-[10px] text-[#4B6485]">{ts}</span>
              <span>{log.message}</span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function PreviewBtn({ onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-md bg-[#1B3358] text-[#8FA6C4] transition hover:bg-[#25447a] hover:text-white active:scale-95"
    >
      {children}
    </button>
  );
}

function DocumentPreview({ file, fileName }) {
  const [objUrl, setObjUrl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  const isPdf = fileName?.toLowerCase().endsWith(".pdf");
  const isImage = /\.(png|jpe?g)$/i.test(fileName || "");

  useEffect(() => {
    if (!file) { setObjUrl(null); return; }
    const url = URL.createObjectURL(file);
    setObjUrl(url);
    setZoom(1); setRotate(0);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file || !objUrl) {
    return (
      <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2.5 rounded-app-lg bg-[#0B1F3A] text-[#4B6485]">
        <FileSearch className="h-7 w-7" />
        <span className="text-xs">No preview available</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-app-lg bg-[#0B1F3A]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#1B3358] bg-[#0F2947] px-3 py-2">
        <span className="max-w-[42%] truncate font-mono text-[11px] text-[#8FA6C4]">{fileName}</span>
        <div className="flex gap-1">
          {isImage && (
            <>
              <PreviewBtn onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} title="Zoom out"><ZoomOut className="h-3.5 w-3.5" /></PreviewBtn>
              <PreviewBtn onClick={() => setZoom((z) => Math.min(3, z + 0.25))} title="Zoom in"><ZoomIn className="h-3.5 w-3.5" /></PreviewBtn>
              <PreviewBtn onClick={() => setRotate((r) => (r + 90) % 360)} title="Rotate"><RotateCw className="h-3.5 w-3.5" /></PreviewBtn>
            </>
          )}
          <a
            href={objUrl}
            download={fileName}
            title="Download"
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-md bg-[#1B3358] text-[#8FA6C4] transition hover:bg-[#25447a] hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-3">
        {isPdf ? (
          <iframe src={objUrl} title="Document Preview" className="h-full w-full rounded-md border-0 bg-white" />
        ) : isImage ? (
          <img
            src={objUrl}
            alt="Document Preview"
            className="max-h-full max-w-full rounded-md object-contain shadow-2xl transition-transform duration-200"
            style={{ transform: `scale(${zoom}) rotate(${rotate}deg)` }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-center text-[#8FA6C4]">
            <FileText className="h-8 w-8" />
            <span className="text-xs">Preview isn't available for this file type.</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────── overlays ────────────────────────── */

function ModalShell({ open, onClose, title, icon: Icon, children, footer, maxW = "max-w-md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div
      onClick={onClose}
      className="uw-backdrop fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-[2px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`uw-modal w-full ${maxW} overflow-hidden rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-app-md bg-brand-500 text-white">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <span className="text-[15px] font-bold text-[var(--text-primary)]">{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-app-sm p-1.5 text-[var(--text-tertiary)] transition hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

function GuideModal({ open, onClose }) {
  const steps = [
    { title: "Resolve the hierarchy", desc: "Choose a Company Code, then expand the tree to pick a Plant, Department, Category and Document Type." },
    { title: "Upload files", desc: "Drag & drop files into the upload area, or click Choose Files. PDF, DOC, DOCX, XLS, XLSX, JPG and PNG up to 50 MB are supported." },
    { title: "OCR processing", desc: "Each file is scanned automatically. Watch the live activity log for progress." },
    { title: "Review extracted fields", desc: "Check the extracted fields next to the document preview. Dots show confidence: green is high, amber is mid, red is low." },
    { title: "Generate DMSCode & archive", desc: "Generate the DMSCode, review the summary, then save to archive. If approval is required it routes automatically." },
    { title: "Manage uploaded documents", desc: "Tick documents in the list to process, archive or delete them. Use the row actions to preview or reopen a document." },
  ];
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Upload & Manage — Guide"
      icon={Info}
      footer={<button type="button" onClick={onClose} className={BTN_PRIMARY}>Got it</button>}
    >
      <div className="space-y-4">
        {steps.map((s, i) => (
          <div key={s.title} className="uw-fade flex gap-3" style={{ "--i": i }}>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-[11px] font-bold text-brand-500">
              {i + 1}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">{s.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-tertiary)]">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function Toast({ notice }) {
  if (!notice) return null;
  const tone = {
    success: "border-success-500/30 bg-success-50 text-success-500",
    error: "border-danger-500/30 bg-danger-50 text-danger-500",
    info: "border-brand-500/30 bg-[var(--surface-card)] text-brand-500",
  }[notice.tone || "info"];
  const Icon = notice.tone === "error" ? AlertCircle : notice.tone === "success" ? CheckCircle2 : Info;
  return createPortal(
    <div key={notice.id} className={`uw-toast fixed bottom-6 right-6 z-[1100] flex max-w-sm items-start gap-2.5 rounded-app-md border px-4 py-3 text-[13px] font-medium shadow-xl ${tone}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{notice.text}</span>
    </div>,
    document.body,
  );
}

/* ────────────────────────── row menu (portal) ────────────────────────── */

function DocMenu({ doc, onOpen, onPreview, onDelete }) {
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const open = !!pos;

  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function toggle(e) {
    e.stopPropagation();
    if (open) return setPos(null);
    const r = btnRef.current.getBoundingClientRect();
    const up = r.bottom + 150 > window.innerHeight;
    setPos({ right: window.innerWidth - r.right, ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }) });
  }

  const item = "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
        className={`rounded-app-sm p-1.5 transition-colors active:scale-95 ${open ? "bg-brand-500/10 text-brand-500" : "text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]"}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", ...pos }}
            className="uw-pop z-[1000] w-44 overflow-hidden rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-card)] py-1 shadow-xl"
          >
            <button role="menuitem" className={`${item} text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]`} onClick={() => (setPos(null), onOpen())}>
              <FileSearch className="h-3.5 w-3.5" /> Open OCR review
            </button>
            <button role="menuitem" disabled={!doc.file} className={`${item} text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]`} onClick={() => (setPos(null), onPreview())}>
              <Eye className="h-3.5 w-3.5" /> Preview
            </button>
            <div className="my-1 border-t border-[var(--border-subtle)]" />
            <button role="menuitem" className={`${item} text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/15`} onClick={() => (setPos(null), onDelete())}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

/* ────────────────────────── uploaded documents card ────────────────────────── */

function DocumentsCard({
  docs, loading, checked, onToggle, onToggleAll, page, onPage,
  onProcess, onArchive, onDeleteSelected, onDeleteOne, onPreview, onOpen,
}) {
  const totalPages = Math.max(1, Math.ceil(docs.length / DOC_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * DOC_PAGE_SIZE;
  const rows = docs.slice(start, start + DOC_PAGE_SIZE);
  const ids = rows.map((d) => d.id);
  const checkedOnPage = ids.filter((id) => checked.has(id)).length;
  const allOnPage = ids.length > 0 && checkedOnPage === ids.length;
  const headRef = useRef(null);
  const none = checked.size === 0;

  useEffect(() => {
    if (headRef.current) headRef.current.indeterminate = checkedOnPage > 0 && !allOnPage;
  }, [checkedOnPage, allOnPage]);

  return (
    <section className="uw-rise rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4" style={{ "--i": 3 }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-app-md bg-brand-500/10 text-brand-500">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Uploaded Documents ({docs.length})</h3>
            <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">Manage, view OCR status and process documents.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={BTN_SECONDARY} disabled={none} onClick={onProcess}>
            <Play className="h-4 w-4" /> Process Selected
          </button>
          <button type="button" className={BTN_SECONDARY} disabled={none} onClick={onArchive}>
            <Archive className="h-4 w-4" /> Archive Selected
          </button>
          <button type="button" className={BTN_DANGER} disabled={none} onClick={onDeleteSelected}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-app-md border border-[var(--border-subtle)]">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="bg-[var(--surface-sunken)] text-[13px] font-semibold text-[var(--text-primary)]">
              <th className="w-12 px-3 py-3">
                <input
                  ref={headRef}
                  type="checkbox"
                  checked={allOnPage}
                  onChange={() => onToggleAll(ids, allOnPage)}
                  aria-label="Select all on this page"
                  className="h-4 w-4 cursor-pointer rounded accent-brand-500"
                />
              </th>
              <th className="px-3 py-3">File Name</th>
              <th className="px-3 py-3">Size</th>
              <th className="px-3 py-3">Upload Date</th>
              <th className="px-3 py-3">OCR Status</th>
              <th className="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody key={`${safePage}-${docs.length}`}>
            {loading &&
              [0, 1, 2].map((i) => (
                <tr key={i} className="border-t border-[var(--border-subtle)]">
                  {[16, 160, 50, 130, 80, 70].map((w, j) => (
                    <td key={j} className="px-3 py-4"><div className="uw-skel h-3 rounded" style={{ width: w }} /></td>
                  ))}
                </tr>
              ))}
            {!loading &&
              rows.map((d, i) => {
                const isChecked = checked.has(d.id);
                return (
                  <tr
                    key={d.id}
                    style={{ "--i": i }}
                    className={`uw-row border-t border-[var(--border-subtle)] text-[13px] text-[var(--text-secondary)] transition-colors duration-200 ${isChecked ? "bg-brand-500/[0.05]" : "hover:bg-[var(--surface-sunken)]"}`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggle(d.id)}
                        aria-label={`Select ${d.name}`}
                        className="h-4 w-4 cursor-pointer rounded accent-brand-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <FileBadge name={d.name} />
                        <span className="max-w-[220px] truncate font-medium text-[var(--text-primary)]" title={d.name}>{d.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums">{formatBytes(d.size)}</td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums">{stamp(d.uploadedAt)}</td>
                    <td className="px-3 py-3"><StatusPill status={d.status} /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title={d.file ? "Preview" : "Preview is available for files uploaded in this session"}
                          disabled={!d.file}
                          onClick={() => onPreview(d)}
                          className="rounded-app-sm p-1.5 text-[var(--text-tertiary)] transition hover:bg-[var(--surface-sunken)] hover:text-brand-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--text-tertiary)]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Open OCR review"
                          onClick={() => onOpen(d)}
                          className="rounded-app-sm p-1.5 text-[var(--text-tertiary)] transition hover:bg-[var(--surface-sunken)] hover:text-brand-500 active:scale-95"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <DocMenu doc={d} onOpen={() => onOpen(d)} onPreview={() => onPreview(d)} onDelete={() => onDeleteOne(d)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {!loading && docs.length === 0 && (
          <div className="uw-fade flex flex-col items-center px-4 py-10 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--text-tertiary)]">
              <FileText className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-[var(--text-primary)]">No documents uploaded yet</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">Files you upload appear here with their OCR status.</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-[var(--text-tertiary)]">
          {docs.length === 0
            ? "Showing 0 documents"
            : `Showing ${start + 1} to ${Math.min(start + DOC_PAGE_SIZE, docs.length)} of ${docs.length} documents`}
        </p>
        <div className="flex items-center gap-1.5">
          <PageButton label="Previous page" disabled={safePage === 1} onClick={() => onPage(safePage - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </PageButton>
          {pageList(totalPages, safePage).map((p) =>
            typeof p === "string" ? (
              <span key={p} className="px-1 text-[var(--text-tertiary)]">…</span>
            ) : (
              <PageButton key={p} active={p === safePage} onClick={() => onPage(p)}>{p}</PageButton>
            ),
          )}
          <PageButton label="Next page" disabled={safePage === totalPages} onClick={() => onPage(safePage + 1)}>
            <ChevronRight className="h-4 w-4" />
          </PageButton>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── page ────────────────────────── */

export default function UploadWorkflowPage() {
  // Enterprise hierarchy: Company Code -> Plant -> Department -> Category -> Document Type
  const [companyCodes, setCompanyCodes] = useState([]);
  const [plants, setPlants] = useState([]);
  const [selectedCC, setSelectedCC] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [loadingPlants, setLoadingPlants] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [uploadError, setUploadError] = useState("");

  // Step tracking
  const [step, setStep] = useState(0);
  const [documentId, setDocumentId] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [ocrStatus, setOcrStatus] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [polling, setPolling] = useState(false);

  // Step 3: editable OCR fields
  const [editedFields, setEditedFields] = useState({});
  const [dynamicFields, setDynamicFields] = useState([]);
  const [dynamicConfidence, setDynamicConfidence] = useState({});
  const [dynamicErrors, setDynamicErrors] = useState({});
  const [dynamicMetaLoaded, setDynamicMetaLoaded] = useState(false);

  // Step 4: tcode + live terminal
  const [tcode, setTcode] = useState(null);
  const [tcodeLoading, setTcodeLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);

  // Approval Engine gate
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [documentApprovalId, setDocumentApprovalId] = useState(null);

  const [step4Logs, setStep4Logs] = useState([]);
  const [step4Polling, setStep4Polling] = useState(false);

  // UI state — navigator tree
  const [expanded, setExpanded] = useState(() => new Set());
  const [treeQuery, setTreeQuery] = useState("");
  const [pulse, setPulse] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // UI state — uploaded documents list
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docChecked, setDocChecked] = useState(() => new Set());
  const [docPage, setDocPage] = useState(1);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState(null);

  const fileRef = useRef(null);
  const navRef = useRef(null);
  const docsRef = useRef([]);
  const noticeTimer = useRef(null);

  useEffect(() => { docsRef.current = docs; }, [docs]);

  const flash = useCallback((text, tone = "info") => {
    setNotice({ text, tone, id: Date.now() });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3600);
  }, []);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const patchDoc = useCallback((id, patch) => {
    setDocs((prev) => prev.map((d) => (String(d.id) === String(id) ? { ...d, ...patch } : d)));
  }, []);
  const addDoc = (doc) => setDocs((prev) => [doc, ...prev.filter((d) => String(d.id) !== String(doc.id))]);

  /* ── data loading ── */

  useEffect(() => {
    async function fetchCompanyCodes() {
      setLoading(true); setError("");
      try {
        const payload = decodeToken();
        if (!payload?.tenantId) throw new Error("Session invalid.");
        const res = await fetch(`${API}/company-codes`, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load company codes");
        setCompanyCodes(data.data || []);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    }
    fetchCompanyCodes();
  }, []);

  // Existing uploads for the list. Assumes GET /documents; if the endpoint
  // isn't available the list simply shows what was uploaded in this session.
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await fetch(`${API}/documents`, { headers: authHeaders() });
        if (!res.ok) return;
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || json.documents || [];
        if (off) return;
        const server = list.map(normalizeDoc).filter((d) => d.id != null);
        setDocs((prev) => {
          const byId = new Map(prev.map((d) => [String(d.id), d]));
          const merged = server.map((s) => ({ ...s, file: byId.get(String(s.id))?.file }));
          prev.forEach((p) => { if (!server.some((s) => String(s.id) === String(p.id))) merged.push(p); });
          return merged.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
        });
      } catch { /* list endpoint optional */ }
      finally { if (!off) setDocsLoading(false); }
    })();
    return () => { off = true; };
  }, []);

  useEffect(() => {
    setSelectedPlant(null); setPlants([]); setDepartments([]);
    setSelectedDept(null); setSelectedCat(null); setSelectedDocType(null);
    if (!selectedCC) return;
    async function fetchPlants() {
      setLoadingPlants(true); setError("");
      try {
        const res = await fetch(`${API}/plants?companyCodeId=${selectedCC.id}`, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load plants");
        setPlants(data.data || []);
      } catch (e) { setError(e.message); }
      finally { setLoadingPlants(false); }
    }
    fetchPlants();
  }, [selectedCC]);

  useEffect(() => {
    setDepartments([]); setSelectedDept(null); setSelectedCat(null); setSelectedDocType(null);
    if (!selectedPlant) return;
    async function fetchTree() {
      setLoadingDepts(true); setError("");
      try {
        const [deptRes, catRes, dtRes] = await Promise.all([
          fetch(`${API}/departments/plant/${selectedPlant.id}`, { headers: authHeaders() }),
          fetch(`${API}/categories`, { headers: authHeaders() }),
          fetch(`${API}/document-types`, { headers: authHeaders() }),
        ]);
        const depts = (await deptRes.json()).data || [];
        const cats = (await catRes.json()).data || [];
        const dts = (await dtRes.json()).data || [];
        const builtTree = depts.map((d) => ({
          ...d,
          categories: cats.filter((c) => c.departmentId === d.id).map((c) => ({
            ...c,
            documentTypes: dts.filter((dt) => dt.categoryId === c.id).map((dt) => ({ id: dt.id, name: dt.name })),
          })),
        }));
        const payload = decodeToken();
        const isUnrestrictedRole = payload?.role === "TenantAdmin" || payload?.role === "SuperAdmin";
        setDepartments(isUnrestrictedRole ? builtTree : builtTree.filter((dept) => dept.categories.length > 0));
      } catch (e) { setError(e.message); }
      finally { setLoadingDepts(false); }
    }
    fetchTree();
  }, [selectedPlant]);

  const loadDynamicMetadata = async (docId) => {
    // Dynamic Metadata Template Engine — fields come from the template
    // assigned to this document's document type.
    try {
      const metaRes = await metadataApi.getDocumentMetadata(docId);
      if (metaRes.data) {
        const visibleFields = (metaRes.data.fields || []).filter((f) => !f.hidden);
        setDynamicFields(visibleFields);
        setDynamicConfidence(metaRes.data.confidence || {});
        setDynamicErrors(metaRes.data.validationErrors || {});
        setEditedFields(metaRes.data.mappedMetadata || {});
      } else {
        setDynamicFields([]);
      }
    } catch {
      setDynamicFields([]);
    } finally {
      setDynamicMetaLoaded(true);
    }
  };

  // Poll OCR status + activity while processing (step 2)
  useEffect(() => {
    if (!polling || !documentId) return;
    const headers = { Authorization: `Bearer ${getToken()}` };
    const timer = setInterval(async () => {
      try {
        const [sRes, aRes] = await Promise.all([
          fetch(`${API}/documents/${documentId}/status`, { headers }),
          fetch(`${API}/documents/${documentId}/activity`, { headers }),
        ]);
        const sData = await sRes.json();
        const aData = await aRes.json();
        if (aData.success) setActivityLogs(aData.logs || []);
        if (sData.success) {
          setOcrStatus(sData.status);
          patchDoc(documentId, { status: mapStatus(sData.status) });
          if (sData.status === "OCR_COMPLETED" || sData.status === "WAITING_FOR_APPROVAL" || sData.status === "COMPLETED") {
            setPolling(false);
            await loadDynamicMetadata(documentId);
            setStep(3);
          } else if (sData.status === "FAILED") {
            setPolling(false);
            setStep(3);
          }
        }
      } catch {}
    }, 2000);
    return () => clearInterval(timer);
  }, [polling, documentId, patchDoc]);

  // Poll activity logs for step 4 (tcode + ERP save)
  useEffect(() => {
    if (!step4Polling || !documentId) return;
    const headers = { Authorization: `Bearer ${getToken()}` };
    const timer = setInterval(async () => {
      try {
        const [sRes, aRes] = await Promise.all([
          fetch(`${API}/documents/${documentId}/status`, { headers }),
          fetch(`${API}/documents/${documentId}/activity`, { headers }),
        ]);
        const sData = await sRes.json();
        const aData = await aRes.json();
        if (aData.success) setStep4Logs(aData.logs || []);
        if (sData.success && (sData.status === "COMPLETED" || sData.status === "FAILED")) {
          setStep4Polling(false);
          if (sData.status === "COMPLETED") { setFinalized(true); patchDoc(documentId, { status: "Completed" }); }
        }
      } catch {}
    }, 1500);
    return () => clearInterval(timer);
  }, [step4Polling, documentId, patchDoc]);

  // Keep statuses in the list fresh for files still being scanned
  const hasProcessing = docs.some((d) => d.status === "Processing");
  useEffect(() => {
    if (!hasProcessing) return;
    const headers = { Authorization: `Bearer ${getToken()}` };
    const timer = setInterval(async () => {
      for (const d of docsRef.current.filter((x) => x.status === "Processing")) {
        try {
          const r = await fetch(`${API}/documents/${d.id}/status`, { headers });
          const j = await r.json();
          if (j.success) {
            const ns = mapStatus(j.status);
            if (ns !== d.status) patchDoc(d.id, { status: ns });
          }
        } catch {}
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [hasProcessing, patchDoc]);

  /* ── tree selection ── */

  const expand = (key) => setExpanded((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  const toggle = (key) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const pickCompany = (id) => {
    const c = companyCodes.find((x) => String(x.id) === String(id)) || null;
    setSelectedCC(c);
    setStep(0);
    setTreeQuery("");
    setExpanded(new Set(c ? ["cc"] : []));
  };
  const pickPlant = (p) => {
    if (selectedPlant?.id === p.id) return toggle(`plant:${p.id}`);
    setSelectedPlant(p);
    expand("cc"); expand(`plant:${p.id}`);
  };
  const pickDept = (d) => {
    if (selectedDept?.id === d.id && !selectedCat && !selectedDocType) return toggle(`dept:${d.id}`);
    setSelectedDept(d); setSelectedCat(null); setSelectedDocType(null);
    expand(`dept:${d.id}`);
  };
  const pickCat = (d, c) => {
    if (selectedCat?.id === c.id && !selectedDocType) return toggle(`cat:${c.id}`);
    setSelectedDept(d); setSelectedCat(c); setSelectedDocType(null);
    expand(`dept:${d.id}`); expand(`cat:${c.id}`);
  };
  const pickDocType = (d, c, dt) => {
    setSelectedDept(d); setSelectedCat(c); setSelectedDocType(dt);
    setUploadError("");
  };

  const changeLocation = () => {
    setSelectedCC(null);
    setStep(0);
    setTreeQuery("");
    setExpanded(new Set());
    setUploadError("");
    setPulse(true);
    setTimeout(() => setPulse(false), 1200);
    navRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  /* ── upload / OCR / ERP flow ── */

  const clearDocState = () => {
    setDocumentId(null); setFileName(""); setUploadedFile(null); setOcrStatus(null);
    setDynamicFields([]); setDynamicConfidence({}); setDynamicErrors({}); setDynamicMetaLoaded(false);
    setActivityLogs([]); setEditedFields({}); setTcode(null); setFinalized(false);
    setStep4Logs([]); setStep4Polling(false); setApprovalRequired(false); setDocumentApprovalId(null);
    setTcodeLoading(false); setFinalizing(false);
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length || !selectedDocType) return;
    setUploadError("");
    const problems = [];
    const valid = [];
    files.forEach((f) => {
      const ext = `.${f.name.split(".").pop().toLowerCase()}`;
      if (!ACCEPT.includes(ext)) problems.push(`${f.name}: unsupported format`);
      else if (f.size > MAX_MB * 1024 * 1024) problems.push(`${f.name}: larger than ${MAX_MB} MB`);
      else valid.push(f);
    });
    if (!valid.length) { setUploadError(problems.join(" · ")); return; }

    setUploading(true); setStep(1); setActivityLogs([]);
    setUploadProgress({ done: 0, total: valid.length });
    let first = null;
    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("documentTypeId", selectedDocType.id);
        const res = await fetch(`${API}/documents/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: form,
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Upload failed");
        addDoc({ id: data.documentId, name: file.name, size: file.size, uploadedAt: Date.now(), status: "Processing", file });
        if (!first) first = { id: data.documentId, file };
      } catch (e) { problems.push(`${file.name}: ${e.message}`); }
      setUploadProgress({ done: i + 1, total: valid.length });
    }
    setUploading(false);

    if (first) {
      // The first file continues through OCR → review → ERP; any others
      // are queued in the list and can be opened with Process Selected.
      clearDocState();
      setDocumentId(first.id); setFileName(first.file.name); setUploadedFile(first.file);
      setStep(2); setPolling(true);
      if (problems.length) flash(problems.join(" · "), "error");
      else if (valid.length > 1) flash(`${valid.length} files uploaded. Reviewing the first; the rest are in the list.`, "success");
    } else {
      setStep(0);
      setUploadError(problems.join(" · "));
    }
  };

  const handleGenerateTcode = async () => {
    setTcodeLoading(true);
    setStep4Logs((prev) => [...prev, { message: "Generating TCode...", status: "PROCESSING", timestamp: new Date() }]);
    try {
      const res = await fetch(`${API}/documents/${documentId}/generate-tcode`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setTcode(data.tcode);
        setApprovalRequired(!!data.approvalRequired);
        setDocumentApprovalId(data.documentApprovalId || null);
        setStep4Logs((prev) => [...prev, { message: `TCode generated: ${data.tcode}`, status: "SUCCESS", timestamp: new Date() }]);
        if (data.approvalRequired) {
          setStep4Logs((prev) => [...prev, { message: "Approval required — routed to Level 1 approver", status: "SUCCESS", timestamp: new Date() }]);
        }
        setStep(4);
      } else {
        setStep4Logs((prev) => [...prev, { message: data.message || "TCode generation failed", status: "FAILED", timestamp: new Date() }]);
      }
    } catch {
      setStep4Logs((prev) => [...prev, { message: "TCode generation failed", status: "FAILED", timestamp: new Date() }]);
    } finally { setTcodeLoading(false); }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    setStep4Logs((prev) => [...prev, { message: "Saving document ...", status: "PROCESSING", timestamp: new Date() }]);
    setStep4Polling(true);
    try {
      const res = await fetch(`${API}/documents/${documentId}/finalize`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setStep4Logs((prev) => [...prev, { message: "Document archived successfully", status: "SUCCESS", timestamp: new Date() }]);
        setFinalized(true);
        setStep4Polling(false);
        patchDoc(documentId, { status: "Completed" });
      }
    } catch {
      setStep4Logs((prev) => [...prev, { message: "ERP save failed", status: "FAILED", timestamp: new Date() }]);
      setStep4Polling(false);
    } finally { setFinalizing(false); }
  };

  const resetFlow = () => {
    setPolling(false);
    clearDocState();
    setStep(0);
    setSelectedCC(null); setSelectedPlant(null); setSelectedDept(null); setSelectedCat(null); setSelectedDocType(null);
    setUploadError("");
    setExpanded(new Set()); setTreeQuery("");
  };

  const exitFlow = () => { setPolling(false); clearDocState(); setStep(0); };

  /* ── uploaded documents actions ── */

  const resumeDocument = async (doc) => {
    setPolling(false);
    clearDocState();
    setDocumentId(doc.id); setFileName(doc.name); setUploadedFile(doc.file || null);
    setOcrStatus(doc.status === "Failed" ? "FAILED" : doc.status === "Completed" ? "OCR_COMPLETED" : "PROCESSING");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (doc.status === "Processing" || doc.status === "Pending") {
      setStep(2); setPolling(true);
    } else {
      setStep(3);
      await loadDynamicMetadata(doc.id);
    }
  };

  const selectedDocs = docs.filter((d) => docChecked.has(d.id));

  const onProcessSelected = () => {
    if (selectedDocs.length !== 1) return flash("Select one document at a time to open it.", "info");
    resumeDocument(selectedDocs[0]);
  };
  const onArchiveSelected = () => {
    if (selectedDocs.length !== 1) return flash("Select one document at a time to archive it.", "info");
    const d = selectedDocs[0];
    if (d.status !== "Completed") return flash("Archive is available once OCR is completed.", "info");
    flash("Review the fields, then generate the DMSCode to archive.", "info");
    resumeDocument(d);
  };

  const doDelete = async () => {
    setDeleting(true);
    const ids = [...docChecked];
    const ok = [];
    const failed = [];
    for (const id of ids) {
      try {
        const r = await fetch(`${API}/documents/${id}`, { method: "DELETE", headers: authHeaders() });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.success !== false) ok.push(id); else failed.push(id);
      } catch { failed.push(id); }
    }
    setDocs((prev) => prev.filter((d) => !ok.includes(d.id)));
    setDocChecked(new Set(failed));
    setDeleting(false);
    setConfirmDelete(false);
    flash(
      failed.length ? `Could not delete ${failed.length} document${failed.length > 1 ? "s" : ""}.` : `${ok.length} document${ok.length > 1 ? "s" : ""} deleted.`,
      failed.length ? "error" : "success",
    );
  };

  const toggleDoc = (id) =>
    setDocChecked((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAllDocs = (ids, allOn) =>
    setDocChecked((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => (allOn ? n.delete(id) : n.add(id)));
      return n;
    });

  /* ── tree filtering ── */

  const query = treeQuery.trim().toLowerCase();
  const has = (s) => !!s && String(s).toLowerCase().includes(query);
  const dtOk = (dt) => has(dt.name);
  const catOk = (c) => has(c.name) || c.documentTypes.some(dtOk);
  const deptOk = (d) => has(d.name) || d.categories.some(catOk);
  const plantSelf = (p) => has(p.name) || has(p.code);
  const plantList = plants.filter((p) => !query || plantSelf(p) || (selectedPlant?.id === p.id && departments.some(deptOk)));
  const deptsFor = (p) => (!query || plantSelf(p) ? departments : departments.filter(deptOk));
  const catsFor = (d) => (!query || has(d.name) ? d.categories : d.categories.filter(catOk));
  const dtsFor = (c) => (!query || has(c.name) ? c.documentTypes : c.documentTypes.filter(dtOk));
  const isOpen = (key) => (query ? true : expanded.has(key));
  const noMatches = !!query && !!selectedCC && !has(selectedCC.name) && !has(selectedCC.code) && plantList.length === 0;

  const deepest = selectedDocType
    ? `dt:${selectedDocType.id}`
    : selectedCat ? `cat:${selectedCat.id}`
    : selectedDept ? `dept:${selectedDept.id}`
    : selectedPlant ? `plant:${selectedPlant.id}`
    : selectedCC ? "cc" : null;

  /* ── derived ── */

  const hierarchyComplete = !!selectedDocType;
  const inUploadPhase = step === 0 || step === 1;
  const stepperCurrent = finalized ? STEPS.length : step;

  const chips = [
    selectedCC && { icon: Building2, cls: "text-brand-500", label: `${selectedCC.name} (${selectedCC.code})` },
    selectedPlant && { icon: Folder, cls: "text-brand-500", label: `${selectedPlant.name} (${selectedPlant.code})` },
    selectedDept && { icon: Folder, cls: "text-amber-500", label: selectedDept.name },
    selectedCat && { icon: FileText, cls: "text-brand-500", label: selectedCat.name },
    selectedDocType && { icon: FileText, cls: "text-violet-500", label: selectedDocType.name },
  ].filter(Boolean);

  const nextHint = !selectedCC
    ? "Start by choosing a company code"
    : !selectedPlant ? "Pick a plant in the tree"
    : !selectedDept ? "Pick a department"
    : !selectedCat ? "Pick a category"
    : "Pick a document type to enable upload";

  const locked = !hierarchyComplete;

  /* ────────────────────────── render ────────────────────────── */

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      <style>{LOCAL_CSS}</style>

      {/* ── Header ── */}
      <div className="uw-head flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-[13px]">
            <span className="text-[var(--text-tertiary)]">Documents</span>
            <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <span className="font-semibold text-brand-500">Upload &amp; Manage</span>
          </nav>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[28px] font-bold leading-tight text-[var(--text-primary)]">Upload &amp; Manage</h1>
            <span className="flex h-8 w-8 items-center justify-center rounded-app-md bg-brand-500/10 text-brand-500">
              <UploadCloud className="uw-float h-4 w-4" />
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">Upload, OCR, review, and archive a document to end-to-end</p>
        </div>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="inline-flex h-10 items-center gap-2 rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 text-[13px] font-medium text-[var(--text-primary)] transition duration-200 hover:border-brand-300 hover:text-brand-500 active:scale-[.98]"
        >
          <HelpCircle className="h-4 w-4 text-brand-500" />
          Help &amp; Guide
        </button>
      </div>

      <Stepper current={stepperCurrent} />

      <div className="grid items-start gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
        {/* ══ LEFT: Document Location ══ */}
        <aside
          ref={navRef}
          className="uw-rise relative rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 xl:sticky xl:top-4"
          style={{ "--i": 1 }}
        >
          <span aria-hidden className={`pointer-events-none absolute inset-0 rounded-app-lg ${pulse ? "uw-glow" : ""}`} />

          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-app-md bg-brand-500/10 text-brand-500">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Document Location</h3>
              <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-tertiary)]">
                Select a company code, plant, department, category and document type.
              </p>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-[var(--text-primary)]">
              Company Code <span className="text-danger-500">*</span>
              <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
            </span>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
              <select
                value={selectedCC?.id ?? ""}
                onChange={(e) => pickCompany(e.target.value)}
                disabled={loading}
                className="h-11 w-full cursor-pointer appearance-none rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-card)] pl-10 pr-10 text-[13px] text-[var(--text-primary)] outline-none transition duration-200 hover:border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
              >
                <option value="">{loading ? "Loading company codes…" : "Select company code"}</option>
                {companyCodes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            </div>
          </label>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={treeQuery}
              onChange={(e) => setTreeQuery(e.target.value)}
              disabled={!selectedCC}
              placeholder="Search plant, department, category..."
              className="h-11 w-full rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-card)] pl-10 pr-9 text-[13px] text-[var(--text-primary)] outline-none transition duration-200 placeholder:text-[var(--text-tertiary)] hover:border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {treeQuery && (
              <button
                type="button"
                onClick={() => setTreeQuery("")}
                aria-label="Clear search"
                className="uw-fade absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {error && (
            <div className="uw-fade mt-3 flex items-start gap-2 rounded-app-md border border-danger-500/30 bg-danger-50 px-3 py-2.5 text-xs text-danger-500 dark:bg-danger-500/15">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div role="tree" className="mt-3 max-h-[520px] overflow-y-auto pr-1">
            {!selectedCC && (
              <div className="uw-fade flex flex-col items-center px-4 py-10 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--text-tertiary)]">
                  <FolderOpen className="h-5 w-5" />
                </span>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Choose a company code</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">Plants, departments, categories and document types appear here.</p>
              </div>
            )}

            {selectedCC && (
              <>
                <TreeRow
                  depth={0}
                  icon={<Folder className="h-4 w-4 shrink-0 fill-brand-500/20 text-brand-500" />}
                  label={`${selectedCC.name} (${selectedCC.code})`}
                  open={isOpen("cc")}
                  hasChildren
                  active={deepest === "cc"}
                  onClick={() => toggle("cc")}
                  onToggle={() => toggle("cc")}
                />
                <Collapse open={isOpen("cc")}>
                  {loadingPlants && <TreeSkeleton depth={1} />}
                  {!loadingPlants && plantList.length === 0 && !query && <TreeNote depth={1}>No plants under this company code.</TreeNote>}
                  {noMatches && <TreeNote depth={1}>No matches for “{treeQuery}”.</TreeNote>}

                  {plantList.map((p, pi) => {
                    const pKey = `plant:${p.id}`;
                    const isSel = selectedPlant?.id === p.id;
                    const pOpen = isSel && isOpen(pKey);
                    return (
                      <div key={p.id}>
                        <TreeRow
                          depth={1}
                          index={pi}
                          icon={<Folder className="h-4 w-4 shrink-0 fill-brand-500/20 text-brand-500" />}
                          label={`${p.name} (${p.code})`}
                          open={pOpen}
                          hasChildren
                          active={deepest === pKey}
                          onClick={() => pickPlant(p)}
                          onToggle={() => (isSel ? toggle(pKey) : pickPlant(p))}
                        />
                        <Collapse open={pOpen}>
                          {isSel && loadingDepts && <TreeSkeleton depth={2} />}
                          {isSel && !loadingDepts && departments.length === 0 && <TreeNote depth={2}>No departments in this plant.</TreeNote>}
                          {isSel &&
                            deptsFor(p).map((d, di) => {
                              const dKey = `dept:${d.id}`;
                              const dOpen = isOpen(dKey);
                              return (
                                <div key={d.id}>
                                  <TreeRow
                                    depth={2}
                                    index={di}
                                    icon={<Folder className="h-4 w-4 shrink-0 fill-amber-400/30 text-amber-500" />}
                                    label={d.name}
                                    open={dOpen}
                                    hasChildren={d.categories.length > 0}
                                    active={deepest === dKey}
                                    onClick={() => pickDept(d)}
                                    onToggle={() => toggle(dKey)}
                                  />
                                  <Collapse open={dOpen}>
                                    {d.categories.length === 0 && <TreeNote depth={3}>No categories.</TreeNote>}
                                    {catsFor(d).map((c, ci) => {
                                      const cKey = `cat:${c.id}`;
                                      const cOpen = isOpen(cKey);
                                      return (
                                        <div key={c.id}>
                                          <TreeRow
                                            depth={3}
                                            index={ci}
                                            icon={<Folder className="h-4 w-4 shrink-0 fill-amber-400/30 text-amber-500" />}
                                            label={c.name}
                                            open={cOpen}
                                            hasChildren={c.documentTypes.length > 0}
                                            active={deepest === cKey}
                                            onClick={() => pickCat(d, c)}
                                            onToggle={() => toggle(cKey)}
                                          />
                                          <Collapse open={cOpen}>
                                            {c.documentTypes.length === 0 && <TreeNote depth={4}>No document types.</TreeNote>}
                                            {dtsFor(c).map((dt, ti) => (
                                              <TreeRow
                                                key={dt.id}
                                                depth={4}
                                                index={ti}
                                                icon={
                                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-500/10 text-brand-500">
                                                    <FileText className="h-3 w-3" />
                                                  </span>
                                                }
                                                label={dt.name}
                                                hasChildren={false}
                                                active={deepest === `dt:${dt.id}`}
                                                onClick={() => pickDocType(d, c, dt)}
                                                onToggle={() => {}}
                                              />
                                            ))}
                                          </Collapse>
                                        </div>
                                      );
                                    })}
                                  </Collapse>
                                </div>
                              );
                            })}
                        </Collapse>
                      </div>
                    );
                  })}
                </Collapse>
              </>
            )}
          </div>
        </aside>

        {/* ══ RIGHT: workspace + documents ══ */}
        <div className="min-w-0 space-y-4">
          {inUploadPhase ? (
            <section className="uw-rise rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4" style={{ "--i": 2 }}>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-app-md bg-brand-500/10 text-brand-500">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Selected Location</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {chips.length === 0 && <span className="text-[13px] text-[var(--text-tertiary)]">No location selected yet</span>}
                    {chips.map((c, i) => (
                      <span key={`${i}-${c.label}`} className="flex items-center gap-1.5">
                        {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />}
                        <span
                          className="uw-chip inline-flex items-center gap-1.5 rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-card)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]"
                          style={{ "--i": i }}
                        >
                          <c.icon className={`h-3.5 w-3.5 ${c.cls}`} />
                          {c.label}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={changeLocation} className={`${BTN_PRIMARY} shrink-0`}>
                  <Pencil className="h-4 w-4" /> Change
                </button>
              </div>

              {/* dropzone */}
              <div
                role="button"
                tabIndex={locked || uploading ? -1 : 0}
                aria-disabled={locked || uploading}
                onDragOver={(e) => { e.preventDefault(); if (!locked && !uploading) setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragOver(false);
                  if (!locked && !uploading) handleFiles(e.dataTransfer.files);
                }}
                onClick={() => !locked && !uploading && fileRef.current?.click()}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !locked && !uploading) { e.preventDefault(); fileRef.current?.click(); } }}
                className={`mt-4 rounded-app-lg border-2 border-dashed px-5 py-8 text-center outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                  locked
                    ? "cursor-not-allowed border-[var(--border-subtle)] bg-[var(--surface-sunken)] opacity-70"
                    : dragOver
                    ? "scale-[1.01] cursor-copy border-solid border-brand-500 bg-brand-500/10"
                    : "cursor-pointer border-brand-500/50 bg-brand-500/[0.04] hover:border-brand-500 hover:bg-brand-500/[0.07]"
                }`}
              >
                {uploading ? (
                  <div className="uw-fade mx-auto flex max-w-sm flex-col items-center">
                    <Loader2 className="h-9 w-9 animate-spin text-brand-500" />
                    <p className="mt-3 text-base font-bold text-[var(--text-primary)]">
                      Uploading {Math.min(uploadProgress.done + 1, uploadProgress.total)} of {uploadProgress.total}…
                    </p>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
                        style={{ width: `${Math.max(12, (uploadProgress.done / Math.max(1, uploadProgress.total)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadCloud className={`mx-auto h-10 w-10 ${locked ? "text-[var(--text-tertiary)]" : "uw-float text-brand-500"} ${dragOver ? "scale-110" : ""} transition-transform`} />
                    <p className="mt-2 text-base font-bold text-[var(--text-primary)]">
                      {locked ? "Select a document type to enable upload" : "Drag & drop files here"}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
                      {locked ? nextHint : "or click to browse files"}
                    </p>
                    <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                      Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG • Max size: {MAX_MB} MB per file
                    </p>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                      className={`${BTN_PRIMARY} mt-4 px-6`}
                    >
                      <FilePlus className="h-4 w-4" /> Choose Files
                    </button>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept={ACCEPT.join(",")}
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files?.length) handleFiles(files);
                  e.target.value = "";
                }}
              />

              {uploadError && (
                <div className="uw-fade mt-3 flex items-start gap-2 rounded-app-md border border-danger-500/30 bg-danger-50 px-3.5 py-2.5 text-[13px] text-danger-500 dark:bg-danger-500/15">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {uploadError}
                </div>
              )}
            </section>
          ) : (
            <section key={step} className="uw-fade rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6">
              {/* ══ OCR Processing ══ */}
              {step === 2 && (
                <>
                  <SectionTitle
                    title="OCR Processing"
                    sub={`Processing ${fileName}`}
                    icon={ScanLine}
                    action={<button type="button" onClick={exitFlow} className={BTN_SECONDARY}><X className="h-4 w-4" /> Close</button>}
                  />
                  <div className="mb-4 flex items-center gap-2.5 rounded-app-md border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                    <ScanLine className="h-4 w-4 shrink-0 animate-pulse text-amber-600" />
                    <span className="text-[13px] font-semibold text-amber-700 dark:text-amber-300">Extracting fields — this may take a few seconds…</span>
                  </div>
                  <ActivityTerminal logs={activityLogs} polling={polling} />
                </>
              )}

              {/* ══ OCR Review ══ */}
              {step === 3 && (
                <>
                  <SectionTitle
                    title="OCR Review"
                    sub={`Extracted from ${fileName}`}
                    icon={ClipboardCheck}
                    action={<button type="button" onClick={exitFlow} className={BTN_SECONDARY}><X className="h-4 w-4" /> Close</button>}
                  />

                  <div
                    className={`mb-4 flex items-center gap-2 rounded-app-md border px-4 py-2.5 ${
                      ocrStatus === "FAILED"
                        ? "border-danger-500/30 bg-danger-50 text-danger-500 dark:bg-danger-500/15"
                        : "border-success-500/30 bg-success-50 text-success-500 dark:bg-success-500/15"
                    }`}
                  >
                    {ocrStatus === "FAILED" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    <span className="text-[13px] font-semibold">
                      {ocrStatus === "FAILED" ? "OCR failed — you can still proceed manually" : "OCR completed successfully"}
                    </span>
                  </div>

                  <div className="mb-5 grid gap-5 lg:grid-cols-2">
                    <div className="h-[480px]">
                      <PanelLabel icon={FileText} text="Document Preview" />
                      <div style={{ height: "calc(100% - 26px)" }}>
                        <DocumentPreview file={uploadedFile} fileName={fileName} />
                      </div>
                    </div>

                    <div className="flex min-h-[480px] flex-col">
                      <div className="mb-2 flex items-center justify-between">
                        <PanelLabel icon={ClipboardCheck} text="Extracted Fields" />
                        <div className="flex gap-2.5 text-[10.5px] text-[var(--text-tertiary)]">
                          <LegendDot color="#0F8A5F" label="High" />
                          <LegendDot color="#B15C00" label="Mid" />
                          <LegendDot color="#C42B1C" label="Low" />
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto rounded-app-lg border border-[var(--border-subtle)]">
                        {!dynamicMetaLoaded && (
                          <div className="space-y-3 p-4">
                            {[0, 1, 2, 3].map((i) => <div key={i} className="uw-skel h-8 rounded-app-md" />)}
                          </div>
                        )}
                        {dynamicMetaLoaded && dynamicFields.length === 0 && (
                          <div className="p-4 text-xs text-[var(--text-tertiary)]">
                            No metadata template is assigned to this document type yet — ask a Tenant Admin to create one under Metadata Templates.
                          </div>
                        )}
                        {dynamicFields.map((field, i) => {
                          const conf = confidenceLabel(dynamicConfidence[field.internalName]);
                          const dotColor = confidenceColor(conf);
                          const fieldErrors = dynamicErrors?.[field.internalName] || [];
                          return (
                            <div
                              key={field.internalName}
                              className="uw-fade flex items-start gap-3 border-b border-[var(--border-subtle)] px-4 py-2.5 last:border-b-0"
                              style={{ "--i": Math.min(i, 10) }}
                            >
                              <span className="w-28 shrink-0 pt-2 text-[11px] text-[var(--text-tertiary)]">{field.label}</span>
                              <div className="min-w-0 flex-1">
                                <FieldRenderer
                                  field={field}
                                  value={editedFields[field.internalName]}
                                  onChange={(v) => setEditedFields((prev) => ({ ...prev, [field.internalName]: v }))}
                                  error={fieldErrors[0]}
                                  disabled={field.readonly}
                                />
                                {fieldErrors[0] && <div className="mt-1 text-[10.5px] text-danger-500">{fieldErrors[0]}</div>}
                              </div>
                              {!field.readonly && <span className="mt-3 h-2 w-2 shrink-0 rounded-full" style={{ background: dotColor }} />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <details className="mb-5">
                    <summary className="mb-2 cursor-pointer text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">View activity log</summary>
                    <ActivityTerminal logs={activityLogs} polling={false} compact />
                  </details>

                  <div className="sticky bottom-0 flex justify-end bg-[var(--surface-card)] pt-2">
                    <button type="button" onClick={handleGenerateTcode} disabled={tcodeLoading} className={`${BTN_PRIMARY} h-11 px-7 text-sm`}>
                      {tcodeLoading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>) : (<>Generate DMSCode <ChevronRight className="h-4 w-4" /></>)}
                    </button>
                  </div>
                </>
              )}

              {/* ══ DMSCode + ERP archive ══ */}
              {step === 4 && !finalized && (
                <>
                  <SectionTitle title="E-Code & ERP Archive" sub={`Document: ${fileName}`} icon={Database} />
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="flex flex-col gap-4">
                      <div className="h-[240px]">
                        <PanelLabel icon={FileText} text="Document" />
                        <div style={{ height: "calc(100% - 26px)" }}>
                          <DocumentPreview file={uploadedFile} fileName={fileName} />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[var(--text-tertiary)]">
                          <span className={`h-[7px] w-[7px] rounded-full ${step4Polling ? "uw-dot bg-success-500" : "bg-slate-400"}`} />
                          Pipeline &amp; Approval Activity
                        </div>
                        <ActivityTerminal logs={step4Logs} polling={step4Polling} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {tcode && (
                        <div className="uw-rise flex items-center gap-3.5 rounded-app-lg border border-success-500/30 bg-success-50 p-4 dark:bg-success-500/15">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success-500 text-white">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-success-500">Transaction Code Generated</p>
                            <p className="mt-1 font-mono text-xl font-extrabold tracking-wider text-[var(--text-primary)]">{tcode}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex-1 overflow-hidden rounded-app-lg border border-[var(--border-subtle)]">
                        <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-4 py-2.5">
                          <span className="text-xs font-bold text-[var(--text-primary)]">Document Summary</span>
                        </div>
                        <div className="max-h-[260px] overflow-y-auto">
                          {dynamicFields.filter((f) => editedFields[f.internalName]).map((f) => (
                            <div key={f.internalName} className="flex border-b border-[var(--border-subtle)] px-4 py-2 last:border-b-0">
                              <span className="w-[120px] shrink-0 text-[11px] text-[var(--text-tertiary)]">{f.label}</span>
                              <span className="text-xs font-semibold text-[var(--text-primary)]">{String(editedFields[f.internalName])}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {approvalRequired ? (
                        <div className="uw-rise flex items-center gap-3.5 rounded-app-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                            <Zap className="h-[18px] w-[18px]" />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-amber-700 dark:text-amber-300">Pending Approval</p>
                            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                              Waiting for Level 1 approval{documentApprovalId ? ` · #${documentApprovalId}` : ""} — upload runs automatically once fully approved.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2.5">
                          <button type="button" onClick={() => setStep(3)} className={`${BTN_SECONDARY} h-11 flex-1`}>Back</button>
                          <button
                            type="button"
                            onClick={handleFinalize}
                            disabled={finalizing}
                            className="inline-flex h-11 flex-[2] items-center justify-center gap-2 rounded-app-md bg-slate-900 px-5 text-sm font-bold text-white transition duration-200 hover:bg-slate-800 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-700 dark:hover:bg-slate-600"
                          >
                            {finalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                            {finalizing ? "Saving…" : "Save"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ══ Finalized ══ */}
              {finalized && (
                <div className="py-14 text-center">
                  <div className="uw-success mx-auto mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-full border-2 border-success-500/30 bg-success-50 text-success-500 dark:bg-success-500/15">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  <h2 className="uw-fade mb-2 text-xl font-extrabold text-[var(--text-primary)]" style={{ "--i": 3 }}>Document Archived</h2>
                  <p className="uw-fade text-[13px] text-[var(--text-tertiary)]" style={{ "--i": 4 }}>
                    File: <strong className="text-[var(--text-primary)]">{fileName}</strong>
                  </p>
                  <p className="uw-fade mb-7 mt-1 text-[13px] text-[var(--text-tertiary)]" style={{ "--i": 5 }}>
                    TCode: <strong className="font-mono text-[var(--text-primary)]">{tcode}</strong>
                  </p>
                  <button type="button" onClick={resetFlow} className={`${BTN_PRIMARY} h-11 px-7 text-sm`}>
                    <UploadCloud className="h-4 w-4" /> Upload Another Document
                  </button>
                </div>
              )}
            </section>
          )}

          <DocumentsCard
            docs={docs}
            loading={docsLoading}
            checked={docChecked}
            onToggle={toggleDoc}
            onToggleAll={toggleAllDocs}
            page={docPage}
            onPage={setDocPage}
            onProcess={onProcessSelected}
            onArchive={onArchiveSelected}
            onDeleteSelected={() => setConfirmDelete(true)}
            onDeleteOne={(d) => { setDocChecked(new Set([d.id])); setConfirmDelete(true); }}
            onPreview={setPreviewDoc}
            onOpen={resumeDocument}
          />
        </div>
      </div>

      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />

      <ModalShell
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.name || "Preview"}
        icon={Eye}
        maxW="max-w-3xl"
      >
        <div className="h-[60vh]">
          {previewDoc && <DocumentPreview file={previewDoc.file} fileName={previewDoc.name} />}
        </div>
      </ModalShell>

      <ModalShell
        open={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        title={`Delete ${docChecked.size} document${docChecked.size > 1 ? "s" : ""}?`}
        icon={Trash2}
        footer={
          <>
            <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting} className={BTN_SECONDARY}>Cancel</button>
            <button
              type="button"
              onClick={doDelete}
              disabled={deleting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-app-md bg-danger-500 px-5 text-[13px] font-semibold text-white transition hover:brightness-110 active:scale-[.98] disabled:opacity-60"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
          The selected document{docChecked.size > 1 ? "s" : ""} and their extracted data will be permanently removed. This can't be undone.
        </p>
      </ModalShell>

      <Toast notice={notice} />
    </div>
  );
}