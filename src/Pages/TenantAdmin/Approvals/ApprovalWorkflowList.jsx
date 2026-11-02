// src/Pages/TenantAdmin/Approvals/ApprovalWorkflowList.jsx
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Pencil,
  Download,
  Home,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  HelpCircle,
  MoreVertical,
  Search,
  RotateCcw,
  Network,
  GitBranch,
  BarChart3,
  Building2,
  CheckCircle2,
  XCircle,
  X,
  Power,
  Eye,
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  FileText,
  Clock,
  History,
  User,
  ShieldCheck,
  SearchX,
} from "lucide-react";
import AppButton from "../../../components/ui/Button";
import StatusBadge from "../../../components/ui/StatusBadge";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import AppModal from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import { ApprovalWorkflowApi } from "../../../features/approvalEngine/api";
import { formatDateTime } from "../../../features/approvalEngine/constants";
import "../../../features/approvalEngine/approval-motion.css";
import WorkflowFormDrawer from "./WorkflowFormDrawer";

/* ────────────────────────── motion (scoped, prefixed `aw-`) ────────────────────────── */

const LOCAL_CSS = `
@keyframes aw-fade-down{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@keyframes aw-rise{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
@keyframes aw-row-in{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
@keyframes aw-panel-in{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
@keyframes aw-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes aw-pop{from{opacity:0;transform:scale(.94) translateY(-4px)}to{opacity:1;transform:none}}
@keyframes aw-bar{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@keyframes aw-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.aw-head{animation:aw-fade-down .45s cubic-bezier(.2,.8,.2,1) both}
.aw-rise{animation:aw-rise .5s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*70ms)}
.aw-row{animation:aw-row-in .4s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*45ms)}
.aw-panel{animation:aw-panel-in .42s cubic-bezier(.2,.8,.2,1) both}
.aw-fade{animation:aw-fade .3s ease-out both;animation-delay:calc(var(--i,0)*60ms)}
.aw-pop{animation:aw-pop .16s ease-out both;transform-origin:top right}
.aw-bar{animation:aw-bar .25s ease-out both}
.aw-skel{background:linear-gradient(90deg,var(--surface-sunken) 25%,rgba(148,163,184,.28) 50%,var(--surface-sunken) 75%);background-size:200% 100%;animation:aw-shimmer 1.4s linear infinite}
@media (prefers-reduced-motion:reduce){
  .aw-head,.aw-rise,.aw-row,.aw-panel,.aw-fade,.aw-pop,.aw-bar,.aw-skel{animation:none!important}
}
`;

/* ────────────────────────── helpers ────────────────────────── */

// Counts up when the value first arrives / changes. Respects reduced motion.
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || prev.current === target) {
      setValue(target);
      prev.current = target;
      return;
    }
    const from = prev.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

const creatorName = (w) =>
  w.creator?.name ||
  w.Creator?.name ||
  w.createdByUser?.name ||
  w.createdByName ||
  (w.createdBy != null ? String(w.createdBy) : "—");

const SORT_ACCESSORS = {
  name: (r) => r.name,
  department: (r) => r.Department?.name,
  category: (r) => r.Category?.name,
  levels: (r) => r.levels?.length || 0,
  status: (r) => r.status,
  createdAt: (r) => r.createdAt,
};

function levelApprovers(level) {
  return (level.assignments || [])
    .map((a) => a.approverRole || (a.approverUserId ? `User #${a.approverUserId}` : null))
    .filter(Boolean);
}

function pageList(total, cur) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, cur, cur - 1, cur + 1]);
  const arr = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  arr.forEach((n, i) => {
    if (i && n - arr[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

/* ────────────────────────── small building blocks ────────────────────────── */

const STAT_TONES = {
  brand: { tile: "bg-brand-500/10 text-brand-500", deco: "text-brand-500" },
  success: { tile: "bg-success-50 text-success-500 dark:bg-success-500/15", deco: "text-success-500" },
  danger: { tile: "bg-danger-50 text-danger-500 dark:bg-danger-500/15", deco: "text-danger-500" },
  violet: {
    tile: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    deco: "text-violet-500",
  },
};

function StatCard({ icon: Icon, deco: Deco, label, value, tone, index }) {
  const shown = useCountUp(value);
  const t = STAT_TONES[tone];
  return (
    <div
      className="aw-rise group relative flex items-center gap-3 overflow-hidden rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-app-sm"
      style={{ "--i": index }}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-app-md ${t.tile}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="relative z-10">
        <p className="text-[26px] font-bold leading-none tabular-nums text-[var(--text-primary)]">{shown}</p>
        <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">{label}</p>
      </div>
      <Deco
        aria-hidden
        className={`pointer-events-none absolute -right-1 bottom-0 h-16 w-16 opacity-[0.12] transition-all duration-500 group-hover:-translate-y-1 group-hover:scale-110 group-hover:opacity-20 ${t.deco}`}
      />
    </div>
  );
}

// Underline tabs with a sliding indicator
function UnderlineTabs({ tabs, value, onChange, compact = false, className = "" }) {
  const refs = useRef({});
  const [bar, setBar] = useState({ left: 0, width: 0, ready: false });
  const labelKey = tabs.map((t) => `${t.label}${t.count ?? ""}`).join("|");

  const measure = useCallback(() => {
    const el = refs.current[value];
    if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  }, [value]);

  useLayoutEffect(measure, [measure, labelKey]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <div role="tablist" className={`relative flex items-center ${className}`}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            ref={(el) => (refs.current[t.value] = el)}
            onClick={() => onChange(t.value)}
            className={`relative inline-flex items-center gap-2 whitespace-nowrap px-3 font-medium outline-none transition-colors duration-200 focus-visible:text-brand-500 ${
              compact ? "py-2.5 text-xs" : "py-3 text-[13px]"
            } ${active ? "text-brand-500" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {t.label}
            {t.count != null && (
              <span className={`text-[11px] ${active ? "text-brand-500" : "text-[var(--text-tertiary)]"}`}>
                ({t.count})
              </span>
            )}
          </button>
        );
      })}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-0.5 rounded-full bg-brand-500"
        style={{
          width: bar.width,
          transform: `translateX(${bar.left}px)`,
          transition: bar.ready
            ? "transform .32s cubic-bezier(.4,0,.2,1), width .32s cubic-bezier(.4,0,.2,1)"
            : "none",
        }}
      />
    </div>
  );
}

function GroupChip({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`am-press inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
        active
          ? "border-brand-500 bg-brand-500/10 text-brand-500"
          : "border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-brand-300"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums transition-colors ${
          active ? "bg-brand-500 text-white" : "bg-[var(--surface-sunken)] text-[var(--text-tertiary)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function SelectBox({ label, value, onChange, children, className = "", compact = false }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-[11px] font-medium text-[var(--text-tertiary)]">{label}</span>}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className={`w-full cursor-pointer appearance-none rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-card)] pl-3 pr-9 text-[13px] text-[var(--text-primary)] outline-none transition duration-200 hover:border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${
            compact ? "h-9" : "h-10"
          }`}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
      </div>
    </label>
  );
}

function PageButton({ children, active, disabled, onClick, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`am-press flex h-9 min-w-[36px] items-center justify-center rounded-app-md border px-2 text-[13px] font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-brand-500 bg-brand-500 text-white shadow-app-sm"
          : "border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-brand-300 hover:text-brand-500"
      }`}
    >
      {children}
    </button>
  );
}

function SortIcon({ active, dir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3 text-brand-500" /> : <ArrowDown className="h-3 w-3 text-brand-500" />;
}

/* ────────────────────────── row action menu (portal) ────────────────────────── */

function RowMenu({ workflow, onView, onEdit, onDeactivate }) {
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const open = !!pos;

  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function toggle(e) {
    e.stopPropagation();
    if (open) return setPos(null);
    const r = btnRef.current.getBoundingClientRect();
    const up = r.bottom + 160 > window.innerHeight;
    setPos({
      right: window.innerWidth - r.right,
      ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    });
  }

  const item =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Row actions"
        className={`am-press rounded-app-sm p-1.5 transition-colors ${
          open
            ? "bg-brand-500/10 text-brand-500"
            : "text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]"
        }`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", ...pos }}
            className="aw-pop z-[1000] w-44 overflow-hidden rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-card)] py-1 shadow-xl"
          >
            <button
              role="menuitem"
              className={`${item} text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]`}
              onClick={() => (setPos(null), onView())}
            >
              <Eye className="h-3.5 w-3.5" /> View details
            </button>
            <button
              role="menuitem"
              className={`${item} text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]`}
              onClick={() => (setPos(null), onEdit())}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit workflow
            </button>
            <div className="my-1 border-t border-[var(--border-subtle)]" />
            <button
              role="menuitem"
              disabled={workflow.status !== "ACTIVE"}
              className={`${item} text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/15`}
              onClick={() => (setPos(null), onDeactivate())}
            >
              <Power className="h-3.5 w-3.5" /> Deactivate
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

/* ────────────────────────── details panel ────────────────────────── */

function DetailRow({ icon: Icon, label, children, index = 0 }) {
  const empty = children === undefined || children === null || children === "";
  return (
    <div className="aw-fade flex items-center justify-between gap-4 py-2.5 text-[12.5px]" style={{ "--i": index }}>
      <span className="flex shrink-0 items-center gap-2.5 text-[var(--text-tertiary)]">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
      <span className="min-w-0 break-words text-right font-medium text-[var(--text-primary)]">
        {empty ? "—" : children}
      </span>
    </div>
  );
}

function TimelineItem({ icon: Icon, title, meta, last, index }) {
  return (
    <li className="aw-fade relative flex gap-3 pb-4" style={{ "--i": index }}>
      {!last && <span className="absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px bg-[var(--border-subtle)]" />}
      <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="mt-0.5 break-words text-xs text-[var(--text-tertiary)]">{meta}</p>
      </div>
    </li>
  );
}

function DetailsPanel({ workflow, onClose, onEdit, onDeactivate }) {
  const [tab, setTab] = useState("details");
  const levels = (workflow.levels || []).slice().sort((a, b) => a.levelNumber - b.levelNumber);
  const path = [workflow.Department?.name, workflow.Category?.name, workflow.DocumentType?.name]
    .filter(Boolean)
    .join(" • ");

  useEffect(() => setTab("details"), [workflow.id]);

  return (
    <aside className="aw-panel flex flex-col rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] xl:sticky xl:top-4 xl:self-start">
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Workflow Details</h3>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          aria-label="Close details"
          className="am-press rounded-app-sm p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div key={workflow.id} className="aw-fade px-5 pt-2">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-app-md bg-brand-500/10 text-brand-500">
            <Network className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <StatusBadge status={workflow.status} />
            <p className="mt-1 break-words text-sm font-semibold text-[var(--text-primary)]">{workflow.name}</p>
            <p className="mt-0.5 break-words text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">
              {path || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 border-b border-[var(--border-subtle)] px-3">
        <UnderlineTabs
          compact
          tabs={[
            { value: "details", label: "Details" },
            { value: "levels", label: "Approval Levels" },
            { value: "conditions", label: "Conditions" },
            { value: "audit", label: "Audit Log" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div key={`${workflow.id}-${tab}`} className="min-h-[300px] px-5 py-3">
        {tab === "details" && (
          <div className="divide-y divide-[var(--border-subtle)]">
            <DetailRow index={0} icon={Network} label="Workflow Name">{workflow.name}</DetailRow>
            <DetailRow index={1} icon={Building2} label="Department">{workflow.Department?.name}</DetailRow>
            <DetailRow index={2} icon={LayoutGrid} label="Category">{workflow.Category?.name}</DetailRow>
            <DetailRow index={3} icon={FileText} label="Document Type">{workflow.DocumentType?.name}</DetailRow>
            <DetailRow index={4} icon={GitBranch} label="Approval Levels">{levels.length}</DetailRow>
            <DetailRow index={5} icon={CheckCircle2} label="Status">
              <StatusBadge status={workflow.status} />
            </DetailRow>
            <DetailRow index={6} icon={Clock} label="Created On">{formatDateTime(workflow.createdAt)}</DetailRow>
            <DetailRow index={7} icon={User} label="Created By">{creatorName(workflow)}</DetailRow>
            <DetailRow index={8} icon={History} label="Last Updated">{formatDateTime(workflow.updatedAt)}</DetailRow>
          </div>
        )}

        {tab === "levels" && (
          <ol className="pt-1">
            {levels.length === 0 && (
              <p className="py-10 text-center text-xs text-[var(--text-tertiary)]">No levels configured.</p>
            )}
            {levels.map((l, i) => {
              const approvers = levelApprovers(l);
              return (
                <li key={l.id} className="aw-fade relative flex gap-3 pb-4" style={{ "--i": i }}>
                  {i < levels.length - 1 && (
                    <span className="absolute left-[13px] top-8 h-[calc(100%-1.75rem)] w-px bg-[var(--border-subtle)]" />
                  )}
                  <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                    {l.levelNumber}
                  </span>
                  <div className="min-w-0 flex-1 rounded-app-md border border-[var(--border-subtle)] p-3 transition-colors duration-200 hover:border-brand-300">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {l.name || `Level ${l.levelNumber}`}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {approvers.length ? (
                        approvers.map((a) => (
                          <span
                            key={a}
                            className="rounded-full bg-[var(--surface-sunken)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]"
                          >
                            {a}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[var(--text-tertiary)]">No approver assigned</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {tab === "conditions" && (
          <div className="divide-y divide-[var(--border-subtle)]">
            <DetailRow index={0} icon={ShieldCheck} label="Self approval">
              {workflow.allowSelfApproval ? "Allowed" : "Not allowed"}
            </DetailRow>
            <DetailRow index={1} icon={GitBranch} label="Approval order">Every level, in sequence</DetailRow>
            <DetailRow index={2} icon={Network} label="Applies to">{path}</DetailRow>
            <DetailRow index={3} icon={Power} label="If deactivated">In-progress documents finish first</DetailRow>
          </div>
        )}

        {tab === "audit" && (
          <ol className="pt-2">
            <TimelineItem
              index={0}
              icon={History}
              title="Workflow updated"
              meta={formatDateTime(workflow.updatedAt)}
            />
            <TimelineItem
              index={1}
              icon={Plus}
              title="Workflow created"
              meta={`${formatDateTime(workflow.createdAt)} · ${creatorName(workflow)}`}
              last
            />
          </ol>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-[var(--border-subtle)] p-5">
        <button
          type="button"
          onClick={onEdit}
          className="am-press inline-flex h-10 items-center justify-center gap-2 rounded-app-md border border-brand-500 text-[13px] font-semibold text-brand-500 transition-colors duration-200 hover:bg-brand-500/10"
        >
          <Pencil className="h-4 w-4" /> Edit Workflow
        </button>
        <button
          type="button"
          onClick={onDeactivate}
          disabled={workflow.status !== "ACTIVE"}
          className="am-press inline-flex h-10 items-center justify-center gap-2 rounded-app-md border border-danger-500/30 bg-danger-50 text-[13px] font-semibold text-danger-500 transition-colors duration-200 hover:bg-danger-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-danger-50 disabled:hover:text-danger-500 dark:bg-danger-500/15"
        >
          <Power className="h-4 w-4" /> Deactivate
        </button>
      </div>
    </aside>
  );
}

/* ────────────────────────── guide modal ────────────────────────── */

function GuideModal({ open, onClose }) {
  const steps = [
    {
      title: "Create a Workflow",
      desc: "Click New Workflow to require sign-off for a Department → Category → Document Type combination before it reaches ERP.",
    },
    {
      title: "Add Approval Levels",
      desc: "In the drawer, define one or more approval levels — each document must pass every level in order before it's saved to ERP.",
    },
    {
      title: "Review, edit or deactivate",
      desc: "Click a row to see its details on the right. Use Edit Workflow to change it, or Deactivate — in-progress documents still finish under the old rule.",
    },
    {
      title: "Filter & search",
      desc: "Use the search box, the Department and Status filters, or the By Department / By Status tabs to find a workflow quickly.",
    },
    {
      title: "Export",
      desc: "Tick one or more rows and use Export selected to download them as a CSV file.",
    },
  ];
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Approval Configuration — Guide"
      footer={
        <AppButton variant="primary" onClick={onClose}>
          Got it
        </AppButton>
      }
    >
      <div className="space-y-4 rounded-app-lg border border-[var(--border-subtle)] bg-slate-50 p-5 dark:bg-slate-900/40">
        {steps.map((s, i) => (
          <div key={s.title} className="aw-fade flex gap-3" style={{ "--i": i }}>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-[11px] font-bold text-brand-500">
              {i + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{s.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-tertiary)]">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </AppModal>
  );
}

/* ────────────────────────── page ────────────────────────── */

export default function ApprovalWorkflowList() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [deptFilter, setDeptFilter] = useState(null);
  const [viewTab, setViewTab] = useState("all"); // all | department | status
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState(null); // row shown in details panel
  const [checked, setChecked] = useState(() => new Set()); // checkbox selection

  const [drawer, setDrawer] = useState({ open: false, workflowId: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const autoSelected = useRef(false);
  const headCheckRef = useRef(null);

  const load = () => {
    setLoading(true);
    ApprovalWorkflowApi.list()
      .then((res) => {
        const data = res.data || [];
        setRows(data);
        // Open the details panel on the first workflow, like the design
        if (!autoSelected.current) {
          autoSelected.current = true;
          setSelectedId(data[0]?.id ?? null);
        }
      })
      .catch((e) =>
        toast({ title: "Could not load workflows", description: e.message, tone: "error" }),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line

  useEffect(() => setPage(1), [search, statusFilter, deptFilter, pageSize]);

  /* ── derived data ── */
  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "ACTIVE").length;
    const depts = new Set(rows.map((r) => r.Department?.name).filter(Boolean));
    return { total: rows.length, active, inactive: rows.length - active, departments: depts.size };
  }, [rows]);

  const deptCounts = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const n = r.Department?.name;
      if (n) map.set(n, (map.get(n) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    if (statusFilter) out = out.filter((r) => r.status === statusFilter);
    if (deptFilter) out = out.filter((r) => r.Department?.name === deptFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.Department?.name?.toLowerCase().includes(q) ||
          r.Category?.name?.toLowerCase().includes(q) ||
          r.DocumentType?.name?.toLowerCase().includes(q),
      );
    }
    const get = SORT_ACCESSORS[sortKey] || SORT_ACCESSORS.createdAt;
    return [...out].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, search, statusFilter, deptFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);
  const selected = rows.find((r) => r.id === selectedId) || null;
  const hasFilters = !!(search || statusFilter || deptFilter);

  const pageIds = pageRows.map((r) => r.id);
  const checkedOnPage = pageIds.filter((id) => checked.has(id)).length;
  const allOnPage = pageIds.length > 0 && checkedOnPage === pageIds.length;

  useEffect(() => {
    if (headCheckRef.current) {
      headCheckRef.current.indeterminate = checkedOnPage > 0 && !allOnPage;
    }
  }, [checkedOnPage, allOnPage]);

  function clearFilters() {
    setSearch("");
    setStatusFilter(null);
    setDeptFilter(null);
  }

  function handleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleAllOnPage() {
    setChecked((prev) => {
      const next = new Set(prev);
      if (allOnPage) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleOne(id) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exportCsv(list) {
    const header = [
      "Workflow Name", "Department", "Category", "Document Type", "Levels",
      "Status", "Created By", "Created Date", "Updated Date",
    ];
    const lines = list.map((r) => [
      r.name, r.Department?.name, r.Category?.name, r.DocumentType?.name,
      r.levels?.length || 0, r.status, creatorName(r),
      formatDateTime(r.createdAt), formatDateTime(r.updatedAt),
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "approval-workflows.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ApprovalWorkflowApi.remove(deleteTarget.id);
      toast({ title: "Workflow deactivated", tone: "success" });
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast({ title: "Could not deactivate workflow", description: e.message, tone: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: "name", label: "Workflow Name", sortable: true, width: "25%" },
    { key: "department", label: "Department", sortable: true, width: "14%" },
    { key: "category", label: "Category", sortable: true, width: "14%" },
    { key: "documentType", label: "Document Type", width: "17%" },
    { key: "levels", label: "Levels", sortable: true, width: "8%" },
    { key: "status", label: "Status", sortable: true, width: "13%" },
  ];

  const cell = (v) => (
    <span title={v || "—"} className="block overflow-hidden text-ellipsis whitespace-nowrap">
      {v || "—"}
    </span>
  );

  const pages = pageList(totalPages, safePage);

  return (
    <div className="space-y-4">
      <style>{LOCAL_CSS}</style>

      {/* ── Header ── */}
      <div className="aw-head flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <Home className="h-3.5 w-3.5 text-brand-500" />
            <ChevronRight className="h-3 w-3" />
            <span>Document Config</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-[var(--text-primary)]">Approval Configuration</span>
          </nav>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Approval Configuration</h1>
            <span className="flex h-7 w-7 items-center justify-center rounded-app-sm bg-brand-500/10 text-brand-500">
              <Network className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
            Configure which Department → Category → Document Type combinations require approval before ERP upload.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="am-press inline-flex h-10 items-center gap-2 rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 text-[13px] font-medium text-[var(--text-primary)] transition-colors duration-200 hover:border-brand-300 hover:text-brand-500"
        >
          <HelpCircle className="h-4 w-4 text-brand-500" />
          Help &amp; Guide
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard index={0} icon={Network} deco={Building2} label="Total Workflows" value={stats.total} tone="brand" />
        <StatCard index={1} icon={CheckCircle2} deco={BarChart3} label="Active Workflows" value={stats.active} tone="success" />
        <StatCard index={2} icon={XCircle} deco={Building2} label="Inactive Workflows" value={stats.inactive} tone="danger" />
        <StatCard index={3} icon={FileText} deco={Building2} label="Departments Covered" value={stats.departments} tone="violet" />
      </div>

      {/* ── List + details panel ── */}
      <div
        className={`grid gap-4 transition-[grid-template-columns,gap] duration-300 ease-out ${
          selected ? "xl:grid-cols-[minmax(0,1fr)_350px]" : "xl:grid-cols-[minmax(0,1fr)_0px] xl:gap-0"
        }`}
      >
        <section className="aw-rise min-w-0 rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4" style={{ "--i": 4 }}>
          {/* tabs + new workflow */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)]">
            <UnderlineTabs
              tabs={[
                { value: "all", label: "All Workflows", count: stats.total, icon: Network },
                { value: "department", label: "By Department", icon: Building2 },
                { value: "status", label: "By Status", icon: Activity },
              ]}
              value={viewTab}
              onChange={setViewTab}
            />
            <AppButton
              icon={Plus}
              className="mb-2"
              onClick={() => setDrawer({ open: true, workflowId: null })}
            >
              New Workflow
            </AppButton>
          </div>

          {/* quick-group chips — expand smoothly on grouped tabs */}
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
              viewTab === "all" ? "grid-rows-[0fr] opacity-0" : "mb-3 grid-rows-[1fr] opacity-100"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div key={viewTab} className="aw-fade flex flex-wrap gap-2 pb-1">
                {viewTab === "department" &&
                  deptCounts.map(([name, count]) => (
                    <GroupChip
                      key={name}
                      label={name}
                      count={count}
                      active={deptFilter === name}
                      onClick={() => setDeptFilter((d) => (d === name ? null : name))}
                    />
                  ))}
                {viewTab === "status" && (
                  <>
                    <GroupChip
                      label="Active"
                      count={stats.active}
                      active={statusFilter === "ACTIVE"}
                      onClick={() => setStatusFilter((s) => (s === "ACTIVE" ? null : "ACTIVE"))}
                    />
                    <GroupChip
                      label="Inactive"
                      count={stats.inactive}
                      active={statusFilter === "INACTIVE"}
                      onClick={() => setStatusFilter((s) => (s === "INACTIVE" ? null : "INACTIVE"))}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* filters */}
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by workflow name, department, category..."
                className="h-10 w-full rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-card)] pl-9 pr-9 text-[13px] text-[var(--text-primary)] outline-none transition duration-200 placeholder:text-[var(--text-tertiary)] hover:border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="aw-fade absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <SelectBox
              label="Department"
              className="w-44"
              value={deptFilter ?? ""}
              onChange={(e) => setDeptFilter(e.target.value || null)}
            >
              <option value="">All Departments</option>
              {deptCounts.map(([name]) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </SelectBox>
            <SelectBox
              label="Status"
              className="w-36"
              value={statusFilter ?? ""}
              onChange={(e) => setStatusFilter(e.target.value || null)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </SelectBox>
            <button
              type="button"
              onClick={clearFilters}
              className="am-press group inline-flex h-10 items-center gap-2 rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 text-[13px] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-brand-300 hover:text-brand-500"
            >
              <RotateCcw className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180" />
              Clear
            </button>
          </div>

          {/* bulk bar */}
          {checked.size > 0 && (
            <div className="aw-bar mb-3 flex flex-wrap items-center justify-between gap-2 rounded-app-md border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-xs">
              <span className="font-medium text-brand-500">
                {checked.size} workflow{checked.size > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportCsv(rows.filter((r) => checked.has(r.id)))}
                  className="am-press inline-flex items-center gap-1.5 rounded-app-sm px-2 py-1 font-semibold text-brand-500 hover:bg-brand-500/10"
                >
                  <Download className="h-3.5 w-3.5" /> Export selected
                </button>
                <button
                  type="button"
                  onClick={() => setChecked(new Set())}
                  className="am-press rounded-app-sm px-2 py-1 font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"
                >
                  Clear selection
                </button>
              </div>
            </div>
          )}

          {/* table */}
          <div className="overflow-x-auto rounded-app-md border border-[var(--border-subtle)]">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
              <colgroup>
                <col style={{ width: 48 }} />
                {columns.map((c) => (
                  <col key={c.key} style={{ width: c.width }} />
                ))}
                <col style={{ width: 64 }} />
              </colgroup>
              <thead>
                <tr className="bg-[var(--surface-sunken)] text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                  <th className="px-3 py-3">
                    <input
                      ref={headCheckRef}
                      type="checkbox"
                      checked={allOnPage}
                      onChange={toggleAllOnPage}
                      aria-label="Select all on this page"
                      className="h-4 w-4 cursor-pointer rounded accent-brand-500"
                    />
                  </th>
                  {columns.map((c) => (
                    <th key={c.key} className="px-3 py-3">
                      {c.sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(c.key)}
                          className={`inline-flex items-center gap-1.5 uppercase tracking-wide transition-colors hover:text-[var(--text-primary)] ${
                            sortKey === c.key ? "text-brand-500" : ""
                          }`}
                        >
                          {c.label}
                          <SortIcon active={sortKey === c.key} dir={sortDir} />
                        </button>
                      ) : (
                        c.label
                      )}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>

              {loading ? (
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-[var(--border-subtle)]">
                      {Array.from({ length: columns.length + 2 }).map((__, j) => (
                        <td key={j} className="px-3 py-4">
                          <div className="aw-skel h-3 rounded" style={{ width: j === 0 ? 16 : `${55 + ((i + j) % 4) * 10}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ) : (
                // key → rows re-stagger on page / filter / sort change, not on each keystroke
                <tbody key={`${safePage}-${pageSize}-${statusFilter}-${deptFilter}-${viewTab}-${sortKey}-${sortDir}`}>
                  {pageRows.map((r, i) => {
                    const isSel = r.id === selectedId;
                    const isChecked = checked.has(r.id);
                    return (
                      <tr
                        key={r.id}
                        tabIndex={0}
                        onClick={() => setSelectedId((id) => (id === r.id ? null : r.id))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setSelectedId((id) => (id === r.id ? null : r.id));
                        }}
                        style={{ "--i": i }}
                        className={`aw-row cursor-pointer border-t border-[var(--border-subtle)] text-[12.5px] text-[var(--text-secondary)] outline-none transition-colors duration-200 focus-visible:bg-brand-500/5 ${
                          isSel ? "bg-brand-500/[0.06]" : isChecked ? "bg-brand-500/[0.03]" : "hover:bg-[var(--surface-sunken)]"
                        }`}
                      >
                        <td className="relative px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <span
                            aria-hidden
                            className={`absolute left-0 top-0 h-full w-[3px] origin-center bg-brand-500 transition-transform duration-300 ${
                              isSel ? "scale-y-100" : "scale-y-0"
                            }`}
                          />
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleOne(r.id)}
                            aria-label={`Select ${r.name}`}
                            className="h-4 w-4 cursor-pointer rounded accent-brand-500"
                          />
                        </td>
                        <td className="px-3 py-3.5 font-medium text-[var(--text-primary)]">{cell(r.name)}</td>
                        <td className="px-3 py-3.5">{cell(r.Department?.name)}</td>
                        <td className="px-3 py-3.5">{cell(r.Category?.name)}</td>
                        <td className="px-3 py-3.5">{cell(r.DocumentType?.name)}</td>
                        <td className="px-3 py-3.5 font-medium tabular-nums">{r.levels?.length || 0}</td>
                        <td className="px-3 py-3.5">
                          <div className="whitespace-nowrap">
                            <StatusBadge status={r.status} />
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <RowMenu
                            workflow={r}
                            onView={() => setSelectedId(r.id)}
                            onEdit={() => setDrawer({ open: true, workflowId: r.id })}
                            onDeactivate={() => setDeleteTarget(r)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>

            {!loading && pageRows.length === 0 && (
              <div className="aw-fade flex flex-col items-center px-4 py-12 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--text-tertiary)]">
                  {hasFilters ? <SearchX className="h-5 w-5" /> : <Network className="h-5 w-5" />}
                </span>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {hasFilters ? "No workflows match your filters" : "No approval configurations yet"}
                </p>
                <p className="mt-1 max-w-sm text-xs text-[var(--text-tertiary)]">
                  {hasFilters
                    ? "Try a different search or clear the filters."
                    : "Create one to require sign-off before a document type reaches ERP."}
                </p>
                <div className="mt-4">
                  {hasFilters ? (
                    <AppButton variant="secondary" size="sm" icon={RotateCcw} onClick={clearFilters}>
                      Clear filters
                    </AppButton>
                  ) : (
                    <AppButton size="sm" icon={Plus} onClick={() => setDrawer({ open: true, workflowId: null })}>
                      New Workflow
                    </AppButton>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* footer: showing / pagination / rows per page */}
          <div className="mt-4 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <p className="text-xs text-[var(--text-tertiary)]">
              {filtered.length === 0
                ? "Showing 0 workflows"
                : `Showing ${startIdx + 1} to ${Math.min(startIdx + pageSize, filtered.length)} of ${filtered.length} workflows`}
            </p>

            <div className="flex items-center justify-center gap-1.5">
              <PageButton label="Previous page" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </PageButton>
              {pages.map((p) =>
                typeof p === "string" ? (
                  <span key={p} className="px-1 text-[var(--text-tertiary)]">…</span>
                ) : (
                  <PageButton key={p} active={p === safePage} onClick={() => setPage(p)}>
                    {p}
                  </PageButton>
                ),
              )}
              <PageButton label="Next page" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>
                <ChevronRight className="h-4 w-4" />
              </PageButton>
            </div>

            <div className="flex items-center justify-start gap-2 sm:justify-end">
              <span className="text-xs text-[var(--text-tertiary)]">Rows per page</span>
              <SelectBox
                compact
                className="w-[78px]"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </SelectBox>
            </div>
          </div>
        </section>

        {selected && (
          <DetailsPanel
            workflow={selected}
            onClose={() => setSelectedId(null)}
            onEdit={() => setDrawer({ open: true, workflowId: selected.id })}
            onDeactivate={() => setDeleteTarget(selected)}
          />
        )}
      </div>

      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />

      <WorkflowFormDrawer
        open={drawer.open}
        workflowId={drawer.workflowId}
        onClose={() => setDrawer({ open: false, workflowId: null })}
        onSaved={() => {
          setDrawer({ open: false, workflowId: null });
          load();
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Deactivate this workflow?"
        description={`"${deleteTarget?.name}" will stop applying to new documents. Documents currently in progress must finish first.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}