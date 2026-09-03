// src/features/crossDepartmentDocument/RequestDocumentAccess.jsx

import React, { useState } from "react";
import {
  Send,
  X,
  AlertCircle,
  CheckCircle2,
  Building2,
  FileSearch,
  MessageSquare,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { createDocumentAccessRequest } from "./api";


export default function RequestDocumentAccess({
  departments = [],
  onSuccess,
  onClose,
}) {
  const [requestedDepartmentId, setRequestedDepartmentId] = useState("");
  const [documentReference, setDocumentReference] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!requestedDepartmentId) {
      setError("Please select the requested department.");
      return;
    }

    if (!documentReference.trim()) {
      setError("Please enter the document reference.");
      return;
    }

    if (!reason.trim()) {
      setError("Please enter a reason.");
      return;
    }

    try {
      setLoading(true);

      await createDocumentAccessRequest({
        requestedDepartmentId,
        documentReference: documentReference.trim(),
        reason: reason.trim(),
      });

      setSuccess("Document access request submitted successfully.");

      setRequestedDepartmentId("");
      setDocumentReference("");
      setReason("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to submit document access request.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">

      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Send className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
              Request Document Access
            </h2>
            <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
              Request a document from another department. The authorized
              department owner will locate and share the existing DMS
              document.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>


      <div className="px-6 py-5 space-y-5">

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-[12px] font-semibold text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30 px-4 py-3 text-[12px] font-semibold text-green-700 dark:text-green-300"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}


        <form onSubmit={handleSubmit} className="space-y-5">

          {/* REQUESTED DEPARTMENT */}
          <div>
            <label
              htmlFor="requested-department"
              className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              <Building2 className="w-3.5 h-3.5" />
              Requested Department
            </label>

            <select
              id="requested-department"
              value={requestedDepartmentId}
              onChange={(event) => setRequestedDepartmentId(event.target.value)}
              disabled={loading}
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#232F40] px-3 py-[10px] text-[13px] text-slate-800 dark:text-slate-200 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-700"
            >
              <option value="">Select department</option>

              {departments.map((department) => {
                const id = department.id ?? department.departmentId;
                const name =
                  department.name ??
                  department.departmentName ??
                  department.title;

                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>


          {/* DOCUMENT REFERENCE */}
          <div>
            <label
              htmlFor="document-reference"
              className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              <FileSearch className="w-3.5 h-3.5" />
              Document Reference / Name / SAP Document ID
            </label>

            <input
              id="document-reference"
              type="text"
              value={documentReference}
              onChange={(event) => setDocumentReference(event.target.value)}
              placeholder="Example: PO-2026-0045"
              autoComplete="off"
              disabled={loading}
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#232F40] px-3 py-[10px] text-[13px] text-slate-800 dark:text-slate-200 outline-none transition placeholder-slate-300 dark:placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-700"
            />

            <p className="mt-1.5 text-[10.5px] text-slate-400">
              Enter the reference or identifier of the document you need. You
              are not selecting or uploading the source document here.
            </p>
          </div>


          {/* REASON */}
          <div>
            <label
              htmlFor="document-request-reason"
              className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Reason / Message
            </label>

            <textarea
              id="document-request-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Example: Required for verification."
              rows={4}
              disabled={loading}
              className="block w-full resize-y rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#232F40] px-3 py-[10px] text-[13px] text-slate-800 dark:text-slate-200 outline-none transition placeholder-slate-300 dark:placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-700"
            />
          </div>


          {/* SECURITY INFO */}
          <div className="flex items-start gap-3 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 px-4 py-4 text-[12px] leading-6 text-blue-800 dark:text-blue-200">
            <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Important</p>
              <p className="mt-0.5">
                You are requesting access only. You cannot browse or select
                documents belonging to another department. The authorized
                department owner will select the existing DMS document.
              </p>
            </div>
          </div>


          {/* ACTIONS */}
          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#1A2433] px-5 py-[9px] text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 transition"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                !requestedDepartmentId ||
                !documentReference.trim() ||
                !reason.trim()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-[9px] text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Submit Request
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}