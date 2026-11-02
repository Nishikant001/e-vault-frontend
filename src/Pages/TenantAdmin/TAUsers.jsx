import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Info,
  Eye,
  EyeOff,
  Home,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  Users,
  UserPlus,
  Plus,
  X,
  Check,
  Search,
  Filter,
  Shield,
  KeyRound,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  ArrowUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { UserDetailDrawer } from "./UserAssignment";

import { API_BASE_URL } from "../../services/apiClient";

const API_BASE = API_BASE_URL;
const BLUE = "#0D6EFD";

const ROLES = [
  "TenantAdmin",
  "BranchManager",
  "DeptHead",
  "Manager",
  "Uploader",
  "Viewer",
  "Auditor",
  "Approver",
];

const ROLE_META = {
  TenantAdmin: {
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    dot: "bg-purple-500",
    desc: "All except system settings",
  },
  BranchManager: {
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    dot: "bg-blue-500",
    desc: "Branch + doc management",
  },
  DeptHead: {
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    dot: "bg-orange-500",
    desc: "Dept docs + approvals",
  },
  Manager: {
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    dot: "bg-amber-500",
    desc: "Upload + edit + approve",
  },
  Uploader: {
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    dot: "bg-blue-500",
    desc: "Upload + edit only",
  },
  Viewer: {
    color: "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300",
    dot: "bg-slate-400",
    desc: "Read-only access",
  },
  Auditor: {
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    dot: "bg-red-500",
    desc: "Read + full audit log",
  },
  Approver: {
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    dot: "bg-emerald-500",
    desc: "View + workflow approvals",
  },
};

const AVATAR_COLORS = [
  "bg-violet-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-cyan-600",
  "bg-fuchsia-600",
  "bg-indigo-600",
];

function initials(name = "") {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??"
  );
}
function avatarColor(id) {
  return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
}

// ── Animations (scoped) ────────────────────────────────────────
const ANIM_CSS = `
@keyframes um-fade-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes um-fade-in{from{opacity:0}to{opacity:1}}
@keyframes um-fade-out{from{opacity:1}to{opacity:0}}
@keyframes um-row-in{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
@keyframes um-scale-in{from{opacity:0;transform:translateY(10px) scale(.95)}to{opacity:1;transform:none}}
@keyframes um-scale-out{from{opacity:1;transform:none}to{opacity:0;transform:translateY(6px) scale(.96)}}
@keyframes um-menu-in{from{opacity:0;transform:translateY(-6px) scale(.96)}to{opacity:1;transform:none}}
@keyframes um-toast-in{from{opacity:0;transform:translateY(18px) scale(.95)}to{opacity:1;transform:none}}
@keyframes um-pop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}
@keyframes um-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
@keyframes um-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes um-area{from{opacity:0}to{opacity:1}}
@keyframes um-pulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}100%{box-shadow:0 0 0 7px rgba(16,185,129,0)}}
.um-fade-up{animation:um-fade-up .55s cubic-bezier(.22,1,.36,1) both}
.um-fade-in{animation:um-fade-in .2s ease-out both}
.um-fade-out{animation:um-fade-out .18s ease-in both}
.um-row-in{animation:um-row-in .45s cubic-bezier(.22,1,.36,1) both}
.um-scale-in{animation:um-scale-in .28s cubic-bezier(.22,1,.36,1) both}
.um-scale-out{animation:um-scale-out .18s ease-in both}
.um-menu-in{animation:um-menu-in .16s ease-out both;transform-origin:top left}
.um-toast-in{animation:um-toast-in .35s cubic-bezier(.22,1,.36,1) both}
.um-pop{animation:um-pop .35s cubic-bezier(.34,1.56,.64,1) both}
.um-draw{stroke-dasharray:1;animation:um-draw 1.2s cubic-bezier(.22,1,.36,1) .35s both}
.um-area{animation:um-area .9s ease-out .6s both}
.um-live{animation:um-pulse 1.8s ease-out infinite}
.um-skel{background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:1200px 100%;animation:um-shimmer 1.5s infinite linear}
.dark .um-skel{background:linear-gradient(90deg,#243247 25%,#2d3d54 50%,#243247 75%);background-size:1200px 100%}
.um-press{transition:transform .15s ease,box-shadow .2s ease,background-color .2s ease,border-color .2s ease}
.um-press:active{transform:scale(.96)}
@media (prefers-reduced-motion:reduce){
  .um-root *{animation-duration:.01ms!important;animation-delay:0ms!important;transition-duration:.01ms!important}
}
`;

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

const inputCls =
  "w-full px-3 py-[10px] text-[13px] rounded-xl border bg-white dark:bg-[#232F40] text-slate-800 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 outline-none transition focus:ring-2 focus:ring-blue-500/15";
const labelCls =
  "block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2";

// ── Toasts ─────────────────────────────────────────────────────
function Toasts({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="um-toast-in flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[13px] font-semibold rounded-xl px-4 py-3 shadow-2xl"
        >
          {t.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-400 dark:text-red-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          )}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Modal shell ────────────────────────────────────────────────
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
        closing ? "um-fade-out" : "um-fade-in"
      }`}
      style={{ backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className={`bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-700 rounded-2xl w-full ${maxW} shadow-2xl overflow-hidden ${
          closing ? "um-scale-out" : "um-scale-in"
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
        className="um-press w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Confirm (remove user) ──────────────────────────────────────
function ConfirmDialog({ user, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  async function run(close) {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    close();
  }
  return (
    <ModalShell onClose={onClose} maxW="max-w-sm">
      {(close) => (
        <div className="p-6">
          <div className="um-pop w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 text-center mb-1">Remove User?</h3>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 text-center mb-5 leading-relaxed">
            <span className="font-bold text-slate-700 dark:text-slate-200">"{user?.name || user?.email}"</span> will be
            removed. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={close}
              className="um-press flex-1 py-[10px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => run(close)}
              disabled={loading}
              className="um-press flex-1 py-[10px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Removing…
                </>
              ) : (
                "Remove User"
              )}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

// ── Guide ──────────────────────────────────────────────────────
function GuideModal({ onClose }) {
  const steps = [
    {
      title: "Invite a User",
      desc: "Click Invite User to add a new user. Fill in their name, email, a temporary password, and assign a role.",
    },
    {
      title: "Change a Role",
      desc: "Click the role badge next to any user in the table to instantly change their role from the dropdown.",
    },
    {
      title: "Toggle Active / Inactive",
      desc: "Use the switch in the Status column to activate or deactivate a user. TenantAdmin users cannot be deactivated.",
    },
    {
      title: "View Access",
      desc: "Click Access to see and manage what folders, plants, or company codes a user has permission to view.",
    },
    {
      title: "Edit or Remove",
      desc: "Use the ⋮ menu next to a user to edit their details or remove them. Removing a user asks for confirmation first.",
    },
  ];
  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <>
          <ModalHeader icon={Info} title="User Management — Guide" onClose={close} />
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {steps.map((s, i) => (
              <div key={s.title} className="um-fade-up flex gap-3" style={{ animationDelay: `${80 + i * 60}ms` }}>
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
              className="um-press w-full py-[10px] rounded-xl bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[12.5px] font-bold"
            >
              Got it
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ── Invite / Edit user ─────────────────────────────────────────
function UserModal({ mode, user, onClose, onSave }) {
  const [form, setForm] = useState(() =>
    mode === "edit" && user
      ? { name: user.name || "", email: user.email || "", password: "", confirmPassword: "", role: user.role || "Viewer" }
      : { name: "", email: "", password: "", confirmPassword: "", role: "Viewer" },
  );
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (mode === "add" && !form.password) e.password = "Password is required";
    if (mode === "add" && form.password && form.password.length < 6) e.password = "Min 6 characters";
    if (mode === "add" && form.password && form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    return e;
  }

  async function submit(close) {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    // confirmPassword sirf client-side validation ke liye hai — backend ko nahi bhejna
    // eslint-disable-next-line no-unused-vars
    const { confirmPassword, ...payload } = form;
    setLoading(true);
    const ok = await onSave(payload);
    setLoading(false);
    if (ok) close();
  }

  const fieldCls = (err) =>
    `${inputCls} ${err ? "border-red-400" : "border-slate-200 dark:border-slate-600 focus:border-[#0D6EFD]"}`;

  return (
    <ModalShell onClose={onClose}>
      {(close) => (
        <>
          <ModalHeader
            icon={mode === "add" ? UserPlus : Pencil}
            title={mode === "add" ? "Invite New User" : "Edit User"}
            subtitle={mode === "add" ? "Add a user to your tenant" : "Update user details and role"}
            onClose={close}
          />
          <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
            <div>
              <label className={labelCls}>Full Name</label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Ravi Kumar"
                className={fieldCls(errors.name)}
              />
              {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className={labelCls}>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="user@company.com"
                disabled={mode === "edit"}
                className={`${fieldCls(errors.email)} ${mode === "edit" ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
            </div>

            {mode === "add" && (
              <>
                <div>
                  <label className={labelCls}>Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="Min 6 characters"
                      className={`${fieldCls(errors.password)} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className={labelCls}>Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => set("confirmPassword", e.target.value)}
                      placeholder="Re-enter password"
                      className={`${fieldCls(errors.confirmPassword)} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[11px] text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>
              </>
            )}

            <div>
              <label className={labelCls}>Assign Role</label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  className={`${inputCls} border-slate-200 dark:border-slate-600 focus:border-[#0D6EFD] appearance-none pr-9`}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r} — {ROLE_META[r]?.desc}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1 rounded-full ${ROLE_META[form.role]?.color}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${ROLE_META[form.role]?.dot}`} />
                  {form.role}
                </span>
                <span className="text-[11.5px] text-slate-400">{ROLE_META[form.role]?.desc}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={close}
              className="um-press flex-1 py-[10px] rounded-xl border border-slate-200 dark:border-slate-600 text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => submit(close)}
              disabled={loading}
              className="um-press flex-1 py-[10px] rounded-xl bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[12.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mode === "add" ? "Create User" : "Save Changes"}
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ── Sparkline (decorative bell curve, draws itself) ────────────
function Spark({ color, id }) {
  const line = "M0,38 C18,38 26,34 36,22 C44,12 50,6 58,6 C68,6 74,18 84,30 C90,36 96,38 100,38";
  return (
    <svg viewBox="0 0 100 40" className="w-[96px] h-[40px]" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path className="um-area" d={`${line} L100,40 L0,40 Z`} fill={`url(#${id})`} />
      <path
        className="um-draw"
        d={line}
        pathLength="1"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function StatCard({ label, value, trend, bad, icon, tint, color, id, delay }) {
  const n = useCountUp(value);
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="um-fade-up bg-white dark:bg-[#1A2433] border border-slate-200/70 dark:border-slate-700 rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.05)] px-5 py-5 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-all duration-300"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${tint}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[32px] leading-none font-bold text-slate-900 dark:text-slate-50">{n}</div>
        <div className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">{label}</div>
      </div>
      <div className="ml-auto flex flex-col items-end gap-1 flex-shrink-0">
        <span
          title="Change vs. 30 days ago, based on join dates"
          className={`flex items-center gap-0.5 text-[12px] font-bold ${bad ? "text-red-500" : "text-emerald-500"}`}
        >
          <ArrowUp className="w-3 h-3" />
          {trend >= 0 ? "+" : ""}
          {trend}%
        </span>
        <Spark color={color} id={id} />
      </div>
    </div>
  );
}

function SortTh({ label, k, sort, setSort, className = "" }) {
  const on = sort.key === k;
  return (
    <th className={`px-4 py-4 ${className}`}>
      <button
        onClick={() => setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" }))}
        className={`inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide transition-colors ${
          on ? "text-[#0D6EFD]" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
      >
        {label}
        <ChevronsUpDown className="w-3 h-3" />
      </button>
    </th>
  );
}

// ═════════════════════════════════════════════════════════════
// Main
// ═════════════════════════════════════════════════════════════
export default function TAUsers({ token, onNavigate, showHeader = true }) {
  const [users, setUsers] = useState([]);
  const [tenantName, setTenantName] = useState("Your Organisation");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [modal, setModal] = useState(null); // { mode, user }
  const [confirmUser, setConfirmUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [detailUser, setDetailUser] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [pop, setPop] = useState(null); // { kind, user, src, top|bottom, left, maxH }

  const getToken = useCallback(() => token || localStorage.getItem("accessToken") || "", [token]);

  const toast = useCallback((msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  // ── Fetch users ────────────────────────────────────────────
  async function fetchUsers(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        if (data.tenantName) setTenantName(data.tenantName);
      } else {
        toast(data.message || "Failed to load users", "error");
      }
    } catch {
      toast("Network error — check your connection", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function putUser(id, body) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  // ── Create user (true = success → modal band) ──────────────
  async function handleCreate(form) {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast("User created successfully");
        fetchUsers(true);
        return true;
      }
      toast(data.message || "Could not create user", "error");
    } catch {
      toast("Network error", "error");
    }
    return false;
  }

  // ── Update user (name + role) ──────────────────────────────
  async function handleEdit(form) {
    try {
      const data = await putUser(modal.user.id, { name: form.name, role: form.role });
      if (data.success) {
        toast("User updated");
        fetchUsers(true);
        return true;
      }
      toast(data.message || "Update failed", "error");
    } catch {
      toast("Network error", "error");
    }
    return false;
  }

  // ── Toggle active ──────────────────────────────────────────
  async function handleToggleActive(user) {
    if (user.role === "TenantAdmin") {
      toast("TenantAdmin ko deactivate nahi kar sakte", "error");
      return;
    }
    setSavingId(`toggle-${user.id}`);
    try {
      const data = await putUser(user.id, { isActive: !user.isActive });
      if (data.success) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));
        toast(user.isActive ? "User deactivated" : "User activated");
      } else {
        toast(data.message || "Failed to update", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setSavingId(null);
    }
  }

  // ── Inline role change ─────────────────────────────────────
  async function handleRoleChange(userId, newRole) {
    setSavingId(`role-${userId}`);
    try {
      const data = await putUser(userId, { role: newRole });
      if (data.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
        toast(`Role changed to ${newRole}`);
      } else {
        toast(data.message || "Role update failed", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setSavingId(null);
    }
  }

  // ── Delete user ────────────────────────────────────────────
  async function handleDelete() {
    if (!confirmUser) return;
    const u = confirmUser;
    setSavingId(`del-${u.id}`);
    try {
      const res = await fetch(`${API_BASE}/users/${u.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
        toast("User removed");
      } else {
        toast(data.message || "Delete failed", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setSavingId(null);
    }
  }

  // ── Floating popovers (table clipping se bachne ke liye) ───
  function openPop(e, kind, user) {
    e.stopPropagation();
    const src = `${kind}-${user.id}`;
    if (pop?.src === src) return setPop(null);
    const r = e.currentTarget.getBoundingClientRect();
    if (kind === "actions") {
      const top = r.bottom + 6 + 100 > window.innerHeight ? Math.max(8, r.top - 106) : r.bottom + 6;
      return setPop({ kind, user, src, top, left: Math.max(8, r.right - 150) });
    }
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 240));
    const below = window.innerHeight - r.bottom - 12;
    if (below < 260 && r.top > below) {
      setPop({ kind, user, src, bottom: window.innerHeight - r.top + 6, left, maxH: r.top - 20 });
    } else {
      setPop({ kind, user, src, top: r.bottom + 6, left, maxH: below });
    }
  }

  useEffect(() => {
    if (!pop) return;
    const down = (e) => {
      if (e.target.closest?.("[data-um-pop]") || e.target.closest?.("[data-um-btn]")) return;
      setPop(null);
    };
    const close = () => setPop(null);
    document.addEventListener("mousedown", down);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", down);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pop]);

  // ── Derived ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = users.filter((u) => {
      const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchRole = filterRole === "All" || u.role === filterRole;
      return matchSearch && matchRole;
    });
    if (!sort.key) return list;
    const dir = sort.dir === "asc" ? 1 : -1;
    const val = (u) =>
      ({
        name: u.name || "",
        role: u.role || "",
        permissions: ROLE_META[u.role]?.desc || "",
        status: u.isActive ? 1 : 0,
        joined: u.createdAt ? new Date(u.createdAt).getTime() : 0,
      })[sort.key];
    return [...list].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
    });
  }, [users, search, filterRole, sort]);

  const activeUsers = users.filter((u) => u.isActive);
  const inactiveUsers = users.filter((u) => !u.isActive);
  const activeCount = activeUsers.length;
  const inactiveCount = inactiveUsers.length;
  const rolesUsed = new Set(users.map((u) => u.role)).size;

  // "+x%" = pichhle 30 din ke join-date ke hisaab se growth
  const trends = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    const before = (list) => list.filter((u) => !u.createdAt || new Date(u.createdAt).getTime() < cutoff);
    const growth = (now, prev) => (now === 0 && prev === 0 ? 0 : prev === 0 ? 100 : Math.round(((now - prev) / prev) * 100));
    return {
      total: growth(users.length, before(users).length),
      active: growth(activeUsers.length, before(activeUsers).length),
      inactive: growth(inactiveUsers.length, before(inactiveUsers).length),
      roles: growth(new Set(users.map((u) => u.role)).size, new Set(before(users).map((u) => u.role)).size),
    };
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="um-root">
      <style>{ANIM_CSS}</style>
      <Toasts toasts={toasts} />

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      {modal && (
        <UserModal
          mode={modal.mode}
          user={modal.user}
          onClose={() => setModal(null)}
          onSave={modal.mode === "add" ? handleCreate : handleEdit}
        />
      )}

      {confirmUser && (
        <ConfirmDialog user={confirmUser} onConfirm={handleDelete} onClose={() => setConfirmUser(null)} />
      )}

      <UserDetailDrawer
        open={detailOpen}
        user={detailUser}
        onClose={() => setDetailOpen(false)}
        onNavigate={onNavigate}
        onToast={toast}
      />

      {/* ── Page header ── */}
      <div className="um-fade-up flex items-start justify-between gap-4 mb-6">
        <div>
          {showHeader && (
            <nav className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400 mb-3">
              <Home className="w-4 h-4 text-[#0D6EFD]" />
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span>Organization</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span className="font-semibold text-slate-800 dark:text-slate-100">User Management</span>
            </nav>
          )}
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] leading-tight font-bold text-slate-900 dark:text-slate-50">User Management</h1>
            <Users className="w-6 h-6 text-[#0D6EFD]" />
            <div className="relative group">
              <button
                onClick={() => setShowGuide(true)}
                className="um-press w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-[#0D6EFD] hover:text-white transition-colors"
              >
                <Info className="w-3 h-3" />
              </button>
              <div className="pointer-events-none absolute left-0 top-full mt-2 w-56 bg-slate-800 dark:bg-slate-700 text-white text-[10.5px] leading-relaxed rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                Click to see a step-by-step guide on how to use this page.
              </div>
            </div>
          </div>
          <p className="flex items-center flex-wrap gap-x-3 text-[14px] text-slate-500 dark:text-slate-400 mt-1.5">
            <span>
              Tenant: <span className="font-semibold text-slate-800 dark:text-slate-100">{tenantName}</span>
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 um-live" />
              {activeCount} active
            </span>
            {inactiveCount > 0 && <span className="text-slate-400">{inactiveCount} inactive</span>}
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "add", user: null })}
          className="um-press flex-shrink-0 flex items-center gap-2.5 bg-[#0D6EFD] hover:bg-[#0B5ED7] text-white text-[15px] font-bold rounded-xl px-6 py-3 shadow-[0_4px_14px_rgba(13,110,253,0.35)] hover:shadow-[0_8px_20px_rgba(13,110,253,0.45)] hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Invite User
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
        <StatCard
          label="Total Users"
          value={users.length}
          trend={trends.total}
          id="um-g-total"
          color="#3b82f6"
          tint="bg-blue-100/70 dark:bg-blue-900/30"
          icon={<Users className="w-7 h-7 text-blue-600" fill="currentColor" fillOpacity={0.25} />}
          delay={60}
        />
        <StatCard
          label="Active Users"
          value={activeCount}
          trend={trends.active}
          id="um-g-active"
          color="#10b981"
          tint="bg-emerald-100/70 dark:bg-emerald-900/30"
          icon={
            <span className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" strokeWidth={3} />
            </span>
          }
          delay={120}
        />
        <StatCard
          label="Inactive Users"
          value={inactiveCount}
          trend={trends.inactive}
          bad={trends.inactive > 0}
          id="um-g-inactive"
          color="#ef4444"
          tint="bg-red-100/70 dark:bg-red-900/30"
          icon={
            <span className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
              <X className="w-5 h-5 text-white" strokeWidth={3} />
            </span>
          }
          delay={180}
        />
        <StatCard
          label="Roles Used"
          value={rolesUsed}
          trend={trends.roles}
          id="um-g-roles"
          color="#8b5cf6"
          tint="bg-violet-100/70 dark:bg-violet-900/30"
          icon={
            <span className="relative flex items-center justify-center">
              <Shield className="w-8 h-8 text-violet-600" fill="currentColor" />
              <Check className="w-3.5 h-3.5 text-white absolute" strokeWidth={3.5} />
            </span>
          }
          delay={240}
        />
      </div>

      {/* ── Filters ── */}
      <div
        className="um-fade-up bg-white dark:bg-[#1A2433] border border-slate-200/70 dark:border-slate-700 rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.05)] p-4 flex flex-col sm:flex-row gap-3 mb-5"
        style={{ animationDelay: "300ms" }}
      >
        <div className="relative flex-1">
          <Search className="w-[18px] h-[18px] text-[#0D6EFD] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-11 pr-10 py-3 text-[14px] bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-[#0D6EFD] focus:ring-2 focus:ring-blue-500/15 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative sm:w-[200px]">
          <Filter className="w-4 h-4 text-slate-600 dark:text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="appearance-none w-full pl-11 pr-10 py-3 text-[14px] font-medium bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 outline-none focus:border-[#0D6EFD] focus:ring-2 focus:ring-blue-500/15 transition"
          >
            <option value="All">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* ── Table ── */}
      <div
        className="um-fade-up bg-white dark:bg-[#1A2433] border border-slate-200/70 dark:border-slate-700 rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.05)] overflow-hidden"
        style={{ animationDelay: "360ms" }}
      >
        {loading ? (
          <div className="p-5 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="um-skel w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="um-skel h-3.5 w-1/4 rounded" />
                  <div className="um-skel h-3 w-1/5 rounded" />
                </div>
                <div className="um-skel h-7 w-24 rounded-full" />
                <div className="um-skel h-7 w-14 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="um-fade-up flex flex-col items-center justify-center py-16 text-slate-400">
            <Users className="w-10 h-10 opacity-40 mb-3" />
            <div className="text-[14px] font-semibold text-slate-600 dark:text-slate-300">No users found</div>
            <div className="text-[12.5px] mt-1">
              {search || filterRole !== "All" ? "Try adjusting your filters" : "Invite your first user to get started"}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-[#16202E] border-b border-slate-100 dark:border-slate-700">
                  <SortTh label="User" k="name" sort={sort} setSort={setSort} className="text-left pl-8 w-[280px]" />
                  <SortTh label="Role" k="role" sort={sort} setSort={setSort} className="text-left" />
                  <SortTh label="Permissions" k="permissions" sort={sort} setSort={setSort} className="text-left hidden lg:table-cell" />
                  <SortTh label="Status" k="status" sort={sort} setSort={setSort} className="text-left" />
                  <SortTh label="Joined" k="joined" sort={sort} setSort={setSort} className="text-left" />
                  <th className="px-6 py-4 text-right text-[12px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => {
                  const isDeleting = savingId === `del-${u.id}`;
                  const isToggling = savingId === `toggle-${u.id}`;
                  const isRoleSaving = savingId === `role-${u.id}`;
                  const meta = ROLE_META[u.role];
                  return (
                    <tr
                      key={u.id}
                      style={{ animationDelay: `${420 + idx * 70}ms` }}
                      className={`um-row-in border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors duration-200 ${
                        isDeleting ? "opacity-40" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                      }`}
                    >
                      {/* User */}
                      <td className="pl-8 pr-4 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold text-white flex-shrink-0 shadow-sm ${avatarColor(u.id)}`}
                          >
                            {initials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[15px] font-bold text-slate-900 dark:text-slate-100 truncate">
                              {u.name || "—"}
                            </div>
                            <div className="text-[13px] text-slate-500 dark:text-slate-400 truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role pill */}
                      <td className="px-4 py-4">
                        <button
                          data-um-btn
                          onClick={(e) => openPop(e, "role", u)}
                          disabled={isRoleSaving || isDeleting}
                          className={`um-press inline-flex items-center gap-2 text-[13px] font-bold pl-3 pr-2.5 py-[5px] rounded-full ${
                            meta?.color || "bg-slate-100 text-slate-600"
                          } ${isRoleSaving ? "opacity-60" : "hover:brightness-95 cursor-pointer"}`}
                        >
                          {isRoleSaving ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <span className={`w-2 h-2 rounded-full ${meta?.dot}`} />
                          )}
                          {u.role}
                          <ChevronDown
                            className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${
                              pop?.src === `role-${u.id}` ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </td>

                      {/* Permissions */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-[13.5px] text-blue-700 dark:text-blue-300">{meta?.desc || "—"}</span>
                      </td>

                      {/* Status switch */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isToggling || isDeleting || u.role === "TenantAdmin"}
                          title={u.role === "TenantAdmin" ? "TenantAdmin cannot be deactivated" : u.isActive ? "Deactivate" : "Activate"}
                          className={`relative w-[52px] h-[28px] rounded-full flex-shrink-0 transition-colors duration-300 disabled:cursor-not-allowed ${
                            u.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                          } ${u.role === "TenantAdmin" ? "opacity-90" : ""}`}
                        >
                          <span
                            className="absolute top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-300"
                            style={{ left: u.isActive ? 27 : 3 }}
                          >
                            {isToggling && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                          </span>
                        </button>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-4">
                        <span className="text-[13.5px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 justify-end">
                          <button
                            onClick={() => {
                              setDetailUser(u);
                              setDetailOpen(true);
                            }}
                            disabled={isDeleting}
                            className="um-press flex items-center gap-2 text-[13.5px] font-medium px-5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-transparent text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[#0D6EFD] hover:-translate-y-0.5"
                          >
                            <KeyRound className="w-4 h-4" /> Access
                          </button>
                          <button
                            data-um-btn
                            onClick={(e) => openPop(e, "actions", u)}
                            disabled={isDeleting}
                            className="um-press w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                          >
                            <MoreVertical className="w-[18px] h-[18px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-[13.5px] text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold text-slate-800 dark:text-slate-100">{filtered.length}</span> of{" "}
              {users.length} users
            </span>
            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="um-press flex items-center gap-2 text-[14px] font-bold text-[#0D6EFD] hover:text-[#0B5ED7] disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        )}
      </div>

      {/* ── Floating popovers ── */}
      {pop?.kind === "role" && (
        <div
          data-um-pop
          style={{ top: pop.top, bottom: pop.bottom, left: pop.left, maxHeight: pop.maxH }}
          className="um-menu-in fixed z-[70] w-56 overflow-y-auto bg-white dark:bg-[#232F40] border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl py-1"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
            Change Role
          </div>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => {
                const { user } = pop;
                setPop(null);
                if (r !== user.role) handleRoleChange(user.id, r);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                r === pop.user.role ? "bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ROLE_META[r]?.dot}`} />
              <div className="min-w-0">
                <div
                  className={`text-[12px] font-bold ${
                    r === pop.user.role ? "text-[#0D6EFD]" : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {r}
                </div>
                <div className="text-[10.5px] text-slate-400">{ROLE_META[r]?.desc}</div>
              </div>
              {r === pop.user.role && <Check className="ml-auto w-3.5 h-3.5 text-[#0D6EFD]" />}
            </button>
          ))}
        </div>
      )}

      {pop?.kind === "actions" && (
        <div
          data-um-pop
          style={{ top: pop.top, left: pop.left }}
          className="um-menu-in fixed z-[70] w-[150px] bg-white dark:bg-[#232F40] border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl py-1"
        >
          <button
            onClick={() => {
              const { user } = pop;
              setPop(null);
              setModal({ mode: "edit", user });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={() => {
              const { user } = pop;
              setPop(null);
              setConfirmUser(user);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}