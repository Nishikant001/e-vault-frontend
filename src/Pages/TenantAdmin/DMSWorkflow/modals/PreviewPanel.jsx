import React, { useState, useEffect, useCallback } from "react";
import {
  X, Download, Printer, Maximize2, ChevronLeft, ChevronRight, FileText, Loader2,
  Lock, Unlock, ShieldAlert, History as HistoryIcon, GitCompare, Activity as ActivityIcon,
} from "lucide-react";
import { SAP_BLUE, SAP_DARK, SAP_LIGHT, SAP_GREEN, SAP_AMBER, SAP_RED, STATUS_COLORS } from "../constants";
import LockBadge, { LockedByChip } from "../components/LockBadge";
import CheckOutModal from "./CheckOutModal";
import CheckInModal from "./CheckInModal";
import ForceUnlockModal from "./ForceUnlockModal";
import { getLockStatus, getVersionHistory, canCheckOut, canCheckIn, canForceUnlock } from "../checkInOutApi";
import { fetchAuditLogs } from "../../../Audit/auditApi";
import AuditTimeline from "../../../Audit/AuditTimeline";

import { API_BASE_URL } from "../../../../services/apiClient";

const API = API_BASE_URL;
function getToken() { return localStorage.getItem("accessToken") || ""; }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }

/** Fetches GET /api/documents/:id/thumbnail (auth'd, so can't be a plain
 * <img src>) and renders it, falling back to the existing mock preview
 * for documents that aren't ready yet or don't have one (e.g. still
 * processing, or a type the backend doesn't generate thumbnails for).
 * Watermarking (FREE tenants) is baked into the image bytes server-side —
 * this component doesn't need to know about it, it just renders what
 * comes back. */
function DocumentViewer({ docId, fallback, mimeType, fileType }) {
  const [src, setSrc] = useState(null);
  const [contentType, setContentType] = useState("");
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;
    setSrc(null);
    setContentType("");
    setFailed(false);
    setLoading(true);

    fetch(`${API}/documents/${docId}/view`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load document");
        const type = res.headers.get("content-type") || mimeType || fileType || "";
        return res.blob().then((blob) => ({ blob, type }));
      })
      .then(({ blob, type }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setContentType(type || blob.type || "");
        setSrc(objectUrl);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [docId, mimeType, fileType]);

  const isPdf = /pdf/i.test(contentType) || /pdf/i.test(mimeType || "") || /pdf/i.test(fileType || "");
  const isImage = /^image\//i.test(contentType) || /image/i.test(mimeType || "") || /png|jpe?g|webp|gif/i.test(fileType || "");

  if (loading) {
    return (
      <div style={VIEWER_STATE}>
        <Loader2 size={28} color={SAP_BLUE} style={{ animation: "spin 1s linear infinite" }} />
        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: "#64748b" }}>Loading document…</div>
      </div>
    );
  }

  if (failed || !src) return fallback;

  if (isPdf) {
    return (
      <iframe
        src={`${src}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
        title="PDF document preview"
        style={{
          width: "100%",
          height: "100%",
          minHeight: 600,
          border: 0,
          background: "#fff",
          display: "block",
        }}
      />
    );
  }

  if (isImage) {
    return (
      <div style={{ width: "100%", height: "100%", minHeight: 600, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding: 24 }}>
        <img src={src} alt="Document preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
      </div>
    );
  }

  return fallback;
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PreviewPanel({ doc, allDocs, onClose, onDocChange, onView, onDownload, currentUser, onLockChanged }) {
  const [tab,         setTab]         = useState("details");
  const [versions,    setVersions]    = useState([]);
  const [loadingVer,  setLoadingVer]  = useState(false);

  const [lock,        setLock]        = useState(null);
  const [loadingLock, setLoadingLock] = useState(false);

  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  const [activity,        setActivity]        = useState([]);
  const [loadingActivity, setLoadingActivity]  = useState(false);

  const [showCheckOut,    setShowCheckOut]    = useState(false);
  const [showCheckIn,     setShowCheckIn]     = useState(false);
  const [showForceUnlock, setShowForceUnlock] = useState(false);

  const idx     = allDocs.findIndex(d => d.id === doc.id);
  const hasPrev = idx > 0;
  const hasNext = idx < allDocs.length - 1;
  const statusStyle = STATUS_COLORS[doc.uploadStatus] || STATUS_COLORS[doc.status] || { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" };

  const loadLockStatus = useCallback(() => {
    setLoadingLock(true);
    getLockStatus(doc.id)
      .then(setLock)
      .catch(() => setLock(null))
      .finally(() => setLoadingLock(false));
  }, [doc.id]);

  useEffect(() => { loadLockStatus(); }, [loadLockStatus]);

  useEffect(() => {
    if (tab !== "history") return;
    setLoadingVer(true);
    setVersions([]);
    getVersionHistory(doc.id)
      .then(({ versions: v, lockStatus }) => { setVersions(v); if (lockStatus) setLock(lockStatus); })
      .catch(() => {})
      .finally(() => setLoadingVer(false));
  }, [tab, doc.id]);

  useEffect(() => {
    if (tab !== "activity") return;
    setLoadingActivity(true);
    setActivity([]);
    fetchAuditLogs({ documentId: doc.id, limit: 50, sortOrder: "DESC" })
      .then(({ data }) => setActivity(data))
      .catch(() => setActivity([]))
      .finally(() => setLoadingActivity(false));
  }, [tab, doc.id]);

  useEffect(() => {
    setTab("details");
    setCompareIds([]);
    setShowCompare(false);
  }, [doc.id]);

  const handlePrint = async () => {
    try {
      const id = doc.sapDocumentId || doc.id;
      const res = await fetch(`${API}/documents/${id}/download`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Unable to load document for printing");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");

      if (!printWindow) {
        URL.revokeObjectURL(url);
        alert("Please allow pop-ups to print the document.");
        return;
      }

      const cleanup = () => {
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      };

      printWindow.addEventListener?.("load", () => {
        printWindow.focus();
        printWindow.print();
        cleanup();
      });

      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (_) {}
        cleanup();
      }, 1500);
    } catch (error) {
      alert(error.message || "Print failed");
    }
  };

  const handleDownloadVersion = async (versionDoc) => {
    try {
      const sapId = versionDoc.sapDocumentId || versionDoc.id;
      const res  = await fetch(`${API}/documents/${sapId}/download`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = versionDoc.originalFileName || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed");
    }
  };

  const toggleCompare = (versionId) => {
    setCompareIds((prev) => {
      if (prev.includes(versionId)) return prev.filter((id) => id !== versionId);
      if (prev.length >= 2) return [prev[1], versionId];
      return [...prev, versionId];
    });
  };

  const refreshAfterLockChange = (newLock) => {
    setLock(newLock);
    setShowCheckOut(false);
    setShowCheckIn(false);
    setShowForceUnlock(false);
    if (tab === "history") {
      setLoadingVer(true);
      getVersionHistory(doc.id)
        .then(({ versions: v }) => setVersions(v))
        .catch(() => {})
        .finally(() => setLoadingVer(false));
    }
    onLockChanged && onLockChanged(doc.id, newLock);
  };

  const lockedByLabel = lock?.checkedOutByUser?.name || lock?.checkedOutByUser?.email || (lock?.checkedOutBy ? `User #${lock.checkedOutBy}` : "");
  const showCheckOutBtn    = canCheckOut(currentUser, lock);
  const showCheckInBtn     = canCheckIn(currentUser, lock);
  const showForceUnlockBtn = canForceUnlock(currentUser, lock);

  return (
    <>
      <style>{RESPONSIVE_STYLE}</style>
      <div onClick={onClose} style={BACKDROP} />

      <aside className="evault-preview-panel" style={PANEL} aria-label="Document preview workspace">
        {/* ───────────────────── Header ───────────────────── */}
        <header style={PANEL_HEADER}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <div style={DOC_ICON}>
              <FileText size={20} color={SAP_BLUE} />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={EYEBROW}>DOCUMENT WORKSPACE</div>
              <div
                title={doc.originalFileName || doc.name || ""}
                style={DOCUMENT_TITLE}
              >
                {doc.originalFileName || doc.name || "Untitled document"}
              </div>

              <div style={HEADER_META}>
                <span>V{doc.version || 1}</span>
                <span style={META_DOT}>•</span>
                <span>{doc.DocumentType?.name || "Document"}</span>
                <span style={META_DOT}>•</span>
                <span style={{ color: statusStyle.color }}>{doc.uploadStatus || doc.status || "—"}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <button
              onClick={() => hasPrev && onDocChange(allDocs[idx - 1])}
              disabled={!hasPrev}
              title="Previous document"
              style={NAV_BTN_LARGE(hasPrev)}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() => hasNext && onDocChange(allDocs[idx + 1])}
              disabled={!hasNext}
              title="Next document"
              style={NAV_BTN_LARGE(hasNext)}
            >
              <ChevronRight size={16} />
            </button>

            <button onClick={onClose} title="Close" style={CLOSE_BTN}>
              <X size={18} />
            </button>
          </div>
        </header>

        {/* ───────────────────── Toolbar ───────────────────── */}
        <div style={TOOLBAR}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* <ActionBtn
              icon={<Download size={14} />}
              label="Download"
              color="#fff"
              bg={SAP_BLUE}
              onClick={() => onDownload ? onDownload(doc) : undefined}
              disabled={doc.uploadStatus !== "COMPLETED"}
            /> */}
            <ActionBtn
              icon={<Maximize2 size={14} />}
              label="Open Full View"
              color="#334155"
              bg="#f1f5f9"
              onClick={() => onView ? onView(doc) : undefined}
              disabled={doc.uploadStatus !== "COMPLETED"}
            />
            {/* <ActionBtn
              icon={<Printer size={14} />}
              label="Print"
              color="#334155"
              bg="#f1f5f9"
              onClick={handlePrint}
              disabled={doc.uploadStatus !== "COMPLETED"}
            /> */}
          </div>

          <div style={TOOLBAR_RIGHT}>
            <span style={STATUS_PILL(statusStyle)}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusStyle.color }} />
              {doc.uploadStatus || doc.status || "Unknown"}
            </span>
            <span style={CODE_PILL}>
              <span style={{ color: "#64748b", marginRight: 5 }}>DMS-Code</span>
              <strong>{doc.tcode || "—"}</strong>
            </span>
          </div>
        </div>

        {/* ───────────────────── Main workspace ───────────────────── */}
        <div className="evault-preview-workspace" style={WORKSPACE}>
          {/* Preview */}
          <section style={PREVIEW_SECTION}>
            <div style={SECTION_TOP}>
              <div>
                <div style={SECTION_LABEL}>DOCUMENT PREVIEW</div>
                <div style={SECTION_TITLE}>Live document preview</div>
              </div>

              <div style={PREVIEW_BADGE}>
                <FileText size={13} />
                { /pdf/i.test(doc.mimeType || "") || /pdf/i.test(doc.fileType || "") ? "PDF" : (doc.fileType || "Document") }
              </div>
            </div>

            <div style={PREVIEW_CANVAS}>
              <div style={PREVIEW_SHEET}>
                <DocumentViewer
                  docId={doc.id}
                  mimeType={doc.mimeType}
                  fileType={doc.fileType}
                  fallback={
                    <div style={FALLBACK_PREVIEW}>
                      <div style={FALLBACK_TOP}>
                        <div>
                          <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 800 }}>
                            e‑Vault DMS
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 5 }}>
                            Document Preview
                          </div>
                        </div>
                        <FileText size={34} color={SAP_BLUE} />
                      </div>

                      <div style={FALLBACK_LINE} />

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 20 }}>
                        <PreviewMeta label="File Name" value={doc.originalFileName || doc.name || "—"} />
                        <PreviewMeta label="Version" value={`V${doc.version || 1}`} />
                        <PreviewMeta label="DMS-Code" value={doc.tcode || "—"} />
                        <PreviewMeta label="Status" value={doc.uploadStatus || doc.status || "—"} />
                      </div>

                      <div style={FALLBACK_NOTICE}>
                        <FileText size={16} color={SAP_BLUE} />
                        <div>
                          <div style={{ fontWeight: 700, color: "#334155", fontSize: 13 }}>Preview is not available yet</div>
                          <div style={{ marginTop: 3, color: "#64748b", fontSize: 12 }}>
                            Use <b>Open Full View</b> when the document is ready.
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>

            <div style={PREVIEW_FOOTER}>
              <span>Secure preview</span>
              <span>•</span>
              <span>Open Full View for the original document</span>
            </div>
          </section>

          {/* Information */}
          <aside className="evault-preview-info" style={INFO_PANEL}>
            <div style={INFO_HEADER}>
              <div>
                <div style={SECTION_LABEL}>DOCUMENT INFORMATION</div>
                <div style={SECTION_TITLE}>Details & controls</div>
              </div>
              {loadingLock && (
                <Loader2 size={16} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />
              )}
            </div>

            {/* Lock / checkout card */}
            <div style={LOCK_CARD}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={CARD_LABEL}>ACCESS CONTROL</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: SAP_DARK, marginTop: 3 }}>
                    Document lock
                  </div>
                </div>
                {lock && <LockBadge isCheckedOut={lock.isCheckedOut} lockedByLabel={lockedByLabel} />}
              </div>

              {lock?.isCheckedOut ? (
                <>
                  <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Lock size={15} color={SAP_AMBER} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>Checked out by</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {lockedByLabel || "Unknown user"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <LockField label="Checked Out" value={formatDateTime(lock.checkedOutAt)} />
                      <LockField label="Expected Return" value={lock.lockExpiry ? formatDateTime(lock.lockExpiry) : "—"} />
                    </div>

                    {lock.lockReason && (
                      <div style={{ marginTop: 12 }}>
                        <LockField label="Reason" value={lock.lockReason} />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={UNLOCKED_STATE}>
                  <Unlock size={15} color={SAP_GREEN} />
                  <span>Available for editing</span>
                </div>
              )}

              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
                {showCheckOutBtn && (
                  <ActionBtn icon={<Lock size={13} />} label="Check Out" color={SAP_AMBER} bg="#fff7ed" onClick={() => setShowCheckOut(true)} />
                )}
                {showCheckInBtn && (
                  <ActionBtn icon={<Unlock size={13} />} label="Check In" color={SAP_GREEN} bg="#f0fdf4" onClick={() => setShowCheckIn(true)} />
                )}
                {showForceUnlockBtn && (
                  <ActionBtn icon={<ShieldAlert size={13} />} label="Force Unlock" color={SAP_RED} bg="#fef2f2" onClick={() => setShowForceUnlock(true)} />
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={TABS}>
              {[
                ["details", "Details"],
                ["history", "Versions"],
                ["activity", "Activity"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  style={TAB_BTN(tab === value)}
                >
                  {value === "history" && <HistoryIcon size={14} />}
                  {value === "activity" && <ActivityIcon size={14} />}
                  {label}
                </button>
              ))}
            </div>

            {/* Scrollable information */}
            <div style={INFO_SCROLL}>
              {tab === "details" && (
                <div>
                  <div style={DETAIL_GRID}>
                    {[
                      ["File Name", doc.originalFileName || doc.name || "—"],
                      ["Document Type", doc.DocumentType?.name || "—"],
                      ["Department", doc.Department?.name || "—"],
                      ["Category", doc.Category?.name || "—"],
                      ["Uploaded By", doc.uploader?.email || doc.uploadedBy || "—"],
                      ["Upload Date", doc.createdAt ? formatDateTime(doc.createdAt) : "—"],
                      ["Version", `V${doc.version || 1}`],
                      ["DMS-Code", doc.tcode || "—"],
                    ].map(([label, value]) => (
                      <DetailItem
                        key={label}
                        label={label}
                        value={value}
                        accent={label === "DMS-Code"}
                        full={label === "File Name"}
                      />
                    ))}
                  </div>

                  <div style={SUMMARY_CARD}>
                    <div style={CARD_LABEL}>CURRENT STATUS</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                      <span style={STATUS_DOT(statusStyle.color)} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: SAP_DARK }}>
                          {doc.uploadStatus || doc.status || "Unknown"}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          Document processing and repository state
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "history" && (
                <div>
                  {versions.length >= 2 && (
                    <div style={COMPARE_BAR}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: SAP_DARK }}>
                          Compare versions
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          Select any two versions below.
                        </div>
                      </div>

                      <button
                        disabled={compareIds.length !== 2}
                        onClick={() => setShowCompare(true)}
                        style={COMPARE_BTN(compareIds.length === 2)}
                      >
                        <GitCompare size={13} />
                        Compare
                      </button>
                    </div>
                  )}

                  {loadingVer ? (
                    <LoadingState text="Loading version history…" />
                  ) : versions.length === 0 ? (
                    <EmptyState icon={<HistoryIcon size={20} />} title="No version history" text="No previous versions are available for this document." />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {versions.map((vr, i) => {
                        const isLatest = i === 0;
                        const isSelected = compareIds.includes(vr.id);
                        const s = STATUS_COLORS[vr.uploadStatus] || { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" };

                        return (
                          <div
                            key={vr.id}
                            style={{
                              border: isSelected ? `1.5px solid ${SAP_BLUE}` : "1px solid #e2e8f0",
                              borderRadius: 12,
                              padding: 13,
                              background: isSelected ? "#f7fbff" : "#fff",
                              boxShadow: isLatest ? "0 4px 14px rgba(15,23,42,0.05)" : "none",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", minWidth: 0 }}>
                                <input type="checkbox" checked={isSelected} onChange={() => toggleCompare(vr.id)} />
                                <span style={{ width: 30, height: 30, borderRadius: 9, background: isLatest ? SAP_BLUE : SAP_LIGHT, color: isLatest ? "#fff" : SAP_BLUE, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                                  V{vr.version}
                                </span>
                                <span style={{ minWidth: 0 }}>
                                  <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: SAP_DARK }}>
                                    Version {vr.version}
                                  </span>
                                  <span style={{ display: "block", marginTop: 2, fontSize: 10, color: "#94a3b8" }}>
                                    {vr.createdAt ? formatDateTime(vr.createdAt) : "—"}
                                  </span>
                                </span>
                              </label>

                              {isLatest && (
                                <span style={CURRENT_BADGE}>CURRENT</span>
                              )}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                              <LockField label="Uploaded By" value={vr.uploader?.email || vr.uploadedBy || "—"} />
                              <LockField label="Status" value={vr.uploadStatus || "—"} />
                            </div>

                            <div style={{ marginTop: 10 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                                {vr.uploadStatus || "UNKNOWN"}
                              </span>
                            </div>

                            {vr.checkInComments && (
                              <div style={COMMENT_BOX}>
                                <span style={{ fontWeight: 800, color: "#334155" }}>Comment:</span>{" "}
                                {vr.checkInComments}
                              </div>
                            )}

                            {vr.uploadStatus === "COMPLETED" && (
                              <button
                                onClick={() => handleDownloadVersion(vr)}
                                style={VERSION_DOWNLOAD}
                              >
                                <Download size={12} />
                                Download V{vr.version}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === "activity" && (
                <div>
                  {loadingActivity ? (
                    <LoadingState text="Loading document activity…" />
                  ) : activity.length === 0 ? (
                    <EmptyState icon={<ActivityIcon size={20} />} title="No activity yet" text="Audit activity for this document will appear here." />
                  ) : (
                    <AuditTimeline entries={activity} />
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* ───────────────────── Footer ───────────────────── */}
        <footer style={PANEL_FOOTER}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 11 }}>
            <span style={SECURE_DOT} />
            Secure e‑Vault document workspace
          </div>

          <button
            onClick={() => setTab("history")}
            style={FOOTER_LINK}
          >
            <HistoryIcon size={13} />
            Version History
          </button>
        </footer>
      </aside>

      {showCheckOut && (
        <CheckOutModal
          doc={doc}
          onClose={() => setShowCheckOut(false)}
          onCheckedOut={refreshAfterLockChange}
        />
      )}

      {showCheckIn && (
        <CheckInModal
          doc={doc}
          onClose={() => setShowCheckIn(false)}
          onCheckedIn={refreshAfterLockChange}
        />
      )}

      {showForceUnlock && (
        <ForceUnlockModal
          doc={doc}
          lock={lock}
          onClose={() => setShowForceUnlock(false)}
          onForceUnlocked={refreshAfterLockChange}
        />
      )}

      {showCompare && compareIds.length === 2 && (
        <CompareVersionsModal
          versions={versions}
          selectedIds={compareIds}
          onClose={() => setShowCompare(false)}
        />
      )}
    </>
  )
}

function PreviewMeta({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", fontWeight: 800 }}>
        {label}
      </div>
      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: "#334155", wordBreak: "break-word" }}>
        {value}
      </div>
    </div>
  );
}

function DetailItem({ label, value, accent = false, full = false }) {
  return (
    <div style={{ ...DETAIL_ITEM, ...(full ? { gridColumn: "1 / -1" } : {}) }}>
      <div style={DETAIL_LABEL}>{label}</div>
      <div
        title={String(value || "")}
        style={{
          ...DETAIL_VALUE,
          ...(accent ? {
            color: SAP_BLUE,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            background: SAP_LIGHT,
            border: `1px solid #dbeafe`,
            padding: "5px 8px",
            borderRadius: 7,
          } : {}),
        }}
      >
        {value}
      </div>
    </div>
  );
}

function LoadingState({ text }) {
  return (
    <div style={EMPTY_STATE}>
      <Loader2 size={20} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />
      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>{text}</div>
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div style={EMPTY_STATE}>
      <div style={EMPTY_ICON}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: SAP_DARK }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: 11, color: "#94a3b8", maxWidth: 280 }}>{text}</div>
    </div>
  );
}


function CompareVersionsModal({ versions, selectedIds, onClose }) {
  const selected = selectedIds
    .map((id) => versions.find((version) => version.id === id))
    .filter(Boolean);

  if (selected.length !== 2) return null;

  const left = selected[0];
  const right = selected[1];

  const rows = [
    ["Version", `V${left.version || "—"}`, `V${right.version || "—"}`],
    ["Status", left.uploadStatus || "—", right.uploadStatus || "—"],
    ["Uploaded By", left.uploader?.email || left.uploadedBy || "—", right.uploader?.email || right.uploadedBy || "—"],
    ["Created", left.createdAt ? new Date(left.createdAt).toLocaleString() : "—", right.createdAt ? new Date(right.createdAt).toLocaleString() : "—"],
    ["Check-in Comments", left.checkInComments || "—", right.checkInComments || "—"],
    ["File Name", left.originalFileName || left.name || "—", right.originalFileName || right.name || "—"],
  ];

  return (
    <div style={COMPARE_OVERLAY}>
      <div style={COMPARE_MODAL}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid #e2e8f0" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: SAP_DARK }}>Compare Versions</div>
            <div style={{ marginTop: 3, fontSize: 11, color: "#64748b" }}>Metadata comparison between the selected document versions.</div>
          </div>
          <button onClick={onClose} style={ICON_BTN}><X size={15} /></button>
        </div>

        <div style={{ padding: 16, overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr) minmax(0,1fr)", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            <div style={COMPARE_HEAD}>Field</div>
            <div style={COMPARE_HEAD}>Version {left.version || "—"}</div>
            <div style={COMPARE_HEAD}>Version {right.version || "—"}</div>
            {rows.map(([label, a, b]) => (
              <React.Fragment key={label}>
                <div style={COMPARE_LABEL}>{label}</div>
                <div style={COMPARE_VALUE}>{a}</div>
                <div style={COMPARE_VALUE}>{b}</div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px", borderTop: "1px solid #e2e8f0", background: "#fafbfc" }}>
          <button onClick={onClose} style={{ border: "none", borderRadius: 8, padding: "8px 14px", background: SAP_BLUE, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

const COMPARE_OVERLAY = {
  position: "fixed",
  inset: 0,
  zIndex: 1100,
  background: "rgba(15, 23, 42, 0.38)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const COMPARE_MODAL = {
  width: "min(760px, 96vw)",
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  background: "#fff",
  borderRadius: 14,
  border: "1px solid #dbe3ee",
  boxShadow: "0 28px 80px rgba(15, 23, 42, 0.25)",
  overflow: "hidden",
};

const COMPARE_HEAD = {
  padding: "10px 12px",
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  fontSize: 11,
  fontWeight: 800,
  color: SAP_DARK,
};

const COMPARE_LABEL = {
  padding: "10px 12px",
  borderBottom: "1px solid #f1f5f9",
  background: "#fafbfc",
  fontSize: 12,
  fontWeight: 700,
  color: "#64748b",
};

const COMPARE_VALUE = {
  minWidth: 0,
  padding: "10px 12px",
  borderLeft: "1px solid #f1f5f9",
  borderBottom: "1px solid #f1f5f9",
  fontSize: 11,
  color: "#334155",
  wordBreak: "break-word",
};

function LockField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{value}</div>
    </div>
  );
}

function ActionBtn({ icon, label, color, bg, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        minHeight: 32,
        padding: "6px 11px",
        borderRadius: 8,
        border: "1px solid transparent",
        background: disabled ? "#f8fafc" : bg,
        color: disabled ? "#cbd5e1" : color,
        fontWeight: 700,
        fontSize: 11,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "all 160ms ease",
      }}
    >
      {icon}{label}
    </button>
  );
}


/* Premium document workspace responsive behaviour */
const RESPONSIVE_STYLE = `
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 1100px) {
    .evault-preview-workspace {
      grid-template-columns: minmax(0, 1fr) 320px !important;
    }
  }

  @media (max-width: 850px) {
    .evault-preview-workspace {
      grid-template-columns: 1fr !important;
      overflow-y: auto !important;
    }

    .evault-preview-info {
      min-height: 420px !important;
      border-top: 1px solid #dbe3ee !important;
      border-left: none !important;
    }
  }

  @media (max-width: 600px) {
    .evault-preview-panel {
      top: 1vh !important;
      left: 1vw !important;
      right: 1vw !important;
      bottom: 1vh !important;
      width: 98vw !important;
      height: 98vh !important;
      border-radius: 12px !important;
    }
  }
`;

const BACKDROP = {
  position: "fixed",
  inset: 0,
  zIndex: 999,
  background: "rgba(15, 23, 42, 0.48)",
  backdropFilter: "blur(4px)",
};

const PANEL = {
  position: "fixed",
  top: "4vh",
  left: "3vw",
  right: "3vw",
  bottom: "4vh",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  width: "80vw",
  height: "92vh",
  maxWidth: "1500px",
  margin: "0 auto",
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: 18,
  boxShadow: "0 35px 100px rgba(15, 23, 42, 0.30)",
  overflow: "hidden",
};

const PANEL_HEADER = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  padding: "16px 20px",
  background: "#ffffff",
  borderBottom: "1px solid #e2e8f0",
  flexShrink: 0,
};

const DOC_ICON = {
  width: 42,
  height: 42,
  borderRadius: 12,
  background: SAP_LIGHT,
  border: "1px solid #dbeafe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const EYEBROW = {
  fontSize: 9,
  fontWeight: 800,
  color: "#94a3b8",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const DOCUMENT_TITLE = {
  marginTop: 3,
  fontSize: 17,
  lineHeight: 1.3,
  fontWeight: 800,
  color: SAP_DARK,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const HEADER_META = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  marginTop: 4,
  fontSize: 10,
  color: "#64748b",
  whiteSpace: "nowrap",
  overflow: "hidden",
};

const META_DOT = { color: "#cbd5e1" };

const NAV_BTN_LARGE = (active) => ({
  width: 34,
  height: 34,
  borderRadius: 9,
  border: "1px solid #e2e8f0",
  background: active ? "#f8fafc" : "#fff",
  color: active ? "#334155" : "#cbd5e1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: active ? "pointer" : "default",
});

const CLOSE_BTN = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#475569",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const TOOLBAR = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  padding: "10px 20px",
  background: "#ffffff",
  borderBottom: "1px solid #e2e8f0",
  flexShrink: 0,
  flexWrap: "wrap",
};

const TOOLBAR_RIGHT = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const STATUS_PILL = (s) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 999,
  background: s.bg,
  color: s.color,
  border: `1px solid ${s.border}`,
  fontSize: 10,
  fontWeight: 800,
});

const CODE_PILL = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 8,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  fontSize: 10,
  color: SAP_DARK,
  whiteSpace: "nowrap",
};

const WORKSPACE = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 460px",
  minHeight: 0,
  flex: 1,
  overflow: "hidden",
};

const PREVIEW_SECTION = {
  minWidth: 0,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  background: "#eef2f7",
  borderRight: "1px solid #dbe3ee",
};

const SECTION_TOP = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "14px 18px",
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  flexShrink: 0,
};

const SECTION_LABEL = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#94a3b8",
};

const SECTION_TITLE = {
  marginTop: 2,
  fontSize: 14,
  fontWeight: 800,
  color: SAP_DARK,
};

const PREVIEW_BADGE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 9px",
  borderRadius: 8,
  background: "#fff",
  border: "1px solid #e2e8f0",
  color: "#64748b",
  fontSize: 10,
  fontWeight: 700,
};

const PREVIEW_CANVAS = {
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
  padding: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "stretch",
  background: "#e9eef5",
};

const PREVIEW_SHEET = {
  width: "70%",
  height: "100%",
  minHeight: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "stretch",
  padding: 0,
};

const VIEWER_STATE = {
  width: "70%",
  height: "100%",
  minHeight: 500,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "#eef2f7",
};

const FALLBACK_PREVIEW = {
  width: "min(700px, 70%)",
  minHeight: 360,
  background: "#fff",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 35px rgba(15,23,42,0.08)",
  padding: 34,
};

const FALLBACK_TOP = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
};

const FALLBACK_LINE = {
  height: 1,
  background: "#e2e8f0",
  marginTop: 28,
};

const FALLBACK_NOTICE = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  marginTop: 45,
  padding: 14,
  borderRadius: 10,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const PREVIEW_FOOTER = {
  display: "flex",
  justifyContent: "center",
  gap: 7,
  padding: "8px 14px",
  background: "#f8fafc",
  borderTop: "1px solid #e2e8f0",
  color: "#94a3b8",
  fontSize: 10,
  flexShrink: 0,
};

const INFO_PANEL = {
  minWidth: 0,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  background: "#ffffff",
  overflow: "hidden",
};

const INFO_HEADER = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "14px 16px 11px",
  flexShrink: 0,
};

const LOCK_CARD = {
  margin: "0 14px 12px",
  padding: 13,
  borderRadius: 12,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  flexShrink: 0,
};

const CARD_LABEL = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#94a3b8",
};

const UNLOCKED_STATE = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  marginTop: 12,
  padding: "9px 10px",
  borderRadius: 9,
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  color: "#166534",
  fontSize: 11,
  fontWeight: 700,
};

const TABS = {
  display: "flex",
  padding: "0 14px",
  borderBottom: "1px solid #e2e8f0",
  flexShrink: 0,
};

const TAB_BTN = (active) => ({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  padding: "10px 5px",
  border: "none",
  borderBottom: active ? `2px solid ${SAP_BLUE}` : "2px solid transparent",
  background: "transparent",
  color: active ? SAP_BLUE : "#64748b",
  fontSize: 11,
  fontWeight: active ? 800 : 600,
  cursor: "pointer",
});

const INFO_SCROLL = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: 16,
};

const DETAIL_GRID = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 11,
};

const DETAIL_ITEM = {
  minWidth: 0,
  padding: 12,
  borderRadius: 11,
  border: "1px solid #eef2f7",
  background: "#fbfdff",
};

const DETAIL_LABEL = {
  fontSize: 9,
  fontWeight: 800,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 5,
};

const DETAIL_VALUE = {
  fontSize: 11,
  fontWeight: 700,
  color: "#334155",
  lineHeight: 1.45,
  wordBreak: "break-word",
};

const SUMMARY_CARD = {
  marginTop: 10,
  padding: 12,
  borderRadius: 11,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const STATUS_DOT = (color) => ({
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: color,
  boxShadow: `0 0 0 4px ${color}18`,
  flexShrink: 0,
});

const COMPARE_BAR = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
  padding: 11,
  borderRadius: 11,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const COMPARE_BTN = (active) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: `1px solid ${active ? SAP_BLUE : "#e2e8f0"}`,
  borderRadius: 8,
  padding: "7px 10px",
  background: active ? SAP_LIGHT : "#fff",
  color: active ? SAP_BLUE : "#cbd5e1",
  fontSize: 10,
  fontWeight: 800,
  cursor: active ? "pointer" : "default",
});

const CURRENT_BADGE = {
  padding: "4px 7px",
  borderRadius: 999,
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  color: "#166534",
  fontSize: 8,
  fontWeight: 800,
  letterSpacing: "0.05em",
};

const COMMENT_BOX = {
  marginTop: 10,
  padding: 9,
  borderRadius: 9,
  background: "#f8fafc",
  border: "1px solid #eef2f7",
  fontSize: 10,
  lineHeight: 1.5,
  color: "#64748b",
};

const VERSION_DOWNLOAD = {
  marginTop: 10,
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  border: `1px solid ${SAP_BLUE}`,
  borderRadius: 7,
  padding: "6px 9px",
  background: "#fff",
  color: SAP_BLUE,
  fontSize: 10,
  fontWeight: 800,
  cursor: "pointer",
};

const EMPTY_STATE = {
  minHeight: 230,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  color: "#94a3b8",
};

const EMPTY_ICON = {
  width: 42,
  height: 42,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  marginBottom: 10,
};

const PANEL_FOOTER = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "8px 16px",
  background: "#ffffff",
  borderTop: "1px solid #e2e8f0",
  flexShrink: 0,
};

const SECURE_DOT = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: SAP_GREEN,
};

const FOOTER_LINK = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  border: "none",
  background: "transparent",
  color: SAP_BLUE,
  fontSize: 10,
  fontWeight: 800,
  cursor: "pointer",
};

const ICON_BTN = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "6px 8px",
  cursor: "pointer",
  display: "flex",
  color: "#64748b",
};

const NAV_BTN = (active) => ({
  background: active ? "#f1f5f9" : "#fafafa",
  border: "1px solid #e2e8f0",
  borderRadius: 7,
  padding: "4px 7px",
  cursor: active ? "pointer" : "default",
  display: "flex",
  color: active ? "#334155" : "#cbd5e1",
  opacity: active ? 1 : 0.5,
});

