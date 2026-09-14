import { useState, useEffect, useRef } from "react";

// IMPORTANT:
// Use the exact same metadataApi import path/pattern
// already used in Ocrreviewpage.jsx.
import { metadataApi } from "../../services/metadataApi";

const CONF_COLORS = {
  High: "text-green-500",
  Mid: "text-orange-400",
  Low: "text-red-400",
};

const CONF_DOT = {
  High: "bg-green-500",
  Mid: "bg-orange-400",
  Low: "bg-red-400",
};

const LOG_COLORS = {
  SUCCESS: "text-green-400",
  PROCESSING: "text-yellow-300",
  FAILED: "text-red-400",
  INFO: "text-blue-300",
};

const LOG_PREFIX = {
  SUCCESS: "✓",
  PROCESSING: "⟳",
  FAILED: "✗",
  INFO: "›",
};

export default function DocumentViewer({
  documentId,
  fileName,
  onClose,
}) {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [polling, setPolling] = useState(true);
  const [activeTab, setActiveTab] = useState("ocr");

  // Dynamic metadata state
  const [fields, setFields] = useState(null);
  const [mappedMetadata, setMappedMetadata] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState(null);

  const logsEndRef = useRef(null);

  /**
   * Fetch dynamic OCR metadata.
   *
   * Expected response pattern:
   * {
   *   fields: [...],
   *   mappedMetadata: {...}
   * }
   *
   * This supports dynamic OCR templates for different document types.
   */
  useEffect(() => {
    if (!documentId) {
      setFields(null);
      setMappedMetadata(null);
      return;
    }

    let cancelled = false;

    const fetchMetadata = async () => {
      try {
        setMetadataLoading(true);
        setMetadataError(null);

        const res = await metadataApi.getDocumentMetadata(documentId);

        if (cancelled) return;

        const data = res?.data || {};

        setFields(data.fields || []);
        setMappedMetadata(data.mappedMetadata || {});
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to fetch document metadata:", error);

        setFields([]);
        setMappedMetadata({});
        setMetadataError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load OCR metadata."
        );
      } finally {
        if (!cancelled) {
          setMetadataLoading(false);
        }
      }
    };

    fetchMetadata();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  /**
   * Poll document status and activity.
   */
  useEffect(() => {
    if (!documentId) return;

    let timer;

    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [statusRes, activityRes] = await Promise.all([
          fetch(`/api/documents/${documentId}/status`, {
            headers,
          }),
          fetch(`/api/documents/${documentId}/activity`, {
            headers,
          }),
        ]);

        const statusData = await statusRes.json();
        const activityData = await activityRes.json();

        if (statusData.success) {
          setStatus(statusData);

          if (
            statusData.status === "OCR_COMPLETED" ||
            statusData.status === "COMPLETED" ||
            statusData.status === "FAILED"
          ) {
            setPolling(false);
          }
        }

        if (activityData.success) {
          setLogs(activityData.logs || []);
        }
      } catch (error) {
        console.error("Poll error:", error);
      }
    };

    fetchAll();

    if (polling) {
      timer = setInterval(fetchAll, 2000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [documentId, polling]);

  /**
   * Auto-refresh metadata while OCR is processing.
   *
   * This ensures fields appear dynamically once OCR/template
   * processing has completed.
   */
  useEffect(() => {
    if (!documentId || !polling) return;

    const timer = setInterval(async () => {
      try {
        const res = await metadataApi.getDocumentMetadata(documentId);
        const data = res?.data || {};

        setFields(data.fields || []);
        setMappedMetadata(data.mappedMetadata || {});
        setMetadataError(null);
      } catch (error) {
        // Keep existing data during polling.
        // Avoid replacing already-loaded metadata with an error.
        console.error("Metadata refresh error:", error);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [documentId, polling]);

  /**
   * Auto-scroll activity logs.
   */
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [logs]);

  /**
   * Normalize dynamic fields.
   *
   * Supports:
   * - fields as an array
   * - fields as an object
   * - mappedMetadata as an object
   *
   * No Invoice-specific assumptions are made here.
   */
  const normalizedFields = Array.isArray(fields)
    ? fields
    : fields && typeof fields === "object"
    ? Object.entries(fields).map(([key, field]) => ({
        key,
        ...(field && typeof field === "object"
          ? field
          : {
              value: field,
            }),
      }))
    : [];

  /**
   * Build display rows dynamically.
   *
   * Primary source:
   *   fields
   *
   * Value source:
   *   mappedMetadata[field.key]
   *
   * This allows the field template/definition and extracted
   * mapped value to remain separate.
   */
  const displayFields = normalizedFields.map((field, index) => {
    const key =
      field.key ||
      field.fieldKey ||
      field.name ||
      field.id ||
      `field-${index}`;

    const label =
      field.label ||
      field.displayName ||
      field.fieldName ||
      field.name ||
      key;

    const mappedValue =
      mappedMetadata?.[key] ??
      mappedMetadata?.[field.fieldKey] ??
      mappedMetadata?.[field.name];

    const value =
      mappedValue?.value ??
      mappedValue ??
      field.value ??
      field.extractedValue ??
      field.defaultValue ??
      "";

    const confidence =
      mappedValue?.confidence ||
      field.confidence ||
      "Low";

    return {
      ...field,
      key,
      label,
      value,
      confidence,
    };
  });

  /**
   * If the API returns mappedMetadata but no fields,
   * still render all available metadata dynamically.
   */
  const fallbackMappedFields =
    displayFields.length === 0 &&
    mappedMetadata &&
    typeof mappedMetadata === "object"
      ? Object.entries(mappedMetadata).map(([key, metadata]) => ({
          key,
          label:
            metadata?.label ||
            metadata?.displayName ||
            metadata?.fieldName ||
            key,
          value:
            metadata?.value ??
            metadata ??
            "",
          confidence:
            metadata?.confidence || "Low",
        }))
      : [];

  const renderedFields =
    displayFields.length > 0
      ? displayFields
      : fallbackMappedFields;

  const highCount = renderedFields.filter(
    (field) => field.confidence === "High"
  ).length;

  const midCount = renderedFields.filter(
    (field) => field.confidence === "Mid"
  ).length;

  const lowCount = renderedFields.filter(
    (field) => field.confidence === "Low"
  ).length;

  const totalFields = renderedFields.length;

  return (
    <div className="flex flex-col h-full bg-[#1A2433] text-white rounded-xl overflow-hidden border border-slate-700">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 bg-[#151E2C]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[13px] text-slate-300 font-medium truncate max-w-[200px]">
            {fileName || "Document"}
          </span>

          <button
            type="button"
            className="text-[11px] px-3 py-1 border border-slate-600 rounded text-slate-400 hover:text-white hover:border-slate-400 transition-colors"
          >
            ↓ Download
          </button>

          <button
            type="button"
            className="text-[11px] px-3 py-1 border border-slate-600 rounded text-slate-400 hover:text-white hover:border-slate-400 transition-colors"
          >
            ↑ New Ver
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white text-[18px] transition-colors"
            aria-label="Close document viewer"
          >
            ×
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-slate-700 bg-[#151E2C]">
        <button
          type="button"
          onClick={() => setActiveTab("ocr")}
          className={`px-5 py-2 text-[12px] font-semibold border-b-2 transition-colors ${
            activeTab === "ocr"
              ? "border-blue-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          OCR Extracted Data
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("log")}
          className={`px-5 py-2 text-[12px] font-semibold border-b-2 transition-colors ${
            activeTab === "log"
              ? "border-blue-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Activity Log

          {polling && (
            <span className="ml-2 inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* ── OCR Tab ── */}
      {activeTab === "ocr" && (
        <div className="flex-1 overflow-y-auto">
          {/* Subheader */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-white">
                OCR Extracted Data
              </span>

              {polling && (
                <span className="text-[10px] text-yellow-400 animate-pulse">
                  Updating…
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-slate-400">Conf:</span>

              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                <span className="text-green-400">High</span>
              </span>

              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                <span className="text-orange-400">Mid</span>
              </span>

              {lowCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  <span className="text-red-400">Low</span>
                </span>
              )}
            </div>
          </div>

          {/* Status badge */}
          {status?.status && (
            <div className="px-5 py-2 text-[11px] text-slate-400 border-b border-slate-700/40">
              Status:{" "}

              <span
                className={`font-semibold ${
                  status.status === "COMPLETED" ||
                  status.status === "OCR_COMPLETED"
                    ? "text-green-400"
                    : status.status === "FAILED"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {status.status.replace(/_/g, " ")}
              </span>

              {polling && (
                <span className="ml-2 text-yellow-400 animate-pulse">
                  ● processing…
                </span>
              )}
            </div>
          )}

          {/* Metadata error */}
          {metadataError && !metadataLoading && (
            <div className="px-5 py-3 text-[12px] text-red-400 border-b border-red-500/20 bg-red-500/5">
              {metadataError}
            </div>
          )}

          {/* Dynamic Fields */}
          {metadataLoading && totalFields === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />

              <span className="text-[12px]">
                Loading document metadata…
              </span>
            </div>
          ) : totalFields === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-500">
              <span className="text-[12px]">
                {polling
                  ? "Extracting OCR data…"
                  : "No OCR metadata available for this document."}
              </span>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {renderedFields.map((field) => {
                const conf = CONF_COLORS[field.confidence]
                  ? field.confidence
                  : "Low";

                const displayValue =
                  field.value === null ||
                  field.value === undefined ||
                  field.value === ""
                    ? "—"
                    : typeof field.value === "object"
                    ? JSON.stringify(field.value)
                    : String(field.value);

                return (
                  <div
                    key={field.key}
                    className="flex items-center justify-between px-5 py-[14px] hover:bg-slate-700/20 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-400 mb-[6px]">
                        {field.label}
                      </p>

                      <input
                        readOnly
                        value={displayValue}
                        className="w-full bg-[#0F1923] border border-slate-700 rounded-md px-3 py-[7px] text-[13px] text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="ml-4 flex flex-col items-center gap-1 min-w-[40px]">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          CONF_DOT[conf]
                        }`}
                      />

                      <span
                        className={`text-[10px] font-bold ${
                          CONF_COLORS[conf]
                        }`}
                      >
                        {conf}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dynamic Summary */}
          {totalFields > 0 && (
            <div className="flex items-center gap-4 px-5 py-3 bg-[#0F1923] border-t border-slate-700 text-[11px]">
              <span className="text-green-400 font-semibold">
                {highCount} High
              </span>

              <span className="text-orange-400 font-semibold">
                {midCount} Mid
              </span>

              {lowCount > 0 && (
                <span className="text-red-400 font-semibold">
                  {lowCount} Low
                </span>
              )}

              <span className="text-slate-500 ml-auto">
                {totalFields} field
                {totalFields !== 1 ? "s" : ""} extracted
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Activity Log Tab ── */}
      {activeTab === "log" && (
        <div className="flex-1 overflow-y-auto bg-[#0A1018] font-mono">
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-700/50 bg-[#0F1923]">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />

            <span className="ml-3 text-[11px] text-slate-500">
              document-pipeline — activity
            </span>
          </div>

          <div className="p-4 space-y-[6px] min-h-[200px]">
            {logs.length === 0 && (
              <span className="text-[12px] text-slate-600">
                Waiting for activity…
              </span>
            )}

            {logs.map((log, index) => {
              const logStatus = log.status || "INFO";

              const timestamp = log.timestamp
                ? new Date(log.timestamp).toLocaleTimeString()
                : "";

              return (
                <div
                  key={log.id || index}
                  className="flex items-start gap-2 text-[12px] leading-relaxed"
                >
                  <span className="text-slate-600 min-w-[70px] text-[10px] mt-[1px]">
                    {timestamp}
                  </span>

                  <span
                    className={`font-bold ${
                      LOG_COLORS[logStatus] || "text-slate-400"
                    } w-4`}
                  >
                    {LOG_PREFIX[logStatus] || "›"}
                  </span>

                  <span
                    className={
                      LOG_COLORS[logStatus] || "text-slate-300"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              );
            })}

            {polling && (
              <div className="flex items-center gap-2 text-[12px] text-yellow-400">
                <span className="animate-pulse">▋</span>

                <span className="text-slate-500 text-[10px]">
                  live
                </span>
              </div>
            )}

            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}