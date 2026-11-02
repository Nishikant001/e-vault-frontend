import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Factory,
  Plus,
  X,
  Search,
  Loader2,
  AlertCircle,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  Building2,
  Power,
  Layers,
  Info,
  Home,
  HelpCircle,
  Copy,
  Check,
  FileText,
  Hash,
  MoreVertical,
  RefreshCw,
  SlidersHorizontal,
  Settings,
  ShieldCheck,
  History,
  User,
  Clock,
  CalendarDays,
  Trash2,
  CheckCircle2,
} from "lucide-react";

import { API_BASE_URL } from "../../services/apiClient";

const API = API_BASE_URL;
const PAGE_SIZE = 8;
const BLUE = "#0D6EFD";
const TEAL = "#0d9488";
const GREEN = "#10b981";
const RED = "#ef4444";

// ── Auth / API helpers ──────────────────────────────────────────
function getToken() {
  return localStorage.getItem("accessToken") || "";
}
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}
function decodeToken() {
  try {
    const t = getToken();
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1]));
  } catch {
    return null;
  }
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
// Backend sirf SuperAdmin / TenantAdmin ko create, edit & deactivate allow karta hai.
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
  return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
function fmtDateTime(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return "—";
  const time = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${fmtDate(d)} ${time}`;
}

// ── Animations (scoped, tailwind config ki zarurat nahi) ───────
const ANIM_CSS = `
@keyframes pl-fade-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes pl-fade-in{from{opacity:0}to{opacity:1}}
@keyframes pl-fade-out{from{opacity:1}to{opacity:0}}
@keyframes pl-slide-left{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:none}}
@keyframes pl-slide-right{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
@keyframes pl-scale-in{from{opacity:0;transform:translateY(10px) scale(.95)}to{opacity:1;transform:none}}
@keyframes pl-scale-out{from{opacity:1;transform:none}to{opacity:0;transform:translateY(6px) scale(.96)}}
@keyframes pl-menu-in{from{opacity:0;transform:translateY(-6px) scale(.96)}to{opacity:1;transform:none}}
@keyframes pl-toast-in{from{opacity:0;transform:translateY(18px) scale(.95)}to{opacity:1;transform:none}}
@keyframes pl-pop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}
@keyframes pl-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
@keyframes pl-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes pl-pulse-ring{0%{box-shadow:0 0 0 0 rgba(16,185,129,.45)}100%{box-shadow:0 0 0 7px rgba(16,185,129,0)}}
.pl-fade-up{animation:pl-fade-up .55s cubic-bezier(.22,1,.36,1) both}
.pl-fade-in{animation:pl-fade-in .2s ease-out both}
.pl-fade-out{animation:pl-fade-out .18s ease-in both}
.pl-slide-left{animation:pl-slide-left .45s cubic-bezier(.22,1,.36,1) both}
.pl-slide-right{animation:pl-slide-right .5s cubic-bezier(.22,1,.36,1) both}
.pl-scale-in{animation:pl-scale-in .28s cubic-bezier(.22,1,.36,1) both}
.pl-scale-out{animation:pl-scale-out .18s ease-in both}
.pl-menu-in{animation:pl-menu-in .16s ease-out both;transform-origin:top right}
.pl-toast-in{animation:pl-toast-in .35s cubic-bezier(.22,1,.36,1) both}
.pl-pop{animation:pl-pop .35s cubic-bezier(.34,1.56,.64,1) both}
.pl-float{animation:pl-float 4s ease-in-out infinite}
.pl-live{animation:pl-pulse-ring 1.8s ease-out infinite}
.pl-skel{background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:1200px 100%;animation:pl-shimmer 1.5s infinite linear}
.dark .pl-skel{background:linear-gradient(90deg,#243247 25%,#2d3d54 50%,#243247 75%);background-size:1200px 100%}
.pl-press{transition:transform .15s ease,box-shadow .2s ease,background-color .2s ease,border-color .2s ease}
.pl-press:active{transform:scale(.96)}
@media (prefers-reduced-motion:reduce){
  .pl-root *{animation-duration:.01ms!important;animation-delay:0ms!important;transition-duration:.01ms!important}
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

function useOutsideClose(open, setOpen) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, setOpen]);
  return ref;
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
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"}`} />}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function PlantAvatar({ plant, size = "md" }) {
  const dims =
    size === "lg"
      ? "w-[68px] h-[68px] text-[19px] rounded-2xl"
      : "w-12 h-12 text-[13px] rounded-xl";
  return (
    <div
      className={`${dims} flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm transition-transform duration-300 ${
        plant.status === "ACTIVE"
          ? "bg-gradient-to-br from-teal-500 to-teal-700"
          : "bg-slate-400"
      }`}
    >
      {plant.code?.slice(0, 3)}
    </div>
  );
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
      className="pl-press w-6 h-6 inline-flex items-center justify-center rounded-md text-slate-500 hover:text-[#0D6EFD] hover:bg-blue-50 dark:hover:bg-slate-700"
    >
      {copied ? (
        <Check key="ok" className="pl-pop w-3.5 h-3.5 text-emerald-500" />
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

const inputCls =
  "w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-[10px] text-[13px] bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 outline-none focus:border-[#0D6EFD] focus:ring-2 focus:ring-blue-500/15 transition placeholder-slate-300 dark:placeholder-slate-600";
const labelCls =
  "block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2";

// ── Ring (animated multi-segment donut) ────────────────────────
function Ring({ segments, size = 96, stroke = 10, children }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [go, setGo] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGo(true));
    return () => cancelAnimationFrame(id);
  }, []);
  let offset = 0;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
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
        {total > 0 &&
          segments.map((seg) => {
            const len = go ? c * (seg.value / total) : 0;
            const el = (
              <circle
                key={seg.color}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: "stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1)" }}
              />
            );
            offset += c * (seg.value / total);
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function BarRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const [go, setGo] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGo(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-2 text-[12.5px] text-slate-600 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          {label}
        </span>
        <span className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{value}</span>
      </div>
      <div className="h-[6px] w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: go ? `${pct}%` : "0%",
            background: color,
            transition: "width 1s cubic-bezier(.22,1,.36,1)",
          }}
        />
      </div>
    </div>
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
        closing ? "pl-fade-out" : "pl-fade-in"
      }`}
      style={{ backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className={`bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full ${maxW} shadow-2xl overflow-hidden ${
          closing ? "pl-scale-out" : "pl-scale-in"
        }`}
      >
        {children(close)}
      </div>
    </div>
  );
}

function ModalHeader({ icon: Icon, title, subtitle, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-[#0D6EFD] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={onClose}
        className="pl-press w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="pl-scale-in flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message}
    </div>
  );
}

// ── Create / Edit Plant ────────────────────────────────────────
function PlantModal({ initial, companyCodes, defaultCompanyCodeId, onClose, onSaved }) {
  const isEdit = !!initial;
  const [companyCodeId, setCompanyCodeId] = useState(
    initial?.companyCodeId || defaultCompanyCodeId || "",
  );
  const [code, setCode] = useState(initial?.code || "");
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(close) {
    setError("");
    if (!isEdit && !companyCodeId) return setError("Please select a company code.");
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
          companyCodeId: Number(companyCodeId),
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

  const ccLabel = companyCodes.find((c) => c.id === initial?.companyCodeId);

  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <>
          <ModalHeader icon={Factory} title={isEdit ? "Edit Plant" : "New Plant"} onClose={close} />
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className={labelCls}>
                Company Code <span className="text-red-500">*</span>
              </label>
              {isEdit ? (
                <div className="bg-slate-50 dark:bg-[#151E2B] rounded-xl px-3 py-[10px] text-[13px] font-semibold text-slate-600 dark:text-slate-400">
                  {ccLabel ? `${ccLabel.name} (${ccLabel.code})` : `#${initial.companyCodeId}`}
                </div>
              ) : (
                <select
                  value={companyCodeId}
                  onChange={(e) => {
                    setCompanyCodeId(e.target.value);
                    setError("");
                  }}
                  className={inputCls}
                >
                  <option value="">— Choose a company code —</option>
                  {companyCodes
                    .filter((c) => c.status === "ACTIVE")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                </select>
              )}
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
                autoFocus={isEdit}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Bhubaneswar Plant"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Description{" "}
                <span className="text-slate-400 font-normal normal-case tracking-normal">(optional)</span>
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
              className="pl-press flex-1 py-[10px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(close)}
              disabled={loading}
              className="pl-press flex-1 py-[10px] rounded-xl bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[12.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
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

// ── Add Departments (multi-select) ─────────────────────────────
// Departments global master hain (SuperAdmin banata hai aur tenant ko assign karta hai).
// Yahan tenant ke already-assigned departments is plant se map hote hain
// (POST /departments/plant/:plantId — TenantDepartmentPlant table).
function AddDepartmentsModal({ plant, available, onClose, onSaved }) {
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const q = search.trim().toLowerCase();
  const list = q
    ? available.filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
    : available;

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setError("");
  }

  async function handleSave(close) {
    if (selected.size === 0) return setError("Please select at least one department.");
    setLoading(true);
    setError("");
    try {
      const ids = Array.from(selected);
      const results = await Promise.allSettled(
        ids.map((id) => api(`/departments/plant/${plant.id}`, "POST", { departmentId: id })),
      );
      const failed = results.filter((r) => r.status === "rejected");
      await onSaved(ids.length - failed.length);
      if (failed.length) {
        setError(failed[0].reason?.message || "Some departments could not be added.");
        setSelected(new Set());
        return;
      }
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
            icon={Layers}
            title="Add Department"
            subtitle={`to ${plant.name} (${plant.code})`}
            onClose={close}
          />
          <div className="px-6 py-5 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search departments…"
                className={`${inputCls} pl-9`}
              />
            </div>

            <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
              {list.length === 0 ? (
                <div className="text-center py-8 text-[12px] text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  {available.length === 0
                    ? "No unassigned departments for your tenant right now. Ask your SuperAdmin to assign more departments to this tenant."
                    : "No matches for your search."}
                </div>
              ) : (
                list.map((d, i) => (
                  <label
                    key={d.id}
                    style={{ animationDelay: `${i * 30}ms` }}
                    className={`pl-fade-up flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                      selected.has(d.id)
                        ? "border-blue-300 dark:border-blue-700 bg-blue-50/70 dark:bg-blue-900/20"
                        : "border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#151E2B]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(d.id)}
                      onChange={() => toggle(d.id)}
                      className="h-4 w-4 rounded accent-[#0D6EFD]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {d.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">{d.code}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
            <ErrorBox message={error} />
          </div>
          <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={close}
              className="pl-press flex-1 py-[10px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(close)}
              disabled={loading || selected.size === 0}
              className="pl-press flex-1 py-[10px] rounded-xl bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[12.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding…
                </>
              ) : (
                `Add${selected.size ? ` ${selected.size}` : ""} Department${selected.size > 1 ? "s" : ""}`
              )}
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ── Confirm (deactivate plant / remove department) ─────────────
function ConfirmModal({ title, name, message, confirmLabel, icon: Icon = Power, onConfirm, onClose }) {
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
          <div className="pl-pop w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <Icon className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 text-center mb-1">{title}</h3>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 text-center mb-4 leading-relaxed">
            <span className="font-bold text-slate-700 dark:text-slate-200">"{name}"</span> {message}
          </p>
          {error && (
            <div className="mb-4">
              <ErrorBox message={error} />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={close}
              className="pl-press flex-1 py-[10px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => run(close)}
              disabled={loading}
              className="pl-press flex-1 py-[10px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
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
      title: "Create a Plant",
      desc: "Click Add Plant, pick a company code, then give the plant a short unique code and a name.",
    },
    {
      title: "Select a Plant",
      desc: "Click any plant in the list on the left to see its details, departments and status on the right.",
    },
    {
      title: "Filter and search",
      desc: "Use the company code dropdown, the search box and the filter button to narrow down the plant list.",
    },
    {
      title: "Manage Departments",
      desc: "Open the Departments tab and click Add Department to map departments already assigned to your tenant. Use the ⋮ menu on a row to remove one.",
    },
    {
      title: "Edit or Deactivate",
      desc: "Edit updates the plant's name or description. Deactivate marks it inactive and is blocked while it still has active department mappings.",
    },
  ];
  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <>
          <ModalHeader icon={Info} title="Plant Configuration — Guide" onClose={close} />
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {steps.map((s, i) => (
              <div key={s.title} className="pl-fade-up flex gap-3" style={{ animationDelay: `${80 + i * 60}ms` }}>
                <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#0D6EFD] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{s.title}</div>
                  <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={close}
              className="pl-press w-full py-[10px] rounded-xl bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[12.5px] font-bold"
            >
              Got it
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ── Menus ──────────────────────────────────────────────────────
function RowMenu({ onRemove }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, setOpen);
  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="pl-press w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="pl-menu-in absolute right-0 top-full mt-1 w-48 z-30 bg-white dark:bg-[#232F40] border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl py-1">
          <button
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove from plant
          </button>
        </div>
      )}
    </div>
  );
}

function StatusFilterMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, setOpen);
  const opts = [
    { v: "", l: "All plants" },
    { v: "ACTIVE", l: "Active only" },
    { v: "INACTIVE", l: "Inactive only" },
  ];
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Filter by status"
        className={`pl-press relative w-[42px] h-[42px] flex items-center justify-center rounded-xl border bg-white dark:bg-[#1A2433] hover:bg-slate-50 dark:hover:bg-slate-700 ${
          value
            ? "border-[#0D6EFD] text-[#0D6EFD]"
            : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300"
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        {value && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#0D6EFD] pl-pop" />}
      </button>
      {open && (
        <div className="pl-menu-in absolute right-0 top-full mt-1.5 w-44 z-30 bg-white dark:bg-[#232F40] border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl py-1">
          {opts.map((o) => (
            <button
              key={o.v}
              onClick={() => {
                onChange(o.v);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {o.l}
              {value === o.v && <Check className="w-3.5 h-3.5 text-[#0D6EFD]" />}
            </button>
          ))}
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
          <div className="pl-skel w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="pl-skel h-3 w-2/3 rounded" />
            <div className="pl-skel h-2.5 w-1/3 rounded" />
          </div>
          <div className="pl-skel h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="pl-skel h-[110px] rounded-2xl" />
      <div className="pl-skel h-[420px] rounded-2xl" />
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────────
const TABS = [
  { id: "departments", label: "Departments", icon: Layers },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "access", label: "Access Control", icon: ShieldCheck },
  { id: "doctypes", label: "Document Types", icon: FileText },
  { id: "audit", label: "Audit Log", icon: History },
];

function ComingSoon({ icon: Icon, title }) {
  return (
    <div className="pl-fade-up flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
      <Icon className="w-10 h-10 opacity-40 pl-float" />
      <div className="text-[14px] font-semibold text-slate-600 dark:text-slate-300">{title}</div>
      <div className="text-[12.5px]">This section is not available yet.</div>
    </div>
  );
}

function SettingsTab({ plant, ccName, ccCode, canManage, onEdit }) {
  const rows = [
    { k: "Plant name", v: plant.name },
    { k: "Plant code", v: <span className="font-mono font-bold">{plant.code}</span> },
    { k: "Company code", v: `${ccName} (${ccCode})` },
    { k: "Description", v: plant.description || "—" },
    { k: "Status", v: <StatusBadge status={plant.status} dot /> },
    { k: "Created", v: fmtDateTime(plant.createdAt) },
    { k: "Last updated", v: fmtDateTime(plant.updatedAt) },
  ];
  return (
    <div className="px-5 pb-6 pt-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-[16px] font-bold text-slate-900 dark:text-slate-50">Plant settings</h4>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            Basic details of this plant.
          </p>
        </div>
        {canManage && (
          <button
            onClick={onEdit}
            className="pl-press flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-[12.5px] font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit plant
          </button>
        )}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700 rounded-xl border border-slate-100 dark:border-slate-700">
        {rows.map((r, i) => (
          <div
            key={r.k}
            style={{ animationDelay: `${i * 45}ms` }}
            className="pl-fade-up grid grid-cols-[150px_1fr] items-center gap-3 px-4 py-3 text-[13.5px]"
          >
            <span className="text-slate-500 dark:text-slate-400">{r.k}</span>
            <span className="text-slate-800 dark:text-slate-100 font-medium">{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sortable header cell ───────────────────────────────────────
function SortTh({ label, k, sort, setSort, align = "left" }) {
  const activeSort = sort.key === k;
  return (
    <th className={`px-4 py-3 text-${align}`}>
      <button
        onClick={() =>
          setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" }))
        }
        className={`inline-flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-wide transition-colors ${
          activeSort ? "text-[#0D6EFD]" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        }`}
      >
        {label}
        <ChevronsUpDown className="w-3 h-3" />
      </button>
    </th>
  );
}

// ── Departments tab ────────────────────────────────────────────
function DepartmentsTab({ depts, deptLoading, canManage, onAdd, onRemoveOne, onRemoveMany, plantActive }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [picked, setPicked] = useState(new Set());

  useEffect(() => {
    setPage(1);
  }, [search, status, rows, sort]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = depts.filter(
      (d) =>
        (!q || d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q)) &&
        (!status || d.status === status),
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      let x = a[sort.key];
      let y = b[sort.key];
      if (sort.key === "createdAt") {
        x = x ? new Date(x).getTime() : 0;
        y = y ? new Date(y).getTime() : 0;
      }
      if (typeof x === "string") return x.localeCompare(y || "") * dir;
      return ((x || 0) - (y || 0)) * dir;
    });
  }, [depts, search, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rows));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * rows;
  const paged = filtered.slice(start, start + rows);

  const pageIds = paged.map((d) => d.id);
  const allPicked = pageIds.length > 0 && pageIds.every((id) => picked.has(id));

  function togglePick(id) {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function togglePage() {
    setPicked((prev) => {
      const next = new Set(prev);
      allPicked ? pageIds.forEach((id) => next.delete(id)) : pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  // page numbers (max 5, current ke aas-paas)
  const pageNums = useMemo(() => {
    const from = Math.max(1, Math.min(safePage - 2, totalPages - 4));
    const to = Math.min(totalPages, from + 4);
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }, [safePage, totalPages]);

  return (
    <div className="px-5 pb-5 pt-1">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="flex items-center gap-2.5 text-[18px] font-bold text-slate-900 dark:text-slate-50">
            <FileText className="w-[18px] h-[18px] text-slate-600 dark:text-slate-300" />
            Departments
            <span className="text-[12px] font-bold text-[#0D6EFD] bg-blue-50 dark:bg-blue-900/30 rounded-full px-2.5 py-0.5">
              {depts.length}
            </span>
          </h4>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
            Departments under this plant. Configure departments to manage document access.
          </p>
        </div>
        {canManage && plantActive && (
          <button
            onClick={onAdd}
            className="pl-press flex-shrink-0 flex items-center gap-1.5 bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[13px] font-semibold rounded-xl px-4 py-2.5 shadow-[0_4px_12px_rgba(13,110,253,0.3)] hover:shadow-[0_6px_16px_rgba(13,110,253,0.4)]"
          >
            <Plus className="w-4 h-4" /> Add Department
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by department name or code..."
            className="w-full text-[13px] pl-10 pr-3 py-[11px] border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-[#0D6EFD] focus:ring-2 focus:ring-blue-500/15 transition placeholder-slate-400 dark:placeholder-slate-600"
          />
        </div>
        <div className="relative w-[150px]">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="appearance-none w-full text-[13px] pl-3.5 pr-9 py-[11px] border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-[#0D6EFD] focus:ring-2 focus:ring-blue-500/15 transition"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* bulk bar */}
      {canManage && picked.size > 0 && (
        <div className="pl-scale-in flex items-center justify-between mb-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-2">
          <span className="text-[12.5px] font-semibold text-[#0D6EFD]">{picked.size} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPicked(new Set())}
              className="pl-press text-[12px] font-semibold text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-white/70 dark:hover:bg-slate-700"
            >
              Clear
            </button>
            <button
              onClick={() => onRemoveMany(depts.filter((d) => picked.has(d.id)), () => setPicked(new Set()))}
              className="pl-press flex items-center gap-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 bg-white dark:bg-transparent rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove selected
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px] min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#151E2B] border-b border-slate-200 dark:border-slate-700">
                <th className="pl-4 pr-1 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPicked}
                    onChange={togglePage}
                    disabled={pageIds.length === 0}
                    className="h-4 w-4 rounded accent-[#0D6EFD]"
                  />
                </th>
                <SortTh label="Code" k="code" sort={sort} setSort={setSort} />
                <SortTh label="Name" k="name" sort={sort} setSort={setSort} />
                <SortTh label="Status" k="status" sort={sort} setSort={setSort} />
                <SortTh label="Documents" k="documents" sort={sort} setSort={setSort} />
                <SortTh label="Created On" k="createdAt" sort={sort} setSort={setSort} />
                {canManage && (
                  <th className="px-4 py-3 text-right text-[11.5px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {deptLoading ? (
                [0, 1, 2].map((i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                    <td colSpan={canManage ? 7 : 6} className="px-4 py-3">
                      <div className="pl-skel h-6 rounded" />
                    </td>
                  </tr>
                ))
              ) : paged.length === 0 ? null : (
                paged.map((d, i) => (
                  <tr
                    key={d.id}
                    style={{ animationDelay: `${i * 55}ms` }}
                    className={`pl-fade-up border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors duration-200 ${
                      picked.has(d.id) ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-slate-50/80 dark:hover:bg-[#151E2B]"
                    }`}
                  >
                    <td className="pl-4 pr-1 py-3.5">
                      <input
                        type="checkbox"
                        checked={picked.has(d.id)}
                        onChange={() => togglePick(d.id)}
                        className="h-4 w-4 rounded accent-[#0D6EFD]"
                      />
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-100">{d.code}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-100">{d.name}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={d.status} dot />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {d.documents}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{fmtDate(d.createdAt)}</td>
                    {canManage && (
                      <td className="px-4 py-2 text-right">
                        <RowMenu onRemove={() => onRemoveOne(d)} />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!deptLoading && paged.length === 0 && (
          <div className="pl-fade-up flex flex-col items-center justify-center min-h-[220px] gap-3 text-slate-400">
            <Layers className="w-9 h-9 opacity-40" />
            <span className="text-[12.5px]">
              {depts.length === 0 ? "No departments mapped to this plant yet." : "No departments match your filters."}
            </span>
            {canManage && plantActive && depts.length === 0 && (
              <button
                onClick={onAdd}
                className="pl-press flex items-center gap-1.5 text-[12px] font-semibold text-[#0D6EFD] border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Department
              </button>
            )}
          </div>
        )}
      </div>

      {/* footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <span className="text-[12.5px] text-slate-500 dark:text-slate-400">
          Showing {filtered.length === 0 ? 0 : start + 1} to {Math.min(start + rows, filtered.length)} of{" "}
          {filtered.length} departments
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            className="pl-press w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700/40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {pageNums.map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`pl-press w-9 h-9 rounded-lg text-[13px] font-semibold border ${
                n === safePage
                  ? "bg-[#0D6EFD] border-[#0D6EFD] text-white shadow-[0_4px_10px_rgba(13,110,253,0.3)]"
                  : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
            className="pl-press w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700/40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-[12.5px] text-slate-500 dark:text-slate-400">
          Rows per page
          <div className="relative">
            <select
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              className="appearance-none text-[13px] pl-3 pr-8 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-[#0D6EFD]"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function Plants({ showHeader = true }) {
  const [companyCodes, setCompanyCodes] = useState([]);
  const [plants, setPlants] = useState([]);
  const [deptMap, setDeptMap] = useState({}); // { [plantId]: department[] }
  const [deptLoading, setDeptLoading] = useState(false);
  const [tenantDepartments, setTenantDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ccFilter, setCcFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("departments");

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deactivateItem, setDeactivateItem] = useState(null);
  const [showAddDept, setShowAddDept] = useState(false);
  const [removeDept, setRemoveDept] = useState(null); // { list, done }
  const [showGuide, setShowGuide] = useState(false);
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

  async function fetchAll(silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [cc, pl] = await Promise.all([api("/company-codes"), api("/plants")]);
      setCompanyCodes(cc.data || []);
      setPlants(pl.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const fetchDepartmentsForPlant = useCallback(async (plantId, showSpinner = false) => {
    if (showSpinner) setDeptLoading(true);
    try {
      const data = await api(`/departments/plant/${plantId}`);
      setDeptMap((prev) => ({ ...prev, [plantId]: data.data || [] }));
    } catch {
      setDeptMap((prev) => ({ ...prev, [plantId]: prev[plantId] || [] }));
    } finally {
      setDeptLoading(false);
    }
  }, []);

  // Tenant ko assign hue departments — "Add Department" picker ke liye.
  async function fetchTenantDepartments() {
    const tenantId = decodeToken()?.tenantId;
    if (!tenantId) return;
    try {
      const data = await api(`/departments/tenant/${tenantId}`);
      setTenantDepartments(data.data || []);
    } catch {}
  }

  useEffect(() => {
    fetchAll();
    fetchTenantDepartments();
  }, []);
  useEffect(() => setPage(1), [search, ccFilter, statusFilter]);

  // Valid selection maintain karo: pehla plant auto-select, aur agar selected gayab ho to pehle par fallback.
  useEffect(() => {
    if (loading) return;
    if (plants.length === 0) return setSelectedId(null);
    if (!plants.some((p) => p.id === selectedId)) setSelectedId(plants[0].id);
  }, [loading, plants, selectedId]);

  const selected = plants.find((p) => p.id === selectedId) || null;

  useEffect(() => {
    if (!selectedId) return;
    setTab("departments");
    fetchDepartmentsForPlant(selectedId, true);
  }, [selectedId, fetchDepartmentsForPlant]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return plants.filter((p) => {
      const matchesCc = ccFilter ? p.companyCodeId === Number(ccFilter) : true;
      const matchesStatus = statusFilter ? p.status === statusFilter : true;
      const matchesSearch = p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q);
      return matchesCc && matchesStatus && matchesSearch;
    });
  }, [plants, ccFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const ccName = (id) => companyCodes.find((c) => c.id === id)?.name || "—";
  const ccCode = (id) => companyCodes.find((c) => c.id === id)?.code || "";

  // Sirf wahi departments jo TenantDepartmentPlant ke through is plant se mapped hain.
  const selectedDepts = useMemo(() => {
    if (!selected) return [];
    return (deptMap[selected.id] || []).map((d) => ({
      ...d,
      status: d.status || "ACTIVE",
      source: d.source === "tenant" ? "tenant" : "plant",
      documents: Number(d.documentCount ?? d.documentsCount ?? d.docCount ?? d.documents ?? 0) || 0,
    }));
  }, [selected, deptMap]);

  const availableDepts = useMemo(() => {
    if (!selected) return [];
    const mapped = new Set((deptMap[selected.id] || []).map((d) => d.id));
    return tenantDepartments.filter((d) => !mapped.has(d.id) && d.status !== "INACTIVE");
  }, [selected, deptMap, tenantDepartments]);

  const activeDepts = selectedDepts.filter((d) => d.status === "ACTIVE").length;
  const inactiveDepts = selectedDepts.length - activeDepts;
  const planSource = selectedDepts.filter((d) => d.source !== "tenant").length;
  const adminSource = selectedDepts.length - planSource;
  const totalDocs = selectedDepts.reduce((s, d) => s + d.documents, 0);
  const activePct = selectedDepts.length ? Math.round((activeDepts / selectedDepts.length) * 100) : 0;
  const pctAnim = useCountUp(activePct, 900);
  const activeAnim = useCountUp(activeDepts, 800);

  const createdBy =
    selected?.createdByName ||
    selected?.creator?.name ||
    selected?.createdBy?.name ||
    (typeof selected?.createdBy === "string" ? selected.createdBy : null) ||
    "—";

  async function deactivatePlant() {
    await api(`/plants/${deactivateItem.id}`, "DELETE");
    showToast(`Plant "${deactivateItem.name}" deactivated`);
    await fetchAll(true);
  }

  async function removeDepartments() {
    const { list, done } = removeDept;
    const results = await Promise.allSettled(
      list.map((d) => api(`/departments/plant/${selected.id}/${d.id}`, "DELETE")),
    );
    const failed = results.filter((r) => r.status === "rejected");
    await fetchDepartmentsForPlant(selected.id);
    fetchTenantDepartments();
    done?.();
    if (failed.length) throw new Error(failed[0].reason?.message || "Couldn't remove some departments.");
    showToast(list.length === 1 ? `"${list[0].name}" removed from plant` : `${list.length} departments removed`);
  }

  return (
    <div className="pl-root">
      <style>{ANIM_CSS}</style>

      {/* ── Page header ── */}
      {showHeader && (
        <div className="pl-fade-up flex items-start justify-between gap-4 mb-6">
          <div>
            <nav className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400 mb-3">
              <Home className="w-4 h-4 text-[#0D6EFD]" />
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span>Organization</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span>Company Code Configuration</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span className="font-semibold text-slate-800 dark:text-slate-100">Plant Config</span>
            </nav>
            <h1 className="flex items-center gap-3 text-[28px] leading-tight font-bold text-slate-900 dark:text-slate-50">
              Plant Configuration
              <Factory className="w-6 h-6 text-[#0D6EFD]" />
            </h1>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1.5">
              Manage plants under each company code. Plants help organize document storage, access control and ERP
              integration.
            </p>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="pl-press flex-shrink-0 flex items-center gap-2 bg-white dark:bg-[#1A2433] border border-slate-200/70 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-[#0D6EFD] shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <HelpCircle className="w-4 h-4" /> Help &amp; Guide
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_310px] gap-5 items-stretch">
        {/* ═══════════ LEFT: List ═══════════ */}
        <Card className="pl-fade-up flex flex-col min-h-[640px] overflow-hidden" style={{ animationDelay: "60ms" }}>
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[20px] font-bold text-slate-900 dark:text-slate-50">Plants</h2>
                <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-full px-2.5 py-0.5">
                  {plants.length}
                </span>
              </div>
              {canManage && (
                <button
                  onClick={() => setShowCreate(true)}
                  disabled={companyCodes.length === 0}
                  title={companyCodes.length === 0 ? "Create a company code first" : "Add plant"}
                  className="pl-press flex-shrink-0 flex items-center gap-1.5 bg-[#0D6EFD] hover:bg-[#0B5ED7] disabled:opacity-40 text-white text-[13px] font-semibold rounded-lg px-4 py-2.5 shadow-[0_4px_12px_rgba(13,110,253,0.3)] hover:shadow-[0_6px_16px_rgba(13,110,253,0.4)]"
                >
                  <Plus className="w-4 h-4" /> Add Plant
                </button>
              )}
            </div>
          </div>

          <div className="px-4 pb-3 space-y-2.5">
            <div className="relative">
              <select
                value={ccFilter}
                onChange={(e) => setCcFilter(e.target.value)}
                className="appearance-none w-full text-[13px] pl-3.5 pr-9 py-[11px] border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-[#0D6EFD] focus:ring-2 focus:ring-blue-500/15 transition"
              >
                <option value="">All company codes</option>
                {companyCodes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or code..."
                  className="w-full text-[13px] pl-10 pr-3 py-[11px] border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-[#1A2433] text-slate-800 dark:text-slate-200 outline-none focus:border-[#0D6EFD] focus:ring-2 focus:ring-blue-500/15 transition placeholder-slate-400 dark:placeholder-slate-600"
                />
              </div>
              <StatusFilterMenu value={statusFilter} onChange={setStatusFilter} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {loading && <ListSkeleton />}

            {!loading && error && (
              <div className="pl-fade-up flex flex-col items-center gap-3 py-10 px-4 text-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <p className="text-[12px] font-semibold text-red-500">{error}</p>
                <button
                  onClick={() => fetchAll()}
                  className="pl-press flex items-center gap-1.5 text-[12px] font-semibold text-[#0D6EFD] border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            )}

            {!loading && !error && companyCodes.length === 0 && (
              <div className="pl-fade-up text-center py-10 px-4 text-[12.5px] text-slate-400">
                No company codes yet. Create one from the Company Codes page first.
              </div>
            )}

            {!loading &&
              !error &&
              paged.map((p, i) => {
                const sel = selected?.id === p.id;
                return (
                  <div
                    key={`${page}-${p.id}`}
                    onClick={() => setSelectedId(p.id)}
                    style={{ animationDelay: `${120 + i * 55}ms` }}
                    className={`pl-slide-left group flex items-center gap-3 px-3 py-3 mb-1.5 cursor-pointer rounded-xl border border-l-[3px] transition-all duration-300 ${
                      sel
                        ? "bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 border-l-[#0D6EFD] shadow-sm"
                        : "border-transparent border-l-transparent hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="transition-transform duration-300 group-hover:scale-105">
                      <PlantAvatar plant={p} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14.5px] font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</div>
                      <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-mono">
                        {p.code}
                        <span className="mx-1.5">•</span>
                        {ccCode(p.companyCodeId)}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                );
              })}

            {!loading && !error && companyCodes.length > 0 && filtered.length === 0 && (
              <div className="pl-fade-up flex flex-col items-center gap-3 py-14 text-slate-400">
                <Factory className="w-9 h-9 opacity-40" />
                <span className="text-[12.5px]">{plants.length === 0 ? "No plants yet." : "No plants found."}</span>
                {canManage && plants.length === 0 && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="pl-press flex items-center gap-1.5 bg-[#0D6EFD] text-white text-[12px] font-semibold rounded-lg px-3.5 py-2"
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
                  className="pl-press p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="pl-press p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* ═══════════ MIDDLE: Details ═══════════ */}
        <div className="min-w-0">
          {loading ? (
            <DetailSkeleton />
          ) : !selected ? (
            <Card className="pl-fade-up flex flex-col items-center justify-center h-full min-h-[400px] gap-3 text-slate-400 p-10">
              <Factory className="w-12 h-12 opacity-40 pl-float" />
              <span className="text-[13.5px]">Select a plant to view details</span>
            </Card>
          ) : (
            // key → selection badalne par poora panel re-animate hota hai
            <div key={selected.id} className="space-y-5">
              {/* Header card */}
              <Card className="pl-fade-up px-6 py-5">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <PlantAvatar plant={selected} size="lg" />
                    <div className="flex items-center gap-3 flex-wrap min-w-0">
                      <h3 className="text-[22px] font-bold text-slate-900 dark:text-slate-50 truncate">
                        {selected.name}
                      </h3>
                      <StatusBadge status={selected.status} dot />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-[auto_auto_1fr] gap-y-4 sm:gap-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700">
                  <div className="flex items-center gap-3 sm:pr-6">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] text-slate-500 dark:text-slate-400">Company Code</div>
                      <div className="text-[14px] font-semibold text-[#0D6EFD] truncate">
                        {ccName(selected.companyCodeId)} ({ccCode(selected.companyCodeId)})
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:px-6">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <Hash className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                    </div>
                    <div>
                      <div className="text-[12px] text-slate-500 dark:text-slate-400">Plant Code</div>
                      <div className="flex items-center gap-1 text-[14px] font-semibold text-[#0D6EFD]">
                        {selected.code}
                        <CopyButton text={selected.code} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:pl-6 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] text-slate-500 dark:text-slate-400">Description</div>
                      <div className="text-[14px] text-slate-700 dark:text-slate-200 truncate">
                        {selected.description || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Tabs card */}
              <Card className="pl-fade-up overflow-hidden" style={{ animationDelay: "90ms" }}>
                <div className="flex items-center gap-1 px-4 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                  {TABS.map((t) => {
                    const on = tab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`relative flex items-center gap-2 px-4 py-4 text-[13.5px] font-semibold whitespace-nowrap transition-colors ${
                          on
                            ? "text-[#0D6EFD]"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                        }`}
                      >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                        <span
                          className="absolute left-3 right-3 bottom-0 h-[3px] rounded-t-full bg-[#0D6EFD] origin-center transition-transform duration-300"
                          style={{ transform: on ? "scaleX(1)" : "scaleX(0)" }}
                        />
                      </button>
                    );
                  })}
                </div>

                <div key={tab} className="pl-fade-in pt-5">
                  {tab === "departments" && (
                    <DepartmentsTab
                      key={selected.id}
                      depts={selectedDepts}
                      deptLoading={deptLoading}
                      canManage={canManage}
                      plantActive={selected.status === "ACTIVE"}
                      onAdd={() => setShowAddDept(true)}
                      onRemoveOne={(d) => setRemoveDept({ list: [d] })}
                      onRemoveMany={(list, done) => setRemoveDept({ list, done })}
                    />
                  )}
                  {tab === "settings" && (
                    <SettingsTab
                      plant={selected}
                      ccName={ccName(selected.companyCodeId)}
                      ccCode={ccCode(selected.companyCodeId)}
                      canManage={canManage}
                      onEdit={() => setEditItem(selected)}
                    />
                  )}
                  {tab === "access" && <ComingSoon icon={ShieldCheck} title="Access Control" />}
                  {tab === "doctypes" && <ComingSoon icon={FileText} title="Document Types" />}
                  {tab === "audit" && <ComingSoon icon={History} title="Audit Log" />}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* ═══════════ RIGHT: Sidebar ═══════════ */}
        {!loading && selected && (
          <div className="lg:col-span-2 xl:col-span-1 min-w-0">
            <Card key={selected.id} className="pl-slide-right overflow-hidden" style={{ animationDelay: "120ms" }}>
              {/* Status breakdown */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-50">Plant Status Breakdown</h4>
                </div>
                {canManage && (
                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    <button
                      onClick={() => setEditItem(selected)}
                      className="pl-press flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-[13px] font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:-translate-y-0.5"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setDeactivateItem(selected)}
                      disabled={selected.status !== "ACTIVE"}
                      className="pl-press flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-[13px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      <Power className="w-3.5 h-3.5" /> Deactivate
                    </button>
                  </div>
                )}

                <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-[#151E2B]/50 p-4">
                  <div className="flex items-center gap-4">
                    <Ring
                      size={92}
                      stroke={9}
                      segments={[
                        { value: activeDepts, color: TEAL },
                        { value: inactiveDepts, color: RED },
                      ]}
                    >
                      <span className="text-[17px] font-bold text-slate-900 dark:text-slate-50">{pctAnim}%</span>
                    </Ring>
                    <div>
                      <div className="text-[26px] leading-none font-bold text-slate-900 dark:text-slate-50">
                        {activeAnim}
                      </div>
                      <div className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1.5">Active departments</div>
                    </div>
                  </div>
                  <div className="space-y-3.5 mt-5">
                    <BarRow label="Active" value={activeDepts} total={selectedDepts.length} color={GREEN} />
                    <BarRow label="Inactive" value={inactiveDepts} total={selectedDepts.length} color={RED} />
                  </div>
                </div>
              </div>

              {/* Source split */}
              <div className="px-5 pb-5">
                <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-50 mb-3">Source Split</h4>
                <div className="flex items-center gap-5">
                  <Ring
                    size={84}
                    stroke={12}
                    segments={[
                      { value: planSource, color: GREEN },
                      { value: adminSource, color: BLUE },
                    ]}
                  />
                  <div className="flex-1 space-y-3.5">
                    <BarRow label="This plant" value={planSource} total={selectedDepts.length} color={GREEN} />
                    <BarRow label="SuperAdmin" value={adminSource} total={selectedDepts.length} color={BLUE} />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-700" />

              {/* Plant information */}
              <div className="p-5">
                <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-50 mb-4">Plant Information</h4>
                <div className="space-y-3.5">
                  {[
                    { icon: CheckCircle2, k: "Plant Status", v: <StatusBadge status={selected.status} dot /> },
                    {
                      icon: Layers,
                      k: "Total Departments",
                      v: <span className="font-bold text-slate-900 dark:text-slate-50">{selectedDepts.length}</span>,
                    },
                    {
                      icon: FileText,
                      k: "Total Documents",
                      v: <span className="font-bold text-slate-900 dark:text-slate-50">{totalDocs}</span>,
                    },
                    {
                      icon: CalendarDays,
                      k: "Created On",
                      v: <span className="text-[12.5px] text-slate-700 dark:text-slate-200">{fmtDateTime(selected.createdAt)}</span>,
                    },
                    {
                      icon: User,
                      k: "Created By",
                      v: <span className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">{createdBy}</span>,
                    },
                    {
                      icon: Clock,
                      k: "Last Updated",
                      v: <span className="text-[12.5px] text-slate-700 dark:text-slate-200">{fmtDateTime(selected.updatedAt)}</span>,
                    },
                  ].map((r, i) => (
                    <div
                      key={r.k}
                      style={{ animationDelay: `${200 + i * 50}ms` }}
                      className="pl-fade-up flex items-center justify-between gap-3 text-[13px]"
                    >
                      <span className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                        <r.icon className="w-4 h-4" />
                        {r.k}
                      </span>
                      {r.v}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      {showCreate && (
        <PlantModal
          companyCodes={companyCodes}
          defaultCompanyCodeId={ccFilter}
          onClose={() => setShowCreate(false)}
          onSaved={async () => {
            await fetchAll(true);
            showToast("Plant created");
          }}
        />
      )}

      {editItem && (
        <PlantModal
          initial={editItem}
          companyCodes={companyCodes}
          onClose={() => setEditItem(null)}
          onSaved={async () => {
            await fetchAll(true);
            showToast("Plant updated");
          }}
        />
      )}

      {deactivateItem && (
        <ConfirmModal
          title="Deactivate Plant?"
          name={deactivateItem.name}
          message="will be marked inactive. This is blocked if it still has active department mappings."
          confirmLabel="Yes, deactivate"
          onConfirm={deactivatePlant}
          onClose={() => setDeactivateItem(null)}
        />
      )}

      {showAddDept && selected && (
        <AddDepartmentsModal
          plant={selected}
          available={availableDepts}
          onClose={() => setShowAddDept(false)}
          onSaved={async (count) => {
            await fetchDepartmentsForPlant(selected.id);
            fetchTenantDepartments();
            if (count > 0) showToast(count === 1 ? "Department added" : `${count} departments added`);
          }}
        />
      )}

      {removeDept && selected && (
        <ConfirmModal
          icon={Trash2}
          title={removeDept.list.length === 1 ? "Remove Department?" : "Remove Departments?"}
          name={removeDept.list.length === 1 ? removeDept.list[0].name : `${removeDept.list.length} departments`}
          message={`will be removed from ${selected.name}. The department stays assigned to your tenant.`}
          confirmLabel="Yes, remove"
          onConfirm={removeDepartments}
          onClose={() => setRemoveDept(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          key={toast.id}
          className="pl-toast-in fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[13px] font-semibold rounded-xl px-4 py-3 shadow-2xl"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          {toast.msg}
        </div>
      )}
    </div>
  );
}