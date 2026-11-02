// src/features/erpIntegration/pages/ErpIntegrationPage.jsx
// Tenant Admin — ERP Integration
//
// Premium DMS / Enterprise SaaS redesign.
// Functional flow preserved:
// - listConnections()
// - testConnection()
// - syncEntity()
// - SAP Synchronization navigation
// - CATEGORY / DOCUMENT_TYPE sync for supported non-SAP ERP connections
//
// UX principles:
// - ERP integrations are treated as an enterprise control center
// - scalable table/list for many ERP connections
// - premium overview + health metrics
// - detailed opaque ERP configuration drawer/modal
// - credentials are never exposed
// - raw mapping/config JSON is not rendered
// - responsive, keyboard-friendly, and DMS-style information hierarchy

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Database,
  Eye,
  FileText,
  FolderTree,
  Info,
  KeyRound,
  Layers3,
  LockKeyhole,
  MoreHorizontal,
  Network,
  Plug,
  RefreshCw,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Star,
  Tags,
  UserRound,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import AppCard from "../../../components/ui/Card";
import AppButton from "../../../components/ui/Button";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import { ErpIntegrationApi } from "../api";

const TYPE_STYLE = {
  SAP: {
    badge: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400",
    icon: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  ORACLE: {
    badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
    icon: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  },
  DEFAULT: {
    badge: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    icon: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
};

function typeStyle(type) {
  return TYPE_STYLE[type] || TYPE_STYLE.DEFAULT;
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function compactDate(value) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function StatusBadge({ status }) {
  const normalized = String(status || "PENDING").toUpperCase();
  const connected = normalized === "CONNECTED";
  const failed = normalized === "FAILED";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${
        connected
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
          : failed
            ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          connected ? "bg-emerald-500" : failed ? "bg-red-500" : "bg-amber-500"
        }`}
      />
      {connected ? "Connected" : failed ? "Failed" : normalized}
    </span>
  );
}

function TypeBadge({ type }) {
  const style = typeStyle(type);
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${style.badge}`}>
      {type || "ERP"}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    danger: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/35 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-[var(--text-primary)]">{value}</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{helper}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.brand}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      {Icon && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-sunken)] text-[var(--text-secondary)]">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
        {description && <p className="mt-0.5 text-xs leading-5 text-[var(--text-secondary)]">{description}</p>}
      </div>
    </div>
  );
}

function DetailItem({ label, value, wide = false, mono = false }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3.5 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">{label}</p>
      <p className={`break-all text-[13px] font-semibold ${mono ? "font-mono text-[12px]" : ""} ${empty ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
        {empty ? "Not configured" : String(value)}
      </p>
    </div>
  );
}

function ConfigState({ label, configured, icon: Icon = Settings2 }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3.5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-sunken)] text-[var(--text-secondary)]">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="truncate text-xs font-semibold text-[var(--text-primary)]">{label}</span>
      </div>
      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${configured ? "text-emerald-600" : "text-[var(--text-secondary)]"}`}>
        {configured ? "Configured" : "Not configured"}
      </span>
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[92vh] w-full ${wide ? "max-w-6xl" : "max-w-xl"} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-950`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-slate-900 dark:text-white">{title}</h2>
            {subtitle && <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto bg-white dark:bg-slate-950">{children}</div>
      </div>
    </div>
  );
}

function InfoModal({ onClose }) {
  return (
    <ModalShell title="ERP Integration Center" subtitle="Enterprise connection management for this e-Vault tenant" onClose={onClose}>
      <div className="space-y-5 p-5 sm:p-6">
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-500/20 dark:bg-brand-500/10">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-brand-400">
              <Network className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Tenant-scoped enterprise integrations</p>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                ERP connections assigned to this tenant can be monitored, tested and used for synchronization without exposing protected credentials.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            [Eye, "View configuration", "Open any ERP to inspect its connection, security and metadata state."],
            [Wifi, "Test connection", "Validate the configured enterprise connection and refresh its status."],
            [Database, "SAP synchronization", "SAP connections open the dedicated synchronization workspace."],
            [Layers3, "Generic ERP sync", "Supported non-SAP connectors expose Categories and Document Types sync."],
          ].map(([Icon, title, description]) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <p className="mt-3 text-xs font-bold text-slate-900 dark:text-white">{title}</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{description}</p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-[11px] leading-5 text-emerald-700 dark:text-emerald-400">
            Security policy: passwords, API keys and inbound passwords are never displayed. The UI only shows whether protected credentials are configured.
          </p>
        </div>
      </div>
    </ModalShell>
  );
}

function ErpDetailsModal({
  connection,
  onClose,
  onTest,
  onSync,
  testingId,
  syncingKey,
  onOpenSapModule,
}) {
  const detail = connection;
  const isSap = normalize(detail.erpType) === "sap";
  const isOutbound = normalize(detail.integrationMode) === "outbound";
  const isTesting = testingId === detail.erpConfigId;

  return (
    <ModalShell
      wide
      onClose={onClose}
      title={detail.name || `ERP #${detail.erpConfigId}`}
      subtitle={`${detail.erpType || "ERP"} • ERP ID #${detail.erpConfigId}`}
    >
      <div className="bg-white dark:bg-slate-950">
        {/* Identity strip */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${typeStyle(detail.erpType).icon}`}>
                <Server className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-bold text-slate-900 dark:text-white">{detail.name || `ERP #${detail.erpConfigId}`}</h3>
                  <TypeBadge type={detail.erpType} />
                  <StatusBadge status={detail.status} />
                  {detail.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                      <Star className="h-3 w-3 fill-current" /> Default
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Connection ID #{detail.erpConfigId} · {detail.isActive ? "Active connection" : "Inactive connection"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                {detail.integrationMode || "Standard"}
              </span>
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                {detail.protocol || "Protocol unavailable"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-7 p-5 sm:p-6">
          {detail.description && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Description</p>
              <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{detail.description}</p>
            </div>
          )}

          {/* Connection */}
          <section>
            <SectionHeader icon={Plug} title="Connection" description="Core endpoint and protocol settings for this enterprise integration." />
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="ERP Name" value={detail.name} />
              <DetailItem label="ERP Type" value={detail.erpType} />
              <DetailItem label="Protocol" value={detail.protocol} />
              <DetailItem label="Integration Mode" value={detail.integrationMode} />
              <DetailItem label="Authentication" value={detail.authType} />
              <DetailItem label="Username" value={detail.username} />
              {isSap && <DetailItem label="SAP Client" value={detail.sapClient} />}
              {isSap && <DetailItem label="OData Version" value={detail.odataVersion} />}
              <DetailItem label="Base URL" value={detail.baseUrl} wide mono />
              {detail.metadataUrl && <DetailItem label="Metadata URL" value={detail.metadataUrl} wide mono />}
            </div>
          </section>

          {/* Security */}
          <section>
            <SectionHeader icon={ShieldCheck} title="Security" description="Protected credentials are represented by configuration status only." />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ConfigState label="Outbound Password" configured={detail.passwordConfigured} icon={KeyRound} />
              <ConfigState label="API Key" configured={detail.apiKeyConfigured} icon={LockKeyhole} />
              {!isOutbound && (
                <>
                  <ConfigState label="Inbound Username" configured={Boolean(detail.inboundUsername)} icon={UserRound} />
                  <ConfigState label="Inbound Password" configured={detail.inboundPasswordConfigured} icon={KeyRound} />
                </>
              )}
            </div>
            <p className="mt-3 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
              Credential values are intentionally hidden from the Tenant Admin interface.
            </p>
          </section>

          {/* Advanced configuration */}
          <section>
            <SectionHeader icon={Settings2} title="Configuration" description="Mapping and connector capabilities available for this ERP." />
            <div className="grid gap-3 sm:grid-cols-2">
              <ConfigState label="Connector Configuration" configured={detail.connectorConfigConfigured} />
              <ConfigState label="Entity Set Mapping" configured={detail.entitySetMapConfigured} />
              <ConfigState label="Field Mapping" configured={detail.fieldMapConfigured} />
              <ConfigState label="Function Mapping" configured={detail.functionMapConfigured} />
            </div>
          </section>

          {/* Metadata */}
          <section>
            <SectionHeader icon={Activity} title="Metadata & Activity" description="Lifecycle and metadata state for this connection." />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Metadata</p>
                <p className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                  {detail.metadataFetchedAt ? "Fetched" : "Not fetched"}
                </p>
                {detail.metadataFetchedAt && <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{formatDate(detail.metadataFetchedAt)}</p>}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Metadata Snapshot</p>
                <p className={`mt-2 text-xs font-bold ${detail.metadataSnapshotConfigured ? "text-emerald-600" : "text-slate-700 dark:text-slate-300"}`}>
                  {detail.metadataSnapshotConfigured ? "Available" : "Not available"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Connection State</p>
                <p className={`mt-2 text-xs font-bold ${detail.isActive ? "text-emerald-600" : "text-slate-600"}`}>
                  {detail.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <DetailItem label="Created At" value={formatDate(detail.createdAt)} />
              <DetailItem label="Last Updated" value={formatDate(detail.updatedAt)} />
            </div>
          </section>

          {/* Actions */}
          <section className="border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Connection actions</p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Run a connection check or continue to the appropriate synchronization workspace.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AppButton
                  variant="secondary"
                  size="sm"
                  icon={isTesting ? RefreshCw : Wifi}
                  loading={isTesting}
                  onClick={() => onTest(detail)}
                >
                  Test Connection
                </AppButton>
                {isSap ? (
                  <AppButton variant="primary" size="sm" icon={ArrowUpRight} onClick={onOpenSapModule}>
                    SAP Synchronization
                  </AppButton>
                ) : (
                  <>
                    <AppButton
                      variant="secondary"
                      size="sm"
                      icon={FolderTree}
                      loading={syncingKey === `${detail.erpConfigId}:CATEGORY`}
                      onClick={() => onSync(detail, "CATEGORY")}
                    >
                      Categories
                    </AppButton>
                    <AppButton
                      variant="secondary"
                      size="sm"
                      icon={Tags}
                      loading={syncingKey === `${detail.erpConfigId}:DOCUMENT_TYPE`}
                      onClick={() => onSync(detail, "DOCUMENT_TYPE")}
                    >
                      Document Types
                    </AppButton>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </ModalShell>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Database className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">No ERP connections found</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
        {hasFilters ? "No ERP matches the current search or filters." : "No active ERP connection is currently assigned to this tenant."}
      </p>
      {hasFilters && (
        <button type="button" onClick={onClear} className="mt-4 text-xs font-bold text-brand-600 hover:underline dark:text-brand-400">
          Clear filters
        </button>
      )}
    </div>
  );
}

export default function ErpIntegrationPage({ onNavigate }) {
  const { toast } = useToast();

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [syncingKey, setSyncingKey] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ErpIntegrationApi.listConnections();
      setConnections(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setError(e.message || "Unable to load ERP connections.");
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleTest(connection) {
    setTestingId(connection.erpConfigId);
    try {
      await ErpIntegrationApi.testConnection(connection.erpConfigId);
      toast({
        title: `${connection.name || "ERP"} connected`,
        description: "Connection test completed successfully.",
        tone: "success",
      });
      await load();
      setSelected((prev) =>
        prev?.erpConfigId === connection.erpConfigId ? { ...prev, status: "CONNECTED" } : prev,
      );
    } catch (e) {
      toast({
        title: "Connection test failed",
        description: e.message || "Unable to test this ERP connection.",
        tone: "error",
      });
      await load();
    } finally {
      setTestingId(null);
    }
  }

  async function handleSync(connection, entity) {
    const key = `${connection.erpConfigId}:${entity}`;
    setSyncingKey(key);
    try {
      const res = await ErpIntegrationApi.syncEntity(connection.erpConfigId, entity);
      const data = res?.data || {};
      toast({
        title: entity === "CATEGORY" ? "Categories sync finished" : "Document Types sync finished",
        description: `${data.created || 0} created, ${data.updated || 0} updated, ${data.failed || 0} failed`,
        tone: data.status === "FAILED" ? "error" : "success",
      });
    } catch (e) {
      toast({
        title: "Sync failed",
        description: e.message || "Unable to synchronize ERP data.",
        tone: "error",
      });
    } finally {
      setSyncingKey(null);
    }
  }

  const types = useMemo(
    () => ["ALL", ...Array.from(new Set(connections.map((c) => c.erpType).filter(Boolean))).sort()],
    [connections],
  );

  const filtered = useMemo(() => {
    const q = normalize(search);

    return connections.filter((connection) => {
      const matchesSearch =
        !q ||
        [
          connection.name,
          connection.erpType,
          connection.protocol,
          connection.integrationMode,
          connection.baseUrl,
          connection.username,
          String(connection.erpConfigId),
        ].some((value) => normalize(value).includes(q));

      const matchesType = typeFilter === "ALL" || connection.erpType === typeFilter;
      const matchesStatus = statusFilter === "ALL" || connection.status === statusFilter;
      const matchesView =
        viewMode === "all" ||
        (viewMode === "default" && connection.isDefault) ||
        (viewMode === "attention" && connection.status === "FAILED");

      return matchesSearch && matchesType && matchesStatus && matchesView;
    });
  }, [connections, search, typeFilter, statusFilter, viewMode]);

  const total = connections.length;
  const connected = connections.filter((c) => c.status === "CONNECTED").length;
  const failed = connections.filter((c) => c.status === "FAILED").length;
  const active = connections.filter((c) => c.isActive).length;
  const defaults = connections.filter((c) => c.isDefault).length;
  const connectedRate = total ? Math.round((connected / total) * 100) : 0;
  const defaultConnection = connections.find((c) => c.isDefault);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setViewMode("all");
  };

  return (
     <div className="space-y-5">

    <AppCard>
      {/* Premium page header */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--surface)]">
        <div className="mx-auto max-w-[1600px] px-5 py-6 md:px-7 lg:px-9">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                <span>Configuration</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-[var(--text-primary)]">ERP Integrations</span>
              </div>

              <div className="flex items-start gap-4">
                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 sm:flex">
                  <Network className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-[28px]">
                      ERP Integrations
                    </h1>
                    <button
                      type="button"
                      onClick={() => setShowInfo(true)}
                      title="About ERP Integrations"
                      aria-label="About ERP Integrations"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-brand-600"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[var(--text-secondary)] md:text-sm">
                    Centralized control center for enterprise systems connected to your e-Vault tenant.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {connectedRate}% connection health
                    </span>
                    <span className="text-[var(--text-secondary)]">•</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {active} active integration{active === 1 ? "" : "s"}
                    </span>
                    {defaultConnection && (
                      <>
                        <span className="text-[var(--text-secondary)]">•</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                          <Star className="h-3 w-3 fill-current" />
                          Default: {defaultConnection.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 sm:inline-flex">
                <ShieldCheck className="h-3.5 w-3.5" />
                Tenant Scoped
              </span>
              <AppButton variant="secondary" size="sm" icon={RefreshCw} onClick={load} loading={loading}>
                Refresh
              </AppButton>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] space-y-6 px-5 py-6 md:px-7 lg:px-9 lg:py-7">
        {loading && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="h-96 animate-pulse rounded-2xl bg-[var(--surface-sunken)]" />
          </>
        )}

        {!loading && error && (
          <AppCard className="overflow-hidden rounded-2xl">
            <div className="flex items-start gap-4 p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <WifiOff className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Unable to load ERP connections</h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{error}</p>
                <div className="mt-4">
                  <AppButton variant="secondary" size="sm" icon={RefreshCw} onClick={load}>
                    Try Again
                  </AppButton>
                </div>
              </div>
            </div>
          </AppCard>
        )}

        {!loading && !error && (
          <>
            {/* Executive overview */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={Database} label="Total Connections" value={total} helper="ERP connections assigned" tone="brand" />
              <MetricCard icon={CheckCircle2} label="Connected" value={connected} helper={`${connectedRate}% healthy`} tone="success" />
              <MetricCard icon={Layers3} label="Active" value={active} helper={`${defaults} default connection${defaults === 1 ? "" : "s"}`} tone="neutral" />
              <MetricCard icon={AlertCircle} label="Attention" value={failed} helper={failed ? "Requires review" : "No failed connections"} tone={failed ? "danger" : "success"} />
            </section>

            {/* Default connection spotlight */}
            {defaultConnection && (
              <section className="overflow-hidden rounded-2xl border border-brand-200 bg-brand-50/70 dark:border-brand-500/20 dark:bg-brand-500/5">
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-brand-400">
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-brand-700 dark:text-brand-400">Tenant default ERP</span>
                        <StatusBadge status={defaultConnection.status} />
                      </div>
                      <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">{defaultConnection.name}</p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-600 dark:text-slate-300">
                        {defaultConnection.erpType || "ERP"} · {defaultConnection.protocol || "Protocol unavailable"} · {defaultConnection.integrationMode || "Standard"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(defaultConnection)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-3.5 py-2.5 text-[11px] font-bold text-brand-700 shadow-sm hover:bg-brand-50 dark:border-brand-500/20 dark:bg-slate-950 dark:text-brand-400 dark:hover:bg-slate-900"
                  >
                    View default ERP
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </section>
            )}

            {/* Enterprise connection registry */}
            <section className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-sm">
              <div className="border-b border-[var(--border-subtle)] px-5 py-5 lg:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-[var(--text-primary)]">Enterprise Connection Registry</h2>
                      <span className="rounded-full bg-[var(--surface-sunken)] px-2 py-0.5 text-[9px] font-bold text-[var(--text-secondary)]">
                        {filtered.length} / {total}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      Manage multiple ERP connections from one scalable workspace.
                    </p>
                  </div>

                  <div className="flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-1">
                    {[
                      ["all", "All"],
                      ["default", "Default"],
                      ["attention", "Attention"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setViewMode(value)}
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${
                          viewMode === value
                            ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search / filter toolbar */}
              <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-sunken)]/45 p-4 lg:px-5">
                <div className="grid gap-2.5 lg:grid-cols-[minmax(280px,1fr)_170px_170px_auto]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search name, ERP type, URL, protocol or ID..."
                      className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] pl-9 pr-3 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10"
                    />
                  </div>

                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--text-primary)] outline-none"
                  >
                    <option value="ALL">All ERP Types</option>
                    {types.filter((type) => type !== "ALL").map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--text-primary)] outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="CONNECTED">Connected</option>
                    <option value="FAILED">Failed</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-[10px] font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  hasFilters={Boolean(search || typeFilter !== "ALL" || statusFilter !== "ALL" || viewMode !== "all")}
                  onClear={clearFilters}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px] text-left">
                    <thead className="bg-[var(--surface-sunken)]">
                      <tr className="border-b border-[var(--border-subtle)] text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                        <th className="px-5 py-3.5">Enterprise System</th>
                        <th className="px-4 py-3.5">Type</th>
                        <th className="px-4 py-3.5">Connection</th>
                        <th className="px-4 py-3.5">Integration</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5">Last Updated</th>
                        <th className="px-4 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((connection) => {
                        const style = typeStyle(connection.erpType);
                        return (
                          <tr
                            key={connection.erpConfigId}
                            onClick={() => setSelected(connection)}
                            className="group cursor-pointer border-b border-[var(--border-subtle)] last:border-0 hover:bg-brand-50/35 dark:hover:bg-brand-500/5"
                          >
                            <td className="px-5 py-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}>
                                  <Server className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-xs font-bold text-[var(--text-primary)]">{connection.name || `ERP #${connection.erpConfigId}`}</p>
                                    {connection.isDefault && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                                  </div>
                                  <p className="mt-1 truncate text-[10px] text-[var(--text-secondary)]">ERP ID #{connection.erpConfigId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4"><TypeBadge type={connection.erpType} /></td>
                            <td className="px-4 py-4">
                              <div>
                                <p className="text-xs font-semibold text-[var(--text-primary)]">{connection.protocol || "—"}</p>
                                <p className="mt-0.5 max-w-[220px] truncate text-[10px] text-[var(--text-secondary)]">{connection.baseUrl || "Base URL not configured"}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                                {connection.integrationMode || "Standard"}
                              </span>
                            </td>
                            <td className="px-4 py-4"><StatusBadge status={connection.status} /></td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Clock3 className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                                <span className="text-[10px] font-medium text-[var(--text-secondary)]">{compactDate(connection.updatedAt)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelected(connection);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-[10px] font-bold text-[var(--text-primary)] shadow-sm hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 dark:hover:border-brand-500/20 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-sunken)]/30 px-5 py-3.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    Showing {filtered.length} of {total} tenant ERP connection{total === 1 ? "" : "s"}.
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Failed</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pending</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Security footer */}
            <section className="flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Enterprise security boundary</p>
                <p className="mt-0.5 text-[11px] leading-5 text-[var(--text-secondary)]">
                  ERP credentials remain protected. Tenant Admins can inspect configuration state without viewing password, API key or secret values.
                </p>
              </div>
            </section>
          </>
        )}
      </main>
      </AppCard>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}

      {selected && (
        <ErpDetailsModal
          connection={selected}
          onClose={() => setSelected(null)}
          onTest={handleTest}
          onSync={handleSync}
          testingId={testingId}
          syncingKey={syncingKey}
          onOpenSapModule={() => {
            setSelected(null);
            if (onNavigate) onNavigate("SAP_SYNC_DASHBOARD");
          }}
        />
      )}
    </div>
  );
}
