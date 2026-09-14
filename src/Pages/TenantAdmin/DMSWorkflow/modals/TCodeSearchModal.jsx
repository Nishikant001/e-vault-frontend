import React, { useState, useEffect, useRef } from "react";
import { X, Search, FileText, Loader2, Copy, CheckCircle2, ExternalLink } from "lucide-react";
import { SAP_BLUE, SAP_DARK, SAP_LIGHT, STATUS_COLORS } from "../constants";

import { API_BASE_URL } from "../../../../services/apiClient";

const API = API_BASE_URL;
function getToken() { return localStorage.getItem("accessToken") || ""; }
function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

export default function TCodeSearchModal({ onClose, onViewDoc }) {
  const [query,   setQuery]   = useState("");
  const [result,  setResult]  = useState(null);  // found doc
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [copied,  setCopied]  = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSearch = async () => {
    const tcode = query.trim().toUpperCase();
    if (!tcode) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res  = await fetch(`${API}/documents/search/tcode?tcode=${encodeURIComponent(tcode)}`, {
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Document not found");
      } else {
        setResult(data.data);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleCopyTcode = () => {
    navigator.clipboard.writeText(result?.tcode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const statusStyle = result
    ? (STATUS_COLORS[result.uploadStatus] || { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" })
    : null;

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(2px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 80,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: 520, maxWidth: "92vw",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
          animation: "modalSlide 0.2s ease",
        }}
      >
        <style>{`@keyframes modalSlide{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Header */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: SAP_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Search size={15} color={SAP_BLUE} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: SAP_DARK }}>Search by TCode</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Enter a transaction code to find the document</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "#64748b", display: "flex" }}>
            <X size={15} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value.toUpperCase()); setError(""); setResult(null); }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. DMS-1718123456789"
                style={{
                  width: "100%", padding: "10px 12px 10px 36px",
                  border: "1.5px solid #e2e8f0", borderRadius: 10,
                  fontSize: 13, fontFamily: "monospace", color: SAP_DARK,
                  outline: "none", boxSizing: "border-box",
                  letterSpacing: "0.04em",
                }}
                onFocus={e => e.target.style.borderColor = SAP_BLUE}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              style={{
                padding: "10px 18px", borderRadius: 10, border: "none",
                background: SAP_BLUE, color: "#fff", fontWeight: 700,
                fontSize: 13, cursor: loading || !query.trim() ? "default" : "pointer",
                opacity: !query.trim() ? 0.5 : 1,
                display: "flex", alignItems: "center", gap: 6,
                flexShrink: 0,
              }}
            >
              {loading
                ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                : <Search size={14} />
              }
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>

        {/* Result Area */}
        <div style={{ padding: "16px 20px", minHeight: 80 }}>

          {/* Error */}
          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: "#fef2f2", border: "1px solid #fca5a5",
              fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 8,
            }}>
              <X size={14} />
              {error}
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div style={{
              border: "1.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden",
              animation: "modalSlide 0.2s ease",
            }}>
              {/* TCode pill */}
              <div style={{ background: `${SAP_BLUE}10`, padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>TCODE</span>
                  <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 800, color: SAP_DARK, letterSpacing: "0.06em" }}>
                    {result.tcode}
                  </span>
                </div>
                <button
                  onClick={handleCopyTcode}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 7, border: `1px solid ${SAP_BLUE}30`, background: "#fff", cursor: "pointer", color: SAP_BLUE, fontSize: 11, fontWeight: 600 }}>
                  {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Doc details */}
              <div style={{ padding: "14px 16px" }}>
                {/* File name */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={17} color="#ef4444" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: SAP_DARK }}>{result.originalFileName}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      {result.DocumentType?.name || result.documentType?.name || "—"}
                    </div>
                  </div>
                </div>

                {/* Meta grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 14 }}>
                  {[
                    ["Department",   result.Department?.name  || result.department?.name  || "—"],
                    ["Category",     result.Category?.name    || result.category?.name    || "—"],
                    ["Uploaded By",  result.uploader?.email   || result.uploadedBy        || "—"],
                    ["Upload Date",  result.createdAt ? new Date(result.createdAt).toLocaleDateString() : "—"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Status + actions */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    background: statusStyle.bg, color: statusStyle.color,
                    border: `1px solid ${statusStyle.border}`,
                  }}>
                    {result.uploadStatus}
                  </span>

                  <div style={{ display: "flex", gap: 8 }}>
                    {result.uploadStatus === "COMPLETED" && (
                      <>
                        <ActionBtn
                          label="View"
                          color={SAP_BLUE}
                          bg={SAP_LIGHT}
                          onClick={() => { onViewDoc && onViewDoc(result, "view"); onClose(); }}
                        />
                        <ActionBtn
                          label="Download"
                          color="#475569"
                          bg="#f1f5f9"
                          onClick={() => { onViewDoc && onViewDoc(result, "download"); onClose(); }}
                        />
                      </>
                    )}
                    <ActionBtn
                      label="Open"
                      icon={<ExternalLink size={12} />}
                      color="#475569"
                      bg="#f1f5f9"
                      onClick={() => { onViewDoc && onViewDoc(result, "open"); onClose(); }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Idle hint */}
          {!error && !result && !loading && (
            <div style={{ textAlign: "center", padding: "12px 0 4px", color: "#cbd5e1", fontSize: 12 }}>
              Type a TCode and press Enter or click Search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ label, icon, color, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "6px 12px", borderRadius: 8, border: "none",
        background: bg, color, fontWeight: 600, fontSize: 12, cursor: "pointer",
      }}>
      {icon}{label}
    </button>
  );
}