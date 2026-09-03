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
function DocumentThumbnail({ docId, fallback }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;
    setSrc(null);
    setFailed(false);

    fetch(`${API}/documents/${docId}/thumbnail`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("no thumbnail");
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [docId]);

  if (failed) return fallback;
  if (!src) {
    return (
      <div style={{ width: "100%", height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={20} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }
  return <img src={src} alt="Document thumbnail" style={{ maxWidth: "100%", maxHeight: 260, objectFit: "contain" }} />;
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PreviewPanel({ doc, allDocs, onClose, onDocChange, onView, onDownload, currentUser, onLockChanged }) {
  const [tab,         setTab]         = useState("details");
  const [currentPage, setCurrentPage] = useState(1);
  const [versions,    setVersions]    = useState([]);
  const [loadingVer,  setLoadingVer]  = useState(false);
  const totalPages = 3;

  const [lock,        setLock]        = useState(null);
  const [loadingLock, setLoadingLock] = useState(false);

  const [compareIds, setCompareIds] = useState([]);

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

  useEffect(() => { setCurrentPage(1); setTab("details"); setCompareIds([]); }, [doc.id]);

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
    <div style={PANEL}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <FileText size={15} color={SAP_BLUE} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: SAP_DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {doc.originalFileName || doc.name}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => hasPrev && onDocChange(allDocs[idx - 1])} disabled={!hasPrev} style={NAV_BTN(hasPrev)}><ChevronLeft size={14} /></button>
          <button onClick={() => hasNext && onDocChange(allDocs[idx + 1])} disabled={!hasNext} style={NAV_BTN(hasNext)}><ChevronRight size={14} /></button>
          <button onClick={onClose} style={ICON_BTN}><X size={15} /></button>
        </div>
      </div>

      <div style={{ position: "relative", background: "#f1f5f9", padding: 16, borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
        <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
          <DocumentThumbnail
            docId={doc.id}
            fallback={
              <div style={{ width: "100%", padding: "16px 24px", fontFamily: "serif" }}>
                <div style={{ textAlign: "right", marginBottom: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.1em", color: "#1e293b" }}>DOCUMENT</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b", marginBottom: 12 }}>
                  <div><b>File:</b> {doc.originalFileName || doc.name}</div>
                  <div><b>Version:</b> V{doc.version || 1}</div>
                </div>
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8, fontSize: 11, color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>
                  Click "View" to open document
                </div>
              </div>
            }
          />
          <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.35)", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "#fff" }}>
            Page {currentPage} / {totalPages}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 10 }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={NAV_BTN(currentPage > 1)}><ChevronLeft size={13} /></button>
          <span style={{ fontSize: 12, color: "#64748b" }}>{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={NAV_BTN(currentPage < totalPages)}><ChevronRight size={13} /></button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "10px 16px", borderBottom: "1px solid #e2e8f0", flexShrink: 0, flexWrap: "wrap" }}>
        <ActionBtn
          icon={<Download size={13} />} label="Download"
          color={SAP_BLUE} bg={SAP_LIGHT}
          onClick={() => onDownload ? onDownload(doc) : undefined}
          disabled={doc.uploadStatus !== "COMPLETED"}
        />
        <ActionBtn
          icon={<Maximize2 size={13} />} label="View"
          color="#475569" bg="#f1f5f9"
          onClick={() => onView ? onView(doc) : undefined}
          disabled={doc.uploadStatus !== "COMPLETED"}
        />
        <ActionBtn icon={<Printer size={13} />} label="Print" color="#475569" bg="#f1f5f9" />
      </div>

      <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", flexShrink: 0, background: "#fafbfc" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Document Lock Status
          </span>
          {loadingLock && <Loader2 size={12} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />}
        </div>

        {lock && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: lock.isCheckedOut ? 8 : 0, flexWrap: "wrap" }}>
              <LockBadge isCheckedOut={lock.isCheckedOut} lockedByLabel={lockedByLabel} />
              {lock.isCheckedOut && <LockedByChip label={lockedByLabel} />}
            </div>

            {lock.isCheckedOut && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 12 }}>
                <LockField label="Checked Out Time" value={formatDateTime(lock.checkedOutAt)} />
                <LockField label="Expected Return" value={lock.lockExpiry ? formatDateTime(lock.lockExpiry) : "—"} />
                {lock.lockReason && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <LockField label="Reason" value={lock.lockReason} />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {showCheckOutBtn && (
            <ActionBtn icon={<Lock size={13} />} label="Check Out" color={SAP_AMBER} bg="#fff7ed" onClick={() => setShowCheckOut(true)} />
          )}
          {showCheckInBtn && (
            <ActionBtn icon={<Unlock size={13} />} label="Check In" color={SAP_GREEN} bg="#f0fdf4" onClick={() => setShowCheckIn(true)} />
          )}
          {showForceUnlockBtn && (
            <ActionBtn icon={<ShieldAlert size={13} />} label="Force Unlock" color={SAP_RED} bg="#fef2f2" onClick={() => setShowForceUnlock(true)} />
          )}
          <ActionBtn icon={<HistoryIcon size={13} />} label="View Version History" color="#475569" bg="#f1f5f9" onClick={() => setTab("history")} />
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
        {["details", "history", "activity"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "10px 0", border: "none", background: "transparent",
            fontWeight: tab === t ? 700 : 500, fontSize: 12,
            color: tab === t ? SAP_BLUE : "#64748b",
            borderBottom: tab === t ? `2px solid ${SAP_BLUE}` : "2px solid transparent",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}>
            {t === "details" && "Details"}
            {t === "history" && "Version History"}
            {t === "activity" && (<><ActivityIcon size={12} /> Activity</>)}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>

        {tab === "details" && (
          <div>
            {[
              ["File Name",    doc.originalFileName || doc.name],
              ["Type",         doc.DocumentType?.name || "—"],
              ["Department",   doc.Department?.name   || "—"],
              ["Category",     doc.Category?.name     || "—"],
              ["Uploaded By",  doc.uploader?.email    || doc.uploadedBy || "—"],
              ["Upload Date",  doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "—"],
              ["Version",      `V${doc.version || 1}`],
              ["TCode",        doc.tcode || "—"],
              ["Status",       null],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f8fafc" }}>
                <span style={{ fontSize: 12, color: "#64748b", flexShrink: 0 }}>{k}</span>
                {k === "Status"
                  ? <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
                      {doc.uploadStatus || doc.status}
                    </span>
                  : k === "TCode" && doc.tcode
                    ? <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: SAP_BLUE }}>{v}</span>
                    : <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", textAlign: "right", maxWidth: 160, wordBreak: "break-all" }}>{v}</span>
                }
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div>
            {versions.length >= 2 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "8px 10px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {compareIds.length === 0 ? "Select up to 2 versions to compare" : `${compareIds.length} of 2 versions selected`}
                </span>
                <button
                  disabled={compareIds.length !== 2}
                  onClick={() => alert("Compare Versions — coming soon. This will show a side-by-side diff of the selected versions.")}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700,
                    padding: "5px 10px", borderRadius: 7, border: `1px solid ${compareIds.length === 2 ? SAP_BLUE : "#e2e8f0"}`,
                    background: compareIds.length === 2 ? SAP_LIGHT : "#f8fafc",
                    color: compareIds.length === 2 ? SAP_BLUE : "#cbd5e1",
                    cursor: compareIds.length === 2 ? "pointer" : "default",
                  }}
                >
                  <GitCompare size={12} /> Compare Versions
                </button>
              </div>
            )}

            {loadingVer ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32, gap: 8, color: "#94a3b8" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 13 }}>Loading versions…</span>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : versions.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "#94a3b8", fontSize: 13 }}>
                No version history found
              </div>
            ) : (
              versions.map((vr, i) => {
                const isLatest = i === 0;
                const isSelected = compareIds.includes(vr.id);
                return (
                  <div key={vr.id} style={{ display: "flex", gap: 12, paddingBottom: 16, position: "relative" }}>
                    {i < versions.length - 1 && (
                      <div style={{ position: "absolute", left: 14, top: 28, width: 2, height: "calc(100% - 8px)", background: "#e2e8f0" }} />
                    )}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: isLatest ? SAP_BLUE : SAP_LIGHT,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isLatest ? "#fff" : SAP_BLUE,
                      fontSize: 10, fontWeight: 700, zIndex: 1,
                    }}>
                      V{vr.version}
                    </div>

                    <div style={{ flex: 1, minWidth: 0, border: isSelected ? `1.5px solid ${SAP_BLUE}` : "1.5px solid transparent", borderRadius: 8, padding: isSelected ? "6px 8px" : "6px 0", background: isSelected ? SAP_LIGHT : "transparent" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2, gap: 8 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleCompare(vr.id)} style={{ cursor: "pointer" }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: SAP_DARK }}>Version {vr.version}</span>
                        </label>
                        {isLatest && (
                          <span style={{ fontSize: 10, background: "#f0fdf4", color: "#166534", border: "1px solid #86efac", borderRadius: 20, padding: "1px 8px", fontWeight: 600, whiteSpace: "nowrap" }}>
                            Current Version
                          </span>
                        )}
                      </div>

                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                        Uploaded by {vr.uploader?.email || vr.uploadedBy || "—"}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                        {vr.createdAt ? new Date(vr.createdAt).toLocaleString() : "—"}
                      </p>

                      <div style={{ marginTop: 4 }}>
                        {(() => {
                          const s = STATUS_COLORS[vr.uploadStatus] || { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" };
                          return (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                              {vr.uploadStatus}
                            </span>
                          );
                        })()}
                      </div>

                      {vr.checkInComments && (
                        <p style={{ margin: "6px 0 0", fontSize: 11, color: "#475569", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 6, padding: "6px 8px" }}>
                          <b style={{ color: "#334155" }}>Comments:</b> {vr.checkInComments}
                        </p>
                      )}

                      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                        {vr.uploadStatus === "COMPLETED" && (
                          <button
                            onClick={() => handleDownloadVersion(vr)}
                            style={{ fontSize: 11, color: SAP_BLUE, background: "transparent", border: `1px solid ${SAP_BLUE}`, borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Download size={10} /> Download V{vr.version}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "activity" && (
          <div style={{ margin: "-16px" }}>
            {loadingActivity ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32, gap: 8, color: "#94a3b8" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 13 }}>Loading activity…</span>
              </div>
            ) : activity.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "#94a3b8", fontSize: 13 }}>
                No activity recorded for this document yet
              </div>
            ) : (
              <AuditTimeline entries={activity} />
            )}
          </div>
        )}
      </div>

      {showCheckOut && (
        <CheckOutModal doc={doc} onClose={() => setShowCheckOut(false)} onCheckedOut={refreshAfterLockChange} />
      )}
      {showCheckIn && (
        <CheckInModal doc={doc} onClose={() => setShowCheckIn(false)} onCheckedIn={refreshAfterLockChange} />
      )}
      {showForceUnlock && (
        <ForceUnlockModal doc={doc} lock={lock} onClose={() => setShowForceUnlock(false)} onForceUnlocked={refreshAfterLockChange} />
      )}
    </div>
  );
}

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
        display: "flex", alignItems: "center", gap: 5,
        padding: "6px 12px", borderRadius: 8, border: "none",
        background: disabled ? "#f8fafc" : bg,
        color: disabled ? "#cbd5e1" : color,
        fontWeight: 600, fontSize: 12,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}>
      {icon}{label}
    </button>
  );
}

const PANEL   = { display: "flex", flexDirection: "column", width: 320, minWidth: 280, background: "#fff", borderLeft: "1px solid #e2e8f0", height: "100%" };
const ICON_BTN = { background: "#f1f5f9", border: "none", borderRadius: 7, padding: "5px 7px", cursor: "pointer", display: "flex", color: "#64748b" };
const NAV_BTN  = (active) => ({ background: active ? "#f1f5f9" : "#fafafa", border: "1px solid #e2e8f0", borderRadius: 7, padding: "4px 7px", cursor: active ? "pointer" : "default", display: "flex", color: active ? "#334155" : "#cbd5e1", opacity: active ? 1 : 0.5 });
