// src/Pages/TenantAdmin/UserAssignment/TreeSelect.jsx
//
// Generic, reusable expandable tree with checkbox multi-select, search and
// lazy loading. Has zero DMS-specific knowledge — it only understands the
// node shape produced by treeDataSource.js, so it can be reused anywhere
// else in the app a hierarchy picker is needed (kept in this module for
// now since it's the only current consumer).
//
// Props:
//   dataSource     — { getRoots(), getChildren(node), searchAll(query) }
//   selectedKeys    — Set<string> of currently-selected node keys (controlled)
//   onToggle(node)  — called when a selectable node's checkbox is clicked
//   onBulkToggle(nodes, checked) — called by "select all" / "clear" actions
//   searchPlaceholder
//   emptyLabel

import { useEffect, useMemo, useRef, useState } from "react";

function Spinner({ className = "" }) {
  return <span className={`inline-block w-3.5 h-3.5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin ${className}`} />;
}

function Checkbox({ checked, indeterminate, onChange, disabled }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={!!checked}
      disabled={disabled}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
    />
  );
}

const TYPE_DOT = {
  DEPARTMENT: "bg-indigo-500",
  CATEGORY: "bg-amber-500",
  DOCUMENT_TYPE: "bg-emerald-500",
};

function TreeNode({ node, depth, selectedKeys, onToggle, childrenCache, expandedKeys, loadingKeys, toggleExpand }) {
  const isExpanded = expandedKeys.has(node.key);
  const isLoading = loadingKeys.has(node.key);
  const children = childrenCache.get(node.key);
  const checked = selectedKeys.has(node.key);

  // Indeterminate: some (not all) currently-loaded selectable descendants are selected.
  const descendantState = useMemo(() => {
    if (!children || !children.length) return null;
    let total = 0;
    let sel = 0;
    const walk = (list) => {
      list.forEach((c) => {
        if (c.selectable) {
          total += 1;
          if (selectedKeys.has(c.key)) sel += 1;
        }
        const cc = childrenCache.get(c.key);
        if (cc) walk(cc);
      });
    };
    walk(children);
    if (total === 0) return null;
    return { total, sel };
  }, [children, childrenCache, selectedKeys]);

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 rounded-lg pr-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${checked ? "bg-blue-50/60 dark:bg-blue-900/10" : ""}`}
        style={{ paddingLeft: 10 + depth * 20 }}
      >
        {node.hasChildren ? (
          <button
            type="button"
            onClick={() => toggleExpand(node)}
            className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0"
          >
            {isLoading ? <Spinner /> : (
              <span className={`inline-block transition-transform text-[10px] ${isExpanded ? "rotate-90" : ""}`}>▶</span>
            )}
          </button>
        ) : (
          <span className="w-4 h-4 flex-shrink-0" />
        )}

        {node.selectable ? (
          <Checkbox checked={checked} onChange={() => onToggle(node)} />
        ) : (
          <span
            className={`w-3.5 h-3.5 flex items-center justify-center flex-shrink-0`}
            title={descendantState ? `${descendantState.sel}/${descendantState.total} selected` : undefined}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT[node.type] || "bg-slate-400"}`} />
          </span>
        )}

        <button
          type="button"
          onClick={() => (node.hasChildren ? toggleExpand(node) : node.selectable && onToggle(node))}
          className="flex-1 text-left text-[12.5px] text-slate-700 dark:text-slate-300 truncate"
        >
          {node.label}
        </button>

        {descendantState && !node.selectable && (
          <span className="text-[10px] font-semibold text-slate-400 flex-shrink-0">
            {descendantState.sel}/{descendantState.total}
          </span>
        )}
      </div>

      {isExpanded && children && (
        <div>
          {children.length === 0 ? (
            <div className="text-[11px] text-slate-400 italic" style={{ paddingLeft: 10 + (depth + 1) * 20 }}>
              No items
            </div>
          ) : (
            children.map((child) => (
              <TreeNode
                key={child.key}
                node={child}
                depth={depth + 1}
                selectedKeys={selectedKeys}
                onToggle={onToggle}
                childrenCache={childrenCache}
                expandedKeys={expandedKeys}
                loadingKeys={loadingKeys}
                toggleExpand={toggleExpand}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function TreeSelect({
  dataSource,
  selectedKeys,
  onToggle,
  onBulkToggle,
  searchPlaceholder = "Search…",
  emptyLabel = "Nothing to show",
  maxHeight = 360,
}) {
  const [roots, setRoots] = useState(null); // null = loading
  const [error, setError] = useState("");
  const [childrenCache, setChildrenCache] = useState(new Map());
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [loadingKeys, setLoadingKeys] = useState(new Set());

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [searchLoading, setSearchLoading] = useState(false);

  // Load roots whenever the data source changes (i.e. Assignment Level switched).
  useEffect(() => {
    let cancelled = false;
    setRoots(null);
    setChildrenCache(new Map());
    setExpandedKeys(new Set());
    setError("");
    dataSource
      .getRoots()
      .then((r) => !cancelled && setRoots(r))
      .catch((e) => !cancelled && setError(e.message || "Failed to load"));
    return () => {
      cancelled = true;
    };
  }, [dataSource]);

  // Debounce search input.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Search-mode fetch.
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    dataSource
      .searchAll(debouncedQuery)
      .then((results) => {
        if (cancelled) return;
        // Pre-populate the children cache from preloaded search results so
        // matching branches render already-expanded.
        setChildrenCache((prev) => {
          const next = new Map(prev);
          const walk = (nodes) => {
            nodes.forEach((n) => {
              if (n._preloadedChildren) {
                next.set(n.key, n._preloadedChildren);
                walk(n._preloadedChildren);
              }
            });
          };
          walk(results);
          return next;
        });
        setExpandedKeys((prev) => {
          const next = new Set(prev);
          const walk = (nodes) => {
            nodes.forEach((n) => {
              if (n._preloadedChildren) {
                next.add(n.key);
                walk(n._preloadedChildren);
              }
            });
          };
          walk(results);
          return next;
        });
        setSearchResults(results);
      })
      .catch((e) => !cancelled && setError(e.message || "Search failed"))
      .finally(() => !cancelled && setSearchLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, dataSource]);

  async function toggleExpand(node) {
    if (expandedKeys.has(node.key)) {
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        next.delete(node.key);
        return next;
      });
      return;
    }
    if (!childrenCache.has(node.key)) {
      setLoadingKeys((prev) => new Set(prev).add(node.key));
      try {
        const children = await dataSource.getChildren(node);
        setChildrenCache((prev) => new Map(prev).set(node.key, children));
      } catch (e) {
        setError(e.message || "Failed to load");
      } finally {
        setLoadingKeys((prev) => {
          const next = new Set(prev);
          next.delete(node.key);
          return next;
        });
      }
    }
    setExpandedKeys((prev) => new Set(prev).add(node.key));
  }

  // Gather every currently-loaded selectable node (used by "select all / clear").
  function collectLoadedSelectable(nodes) {
    const out = [];
    const walk = (list) => {
      list.forEach((n) => {
        if (n.selectable) out.push(n);
        const cc = childrenCache.get(n.key);
        if (cc) walk(cc);
      });
    };
    walk(nodes);
    return out;
  }

  const visibleTree = searchResults !== null ? searchResults : roots;
  const loadedSelectable = visibleTree ? collectLoadedSelectable(visibleTree) : [];
  const allLoadedSelected = loadedSelectable.length > 0 && loadedSelectable.every((n) => selectedKeys.has(n.key));

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#1A2433] overflow-hidden">
      {/* Search + bulk actions */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-[#16202E]">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[12px]">🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-7 pr-3 py-1.5 text-[12px] bg-white dark:bg-[#243044] border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={() => onBulkToggle?.(loadedSelectable, !allLoadedSelected)}
          disabled={!loadedSelectable.length}
          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 whitespace-nowrap"
        >
          {allLoadedSelected ? "Clear shown" : "Select shown"}
        </button>
      </div>

      {/* Tree body */}
      <div className="overflow-y-auto p-1.5" style={{ maxHeight }}>
        {error && (
          <div className="text-[12px] text-red-500 px-3 py-4">{error}</div>
        )}
        {!error && searchLoading && (
          <div className="flex items-center gap-2 text-[12px] text-slate-400 px-3 py-6 justify-center">
            <Spinner /> Searching…
          </div>
        )}
        {!error && !searchLoading && roots === null && (
          <div className="flex items-center gap-2 text-[12px] text-slate-400 px-3 py-6 justify-center">
            <Spinner /> Loading hierarchy…
          </div>
        )}
        {!error && !searchLoading && visibleTree && visibleTree.length === 0 && (
          <div className="text-[12px] text-slate-400 px-3 py-6 text-center">{emptyLabel}</div>
        )}
        {!error && !searchLoading && visibleTree && visibleTree.length > 0 && (
          <div>
            {visibleTree.map((node) => (
              <TreeNode
                key={node.key}
                node={node}
                depth={0}
                selectedKeys={selectedKeys}
                onToggle={onToggle}
                childrenCache={childrenCache}
                expandedKeys={expandedKeys}
                loadingKeys={loadingKeys}
                toggleExpand={toggleExpand}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
