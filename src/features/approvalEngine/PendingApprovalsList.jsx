// src/features/approvalEngine/PendingApprovalsList.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  MoreVertical,
  Eye,
  Copy,
  ArrowUp,
  ArrowDown,
  Minus,
  Download,
  X,
  Check,
  FileText,
} from "lucide-react";
import { ApprovalActionApi, ApprovalWorkflowApi, MasterDataApi } from "./api";
import { RUN_STATUS_LABEL, formatDateTime } from "./constants";
import ApprovalDetailsDrawer from "./ApprovalDetailsDrawer";
import { useToast } from "../../components/ui/Toast";
import "./approval-motion.css";

/* ════════════════════════════════════════════════════════════════
   DATA RESOLUTION
   The pending-list API usually returns only ids. We fill the gaps on
   the client from three sources (no backend change required):
     1. the row itself              (if the API already includes it)
     2. ApprovalWorkflow list       → Department / Category / Document type
     3. Users list                  → submitter name + email
     4. GET /approvals/:id          → Document (fileName, dmsCode…) per visible row
   ════════════════════════════════════════════════════════════════ */
const pick = (...vals) => vals.find((v) => v !== undefined && v !== null && v !== "") ?? null;

function resolve(r, ctx) {
  const detail = ctx.details[r.id];
  const doc = pick(r.Document, detail?.Document) || {};
  const wf =
    ctx.wfById[String(pick(r.approvalWorkflowId, r.workflowId, r.ApprovalWorkflow?.id, detail?.approvalWorkflowId))] ||
    r.ApprovalWorkflow ||
    {};
  const submitterId = pick(r.submittedBy, detail?.submittedBy);
  const submitter = pick(r.submitter, detail?.submitter, ctx.userById[String(submitterId)]) || {};

  const fileName = pick(doc.fileName, doc.name, doc.originalName, doc.title);
  return {
    fileName: fileName || `Document #${r.documentId}`,
    hasName: !!fileName,
    sub: pick(
      (doc.invoiceNo || doc.invoiceNumber) && `Invoice No: ${doc.invoiceNo || doc.invoiceNumber}`,
      wf.name,
      r.ApprovalWorkflow?.name,
    ),
    dmsCode: pick(doc.dmsCode, doc.dmsCODE, doc.dms_code, doc.dmsId, doc.documentCode, doc.code),
    department: pick(wf.Department?.name, doc.Department?.name, doc.department?.name),
    category: pick(wf.Category?.name, doc.Category?.name, doc.category?.name),
    type: pick(wf.DocumentType?.name, doc.DocumentType?.name, doc.documentType?.name),
    priority: pick(r.priority, doc.priority),
    submitterName: pick(submitter.name, submitter.fullName, submitter.email, submitterId != null && `User #${submitterId}`),
    submitterEmail: submitter.name ? submitter.email : null,
  };
}

/* ───────────── UI pieces ───────────── */

// Custom checkbox — immune to global <input> styles (that's what made them look black).
function Checkbox({ checked, onChange, label }) {
  return (
    <label className="relative inline-flex h-5 w-5 cursor-pointer items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="peer sr-only" />
      <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-slate-300 bg-white text-transparent transition-all duration-150 peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/40 dark:border-slate-600 dark:bg-slate-900">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    </label>
  );
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-cyan-100 text-cyan-700",
];

function Avatar({ name }) {
  const text = String(name || "?");
  const initials = text.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const color = AVATAR_COLORS[text.length % AVATAR_COLORS.length];
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${color}`}>{initials}</span>
  );
}

const EXT_STYLE = {
  pdf: "bg-red-500", doc: "bg-blue-600", docx: "bg-blue-600", xls: "bg-emerald-600",
  xlsx: "bg-emerald-600", png: "bg-violet-500", jpg: "bg-violet-500", jpeg: "bg-violet-500",
};

function FileBadge({ name, hasName }) {
  const ext = (String(name).split(".").pop() || "").toLowerCase();
  const style = hasName && EXT_STYLE[ext];
  if (!style) {
    return (
      <span className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
        <FileText className="h-5 w-5" strokeWidth={1.6} />
      </span>
    );
  }
  return (
    <span className={`flex h-10 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold uppercase text-white shadow-sm ${style}`}>
      {ext.slice(0, 4)}
    </span>
  );
}

const PRIORITY = {
  high: { icon: ArrowUp, cls: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300" },
  medium: { icon: ArrowUp, cls: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" },
  low: { icon: ArrowDown, cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" },
};

function PriorityBadge({ value }) {
  if (!value) return <Muted />;
  const key = String(value).toLowerCase();
  const p = PRIORITY[key];
  const Icon = p?.icon || Minus;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium capitalize ${p?.cls || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
      <Icon className="h-3 w-3" />
      {key}
    </span>
  );
}

const Muted = () => <span className="text-[var(--text-tertiary)] opacity-60">—</span>;

function Tag({ children }) {
  return children ? (
    <span className="inline-block max-w-[150px] truncate rounded-md bg-[var(--surface-sunken)] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]" title={children}>
      {children}
    </span>
  ) : (
    <Muted />
  );
}

function FilterSelect({ value, onChange, allLabel, options }) {
  return (
    <div className="relative min-w-[150px] flex-1 sm:flex-none">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] pl-3 pr-9 text-sm text-[var(--text-secondary)] outline-none transition-colors hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
    </div>
  );
}

// `fixed` positioning so the table's overflow never clips the menu.
function RowMenu({ onReview, onCopy }) {
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pos]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="More actions"
        onClick={(e) => {
          e.stopPropagation();
          const r = btnRef.current.getBoundingClientRect();
          setPos(pos ? null : { top: r.bottom + 4, right: window.innerWidth - r.right });
        }}
        className="am-press flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {pos && (
        <div
          className="am-pop fixed z-50 w-44 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-1 shadow-xl"
          style={{ top: pos.top, right: pos.right }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { setPos(null); onReview(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]">
            <Eye className="h-4 w-4" /> View details
          </button>
          <button onClick={() => { setPos(null); onCopy(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]">
            <Copy className="h-4 w-4" /> Copy document ID
          </button>
        </div>
      )}
    </>
  );
}

function SkeletonRows() {
  return Array.from({ length: 4 }).map((_, i) => (
    <tr key={i} className="border-t border-[var(--border-default)]">
      {Array.from({ length: 10 }).map((__, j) => (
        <td key={j} className="px-3 py-4">
          <div className="h-3.5 animate-pulse rounded bg-[var(--surface-sunken)]" style={{ width: `${45 + ((i + j) % 4) * 14}%` }} />
        </td>
      ))}
    </tr>
  ));
}

const TH = "whitespace-nowrap px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]";
const TD = "px-3 py-3.5 align-middle text-xs text-[var(--text-secondary)]";

/* ───────────── component ───────────── */

export default function PendingApprovalsList({ onChanged }) {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wfById, setWfById] = useState({});
  const [userById, setUserById] = useState({});
  const [details, setDetails] = useState({});
  const requested = useRef(new Set());

  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [cat, setCat] = useState("");
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openId, setOpenId] = useState(null);

  const load = () => {
    setLoading(true);
    requested.current = new Set();
    setDetails({});
    Promise.allSettled([
      ApprovalActionApi.pending(),
      ApprovalWorkflowApi.list(),
      MasterDataApi.users(),
    ]).then(([p, w, u]) => {
      const list = p.status === "fulfilled" ? p.value.data || [] : [];
      setRows(list);
      if (process.env.NODE_ENV !== "production") {
        // Dev aid: shows exactly which fields your API returns for a pending row.
        console.debug("[PendingApprovals] sample row →", list[0]);
      }
      if (w.status === "fulfilled") {
        setWfById(Object.fromEntries((w.value.data || []).map((x) => [String(x.id), x])));
      }
      if (u.status === "fulfilled") {
        const users = u.value.data || u.value.users || [];
        setUserById(Object.fromEntries(users.map((x) => [String(x.id), x])));
      }
      setLoading(false);
    });
  };

  useEffect(load, []); // eslint-disable-line
  useEffect(() => setPage(1), [search, dept, cat, type, priority, status, pageSize]);

  const ctx = useMemo(() => ({ wfById, userById, details }), [wfById, userById, details]);
  const view = useMemo(() => rows.map((r) => ({ r, f: resolve(r, ctx) })), [rows, ctx]);

  const opts = useMemo(() => {
    const uniq = (k) => [...new Set(view.map((v) => v.f[k]).filter(Boolean))].sort();
    return {
      dept: uniq("department"),
      cat: uniq("category"),
      type: uniq("type"),
      priority: uniq("priority").map(String),
      status: [...new Set(rows.map((r) => r.status))].filter(Boolean),
    };
  }, [view, rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return view.filter(({ r, f }) => {
      if (dept && f.department !== dept) return false;
      if (cat && f.category !== cat) return false;
      if (type && f.type !== type) return false;
      if (priority && String(f.priority) !== priority) return false;
      if (status && r.status !== status) return false;
      if (!q) return true;
      return [f.fileName, f.sub, f.dmsCode, f.submitterName, f.submitterEmail]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [view, search, dept, cat, type, priority, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Fetch per-row document details for the visible page only (cached, fire-and-forget).
  useEffect(() => {
    pageRows.forEach(({ r }) => {
      if (r.Document?.fileName || requested.current.has(r.id)) return;
      requested.current.add(r.id);
      ApprovalActionApi.getById(r.id)
        .then((res) => setDetails((d) => ({ ...d, [r.id]: res.data })))
        .catch(() => {});
    });
  }, [pageRows]); // eslint-disable-line

  const from = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, filtered.length);
  const hasFilters = !!(search || dept || cat || type || priority || status);
  const allOnPage = pageRows.length > 0 && pageRows.every(({ r }) => selected.has(r.id));

  const toggleOne = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      pageRows.forEach(({ r }) => (allOnPage ? n.delete(r.id) : n.add(r.id)));
      return n;
    });

  function clearAll() {
    setSearch(""); setDept(""); setCat(""); setType(""); setPriority(""); setStatus("");
    setSelected(new Set());
  }

  function exportSelected() {
    const header = ["Document", "DMS Code", "Department", "Category", "Type", "Submitted By", "Submitted On", "Priority", "Status"];
    const lines = view
      .filter(({ r }) => selected.has(r.id))
      .map(({ r, f }) => [f.fileName, f.dmsCode, f.department, f.category, f.type, f.submitterName,
        formatDateTime(r.submittedAt), f.priority, RUN_STATUS_LABEL[r.status] || r.status]);
    const csv = [header, ...lines].map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "pending-approvals.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  // NOTE: no `space-y-*` here. Collapsed sections used to leave a 16px gap each;
  // spacing now lives INSIDE each collapsible block so closed = zero height.
  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document, DMS code, submitter…"
            className="h-10 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-[var(--text-tertiary)] hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <FilterSelect value={dept} onChange={setDept} allLabel="All Departments" options={opts.dept} />
        <FilterSelect value={cat} onChange={setCat} allLabel="All Categories" options={opts.cat} />
        <FilterSelect value={type} onChange={setType} allLabel="All Document Types" options={opts.type} />
        <FilterSelect value={priority} onChange={setPriority} allLabel="All Priority" options={opts.priority} />

        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          className={`am-press inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold ${
            moreOpen || status
              ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
              : "border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]"
          }`}
        >
          <Filter className="h-4 w-4" /> Filters
        </button>
        <button
          type="button"
          onClick={() => { clearAll(); load(); }}
          className="am-press inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]"
        >
          <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Clear
        </button>
      </div>

      {/* Extra filters */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${moreOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 pb-4">
            <span className="text-xs font-medium text-[var(--text-tertiary)]">Status</span>
            <FilterSelect value={status} onChange={setStatus} allLabel="All Statuses" options={opts.status} />
          </div>
        </div>
      </div>

      {/* Selection bar */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${selected.size ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <span className="font-semibold tabular-nums">{selected.size} selected</span>
            <div className="flex items-center gap-2">
              <button onClick={exportSelected} className="am-press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/20">
                <Download className="h-3.5 w-3.5" /> Export selected
              </button>
              <button onClick={() => setSelected(new Set())} className="am-press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/20">
                <X className="h-3.5 w-3.5" /> Deselect
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        key={`${page}-${pageSize}-${dept}-${cat}-${type}-${priority}-${status}`}
        className="am-rows overflow-x-auto rounded-xl border border-[var(--border-default)]"
      >
        <table className="w-full min-w-[1040px] border-collapse">
          <thead className="bg-[var(--surface-sunken)]">
            <tr>
              <th className="w-12 px-3 py-3 text-left">
                <Checkbox checked={allOnPage} onChange={toggleAll} label="Select all" />
              </th>
              <th className={TH}>Document name</th>
              <th className={TH}>DMS-Code</th>
              <th className={TH}>Department</th>
              <th className={TH}>Category</th>
              <th className={TH}>Type</th>
              <th className={TH}>Submitted by</th>
              <th className={TH}>Submitted on</th>
              <th className={TH}>Priority</th>
              <th className={`${TH} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="bg-[var(--surface-card)]">
            {loading && <SkeletonRows />}
            {!loading && pageRows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-14 text-center">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {hasFilters ? "No approvals match these filters" : "All caught up!"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    {hasFilters ? "Try clearing a filter or searching for something else." : "No documents are waiting on your approval right now."}
                  </p>
                </td>
              </tr>
            )}
            {!loading &&
              pageRows.map(({ r, f }) => {
                const isSel = selected.has(r.id);
                const loadingDetail = !details[r.id] && !r.Document?.fileName && requested.current.has(r.id);
                return (
                  <tr
                    key={r.id}
                    onClick={() => setOpenId(r.id)}
                    className={`cursor-pointer border-t border-[var(--border-default)] transition-colors duration-150 ${
                      isSel ? "bg-blue-50/60 dark:bg-blue-500/5" : "hover:bg-[var(--surface-sunken)]"
                    }`}
                  >
                    <td className="px-3 py-3.5">
                      <Checkbox checked={isSel} onChange={() => toggleOne(r.id)} label="Select row" />
                    </td>
                    <td className={TD}>
                      <div className="flex min-w-0 items-center gap-3">
                        <FileBadge name={f.fileName} hasName={f.hasName} />
                        <div className="min-w-0">
                          <p className="max-w-[230px] truncate text-[13px] font-semibold text-[var(--text-primary)]" title={f.fileName}>
                            {f.fileName}
                          </p>
                          {f.sub ? (
                            <p className="max-w-[230px] truncate text-[11px] text-[var(--text-tertiary)]" title={f.sub}>{f.sub}</p>
                          ) : loadingDetail ? (
                            <span className="mt-1 block h-2.5 w-20 animate-pulse rounded bg-[var(--surface-sunken)]" />
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className={TD}>
                      {f.dmsCode ? (
                        <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">{f.dmsCode}</span>
                      ) : <Muted />}
                    </td>
                    <td className={TD}><Tag>{f.department}</Tag></td>
                    <td className={TD}><Tag>{f.category}</Tag></td>
                    <td className={TD}><Tag>{f.type}</Tag></td>
                    <td className={TD}>
                      {f.submitterName ? (
                        <div className="flex items-center gap-2.5">
                          <Avatar name={f.submitterName} />
                          <div className="min-w-0">
                            <p className="max-w-[150px] truncate text-[13px] font-semibold text-[var(--text-primary)]">{f.submitterName}</p>
                            {f.submitterEmail && (
                              <p className="max-w-[150px] truncate text-[11px] text-[var(--text-tertiary)]">{f.submitterEmail}</p>
                            )}
                          </div>
                        </div>
                      ) : <Muted />}
                    </td>
                    <td className={`${TD} whitespace-nowrap`}>
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </td>
                    <td className={TD}><PriorityBadge value={f.priority} /></td>
                    <td className={TD} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setOpenId(r.id)}
                          className="am-press inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700"
                        >
                          <Eye className="h-3.5 w-3.5" /> Review
                        </button>
                        <RowMenu
                          onReview={() => setOpenId(r.id)}
                          onCopy={() => {
                            navigator.clipboard?.writeText(String(r.documentId));
                            toast({ title: "Document ID copied", tone: "success" });
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-tertiary)]">
        <span>
          Showing <b className="text-[var(--text-secondary)]">{from}</b> to <b className="text-[var(--text-secondary)]">{to}</b> of{" "}
          <b className="text-[var(--text-secondary)]">{filtered.length}</b> items
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page" className="am-press flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <span key={p} className="flex items-center gap-1.5">
                  {i > 0 && p - arr[i - 1] > 1 && <span>…</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`am-press h-8 min-w-8 rounded-lg px-2 text-xs font-semibold ${
                      p === page ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30" : "border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page" className="am-press flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <label className="flex items-center gap-2">
            Rows per page
            <span className="relative">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-8 cursor-pointer appearance-none rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] pl-3 pr-7 text-xs text-[var(--text-secondary)] outline-none focus:border-blue-500"
              >
                {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
            </span>
          </label>
        </div>
      </div>

      <ApprovalDetailsDrawer
        documentApprovalId={openId}
        open={!!openId}
        onClose={() => setOpenId(null)}
        onChanged={() => { load(); onChanged?.(); }}
      />
    </div>
  );
}