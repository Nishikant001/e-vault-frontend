// src/Pages/TenantAdmin/DMSWorkflow/modals/ForceUnlockModal.jsx
//
// Force Unlock modal: Reason (required) + a distinct Confirmation step,
// since this overrides another user's active checkout (TenantAdmin/
// DeptHead only — enforced again server-side by FORCE_UNLOCK_ROLES).
import React, { useState } from "react";
import { X, ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";
import { SAP_DARK, SAP_RED } from "../constants";
import { forceUnlockDocument } from "../checkInOutApi";

export default function ForceUnlockModal({ doc, lock, onClose, onForceUnlocked }) {
  const [step, setStep] = useState("reason"); // "reason" -> "confirm"
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lockedByLabel =
    lock?.checkedOutByUser?.name || lock?.checkedOutByUser?.email || (lock?.checkedOutBy ? `User #${lock.checkedOutBy}` : "another user");

  const handleContinue = () => {
    if (!reason.trim()) {
      setError("A reason is required to force-unlock this document.");
      return;
    }
    setError("");
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await forceUnlockDocument(doc.id, { reason: reason.trim() });
      onForceUnlocked(result);
    } catch (e) {
      setError(e.message || "Force-unlock failed");
      setStep("reason");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={OVERLAY}>
      <div style={MODAL}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldAlert size={16} color={SAP_RED} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: SAP_DARK }}>Force Unlock Document</h3>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {doc.originalFileName || doc.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={ICON_BTN}><X size={16} /></button>
        </div>

        {step === "reason" && (
          <>
            <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 12, color: "#991b1b", marginBottom: 16 }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                This document is currently checked out by <b>{lockedByLabel}</b>. Force-unlocking releases their lock immediately —
                any unsaved local edits they have will not be captured as a new version.
              </span>
            </div>

            <Field label="Reason *">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this document being force-unlocked? (e.g. user unavailable, urgent correction needed)"
                rows={3}
                style={{ ...INPUT, resize: "vertical" }}
                onFocus={(e) => (e.target.style.borderColor = SAP_RED)}
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
              <button onClick={handleContinue} style={BTN_DANGER}>Continue</button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <div style={{ padding: "16px", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, marginBottom: 18, textAlign: "center" }}>
              <ShieldAlert size={26} color={SAP_RED} style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#991b1b" }}>
                Are you sure you want to force-unlock this document?
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#7f1d1d" }}>
                This action will be recorded in the audit trail and cannot be undone.
              </p>
            </div>

            {error && (
              <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, color: "#dc2626", fontSize: 12, marginBottom: 12 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <button onClick={() => setStep("reason")} style={BTN_OUTLINE} disabled={loading}>Back</button>
              <button onClick={handleConfirm} disabled={loading} style={{ ...BTN_DANGER, opacity: loading ? 0.75 : 1 }}>
                {loading ? (<><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Unlocking…</>) : (<><ShieldAlert size={13} /> Yes, Force Unlock</>)}
              </button>
            </div>
          </>
        )}
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
const BTN_DANGER = { padding: "9px 22px", borderRadius: 8, border: "none", background: SAP_RED, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 };
const ICON_BTN = { background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", display: "flex", color: "#64748b" };
