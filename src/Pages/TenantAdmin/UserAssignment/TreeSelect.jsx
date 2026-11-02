// src/Pages/TenantAdmin/UserAssignment/TreeSelect.jsx
//
// Generic expandable tree with checkbox multi-select, search and lazy loading.
// Same props as before:
//   dataSource, selectedKeys (Set), onToggle(node), onBulkToggle(nodes, checked),
//   searchPlaceholder, emptyLabel, maxHeight
//
// New look: folder icons, highlighted selected rows, "inherited" (covered)
// rows for levels below the selectable one, selected-count badges, animated
// expand / collapse.

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Check,
  ListChecks,
  Loader2,
} from "lucide-react";

const TYPE_TONE = {
  DEPARTMENT: "text-blue-600 dark:text-blue-400",
  CATEGORY: "text-orange-500 dark:text-orange-400",
  DOCUMENT_TYPE: "text-purple-500 dark:text-purple-400",
};

function CheckBox({ checked, inherited, onChange }) {
  const on = checked || inherited;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      disabled={!onChange}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.();
      }}
      className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
        checked
          ? "bg-blue-600 border-blue-600"
          : inherited
            ? "bg-blue-400/70 border-blue-400/70 cursor-default"
            : "bg-white dark:bg-[#232F40] border-slate-300 dark:border-slate-500 hover:border-blue-500"
      }`}
    >
      {on && <Check key="c" className="ua-pop w-3 h-3 text-white" strokeWidth={3.2} />}
    </button>
  );
}

function TreeNode({
  node,
  depth,
  inherited,
  selectedKeys,
  onToggle,
  childrenCache,
  expandedKeys,
  loadingKeys,
  toggleExpand,
}) {
  const isExpanded = expandedKeys.has(node.key);
  const isLoading = loadingKeys.has(node.key);
  const children = childrenCache.get(node.key);
  const checked = selectedKeys.has(node.key);
  const showInherited = inherited && !node.selectable;
  const active = checked || showInherited;

  // number of selected (selectable) descendants among already-loaded nodes
  const selCount = useMemo(() => {
    if (!children) return 0;
    let n = 0;
    const walk = (list) =>
      list.forEach((c) => {
        if (c.selectable && selectedKeys.has(c.key)) n += 1;
        const cc = childrenCache.get(c.key);
        if (cc) walk(cc);
      });
    walk(children);
    return n;
  }, [children, childrenCache, selectedKeys]);

  const Icon = node.type === "DOCUMENT_TYPE" ? FileText : Folder;

  const onRowClick = () =>
    node.hasChildren ? toggleExpand(node) : node.selectable && onToggle(node);

  return (
    <div>
      <div
        onClick={onRowClick}
        className={`group flex items-center gap-2.5 py-2.5 pr-3 rounded-xl cursor-pointer transition-colors duration-200 ${
          checked
            ? "bg-blue-50 dark:bg-blue-900/20"
            : showInherited
              ? "bg-blue-50/40 dark:bg-blue-900/10"
              : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
        }`}
        style={{ paddingLeft: 12 + depth * 28 }}
      >
        {depth === 0 &&
          (node.hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node);
              }}
              className="w-4 h-4 flex items-center justify-center text-slate-500 flex-shrink-0"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "" : "-rotate-90"}`}
              />
            </button>
          ) : (
            <span className="w-4 flex-shrink-0" />
          ))}

        {node.selectable ? (
          <CheckBox checked={checked} onChange={() => onToggle(node)} />
        ) : showInherited ? (
          <CheckBox inherited />
        ) : (
          <span className="w-[18px] flex-shrink-0" />
        )}

        <Icon
          className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200 ${
            active ? TYPE_TONE[node.type] : "text-slate-700 dark:text-slate-300"
          }`}
          fill="currentColor"
          fillOpacity={node.type === "DOCUMENT_TYPE" ? 0.1 : 0.15}
        />

        <span
          className={`flex-1 min-w-0 truncate text-[14px] font-semibold ${
            checked
              ? "text-blue-700 dark:text-blue-300"
              : "text-slate-800 dark:text-slate-200"
          }`}
        >
          {node.label}
        </span>

        {selCount > 0 && (
          <span className="ua-pop min-w-[22px] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[11px] font-bold flex-shrink-0">
            {selCount}
          </span>
        )}

        {node.hasChildren &&
          (isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />
          ) : (
            <ChevronRight
              className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-300 ${
                isExpanded ? "rotate-90" : "group-hover:translate-x-0.5"
              }`}
            />
          ))}
      </div>

      {isExpanded && children && (
        <div className="ua-fade-down">
          {children.length === 0 ? (
            <div
              className="text-[12px] text-slate-400 italic py-1.5"
              style={{ paddingLeft: 12 + (depth + 1) * 28 }}
            >
              No items
            </div>
          ) : (
            children.map((child) => (
              <TreeNode
                key={child.key}
                node={child}
                depth={depth + 1}
                inherited={inherited || checked}
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
  const [roots, setRoots] = useState(null);
  const [error, setError] = useState("");
  const [childrenCache, setChildrenCache] = useState(new Map());
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [loadingKeys, setLoadingKeys] = useState(new Set());

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load roots whenever the data source changes (Assignment Level switched).
  useEffect(() => {
    let cancelled = false;
    setRoots(null);
    setChildrenCache(new Map());
    setExpandedKeys(new Set());
    setError("");
    dataSource
      .getRoots()
      .then((r) => {
        if (cancelled) return;
        setRoots(r);
        // open the first root by default so the hierarchy is visible immediately
        if (r.length && r[0].hasChildren) {
          dataSource
            .getChildren(r[0])
            .then((ch) => {
              if (cancelled) return;
              setChildrenCache((prev) => new Map(prev).set(r[0].key, ch));
              setExpandedKeys((prev) => new Set(prev).add(r[0].key));
            })
            .catch(() => {});
        }
      })
      .catch((e) => !cancelled && setError(e.message || "Failed to load"));
    return () => {
      cancelled = true;
    };
  }, [dataSource]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

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
        const walkAll = (fn) => {
          const walk = (nodes) =>
            nodes.forEach((n) => {
              if (n._preloadedChildren) {
                fn(n);
                walk(n._preloadedChildren);
              }
            });
          walk(results);
        };
        setChildrenCache((prev) => {
          const next = new Map(prev);
          walkAll((n) => next.set(n.key, n._preloadedChildren));
          return next;
        });
        setExpandedKeys((prev) => {
          const next = new Set(prev);
          walkAll((n) => next.add(n.key));
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

  function collectLoadedSelectable(nodes) {
    const out = [];
    const walk = (list) =>
      list.forEach((n) => {
        if (n.selectable) out.push(n);
        const cc = childrenCache.get(n.key);
        if (cc) walk(cc);
      });
    walk(nodes);
    return out;
  }

  const visibleTree = searchResults !== null ? searchResults : roots;
  const loadedSelectable = visibleTree ? collectLoadedSelectable(visibleTree) : [];
  const allLoadedSelected =
    loadedSelectable.length > 0 && loadedSelectable.every((n) => selectedKeys.has(n.key));

  return (
    <div>
      {/* Search + bulk action */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-3 py-2.5 text-[13px] bg-white dark:bg-[#1A2433] border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition"
          />
        </div>
        <button
          type="button"
          onClick={() => onBulkToggle?.(loadedSelectable, !allLoadedSelected)}
          disabled={!loadedSelectable.length}
          className="ua-press flex items-center gap-2 text-[12.5px] font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 whitespace-nowrap"
        >
          <ListChecks className="w-4 h-4" />
          {allLoadedSelected ? "Clear shown" : "Select shown"}
        </button>
      </div>

      {/* Tree body */}
      <div
        className="overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-slate-700 p-1.5 bg-white dark:bg-[#1A2433]"
        style={{ maxHeight }}
      >
        {error && <div className="text-[12px] text-red-500 px-3 py-4">{error}</div>}

        {!error && (searchLoading || roots === null) && (
          <div className="space-y-2 p-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-[18px] h-[18px] rounded bg-slate-200 dark:bg-slate-700" />
                <div className="w-[18px] h-[18px] rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 rounded bg-slate-200 dark:bg-slate-700" style={{ width: `${55 - i * 10}%` }} />
              </div>
            ))}
          </div>
        )}

        {!error && !searchLoading && visibleTree && visibleTree.length === 0 && (
          <div className="text-[12.5px] text-slate-400 px-3 py-8 text-center">{emptyLabel}</div>
        )}

        {!error && !searchLoading && visibleTree && visibleTree.length > 0 && (
          <div>
            {visibleTree.map((node) => (
              <TreeNode
                key={node.key}
                node={node}
                depth={0}
                inherited={false}
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