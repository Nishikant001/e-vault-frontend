// src/features/crossDepartmentDocument/FindDmsDocument.jsx

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  searchSourceDocuments,
  selectSourceDocument,
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


function getDocumentId(document) {
  return (
    document?.id ||
    document?.documentId ||
    document?.sourceDocumentId
  );
}


function getDocumentName(document) {
  return (
    document?.originalFileName ||
    document?.fileName ||
    document?.filename ||
    document?.name ||
    document?.documentName ||
    document?.title ||
    "Untitled Document"
  );
}


function getDocumentDepartment(document) {
  const department =
    document?.Department ||
    document?.department ||
    document?.departmentInfo;

  if (typeof department === "string") {
    return department;
  }

  return (
    department?.name ||
    department?.departmentName ||
    document?.departmentName ||
    "—"
  );
}


function getDocumentType(document) {
  const documentType =
    document?.DocumentType ||
    document?.documentType ||
    document?.type;

  if (typeof documentType === "string") {
    return documentType;
  }

  return (
    documentType?.name ||
    documentType?.documentTypeName ||
    document?.documentTypeName ||
    document?.categoryName ||
    "—"
  );
}

function getDocumentVersion(document) {
  return (
    document?.version ||
    document?.documentVersion ||
    document?.currentVersion ||
    null
  );
}


function getRequestId(request) {
  return (
    request?.id ||
    request?.requestId
  );
}


function getDocumentReference(request) {
  return (
    request?.documentReference ||
    request?.reference ||
    request?.documentName ||
    ""
  );
}


export default function FindDmsDocument({
  request,
  onDocumentSelected,
  onBack,
}) {
  const requestId = getRequestId(request);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState(
    getDocumentReference(request)
  );

  const [
    selectedDocumentId,
    setSelectedDocumentId,
  ] = useState(null);

  const [selecting, setSelecting] =
    useState(false);


  // ==========================================================
  // SEARCH EXISTING DMS DOCUMENTS
  //
  // Actual backend route:
  //
  // GET
  // /cross-department-requests/:id/source-documents
  //
  // This endpoint must return only documents the authenticated
  // owner is already authorized to access.
  //
  // This component never uploads a document.
  // ==========================================================

  const loadDocuments = useCallback(
    async (query = "") => {
      if (!requestId) {
        setError("Invalid document request.");
        setLoading(false);
        return;
      }

      try {
        setError("");

        if (loading) {
          setLoading(true);
        } else {
          setSearching(true);
        }

        const response =
          await searchSourceDocuments(
            requestId,
            query.trim()
              ? {
                  q: query.trim(),
                }
              : {}
          );

        const documentList =
          Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : Array.isArray(response?.documents)
                ? response.documents
                : [];

        setDocuments(documentList);
      } catch (err) {
        setDocuments([]);

        setError(
          getErrorMessage(
            err,
            "Failed to search existing DMS documents."
          )
        );
      } finally {
        setLoading(false);
        setSearching(false);
      }
    },
    [requestId, loading]
  );


  // Initial search uses the request's document reference.
  useEffect(() => {
    loadDocuments(
      getDocumentReference(request)
    );
  }, []);


  // ==========================================================
  // SUBMIT SEARCH
  // ==========================================================

  const handleSearch = async (event) => {
    event.preventDefault();

    await loadDocuments(searchTerm);
  };


  // ==========================================================
  // SELECT EXISTING DMS DOCUMENT
  //
  // Actual backend route:
  //
  // POST
  // /cross-department-requests/:id/select-document
  //
  // This is document selection only.
  // It is NOT an upload.
  // ==========================================================

  const handleSelectDocument = async () => {
    const selectedDocument =
      documents.find(
        (document) =>
          String(
            getDocumentId(document)
          ) === String(selectedDocumentId)
      );

    if (!selectedDocument) {
      setError(
        "Please select an existing DMS document."
      );
      return;
    }

    const sourceDocumentId =
      getDocumentId(selectedDocument);

    if (!sourceDocumentId) {
      setError(
        "The selected document does not have a valid document ID."
      );
      return;
    }

    try {
      setSelecting(true);
      setError("");

      const response =
        await selectSourceDocument(
          requestId,
          {
            sourceDocumentId,
            sourceDocumentVersion:
              getDocumentVersion(
                selectedDocument
              ),
          }
        );

      if (onDocumentSelected) {
        onDocumentSelected({
          request,
          document: selectedDocument,
          response,
        });
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to select the DMS document."
        )
      );
    } finally {
      setSelecting(false);
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
            Find DMS Document
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Search and select an existing DMS document that you
            are already authorized to access.
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={selecting}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            Back to Requests
          </button>
        )}

      </div>


      {/* ================================================== */}
      {/* REQUEST REFERENCE */}
      {/* ================================================== */}

      {request && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-900/50 dark:bg-blue-950/30">

          <p className="text-xs font-medium uppercase tracking-wide text-blue-500 dark:text-blue-300">
            Requested Document
          </p>

          <p className="mt-1 break-words text-base font-semibold text-blue-900 dark:text-blue-100">
            {getDocumentReference(request) || "—"}
          </p>

        </div>
      )}


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
      {/* SEARCH */}
      {/* ================================================== */}

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 sm:flex-row"
      >

        <div className="relative flex-1">

          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
            />
            <path d="m20 20-4-4" />
          </svg>

          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            disabled={loading || selecting}
            placeholder="Search document name, reference or SAP ID..."
            className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-700"
          />

        </div>


        <button
          type="submit"
          disabled={
            loading ||
            searching ||
            selecting
          }
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {searching
            ? "Searching..."
            : "Search"}
        </button>

      </form>


      {/* ================================================== */}
      {/* SECURITY NOTE */}
      {/* ================================================== */}

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">

        <strong>
          Existing DMS documents only.
        </strong>

        <span>
          {" "}
          Select a document already stored in the DMS. No file,
          PDF or image can be uploaded in this workflow.
        </span>

      </div>


      {/* ================================================== */}
      {/* LOADING */}
      {/* ================================================== */}

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          Searching existing DMS documents...
        </div>
      )}


      {/* ================================================== */}
      {/* EMPTY */}
      {/* ================================================== */}

      {!loading &&
        !searching &&
        !error &&
        documents.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">

            <h3 className="text-base font-medium text-gray-900 dark:text-white">
              No matching documents found
            </h3>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Try another document name, reference or SAP
              document ID. Only documents you are authorized to
              access are shown.
            </p>

          </div>
        )}


      {/* ================================================== */}
      {/* DOCUMENT LIST */}
      {/* ================================================== */}

      {!loading &&
        documents.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">

            <div className="divide-y divide-gray-100 dark:divide-gray-800">

              {documents.map((document) => {
                const documentId =
                  getDocumentId(document);

                const isSelected =
                  String(documentId) ===
                  String(selectedDocumentId);

                return (
                  <button
                    key={documentId}
                    type="button"
                    onClick={() =>
                      setSelectedDocumentId(
                        documentId
                      )
                    }
                    disabled={selecting}
                    className={`block w-full px-5 py-4 text-left transition ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/30"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/70"
                    }`}
                  >

                    <div className="flex items-start gap-4">

                      <div
                        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="h-3.5 w-3.5 text-white"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.56a1 1 0 0 1-1.42 0l-3.5-3.53a1 1 0 0 1 1.42-1.41l2.79 2.81 6.79-6.845a1 1 0 0 1 1.414.001Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>


                      <div className="min-w-0 flex-1">

                        <p className="break-words text-sm font-semibold text-gray-900 dark:text-white">
                          {getDocumentName(
                            document
                          )}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 dark:text-gray-400">

                          <span>
                            Department:{" "}
                            {getDocumentDepartment(
                              document
                            )}
                          </span>

                          <span>
                            Type:{" "}
                            {getDocumentType(
                              document
                            )}
                          </span>

                          {getDocumentVersion(
                            document
                          ) && (
                            <span>
                              Version:{" "}
                              {getDocumentVersion(
                                document
                              )}
                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                  </button>
                );
              })}

            </div>

          </div>
        )}


      {/* ================================================== */}
      {/* SELECT ACTION */}
      {/* ================================================== */}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">

        <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
          Selecting a document does not grant the requester
          access to the original document.
        </p>

        <button
          type="button"
          onClick={handleSelectDocument}
          disabled={
            !selectedDocumentId ||
            selecting ||
            loading
          }
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {selecting
            ? "Selecting..."
            : "Select This Document"}
        </button>

      </div>

    </div>
  );
}