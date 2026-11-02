// src/features/crossDepartmentDocument/RequestDocumentAccess.jsx

import React, { useMemo, useState } from "react";
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
  ArrowRight,
  LockKeyhole,
  Sparkles,
  CircleCheck,
  ClipboardList,
  Fingerprint,
  Clock3,
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

  const selectedDepartment = useMemo(
    () =>
      departments.find(
        (department) =>
          String(department.id ?? department.departmentId) ===
          String(requestedDepartmentId),
      ),
    [departments, requestedDepartmentId],
  );

  const progress =
    Number(Boolean(requestedDepartmentId)) +
    Number(Boolean(documentReference.trim())) +
    Number(Boolean(reason.trim()));

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
    <div className="w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] dark:border-slate-700/80 dark:bg-[#101925]">
      <style>{`
        @keyframes request-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes request-pulse {
          0%, 100% { transform: scale(1); opacity: .7; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes request-shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
        .request-fade-up { animation: request-fade-up .45s ease-out both; }
        .request-fade-up-delay-1 { animation-delay: .06s; }
        .request-fade-up-delay-2 { animation-delay: .12s; }
        .request-fade-up-delay-3 { animation-delay: .18s; }
        .request-pulse { animation: request-pulse 2.4s ease-in-out infinite; }
        .request-shimmer { animation: request-shimmer 2.8s ease-in-out infinite; }
      `}</style>

      {/* FUTURISTIC HEADER */}
      <div className="relative overflow-hidden border-b border-slate-200/80 bg-[radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.16),transparent_28%),linear-gradient(135deg,#f8fbff_0%,#ffffff_52%,#f4f8ff_100%)] px-5 py-5 sm:px-7 sm:py-6 dark:border-slate-700/80 dark:bg-[radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.18),transparent_28%),linear-gradient(135deg,#101925_0%,#111d2c_55%,#0f1724_100%)]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-20 top-8 h-16 w-16 rounded-full border border-blue-400/20 bg-blue-400/5 request-pulse" />

        <div className="relative flex items-start justify-between gap-5">
          <div className="min-w-0 request-fade-up">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              Cross-Department Access
            </div>

            <div className="flex items-start gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
                <Send className="h-4.5 w-4.5" />
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#101925]" />
              </div>

              <div className="min-w-0">
                <h2 className="text-[19px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[21px]">
                  Request Document Access
                </h2>
                <p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[12.5px]">
                  Submit a controlled request for a document owned by another department.
                  The authorized owner locates the existing DMS record and shares access securely.
                </p>
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex request-fade-up request-fade-up-delay-1">
            <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-right shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Request type
              </p>
              <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                <LockKeyhole className="h-3 w-3 text-blue-500" />
                Access only
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/85 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/85 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:hidden dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* PROGRESS STRIP */}
        <div className="relative mt-5 request-fade-up request-fade-up-delay-2">
          <div className="mb-2 flex items-center justify-between gap-3 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
            <span>Request readiness</span>
            <span>{progress}/3 complete</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${(progress / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* FORM */}
        <div className="min-w-0 px-5 py-5 sm:px-7 sm:py-6">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700 request-fade-up dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-semibold text-emerald-700 request-fade-up dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p>Request submitted successfully.</p>
                <p className="mt-0.5 text-[10.5px] font-medium opacity-80">
                  The receiving department can now review the request.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* STEP 01 */}
            <section className="request-fade-up request-fade-up-delay-1">
              <div className="mb-2.5 flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-extrabold text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                  01
                </span>
                <div>
                  <h3 className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
                    Destination department
                  </h3>
                  <p className="text-[10.5px] text-slate-400">Who owns the document?</p>
                </div>
              </div>

              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="requested-department"
                  value={requestedDepartmentId}
                  onChange={(event) => setRequestedDepartmentId(event.target.value)}
                  disabled={loading}
                  className="block w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-[13px] font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-[#182333] dark:text-slate-100 dark:focus:border-blue-500 dark:disabled:bg-slate-800"
                >
                  <option value="">Select department</option>
                  {departments.map((department) => {
                    const id = department.id ?? department.departmentId;
                    const name =
                      department.name ?? department.departmentName ?? department.title;

                    return (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
                <ArrowRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
              </div>
            </section>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* STEP 02 */}
            <section className="request-fade-up request-fade-up-delay-2">
              <div className="mb-2.5 flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-[10px] font-extrabold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  02
                </span>
                <div>
                  <h3 className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
                    Document reference
                  </h3>
                  <p className="text-[10.5px] text-slate-400">Tell the owner exactly which record you need.</p>
                </div>
              </div>

              <div className="relative">
                <FileSearch className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="document-reference"
                  type="text"
                  value={documentReference}
                  onChange={(event) => setDocumentReference(event.target.value)}
                  placeholder="Document name, ERP document ID, PO-2026-0045..."
                  autoComplete="off"
                  disabled={loading}
                  className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-[13px] font-medium text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-[#182333] dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-indigo-500 dark:disabled:bg-slate-800"
                />
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-slate-400">
                <Fingerprint className="h-3.5 w-3.5" />
                You are referencing the record only. No source document is uploaded here.
              </p>
            </section>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* STEP 03 */}
            <section className="request-fade-up request-fade-up-delay-3">
              <div className="mb-2.5 flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-50 text-[10px] font-extrabold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                  03
                </span>
                <div>
                  <h3 className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
                    Business reason
                  </h3>
                  <p className="text-[10.5px] text-slate-400">Why is access required?</p>
                </div>
              </div>

              <div className="relative">
                <MessageSquare className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <textarea
                  id="document-request-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Example: Required for verification, audit review, or downstream processing."
                  rows={4}
                  disabled={loading}
                  className="block w-full resize-y rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-[13px] font-medium leading-5 text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-[#182333] dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-violet-500 dark:disabled:bg-slate-800"
                />
              </div>
            </section>

            {/* SECURITY CALLOUT */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-4 dark:border-blue-900/40 dark:from-blue-950/30 dark:via-slate-900/30 dark:to-indigo-950/30">
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="relative flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[11.5px] font-bold text-slate-800 dark:text-slate-100">
                    Controlled document access
                  </p>
                  <p className="mt-1 text-[10.5px] leading-5 text-slate-500 dark:text-slate-400">
                    You cannot browse or select another department&apos;s documents from this form.
                    The authorized owner selects the existing DMS record and grants access under the platform rules.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <Clock3 className="h-3.5 w-3.5" />
                Review happens after submission
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800"
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
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-2.5 text-[12px] font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <span className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-white/15 request-shimmer" />
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      Submit Access Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* LIVE SUMMARY / RIGHT PANEL */}
        <aside className="border-t border-slate-200/80 bg-slate-50/70 px-5 py-5 lg:border-l lg:border-t-0 sm:px-6 dark:border-slate-800 dark:bg-slate-950/20">
          <div className="sticky top-0 space-y-4">
            <div className="request-fade-up">
              <div className="mb-1 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-500" />
                <h3 className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
                  Request preview
                </h3>
              </div>
              <p className="text-[10.5px] leading-5 text-slate-400">
                Confirm the request context before submitting.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#131d2a]">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
              <div className="space-y-4 p-4">
                <PreviewRow
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  label="Department"
                  value={
                    selectedDepartment?.name ||
                    selectedDepartment?.departmentName ||
                    selectedDepartment?.title ||
                    "Not selected"
                  }
                />
                <PreviewRow
                  icon={<FileSearch className="h-3.5 w-3.5" />}
                  label="Document"
                  value={documentReference.trim() || "Not specified"}
                />
                <PreviewRow
                  icon={<MessageSquare className="h-3.5 w-3.5" />}
                  label="Reason"
                  value={reason.trim() || "Not provided"}
                  multiline
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#131d2a]">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Access flow
              </p>
              <div className="space-y-3">
                <FlowItem index="01" text="Request submitted" done={progress === 3} />
                <FlowItem index="02" text="Department owner reviews" />
                <FlowItem index="03" text="Document is securely shared" />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-start gap-2.5">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                    Privacy by design
                  </p>
                  <p className="mt-1 text-[10.5px] leading-5 text-emerald-700/80 dark:text-emerald-300/70">
                    The request contains a reference, not a copy of the source document.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PreviewRow({ icon, label, value, multiline = false }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <p
        className={`text-[11.5px] font-semibold leading-5 ${
          value.startsWith("Not ")
            ? "text-slate-300 dark:text-slate-600"
            : "text-slate-700 dark:text-slate-200"
        } ${multiline ? "line-clamp-3" : "truncate"}`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function FlowItem({ index, text, done = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[9px] font-extrabold ${
          done
            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        }`}
      >
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index}
      </div>
      <p className="text-[10.5px] font-medium text-slate-600 dark:text-slate-300">
        {text}
      </p>
    </div>
  );
}
