// src/features/crossDepartmentDocument/PrepareSharedCopy.jsx

import React, { useState } from "react";


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


function getShareId(share) {
  return (
    share?.shareId ||
    share?.id ||
    share?.temporaryShareId ||
    null
  );
}


function getExpiry(share) {
  return (
    share?.expiresAt ||
    share?.expiryAt ||
    share?.expirationDate ||
    null
  );
}


function formatDate(value) {
  if (!value) {
    return "Server will determine expiry";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}


export default function PrepareSharedCopy({
  request,
  document,
  share,
  onSendWithoutMasking,
  onMaskAndSend,
  onBack,
}) {
  const [error, setError] = useState("");
  const [processing, setProcessing] =
    useState(false);

  const shareId = getShareId(share);


  // ==========================================================
  // SEND WITHOUT MASKING
  //
  // Parent flow will open the confirmation/send component.
  //
  // IMPORTANT:
  // The final component must use the exact backend temporary
  // share endpoint and shareId. Never call the normal DMS
  // document API using sourceDocumentId for the recipient.
  // ==========================================================

  const handleSendWithoutMasking = async () => {
    if (!shareId) {
      setError(
        "The temporary document share could not be identified."
      );
      return;
    }

    if (!onSendWithoutMasking) {
      setError(
        "The send action is not available."
      );
      return;
    }

    try {
      setProcessing(true);
      setError("");

      await onSendWithoutMasking({
        request,
        document,
        share,
      });
    } catch (err) {
      setError(
        err?.payload?.message ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to continue with the shared copy."
      );
    } finally {
      setProcessing(false);
    }
  };


  // ==========================================================
  // MASK & SEND
  //
  // Opens the lightweight masking editor through the parent.
  //
  // The masking editor must operate on the temporary copy only.
  // It must never overwrite or modify the original DMS file.
  // ==========================================================

  const handleMaskAndSend = async () => {
    if (!shareId) {
      setError(
        "The temporary document share could not be identified."
      );
      return;
    }

    if (!onMaskAndSend) {
      setError(
        "The masking editor is not available."
      );
      return;
    }

    try {
      setProcessing(true);
      setError("");

      await onMaskAndSend({
        request,
        document,
        share,
      });
    } catch (err) {
      setError(
        err?.payload?.message ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to open the masking editor."
      );
    } finally {
      setProcessing(false);
    }
  };


  return (
    <div className="w-full space-y-6">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Prepare Shared Copy
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Decide whether the temporary shared copy should be
            sent as-is or masked before it is shared.
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={processing}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            Back
          </button>
        )}

      </div>


      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </div>
      )}


      {/* ================================================== */}
      {/* TEMPORARY COPY DETAILS */}
      {/* ================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">

        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Temporary Shared Copy
          </h3>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2">

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Document
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-white">
              {getDocumentName(
                document,
                share
              )}
            </p>
          </div>


          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Access Expires
            </p>

            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {formatDate(
                getExpiry(share)
              )}
            </p>
          </div>

        </div>

      </div>


      {/* ================================================== */}
      {/* ORIGINAL SECURITY NOTICE */}
      {/* ================================================== */}

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm leading-6 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">

        <p className="font-semibold">
          Original document protection
        </p>

        <p className="mt-1">
          Masking applies only to the temporary shared copy.
          The original DMS document will not be modified.
        </p>

      </div>


      {/* ================================================== */}
      {/* MASKING DECISION */}
      {/* ================================================== */}

      <div className="grid gap-5 lg:grid-cols-2">

        {/* SEND WITHOUT MASKING */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">

          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400">

            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>

          </div>

          <h3 className="mt-5 text-base font-semibold text-gray-900 dark:text-white">
            Send Without Masking
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Send the temporary copy without adding any masking.
            You will be asked to confirm before the copy is sent.
          </p>

          <button
            type="button"
            onClick={handleSendWithoutMasking}
            disabled={processing || !shareId}
            className="mt-6 w-full rounded-lg border border-green-200 bg-white px-4 py-2.5 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-900/50 dark:bg-gray-900 dark:text-green-400 dark:hover:bg-green-950/20"
          >
            Send Without Masking
          </button>

        </div>


        {/* MASK & SEND */}

        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm dark:border-blue-900/50 dark:bg-gray-900">

          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">

            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M4 20h4L19 9a2.828 2.828 0 0 0-4-4L4 16v4Z" />
              <path d="m14.5 5.5 4 4" />
            </svg>

          </div>

          <h3 className="mt-5 text-base font-semibold text-gray-900 dark:text-white">
            Mask & Send
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Open the masking editor and hide sensitive information
            before the temporary copy is sent.
          </p>

          <button
            type="button"
            onClick={handleMaskAndSend}
            disabled={processing || !shareId}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mask & Send
          </button>

        </div>

      </div>


      {/* ================================================== */}
      {/* WHAT CAN BE MASKED */}
      {/* ================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">

        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Sensitive information you may mask
        </h3>

        <div className="mt-4 flex flex-wrap gap-2">

          {[
            "Name",
            "Phone",
            "Address",
            "Bank Details",
            "Account Number",
            "Signature",
            "Confidential Amount",
            "Personal Information",
          ].map((item) => (
            <span
              key={item}
              className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              {item}
            </span>
          ))}

        </div>

      </div>

    </div>
  );
}