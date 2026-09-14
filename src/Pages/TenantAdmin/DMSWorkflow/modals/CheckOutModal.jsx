// src/Pages/TenantAdmin/DMSWorkflow/modals/CheckOutModal.jsx
//
// Check-Out modal: Reason + Expected Return Date + Confirm.
// Styled identically to UploadModal.jsx (same DMS module pattern).
import React, { useState } from "react";
import { X, Lock, Loader2 } from "lucide-react";
import { SAP_BLUE, SAP_DARK, SAP_AMBER } from "../constants";
import { checkOutDocument } from "../checkInOutApi";

export default function CheckOutModal({ doc, onClose, onCheckedOut }) {
  const [reason, setReason] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for checking out this document.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const lock = await checkOutDocument(doc.id, { reason: reason.trim(), expectedReturnDate });
      onCheckedOut(lock);
    } catch (e) {
      setError(e.message || "Check-out failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={OVERLAY}>
      <div style={MODAL}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lock size={16} color={SAP_AMBER} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: SAP_DARK }}>Check Out Document</h3>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {doc.originalFileName || doc.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={ICON_BTN}><X size={16} /></button>
        </div>

        <div style={{ padding: "10px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 12, color: "#92400e", marginBottom: 16 }}>
          Checking out locks this document for editing. Only you (or a Tenant/Department Admin via Force Unlock) will be able to check it back in.
        </div>

        <Field label="Reason *">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you checking out this document? (e.g. updating figures, correcting a typo)"
            rows={3}
            style={{ ...INPUT, resize: "vertical" }}
            onFocus={(e) => (e.target.style.borderColor = SAP_BLUE)}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </Field>

        <Field label="Expected Return Date">
          <input
            type="date"
            value={expectedReturnDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setExpectedReturnDate(e.target.value)}
            style={INPUT}
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
          <button onClick={handleConfirm} disabled={loading} style={{ ...BTN_PRIMARY, opacity: loading ? 0.75 : 1 }}>
            {loading ? (<><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Checking Out…</>) : (<><Lock size={13} /> Confirm Check Out</>)}
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
const MODAL = { background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" };
const INPUT = { width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#1e293b", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const BTN_OUTLINE = { padding: "9px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const BTN_PRIMARY = { padding: "9px 22px", borderRadius: 8, border: "none", background: SAP_BLUE, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 };
const ICON_BTN = { background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", display: "flex", color: "#64748b" };
