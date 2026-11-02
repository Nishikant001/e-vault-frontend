// src/features/crossDepartmentDocument/PrepareDocumentShare.jsx

import React, { useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock3,
  FileKey2,
  FileText,
  Info,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Building2,
} from "lucide-react";

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

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-950/50">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        <Icon size={12} />
        {label}
      </div>

      <p
        className="mt-1.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100"
        title={String(value || "")}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function DurationCard({
  duration,
  selected,
  disabled,
  onSelect,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(duration.value)}
      className={`group relative overflow-hidden rounded-xl border px-3.5 py-3 text-left transition duration-200 ${
        selected
          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-[0_8px_28px_rgba(37,99,235,0.08)] dark:border-blue-800/70 dark:bg-blue-950/30 dark:text-blue-300"
          : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/20 dark:hover:text-blue-300"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {selected && (
        <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
          <Check size={11} strokeWidth={2.5} />
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            selected
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-300"
          }`}
        >
          <Clock3 size={15} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold">{duration.label}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Temporary access
          </p>
        </div>
      </div>
    </button>
  );
}

export default function PrepareDocumentShare({
  request,
  document,
  onPrepared,
  onBack,
}) {
  const requestId = getRequestId(request);

  const [durationMinutes, setDurationMinutes] = useState(
    DOCUMENT_SHARE_DURATIONS[0]?.value || 15
  );

  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");

  const handlePrepare = async () => {
    if (!requestId) {
      setError("Invalid document request.");
      return;
    }

    try {
      setPreparing(true);
      setError("");

      const response = await prepareDocumentShare(
        requestId,
        {
          durationMinutes: Number(durationMinutes),
          // Prepare stage creates a masking-capable temporary share.
          // The next decision step controls whether masking is actually used.
          maskingRequired: true,
        }
      );

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
          durationMinutes: Number(durationMinutes),
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
    <div className="w-full bg-[#f6f8fc] dark:bg-slate-950">
      <style>{`
        @keyframes prepare-share-rise {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes prepare-share-glow {
          0%, 100% {
            opacity: .35;
          }
          50% {
            opacity: .7;
          }
        }

        .prepare-share-rise {
          animation: prepare-share-rise .4s ease-out both;
        }

        .prepare-share-glow {
          animation: prepare-share-glow 3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .prepare-share-rise,
          .prepare-share-glow {
            animation: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1250px] space-y-4">
        {/* Hero */}
        <section className="prepare-share-rise relative overflow-hidden rounded-[22px] border border-blue-500/20 bg-gradient-to-r from-[#155DFC] via-[#246AF5] to-[#3C3EE3] px-5 py-4 shadow-[0_16px_45px_rgba(37,88,240,0.18)] sm:px-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 prepare-share-glow" />
          <div className="pointer-events-none absolute -right-3 top-8 h-24 w-24 rounded-full bg-violet-300/10" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.12] text-white sm:flex">
                <FileKey2 size={18} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100">
                    Temporary Share
                  </span>
                  <span className="h-1 w-1 rounded-full bg-blue-100/70" />
                  <span className="text-[10px] font-medium text-blue-100/80">
                    Secure DMS workflow
                  </span>
                </div>

                <h1 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-[24px]">
                  Prepare Document Share
                </h1>

                <p className="mt-0.5 max-w-3xl text-[11px] leading-5 text-blue-100/80 sm:text-xs">
                  Review the selected DMS document and configure how long the temporary copy should remain available.
                </p>
              </div>
            </div>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={preparing}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.10] px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/[0.17] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="prepare-share-rise flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-rose-600 dark:bg-slate-900/60 dark:text-rose-300">
              <Info size={16} />
            </div>

            <div>
              <p className="font-semibold">Unable to prepare share</p>
              <p className="mt-0.5 text-xs leading-5 text-rose-700/80 dark:text-rose-300/80">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Selected document */}
        <section className="prepare-share-rise rounded-[20px] border border-slate-200/80 bg-white shadow-[0_15px_50px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800 sm:px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
              <FileText size={17} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">
                Selected document
              </p>
              <h2 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                Ready for temporary sharing
              </h2>
            </div>
          </div>

          <div className="grid gap-2.5 p-4 sm:grid-cols-2 xl:grid-cols-4 sm:p-5">
            <DetailCard
              icon={FileText}
              label="Document"
              value={getDocumentName(document)}
            />

            <DetailCard
              icon={Building2}
              label="Source department"
              value={getSourceDepartment(document, request)}
            />

            <DetailCard
              icon={UserRound}
              label="Recipient"
              value={getRequesterName(request)}
            />

            <DetailCard
              icon={ShieldCheck}
              label="Access"
              value="Temporary shared copy only"
            />
          </div>
        </section>

        {/* Duration */}
        <section className="prepare-share-rise rounded-[20px] border border-slate-200/80 bg-white shadow-[0_15px_50px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-4 py-3.5 dark:border-slate-800 sm:px-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300">
                <Clock3 size={17} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Access duration
                </h2>
                <p className="mt-0.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  The recipient can access the temporary copy only for the selected duration. The final expiry is determined by the server.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {DOCUMENT_SHARE_DURATIONS.map((duration) => (
                <DurationCard
                  key={duration.value}
                  duration={duration}
                  selected={
                    Number(durationMinutes) ===
                    Number(duration.value)
                  }
                  disabled={preparing}
                  onSelect={setDurationMinutes}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="prepare-share-rise grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3.5 dark:border-blue-900/40 dark:bg-blue-950/25">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
              <ShieldCheck size={15} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
                Original document protection
              </p>

              <p className="mt-1 text-[11px] leading-5 text-blue-800/80 dark:text-blue-200/80">
                A temporary shared copy is prepared for this workflow. The original DMS document is not modified, replaced, uploaded again or deleted.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
              <Sparkles size={15} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                Controlled access
              </p>

              <p className="mt-1 text-[11px] leading-5 text-emerald-800/80 dark:text-emerald-200/80">
                The next workflow step decides whether masking is applied before the share is sent.
              </p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="prepare-share-rise flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-2.5">
            <Info
              size={15}
              className="mt-0.5 shrink-0 text-slate-400"
            />

            <p className="max-w-2xl text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              Preparing the share does not send the document yet. The next step continues the masking and sharing workflow.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={preparing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ArrowLeft size={14} />
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handlePrepare}
              disabled={preparing || !requestId}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-700/20 focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {preparing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <FileKey2 size={14} />
                  Approve & Prepare
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
