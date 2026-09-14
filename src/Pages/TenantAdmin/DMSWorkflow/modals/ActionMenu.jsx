import React, { useEffect, useRef } from "react";
import { Eye, Download, Clock, RefreshCw, ScanLine, Edit3, Move, Trash2, FileSearch, Share2, Lock, Unlock, ShieldAlert } from "lucide-react";
import { canCheckOut, canCheckIn, canForceUnlock } from "../checkInOutApi";

const BASE_ACTIONS = [
  // { id:"view",     icon:<Eye size={14}/>,        label:"View" },
  // { id:"download", icon:<Download size={14}/>,   label:"Download" },
  { id:"history",  icon:<Clock size={14}/>,      label:"Version History" },
  { id:"replace",  icon:<RefreshCw size={14}/>,  label:"Replace Document" },
  // { id:"metadata", icon:<Edit3 size={14}/>,      label:"Edit Metadata" },
  { id:"move",     icon:<Move size={14}/>,       label:"Move Document" },
  // { id:"delete",   icon:<Trash2 size={14}/>,     label:"Delete Document", danger:true },
  { id:"audit",    icon:<FileSearch size={14}/>, label:"Audit Log" },
  // { id:"share",    icon:<Share2 size={14}/>,     label:"Share Document" },
];

export default function ActionMenu({ position, doc, currentUser, onAction, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Enterprise Check-In/Check-Out — lock actions, shown only when the
  // signed-in user's role + the document's current lock state allow it
  // (mirrors CheckInOutService.CHECKOUT_ROLES / FORCE_UNLOCK_ROLES exactly,
  // so a visible button never just 403s on click).
  const lockContext = {
    isCheckedOut: !!doc?.isCheckedOut,
    checkedOutBy: doc?.checkedOutBy,
  };
  const lockActions = [];
  if (canCheckOut(currentUser, lockContext)) {
    lockActions.push({ id: "checkout", icon: <Lock size={14} />, label: "Check Out" });
  }
  if (canCheckIn(currentUser, lockContext)) {
    lockActions.push({ id: "checkin", icon: <Unlock size={14} />, label: "Check In" });
  }
  if (canForceUnlock(currentUser, lockContext)) {
    lockActions.push({ id: "forceUnlock", icon: <ShieldAlert size={14} />, label: "Force Unlock", danger: true });
  }

  // "Reprocess OCR" — only makes sense once OCR has actually run at least
  // once (OCR_COMPLETED/FAILED) and the original file is still around
  // (finalized/SAP-pushed docs have their tempFilePath deleted, so the
  // backend rejects those — we hide the option for those states too).
  const reprocessableStatuses = ["OCR_COMPLETED", "OCR_FAILED"];
  const canReprocess = reprocessableStatuses.includes(doc?.uploadStatus);
  const reprocessAction = canReprocess
    ? [{ id: "reprocessOcr", icon: <ScanLine size={14} />, label: "Reprocess OCR" }]
    : [];

  const ACTIONS = [...lockActions, ...reprocessAction, ...BASE_ACTIONS];

  // Adjust position so menu doesn't overflow screen
  const left = Math.min(position.x, window.innerWidth  - 200);
  const top  = Math.min(position.y, window.innerHeight - (ACTIONS.length * 36 + 16));

  return (
    <div ref={ref} style={{
      position:"fixed", top, left, zIndex:2000,
      background:"#fff", borderRadius:12, border:"1px solid #e2e8f0",
      boxShadow:"0 8px 32px rgba(0,0,0,0.14)", padding:"6px", minWidth:190,
    }}>
      {ACTIONS.map((a) => (
        <React.Fragment key={a.id}>
          {(a.id === "delete" || (a.id === "history" && lockActions.length > 0)) && (
            <div style={{ height:1, background:"#f1f5f9", margin:"4px 0" }}/>
          )}
          <button
            onClick={() => { onAction(a.id, doc); onClose(); }}
            style={{
              display:"flex", alignItems:"center", gap:10, width:"100%",
              padding:"8px 12px", border:"none", background:"transparent", borderRadius:8,
              cursor:"pointer", fontSize:13, fontWeight:500,
              color: a.danger ? "#dc2626" : "#334155",
              textAlign:"left",
            }}
            onMouseEnter={e => e.currentTarget.style.background = a.danger ? "#fef2f2" : "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span style={{ color: a.danger ? "#dc2626" : "#64748b" }}>{a.icon}</span>
            {a.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
