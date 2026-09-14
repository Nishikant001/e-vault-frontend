// src/components/subscription/UpgradeModal.jsx
//
// "Upgrade to unlock this feature" — opened when a FREE tenant clicks a
// locked nav item, or the trial banner's Upgrade button. No billing flow
// exists yet, so this is an interest-capture placeholder, per the brief.

import { Sparkles } from "lucide-react";
import { AppModal, AppButton } from "../ui";

export default function UpgradeModal({ open, onClose, feature }) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Upgrade to unlock this feature"
      size="sm"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose}>
            Maybe later
          </AppButton>
          <AppButton
            variant="primary"
            onClick={() => {
              window.location.href = "mailto:sales@docflow.example?subject=Upgrade%20my%20plan";
            }}
          >
            Contact sales
          </AppButton>
        </>
      }
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/15">
          <Sparkles className="h-5 w-5 text-brand-500" />
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          {feature ? `${feature.replaceAll("_", " ")} is` : "This feature is"} available on paid plans. Upgrade your
          trial to unlock SAP Synchronization, the AI Assistant, and every other premium capability.
        </p>
      </div>
    </AppModal>
  );
}
