// src/features/crossDepartmentDocument/ConfirmSendCopy.jsx

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


function getDocumentName(document, share) {
  return (
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


function getRecipientName(request, share) {
  const recipient =
    share?.recipient ||
    request?.requester ||
    request?.requesterUser ||
    request?.requestedBy;

  if (typeof recipient === "string") {
    return recipient;
  }

  const fullName = [
    recipient?.firstName,
    recipient?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    recipient?.name ||
    recipient?.fullName ||
    fullName ||
    request?.requesterName ||
    "Recipient"
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


function getExpiry(share) {
  return (
    share?.expiresAt ||
    share?.expiryAt ||
    share?.expirationDate ||
    null
  );
}


export default function ConfirmSendCopy({
  request,
  document,
  share,
  onSent,
  onBack,
}) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const shareId = getShareId(share);


  // ==========================================================
  // SEND TEMPORARY COPY
  //
  // Uses the centralized API layer.
  //
  // IMPORTANT:
  // The API function must use the dedicated temporary-share
  // backend endpoint identified from the updated backend.
  //
  // Never send sourceDocumentId here.
  // Never call the normal DMS document view/download APIs.
  // ==========================================================

  const handleSendCopy = async () => {
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
            maskingApplied: false,
          }
        );

      if (onSent) {
        onSent({
          request,
          document,
          share,
          response,
        });
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to send the temporary document copy."
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
            Confirm Send Copy
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Review the temporary document share before sending it
            to the recipient.
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={sending}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            Back
          </button>
        )}

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


      {/* CONFIRMATION MESSAGE */}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">

        <div className="flex gap-4">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">

            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <circle
                cx="12"
                cy="12"
                r="10"
              />
            </svg>

          </div>

          <div>

            <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100">
              Send temporary copy?
            </h3>

            <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-200">
              This will send a temporary copy of the selected DMS
              document. The original document will not be modified.
            </p>

          </div>

        </div>

      </div>


      {/* SHARE DETAILS */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">

        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">

          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Share Details
          </h3>

        </div>


        <div className="grid gap-5 p-5 sm:grid-cols-2">

          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Document
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-white">
              {getDocumentName(document, share)}
            </p>

          </div>


          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Recipient
            </p>

            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {getRecipientName(request, share)}
            </p>

          </div>


          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Access Expires
            </p>

            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {formatDate(getExpiry(share))}
            </p>

          </div>


          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Masking
            </p>

            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              Not applied
            </p>

          </div>

        </div>

      </div>


      {/* SECURITY */}

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm leading-6 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">

        <p className="font-semibold">
          Recipient access is limited
        </p>

        <p className="mt-1">
          The recipient receives access only to this temporary
          shared copy through the dedicated share access flow.
          This does not grant access to the original DMS document
          or the source department.
        </p>

      </div>


      {/* ACTIONS */}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end dark:border-gray-700">

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={sending}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={handleSendCopy}
          disabled={sending || !shareId}
          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending
            ? "Sending Copy..."
            : "Send Copy"}
        </button>

      </div>

    </div>
  );
}