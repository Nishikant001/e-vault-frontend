// src/features/approvalEngine/ApprovalDetailsDrawer.jsx
import { useEffect, useState } from "react";
import { FileText, Loader2, Eye } from "lucide-react";
import AppDrawer from "../../components/ui/Drawer";
import StatusBadge from "../../components/ui/StatusBadge";
import Tabs from "../../components/ui/Tabs";
import { ApprovalActionApi, decodeToken } from "./api";
import { RUN_STATUS_LABEL, formatDateTime } from "./constants";
import ApprovalTimeline from "./ApprovalTimeline";
import ApprovalActionsPanel from "./ApprovalActionsPanel";
import { API_BASE_URL } from "../../services/apiClient";

const IN_PROGRESS = ["SUBMITTED", "PENDING_APPROVAL", "PARTIALLY_APPROVED"];

function userCanActOnCurrentLevel(user, data) {
  if (!data || !IN_PROGRESS.includes(data.status)) return false;
  const levels = data.ApprovalWorkflow?.levels || [];
  const level = levels.find((l) => l.levelNumber === data.currentLevel);
  if (!level) return false;
  if (String(user?.id) === String(data.Document?.uploadedBy) && !data.ApprovalWorkflow?.allowSelfApproval) return false;
  return (level.assignments || []).some((a) => {
    if (a.approverType === "USER") return String(a.approverUserId) === String(user?.id);
    return a.approverRole && a.approverRole === user?.role;
  });
}

export default function ApprovalDetailsDrawer({ documentApprovalId, open, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("timeline");

  const load = () => {
    if (!documentApprovalId) return;
    setLoading(true);
    ApprovalActionApi.getById(documentApprovalId)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  const [viewingDoc, setViewingDoc] = useState(false);
  const handleViewDocument = async () => {
    if (!data?.documentId) return;
    setViewingDoc(true);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const res = await fetch(`${API_BASE_URL}/documents/${data.documentId}/view`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load document (status ${res.status})`);
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("Empty response received from server");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      alert("Could not open document: " + err.message);
    } finally {
      setViewingDoc(false);
    }
  };

  useEffect(() => { if (open) load(); /* eslint-disable-next-line */ }, [open, documentApprovalId]);

  const user = decodeToken();
  const canAct = data ? userCanActOnCurrentLevel(user, data) : false;

  return (
    <AppDrawer open={open} onClose={onClose} title="Approval Details" subtitle={data?.Document?.fileName} width="lg">
      {loading || !data ? (
        <div className="flex items-center justify-center py-16 text-[var(--text-tertiary)]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3 rounded-app-lg border border-[var(--border-subtle)] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-app-md bg-brand-500/10 text-brand-500">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{data.Document?.fileName || `Document #${data.documentId}`}</p>
                <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                  Workflow: {data.ApprovalWorkflow?.name} · Submitted {formatDateTime(data.submittedAt)}
                </p>
              </div>
            </div>
            <StatusBadge status={RUN_STATUS_LABEL[data.status] || data.status} />
          </div>

          <button
            onClick={handleViewDocument}
            disabled={viewingDoc}
            className="flex w-full items-center justify-center gap-2 rounded-app-md border border-brand-500 bg-brand-500/5 px-4 py-2 text-sm font-semibold text-brand-500 hover:bg-brand-500/10 disabled:opacity-60"
          >
            {viewingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            View Document
          </button>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-app-md bg-[var(--surface-sunken)] p-3">
              <p className="text-lg font-bold text-[var(--text-primary)]">{data.currentLevel}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Current Level</p>
            </div>
            <div className="rounded-app-md bg-[var(--surface-sunken)] p-3">
              <p className="text-lg font-bold text-[var(--text-primary)]">{data.totalLevels}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Total Levels</p>
            </div>
            <div className="rounded-app-md bg-[var(--surface-sunken)] p-3">
              <p className="text-lg font-bold text-[var(--text-primary)]">{data.submitter?.name || data.submitter?.email || "—"}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Submitted By</p>
            </div>
          </div>

          <Tabs
            tabs={[
              { value: "timeline", label: "Timeline" },
              { value: "levels", label: "Workflow" },
              { value: "comments", label: `Comments (${data.comments?.length || 0})` },
            ]}
            value={tab}
            onChange={setTab}
          />

          {tab === "timeline" && (
            <ApprovalTimeline history={data.history || []} sapCompleted={data.status === "COMPLETED"} />
          )}

          {tab === "levels" && (
            <div className="space-y-2">
              {(data.ApprovalWorkflow?.levels || []).map((l) => (
                <div
                  key={l.id}
                  className={`flex items-center justify-between rounded-app-md border px-3 py-2 text-sm ${
                    l.levelNumber === data.currentLevel ? "border-brand-500 bg-brand-500/5" : "border-[var(--border-subtle)]"
                  }`}
                >
                  <span className="font-medium text-[var(--text-primary)]">{l.levelNumber}. {l.name}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {(l.assignments || []).map((a) => a.approverRole || a.approverUserId).filter(Boolean).join(", ") || "Unassigned"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === "comments" && (
            <div className="space-y-3">
              {(data.comments || []).length === 0 && <p className="text-sm text-[var(--text-tertiary)]">No comments yet.</p>}
              {(data.comments || []).map((c) => (
                <div key={c.id} className="rounded-app-md bg-[var(--surface-sunken)] p-3 text-xs">
                  <p className="font-medium text-[var(--text-primary)]">Level {c.levelNumber}</p>
                  <p className="mt-1 text-[var(--text-secondary)]">{c.comment}</p>
                  <p className="mt-1 text-[var(--text-tertiary)]">{formatDateTime(c.createdAt)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-[var(--border-subtle)] pt-4">
            <ApprovalActionsPanel documentApprovalId={data.id} canAct={canAct} onDone={() => { load(); onChanged?.(); }} />
          </div>
        </div>
      )}
    </AppDrawer>
  );
}