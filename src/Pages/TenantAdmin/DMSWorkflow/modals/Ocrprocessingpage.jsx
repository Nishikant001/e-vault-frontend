import React, { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { SAP_BLUE, SAP_DARK, SAP_LIGHT, SAP_GREEN } from "../constants";
import { API_BASE_URL } from "../../../../services/apiClient";

const LOG_COLOR  = { SUCCESS:"#22c55e", PROCESSING:"#facc15", FAILED:"#ef4444", INFO:"#60a5fa" };
const LOG_PREFIX = { SUCCESS:"✓", PROCESSING:"⟳", FAILED:"✗", INFO:"›" };

const STEPS = ["Dept / Category","Upload","OCR Processing","OCR Review","TCode & Save"];

// Mock OCR logs that stream in
const MOCK_LOGS = [
  { status:"INFO",       message:"Document received: processing started…",     delay:400  },
  { status:"PROCESSING", message:"Extracting text layers from PDF…",           delay:900  },
  { status:"PROCESSING", message:"Running OCR engine on page 1 of 3…",         delay:1600 },
  { status:"PROCESSING", message:"Running OCR engine on page 2 of 3…",         delay:2400 },
  { status:"PROCESSING", message:"Running OCR engine on page 3 of 3…",         delay:3200 },
  { status:"SUCCESS",    message:"OCR extraction complete — 10 fields found.", delay:4200 },
  { status:"INFO",       message:"Confidence scoring applied to all fields.",   delay:4800 },
  { status:"SUCCESS",    message:"Document ready for review.",                  delay:5400 },
];

function ActivityTerminal({ logs, polling }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [logs]);

  return (
    <div style={{ background:"#0A1018", borderRadius:10, fontFamily:"monospace", overflow:"hidden", border:"1px solid #1e2d3d" }}>
      <div style={{ background:"#0F1923", padding:"8px 14px", display:"flex", alignItems:"center", gap:8, borderBottom:"1px solid #1e2d3d" }}>
        {["#ef4444","#facc15","#22c55e"].map(c=>(
          <span key={c} style={{ width:10,height:10,borderRadius:"50%",background:c,opacity:.7,display:"inline-block" }}/>
        ))}
        <span style={{ marginLeft:8, fontSize:11, color:"#475569" }}>document-pipeline — activity</span>
        {polling && <span style={{ marginLeft:"auto", fontSize:10, color:"#facc15" }}>● live</span>}
      </div>
      <div style={{ padding:"12px 16px", minHeight:140, maxHeight:220, overflowY:"auto" }}>
        {logs.length === 0 && <span style={{ fontSize:12, color:"#334155" }}>Waiting for activity…</span>}
        {logs.map((log, i) => {
          const st = log.status || "INFO";
          const ts = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
          return (
            <div key={i} style={{ display:"flex", gap:10, fontSize:12, lineHeight:1.7, color:LOG_COLOR[st]||"#94a3b8" }}>
              <span style={{ color:"#334155", minWidth:72, fontSize:10, marginTop:1 }}>{ts}</span>
              <span style={{ fontWeight:700, width:14 }}>{LOG_PREFIX[st]||"›"}</span>
              <span>{log.message}</span>
            </div>
          );
        })}
        {polling && (
          <div style={{ display:"flex", gap:8, fontSize:12, color:"#facc15", marginTop:4 }}>
            <span style={{ animation:"blink 1s step-end infinite" }}>▋</span>
          </div>
        )}
        <div ref={endRef}/>
      </div>
    </div>
  );
}

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

export default function OCRProcessingPage({ documentId, fileName, dept, category, docType, onComplete, onFailed }) {
  const [logs, setLogs]     = useState([]);
  const [polling, setPolling] = useState(true);
  const [done, setDone]     = useState(false);

useEffect(() => {
  if (!documentId) return;

  let cancelled = false;
  let completed = false;

  const token = localStorage.getItem("accessToken") || "";
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const pollStatus = async () => {
    try {
      const [sRes, aRes] = await Promise.all([
        fetch(
          `${API_BASE_URL}/documents/${documentId}/status`,
          { headers }
        ),
        fetch(
          `${API_BASE_URL}/documents/${documentId}/activity`,
          { headers }
        ),
      ]);

      const [sData, aData] = await Promise.all([
        sRes.json(),
        aRes.json(),
      ]);

      if (cancelled || completed) return;

      // Real backend activity logs
      if (aData?.success) {
        setLogs(aData.logs || []);
      }

      if (!sData?.success) return;

      const currentStatus = sData.status;

      // OCR has genuinely completed
      if (
        [
          "OCR_COMPLETED",
          "WAITING_FOR_APPROVAL",
          "COMPLETED",
        ].includes(currentStatus)
      ) {
        completed = true;
        setPolling(false);
        setDone(true);
        clearInterval(timer);

        // Keep callback payload consistent with the existing
        // mock/button flow if parent expects an object.
        onComplete({});
        return;
      }

      // Real OCR/backend failure
      if (currentStatus === "FAILED") {
        completed = true;
        setPolling(false);
        clearInterval(timer);

        onFailed?.();
      }
    } catch (error) {
      // Do not falsely mark OCR as failed because of one
      // temporary network/polling failure. The next interval retries.
      if (!cancelled) {
        console.error("OCR status polling failed:", error);
      }
    }
  };

  // Poll immediately instead of waiting 2 seconds for the first update.
  pollStatus();

  const timer = setInterval(pollStatus, 2000);

  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}, [documentId, onComplete, onFailed]);

  return (
    <div style={{ minHeight:"100vh", background:"#F0F4F8", fontFamily:"'72', Arial, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes blink{50%{opacity:0}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} .fade-up{animation:fadeUp 0.3s ease forwards}`}</style>

      {/* Breadcrumb */}
      <div style={{ padding:"8px 24px", background:"#fff", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
        <span style={{ color:"#64748b" }}>{dept?.name}</span>
        <ChevronRight size={12} color="#94a3b8"/>
        <span style={{ color:"#64748b" }}>{category?.name}</span>
        <ChevronRight size={12} color="#94a3b8"/>
        <span style={{ color:SAP_BLUE, fontWeight:600 }}>{docType?.name}</span>
        <ChevronRight size={12} color="#94a3b8"/>
        <span style={{ color:"#94a3b8" }}>OCR Processing</span>
      </div>

      <div style={{ padding:"20px 24px", maxWidth:960, margin:"0 auto" }}>
        <Stepper current={2}/>

        <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", padding:"28px 32px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          {/* Section Title */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24, paddingBottom:16, borderBottom:`2px solid ${SAP_LIGHT}` }}>
            <div style={{ width:4, height:28, background:SAP_BLUE, borderRadius:4 }}/>
            <div>
              <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:SAP_DARK }}>OCR Processing</h2>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#64748b" }}>Processing: {fileName}</p>
            </div>
          </div>

          {/* Status Banner */}
          {!done ? (
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, padding:"10px 16px", background:"#fefce8", border:"1px solid #fde68a", borderRadius:10 }}>
              <Loader2 size={16} color="#d97706" style={{ animation:"spin 1s linear infinite", flexShrink:0 }}/>
              <span style={{ fontSize:13, color:"#92400e", fontWeight:600 }}>OCR running — please wait…</span>
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, padding:"10px 16px", background:"#f0fdf4", border:"1px solid #86efac", borderRadius:10 }}>
              <CheckCircle2 size={16} color={SAP_GREEN}/>
              <span style={{ fontSize:13, color:"#166534", fontWeight:600 }}>OCR completed successfully!</span>
            </div>
          )}

          <ActivityTerminal logs={logs} polling={polling}/>

          {done && (
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:20 }}>
              <button onClick={() => onComplete({})}
                style={{ padding:"10px 28px", borderRadius:10, background:SAP_BLUE, color:"#fff", border:"none", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                Proceed to Review →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}