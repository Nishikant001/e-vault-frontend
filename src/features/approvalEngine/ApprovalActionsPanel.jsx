// src/features/approvalEngine/ApprovalActionsPanel.jsx
import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, Ban } from "lucide-react";
import AppButton from "../../components/ui/Button";
import AppInput from "../../components/ui/Input";
import { ApprovalActionApi } from "./api";
import { useToast } from "../../components/ui/Toast";

export default function ApprovalActionsPanel({ documentApprovalId, canAct, onDone }) {
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(null);

  async function run(action, requiresReason = false) {
    if (requiresReason && !comment.trim()) {
      toast({ title: "Reason required", description: "Please add a comment before continuing.", tone: "warning" });
      return;
    }
    setBusy(action);
    try {
      if (action === "approve") await ApprovalActionApi.approve(documentApprovalId, comment);
      if (action === "reject") await ApprovalActionApi.reject(documentApprovalId, comment);
      if (action === "sendBack") await ApprovalActionApi.sendBack(documentApprovalId, comment);
      if (action === "cancel") await ApprovalActionApi.cancel(documentApprovalId, comment);
      toast({ title: "Action recorded", tone: "success" });
      setComment("");
      onDone?.();
    } catch (e) {
      toast({ title: "Action failed", description: e.message, tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function postComment() {
    if (!comment.trim()) return;
    setBusy("comment");
    try {
      await ApprovalActionApi.addComment(documentApprovalId, comment);
      setComment("");
      toast({ title: "Comment added", tone: "success" });
      onDone?.();
    } catch (e) {
      toast({ title: "Could not add comment", description: e.message, tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <AppInput
        label="Comments"
        placeholder={canAct ? "Add a remark (required for reject / send back)…" : "Add a comment…"}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {!canAct && (
          <AppButton variant="secondary" size="sm" onClick={postComment} loading={busy === "comment"}>
            Add Comment
          </AppButton>
        )}
        {canAct && (
          <>
            <AppButton variant="primary" size="sm" icon={CheckCircle2} onClick={() => run("approve")} loading={busy === "approve"}>
              Approve
            </AppButton>
            <AppButton variant="danger" size="sm" icon={XCircle} onClick={() => run("reject", true)} loading={busy === "reject"}>
              Reject
            </AppButton>
            <AppButton variant="secondary" size="sm" icon={RotateCcw} onClick={() => run("sendBack", true)} loading={busy === "sendBack"}>
              Send Back
            </AppButton>
            <AppButton variant="ghost" size="sm" icon={Ban} onClick={() => run("cancel", true)} loading={busy === "cancel"}>
              Cancel
            </AppButton>
          </>
        )}
      </div>
    </div>
  );
}
