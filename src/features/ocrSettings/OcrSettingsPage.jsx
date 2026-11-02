import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  PlugZap,
  Trash2,
  KeyRound,
  Info,
  CheckCircle2,
  CloudCog,
  Sparkles,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  LockKeyhole,
  CircleHelp,
  Home,
  FileText,
  ScanText,
  Settings,
  Check,
  Building2,
  Clock3,
  HelpCircle,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "../../components/ui/Toast";
import * as api from "./api";

const fmt = (d) => (d ? new Date(d).toLocaleString() : "—");

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ── Scoped animations ──────────────────────────────────────────
const ANIM_CSS = `
@keyframes oc-fade-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes oc-fade-in{from{opacity:0}to{opacity:1}}
@keyframes oc-fade-out{from{opacity:1}to{opacity:0}}
@keyframes oc-scale-in{from{opacity:0;transform:translateY(10px) scale(.95)}to{opacity:1;transform:none}}
@keyframes oc-scale-out{from{opacity:1}to{opacity:0;transform:scale(.96)}}
@keyframes oc-pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}
@keyframes oc-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes oc-scan{0%{top:6%;opacity:0}12%{opacity:1}88%{opacity:1}100%{top:92%;opacity:0}}
@keyframes oc-pulse-ring{0%{box-shadow:0 0 0 0 rgba(96,165,250,.55)}100%{box-shadow:0 0 0 14px rgba(96,165,250,0)}}
@keyframes oc-dot{0%{box-shadow:0 0 0 0 rgba(16,185,129,.55)}100%{box-shadow:0 0 0 8px rgba(16,185,129,0)}}
@keyframes oc-shimmer{from{transform:translateX(-120%)}to{transform:translateX(120%)}}
@keyframes oc-bracket{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
@keyframes oc-check-in{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
@keyframes oc-drift{0%,100%{transform:translate(0,0)}50%{transform:translate(10px,-8px)}}
@keyframes oc-skel{0%,100%{opacity:.55}50%{opacity:1}}

.oc-fade-up{animation:oc-fade-up .6s cubic-bezier(.22,1,.36,1) both}
.oc-fade-in{animation:oc-fade-in .3s ease-out both}
.oc-fade-out{animation:oc-fade-out .18s ease-in both}
.oc-scale-in{animation:oc-scale-in .28s cubic-bezier(.22,1,.36,1) both}
.oc-scale-out{animation:oc-scale-out .18s ease-in both}
.oc-pop{animation:oc-pop .35s cubic-bezier(.34,1.56,.64,1) both}
.oc-float{animation:oc-float 4.4s ease-in-out infinite}
.oc-scan{animation:oc-scan 3s ease-in-out infinite}
.oc-ring{animation:oc-pulse-ring 2.2s ease-out infinite}
.oc-dot{animation:oc-dot 1.8s ease-out infinite}
.oc-bracket{animation:oc-bracket 2.6s ease-in-out infinite}
.oc-check-in{animation:oc-check-in .4s cubic-bezier(.22,1,.36,1) both}
.oc-drift{animation:oc-drift 9s ease-in-out infinite}
.oc-skel{animation:oc-skel 1.4s ease-in-out infinite}
.oc-shine{position:relative;overflow:hidden}
.oc-shine::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.14) 50%,transparent 70%);transform:translateX(-120%);animation:oc-shimmer 5.5s ease-in-out infinite}
.oc-press{transition:transform .15s ease,box-shadow .2s ease,background-color .2s ease,border-color .2s ease,color .2s ease}
.oc-press:active:not(:disabled){transform:scale(.97)}
.oc-lift{transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}
.oc-lift:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(15,23,42,.09)}
@media (prefers-reduced-motion:reduce){
  .oc-root *,.oc-root *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;animation-delay:0ms!important;transition-duration:.01ms!important}
}
`;

const d = (ms) => ({ animationDelay: `${ms}ms` });

// ── Small shared pieces ────────────────────────────────────────
function StatusPill({ tone = "neutral", children, icon: Icon }) {
  const tones = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-600",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

function Panel({ children, className = "", style }) {
  return (
    <section style={style} className={cn("rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.035)]", className)}>
      {children}
    </section>
  );
}

function StepHeading({ icon: Icon, step, title, description, right }) {
  return (
    <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-blue-700">{step}</p>
          <h2 className="text-[17px] font-bold leading-tight tracking-tight text-slate-900">{title}</h2>
          {description ? <p className="mt-0.5 text-[13px] text-slate-500">{description}</p> : null}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint, error, required, type = "text", autoComplete = "off" }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        className={cn(
          "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
          error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10" : "border-slate-200 hover:border-slate-300",
        )}
      />
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>
      ) : null}
    </label>
  );
}

function ToggleRow({ checked, onChange, title, description, disabled = false }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 transition duration-200 hover:border-blue-200 hover:bg-blue-50/30",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0 items-center">
        <input className="peer sr-only" type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-blue-600 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-500/20 peer-disabled:opacity-50" />
        <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

// ── Guide modal ────────────────────────────────────────────────
function GuideModal({ open, onClose }) {
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 180);
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, close]);

  if (!open) return null;
  const steps = [
    { t: "Choose your OCR engine", s: "Tesseract is free and built in. Cloud Provider OCR lets you connect your own provider account." },
    { t: "Open Advanced Settings", s: "Add the provider's project ID, location, processor ID and service-account key." },
    { t: "Save configuration", s: "Changes apply to this tenant only. Save before testing the connection." },
    { t: "Test the connection", s: "Run a connection test to verify authentication and provider access." },
  ];
  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4", closing ? "oc-fade-out" : "oc-fade-in")}
      style={{ backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className={cn("w-full max-w-md rounded-2xl bg-white shadow-2xl", closing ? "oc-scale-out" : "oc-scale-in")}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white"><Info className="h-4 w-4" /></span>
            <h2 className="text-[15px] font-bold text-slate-800">OCR Configuration — Guide</h2>
          </div>
          <button onClick={close} className="oc-press flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          {steps.map((s, i) => (
            <div key={s.t} className="oc-fade-up flex gap-3" style={d(80 + i * 60)}>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">{i + 1}</span>
              <div>
                <div className="text-[13px] font-bold text-slate-800">{s.t}</div>
                <div className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{s.s}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 px-6 py-4">
          <button onClick={close} className="oc-press w-full rounded-xl bg-blue-600 py-2.5 text-[12.5px] font-bold text-white hover:bg-blue-700">Got it</button>
        </div>
      </div>
    </div>
  );
}

// ── Banner illustration (documents + OCR scan frame + file badges) ──
function BannerArt() {
  const badge = "flex h-9 w-12 items-center justify-center rounded-lg text-[11px] font-extrabold text-white shadow-lg";
  return (
    <div className="pointer-events-none relative hidden h-[150px] w-[400px] shrink-0 lg:block" aria-hidden="true">
      {/* back doc */}
      <div className="oc-float absolute left-0 top-[34px] h-[100px] w-[88px] rounded-xl bg-gradient-to-br from-sky-200/90 to-blue-300/80 p-3 shadow-xl" style={d(500)}>
        <div className="mb-2 h-2 w-12 rounded bg-blue-500/60" />
        <div className="mb-1.5 h-1.5 w-full rounded bg-blue-500/40" />
        <div className="mb-1.5 h-1.5 w-10 rounded bg-blue-500/40" />
        <div className="h-1.5 w-full rounded bg-blue-500/40" />
      </div>

      {/* main doc */}
      <div className="oc-float absolute left-[84px] top-[6px] h-[138px] w-[126px] overflow-hidden rounded-xl bg-gradient-to-b from-white to-sky-100 p-3.5 shadow-2xl">
        <div className="mb-2.5 h-2 w-16 rounded bg-blue-500/70" />
        {[100, 88, 100, 70, 96, 80].map((w, i) => (
          <div key={i} className="mb-2 h-1.5 rounded bg-blue-400/45" style={{ width: `${w}%` }} />
        ))}
        <div className="oc-scan absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_14px_3px_rgba(34,211,238,.7)]" />
      </div>

      {/* OCR frame */}
      <div className="absolute left-[150px] top-[46px] h-[84px] w-[118px]">
        {[
          "left-0 top-0 border-l-[3px] border-t-[3px] rounded-tl-md",
          "right-0 top-0 border-r-[3px] border-t-[3px] rounded-tr-md",
          "left-0 bottom-0 border-l-[3px] border-b-[3px] rounded-bl-md",
          "right-0 bottom-0 border-r-[3px] border-b-[3px] rounded-br-md",
        ].map((c) => (
          <span key={c} className={cn("oc-bracket absolute h-4 w-4 border-white", c)} />
        ))}
        <div className="oc-ring absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[#0B2A63] px-4 py-2 text-[26px] font-extrabold tracking-tight text-white shadow-xl">
          OCR
        </div>
      </div>

      {/* file type badges */}
      <div className="absolute right-0 top-0 flex flex-col gap-1.5">
        <div className={cn("oc-pop bg-red-500", badge)} style={d(700)}>PDF</div>
        <div className={cn("oc-pop bg-blue-500", badge)} style={d(820)}>DOC</div>
        <div className={cn("oc-pop bg-emerald-500", badge)} style={d(940)}>XLS</div>
        <div className={cn("oc-pop bg-white text-blue-600", badge)} style={d(1060)}><ImageIcon className="h-5 w-5 text-blue-600" /></div>
      </div>
    </div>
  );
}

// ── Engine option card ─────────────────────────────────────────
function Bullet({ ok, children, delay }) {
  return (
    <li className="oc-check-in flex items-center gap-2.5 text-[13px] text-slate-600" style={d(delay)}>
      <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full", ok ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500")}>
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      {children}
    </li>
  );
}

// ── Sidebar row ────────────────────────────────────────────────
function OverviewRow({ icon: Icon, tile, label, value, sub, action, delay }) {
  return (
    <div className="oc-fade-up flex items-center gap-3" style={d(delay)}>
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tile)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-bold leading-snug text-slate-900">{value}</p>
        {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

export default function OcrSettingsPage() {
  const { toast } = useToast();
  const [state, setState] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ engineMode: "TESSERACT", provider: "GOOGLE_DOCUMENT_AI", isProviderEnabled: false, fallbackToTesseract: true, projectId: "", location: "", processorId: "" });
  const [credentialsText, setCredentialsText] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [advOpen, setAdvOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const hydrate = useCallback((d0) => {
    setData(d0);
    setForm({
      engineMode: d0.engineMode || "TESSERACT",
      provider: d0.provider || d0.availableProviders?.[0]?.key || "GOOGLE_DOCUMENT_AI",
      isProviderEnabled: !!d0.isProviderEnabled,
      fallbackToTesseract: d0.fallbackToTesseract !== false,
      projectId: d0.providerConfig?.projectId || "",
      location: d0.providerConfig?.location || "",
      processorId: d0.providerConfig?.processorId || "",
    });
    setCredentialsText("");
  }, []);

  const fetchSettings = useCallback(
    () =>
      api
        .getOcrSettings()
        .then((res) => {
          hydrate(res.data);
          setState("ready");
        })
        .catch((err) => {
          setLoadError(err.message || "Failed to load OCR settings");
          setState("error");
        }),
    [hydrate],
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  const retry = () => {
    setState("loading");
    fetchSettings();
  };
  const patchForm = (patch) => setForm((current) => ({ ...current, ...patch }));
  const entitled = !!data?.entitled;
  const licensed = form.engineMode === "LICENSED";
  const hasCreds = !!data?.credentials?.stored;
  const lastTest = data?.lastTest;

  const chooseCloud = () => {
    if (!entitled) return;
    patchForm({ engineMode: "LICENSED" });
    setAdvOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setFieldErrors({});
    setTestResult(null);
    const payload = { engineMode: form.engineMode, fallbackToTesseract: form.fallbackToTesseract };
    if (entitled) {
      payload.provider = form.provider;
      payload.isProviderEnabled = form.isProviderEnabled;
      payload.providerConfig = { projectId: form.projectId, location: form.location, processorId: form.processorId };
      if (credentialsText.trim()) payload.credentials = credentialsText.trim();
    }
    try {
      const res = await api.saveOcrSettings(payload);
      hydrate(res.data);
      toast({ title: "OCR settings saved", tone: "success" });
    } catch (err) {
      setFieldErrors(err.payload?.errors || {});
      toast({ title: "Could not save OCR settings", description: err.message, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (!data) return;
    hydrate(data);
    setFieldErrors({});
    setTestResult(null);
    toast({ title: "Changes discarded", tone: "success" });
  };

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testOcrConnection();
      setTestResult(res.data);
      const fresh = await api.getOcrSettings();
      setData(fresh.data);
      toast({ title: res.data.connected ? "Connected" : "Connection failed", description: res.data.message, tone: res.data.connected ? "success" : "error" });
    } catch (err) {
      setTestResult({ connected: false, code: err.code, message: err.message });
      toast({ title: "Connection test could not run", description: err.message, tone: "error" });
    } finally {
      setTesting(false);
    }
  };

  const clearCreds = async () => {
    setConfirmClear(false);
    setSaving(true);
    try {
      const res = await api.clearOcrCredentials();
      hydrate(res.data);
      setTestResult(null);
      toast({ title: "Credentials removed", tone: "success" });
    } catch (err) {
      toast({ title: "Could not remove credentials", description: err.message, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (state === "loading")
    return (
      <div className="oc-root mx-auto max-w-7xl space-y-5 p-6">
        <style>{ANIM_CSS}</style>
        <div className="oc-skel h-10 w-72 rounded-xl bg-slate-200/70" />
        <div className="oc-skel h-40 rounded-3xl bg-slate-200/70" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="oc-skel h-24 rounded-2xl bg-slate-200/70" style={d(i * 120)} />
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 pt-4 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> Loading OCR workspace…
        </div>
      </div>
    );

  if (state === "error")
    return (
      <div className="oc-root mx-auto max-w-3xl p-6 sm:p-10">
        <style>{ANIM_CSS}</style>
        <div role="alert" className="oc-scale-in rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-rose-600" />
            <div>
              <h2 className="font-bold text-rose-900">Could not load OCR settings</h2>
              <p className="mt-1 text-sm text-rose-700">{loadError}</p>
              <button onClick={retry} className="oc-press mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-rose-200 hover:bg-rose-100">
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  const selectedProvider = (data?.availableProviders || []).find((p) => p.key === form.provider);
  const providerName = selectedProvider?.displayName || "Cloud OCR provider";
  const updatedAt = data?.updatedAt || data?.lastTest?.at;
  const updatedBy = data?.updatedByName || data?.updatedBy?.name;

  return (
    <div className="oc-root min-h-full bg-[#f4f7fc] text-slate-900">
      <style>{ANIM_CSS}</style>
      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {/* ── Page header ── */}
        <div className="oc-fade-up flex items-start justify-between gap-4">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-[13px] text-slate-500">
              <Home className="h-4 w-4 text-blue-600" />
              <span className="h-4 w-px bg-slate-300" />
              <span>Document Config</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              <span className="font-semibold text-slate-800">OCR Configuration</span>
            </nav>
            <h1 className="flex items-center gap-3 text-[28px] font-bold leading-tight tracking-tight">
              OCR Configuration
              <ScanText className="h-6 w-6 text-blue-600" />
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">Configure how e-Vault reads, understands and extracts information from your documents.</p>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="oc-press flex shrink-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-[13px] font-semibold text-blue-600 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
          >
            <HelpCircle className="h-4 w-4" /> Help &amp; Guide
          </button>
        </div>

        {/* ── Banner ── */}
        <header
          className="oc-fade-up oc-shine relative isolate overflow-hidden rounded-2xl bg-gradient-to-r from-[#0A2A66] via-[#0D3A86] to-[#0E4A9E] px-6 py-5 text-white shadow-[0_18px_45px_rgba(13,58,134,0.22)]"
          style={d(80)}
        >
          <div className="oc-drift pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-blue-400/10 blur-2xl" />
          <div className="pointer-events-none absolute right-24 top-10 -z-10 h-40 w-40 rounded-full border border-white/10" />
          <div className="flex items-center justify-between gap-6">
            <div className="flex min-w-0 items-center gap-5">
              <div className="oc-float flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-[#1B5FC9] shadow-[0_10px_30px_rgba(0,0,0,0.25)] ring-1 ring-white/20">
                <FileText className="h-9 w-9 text-white" />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-blue-50">
                  <Sparkles className="h-3 w-3" /> Document Intelligence
                </span>
                <h2 className="mt-1.5 text-[28px] font-bold leading-tight tracking-tight">OCR Configuration</h2>
                <p className="mt-1 text-[14px] text-blue-100">Configure how e-Vault reads, understands and extracts information from your documents.</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-blue-50">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10"><ShieldCheck className="h-3.5 w-3.5" /> Tenant-scoped settings</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10"><LockKeyhole className="h-3.5 w-3.5" /> Credentials protected</span>
                </div>
              </div>
            </div>
            <BannerArt />
          </div>
        </header>

        {/* ── Quick stats ── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { tile: "bg-emerald-50 text-emerald-600", icon: Check, solid: true, k: "Built-in OCR", v: "Always available", s: "Free • Built in to e-Vault" },
            { tile: "bg-blue-50 text-blue-600", icon: CloudCog, k: "Cloud provider", v: entitled ? "Ready to configure" : "Requires access", s: entitled ? "Connect your own provider account" : "Contact your platform administrator" },
            { tile: "bg-violet-50 text-violet-600", icon: ShieldCheck, k: "Credential handling", v: data?.encryptionConfigured ? "Encryption configured" : "Server setup required", s: "Credentials are securely stored on server" },
          ].map((c, i) => (
            <div key={c.k} className="oc-fade-up oc-lift flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" style={d(160 + i * 80)}>
              <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", c.tile)}>
                {c.solid ? (
                  <span className="oc-pop flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white" style={d(500)}>
                    <Check className="h-5 w-5" strokeWidth={3} />
                  </span>
                ) : (
                  <c.icon className="h-7 w-7" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{c.k}</p>
                <p className="text-[16px] font-bold leading-snug text-slate-900">{c.v}</p>
                <p className="text-xs text-slate-500">{c.s}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="min-w-0 space-y-5">
            {/* ── Step 1 ── */}
            <Panel className="oc-fade-up pb-5" style={d(300)}>
              <StepHeading icon={ScanText} step="Step 1 - Processing" title="Choose your OCR engine" description="Select the engine e-Vault should use when extracting searchable text and document fields." />
              <div className="grid gap-4 px-5 pt-5 sm:px-6 lg:grid-cols-2">
                {/* Tesseract */}
                <label
                  className={cn(
                    "oc-lift relative flex cursor-pointer flex-col rounded-xl border-2 p-4 transition-colors duration-300",
                    !licensed ? "border-blue-600 bg-blue-50/30 shadow-[0_8px_24px_rgba(37,99,235,0.12)]" : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <input type="radio" name="engine" className="sr-only" checked={!licensed} onChange={() => patchForm({ engineMode: "TESSERACT" })} />
                  {!licensed && (
                    <span className="oc-pop absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md ring-2 ring-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <span className={cn("mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300", !licensed ? "border-blue-600" : "border-slate-300")}>
                      {!licensed && <span className="oc-pop h-2.5 w-2.5 rounded-full bg-blue-600" />}
                    </span>
                    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-900 text-white">
                      <span className="text-[17px] font-black leading-none">T</span>
                      <span className="mt-0.5 text-[6px] font-semibold uppercase tracking-wider text-slate-300">Tesseract</span>
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-bold text-slate-900">Tesseract OCR</h3>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">Recommended</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">Free &amp; Open Source OCR engine built in to e-Vault.</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 pl-1">
                    <Bullet ok delay={60}>Always available</Bullet>
                    <Bullet ok delay={120}>No external API required</Bullet>
                    <Bullet ok delay={180}>Supports multiple languages</Bullet>
                    <Bullet ok delay={240}>Good for standard documents (PDF, Images)</Bullet>
                  </ul>
                  <div className={cn("mt-4 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-colors duration-300", !licensed ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600")}>
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded border-2", !licensed ? "border-emerald-500 text-emerald-600" : "border-slate-300 text-slate-400")}>
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {!licensed ? "Active - Built in to e-Vault" : "Built in to e-Vault"}
                  </div>
                </label>

                {/* Cloud */}
                <label
                  className={cn(
                    "relative flex flex-col rounded-xl border-2 p-4 transition-colors duration-300",
                    entitled ? "oc-lift cursor-pointer" : "cursor-not-allowed opacity-75",
                    licensed ? "border-blue-600 bg-blue-50/30 shadow-[0_8px_24px_rgba(37,99,235,0.12)]" : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <input type="radio" name="engine" className="sr-only" disabled={!entitled} checked={licensed} onChange={chooseCloud} />
                  {licensed && (
                    <span className="oc-pop absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md ring-2 ring-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <span className={cn("mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300", licensed ? "border-blue-600" : "border-slate-300")}>
                      {licensed && <span className="oc-pop h-2.5 w-2.5 rounded-full bg-blue-600" />}
                    </span>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <CloudCog className="h-7 w-7" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-bold text-slate-900">Cloud Provider OCR</h3>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", entitled ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-800")}>
                          {entitled ? "Optional" : "Access locked"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">Use your own cloud OCR provider for higher accuracy.</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 pl-1">
                    <Bullet delay={60}>Supports advanced document types</Bullet>
                    <Bullet delay={120}>Higher accuracy for complex documents</Bullet>
                    <Bullet delay={180}>Custom provider (Azure / AWS / GCP etc.)</Bullet>
                    <Bullet delay={240}>Requires provider configuration</Bullet>
                  </ul>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      chooseCloud();
                    }}
                    disabled={!entitled}
                    className="oc-press mt-4 flex items-center gap-2.5 rounded-lg bg-blue-50 px-3 py-2.5 text-left text-[13px] font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed"
                  >
                    <Settings className="h-4 w-4" /> Bring your own provider account
                  </button>
                </label>
              </div>

              {!entitled ? (
                <div className="mx-5 mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:mx-6">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Licensed OCR access is not enabled</p>
                    <p className="mt-1 text-sm leading-5 text-amber-800">Contact your platform administrator to enable this module for your organisation. Tesseract remains available.</p>
                  </div>
                </div>
              ) : null}
            </Panel>

            {/* ── Step 2 ── */}
            <Panel className="oc-fade-up" style={d(380)}>
              <div className="pb-5">
                <StepHeading
                  icon={Settings}
                  step="Step 2 - Additional Settings"
                  title="Engine Settings"
                  description="Configure OCR processing options and default behaviours."
                  right={
                    <button
                      type="button"
                      onClick={() => setAdvOpen((v) => !v)}
                      aria-expanded={advOpen}
                      className="oc-press inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Settings className={cn("h-4 w-4 transition-transform duration-500", advOpen && "rotate-90")} /> Advanced Settings
                      <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", advOpen && "rotate-180")} />
                    </button>
                  }
                />
                <div className="px-5 pt-5 sm:px-6">
                  <ToggleRow
                    checked={form.fallbackToTesseract}
                    onChange={(checked) => patchForm({ fallbackToTesseract: checked })}
                    title="Use Tesseract as a fallback"
                    description="If the licensed provider fails, allow the existing Tesseract engine to process the document instead."
                  />
                </div>
              </div>

              {/* Advanced settings — slides open */}
              <div className="grid transition-[grid-template-rows,opacity] duration-500 ease-out" style={{ gridTemplateRows: advOpen ? "1fr" : "0fr", opacity: advOpen ? 1 : 0 }}>
                <div className="overflow-hidden">
                  <div className="space-y-6 border-t border-slate-100 p-5 sm:p-6">
                    {!entitled ? (
                      <p className="flex items-start gap-2 text-sm text-slate-500">
                        <Info className="mt-0.5 h-4 w-4 shrink-0" /> Provider settings are available once licensed OCR access is enabled for your organisation.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-[15px] font-bold text-slate-900">Connect your OCR provider</h3>
                            <p className="mt-0.5 text-[13px] text-slate-500">Secrets are write-only and are not returned to the browser.</p>
                          </div>
                          <StatusPill tone={hasCreds ? "success" : "neutral"} icon={hasCreds ? ShieldCheck : KeyRound}>
                            {hasCreds ? "Credentials saved" : "Not connected"}
                          </StatusPill>
                        </div>

                        {!data.encryptionConfigured ? (
                          <div role="alert" className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                            <div>
                              <p className="text-sm font-bold text-rose-900">Secure credential storage needs setup</p>
                              <p className="mt-1 text-sm leading-5 text-rose-800">
                                The server variable <code className="rounded bg-rose-100 px-1.5 py-0.5 text-xs">OCR_CREDENTIAL_ENCRYPTION_KEY</code> is not configured. Ask your server administrator to configure it before saving credentials.
                              </p>
                            </div>
                          </div>
                        ) : null}

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block min-w-0 sm:col-span-2">
                            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Provider <span className="text-rose-500">*</span></span>
                            <select
                              value={form.provider}
                              onChange={(e) => patchForm({ provider: e.target.value })}
                              aria-invalid={!!fieldErrors.provider}
                              className={cn("h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10", fieldErrors.provider ? "border-rose-400" : "border-slate-200 hover:border-slate-300")}
                            >
                              {(data.availableProviders || []).map((p) => (
                                <option key={p.key} value={p.key}>{p.displayName}</option>
                              ))}
                            </select>
                            {fieldErrors.provider ? <p className="mt-1.5 text-xs font-medium text-rose-600">{fieldErrors.provider}</p> : <p className="mt-1.5 text-xs text-slate-500">Only providers returned by the backend are shown here.</p>}
                          </label>
                          <Field label="Cloud project ID" value={form.projectId} onChange={(e) => patchForm({ projectId: e.target.value })} placeholder="your-project-id" error={fieldErrors.projectId} required hint="Project that owns your OCR processor." />
                          <Field label="Processor location" value={form.location} onChange={(e) => patchForm({ location: e.target.value })} placeholder="e.g. us or asia-south1" error={fieldErrors.location} required hint="Use the exact region where the processor was created." />
                          <div className="sm:col-span-2">
                            <Field label="Processor ID" value={form.processorId} onChange={(e) => patchForm({ processorId: e.target.value })} placeholder="Enter your processor ID" error={fieldErrors.processorId} required hint="Find this in your provider console's processor details." />
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <label htmlFor="ocr-creds" className="text-sm font-semibold text-slate-700">
                              Service-account key (JSON){" "}
                              {hasCreds ? <span className="font-normal text-slate-400">· optional to replace</span> : <span className="text-rose-500">*</span>}
                            </label>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><LockKeyhole className="h-3.5 w-3.5" /> Encrypted at rest</span>
                          </div>
                          <textarea
                            id="ocr-creds"
                            rows={hasCreds ? 3 : 6}
                            autoComplete="off"
                            spellCheck={false}
                            value={credentialsText}
                            onChange={(e) => setCredentialsText(e.target.value)}
                            placeholder={hasCreds ? "Credentials are already stored. Paste a new key only to replace them." : "Paste the contents of your service-account JSON key file"}
                            aria-invalid={!!fieldErrors.credentials}
                            className={cn("w-full resize-y rounded-xl border bg-slate-950 px-4 py-3 font-mono text-xs leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10", fieldErrors.credentials ? "border-rose-400" : "border-slate-800")}
                          />
                          {fieldErrors.credentials ? (
                            <p className="mt-1.5 text-xs font-medium text-rose-600">{fieldErrors.credentials}</p>
                          ) : (
                            <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> The key is sent to the server for encrypted storage, then cleared from this form. It is never displayed again.</p>
                          )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <ToggleRow checked={form.isProviderEnabled} onChange={(checked) => patchForm({ isProviderEnabled: checked })} title="Enable this provider for document processing" description="This setting allows the configured provider to be used when licensed OCR mode is selected." />
                          {fieldErrors.isProviderEnabled ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.isProviderEnabled}</p> : null}
                        </div>

                        {/* Connection health */}
                        <div className="border-t border-slate-100 pt-6">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="text-[15px] font-bold text-slate-900">Connection health</h3>
                              <p className="mt-0.5 text-[13px] text-slate-500">Verify saved provider credentials before processing documents.</p>
                            </div>
                            {testResult ? (
                              <StatusPill tone={testResult.connected ? "success" : "danger"} icon={testResult.connected ? CheckCircle2 : ShieldAlert}>
                                {testResult.connected ? "Connected" : "Connection failed"}
                              </StatusPill>
                            ) : (
                              <StatusPill tone="neutral">{lastTest?.status || "Not tested"}</StatusPill>
                            )}
                          </div>
                          <div aria-live="polite" className={cn("rounded-xl border p-4 transition-colors duration-500 sm:flex sm:items-start sm:justify-between sm:gap-4", testResult ? (testResult.connected ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50") : "border-slate-200 bg-slate-50")}>
                            <div className="flex gap-3">
                              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", testResult ? (testResult.connected ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700") : "bg-white text-slate-500 ring-1 ring-slate-200")}>
                                {testing ? <Loader2 className="h-5 w-5 animate-spin" /> : testResult?.connected ? <CheckCircle2 className="oc-pop h-5 w-5" /> : testResult ? <ShieldAlert className="oc-pop h-5 w-5" /> : <PlugZap className="h-5 w-5" />}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900">
                                  {testing ? "Testing provider connection…" : testResult ? (testResult.connected ? "Provider connection successful" : "Provider connection unsuccessful") : lastTest ? `Last test: ${lastTest.status || "Unknown"}` : "No connection test yet"}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                  {testing
                                    ? "Please wait while e-Vault verifies the saved configuration."
                                    : testResult?.message ||
                                      (lastTest
                                        ? `${lastTest.message || "No message returned."} Last checked ${fmt(lastTest.at)}. Last successful test: ${fmt(lastTest.lastSuccessAt)}.`
                                        : "Save your configuration, then run a test. This checks connectivity without processing a document.")}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={test}
                              disabled={!hasCreds || saving || testing}
                              className="oc-press mt-4 inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0"
                            >
                              <PlugZap className="h-4 w-4" />
                              {testing ? "Testing…" : "Test connection"}
                            </button>
                          </div>
                          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
                            <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0" /> A successful connection confirms authentication and provider access. Actual OCR extraction should still be verified with a sample document.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Panel>
          </main>

          {/* ── Sidebar ── */}
          <aside className="space-y-4 xl:sticky xl:top-5">
            <Panel className="oc-fade-up overflow-hidden" style={d(340)}>
              <div className="bg-gradient-to-br from-white to-blue-50/80 px-5 pb-4 pt-5">
                <div className="flex items-center gap-2 text-blue-700">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Configuration Overview</span>
                </div>
                <h2 className="mt-2 text-[17px] font-bold text-slate-900">Your OCR setup</h2>
                <p className="mt-0.5 text-[13px] text-slate-500">A quick view of the current configuration and readiness.</p>
              </div>
              <div className="space-y-5 p-5">
                <OverviewRow
                  icon={ScanText}
                  tile="bg-blue-50 text-blue-600"
                  label="Selected engine"
                  value={licensed ? "Licensed OCR" : "Tesseract OCR"}
                  delay={420}
                  action={
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-700">
                      <span className="oc-dot h-2 w-2 rounded-full bg-emerald-500" /> Active
                    </span>
                  }
                />
                <OverviewRow
                  icon={CloudCog}
                  tile="bg-blue-50 text-blue-600"
                  label="Provider access"
                  value={entitled ? "Available" : "Restricted"}
                  sub={entitled ? (licensed ? providerName : "Ready to configure") : "Admin approval needed"}
                  delay={500}
                  action={
                    <button
                      type="button"
                      disabled={!entitled}
                      onClick={chooseCloud}
                      className={cn("oc-press rounded-lg px-4 py-2 text-[13px] font-semibold", entitled ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : "cursor-not-allowed bg-amber-50 text-amber-700")}
                    >
                      {entitled ? "Configure" : "Locked"}
                    </button>
                  }
                />
                <OverviewRow
                  icon={LockKeyhole}
                  tile="bg-emerald-50 text-emerald-600"
                  label="Credentials"
                  value={hasCreds ? "Saved securely" : "Not configured"}
                  sub={data?.encryptionConfigured ? (hasCreds ? "Encrypted on server" : "Ready for setup") : "Server setup required"}
                  delay={580}
                  action={
                    <button
                      type="button"
                      onClick={() => entitled && setAdvOpen(true)}
                      className={cn("oc-press rounded-lg px-4 py-2 text-[13px] font-semibold", hasCreds ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-rose-50 text-rose-600 hover:bg-rose-100")}
                    >
                      {hasCreds ? "Saved" : "Setup"}
                    </button>
                  }
                />
                <div className="oc-fade-up flex items-center gap-3 border-t border-slate-100 pt-4" style={d(660)}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Clock3 className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Last updated</p>
                    <p className="text-sm font-bold text-slate-900">{fmt(updatedAt)}</p>
                    {updatedBy ? <p className="text-xs text-slate-500">by <span className="font-semibold text-slate-700">{updatedBy}</span></p> : null}
                  </div>
                </div>
              </div>
            </Panel>

            {entitled && hasCreds ? (
              <Panel className="oc-fade-up p-5" style={d(720)}>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Trash2 className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900">Remove provider credentials</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Disconnect the stored service-account key from this tenant.</p>
                    {confirmClear ? (
                      <div className="oc-fade-in mt-3 space-y-2">
                        <p className="text-xs font-semibold text-rose-700">Are you sure? The stored key will be removed.</p>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={clearCreds} disabled={saving} className="oc-press rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">{saving ? "Removing…" : "Confirm remove"}</button>
                          <button onClick={() => setConfirmClear(false)} className="oc-press rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmClear(true)} className="mt-3 text-xs font-bold text-rose-600 transition hover:text-rose-800">
                        Remove credentials <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </Panel>
            ) : null}
          </aside>
        </div>

        {/* ── Sticky footer ── */}
        <footer className="oc-fade-up sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:pl-4" style={d(500)}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-bold text-slate-900">Changes apply to this tenant only</p>
              <p className="text-xs text-slate-500">Save before testing the provider connection.</p>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={discard}
              disabled={saving}
              className="oc-press group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180" /> Discard Settings
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="oc-press inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white shadow-[0_6px_16px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_10px_22px_rgba(37,99,235,0.35)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" strokeWidth={3} />}
              {saving ? "Saving settings…" : "Save Configuration"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}