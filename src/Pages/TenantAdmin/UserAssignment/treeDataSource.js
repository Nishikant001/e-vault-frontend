// src/Pages/TenantAdmin/UserAssignment/treeDataSource.js
//
// Builds the lazy-loading tree data source consumed by <TreeSelect>, for
// each of the three Assignment Levels:
//
//   DEPARTMENT     → flat list of departments, all selectable
//   CATEGORY       → Department (expand-only) → Category (selectable)
//   DOCUMENT_TYPE  → Department (expand-only) → Category (expand-only) → Document Type (selectable)
//
// Kept separate from <TreeSelect> so the tree component itself stays a
// generic, reusable "expandable + checkbox + lazy load" primitive with no
// DMS-specific knowledge — it only knows about the node shape below.
//
// Node shape:
//   {
//     key,            // globally unique string, e.g. "cat-42"
//     id,              // raw numeric id of the underlying record
//     label,           // display name
//     type,            // "DEPARTMENT" | "CATEGORY" | "DOCUMENT_TYPE"
//     selectable,      // whether a checkbox is shown for this node
//     hasChildren,     // whether an expand arrow is shown
//     meta,            // original API record (for building assignment payloads)
//     _preloadedChildren, // present only in search-mode results
//   }

import { fetchTenantDepartments, fetchCategories, fetchDocumentTypes } from "./userAssignmentApi";

function deptNode(d, selectable) {
  return {
    key: `dept-${d.id}`,
    id: d.id,
    label: d.name,
    type: "DEPARTMENT",
    selectable,
    hasChildren: true,
    meta: d,
  };
}
function catNode(c, selectable) {
  return {
    key: `cat-${c.id}`,
    id: c.id,
    label: c.name,
    type: "CATEGORY",
    selectable,
    hasChildren: true,
    meta: c,
  };
}
function dtNode(dt, selectable) {
  return {
    key: `dt-${dt.id}`,
    id: dt.id,
    label: dt.name,
    type: "DOCUMENT_TYPE",
    selectable,
    hasChildren: false,
    meta: dt,
  };
}

export function createTreeDataSource(level, tenantId) {
  return {
    level,

    // Root nodes — always Departments, regardless of level, so the tenant's
    // structure is always visible for context even when only leaves lower
    // down the tree are selectable.
    async getRoots() {
      const depts = await fetchTenantDepartments(tenantId);
      const selectable = level === "DEPARTMENT";
      return depts
        .map((d) => deptNode(d, selectable))
        .sort((a, b) => a.label.localeCompare(b.label));
    },

    // Lazy-load one level of children when a node is expanded.
    async getChildren(node) {
      if (node.type === "DEPARTMENT") {
        const cats = await fetchCategories({ departmentId: node.id });
        const selectable = level === "CATEGORY";
        return cats.map((c) => catNode(c, selectable)).sort((a, b) => a.label.localeCompare(b.label));
      }
      if (node.type === "CATEGORY") {
        if (level !== "DOCUMENT_TYPE") return [];
        const dts = await fetchDocumentTypes({ categoryId: node.id });
        return dts.map((dt) => dtNode(dt, true)).sort((a, b) => a.label.localeCompare(b.label));
      }
      return [];
    },

    // Search mode: for large hierarchies, a per-branch lazy tree can't be
    // text-searched without expanding everything, so search fetches the
    // tenant-scoped (and permission-scoped, server-side) flat lists once
    // and groups matches back under their Department/Category ancestors.
    async searchAll(query) {
      const q = query.trim().toLowerCase();
      const depts = await fetchTenantDepartments(tenantId);
      const deptById = new Map(depts.map((d) => [d.id, d]));

      if (level === "DEPARTMENT") {
        return depts
          .filter((d) => d.name.toLowerCase().includes(q))
          .map((d) => deptNode(d, true));
      }

      const cats = await fetchCategories({});
      if (level === "CATEGORY") {
        const matched = cats.filter((c) => c.name.toLowerCase().includes(q));
        return groupByDepartment(matched, deptById, (c) => c.departmentId, (c) => catNode(c, true));
      }

      // DOCUMENT_TYPE level
      const dts = await fetchDocumentTypes({});
      const catById = new Map(cats.map((c) => [c.id, c]));
      const matched = dts.filter((dt) => dt.name.toLowerCase().includes(q));

      const byDept = new Map();
      matched.forEach((dt) => {
        const cat = catById.get(dt.categoryId) || dt.Category;
        const deptId = cat?.departmentId;
        if (!byDept.has(deptId)) byDept.set(deptId, new Map());
        const catBucket = byDept.get(deptId);
        if (!catBucket.has(dt.categoryId)) catBucket.set(dt.categoryId, { cat, dts: [] });
        catBucket.get(dt.categoryId).dts.push(dt);
      });

      return Array.from(byDept.entries()).map(([deptId, catBucket]) => ({
        ...deptNode(deptById.get(deptId) || { id: deptId, name: "Unknown Department" }, false),
        _preloadedChildren: Array.from(catBucket.values()).map(({ cat, dts: dd }) => ({
          ...catNode(cat || { id: 0, name: "Unknown Category" }, false),
          _preloadedChildren: dd.map((dt) => dtNode(dt, true)),
        })),
      }));
    },
  };
}

function groupByDepartment(items, deptById, getDeptId, toNode) {
  const byDept = new Map();
  items.forEach((item) => {
    const deptId = getDeptId(item);
    if (!byDept.has(deptId)) byDept.set(deptId, []);
    byDept.get(deptId).push(item);
  });
  return Array.from(byDept.entries()).map(([deptId, list]) => ({
    ...deptNode(deptById.get(deptId) || { id: deptId, name: "Unknown Department" }, false),
    _preloadedChildren: list.map(toNode),
  }));
}
