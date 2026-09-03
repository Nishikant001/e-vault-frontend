import { useState } from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { SkeletonTableRows } from "./Skeleton";
import EmptyState from "./EmptyState";

/**
 * AppTable — the single table primitive for the app.
 *
 * columns: [{ key, header, render?(row), sortable?, width? }]
 * rows: array of data objects (must include an `id` field, or pass rowKey)
 * selectable: enables checkbox column + bulk-selection callbacks
 */
export default function AppTable({
  columns,
  rows,
  rowKey = "id",
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your filters or search terms.",
  selectable = false,
  selectedRows = [],
  onSelectRows,
  onRowClick,
  sortKey,
  sortDir = "asc",
  onSort,
  className = "",
}) {
  const [internalSelected, setInternalSelected] = useState([]);
  const selected = onSelectRows ? selectedRows : internalSelected;
  const setSelected = onSelectRows || setInternalSelected;

  const allSelected = rows.length > 0 && selected.length === rows.length;
  const toggleAll = () => setSelected(allSelected ? [] : rows.map((r) => r[rowKey]));
  const toggleRow = (id) =>
    setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className={`overflow-hidden rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-sunken)]">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 rounded accent-[var(--color-brand-500)]"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className="whitespace-nowrap px-4 py-3 font-medium text-[var(--text-secondary)]"
                >
                  {col.sortable ? (
                    <button
                      onClick={() => onSort?.(col.key)}
                      className="flex items-center gap-1 hover:text-[var(--text-primary)]"
                    >
                      {col.header}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows rows={5} cols={columns.length + (selectable ? 1 : 0)} />
            ) : (
              rows.map((row) => (
                <tr
                  key={row[rowKey]}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-[var(--border-subtle)] last:border-0 transition-colors
                    hover:bg-[var(--surface-card-hover)] ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.includes(row[rowKey])}
                        onChange={() => toggleRow(row[rowKey])}
                        aria-label={`Select row ${row[rowKey]}`}
                        className="h-4 w-4 rounded accent-[var(--color-brand-500)]"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-[var(--text-primary)]">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 && (
        <EmptyState title={emptyTitle} description={emptyDescription} className="border-0 rounded-none" />
      )}
    </div>
  );
}
