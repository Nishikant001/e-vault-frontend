// src/features/crossDepartmentDocument/ManageDocumentRequestFlow.jsx
//
// Wires the already-built, previously orphaned owner-side screens into
// one real step-by-step flow:
//
//   list  -> OwnerDocumentRequests      (see + reject requests)
//   find  -> FindDmsDocument            (search/select existing DMS doc)
//   prep  -> PrepareDocumentShare       (choose the time-limited duration)
//   deci  -> PrepareSharedCopy          (Send Without Masking / Mask & Send)
//   mask  -> MaskDocumentEditor         (draw masks over the document)
//   pmask -> PreviewMaskedCopy          (preview masked copy, then send)
//   conf  -> ConfirmSendCopy            (confirm + send, no masking)
//   done  -> success screen
//
// None of these step components talked to each other before this file —
// each already called the correct API function internally, they just had
// no parent deciding what to render after each step finished.
//
// ── Known backend limitation (not fixable from the frontend alone) ────
// MaskDocumentEditor needs something to draw on top of. The temporary
// share record has no real file content yet — crossDepartmentDocumentService
// .sendShare()/.prepareShare() intentionally stub out actual binary
// retrieval ("the actual binary retrieval must reuse the existing
// DMS/SAP storage implementation... once wired here, the resulting
// temporary file path/key is stored against this share"). Until that
// storage adapter is wired server-side:
//   - This screen previews the OWNER's own already-authorized view of
//     the ORIGINAL document (GET /documents/:id/view) purely as a
//     drawing surface for the owner. That is safe: the owner already
//     has full access to it, so nothing new is exposed to them.
//   - The recipient-facing endpoints (view/download by shareId) will
//     still not return real file bytes yet, and the "masked" preview
//     shown after confirming masks reuses that same original preview
//     because the backend does not yet flatten masks onto a real file.
// Flag this to whoever owns the backend piece before relying on this
// in production — the UI flow below is complete and correct, but the
// document bytes it moves are still the stubbed ones.
import React, { useCallback, useEffect, useRef, useState } from "react";

import OwnerDocumentRequests from "./OwnerDocumentRequests";
import FindDmsDocument from "./FindDmsDocument";
import PrepareDocumentShare from "./PrepareDocumentShare";
import PrepareSharedCopy from "./PrepareSharedCopy";
import MaskDocumentEditor from "./MaskDocumentEditor";
import PreviewMaskedCopy from "./PreviewMaskedCopy";
import ConfirmSendCopy from "./ConfirmSendCopy";

import { API_BASE_URL } from "../../services/apiClient";
import { maskDocumentShare } from "./api";


function getToken() {
  return localStorage.getItem("accessToken") || "";
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

function getSourceDocumentId(document) {
  return (
    document?.id ||
    document?.documentId ||
    document?.sourceDocumentId ||
    null
  );
}

function getPreviewTypeFromDocument(document) {
  const mime = document?.mimeType || "";

  if (mime.includes("pdf")) {
    return "pdf";
  }

  const name =
    document?.originalFileName ||
    document?.fileName ||
    "";

  if (/\.pdf$/i.test(name)) {
    return "pdf";
  }

  return "image";
}


/*
 * Fetches the owner's own authorized view of the selected DMS document
 * (existing GET /documents/:id/view) as a blob, so it can be used as an
 * <img>/<iframe> source for the masking canvas.
 *
 * This is the OWNER's own view, not the recipient's — the owner is
 * already authorized to see this document, so nothing new is exposed.
 */
function useOwnerDocumentPreview(document) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const objectUrlRef = useRef(null);

  useEffect(() => {
    const documentId = getSourceDocumentId(document);

    if (!documentId) {
      setPreviewUrl(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`${API_BASE_URL}/documents/${documentId}/view`, {
      headers: authHeaders(),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unable to load document preview.");
        }
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setPreviewUrl(url);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Unable to load document preview.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [document]);

  return { previewUrl, loading, error };
}


export default function ManageDocumentRequestFlow() {
  const [step, setStep] = useState("list");

  const [request, setRequest] = useState(null);
  const [document, setDocument] = useState(null);
  const [share, setShare] = useState(null);
  const [maskedCopy, setMaskedCopy] = useState(null);

  const [flowError, setFlowError] = useState("");

   // "mask" aur "previewMasked" dono steps mein SAME document reference
  // pass karo, taaki beech mein hook ka effect cleanup (jo blob URL ko
  // revoke karta hai) trigger na ho. Preview sirf tab cleanup hogi jab
  // user in dono steps se bahar nikal jaye (ya document badal jaye).
  const needsOwnerPreview =
    step === "mask" || step === "previewMasked";

  const { previewUrl, loading: previewLoading, error: previewError } =
    useOwnerDocumentPreview(needsOwnerPreview ? document : null);


  const resetToList = useCallback(() => {
    setStep("list");
    setRequest(null);
    setDocument(null);
    setShare(null);
    setMaskedCopy(null);
    setFlowError("");
  }, []);


  // ==========================================================
  // STEP: list -> find
  // ==========================================================

  const handleFindDocument = (selectedRequest) => {
    setFlowError("");
    setRequest(selectedRequest);
    setStep("find");
  };


  // ==========================================================
  // STEP: find -> prepare
  // ==========================================================

  const handleDocumentSelected = ({ request: req, document: doc }) => {
    setFlowError("");
    setRequest(req);
    setDocument(doc);
    setStep("prepare");
  };


  // ==========================================================
  // STEP: prepare -> decide
  // ==========================================================

  const handlePrepared = ({ request: req, document: doc, share: preparedShare }) => {
    setFlowError("");
    setRequest(req);
    setDocument(doc);
    setShare(preparedShare);
    setStep("decide");
  };


  // ==========================================================
  // STEP: decide -> confirm (no masking)
  // ==========================================================

  const handleSendWithoutMasking = async () => {
    setStep("confirm");
  };


  // ==========================================================
  // STEP: decide -> mask
  // ==========================================================

  const handleMaskAndSend = async () => {
    setStep("mask");
  };


  // ==========================================================
  // STEP: mask -> save masks -> preview masked copy
  // ==========================================================

  const handleConfirmMasks = async ({ share: currentShare, masks }) => {
    const shareId =
      currentShare?.shareId ||
      currentShare?.id ||
      currentShare?.temporaryShareId;

    const response = await maskDocumentShare(shareId, masks);

    const updatedShare =
      response?.data?.share ||
      response?.data ||
      response ||
      currentShare;

    setShare(updatedShare);

    // The backend does not yet return a flattened masked-preview image
    // (see file header) — reuse the owner preview so the screen still
    // shows something concrete instead of a blank state.
    setMaskedCopy({
      previewUrl,
      documentName:
        document?.originalFileName ||
        document?.fileName ||
        document?.name,
    });

    setStep("previewMasked");
  };


  // ==========================================================
  // DONE
  // ==========================================================

  const handleSent = () => {
    setStep("done");
  };


  return (
    <div className="w-full space-y-5">

      {flowError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          {flowError}
        </div>
      )}


      {step === "list" && (
        <OwnerDocumentRequests
          onFindDocument={handleFindDocument}
        />
      )}


      {step === "find" && (
        <FindDmsDocument
          request={request}
          onDocumentSelected={handleDocumentSelected}
          onBack={resetToList}
        />
      )}


      {step === "prepare" && (
        <PrepareDocumentShare
          request={request}
          document={document}
          onPrepared={handlePrepared}
          onBack={() => setStep("find")}
        />
      )}


      {step === "decide" && (
        <PrepareSharedCopy
          request={request}
          document={document}
          share={share}
          onSendWithoutMasking={handleSendWithoutMasking}
          onMaskAndSend={handleMaskAndSend}
          onBack={() => setStep("prepare")}
        />
      )}


      {step === "mask" && (
        <>
          {previewLoading && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              Loading document for masking...
            </div>
          )}

          {!previewLoading && previewError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {previewError}
            </div>
          )}

          {!previewLoading && !previewError && (
            <MaskDocumentEditor
              request={request}
              document={document}
              share={share}
              previewUrl={previewUrl}
              previewType={getPreviewTypeFromDocument(document)}
              onConfirm={handleConfirmMasks}
              onCancel={() => setStep("decide")}
            />
          )}
        </>
      )}


      {step === "previewMasked" && (
        <PreviewMaskedCopy
          request={request}
          document={document}
          share={share}
          maskedCopy={maskedCopy}
          onBackToEdit={() => setStep("mask")}
          onSent={handleSent}
        />
      )}


      {step === "confirm" && (
        <ConfirmSendCopy
          request={request}
          document={document}
          share={share}
          onSent={handleSent}
          onBack={() => setStep("decide")}
        />
      )}


      {step === "done" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-900/50 dark:bg-green-950/30">

          <h3 className="text-base font-semibold text-green-900 dark:text-green-100">
            Document shared successfully
          </h3>

          <p className="mt-2 text-sm text-green-800 dark:text-green-200">
            The recipient now has temporary, time-limited access to the
            shared copy.
          </p>

          <button
            type="button"
            onClick={resetToList}
            className="mt-5 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Back to Requests
          </button>

        </div>
      )}

    </div>
  );
}
