// src/Pages/TenantAdmin/DMSWorkflow/components/LockBadge.jsx
//
// Small reusable lock-state badge used in both the document table and the
// PreviewPanel "Document Lock Status" section. Follows the same inline-style
// pattern as StatusBadge/TCodePill in DMSPage.jsx.
import React from "react";
import { SAP_GREEN, SAP_AMBER } from "../constants";

export default function LockBadge({ isCheckedOut, lockedByLabel, compact = false }) {
  if (isCheckedOut) {
    return (
      <span
        title={lockedByLabel ? `Checked out by ${lockedByLabel}` : "Checked out"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: compact ? 11 : 12,
          fontWeight: 700,
          padding: compact ? "2px 8px" : "3px 10px",
          borderRadius: 20,
          background: "#fff7ed",
          color: SAP_AMBER,
          border: `1px solid #fed7aa`,
          whiteSpace: "nowrap",
        }}
      >
        🔒 Checked Out
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: compact ? 11 : 12,
        fontWeight: 700,
        padding: compact ? "2px 8px" : "3px 10px",
        borderRadius: 20,
        background: "#f0fdf4",
        color: SAP_GREEN,
        border: "1px solid #86efac",
        whiteSpace: "nowrap",
      }}
    >
      🟢 Available
    </span>
  );
}

// Small "👤 Locked By <name>" chip — shown next to LockBadge in the table
// "Locked By" column and in the PreviewPanel lock status block.
export function LockedByChip({ label }) {
  if (!label) return <span style={{ fontSize: 12, color: "#cbd5e1" }}>—</span>;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        fontWeight: 600,
        color: "#475569",
      }}
    >
      👤 {label}
    </span>
  );
}
