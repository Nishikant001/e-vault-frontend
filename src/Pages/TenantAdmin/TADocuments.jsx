import React, { useState } from "react";
import DMSPage           from "./DMSWorkflow/pages/DMSPage";
import OCRProcessingPage from "./DMSWorkflow/modals/Ocrprocessingpage";
import OCRReviewPage     from "./DMSWorkflow/modals/Ocrreviewpage";
import TCodeSavePage     from "./DMSWorkflow/modals/Tcodesavepage";

export default function TAWorkflow() {
  const [page, setPage] = useState("dms");
  const [uploadCtx, setUploadCtx] = useState({
    documentId: null, fileName: "", dept: null,
    category: null, docType: null, ocrFields: null,
    ocrStatus: null, tcode: null, editedFields: {},
    approvalRequired: false, documentApprovalId: null,
  });

  const handleUploadFlow = (documentId, fileName, dept, category, docType) => {
    setUploadCtx(prev => ({ ...prev, documentId, fileName, dept, category, docType }));
    setPage("ocr");
  };
  const handleOCRComplete = (ocrFields) => {
    setUploadCtx(prev => ({ ...prev, ocrFields, ocrStatus: "OCR_COMPLETED" }));
    setPage("review");
  };
  const handleGenerateTcode = (tcode, editedFields, approvalRequired, documentApprovalId) => {
    setUploadCtx(prev => ({ ...prev, tcode, editedFields, approvalRequired, documentApprovalId }));
    setPage("tcode");
  };
  const handleReset = () => {
    setUploadCtx({ documentId: null, fileName: "", dept: null,
      category: null, docType: null, ocrFields: null,
      ocrStatus: null, tcode: null, editedFields: {},
      approvalRequired: false, documentApprovalId: null });
    setPage("dms");
  };

  if (page === "dms")    return <DMSPage onUploadFlow={handleUploadFlow} />;
  if (page === "ocr")    return <OCRProcessingPage {...uploadCtx}
                                  onComplete={handleOCRComplete}
                                  onFailed={()=>{ setUploadCtx(p=>({...p,ocrStatus:"FAILED"})); setPage("review"); }} />;
  if (page === "review") return <OCRReviewPage {...uploadCtx}
                                  onGenerateTcode={handleGenerateTcode}
                                  onBack={()=>setPage("ocr")} />;
  if (page === "tcode")  return <TCodeSavePage {...uploadCtx}
                                  onFinalized={handleReset}
                                  onBack={()=>setPage("review")}
                                  onReset={handleReset} />;
}