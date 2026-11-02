import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Building2,
  Plus,
  X,
  Search,
  Loader2,
  AlertCircle,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Factory,
  Power,
  CheckCircle2,
  XCircle,
  Info,
  Home,
  HelpCircle,
  Copy,
  Check,
  FileText,
  PieChart,
  MoreVertical,
  Sprout,
  RefreshCw,
} from "lucide-react";

import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;
const PAGE_SIZE = 8;
const BLUE = "#0D6EFD";

// ── Auth / API helpers ──────────────────────────────────────────
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
  };
}

async function api(path, method = "GET", body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {}
  if (!res.ok || !data.success) throw new Error(data.message || "Request failed");
  return data;
}

// Backend only allows SuperAdmin / TenantAdmin to create, edit & deactivate.
// Other roles are read-only, so we hide those buttons for them.
// (If the role can't be read from localStorage we show the buttons and let
// the backend enforce the permission.)
function getRole() {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    return u?.role || localStorage.getItem("role") || null;
  } catch {
    return null;
  }
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return "—";
  return dt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Animations (scoped, no tailwind config needed) ─────────────
const ANIM_CSS = `
@keyframes cc-fade-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes cc-fade-in{from{opacity:0}to{opacity:1}}
@keyframes cc-fade-out{from{opacity:1}to{opacity:0}}
@keyframes cc-slide-left{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:none}}
@keyframes cc-scale-in{from{opacity:0;transform:translateY(10px) scale(.95)}to{opacity:1;transform:none}}
@keyframes cc-scale-out{from{opacity:1;transform:none}to{opacity:0;transform:translateY(6px) scale(.96)}}
@keyframes cc-menu-in{from{opacity:0;transform:translateY(-6px) scale(.96)}to{opacity:1;transform:none}}
@keyframes cc-toast-in{from{opacity:0;transform:translateY(18px) scale(.95)}to{opacity:1;transform:none}}
@keyframes cc-pop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}
@keyframes cc-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
@keyframes cc-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.cc-fade-up{animation:cc-fade-up .55s cubic-bezier(.22,1,.36,1) both}
.cc-fade-in{animation:cc-fade-in .2s ease-out both}
.cc-fade-out{animation:cc-fade-out .18s ease-in both}
.cc-slide-left{animation:cc-slide-left .45s cubic-bezier(.22,1,.36,1) both}
.cc-scale-in{animation:cc-scale-in .28s cubic-bezier(.22,1,.36,1) both}
.cc-scale-out{animation:cc-scale-out .18s ease-in both}
.cc-menu-in{animation:cc-menu-in .16s ease-out both;transform-origin:top right}
.cc-toast-in{animation:cc-toast-in .35s cubic-bezier(.22,1,.36,1) both}
.cc-pop{animation:cc-pop .35s cubic-bezier(.34,1.56,.64,1) both}
.cc-float{animation:cc-float 4s ease-in-out infinite}
.cc-skel{background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:1200px 100%;animation:cc-shimmer 1.5s infinite linear}
.dark .cc-skel{background:linear-gradient(90deg,#243247 25%,#2d3d54 50%,#243247 75%);background-size:1200px 100%}
.cc-press{transition:transform .15s ease,box-shadow .2s ease,background-color .2s ease,border-color .2s ease}
.cc-press:active{transform:scale(.96)}
@media (prefers-reduced-motion:reduce){
  .cc-root *{animation-duration:.01ms!important;animation-delay:0ms!important;transition-duration:.01ms!important}
}
`;

// ── Hooks ──────────────────────────────────────────────────────
function useCountUp(target, duration = 800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

// ── Small UI pieces ────────────────────────────────────────────
function StatusBadge({ status, dot = false }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-[3px] rounded-full border whitespace-nowrap ${
        active
          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
          : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
      }`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"}`}
        />
      )}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

const CODE_COLORS = [
  "bg-blue-600",
  "bg-purple-600",
  "bg-emerald-600",
  "bg-orange-500",
  "bg-pink-600",
  "bg-teal-600",
  "bg-indigo-600",
];
function codeColor(code = "") {
  let n = 0;
  for (let i = 0; i < code.length; i++) n += code.charCodeAt(i);
  return CODE_COLORS[n % CODE_COLORS.length];
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  async function copy(e) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  return (
    <button
      onClick={copy}
      title={copied ? "Copied!" : "Copy"}
      className="cc-press w-6 h-6 inline-flex items-center justify-center rounded-md text-slate-500 hover:text-[#0D6EFD] hover:bg-blue-50 dark:hover:bg-slate-700"
    >
      {copied ? (
        <Check key="ok" className="cc-pop w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy key="cp" className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function Card({ children, className = "", style }) {
  return (
    <div
      style={style}
      className={`bg-white dark:bg-[#1A2433] border border-slate-200/70 dark:border-slate-700 rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

// ── Donut (animated stroke) ────────────────────────────────────
function DonutChart({ active, inactive }) {
  const total = active + inactive;
  const size = 170;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [go, setGo] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGo(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const activeLen = total === 0 || !go ? 0 : c * (active / total);
  const full = total > 0 && active === total;
  const count = useCountUp(total, 900);

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-100 dark:text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={BLUE}
          strokeWidth={stroke}
          strokeDasharray={`${activeLen} ${c - activeLen}`}
          strokeLinecap={full ? "butt" : "round"}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1)" }}
        />
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-800 dark:fill-slate-100"
          style={{ fontSize: 30, fontWeight: 700 }}
        >
          {count}
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-400"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}
        >
          PLANTS
        </text>
      </svg>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, deco: Deco, tone, iconBg, decoTone, delay }) {
  const n = useCountUp(value);
  return (
    <Card
      className="cc-fade-up relative overflow-hidden p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
      >
        <Icon className={`w-6 h-6 ${tone}`} />
      </div>
      <div className="min-w-0 z-10">
        <div className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
          {label}
        </div>
        <div className="text-[32px] font-bold leading-tight text-slate-900 dark:text-slate-50">
          {n}
        </div>
      </div>
      <Deco
        className={`cc-float absolute -right-1 bottom-1 w-[72px] h-[72px] opacity-[0.12] ${decoTone}`}
        strokeWidth={1.4}
      />
    </Card>
  );
}

// ── Modal shell (animated enter + exit, Esc / backdrop close) ──
function ModalShell({ onClose, maxW = "max-w-md", children }) {
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    const h = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [close]);

  return (
    <div
      className={`fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 ${
        closing ? "cc-fade-out" : "cc-fade-in"
      }`}
      style={{ backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className={`bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full ${maxW} shadow-2xl overflow-hidden ${
          closing ? "cc-scale-out" : "cc-scale-in"
        }`}
      >
        {children(close)}
      </div>
    </div>
  );
}

function ModalHeader({ icon: Icon, title, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0D6EFD] flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
          {title}
        </h3>
      </div>
      <button
        onClick={onClose}
        className="cc-press w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="cc-scale-in flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message}
    </div>
  );
}

const inputCls =
  "w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-[#0D6EFD] focus:ring-2 focus:ring-blue-500/15 transition placeholder-slate-300 dark:placeholder-slate-600";
const labelCls =
  "block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2";

// ── Create / Edit Company Code ─────────────────────────────────
function CompanyCodeModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [code, setCode] = useState(initial?.code || "");
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(close) {
    setError("");
    if (!isEdit && !code.trim()) return setError("Company code is required.");
    if (!name.trim()) return setError("Name is required.");
    setLoading(true);
    try {
      if (isEdit) {
        // send description as "" (not undefined) so it can be cleared
        await api(`/company-codes/${initial.id}`, "PUT", {
          name: name.trim(),
          description: description.trim(),
        });
      } else {
        await api(`/company-codes`, "POST", {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || undefined,
        });
      }
      await onSaved(isEdit);
      close();
    } catch (e) {
      setError(e.message || "Server error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <>
          <ModalHeader
            icon={Building2}
            title={isEdit ? "Edit Company Code" : "New Company Code"}
            onClose={close}
          />
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className={labelCls}>
                Code {!isEdit && <span className="text-red-500">*</span>}
              </label>
              {isEdit ? (
                <div className="bg-slate-50 dark:bg-[#151E2B] rounded-xl px-3 py-[10px] text-[13px] font-mono font-bold text-slate-600 dark:text-slate-400">
                  {initial.code}
                </div>
              ) : (
                <input
                  type="text"
                  autoFocus
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError("");
                  }}
                  placeholder="e.g. 1000, IN01"
                  maxLength={10}
                  className={`${inputCls} font-mono`}
                />
              )}
              {!isEdit && (
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Short unique code within your tenant — auto-uppercased.
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Acme India Pvt Ltd"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Description{" "}
                <span className="text-slate-400 font-normal normal-case tracking-normal">
                  (optional)
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>
            <ErrorBox message={error} />
          </div>
          <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={close}
              className="cc-press flex-1 py-[10px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(close)}
              disabled={loading}
              className="cc-press flex-1 py-[10px] rounded-xl bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[12.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Company Code"
              )}
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ── Create / Edit Plant (POST/PUT /plants) ─────────────────────
function PlantModal({ companyCode, initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [code, setCode] = useState(initial?.code || "");
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(close) {
    setError("");
    if (!isEdit && !code.trim()) return setError("Plant code is required.");
    if (!name.trim()) return setError("Plant name is required.");
    setLoading(true);
    try {
      if (isEdit) {
        await api(`/plants/${initial.id}`, "PUT", {
          name: name.trim(),
          description: description.trim(),
        });
      } else {
        await api(`/plants`, "POST", {
          companyCodeId: companyCode.id,
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || undefined,
        });
      }
      await onSaved(isEdit);
      close();
    } catch (e) {
      setError(e.message || "Server error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <>
          <ModalHeader
            icon={Factory}
            title={isEdit ? "Edit Plant" : "New Plant"}
            onClose={close}
          />
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-2 text-[11.5px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#151E2B] rounded-xl px-3 py-2">
              <Building2 className="w-3.5 h-3.5" />
              Company Code:
              <span className="font-mono font-bold text-[#0D6EFD]">
                {companyCode.code}
              </span>
              <span className="truncate">· {companyCode.name}</span>
            </div>
            <div>
              <label className={labelCls}>
                Plant Code {!isEdit && <span className="text-red-500">*</span>}
              </label>
              {isEdit ? (
                <div className="bg-slate-50 dark:bg-[#151E2B] rounded-xl px-3 py-[10px] text-[13px] font-mono font-bold text-slate-600 dark:text-slate-400">
                  {initial.code}
                </div>
              ) : (
                <input
                  type="text"
                  autoFocus
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError("");
                  }}
                  placeholder="e.g. P001, BBSR1"
                  maxLength={20}
                  className={`${inputCls} font-mono`}
                />
              )}
            </div>
            <div>
              <label className={labelCls}>
                Plant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Bhubaneswar plant"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Description{" "}
                <span className="text-slate-400 font-normal normal-case tracking-normal">
                  (optional)
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>
            <ErrorBox message={error} />
          </div>
          <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={close}
              className="cc-press flex-1 py-[10px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(close)}
              disabled={loading}
              className="cc-press flex-1 py-[10px] rounded-xl bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[12.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Plant"
              )}
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ── Confirm (deactivate company code / plant) ──────────────────
function ConfirmModal({ title, name, message, confirmLabel, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run(close) {
    setLoading(true);
    setError("");
    try {
      await onConfirm();
      close();
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell onClose={onClose} maxW="max-w-sm">
      {(close) => (
        <div className="p-6">
          <div className="cc-pop w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <Power className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 text-center mb-1">
            {title}
          </h3>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 text-center mb-4 leading-relaxed">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              "{name}"
            </span>{" "}
            {message}
          </p>
          {error && (
            <div className="mb-4">
              <ErrorBox message={error} />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={close}
              className="cc-press flex-1 py-[10px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => run(close)}
              disabled={loading}
              className="cc-press flex-1 py-[10px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Please wait…
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

// ── Guide Modal ────────────────────────────────────────────────
function GuideModal({ onClose }) {
  const steps = [
    {
      title: "Create a Company Code",
      desc: "Click the Add button to create a new company code. Give it a short unique code (e.g. 1000, IN01) and a name.",
    },
    {
      title: "Select a Company Code",
      desc: "Click any company code from the list on the left to view its details on the right.",
    },
    {
      title: "Add Plants",
      desc: "With a company code selected, use the Add Plant button in the plants table to create plants directly under it.",
    },
    {
      title: "Edit Details",
      desc: "Use Edit to update the name or description. The code itself cannot be changed after creation. Plants can be edited from the ⋮ menu.",
    },
    {
      title: "Deactivate",
      desc: "Deactivating marks a company code inactive. It is blocked while active plants exist — deactivate those first. A plant is blocked while it has active department mappings.",
    },
  ];
  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <>
          <ModalHeader icon={Info} title="Company Codes — Guide" onClose={close} />
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="cc-fade-up flex gap-3"
                style={{ animationDelay: `${80 + i * 60}ms` }}
              >
                <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#0D6EFD] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
                    {s.title}
                  </div>
                  <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={close}
              className="cc-press w-full py-[10px] rounded-xl bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[12.5px] font-bold"
            >
              Got it
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ── Plant row ⋮ menu ───────────────────────────────────────────
function RowMenu({ onEdit, onDeactivate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="cc-press w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="cc-menu-in absolute right-0 top-full mt-1 w-40 z-30 bg-white dark:bg-[#232F40] border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl py-1">
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit plant
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDeactivate();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Power className="w-3.5 h-3.5" /> Deactivate
          </button>
        </div>
      )}
    </div>
  );
}

// ── Skeletons ──────────────────────────────────────────────────
function ListSkeleton() {
  return (
    <div className="px-3 py-2 space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3">
          <div className="cc-skel w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="cc-skel h-3 w-2/3 rounded" />
            <div className="cc-skel h-2.5 w-1/3 rounded" />
          </div>
          <div className="cc-skel h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="cc-skel h-[110px] rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="cc-skel h-[100px] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="cc-skel h-[240px] rounded-2xl xl:col-span-2" />
        <div className="cc-skel h-[240px] rounded-2xl" />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function CompanyCodes({ showHeader = true }) {
  const [companyCodes, setCompanyCodes] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [plantModal, setPlantModal] = useState(null); // { plant? }
  const [plantDelete, setPlantDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const canManage = useMemo(() => {
    const r = getRole();
    return !r || r === "SuperAdmin" || r === "TenantAdmin";
  }, []);

  const showToast = (msg) => setToast({ id: Date.now(), msg });
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchCompanyCodes(silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await api("/company-codes");
      setCompanyCodes(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlants() {
    try {
      const data = await api("/plants");
      setPlants(data.data || []);
    } catch {}
  }

  useEffect(() => {
    fetchCompanyCodes();
    fetchPlants();
  }, []);

  useEffect(() => setPage(1), [search]);

  // Keep a valid selection: auto-select first item, and fall back to the
  // first one if the selected company code disappears (e.g. deactivated).
  useEffect(() => {
    if (loading) return;
    if (companyCodes.length === 0) return setSelectedId(null);
    if (!companyCodes.some((c) => c.id === selectedId))
      setSelectedId(companyCodes[0].id);
  }, [loading, companyCodes, selectedId]);

  const selected = companyCodes.find((c) => c.id === selectedId) || null;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return companyCodes.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q),
    );
  }, [companyCodes, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const plantsFor = (id) => plants.filter((p) => p.companyCodeId === id);
  const selectedPlants = selected ? plantsFor(selected.id) : [];
  const activePlants = selectedPlants.filter((p) => p.status === "ACTIVE").length;
  const inactivePlants = selectedPlants.length - activePlants;

  async function deactivateCompany() {
    await api(`/company-codes/${deleteItem.id}`, "DELETE");
    showToast(`"${deleteItem.name}" deactivated`);
    await fetchCompanyCodes(true);
    fetchPlants();
  }

  async function deactivatePlant() {
    await api(`/plants/${plantDelete.id}`, "DELETE");
    showToast(`Plant "${plantDelete.name}" deactivated`);
    await fetchPlants();
  }

  return (
    <div className="cc-root">
      <style>{ANIM_CSS}</style>

      {/* ── Page header ── */}
      {showHeader && (
        <div className="cc-fade-up flex items-start justify-between gap-4 mb-6">
          <div>
            <nav className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400 mb-3">
              <Home className="w-4 h-4 text-[#0D6EFD]" />
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span>Organization</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                Company Code Configuration
              </span>
            </nav>
            <h1 className="text-[28px] leading-tight font-bold text-slate-900 dark:text-slate-50">
              Company Code Configuration
            </h1>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1.5">
              Manage company codes and their plants. Configure organizational
              structure for document management.
            </p>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="cc-press flex-shrink-0 flex items-center gap-2 bg-white dark:bg-[#1A2433] border border-slate-200/70 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-[#0D6EFD] shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <HelpCircle className="w-4 h-4" /> Help &amp; Support
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(340px,34%)_1fr] gap-5 items-stretch">
        {/* ═══════════ LEFT: List ═══════════ */}
        <Card
          className="cc-fade-up flex flex-col min-h-[640px] overflow-hidden"
          style={{ animationDelay: "60ms" }}
        >
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[20px] font-bold text-slate-900 dark:text-slate-50">
                    Company Codes
                  </h2>
                  <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-full px-2.5 py-0.5">
                    {companyCodes.length}
                  </span>
                </div>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1.5">
                  {companyCodes.length} company code(s)
                  <span className="mx-1.5 opacity-50">·</span>
                  Tenant &rarr; Company Code &rarr; Plant
                </p>
              </div>
              {canManage && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="cc-press flex-shrink-0 flex items-center gap-1.5 bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[13px] font-semibold rounded-lg px-4 py-2 shadow-[0_4px_12px_rgba(13,110,253,0.3)] hover:shadow-[0_6px_16px_rgba(13,110,253,0.4)]"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              )}
            </div>
          </div>

          <div className="px-4 pb-3 relative">
            <Search className="w-4 h-4 text-[#0D6EFD] absolute left-8 top-1/2 -translate-y-[60%]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or code..."
              className="w-full text-[13px] pl-10 pr-3 py-[11px] border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-[#0D6EFD] focus:ring-2 focus:ring-blue-500/15 transition placeholder-slate-400 dark:placeholder-slate-600"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {loading && <ListSkeleton />}

            {!loading && error && (
              <div className="cc-fade-up flex flex-col items-center gap-3 py-10 px-4 text-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <p className="text-[12px] font-semibold text-red-500">{error}</p>
                <button
                  onClick={() => fetchCompanyCodes()}
                  className="cc-press flex items-center gap-1.5 text-[12px] font-semibold text-[#0D6EFD] border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              paged.map((c, i) => {
                const sel = selected?.id === c.id;
                return (
                  <div
                    key={`${page}-${c.id}`}
                    onClick={() => setSelectedId(c.id)}
                    style={{ animationDelay: `${120 + i * 55}ms` }}
                    className={`cc-slide-left group flex items-center gap-3 px-3 py-3 mb-1.5 cursor-pointer rounded-xl border border-l-[3px] transition-all duration-300 ${
                      sel
                        ? "bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 border-l-[#0D6EFD] shadow-sm"
                        : "border-transparent border-l-transparent hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                        c.status === "ACTIVE" ? codeColor(c.code) : "bg-slate-400"
                      }`}
                    >
                      {c.code?.slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14.5px] font-bold text-slate-900 dark:text-slate-100 truncate">
                        {c.name}
                      </div>
                      <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {c.code}
                        <span className="mx-1.5">·</span>
                        {plantsFor(c.id).length} plants
                      </div>
                    </div>
                    <StatusBadge status={c.status} />
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 transition-all duration-300 group-hover:translate-x-1 ${
                        sel ? "text-slate-800 dark:text-slate-100" : "text-slate-400"
                      }`}
                    />
                  </div>
                );
              })}

            {!loading && !error && filtered.length === 0 && (
              <div className="cc-fade-up flex flex-col items-center gap-3 py-14 text-slate-400">
                <Building2 className="w-9 h-9 opacity-40" />
                <span className="text-[12.5px]">
                  {companyCodes.length === 0
                    ? "No company codes yet."
                    : "No company codes found."}
                </span>
                {canManage && companyCodes.length === 0 && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="cc-press flex items-center gap-1.5 bg-[#0D6EFD] text-white text-[12px] font-semibold rounded-lg px-3.5 py-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create your first one
                  </button>
                )}
              </div>
            )}
          </div>

          {!loading && !error && totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-[11.5px] text-slate-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="cc-press p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="cc-press p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* ═══════════ RIGHT: Details ═══════════ */}
        <div className="min-w-0">
          {loading ? (
            <DetailSkeleton />
          ) : !selected ? (
            <Card className="cc-fade-up flex flex-col items-center justify-center h-full min-h-[400px] gap-3 text-slate-400 p-10">
              <Building2 className="w-12 h-12 opacity-40 cc-float" />
              <span className="text-[13.5px]">
                Select a company code to view details
              </span>
            </Card>
          ) : (
            // key → remounts on selection change so the whole panel
            // re-animates (cards slide up, numbers count, donut draws)
            <div key={selected.id} className="space-y-5">
              {/* Header card */}
              <Card
                className="cc-fade-up px-6 py-5 flex flex-wrap items-center justify-between gap-4"
                style={{ animationDelay: "0ms" }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-[66px] h-[66px] rounded-xl flex items-center justify-center text-[19px] font-bold text-white flex-shrink-0 shadow-md ${
                      selected.status === "ACTIVE"
                        ? codeColor(selected.code)
                        : "bg-slate-400"
                    }`}
                  >
                    {selected.code?.slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-[21px] font-bold text-slate-900 dark:text-slate-50 truncate">
                        {selected.name}
                      </h3>
                      <StatusBadge status={selected.status} />
                    </div>
                    <div className="flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                      Company Code:
                      <span className="font-bold text-[#0D6EFD]">
                        {selected.code}
                      </span>
                      <CopyButton text={selected.code} />
                    </div>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400">
                      {selectedPlants.length} plants configured
                    </div>
                  </div>
                </div>

                {canManage && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditItem(selected)}
                      className="cc-press flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-transparent text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:-translate-y-0.5"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteItem(selected)}
                      className="cc-press flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-[13.5px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:-translate-y-0.5"
                    >
                      <Power className="w-4 h-4" /> Deactivate
                    </button>
                  </div>
                )}
              </Card>

              {/* Stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard
                  label="Total Plants"
                  value={selectedPlants.length}
                  icon={Building2}
                  deco={Building2}
                  tone="text-[#0D6EFD]"
                  iconBg="bg-blue-50 dark:bg-blue-900/20"
                  decoTone="text-[#0D6EFD]"
                  delay={70}
                />
                <StatCard
                  label="Active Plants"
                  value={activePlants}
                  icon={CheckCircle2}
                  deco={Sprout}
                  tone="text-emerald-500"
                  iconBg="bg-emerald-50 dark:bg-emerald-900/20"
                  decoTone="text-emerald-500"
                  delay={130}
                />
                <StatCard
                  label="Inactive Plants"
                  value={inactivePlants}
                  icon={XCircle}
                  deco={Building2}
                  tone="text-red-500"
                  iconBg="bg-red-50 dark:bg-red-900/20"
                  decoTone="text-red-500"
                  delay={190}
                />
              </div>

              {/* Table + donut */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
                <div className="xl:col-span-2 space-y-5">
                  {/* Plants table */}
                  <Card
                    className="cc-fade-up pb-3"
                    style={{ animationDelay: "250ms" }}
                  >
                    <div className="flex items-center justify-between px-5 py-4">
                      <h4 className="text-[14.5px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                        <Factory className="w-[18px] h-[18px] text-slate-600 dark:text-slate-300" />
                        Plants under this company code
                      </h4>
                      {canManage && (
                        <button
                          onClick={() => setPlantModal({})}
                          className="cc-press flex items-center gap-1.5 text-[12px] font-semibold text-[#0D6EFD] border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Plant
                        </button>
                      )}
                    </div>

                    {selectedPlants.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                        <Factory className="w-9 h-9 opacity-40" />
                        <span className="text-[12.5px]">
                          No plants yet.
                          {canManage && " Add your first plant to get started."}
                        </span>
                      </div>
                    ) : (
                      <table className="w-full text-[13.5px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-[#151E2B]">
                            {["Code", "Name", "Status", "Actions"].map((h, i) => (
                              <th
                                key={h}
                                className={`text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 px-5 py-2.5 ${
                                  i === 3 ? "text-right" : "text-left"
                                } ${h === "Actions" && !canManage ? "hidden" : ""}`}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPlants.map((p, i) => (
                            <tr
                              key={p.id}
                              style={{ animationDelay: `${320 + i * 60}ms` }}
                              className="cc-fade-up border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50/80 dark:hover:bg-[#151E2B] transition-colors duration-200"
                            >
                              <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-100">
                                {p.code}
                              </td>
                              <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
                                {p.name}
                              </td>
                              <td className="px-5 py-3.5">
                                <StatusBadge status={p.status} dot />
                              </td>
                              {canManage && (
                                <td className="px-5 py-2 text-right">
                                  <RowMenu
                                    onEdit={() => setPlantModal({ plant: p })}
                                    onDeactivate={() => setPlantDelete(p)}
                                  />
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Card>

                  {/* Company details */}
                  <Card
                    className="cc-fade-up px-5 py-4"
                    style={{ animationDelay: "330ms" }}
                  >
                    <h4 className="text-[14.5px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 mb-4">
                      <FileText className="w-[18px] h-[18px] text-[#0D6EFD]" />
                      Company Details
                    </h4>
                    <div className="space-y-3 text-[13.5px]">
                      {[
                        {
                          k: "Code",
                          v: (
                            <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                              {selected.code}
                              <CopyButton text={selected.code} />
                            </span>
                          ),
                        },
                        { k: "Status", v: <StatusBadge status={selected.status} /> },
                        {
                          k: "Description",
                          v: (
                            <span className="text-slate-700 dark:text-slate-200">
                              {selected.description || "—"}
                            </span>
                          ),
                        },
                        {
                          k: "Created",
                          v: (
                            <span className="text-slate-700 dark:text-slate-200">
                              {fmtDate(selected.createdAt)}
                            </span>
                          ),
                        },
                        {
                          k: "Last Updated",
                          v: (
                            <span className="text-slate-700 dark:text-slate-200">
                              {fmtDate(selected.updatedAt)}
                            </span>
                          ),
                        },
                      ].map((row) => (
                        <div
                          key={row.k}
                          className="grid grid-cols-[150px_1fr] items-center gap-3"
                        >
                          <span className="text-slate-500 dark:text-slate-400">
                            {row.k}
                          </span>
                          <div>{row.v}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Donut */}
                <Card
                  className="cc-fade-up p-5"
                  style={{ animationDelay: "290ms" }}
                >
                  <h4 className="text-[14.5px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 mb-4">
                    <PieChart className="w-[18px] h-[18px] text-slate-600 dark:text-slate-300" />
                    Plant Status Breakdown
                  </h4>
                  <DonutChart active={activePlants} inactive={inactivePlants} />
                  <div className="flex items-center justify-center gap-5 mt-5">
                    <div className="flex items-center gap-2 text-[13px] text-slate-600 dark:text-slate-300">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: BLUE }}
                      />
                      Active ({activePlants})
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-slate-600 dark:text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-600" />
                      Inactive ({inactivePlants})
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      {showCreate && (
        <CompanyCodeModal
          onClose={() => setShowCreate(false)}
          onSaved={async () => {
            await fetchCompanyCodes(true);
            showToast("Company code created");
          }}
        />
      )}

      {editItem && (
        <CompanyCodeModal
          initial={editItem}
          onClose={() => setEditItem(null)}
          onSaved={async () => {
            await fetchCompanyCodes(true);
            showToast("Company code updated");
          }}
        />
      )}

      {deleteItem && (
        <ConfirmModal
          title="Deactivate Company Code?"
          name={deleteItem.name}
          message="will be marked inactive. This is blocked if it still has active plants."
          confirmLabel="Yes, deactivate"
          onConfirm={deactivateCompany}
          onClose={() => setDeleteItem(null)}
        />
      )}

      {plantModal && selected && (
        <PlantModal
          companyCode={selected}
          initial={plantModal.plant}
          onClose={() => setPlantModal(null)}
          onSaved={async (isEdit) => {
            await fetchPlants();
            showToast(isEdit ? "Plant updated" : "Plant created");
          }}
        />
      )}

      {plantDelete && (
        <ConfirmModal
          title="Deactivate Plant?"
          name={plantDelete.name}
          message="will be marked inactive. This is blocked if it still has active department mappings."
          confirmLabel="Yes, deactivate"
          onConfirm={deactivatePlant}
          onClose={() => setPlantDelete(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          key={toast.id}
          className="cc-toast-in fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[13px] font-semibold rounded-xl px-4 py-3 shadow-2xl"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          {toast.msg}
        </div>
      )}
    </div>
  );
} 