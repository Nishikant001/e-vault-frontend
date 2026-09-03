import React, { useEffect, useState, useRef } from "react";
import {
  HiBuildingOffice2,
  HiCheckCircle,
  HiBolt,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiPencil,
  HiOutlineSparkles,
  HiInformationCircle,
  HiXMark,
} from "react-icons/hi2";
import { FaIndustry, FaDatabase, FaCircleUser } from "react-icons/fa6";
import {
  MdApartment,
  MdErrorOutline,
  MdOutlineZoomIn,
  MdOutlineZoomOut,
  MdOutlineRotate90DegreesCcw,
} from "react-icons/md";
import { PiFoldersFill, PiFileMagnifyingGlassDuotone } from "react-icons/pi";
import { FiUploadCloud, FiDownload } from "react-icons/fi";
import { RiScan2Line } from "react-icons/ri";
import { TbChecklist, TbFileUpload } from "react-icons/tb";
import { IoSearch, IoNotifications, IoSettingsSharp } from "react-icons/io5";
import { LuLogOut, LuFileText } from "react-icons/lu";
import { BsClockHistory } from "react-icons/bs";

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

// ── Design tokens ────────────────────────────────────────────
// SAP-native palette, restrained: one primary blue, one ink, one canvas.
// No decorative gradients beyond the single signature progress rail.
const T = {
  primary: "#0A6ED1",
  primaryDeep: "#08498C",
  ink: "#0B1F3A",
  inkSoft: "#4B5C74",
  muted: "#8A97AC",
  canvas: "#EEF2F8",
  surface: "#FFFFFF",
  border: "#E1E7F0",
  borderStrong: "#C9D3E2",
  success: "#0F8A5F",
  successBg: "#E8F8F1",
  successBorder: "#B7E9D2",
  warning: "#B15C00",
  warningBg: "#FFF4E5",
  warningBorder: "#F5CB8B",
  danger: "#C42B1C",
  dangerBg: "#FDECEA",
  dangerBorder: "#F3B4AC",
  purple: "#5B3DB8",
  purpleBg: "#F1EDFB",
};
const FONT = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";
const MONO = "'IBM Plex Mono', 'SFMono-Regular', Menlo, Consolas, monospace";

const STEPS = [
  { label: "Hierarchy", icon: HiBuildingOffice2 },
  { label: "Upload", icon: TbFileUpload },
  { label: "OCR Processing", icon: RiScan2Line },
  { label: "OCR Review", icon: TbChecklist },
  { label: "SAP Archive", icon: FaDatabase },
];

const LOG_COLOR  = { SUCCESS: T.success, PROCESSING: T.warning, FAILED: T.danger, INFO: "#5B8DEF" };

function matches(text, q) { return String(text || "").toLowerCase().includes(q.trim().toLowerCase()); }

// ── Premium horizontal stepper (signature progress rail) ──────
function Stepper({ current }) {
  const pct = (current / (STEPS.length - 1)) * 100;
  return (
    <div style={{
      background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`,
      padding: "18px 28px", marginBottom: 16, boxShadow: "0 1px 2px rgba(11,31,58,0.04)",
    }}>
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
        <div style={{ position: "absolute", top: 15, left: 22, right: 22, height: 3, background: T.canvas, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.primary}, ${T.primaryDeep})`, transition: "width 0.5s cubic-bezier(.4,0,.2,1)", borderRadius: 3 }} />
        </div>
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, transition: "all 0.25s",
                background: done ? T.success : active ? T.primary : T.surface,
                color: done || active ? "#fff" : T.muted,
                border: done || active ? "none" : `2px solid ${T.border}`,
                boxShadow: active ? `0 0 0 5px ${T.primary}22` : "none",
              }}>
                {done ? <HiCheckCircle size={16} /> : <Icon size={14} />}
              </div>
              <span style={{
                fontSize: 11, fontWeight: active ? 700 : 500, letterSpacing: "0.01em",
                color: active ? T.primary : done ? T.success : T.muted, textAlign: "center",
              }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Breadcrumb chip bar ─────────────────────────────────────
function CrumbBar({ cc, plant, dept, cat, docType }) {
  const items = [
    cc && { icon: HiBuildingOffice2, label: cc.code || cc.name, color: T.primary, bg: "#E8F1FD" },
    plant && { icon: FaIndustry, label: plant.code || plant.name, color: T.success, bg: T.successBg },
    dept && { icon: MdApartment, label: dept.name, color: T.primary, bg: "#E8F1FD" },
    cat && { icon: PiFoldersFill, label: cat.name, color: T.warning, bg: T.warningBg },
    docType && { icon: LuFileText, label: docType.name, color: T.purple, bg: T.purpleBg },
  ].filter(Boolean);

  if (items.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", color: T.muted, fontSize: 12.5 }}>
        <HiOutlineSparkles size={15} />
        Select a company code in the navigator to begin
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, padding: "10px 16px" }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <HiOutlineChevronRight size={12} color={T.muted} />}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6, background: it.bg, color: it.color,
            fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 20,
          }}>
            <it.icon size={12} /> {it.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Terminal (premium activity log) ─────────────────────────
function ActivityTerminal({ logs, polling, compact }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
  return (
    <div style={{ background: T.ink, borderRadius: 12, fontFamily: MONO, overflow: "hidden", border: `1px solid #1B3358` }}>
      <div style={{ background: "#0F2947", padding: "9px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #1B3358" }}>
        <BsClockHistory size={12} color="#6C86A8" />
        <span style={{ fontSize: 11, color: "#8FA6C4", letterSpacing: "0.03em" }}>pipeline · activity</span>
        {polling && (
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, color: "#4ADE80" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block", animation: "pulseDot 1.2s ease-in-out infinite" }} /> LIVE
          </span>
        )}
      </div>
      <div style={{ padding: "12px 16px", minHeight: compact ? 90 : 140, maxHeight: compact ? 160 : 220, overflowY: "auto" }}>
        {logs.length === 0 && <span style={{ fontSize: 12, color: "#3C5170" }}>Waiting for activity…</span>}
        {logs.map((log, i) => {
          const st = log.status || "INFO";
          const ts = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "";
          return (
            <div key={i} style={{ display: "flex", gap: 10, fontSize: 12, lineHeight: 1.8, color: LOG_COLOR[st] || "#94a3b8" }}>
              <span style={{ color: "#3C5170", minWidth: 68, fontSize: 10, marginTop: 2 }}>{ts}</span>
              <span>{log.message}</span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ── Document preview with zoom / rotate (presentational only) ─
function DocumentPreview({ file, fileName }) {
  const [objUrl, setObjUrl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  const isPdf = fileName?.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setObjUrl(url);
    setZoom(1); setRotate(0);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file || !objUrl) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: T.ink, borderRadius: 12, color: "#4B6485", gap: 10 }}>
        <PiFileMagnifyingGlassDuotone size={30} />
        <span style={{ fontSize: 12 }}>No preview available</span>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", borderRadius: 12, overflow: "hidden", background: T.ink, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#0F2947", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1B3358", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#8FA6C4", fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "42%" }}>{fileName}</span>
        <div style={{ display: "flex", gap: 4 }}>
          {!isPdf && (
            <>
              <IconBtn onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} title="Zoom out"><MdOutlineZoomOut size={14} /></IconBtn>
              <IconBtn onClick={() => setZoom(z => Math.min(3, z + 0.25))} title="Zoom in"><MdOutlineZoomIn size={14} /></IconBtn>
              <IconBtn onClick={() => setRotate(r => (r + 90) % 360)} title="Rotate"><MdOutlineRotate90DegreesCcw size={14} /></IconBtn>
            </>
          )}
          <a href={objUrl} download={fileName} style={{ background: "#1B3358", border: "none", borderRadius: 6, width: 26, height: 26, color: "#8FA6C4", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }} title="Download">
            <FiDownload size={13} />
          </a>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
        {isPdf ? (
          <iframe src={objUrl} title="Document Preview" style={{ width: "100%", height: "100%", border: "none", borderRadius: 6, background: "#fff" }} />
        ) : (
          <img src={objUrl} alt="Document Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 6, boxShadow: "0 4px 24px rgba(0,0,0,0.5)", transform: `scale(${zoom}) rotate(${rotate}deg)`, transition: "transform 0.2s" }} />
        )}
      </div>
    </div>
  );
}
function IconBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{ background: "#1B3358", border: "none", borderRadius: 6, width: 26, height: 26, color: "#8FA6C4", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </button>
  );
}

// ── Hierarchy Navigator (sticky left rail) ───────────────────
function NavSection({ level, icon: Icon, title, color, bg, isOpen, resolvedLabel, disabled, loading, empty, onToggle, query, onQuery, children }) {
  const done = !!resolvedLabel;
  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      <button
        onClick={() => !disabled && onToggle(isOpen ? null : level)}
        disabled={disabled}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "13px 16px",
          background: isOpen ? T.canvas : "transparent", border: "none", cursor: disabled ? "default" : "pointer",
          textAlign: "left", opacity: disabled ? 0.45 : 1, transition: "background 0.15s",
        }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 8, background: done ? color : bg, color: done ? "#fff" : color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.muted }}>{title}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: done ? T.ink : T.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {resolvedLabel || (disabled ? "Locked" : "Not selected")}
          </div>
        </div>
        {done && !isOpen && <HiPencil size={13} color={T.muted} />}
        {!disabled && (isOpen ? <HiOutlineChevronDown size={15} color={T.muted} /> : <HiOutlineChevronRight size={15} color={T.muted} />)}
      </button>

      {isOpen && !disabled && (
        <div style={{ padding: "0 12px 14px" }}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <IoSearch size={13} color={T.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={query}
              onChange={e => onQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}…`}
              style={{ width: "100%", padding: "8px 10px 8px 30px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12.5, outline: "none", background: T.surface, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
            {loading && <SkeletonRows />}
            {!loading && empty && <div style={{ fontSize: 12, color: T.muted, padding: "10px 8px" }}>{empty}</div>}
            {!loading && children}
          </div>
        </div>
      )}
    </div>
  );
}
function NavRow({ label, sub, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%",
      padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
      background: active ? `${color}14` : "transparent",
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.canvas; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? color : T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
        {sub && <div style={{ fontSize: 10.5, color: T.muted }}>{sub}</div>}
      </span>
      {active && <HiCheckCircle size={14} color={color} style={{ flexShrink: 0 }} />}
    </button>
  );
}
function SkeletonRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 8px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ height: 28, borderRadius: 6, background: `linear-gradient(90deg, ${T.canvas} 25%, #E4E9F1 37%, ${T.canvas} 63%)`, backgroundSize: "400% 100%", animation: "shimmer 1.4s ease infinite" }} />
      ))}
    </div>
  );
}
function GuideModal({ open, onClose }) {
  if (!open) return null;
  const steps = [
    { title: "Resolve the Hierarchy", desc: "Use the navigator on the left to pick a Company Code, Plant, Department, Category, and Document Type in order." },
    { title: "Upload a File", desc: "Once the hierarchy is complete, drag & drop a file (or click to browse) into the Upload Center." },
    { title: "OCR Processing", desc: "The document is automatically scanned — watch the activity log for live progress." },
    { title: "Review Extracted Fields", desc: "Check the fields OCR extracted next to the document preview. Colored dots show confidence — green is high, amber is mid, red is low." },
    { title: "Generate TCode & Save", desc: "Click Generate TCode, review the summary, then Save to archive to SAP. If approval is required, it routes automatically and finalizes once approved." },
  ];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(11,31,58,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.surface, borderRadius: 16, width: "100%", maxWidth: 420, boxShadow: "0 20px 50px rgba(11,31,58,0.25)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HiInformationCircle size={17} color="#fff" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Upload Workflow — Guide</span>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: T.canvas, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkSoft }}>
            <HiXMark size={15} />
          </button>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16, maxHeight: "60vh", overflowY: "auto" }}>
          {steps.map((s, i) => (
            <div key={s.title} style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#E8F1FD", color: T.primary, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>{s.title}</div>
                <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}` }}>
          <button onClick={onClose} style={{ width: "100%", padding: "9px 0", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
function SectionTitle({ title, sub, icon: Icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E8F1FD", color: T.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {Icon && <Icon size={17} />}
      </div>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.ink }}>{title}</h2>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: T.muted }}>{sub}</p>
      </div>
    </div>
  );
}


// ── Main ─────────────────────────────────────────────────────
export default function UploadWorkflowPage() {
  // Enterprise hierarchy: Company Code -> Plant -> Department -> Category -> Document Type
  const [companyCodes, setCompanyCodes]           = useState([]);
  const [plants, setPlants]                       = useState([]);
  const [selectedCC, setSelectedCC]               = useState(null);
  const [selectedPlant, setSelectedPlant]         = useState(null);
  const [loadingPlants, setLoadingPlants]         = useState(false);
  const [loadingDepts, setLoadingDepts]           = useState(false);

  const [departments, setDepartments]             = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState("");
  const [selectedDept, setSelectedDept]           = useState(null);
  const [selectedCat, setSelectedCat]             = useState(null);
  const [selectedDocType, setSelectedDocType]     = useState(null);
  const [dragOver, setDragOver]                   = useState(false);
  const [uploading, setUploading]                 = useState(false);
  const [uploadError, setUploadError]             = useState("");

  // Step tracking
  const [step, setStep]                           = useState(0);
  const [documentId, setDocumentId]               = useState(null);
  const [fileName, setFileName]                   = useState("");
  const [uploadedFile, setUploadedFile]           = useState(null); // keep File object for preview
  const [ocrStatus, setOcrStatus]                 = useState(null);
  const [ocrFields, setOcrFields]                 = useState(null);
  const [activityLogs, setActivityLogs]           = useState([]);
  const [polling, setPolling]                     = useState(false);

  // Step 3: editable OCR fields
  const [editedFields, setEditedFields]           = useState({});
  const [dynamicFields, setDynamicFields]         = useState([]); // MetadataField[] for this document's assigned template
  const [dynamicConfidence, setDynamicConfidence] = useState({});
  const [dynamicErrors, setDynamicErrors]         = useState({});
  const [dynamicMetaLoaded, setDynamicMetaLoaded] = useState(false);

  // Step 4: tcode + live terminal for tcode/sap
  const [tcode, setTcode]                         = useState(null);
  const [tcodeLoading, setTcodeLoading]           = useState(false);
  const [finalizing, setFinalizing]               = useState(false);
  const [finalized, setFinalized]                 = useState(false);

  // Approval Engine: set from the /generate-tcode response. When true, SAP
  // upload is gated behind the configured approval workflow and the manual
  // "Save to SAP" button must not be shown — the Approval Engine finalizes
  // to SAP automatically on final approval.
  const [approvalRequired, setApprovalRequired]   = useState(false);
  const [documentApprovalId, setDocumentApprovalId] = useState(null);

  // Live terminal logs for step 4 (tcode gen + SAP save)
  const [step4Logs, setStep4Logs]                 = useState([]);
  const [step4Polling, setStep4Polling]           = useState(false);

  // ── UI-only state (navigator accordion + local search) ──────
  const [navOpenLevel, setNavOpenLevel]           = useState("cc");
  const [showGuide, setShowGuide]                 = useState(false);  const [q, setQ]                                 = useState({ cc: "", plant: "", dept: "", cat: "", doctype: "" });
  const setQFor = (level) => (val) => setQ(prev => ({ ...prev, [level]: val }));

  // Load company codes on mount
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

  // Load plants when a company code is selected
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

  // Load dept/cat/docType tree when a plant is selected
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
        const cats  = (await catRes.json()).data  || [];
        const dts   = (await dtRes.json()).data   || [];
        setDepartments(depts.map(d => ({
          ...d,
          categories: cats.filter(c => c.departmentId === d.id).map(c => ({
            ...c, documentTypes: dts.filter(dt => dt.categoryId === c.id).map(dt => ({ id: dt.id, name: dt.name }))
          }))
        })));
      } catch (e) { setError(e.message); }
      finally { setLoadingDepts(false); }
    }
    fetchTree();
  }, [selectedPlant]);

  // Poll OCR status + activity while processing (step 2)
  useEffect(() => {
    if (!polling || !documentId) return;
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };
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
          if (sData.status === "OCR_COMPLETED" || sData.status === "WAITING_FOR_APPROVAL" || sData.status === "COMPLETED") {
            setPolling(false);
            // Dynamic Metadata Template Engine — load whatever fields the
            // template assigned to this document's document type defines,
            // rather than a hardcoded Invoice/PO/Vendor field list.
            try {
              const metaRes = await metadataApi.getDocumentMetadata(documentId);
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
            setStep(3);
          } else if (sData.status === "FAILED") {
            setPolling(false);
            setStep(3);
          }
        }
      } catch {}
    }, 2000);
    return () => clearInterval(timer);
  }, [polling, documentId]);

  // Poll activity logs for step 4 (tcode + sap)
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
        if (sData.success) {
          if (sData.status === "COMPLETED" || sData.status === "FAILED") {
            setStep4Polling(false);
            if (sData.status === "COMPLETED") setFinalized(true);
          }
        }
      } catch {}
    }, 1500);
    return () => clearInterval(timer);
  }, [step4Polling, documentId]);

  const handleDeptSelect = (d) => { setSelectedDept(d); setSelectedCat(null); setSelectedDocType(null); setNavOpenLevel("cat"); };
  const handleCatSelect  = (c) => { setSelectedCat(c); setSelectedDocType(null); setNavOpenLevel("doctype"); };
  const handleDocTypeSelect = (dt) => { setSelectedDocType(dt); setStep(1); setNavOpenLevel(null); };

  const handleFileUpload = async (file) => {
    if (!file || !selectedDocType) return;
    setUploading(true); setUploadError(""); setActivityLogs([]);
    setUploadedFile(file); // store for preview
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("documentTypeId", selectedDocType.id);
      const res  = await fetch(`${API}/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Upload failed");
      setDocumentId(data.documentId);
      setFileName(file.name);
      setStep(2);
      setPolling(true);
    } catch (e) { setUploadError(e.message); setUploadedFile(null); }
    finally { setUploading(false); }
  };

  const handleGenerateTcode = async () => {
    setTcodeLoading(true);
    // Add initial log entry immediately
    setStep4Logs(prev => [...prev, { message: "Generating TCode...", status: "PROCESSING", timestamp: new Date() }]);
    try {
      const res  = await fetch(`${API}/documents/${documentId}/generate-tcode`, {
        method: "POST", headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setTcode(data.tcode);
        setApprovalRequired(!!data.approvalRequired);
        setDocumentApprovalId(data.documentApprovalId || null);
        setStep4Logs(prev => [...prev, { message: `TCode generated: ${data.tcode}`, status: "SUCCESS", timestamp: new Date() }]);
        if (data.approvalRequired) {
          setStep4Logs(prev => [...prev, { message: "Approval required — routed to Level 1 approver", status: "SUCCESS", timestamp: new Date() }]);
        }
        setStep(4);
      }
    } catch {
      setStep4Logs(prev => [...prev, { message: "TCode generation failed", status: "FAILED", timestamp: new Date() }]);
    }
    finally { setTcodeLoading(false); }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    setStep4Logs(prev => [...prev, { message: "Saving document to SAP...", status: "PROCESSING", timestamp: new Date() }]);
    setStep4Polling(true);
    try {
      const res = await fetch(`${API}/documents/${documentId}/finalize`, {
        method: "POST", headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setStep4Logs(prev => [...prev, { message: "Document archived successfully", status: "SUCCESS", timestamp: new Date() }]);
        setFinalized(true);
        setStep4Polling(false);
      }
    } catch {
      setStep4Logs(prev => [...prev, { message: "SAP save failed", status: "FAILED", timestamp: new Date() }]);
      setStep4Polling(false);
    }
    finally { setFinalizing(false); }
  };

  const handleLogout = () => { localStorage.removeItem("accessToken"); localStorage.removeItem("refreshToken"); window.location.href = "/login"; };

  const resetFlow = () => {
    setStep(0); setSelectedDocType(null); setSelectedCat(null); setSelectedDept(null);
    setSelectedCC(null); setSelectedPlant(null);
    setDocumentId(null); setFileName(""); setUploadedFile(null);
    setOcrStatus(null); setOcrFields(null);
    setDynamicFields([]); setDynamicConfidence({}); setDynamicErrors({}); setDynamicMetaLoaded(false);
    setActivityLogs([]); setEditedFields({}); setTcode(null); setFinalized(false);
    setUploadError(""); setStep4Logs([]); setStep4Polling(false);
    setApprovalRequired(false); setDocumentApprovalId(null);
    setNavOpenLevel("cc"); setQ({ cc: "", plant: "", dept: "", cat: "", doctype: "" });
  };

  const cats = selectedDept?.categories || [];
  const dts  = selectedCat?.documentTypes || [];

  const ccList     = companyCodes.filter(c => matches(`${c.name} ${c.code}`, q.cc));
  const plantList  = plants.filter(p => matches(`${p.name} ${p.code}`, q.plant));
  const deptList   = departments.filter(d => matches(d.name, q.dept));
  const catList    = cats.filter(c => matches(c.name, q.cat));
  const dtList     = dts.filter(dt => matches(dt.name, q.doctype));

  const hierarchyComplete = !!selectedDocType;
  const showUploadCenter = hierarchyComplete && (step === 0 || step === 1);

  return (
    <div style={{ minHeight: "100vh", background: T.canvas, fontFamily: FONT, color: T.ink }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseDot { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.28s ease forwards; }
        input:focus { border-color: ${T.primary} !important; box-shadow: 0 0 0 3px ${T.primary}1A; }
        button:focus-visible { outline: 2px solid ${T.primary}; outline-offset: 2px; }
      `}</style>

      {/* Header */}
      {/* <div style={{ background: T.ink, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaDatabase size={13} color="#fff" />
          </div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: "0.01em" }}>SAP Document Portal</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <HeaderIconBtn><IoNotifications size={16} /></HeaderIconBtn>
          <HeaderIconBtn><IoSettingsSharp size={16} /></HeaderIconBtn>
          <HeaderIconBtn><FaCircleUser size={16} /></HeaderIconBtn>
          <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "7px 13px", color: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginLeft: 6 }}>
            <LuLogOut size={14} /> Logout
          </button>
        </div>
      </div> */}

            <div style={{ padding: "18px 24px", maxWidth: 1440, margin: "0 auto" }}>
                <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.ink }}>Upload Workflow</h1>
            <button
              onClick={() => setShowGuide(true)}
              title="Click to see a step-by-step guide on how to use this page."
              style={{ width: 18, height: 18, borderRadius: "50%", border: "none", background: T.canvas, color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <HiInformationCircle size={16} />
            </button>
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: T.muted }}>
            Documents → <span style={{ fontWeight: 700, color: T.inkSoft }}>Upload Workflow</span>
            <span style={{ margin: "0 8px", opacity: 0.4 }}>·</span>
            Upload, OCR, review, and archive a document to SAP end-to-end
          </p>
        </div>
        <Stepper current={step} />

        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, marginBottom: 8, boxShadow: "0 1px 2px rgba(11,31,58,0.04)" }}>
          <CrumbBar cc={selectedCC} plant={selectedPlant} dept={selectedDept} cat={selectedCat} docType={selectedDocType} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "flex-start" }}>

          {/* ══ LEFT: Sticky Hierarchy Navigator ══ */}
          <div style={{
            position: "sticky", top: 18, background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`,
            boxShadow: "0 1px 2px rgba(11,31,58,0.04)", overflow: "hidden",
          }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted }}>Workspace Navigator</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Resolve the hierarchy to unlock upload</div>
            </div>

            {error && (
              <div style={{ margin: "12px 16px", display: "flex", gap: 8, alignItems: "flex-start", background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: 10, padding: "10px 12px", color: T.danger, fontSize: 12 }}>
                <MdErrorOutline size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
              </div>
            )}

            <NavSection level="cc" icon={HiBuildingOffice2} title="Company Code" color={T.primary} bg="#E8F1FD"
              isOpen={navOpenLevel === "cc"} resolvedLabel={selectedCC ? `${selectedCC.name}` : ""}
              disabled={false} loading={loading} onToggle={setNavOpenLevel}
              query={q.cc} onQuery={setQFor("cc")}
              empty={ccList.length === 0 ? "No company codes yet." : null}
            >
              {ccList.map(c => (
                <NavRow key={c.id} label={c.name} sub={c.code} color={T.primary} active={selectedCC?.id === c.id} onClick={() => { setSelectedCC(c); setNavOpenLevel("plant"); }} />
              ))}
            </NavSection>

            <NavSection level="plant" icon={FaIndustry} title="Plant" color={T.success} bg={T.successBg}
              isOpen={navOpenLevel === "plant"} resolvedLabel={selectedPlant ? selectedPlant.name : ""}
              disabled={!selectedCC} loading={loadingPlants} onToggle={setNavOpenLevel}
              query={q.plant} onQuery={setQFor("plant")}
              empty={selectedCC && plantList.length === 0 ? "No plants under this company code." : null}
            >
              {plantList.map(p => (
                <NavRow key={p.id} label={p.name} sub={p.code} color={T.success} active={selectedPlant?.id === p.id} onClick={() => { setSelectedPlant(p); setNavOpenLevel("dept"); }} />
              ))}
            </NavSection>

            <NavSection level="dept" icon={MdApartment} title="Department" color={T.primary} bg="#E8F1FD"
              isOpen={navOpenLevel === "dept"} resolvedLabel={selectedDept ? selectedDept.name : ""}
              disabled={!selectedPlant} loading={loadingDepts} onToggle={setNavOpenLevel}
              query={q.dept} onQuery={setQFor("dept")}
              empty={selectedPlant && deptList.length === 0 ? "No departments in this plant." : null}
            >
              {deptList.map(d => (
                <NavRow key={d.id} label={d.name} sub={`${d.categories.length} categories`} color={T.primary} active={selectedDept?.id === d.id} onClick={() => handleDeptSelect(d)} />
              ))}
            </NavSection>

            <NavSection level="cat" icon={PiFoldersFill} title="Category" color={T.warning} bg={T.warningBg}
              isOpen={navOpenLevel === "cat"} resolvedLabel={selectedCat ? selectedCat.name : ""}
              disabled={!selectedDept} loading={false} onToggle={setNavOpenLevel}
              query={q.cat} onQuery={setQFor("cat")}
              empty={selectedDept && catList.length === 0 ? "No categories in this department." : null}
            >
              {catList.map(c => (
                <NavRow key={c.id} label={c.name} sub={`${c.documentTypes.length} doc types`} color={T.warning} active={selectedCat?.id === c.id} onClick={() => handleCatSelect(c)} />
              ))}
            </NavSection>

            <NavSection level="doctype" icon={LuFileText} title="Document Type" color={T.purple} bg={T.purpleBg}
              isOpen={navOpenLevel === "doctype"} resolvedLabel={selectedDocType ? selectedDocType.name : ""}
              disabled={!selectedCat} loading={false} onToggle={setNavOpenLevel}
              query={q.doctype} onQuery={setQFor("doctype")}
              empty={selectedCat && dtList.length === 0 ? "No document types in this category." : null}
            >
              {dtList.map(dt => (
                <NavRow key={dt.id} label={dt.name} color={T.purple} active={selectedDocType?.id === dt.id} onClick={() => handleDocTypeSelect(dt)} />
              ))}
            </NavSection>
          </div>

          {/* ══ RIGHT: Main Workspace ══ */}
          <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "26px 30px", boxShadow: "0 1px 2px rgba(11,31,58,0.04)", minHeight: 560 }}>

            {/* Empty state: hierarchy not yet resolved */}
            {(step === 0 || step === 1) && !hierarchyComplete && (
              <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 480, textAlign: "center", gap: 18 }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: "#E8F1FD", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HiBuildingOffice2 size={28} color={T.primary} />
                </div>
                <div>
                  <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: T.ink }}>Resolve the hierarchy to begin</h2>
                  <p style={{ margin: 0, fontSize: 13, color: T.muted, maxWidth: 380 }}>
                    Use the navigator on the left to choose a company code, plant, department, category, and document type. The upload center unlocks once all five are set.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 22, marginTop: 8 }}>
                  {STEPS.map((s, i) => (
                    <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: T.canvas, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}>
                        <s.icon size={15} />
                      </div>
                      <span style={{ fontSize: 10.5, color: T.muted, fontWeight: 600 }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Center */}
            {showUploadCenter && (
              <div className="fade-up">
                <SectionTitle title="Upload Center" sub={`Uploading to ${selectedDocType.name}`} icon={FiUploadCloud} />
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
                  onClick={() => !uploading && document.getElementById("__file__").click()}
                  style={{
                    border: `2px dashed ${dragOver ? T.primary : T.borderStrong}`,
                    borderRadius: 14, padding: "44px 20px", textAlign: "center",
                    background: dragOver ? "#E8F1FD" : T.canvas,
                    cursor: uploading ? "default" : "pointer", transition: "all 0.2s",
                  }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fff", boxShadow: "0 2px 6px rgba(11,31,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <FiUploadCloud size={24} color={T.primary} style={uploading ? { animation: "spin 1.4s linear infinite" } : undefined} />
                  </div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.ink }}>{uploading ? "Uploading…" : "Drag & drop a file, or click to browse"}</p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: T.muted }}>Supported: PDF, PNG, JPG · Max size 25 MB</p>
                </div>
                <input id="__file__" type="file" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; e.target.value = ""; if (f) handleFileUpload(f); }} />

                {uploading && uploadedFile && (
                  <div style={{ marginTop: 16, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <LuFileText size={18} color={T.primary} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{uploadedFile.name}</div>
                      <div style={{ height: 5, borderRadius: 3, background: T.canvas, marginTop: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: "70%", background: T.primary, borderRadius: 3, animation: "shimmer 1.2s ease infinite" }} />
                      </div>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: 10, padding: "10px 14px", color: T.danger, fontSize: 13 }}>
                    <MdErrorOutline size={16} /> {uploadError}
                  </div>
                )}
              </div>
            )}

            {/* ══ OCR Processing ══ */}
            {step === 2 && (
              <div className="fade-up">
                <SectionTitle title="OCR Processing" sub={`Processing ${fileName}`} icon={RiScan2Line} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "11px 16px", background: T.warningBg, border: `1px solid ${T.warningBorder}`, borderRadius: 10 }}>
                  <RiScan2Line size={16} color={T.warning} style={{ animation: "spin 1.6s linear infinite", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: T.warning, fontWeight: 600 }}>Extracting fields — this may take a few seconds…</span>
                </div>
                <ActivityTerminal logs={activityLogs} polling={polling} />
              </div>
            )}

            {/* ══ OCR Review — Split Layout ══ */}
            {step === 3 && (
              <div className="fade-up">
                <SectionTitle title="OCR Review" sub={`Extracted from ${fileName}`} icon={TbChecklist} />

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "10px 16px", background: ocrStatus === "FAILED" ? T.dangerBg : T.successBg, border: `1px solid ${ocrStatus === "FAILED" ? T.dangerBorder : T.successBorder}`, borderRadius: 10 }}>
                  {ocrStatus === "FAILED" ? <MdErrorOutline size={15} color={T.danger} /> : <HiCheckCircle size={15} color={T.success} />}
                  <span style={{ fontSize: 13, fontWeight: 600, color: ocrStatus === "FAILED" ? T.danger : T.success }}>
                    {ocrStatus === "FAILED" ? "OCR failed — you can still proceed manually" : "OCR completed successfully"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                  <div style={{ height: 480 }}>
                    <PanelLabel icon={LuFileText} text="Document Preview" />
                    <div style={{ height: "calc(100% - 26px)" }}>
                      <DocumentPreview file={uploadedFile} fileName={fileName} />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <PanelLabel icon={TbChecklist} text="Extracted Fields" />
                      <div style={{ display: "flex", gap: 10, fontSize: 10.5, color: T.muted }}>
                        <LegendDot color={T.success} label="High" />
                        <LegendDot color={T.warning} label="Mid" />
                        <LegendDot color={T.danger} label="Low" />
                      </div>
                    </div>
                    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", flex: 1, overflowY: "auto" }}>
                      {dynamicMetaLoaded && dynamicFields.length === 0 && (
                        <div style={{ padding: 16, fontSize: 12, color: T.muted }}>
                          No metadata template is assigned to this document type yet — ask a Tenant Admin to create one under Metadata Templates.
                        </div>
                      )}
                      {dynamicFields.map((field) => {
                        const conf = confidenceLabel(dynamicConfidence[field.internalName]);
                        const dotColor = confidenceColor(conf);
                        const fieldErrors = dynamicErrors?.[field.internalName] || [];
                        return (
                          <div key={field.internalName} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>
                            <span style={{ width: 104, fontSize: 11, color: T.muted, flexShrink: 0, paddingTop: 7 }}>{field.label}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <FieldRenderer
                                field={field}
                                value={editedFields[field.internalName]}
                                onChange={(v) => setEditedFields((prev) => ({ ...prev, [field.internalName]: v }))}
                                error={fieldErrors[0]}
                                disabled={field.readonly}
                              />
                              {fieldErrors[0] && <div style={{ marginTop: 3, fontSize: 10.5, color: T.danger }}>{fieldErrors[0]}</div>}
                            </div>
                            {!field.readonly && <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, display: "inline-block", flexShrink: 0, marginTop: 10 }} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <details style={{ marginBottom: 20 }}>
                  <summary style={{ fontSize: 12, color: T.muted, cursor: "pointer", marginBottom: 8 }}>View activity log</summary>
                  <ActivityTerminal logs={activityLogs} polling={false} compact />
                </details>

                <div style={{ display: "flex", justifyContent: "flex-end", position: "sticky", bottom: 0, background: T.surface, paddingTop: 6 }}>
                  <button onClick={handleGenerateTcode} disabled={tcodeLoading}
                    style={{ padding: "11px 28px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, opacity: tcodeLoading ? 0.7 : 1 }}>
                    {tcodeLoading ? <>Generating…</> : <>Generate TCode <HiOutlineChevronRight size={15} /></>}
                  </button>
                </div>
              </div>
            )}

            {/* ══ TCode + Finalize ══ */}
            {step === 4 && !finalized && (
              <div className="fade-up">
                <SectionTitle title="TCode & SAP Archive" sub={`Document: ${fileName}`} icon={FaDatabase} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ height: 240 }}>
                      <PanelLabel icon={LuFileText} text="Document" />
                      <div style={{ height: "calc(100% - 26px)" }}>
                        <DocumentPreview file={uploadedFile} fileName={fileName} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: step4Polling ? T.success : T.muted, display: "inline-block" }} />
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted }}>Pipeline & Approval Activity</span>
                      </div>
                      <ActivityTerminal logs={step4Logs} polling={step4Polling} />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {tcode && (
                      <div style={{ padding: "18px 20px", background: T.successBg, border: `1.5px solid ${T.successBorder}`, borderRadius: 14, display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 42, height: 42, borderRadius: "50%", background: T.success, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <HiCheckCircle size={20} color="#fff" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 11, color: T.success, fontWeight: 600 }}>Transaction Code Generated</p>
                          <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: T.ink, fontFamily: MONO, letterSpacing: "0.04em" }}>{tcode}</p>
                        </div>
                      </div>
                    )}

                    <div style={{ border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", flex: 1 }}>
                      <div style={{ background: T.canvas, padding: "10px 16px", borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>Document Summary</span>
                      </div>
                      <div style={{ overflowY: "auto", maxHeight: 260 }}>
                        {dynamicFields.filter(f => editedFields[f.internalName]).map((f) => (
                          <div key={f.internalName} style={{ display: "flex", padding: "9px 16px", borderBottom: `1px solid ${T.border}` }}>
                            <span style={{ width: 120, fontSize: 11, color: T.muted }}>{f.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{String(editedFields[f.internalName])}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {approvalRequired ? (
                      <div style={{ padding: "16px 18px", background: T.warningBg, border: `1.5px solid ${T.warningBorder}`, borderRadius: 14, display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.warning, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <HiBolt size={18} color="#fff" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.warning }}>Pending Approval</p>
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: T.warning }}>
                            Waiting for Level 1 approval{documentApprovalId ? ` · #${documentApprovalId}` : ""} — SAP upload runs automatically once fully approved.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => setStep(3)} style={{ flex: 1, padding: "11px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", color: T.inkSoft, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                          Back
                        </button>
                        <button onClick={handleFinalize} disabled={finalizing}
                          style={{ flex: 2, padding: "11px 20px", borderRadius: 10, background: T.ink, color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: finalizing ? 0.7 : 1 }}>
                          <FaDatabase size={13} /> {finalizing ? "Saving…." : "Save "}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══ FINALIZED ══ */}
            {finalized && (
              <div className="fade-up" style={{ textAlign: "center", padding: "70px 0" }}>
                <div style={{ width: 76, height: 76, borderRadius: "50%", background: T.successBg, border: `2px solid ${T.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <HiCheckCircle size={38} color={T.success} />
                </div>
                <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: T.ink }}>Document Archived</h2>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: T.muted }}>File: <strong style={{ color: T.ink }}>{fileName}</strong></p>
                <p style={{ margin: "0 0 28px", fontSize: 13, color: T.muted }}>TCode: <strong style={{ fontFamily: MONO, color: T.ink }}>{tcode}</strong></p>
                <button onClick={resetFlow} style={{ padding: "12px 30px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <FiUploadCloud size={15} /> Upload Another Document
                </button>
              </div>
            )}

                 </div>
        </div>
      </div>
      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}

// ── Small helpers ────────────────────────────────────────────

// ── Small helpers ────────────────────────────────────────────
function HeaderIconBtn({ children }) {
  return (
    <button style={{ background: "transparent", border: "none", borderRadius: 8, width: 32, height: 32, color: "#B9C6DA", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {children}
    </button>
  );
}
function PanelLabel({ icon: Icon, text }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.muted, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
      <Icon size={12} color={T.primary} /> {text}
    </div>
  );
}
function LegendDot({ color, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} /> {label}
    </span>
  );
}