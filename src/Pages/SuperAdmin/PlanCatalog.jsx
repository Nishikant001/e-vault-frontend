// src/Pages/SuperAdmin/PlanCatalog.jsx
//
// SuperAdmin plan catalog — list existing plans (FREE, PAID, and any
// future ones) with per-feature toggle switches, plus an "Add Plan" form
// exposing every FEATURE_KEYS entry so Professional/Enterprise/Premium
// plans can be created without a backend deploy.

import { useState, useEffect, useCallback } from "react";
import { Plus, Package } from "lucide-react";
import { AppCard, AppButton, AppInput, useToast, EmptyState, SkeletonCard } from "../../components/ui";
import { PlanApi, FEATURE_KEYS, FEATURE_LABELS } from "../../services/subscriptionApi";

function FeatureSwitch({ enabled, onToggle, label, disabled }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-2 rounded-app-sm px-2 py-1.5 text-left hover:bg-[var(--surface-sunken)] disabled:opacity-50"
    >
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-brand-500" : "bg-[var(--surface-sunken)] border border-[var(--border-default)]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-[18px]" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function PlanCard({ plan, onFeatureToggle }) {
  const featureMap = new Map((plan.features || []).map((f) => [f.featureKey, f]));
  return (
    <AppCard accent="brand">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">{plan.name}</h3>
          <p className="text-xs text-[var(--text-tertiary)]">{plan.code}</p>
        </div>
        <div className="text-right text-xs text-[var(--text-secondary)]">
          {plan.isTrialable && <p>{plan.trialDurationDays}-day trial</p>}
          <p>₹{plan.priceMonthly}/mo · ₹{plan.priceYearly}/yr</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-0.5 border-t border-[var(--border-subtle)] pt-2 sm:grid-cols-2">
        {FEATURE_KEYS.map((key) => {
          const f = featureMap.get(key);
          return (
            <FeatureSwitch
              key={key}
              label={FEATURE_LABELS[key]}
              enabled={!!f?.enabled}
              onToggle={() => onFeatureToggle(plan, key, !f?.enabled)}
            />
          );
        })}
      </div>
    </AppCard>
  );
}

function AddPlanForm({ onClose, onCreated }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    code: "",
    name: "",
    isTrialable: false,
    trialDurationDays: 14,
    priceMonthly: 0,
    priceYearly: 0,
  });
  const [features, setFeatures] = useState(() => new Set());
  const [loading, setLoading] = useState(false);

  function toggleFeature(key) {
    setFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function submit() {
    if (!form.code.trim() || !form.name.trim()) {
      toast({ title: "Code and name are required", tone: "error" });
      return;
    }
    setLoading(true);
    try {
      await PlanApi.create({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        isTrialable: form.isTrialable,
        trialDurationDays: Number(form.trialDurationDays),
        priceMonthly: Number(form.priceMonthly),
        priceYearly: Number(form.priceYearly),
        features: Array.from(features),
      });
      toast({ title: "Plan created", description: form.name, tone: "success" });
      onCreated();
    } catch (err) {
      toast({ title: "Could not create plan", description: err.message, tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppCard accent="success">
      <h3 className="mb-4 font-display text-base font-semibold text-[var(--text-primary)]">Add plan</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppInput label="Plan code" required placeholder="PROFESSIONAL" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
        <AppInput label="Plan name" required placeholder="Professional" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <AppInput label="Price / month (₹)" type="number" value={form.priceMonthly} onChange={(e) => setForm((f) => ({ ...f, priceMonthly: e.target.value }))} />
        <AppInput label="Price / year (₹)" type="number" value={form.priceYearly} onChange={(e) => setForm((f) => ({ ...f, priceYearly: e.target.value }))} />
        <AppInput label="Trial duration (days)" type="number" value={form.trialDurationDays} onChange={(e) => setForm((f) => ({ ...f, trialDurationDays: e.target.value }))} />
        <label className="mt-6 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={form.isTrialable}
            onChange={(e) => setForm((f) => ({ ...f, isTrialable: e.target.checked }))}
            className="h-4 w-4 rounded accent-[var(--color-brand-500)]"
          />
          Offer a trial for this plan
        </label>
      </div>

      <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Features</p>
      <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
        {FEATURE_KEYS.map((key) => (
          <FeatureSwitch key={key} label={FEATURE_LABELS[key]} enabled={features.has(key)} onToggle={() => toggleFeature(key)} />
        ))}
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <AppButton variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </AppButton>
        <AppButton onClick={submit} loading={loading}>
          Create plan
        </AppButton>
      </div>
    </AppCard>
  );
}

export default function PlanCatalog() {
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PlanApi.list();
      setPlans(res.data || []);
    } catch (err) {
      toast({ title: "Could not load plans", description: err.message, tone: "error" });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFeatureToggle(plan, featureKey, enabled) {
    // Optimistic update
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== plan.id) return p;
        const features = (p.features || []).some((f) => f.featureKey === featureKey)
          ? p.features.map((f) => (f.featureKey === featureKey ? { ...f, enabled } : f))
          : [...(p.features || []), { featureKey, enabled }];
        return { ...p, features };
      }),
    );
    try {
      await PlanApi.setFeature(plan.id, { featureKey, enabled });
    } catch (err) {
      toast({ title: "Could not update feature", description: err.message, tone: "error" });
      load();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">Plan catalog</h2>
          <p className="text-sm text-[var(--text-secondary)]">Toggle features per plan, or add a new plan.</p>
        </div>
        {!showAdd && (
          <AppButton icon={Plus} onClick={() => setShowAdd(true)}>
            Add plan
          </AppButton>
        )}
      </div>

      {showAdd && (
        <AddPlanForm
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : plans.length === 0 ? (
        <EmptyState icon={Package} title="No plans yet" description="Create your first plan to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onFeatureToggle={handleFeatureToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
