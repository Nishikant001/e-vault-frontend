// src/features/crossDepartmentDocument/PreviewMaskedCopy.jsx

import React, { useState } from "react";

import {
  sendDocumentShare,
} from "./api";


function getErrorMessage(error, fallback) {
  return (
    error?.payload?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}


function getShareId(share) {
  return (
    share?.shareId ||
    share?.id ||
    share?.temporaryShareId ||
    null
  );
}


function getDocumentName(document, share, maskedCopy) {
  return (
    maskedCopy?.documentName ||
    maskedCopy?.fileName ||
    maskedCopy?.filename ||
    share?.documentName ||
    share?.fileName ||
    document?.fileName ||
    document?.filename ||
    document?.name ||
    document?.documentName ||
    document?.title ||
    "Selected Document"
  );
}


/*
 * Preview URL must come from the dedicated temporary-share /
 * masked-copy backend response.
 *
 * Never fall back to:
 *
 * - original document URL
 * - SAP URL
 * - storage key
 * - filesystem path
 * - normal DMS document endpoint
 */
function getPreviewUrl(maskedCopy, share) {
  return (
    maskedCopy?.previewUrl ||
    maskedCopy?.temporaryPreviewUrl ||
    maskedCopy?.maskedPreviewUrl ||
    maskedCopy?.viewUrl ||
    share?.maskedPreviewUrl ||
    share?.temporaryPreviewUrl ||
    null
  );
}


function getPreviewType(
  maskedCopy,
  previewUrl
) {
  const explicitType =
    maskedCopy?.previewType ||
    maskedCopy?.fileType ||
    maskedCopy?.mimeType ||
    maskedCopy?.contentType;

  if (
    typeof explicitType === "string" &&
    explicitType.toLowerCase().includes("pdf")
  ) {
    return "pdf";
  }

  if (
    previewUrl &&
    /\.pdf(?:\?|$)/i.test(previewUrl)
  ) {
    return "pdf";
  }

  return "image";
}


function getExpiry(share, maskedCopy) {
  return (
    maskedCopy?.expiresAt ||
    maskedCopy?.expiryAt ||
    share?.expiresAt ||
    share?.expiryAt ||
    share?.expirationDate ||
    null
  );
}


function formatDate(value) {
  if (!value) {
    return "Server-provided expiry";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}


export default function PreviewMaskedCopy({
  request,
  document,
  share,

  /*
   * This should be the response returned AFTER the backend has
   * successfully applied masking to the temporary copy.
   */
  maskedCopy,

  /*
   * Returns owner to MaskDocumentEditor.
   *
   * The parent should preserve existing mask state if supported,
   * so the owner can edit instead of starting unnecessarily.
   */
  onBackToEdit,

  /*
   * Called after final Send Masked Copy succeeds.
   */
  onSent,
}) {
  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const shareId =
    getShareId(share);

  const previewUrl =
    getPreviewUrl(
      maskedCopy,
      share
    );

  const previewType =
    getPreviewType(
      maskedCopy,
      previewUrl
    );


  // ==========================================================
  // SEND MASKED TEMPORARY COPY
  //
  // Uses centralized API layer only.
  //
  // sendDocumentShare must use the dedicated temporary-share
  // backend route discovered from the updated backend.
  //
  // IMPORTANT:
  // - Use shareId.
  // - Never use sourceDocumentId to grant recipient access.
  // - Never call normal original DMS document APIs.
  // - Backend must send the masked TEMPORARY copy only.
  // ==========================================================

  const handleSendMaskedCopy = async () => {
    if (!shareId) {
      setError(
        "The temporary document share could not be identified."
      );
      return;
    }

    try {
      setSending(true);
      setError("");

      const response =
        await sendDocumentShare(
          shareId,
          {
            maskingApplied: true,
          }
        );

      if (onSent) {
        onSent({
          request,
          document,
          share,
          maskedCopy,
          response,
        });
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to send the masked temporary copy."
        )
      );
    } finally {
      setSending(false);
    }
  };


  return (
    <div className="w-full space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Preview Masked Copy
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Review the masked temporary copy before sending it to
            the recipient.
          </p>
        </div>

        <div className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {getDocumentName(
            document,
            share,
            maskedCopy
          )}
        </div>

      </div>


      {/* ERROR */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </div>
      )}


      {/* SECURITY MESSAGE */}

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm leading-6 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">

        <p className="font-semibold">
          Original document protection
        </p>

        <p className="mt-1">
          You are previewing the masked temporary shared copy.
          The original DMS document has not been modified.
        </p>

      </div>


      {/* MASKING STATUS */}

      <div className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Document
          </p>

          <p className="mt-2 break-words text-sm font-semibold text-gray-900 dark:text-white">
            {getDocumentName(
              document,
              share,
              maskedCopy
            )}
          </p>

        </div>


        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Masking
          </p>

          <p className="mt-2 text-sm font-semibold text-green-600 dark:text-green-400">
            Applied to temporary copy
          </p>

        </div>


        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Access Expires
          </p>

          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {formatDate(
              getExpiry(
                share,
                maskedCopy
              )
            )}
          </p>

        </div>

      </div>


      {/* MASKED TEMPORARY COPY PREVIEW */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm dark:border-gray-700 dark:bg-gray-950">

        {!previewUrl && (
          <div className="flex min-h-96 items-center justify-center p-8 text-center">

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Masked preview is not available.
              </p>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                The backend must return a safe preview of the
                temporary masked copy before it can be sent.
              </p>
            </div>

          </div>
        )}


        {previewUrl &&
          previewType === "pdf" && (
            <iframe
              title="Masked temporary document preview"
              src={previewUrl}
              className="block min-h-[75vh] w-full border-0 bg-white"
            />
          )}


        {previewUrl &&
          previewType !== "pdf" && (
            <div className="flex min-h-[60vh] items-center justify-center p-4">

              <img
                src={previewUrl}
                alt="Masked temporary document preview"
                className="max-h-[75vh] max-w-full rounded object-contain shadow-sm"
              />

            </div>
          )}

      </div>


      {/* FINAL WARNING */}

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">

        <p className="font-semibold">
          Ready to send
        </p>

        <p className="mt-1">
          Sending will give the recipient temporary access only to
          this masked copy. It will not grant access to the
          original DMS document or the source department.
        </p>

      </div>


      {/* ACTIONS */}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end dark:border-gray-700">

        {onBackToEdit && (
          <button
            type="button"
            onClick={onBackToEdit}
            disabled={sending}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            Back to Edit
          </button>
        )}

        <button
          type="button"
          onClick={handleSendMaskedCopy}
          disabled={
            sending ||
            !shareId ||
            !previewUrl
          }
          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending
            ? "Sending Masked Copy..."
            : "Send Masked Copy"}
        </button>

      </div>

    </div>
  );
}