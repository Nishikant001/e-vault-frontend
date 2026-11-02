// src/features/sapSync/pages/SettingsPage.jsx

import { useEffect, useState } from "react";
import {
  Save,
  Wifi,
  Info,
  Sparkles,
  SlidersHorizontal,
  RefreshCcw,
  Shuffle,
  Wand2,
  Clock,
  FileStack,
  Layers,
  Database,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";

import AppCard, { CardHeader } from "../../../components/ui/Card";
import AppButton from "../../../components/ui/Button";
import AppInput from "../../../components/ui/Input";
import AppSelect from "../../../components/ui/Select";
import { SkeletonText } from "../../../components/ui/Skeleton";
import AppModal from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";

import { SapSyncApi } from "../api";
import { useSapErpConnections } from "../hooks/useSapErpConnections";
import ErpConnectionSelect from "../components/ErpConnectionSelect";

const DUPLICATE_STRATEGIES = [
  {
    value: "SKIP",
    label: "Skip — leave the existing record untouched",
  },
  {
    value: "OVERWRITE",
    label: "Overwrite — replace with the incoming ERP record",
  },
  {
    value: "VERSION",
    label: "Version — keep both, flagged as a new version",
  },
];

const CLASSIFICATION_RULES = [
  {
    value: "HOLD_FOR_MANUAL",
    label: "Hold for manual mapping (recommended)",
  },
  {
    value: "AUTO_ASSIGN_DEFAULT",
    label: "Auto-assign a default classification",
  },
  {
    value: "SKIP",
    label: "Skip the record entirely",
  },
];

/* ---------- small building blocks ---------- */

function SectionHeading({ icon: Icon, title, hint }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[#2563EB]">
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <p className="font-mono text-[13px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
          {title}
        </p>

        {hint && (
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/40 px-4 py-3 transition-colors hover:border-[#2563EB]/40">
      <span>
        <span className="block text-sm font-medium text-[var(--text-primary)]">
          {label}
        </span>

        {hint && (
          <span className="mt-0.5 block text-xs text-[var(--text-tertiary)]">
            {hint}
          </span>
        )}
      </span>

      <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />

        <span className="h-6 w-11 rounded-full bg-[var(--surface-sunken)] transition-colors peer-checked:bg-[#2563EB]" />

        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/* ---------- ERP configuration ---------- */

function ErpConfigurationCard({
  connections,
  loading,
  settingDefaultId,
  onSetDefault,
}) {
  if (loading) {
    return (
      <AppCard>
        <SkeletonText lines={6} />
      </AppCard>
    );
  }

  const activeConnections = Array.isArray(connections)
    ? connections.filter((connection) => connection.isActive !== false)
    : [];

  const defaultConnection =
    activeConnections.find((connection) => connection.isDefault) || null;

  const getTypeLabel = (erpType) => {
    const value = String(erpType || "CUSTOM").toUpperCase();

    if (value === "SAP") return "SAP";
    if (value === "ORACLE") return "ORACLE";

    return "CUSTOM";
  };

  return (
    <AppCard>
      <SectionHeading
        icon={Database}
        title="ERP Configuration"
        hint="Manage the ERP connections assigned to this tenant and select the tenant-wide default ERP."
      />

      {activeConnections.length === 0 ? (
        <div className="rounded-app-md border border-dashed border-[var(--border-subtle)] bg-[var(--surface-sunken)]/40 px-4 py-6 text-center">
          <AlertCircle className="mx-auto h-5 w-5 text-[var(--text-tertiary)]" />

          <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
            No active ERP connections
          </p>

          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Ask the Super Admin to assign an ERP connection to this tenant.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-app-md border border-[var(--border-subtle)]">
            <div className="divide-y divide-[var(--border-subtle)]">
              {activeConnections.map((connection) => {
                const isDefault = !!connection.isDefault;
                const isSettingDefault =
                  settingDefaultId === connection.erpConfigId;

                return (
                  <div
                    key={connection.erpConfigId}
                    className={`flex flex-col gap-4 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                      isDefault
                        ? "bg-[#2563EB]/[0.04]"
                        : "bg-transparent hover:bg-[var(--surface-sunken)]/40"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isDefault
                            ? "bg-[#2563EB]/10 text-[#2563EB]"
                            : "bg-[var(--surface-sunken)] text-[var(--text-tertiary)]"
                        }`}
                      >
                        {isDefault ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {connection.name || "Unnamed ERP"}
                          </p>

                          {isDefault && (
                            <span className="inline-flex items-center rounded-full bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2563EB]">
                              Default
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">
                          <span>
                            {getTypeLabel(connection.erpType)}
                          </span>

                          <span>·</span>

                          <span>
                            {connection.integrationMode || "BOTH"}
                          </span>

                          {connection.status && (
                            <>
                              <span>·</span>
                              <span>{connection.status}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center">
                      {isDefault ? (
                        <div className="inline-flex items-center gap-2 rounded-app-md border border-[#2563EB]/20 bg-[#2563EB]/5 px-3 py-2 text-xs font-medium text-[#2563EB]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Tenant Default
                        </div>
                      ) : (
                        <AppButton
                          type="button"
                          variant="secondary"
                          size="sm"
                          loading={isSettingDefault}
                          onClick={() =>
                            onSetDefault(connection.erpConfigId)
                          }
                        >
                          Set Default
                        </AppButton>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-app-md border border-blue-200 bg-blue-50/60 px-3 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />

            <div>
              <p className="text-xs font-medium text-[#1D4ED8]">
                Tenant-wide default ERP
              </p>

              <p className="mt-0.5 text-xs leading-relaxed text-[#1E40AF]/80">
                Only one ERP connection can be the default for this tenant.
                The selected default is shared with Super Admin.
              </p>

              {defaultConnection && (
                <p className="mt-1 text-[11px] text-[#1E40AF]/70">
                  Current default:{" "}
                  <span className="font-semibold">
                    {defaultConnection.name}
                  </span>
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </AppCard>
  );
}

/* ---------- page ---------- */

export default function SettingsPage() {
  const { toast } = useToast();

  /*
   * MULTI-ERP CONTEXT
   *
   * The tenant may have multiple ERP connections.
   * The connection test below always targets the explicitly selected ERP.
   * The tenant default ERP remains separate from the active test selection.
   */
  const {
    connections,
    loadingConnections,
    selectedErpConfigId,
    setSelectedErpConfigId,
    erpConfigIdForRequest,
    showSelector,
  } = useSapErpConnections();

  const [settings, setSettings] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [showGuide, setShowGuide] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState(null);
  // null | "success" | "error"

  const [erpConnections, setErpConnections] = useState([]);
  const [loadingErpConnections, setLoadingErpConnections] = useState(true);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  const load = () => {
    setLoading(true);

    SapSyncApi.getSettings()
      .then((res) => setSettings(res.data))
      .catch((e) =>
        toast({
          title: "Could not load settings",
          description: e.message,
          tone: "error",
        })
      )
      .finally(() => setLoading(false));
  };

  const loadErpConnections = () => {
    setLoadingErpConnections(true);

    SapSyncApi.listErpConnections()
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        setErpConnections(list);
      })
      .catch((e) => {
        toast({
          title: "Could not load ERP connections",
          description: e.message,
          tone: "error",
        });
      })
      .finally(() => setLoadingErpConnections(false));
  };

  useEffect(() => {
    load();
    loadErpConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set(field, value) {
    setSettings((s) => ({ ...s, [field]: value }));
  }

  async function save() {
    setSaving(true);

    try {
      const res = await SapSyncApi.updateSettings({
        autoSyncEnabled: settings.autoSyncEnabled,
        retryCount: Number(settings.retryCount),
        batchSize: Number(settings.batchSize),
        parallelJobs: Number(settings.parallelJobs),
        importOnlyHasOriginal: settings.importOnlyHasOriginal,
        pendingClassificationRule: settings.pendingClassificationRule,
        duplicateStrategy: settings.duplicateStrategy,
        syncIntervalMinutes: Number(settings.syncIntervalMinutes),
      });

      setSettings(res.data);

      toast({
        title: "Settings saved",
        tone: "success",
      });
    } catch (e) {
      toast({
        title: "Save Settings failed",
        description: e.message,
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    /*
     * If multiple ERP connections exist, never silently test the
     * tenant default ERP. Test only the ERP explicitly selected here.
     *
     * For a single-ERP tenant, erpConfigIdForRequest may be undefined
     * and the existing backend fallback remains available.
     */
    if (showSelector && !erpConfigIdForRequest) {
      toast({
        title: "Select an ERP connection",
        description:
          "Please select the ERP connection you want to test.",
        tone: "error",
      });
      return;
    }

    setTesting(true);
    setConnectionStatus(null);

    try {
      const res = await SapSyncApi.testConnection(
        erpConfigIdForRequest
      );

      setConnectionStatus("success");

      toast({
        title: "Connection successful",
        description:
          res.data?.erpConfigName ||
          res.data?.name ||
          "The selected ERP connection is reachable.",
        tone: "success",
      });
    } catch (e) {
      setConnectionStatus("error");

      toast({
        title: "Connection test failed",
        description: e.message,
        tone: "error",
      });
    } finally {
      setTesting(false);
    }
  }

  async function setDefaultErp(erpConfigId) {
    if (
      erpConfigId === undefined ||
      erpConfigId === null ||
      erpConfigId === ""
    ) {
      return;
    }

    setSettingDefaultId(Number(erpConfigId));

    try {
      const res = await SapSyncApi.setDefaultErpConnection(
        Number(erpConfigId)
      );

      const updated = res?.data;

      setErpConnections((current) =>
        current.map((connection) => ({
          ...connection,
          isDefault:
            Number(connection.erpConfigId) === Number(erpConfigId),
        }))
      );

      toast({
        title: "Default ERP updated",
        description:
          updated?.name
            ? `${updated.name} is now the tenant default ERP.`
            : "The tenant default ERP has been updated.",
        tone: "success",
      });
    } catch (e) {
      toast({
        title: "Could not update default ERP",
        description: e.message,
        tone: "error",
      });
    } finally {
      setSettingDefaultId(null);
    }
  }

  if (loading || !settings) {
    return (
      <AppCard>
        <SkeletonText lines={8} />
      </AppCard>
    );
  }

  return (
    <div className="space-y-4">
      <SettingsGuideModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
      />

      {/* header strip */}
      <AppCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              {settings.autoSyncEnabled && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2563EB] opacity-75" />
              )}

              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  settings.autoSyncEnabled
                    ? "bg-[#2563EB]"
                    : "bg-[var(--text-tertiary)]"
                }`}
              />
            </span>

            <div>
              <span className="inline-flex items-center gap-2">
                <span className="font-mono text-lg font-bold tracking-tight text-[var(--text-primary)]">
                  ERP Sync Settings
                </span>

                <button
                  type="button"
                  onClick={() => setShowGuide(true)}
                  aria-label="View Settings guide"
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-white transition-colors hover:bg-[#3B82F6]"
                >
                  <Info className="h-3 w-3" />
                </button>
              </span>

              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                Scheduler is{" "}
                <span
                  className={
                    settings.autoSyncEnabled
                      ? "text-[#2563EB]"
                      : "text-[var(--text-tertiary)]"
                  }
                >
                  {settings.autoSyncEnabled ? "active" : "paused"}
                </span>{" "}
                for this tenant · configure sync, filters, and conflict
                handling below.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {showSelector && (
              <ErpConnectionSelect
                connections={connections}
                value={selectedErpConfigId}
                onChange={(value) => {
                  setSelectedErpConfigId(value);
                  setConnectionStatus(null);
                }}
                disabled={loadingConnections || testing}
                className="min-w-[230px]"
              />
            )}

            <AppButton
              variant="secondary"
              size="sm"
              icon={Wifi}
              loading={testing}
              disabled={
                loadingConnections ||
                testing ||
                (showSelector && !selectedErpConfigId)
              }
              onClick={testConnection}
              className={
                connectionStatus === "success"
                  ? "!border-green-500 !text-green-600 !bg-green-50"
                  : connectionStatus === "error"
                  ? "!border-red-500 !text-red-600 !bg-red-50"
                  : ""
              }
            >
              Connection Test
            </AppButton>
          </div>
        </div>
      </AppCard>

      {/* ERP configuration */}
      <ErpConfigurationCard
        connections={erpConnections}
        loading={loadingErpConnections}
        settingDefaultId={settingDefaultId}
        onSetDefault={setDefaultErp}
      />

      {showSelector && (
        <AppCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />

              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Active ERP for Connection Test
                </p>

                <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                  The Connection Test above checks only the ERP selected
                  here. Changing the selection does not change the tenant
                  default ERP.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center rounded-full border border-[#2563EB]/20 bg-[#2563EB]/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2563EB]">
              ERP ID: {selectedErpConfigId || "—"}
            </span>
          </div>
        </AppCard>
      )}

      {/* scheduler & filters */}
      <AppCard>
        <SectionHeading
          icon={RefreshCcw}
          title="Scheduler & Import Filters"
          hint="Control whether jobs fire automatically and which ERP records are eligible for import."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle
            checked={settings.autoSyncEnabled}
            onChange={(v) => set("autoSyncEnabled", v)}
            label="Enable Scheduler"
            hint="Off = only manual triggers from Dashboard, Master Sync, and Document Sync run."
          />

          <Toggle
            checked={settings.importOnlyHasOriginal}
            onChange={(v) => set("importOnlyHasOriginal", v)}
            label="Import Only HasOriginal"
            hint="Only import ERP documents where HasOriginal = 'X'."
          />
        </div>
      </AppCard>

      {/* batch behavior */}
      <AppCard>
        <SectionHeading
          icon={Layers}
          title="Batch & Concurrency"
          hint="How aggressively sync jobs pull and process records for this tenant."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <AppInput
            label="Retry Count"
            type="number"
            min={0}
            max={20}
            value={settings.retryCount}
            onChange={(e) => set("retryCount", e.target.value)}
            hint="Max attempts before a record is abandoned."
          />

          <AppInput
            label="Batch Size"
            type="number"
            min={1}
            max={500}
            value={settings.batchSize}
            onChange={(e) => set("batchSize", e.target.value)}
            hint="Records per ERP OData page."
          />

          <AppInput
            label="Parallel Jobs"
            type="number"
            min={1}
            max={5}
            value={settings.parallelJobs}
            onChange={(e) => set("parallelJobs", e.target.value)}
            hint="Concurrent sync jobs for this tenant."
          />

          <AppInput
            label="Sync Interval (min)"
            type="number"
            min={5}
            value={settings.syncIntervalMinutes}
            onChange={(e) =>
              set("syncIntervalMinutes", e.target.value)
            }
            hint="Reference only — actual timing lives in Scheduler Management."
          />
        </div>
      </AppCard>

      {/* classification & duplicates */}
      <AppCard>
        <SectionHeading
          icon={Shuffle}
          title="Classification & Duplicates"
          hint="Decide what happens to unmapped and conflicting records."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <AppSelect
            label="Pending Classification Rule"
            value={settings.pendingClassificationRule}
            onChange={(e) =>
              set("pendingClassificationRule", e.target.value)
            }
          >
            {CLASSIFICATION_RULES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </AppSelect>

          <AppSelect
            label="Duplicate Strategy"
            value={settings.duplicateStrategy}
            onChange={(e) =>
              set("duplicateStrategy", e.target.value)
            }
          >
            {DUPLICATE_STRATEGIES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </AppSelect>
        </div>

        <div className="mt-6 flex justify-end border-t border-[var(--border-subtle)] pt-4">
          <AppButton icon={Save} loading={saving} onClick={save}>
            Save Settings
          </AppButton>
        </div>
      </AppCard>
    </div>
  );
}

/* ---------- guide modal ---------- */

function SettingsGuideModal({ open, onClose }) {
  const steps = [
    {
      icon: RefreshCcw,
      title: "Enable Scheduler",
      desc: "Toggle this on to let scheduled jobs run automatically. When off, only manual triggers from Dashboard, Master Sync, and Document Sync will run.",
    },
    {
      icon: Wand2,
      title: "Import Only HasOriginal",
      desc: "Toggle this on to only import ERP documents where HasOriginal = 'X', matching the module's DocumentMetaSet filter.",
    },
    {
      icon: SlidersHorizontal,
      title: "Tune batch behavior",
      desc: "Set Retry Count, Batch Size, Parallel Jobs, and Sync Interval to control how sync jobs process records for this tenant.",
    },
    {
      icon: FileStack,
      title: "Handle duplicates & pending items",
      desc: "Choose how unmapped classifications and duplicate records are handled using the Pending Classification Rule and Duplicate Strategy dropdowns.",
    },
    {
      icon: Wifi,
      title: "Test the connection",
      desc: "Select the ERP connection first when multiple ERPs are assigned, then click Connection Test to verify that specific ERP connection. The tenant default ERP is not silently used when another ERP is selected.",
    },
    {
      icon: Save,
      title: "Save your changes",
      desc: "Click Save Settings to persist all changes for this tenant.",
    },
  ];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#2563EB]" />
          ERP Sync Settings — Guide
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
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#2563EB]/10 text-[#2563EB]">
              <s.icon className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {i + 1}. {s.title}
              </p>

              <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-tertiary)]">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </AppModal>
  );
}