// src/Pages/TenantAdmin/Approvals/ApprovalWorkflowList.jsx
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Download, RefreshCw, GitBranch, Info } from "lucide-react";
import AppCard, { CardHeader } from "../../../components/ui/Card";
import AppTable from "../../../components/ui/Table";
import AppButton from "../../../components/ui/Button";
import AppSearch from "../../../components/ui/SearchInput";
import AppFilter from "../../../components/ui/FilterDropdown";
import Pagination from "../../../components/ui/Pagination";
import StatusBadge from "../../../components/ui/StatusBadge";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import AppModal from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import { ApprovalWorkflowApi } from "../../../features/approvalEngine/api";
import { formatDateTime } from "../../../features/approvalEngine/constants";
import WorkflowFormDrawer from "./WorkflowFormDrawer";

const PAGE_SIZE = 10;

function GuideModal({ open, onClose }) {
  const steps = [
    { title: "Create a Workflow", desc: "Click New Workflow to require sign-off for a Department → Category → Document Type combination before it reaches SAP." },
    { title: "Add Approval Levels", desc: "In the drawer, define one or more approval levels — each document must pass every level in order before it's saved to SAP." },
    { title: "Edit or Deactivate", desc: "Click a row (or the pencil icon) to edit a workflow. Use the trash icon to deactivate it — in-progress documents still finish under the old rule." },
    { title: "Filter & Search", desc: "Use the search box and Status filter to quickly find a workflow by name, department, category, or document type." },
    { title: "Export", desc: "Click Export to download the current filtered list as a CSV file." },
  ];
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Approval Workflows — Guide"
      footer={<AppButton variant="primary" onClick={onClose}>Got it</AppButton>}
    >
    <div className="space-y-4 rounded-app-lg border border-[var(--border-subtle)] bg-slate-50 p-5 dark:bg-slate-900/40">
        {steps.map((s, i) => (
          <div key={s.title} className="flex gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-[11px] font-bold text-brand-500">
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

export default function ApprovalWorkflowList() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const [drawer, setDrawer] = useState({ open: false, workflowId: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

  const load = () => {
    setLoading(true);
    ApprovalWorkflowApi.list()
      .then((res) => setRows(res.data || []))
      .catch((e) => toast({ title: "Could not load workflows", description: e.message, tone: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line

  const filtered = useMemo(() => {
    let out = rows;
    if (statusFilter) out = out.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.Department?.name?.toLowerCase().includes(q) ||
          r.Category?.name?.toLowerCase().includes(q) ||
          r.DocumentType?.name?.toLowerCase().includes(q)
      );
    }
    out = [...out].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [rows, search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function exportCsv() {
    const header = ["Workflow Name", "Department", "Category", "Document Type", "Levels", "Status", "Created By", "Created Date", "Updated Date"];
    const lines = filtered.map((r) => [
      r.name, r.Department?.name, r.Category?.name, r.DocumentType?.name, r.levels?.length || 0,
      r.status, r.createdBy, formatDateTime(r.createdAt), formatDateTime(r.updatedAt),
    ]);
    const csv = [header, ...lines].map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "approval-workflows.csv"; a.click();
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
      toast({ title: "Could not delete workflow", description: e.message, tone: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: "name", header: "Workflow Name", sortable: true, render: (r) => (
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-app-sm bg-brand-500/10 text-brand-500"><GitBranch className="h-3.5 w-3.5" /></div>
        <span className="font-medium text-[var(--text-primary)]">{r.name}</span>
      </div>
    ) },
    { key: "department", header: "Department", render: (r) => r.Department?.name || "—" },
    { key: "category", header: "Category", render: (r) => r.Category?.name || "—" },
    { key: "documentType", header: "Document Type", render: (r) => r.DocumentType?.name || "—" },
    { key: "levels", header: "Levels", render: (r) => r.levels?.length || 0 },
    { key: "status", header: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    { key: "createdBy", header: "Created By", render: (r) => r.createdBy ?? "—" },
    { key: "createdAt", header: "Created Date", sortable: true, render: (r) => formatDateTime(r.createdAt) },
    { key: "updatedAt", header: "Updated Date", sortable: true, render: (r) => formatDateTime(r.updatedAt) },
    { key: "actions", header: "", render: (r) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setDrawer({ open: true, workflowId: r.id })} className="rounded-app-sm p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] hover:text-brand-500" title="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setDeleteTarget(r)} className="rounded-app-sm p-1.5 text-[var(--text-tertiary)] hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-danger-500/15" title="Deactivate">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <AppCard>
                <CardHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              Approval Workflows
              <span className="group relative inline-flex">
                <button
                  onClick={() => setShowGuide(true)}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--border-subtle)] text-[var(--text-tertiary)] transition-colors hover:bg-brand-500 hover:text-white"
                >
                  <Info className="h-3 w-3" />
                </button>
                <span className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-56 rounded-lg bg-slate-800 px-3 py-2 text-[10.5px] leading-relaxed text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 dark:bg-slate-700">
                  Click to see a step-by-step guide on how to use this page.
                </span>
              </span>
            </span>
          }
          subtitle="Configure which Department → Category → Document Type combinations require approval before SAP upload."
          action={
            <AppButton icon={Plus} onClick={() => setDrawer({ open: true, workflowId: null })}>
              New Workflow
            </AppButton>
          }
        />
        <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <AppSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search workflows…" className="max-w-xs" />
            <AppFilter
              label="Status"
              options={[{ label: "Active", value: "ACTIVE" }, { label: "Inactive", value: "INACTIVE" }]}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2">
            <AppButton variant="secondary" size="sm" icon={RefreshCw} onClick={load}>Refresh</AppButton>
            <AppButton variant="secondary" size="sm" icon={Download} onClick={exportCsv}>Export</AppButton>
          </div>
        </div>

        <AppTable
          columns={columns}
          rows={pageRows}
          loading={loading}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={(r) => setDrawer({ open: true, workflowId: r.id })}
          emptyTitle="No approval workflows yet"
          emptyDescription="Create one to require sign-off before a document type reaches SAP."
        />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </AppCard>

      <WorkflowFormDrawer
        open={drawer.open}
        workflowId={drawer.workflowId}
        onClose={() => setDrawer({ open: false, workflowId: null })}
        onSaved={() => { setDrawer({ open: false, workflowId: null }); load(); }}
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
