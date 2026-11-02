// src/features/sapSync/components/ErpConnectionSelect.jsx
//
// PHASE 3 — Multi-ERP SAP Sync Selector
//
// Responsibilities:
//   - Show ERP selector only when multiple active SAP ERPs exist.
//   - Clearly indicate the tenant's default ERP.
//   - Keep existing single-ERP behavior unchanged.
//   - Allow the user to explicitly select another SAP ERP.
//   - Do NOT change the tenant-wide default from this selector.
//
// The actual "Set Default" operation is handled separately by the
// Tenant ERP Configuration UI using useSapErpConnections().
//

import AppSelect from "../../../components/ui/Select";

export default function ErpConnectionSelect({
  connections,
  value,
  onChange,
  className = "",
  label = "ERP Connection",
}) {
  /**
   * Existing behavior:
   * If there is only one SAP ERP, don't show a selector.
   */
  if (!connections || connections.length <= 1) {
    return null;
  }

  const selectedValue =
    value === undefined || value === null ? "" : String(value);

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
    >
      {/* Label */}
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </span>

      {/* ERP selector */}
      <AppSelect
        value={selectedValue}
        onChange={(event) => {
          const rawValue = event.target.value;

          onChange(
            rawValue
              ? Number(rawValue)
              : null
          );
        }}
        className="h-9 min-w-[220px] text-xs"
        aria-label="Select ERP connection"
      >
        {/* Empty state / explicit selection */}
        <option value="" disabled>
          Select ERP connection
        </option>

        {connections.map((connection) => {
          const erpConfigId = connection?.erpConfigId;

          const isDefault =
            connection?.isDefault === true;

          const name =
            connection?.name ||
            connection?.erpName ||
            `ERP #${erpConfigId}`;

          const erpType =
            connection?.erpType ||
            "SAP";

          return (
            <option
              key={erpConfigId}
              value={erpConfigId}
            >
              {name} ({erpType})
              {isDefault ? " — Default" : ""}
            </option>
          );
        })}
      </AppSelect>

      {/* Default indicator */}
      {/* {connections.some(
        (connection) =>
          Number(connection?.erpConfigId) ===
            Number(value) &&
          connection?.isDefault === true
      ) && (
        <span
          className="
            inline-flex
            h-7
            items-center
            rounded-full
            border
            border-emerald-200
            bg-emerald-50
            px-2.5
            text-[10px]
            font-semibold
            text-emerald-700
            dark:border-emerald-900/50
            dark:bg-emerald-950/30
            dark:text-emerald-400
          "
          title="This is the tenant's default SAP ERP"
        >
          ● Default
        </span>
      )} */}
    </div>
  );
}