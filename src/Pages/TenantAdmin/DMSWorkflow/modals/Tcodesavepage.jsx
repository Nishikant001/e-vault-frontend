import React, { useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, ChevronRight } from "lucide-react";
import { SAP_BLUE, SAP_DARK, SAP_LIGHT, SAP_GREEN } from "../constants";
import { API_BASE_URL } from "../../../../services/apiClient";

const STEPS = ["Dept / Category","Upload","OCR Processing","OCR Review","TCode & Save"];

function Stepper({ current }) {
  return (
    <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", padding:"20px 32px", marginBottom:20, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", position:"relative" }}>
        <div style={{ position:"absolute", top:18, left:"8%", right:"8%", height:2, background:"#e2e8f0", zIndex:0 }}/>
        {STEPS.map((label,i) => {
          const done   = i < current;
          const active = i === current;
          return (
            <div key={label} style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", flex:1 }}>
              <div style={{
                width:38, height:38, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                fontWeight:700, fontSize:13,
                ...(done   ? { background:SAP_GREEN, color:"#fff" }
                  : active ? { background:SAP_BLUE, color:"#fff", boxShadow:`0 0 0 5px rgba(0,112,242,0.18)` }
                  : { background:"#fff", color:"#94a3b8", border:"2px solid #e2e8f0" })
              }}>
                {done ? <CheckCircle2 size={16}/> : i+1}
              </div>
              <span style={{ marginTop:8, fontSize:11, fontWeight:active?700:400, color:active?SAP_BLUE:done?SAP_GREEN:"#94a3b8", textAlign:"center" }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default function TCodeSavePage({ documentId, fileName, tcode, editedFields, dept, category, docType, approvalRequired, documentApprovalId, onFinalized, onBack, onReset }) {
  const [finalizing, setFinalizing] = useState(false);
  const [finalized,  setFinalized]  = useState(false);
  const [error, setError] = useState("");

  const handleFinalize = async () => {
    setFinalizing(true);
    setError("");
    try {
      const token = localStorage.getItem("accessToken") || "";
      const res   = await fetch(`${API_BASE_URL}/documents/${documentId}/finalize`, {
        method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ fields:editedFields }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Finalize failed");
      setFinalized(true);
      onFinalized && onFinalized();
    } catch (e) {
      setError(e.message);
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#F0F4F8", fontFamily:"'72', Arial, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} .fade-up{animation:fadeUp 0.3s ease forwards}`}</style>

      {/* Breadcrumb */}
      <div style={{ padding:"8px 24px", background:"#fff", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
        <span style={{ color:"#64748b" }}>{dept?.name}</span>
        <ChevronRight size={12} color="#94a3b8"/>
        <span style={{ color:"#64748b" }}>{category?.name}</span>
        <ChevronRight size={12} color="#94a3b8"/>
        <span style={{ color:SAP_BLUE, fontWeight:600 }}>{docType?.name}</span>
        <ChevronRight size={12} color="#94a3b8"/>
        <span style={{ color:"#94a3b8" }}>TCode & Save</span>
      </div>

      <div style={{ padding:"20px 24px", maxWidth:960, margin:"0 auto" }}>
        <Stepper current={finalized ? 5 : 4}/>

        {!finalized ? (
          <div className="fade-up" style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", padding:"28px 32px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
            {/* Title */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24, paddingBottom:16, borderBottom:`2px solid ${SAP_LIGHT}` }}>
              <div style={{ width:4, height:28, background:SAP_BLUE, borderRadius:4 }}/>
              <div>
                <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:SAP_DARK }}>TCode & Save to SAP</h2>
                <p style={{ margin:"2px 0 0", fontSize:12, color:"#64748b" }}>Document: {fileName}</p>
              </div>
            </div>

            {/* TCode Card */}
            {tcode && (
              <div style={{ padding:"20px 24px", background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:12, marginBottom:24, display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ width:44,height:44,borderRadius:"50%",background:SAP_GREEN,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <CheckCircle2 size={22} color="#fff"/>
                </div>
                <div>
                  <p style={{ margin:0, fontSize:12, color:"#166534" }}>Transaction Code Generated</p>
                  <p style={{ margin:"4px 0 0", fontSize:24, fontWeight:800, color:SAP_DARK, fontFamily:"monospace", letterSpacing:"0.06em" }}>{tcode}</p>
                </div>
              </div>
            )}

            {/* Summary Table */}
            <div style={{ border:"1px solid #e2e8f0", borderRadius:12, overflow:"hidden", marginBottom:24 }}>
              <div style={{ background:"#f8fafc", padding:"10px 16px", borderBottom:"1px solid #e2e8f0" }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#334155" }}>Document Summary</span>
              </div>
              {Object.entries(editedFields || {})
                .filter(([, value]) => value !== undefined && value !== null && value !== "")
                .map(([internalName, value]) => (
                  <div key={internalName} style={{ display:"flex", padding:"9px 16px", borderBottom:"1px solid #f1f5f9" }}>
                    <span style={{ width:160, fontSize:12, color:"#64748b", textTransform:"capitalize" }}>
                      {internalName.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{String(value)}</span>
                  </div>
                ))}
            </div>

                        {error && (
              <div style={{ marginBottom:16, padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, color:"#b91c1c", fontSize:13 }}>
                {error}
              </div>
            )}

            {approvalRequired ? (
              <div style={{ padding:"14px 18px", background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:10, fontSize:13, color:"#92400e", marginBottom:16 }}>
                Waiting for approval{documentApprovalId ? ` · #${documentApprovalId}` : ""} — SAP upload runs automatically once fully approved.
              </div>
            ) : null}

            <div style={{ display:"flex", gap:12, justifyContent:"space-between" }}>
              <button onClick={onBack} style={{ padding:"10px 20px", borderRadius:10, border:"1px solid #e2e8f0", background:"#fff", color:"#64748b", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                ← Back to Review
              </button>
              {!approvalRequired && (
                <button onClick={handleFinalize} disabled={finalizing}
                  style={{ padding:"10px 28px", borderRadius:10, background:SAP_DARK, color:"#fff", border:"none", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:8, opacity:finalizing?0.75:1 }}>
                  {finalizing ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/> Saving to SAP…</> : "Save to SAP ✓"}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* SUCCESS */
          <div className="fade-up" style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", padding:"60px 32px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", textAlign:"center" }}>
            <div style={{ width:80,height:80,borderRadius:"50%",background:SAP_GREEN,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
              <CheckCircle2 size={40} color="#fff"/>
            </div>
            <h2 style={{ margin:"0 0 8px", fontSize:24, fontWeight:800, color:SAP_DARK }}>Document Archived!</h2>
            <p style={{ margin:"0 0 4px", fontSize:14, color:"#64748b" }}>File: <strong>{fileName}</strong></p>
            <p style={{ margin:"0 0 28px", fontSize:14, color:"#64748b" }}>
              TCode: <strong style={{ fontFamily:"monospace", color:SAP_DARK }}>{tcode}</strong>
            </p>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <button onClick={onReset}
                style={{ padding:"12px 32px", borderRadius:10, background:SAP_BLUE, color:"#fff", border:"none", fontWeight:700, fontSize:14, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8 }}>
                <RefreshCw size={15}/> Upload Another Document
              </button>
              <button onClick={onReset}
                style={{ padding:"12px 28px", borderRadius:10, border:`1.5px solid ${SAP_BLUE}`, background:"#fff", color:SAP_BLUE, fontWeight:700, fontSize:14, cursor:"pointer" }}>
                Back to DMS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}