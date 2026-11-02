// src/features/sapSync/components/ErpMultiSelect.jsx
//
// FLEXIBLE MULTI-SELECT SYNC
//
// Checkbox dropdown that lets the Tenant Admin tick ANY subset of the
// tenant's active SAP ERP connections (e.g. 2 out of 3) and then press
// "Sync Selected". Purely presentational: all state lives in
// useSapErpConnections() (selectedErpConfigIds / toggleErpSelection /
// selectAllErps / clearErpSelection) and is passed in as props.
//
// Renders nothing when there is only one SAP ERP — same threshold as
// ErpConnectionSelect, so single-ERP tenants see no change.

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function ErpMultiSelect({
  connections,
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
  disabled = false,
  className = "",
  label = "ERPs",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Close when clicking outside or pressing Escape.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!connections || connections.length <= 1) {
    return null;
  }

  const selected = new Set((selectedIds || []).map(Number));
  const total = connections.length;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 min-w-[200px] items-center justify-between gap-2 rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-raised,transparent)] px-3 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-brand-500/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="truncate">
          <span className="mr-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            {label}
          </span>
          {selected.size} of {total} selected
        </span>

        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 top-full z-[100] mt-1 w-72 overflow-hidden rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-base,#fff)] shadow-xl dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-[11px] font-semibold text-brand-600 hover:underline"
            >
              Select all
            </button>

            <button
              type="button"
              onClick={onClear}
              className="text-[11px] font-semibold text-[var(--text-tertiary)] hover:underline"
            >
              Clear
            </button>
          </div>

          <ul className="max-h-64 overflow-y-auto py-1">
            {connections.map((connection) => {
              const id = Number(connection.erpConfigId);
              const checked = selected.has(id);
              const name =
                connection.name || connection.erpName || `ERP #${id}`;

              return (
                <li key={id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => onToggle(id)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-[var(--surface-sunken)]"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-[var(--border-subtle)]"
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-[var(--text-primary)]">
                        {name}
                      </span>
                      <span className="block text-[10px] text-[var(--text-tertiary)]">
                        {connection.erpType || "SAP"}
                      </span>
                    </span>

                    {connection.isDefault === true && (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                        Default
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}