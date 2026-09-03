import PendingApprovalsList from "../../features/approvalEngine/PendingApprovalsList";

// Real, API-backed approval queue for the Approver role — built on the
// same reusable engine used by Tenant Admin / Branch Manager / Dept Head.
export default function ApproverApprovals() {
  return (
    <div className="space-y-4">
      <PendingApprovalsList />
    </div>
  );
}
