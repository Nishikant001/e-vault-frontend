import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Folder,
  FolderOpen,
  Search,
  MoreVertical,
  Upload,
  ChevronRight,
  ChevronDown,
  Hash,
  Info,
  X,
} from "lucide-react";
import {
  SAP_BLUE,
  SAP_DARK,
  SAP_LIGHT,
  SAP_AMBER,
  SAP_PURPLE,
  SAP_GREEN,
  STATUS_COLORS,
} from "../constants";
import UploadModal from "../modals/UploadModal";
import PreviewPanel from "../modals/PreviewPanel";
import ActionMenu from "../modals/ActionMenu";
import CheckOutModal from "../modals/CheckOutModal";
import CheckInModal from "../modals/CheckInModal";
import ForceUnlockModal from "../modals/ForceUnlockModal";
import LockBadge, { LockedByChip } from "../components/LockBadge";
import GlobalDocumentSearch from "../components/GlobalDocumentSearch";
// import TCodeSearchModal from "../modals/TCodeSearchModal";

// ─── API helpers ─────────────────────────────────────────────
import { API_BASE_URL } from "../../../../services/apiClient";

const API = API_BASE_URL;
function getToken() {
  return localStorage.getItem("accessToken") || "";
}
function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}
function decodeToken() {
  try {
    return JSON.parse(atob(getToken().split(".")[1]));
  } catch {
    return null;
  }
}

// ─── Status Badge ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || {
    bg: "#f1f5f9",
    color: "#64748b",
    border: "#e2e8f0",
  };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 20,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

// ── Guide / Info Modal ─────────────────────────────────────────
function GuideModal({ onClose }) {
  const steps = [
    {
      title: "Select Scope",
      desc: "Choose a Company Code and Plant at the top — documents are always scoped to a plant.",
    },
    {
      title: "Browse the Hierarchy",
      desc: "Click through Departments → Categories → Document Types in the four columns to drill down to your files.",
    },
    {
      title: "Search & Filter",
      desc: "Use each column's search box to filter, and use the Status / Lock filters above the document table to narrow results.",
    },
    {
      title: "View, Download & Lock",
      desc: "Click a row to preview it, use View/Download for quick access, and use the ⋮ menu for check-out, check-in, or force-unlock actions.",
    },
    {
      title: "TCode Pill",
      desc: "Click any TCode pill in the table to instantly copy it to your clipboard.",
    },
  ];
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: SAP_BLUE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Info size={16} color="#fff" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: SAP_DARK }}>
              Documents — Guide
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "none",
              background: "#f1f5f9",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div
          style={{
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          {steps.map((s, i) => (
            <div key={s.title} style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: `${SAP_BLUE}12`,
                  color: SAP_BLUE,
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div>
                <div
                  style={{ fontSize: 12.5, fontWeight: 700, color: SAP_DARK }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "#64748b",
                    marginTop: 2,
                    lineHeight: 1.5,
                  }}
                >
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "9px 0",
              borderRadius: 10,
              background: SAP_BLUE,
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TCode Pill ───────────────────────────────────────────────
function TCodePill({ tcode }) {
  const [copied, setCopied] = useState(false);
  if (!tcode) return <span style={{ fontSize: 12, color: "#cbd5e1" }}>—</span>;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      title="Click to copy TCode"
      style={{
        fontFamily: "monospace",
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 6,
        background: copied ? "#f0fdf4" : `${SAP_BLUE}10`,
        color: copied ? "#16a34a" : SAP_BLUE,
        border: `1px solid ${copied ? "#86efac" : `${SAP_BLUE}30`}`,
        cursor: "pointer",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        transition: "all 0.15s",
      }}
    >
      {copied ? "✓ Copied" : tcode}
    </button>
  );
}

export default function DMSPage({ onUploadFlow, onTCodeSearch }) {
  // ─── Hierarchy state: Company Code -> Plant ────────────────
  const [companyCodes, setCompanyCodes] = useState([]);
  const [plants, setPlants] = useState([]);
  const [selectedCC, setSelectedCC] = useState("");
  const [selectedPlant, setSelectedPlant] = useState("");
  const [loadingHierarchy, setLoadingHierarchy] = useState(true);
  const [loadingPlants, setLoadingPlants] = useState(false);

  // ─── Tree state ───────────────────────────────────────────
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ─── Selection state ──────────────────────────────────────
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState(null);

  // ─── Search state ─────────────────────────────────────────
  const [searchDept, setSearchDept] = useState("");
  const [searchCat, setSearchCat] = useState("");
  const [searchDocType, setSearchDocType] = useState("");
  const [searchDoc, setSearchDoc] = useState("");

  // ─── Docs state ───────────────────────────────────────────
  const [docs, setDocs] = useState([]);
  const [totalDocsCount, setTotalDocsCount] = useState(0);

  const [loadingDocs, setLoadingDocs] = useState(false);

  // ─── UI state ─────────────────────────────────────────────
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  // Enterprise Check-In/Check-Out: table-level lock filter — "" (all),
  // "CHECKED_OUT", "UNLOCKED", or "MINE" (my checked-out documents).
  const [lockFilter, setLockFilter] = useState("");
  // Quick lock actions triggered straight from the table row's "⋮" menu,
  // without having to open the PreviewPanel first.
  const [quickLockAction, setQuickLockAction] = useState(null); // { type: 'checkout'|'checkin'|'forceUnlock', doc }
  // const [showTCodeSearch, setShowTCodeSearch] = useState(false);
  const [viewingDocId, setViewingDocId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showDocTypeList, setShowDocTypeList] = useState(false);
  // Current signed-in user (id/role), decoded straight from the JWT —
  // used to decide which lock action buttons should even render.
  const currentUser = decodeToken();

  // ─── Fetch company codes on mount ──────────────────────────
  useEffect(() => {
    async function fetchCompanyCodes() {
      setLoadingHierarchy(true);
      setError("");
      try {
        const payload = decodeToken();
        if (!payload?.tenantId)
          throw new Error("Session invalid. Please login again.");
        const res = await fetch(`${API}/company-codes`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok || !data.success)
          throw new Error(data.message || "Failed to load company codes");
        setCompanyCodes(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingHierarchy(false);
      }
    }
    fetchCompanyCodes();
  }, []);

  // ─── Fetch plants when company code changes ────────────────
  useEffect(() => {
    setSelectedPlant("");
    setPlants([]);
    setDepartments([]);
    setSelectedDept(null);
    setSelectedCat(null);
    setSelectedDocType(null);
    if (!selectedCC) return;
    async function fetchPlants() {
      setLoadingPlants(true);
      try {
        const res = await fetch(`${API}/plants?companyCodeId=${selectedCC}`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (!res.ok || !data.success)
          throw new Error(data.message || "Failed to load plants");
        setPlants(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingPlants(false);
      }
    }
    fetchPlants();
  }, [selectedCC]);

  // ─── Fetch department tree when plant changes ──────────────
  useEffect(() => {
    setDepartments([]);
    setSelectedDept(null);
    setSelectedCat(null);
    setSelectedDocType(null);
    if (!selectedPlant) return;

    async function fetchTree() {
      setLoading(true);
      setError("");
      try {
        const [deptRes, catRes, dtRes] = await Promise.all([
          fetch(`${API}/departments/plant/${selectedPlant}`, {
            headers: authHeaders(),
          }),
          fetch(`${API}/categories`, { headers: authHeaders() }),
          fetch(`${API}/document-types`, { headers: authHeaders() }),
        ]);

        const deptData = await deptRes.json();
        const catData = await catRes.json();
        const dtData = await dtRes.json();

        if (!deptRes.ok)
          throw new Error(deptData.message || "Failed to load departments");

        const cats = catData.data || catData || [];
        const dts = dtData.data || dtData || [];

        // `/categories` and `/document-types` are already scoped server-side
        // to this user's Dynamic User Assignment Engine grants. `/departments`
        // is NOT — it returns every department mapped to the plant regardless
        // of assignment. So we build the full tree first, then (for every
        // role except the ones that manage assignments themselves) drop any
        // department that has zero categories left after that scoping —
        // a department with nothing under it is one the user can't access
        // at all. Purely frontend: no backend changes needed.
        const builtTree = (deptData.data || []).map((dept) => ({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          categories: cats
            .filter((c) => c.departmentId === dept.id)
            .map((cat) => ({
              id: cat.id,
              name: cat.name,
              documentTypes: dts
                .filter((d) => d.categoryId === cat.id)
                .map((dt) => ({
                  id: dt.id,
                  name: dt.name,
                  count: dt.documentCount ?? dt.count ?? dt.totalDocuments ?? 0,
                })),
            })),
        }));

        const isUnrestrictedRole =
          currentUser?.role === "TenantAdmin" ||
          currentUser?.role === "SuperAdmin";
        const tree = isUnrestrictedRole
          ? builtTree
          : builtTree.filter((dept) => dept.categories.length > 0);

        setDepartments(tree);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTree();
  }, [selectedPlant]);

  // ─── Filtered lists ───────────────────────────────────────
  const filtDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchDept.toLowerCase()),
  );
  const filtCats = (selectedDept?.categories || []).filter((c) =>
    c.name.toLowerCase().includes(searchCat.toLowerCase()),
  );
  const filtDocTypes = (selectedCat?.documentTypes || []).filter((dt) =>
    dt.name.toLowerCase().includes(searchDocType.toLowerCase()),
  );
  const filtDocs = docs.filter((d) => {
    const matchName = (d.originalFileName || d.name || "")
      .toLowerCase()
      .includes(searchDoc.toLowerCase());
    const matchTCode = (d.tcode || "")
      .toLowerCase()
      .includes(searchDoc.toLowerCase());
    const matchSapId = (d.sapDocumentId || "") // ← YEH NAYI LINE
      .toLowerCase()
      .includes(searchDoc.toLowerCase());
    const matchStatus = filterStatus
      ? (d.uploadStatus || d.status) === filterStatus
      : true;
    const matchLock = !lockFilter
      ? true
      : lockFilter === "CHECKED_OUT"
        ? !!d.isCheckedOut
        : lockFilter === "UNLOCKED"
          ? !d.isCheckedOut
          : lockFilter === "MINE"
            ? !!d.isCheckedOut && d.checkedOutBy === currentUser?.id
            : true;
    return (matchName || matchTCode || matchSapId) && matchStatus && matchLock; // ← YAHAN matchSapId ADD KIYA
  });

  // ─── Handlers ─────────────────────────────────────────────
  const handleDeptSelect = (d) => {
    setSelectedDept(d);
    setSelectedCat(null);
    setSelectedDocType(null);
    setSearchCat("");
    setSearchDocType("");
    setDocs([]);
    setShowDocTypeList(false);
  };
  const handleCatSelect = (c) => {
    setSelectedCat(c);
    setSelectedDocType(null);
    setSearchDocType("");
    setDocs([]);
    setShowDocTypeList(false);
  };
  const handleDTSelect = async (dt) => {
    setSelectedDocType(dt);
    setSearchDoc("");
    setFilterStatus("COMPLETED");
    setLoadingDocs(true);
    setDocs([]);
    try {
      const res = await fetch(`${API}/documents?documentTypeId=${dt.id}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      const fetchedDocs = data.data || [];
      setDocs(fetchedDocs);
      setTotalDocsCount(data.total ?? fetchedDocs.length);

      // Count update karo tree mein
      setDepartments((prev) =>
        prev.map((dept) => ({
          ...dept,
          categories: dept.categories.map((cat) => ({
            ...cat,
            documentTypes: cat.documentTypes.map((d) =>
              d.id === dt.id
                ? { ...d, count: data.total ?? fetchedDocs.length }
                : d,
            ),
          })),
        })),
      );
    } catch {
      setDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  // ── View document (open in new tab or inline)
  const handleViewDoc = async (doc) => {
    setViewingDocId(doc.id);
    try {
      const res = await fetch(`${API}/documents/${doc.id}/view`, {
        headers: authHeaders(),
        cache: "no-store",
      });

      if (!res.ok) {
        let friendlyMsg = `Failed to load document (status ${res.status}).`;
        try {
          const errData = await res.json();
          friendlyMsg = errData.message || friendlyMsg;
        } catch {}
        throw new Error(friendlyMsg);
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error(
          `Empty response received from server (status ${res.status})`,
        );
      }

      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error("handleViewDoc error:", err);
      alert("Could not open document: " + err.message);
    } finally {
      setViewingDocId(null);
    }
  };

  // ── Download document
  const handleDownloadDoc = async (doc) => {
    try {
      const res = await fetch(`${API}/documents/${doc.id}/download`, {
        headers: {
          ...authHeaders(),
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        let friendlyMsg = `Failed to download document (status ${res.status}).`;
        try {
          const errData = await res.json();
          const rawMsg = errData.message || "";
          if (rawMsg.includes("No physical files linked")) {
            friendlyMsg =
              "This document has no file attached in SAP. Please contact the uploader or re-upload the file.";
          } else if (rawMsg) {
            friendlyMsg = rawMsg;
          }
        } catch {}
        throw new Error(friendlyMsg);
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error("Empty response received from server");
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.originalFileName || doc.name || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("handleDownloadDoc error:", err);
      alert("Could not download document: " + err.message);
    }
  };

  // Re-run OCR + dynamic metadata mapping for an already-uploaded
  // document (e.g. after adding/fixing an OCR alias on the template) —
  // no re-upload needed. Marks the row OCR_PROCESSING immediately, then
  // polls /:id/status until it flips to OCR_COMPLETED/FAILED so the
  // table + status badge stay in sync without a full page refresh.
  const handleReprocessOcr = async (doc) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, uploadStatus: "OCR_PROCESSING" } : d))
    );
    try {
      const res = await fetch(`${API}/documents/${doc.id}/reprocess-ocr`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Reprocess failed to start");
      }

      const poll = setInterval(async () => {
        try {
          const sRes = await fetch(`${API}/documents/${doc.id}/status`, { headers: authHeaders() });
          const sData = await sRes.json();
          if (!sData.success) return;
          if (sData.status === "OCR_PROCESSING") return; // still running

          clearInterval(poll);
          setDocs((prev) =>
            prev.map((d) => (d.id === doc.id ? { ...d, uploadStatus: sData.status } : d))
          );
          if (sData.status === "OCR_COMPLETED") {
            alert("OCR reprocessing complete — open the document to see the updated extracted fields.");
          } else if (sData.status === "FAILED") {
            alert("OCR reprocessing failed. Check the document's activity log for details.");
          }
        } catch {
          clearInterval(poll);
        }
      }, 2000);
    } catch (err) {
      console.error("handleReprocessOcr error:", err);
      alert("Could not reprocess OCR: " + err.message);
      setDocs((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, uploadStatus: doc.uploadStatus } : d))
      );
    }
  };

  // ── Action menu handler
  const handleAction = (action, doc) => {
    if (action === "view") handleViewDoc(doc);
    if (action === "download") handleDownloadDoc(doc);
    if (action === "reprocessOcr") handleReprocessOcr(doc);
    if (action === "delete") {
      if (window.confirm(`Delete ${doc.originalFileName || doc.name}?`)) {
        fetch(`${API}/documents/${doc.id}`, {
          method: "DELETE",
          headers: authHeaders(),
        })
          .then(() => setDocs((prev) => prev.filter((d) => d.id !== doc.id)))
          .catch(() => alert("Delete failed"));
      }
    }
    // Enterprise Check-In/Check-Out — quick actions straight from the table
    if (action === "checkout") setQuickLockAction({ type: "checkout", doc });
    if (action === "checkin") setQuickLockAction({ type: "checkin", doc });
    if (action === "forceUnlock")
      setQuickLockAction({ type: "forceUnlock", doc });
    // Preview stays in-panel
    if (
      ![
        "view",
        "download",
        "delete",
        "checkout",
        "checkin",
        "forceUnlock",
        "reprocessOcr",
      ].includes(action)
    ) {
      setPreviewDoc(doc);
    }
  };

  // Patches a single document's lock fields in local state after a
  // check-out/check-in/force-unlock completes, so the table (Lock Status /
  // Locked By / Checked Out Time columns) updates instantly without a
  // full refetch. `lock` is the lockStatusPayload shape returned by the API.
  const patchDocLock = (docId, lock) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              isCheckedOut: lock?.isCheckedOut ?? false,
              checkedOutBy: lock?.checkedOutBy ?? null,
              checkedOutByUser: lock?.checkedOutByUser ?? null,
              checkedOutAt: lock?.checkedOutAt ?? null,
              lockReason: lock?.lockReason ?? null,
              lockExpiry: lock?.lockExpiry ?? null,
            }
          : d,
      ),
    );
  };

  // ── TCode search result action (view/download/open)
  const handleTCodeDocAction = (doc, action) => {
    if (action === "view") handleViewDoc(doc);
    if (action === "download") handleDownloadDoc(doc);
    if (action === "open") setPreviewDoc(doc);
  };

  const handleUploaded = (docId, fileName) => {
    setShowUpload(false);
    onUploadFlow &&
      onUploadFlow(docId, fileName, selectedDept, selectedCat, selectedDocType);
  };

  // ─── Breadcrumb ───────────────────────────────────────────
  const breadcrumb = [
    selectedDept && { label: selectedDept.name, color: SAP_BLUE },
    selectedCat && { label: selectedCat.name, color: "#7C2D00" },
    selectedDocType && { label: selectedDocType.name, color: SAP_PURPLE },
  ].filter(Boolean);

  const TABLE_HEADERS = [
    "Document Name",
    "SAP Document ID",
    "TCode",
    "Version",
    "Status",
    "Lock Status",
    "Locked By",
    "Checked Out Time",
    "Uploaded By",
    "Upload Date",
    "Actions",
  ];

  // ─── Render ───────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        background: "#F0F4F8",
        fontFamily: "'72', Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes fadeSlide { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-slide { animation:fadeSlide 0.22s ease forwards; }
        .row-hover:hover { background:#f8faff !important; }
        .panel-item:hover { background:#f1f5f9; cursor:pointer; }
        .panel-item-active { background:${SAP_LIGHT} !important; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#cbd5e1; borderRadius:99px; }
      `}</style>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Topbar: breadcrumb + TCode search ── */}
        {/* ── Page header: title + guide ── */}
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #e2e8f0",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: SAP_DARK }}>
              Documents
            </span>
            <button
              onClick={() => setShowGuide(true)}
              title="Click to see a step-by-step guide on how to use this page."
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "none",
                background: "#e2e8f0",
                color: "#64748b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Info size={15} />
            </button>
          </div>
          <GlobalDocumentSearch onOpenDocument={handleViewDoc} />
        </div>
        {/* ── Document Type dropdown list (full width, replaces the old column) ── */}
        {/* ── Hierarchy selector: Company Code → Plant (moved above breadcrumb) ── */}{" "}
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #e2e8f0",
            padding: "8px 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            Scope
          </span>
          <select
            value={selectedCC}
            onChange={(e) => setSelectedCC(e.target.value)}
            disabled={loadingHierarchy}
            style={{
              fontSize: 12,
              padding: "5px 8px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              color: "#334155",
              background: "#f8fafc",
              outline: "none",
            }}
          >
            <option value="">
              {loadingHierarchy ? "Loading…" : "Select Company Code"}
            </option>
            {companyCodes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
          <select
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
            disabled={!selectedCC || loadingPlants}
            style={{
              fontSize: 12,
              padding: "5px 8px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              color: "#334155",
              background: "#f8fafc",
              outline: "none",
              opacity: !selectedCC ? 0.5 : 1,
            }}
          >
            <option value="">
              {loadingPlants ? "Loading…" : "Select Plant"}
            </option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>
        {/* ── Topbar: breadcrumb + TCode search ── */}
        {/* ── Topbar: breadcrumb + TCode search ── */}
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #e2e8f0",
            padding: "0 20px",
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            position: "relative", // ← YE LINE ADD KARO
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {breadcrumb.length > 0 && (
              <button
                onClick={() => {
                  if (selectedDocType) {
                    setSelectedDocType(null);
                    setDocs([]);
                    setSearchDocType("");
                  } else if (selectedCat) {
                    setSelectedCat(null);
                    setSelectedDocType(null);
                    setSearchCat("");
                    setSearchDocType("");
                  } else if (selectedDept) {
                    setSelectedDept(null);
                    setSelectedCat(null);
                    setSelectedDocType(null);
                    setSearchCat("");
                    setSearchDocType("");
                  }
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  color: "#64748b",
                  padding: "0 4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                ‹‹
              </button>
            )}
            {breadcrumb.length === 0 ? (
              <span style={{ fontSize: 13, color: "#94a3b8" }}>Documents</span>
            ) : (
              breadcrumb.map((b, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight size={13} color="#cbd5e1" />}
                  <span
                    onClick={() => {
                      if (i === 0) {
                        handleDeptSelect(selectedDept);
                      }
                      if (i === 1) {
                        handleCatSelect(selectedCat);
                      }
                    }}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: b.color,
                      cursor: i < breadcrumb.length - 1 ? "pointer" : "default",
                      textDecoration:
                        i < breadcrumb.length - 1 ? "underline" : "none",
                      textUnderlineOffset: 3,
                    }}
                  >
                    {b.label}
                  </span>
                </React.Fragment>
              ))
            )}
            {selectedCat && (
  <select
    value={selectedDocType?.id || ""}
    onChange={(e) => {
      const dt = filtDocTypes.find((d) => d.id === e.target.value) 
        || (selectedCat.documentTypes || []).find((d) => d.id === e.target.value);
      if (dt) handleDTSelect(dt);
    }}
    style={{
      fontSize: 12,
      padding: "5px 8px",
      borderRadius: 8,
      border: "1px solid #e2e8f0",
      color: "#334155",
      background: "#f8fafc",
      outline: "none",
      marginLeft: 8,
      cursor: "pointer",
    }}
  >
    <option value="">Select Document Type</option>
    {(selectedCat.documentTypes || []).map((dt) => (
      <option key={dt.id} value={dt.id}>
        {dt.name} ({dt.count || 0})
      </option>
    ))}
  </select>
)}
          </div>
          {/* TCode Search Button */}
          {/* <button
            onClick={() => setShowTCodeSearch(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 8,
              border: `1.5px solid ${SAP_BLUE}30`,
              background: `${SAP_BLUE}08`, color: SAP_BLUE,
              fontWeight: 600, fontSize: 12, cursor: "pointer",
            }}>
            <Hash size={13} />
            Search by TCode
          </button> */}
        </div>
        {/* ── Document Type dropdown list (full width, replaces the old column) ── */}
        {/* ── Document Type dropdown (floating, like a real select dropdown) ── */}
        {showDocTypeList && selectedCat && (
          <>
            {/* transparent overlay to close on outside click */}
            <div
              onClick={() => setShowDocTypeList(false)}
              style={{ position: "fixed", inset: 0, zIndex: 90 }}
            />
            <div
              style={{
                position: "absolute",
                top: 50, // topbar height ke turant neeche
                left: 20,
                minWidth: 260,
                maxWidth: 320,
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                padding: "12px",
                zIndex: 100,
              }}
            >
              <SearchBox
                value={searchDocType}
                onChange={setSearchDocType}
                placeholder="Search Doc Type"
              />
              <div style={{ maxHeight: 240, overflowY: "auto" }}>
                {filtDocTypes.length === 0 ? (
                  <EmptyMsg text="No document types" />
                ) : (
                  filtDocTypes.map((dt) => {
                    const active = selectedDocType?.id === dt.id;
                    return (
                      <button
                        key={dt.id}
                        onClick={() => {
                          handleDTSelect(dt);
                          setShowDocTypeList(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: active
                            ? `${SAP_PURPLE}10`
                            : "transparent",
                          cursor: "pointer",
                          textAlign: "left",
                          marginBottom: 2,
                        }}
                      >
                        <FileText
                          size={14}
                          color={active ? SAP_PURPLE : "#64748b"}
                        />
                        <span
                          style={{
                            flex: 1,
                            fontSize: 12,
                            fontWeight: active ? 700 : 500,
                            color: active ? SAP_PURPLE : "#334155",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {dt.name}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: active ? SAP_PURPLE : "#e2e8f0",
                            color: active ? "#fff" : "#64748b",
                            borderRadius: 20,
                            padding: "1px 7px",
                            flexShrink: 0,
                          }}
                        >
                          {dt.count || 0}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
        {/* Loading / Error */}
        {loading && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            Loading departments…
          </div>
        )}
        {error && (
          <div
            style={{
              margin: 16,
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 10,
              color: "#dc2626",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
        {!loading && !error && !selectedPlant && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            {!selectedCC
              ? "Select a Company Code above to browse its documents."
              : "Select a Plant above to browse its departments."}
          </div>
        )}
        {/* ── 4-Column Explorer ── */}
        {!loading && !error && selectedPlant && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Col 1: Departments */}
            <Column
              title="Departments"
              icon={<Folder size={14} color={SAP_BLUE} />}
              borderColor={SAP_BLUE}
              width={selectedDept ? 0 : 180}
            >
              <SearchBox
                value={searchDept}
                onChange={setSearchDept}
                placeholder="Search Department"
              />
              <div style={{ flex: 1, overflowY: "auto" }}>
                {filtDepts.length === 0 ? (
                  <EmptyMsg text="No departments found" />
                ) : (
                  filtDepts.map((d) => (
                    <PanelItem
                      key={d.id}
                      active={selectedDept?.id === d.id}
                      icon={
                        selectedDept?.id === d.id ? (
                          <FolderOpen size={15} color={SAP_BLUE} />
                        ) : (
                          <Folder size={15} color="#64748b" />
                        )
                      }
                      label={d.name}
                      sub={`${d.categories.length} categories`}
                      activeColor={SAP_BLUE}
                      onClick={() => handleDeptSelect(d)}
                    />
                  ))
                )}
              </div>
            </Column>

            {/* Col 2: Categories */}
            <Column
              title="Categories"
              icon={<Folder size={14} color={SAP_AMBER} />}
              borderColor={SAP_AMBER}
              width={selectedCat ? 0 : 180}
            >
              <SearchBox
                value={searchCat}
                onChange={setSearchCat}
                placeholder="Search Category"
              />
              <div style={{ flex: 1, overflowY: "auto" }}>
                {!selectedDept ? (
                  <EmptyMsg text="Select a department" />
                ) : filtCats.length === 0 ? (
                  <EmptyMsg text="No categories found" />
                ) : (
                  filtCats.map((c) => (
                    <PanelItem
                      key={c.id}
                      active={selectedCat?.id === c.id}
                      icon={
                        selectedCat?.id === c.id ? (
                          <FolderOpen size={15} color={SAP_AMBER} />
                        ) : (
                          <Folder size={15} color="#64748b" />
                        )
                      }
                      label={c.name}
                      sub={`${c.documentTypes.length} types`}
                      activeColor={SAP_AMBER}
                      onClick={() => handleCatSelect(c)}
                    />
                  ))
                )}
              </div>
            </Column>

            {/* Col 3: Document Types */}
            <Column
              title="Document Types"
              icon={<FileText size={14} color={SAP_PURPLE} />}
              borderColor={SAP_PURPLE}
              width={selectedDocType ? 0 : 160}
            >
              <SearchBox
                value={searchDocType}
                onChange={setSearchDocType}
                placeholder="Search Doc Type"
              />
              <div style={{ flex: 1, overflowY: "auto" }}>
                {!selectedCat ? (
                  <EmptyMsg text="Select a category" />
                ) : filtDocTypes.length === 0 ? (
                  <EmptyMsg text="No document types" />
                ) : (
                  filtDocTypes.map((dt) => (
                    <PanelItem
                      key={dt.id}
                      active={selectedDocType?.id === dt.id}
                      icon={
                        <FileText
                          size={15}
                          color={
                            selectedDocType?.id === dt.id
                              ? SAP_PURPLE
                              : "#64748b"
                          }
                        />
                      }
                      label={dt.name}
                      sub={`${dt.count || 0} docs`}
                      badge={dt.count}
                      activeColor={SAP_PURPLE}
                      onClick={() => handleDTSelect(dt)}
                    />
                  ))
                )}
              </div>
            </Column>

            {/* Col 4: Documents */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "#fff",
                borderLeft: "1px solid #e2e8f0",
                overflow: "hidden",
              }}
            >
              {/* Doc panel header */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={15} color={SAP_BLUE} />
                  <span
                    style={{ fontWeight: 700, fontSize: 13, color: SAP_DARK }}
                  >
                    Documents
                  </span>
                  {selectedDocType && (
                    <span
                      style={{
                        fontSize: 11,
                        background: SAP_LIGHT,
                        color: SAP_BLUE,
                        borderRadius: 20,
                        padding: "1px 8px",
                        fontWeight: 600,
                      }}
                    >
                      {totalDocsCount}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ position: "relative" }}>
                    <Search
                      size={13}
                      color="#94a3b8"
                      style={{
                        position: "absolute",
                        left: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    />
                    <input
                      value={searchDoc}
                      onChange={(e) => setSearchDoc(e.target.value)}
                      placeholder="Search documents or TCode..."
                      // onKeyDown={(e) => {
                      //   if (e.key === "Enter" && searchDoc.trim()) {
                      //     setShowTCodeSearch(true);
                      //   }
                      // }}
                      style={{
                        padding: "6px 10px 6px 30px",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "#334155",
                        outline: "none",
                        width: 220,
                      }}
                      onFocus={(e) => (e.target.style.borderColor = SAP_BLUE)}
                      onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#334155",
                      outline: "none",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">All Status</option>
                    {[
                      "OCR_PROCESSING",
                      "OCR_COMPLETED",
                      "WAITING_FOR_APPROVAL",
                      "SAVING_TO_SAP",
                      "COMPLETED",
                      "FAILED",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  {/* Enterprise Check-In/Check-Out — lock filter */}
                  <select
                    value={lockFilter}
                    onChange={(e) => setLockFilter(e.target.value)}
                    title="Filter by lock status"
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#334155",
                      outline: "none",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">All Documents</option>
                    <option value="CHECKED_OUT">🔒 Checked Out</option>
                    <option value="UNLOCKED">🟢 Unlocked</option>
                    <option value="MINE">👤 My Checked Out Documents</option>
                  </select>
                  {/* {selectedDocType && (
                    <button onClick={() => setShowUpload(true)}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: SAP_BLUE, color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      <Upload size={13} /> Upload Document
                    </button>
                  )} */}
                </div>
              </div>

              {/* Table + Preview */}
              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {!selectedDocType ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "#94a3b8",
                        gap: 8,
                      }}
                    >
                      <FolderOpen size={40} color="#e2e8f0" />
                      <span style={{ fontSize: 13 }}>
                        Select a document type to view files
                      </span>
                    </div>
                  ) : loadingDocs ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "#94a3b8",
                        fontSize: 13,
                      }}
                    >
                      Loading documents…
                    </div>
                  ) : filtDocs.length === 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "#94a3b8",
                        gap: 8,
                      }}
                    >
                      <FileText size={40} color="#e2e8f0" />
                      <span style={{ fontSize: 13 }}>No documents found</span>
                      {/* <button
                        onClick={() => setShowUpload(true)}
                        style={{
                          padding: "8px 18px",
                          borderRadius: 8,
                          background: SAP_BLUE,
                          color: "#fff",
                          border: "none",
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Upload size={13} /> Upload First Document
                      </button> */}
                    </div>
                  ) : (
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: "#f8fafc",
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                          }}
                        >
                          {TABLE_HEADERS.map((h) => (
                            <th
                              key={h}
                              style={{
                                padding: "10px 14px",
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#64748b",
                                textAlign: "left",
                                borderBottom: "1px solid #e2e8f0",
                                whiteSpace: "nowrap",
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtDocs.map((doc) => (
                          <tr
                            key={doc.id}
                            className="row-hover"
                            style={{
                              borderBottom: "1px solid #f1f5f9",
                              background:
                                previewDoc?.id === doc.id ? "#f0f7ff" : "#fff",
                            }}
                            onClick={() => setPreviewDoc(doc)}
                          >
                            {/* Document Name */}
                            <td style={{ padding: "11px 14px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    background: "#fef2f2",
                                    borderRadius: 6,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <FileText size={14} color="#ef4444" />
                                </div>
                                <span
                                  title={doc.originalFileName || doc.name}
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: "#1e293b",
                                    maxWidth: 280,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    display: "inline-block",
                                  }}
                                >
                                  {doc.originalFileName || doc.name}
                                </span>
                              </div>
                            </td>
                            {/* SAP Document ID — leading zeros trimmed, full ID on hover */}
                            <td style={{ padding: "11px 14px" }}>
                              <span
                                title={doc.sapDocumentId || ""}
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: 13,
                                  fontWeight: 100,
                                  color: "#1e293b",
                                  whiteSpace: "nowrap",
                                  cursor: doc.sapDocumentId
                                    ? "help"
                                    : "default",
                                }}
                              >
                                {doc.sapDocumentId
                                  ? doc.sapDocumentId.replace(/^0+/, "") || "0"
                                  : "—"}
                              </span>
                            </td>

                            {/* TCode — clickable copy pill */}
                            <td
                              style={{ padding: "11px 14px" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <TCodePill tcode={doc.tcode} />
                            </td>

                            {/* Version */}
                            <td style={{ padding: "11px 14px" }}>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: "#f1f5f9",
                                  color: "#475569",
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                }}
                              >
                                {doc.version || "V1"}
                              </span>
                            </td>

                            {/* Status */}
                            <td style={{ padding: "11px 14px" }}>
                              <StatusBadge
                                status={doc.uploadStatus || doc.status}
                              />
                            </td>

                            {/* Lock Status — Enterprise Check-In/Check-Out */}
                            <td style={{ padding: "11px 14px" }}>
                              <LockBadge
                                isCheckedOut={!!doc.isCheckedOut}
                                compact
                              />
                            </td>

                            {/* Locked By */}
                            <td style={{ padding: "11px 14px" }}>
                              <LockedByChip
                                label={
                                  doc.isCheckedOut
                                    ? doc.checkedOutByUser?.name ||
                                      doc.checkedOutByUser?.email ||
                                      (doc.checkedOutBy
                                        ? `User #${doc.checkedOutBy}`
                                        : "")
                                    : ""
                                }
                              />
                            </td>

                            {/* Checked Out Time */}
                            <td
                              style={{
                                padding: "11px 14px",
                                fontSize: 12,
                                color: "#64748b",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {doc.isCheckedOut && doc.checkedOutAt
                                ? new Date(doc.checkedOutAt).toLocaleString(
                                    undefined,
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )
                                : "—"}
                            </td>

                            {/* Uploaded By */}
                            <td
                              style={{
                                padding: "11px 14px",
                                fontSize: 13,
                                color: "#475569",
                              }}
                            >
                              {doc.uploader?.email ||
                                doc.uploadedBy?.email ||
                                doc.uploadedBy ||
                                "—"}
                            </td>

                            {/* Upload Date */}
                            <td
                              style={{
                                padding: "11px 14px",
                                fontSize: 12,
                                color: "#64748b",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {doc.createdAt
                                ? new Date(doc.createdAt).toLocaleDateString()
                                : "—"}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: "11px 14px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 6,
                                  alignItems: "center",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Quick View / Download for COMPLETED docs */}
                                {doc.uploadStatus === "COMPLETED" && (
                                  <>
                                    <QuickBtn
                                      label="View"
                                      color={SAP_BLUE}
                                      loading={viewingDocId === doc.id}
                                      onClick={() => handleViewDoc(doc)}
                                    />
                                  </>
                                )}
                                {/* More actions */}
                                <button
                                  onClick={(e) => {
                                    const r =
                                      e.currentTarget.getBoundingClientRect();
                                    setActionMenu({
                                      x: r.left,
                                      y: r.bottom + 4,
                                      doc,
                                    });
                                  }}
                                  style={{
                                    background: "#f1f5f9",
                                    border: "none",
                                    borderRadius: 7,
                                    padding: "5px 8px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    color: "#64748b",
                                  }}
                                >
                                  <MoreVertical size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Preview Panel */}
                {previewDoc && (
                  <PreviewPanel
                    doc={previewDoc}
                    allDocs={filtDocs}
                    onClose={() => setPreviewDoc(null)}
                    onDocChange={(d) => setPreviewDoc(d)}
                    onView={handleViewDoc}
                    onDownload={handleDownloadDoc}
                    currentUser={currentUser}
                    onLockChanged={patchDocLock}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showUpload && (
        <UploadModal
          docType={selectedDocType}
          dept={selectedDept}
          category={selectedCat}
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
        />
      )}
      {actionMenu && (
        <ActionMenu
          position={actionMenu}
          doc={actionMenu.doc}
          currentUser={currentUser}
          onAction={handleAction}
          onClose={() => setActionMenu(null)}
        />
      )}
      {/* Enterprise Check-In/Check-Out — quick actions from the table row menu */}
      {quickLockAction?.type === "checkout" && (
        <CheckOutModal
          doc={quickLockAction.doc}
          onClose={() => setQuickLockAction(null)}
          onCheckedOut={(lock) => {
            patchDocLock(quickLockAction.doc.id, lock);
            setQuickLockAction(null);
          }}
        />
      )}
      {quickLockAction?.type === "checkin" && (
        <CheckInModal
          doc={quickLockAction.doc}
          onClose={() => setQuickLockAction(null)}
          onCheckedIn={(lock) => {
            patchDocLock(quickLockAction.doc.id, lock);
            setQuickLockAction(null);
          }}
        />
      )}
      {quickLockAction?.type === "forceUnlock" && (
        <ForceUnlockModal
          doc={quickLockAction.doc}
          lock={{
            isCheckedOut: quickLockAction.doc.isCheckedOut,
            checkedOutBy: quickLockAction.doc.checkedOutBy,
            checkedOutByUser: quickLockAction.doc.checkedOutByUser,
          }}
          onClose={() => setQuickLockAction(null)}
          onForceUnlocked={(lock) => {
            patchDocLock(quickLockAction.doc.id, lock);
            setQuickLockAction(null);
          }}
        />
      )}
      {/* {showTCodeSearch && (
        <TCodeSearchModal
          onClose={() => setShowTCodeSearch(false)}
          onViewDoc={handleTCodeDocAction}
        />
      )} */}
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}

// ── Quick inline button ──────────────────────────────────────
function QuickBtn({ label, title, color, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={title || label}
      style={{
        padding: "4px 9px",
        borderRadius: 7,
        border: "none",
        background: color === SAP_BLUE ? SAP_LIGHT : "#f1f5f9",
        color,
        fontWeight: 700,
        fontSize: 11,
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 5,
        opacity: loading ? 0.7 : 1,
        minWidth: 44,
        justifyContent: "center",
      }}
    >
      {loading ? (
        <span
          style={{
            width: 11,
            height: 11,
            border: `2px solid ${color}40`,
            borderTopColor: color,
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.6s linear infinite",
          }}
        />
      ) : (
        label
      )}
    </button>
  );
}

// ── Shared sub-components ────────────────────────────────────
function Column({ title, icon, borderColor, width, children }) {
  return (
    <div
      style={{
        width,
        minWidth: width,
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRight: "1px solid #e2e8f0",
        borderTop: `3px solid ${borderColor}`,
        overflow: "hidden",
        transition: "width 0.2s ease",
      }}
    >
      <div
        style={{
          padding: "10px 14px 8px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        {icon}
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#334155",
            letterSpacing: "0.03em",
          }}
        >
          {title}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "8px 6px",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", marginBottom: 8, flexShrink: 0 }}>
      <Search
        size={12}
        color="#94a3b8"
        style={{
          position: "absolute",
          left: 9,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "6px 8px 6px 26px",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          fontSize: 12,
          color: "#334155",
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = SAP_BLUE)}
        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      />
    </div>
  );
}

function PanelItem({ label, sub, icon, badge, active, activeColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`panel-item${active ? " panel-item-active" : ""}`}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 8,
        border: active
          ? `1.5px solid ${activeColor}20`
          : "1.5px solid transparent",
        background: active ? `${activeColor}10` : "transparent",
        cursor: "pointer",
        textAlign: "left",
        marginBottom: 2,
      }}
    >
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: active ? 700 : 500,
            color: active ? activeColor : "#334155",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
            {sub}
          </div>
        )}
      </div>
      {badge != null && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            background: active ? activeColor : "#e2e8f0",
            color: active ? "#fff" : "#64748b",
            borderRadius: 20,
            padding: "1px 6px",
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function EmptyMsg({ text }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: "#94a3b8",
        textAlign: "center",
        padding: "24px 8px",
      }}
    >
      {text}
    </div>
  );
}
