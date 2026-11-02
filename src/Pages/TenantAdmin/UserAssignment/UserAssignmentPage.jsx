// src/Pages/TenantAdmin/UserAssignment/UserAssignmentPage.jsx
//
// "User Assignment" — Tenant → Users → Roles → User Assignment.
// Layout (matches the design mock):
//   Header (breadcrumb, title, Help & Guide)
//   LEFT  card : Access Configuration → USER → ASSIGNMENT LEVEL → illustration / hierarchy tree → Save / Discard
//   RIGHT cards: Assigned Access · Assignment Overview (Departments / Categories / Document Types / History)
//
// All business logic / API calls are unchanged — every permission decision
// still lives in the backend's Dynamic User Assignment Engine.

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Home,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  UserRound,
  Building2,
  Folder,
  FileText,
  FilePlus,
  Shield,
  PieChart,
  Settings,
  Clock3,
  Save,
  RotateCcw,
  CheckCircle2,
  Info,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  fetchTenantUsers,
  fetchUserAssignments,
  createAssignment,
  revokeAssignment,
  getCurrentUser,
  PRESELECT_STORAGE_KEY,
} from "./userAssignmentApi";
import { createTreeDataSource } from "./treeDataSource";
import TreeSelect from "./TreeSelect";
import AssignedAccessBadges from "./AssignedAccessBadges";
import AssignmentHistoryPanel from "./AssignmentHistoryPanel";

const PRESELECT_KEY = PRESELECT_STORAGE_KEY;

const LEVELS = [
  {
    key: "DEPARTMENT",
    label: "Department",
    desc: "Grants everything under the selected department(s)",
    Icon: Building2,
    tile: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  },
  {
    key: "CATEGORY",
    label: "Category",
    desc: "Grants selected categories and everything under them",
    Icon: Folder,
    tile: "bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-300",
  },
  {
    key: "DOCUMENT_TYPE",
    label: "Document Type",
    desc: "Grants only the selected document type(s)",
    Icon: FileText,
    tile: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
];

const LEVEL_SINGULAR = { DEPARTMENT: "Department", CATEGORY: "Category", DOCUMENT_TYPE: "Document Type" };

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

function keyToTarget(level, node) {
  if (level === "DEPARTMENT") return { assignmentLevel: level, departmentId: node.id };
  if (level === "CATEGORY") return { assignmentLevel: level, categoryId: node.id };
  return { assignmentLevel: level, documentTypeId: node.id };
}

function assignmentName(a) {
  if (a.assignmentLevel === "DEPARTMENT") return a.Department?.name || `Department #${a.departmentId}`;
  if (a.assignmentLevel === "CATEGORY") return a.Category?.name || `Category #${a.categoryId}`;
  return a.DocumentType?.name || `Document Type #${a.documentTypeId}`;
}

// ── Scoped animations ──────────────────────────────────────────
const ANIM_CSS = `
@keyframes ua-fade-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes ua-fade-in{from{opacity:0}to{opacity:1}}
@keyframes ua-fade-out{from{opacity:1}to{opacity:0}}
@keyframes ua-fade-down{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@keyframes ua-scale-in{from{opacity:0;transform:translateY(10px) scale(.95)}to{opacity:1;transform:none}}
@keyframes ua-scale-out{from{opacity:1;transform:none}to{opacity:0;transform:translateY(6px) scale(.96)}}
@keyframes ua-toast-in{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
@keyframes ua-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes ua-slide-in{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
@keyframes ua-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes ua-pulse-ring{0%{transform:scale(1);opacity:.55}100%{transform:scale(1.55);opacity:0}}
@keyframes ua-dash{to{stroke-dashoffset:-24}}
@keyframes ua-twinkle{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}
@keyframes ua-spin-slow{to{transform:rotate(360deg)}}
@keyframes ua-glow{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:.9;transform:scale(1.06)}}

.ua-fade-up{animation:ua-fade-up .55s cubic-bezier(.22,1,.36,1) both}
.ua-fade-in{animation:ua-fade-in .25s ease-out both}
.ua-fade-out{animation:ua-fade-out .18s ease-in both}
.ua-fade-down{animation:ua-fade-down .25s cubic-bezier(.22,1,.36,1) both}
.ua-scale-in{animation:ua-scale-in .28s cubic-bezier(.22,1,.36,1) both}
.ua-scale-out{animation:ua-scale-out .18s ease-in both}
.ua-toast-in{animation:ua-toast-in .35s cubic-bezier(.22,1,.36,1) both}
.ua-pop{animation:ua-pop .3s cubic-bezier(.34,1.56,.64,1) both}
.ua-slide-in{animation:ua-slide-in .45s cubic-bezier(.22,1,.36,1) both}
.ua-float{animation:ua-float 4.2s ease-in-out infinite}
.ua-pulse-ring{animation:ua-pulse-ring 2.6s ease-out infinite}
.ua-dash{stroke-dasharray:4 6;animation:ua-dash 1.4s linear infinite}
.ua-twinkle{animation:ua-twinkle 2.8s ease-in-out infinite}
.ua-spin-slow{animation:ua-spin-slow 9s linear infinite}
.ua-glow{animation:ua-glow 5s ease-in-out infinite}
.ua-press{transition:transform .15s ease,box-shadow .2s ease,background-color .2s ease,border-color .2s ease}
.ua-press:active:not(:disabled){transform:scale(.97)}
.ua-lift{transition:transform .25s ease,box-shadow .25s ease}
.ua-lift:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(15,23,42,.08)}
@media (prefers-reduced-motion:reduce){
  .ua-root *{animation-duration:.01ms!important;animation-delay:0ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`;

// ── Small shared pieces ────────────────────────────────────────
function Card({ children, className = "", style }) {
  return (
    <div
      style={style}
      className={`bg-white dark:bg-[#1A2433] border border-slate-200/70 dark:border-slate-700 rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3.5 min-w-0">
        <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[16px] leading-tight font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div className="text-[12.5px] font-bold tracking-wide uppercase text-slate-700 dark:text-slate-300 mb-2.5">
      {children}
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`ua-toast-in flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-[13px] font-semibold text-white ${
            t.type === "success" ? "bg-emerald-600" : t.type === "error" ? "bg-red-600" : "bg-blue-600"
          }`}
        >
          {t.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {t.msg}
        </div>
      ))}
    </div>
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
    { title: "Select a User", desc: "Open the User box and pick the person you want to grant or review access for." },
    { title: "Choose an Assignment Level", desc: "Department grants everything under it, Category grants that category and its document types, Document Type grants only that specific type." },
    { title: "Pick from the Hierarchy", desc: "Use the tree to search and select one or more departments, categories, or document types for the chosen level." },
    { title: "Save or Discard", desc: "Click Save Assignments to apply your changes, or Discard Changes to revert to what was previously saved." },
    { title: "Review & Remove", desc: "Assigned Access on the right shows everything currently granted — remove any item directly from there. Assignment Overview keeps the totals and history in one place." },
  ];
  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 ${closing ? "ua-fade-out" : "ua-fade-in"}`}
      style={{ backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className={`bg-white dark:bg-[#1C2A3A] rounded-2xl shadow-2xl w-full max-w-md ${closing ? "ua-scale-out" : "ua-scale-in"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Info className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">User Assignment — Guide</h2>
          </div>
          <button onClick={close} className="ua-press w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {steps.map((s, i) => (
            <div key={s.title} className="ua-fade-up flex gap-3" style={{ animationDelay: `${80 + i * 60}ms` }}>
              <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
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
          <button onClick={close} className="ua-press w-full py-[10px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-bold">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Searchable user picker ─────────────────────────────────────
function UserPicker({ users, selected, onSelect, loading }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = users.filter((u) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className={`w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#1A2433] border rounded-xl text-left transition-all duration-200 disabled:opacity-60 hover:border-blue-400 hover:shadow-sm ${
          open ? "border-blue-500 ring-4 ring-blue-500/10" : "border-slate-200 dark:border-slate-700"
        }`}
      >
        {selected ? (
          <>
            <div className="ua-pop w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
              {initials(selected.name)}
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-slate-900 dark:text-slate-100 truncate">{selected.name}</div>
              <div className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
                {selected.email} · {selected.role}
              </div>
            </div>
          </>
        ) : (
          <span className="text-[14px] text-slate-400 flex items-center gap-3">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <UserRound className="w-5 h-5 text-blue-500" />}
            {loading ? "Loading users…" : "Select a user…"}
          </span>
        )}
        <ChevronDown className={`ml-auto w-4 h-4 text-slate-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="ua-fade-down absolute left-0 top-full mt-1.5 z-40 w-full bg-white dark:bg-[#1C2A3A] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full px-3 py-2 text-[12.5px] bg-slate-50 dark:bg-[#243044] border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 && <div className="px-3 py-3 text-[12px] text-slate-400">No users found</div>}
              {filtered.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    onSelect(u);
                    setOpen(false);
                    setQ("");
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    selected?.id === u.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-slate-400 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    {initials(u.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 truncate">{u.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                  </div>
                  <span className="ml-auto text-[10px] font-bold text-slate-400">{u.role}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Empty-state illustration (user in the middle, orbiting icons) ──
function SelectUserIllustration() {
  const bubble =
    "absolute w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center shadow-[0_4px_14px_rgba(37,99,235,0.15)]";
  return (
    <div className="relative mx-auto w-[360px] max-w-full h-[190px]">
      {/* soft glow behind */}
      <div className="ua-glow absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 w-[330px] h-[120px] rounded-[50%] bg-gradient-to-r from-blue-50 via-blue-100/60 to-blue-50 dark:from-blue-900/10 dark:via-blue-800/20 dark:to-blue-900/10 blur-[2px]" />

      {/* dashed connectors */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 360 190" fill="none">
        <line x1="180" y1="95" x2="180" y2="40" className="ua-dash" stroke="#93B4F5" strokeWidth="1.3" />
        <line x1="180" y1="105" x2="82" y2="116" className="ua-dash" stroke="#93B4F5" strokeWidth="1.3" />
        <line x1="180" y1="105" x2="278" y2="116" className="ua-dash" stroke="#93B4F5" strokeWidth="1.3" />
      </svg>

      {/* sparkles */}
      <span className="ua-twinkle absolute left-[16%] top-[22%] text-blue-400 text-[15px] font-bold">+</span>
      <span className="ua-twinkle absolute right-[18%] top-[16%] text-blue-400 text-[15px] font-bold" style={{ animationDelay: "0.9s" }}>+</span>
      <span className="ua-twinkle absolute left-[30%] top-[52%] text-blue-300 text-[11px] font-bold" style={{ animationDelay: "1.6s" }}>+</span>
      <span className="ua-twinkle absolute right-[30%] top-[56%] text-blue-300 text-[11px] font-bold" style={{ animationDelay: "0.4s" }}>+</span>

      {/* gear (top) */}
      <div className="ua-float absolute left-1/2 top-0 -translate-x-1/2" style={{ animationDelay: "0.3s" }}>
        <div className={`${bubble} relative`}>
          <Settings className="w-5 h-5 ua-spin-slow" />
        </div>
      </div>

      {/* folder (left) */}
      <div className="ua-float absolute left-[46px] top-[94px]" style={{ animationDelay: "0.9s" }}>
        <div className={`${bubble} relative`}>
          <Folder className="w-5 h-5" />
        </div>
      </div>

      {/* file (right) */}
      <div className="ua-float absolute right-[46px] top-[94px]" style={{ animationDelay: "1.5s" }}>
        <div className={`${bubble} relative`}>
          <FileText className="w-5 h-5" />
        </div>
      </div>

      {/* centre avatar */}
      <div className="absolute left-1/2 top-[62px] -translate-x-1/2 w-[84px] h-[84px]">
        <span className="ua-pulse-ring absolute inset-0 rounded-full border-2 border-blue-500/60" />
        <span className="ua-pulse-ring absolute inset-0 rounded-full border-2 border-blue-500/40" style={{ animationDelay: "1.3s" }} />
        <div className="relative w-full h-full rounded-full border-2 border-blue-600 bg-white dark:bg-[#1A2433] p-[5px] shadow-[0_6px_20px_rgba(37,99,235,0.25)]">
          <div className="w-full h-full rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <UserRound className="w-9 h-9 text-blue-600 fill-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Overview row ───────────────────────────────────────────────
function OverviewRow({ Icon, tile, title, subtitle, count, onClick, expanded, delay = 0 }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`ua-slide-in w-full flex items-center gap-3.5 px-3.5 py-3 text-left ${
        onClick ? "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" : ""
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tile}`}>
        <Icon className="w-5 h-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-slate-900 dark:text-slate-100">{title}</span>
        <span className="block text-[12px] text-slate-500 dark:text-slate-400">{subtitle}</span>
      </span>
      <span
        key={String(count)}
        className="ua-pop min-w-[44px] text-center text-[13px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1 flex items-center justify-center gap-1"
      >
        {count}
        {onClick && (
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
        )}
      </span>
    </Tag>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function UserAssignmentPage({ showHeader = true }) {
  const tenant = useMemo(() => getCurrentUser(), []);
  const [toasts, setToasts] = useState([]);
  function toast(msg, type = "success") {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const [level, setLevel] = useState("DEPARTMENT");
  const [selectedKeysByLevel, setSelectedKeysByLevel] = useState({
    DEPARTMENT: new Set(),
    CATEGORY: new Set(),
    DOCUMENT_TYPE: new Set(),
  });
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  // assignmentId → "Employee (Department)" — lets the history list show names
  // even for assignments that were revoked later (audit rows only hold ids).
  const labelCache = useRef(new Map());
  const resolveLabel = useCallback((id) => labelCache.current.get(Number(id)) || null, []);

  const dataSource = useMemo(
    () => createTreeDataSource(level, tenant?.tenantId),
    [level, tenant?.tenantId],
  );
  const levelMeta = LEVELS.find((l) => l.key === level);

  // ── Load users once ──
  useEffect(() => {
    setUsersLoading(true);
    fetchTenantUsers()
      .then((rows) => {
        setUsers(rows);
        try {
          const raw = sessionStorage.getItem(PRESELECT_KEY);
          if (raw) {
            sessionStorage.removeItem(PRESELECT_KEY);
            const target = JSON.parse(raw);
            const match = rows.find((u) => u.id === target.id);
            if (match) setSelectedUser(match);
          }
        } catch {
          /* ignore malformed preselect payload */
        }
      })
      .catch((e) => toast(e.message || "Failed to load users", "error"))
      .finally(() => setUsersLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keysFromAssignments = useCallback((rows) => {
    const byLevel = { DEPARTMENT: new Set(), CATEGORY: new Set(), DOCUMENT_TYPE: new Set() };
    rows.forEach((a) => {
      if (a.assignmentLevel === "DEPARTMENT" && a.departmentId) byLevel.DEPARTMENT.add(`dept-${a.departmentId}`);
      if (a.assignmentLevel === "CATEGORY" && a.categoryId) byLevel.CATEGORY.add(`cat-${a.categoryId}`);
      if (a.assignmentLevel === "DOCUMENT_TYPE" && a.documentTypeId) byLevel.DOCUMENT_TYPE.add(`dt-${a.documentTypeId}`);
    });
    return byLevel;
  }, []);

  const loadAssignments = useCallback(
    (userId) => {
      setAssignmentsLoading(true);
      return fetchUserAssignments(userId)
        .then((rows) => {
          rows.forEach((a) =>
            labelCache.current.set(a.id, `${assignmentName(a)} (${LEVEL_SINGULAR[a.assignmentLevel]})`),
          );
          setAssignments(rows);
          setSelectedKeysByLevel(keysFromAssignments(rows));
        })
        .catch((e) => toast(e.message || "Failed to load assignments", "error"))
        .finally(() => setAssignmentsLoading(false));
    },
    [keysFromAssignments],
  );

  useEffect(() => {
    if (selectedUser) loadAssignments(selectedUser.id);
    else {
      setAssignments([]);
      setSelectedKeysByLevel({ DEPARTMENT: new Set(), CATEGORY: new Set(), DOCUMENT_TYPE: new Set() });
    }
    setShowHistory(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  function handleToggle(node) {
    setSelectedKeysByLevel((prev) => {
      const set = new Set(prev[level]);
      if (set.has(node.key)) set.delete(node.key);
      else set.add(node.key);
      return { ...prev, [level]: set };
    });
  }

  function handleBulkToggle(nodes, checked) {
    setSelectedKeysByLevel((prev) => {
      const set = new Set(prev[level]);
      nodes.forEach((n) => (checked ? set.add(n.key) : set.delete(n.key)));
      return { ...prev, [level]: set };
    });
  }

  const originalKeysForLevel = useMemo(() => keysFromAssignments(assignments)[level], [assignments, level, keysFromAssignments]);
  const currentKeysForLevel = selectedKeysByLevel[level];
  const isDirty = useMemo(() => {
    if (originalKeysForLevel.size !== currentKeysForLevel.size) return true;
    for (const k of currentKeysForLevel) if (!originalKeysForLevel.has(k)) return true;
    return false;
  }, [originalKeysForLevel, currentKeysForLevel]);

  const assignmentByKey = useMemo(() => {
    const m = new Map();
    assignments.forEach((a) => {
      if (a.assignmentLevel === "DEPARTMENT") m.set(`dept-${a.departmentId}`, a);
      if (a.assignmentLevel === "CATEGORY") m.set(`cat-${a.categoryId}`, a);
      if (a.assignmentLevel === "DOCUMENT_TYPE") m.set(`dt-${a.documentTypeId}`, a);
    });
    return m;
  }, [assignments]);

  async function handleSave() {
    if (!selectedUser || !isDirty) return;
    setSaving(true);
    const toAdd = [...currentKeysForLevel].filter((k) => !originalKeysForLevel.has(k));
    const toRemove = [...originalKeysForLevel].filter((k) => !currentKeysForLevel.has(k));

    let failures = 0;
    await Promise.all([
      ...toAdd.map((key) => {
        const id = Number(key.split("-")[1]);
        return createAssignment({ userId: selectedUser.id, ...keyToTarget(level, { id }) }).catch(() => {
          failures += 1;
        });
      }),
      ...toRemove.map((key) => {
        const a = assignmentByKey.get(key);
        if (!a) return Promise.resolve();
        return revokeAssignment(a.id).catch(() => {
          failures += 1;
        });
      }),
    ]);

    setSaving(false);
    if (failures) toast(`${failures} change(s) could not be saved`, "error");
    else toast("Assignments updated");
    await loadAssignments(selectedUser.id);
    setHistoryKey((k) => k + 1);
  }

  function handleReset() {
    setSelectedKeysByLevel((prev) => ({ ...prev, [level]: new Set(originalKeysForLevel) }));
  }

  async function handleRemoveBadge(assignment) {
    setRemovingId(assignment.id);
    try {
      await revokeAssignment(assignment.id);
      toast("Assignment removed");
      await loadAssignments(selectedUser.id);
      setHistoryKey((k) => k + 1);
    } catch (e) {
      toast(e.message || "Failed to remove assignment", "error");
    } finally {
      setRemovingId(null);
    }
  }

  // ── Overview counts ──
  const selectedCount = currentKeysForLevel.size;
  const counts = useMemo(() => {
    const c = { DEPARTMENT: 0, CATEGORY: 0, DOCUMENT_TYPE: 0 };
    assignments.forEach((a) => {
      if (c[a.assignmentLevel] !== undefined) c[a.assignmentLevel] += 1;
    });
    return c;
  }, [assignments]);

  const waiting = "Waiting for user selection";
  const sub = (n, one, many) =>
    !selectedUser ? waiting : n === 0 ? `No ${many} assigned` : `${n} ${n === 1 ? one : many} assigned`;

  return (
    <div className="ua-root">
      <style>{ANIM_CSS}</style>
      <Toast toasts={toasts} />
      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />

      {/* ── Header ── */}
      {showHeader && (
        <div className="ua-fade-up flex items-start justify-between gap-4 mb-5">
          <div>
            <nav className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400 mb-2.5">
              <Home className="w-4 h-4 text-blue-600" />
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span>Tenant</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span>Users</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span>Roles</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span className="font-semibold text-slate-800 dark:text-slate-100">User Assignment</span>
            </nav>
            <h1 className="text-[30px] leading-tight font-bold text-slate-900 dark:text-slate-50">User Assignment</h1>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">
              Grant a user access to specific departments, categories or document types.
            </p>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="ua-press flex-shrink-0 flex items-center gap-2 bg-white dark:bg-[#1A2433] border border-slate-200/70 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-blue-600 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <HelpCircle className="w-4 h-4" /> Help &amp; Guide
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] gap-5 items-start">
        {/* ═════════ LEFT ═════════ */}
        <Card className="ua-fade-up overflow-hidden" style={{ animationDelay: "60ms" }}>
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
            <SectionTitle
              icon={Building2}
              title="Access Configuration"
              subtitle="Select a user and choose the level at which you want to grant document access."
            />
          </div>

          <div className="p-6 space-y-6">
            {/* User */}
            <div>
              <FieldLabel>User</FieldLabel>
              <UserPicker users={users} selected={selectedUser} onSelect={setSelectedUser} loading={usersLoading} />
            </div>

            {/* Assignment level */}
            <div>
              <FieldLabel>Assignment Level</FieldLabel>
              <div role="radiogroup" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LEVELS.map((l) => {
                  const on = level === l.key;
                  return (
                    <button
                      key={l.key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setLevel(l.key)}
                      className={`ua-press relative text-left p-3.5 rounded-xl border flex gap-3 transition-all duration-300 ${
                        on
                          ? "border-blue-500 bg-blue-50/70 dark:bg-blue-900/20 shadow-[0_6px_18px_rgba(37,99,235,0.14)] ring-1 ring-blue-500/40"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:-translate-y-0.5 hover:shadow-sm"
                      }`}
                    >
                      <span className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${on ? "scale-105" : ""} ${l.tile}`}>
                        <l.Icon className="w-5 h-5" />
                      </span>
                      <span className="min-w-0 pr-5">
                        <span className={`block text-[13.5px] font-bold transition-colors duration-300 ${on ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-slate-100"}`}>
                          {l.label}
                        </span>
                        <span className="block text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{l.desc}</span>
                      </span>
                      <span
                        className={`absolute top-3 right-3 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
                          on ? "border-blue-600 bg-white dark:bg-transparent" : "border-slate-300 dark:border-slate-500"
                        }`}
                      >
                        {on && <span className="ua-pop w-2 h-2 rounded-full bg-blue-600" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Illustration / Hierarchy */}
            {!selectedUser ? (
              <div className="ua-fade-in pt-4 pb-6 text-center">
                <SelectUserIllustration />
                <h3 className="mt-2 text-[18px] font-bold text-slate-900 dark:text-slate-100">Select a user to manage their access</h3>
                <p className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Choose a user above to view and configure document permissions.
                </p>
              </div>
            ) : (
              <div key={`${selectedUser.id}-${level}`} className="ua-fade-up space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-[15.5px] font-bold text-slate-900 dark:text-slate-100">{levelMeta.label} Hierarchy</h3>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Select department(s), category(ies) or document type(s) from the structure below.
                    </p>
                  </div>
                  {selectedCount > 0 && (
                    <span key={selectedCount} className="ua-pop text-[13px] font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {selectedCount} selected
                    </span>
                  )}
                </div>

                <TreeSelect
                  key={`${selectedUser.id}-${level}`}
                  dataSource={dataSource}
                  selectedKeys={currentKeysForLevel}
                  onToggle={handleToggle}
                  onBulkToggle={handleBulkToggle}
                  searchPlaceholder="Search department, category or document type..."
                />

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    className="ua-press flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.3)] enabled:hover:shadow-[0_6px_16px_rgba(37,99,235,0.4)]"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Assignments
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={!isDirty || saving}
                    className="ua-press flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-600 disabled:opacity-40 text-[13px] font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <RotateCcw className="w-4 h-4" /> Discard Changes
                  </button>
                  {isDirty && <span className="ua-fade-in text-[12px] text-amber-500 font-semibold">Unsaved changes</span>}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ═════════ RIGHT ═════════ */}
        <div className="space-y-5 min-w-0">
          {/* Assigned access */}
          <Card className="ua-fade-up p-5 space-y-4" style={{ animationDelay: "120ms" }}>
            <SectionTitle icon={Shield} title="Assigned Access" subtitle="Current access scope for the selected user." />
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
              {!selectedUser ? (
                <div className="ua-fade-in flex flex-col items-center text-center px-6 py-8">
                  <div className="ua-float relative w-[72px] h-[72px] rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <FilePlus className="w-8 h-8 text-blue-500" strokeWidth={1.6} />
                    <span className="absolute -right-0.5 -bottom-0.5 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[18px] leading-none font-medium shadow-md ring-2 ring-white dark:ring-[#1A2433]">
                      +
                    </span>
                  </div>
                  <div className="text-[16px] font-bold text-slate-900 dark:text-slate-100">No user selected</div>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 max-w-[320px] leading-relaxed">
                    Please select a user from the left to view their assigned access, departments, categories and document types.
                  </p>
                </div>
              ) : (
                <div className="ua-fade-up p-4">
                  <AssignedAccessBadges
                    assignments={assignments}
                    loading={assignmentsLoading}
                    onRemove={handleRemoveBadge}
                    removingId={removingId}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Assignment overview */}
          <Card className="ua-fade-up p-5 space-y-4" style={{ animationDelay: "180ms" }}>
            <SectionTitle icon={PieChart} title="Assignment Overview" subtitle="Summary of permissions for the selected user." />
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/70 overflow-hidden">
              <OverviewRow
                Icon={Building2}
                tile="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                title="Departments"
                subtitle={sub(counts.DEPARTMENT, "department", "departments")}
                count={counts.DEPARTMENT}
                delay={240}
              />
              <OverviewRow
                Icon={Folder}
                tile="bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-300"
                title="Categories"
                subtitle={sub(counts.CATEGORY, "category", "categories")}
                count={counts.CATEGORY}
                delay={300}
              />
              <OverviewRow
                Icon={FileText}
                tile="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
                title="Document Types"
                subtitle={sub(counts.DOCUMENT_TYPE, "document type", "document types")}
                count={counts.DOCUMENT_TYPE}
                delay={360}
              />
              <OverviewRow
                Icon={Clock3}
                tile="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                title="Assignment History"
                subtitle={selectedUser ? (showHistory ? "Recent changes to this user's access" : "Click to view recent changes") : waiting}
                count={selectedUser ? "View" : 0}
                onClick={selectedUser ? () => setShowHistory((v) => !v) : undefined}
                expanded={showHistory}
                delay={420}
              />
            </div>

            {/* History panel — slides open */}
            {selectedUser && (
              <div
                className="grid transition-[grid-template-rows,opacity] duration-500 ease-out"
                style={{ gridTemplateRows: showHistory ? "1fr" : "0fr", opacity: showHistory ? 1 : 0 }}
              >
                <div className="overflow-hidden">
                  <AssignmentHistoryPanel
                    userId={selectedUser.id}
                    compact
                    showAll
                    refreshKey={historyKey}
                    resolveLabel={resolveLabel}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}