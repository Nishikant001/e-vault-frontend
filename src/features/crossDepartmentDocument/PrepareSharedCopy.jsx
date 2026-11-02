// src/features/crossDepartmentDocument/PrepareSharedCopy.jsx

import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  EyeOff,
  FileKey2,
  FileText,
  Info,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Clock3,
  AlertCircle,
} from "lucide-react";

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

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function OptionCard({
  icon: Icon,
  title,
  description,
  meta,
  selected,
  disabled,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative w-full overflow-hidden rounded-[18px] border p-4 text-left transition duration-200 ${
        selected
          ? "border-blue-400 bg-blue-50/80 shadow-[0_12px_34px_rgba(37,99,235,0.10)] dark:border-blue-800/70 dark:bg-blue-950/30"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-[0_10px_30px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/20"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full bg-blue-500/[0.05] blur-2xl transition group-hover:scale-125" />

      <div className="relative flex items-start gap-3.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            selected
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-300"
          }`}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {title}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {description}
              </p>
            </div>

            {selected && (
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                <CheckCircle2 size={14} />
              </span>
            )}
          </div>

          {meta && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <ShieldCheck size={11} />
              {meta}
            </div>
          )}
        </div>
      </div>
    </button>
  );
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
  const [processing, setProcessing] = useState(false);

  const shareId = getShareId(share);

  const handleSendWithoutMasking = async () => {
    if (!shareId) {
      setError(
        "The temporary document share could not be identified."
      );
      return;
    }

    if (!onSendWithoutMasking) {
      setError("The send action is not available.");
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

  const handleMaskAndSend = async () => {
    if (!shareId) {
      setError(
        "The temporary document share could not be identified."
      );
      return;
    }

    if (!onMaskAndSend) {
      setError("The masking editor is not available.");
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

  const documentName = getDocumentName(document, share);
  const expiry = formatDate(getExpiry(share));

  return (
    <div className="w-full bg-[#f6f8fc] dark:bg-slate-950">
      <style>{`
        @keyframes prepare-copy-rise {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes prepare-copy-glow {
          0%, 100% {
            opacity: .35;
          }
          50% {
            opacity: .7;
          }
        }

        .prepare-copy-rise {
          animation: prepare-copy-rise .4s ease-out both;
        }

        .prepare-copy-glow {
          animation: prepare-copy-glow 3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .prepare-copy-rise,
          .prepare-copy-glow {
            animation: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1250px] space-y-4">
        {/* Header */}
        <section className="prepare-copy-rise relative overflow-hidden rounded-[22px] border border-blue-500/20 bg-gradient-to-r from-[#155DFC] via-[#246AF5] to-[#3C3EE3] px-5 py-4 shadow-[0_16px_45px_rgba(37,88,240,0.18)] sm:px-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 prepare-copy-glow" />
          <div className="pointer-events-none absolute -right-3 top-8 h-24 w-24 rounded-full bg-violet-300/10" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.12] text-white sm:flex">
                <FileKey2 size={18} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100">
                    Share Decision
                  </span>
                  <span className="h-1 w-1 rounded-full bg-blue-100/70" />
                  <span className="text-[10px] font-medium text-blue-100/80">
                    Temporary copy
                  </span>
                </div>

                <h1 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-[24px]">
                  Prepare Shared Copy
                </h1>

                <p className="mt-0.5 max-w-3xl text-[11px] leading-5 text-blue-100/80 sm:text-xs">
                  Decide whether the temporary copy should be sent as-is or masked before sharing.
                </p>
              </div>
            </div>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={processing}
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
            className="prepare-copy-rise flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-rose-600 dark:bg-slate-900/60 dark:text-rose-300">
              <AlertCircle size={16} />
            </div>

            <div>
              <p className="font-semibold">Unable to continue</p>
              <p className="mt-0.5 text-xs leading-5 text-rose-700/80 dark:text-rose-300/80">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Temporary copy details */}
        <section className="prepare-copy-rise rounded-[20px] border border-slate-200/80 bg-white shadow-[0_15px_50px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                <FileText size={17} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">
                  Temporary shared copy
                </p>
                <h2 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                  Ready for final sharing decision
                </h2>
              </div>
            </div>

            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700 sm:inline-flex dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
              <ShieldCheck size={11} />
              Temporary
            </span>
          </div>

          <div className="grid gap-2.5 p-4 sm:grid-cols-2">
            <DetailCard
              icon={FileText}
              label="Document"
              value={documentName}
            />

            <DetailCard
              icon={Clock3}
              label="Access expires"
              value={expiry}
            />
          </div>
        </section>

        {/* Security note */}
        <section className="prepare-copy-rise grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3.5 dark:border-blue-900/40 dark:bg-blue-950/25">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
              <ShieldCheck size={15} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
                Original document protection
              </p>

              <p className="mt-1 text-[11px] leading-5 text-blue-800/80 dark:text-blue-200/80">
                Masking applies only to the temporary shared copy. The original DMS document will not be modified.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300">
              <Sparkles size={15} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-700 dark:text-indigo-300">
                One final decision
              </p>

              <p className="mt-1 text-[11px] leading-5 text-indigo-800/80 dark:text-indigo-200/80">
                Choose whether to send the temporary copy directly or open the masking editor.
              </p>
            </div>
          </div>
        </section>

        {/* Decision cards */}
        <section className="prepare-copy-rise rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_15px_50px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">
              Sharing decision
            </p>

            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              How should this copy be shared?
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Both options continue through the controlled temporary-share workflow.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <OptionCard
              icon={CheckCircle2}
              title="Send Without Masking"
              description="Send the temporary copy as-is. You will be asked to confirm before the copy is finally sent."
              meta="No masking applied"
              disabled={processing || !shareId}
              onClick={handleSendWithoutMasking}
            />

            <OptionCard
              icon={EyeOff}
              title="Mask & Send"
              description="Open the masking editor and hide sensitive information before the temporary copy is sent."
              meta="Masking editor"
              disabled={processing || !shareId}
              onClick={handleMaskAndSend}
            />
          </div>
        </section>

        {/* Supported masking types */}
        <section className="prepare-copy-rise rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">
              <EyeOff size={17} />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Sensitive information you may mask
              </h3>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Masking is applied only to the temporary shared copy.
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
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
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="prepare-copy-rise flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-2.5">
            <Info
              size={15}
              className="mt-0.5 shrink-0 text-slate-400"
            />
            <p className="max-w-2xl text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              The final send action uses the temporary share only. The original DMS document remains unchanged.
            </p>
          </div>

          {processing && (
            <span className="inline-flex items-center gap-2 self-start rounded-xl bg-blue-50 px-3 py-2 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
              <Loader2 size={14} className="animate-spin" />
              Processing...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
