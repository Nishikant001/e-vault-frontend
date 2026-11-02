// src/features/sapSync/pages/LogViewerPage.jsx
//
// Flattens real SapSyncLog rows (GET /api/sap-sync/logs) into individual log
// lines: one SUCCESS/PARTIAL_SUCCESS/FAILED line per run, plus one line per
// entry in that run's `errors` array. No synthetic/mock data — every line is
// derived directly from a real sync log record.
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Download, Copy, Search, Info, Sparkles, ScrollText, Filter } from "lucide-react";
import AppCard, { CardHeader } from "../../../components/ui/Card";
import AppButton from "../../../components/ui/Button";
import AppSearch from "../../../components/ui/SearchInput";
import AppFilter from "../../../components/ui/FilterDropdown";
import StatusBadge from "../../../components/ui/StatusBadge";
import AppModal from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import { SapSyncApi } from "../api";
import { formatDateTime } from "../constants";

const LEVEL_OPTIONS = [
  { label: "Success", value: "SUCCESS" },
  { label: "Warning", value: "WARNING" },
  { label: "Error", value: "ERROR" },
];

const LEVEL_TONE = { SUCCESS: "success", WARNING: "warning", ERROR: "danger" };

function toLogLines(logs) {
  const lines = [];
  for (const log of logs) {
    const summaryLevel = log.status === "FAILED" ? "ERROR" : log.status === "PARTIAL_SUCCESS" ? "WARNING" : "SUCCESS";
    lines.push({
      id: `${log.id}-summary`,
      timestamp: log.endTime || log.startTime,
      level: summaryLevel,
      message: `${log.syncType} SYNC (${log.triggerType}) finished with status ${log.status} — fetched ${log.recordsFetched}, created ${log.recordsCreated}, updated ${log.recordsUpdated}, skipped ${log.recordsSkipped}, failed ${log.recordsFailed}.`,
    });
    (log.errors || []).forEach((err, i) => {
      lines.push({
        id: `${log.id}-err-${i}`,
        timestamp: err.timestamp || log.endTime || log.startTime,
        level: "ERROR",
        message: `[${log.syncType}] ${err.entityType || err.code || "RECORD"} — ${err.message}`,
      });
    });
  }
  return lines.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export default function LogViewerPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const load = () => {
    setLoading(true);
    SapSyncApi.getLogs({ page: 1, limit: 100 })
      .then((res) => setLogs(res.data || []))
      .catch((e) => toast({ title: "Could not load logs", description: e.message, tone: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line

  const lines = useMemo(() => toLogLines(logs), [logs]);
  const filtered = useMemo(
    () =>
      lines.filter((l) => {
        if (level && l.level !== level) return false;
        if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [lines, level, search]
  );

  function asText() {
    return filtered.map((l) => `[${formatDateTime(l.timestamp)}] [${l.level}] ${l.message}`).join("\n");
  }

  function download() {
    const blob = new Blob([asText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sap-sync-logs-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(asText());
      toast({ title: "Logs copied to clipboard", tone: "success" });
    } catch {
      toast({ title: "Copy failed — clipboard not available", tone: "error" });
    }
  }

  return (
    <>
      <LogViewerGuideModal open={showGuide} onClose={() => setShowGuide(false)} />
      <AppCard padding="p-0">
      <div className="p-6 pb-0">
       <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <span className="text-lg font-bold text-[var(--text-primary)]">
                Log Viewer
              </span>
              <button
                type="button"
                onClick={() => setShowGuide(true)}
                aria-label="View Log Viewer guide"
                className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white ring-4 ring-brand-500/20 animate-pulse transition-colors hover:animate-none hover:bg-brand-600"
              >
                <Info className="h-3 w-3" />
              </button>
            </span>
          }
          subtitle="Consolidated SUCCESS / WARNING / ERROR log lines across recent sync runs."
          action={
            <div className="flex items-center gap-2">
              <AppButton variant="secondary" size="sm" icon={RefreshCw} onClick={load}>Refresh</AppButton>
              <AppButton variant="secondary" size="sm" icon={Copy} onClick={copyAll}>Copy Logs</AppButton>
              <AppButton size="sm" icon={Download} onClick={download}>Download Logs</AppButton>
            </div>
          }
        />
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <AppSearch value={search} onChange={setSearch} placeholder="Search log messages…" className="max-w-sm" />
          <AppFilter label="Level" options={LEVEL_OPTIONS} value={level} onChange={setLevel} icon={Search} />
        </div>
      </div>

      <div className="max-h-[65vh] overflow-y-auto border-t border-[var(--border-subtle)] bg-[var(--surface-sunken)] font-mono text-xs">
        {loading ? (
          <p className="p-4 text-[var(--text-tertiary)]">Loading logs…</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-[var(--text-tertiary)]">No log lines match the current filters.</p>
        ) : (
          filtered.map((l) => (
            <div key={l.id} className="flex items-start gap-3 border-b border-[var(--border-subtle)] px-4 py-2 last:border-0">
              <span className="shrink-0 whitespace-nowrap text-[var(--text-tertiary)]">{formatDateTime(l.timestamp)}</span>
              <span className="shrink-0"><StatusBadge status={l.level} tone={LEVEL_TONE[l.level]} showIcon={false} /></span>
              <span className="break-all text-[var(--text-primary)]">{l.message}</span>
            </div>
          ))
        )}
           </div>
    </AppCard>
    </>
  );
}
function LogViewerGuideModal({ open, onClose }) {
  const steps = [
    {
      icon: ScrollText,
      title: "Consolidated log lines",
      desc: "Every sync run is flattened into one summary line plus one line per error, so you can scan everything at once.",
    },
    {
      icon: Filter,
      title: "Filter by level",
      desc: "Use the Level filter to show only Success, Warning, or Error lines.",
    },
    {
      icon: Search,
      title: "Search messages",
      desc: "Type in the search box to filter log lines by message content.",
    },
    {
      icon: Copy,
      title: "Copy or download",
      desc: "Use Copy Logs to copy the currently filtered lines to your clipboard, or Download Logs to save them as a .log file.",
    },
    {
      icon: RefreshCw,
      title: "Refresh anytime",
      desc: "Click Refresh to pull the latest sync runs and rebuild the log lines.",
    },
  ];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          Log Viewer — Guide
        </span>
      }
      footer={
        <AppButton variant="primary" onClick={onClose}>
          Got it
        </AppButton>
      }
    >
      <div className="space-y-4">
        {steps.map((s, i) => (
          <div key={s.title} className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {i + 1}. {s.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-tertiary)]">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </AppModal>
  );
}
