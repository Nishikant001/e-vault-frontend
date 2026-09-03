// src/features/approvalEngine/PendingApprovalsList.jsx
import { useEffect, useState } from "react";
import { Eye, RefreshCw } from "lucide-react";
import AppTable from "../../components/ui/Table";
import AppButton from "../../components/ui/Button";
import AppSearch from "../../components/ui/SearchInput";
import StatusBadge from "../../components/ui/StatusBadge";
import { ApprovalActionApi } from "./api";
import { RUN_STATUS_LABEL, formatDateTime } from "./constants";
import ApprovalDetailsDrawer from "./ApprovalDetailsDrawer";

export default function PendingApprovalsList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = () => {
    setLoading(true);
    ApprovalActionApi.pending()
      .then((res) => setRows(res.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.Document?.fileName?.toLowerCase().includes(q) ||
      r.ApprovalWorkflow?.name?.toLowerCase().includes(q)
    );
  });

  const columns = [
    { key: "doc", header: "Document", render: (r) => (
      <div>
        <p className="font-medium text-[var(--text-primary)]">{r.Document?.fileName || `Document #${r.documentId}`}</p>
        <p className="text-xs text-[var(--text-tertiary)]">{r.ApprovalWorkflow?.name}</p>
      </div>
    ) },
    { key: "level", header: "Current Level", render: (r) => `${r.currentLevel} / ${r.totalLevels}` },
    { key: "submittedBy", header: "Submitted By", render: (r) => r.submitter?.name || r.submitter?.email || r.submittedBy },
    { key: "submittedAt", header: "Submitted Date", render: (r) => formatDateTime(r.submittedAt) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={RUN_STATUS_LABEL[r.status] || r.status} /> },
    { key: "actions", header: "", render: (r) => (
      <button onClick={() => setOpenId(r.id)} className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600">
        <Eye className="h-3.5 w-3.5" /> Review
      </button>
    ) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AppSearch value={search} onChange={setSearch} placeholder="Search pending approvals…" className="max-w-xs" />
        <AppButton variant="secondary" size="sm" icon={RefreshCw} onClick={load}>Refresh</AppButton>
      </div>

      <AppTable
        columns={columns}
        rows={filtered}
        loading={loading}
        onRowClick={(r) => setOpenId(r.id)}
        emptyTitle="All caught up!"
        emptyDescription="No documents are waiting on your approval right now."
      />

      <ApprovalDetailsDrawer
        documentApprovalId={openId}
        open={!!openId}
        onClose={() => setOpenId(null)}
        onChanged={load}
      />
    </div>
  );
}
