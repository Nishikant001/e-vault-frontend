import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, ChevronRight, Search as SearchIcon, RotateCcw } from "lucide-react";
import { SAP_BLUE, SAP_DARK, SAP_LIGHT, SAP_GREEN, SAP_AMBER } from "../constants";
import * as metadataApi from "../../../../features/metadataEngine/api";
import FieldRenderer from "../../../../features/metadataEngine/components/FieldRenderer";
import { confidenceColor, confidenceLabel } from "../../../../features/metadataEngine/fieldTypes";
import { API_BASE_URL } from "../../../../services/apiClient";   

const STEPS = ["Dept / Category", "Upload", "OCR Processing", "OCR Review", "TCode & Save"];
const AUTOSAVE_DELAY_MS = 2500;

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

/**
 * Dynamic OCR Review — replaces the old hardcoded Invoice Number / PO
 * Number / Vendor / Amount field list. Every field shown here comes from
 * the MetadataTemplateVersion assigned to this document's document type
 * at upload time (GET /documents/:id/metadata); nothing is hardcoded.
 * Keeps the exact same prop signature the old component had, so the
 * parent wizard (TADocuments.jsx) needed zero changes.
 */
export default function OCRReviewPage({ documentId, fileName, dept, category, docType, onGenerateTcode, onBack }) {
  const [loadState, setLoadState] = useState("loading"); // loading | ready | none | error
  const [fields, setFields] = useState([]);
  const [originalValues, setOriginalValues] = useState({});
  const [values, setValues] = useState({});
  const [confidence, setConfidence] = useState({});
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [autosaveState, setAutosaveState] = useState("idle"); // idle | saving | saved | error
  const [generating, setGenerating] = useState(false);
  const [loadError, setLoadError] = useState("");
  const autosaveTimer = useRef(null);

  // ── Load dynamic metadata for this document ─────────────────
  useEffect(() => {
    let cancelled = false;
    if (!documentId) {
      setLoadState("none");
      return;
    }
    metadataApi
      .getDocumentMetadata(documentId)
      .then((res) => {
        if (cancelled) return;
        if (!res.data) {
          setLoadState("none");
          return;
        }
        const visibleFields = (res.data.fields || []).filter((f) => !f.hidden);
        setFields(visibleFields);
        setOriginalValues(res.data.mappedMetadata || {});
        setValues(res.data.mappedMetadata || {});
        setConfidence(res.data.confidence || {});
        setErrors(res.data.validationErrors || {});
        setLoadState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message || "Failed to load OCR metadata");
        setLoadState("error");
      });
    return () => { cancelled = true; };
  }, [documentId]);

  // ── Warn before leaving with unsaved edits ──────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ── Autosave (debounced) ────────────────────────────────────
  useEffect(() => {
    if (!dirty || loadState !== "ready") return;
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setAutosaveState("saving");
      try {
        const res = await metadataApi.correctDocumentMetadata(documentId, values, false);
        setErrors(res.data.validationErrors || {});
        setAutosaveState("saved");
        setDirty(false);
        setTimeout(() => setAutosaveState((s) => (s === "saved" ? "idle" : s)), 1500);
      } catch (err) {
        setAutosaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(autosaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const handleFieldChange = (internalName, newValue) => {
    setValues((prev) => ({ ...prev, [internalName]: newValue }));
    setDirty(true);
  };

  const handleRevertField = (internalName) => {
    setValues((prev) => ({ ...prev, [internalName]: originalValues[internalName] }));
    setDirty(true);
  };

  const handleGenerate = async () => {
  setGenerating(true);
  try {
    const res = await metadataApi.correctDocumentMetadata(documentId, values, true);
    setErrors(res.data.validationErrors || {});
    if (!res.data.valid) {
      setGenerating(false);
      return;
    }

    const token = localStorage.getItem("accessToken") || "";
    const tcodeRes = await fetch(`${API_BASE_URL}/documents/${documentId}/generate-tcode`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const tcodeData = await tcodeRes.json();
    if (!tcodeRes.ok || !tcodeData.success) {
      throw new Error(tcodeData.message || "TCode generation failed");
    }

    onGenerateTcode(
      tcodeData.tcode,
      values,
      !!tcodeData.approvalRequired,
      tcodeData.documentApprovalId || null
    );
  } catch (e) {
    setErrors((prev) => ({ ...prev, __generate: e.message }));
  } finally {
    setGenerating(false);
  }
};

  const modifiedCount = useMemo(
    () => fields.filter((f) => String(values[f.internalName] ?? "") !== String(originalValues[f.internalName] ?? "")).length,
    [fields, values, originalValues]
  );
  const hasErrors = Object.values(errors || {}).some((e) => Array.isArray(e) && e.length > 0);

  return (
    <div style={{ minHeight:"100vh", background:"#F0F4F8", fontFamily:"'72', Arial, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} .fade-up{animation:fadeUp 0.3s ease forwards} .ocr-row:hover{background:#f8fafc}`}</style>

      {/* Breadcrumb */}
      <div style={{ padding:"8px 24px", background:"#fff", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
        <span style={{ color:"#64748b" }}>{dept?.name}</span>
        <ChevronRight size={12} color="#94a3b8"/>
        <span style={{ color:"#64748b" }}>{category?.name}</span>
        <ChevronRight size={12} color="#94a3b8"/>
        <span style={{ color:SAP_BLUE, fontWeight:600 }}>{docType?.name}</span>
        <ChevronRight size={12} color="#94a3b8"/>
        <span style={{ color:"#94a3b8" }}>OCR Review</span>
      </div>

      <div style={{ padding:"20px 24px", maxWidth:960, margin:"0 auto" }}>
        <Stepper current={3}/>

        <div className="fade-up" style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", padding:"28px 32px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          {/* Title */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, paddingBottom:16, borderBottom:`2px solid ${SAP_LIGHT}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:4, height:28, background:SAP_BLUE, borderRadius:4 }}/>
              <div>
                <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:SAP_DARK }}>OCR Review</h2>
                <p style={{ margin:"2px 0 0", fontSize:12, color:"#64748b" }}>Extracted from: {fileName}</p>
              </div>
            </div>
            {loadState === "ready" && (
              <div style={{ fontSize:11, color:"#94a3b8", display:"flex", alignItems:"center", gap:6 }}>
                {autosaveState === "saving" && <><Loader2 size={12} style={{ animation:"spin 1s linear infinite" }}/> Saving…</>}
                {autosaveState === "saved" && <><CheckCircle2 size={12} color={SAP_GREEN}/> Autosaved</>}
                {autosaveState === "error" && <span style={{ color:"#ef4444" }}>Autosave failed</span>}
              </div>
            )}
          </div>

          {loadState === "loading" && (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"40px 0", justifyContent:"center", color:"#94a3b8", fontSize:13 }}>
              <Loader2 size={16} style={{ animation:"spin 1s linear infinite" }}/> Loading dynamic metadata template…
            </div>
          )}

          {loadState === "error" && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, padding:"10px 16px", background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:10 }}>
              <AlertCircle size={15} color="#dc2626"/>
              <span style={{ fontSize:13, fontWeight:600, color:"#dc2626" }}>{loadError}</span>
            </div>
          )}

          {loadState === "none" && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, padding:"10px 16px", background:"#fff8f0", border:"1px solid #fde68a", borderRadius:10 }}>
              <AlertCircle size={15} color="#92400e"/>
              <span style={{ fontSize:13, fontWeight:600, color:"#92400e" }}>
                No metadata template is assigned to this document type yet — ask a Tenant Admin to create and assign one under Metadata Templates.
              </span>
            </div>
          )}

          {loadState === "ready" && (
            <>
              {/* Status */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, padding:"10px 16px", background:"#f0fdf4", border:"1px solid #86efac", borderRadius:10 }}>
                <CheckCircle2 size={15} color={SAP_GREEN}/>
                <span style={{ fontSize:13, fontWeight:600, color:"#166534" }}>
                  OCR completed — review and correct if needed{modifiedCount > 0 ? ` (${modifiedCount} field${modifiedCount > 1 ? "s" : ""} modified)` : ""}
                </span>
              </div>

              {/* Dynamic Field List */}
              <div style={{ border:"1px solid #e2e8f0", borderRadius:12, overflow:"hidden", marginBottom:20 }}>
                <div style={{ background:"#f8fafc", padding:"10px 16px", borderBottom:"1px solid #e2e8f0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#334155" }}>Dynamic Metadata — {fields.length} field{fields.length !== 1 ? "s" : ""}</span>
                  <div style={{ display:"flex", gap:14, fontSize:11 }}>
                    {[["High",SAP_GREEN],["Mid",SAP_AMBER],["Low","#ef4444"]].map(([l,c])=>(
                      <span key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <span style={{ width:8,height:8,borderRadius:"50%",background:c,display:"inline-block" }}/>
                        {l} Confidence
                      </span>
                    ))}
                  </div>
                </div>

                {fields.length === 0 && (
                  <div style={{ padding:20, fontSize:13, color:"#94a3b8", textAlign:"center" }}>This template has no visible fields.</div>
                )}

                {fields.map((field) => {
                  const conf = confidenceLabel(confidence[field.internalName]);
                  const dot = confidenceColor(conf);
                  const fieldErrors = errors?.[field.internalName] || [];
                  const isModified = String(values[field.internalName] ?? "") !== String(originalValues[field.internalName] ?? "");
                  return (
                    <div key={field.internalName} className="ocr-row" style={{ padding:"11px 16px", borderBottom:"1px solid #f1f5f9", background: isModified ? "#fffbeb" : undefined }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
                        <div style={{ width:150, flexShrink:0, paddingTop:7 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#64748b" }}>
                            <span>{field.label}</span>
                            {field.required && <span style={{ color:"#ef4444" }}>*</span>}
                            {field.searchable && <SearchIcon size={11} color={SAP_BLUE} title="Searchable field"/>}
                          </div>
                          {field.tooltip && <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{field.tooltip}</div>}
                        </div>

                        <div style={{ flex:1 }}>
                          <FieldRenderer
                            field={field}
                            value={values[field.internalName]}
                            onChange={(v) => handleFieldChange(field.internalName, v)}
                            error={fieldErrors[0]}
                            disabled={field.readonly}
                          />
                          {fieldErrors.length > 0 && (
                            <div style={{ marginTop:4, fontSize:11, color:"#ef4444" }}>{fieldErrors[0]}</div>
                          )}
                          {isModified && (
                            <div style={{ marginTop:4, display:"flex", alignItems:"center", gap:6, fontSize:10.5, color:"#92400e" }}>
                              <span>Original OCR value: <strong>{String(originalValues[field.internalName] ?? "—")}</strong></span>
                              <button
                                onClick={() => handleRevertField(field.internalName)}
                                style={{ display:"inline-flex", alignItems:"center", gap:3, border:"none", background:"none", color:SAP_BLUE, cursor:"pointer", fontSize:10.5, fontWeight:600 }}
                              >
                                <RotateCcw size={10}/> Revert
                              </button>
                            </div>
                          )}
                        </div>

                        {!field.readonly && !field.hidden && ["FORMULA","AUTO_NUMBER","SIGNATURE","FILE","IMAGE","HIDDEN"].indexOf(field.fieldType) === -1 && (
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, minWidth:42, paddingTop:6 }}>
                            <span style={{ width:8,height:8,borderRadius:"50%",background:dot,display:"inline-block" }}/>
                            <span style={{ fontSize:10, fontWeight:700, color:dot }}>{conf}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasErrors && (
                <div style={{ marginBottom:16, padding:"10px 16px", background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:10, fontSize:12.5, color:"#dc2626" }}>
                  Please resolve the validation errors above before generating a TCode.
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <button onClick={onBack} style={{ padding:"10px 20px", borderRadius:10, border:"1px solid #e2e8f0", background:"#fff", color:"#64748b", fontWeight:600, fontSize:13, cursor:"pointer" }}>
              ← Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || loadState === "loading"}
              style={{ padding:"10px 28px", borderRadius:10, background:SAP_BLUE, color:"#fff", border:"none", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:8, opacity:(generating || loadState === "loading")?0.75:1 }}>
              {generating ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/> Generating…</> : "Generate TCode →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
