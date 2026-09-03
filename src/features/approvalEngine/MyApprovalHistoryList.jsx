// src/features/approvalEngine/MyApprovalHistoryList.jsx
import { useEffect, useState } from "react";
import { Eye, RefreshCw, Download } from "lucide-react";
import AppTable from "../../components/ui/Table";
import AppButton from "../../components/ui/Button";
import AppSearch from "../../components/ui/SearchInput";
import AppFilter from "../../components/ui/FilterDropdown";
import StatusBadge from "../../components/ui/StatusBadge";
import { ApprovalActionApi } from "./api";
import { ACTION_LABEL, formatDateTime } from "./constants";
import ApprovalDetailsDrawer from "./ApprovalDetailsDrawer";

const ACTION_OPTIONS = Object.entries(ACTION_LABEL).map(([value, label]) => ({ value, label }));

export default function MyApprovalHistoryList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = () => {
    setLoading(true);
    ApprovalActionApi.myActions()
      .then((res) => setRows(res.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = rows.filter((r) => {
    if (actionFilter && r.action !== actionFilter) return false;
    if (!search.trim()) return true;
    return String(r.documentId).includes(search) || (r.comments || "").toLowerCase().includes(search.toLowerCase());
  });

  function exportCsv() {
    const header = ["Document ID", "Action", "Level", "Old Status", "New Status", "Comments", "Date"];
    const lines = filtered.map((r) => [
      r.documentId, ACTION_LABEL[r.action] || r.action, r.levelNumber, r.oldStatus, r.newStatus,
      (r.comments || r.rejectReason || "").replace(/\n/g, " "), formatDateTime(r.createdAt),
    ]);
    const csv = [header, ...lines].map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "approval-history.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const columns = [
    { key: "documentId", header: "Document", render: (r) => `Document #${r.documentId}` },
    { key: "action", header: "Action", render: (r) => ACTION_LABEL[r.action] || r.action },
    { key: "level", header: "Level", render: (r) => r.levelNumber },
    { key: "status", header: "Result", render: (r) => <StatusBadge status={r.newStatus} /> },
    { key: "comments", header: "Remarks", render: (r) => <span className="text-xs">{r.comments || r.rejectReason || "—"}</span> },
    { key: "date", header: "Date", render: (r) => formatDateTime(r.createdAt) },
    { key: "actions", header: "", render: (r) => (
      <button onClick={() => setOpenId(r.documentApprovalId)} className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600">
        <Eye className="h-3.5 w-3.5" /> View
      </button>
    ) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <AppSearch value={search} onChange={setSearch} placeholder="Search by document ID or remark…" className="max-w-xs" />
          <AppFilter label="Action" options={ACTION_OPTIONS} value={actionFilter} onChange={setActionFilter} />
        </div>
        <div className="flex items-center gap-2">
          <AppButton variant="secondary" size="sm" icon={RefreshCw} onClick={load}>Refresh</AppButton>
          <AppButton variant="secondary" size="sm" icon={Download} onClick={exportCsv}>Export</AppButton>
        </div>
      </div>

      <AppTable
        columns={columns}
        rows={filtered}
        rowKey="id"
        loading={loading}
        emptyTitle="No approval actions yet"
        emptyDescription="Actions you take (approve, reject, send back…) will show up here."
      />

      <ApprovalDetailsDrawer documentApprovalId={openId} open={!!openId} onClose={() => setOpenId(null)} onChanged={load} />
    </div>
  );
}
