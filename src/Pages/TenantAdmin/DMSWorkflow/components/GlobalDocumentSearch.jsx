// src/Pages/TenantAdmin/DMSWorkflow/components/GlobalDocumentSearch.jsx
//
// Universal document search bar for the DMS document management screen.
// Talks to GET /api/documents/search (documentSearchService.js on the
// backend) — searches filename, TCode, SAP IDs, OCR text, and every
// dynamic metadata field in one tenant-scoped, access-controlled query.
//
// Reuses the existing design tokens (SAP_BLUE etc.) and the existing
// document viewer (onOpenDocument, passed in by DMSPage — the same
// handleViewDoc() it already uses for its own table) rather than
// building a second viewer.
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, FileText, AlertCircle } from "lucide-react";
import { searchDocuments } from "../../../../services/documentSearchApi";
import { SAP_BLUE, SAP_DARK, STATUS_COLORS } from "../constants";

const DEBOUNCE_MS = 400;
const RESULTS_LIMIT = 20;

function highlight(text, query) {
  if (!text || !query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "#fef08a", color: "#1e293b", padding: "0 1px", borderRadius: 2 }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function GlobalDocumentSearch({ onOpenDocument }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: RESULTS_LIMIT, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [openingId, setOpeningId] = useState(null);

  const debounceRef = useRef(null);
  const requestIdRef = useRef(0); // guards against out-of-order responses
  const containerRef = useRef(null);

  const runSearch = useCallback((q, p) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setPagination({ page: 1, limit: RESULTS_LIMIT, total: 0, totalPages: 0 });
      setLoading(false);
      setError("");
      return;
    }
    const myRequestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    searchDocuments({ q: trimmed, page: p, limit: RESULTS_LIMIT })
      .then((res) => {
        if (myRequestId !== requestIdRef.current) return; // stale response, ignore
        setResults(res.data || []);
        setPagination(res.pagination || { page: 1, limit: RESULTS_LIMIT, total: 0, totalPages: 0 });
      })
      .catch((err) => {
        if (myRequestId !== requestIdRef.current) return;
        setError(err.message || "Search failed. Please try again.");
        setResults([]);
      })
      .finally(() => {
        if (myRequestId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, []);

  // Debounced search on query change (resets to page 1)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setOpen(false);
      setResults([]);
      return;
    }
    setOpen(true);
    setPage(1);
    debounceRef.current = setTimeout(() => runSearch(query, 1), DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Page change (no debounce — explicit user click)
  useEffect(() => {
    if (page !== 1 && query.trim()) runSearch(query, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    setError("");
  };

  const handleOpen = async (result) => {
    setOpeningId(result.documentId);
    try {
      await onOpenDocument?.({ id: result.documentId, originalFileName: result.originalFileName });
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: 380, maxWidth: "42vw" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#f8fafc",
          border: `1.5px solid ${open ? SAP_BLUE : "#e2e8f0"}`,
          borderRadius: 8,
          padding: "6px 10px",
          transition: "border-color 0.15s",
        }}
      >
        <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Search name, invoice no, PAN, vendor, OCR text..."
          aria-label="Search all documents"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 12.5,
            color: "#334155",
            minWidth: 0,
          }}
        />
        {loading && <Loader2 size={13} color={SAP_BLUE} className="spin" style={{ animation: "spin 0.8s linear infinite" }} />}
        {!loading && query && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            style={{ border: "none", background: "none", cursor: "pointer", display: "flex", padding: 0, color: "#94a3b8" }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            boxShadow: "0 8px 28px rgba(15,23,42,0.14)",
            maxHeight: 460,
            overflowY: "auto",
            zIndex: 200,
          }}
        >
          {loading && !results.length && (
            <div style={{ padding: "18px 14px", fontSize: 12.5, color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
              <Loader2 size={14} color={SAP_BLUE} style={{ animation: "spin 0.8s linear infinite" }} />
              Searching your documents…
            </div>
          )}

          {error && (
            <div style={{ padding: "14px", fontSize: 12.5, color: "#b91c1c", display: "flex", alignItems: "flex-start", gap: 8 }}>
              <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              {error}
            </div>
          )}

          {!loading && !error && query.trim() && results.length === 0 && (
            <div style={{ padding: "18px 14px", fontSize: 12.5, color: "#94a3b8" }}>
              No documents found for “{query.trim()}”.
            </div>
          )}

          {!error && results.length > 0 && (
            <>
              <div
                style={{
                  padding: "8px 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {pagination.total} result{pagination.total === 1 ? "" : "s"}
              </div>

              {results.map((r) => {
                const statusColors = STATUS_COLORS[r.uploadStatus] || { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" };
                const topMatch = r.matchedFields?.[0];
                return (
                  <button
                    key={r.documentId}
                    onClick={() => handleOpen(r)}
                    disabled={openingId === r.documentId}
                    style={{
                      display: "flex",
                      width: "100%",
                      textAlign: "left",
                      gap: 10,
                      padding: "10px 14px",
                      border: "none",
                      borderBottom: "1px solid #f8fafc",
                      background: "#fff",
                      cursor: openingId === r.documentId ? "wait" : "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                  >
                    <FileText size={16} color={SAP_BLUE} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: SAP_DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {highlight(r.originalFileName, query.trim())}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 7px",
                            borderRadius: 20,
                            background: statusColors.bg,
                            color: statusColors.color,
                            border: `1px solid ${statusColors.border}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.uploadStatus}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                        {[r.documentType?.name, r.category?.name, r.department?.name].filter(Boolean).join(" · ") || "—"}
                      </div>
                      {topMatch && (
                        <div style={{ fontSize: 11, color: "#334155", marginTop: 3 }}>
                          <span style={{ fontWeight: 600, color: "#94a3b8" }}>{topMatch.source}</span>{" "}
                          <span style={{ color: "#cbd5e1" }}>→</span> {highlight(String(topMatch.value).slice(0, 90), query.trim())}
                        </div>
                      )}
                      {r.snippet && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            marginTop: 3,
                            fontStyle: "italic",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {highlight(r.snippet, query.trim())}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              {pagination.totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px" }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1 || loading}
                    style={pagerBtnStyle(pagination.page <= 1)}
                  >
                    ‹ Prev
                  </button>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page >= pagination.totalPages || loading}
                    style={pagerBtnStyle(pagination.page >= pagination.totalPages)}
                  >
                    Next ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function pagerBtnStyle(disabled) {
  return {
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    background: disabled ? "#f8fafc" : "#fff",
    color: disabled ? "#cbd5e1" : "#334155",
    cursor: disabled ? "default" : "pointer",
  };
}
