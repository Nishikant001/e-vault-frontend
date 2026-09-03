import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import {
  Plug,
  Plus,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  CircleSlash,
  Server,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";
import { API_BASE_URL } from "../../services/apiClient";

const API_BASE = API_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const api = axios.create({ baseURL: API_BASE });

function extractError(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}

// Tailwind class sets per status — light + dark variants together
const STATUS_META = {
  CONNECTED: {
    label: "Connected",
    icon: CheckCircle2,
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    chipActive: "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
    bar: "bg-emerald-500",
  },
  ACTIVE: {
    label: "Active",
    icon: CheckCircle2,
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    chipActive: "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
    bar: "bg-emerald-500",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    chipActive: "border-amber-500 bg-amber-50 dark:bg-amber-500/10",
    bar: "bg-amber-500",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    chipActive: "border-red-500 bg-red-50 dark:bg-red-500/10",
    bar: "bg-red-500",
  },
  INACTIVE: {
    label: "Inactive",
    icon: CircleSlash,
    text: "text-slate-500 dark:text-slate-400",
    dot: "bg-slate-400",
    chipActive: "border-slate-400 bg-slate-100 dark:bg-slate-500/10",
    bar: "bg-slate-400",
  },
};

const ERP_TYPE_DOT = {
  SAP: "bg-emerald-500",
  ORACLE: "bg-amber-500",
  CUSTOM: "bg-blue-500",
};

function timeAgo(iso) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const emptyForm = {
  name: "",
  erpType: "SAP",
  baseUrl: "",
  sapClient: "100",
  authType: "BASIC",
  username: "",
  password: "",
  apiKey: "",
  description: "",
  metadataUrl: "",
  odataVersion: "v2",
  integrationMode: "BOTH",
  inboundUsername: "",
  inboundPassword: "",
};

// Small helper for consistent field styling
const inputClass =
  "w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-[9px] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors";

export default function ErpConsole() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [panel, setPanel] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [showInboundSecret, setShowInboundSecret] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);
  const logRef = useRef(null);

  async function fetchConnections() {
    try {
      setLoading(true);
      const res = await api.get("/erp-configs", { headers: authHeaders() });
      setConnections(res.data?.data || []);
    } catch (err) {
      setToast({ type: "bad", msg: extractError(err, "Failed to load ERP configurations") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const counts = useMemo(() => {
    const c = { CONNECTED: 0, PENDING: 0, FAILED: 0, INACTIVE: 0, ACTIVE: 0 };
    connections.forEach((x) => {
      c[x.status] = (c[x.status] || 0) + 1;
    });
    return c;
  }, [connections]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return connections;
    return connections.filter((c) => c.status === filter);
  }, [connections, filter]);

  function openAdd() {
    setForm(emptyForm);
    setFormError("");
    setShowSecret(false);
    setPanel({ mode: "add" });
  }

  function openEdit(item) {
    setForm({
      name: item.name,
      erpType: item.erpType,
      baseUrl: item.baseUrl,
      sapClient: item.sapClient || "100",
      authType: item.authType,
      username: item.username || "",
      password: "",
      apiKey: "",
      description: item.description || "",
      metadataUrl: item.metadataUrl || "",
      odataVersion: item.odataVersion || "v2",
      integrationMode: item.integrationMode || "BOTH",
      inboundUsername: item.inboundUsername || "",
      inboundPassword: "",
      id: item.id,
    });
    setFormError("");
    setShowSecret(false);
    setShowInboundSecret(false);
    setPanel({ mode: "edit", data: item });
  }

  function closePanel() {
    setPanel(null);
    setFormError("");
  }

  async function saveConnection() {
    if (!form.name || !form.erpType) {
      setFormError("Name and ERP type are required");
      return;
    }
    if (["OUTBOUND", "BOTH"].includes(form.integrationMode) && !form.baseUrl) {
      setFormError("Base URL is required for Evault → ERP integration");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      name: form.name,
      erpType: form.erpType,
      baseUrl: form.baseUrl || undefined,
      integrationMode: form.integrationMode,
      sapClient: form.sapClient,
      authType: form.authType,
      username: form.username,
      description: form.description,
      metadataUrl: form.metadataUrl || undefined,
      odataVersion: form.odataVersion || "v2",
    };
    if (form.password) payload.password = form.password;
    if (form.apiKey) payload.apiKey = form.apiKey;
    if (form.inboundUsername) payload.inboundUsername = form.inboundUsername;
    if (form.inboundPassword) payload.inboundPassword = form.inboundPassword;

    try {
      if (panel.mode === "add") {
        const res = await api.post("/erp-configs", payload, { headers: authHeaders() });
        const created = res.data?.data;
        if (created?.id && ["INBOUND", "BOTH"].includes(form.integrationMode) && form.erpType === "SAP") {
          try {
            const credRes = await api.post(`/erp-configs/${created.id}/inbound-credentials`, {}, { headers: authHeaders() });
            const creds = credRes.data?.data;
            setToast({ type: "ok", msg: "ERP added. Inbound SAP → Evault credentials generated — copy them before closing." });
            await fetchConnections();
            openEdit({ ...created, ...{ inboundUsername: creds?.username || "" }, integrationMode: form.integrationMode });
            setForm((f) => ({ ...f, inboundUsername: creds?.username || "", inboundPassword: creds?.password || "" }));
            return;
          } catch (credErr) {
            setToast({ type: "bad", msg: extractError(credErr, "ERP added, but inbound credential generation failed") });
          }
        } else {
          setToast({ type: "ok", msg: `${created?.name || form.name} added — connection untested` });
        }
      } else {
        const res = await api.put(`/erp-configs/${form.id}`, payload, { headers: authHeaders() });
        setToast({ type: "ok", msg: `${res.data?.data?.name || form.name} updated` });
      }
      closePanel();
      await fetchConnections();
    } catch (err) {
      setFormError(extractError(err, "Failed to save ERP configuration"));
    } finally {
      setSaving(false);
    }
  }

  async function copyToClipboard(value, label) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setToast({ type: "ok", msg: `${label} copied` });
    } catch {
      setToast({ type: "bad", msg: `Unable to copy ${label.toLowerCase()}` });
    }
  }

  async function generateInboundCredentials(itemOrId) {
    const id = typeof itemOrId === "object" ? itemOrId.id : itemOrId;
    const isRegenerate = Boolean(form.inboundUsername || form.inboundPassword);

    if (isRegenerate) {
      const confirmed = window.confirm(
        "Regenerate SAP → Evault credentials? The previous credentials may stop working immediately."
      );
      if (!confirmed) return;
    }

    try {
      const res = await api.post(`/erp-configs/${id}/inbound-credentials`, {}, { headers: authHeaders() });
      const creds = res.data?.data;
      if (!creds?.username || !creds?.password) throw new Error("Credential generation returned an invalid response");
      setForm((f) => ({ ...f, inboundUsername: creds.username, inboundPassword: creds.password, integrationMode: f.integrationMode === "OUTBOUND" ? "BOTH" : f.integrationMode }));
      setToast({ type: "ok", msg: "Inbound SAP → Evault credentials generated. Copy the password now." });
      await fetchConnections();
    } catch (err) {
      setFormError(extractError(err, "Failed to generate inbound credentials"));
    }
  }

  async function deactivate(id) {
    const target = connections.find((c) => c.id === id);
    setDeactivatingId(id);
    try {
      await api.delete(`/erp-configs/${id}`, { headers: authHeaders() });
      setToast({ type: "ok", msg: `${target?.name} deactivated` });
      setConfirmDeleteId(null);
      await fetchConnections();
    } catch (err) {
      setToast({ type: "bad", msg: extractError(err, "Failed to deactivate connection") });
    } finally {
      setDeactivatingId(null);
    }
  }

  async function testConnection(item) {
    if (item.integrationMode === "INBOUND") {
      setToast({ type: "bad", msg: "This connection is SAP → Evault only; there is no outbound SAP connection to test." });
      return;
    }
    try {
      setTestingId(item.id);
      setLogs([]);

      const response = await fetch(`${API_BASE}/erp-configs/${item.id}/test-stream`, {
        method: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const line = event.split("\n").find((l) => l.startsWith("data:"));
          if (line) {
            const msg = line.replace("data:", "").trim();
            setLogs((prev) => [...prev, msg]);
          }
        }
      }

      await fetchConnections();
    } catch (err) {
      setLogs((prev) => [...prev, `❌ ${err.message}`]);
    } finally {
      setTestingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0E14] text-slate-800 dark:text-slate-100 p-5 md:p-7 font-sans transition-colors">
      {/* keyframes not in default Tailwind */}
      <style>{`
        @keyframes pulseRing { 0% { transform: scale(1); opacity: .6; } 100% { transform: scale(2.6); opacity: 0; } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm flex-shrink-0">
            <Server size={18} />
          </div>
          <div>
            <h1 className="text-[19px] font-bold tracking-tight text-slate-900 dark:text-white">
              ERP Connections
            </h1>
            <p className="text-[12.5px] font-mono text-slate-500 dark:text-slate-400 mt-1">
              SAP · Oracle · Custom — odata bridge config
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[13px] font-semibold px-4 py-[10px] rounded-lg shadow-sm shadow-blue-600/20 transition-colors"
        >
          <Plus size={15} /> Add connection
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilter("ALL")}
          className={`flex items-center gap-2 border rounded-lg px-3.5 py-[9px] text-[12.5px] transition-colors ${
            filter === "ALL"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{connections.length}</span>
          <span className="text-slate-500 dark:text-slate-400">All</span>
        </button>
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 border rounded-lg px-3.5 py-[9px] text-[12.5px] transition-colors ${
              filter === key
                ? meta.chipActive
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            <span className={`w-[7px] h-[7px] rounded-full ${meta.dot}`} />
            <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{counts[key] || 0}</span>
            <span className="text-slate-500 dark:text-slate-400">{meta.label}</span>
          </button>
        ))}
      </div>

      {/* Table / cards */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {!loading && (
          <div className="hidden md:grid grid-cols-[22px_1.4fr_0.7fr_1.6fr_0.6fr_0.9fr_110px] gap-3.5 px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10.5px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
            <span />
            <span>Connection</span>
            <span>Type</span>
            <span>Endpoint</span>
            <span>Client</span>
            <span>Status</span>
            <span />
          </div>
        )}

        {loading ? (
          <div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[54px] flex items-center px-5 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                <div
                  className="h-[11px] rounded bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%]"
                  style={{ width: `${60 - i * 8}%`, animation: "shimmer 1.4s infinite" }}
                />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 px-5 text-center text-slate-500 dark:text-slate-400">
            <Plug size={26} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <div className="text-slate-800 dark:text-slate-100 font-semibold text-[14px] mb-1">
              {filter === "ALL" ? "No ERP connections yet" : `No ${STATUS_META[filter]?.label.toLowerCase()} connections`}
            </div>
            <div className="text-[12.5px]">
              {filter === "ALL"
                ? "Add a SAP, Oracle, or custom endpoint to start syncing documents."
                : "Switch filters or add a new connection to see it here."}
            </div>
          </div>
        ) : (
          filtered.map((item) => {
            const meta = STATUS_META[item.status] || STATUS_META.INACTIVE;
            const typeDot = ERP_TYPE_DOT[item.erpType] || "bg-slate-400";
            const isTesting = testingId === item.id;
            return (
              <div
                key={item.id}
                className="group grid grid-cols-1 md:grid-cols-[22px_1.4fr_0.7fr_1.6fr_0.6fr_0.9fr_110px] gap-2 md:gap-3.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className={`hidden md:block w-[3px] h-[22px] rounded-full mx-auto ${meta.bar}`} />

                <div>
                  <span className="font-semibold text-[13.5px] text-slate-900 dark:text-slate-100">{item.name}</span>
                  {item.isDefault && (
                    <span className="ml-2 text-[9.5px] font-mono text-blue-600 dark:text-blue-400 border border-blue-500/50 px-1.5 py-px rounded">
                      DEFAULT
                    </span>
                  )}
                  {item.description && (
                    <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700 dark:text-slate-200">
                  <span className={`w-[6px] h-[6px] rounded-full ${typeDot}`} />
                  {item.erpType}
                </div>

                <div className="font-mono text-[11.5px] text-slate-500 dark:text-slate-400 truncate" title={item.baseUrl || "Inbound only"}>
                  {item.baseUrl || "Inbound only"}
                </div>

                <div className="font-mono text-[12.5px] text-slate-500 dark:text-slate-400">{item.sapClient || "—"}</div>

                <div className="flex flex-col gap-0.5">
                  <div className={`flex items-center gap-1.5 text-[12.5px] font-medium ${meta.text}`}>
                    <span className="relative flex w-[6px] h-[6px]">
                      {isTesting && (
                        <span
                          className={`absolute inline-flex h-full w-full rounded-full ${meta.dot}`}
                          style={{ animation: "pulseRing 1.6s ease-out infinite" }}
                        />
                      )}
                      <span className={`relative inline-flex w-[6px] h-[6px] rounded-full ${meta.dot}`} />
                    </span>
                    {isTesting ? "Testing…" : meta.label}
                  </div>
                  <div className="text-[10.5px] font-mono text-slate-400 dark:text-slate-500">{timeAgo(item.lastTestedAt)}</div>
                </div>

                <div className="flex gap-1.5 justify-start md:justify-end opacity-100 md:opacity-80 md:group-hover:opacity-100 transition-opacity">
                  <button
                    disabled={isTesting}
                    onClick={() => testConnection(item)}
                    className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11.5px] font-medium font-mono px-2.5 py-[6px] rounded-md hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isTesting ? <RefreshCw size={12} className="animate-spin" /> : <Plug size={12} />}
                    {!isTesting && "Test"}
                  </button>
                  <button
                    title="Edit"
                    onClick={() => openEdit(item)}
                    className="w-[28px] h-[28px] flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  {item.status !== "INACTIVE" && (
                    <button
                      title="Deactivate"
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="w-[28px] h-[28px] flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {confirmDeleteId === item.id && (
                  <div className="md:col-span-7">
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-red-300 dark:border-red-500/40 rounded-lg p-3.5 mt-2">
                      <p className="text-[12.5px] text-slate-600 dark:text-slate-300 mb-2.5">
                        Deactivate <strong className="text-slate-900 dark:text-white">{item.name}</strong>? Document uploads using this connection will stop working until it's reactivated.
                      </p>
                      <div className="flex gap-2">
                        <button
                          disabled={deactivatingId === item.id}
                          onClick={() => deactivate(item.id)}
                          className="text-[12px] px-3 py-[6px] rounded-md bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-60 transition-colors"
                        >
                          {deactivatingId === item.id ? "Deactivating…" : "Deactivate"}
                        </button>
                        <button
                          disabled={deactivatingId === item.id}
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[12px] px-3 py-[6px] rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 disabled:opacity-60 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Side panel: add / edit */}
      {panel && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] z-40"
            onClick={closePanel}
          />
          <div
            role="dialog"
            aria-label="ERP connection form"
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-[18px] border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
                {panel.mode === "add" ? "Add ERP connection" : `Edit ${panel.data?.name}`}
              </h2>
              <button
                onClick={closePanel}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {formError && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 text-[12.5px] px-3 py-[9px] rounded-lg mb-4">
                  {formError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-[11.5px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">Name</label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="SAP-PROD-EU"
                />
              </div>

              <div className="mb-4">
                <label className="block text-[11.5px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">Integration direction</label>
                <select
                  className={inputClass}
                  value={form.integrationMode}
                  onChange={(e) => setForm({ ...form, integrationMode: e.target.value })}
                >
                  <option value="BOTH">Both — SAP → Evault + Evault → SAP</option>
                  <option value="INBOUND">SAP → Evault only</option>
                  <option value="OUTBOUND">Evault → SAP only</option>
                </select>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1.5">Keep inbound SAP API credentials separate from outbound SAP/OData credentials.</p>
              </div>

              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="block text-[11.5px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">ERP type</label>
                  <select
                    className={inputClass}
                    value={form.erpType}
                    onChange={(e) => setForm({ ...form, erpType: e.target.value })}
                  >
                    <option value="SAP">SAP</option>
                    <option value="ORACLE">Oracle</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                {form.erpType === "SAP" && (
                  <div className="flex-1">
                    <label className="block text-[11.5px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">SAP client</label>
                    <input
                      className={inputClass}
                      value={form.sapClient}
                      onChange={(e) => setForm({ ...form, sapClient: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                )}
              </div>

              {["OUTBOUND", "BOTH"].includes(form.integrationMode) && (
              <div className="mb-4">
                <label className="block text-[11.5px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">SAP Base URL — Evault → SAP</label>
                <input
                  className={`${inputClass} font-mono`}
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                  placeholder="https://host/sap/opu/odata/sap/SERVICE"
                />
              </div>
              )}

              <div className="mb-4">
                <label className="block text-[11.5px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">Description</label>
                <input
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional note about this environment"
                />
              </div>

              {form.erpType === "SAP" && ["OUTBOUND", "BOTH"].includes(form.integrationMode) && (
                <>
                  <div className="mb-4">
                    <label className="block text-[11.5px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">OData metadata URL</label>
                    <input
                      className={`${inputClass} font-mono`}
                      value={form.metadataUrl}
                      onChange={(e) => setForm({ ...form, metadataUrl: e.target.value })}
                      placeholder="https://host/sap/opu/odata/sap/Z_DMS_SRV_TEST_SRV/$metadata"
                    />
                    <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1.5">
                      Optional. Keep this URL environment-specific so another SAP/ERP landscape can be configured without changing frontend code.
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-[11.5px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">OData version</label>
                    <select
                      className={inputClass}
                      value={form.odataVersion}
                      onChange={(e) => setForm({ ...form, odataVersion: e.target.value })}
                    >
                      <option value="v2">OData V2</option>
                      <option value="v4">OData V4</option>
                    </select>
                  </div>
                </>
              )}

              {["OUTBOUND", "BOTH"].includes(form.integrationMode) && (
                <>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 my-5">
                Evault → SAP Authentication
                <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>

              <div className="mb-4">
                <label className="block text-[11.5px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">Auth type</label>
                <select
                  className={inputClass}
                  value={form.authType}
                  onChange={(e) => setForm({ ...form, authType: e.target.value })}
                >
                  <option value="BASIC">Basic (username / password)</option>
                  <option value="BEARER">Bearer token</option>
                  <option value="API_KEY">API key</option>
                </select>
              </div>

              {form.authType === "BASIC" && (
                <>
                  <div className="mb-4">
                    <label className="block text-[11.5px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">Username</label>
                    <input
                      className={inputClass}
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder="DMS_SVC_USER"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-[11.5px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">
                      Password {panel.mode === "edit" && "(leave blank to keep current)"}
                    </label>
                    <div className="relative">
                      <input
                        className={`${inputClass} pr-9`}
                        type={showSecret ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder={panel.mode === "edit" ? "••••••••" : ""}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret((s) => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {(form.authType === "BEARER" || form.authType === "API_KEY") && (
                <div className="mb-4">
                  <label className="block text-[11.5px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">
                    {form.authType === "BEARER" ? "Bearer token" : "API key"}
                    {panel.mode === "edit" && " (leave blank to keep current)"}
                  </label>
                  <div className="relative">
                    <input
                      className={`${inputClass} font-mono pr-9`}
                      type={showSecret ? "text" : "password"}
                      value={form.apiKey}
                      onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                      placeholder={panel.mode === "edit" ? "••••••••••••" : ""}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((s) => !s)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              )}
                </>
              )}
              {["INBOUND", "BOTH"].includes(form.integrationMode) && (
                <>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 my-5">
                    SAP → Evault Inbound API Authentication
                    <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-[11.5px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">API username</label>
                    <div className="flex gap-2">
                      <input className={`${inputClass} font-mono`} value={form.inboundUsername} readOnly placeholder="Generate credentials" />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(form.inboundUsername, "Username")}
                        disabled={!form.inboundUsername}
                        className="shrink-0 border border-slate-200 dark:border-slate-700 px-3 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-40"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-[11.5px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">API password</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          className={`${inputClass} font-mono pr-9`}
                          type={showInboundSecret ? "text" : "password"}
                          value={form.inboundPassword}
                          readOnly
                          placeholder="Generate credentials"
                        />
                        <button
                          type="button"
                          onClick={() => setShowInboundSecret((v) => !v)}
                          disabled={!form.inboundPassword}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-40"
                          aria-label={showInboundSecret ? "Hide password" : "Show password"}
                        >
                          {showInboundSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(form.inboundPassword, "Password")}
                        disabled={!form.inboundPassword}
                        className="shrink-0 border border-slate-200 dark:border-slate-700 px-3 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-40"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1.5">SAP uses these generated credentials with Basic Authentication for POST /api/v1/vault/documents/upload.</p>
                  </div>
                  {form.id && (
                    <button type="button" onClick={() => generateInboundCredentials(form.id)} className="mb-4 w-full border border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-[12px] font-semibold px-3 py-2 rounded-lg">
                      {form.inboundUsername ? "Regenerate inbound credentials" : "Generate inbound credentials"}
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-2.5 px-5 py-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={closePanel}
                disabled={saving}
                className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-[10px] rounded-lg text-[13px] hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveConnection}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-[10px] rounded-lg text-[13px] disabled:opacity-70 transition-colors"
              >
                {saving
                  ? panel.mode === "add" ? "Adding…" : "Saving…"
                  : panel.mode === "add" ? "Add connection" : "Save changes"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Live test logs */}
      {logs.length > 0 && (
        <div
          ref={logRef}
          className="mt-5 bg-slate-900 dark:bg-black border border-slate-800 text-emerald-400 p-4 rounded-xl font-mono text-[12px] h-[220px] overflow-y-auto whitespace-pre-wrap"
        >
          {logs.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 ${
            toast.type === "ok" ? "border-l-emerald-500" : "border-l-red-500"
          } px-4 py-3 rounded-lg text-[13px] z-50 flex items-center gap-2 shadow-lg max-w-[320px] text-slate-800 dark:text-slate-100`}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
          ) : (
            <XCircle size={15} className="text-red-500 flex-shrink-0" />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}