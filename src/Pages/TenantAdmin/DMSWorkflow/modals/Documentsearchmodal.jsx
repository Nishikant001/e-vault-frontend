import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Search, FileText, Loader2, ExternalLink, ChevronDown, Filter,
} from "lucide-react";
import { SAP_BLUE, SAP_DARK, SAP_LIGHT, STATUS_COLORS } from "../constants";

import { API_BASE_URL } from "../../../../services/apiClient";

const API = API_BASE_URL;
function getToken() { return localStorage.getItem("accessToken") || ""; }
function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

const UPLOAD_STATUSES = [
  "UPLOADING", "OCR_PROCESSING", "OCR_COMPLETED", "WAITING_FOR_APPROVAL",
  "SAVING_TO_SAP", "COMPLETED", "FAILED", "REJECTED",
];

export default function DocumentSearchModal({ onClose, onViewDoc }) {
  // ── Filters ──────────────────────────────────────────────
  const [q, setQ]                     = useState("");
  const [tcode, setTcode]             = useState("");
  const [poNumber, setPoNumber]       = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [fromDate, setFromDate]       = useState("");
  const [toDate, setToDate]           = useState("");

  const [departments, setDepartments] = useState([]);
  const [categories, setCategories]   = useState([]);
  const [docTypes, setDocTypes]       = useState([]);

  const [departmentId, setDepartmentId] = useState("");
  const [categoryId, setCategoryId]     = useState("");
  const [documentTypeId, setDocumentTypeId] = useState("");

  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // ── Results ──────────────────────────────────────────────
  const [results, setResults] = useState(null); // null = never searched
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Load departments once ───────────────────────────────
  useEffect(() => {
    fetch(`${API}/departments`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setDepartments(d.data || []))
      .catch(() => {});
  }, []);

  // ── Cascade: department → categories ────────────────────
  useEffect(() => {
    setCategoryId("");
    setDocumentTypeId("");
    setDocTypes([]);
    if (!departmentId) { setCategories([]); return; }
    fetch(`${API}/categories?departmentId=${departmentId}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setCategories(d.data || []))
      .catch(() => {});
  }, [departmentId]);

  // ── Cascade: category → document types ──────────────────
  useEffect(() => {
    setDocumentTypeId("");
    if (!categoryId) { setDocTypes([]); return; }
    fetch(`${API}/document-types?categoryId=${categoryId}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setDocTypes(d.data || []))
      .catch(() => {});
  }, [categoryId]);

  const buildParams = useCallback((targetPage = 1) => {
    const params = new URLSearchParams();
    if (q.trim())            params.set("q", q.trim());
    if (tcode.trim())        params.set("tcode", tcode.trim());
    if (poNumber.trim())     params.set("poNumber", poNumber.trim());
    if (uploadStatus)        params.set("uploadStatus", uploadStatus);
    if (departmentId)        params.set("departmentId", departmentId);
    if (categoryId)          params.set("categoryId", categoryId);
    if (documentTypeId)      params.set("documentTypeId", documentTypeId);
    if (fromDate)             params.set("fromDate", fromDate);
    if (toDate)               params.set("toDate", toDate);
    params.set("page", targetPage);
    params.set("limit", 20);
    return params;
  }, [q, tcode, poNumber, uploadStatus, departmentId, categoryId, documentTypeId, fromDate, toDate]);

  const runSearch = async (targetPage = 1) => {
    // At least one filter must be set — avoid dumping the whole tenant.
    const hasFilter = q.trim() || tcode.trim() || poNumber.trim() || uploadStatus ||
      departmentId || categoryId || documentTypeId || fromDate || toDate;
    if (!hasFilter) return;

    setLoading(true);
    setError("");

    try {
      const params = buildParams(targetPage);
      const res  = await fetch(`${API}/documents/search/advanced?${params.toString()}`, {
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Search failed");
        setResults([]);
        setTotal(0);
      } else {
        setResults(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || targetPage);
      }
    } catch {
      setError("Network error — please try again");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") runSearch(1);
  };

  const resetFilters = () => {
    setQ(""); setTcode(""); setPoNumber(""); setUploadStatus("");
    setDepartmentId(""); setCategoryId(""); setDocumentTypeId("");
    setFromDate(""); setToDate("");
    setResults(null); setError("");
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(2px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "60px 16px 16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: 720, maxWidth: "96vw",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
          animation: "modalSlide 0.2s ease",
          display: "flex", flexDirection: "column",
          maxHeight: "88vh",
        }}
      >
        <style>{`
          @keyframes modalSlide{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>

        {/* Header */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: SAP_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Search size={15} color={SAP_BLUE} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: SAP_DARK }}>Search Documents</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Search by name, TCode, PO number, folder or status</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "#64748b", display: "flex" }}>
            <X size={15} />
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          {/* Free text row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by file name or TCode…"
                style={{
                  width: "100%", padding: "10px 12px 10px 36px",
                  border: "1.5px solid #e2e8f0", borderRadius: 10,
                  fontSize: 13, color: SAP_DARK,
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = SAP_BLUE)}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <button
              onClick={() => runSearch(1)}
              disabled={loading}
              style={{
                padding: "10px 18px", borderRadius: 10, border: "none",
                background: SAP_BLUE, color: "#fff", fontWeight: 700,
                fontSize: 13, cursor: loading ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              }}
            >
              {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={14} />}
              {loading ? "Searching…" : "Search"}
            </button>
          </div>

          {/* Toggle more filters */}
          <button
            onClick={() => setShowMoreFilters((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, color: SAP_BLUE, padding: 0,
            }}
          >
            <Filter size={13} />
            {showMoreFilters ? "Hide filters" : "More filters"}
            <ChevronDown
              size={13}
              style={{ transition: "transform 0.2s", transform: showMoreFilters ? "rotate(180deg)" : "none" }}
            />
          </button>

          {showMoreFilters && (
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {/* TCode */}
              <LabeledInput label="TCode" value={tcode} onChange={setTcode} placeholder="e.g. DMS-1718123456789" mono />
              {/* PO Number */}
              <LabeledInput label="PO Number" value={poNumber} onChange={setPoNumber} placeholder="e.g. 4500001234" mono />

              {/* Department */}
              <LabeledSelect
                label="Department"
                value={departmentId}
                onChange={setDepartmentId}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
              />
              {/* Category */}
              <LabeledSelect
                label="Category"
                value={categoryId}
                onChange={setCategoryId}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                disabled={!departmentId}
              />
              {/* Document Type */}
              <LabeledSelect
                label="Document Type"
                value={documentTypeId}
                onChange={setDocumentTypeId}
                options={docTypes.map((t) => ({ value: t.id, label: t.name }))}
                disabled={!categoryId}
              />
              {/* Status */}
              <LabeledSelect
                label="Status"
                value={uploadStatus}
                onChange={setUploadStatus}
                options={UPLOAD_STATUSES.map((s) => ({ value: s, label: s.replaceAll("_", " ") }))}
              />

              {/* Date range */}
              <LabeledInput label="From Date" value={fromDate} onChange={setFromDate} type="date" />
              <LabeledInput label="To Date" value={toDate} onChange={setToDate} type="date" />
            </div>
          )}

          {showMoreFilters && (
            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={resetFilters}
                style={{ fontSize: 11, fontWeight: 600, color: "#64748b", background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}
              >
                Clear all
              </button>
              <button
                onClick={() => runSearch(1)}
                style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: SAP_BLUE, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}
              >
                Apply filters
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div style={{ padding: "12px 20px 18px", overflowY: "auto", flex: 1 }}>
          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: "#fef2f2", border: "1px solid #fca5a5",
              fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 8,
              marginBottom: 12,
            }}>
              <X size={14} />
              {error}
            </div>
          )}

          {results === null && !loading && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#cbd5e1", fontSize: 12 }}>
              Enter a search term or apply a filter, then press Enter or click Search
            </div>
          )}

          {results !== null && !loading && results.length === 0 && !error && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>
              No documents found matching these filters
            </div>
          )}

          {results && results.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>
                {total} result{total !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {results.map((doc) => (
                  <ResultRow key={doc.id} doc={doc} onViewDoc={onViewDoc} onClose={onClose} />
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
                  <PageBtn disabled={page <= 1} onClick={() => runSearch(page - 1)}>Prev</PageBtn>
                  <span style={{ fontSize: 12, color: "#64748b", padding: "6px 4px" }}>
                    Page {page} of {totalPages}
                  </span>
                  <PageBtn disabled={page >= totalPages} onClick={() => runSearch(page + 1)}>Next</PageBtn>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder, type = "text", mono }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
        {label}
      </div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0",
          borderRadius: 8, fontSize: 12.5, color: SAP_DARK, outline: "none",
          boxSizing: "border-box", fontFamily: mono ? "monospace" : "inherit",
        }}
      />
    </div>
  );
}

function LabeledSelect({ label, value, onChange, options, disabled }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
        {label}
      </div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0",
          borderRadius: 8, fontSize: 12.5, color: SAP_DARK, outline: "none",
          boxSizing: "border-box", background: disabled ? "#f8fafc" : "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function PageBtn({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 8,
        border: "1px solid #e2e8f0", background: disabled ? "#f8fafc" : "#fff",
        color: disabled ? "#cbd5e1" : "#475569", cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function ResultRow({ doc, onViewDoc, onClose }) {
  const statusStyle = STATUS_COLORS[doc.uploadStatus] || { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" };
  return (
    <div style={{
      border: "1.5px solid #e2e8f0", borderRadius: 10,
      padding: "10px 12px", display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <FileText size={15} color="#ef4444" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: SAP_DARK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {doc.originalFileName}
        </div>
        <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {doc.tcode && <span style={{ fontFamily: "monospace" }}>{doc.tcode}</span>}
          {doc.Department?.name && <span>• {doc.Department.name}</span>}
          {doc.Category?.name && <span>• {doc.Category.name}</span>}
          {doc.DocumentType?.name && <span>• {doc.DocumentType.name}</span>}
        </div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
        background: statusStyle.bg, color: statusStyle.color,
        border: `1px solid ${statusStyle.border}`, flexShrink: 0,
      }}>
        {doc.uploadStatus}
      </span>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {doc.uploadStatus === "COMPLETED" && (
          <ActionBtn label="View" color={SAP_BLUE} bg={SAP_LIGHT}
            onClick={() => { onViewDoc && onViewDoc(doc, "view"); onClose(); }} />
        )}
        <ActionBtn label="Open" icon={<ExternalLink size={11} />} color="#475569" bg="#f1f5f9"
          onClick={() => { onViewDoc && onViewDoc(doc, "open"); onClose(); }} />
      </div>
    </div>
  );
}

function ActionBtn({ label, icon, color, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "5px 10px", borderRadius: 7, border: "none",
        background: bg, color, fontWeight: 600, fontSize: 11, cursor: "pointer",
      }}>
      {icon}{label}
    </button>
  );
}