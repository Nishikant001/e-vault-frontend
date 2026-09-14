// src/features/crossDepartmentDocument/SharedWithMe.jsx

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getDocumentsSharedWithMe,
  viewSharedDocument,
  downloadSharedDocument,
} from "./api";


const TERMINAL_STATUSES = [
  "REVOKED",
  "EXPIRED",
];


function getErrorMessage(error, fallback) {
  return (
    error?.payload?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}


function getShareId(item) {
  return (
    item?.shareId ||
    item?.id ||
    item?.temporaryShareId ||
    null
  );
}


function getDocumentName(item) {
  return (
    item?.documentName ||
    item?.fileName ||
    item?.filename ||
    item?.document?.fileName ||
    item?.document?.name ||
    "Shared Document"
  );
}


function getSharedBy(item) {
  const user =
    item?.sharedBy ||
    item?.owner ||
    item?.sender ||
    item?.sharedByUser;

  if (typeof user === "string") {
    return user;
  }

  const fullName = [
    user?.firstName,
    user?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    user?.name ||
    user?.fullName ||
    fullName ||
    item?.sharedByName ||
    "—"
  );
}


function getDepartment(item) {
  const department =
    item?.department ||
    item?.sourceDepartment ||
    item?.sharedByDepartment;

  if (typeof department === "string") {
    return department;
  }

  return (
    department?.name ||
    department?.departmentName ||
    item?.departmentName ||
    item?.sourceDepartmentName ||
    "—"
  );
}


function getStatus(item) {
  return String(
    item?.status || "SHARED"
  ).toUpperCase();
}


function getMaskingStatus(item) {
  if (
    item?.maskingApplied === true ||
    item?.isMasked === true ||
    getStatus(item) === "MASKED"
  ) {
    return "Masked";
  }

  return "Not Masked";
}


function getExpiry(item) {
  return (
    item?.expiresAt ||
    item?.expiryAt ||
    item?.expirationDate ||
    null
  );
}


function getSharedAt(item) {
  return (
    item?.sharedAt ||
    item?.createdAt ||
    item?.sentAt ||
    null
  );
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}


/*
 * Server status is the primary authority.
 *
 * Local time is used only to immediately disable an already
 * known expired share without making another request.
 */
function isLocallyExpired(item) {
  const expiry = getExpiry(item);

  if (!expiry) {
    return false;
  }

  const date = new Date(expiry);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getTime() <= Date.now();
}


function isAccessDisabled(item) {
  const status = getStatus(item);

  return (
    TERMINAL_STATUSES.includes(status) ||
    isLocallyExpired(item)
  );
}


function getDisplayStatus(item) {
  if (
    getStatus(item) === "REVOKED"
  ) {
    return "REVOKED";
  }

  if (
    getStatus(item) === "EXPIRED" ||
    isLocallyExpired(item)
  ) {
    return "EXPIRED";
  }

  return getStatus(item);
}


function getStatusClass(status) {
  switch (status) {
    case "SHARED":
    case "APPROVED":
      return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300";

    case "PENDING":
    case "DOCUMENT_SELECTED":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";

    case "REVOKED":
    case "REJECTED":
      return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";

    case "EXPIRED":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";

    default:
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
  }
}


export default function SharedWithMe({
  onViewDocument,
}) {
  const [shares, setShares] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [activeShareId, setActiveShareId] =
    useState(null);


  // ==========================================================
  // LOAD ONLY RECIPIENT'S TEMPORARY SHARES
  //
  // API layer must use the actual backend endpoint.
  //
  // Do not request normal department documents here.
  // Do not request source documents.
  // ==========================================================

  const loadShares =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getDocumentsSharedWithMe();

        const items =
          response?.data?.shares ||
          response?.shares ||
          response?.data?.data ||
          response?.data ||
          response ||
          [];

        setShares(
          Array.isArray(items)
            ? items
            : []
        );
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Failed to load documents shared with you."
          )
        );
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadShares();
  }, [loadShares]);


  // ==========================================================
  // HANDLE VIEW
  //
  // IMPORTANT:
  //
  // Use only shareId.
  //
  // viewSharedDocument() must call the dedicated temporary-share
  // endpoint from the updated backend.
  //
  // Never fall back to a normal document endpoint.
  // ==========================================================

  const handleView = async (share) => {
    const shareId = getShareId(share);

    if (!shareId) {
      setActionError(
        "The temporary share could not be identified."
      );
      return;
    }

    if (isAccessDisabled(share)) {
      setActionError(
        getDisplayStatus(share) === "REVOKED"
          ? "Document access has been revoked."
          : "Document access has expired."
      );

      return;
    }

    try {
      setActiveShareId(shareId);
      setActionError("");

      const response =
        await viewSharedDocument(shareId);

      /*
       * Parent can reuse the existing document viewer.
       *
       * However, it must receive only the temporary-share
       * response/view URL.
       *
       * Never replace this with the original document URL.
       */
      if (onViewDocument) {
        await onViewDocument({
          share,
          shareId,
          response,
        });
      }
    } catch (err) {
      const message =
        getErrorMessage(
          err,
          "Unable to open the shared document."
        );

      setActionError(message);

      /*
       * If server reports expiry/revocation, update the local UI
       * and do not retry automatically.
       */
      const statusCode =
        err?.response?.status ||
        err?.status;

      if (
        statusCode === 403 ||
        statusCode === 410
      ) {
        setShares((previous) =>
          previous.map((item) =>
            getShareId(item) === shareId
              ? {
                  ...item,
                  status:
                    statusCode === 410
                      ? "EXPIRED"
                      : "REVOKED",
                }
              : item
          )
        );
      }
    } finally {
      setActiveShareId(null);
    }
  };


  // ==========================================================
  // HANDLE DOWNLOAD
  //
  // Again, use shareId only.
  // ==========================================================

  const handleDownload = async (
    share
  ) => {
    const shareId = getShareId(share);

    if (!shareId) {
      setActionError(
        "The temporary share could not be identified."
      );
      return;
    }

    if (isAccessDisabled(share)) {
      setActionError(
        getDisplayStatus(share) === "REVOKED"
          ? "Document access has been revoked."
          : "Document access has expired."
      );

      return;
    }

    try {
      setActiveShareId(shareId);
      setActionError("");

      await downloadSharedDocument(
        shareId
      );
    } catch (err) {
      const message =
        getErrorMessage(
          err,
          "Unable to download the shared document."
        );

      setActionError(message);

      const statusCode =
        err?.response?.status ||
        err?.status;

      if (
        statusCode === 403 ||
        statusCode === 410
      ) {
        setShares((previous) =>
          previous.map((item) =>
            getShareId(item) === shareId
              ? {
                  ...item,
                  status:
                    statusCode === 410
                      ? "EXPIRED"
                      : "REVOKED",
                }
              : item
          )
        );
      }
    } finally {
      setActiveShareId(null);
    }
  };


  return (
    <div className="w-full space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Documents Shared With Me
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Access documents that have been temporarily shared with you.
            These shares do not grant access to the original DMS
            documents or their departments.
          </p>
        </div>

        <button
          type="button"
          onClick={loadShares}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>


      {/* PAGE ERROR */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </div>
      )}


      {/* ACTION ERROR */}

      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
        >
          {actionError}
        </div>
      )}


      {/* LOADING */}

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          Loading shared documents...
        </div>
      )}


      {/* EMPTY STATE */}

      {!loading &&
        !error &&
        shares.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">

            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              No documents have been shared with you.
            </p>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Temporary document shares you receive from other
              departments will appear here.
            </p>

          </div>
        )}


      {/* DESKTOP TABLE */}

      {!loading &&
        shares.length > 0 && (
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block dark:border-gray-700 dark:bg-gray-900">

            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">

                <thead className="bg-gray-50 dark:bg-gray-800">

                  <tr>

                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Document
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Shared By
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Department
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Shared At
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Expires At
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Masking
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

                  {shares.map((share) => {
                    const shareId =
                      getShareId(share);

                    const disabled =
                      isAccessDisabled(share);

                    const status =
                      getDisplayStatus(share);

                    const isActive =
                      activeShareId ===
                      shareId;

                    return (
                      <tr
                        key={
                          shareId ||
                          `${getDocumentName(
                            share
                          )}-${getExpiry(
                            share
                          )}`
                        }
                        className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >

                        <td className="px-5 py-4">

                          <p className="max-w-xs break-words text-sm font-medium text-gray-900 dark:text-white">
                            {getDocumentName(
                              share
                            )}
                          </p>

                        </td>


                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {getSharedBy(share)}
                        </td>


                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {getDepartment(share)}
                        </td>


                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(
                            getSharedAt(share)
                          )}
                        </td>


                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(
                            getExpiry(share)
                          )}
                        </td>


                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>

                        </td>


                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {getMaskingStatus(
                            share
                          )}
                        </td>


                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleView(
                                  share
                                )
                              }
                              disabled={
                                disabled ||
                                isActive
                              }
                              className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-900/50 dark:text-blue-400"
                            >
                              {isActive
                                ? "Opening..."
                                : "View"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDownload(
                                  share
                                )
                              }
                              disabled={
                                disabled ||
                                isActive
                              }
                              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Download
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

          </div>
        )}


      {/* MOBILE CARDS */}

      {!loading &&
        shares.length > 0 && (
          <div className="space-y-4 md:hidden">

            {shares.map((share) => {
              const shareId =
                getShareId(share);

              const disabled =
                isAccessDisabled(share);

              const status =
                getDisplayStatus(share);

              const isActive =
                activeShareId ===
                shareId;

              return (
                <div
                  key={
                    shareId ||
                    `${getDocumentName(
                      share
                    )}-${getExpiry(
                      share
                    )}`
                  }
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                >

                  <div className="flex items-start justify-between gap-4">

                    <p className="break-words text-sm font-semibold text-gray-900 dark:text-white">
                      {getDocumentName(
                        share
                      )}
                    </p>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                        status
                      )}`}
                    >
                      {status}
                    </span>

                  </div>


                  <div className="mt-5 grid grid-cols-2 gap-4 text-sm">

                    <div>
                      <p className="text-xs text-gray-400">
                        Shared By
                      </p>

                      <p className="mt-1 text-gray-700 dark:text-gray-300">
                        {getSharedBy(
                          share
                        )}
                      </p>
                    </div>


                    <div>
                      <p className="text-xs text-gray-400">
                        Department
                      </p>

                      <p className="mt-1 text-gray-700 dark:text-gray-300">
                        {getDepartment(
                          share
                        )}
                      </p>
                    </div>


                    <div>
                      <p className="text-xs text-gray-400">
                        Expires At
                      </p>

                      <p className="mt-1 text-gray-700 dark:text-gray-300">
                        {formatDate(
                          getExpiry(share)
                        )}
                      </p>
                    </div>


                    <div>
                      <p className="text-xs text-gray-400">
                        Masking
                      </p>

                      <p className="mt-1 text-gray-700 dark:text-gray-300">
                        {getMaskingStatus(
                          share
                        )}
                      </p>
                    </div>

                  </div>


                  {disabled && (
                    <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
                      {status === "REVOKED"
                        ? "Document access has been revoked."
                        : "Document access has expired."}
                    </p>
                  )}


                  <div className="mt-5 flex gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        handleView(share)
                      }
                      disabled={
                        disabled ||
                        isActive
                      }
                      className="flex-1 rounded-lg border border-blue-200 px-3 py-2.5 text-sm font-medium text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-900/50 dark:text-blue-400"
                    >
                      {isActive
                        ? "Opening..."
                        : "View"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(
                          share
                        )
                      }
                      disabled={
                        disabled ||
                        isActive
                      }
                      className="flex-1 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Download
                    </button>

                  </div>

                </div>
              );
            })}

          </div>
        )}

    </div>
  );
}