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
} from "lucide-react";
import AppCard, { CardHeader } from "../../../components/ui/Card";
import AppButton from "../../../components/ui/Button";
import AppInput from "../../../components/ui/Input";
import AppSelect from "../../../components/ui/Select";
import { SkeletonText } from "../../../components/ui/Skeleton";
import AppModal from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import { SapSyncApi } from "../api";

const DUPLICATE_STRATEGIES = [
  { value: "SKIP", label: "Skip — leave the existing record untouched" },
  { value: "OVERWRITE", label: "Overwrite — replace with the incoming SAP record" },
  { value: "VERSION", label: "Version — keep both, flagged as a new version" },
];

const CLASSIFICATION_RULES = [
  { value: "HOLD_FOR_MANUAL", label: "Hold for manual mapping (recommended)" },
  { value: "AUTO_ASSIGN_DEFAULT", label: "Auto-assign a default classification" },
  { value: "SKIP", label: "Skip the record entirely" },
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
        {hint && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{hint}</p>}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/40 px-4 py-3 transition-colors hover:border-[#2563EB]/40">
      <span>
        <span className="block text-sm font-medium text-[var(--text-primary)]">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-[var(--text-tertiary)]">{hint}</span>}
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

/* ---------- page ---------- */

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null); // null | "success" | "error"

  const load = () => {
    setLoading(true);
    SapSyncApi.getSettings()
      .then((res) => setSettings(res.data))
      .catch((e) => toast({ title: "Could not load settings", description: e.message, tone: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line

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
      toast({ title: "Settings saved", tone: "success" });
    } catch (e) {
      toast({ title: "Save Settings failed", description: e.message, tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    try {
      const res = await SapSyncApi.testConnection();
      setConnectionStatus("success");
      toast({ title: "Connection successful", description: res.data?.erpConfigName, tone: "success" });
    } catch (e) {
      setConnectionStatus("error");
      toast({ title: "Connection test failed", description: e.message, tone: "error" });
    } finally {
      setTesting(false);
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
      <SettingsGuideModal open={showGuide} onClose={() => setShowGuide(false)} />

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
                  settings.autoSyncEnabled ? "bg-[#2563EB]" : "bg-[var(--text-tertiary)]"
                }`}
              />
            </span>
            <div>
              <span className="inline-flex items-center gap-2">
                <span className="font-mono text-lg font-bold tracking-tight text-[var(--text-primary)]">
                  SAP Sync Settings
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
                <span className={settings.autoSyncEnabled ? "text-[#2563EB]" : "text-[var(--text-tertiary)]"}>
                  {settings.autoSyncEnabled ? "active" : "paused"}
                </span>{" "}
                for this tenant · configure sync, filters, and conflict handling below.
              </p>
            </div>
          </div>

          <AppButton
            variant="secondary"
            size="sm"
            icon={Wifi}
            loading={testing}
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
      </AppCard>

      {/* scheduler & filters */}
      <AppCard>
        <SectionHeading
          icon={RefreshCcw}
          title="Scheduler & Import Filters"
          hint="Control whether jobs fire automatically and which SAP records are eligible for import."
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
            hint="Only import SAP documents where HasOriginal = 'X'."
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
            hint="Records per SAP OData page."
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
            onChange={(e) => set("syncIntervalMinutes", e.target.value)}
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
            onChange={(e) => set("pendingClassificationRule", e.target.value)}
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
            onChange={(e) => set("duplicateStrategy", e.target.value)}
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
      desc: "Toggle this on to only import SAP documents where HasOriginal = 'X', matching the module's DocumentMetaSet filter.",
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
      desc: "Click Connection Test anytime to verify the SAP connection is reachable before saving changes.",
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
          SAP Sync Settings — Guide
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
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-tertiary)]">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </AppModal>
  );
}