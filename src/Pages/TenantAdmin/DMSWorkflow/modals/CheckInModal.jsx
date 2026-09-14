// src/Pages/TenantAdmin/DMSWorkflow/modals/CheckInModal.jsx
//
// Check-In modal: Upload New File (optional) + Comments + Version Notes + Submit.
// Drop-zone styled identically to UploadModal.jsx (same DMS module pattern).
import React, { useState } from "react";
import { X, Unlock, Upload, Loader2 } from "lucide-react";
import { SAP_BLUE, SAP_DARK, SAP_LIGHT, SAP_GREEN } from "../constants";
import { checkInDocument } from "../checkInOutApi";

export default function CheckInModal({ doc, onClose, onCheckedIn }) {
  const [file, setFile] = useState(null);
  const [comments, setComments] = useState("");
  const [versionNotes, setVersionNotes] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (f) => setFile(f);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await checkInDocument(doc.id, { file, comments, versionNotes });
      onCheckedIn(result);
    } catch (e) {
      setError(e.message || "Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={OVERLAY}>
      <div style={MODAL}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Unlock size={16} color={SAP_GREEN} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: SAP_DARK }}>Check In Document</h3>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {doc.originalFileName || doc.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={ICON_BTN}><X size={16} /></button>
        </div>

        {/* Drop Zone — optional file, checking in without a new file just releases the lock */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => !loading && document.getElementById("__checkin_file__").click()}
          style={{
            border: `2px dashed ${dragOver ? SAP_BLUE : "#cbd5e1"}`,
            borderRadius: 10, padding: "20px 16px", textAlign: "center",
            background: dragOver ? SAP_LIGHT : file ? "#f0fdf4" : "#fafbfc",
            cursor: loading ? "default" : "pointer", marginBottom: 16, transition: "all 0.2s",
          }}
        >
          <Upload size={20} color={file ? "#22c55e" : SAP_BLUE} style={{ marginBottom: 6 }} />
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: file ? "#166534" : "#334155" }}>
            {file ? file.name : "Drag & drop modified file, or click to choose (optional)"}
          </p>
          {file ? (
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>{(file.size / 1024).toFixed(1)} KB — will be saved as a new version</p>
          ) : (
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "#94a3b8" }}>No file selected — this will just release the lock</p>
          )}
        </div>
        <input id="__checkin_file__" type="file" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; if (f) handleFile(f); }} />

        <Field label="Comments">
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="What changed in this check-in?"
            rows={2}
            style={{ ...INPUT, resize: "vertical" }}
            onFocus={(e) => (e.target.style.borderColor = SAP_BLUE)}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </Field>

        <Field label="Version Notes">
          <textarea
            value={versionNotes}
            onChange={(e) => setVersionNotes(e.target.value)}
            placeholder="Notes for this specific version (e.g. summary of changes made)"
            rows={2}
            style={{ ...INPUT, resize: "vertical" }}
            onFocus={(e) => (e.target.style.borderColor = SAP_BLUE)}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </Field>

        {error && (
          <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, color: "#dc2626", fontSize: 12, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={BTN_OUTLINE}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ ...BTN_PRIMARY, opacity: loading ? 0.75 : 1 }}>
            {loading ? (<><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Submitting…</>) : (<><Unlock size={13} /> Submit</>)}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      {children}
    </div>
  );
}

const OVERLAY = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)", padding: 16 };
const MODAL = { background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" };
const INPUT = { width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#1e293b", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const BTN_OUTLINE = { padding: "9px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const BTN_PRIMARY = { padding: "9px 22px", borderRadius: 8, border: "none", background: SAP_BLUE, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 };
const ICON_BTN = { background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", display: "flex", color: "#64748b" };
