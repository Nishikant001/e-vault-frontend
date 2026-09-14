// src/features/crossDepartmentDocument/OwnerDocumentRequests.jsx

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  CROSS_DEPARTMENT_REQUEST_STATUS,
  getDocumentAccessRequests,
  rejectDocumentAccessRequest,
} from "./api";


const STATUS_CONFIG = {
  [CROSS_DEPARTMENT_REQUEST_STATUS.PENDING]: {
    label: "Pending",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50",
  },

  [CROSS_DEPARTMENT_REQUEST_STATUS.DOCUMENT_SELECTED]: {
    label: "Document Selected",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50",
  },

  [CROSS_DEPARTMENT_REQUEST_STATUS.APPROVED]: {
    label: "Approved",
    className:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/50",
  },

  [CROSS_DEPARTMENT_REQUEST_STATUS.SHARED]: {
    label: "Shared",
    className:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900/50",
  },

  [CROSS_DEPARTMENT_REQUEST_STATUS.REJECTED]: {
    label: "Rejected",
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50",
  },

  [CROSS_DEPARTMENT_REQUEST_STATUS.REVOKED]: {
    label: "Revoked",
    className:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  },

  [CROSS_DEPARTMENT_REQUEST_STATUS.EXPIRED]: {
    label: "Expired",
    className:
      "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  },
};


function getErrorMessage(error, fallback) {
  return (
    error?.payload?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}


function getRequestStatus(request) {
  return (
    request?.status ||
    request?.requestStatus ||
    CROSS_DEPARTMENT_REQUEST_STATUS.PENDING
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

  return (
    requester?.name ||
    requester?.fullName ||
    [requester?.firstName, requester?.lastName]
      .filter(Boolean)
      .join(" ") ||
    request?.requesterName ||
    "Unknown requester"
  );
}


function getDepartmentName(department) {
  if (typeof department === "string") {
    return department;
  }

  return (
    department?.name ||
    department?.departmentName ||
    department?.title ||
    ""
  );
}


function getRequesterDepartment(request) {
  return (
    getDepartmentName(
      request?.requesterDepartment
    ) ||
    request?.requesterDepartmentName ||
    request?.requester?.departmentName ||
    request?.requester?.department?.name ||
    "—"
  );
}


function getRequestedDepartment(request) {
  return (
    getDepartmentName(
      request?.requestedDepartment
    ) ||
    request?.requestedDepartmentName ||
    request?.departmentName ||
    "—"
  );
}


function getDocumentReference(request) {
  return (
    request?.documentReference ||
    request?.reference ||
    request?.documentName ||
    "—"
  );
}


function getRequestReason(request) {
  return (
    request?.reason ||
    request?.message ||
    "No reason provided."
  );
}


function getRequestId(request) {
  return (
    request?.id ||
    request?.requestId
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


export default function OwnerDocumentRequests({
  onFindDocument,
  onRequestUpdated,
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [rejectingRequestId, setRejectingRequestId] =
    useState(null);

  const [showRejectDialog, setShowRejectDialog] =
    useState(false);

  const [selectedRequest, setSelectedRequest] =
    useState(null);

  const [rejectReason, setRejectReason] =
    useState("");


  // ==========================================================
  // LOAD REQUESTS
  //
  // Actual backend route:
  //
  // GET
  // /api/cross-department-documents/
  // cross-department-requests
  //
  // Backend determines which requests the authenticated user
  // is authorized to see.
  //
  // The frontend does NOT send an owner ID or department ID
  // to bypass authorization.
  // ==========================================================

  const loadRequests = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await getDocumentAccessRequests({ scope: "manage" });

        const requestList =
          Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

        setRequests(requestList);
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Failed to load document access requests."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );


  useEffect(() => {
    loadRequests();

    return undefined;
  }, [loadRequests]);


  // ==========================================================
  // FIND EXISTING DMS DOCUMENT
  //
  // IMPORTANT:
  //
  // This does NOT upload a file.
  //
  // The next component/file will call:
  //
  // GET
  // /cross-department-requests/:id/source-documents
  //
  // only after the owner selects this request.
  // ==========================================================

  const handleFindDocument = (request) => {
    if (!onFindDocument) {
      return;
    }

    onFindDocument(request);
  };


  // ==========================================================
  // OPEN REJECT DIALOG
  // ==========================================================

  const handleOpenReject = (request) => {
    setSelectedRequest(request);
    setRejectReason("");
    setShowRejectDialog(true);
  };


  const handleCloseReject = () => {
    if (rejectingRequestId) {
      return;
    }

    setShowRejectDialog(false);
    setSelectedRequest(null);
    setRejectReason("");
  };


  // ==========================================================
  // REJECT REQUEST
  //
  // Actual backend:
  //
  // POST
  // /cross-department-requests/:id/reject
  //
  // Body:
  // {
  //   reason
  // }
  // ==========================================================

  const handleReject = async () => {
    const requestId =
      getRequestId(selectedRequest);

    if (!requestId) {
      setError("Invalid document request.");
      return;
    }

    try {
      setRejectingRequestId(requestId);
      setError("");

      await rejectDocumentAccessRequest(
        requestId,
        rejectReason.trim()
      );

      handleCloseReject();

      await loadRequests({
        silent: true,
      });

      if (onRequestUpdated) {
        onRequestUpdated();
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to reject document access request."
        )
      );
    } finally {
      setRejectingRequestId(null);
    }
  };


  return (
    <div className="w-full space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Document Access Requests
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review requests assigned to you and select an
            existing DMS document when approving access.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadRequests({
              silent: true,
            })
          }
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

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


      {/* LOADING */}

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          Loading document access requests...
        </div>
      )}


      {/* EMPTY */}

      {!loading &&
        !error &&
        requests.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">

            <h3 className="text-base font-medium text-gray-900 dark:text-white">
              No document access requests
            </h3>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Requests assigned to your authorized department
              will appear here.
            </p>

          </div>
        )}


      {/* REQUEST LIST */}

      {!loading &&
        requests.length > 0 && (
          <div className="space-y-4">

            {requests.map((request) => {
              const requestId =
                getRequestId(request);

              const status =
                getRequestStatus(request);

              const statusConfig =
                STATUS_CONFIG[status] ||
                {
                  label: status,
                  className:
                    "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
                };

              const canSelectDocument =
                status ===
                  CROSS_DEPARTMENT_REQUEST_STATUS.PENDING ||
                status ===
                  CROSS_DEPARTMENT_REQUEST_STATUS.DOCUMENT_SELECTED;

              const canReject =
                status ===
                  CROSS_DEPARTMENT_REQUEST_STATUS.PENDING ||
                status ===
                  CROSS_DEPARTMENT_REQUEST_STATUS.DOCUMENT_SELECTED;

              return (
                <div
                  key={requestId}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                >

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          {getDocumentReference(
                            request
                          )}
                        </h3>

                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig.className}`}
                        >
                          {statusConfig.label}
                        </span>

                      </div>

                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Requested{" "}
                        {formatDate(
                          request?.createdAt ||
                          request?.requestedAt
                        )}
                      </p>

                    </div>


                    <div className="flex flex-wrap gap-2">

                      {canSelectDocument && (
                        <button
                          type="button"
                          onClick={() =>
                            handleFindDocument(
                              request
                            )
                          }
                          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        >
                          Find DMS Document
                        </button>
                      )}

                      {canReject && (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenReject(
                              request
                            )
                          }
                          className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/20"
                        >
                          Reject Request
                        </button>
                      )}

                    </div>

                  </div>


                  {/* REQUEST DETAILS */}

                  <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 dark:border-gray-800">

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Requester
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {getRequesterName(request)}
                      </p>
                    </div>


                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Requester Department
                      </p>

                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {getRequesterDepartment(
                          request
                        )}
                      </p>
                    </div>


                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Requested Department
                      </p>

                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {getRequestedDepartment(
                          request
                        )}
                      </p>
                    </div>


                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Document Reference
                      </p>

                      <p className="mt-1 break-words text-sm text-gray-700 dark:text-gray-300">
                        {getDocumentReference(
                          request
                        )}
                      </p>
                    </div>

                  </div>


                  {/* REASON */}

                  <div className="mt-5">

                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Reason
                    </p>

                    <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {getRequestReason(request)}
                    </div>

                  </div>


                  {/* SECURITY NOTE */}

                  {canSelectDocument && (
                    <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
                      Select an existing document that you are
                      already authorized to access in the DMS.
                      No document upload is part of this workflow.
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}


      {/* REJECT DIALOG */}

      {showRejectDialog &&
        selectedRequest && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-document-request-title"
          >

            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">

              <h3
                id="reject-document-request-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Reject Document Request
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                You are rejecting the request for{" "}
                <strong>
                  {getDocumentReference(
                    selectedRequest
                  )}
                </strong>
                .
              </p>


              <div className="mt-5">

                <label
                  htmlFor="reject-reason"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Reason (optional)
                </label>

                <textarea
                  id="reject-reason"
                  rows={4}
                  value={rejectReason}
                  onChange={(event) =>
                    setRejectReason(
                      event.target.value
                    )
                  }
                  disabled={Boolean(
                    rejectingRequestId
                  )}
                  placeholder="Example: Document cannot be shared at this time."
                  className="block w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />

              </div>


              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={handleCloseReject}
                  disabled={Boolean(
                    rejectingRequestId
                  )}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                >
                  Cancel
                </button>


                <button
                  type="button"
                  onClick={handleReject}
                  disabled={Boolean(
                    rejectingRequestId
                  )}
                  className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {rejectingRequestId
                    ? "Rejecting..."
                    : "Confirm Rejection"}
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}