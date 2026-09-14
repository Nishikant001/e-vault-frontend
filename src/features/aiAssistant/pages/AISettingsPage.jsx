// src/features/aiAssistant/pages/AISettingsPage.jsx
//
// Deliberately mirrors the real backend models exactly:
//   AIProvider:  name, providerType(OPENAI|ANTHROPIC|GEMINI|AZURE_OPENAI|OLLAMA),
//                apiKey (write-only, returned masked), baseUrl, chatModel,
//                embeddingModel, apiVersion, isDefault
//   AISettings:  defaultChatProviderId, defaultEmbeddingProviderId,
//                vectorStore(MYSQL|PGVECTOR|PINECONE|QDRANT), chunkSize,
//                chunkOverlap, topK, temperature, autoIndexOnUpload, isEnabled
//
// The build brief additionally asked for Max Tokens / Top P / Streaming /
// Language controls, but none of those exist on AISettings — adding them
// would either silently no-op or require inventing a backend field that
// isn't there, so they're intentionally left out rather than faked.

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star, Lock } from "lucide-react";
import { AISettingsApi, canEditAISettings } from "../api";
import {
  AppButton, AppCard, CardHeader, AppSelect, AppModal, ConfirmDialog,
  StatusBadge, EmptyState, SkeletonText, useToast,
} from "../../../components/ui";

const PROVIDER_TYPES = ["OPENAI", "ANTHROPIC", "GEMINI", "AZURE_OPENAI", "OLLAMA"];
const VECTOR_STORES = ["MYSQL", "PGVECTOR", "PINECONE", "QDRANT"];

const emptyProvider = { name: "", providerType: "OPENAI", apiKey: "", baseUrl: "", chatModel: "", embeddingModel: "", apiVersion: "", isDefault: false };

export default function AISettingsPage({ role }) {
  const canEdit = canEditAISettings(role);
  const { toast } = useToast();

  const [providers, setProviders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [form, setForm] = useState(emptyProvider);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([AISettingsApi.listProviders(), AISettingsApi.getSettings()])
      .then(([p, s]) => { setProviders(p.data || []); setSettings(s.data); })
      .catch((err) => toast({ title: "Couldn't load AI settings", description: err.message, tone: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setEditingProvider(null); setForm(emptyProvider); setModalOpen(true); };
  const openEdit = (p) => { setEditingProvider(p); setForm({ ...emptyProvider, ...p, apiKey: "" }); setModalOpen(true); };

  const saveProvider = async () => {
    setSaving(true);
    try {
      if (editingProvider) {
        const payload = { ...form };
        if (!payload.apiKey) delete payload.apiKey; // keep existing key if left blank
        const res = await AISettingsApi.updateProvider(editingProvider.id, payload);
        setProviders((prev) => prev.map((p) => (p.id === editingProvider.id ? res.data : p)));
      } else {
        const res = await AISettingsApi.createProvider(form);
        setProviders((prev) => [...prev, res.data]);
      }
      setModalOpen(false);
    } catch (err) {
      toast({ title: "Couldn't save provider", description: err.message, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const deleteProvider = async () => {
    try {
      await AISettingsApi.deleteProvider(deleteTarget.id);
      setProviders((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast({ title: "Couldn't delete provider", description: err.message, tone: "error" });
    }
  };

  const updateSetting = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await AISettingsApi.updateSettings(settings);
      setSettings(res.data);
      toast({ title: "AI settings saved" });
    } catch (err) {
      toast({ title: "Couldn't save settings", description: err.message, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonText lines={8} />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg text-[var(--text-primary)]">AI Settings</h2>
        {!canEdit && (
          <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-400">
            <Lock className="h-3.5 w-3.5" /> Read-only for your role
          </span>
        )}
      </div>

      <AppCard>
        <CardHeader title="AI Providers" action={canEdit && <AppButton size="sm" icon={Plus} onClick={openCreate}>Add Provider</AppButton>} />
        {providers.length === 0 ? (
          <EmptyState title="No providers configured" description="Add an OpenAI, Anthropic, Gemini, Azure OpenAI, or Ollama provider." />
        ) : (
          <div className="divide-y divide-slate-100">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-[13px] font-medium text-slate-800 flex items-center gap-1.5">
                    {p.name}
                    {p.isDefault && <Star className="h-3 w-3 text-warning-500 fill-warning-400" />}
                  </p>
                  <p className="text-[11.5px] text-slate-500">
                    {p.providerType} · chat: {p.chatModel || "—"} · embed: {p.embeddingModel || "—"} · key: {p.apiKeyMasked || "—"}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded hover:bg-danger-50 text-slate-400 hover:text-danger-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </AppCard>

      {settings && (
        <AppCard>
          <CardHeader title="Tenant AI Defaults" subtitle={<StatusBadge status={settings.isEnabled ? "Enabled" : "Disabled"} tone={settings.isEnabled ? "success" : "neutral"} />} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11.5px] font-medium text-slate-500 mb-1">Default Chat Provider</p>
              <AppSelect disabled={!canEdit} value={settings.defaultChatProviderId || ""} onChange={(e) => updateSetting({ defaultChatProviderId: e.target.value })}>
                <option value="">None</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </AppSelect>
            </div>
            <div>
              <p className="text-[11.5px] font-medium text-slate-500 mb-1">Default Embedding Provider</p>
              <AppSelect disabled={!canEdit} value={settings.defaultEmbeddingProviderId || ""} onChange={(e) => updateSetting({ defaultEmbeddingProviderId: e.target.value })}>
                <option value="">None</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </AppSelect>
            </div>
            <div>
              <p className="text-[11.5px] font-medium text-slate-500 mb-1">Vector Database</p>
              <AppSelect disabled={!canEdit} value={settings.vectorStore} onChange={(e) => updateSetting({ vectorStore: e.target.value })}>
                {VECTOR_STORES.map((v) => <option key={v} value={v}>{v}</option>)}
              </AppSelect>
            </div>
            <div>
              <p className="text-[11.5px] font-medium text-slate-500 mb-1">Temperature ({settings.temperature})</p>
              <input type="range" min="0" max="1" step="0.05" disabled={!canEdit} value={settings.temperature}
                onChange={(e) => updateSetting({ temperature: parseFloat(e.target.value) })} className="w-full" />
            </div>
            <div>
              <p className="text-[11.5px] font-medium text-slate-500 mb-1">Top K (retrieved chunks)</p>
              <input type="number" min="1" max="20" disabled={!canEdit} value={settings.topK}
                onChange={(e) => updateSetting({ topK: parseInt(e.target.value, 10) })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-[13px]" />
            </div>
            <div>
              <p className="text-[11.5px] font-medium text-slate-500 mb-1">Chunk Size</p>
              <input type="number" min="200" step="50" disabled={!canEdit} value={settings.chunkSize}
                onChange={(e) => updateSetting({ chunkSize: parseInt(e.target.value, 10) })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-[13px]" />
            </div>
            <div>
              <p className="text-[11.5px] font-medium text-slate-500 mb-1">Chunk Overlap</p>
              <input type="number" min="0" step="10" disabled={!canEdit} value={settings.chunkOverlap}
                onChange={(e) => updateSetting({ chunkOverlap: parseInt(e.target.value, 10) })}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-[13px]" />
            </div>
            <label className="flex items-center gap-2 text-[12.5px] text-slate-600">
              <input type="checkbox" disabled={!canEdit} checked={settings.autoIndexOnUpload} onChange={(e) => updateSetting({ autoIndexOnUpload: e.target.checked })} />
              Auto-index documents on upload
            </label>
            <label className="flex items-center gap-2 text-[12.5px] text-slate-600">
              <input type="checkbox" disabled={!canEdit} checked={settings.isEnabled} onChange={(e) => updateSetting({ isEnabled: e.target.checked })} />
              AI Assistant enabled for this tenant
            </label>
          </div>
          {canEdit && (
            <div className="mt-4">
              <AppButton loading={saving} onClick={saveSettings}>Save Settings</AppButton>
            </div>
          )}
        </AppCard>
      )}

      <AppModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProvider ? "Edit Provider" : "Add Provider"}
        footer={
          <>
            <AppButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AppButton>
            <AppButton loading={saving} onClick={saveProvider}>Save</AppButton>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <p className="text-[11.5px] font-medium text-slate-500 mb-1">Name</p>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-9 rounded-lg border border-slate-200 px-3 text-[13px]" />
          </div>
          <div>
            <p className="text-[11.5px] font-medium text-slate-500 mb-1">Provider Type</p>
            <AppSelect value={form.providerType} onChange={(e) => setForm({ ...form, providerType: e.target.value })}>
              {PROVIDER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </AppSelect>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11.5px] font-medium text-slate-500 mb-1">Chat Model</p>
              <input value={form.chatModel} onChange={(e) => setForm({ ...form, chatModel: e.target.value })} className="w-full h-9 rounded-lg border border-slate-200 px-3 text-[13px]" />
            </div>
            <div>
              <p className="text-[11.5px] font-medium text-slate-500 mb-1">Embedding Model</p>
              <input value={form.embeddingModel} onChange={(e) => setForm({ ...form, embeddingModel: e.target.value })} className="w-full h-9 rounded-lg border border-slate-200 px-3 text-[13px]" />
            </div>
          </div>
          <div>
            <p className="text-[11.5px] font-medium text-slate-500 mb-1">Base URL (optional — Azure/Ollama)</p>
            <input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} className="w-full h-9 rounded-lg border border-slate-200 px-3 text-[13px]" />
          </div>
          <div>
            <p className="text-[11.5px] font-medium text-slate-500 mb-1">
              API Key {editingProvider && <span className="text-slate-400">(leave blank to keep current)</span>}
            </p>
            <input type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} className="w-full h-9 rounded-lg border border-slate-200 px-3 text-[13px]" />
          </div>
          <label className="flex items-center gap-2 text-[12.5px] text-slate-600">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Set as default provider
          </label>
        </div>
      </AppModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this provider?"
        description={`"${deleteTarget?.name}" will be removed. This can't be undone.`}
        confirmLabel="Delete"
        tone="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteProvider}
      />
    </div>
  );
}
