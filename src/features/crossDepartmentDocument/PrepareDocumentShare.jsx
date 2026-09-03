// src/features/crossDepartmentDocument/PrepareDocumentShare.jsx

import React, { useState } from "react";

import {
  DOCUMENT_SHARE_DURATIONS,
  prepareDocumentShare,
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


function getRequestId(request) {
  return request?.id || request?.requestId;
}


function getDocumentName(document) {
  return (
    document?.fileName ||
    document?.filename ||
    document?.name ||
    document?.documentName ||
    document?.title ||
    "Selected Document"
  );
}


function getDepartmentName(value) {
  if (typeof value === "string") {
    return value;
  }

  return (
    value?.name ||
    value?.departmentName ||
    value?.title ||
    "—"
  );
}


function getSourceDepartment(document, request) {
  return (
    getDepartmentName(document?.department) ||
    getDepartmentName(document?.departmentInfo) ||
    document?.departmentName ||
    getDepartmentName(request?.requestedDepartment) ||
    request?.requestedDepartmentName ||
    "—"
  );
}


function getRequesterName(request) {
  const requester =
    request?.requester ||
    request?.requesterUser ||
    request?.requestedBy;

  if (typeof requester === "string") {
    return requester;
  }

  const fullName = [
    requester?.firstName,
    requester?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    requester?.name ||
    requester?.fullName ||
    fullName ||
    request?.requesterName ||
    "Recipient"
  );
}


export default function PrepareDocumentShare({
  request,
  document,
  onPrepared,
  onBack,
}) {
  const requestId = getRequestId(request);

  const [durationMinutes, setDurationMinutes] =
    useState(
      DOCUMENT_SHARE_DURATIONS[0]?.value || 15
    );

  const [preparing, setPreparing] =
    useState(false);

  const [error, setError] = useState("");


  // ==========================================================
  // PREPARE TEMPORARY COPY
  //
  // Actual backend endpoint:
  //
  // POST
  // /cross-department-requests/:id/prepare
  //
  // Body:
  // {
  //   durationMinutes,
  //   maskingRequired: false
  // }
  //
  // At this stage we prepare the temporary copy only.
  //
  // IMPORTANT:
  // - Original DMS document is not modified.
  // - No document is uploaded.
  // - Backend creates/handles the temporary copy.
  // - Backend provides the final expiry.
  // ==========================================================

  const handlePrepare = async () => {
    if (!requestId) {
      setError("Invalid document request.");
      return;
    }

    try {
      setPreparing(true);
      setError("");

           const response =
        await prepareDocumentShare(
          requestId,
          {
            durationMinutes: Number(
              durationMinutes
            ),
            // Prepare stage par hamesha masking-capable share banao.
            // Actual choice (mask ya bina-mask) agle "decide" step
            // (PrepareSharedCopy: Send Without Masking / Mask & Send)
            // mein hoti hai — "Send Without Masking" simply mask
            // step ko skip kar deta hai, share ko masking-eligible
            // rakhne se sendShare() par koi fark nahi padta.
            maskingRequired: true,
          }
        );

      /*
       * Response structures may contain the created share in:
       *
       * response.data
       * response.share
       * response.data.share
       *
       * Preserve the complete response for the parent flow.
       * The next page will extract and use the actual shareId.
       */

      const preparedShare =
        response?.data?.share ||
        response?.share ||
        response?.data ||
        response;

      if (onPrepared) {
        onPrepared({
          request,
          document,
          share: preparedShare,
          response,
          durationMinutes: Number(
            durationMinutes
          ),
        });
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to prepare the temporary shared document."
        )
      );
    } finally {
      setPreparing(false);
    }
  };


  return (
    <div className="w-full space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Prepare Document Share
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Review the selected DMS document and choose how long
            the recipient can access the temporary copy.
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={preparing}
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


      {/* SELECTED DOCUMENT */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">

        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Selected Document
          </h3>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2">

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Document
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-white">
              {getDocumentName(document)}
            </p>
          </div>


          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Source Department
            </p>

            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {getSourceDepartment(
                document,
                request
              )}
            </p>
          </div>


          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Recipient
            </p>

            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {getRequesterName(request)}
            </p>
          </div>


          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Access
            </p>

            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              Temporary shared copy only
            </p>
          </div>

        </div>

      </div>


      {/* ACCESS DURATION */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">

        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Access Duration
        </h3>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The recipient will have access only for the selected
          duration. The final expiry time is determined and
          returned by the server.
        </p>


        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          {DOCUMENT_SHARE_DURATIONS.map(
            (duration) => {
              const selected =
                Number(durationMinutes) ===
                Number(duration.value);

              return (
                <button
                  key={duration.value}
                  type="button"
                  disabled={preparing}
                  onClick={() =>
                    setDurationMinutes(
                      duration.value
                    )
                  }
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                    selected
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                      : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-700"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {duration.label}
                </button>
              );
            }
          )}

        </div>

      </div>


      {/* ORIGINAL DOCUMENT SECURITY */}

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm leading-6 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">

        <p className="font-semibold">
          Original document protection
        </p>

        <p className="mt-1">
          Approving this request creates a temporary shared copy.
          The original DMS document will not be modified,
          replaced, uploaded again or deleted.
        </p>

      </div>


      {/* ACTION */}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end dark:border-gray-700">

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={preparing}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={handlePrepare}
          disabled={preparing || !requestId}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {preparing
            ? "Preparing Document..."
            : "Approve & Prepare Document"}
        </button>

      </div>

    </div>
  );
}